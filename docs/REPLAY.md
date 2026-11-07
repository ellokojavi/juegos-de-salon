# Seeded randomness and replay

A game played with a seed is reproducible, and a bug reproduced that way is kept as a replay test
(rule 10 of [RULES.md](RULES.md), issue #1249 step 10).

## The seeded source: `public/assets/js/azar.js`

| Export | What it does |
|---|---|
| `hashSeed(seed)` | A string or number to a 32-bit integer (FNV-1a; a whole number passes as is). |
| `seededRng(seed)` | A mulberry32 generator (`rng.js`) in [0, 1) from that seed. |
| `seedRandom(seed)` | Seeds the module's source until cleared; `seedRandom(null)` goes back to `Math.random`. |
| `random()` | A number in [0, 1) from the module's source: seeded, or `Math.random` as always. |
| `withSeed(seed, fn)` | Runs `fn` with the source seeded and restores the previous one after. |

With no seed nothing changes: the dice and every caller draw from `Math.random`. Code that should be
replayable draws from `random()` instead of `Math.random()`.

## Recording a seed

Open the page with `?test&seed=<anything>` (for example `/?test&seed=K7Q2X`). azar.js reads it once,
when it loads, through `parametros.js` (C-18; the old `?prueba&semilla=` works too): that is the one
shared place, no game reads it on its own. Without `?test` the seed is ignored, so a link a player
shares never fixes the dice. Note the seed and the actions taken (the plays, in order).

## Reproducing

`tools/replay/replay.mjs` runs a recorded game to its final state:

```js
replay({ seed, actions, start, step, finish })
```

The whole run is inside `withSeed(seed, …)`; `start()` builds the first state (drawing from
`random()`), `step(state, action)` applies one action, `finish(state)` reads the end. It is pure and
runs under node.

## Keeping a bug as a replay test

1. Reproduce it with a seed and the list of actions.
2. Add a block to the game's `replay.test.mjs` (the pilot is `public/hangman/replay.test.mjs`) with
   that seed, those actions and the end state that is right, citing the decision or issue of the fix.
3. Check it fails before the fix and passes after. It then runs with every `*.test.mjs`.

The Hangman pilot keeps a full recorded game (the model for new ones) and D-61, the bug where three
hanged players crowned the one who had revealed no letter.
