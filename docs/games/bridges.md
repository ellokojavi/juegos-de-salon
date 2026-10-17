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
  building, with the snapped beams blinking red for 8 seconds (`PARPADEO_MS`). A stage passes when the train crosses and the bridge is
  still standing.
- Each stage has a budget of metres of wood (each beam costs its length; the old catalog counted beams), shown under the
  board as it is spent. The screen's title is the stage ("Etapa 2 de 5"), and under it, always in view, the
  train's weight, drawn small beside it (`trenMini`: the locomotive and a wagon as they will cross): normal, or how much heavier it is (it used to be a sign that slid over the board and went).

- Beams join only at their ends. Where one crosses another away from their ends, or runs over a bolt it
  doesn't end at, it is drawn in front with a dark edge (`pasoPorEncima()`), so it doesn't read as
  joined there.

## Crossings and catalogs

- Each game draws one crossing per level (1 to 5) from `catalogo-madera.json`: low anchors on the cliff faces,
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

While the train crosses, a gauge at the top of the board (`medidor()`) shows the strain live: a
needle on the hardest-working beam, a red mark at the peak so far and a white one at the cheapest
bridge's peak. When a stage passes, the notice gives its peak strain and the cheapest bridge's. After a pass the board holds 1.6 s before the next stage, to read them. The result explains
the sum in a table (per stage: wood against the minimum, peak strain against the known bridge's, and
its points as stage + savings + solidity), with a short legend, and shows how an unsolved stage could
have been crossed (the catalog's bridge, the train looping over it, with its peak strain).

## The scene

Pixel art from `pixel.js` (sprites, particles): the train with smoke, steam and headlight, which looks as
heavy as it is (`trenDe`): old passenger cars at weight ×1, then flatcars with crates, logs, coal and
containers, and a green freight locomotive from ×1,75; sparks
when a beam snaps, a splash when something falls, birds now and then. One character per game, at a
random stage and moment: a flying saucer (`?ovni`, `?ovni=mira|pesca`), a whale (`?ballena`,
`?ballena=salto|chorro`) a mole that tunnels through a cliff (`?topo`, `?topo=anteojos|minero`), or a petrol-green boat
with a wakeboarder towed from its tower roof by a black rope, riding its wave (`?wake`, `?wake=carve|jump|fall|sink`: carving the wave, a jump off its
crest, a fall and the boat turning back to pick the rider up, or the rider sinking, only the head popping up,
and the boat coming back with a small orange flag raised).
It comes 5 to 25 s into its stage; if the stage is passed first, it moves to the next one and comes
3 s in (`mudarVisita`), and one that doesn't fit the crossing (the whale in narrow water, the mole with
no rock to dig) hands over to the boat or the saucer (`noCabe`). These only appear in the game, never on the cover.
Their parameters are internal: they work from a local server or the Tailscale link, and on the site
only for someone who came in with a lab key (`INTERNO` in `game.js`), so a player without one never
calls a visitor by hand.

## Exceptions to the canons (while in the lab)

- Spanish only, no i18n (C-3) and no usage signal: a local prototype.
- Its URL parameters (`?catalogo`, `?ovni`, `?ballena`, `?topo`) are Spanish (`?wake` is already English) and read directly with
  `URLSearchParams`, not through `parametros.js` (C-18, D-266). To be settled before it leaves the lab.
