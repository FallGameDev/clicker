-- =====================================================================
-- The Clicker Game!  SONGS BUCKET  (for song uploads, 1.63.0)
-- =====================================================================
-- Makes the Storage bucket that uploaded songs are saved in.
-- The "uploads" function tries to make this by itself the first time a
-- song is uploaded. Run this only if the bucket never shows up.
--
-- HOW TO RUN: Supabase dashboard > SQL Editor > New query > paste > Run.
-- Safe to run more than once. It never deletes any songs.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'songs',                 -- the bucket's id (the function looks for exactly this)
  'songs',                 -- the name shown in the dashboard
  true,                    -- public: the game can play the files from a plain link
  6291456,                 -- biggest file: 6 MB (6 * 1024 * 1024), same as MAX_SONG_BYTES
  array['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']  -- mp3, wav, ogg, m4a
)
-- If the bucket is already there, just make sure its settings match.
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No extra rules (policies) are needed:
--   reading  = the bucket is public, so anyone with the link can play a song
--   writing  = only the "uploads" function saves files, and it uses the service key
