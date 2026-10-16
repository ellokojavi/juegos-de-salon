# 🚂 Tren en Vilo (bridge builder, lab)

Build a bridge of wooden beams over a gap, then a train with wagons crosses it; a beam that stretches
too much snaps. Five stages against a 7-minute clock. **Inspired by
[Poly Bridge](https://en.wikipedia.org/wiki/Poly_Bridge)**, and the lab card says so.

## Summary

- **Where:** only in the lab, `/labs/bridges/`, behind the lab's door (D-281, D-284), listed under the
  lab's active projects. Folder `bridges`. Not in `games.js`, La Copa, Uno al día or the rankings.
- **Stage:** a prototype for the owner, **Spanish only** (its texts live in the `T` object of
  `game.js`, not in `i18n.js`). It sends no usage signal and has no comment form yet.
- **For whom:** one player.

## How it plays

- Drag from a marked point (the banks, the anchors, or a beam already placed) to lay a beam of up to
  two squares (or a 1×2 diagonal, `LARGO_MAX`); tap a beam to remove it. ↩ Undo, 🧹 Clear (two taps)
  and 🏳️ Give up (two taps).
- 🚂 Test sends the train (`PIEZAS`: the engine and two wagons that weigh); ✏️ Fix goes back to
  building, with the snapped beams marked. A stage passes when the train crosses and the bridge is
  still standing.
- Each stage has a budget of metres of wood (each beam costs its length; the old catalog counted beams) and a sign with it; heavy
  levels say how much heavier the train is.

## Crossings and catalogs

- Each game draws one crossing per level (1 to 5) from `catalogo-madera.json`: low anchors on the cliff faces,
  stone towers, rock pillars in the water, or a mix. Its budget is the cheapest bridge a search found
  plus the level's spare beams.
- `tools/generators/bridges.mjs` builds the catalog (`--nivel n` per level in parallel, `--juntar` to
  join them; `--prueba` / `--madera` for the catalogs under evaluation).
- The wood catalog is the default since the owner chose it over counting beams. `?catalogo=vigas`
  (the beam-count catalog) and `?catalogo=prueba` (tighter budgets, a heavier train per level) load
  the others for comparison.
- `soluciones.json` holds known bridges for the fixed stages; `engine.test.mjs` runs them through the
  physics.

## Score

Each stage passed is worth 12 (`PUNTOS_ETAPA`), plus up to 5 for saving beams or wood against the known
minimum (`PUNTOS_AHORRO`), plus up to 15 for speed (all in 1:30 or less, none when time runs out,
scaled by stages passed). The result explains the sum in a table and shows how an unsolved stage
could have been crossed (the catalog's bridge, the train looping over it).

## The scene

Pixel art from `pixel.js` (sprites, particles): the train with smoke, steam and headlight, sparks
when a beam snaps, a splash when something falls, birds now and then. One character per game, at a
random stage and moment: a flying saucer (`?ovni`, `?ovni=mira|pesca`), a whale (`?ballena`,
`?ballena=salto|chorro`) or a mole that tunnels through a cliff (`?topo`, `?topo=anteojos|minero`).
These only appear in the game, never on the cover.

## Exceptions to the canons (while in the lab)

- Spanish only, no i18n (C-3) and no usage signal: a local prototype.
- Its URL parameters (`?catalogo`, `?ovni`, `?ballena`, `?topo`) are Spanish and read directly with
  `URLSearchParams`, not through `parametros.js` (C-18, D-266). To be settled before it leaves the lab.
