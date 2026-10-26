# 🚂 Tren en Vilo (bridge builder, lab)

Build a bridge of wooden beams over a gap, then a train with wagons crosses it; a beam that stretches
too much snaps. Five stages against a 7-minute clock. **Inspired by
[Poly Bridge](https://en.wikipedia.org/wiki/Poly_Bridge)**, and the lab card says so.

## Summary

- **Where:** only in the lab, `/labs/bridges/`, behind the lab's door (D-281, D-284), listed under the
  lab's active projects. Folder `bridges`. Not in `games.js`, Uno al día or the rankings. **In La Copa only by name:**
  registered as `puentes` (`cup/games/bridges/`, the owner's one-day cup of 2026-10-25) but not in `POZO`, so no
  create screen offers it; five crossings drawn with the day's seed from catalog levels 2, 3, 3, 4, 5, and the Grand
  Final skips it (`NOT_IN_FINAL` in `cup/engine.js`). The scene (canvas, drawing, gauge) is `scene.js`, shared by both.
- **Stage:** a prototype for the owner, **Spanish only** (its texts live in the `T` object of
  `game.js`, not in `i18n.js`). It sends no usage signal and has no comment form yet.
- **For whom:** one player.

## How it plays

- Each stage starts with the deck laid (`cubierta()` in `engine.js`, the owner's request): one beam per square
  at y = 0 from bank to bank, since the train always needs it. Those beams cannot be removed (a tap on one
  says so, 🧹 Clear leaves them) and they cost wood like any other, so the counter starts at the gap's width.
- Drag from a marked point (the banks, the anchors, or a beam already placed) to lay a beam of up to
  two squares (or a 1×2 diagonal, `LARGO_MAX`); tap a beam to remove it. ↩ Undo, 🧹 Clear (two taps)
  and 🏳️ Give up (two taps).
- 🚂 Test sends the train (`PIEZAS`: the engine and two wagons that weigh); ✏️ Fix goes back to
  building, with the snapped beams blinking red for 8 seconds (`PARPADEO_MS`). A stage passes when the train crosses and the bridge is
  still standing.
- Each stage has a budget of metres of wood (each beam costs its length; the old catalog counted beams), shown under the
  board as it is spent. The screen's title is the stage ("Etapa 2 de 5"), and under it, always in view, the
  train's weight, drawn small beside it (`trenMini`: the locomotive and a wagon as they will cross): normal, or how much heavier it is (it used to be a sign that slid over the board and went).

- A straight drag longer than one beam is a stroke (`trazo()` in `engine.js`): it lays a beam for each
  step between the grid points on its line (the whole deck in one drag), skipping those already there.
- On wood budgets, a beam may also start or end at a grid point inside another (the middle of a
  two-square beam): that beam is split there (`unirViga()` in `engine.js`), and a new beam that runs over
  a joint is split at it, so every touch on a grid point is a bolt like any other; the wood stays the
  same. Beams join only at those points. Where one crosses another away from their ends, or runs over a bolt it
  doesn't end at, it is drawn in front with a dark edge (`pasoPorEncima()`), so it doesn't read as
  joined there.

## Crossings and catalogs

- Each game draws one crossing per level (1 to 5) from `catalogo-madera.json` (33 crossings, 6 or 7 per level, ordered by the wood their solution needs so each level asks more than the one before: about 9 to 12 m at level 1 up to 29 to 36 m at level 5; about 15,000 combinations): low anchors on the cliff faces,
  stone towers, rock pillars in the water, or a mix. Its budget is the cheapest bridge a search found
  plus the level's spare beams.
- The wood catalog's solutions are readable trusses (`--legible`, owner's request): the cheapest bridge
  the search found could be a tangle of stays at 100 % strain that nobody would build. They start
  from trusses a person would draw (under the deck, over it, or both, tied to the anchors, mirrored on
  a symmetric crossing) and are trimmed only while the peak strain stays at or under 85 %. That bridge
  is the known minimum, the budget's base and the solidity reference.
- `tools/generators/bridges.mjs` builds the catalog (`--nivel n` per level in parallel, `--juntar` to
  join them; `--prueba` / `--madera` for the catalogs under evaluation).
- The wood catalog is the default since the owner chose it over counting beams. `?catalogo=vigas`
  (the beam-count catalog) and `?catalogo=prueba` (tighter budgets, a heavier train per level) load
  the others for comparison.
- `soluciones.json` holds known bridges for the fixed stages; `engine.test.mjs` runs them through the
  physics.

## Score

Each stage passed is worth 10 (`PUNTOS_ETAPA`), plus up to 5 for saving beams or wood against the known
minimum (`PUNTOS_AHORRO`), plus up to 3 for solidity (`PUNTOS_SOLIDEZ`), plus up to 10 for speed (all in
1:30 or less, none when time runs out, scaled by stages passed).

Solidity is relative: the engine records each bridge's peak strain while the train crosses (`pico`, 0 to
1 of the snapping point) and compares it with the catalog's bridge for that crossing (`picoReferencia`).
All of it if it is 15 points lower (`MARGEN_SOLIDO`), none if it is equal or higher. An absolute bar
did not work: the cheapest bridges peak at 90–100 %, and a local search within the budgets barely
lowered that. Since the known bridge is the cheapest, solidity and saving wood pull against each other,
so a perfect 100 is rare.

While the train crosses, a gauge at the top of the board (`medidor()`), titled "Carga" on a plate drawn
like the scene (night sky over a strip of water and rock), shows the strain live: a needle on the hardest-working beam, a red arrow outside the dial at the peak so far (with "máx." and its number under it; the needle itself keeps showing the load right now, also after the test) and a white one at the cheapest
bridge's peak. When a stage passes, a summary opens over the screen (`felicitar()`), the only place it is shown:
the wood against the budget and the known minimum, the peak strain against the cheapest bridge's, the
time on that stage and its points (stage + savings + solidity). It goes with its button, a tap outside,
or on its own after 10 s (`FELICITA_MS`), with a bar that empties; the game's clock stops meanwhile. The result explains
the sum in a table (per stage: wood against the minimum, peak strain against the known bridge's, and
its points as stage + savings + solidity), with a short legend, and shows how an unsolved stage could
have been crossed (the catalog's bridge, the train looping over it, with its peak strain).

## The scene

The day goes by along a game (owner's request): stage 1 is in the morning (blue sky, sun, brown rock),
the middle ones head into sunset, and the last is at night (`timeOfDay(t)` mixes three palettes, `MORNING`, `SUNSET` and `NIGHT`, from
0 = morning to 1 = night). The cover stays at night; the unsolved stage's bridge in the result shows that
stage's time of day.

Pixel art from `pixel.js` (sprites, particles): the train with smoke, steam and headlight, which looks as
heavy as it is (`trenDe`): old passenger cars at weight ×1, then flatcars with crates, logs, coal and
containers, and a green freight locomotive from ×1,75; sparks
when a beam snaps, a splash when something falls, birds now and then. One character per game, at a
random stage and moment: a flying saucer (`?ovni`, `?ovni=mira|pesca`), a whale (`?ballena`,
`?ballena=salto|chorro`) a mole that tunnels through a cliff (`?topo`, `?topo=anteojos|minero`), or a petrol-green boat
with a wakeboarder towed from its tower roof by a black rope, riding its wave (`?wake`, `?wake=carve|jump|fall|sink`: carving the wave, a jump off its
crest, a fall and the boat turning back with an orange flag raised to pick the rider up, or the rider sinking, only the head popping up,
and the boat coming back with a small orange flag raised). The boat comes out from just behind a cliff and
crosses slowly, not from the screen's edge, so it stays in view over a phone's narrow water.
It comes 5 to 25 s into its stage; if the stage is passed first, it moves to the next one and comes
3 s in (`mudarVisita`), and one that doesn't fit the crossing (the whale in narrow water, the mole with
no rock to dig) hands over to the boat or the saucer (`noCabe`). These only appear in the game, never on the cover.
The cover (`portada()`) loops a demo train over a bridge; once it is gone, the empty bridge rests 3 to 5 s
before the next one comes.
Their parameters are internal: they work from a local server or the Tailscale link, and on the site
only for someone who came in with a lab key (`INTERNO` in `game.js`), so a player without one never
calls a visitor by hand.

### The house style (owner-approved; `?style=pixel` for the old art)

Players said the pixel art does not look like the rest of the app, and Stick Ninja does (owner's request,
2026-10-25). The lab's game is now drawn in the house style (`neon.js`), approved by the owner the same day
with all its pieces (the scene, the bullet train and the visitors); `?style=pixel` brings back the pixel
art there ("👾 La versión anterior, en pixel" on the lab card), and La Copa's screen keeps the pixel art
unless `?style=neon` (`NEON` in `scene.js`). Smooth shapes and soft glows, the home page's
palette and Stick Ninja's night. The cliffs and pillars are dark silhouettes with a neon edge, two ranges
of hills stand behind the gap, the beams are glowing rods in the house's yellow that warm to pink and red
with the strain, the fixed joints are pink lights. The day keeps going by in the house's colors: a bright
blue morning with white clouds (the first neon palettes were all so dark that every stage read as night;
the owner asked for a real day, 2026-10-26), a sunset in the title's yellow → pink, the home page's night. The page gets the `tv-neon` class (a
glass gauge, no pixelated train beside the title).

The owner found that first neon train too childish and asked for smoother, more modern options with a
metallic finish. Of four designs (a chrome bullet train, a 1930s art deco streamliner, a brushed aluminium
metro and a glossy black one outlined in neon) the owner chose the bullet train, and asked for the same
nose at both ends, since such a train runs either way, and for colors. `trains.js` draws it: the last car
is the front car turned around, with red tail lights, drawn 3 art units back because it is longer than the
wagon whose place it takes. Its wheels are small and barely peek under a low dark skirt, so it seems to glide along the
deck while still touching it (owner's request). It is the neon style's train (`?train=clasico` brings back the first one), in
seven colors (`BALAS`: silver, pearl, graphite, ruby, gold, mint, lilac; `?train=bala-rubi`…), all shown
at `/labs/bridges/trains/` ("🚄 Los colores del tren bala" on the lab card), each with a button to play
with it. Each stage draws its color at random, never the same as the stage before (`trenDe(e)` in `neon.js`, the
owner's request): the color is only paint, the weight stays the stage's, in the physics and in the title,
and the small train beside the title has the stage's color (`trenMini(carga, e)`).
Each stage draws only the colors whose body stands out against that stage's sky and far hills (WCAG
contrast ratio of at least 1.8, `CONTRASTE_MIN` and `balasPara(t)` in `neon.js`, owner's request): in the
morning only pearl, at sunset silver, pearl, gold and mint, at night all seven. If no color passed, the
one that stands out the most is used; `contrast.test.mjs` checks every stage has one.

The visitors live in `visitors.js` (when each comes and what it does), shared by both styles: they draw
through a renderer, the pixel one or `neon-visitors.js`'s `pincel`, which has the same methods and draws
each pixel sprite as shapes (a chrome saucer with a glass dome and blinking lights, an orange fish, a
whale with a pale grooved belly, a velvet mole with a pink nose, a glossy petrol-green boat and its rider),
plus four pieces drawn whole (the saucer's beam, the boat's wave, the rider in the water, the flag).
The whale leans steeply going out and coming back (owner's request), and leaps higher than before (in both styles).
`/labs/bridges/visitors/` ("🛸 Los visitantes" on the lab card) shows them up close, with buttons that play
a game where each one comes in stage 1.

Its sprites also draw the home page's first teaser (D-430): `tren-en-vilo-pronto`, on through
2026-10-28, a GIF of a train stopping at the edge of a gap, no name and no link, made by
`marketing/splash/teaser.mjs` from `marketing/splash/teaser/bridges.html`, which imports `pixel.js`.
A sprite changed there changes the teaser only once the GIF is remade.

## Exceptions to the canons (while in the lab)

- Spanish only, no i18n (C-3) and no usage signal: a local prototype.
- Its URL parameters (`?catalogo`, `?ovni`, `?ballena`, `?topo`) are Spanish (`?wake` is already English) and read directly with
  `URLSearchParams`, not through `parametros.js` (C-18, D-266). To be settled before it leaves the lab.
