# Offline mode (RP-13)

**Status:** approved by the owner (D-538), PRs 1 to 4 of 9 done · **Date:** 2026-11-07 · **Touches:** RP-13, D-221, D-538

The app keeps working with no signal or a poor one. It switches to a reduced **Sin conexión** mode by
itself; there is no switch for players. Games that run on the phone keep working, online rooms and La
Copa are shown as unavailable, and scores are kept on the phone and uploaded when the signal is back.

## What works offline

| Works | Needs signal |
|---|---|
| Every minigame (Conexiones, Letras, Año, Reinas, Tango, Zip, Desenredo, Dónde, Rutas, Loteo, Pintaminas, Agentes, Puentes, Shinobi, Babel) | 📡 Two-phone rooms, in every game |
| The one-phone, vs-the-phone and solo modes of the party games | 🏆 La Copa (`offline: false`) |
| 📅 Uno al día: the game comes from the date; streak and calendar are on the phone | Rankings, the month's place, invites, chat, the mailbox, push sign-up |
| Resuming a game (C-6), sounds, settings | Lab games this phone has never seen the flag for |

The one answer is `offlineOk(g)` in `public/assets/js/games.js`: every game unless its entry says
`offline: false`. `offline.test.mjs` checks that no offline-capable page imports anything from another
site when it opens (the Firebase SDK is loaded with `import()` only when a room or ranking needs it).

## How it switches on

`public/assets/js/connection.js` (PR 3), started by `instalable.js` on every page while the flag is on:

- `offline` event or `navigator.onLine === false`: on at once.
- Poor connection: two probes in a row fail or take over 4 s. A probe is a no-cache `HEAD` of
  `precache.json`, which the service worker never answers from its cache; one a minute online, every
  15 s offline.
- Off only after two good probes at least 10 s apart, so a flaky signal does not flip the screen.
- The state is `connection().mode()`, an `onChange` listener, `<html data-connection>` and a
  `connection` event; screens only listen.
- Testers: "Forzar modo sin conexión en este celular" on the offline card in `/labs/`
  (`juegos-de-salon:offline-forced`), which also shows what the app detects. Nothing for players.
- Firebase's `.info/connected` is not used: it would load the SDK on pages that do not need it, and
  the probe already catches a dead connection.

## What the player sees

No new control on the home page while online. Offline:

1. **Once, on entering the mode**: a sheet on the dark purple (the existing sheet component) with three
   lines: you can keep playing this phone's games; rooms, La Copa and rankings come back with the
   signal; your scores are saved here and upload by themselves. One button, "Entendido".
2. **While offline** (`offline-ui.js`, `offline.css`, PR 4): a small pill "📴 Sin conexión · 2 por subir"
   as the page's first line (in its flow, so it never covers a top bar). Every link to a page the phone
   does not keep (La Copa, Rankings, /privacy/…) and every game's two-phone mode stay in place, dimmed
   and tagged **"📡 Con señal"** (Needs signal / Com sinal); small icon buttons and things inside a
   dimmed card are dimmed without a tag of their own. A tap shows one line: "Esto necesita conexión.
   Vuelve cuando vuelva la señal." The games mark their modes with `data-mode`.
3. **End screen**: "Guardado en tu celular. Se sube al volver la señal." instead of the ranking place;
   a new best shows as provisional.
4. **Back online**: one toast, "Se subieron 3 partidas ✓", or how many were refused and why.

Texts in es, en and pt (C-3, D-514), following U-1, U-8 and U-18. The `/privacy/` page is edited in the
PR that changes what is kept on the phone.

## Scores

- The existing queue (`guardarPendiente` / `subirPendientes` in `jugador.js`), raised from 20 to 200
  games, still 30 days, still only for the player who played them and into the week they were played.
  `guardarPendienteLocal` queues without loading Firebase, since offline the SDK may never have reached
  the phone; the end screen goes straight to it while offline, with no retries, and says
  "📴 Guardado en tu celular".
