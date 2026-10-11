// =====================================================================
// The Clicker Game! UPLOADS (files for mods)                     1.67.0
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
// ALL MOD UPLOADS (1.67.0)
//   The other things the mod editor uploads go to Storage the same way,
//   with the "file" action: pictures (icons, cursors, backgrounds, Payload
//   pictures), fonts and short Payload sounds. They go in the "files" bucket.
//
// WHAT IT KEEPS
//   Storage bucket "songs" (public, so the game can play the files):
//     <player_id>/<time>-<name>.<mp3|wav|ogg|m4a>
//   Storage bucket "files" (public):
//     <player_id>/<time>-<name>.<png|jpg|gif|webp|ttf|otf|woff|woff2|mp3|wav|ogg|m4a>
//   Each player's songs sit in their own folder, named by player_id, so a
//   name change keeps them.
//
// LIMITS (change them in the settings below, keep the first one in sync
// with SONG_UPLOAD_MAX_BYTES in index.html)
//   MAX_SONG_BYTES     biggest file
//   MAX_SONGS_EACH     most songs one player can have stored
//   MAX_FILE_BYTES     biggest picture, font or Payload sound (FILE_UPLOAD_MAX_BYTES in index.html)
//   MAX_FILES_EACH     most of those one player can have stored
//
// TURN IT ON (once), same as "social", "rooms", "reset" and "mcp":
//   Supabase dashboard > Edge Functions > Deploy a new function > Via editor.
//   Name it exactly:  uploads
//   Paste this whole file, turn OFF "Verify JWT" (same as "api"), Deploy.
//   The function makes its own "songs" bucket the first time it runs.
//   If the bucket never shows up in Storage, run supabase/sql/songs-bucket.sql
//   once in the SQL Editor (safe to re-run).
//
// WHEN SOMETHING GOES WRONG (1.65.0)
//   An answer of { error: "server" } also carries "detail": the real words
//   Supabase gave, and the game shows them. To test without the game, send
//   { "action": "check" }: it answers whether the "songs" bucket is there.
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
const FILES_BUCKET = "files";             // pictures, fonts and short sounds (1.67.0)
const MAX_FILE_BYTES = 2 * 1024 * 1024;   // biggest picture, font or Payload sound (2 MB)
const MAX_FILES_EACH = 300;               // most of those one player can have stored
// The kinds of picture and font that are allowed. No SVG: an SVG can carry code.
const FILE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};
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

// The same idea for pictures and fonts. Answers a key of FILE_TYPES, or "".
function sniffFile(b: Uint8Array) {
  const text = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length < 12) return "";
  if (b[0] === 0x89 && text(1, 4) === "PNG") return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (text(0, 4) === "GIF8") return "gif";
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "webp";
  if (text(0, 4) === "wOFF") return "woff";
  if (text(0, 4) === "wOF2") return "woff2";
  if (text(0, 4) === "OTTO") return "otf";
  if (b[0] === 0x00 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x00) return "ttf";
  if (text(0, 4) === "true") return "ttf"; // an older kind of ttf
  return "";
}

// ---------------------------------------------------------------------
// THE BUCKET: made once per cold start if it is missing.
// ---------------------------------------------------------------------
// Answers "" when a bucket is there (or was just made), or the reason it could not be made.
const bucketsOk: Record<string, boolean> = {}; // buckets we have already seen, so later uploads skip the check
async function ensureBucket(name = BUCKET): Promise<string> {
  if (bucketsOk[name]) return "";
  const found = await db.storage.getBucket(name);
  if (found.data) { bucketsOk[name] = true; return ""; }
  const songs = name === BUCKET;
  const made = await db.storage.createBucket(name, {
    public: true,
    fileSizeLimit: songs ? MAX_SONG_BYTES : MAX_FILE_BYTES,
    allowedMimeTypes: songs ? Object.values(SOUND_TYPES) : Object.values(FILE_TYPES).concat(Object.values(SOUND_TYPES)),
  });
  // "already exists" means another upload made it a moment ago, which is fine.
  if (made.error && !/exist/i.test(String(made.error.message))) return "bucket: " + String(made.error.message);
  bucketsOk[name] = true;
  return "";
}

