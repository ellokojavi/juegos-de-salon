# Offline mode (RP-13)

**Status:** approved by the owner (D-538), PRs 1 and 2 of 8 done · **Date:** 2026-11-07 · **Touches:** RP-13, D-221, D-538

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

- `offline` event or `navigator.onLine === false`: on at once.
- Poor connection: a no-cache probe of a tiny versioned file takes over ~4 s or fails twice in a row,
  or Firebase's `.info/connected` stays false for 8 s on a page that needs it.
- Off only after two good probes ~10 s apart, so a flaky signal does not flip the screen.
- One module, `public/assets/js/connection.js`, exposes the state and an event; pages only listen.
- Testers: "Forzar modo sin conexión" on the offline card in `/labs/`. Nothing for players.

## What the player sees

No new control on the home page while online. Offline:

1. **Once, on entering the mode**: a sheet on the dark purple (the existing sheet component) with three
   lines: you can keep playing this phone's games; rooms, La Copa and rankings come back with the
   signal; your scores are saved here and upload by themselves. One button, "Entendido".
2. **While offline**: a slim chip in the existing header, "📴 Sin conexión · 2 por subir". Online-only
   cards and mode chips stay in place, dimmed and tagged **"📡 Con señal"** (Needs signal / Com sinal);
   a tap shows one line: "Este juego necesita conexión. Vuelve cuando vuelva la señal."
3. **End screen**: "Guardado en tu celular. Se sube al volver la señal." instead of the ranking place;
   a new best shows as provisional.
4. **Back online**: one toast, "Se subieron 3 partidas ✓", or how many were refused and why.

Texts in es, en and pt (C-3, D-514), following U-1, U-8 and U-18. The `/privacy/` page is edited in the
PR that changes what is kept on the phone.

## Scores

- The existing queue (`guardarPendiente` / `subirPendientes` in `jugador.js`), raised from 20 to 200
  games, still 30 days, still only for the player who played them and into the week they were played.
- **Uno al día counts for its day** if it uploads within 48 h; the Firebase rules cap `cuando` at 48 h
  back for the daily table and refuse future times.
- Background Sync where the browser has it (Android); elsewhere on the next open, as today.
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
3. `connection.js`: probes, hysteresis, Firebase signal, the tester switch in `/labs/`.
4. Home page and game covers: dimmed cards and modes with "📡 Con señal", the chip.
5. Scores: queue limits, end-screen wording, reconnect toast, Uno al día 48 h, rule caps, privacy page.
6. The first-time sheet and every text in es, en and pt.
7. End-to-end: each offline-capable game with the network cut, then reconnect and check one upload.
8. Publish: the owner flips `flags/offline` to *all*; RP-13 ✅.

## Risks

- Stale versions: the reason D-221 waited. Network-first pages and content-hashed assets (D-467) are the answer, so no update toast is needed.
- iPhone may drop the cache of a site not added to the home screen after about a week unused: offline
  is reliable in the installed app, and `instalar.js` is where to say so.
- A too-eager "poor connection" would push players out of rooms they could play: start conservative and
  send mode changes to the panel to tune.
- Double uploads: already guarded (one run at a time); the end-to-end test keeps proving it.
