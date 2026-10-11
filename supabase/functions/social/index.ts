// =====================================================================
// The Clicker Game! SOCIAL (online status + privacy switches)   1.58.0
// =====================================================================
// A SEPARATE Supabase Edge Function from "api", so the main backend is
// never touched. The game calls it at the api link with /api swapped
// for /social (see SOCIAL_API_URL in index.html).
//
// WHAT IT KEEPS (one row per player in the "social" table)
//   status        what the player picked in Edit Profile:
//                   "online"   automatic (shows Offline when they are not on the site)
//                   "busy"     shows Busy while they are on the site
//                   "offline"  Appear Offline: always shows Offline to everyone else
//                   "custom"   shows their own words while they are on the site
//   custom_text   the words for "custom"
//   last_seen     the last time their game checked in (milliseconds).
//                 A NEGATIVE number means "they closed the game at this time"
//                 (see "bye"), so the time is kept for "Last online" (1.58.0).
//   no_messages   true = "Disable messages" is on in Advanced Settings
//   no_requests   true = "Disable friend requests" is on in Advanced Settings
//
// HOW "ONLINE" WORKS
//   An open game sends "ping" every minute. A player counts as on the
//   site if their last ping was less than ONLINE_MS ago. Closing the tab
//   sends "bye" so they go offline right away.
//
// HOW "LAST ONLINE" WORKS (1.58.0)
//   "get" also answers lastSeen: the time the player was last on the site,
//   only while they show as offline. It is 0 when there is no time to share:
//   they have not played since this update, or they picked Appear Offline
//   (otherwise "Last online just now" would give them away).
//
// TURN IT ON (once), same as "rooms", "reset" and "mcp":
//   Supabase dashboard > Edge Functions > Deploy a new function > Via editor.
//   Name it exactly:  social
//   Paste this whole file, turn OFF "Verify JWT" (same as "api"), Deploy.
//
// THE TABLE
//   The function tries to make its "social" table by itself the first time
//   it runs (see ensureTable). If statuses never show up, run this once in
//   the SQL editor (safe to re-run, never deletes anything):
//
//   create table if not exists social (
//     player_id text primary key,
//     status text not null default 'online',
//     custom_text text not null default '',
//     last_seen bigint not null default 0,
//     no_messages boolean not null default false,
//     no_requests boolean not null default false,
//     updated_at timestamptz not null default now()
//   );
//   alter table social enable row level security;
//   notify pgrst, 'reload schema';
//
// Rows are keyed by the account's player_id (not the username), so a
// player who changes their name keeps their status and switches.
//
// TRUST: like "api" and "rooms", this function trusts the username the
// game sends.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ---- settings (keep the first two in sync with the SOCIAL_ constants in index.html) ----
const STATUSES = ["online", "busy", "offline", "custom"];
const MAX_CUSTOM_CHARS = 40;            // longest custom status
const ONLINE_MS = 150 * 1000;           // checked in this recently = on the site (the game pings every 60 seconds)
const MAX_LOOKUP = 100;                 // most players one "get" can ask about

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

// Text a player typed, with odd invisible characters removed, cut to a safe length.
function cleanText(value: unknown, max: number) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

// ---------------------------------------------------------------------
// THE TABLE: made once per cold start if it is missing.
// ---------------------------------------------------------------------
const TABLE_SQL = `
  create table if not exists social (
    player_id text primary key,
    status text not null default 'online',
    custom_text text not null default '',
    last_seen bigint not null default 0,
    no_messages boolean not null default false,
    no_requests boolean not null default false,
    updated_at timestamptz not null default now()
  );
  alter table social enable row level security;
  notify pgrst, 'reload schema';
`;

let tableReady: Promise<void> | null = null;
function ensureTable() {
  if (!tableReady) {
    tableReady = (async () => {
      const url = Deno.env.get("SUPABASE_DB_URL");
      if (!url) return;
      try {
        // Loaded here (not at the top) so a problem with it can never stop the function from starting.
        const pg = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
        const client = new pg.Client(url);
        await client.connect();
        try {
          await client.queryArray(TABLE_SQL);
        } finally {
          await client.end();
        }
      } catch (_e) {
        // The table could not be made here. The SQL at the top of this file does the same by hand.
      }
    })();
  }
  return tableReady;
}

// ---------------------------------------------------------------------
// STORE: every database call lives here.
// ---------------------------------------------------------------------
const store = {
  // The account row for a username, or null.
  async getAccount(username: string) {
    const key = lower(username);
    if (!key) return null;
    const { data } = await db.from("accounts").select("player_id,username,username_lower").eq("username_lower", key).maybeSingle();
    return data || null;
  },
  // The account rows for many usernames at once.
  async getAccounts(lowerNames: string[]) {
    if (!lowerNames.length) return [];
    const { data } = await db.from("accounts").select("player_id,username,username_lower").in("username_lower", lowerNames);
    return data || [];
  },
  // { row } when found, { row: null } when the player has no row yet, { error } when the database failed.
  async getRow(playerId: string) {
    const { data, error } = await db.from("social").select("*").eq("player_id", playerId).maybeSingle();
    if (error) return { error: error.code === "PGRST205" || error.code === "42P01" ? "notable" : "server" };
    return { row: data || null };
  },
  async getRows(playerIds: string[]) {
    if (!playerIds.length) return { rows: [] };
    const { data, error } = await db.from("social").select("*").in("player_id", playerIds);
    if (error) return { error: error.code === "PGRST205" || error.code === "42P01" ? "notable" : "server" };
    return { rows: data || [] };
  },
  // Changes some columns of a player's row. Makes the row first if the player has none.
  async save(playerId: string, existing: any, changes: Record<string, unknown>) {
    const values = { ...changes, updated_at: new Date().toISOString() };
    if (existing) {
      const { error } = await db.from("social").update(values).eq("player_id", playerId);
      return error ? "server" : "ok";
    }
    const { error } = await db.from("social").insert({ player_id: playerId, ...values });
    if (!error) return "ok";
    // Two check-ins at the same moment both tried to make the row: the second one just updates it.
    if (error.code === "23505") {
      const again = await db.from("social").update(values).eq("player_id", playerId);
      return again.error ? "server" : "ok";
    }
    return error.code === "PGRST205" || error.code === "42P01" ? "notable" : "server";
  },
};

