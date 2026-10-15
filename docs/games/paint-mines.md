# 🖌️ Pintaminas (Paint Mines · Pinta-Minas · Malminen)

A one-player color Minesweeper (D-289): each cell **is painted** (in the drawing's real color, D-298)
**or not**, and its number says how many of its 8 neighbors are like it (D-290). Painted whole, it
reveals a drawing. **Inspired by [ColorSweeper](https://store.steampowered.com/app/3128730/ColorSweeper/),
by ARRKKA**, and the waiting room says so, with the link.

## Summary

- **Where:** its own page, `https://juegosdesalon.cl/paint-mines/` (generated from
  `public/cup/suelto/index.html`), on the home page in the four languages, and a day of La Copa:
  it is in the cup's pool (`POZO`), not in the Gran Final (D-332). Id `pintaminas` (rooms, rankings,
  `localStorage`, the panel); the folder and the URL are `paint-mines`.
- **For whom:** one player.
- **Variants** (D-331): `easy` (one color, the default) and `hard` (⚡ two colors). Standalone, the
  player picks one with the lever in the waiting room; in a cup, the admin picks one for that day
  and everyone plays it. In Uno al día (`?today`, D-334) it is always easy, with no lever, and the
  phone keeps the variant picked standalone.
- **History:** a lab prototype from v0.161.0 (D-289): the brushes from v0.161.1, the hard mode
  from v0.162.0 (D-291), the 💡 hint from v0.163.0 (D-292), giving up (D-296), the drawings' real
  colors from v0.168.3 (D-298). It left the lab with Rutas rotas and Loteo (D-332): the lab page
  `/labs/paint-mines/` is now a bridge to `/paint-mines/`.

## Rules

- **Board:** 7×7. Some cells come given, with their color and their number (on average 1 or 2 in
  easy and 5 in hard: the rest follows by deduction). It is always solved without guessing.
- **Brushes:** «Pinta {color}» (the drawing's color) and «No pinta» (grey, like unpainted cells);
  three in hard («Pinta rojo», «Pinta verde», «No pinta»). The chosen one shows. Tapping an unknown
  cell paints it with the brush.
- **A hit** shows its number, which gives more clues. **A miss** uncovers the cell anyway with its
  true color and a red border, and subtracts 15 («❌ Se pintaba de rojo: −15.» / «❌ No se pintaba: −15.»).
  On top: the mistakes and how many cells are left.
- **💡 Hint (−10)** (D-292, #351): the first tap turns the button into «Toca de nuevo para usar la
  ayuda (−10)» for 3 seconds and the second one charges it, as in El caso. It marks, pulsing in
  yellow, a cell that can be deduced from what is visible, and the numbers that explain it; it does
  not say its color. While that cell stays unpainted, «💡 Ver la ayuda» shows it again for free
  (also after reloading a cup day: the move keeps the cell).
- **🏳️ Give up** (D-296): next to the hint, in a row of two equal buttons; it asks for a second tap
  («🏳️ ¿Seguro?»). The drawing is uncovered, with what was missing dimmed.
- **The end:** the numbers go, the unpainted cells dim, the paint glows and it says what it was
  («🐟 ¡Era un pez!»), with a stamp (¡Perfecto! with no mistakes and no hints, ¡Pintado! otherwise,
  Te rendiste) and «Ver resultado».
- **Score: 0 to 100 in both variants** (D-113, D-332): 100 − 15 per mistake − 10 per hint, never
  below 0. Giving up, it is worth the painted part (painted 40 % → 40 % of that). The lab's ×1.5 of
  the hard mode (D-291) is gone: in a cup everyone plays the same variant, and standalone each
  variant has its own ranking table. Tie-break in a cup: the faster player.
- **Sharing:** the card shows where the mistakes were (🟥 on a ⬛ grid), not the drawing, so as not
  to spoil it for whoever plays the same board.

## Modes

- **Standalone** (`/paint-mines/`): a random board every time (the framework's seed); the lab's
  "board of the day" went away (D-332). The waiting room, top to bottom: the cover (a real game in
  small that paints itself one cell at a time, in the order a player would deduce them, and says
  «🐟 ¡Era un pez!», in the variant's colors), the title with the 🖌️ that paints, the languages,
  **the lever**, «Cómo se juega» (the example drawing, the steps, the ColorSweeper credit) and the
  scoring, Start (through the 3, 2, 1 countdown), the player and the ranking.
- **The lever** (D-291, D-292): a lever on a metal plate with the ball's track engraved, a
  `role="switch"`. «Modo fácil · Un color» / «⚡ Modo difícil · Dos colores». Up: a short flash
  over the whole view (not when going back to easy), the plate electrifies (it flickers cyan and
  yellow, ⚡ sparks), sound and vibration, and the whole rectangle glows and flickers at random like
  a light with a bad contact (still with reduced motion). Flipping it redraws the waiting room with
  the variant's steps and cover; the new lever swings from the old position. The phone remembers it
  (`juegos-de-salon:pintaminas:variant`) and the link says it (`?mode=hard`; the lab's `?colors=2`
  still opens hard).
- **The hard variant:** the drawings of `DIBUJOS2` in their two real colors, three brushes and an
  electric border on the board; a fulfilled number no longer says what color the rest are, only that
  they are not its own. The second color carries thin stripes on its cells and brush (#349), until
  the drawing is revealed. The **page background** turns night blue (`body.modo-dificil`, the
  owner's request) in the waiting room, the game and the result, and goes back to the usual purple
  anywhere else.
- **La Copa:** the board comes from the cup's code, the day and the variant, the same for everyone.
  The day's card, its waiting room and its rules say the variant under the game's name («Fácil» /
  «⚡ Difícil»). The moves are saved as they are played: a reloaded day resumes where it was.
- **Trial session** (D-103): the same variant, another board, with given cells added until only
  15 are left to paint.
- **Rankings** (D-331): `pintaminas` for easy (with the Cup tab) and `pintaminas_hard` for hard.

## Flow

1. Waiting room → Start → 3, 2, 1 → the board (the clock starts when the board shows).
2. Each move goes through `ctx.guardar`. Painted whole (or given up), the clock stops at that moment
   (`ctx.pararReloj`, D-130) and, in a cup, the result is sent right then (D-150).
3. «Ver resultado» (or «Terminar la prueba» in the trial) → the framework's result: the score, the
   card, the time, the breakdown («Partes con 100 puntos. · 1 error: −15. · 💡 1 ayuda: −10. ·
   Total: 75 puntos.»), share, play again, report a problem and the ranking.

## Message protocol

None: one player, one phone. In a cup the result goes to Firebase like every cup game
(`{ s, ms, t, r }`), and the moves stay in the attempt (`intento`) on the phone.

## Files

- `public/cup/games/paint-mines/dibujos.js`: 17 one-color drawings of 7×7 (`#` painted, `.` not)
  and the 10 two-color ones of `DIBUJOS2` (`#` and `+`, at least 4 of each), each with an `id`, an
  emoji and its real `colores`; all irregular (a symmetric one can be guessed by mirroring and the
  test rejects it, D-290), between 12 and 40 painted cells. `PALETA`: the 9 colors, by id, with their
  hex and emoji square; never yellow with orange together (D-298). The data is language-free: a new
  drawing also needs its sentence in `texts.js`.
- `public/cup/games/paint-mines/engine.js`: `resolver(sol, dadas)` deduces like a player, with the
  colors each cell can still have (one or two colors): each known cell says how many of its unknown
  neighbors are its color; if all or none, they are known; and if one cell's unknowns are all among
  another's, the difference too. `generar(seed, { colores })` picks a drawing (maybe mirrored), adds
  given cells at random until `resolver` finishes it and removes the extra ones. `generarDia(code,
  day, { variante, sal, ensayo })` is the cup's and the standalone page's board (D-331), the trial
  with `LIBRES_ENSAYO` (15) cells to paint. `ayuda(sol, known)` stops at the first deducible cell:
  `{ celda, por }` or `null`. `estado(t, moves)` rebuilds the game from `{ i, color }`,
  `{ ayuda: true, c }` and `{ rendido: true }`; `puntaje(e)` and `tarjeta(e)`.
- `public/cup/games/paint-mines/ui.js`: `montar` (the board), `resultado`, `desglose`, `portada`,
  `titulo`, `ejemplo` and `selector` (the lever). It also keeps the hard background in step with
  the screen (`fondo()`, one `MutationObserver`). Test hook: `window.__pintaminas`
  (`{ p, jugadas(), estado() }`).
- `public/cup/games/paint-mines/texts.js`: the steps, scoring and variants in `juegos`, and the
  screen's keys (`pm…`), the drawings' sentences (`pmDibujos`) and the colors (`pmColores`), in
  es, en, pt and de.
- `public/cup/games/paint-mines/style.css`: every rule under a `.pm-` class, plus
  `body.modo-dificil`.
- Tests: `public/cup/games/paint-mines/engine.test.mjs` (the drawings, 300 boards of each variant
  solved without guessing and without extra given cells, hints until the end, the state, the score
  0 to 100 in both variants, giving up as a move, `generarDia` deterministic per code, day and
  variant, hard in two colors and the trial shorter); `tools/e2e/paint-mines/game.mjs` plays the
  standalone page: the lever, a game with one mistake and one hint (75/100), 320 px, a hard game
  with no mistakes (100/100) and giving up.

## Exceptions to the canons

- **The page background changes with the variant** (D-291, the owner's request): the only game
  that recolors the whole page. It is scoped to this game's screens: `fondo()` clears it on any
  screen that does not show it.
- **The waiting room has its own variant picker** (the lever, D-331) instead of the usual two
  buttons.
- **The cells are under 44 px at 320 px** (C-8): seven across do not fit 44 px each in 288 px
  (about 38 px each), as in the lab. `look.mjs` flags it; the brushes and the buttons are 44 px or
  more.
