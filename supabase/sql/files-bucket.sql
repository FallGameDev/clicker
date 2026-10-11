-- =====================================================================
-- The Clicker Game!  FILES BUCKET  (for all mod uploads, 1.67.0)
-- =====================================================================
-- Makes the Storage bucket that uploaded pictures, fonts and short
-- Payload sounds are saved in. (Songs have their own bucket, see
-- songs-bucket.sql.)
-- The "uploads" function tries to make this by itself the first time a
-- file is uploaded. Run this only if the bucket never shows up.
--
-- HOW TO RUN: Supabase dashboard > SQL Editor > New query > paste > Run.
-- Safe to run more than once. It never deletes any files.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'files',                 -- the bucket's id (the function looks for exactly this)
  'files',                 -- the name shown in the dashboard
  true,                    -- public: the game can load the files from a plain link
  2097152,                 -- biggest file: 2 MB (2 * 1024 * 1024), same as MAX_FILE_BYTES
  array[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',   -- pictures
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',      -- fonts
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'     -- short Payload sounds
  ]
)
-- If the bucket is already there, just make sure its settings match.
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