// ---------------------------------------------------------------------
// RULES
// ---------------------------------------------------------------------

// A player's own settings, the way their Edit Profile menu shows them.
function mine(row: any) {
  const status = row && STATUSES.includes(row.status) ? row.status : "online";
  return {
    status,
    customText: row ? String(row.custom_text || "") : "",
    noMessages: !!(row && row.no_messages),
    noRequests: !!(row && row.no_requests),
  };
}

// What OTHER players see of someone.
//   state  "online", "busy", "custom" or "offline"
//   text   the custom words (only for "custom")
//   lastSeen  when they were last on the site (milliseconds), or 0 = nothing to show
// Anyone who is not on the site is "offline", whatever they picked. "Appear Offline" is always "offline".
function seenByOthers(row: any, now: number) {
  const me = mine(row);
  const seen = row ? Number(row.last_seen || 0) : 0;
  // A negative last_seen is a "bye" (they left at that time), so it never counts as on the site.
  const onSite = seen > 0 && now - seen < ONLINE_MS;
  let state = "offline";
  if (onSite && me.status !== "offline") state = me.status === "custom" && !me.customText ? "online" : me.status;
  // LAST ONLINE: shared only for a player who really is offline and did not pick Appear Offline.
  const lastSeen = state === "offline" && me.status !== "offline" ? Math.min(Math.abs(seen), now) : 0;
  return {
    state,
    text: state === "custom" ? me.customText : "",
    lastSeen,
    noMessages: me.noMessages,
    noRequests: me.noRequests,
  };
}

// Finds the account and its social row for the player who is calling.
async function whoAmI(p: any) {
  const account = await store.getAccount(p.username);
  if (!account) return { error: "invalid" };
  const playerId = String(account.player_id);
  const got = await store.getRow(playerId);
  if (got.error) return { error: got.error };
  return { playerId, row: got.row };
}

// ---- ping: "I am on the site". Sent every minute by an open game. ----
// The answer carries the player's own settings, so the game learns them when it starts.
async function ping(p: any) {
  const who = await whoAmI(p);
  if (who.error) return { error: who.error };
  const saved = await store.save(who.playerId!, who.row, { last_seen: Date.now() });
  if (saved !== "ok") return { error: saved };
  return { success: true, me: mine(who.row) };
}

// ---- bye: the tab was closed, so go offline right away ----
async function bye(p: any) {
  const who = await whoAmI(p);
  if (who.error) return { error: who.error };
  // Saved as a NEGATIVE time: still "not on the site", but the moment they left is kept
  // so profiles can say "Last online 5 minutes ago". (It used to be wiped to 0.)
  if (who.row) await store.save(who.playerId!, who.row, { last_seen: -Date.now() });
  return { success: true };
}

// ---- set: save the status and the privacy switches ----
// Only the parts the game sends are changed, so saving a status never flips a switch.
async function set(p: any) {
  const who = await whoAmI(p);
  if (who.error) return { error: who.error };
  const changes: Record<string, unknown> = { last_seen: Date.now() };
  if (p.status !== undefined) changes.status = STATUSES.includes(p.status) ? p.status : "online";
  if (p.customText !== undefined) changes.custom_text = cleanText(p.customText, MAX_CUSTOM_CHARS);
  if (p.noMessages !== undefined) changes.no_messages = p.noMessages === true;
  if (p.noRequests !== undefined) changes.no_requests = p.noRequests === true;
  const saved = await store.save(who.playerId!, who.row, changes);
  if (saved !== "ok") return { error: saved };
  return { success: true, me: mine({ ...(who.row || {}), ...changes }) };
}

// ---- get: look up how a list of players shows to others ----
// Answers { people: { "lowercase username": { state, text, lastSeen, noMessages, noRequests } } }.
// A player who has never checked in is simply "offline" with both switches off.
async function get(p: any) {
  const names = Array.from(new Set((Array.isArray(p.usernames) ? p.usernames : []).map(lower).filter(Boolean))).slice(0, MAX_LOOKUP) as string[];
  const people: Record<string, unknown> = {};
  if (!names.length) return { success: true, people };
  const accounts = await store.getAccounts(names);
  const got = await store.getRows(accounts.map((a: any) => String(a.player_id)));
  if (got.error) return { error: got.error };
  const rowById: Record<string, any> = {};
  (got.rows || []).forEach((r: any) => { rowById[String(r.player_id)] = r; });
  const now = Date.now();
  accounts.forEach((a: any) => {
    people[String(a.username_lower)] = seenByOthers(rowById[String(a.player_id)] || null, now);
  });
  return { success: true, people };
}

const ACTIONS: Record<string, (p: any) => Promise<any>> = { ping, bye, set, get };

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
    await ensureTable();
    return json(await action(p));
  } catch (_e) {
    return json({ error: "server" }, 500);
  }
});
