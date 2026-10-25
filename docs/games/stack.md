# 🧱 Stack (lab prototype, in Juegos en prueba)

A one-tap tower game for one player (D-445): a block slides over the tower, a tap drops it, and whatever
hangs over the edge is cut off. **Inspired by [Stack](https://www.ketchappgames.com/), by Ketchapp
(2016)**, and it says so on the cover and in the lab. The owner sent a video of the original and asked:
"Build the prototype directly and put it in Labs. English only for now".

## Summary

- **Where:** `https://juegosdesalon.cl/labs/stack/`, in the lab (each person's key, D-281, D-284). Id
  `stack` in the usage signal.
- **For whom:** one player. **English only** (the owner's request): the page is `lang="en"`, so the
  comment form's email field is in English too. The lab card is in Spanish, like the rest of `/labs/`,
  and says "Por ahora, solo en inglés."
- **Status:** active project, to try with friends. It is the site's first reflex game: every other game
  is a puzzle, a word game or a party game. What would prove it: players who play more than one round
  in a visit.

## Cover

The title with a 🧱 that sways, the tagline ("Stack the blocks as high as you can."), the credit, and a
tower that builds itself on a small canvas (mostly perfect drops, a cut now and then, then it starts
over; still with reduced motion). Then "🧱 Play" and the three steps (after the button, U-39):

1. 👆 Tap to drop each sliding block onto the tower.
2. ✂️ Whatever hangs over the edge is cut off, so the next block is smaller. Miss the tower and the game ends.
3. 🎯 Drop a block exactly on the one below and nothing is cut. Do it 4 times in a row and the block grows back.

## How it is played

- **The tower** fills the screen below the top bar, drawn in isometric view on a canvas, with the score
  (blocks placed) big at the top. Before the first drop it says "Tap anywhere to drop the block".
- **The block** slides in from one side, crosses the tower, goes out to the other side and back, again
  and again: the first along one axis, the next along the other. Each block is a little faster, up to a
  top speed.
- **A tap anywhere on the tower** (or Space or Enter) drops it. What overlaps the block below stays; what
  hangs over falls away, and the next block is that smaller size.
- **A perfect drop** (within 0.035 of the block below, 3.5% of the base's side) cuts nothing; a white
  outline opens around it and it says "Perfect!", then "Perfect ×n" in a row. From the 4th in a row,
  each perfect grows the block back 0.05 on each side that was cut, up to the base.
- **Missing the tower** ends the game: the whole block falls and it says "Game over".
- **The colors** turn slowly as the tower grows (the blocks' hue and the sky), as in the original.
- **No clock, no daily board:** every game starts the same; the score is the height.

## The result

The stamp (🏆 New best! or Game over), the score, "Your best: n" (when it is not a new best; kept on the
phone, `juegos-de-salon:stack-best`), the perfect drops and the longest perfect streak, sharing (the
last 20 blocks as 🟩 perfect and 🟨 cut, ten to a line, newest on top), 🔁 Play again, back to the lab
and, after a line, the comment form.

## How it works

- `engine.js`, pure: where the sliding block is depends only on the time since it appeared
  (`offsetAt(m, t)`), never on how many frames were drawn, and `drop(g, t)` judges a drop at moment `t`.
  The page passes the tap's own `event.timeStamp`, so a 60 Hz and a 120 Hz phone play the same game, and
  a frame drawn late does not move the drop. `perfectTime(g, t)` says when the block is next exactly
  over the tower (the cover's demo and the end-to-end script use it).
- `game.js`: the canvas scene (each block a box with its top and the two sides facing the viewer, the
  falling pieces with gravity, the perfect outline, a camera that rises with the tower), the cover, the
  game and the result. The end-to-end hook is `window.__stack` (`S`, with `S.soltarEn(t)` to drop at a
  moment, and `perfecto()`).

## To tune

The numbers at the top of `engine.js`: the swing (`RANGE`), the perfect margin (`PERFECT`), when and how
much a streak grows the block (`GROW_FROM`, `GROW`) and the speed (`SPEED_START`, `SPEED_STEP`,
`SPEED_MAX`). If it goes to La Copa, the height needs a 0-to-100 score.

## Tests

`public/labs/stack/engine.test.mjs` (the slide, perfect drops, cuts on both axes, misses, growing back,
the same position at 60 and 120 Hz, a long perfect game) and `tools/e2e/stack/lab.mjs` (the lab card,
the cover and its moving tower, a real tap on the screen, perfect drops, a cut, a miss, the result, the
best kept, Play again).

## Exceptions to the canons

- **English only** (the owner's request), where a lab prototype is usually Spanish only (D-304): the
  four languages come when it leaves the lab.
- **No 3, 2, 1 countdown:** the block waits 0.4 s at its side before it slides, and the game is the
  tower, not a clock.
