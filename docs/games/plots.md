# 📐 Loteo (Plots · Loteamento · Parzellen)

A one-player logic puzzle (D-310): a grid with some numbers is split whole into rectangles, the
**plots** (*lotes*), each with exactly one number, which says how many squares it has. Every board has
a single solution that is deduced without guessing. **Inspired by
[Shikaku](https://en.wikipedia.org/wiki/Shikaku), by Nikoli (1989)**, and the waiting room says so,
with the link. It was built under the working name «Parcelas» (hence the folder `plots`); the owner
chose Loteo before publishing it.

## Summary

- **Where:** its own page, `https://juegosdesalon.cl/plots/`, on the home page (logic, 5–15 min), in
  the four languages (C-3). Id `loteo` (rooms, rankings, signals, `localStorage`), folder and slug
  `plots`. It left the lab in D-332: `/labs/plots/` and `/minigames/plots/`, `/minijuegos/loteo/`
  are bridges to `/plots/`.
- **In La Copa:** it is in `POZO`, so a week can pick it; it is not part of the Gran Final. The admin
  picks the variant for that day below the week (`loteo` or `loteo:utilities` in the calendar, D-331).
- **Two variants** (D-331): 🔢 **Numbers** (`numbers`, the default) and ⚡💧 **Utilities**
  (`utilities`, D-311). Standalone, the player picks one in the waiting room; the phone remembers it
  (`juegos-de-salon:loteo:variant`) and `?mode=utilities` / `?mode=numbers` in the link goes straight
  to it. Each variant ranks in its own table (`loteo` and `loteo_utilities`). In Uno al día
  (`?today`, D-334) it is always Numbers, with no picker, and the phone keeps the remembered variant.
- **For whom:** one player.

## The waiting room

The same as every La Copa game (`public/cup/game.js`, `practica()` standalone and `antesDeJugar()` in
a cup), with what Loteo brings in `public/cup/games/plots/ui.js`:

- **`portada`**, on top: a board that solves itself, plot by plot (a 5×5 of numbers, or a 4×4 of
  utilities in plots of 4 with «Lotes de 4 casillas» above it): the frame grows from one corner to
  the other, as when dragging, and the plot takes its color. At the end the board dims and «¡Listo!»
  appears big in the middle; then another board. With reduced motion it stays solved and still.
  Its square is reserved even while empty, and where the variant picker is shown the «Lotes de 4 casillas» row is kept (hidden) in
  Numbers, so switching variants never moves the title or what is below it (owner's report,
  2026-10-21; `tools/e2e/plots/utilities.mjs` checks the title stays put both ways).
- **`titulo`**: the name, and under it «Inspirado en Shikaku, de Nikoli (1989).» with the link.
- The variant picker (the cup's two buttons: «🔢 Números · Cada número, su lote» and «⚡💧 Servicios ·
  Un ⚡ y un 💧 por lote»). Picking one redraws the waiting room with that variant's steps, drawing,
  top board and ranking.
- **`ejemplo`**, the drawing in «Cómo se juega» (also in the folded rules while playing): a right
  4×4 (✅ «Cada lote, del tamaño de su número» / «Cada lote, con un ⚡ y un 💧») and a wrong 2×2 plot
  (❌ «Dos números en un lote» / «Dos ⚡ en un lote»), hand-made.
- The steps (`texts.js`, U-18). Numbers:
  1. Divide el tablero en lotes: rectángulos con un solo número cada uno.
  2. El número dice cuántas casillas tiene su lote: un 6 puede ser de 2×3 o de 1×6.
  3. Arrastra de una esquina a otra para dibujar un lote y tócalo para borrarlo. Son 5 tableros contra
     el reloj.

  Utilities (its `como` replaces the steps):
  1. Divide el tablero en lotes rectangulares del tamaño que dice arriba.
  2. Cada lote lleva un ⚡ y un 💧, ni más ni menos. Si un lote deja una casilla sin lote posible, no va.
  3. The same third step.
- Scoring: «Cada tablero vale 12 puntos. Con los 5, la rapidez suma hasta 40: 40 en 5 minutos o menos
  y 0 en 15. Cada ayuda resta 10.»; in a cup, the tie-break «Si empatas, gana quien tardó menos.».

Start goes through the shared 3, 2, 1 countdown («¡A jugar!»; the lab's «¡A lotear!» is gone) and the
time counts from there, paused with the screen hidden (U-20); the ⏱ elapsed time shows in the play head, since speed is up to 40 points and there is no countdown (D-384, a player's request in #563; corrects D-379 for this game).

## How it plays

- **Five boards per variant** (the owner's request): «Tablero n de 5», with a dot per board that turns
  green when solved.
  - Numbers (`ETAPAS`): two to warm up, 5×5 and 6×6, and three hard ones, 7×7, 7×7 and 8×8, with
    bigger plots, none in sight at the start and more deduction steps. The numbers are spread out.
  - Utilities (`ETAPAS_SERVICIOS`): 6×6 in plots of 3 and 6×6 in plots of 4 to warm up; 6×6 of 6
    and two 8×8 of 8, hard (D-312): no obvious plot at the start, deeper deductions, and the icons
    close to the neighbour's. «Lotes de n casillas» goes above the board.
- **Drawing:** drag from one square to another; the white frame shows the rectangle and the notice
  above, its size («2×3 = 6»). On release:
  - if it is valid, it is painted in a light color (two neighbouring plots never the same) and its
    number stays on top, dark. It replaces the plots it overlaps;
  - if not, the frame shakes in red and the notice says why. Numbers: «Ese rectángulo no tiene
    número.», «Tiene 2 números: cada uno va en su propio lote.» or «El 6 pide 6 casillas; ese tiene
    4.» (singular for the 1). Utilities, in this order: «Ese lote tiene 3 casillas; cada lote tiene
    4.», «Tiene 2 ⚡: cada lote lleva uno.», «Le falta 💧.».
- **Tapping** a plot erases it («Lote borrado.»); tapping a 1 draws it (it is its own plot); tapping
  another square reminds the gesture («Arrastra de una esquina a otra para dibujar un lote.»).
- **Board done:** when the plots cover it, it shines («📐 ¡Tablero n listo!») and the next one comes.
- **The hard ones of Utilities:** on reaching board 3, the first hard one, the notice says «Difíciles:
  si un lote deja una casilla sin lote posible, no va.» (only there).
- **Below, three equal controls in one row** (the owner's request), the cup's words:
  - **↩️ Deshacer** (the shared `deshacer.js` button): back to before the last move (draw, erase a
    plot, clear the board or a hint); free. It does not go back to an earlier board, and undoing a
    hint does not give its points back.
  - **🧹 Borrar todo:** asks for a second tap («🧹 ¿Seguro?», 3 seconds) and empties the board («Borraste
    el tablero: ↩️ Deshacer lo trae de vuelta.»). Off with the board empty.
  - **🏳️ Rendirse:** asks for a second tap («🏳️ ¿Seguro?»). One armed button at a time.
- **💡 Ayuda (−10), apart**, smaller, below the row: it is not a board control. A second tap («Toca de
  nuevo (−10)») places a plot of the solution that was not right, with a dashed border («💡 Ese lote
  va así.»).
- **The end:** solving the fifth board or giving up stops the clock right there (D-130). The stamp
  goes above the board («¡Todo loteado!» over the last board, shining; or «Te rendiste.» and «Así se
  resolvía el tablero n.» with the solution drawn), with «Ver resultado» under it, in sight without
  scrolling.
- **Score, out of 100 (D-113):** 12 per solved board and, only with all five, up to 40 for speed (40
  in 5 minutes or less, 0 at 15 or more, in a straight line between). Each hint takes 10; never below
  0. Giving up keeps the boards already solved.
- **The result** is the cup's: the score, the card, the time and «Cómo se calculó tu puntaje» with
  Loteo's own breakdown (`desglose`): «📐 Tableros (5 de 5): +60.», «⏱ Rapidez (6:30): +34.» (or «⏱
  Rapidez: +0 (faltaron tableros).») and «💡 1 ayuda: −10.».
- **Sharing:** the card says which boards were solved («✅ 5×5  ✅ 6×6  ⬛ 7×7  ⬛ 7×7  ⬛ 8×8») and the
  hints, without giving the solution away. The variant goes with the name («Loteo · ⚡💧 Servicios»)
  and its link carries `?mode=utilities`.
- **The trial session** (D-103, 🧪 before a cup day): the two warm-up boards of the variant, with
  other boards; the same 60 and 40 are shared between the two and the speed limits shrink in
  proportion (1 and 3 minutes).

## In La Copa

- The boards of a day come from the cup's code, the day and the variant, the same for every player
  (`generarDia(code, day, { variante })`). Standalone, each game is a new random code with day 1.
- The moves are saved as a list (`d:f1,c1,f2,c2` draw, `e:f,c` erase, `a` hint, `x` clear, `u` undo,
  `r` give up) through `ctx.guardar`, and the game is rebuilt from `p` and that list
  (`motor.partida`): a reloaded day goes on where it was, also on a later board.
- Building the hard Utilities boards takes about half a second, so `ui.js` exports `caro = true` and
  the waiting room builds them while it is read (`precalentar`); `generarDia` keeps what it built.

## How it works

- `public/cup/games/plots/engine.js`: `generar(seed, { lado, dificil })` splits the grid at random
  (the first free square gets a rectangle chosen by its area: in the easy ones areas 3 to 8 are
  liked, 2 little and 1 almost never; in the hard ones 4 to 10 and almost no 1 or 2; cap 8, 9, 10 or
  12 by size), drops splits with many 1s (none in the hard ones) or few big plots, and places the
  numbers with `repartir`: each in the square of its plot farthest from those already placed,
  penalising neighbours and, in the hard ones, favouring squares away from the plot's corners (the
  plots' order is shuffled with Fisher-Yates, so every browser gets the same). It asks
  `resolver(t, 2)` (one solution) and `deducir(t)` (solved without guessing); if not, another
  placement (6 times) and then another split. The easy ones keep the first that works; the hard ones
  build 8 and keep the hardest (more rounds of `deducir`, fewer plots in sight at the start).
  `deducir` solves like a person: it places the clue with a single rectangle left that fits and, if
  none, makes a clue cover the free square only it reaches; it returns `{ resuelto, rondas, deEntrada }`.
  `resolver` backtracks clue by clue, always the one with the fewest possible rectangles, and prunes
  when a free square can no longer be covered. `validar(t, r)` says whether a rectangle is valid
  (`sin-numero`, `dos-numeros` or `area`); `poner` adds one, removing the ones it overlaps;
  `resuelto`, `pista` (the hint), `puntajePartida(hechas, segundos, ayudas, total)` and
  `tarjeta(hechas, ayudas, etapas)`. `generarEtapa(seed, n)` uses `<seed>:etapa-<n>`.
- Utilities: `generarServicios(seed, { lado, tam, servicios, dificil, exige })` splits the grid into
  plots of `tam` (`partirIguales`, with backtracking), puts one icon of each utility in different
  squares of each plot with `ubicarIconos` (easy: at random with Fisher-Yates; hard: preferably on
  the edge of the plot that touches another, near the neighbour's icons) and asks
  `resolverServicios(t, 2)` (cover the grid with possible plots, counted by `lotesPosibles` with
  prefix sums) and `deducirServicios`. The easy ones keep the first that comes out with the simple
  rules. The hard ones (D-312) only count if they show no plot at the start and ask for at least
  `exige` deep deductions (3, 4 and 6); of 8 that count (up to 6000 tries) they keep the hardest, and
  if none counts, the best spare one. `generarEtapaServicios` builds the two final 8×8 together and
  puts the harder one fifth: one day in four the fourth came out harder («El penúltimo me costó más
  que el último», #401). `deducirServicios(t, { avanzado })` repeats the simple rules (`propagar`):
  (1) an icon or square that fits a single possible plot fixes it; (2) a square whose possible plots
  all carry the same ⚡ (or 💧) makes that icon's plot cover it. With `avanzado` it looks one step
  ahead when they get stuck: a plot that leaves a square with no possible plot is out. No 🌐: a third
  utility was measured and gives more unique boards, but easier ones (D-311).
- The day (D-331): `VARIANTES`, `etapasDe(variante, ensayo)`, `generarDia(code, day, { variante,
  sal, ensayo })` → `{ semilla, variante, ensayo, tableros }` (each board with its `dificil`), cached;
  `jugada` (the move codes) and `partida(p, jugadas, { color })` → `{ k, t, parcelas, historial,
  hechas, ayudas, rendido, fin, n, ultima }`.
- `ui.js`: `montar`, `resultado`, `desglose`, `ejemplo`, `portada`, `titulo` and `caro`. The board has
  three layers (the squared background, the plots and the numbers) and the drag frame on top; the
  drag is Rutas rotas' (`pointerdown/move/up` with `setPointerCapture`). Numbers are sized with
  container units, so the same rules serve the 8×8, the demo and the drawing.
- `texts.js`: the texts in the four languages, merged into `rules.js` (`juego` and the `lt*` keys of
  `ui`); `portada` and `titulo`, which get no `T`, read it directly with the page's language.
- `style.css`: every selector starts with `.lt-` (the cup's style.css is shared).
- The test hook, `window.__loteo = { P, dibujar(r), tocar(f, c) }`: the state (`P.p`, `P.t`,
  `P.etapa`, `P.parcelas`, `P.ayudas`, `P.terminado`…), and drawing a rectangle or tapping a square
  through the same path as the finger.
- Tests: `engine.test.mjs` checks the validation, the solver (one, two and no solutions), that the
  boards of every stage (200 easy, 80 hard; Utilities 120 and 40) have one solution, are deduced
  without guessing, pass the validation and are built quickly, that the numbers almost never touch,
  that the hard ones are harder, the hint and the score; and `generarDia` (deterministic per code, day
  and variant, the variant changes the boards, the trial is shorter with other boards) and `partida`
  (draw, erase, hint, clear, undo, give up, boards that move on). End to end, `tools/e2e/plots/numbers.mjs`
  and `tools/e2e/plots/utilities.mjs` play the page `/plots/` in each variant (`WIDTH=320` at 320 px).

## Exceptions to the canons

- The drag is Rutas rotas', not `assets/js/arrastre.js` (C-8): it draws a rectangle on the grid, it
  does not carry a piece from one place to another, and releasing does play (undo is free).
- The 8×8 squares measure about 42 px at 375 px wide and about 36 px at 320 px; the gesture is
  dragging over the whole grid, not tapping a small square.
- Giving up asks for a second tap on the same button (as in the lab, the owner's request), not the
  cup's `confirm()` of Reinas: U-15 is met with the second tap.
