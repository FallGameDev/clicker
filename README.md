# The Clicker Game!

A browser-based clicker/idle game by **Wildcard Studios**. Tap the avatar, earn moneys, buy upgrades, prestige, and compete on a shared leaderboard. Built as a single self-contained `index.html` file (vanilla HTML/CSS/JS, no build step) backed by a Google Sheets database via Google Apps Script.

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

All image and audio assets referenced by the page must sit next to `index.html` in the same folder (see **Assets** below) or the game will load with missing art/sound.

## Backend

Accounts, sessions, game-state sync, and the leaderboard are handled by a Google Apps Script Web App backed by a Google Sheet. The frontend talks to it entirely through one endpoint:

```
const SHEET_API_URL = '...' // near the top of the <script> block
```

If you fork this project or move it to a new Sheet/Apps Script deployment, update `SHEET_API_URL` to point at your own Web App URL. All account creation, login, save/load, and leaderboard reads/writes go through this single constant.

## Features

- **Core loop** — tap the avatar to earn moneys; buy upgrades to boost income and automate clicking.
- **Shop** — Click Boost, Auto Clicker, DVD Logo (bouncing screensaver easter egg), Amogus, Roblox Noob, Screaming Goat, Custom Cursors, Background Switcher, Icon Modifier, Offline Earnings, and more, plus a separate **Prestige Shop**. Shop items are filterable by category (All / Visuals / Customization / Plain).
- **Stats** — profile (avatar/username), moneys, prestige, gems, plus subtabs for Friends, Mods, and Messages.
- **Leaderboard** — global and friends-only rankings.
- **Achievements** — unlockable achievement list with hint system.
- **Workshop / Mods** — browse, install, and upload user mods; installed mods list.
- **Friends & Messages** — friend requests, friend picker, and a simple chat system.
- **Tutorial** — first-time walkthrough that highlights each tab; replayable from Settings.
- **Settings** — mute SFX, light/dark theme, low performance mode (simplifies effects + shows an FPS counter), layout switcher (center/left/right, PC & tablet only), reset data, reset tutorial, view team applications, credits, log out, delete account, and **Debug Mode**.
- **Debug Mode** — a draggable panel (Settings → Debug Mode → Open) showing live FPS, a few key stats (username, moneys, prestige, gems, click power), a Test Notification button, and a Page Ratio selector (Default / Phone / Tablet / PC) that previews the page at a real device viewport width in an embedded iframe, so responsive breakpoints trigger for real.
- **Responsive UI** — the game runs on desktop, tablet, and phones (Samsung and iPhone browsers included). On narrow phone widths the main tab bar (Stats / Leaderboard / Shop / Achievements / Settings) switches from labeled pill tabs to a row of circular icon buttons.

## Assets

Expected in the same folder as `index.html`:

- **Images**: `profile.png`, `appearchar.png`, `tutorial-guide.png`, `biggie.png`, `arrow.png`, `money.png`, `heart.png`, `gems.png`, role icons (`admin.png`, `dev.png`, `mod.png`, `owner.png`, `director.png`, `fam.png`, `cc.png`), a `profiles/` folder for user profile pictures, and `maksy.ico` (favicon).
- **Fonts**: `Pusab.ttf`, `pixelated.ttf`, `MeFont.ttf` (custom `@font-face` fonts), plus Google Fonts (Fredoka One, Poppins, Inter) loaded from CDN.
- **Audio**: the default background track, the tutorial and auth-screen tracks, and the selectable Music Player tracks (see the `SONGS` array in the script for the current filename list).

Missing assets won't crash the game, but will show as broken images or silent audio.

## Versioning

Near the top of `index.html`:

```html
<!-- Game version: 1.10.4 | Deployment: 192 | Update both on every release, see README.md -->
<meta name="game-version" content="1.10.4">
```

Bump both the version comment and the `game-version` meta tag on every release. The deployment number is an internal counter for tracking Apps Script/Sheet deployments — increment it whenever the backend Web App is redeployed, even if the game version string doesn't change.

## Code layout

Everything lives in one file:

- `<style>` block — all CSS, organized into commented sections (e.g. `/* ---------- SHOP ---------- */`, `/* ---------- DEBUG PANEL ---------- */`). Responsive rules live in `@media (max-width:480px)` (phone) and `@media (min-width:481px)` / `(min-width:769px)` (tablet/desktop) blocks.
- HTML body — the auth flow (title/username/password/login screens), the main app shell (`#page-sidebar` with the avatar/counter, `#page-main` with the tab bar and content list), and a stack of overlay elements (tutorial, workshop, friend picker, debug panel, confirm dialogs, etc.) that are shown/hidden via JS rather than being separate pages.
- `<script>` block — game state (`game` object, persisted via `saveGame()`), the `TABS` array driving the main nav, per-tab render functions (`renderShop`, `renderStats`, `renderLeaderboard`, `renderAchievements`, `renderSettings`), and feature-specific sections (audio/music player, tutorial engine, workshop/mods, friends & chat, debug panel).

## Notes for future changes

- The main nav is data-driven — add/remove a tab by editing the `TABS` array and adding a matching branch in `renderActiveTab()`. Give it an entry in `TAB_ICONS` too, so it gets a circular icon on phone widths.
- Low performance mode and the phone/tablet/PC responsive layout are independent systems — low-perf mode simplifies visuals and is opt-in/detected by device, while responsive layout is purely CSS media queries plus the icon-vs-label swap on `.tab-btn`.
- The Debug Mode page-ratio preview works by loading `index.html` again in an iframe with `?debugPreview=1`, so real `@media` queries apply inside it. That query flag also mutes audio inside the preview frame to avoid a second copy of the music playing.
