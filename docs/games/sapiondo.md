# 🐸 Saporín (lab, in Juegos en prueba)

A solo arcade highway crossing built for mobile touch controls and deterministic Cup play.

## Summary

- **Where:** `/labs/sapiondo/`, behind the lab's door (D-281, D-395), `noindex`, listed in `/labs/` under 🎲 Juegos en prueba. Not in `games.js` while in the lab. Id `sapiondo` in stats and `localStorage` (`juegos-de-salon:sapiondo:session`, `juegos-de-salon:sapiondo:best`). Facts live in `game.json`.
- **For whom:** 1 player, seeded tracks (`?seed=<n>`) for repeatable competition. Languages: es, en, pt (C-3).

## Rules

Cross 33 rows across three escalating sectors (Suburb Ave, City Highway, Night Expressway) and a **water canal with passing boats** (`row 22`, after the safe riverbank at `row 21`) to reach the pond.

- **Movement:** Board-wide swipes (forward, left, right — no going backward), with edge padding and `touch-action: none` to prevent browser scroll/navigation conflicts, plus keyboard support. Lateral hops fire immediately on swipe; forward swipes wait for release so a long forward swipe (`2.4` tiles) previews the glowing `DASH` arrow.
- **Water Canal & Boats:** At `row 22`, either **Dash** over the canal (`21 → 23`) or hop onto a **passing boat** (drifting with it across the water). Missing a boat splashes `-1 ❤️` and returns you to the shore (`row 21`) with `1.5 s` ghost invulnerability.
- **Dash (`⚡`):** Starts with `3` charges (`⚡⚡⚡`). A long forward swipe leaps 2 lanes forward over traffic.
- **Close-Call:** Passing within a narrow bumper margin (when not in ghost mode) triggers celebratory UX (particles, sound, popup) and restores `+1 ⚡` Dash charge (0 points).
- **Lives & Ghost Mode:** `3` lives (`❤️❤️❤️`); getting hit deducts 1 life (`-1` point) and grants `1.5 s` of pulsing transparent ghost invulnerability.
- **Fruits:** Strawberries, Mangoes, and Golden Starfruit spawn on road lanes, award `+1` point each, and restore `+1 ⚡` Dash charge.
- **Scoring:** `+1` per lane progressed, `+10` on reaching the finish, `+1` per fruit taken, `-1` per life lost (clamped `>= 0`). In La Copa, ties among finishers break by faster completion time; crashed runs tie-break by distance reached.
- **Seasonal Shirts:** The frog's shirt adapts by calendar date (`halloween`, `thanksgiving`, `christmas`, `newyear`, `winter`, `summer`, or default arcade jersey; overridable via `?season=<id>` and disabled under `?test`).

## Modes

Solo (`solo`), with deterministic seeded tracks (`?seed=<n>`) ready for Cup integration.

## Flow

Intro (cover, resume panel, solo mode, 3-step rules, site footer) → Play (2.5D canvas stage, top HUD, board-wide swipe controls + live Dash gauge) → Result (itemized breakdown: lanes, fruits, elapsed time tie-break, total; replay same seed or new seed; share through `compartir.js`; exits from `fin.js`, C-19).

## Message protocol

None: single-player. Active runs are serialized (`serialize` / `hydrate`) into `createSessionStore` (C-6) for resume across reloads.

## Files

- `public/labs/sapiondo/`: `game.json`, `index.html`, `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`, `scene.js`, `game.js`.
- `tools/e2e/sapiondo/game.mjs`: end-to-end play script (`window.__sapiondo`).

## Exceptions to the canons

None.