- **Exactly once.** Records are best-of, so a game sent twice changes no table, but the game counter is
  +1. Each queued game has an id and, before each try, the server's counter (`n0`); a try cut after the
  server took it is seen on the next try (counter past `n0`) and not counted again. Another phone
  playing the same game in between can make it skip one count: an undercount of one, never a double.
- **A full or old queue is said, not hidden.** Past 200 the oldest goes and is counted; past 30 days a
  game is dropped and counted; the reconnect toast says how many and why (`uploadText` in `offline-ui.js`).
- **Storage that lasts.** With the flag on, the page asks `navigator.storage.persist()`: Safari wipes a
  site's storage after about 7 days unvisited unless installed, and with it the queue and the player.
- **Uno al día counts for its day** if it uploads within 48 h: yesterday's, played on this phone and not
  on the server, goes to its day, its week and its month (`uno-al-dia-red.js`); older days go to the
  history only, as before. "The day" is the phone's local date, as for everything in Uno al día. The
  clock is the phone's, so the rules are the guard: they already refuse a day's week sum or points more
  than 48 h back (`w`, `p` in `unoAlDia`) and the day's row needs the history, so a changed clock gets at
  most yesterday. No rule change.
- **Signing in.** The queue waits for its player: signed out, nothing goes; the Firebase sign-in renews
  itself with the signal, from the anonymous id the phone keeps (the same storage `persist()` protects).
- Background Sync is left out: the next open with signal, and the `online` event, are enough.
- La Copa is never queued.

## Caching (amends D-221)

- Pages: network-first with a timeout, cache as fallback, so an online player always gets the latest.
- Assets: cache-first in a cache named after the release version; old caches deleted on `activate`.
- Precache list generated from the manifest: each offline-capable game's folder and its `reuses`, the
  shared JS and CSS, fonts and icons. Not La Copa, not the OG cards, not the panel. About 4 MB today; `precache.test.mjs` fails over 8 MB.
- **Music is never precached**: it is cached once a song plays online; until then offline is silent.
  Sound effects are precached.
