// =====================================================================
// The Clicker Game! UPLOADS (song files for mods)                1.63.0
// =====================================================================
// A SEPARATE Supabase Edge Function from "api", so the main backend is
// never touched. The game calls it at the api link with /api swapped
// for /uploads (see uploadsApiUrl() in index.html).
//
// WHAT IT DOES
//   The mod editor's Music section can upload a song file. Songs are far
//   too big to keep inside a mod (a mod is sent to every player who opens
//   the Workshop), so the file goes into Supabase STORAGE and the mod only
//   keeps the LINK to it.
//
//   The game reads the file, turns it into base64 text and sends it here.
//   This function turns the text back into the file, checks that it really
//   is a sound, saves it in the "songs" bucket and answers with its link.
//
// WHAT IT KEEPS
//   Storage bucket "songs" (public, so the game can play the files):
//     <player_id>/<time>-<name>.<mp3|wav|ogg|m4a>
//   Each player's songs sit in their own folder, named by player_id, so a
//   name change keeps them.
//
// LIMITS (change them in the settings below, keep the first one in sync
// with SONG_UPLOAD_MAX_BYTES in index.html)
//   MAX_SONG_BYTES     biggest file
//   MAX_SONGS_EACH     most songs one player can have stored
//
// TURN IT ON (once), same as "social", "rooms", "reset" and "mcp":
//   Supabase dashboard > Edge Functions > Deploy a new function > Via editor.
//   Name it exactly:  uploads
//   Paste this whole file, turn OFF "Verify JWT" (same as "api"), Deploy.
//   The function makes its own "songs" bucket the first time it runs.
//   If the bucket never shows up in Storage, run supabase/sql/songs-bucket.sql
//   once in the SQL Editor (safe to re-run).
//
// RULE FOR PLAYERS: only upload music you made or are allowed to share.
//
// TRUST: like "api", "rooms" and "social", this function trusts the
// username the game sends.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ---- settings ----
const BUCKET = "songs";
const MAX_SONG_BYTES = 6 * 1024 * 1024;   // biggest song file (6 MB is about 6 minutes of mp3)
const MAX_SONGS_EACH = 10;                // most songs one player can have stored
// The kinds of sound file that are allowed, and what the browser should call them.
const SOUND_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, accept",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function lower(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

// A file name that is safe inside a link: letters, numbers and dashes only.
function safeName(name: unknown) {
  const plain = String(name ?? "").replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return plain.slice(0, 40) || "song";
}

// Turns base64 text back into the bytes of the file. null = the text was not base64.
function bytesFromBase64(text: string) {
  try {
    const raw = atob(text);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch (_e) {
    return null;
  }
}

// Looks at the first bytes of the file to see what it really is, whatever its name says.
// Every sound format starts with its own "signature". Answers "mp3", "wav", "ogg", "m4a" or "".
function sniffSound(b: Uint8Array) {
  const text = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length < 12) return "";
  if (text(0, 3) === "ID3") return "mp3";                           // mp3 with a tag at the front
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return "mp3";        // mp3 that starts with sound right away
  if (text(0, 4) === "RIFF" && text(8, 12) === "WAVE") return "wav";
  if (text(0, 4) === "OggS") return "ogg";
  if (text(4, 8) === "ftyp") return "m4a";
  return "";
}

// ---------------------------------------------------------------------
// THE BUCKET: made once per cold start if it is missing.
// ---------------------------------------------------------------------
let bucketReady: Promise<void> | null = null;
function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data } = await db.storage.getBucket(BUCKET);
      if (data) return;
      await db.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SONG_BYTES,
        allowedMimeTypes: Object.values(SOUND_TYPES),
      });
    })().catch(() => { bucketReady = null; });
  }
  return bucketReady;
}

// The account row for a username, or null.
async function getAccount(username: unknown) {
  const key = lower(username);
  if (!key) return null;
  const { data } = await db.from("accounts").select("player_id,username").eq("username_lower", key).maybeSingle();
  return data || null;
}

// ---- song: save one song file and answer with its link ----
// The game sends { username, name: "my song.mp3", data: "<the file as base64>" }.
async function song(p: any) {
  const account = await getAccount(p.username);
  if (!account) return { error: "invalid" };
  const playerId = String(account.player_id);

  const text = String(p.data || "");
  // base64 is 4 letters for every 3 bytes, so this stops a too-big file before it is unpacked.
  if (!text || text.length > Math.ceil(MAX_SONG_BYTES / 3) * 4 + 8) return { error: "toobig" };
  const bytes = bytesFromBase64(text);
  if (!bytes) return { error: "baddata" };
  if (bytes.length > MAX_SONG_BYTES) return { error: "toobig" };
  const kind = sniffSound(bytes);
  if (!kind) return { error: "notsound" };

  await ensureBucket();
  // How many songs this player already has.
  const have = await db.storage.from(BUCKET).list(playerId, { limit: MAX_SONGS_EACH + 1 });
  if (have.error) return { error: "server" };
  if ((have.data || []).length >= MAX_SONGS_EACH) return { error: "full", max: MAX_SONGS_EACH };

  const path = `${playerId}/${Date.now()}-${safeName(p.name)}.${kind}`;
  const saved = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: SOUND_TYPES[kind],
    cacheControl: "31536000", // the file never changes, so browsers may keep it for a year
    upsert: false,
  });
  if (saved.error) return { error: "server" };
  const link = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { success: true, url: link, bytes: bytes.length, left: MAX_SONGS_EACH - (have.data || []).length - 1 };
}

// ---- list: the songs a player has stored (name, link, size) ----
async function list(p: any) {
  const account = await getAccount(p.username);
  if (!account) return { error: "invalid" };
  const playerId = String(account.player_id);
  await ensureBucket();
  const have = await db.storage.from(BUCKET).list(playerId, { limit: 100 });
  if (have.error) return { error: "server" };
  const songs = (have.data || []).map((f: any) => ({
    name: f.name,
    url: db.storage.from(BUCKET).getPublicUrl(`${playerId}/${f.name}`).data.publicUrl,
    bytes: Number(f.metadata && f.metadata.size || 0),
  }));
  return { success: true, songs, max: MAX_SONGS_EACH };
}

// ---- remove: delete one of your own songs to make room ----
// The game sends the song's link. Only files inside the caller's own folder can be removed.
async function remove(p: any) {
  const account = await getAccount(p.username);
  if (!account) return { error: "invalid" };
  const playerId = String(account.player_id);
  const marker = `/object/public/${BUCKET}/${playerId}/`;
  const url = String(p.url || "");
  const at = url.indexOf(marker);
  if (at === -1) return { error: "notyours" };
  const file = decodeURIComponent(url.slice(at + marker.length).split("?")[0]);
  if (!file || file.includes("/") || file.includes("..")) return { error: "notyours" };
  const gone = await db.storage.from(BUCKET).remove([`${playerId}/${file}`]);
  if (gone.error) return { error: "server" };
  return { success: true };
}

const ACTIONS: Record<string, (p: any) => Promise<any>> = { song, list, remove };

// ---- the one entry point ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let p: any;
  try {
    p = JSON.parse(await req.text());
  } catch (_e) {
    return json({ error: "badjson" }, 400);
  }

  try {
    const name = String(p.action);
    const action = Object.prototype.hasOwnProperty.call(ACTIONS, name) ? ACTIONS[name] : null;
    if (!action) return json({ error: "unknownaction" }, 400);
    return json(await action(p));
  } catch (_e) {
    return json({ error: "server" }, 500);
  }
});
