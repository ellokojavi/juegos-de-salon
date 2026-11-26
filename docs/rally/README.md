# Rally: a time-trial driving game, in three paths

> **Status: concept, no code.** Written on 2026-11-25 after the owner sent a 35-second clip of a
> low-poly 3D rally game and asked how hard it would be for us. This folder is the whole handoff: a
> session that has never seen the clip or that conversation can build the game from here, phase by
> phase. Where it stands is in [PROGRESS.md](PROGRESS.md); update that file in every PR.
>
> **The name** (owner, 2026-11-25): the player reads **Derrape** in Spanish, **Drift** in English and
> **Derrapagem** in Portuguese, with 🏁. So the id, folder, keys, hook, e2e and spec are `drift`
> (C-20): `public/labs/drift/`, `window.__drift`, `docs/games/drift.md`. This plan folder keeps the
> name `docs/rally/` so the start prompt in [PROMPT.md](PROMPT.md) keeps working; "rally" in prose
> here means the genre.

## The idea in one paragraph

One player drives a car against the clock down a winding stage, through numbered gates, sliding
through the corners. A missed gate costs time. The stage is the same for everyone, so times compare
and a ranking means something. The fun is the feel of the car and shaving a second off your own
best.

## The three paths

They are not three games: they are **one game with one engine and a growing renderer**. The physics,
the track, the gates, the clock, the input and the tests are written once ([core.md](core.md)) and
never know how the game is drawn. Each path is a stopping point where the game is whole.

| Path | What the player sees | New work | Cost | Recommended |
|---|---|---|---|---|
| [1 · Top-down](path-1-top-down.md) | The stage from above on a 2D canvas, like Flap and Stack are drawn | The engine, the track pool, the controls, a 2D scene | A normal lab game, on the large side | **Yes, start here** |
| [2 · Simple 3D](path-2-3d.md) | A chase camera behind a low-poly car, one look, no replays | A WebGL scene behind the same engine; path 1's scene stays as the fallback | Several rounds of iteration; real risk in phone performance | Only if path 1 proves people replay it |
| [3 · The clip](path-3-full.md) | What the clip shows: three settings, real shadows, replay cameras, a second car | A backlog of independent increments on top of path 2 | Open-ended: content and polish | No, as a whole; pick increments one at a time |

Why this order: what makes this game good or bad is **how the car feels and whether the controls
work on a phone**, and both are decided in the engine and the input layer. Path 1 answers them at a
tenth of the cost. If the answer is no, nothing in 3D would have saved it. If it is yes, path 2 swaps
the scene and keeps everything else.

## Read in this order

1. [reference.md](reference.md): what the clip shows, second by second, what we take from it and
   what we do not.
2. [constraints.md](constraints.md): the rules of this site that bite on a game like this one, each
   with the doc that owns it.
3. [core.md](core.md): the design all three paths share. The engine's shape, the track, the gates,
   the clock, the input, the autopilot, scores, memory, tests.
4. The path being built: [path-1-top-down.md](path-1-top-down.md) first.
5. [PROGRESS.md](PROGRESS.md): the phase to pick up, the owner's open decisions, the log.
6. [PROMPT.md](PROMPT.md): the prompt that starts a session on this work.

## How a session works on this

- **One phase per PR**, in the order of the path's file. A phase has an exit list; the PR says which
  lines it met and what was measured. Do not start a phase while the one before it has an open exit
  line, unless PROGRESS.md records why.
- **The owner decides by playing, not by reading.** Every phase that changes how it plays ends with
  a link the owner opens on a phone: the PR preview ([PREVIEWS.md](../PREVIEWS.md)), given only once
  `node tools/agents/preview-ready.mjs` says `ready`. Feel is tuned round by round on that link.
- **Decisions that are the owner's are asked, never assumed**: they are listed in PROGRESS.md with a
  recommended default. Ask at most the ones the next phase needs, as one-tap choices.
- **These docs are a starting design, not a contract.** When building shows a section is wrong,
  change the section in the same PR and say so in PROGRESS.md's log. A number in here marked
  "starting value" is meant to be tuned.
- **Everything stays in the lab** until the owner launches it (D-395, D-617): the game under
  `public/labs/`, anything it adds to a shared page behind its own flag, and nothing a player sees
  changes meanwhile.
- When the game's first PR lands, its spec `docs/games/<id>.md` (C-13) becomes the description of
  **what is built**; this folder stays the plan for **what is next**. Keep each fact in one of the
  two, not both (D-213).

## What is deliberately out of scope everywhere

- Racing other cars on the track at the same time, live multiplayer, rooms. Times are compared
  through the ranking and, later, a ghost.
- Car damage, upgrades, currencies, unlocks.
- A track editor.
- Anything that costs per use, or a model at runtime (D-532).
- Copying the reference game's name, track layouts, HUD design, car models or any asset. The genre is
  old and shared; the game is ours ([reference.md](reference.md), "Credit").