- The Firebase SDK on gstatic is cached at runtime when used, for when the signal returns.
- No update prompt is needed: pages are network-first and every module and stylesheet is content-hashed (D-467).
- Big pictures (Dónde's satellite tiles, over 100 KB each) are cached the first time they are seen.

## The PRs (all behind `flag('offline')`)

1. ✅ Decision D-538, this plan, `offlineOk` in the manifest, `offline.test.mjs`.
2. ✅ Service worker caching, behind the flag: `tools/release/precache.mjs` writes `precache.json` at
   publish (about 4 MB: every offline-capable game, what its modules import, shared JS/CSS, fonts,
   icons); `sw.js` stores it when a page reports a new release, pages network-first, `?h=` files
   cache-first, the Firebase SDK kept once loaded; flag off = nothing cached, caches deleted.
   No update toast: pages are network-first and assets are content-hashed, so a new release is
   picked up on the next load with no prompt (`sw.test.mjs`, `precache.test.mjs`).
3. ✅ `connection.js`: probes, hysteresis, the tester switch in `/labs/` and the T tab, a real cut while on (`offline-cut.js` and the service worker: nothing reaches the network, `navigator.onLine` false; `?connection=online` is the way out) (`connection.test.mjs`).
4. ✅ Home page and game covers: dimmed links and two-phone modes with "📡 Con señal", the chip, the
   one-line explanation on tap (`offline-ui.test.mjs`).
5. ✅ Scores: queue of 200 with ids and exactly-once counting, queued without Firebase, end-screen wording,
   reconnect toast with what was lost and why, `storage.persist()`, Uno al día yesterday within 48 h,
   privacy page (`pending-scores.test.mjs`, `offline-ui.test.mjs`).
6. ✅ The first-time sheet (`offline-sheet.js`, once per phone, on the support card's `.hoja`), in es,
   en and pt, with one more line on an iPhone outside the installed app: scores are safest with the app
   on the home screen. Uno al día's page (`today/`) kept offline (`OFFLINE_PAGES` in `games.js`, used by
   the precache and the dimming). New games need no step of their own: every game is offline-capable
   unless it says `offline: false`, and `offline.test.mjs` fails when an offline-capable page (Babel,
   Shinobi and later ones included) imports another site as it opens (`offline-sheet.test.mjs`).
7. ✅ End-to-end (`tools/e2e/offline.mjs`): online the phone stores the site; with the network cut,
   `/zip/`, `/today/` and the home page open in offline mode, the sheet shows once, the chip counts a
   queued game and links that need signal are dimmed; back online it uploads once (counter +1 exactly)
   with its toast. The queue does not try to upload while offline mode is on. The way back (flag off
   forgets the stored files) is `sw.test.mjs`'s.
8. ✅ **An offline palette** (the owner, 2026-11-07; built: `html.offline-shell` in `offline.css`, set by
   `offline-ui.js` on every page that is not a game's, `offline-palette.test.mjs`. Game covers take it
   too (the owner, 2026-11-07): `#screen-intro`, `#screen-setup` or the minigames' `body.antesala`
   (`COVER` in `offline-ui.js`); the play screens keep their colours. No fade yet: the palette switches with the mode): while offline, everything outside the games (home
   page, menus, top bars, sheets, /labs/, Rankings, and the game covers) takes a quieter palette, so
   players feel they are in the offline version of Juegos de Salón. The game screens themselves keep
   their colours. A second set of the design tokens under `html.offline`. Built last, after everything else.
   - **Chosen: "Candlelight"** (the owner, 2026-11-07, from four mockups: blue-grey night, greyscale +
     cyan, candlelight, deep sea): dark warm brown with amber and cream. Starting values:
     `--bg1 #1a120b`, `--bg2 #2a1d12`, `--bg3 #14100c`; `--pink #d9944a` (main accent),
     `--pink-deep`/`--edge-pink #9a5f26`, `--yellow #f0d39a`, `--orange #d9944a`, `--cyan #c9b48a`,
     `--purple #8c6a4a`, `--lime #c8c08a`; `--fondo` glows `rgba(230,150,70,.20)`,
     `rgba(240,200,120,.08)`, `rgba(150,90,40,.25)` over `linear-gradient(160deg, #1a120b, #2a1d12 55%, #14100c)`.
     Colours hard-coded outside the tokens (La Copa and Uno al día cards) are dimmed offline anyway.
   - **Transitions** (built, the owner, 2026-11-07): a page opened while the phone is offline paints its
     first frame in the palette, with no flash of the normal one: each page's first inline script sets
     `html.offline.offline-shell` when the flag is on (`juegos-de-salon:offline-flag`, kept by
     `instalable.js`) and the phone is offline or forced, and the palette lives in `base.css` so it is
     there before anything else loads. Going offline or back online with a page open switches on that
     same screen and crossfades (~600 ms, View Transitions; instant without them or with reduced
     motion). Back online is immediate when the browser says so and a probe agrees; only a recovered
     poor connection still waits for two good probes 10 s apart.
   - **Readable**: text and the dimmed "📡 Con señal" tags on the new background pass WCAG AA contrast
     (4.5:1), checked by a test.
   - **The random game offline** (the owner, 2026-11-07): the 🎲 picks only games this phone keeps and
     can play (`guardados` in `azar.js`), so it never lands on a page that cannot open.
9. Publish: the owner flips `flags/offline` to *all*; RP-13 ✅.

## Risks

- Stale versions: the reason D-221 waited. Network-first pages and content-hashed assets (D-467) are the answer, so no update toast is needed.
- iPhone may drop the cache of a site not added to the home screen after about a week unused: offline
  is reliable in the installed app, and `instalar.js` is where to say so.
- A too-eager "poor connection" would push players out of rooms they could play: start conservative and
  send mode changes to the panel to tune.
- Double uploads: one run at a time, and a cut try is not counted again (`n0`, PR 5); the end-to-end test keeps proving it.