// ---- check: is the "songs" bucket there? Changes nothing except making the bucket if it is missing. ----
async function check(_p: any) {
  const problem = (await ensureBucket(BUCKET)) || (await ensureBucket(FILES_BUCKET));
  if (problem) return { error: "server", detail: problem };
  return { success: true, bucket: BUCKET, maxBytes: MAX_SONG_BYTES, maxSongs: MAX_SONGS_EACH, filesBucket: FILES_BUCKET, maxFileBytes: MAX_FILE_BYTES, maxFiles: MAX_FILES_EACH };
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

  const problem = await ensureBucket();
  if (problem) return { error: "server", detail: problem };
  // How many songs this player already has.
  const have = await db.storage.from(BUCKET).list(playerId, { limit: MAX_SONGS_EACH + 1 });
  if (have.error) return { error: "server", detail: "list: " + String(have.error.message) };
  if ((have.data || []).length >= MAX_SONGS_EACH) return { error: "full", max: MAX_SONGS_EACH };

  const path = `${playerId}/${Date.now()}-${safeName(p.name)}.${kind}`;
  const saved = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: SOUND_TYPES[kind],
    cacheControl: "31536000", // the file never changes, so browsers may keep it for a year
    upsert: false,
  });
  if (saved.error) return { error: "server", detail: "save: " + String(saved.error.message) };
  const link = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { success: true, url: link, bytes: bytes.length, left: MAX_SONGS_EACH - (have.data || []).length - 1 };
}

// ---- file: save one picture, font or short sound and answer with its link (1.67.0) ----
// The game sends { username, name: "cookie.png", data: "<the file as base64>" }.
// What the file IS comes from its first bytes, never from its name.
async function file(p: any) {
  const account = await getAccount(p.username);
  if (!account) return { error: "invalid" };
  const playerId = String(account.player_id);

  const text = String(p.data || "");
  if (!text || text.length > Math.ceil(MAX_FILE_BYTES / 3) * 4 + 8) return { error: "toobig" };
  const bytes = bytesFromBase64(text);
  if (!bytes) return { error: "baddata" };
  if (bytes.length > MAX_FILE_BYTES) return { error: "toobig" };
  const kind = sniffFile(bytes) || sniffSound(bytes);
  if (!kind) return { error: "notfile" };
  const type = FILE_TYPES[kind] || SOUND_TYPES[kind];

  const problem = await ensureBucket(FILES_BUCKET);
  if (problem) return { error: "server", detail: problem };
  const have = await db.storage.from(FILES_BUCKET).list(playerId, { limit: MAX_FILES_EACH + 1 });
  if (have.error) return { error: "server", detail: "list: " + String(have.error.message) };
  if ((have.data || []).length >= MAX_FILES_EACH) return { error: "full", max: MAX_FILES_EACH };

  const path = `${playerId}/${Date.now()}-${safeName(p.name)}.${kind}`;
  const saved = await db.storage.from(FILES_BUCKET).upload(path, bytes, {
    contentType: type,
    cacheControl: "31536000", // the file never changes, so browsers may keep it for a year
    upsert: false,
  });
  if (saved.error) return { error: "server", detail: "save: " + String(saved.error.message) };
  const link = db.storage.from(FILES_BUCKET).getPublicUrl(path).data.publicUrl;
  return { success: true, url: link, bytes: bytes.length, kind };
}

// ---- list: the songs a player has stored (name, link, size) ----
async function list(p: any) {
  const account = await getAccount(p.username);
  if (!account) return { error: "invalid" };
  const playerId = String(account.player_id);
  const problem = await ensureBucket();
  if (problem) return { error: "server", detail: problem };
  const have = await db.storage.from(BUCKET).list(playerId, { limit: 100 });
  if (have.error) return { error: "server", detail: "list: " + String(have.error.message) };
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
  if (gone.error) return { error: "server", detail: "remove: " + String(gone.error.message) };
  return { success: true };
}

const ACTIONS: Record<string, (p: any) => Promise<any>> = { song, file, list, remove, check };

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
  } catch (e) {
    // Something broke that we did not plan for: say what, so it can be fixed.
    return json({ error: "server", detail: "crash: " + String((e as Error)?.message || e) }, 500);
  }
});
