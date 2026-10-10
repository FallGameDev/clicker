# The Clicker Game!

A browser-based clicker/idle game by **Here Studios**. Tap the avatar, earn moneys, buy upgrades, prestige, and compete on a shared leaderboard. Built as a single self-contained `index.html` file (vanilla HTML/CSS/JS, no build step) backed by a Supabase database.

## Running it

There's no build process. Either:

- Double-click `index.html` to open it directly in a browser, or
- Serve the folder with any static file server (recommended, since some browsers restrict local file access for scripts/audio):
  ```
  npx serve .
  ```
  or
  ```
  python3 -m http.server
  ```

All image and audio assets must stay in their folders next to `index.html` (see **Assets** below) or the game will load with missing art/sound.

## Backend

Accounts, sessions, game-state sync, and the leaderboard are handled by a Google Apps Script Web App backed by a Google Sheet. The frontend talks to it entirely through one endpoint:

```
const SHEET_API_URL = '...' // near the top of the <script> block
```

If you fork this project or move it to a new Sheet/Apps Script deployment, update `SHEET_API_URL` to point at your own Web App URL. All account creation, login, save/load, and leaderboard reads/writes go through this single constant.

## Features

- **Core loop** - tap the avatar to earn moneys; buy upgrades to boost income and automate clicking.
- **Shop** - Click Boost, Auto Clicker, DVD Logo (bouncing screensaver easter egg), Amogus, Roblox Noob, Screaming Goat, Custom Cursors, Background Switcher, Icon Modifier, Offline Earnings, and more, plus a separate **Prestige Shop**. Shop items are filterable by category (All / Visuals / Customization / Plain).
- **Stats** - profile (avatar/username), moneys, prestige, gems, plus subtabs for Friends, Mods, Messages, and Rooms.
- **Rooms and servers** (1.34.0) - multiplayer. Stats > Rooms lets you create a room, join one with a code, or browse public servers. Everyone inside plays one shared save. See **Rooms and servers** below.
- **Leaderboard** - global and friends-only rankings.
- **Achievements** - unlockable achievement list with hint system.
- **Workshop / Mods** - browse, install, and upload user mods; installed mods list. Mods made in the editor can run **CGC** code (see below).
- **Mod pricing and Remix** (1.25.0) - in the mod editor, the **Auto** button next to Price sets the price to the storage percent divided by 10. Storage can go past 100%, and every percent over costs 1 extra Gem to upload (`modEditorExtraGems()`). Every mod page has a **Remix** button: if you downloaded the mod, paying `MOD_REMIX_COST` (100) Gems copies it into your editor. A published remix links to the original through `repoUrl` (the `repo_url` column), saved as `<game link>?mod=<original id>` and read by `modRemixSourceId()`.
- **Friends & Messages** - friend requests, friend picker, and a simple chat system.
- **Notification badges** (1.22.0) - a red badge above the Stats tab shows friend requests + unread messages. Inside Stats, Overview shows the friend request count and Messages shows the unread count. Polled every `NOTIF_POLL_MS` (15s).
- **New shop item alert** (1.22.0) - when a shop item becomes affordable for the first time, the Shop tab flickers yellow (purple if the player's favorite color is yellow). Clicking Shop opens the right category, scrolls to the item and flashes it. New items must be added to `SHOP_WATCH_ITEMS` to get the alert.
- **Gameplay extras** (1.24.0) - all in the `GAMEPLAY EXTRAS` section of `index.html`, none of them use the API:
  - **Floating numbers**: a `+N` pops out of the clicker on every click (gold when Lucky Charm doubles it). Off in Low Performance Mode.
  - **Moneys per second**: a chip under the clicker shows the average income of the last 5 seconds.
  - **Combo**: fast clicking multiplies your own clicks: x1.25 at 20, x1.5 at 50, x2 at 100 (`COMBO_TIERS`). It drops after 1.5 seconds without a click.
  - **Lucky Star**: shows up every 2 to 5 minutes for 12 seconds. Catching it gives a Frenzy (x3 on everything for 20 seconds) or a jackpot worth 60 seconds of income.
  - **Daily Reward**: free moneys once a day, growing over a 7 day streak. Saved per account in the `fgd_daily_<username>` localStorage key.
- **Tutorial** - first-time walkthrough that highlights each tab; replayable from Settings.
- **Click Effects:** Confetti, Screen Shake, Bubbles and Squish, picked from the Click Effects picker after buying it in the shop.
- **Settings** - mute SFX, light/dark theme, low performance mode (simplifies effects + shows an FPS counter), layout switcher (center/left/right, PC & tablet only), reset data, reset tutorial, view team applications, credits, download the game (opens the GitHub repo, set in `GAME_REPO_URL`), log out, delete account, and **Debug Mode**.
- **Debug Mode** - a draggable panel (Settings → Debug Mode → Open) showing live FPS, a few key stats (username, moneys, prestige, gems, click power), a Test Notification button, and a Page Ratio selector (Default / Phone / Tablet / PC) that previews the page at a real device viewport width in an embedded iframe, so responsive breakpoints trigger for real.
- **Responsive UI** - the game runs on desktop, tablet, and phones (Samsung and iPhone browsers included). On narrow phone widths the main tab bar (Stats / Leaderboard / Shop / Achievements / Settings) switches from labeled pill tabs to a row of circular icon buttons.

## Assets

Since 1.23.1 every file lives in a folder. Only `index.html` and `README.md` sit in the main folder.

| Folder | What goes in it |
|---|---|
| `audio/music/` | Songs: the Music Player tracks, the tutorial track and the login screen track. |
| `audio/music/colors/` | The background songs, one for each favorite color (1.39.0). The og song (green) lives here too. |
| `audio/sfx/` | Short sound effects: `click.mp3`, `money.mp3`, `touch.mp3`, `mogus.mp3`, `goat.mp3`. |
| `fonts/` | Font files (`.ttf`). `Pusab.ttf`, `pixelated.ttf` and `MeFont.ttf` are loaded with `@font-face`. `OptimusPrinceps.ttf` is the Keeper's font. The rest are account fonts. Google Fonts (Fredoka One, Poppins, Inter) load from the CDN. |
| `images/ui/` | Game art: `profile.png`, `appearchar.png`, `tutorial-guide.png`, `biggie.png`, `arrow.png`, `money.png`, `heart.png`, `gems.png` and `maksy.ico` (favicon). |
| `images/badges/` | Account badges: `admin.png`, `dev.png`, `mod.png`, `owner.png`, `director.png`, `fam.png`, `cc.png`, `ver.png`. |
| `images/cursors/` | Built-in cursors for the Cursor Picker. |
| `images/misc/` | Spare pictures the game does not use yet, plus the Keeper's pictures (the `vault-...` files) and `spoopy.png`, the Keeper's face with no lock. |
| `images/songs/` | Small song pictures (96 by 96) for the Now Playing banner. |
| `backgrounds/` | Favorite color pictures (`bg_<color>.png`) and the Background Switcher pictures. |
| `profiles/` | Starter profile pictures. Accounts save these paths, so do not rename this folder. |
| `extras/` | Songs players can add to mods. Mods save `extras/<file>`, so do not rename this folder. |
| `settings/` | The JSON lists described below. |
| `pages/` | Extra pages: `cc-rules.html` and the old `test.html` copy of the game. |

**Adding a new file:** drop it in the right folder and write the full path, like `audio/music/newsong.mp3`.

**Old names still work.** Saves, settings files and accounts made before the move can hold a bare name like `duck.png` or `gang.ttf`. `OLD_ASSET_PATHS` and `fixAssetPath()` in `index.html` turn those into the new path. Do not delete entries from `OLD_ASSET_PATHS`, old saves need them.

Missing assets won't crash the game, but will show as broken images or silent audio.

## Settings files

Built-in lists live in the `settings/` folder, so they can be changed without editing `index.html`. A comma left after the last item of a list is forgiven (1.43.4), but any other JSON mistake still makes the game use its backup copy. The game loads them when the page opens. If a file is missing or has a JSON mistake, the game falls back to the copy written inside `index.html`. Songs, cursors and backgrounds added by mods or uploads always appear after the built-in ones.

| File | What it controls |
|---|---|
| `settings/messages.json` | Loading screen messages. A plain list of text. |
| `settings/music.json` | Songs in the Music Player. |
| `settings/cursors.json` | Cursors in the Cursor Picker. |
| `settings/backgrounds.json` | Backgrounds in the Background Switcher. |
| `settings/fonts.json` | Fonts in the Font Manager. |
| `settings/themes.json` | Color themes. Each theme has a dark and a light set of colors. |
| `settings/credits.json` | The names and positions shown in Settings > Credits. |

**music.json, cursors.json, backgrounds.json:** a list of `{ "label": "Name shown in the picker", "file": "file name" }`. Songs can also have `"artist"` and `"thumb"` (a small picture, like `images/songs/sy.jpg`) for the Now Playing banner. Write the full path from the main folder, like `audio/music/lofi.mp3`, `images/cursors/duck.png`, `backgrounds/zen.jpeg` or `extras/name.mp3`. For cursors and backgrounds, `"default"` means the normal cursor or plain color background.

**fonts.json:** a list of `{ "label", "value", "family", "fallback", "file", "google" }`.
- `value`: short id, letters, numbers, `-` and `_` only. Never change it for an existing font, players' saved choice uses it.
- `family`: the font's name.
- `fallback`: used while it loads, like `cursive` or `sans-serif`.
- `file` (optional): a font file in the `fonts/` folder, like `fonts/caveat.ttf`.
- `google` (optional): `true` to load the family from Google Fonts.

**themes.json:** a list of `{ "id", "label", "dark": { ... }, "light": { ... } }`.
- `id`: short id, letters, numbers, `-` and `_` only. Never change it for an existing theme, players' saved choice uses it.
- `dark` and `light`: color names and values. A name is a CSS variable without the `--`, so `"card": "#ffffff"` sets `--card`. The main ones are `night` (page), `card`, `card-hover`, `ink` (outlines), `rind` (text), `muted` (quiet text), `line`, `zap-text` (yellow text) and `on-bright` (text on bright buttons).
- The first theme in the list is the default. With 2 or more themes, a theme list shows up next to the buttons in Settings.
- The Settings tab has three buttons: light, dark and system (the default, it follows the device). That pick is saved on the device in `localStorage` (`fgd_color_mode`), not on the account.
- **Theme Switcher (1.37.0):** the list of themes is a Shop item (`THEME_SWITCHER_COST` moneys, `game.themeSwitcherOwned`). Buying it adds a theme picker to Preferences, next to the font and cursor pickers. Owning it is saved on the account (the `theme_switcher_owned` column, added by `MIGRATIONS` in the `api` edge function). The picked theme is saved on the device (`fgd_ui_theme`). Without the item the game always shows the first theme in the file (Original).
- The account color (`--melon`) is not part of the Original theme, so players keep their favorite color there. A theme can take over the button color with `"accent"`.
- Special names inside `dark` and `light` (these are not CSS variables):
  - `"accent"`: the button color. It wins over the account's favorite color.
  - `"page"`: the page background, a color or a gradient. It replaces the favorite color picture, but never a picture the player picked in the Background Switcher.
  - `"color-scheme"`: `"light"` or `"dark"`, for scrollbars and dropdowns. Use `"dark"` when a theme's light side is really dark (like Terminal).
- Extra names: `on-bright` is the text on accent buttons, `zap` is the second color of the button gradient, `counter-bg` and `counter-text` color the score pill, `melon-text` is the accent color used as text, `btn-edge` and `soft-edge` are the sides under buttons.
- Optional, next to `id` and `label`: `"font"` (a font list for the whole UI, skipped if the player picked a font in the Font Manager), `"corners"` (`"square"`, `"slight"`, `"normal"` or `"extra"`: how round every corner is. The old `"square": true` still works and means `"square"`), `"compactTabs": true` (smaller tab text, for wide fonts).
- Themes in the file: Original, Terminal (light is green, dark is purple), Windows 98, Macintosh 1984, Nature, Reddit, Rec Room (the colors of the rec.net site), Synthwave, Ocean, Game Boy.
- None of the themes in the file sets a `"font"`, so the game font stays the same in every theme.
- After adding a theme, check that text can be read on cards and that button text can be read on the accent color (aim for a contrast of 4.5 or more).
- Light mode fixes for single spots live in the `LIGHT MODE FIXES` block at the end of the `<style>` in `index.html`.

**credits.json:** a list of `{ "name", "position", "username" }`. `username` is optional: with it, tapping the row opens that player's profile. Names show in the order they are written.

Rules:
- Valid JSON only: double quotes, commas between entries, no comma after the last one, no comments.
- Players keep their picked song when songs are added or reordered (it is matched by file name).
- **Color songs (1.39.0):** the background song follows the account's favorite color, like the `bg_<color>.png` pictures do. `COLOR_BG_SONGS` in `index.html` maps each color to a file in `audio/music/colors/`: red = Hammer of Justice, orange = Flower Castle, yellow = Running Sky, green = the og song, blue = Pirate Dojo (since 1.50.0), cyan = Welcome to the Green Room, purple = Another Medium, pink = Cutie Mew Mew Magic, black = KING OF ROLYPOLY, teal = A CYBER'S WORLD? (all by Toby Fox except the og song). `playColorBgSong()` starts the right one and `applyAccountTheme()` swaps it when the color changes. A color with no entry plays the og song. The tutorial and login songs are not changed.
- **Here Studios stamp (1.43.0):** the loading screen has a small studio intro at the bottom. An arrow tumbles in, squashes into a streak, the letters HERE pop out of it, and a typing cursor types STUDIOS and keeps blinking. It is all CSS plus one small inline SVG for the arrow (no picture files, no JavaScript): search `HERE STUDIOS STAMP` in `index.html`. Each step is one `@keyframes`, and the seconds after `animation:` set the speed and the order. Here Studios colors are black and white and its font is Roboto italic at weight 600 (loaded with the other Google Fonts), so the stamp is a white card with black letters in every theme. The show takes about 1.5 seconds, then a plain timer (`HS_STAMP_SHOW_MS`) adds the `hs-done` class, which forces every letter to show. The loading screen waits for that (`waitForStudioStamp()`). This is a guarantee: in 1.43.1 the typing stopped at "HERE STUDI" in Opera GX and stayed there, and the cause was not found, so the ending no longer depends on the CSS animations (1.43.3). It skips the motion when the device asks for reduced motion, and hides on very short screens.
- **Now Playing banner (1.40.0):** when a song starts, a banner shows `[picture] Song name • Artist` (`announceSong()`). Music Player songs take `"artist"` and `"thumb"` from `settings/music.json` (both optional). Background songs (color songs, tutorial, login) use `BG_SONG_INFO` in `index.html`. A song from a mod shows the mod's icon and the mod's maker (saved when the mod is downloaded, `installedModEntry()`). An uploaded song shows just its name. No picture means a colored music note tile. The small pictures are in `images/songs/` (96 by 96). Nothing shows while sound is muted.
- **Theme picker groups (1.39.0):** the theme picker in Preferences has two groups: `Themes` (everything in `settings/themes.json`) and `Downloaded mods` (themes inside installed mods). A mod with one theme is listed by the mod's name, a mod with several is listed as `Mod name: Theme name`. A mod with no theme has nothing to show, so it is not listed.
- Keep the lists inside `index.html` roughly in sync as a backup.

## Versioning

Near the top of `index.html`:

```html
<!-- Game version: 1.56.0 | Deployment: 213 | Update both on every release, see README.md -->
<meta name="game-version" content="1.56.0">
```

Bump both the version comment and the `game-version` meta tag on every release. The deployment number is an internal counter for tracking Apps Script/Sheet deployments - increment it whenever the backend Web App is redeployed, even if the game version string doesn't change.

## Code layout

All the code lives in one file, `index.html`:

- `<style>` block - all CSS, organized into commented sections (e.g. `/* ---------- SHOP ---------- */`, `/* ---------- DEBUG PANEL ---------- */`). Responsive rules live in `@media (max-width:480px)` (phone) and `@media (min-width:481px)` / `(min-width:769px)` (tablet/desktop) blocks.
- HTML body - the auth flow (title/username/password/login screens), the main app shell (`#page-sidebar` with the avatar/counter, `#page-main` with the tab bar and content list), and a stack of overlay elements (tutorial, workshop, friend picker, debug panel, confirm dialogs, etc.) that are shown/hidden via JS rather than being separate pages.
- `<script>` block - game state (`game` object, persisted via `saveGame()`), the `TABS` array driving the main nav, per-tab render functions (`renderShop`, `renderStats`, `renderLeaderboard`, `renderAchievements`, `renderSettings`), and feature-specific sections (audio/music player, tutorial engine, workshop/mods, friends & chat, debug panel).

## Notes for future changes

- The main nav is data-driven - add/remove a tab by editing the `TABS` array and adding a matching branch in `renderActiveTab()`. Give it an entry in `TAB_ICONS` too, so it gets a circular icon on phone widths.
- Low performance mode and the phone/tablet/PC responsive layout are independent systems - low-perf mode simplifies visuals and is opt-in/detected by device, while responsive layout is purely CSS media queries plus the icon-vs-label swap on `.tab-btn`.
- The Debug Mode page-ratio preview works by loading `index.html` again in an iframe with `?debugPreview=1`, so real `@media` queries apply inside it. That query flag also mutes audio inside the preview frame to avoid a second copy of the music playing.

## The Keeper (1.46.0, renamed from The Vault in 1.47.0)

A secret code room, like the Vault in Geometry Dash. A see-through button sits in the bottom right corner of your Workshop profile (Workshop, then your profile button). It opens a full screen with the Keeper and a box to type a code. Press Enter or click the Keeper: a loading ring spins, then a right code shoots lightning out of the Keeper and a wrong code swaps in the spoop face and shakes it. The Keeper talks in the OptimusPrinceps font (`fonts/OptimusPrinceps.ttf`, loaded as `KeeperFont`).

Search `THE KEEPER` in `index.html`. The function and class names still start with `vault`. To change what it says or gives, edit two lists and nothing else:

- `VAULT_LINES`: the title, the idle lines (said when the box is empty), the loading line, the wrong code lines, and the lines for a used code, a locked code and being inside a room.
- `VAULT_CODES`: one entry for each code, with `id`, `codes` (every word that works), `say`, and the optional `needs`, `note` and `reward`.

The first codes (1.47.0). Each one works once for each account:

| Code | Gives |
|---|---|
| `verity` | 1 Prestige |
| `jfor` | 4 Gems |
| `masky` or `fallgamedev` | 67 Moneys and a paper note that says sorry |
| `afton` | 1987 Moneys |
| `gd`, `geo` or `gdash` | The GD Frame, already put on |
| `huyhuj` | 1 Huj (secret currency) |
| `key` | 1 Key. Only works if you own 1 Huj. The Huj is not taken away. |

More codes (1.48.0). Words on the same line count as the same code:

| Code | Gives |
|---|---|
| `amogus`, `sus`, `amongus` | 500 Moneys |
| `dvd` | 1000 Moneys |
| `noob` | 1 Money |
| `banana`, `nana`, `banan` | 250 Moneys |
| `duck` | 222 Moneys |
| `rick`, `rickroll` | 1 Gem |
| `baldi` | 4 Moneys |
| `egg` | 12 Moneys |
| `maksy` | 3 Gems |
| `here`, `herestudios` | 100 Moneys |
| `wildcard` | 5 Gems |
| `clicker`, `theclickergame` | 1000 Moneys |
| `biggie` | 2 Gems |
| `spoopy`, `spoop` | 31 Moneys and a note that says boo |
| `optimus`, `princeps` | 7 Moneys |
| `67`, `sixseven` | 67 Moneys |
| `keeper`, `thekeeper` | 10 Moneys |
| `vault`, `wraith` | 2 Moneys |
| `lightning`, `zap` | 2500 Moneys |
| `rose` | 14 Moneys |

**The lock (1.48.0).** While you own a Key, the Keeper's lock is yellow and can be clicked. The yellow pictures were colored by hand: `vault-keeper-key.png`, `vault-keeper-spoop-key.png` and `vault-lock-key.png` (just the lock, used for the two broken halves) in `images/misc/`. Clicking the lock (`vaultBreakLock()`) uses up the Key, breaks the lock in two, turns the Keeper into `spoopy.png`, and after `VAULT_FREE_MS` it fades away. It leaves a note that says "I will be back." signed by a glitchy `huyhuj` (`.vault-glitch` in the CSS), with a list of every code you have not used yet. The note can't be closed and the Keeper stays gone for that account (`storage.gone` in its save). Since 1.49.0 the code box only answers `*crickets*` once the Keeper is gone, whatever you type, so the codes on the note can't be used any more.

- **GD Frame:** a secret profile frame (`SECRET_FRAMES`, id `frame_gd`). It makes the profile picture square and blocky. The blocky look comes from two SVG filters in the HTML, `pf-pixel-big` and `pf-pixel-small`. Secret frames can be equipped in Your Collection like any frame, but they never show in the Limited Shop and never drop from a Lucky Block.
- **Huj, Keys, used codes and whether the Keeper is gone** are saved in the browser's local storage since 1.49.0, under `clickerKeeperSave:<username>` (guests use `guest`). They are not sent to the API, so they stay on one device and one browser, and clearing the site data wipes them (the codes can then be used again). Saves from 1.47.0 and 1.48.0, which lived in `game.modData` under `__keeper`, are moved over by `keeperSave()` the first time it runs. Never change a code's `id` after release, or players could use it again.
- Codes do not work inside a room or server, because the save in there is shared.
- Codes are checked in the browser, so anyone who reads `index.html` can find them. Move the check to the backend before a code gives out anything big. `VAULT_LOADING_MS` sets how long the ring spins.

## CGC (Clicker Game Code), 1.21.0+

Mods made in the mod editor can include code written in CGC. The full player guide is inside the game: open the mod editor and click the open book button (CGC guide).

How it is built (all in `index.html`):

- `const CGC = (() => { ... })()` is the language: lexer, parser and runtime. It never uses eval. Mod code only reaches the game through a `host` object.
- `cgcLiveHost()` is the host for installed mods. **The moneys, prestige and gems rules live here and nowhere else:**
  - moneys: a mod can add exactly 1 or the player's click boost at a time, max `CGC_MONEY_ADDS_PER_SECOND` (15) times a second, and can subtract moneys the player has. No set, multiply or divide.
  - prestige: only opens the normal prestige confirm, and only if the player has `PRESTIGE_COST` moneys.
  - gems: mods can never change them.
- `cgcTestHost()` is the host for Run test in the editor. Same rules, fake moneys, nothing saved.
- `cgcStartAll()` runs at `startGame()`. Install/update calls `cgcStartMod()`, uninstall calls `cgcStopMod()`.
- Objects are drawn in `#cgc-stage` (z-index 3000: above the game, below the workshop and dialogs).
- Game events sent to mods: `c.click` (avatar click), `c.buy` (shop purchase, detected after any `.buy-btn` click that lowered moneys, prestige or gems), `c.prestige` (end of `doPrestige()`), plus `c.load`, `c.tick` and `c.second` from the runtime.

How a mod is saved (`customFiles` in the workshop row):

- `payload`: `[{ name: "cookie.png", file: "cookie.png", url }]`
- `script`: `[{ name: "main.cgc", file: "main.cgc", url: "data:text/plain;charset=utf-8,..." }]`. The code is a text data URL on purpose, so the API's installed-mods compaction and rehydration handle it like any uploaded file.
- `themes` (1.37.0): `[{ name: "My theme", file: "theme-1.json", url: "data:application/json;charset=utf-8,..." }]`. The JSON inside is `{ name, corners, light: {...}, dark: {...} }` (`corners` is `square`, `slight`, `normal` or `extra`) with these colors on each side: `page`, `card`, `raised`, `outline`, `text`, `muted`, `accent`, `buttonText`, `accent2`, `danger`, `money`, `pill`, `pillText`. It is a data URL for the same reason as `script`. The key is left out when a mod has no themes.

Mod data (currencies and `storage.` variables):

- In the save: `game.modData = { modId: { currency: {}, storage: {} } }`.
- To the API: `modData: [{ modId, currency, storage }]` in `saveGameData`, stored in the `mod_data` column. The API adds the column by itself (see `MIGRATIONS` at the top of the edge function), nothing to run by hand.
- Kept through prestige, kept on uninstall (a reinstall gets it back).

Mod themes (1.37.0):

- Made in the mod editor's **Themes** section. `New theme` adds one and opens the theme editor (`renderModThemeEditor()`): a box for every color, a Light / Dark switch for the side being edited, a light and a dark preview, and a contrast check.
- **Corner rounding (1.38.0):** the theme editor has four Corners buttons (Square, Slight, Round, Extra). `THEME_CORNERS` holds the choices. Slight and Extra work by re-reading every corner rule in the game's stylesheet and multiplying its pixel sizes (`scaledCornersCss()`), so circles and pill shapes keep their shape. Square flattens everything, circles too.
- Each theme counts as 50% of the mod's storage (`MOD_THEME_STORAGE_SHARE`), whatever its real size. `modFilesSize()` does the math, so a third theme goes past 100% and costs extra Gems like any other storage.
- Every color must be a plain `#rrggbb`. `cleanModTheme()` swaps anything else for the default color, so a mod can't put other CSS into the page. Do not loosen this check.
- Themes from installed mods show up in the Preferences theme picker right away (`refreshModThemes()`), named `Theme name (Mod name)`. Their id is `mod:<mod id>:<number>`.
- `.cga` files keep themes in `mod.json` under `themes`.
- The AI helper and the AI connector do not make themes yet.

Rules for changing CGC:

- New game variables for `v.` go in `cgcGameVar()`. New writable ones need a rule in both hosts.
- New attributes go in `setAttr()` and the Attributes table in `CGC_GUIDE`.
- Keep `CGC_EXAMPLE_PET` (the guide's Hungry pet example) working: load it in the editor and click Run test after any change.
- **Vibecoding: Connect to AI** (1.27.0) - the guide's Vibecoding page is drawn by `cgcRenderVibeAi()`. `CGC_AIS` lists the AIs (ChatGPT, Copilot, Claude, Gemini), their chat links and preferred API models. Connect copies the prompt and opens the chat site. The optional direct link uses the player's own API key, saved only in `localStorage` (`fallgamedev-cgc-ai-key:<id>`), and calls the AI company from the browser (`cgcAiListModels()`, `cgcAiAsk()`). The key never goes to the game's API. Copilot has no public API, so it can't be linked.
- **AI helper in the mod editor** (1.28.0) - above the code box there is an `Ask <AI>` button for each linked AI (`cgcRenderHelper()`). `cgcHelperRun()` builds the prompt (`cgcHelperPrompt()`), asks the AI, reads its `FILE:` blocks (`cgcHelperParse()`), then makes or finds each file: `svg` drawings become images, `sound` note lists become small .wav files, `extras` uses a song from `extras/`, and `link` is tested before use. It puts the code in the editor, runs a test, and sends errors back to the AI up to `CGC_HELPER_MAX_FIXES` times. Undo restores the old code and Payload.
- **AI connector** (1.29.0) - lets AI apps that support connectors (MCP servers), like Claude and ChatGPT, send mods straight into the mod editor. Two parts:
  - Server: `supabase/functions/mcp/index.ts`, a Supabase Edge Function with three tools (`get_cgc_guide`, `get_mod`, `send_mod`). **Turn it on once:** Supabase dashboard > Edge Functions > Deploy a new function > Via editor, name it exactly `mcp`, paste the file, turn OFF "Verify JWT" (same as the `api` function), Deploy. It keeps its data in a private Storage bucket called `ai-links` that it creates by itself. It never touches accounts, moneys or Gems. The connector link is the API link with `api` swapped for `mcp` (`cgcConnectorUrl()`).
  - Game: the **AI connector** button above the code box (`cgcLinkPanelHtml()`). It shows a connect code, checks in with the server every few seconds while the panel is open (`cgcLinkTick()`), loads what the AI sent (`cgcLinkApply()`), runs a test and reports errors back so the AI can fix them.
  - `CGC_GUIDE` inside the function is a copy of the rules in `CGC_VIBE_PROMPT`. When CGC changes, update both and deploy the function again.
- **AI resource packs** (1.30.0) - the AI helper and the AI connector can make files for the editor's Icons, Cursors, Backgrounds and Music sections with no code and no Payload. A file says where it goes with a folder: `FILE: icons/dragon.png` for the Ask buttons, or a `folder` field in the connector's `send_mod`. `CGC_PACK_FOLDERS` holds the sizes (icons 128px, cursors 32px, backgrounds 640px). Code is optional now, so a files-only answer leaves the editor's code alone. **The `mcp` function changed, so paste `supabase/functions/mcp/index.ts` into Supabase and deploy it again.**
- **CGA export and import** (1.31.0) - the mod editor's top bar has `Export .cga` and `Import .cga`. A `.cga` (Clicker Game Archive) is a real zip with a different ending: `mod.json` (details and file list), `code.cgc` (the CGC code), `icon.*`, and the folders `icons/`, `cursors/`, `backgrounds/`, `music/`, `payload/`. Uploaded files are stored as real files, links stay links in `mod.json`. The zip is written and read in the page with no library (`cgaZip()`, `cgaUnzip()`). Import only lets in pictures, sounds, web links and `extras/` songs. Bump `CGA_VERSION` if the layout changes.
- The reset email is sent by a standalone Google Apps Script kept at `scripts/reset-mailer.gs` (live copy runs on script.google.com). Its web app URL and shared secret are the `MAILER_URL` and `MAILER_SECRET` secrets on the reset function.
- **Forgot password + email** (1.32.0) - a `reset` edge function (`supabase/functions/reset/index.ts`), separate from `api`, with actions setEmail / requestPasswordReset / resetPassword. The game calls it at `RESET_API_URL` (api url with `/api` swapped for `/reset`). Login screen has a `Forgot your password?` link opening a reset overlay; sign-up and Advanced Settings collect a recovery email. **Setup: deploy the `reset` function (Verify JWT off), run the add-column SQL in the README header of that file, set MAILER_URL and MAILER_SECRET secrets, and deploy the Apps Script mailer (its code was shared in chat).** Reset codes are SHA-256 fingerprinted, 15-min, 5 tries, rate-limited, and never reveal whether an email exists.
- **Block coding** (1.33.0) - the Code panel in the mod editor has a `Text | Blocks` switch. Blocks is a second view of the same code, not a second language: `draft.code` is still the only thing tested, saved and published. `cgcbFromCode()` reads the text line by line into a tree of blocks, `cgcbToCode()` writes the tree back as text after every change, and a line with no block of its own becomes a `code` block so nothing is lost. Before Blocks opens, `cgcbSameMeaning()` parses both versions with `CGC.parse()` and compares them, and the editor stays in Text mode if they differ or if a `when` / `if` / `repeat` is missing its `end`. Opening Blocks never rewrites the text, only changing a block does. The choice is saved in the draft as `codeMode`. Add a block type in four places: `CGCB_CATS`, `CGCB_PALETTE`, a pattern in `cgcbFromCode()`, and a case in both `cgcbToCode()` and `cgcbBlockHtml()`. When CGC gets a new statement, add its block too (it works as a `code` block until then).
- Every code box in `CGC_GUIDE` is real CGC. After changing the language or a guide page, paste its code boxes into the editor and run them.
- `MOD_EDITOR_SIZE_LIMIT` (250K) caps a mod's files, payload and code together.

## Market: sale split, mod packs, boosts (1.42.0)

**Sale split.** When someone buys a paid mod or a mod pack, the maker gets 60% (`AUTHOR_SHARE`) and every staff account (`owner`, `mod`, `dir`/`director`, `dev`) shares the other 40% equally. Everyone is paid as a gift "from Workshop" (the same `gifts` table friends' gifts use), so the Gems arrive with a banner even if they were offline. Paying an account's Gems directly would not stick, because an open game saves its own Gem count every second.

- **The staff pot:** 40% of a 10 Gem mod is 4 Gems, which can't be split evenly between 6 staff. The staff part goes into a pot (`market_state` table). Whenever the pot holds at least 1 Gem for everyone, everyone gets the same whole amount and the leftover waits for the next sale. No Gem is lost.
- Free mods, and your own mods, cost nothing and split nothing.

**Mod packs.** A maker pays `PACK_COST` (500) Gems to bundle 2 to 20 of their own mods. A pack costs `PACK_DISCOUNT` (90%) of its mods added up. Mods the buyer already has are left out of the price. Buying a pack installs every mod in it. The pack's page lists each mod with its own Get button, for buying just one at the normal price. The maker can edit a pack for free or delete it (staff can delete too). A maker who keeps their mods anonymous shows as Anonymous on their packs.

**Mod boosts.** A maker pays to list one of their mods first in the Workshop, with a Boosted tag, for 1, 3, 7 or 30 days (`BOOST_PLANS`: 500, 1,200, 2,500, 9,000 Gems). Boosting again adds the days on. Boost Gems are not paid to anyone.

**Server boosts.** Any player can boost any server from Browse Servers or from Room Stats, with the same menu and prices. A boosted server is listed first. This lives in the `rooms` function (`boost` action, `meta.boostUntil`).

**Limited Shop mod deal (1.45.0).** Every week the Limited Shop shows one random Workshop mod that costs Gems at 70% off (`LIMITED_MOD_DISCOUNT`). The sale price only counts in the Limited Shop. In the Workshop the same mod still costs its normal price. The `market` function picks the mod (`limitedDeal()`: every paid mod gets a ticket number made from the week and its id, the lowest wins, so everyone sees the same mod all week) and sends it in the `get` reply as `limitedMod`. The game buys it with `buyMod` plus `limited: true` and `expect` (the price on the button), so the server decides the price and nobody is charged a number they did not see. The sale Gems are split the normal way (60% maker, 40% staff). The week flips Wednesday 00:00 UTC with the rest of the Limited Shop. Game side: `limitedModCardHTML()`, `loadLimitedModDeal()` and `buyLimitedMod()` in the `LIMITED SHOP` section. Mature mods stay hidden unless the player turned them on. **The `market` function changed, so paste `supabase/functions/market/index.ts` into Supabase and deploy it again.** Until then the card simply does not show.

**Turn it on (once):** Supabase dashboard > Edge Functions > Deploy a new function > Via editor, name it exactly `market`, paste `supabase/functions/market/index.ts`, turn OFF "Verify JWT" (same as `api`), Deploy. It makes its own tables (`mod_packs`, `market_boosts`, `market_state`). For server boosts, paste the new `supabase/functions/rooms/index.ts` over the old `rooms` function. Until `market` is deployed, mods are bought the old way (all Gems to the maker) and packs and boosts are hidden.

How it is built:

- Server: `supabase/functions/market/index.ts`, a separate function from `api`. Actions: `get`, `buyMod`, `createPack`, `updatePack`, `deletePack`, `buyPack`, `boostMod`. It uses the `adjust_balance` and `bump_downloads` database helpers that `api` already has. `payOut()` is the one place that shares out a sale.
- Game: the `MARKET` section of `index.html`. `downloadMod()` sends paid mods to `buyMod`. `renderPackStripHtml()` draws the pack row, `renderWorkshopPack()` the pack page, `openPackEditor()` the make/edit menu, and `openBoostDialog()` the boost menu (shared by mods and servers).
- `PACK_COST`, `PACK_DISCOUNT` and `BOOST_PLANS` exist in `index.html`, `market` and (boost prices) `rooms`. Change them everywhere.
- The old `downloadWorkshopItem` action in `api` still exists and still pays the maker 100%. The game no longer uses it for paid mods once `market` is on. To close that door completely, change those two lines in `api` to call the same split.

## Social: online status, privacy switches, notifications (1.41.0)

**Online status.** Edit Profile has a Status picker: Online (automatic), Busy, Appear offline, Custom (up to 40 characters). It shows as a colored dot and a few words on public profiles and on the friends list (online friends are listed first). Anyone who is not on the site shows as Offline, whatever they picked.

**Privacy switches** (Edit Profile > Advanced Settings, saved on the account when Save Changes is pressed):

- **Disable messages:** friends can't pick you for a new chat or message you one on one, and your own Messages tab is turned off.
- **Disable friend requests:** your profile shows "Not taking friend requests", and any request that still arrives is declined by your game.

**Notifications** (Edit Profile > Advanced Settings, saved on the device, no Save needed): the switch asks the browser for permission. If the player says no, the browser never asks again, so the switch is locked (the hint under it says how to unlock it in the browser settings). When it is on, three more switches show: Messages, Friend requests, Mod updates. While the game is in the background a browser notification pops up. While you are looking at the game the same news shows as a banner inside the game instead (1.44.0). A `Test` button under the switches sends one notification right away and says where to look if the computer is hiding them (a browser can allow notifications while macOS or Windows still blocks that browser, and a web page can't see that). Every notification gets its own tag: with a shared tag, browsers quietly replace the old one with no pop-up, so only the first one ever showed (fixed in 1.44.0). Mod updates are checked every `MOD_UPDATE_CHECK_MS` (30 minutes) and each new version is announced once.

**Turn it on (once):** Supabase dashboard > Edge Functions > Deploy a new function > Via editor, name it exactly `social`, paste `supabase/functions/social/index.ts`, turn OFF "Verify JWT" (same as `api`), Deploy. The function makes its own `social` table. Until it is deployed, statuses are hidden and the two privacy switches can't be saved. Notifications work without it.

How it is built:

- Server: `supabase/functions/social/index.ts`, a separate function from `api`. Actions: `ping` (I am on the site, sent every `SOCIAL_PING_MS`), `bye` (tab closed), `set` (status and switches), `get` (how a list of players shows to others). One row per player in the `social` table, keyed by `player_id` so a name change keeps everything.
- Game: the `SOCIAL` section of `index.html`. `socialLookup()` fills `socialCache`, and any element with `data-status-for="username"` is filled by `socialFillStatuses()`.
- The privacy switches are enforced by the game, not by `api` (which this update does not touch): the sender's game checks the switch before sending, and the receiver's game hides or declines. A player running a changed copy of the game could still send a message, but the receiver would not see it in a turned off Messages tab. To make it airtight, `sendMessage`, `createChat` and `sendFriendRequest` in `api` would have to read the `social` table too.
- Notification choices live in `localStorage` (`fgd_site_notifs`). `sendSiteNotification(kind, title, body)` is the one place that pops one up.

## Paid song preview (1.56.0)

On a paid mod the player has not downloaded, the Music view on the mod page no longer says "download to hear". Each song has a **Preview (15s)** button that plays `MOD_PREVIEW_SECONDS` (15) seconds and stops.

- **The maker picks the start:** every song in the mod editor's Music section has a "Paid preview starts at ... seconds" box and a Test preview button. The start is saved on the song as `preview` (whole seconds, 0 to `MOD_PREVIEW_MAX_START`) inside `customFiles.music`. A song with no `preview` starts at 0. `.cga` archives keep it too.
- **Code:** the `PAID SONG PREVIEW` section. Any element with the class `mod-preview-btn` plays a preview (`data-src`, `data-start`). It works for normal sound links and for YouTube links.
- **Code on a paid mod stays locked** until the mod is downloaded.
- **API:** no change. The `api` function saves each song entry as it is, so `preview` rides along.
- The limit is drawn by the game, not the server: the song's link is still inside the mod's data, so it stops casual listening, not someone digging through the page.

## Mod fonts, SVG Easy Navigation icons and mod page views (1.55.0)

- **Fonts in mods:** the mod editor has a **Fonts** section. Upload a `.ttf`, `.otf`, `.woff` or `.woff2` file (up to `MOD_FONT_MAX_BYTES`, 300KB) or add an https link to one. They are saved in `customFiles.fonts`, the same shape as icons and music (`{ name, file, url }`). Fonts from installed mods show up in the Font Manager picker (`refreshModFonts()` in the `MOD FONTS` section). `.cga` archives carry them in a `fonts/` folder.
  - **API:** no change was needed. The `api` function already keeps every list inside `customFiles` (upload, `compactInstalledMods` and `rehydrateInstalledMods` loop over whatever keys are there), so `fonts` is saved and loaded like `music` or `icons`. A mod can be up to `MAX_JSON_CHARS` (2,000,000 characters).
- **Easy Navigation icons are SVG now:** no emojis. Every icon is drawn in `EZ_ICONS` (a fill color plus shapes in a 24 by 24 box, all with the same dark outline). `EZ_WORDS` maps words to icon names. The icons sit in a `<span class="ez-ico">` that `ezApplyTo()` adds to the start of a label. Numbers are drawn with CSS (`data-n`), so `textContent` of a button is the same as before.
- **Mod page views:** the banner on a mod's page has buttons for Banner, Icons, Cursors, Backgrounds, Music, Fonts, Themes and Code (`MOD PAGE VIEWS` section, `modViewHTML()`). Only the parts a mod has get a button. On a paid mod you have not downloaded, Code is locked and Music plays a 15 second preview (1.56.0).

## No right click menu and YouTube as audio (1.54.0)

- **No right click menu:** the browser's menu never opens anywhere in the game. A right click with a mouse counts as a normal click on whatever is under it. A long press on a phone only gets the menu blocked. It is in the `NO RIGHT CLICK MENU` section of `index.html`.
- **YouTube as audio:** in the mod editor, a YouTube link can be used where a sound goes: under **Music** (a song for the Music Player) and as a **Payload** link (a sound for CGC code, named `song.mp3`). The video loads in a hidden YouTube player off screen, so only the sound plays.
  - Code: the `YOUTUBE AS AUDIO` section. `youtubeIdFromUrl()` spots the link and `YtAudio` works like a small `<audio>` (`play()`, `pause()`, `stop()`, `.volume`, `.loop`, `.playbackRate`).
  - The Music Player uses `songYt` with `songPlay()`, `songPause()` and `songIsPlaying()`, so the play button, loop button and Now Playing banner work the same for both kinds of song.
  - Limits that come from YouTube: it only plays after the player has clicked something, speed stays between 0.25 and 2, it can't play backwards, and a video whose owner turned off embedding will not play. YouTube's rules also say its player should be visible, so a hidden one is at your own risk.

## Easy Navigation: everything is icons (1.53.0)

With Easy Navigation on (Settings), every label in the five tabs and the sidebar turns into icons. Only numbers stay as text.

- **How:** the `EASY NAVIGATION ICONS` section of `index.html`. `ezScan()` looks at the labels matched by `EZ_SELECTOR`, `ezIconize()` swaps each known word for an icon from `EZ_WORDS` and keeps the numbers ("Buy x10 (550)" becomes a cart icon then "x10 550"). Since 1.55.0 the icons are SVG, see the 1.55.0 section above. The CSS hides the real text. The real text is never changed, so buying, saving and mods work the same.
- **Tiles:** Shop, Settings and Achievements cards become a grid of icon tiles. Tap a tile (not its button) to get a banner with its name and description. Hovering a button shows its real name.
- **Redraws:** a `MutationObserver` runs `ezScan()` again when a tab is redrawn or a price changes.
- **Not changed:** a label with a word that is not in `EZ_WORDS` stays as text. That keeps player names, mod names, font names and chat messages readable. Popups (Workshop, profiles, chats, confirm boxes) are not touched.
- **Adding a button:** put its words in `EZ_WORDS` (lowercase). If it is a new kind of element, add it to `EZ_SELECTOR`.

## Z key, Easy Navigation and a Shop fix (1.52.0)

- **Z key:** pressing Z does one click on the clicker (it calls `avatarEl.click()`, so combos, effects and mods all work the same). Holding Z only counts once, Ctrl+Z is ignored, and it does nothing while you type in a text box or while a popup covers the clicker (`isTypingTarget()`, `isClickerReachable()`).
- **Easy Navigation:** a new card in Settings. It puts the `easy-nav` class on `<body>`: the main tabs turn into big icon only buttons on every screen size and the click counter turns into plain text. Saved on this device in `localStorage` (`easyNavMode`), off by default. The look is all CSS, in the `EASY NAVIGATION` block at the end of the `<style>` tag.
- **Shop bug fix:** `refreshShopAffordability()` was missing some buttons (Click Boost x10, x25 and Max, Click Effects, Font Manager, Theme Switcher, Lucky Charm, Prestige), so they stayed lit up after you could not afford them anymore. The Shop tab also kept flickering for a new item after you spent the moneys for it. `checkShopNewItems()` now stops the flicker, and starts it again when you can afford the item.

## Support a Creator (1.51.0)

A player with the `cc` (Content Creator) auth has a red name (`authColor`) and gets a **Support** button on their public profile. Pressing it makes you their supporter:

- **Name font:** your name shows in that creator's name font on your profile, the Stats tab and the leaderboard. A creator with no special font changes nothing.
- **Buy 5, they get 1:** every 5 of a Shop item you buy sends 1 of that item to the creator, for free. Items that count: Click Boost, Auto Clicker, DVD Logo, Noob, Noob Level, Amogus, Amogus Task, Boost, Head Start, Prestige Multiplier. Mods never count. Purchases inside a room or server do not count (that is the room's save, not yours).

You support one creator at a time. Pressing Support on another creator switches (and the count toward 5 starts over), pressing the button again stops. A creator's own profile shows how many players support them.

**Turn it on (once):** Supabase dashboard > Edge Functions > Deploy a new function > Via editor, name it exactly `support`, paste `supabase/functions/support/index.ts`, turn OFF "Verify JWT" (same as `api`), Deploy. The function makes its own `supports` and `support_gifts` tables. Until it is deployed the Support button answers "Support is not set up yet."

How it is built:

- Server: `supabase/functions/support/index.ts`, a separate function from `api`. Actions: `get` (who I support, how many support me, who a list of players supports), `set` (start, switch or stop), `give` (send items to my creator), `claim` (a creator picks up waiting items, which deletes them so they are only ever claimed once). Rows are keyed by `player_id` so a name change keeps supporters.
- Game: the `SUPPORT A CREATOR` section of `index.html`. `SUPPORT_ITEMS` lists the items and what receiving one does. Each buy function calls `supportTrackPurchase('item', amount)`. The count toward 5 and anything not sent yet live in `localStorage` (`fgd_support_<username>`), and `supportPoll()` (every `INBOX_POLL_MS`) retries unsent items and claims a creator's waiting ones.
- Fonts: `applyProfileNameFont(el, accountFont, shopFontId, username)` asks `supportFontFor(username)`. `supportLookup()` fills the cache, and the creator's fonts come from the normal `getAccount` in `api` (which this update does not touch).
- To add an item: add it to `SUPPORT_ITEMS`, add its key to `ITEMS` in the function, and call `supportTrackPurchase` in its buy function.

## Rooms and servers (1.34.0)

A room or server is one shared save that many players play together. It starts from a clean slate. A click by anyone adds to the same counter, and a purchase by anyone spends the shared Moneys and shows up on every screen.

| | Room | Server |
|---|---|---|
| Cost | Free | `ROOM_SERVER_COST` (1,000) Gems to open, then `ROOM_RENT_COST` (250) Gems every month |
| Who can join | Anyone with the room code | Anyone, it is listed in Browse Servers |
| How long it lasts | Until the host leaves (then everyone is kicked out and the save is gone) | Always up until the host deletes it |
| Entrance fee | No | Optional, in Gems, paid once per player, collected by the host |
| Staff | The host can kick and ban | The host and owners can kick, ban, and make admins and owners. Admins can kick and ban |

Both can have a password, an icon and a category.

**Turn it on (once):** Supabase dashboard > Edge Functions > Deploy a new function > Via editor, name it exactly `rooms`, paste `supabase/functions/rooms/index.ts`, turn OFF "Verify JWT" (same as `api`), Deploy. The function makes its own `rooms` table the first time it runs. If the Rooms tab says the table is missing, run the SQL at the top of that file once.

How it is built:

- Server: `supabase/functions/rooms/index.ts`. Actions: `create`, `join`, `sync`, `chat`, `leave`, `moderate` (kick, ban, unban, role), `remove`, `browse`. One row per room in the `rooms` table. The shared save is the `state` column (JSON), members and their roles are in `members`, chat is in `messages`. Every save checks the row's `version`, so two players saving at the same moment never overwrite each other.
- Game: the `ROOMS + SERVERS` section of `index.html`. The game calls the function at `ROOMS_API_URL` (the api link with `/api` swapped for `/rooms`).
- `ROOM_SHARED_KEYS` lists the parts of `game` that belong to the room (moneys, upgrades, prestige). Everything else stays the player's own: Gems, mods, achievements, and every picked preference (song, cursor, background, icon, effect, font, light mode). **A new upgrade bought with Moneys needs its save key added to `ROOM_SHARED_KEYS`** or it will not be shared.
- Going in, the player's own save is put away in `roomSession.personal`. `saveGame()` and `buildSyncPayload()` always write that own save (`roomPersonalView()`), so an account is never overwritten by a room. Going out puts it back.
- Every `ROOM_SYNC_MS` (2 seconds) `roomTick()` sends what changed on this screen (numbers as "how much it changed", on/off values as the new value) and gets the room's save back. Each player's auto clickers, DVDs, crewmates and noobs run on their own screen and all pay into the shared save, so more players means more income.
- Inside a room the Stats tab shows **Room Stats** (name, icon, global clicks, messages box, players) and **Player Stats** (the normal stats page with its own subtabs).
- Reset Data, Moneys to Gems, and gifts are turned off inside a room, because the Moneys there belong to everyone.
- `SERVER_COST`, `RENT_COST`, `MAX_FEE` and the category list exist in both files. Change them in both.

**The monthly bill (1.40.0):**

- A server costs `RENT_COST` (250) Gems every `RENT_PERIOD_MS` (30 days). The Gems are taken from the host by themselves. Servers made before 1.40.0 get their first bill a month after the new function first sees them.
- Not enough Gems means the bill is **late**: the server stays open for `RENT_GRACE_MS` (a week) and the host gets a banner ("Hey, you need to save more Gems!"). After the week it is **offline**: `join` and `sync` answer `unpaid`, so nobody can open it (not even the host) until the bill is paid. Nothing is deleted. Paying an offline server starts a fresh month from that day.
- It all lives in the room's `meta` column: `rentDue` (when the next bill is due) and `rentTried` (the last try). No new columns.
- Game: `roomRentCheck()` runs when the game starts and every `ROOM_RENT_CHECK_MS` (10 minutes). It calls the new `rent` action to look, syncs the save, then calls `rent` again with `pay: true` and takes the same Gems off the screen (`roomSpendGems`). The server list shows the bill for your own servers, and an offline server of yours gets a `Pay 250 Gems` button.
- Server: `settleRent()` pays one bill in three steps (claim the try, take the Gems, move the date) so a busy server is never charged twice. If the host is not playing, the first `join`, `sync` or `browse` more than an hour after the due date pays from the host's Gems (`rentBackupReady()`).
- **The `rooms` function has to be deployed again** for this (paste the new `supabase/functions/rooms/index.ts` over the old one). Until then the game works like before and no bills are sent.

