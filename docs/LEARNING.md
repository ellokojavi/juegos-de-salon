# The learning programme: AI in the game, and what the owner learns building it

<!-- D-532. The index of the programme; one file per piece in docs/learning/. Read this file and the
piece you work on, nothing else, unless the piece's step says so (the owner's plan quota is finite). -->

Juegos de Salón has two halves. **The game** is what a player sees on their phone: static pages,
deterministic, no model anywhere. **The factory** is what produces it: six agents, 530 decisions,
merge lanes, one-tap decisions, failure signatures, headless rounds on the Mac mini. The factory
already runs on AI; the game does not use it at all.

This programme works on the border between the two halves, with two goals of equal weight:

1. **The app**: intelligence in the game that no player pays for, and a factory measured with the
   same rigour as the players.
2. **The owner's learning**: each piece leaves a skill that any company adopting AI needs, written
   down in the piece's *Learnings* section as the D-n record decisions. That record is the owner's
   material for their career (talks, texts, their own team), not a by-product.

The owner is a product-management lead. The programme is a conversation (2026-11-04) turned into
a plan; this file is its memory, so a later session does not need to rediscover it.

## The rules of the programme (D-532)

- **No variable cost.** The site earns nothing; nothing in it may bill the owner per use. A
  server is fine when it costs nothing per request (the Mac mini, a free tier that fails closed).
- **The owner's Claude plan serves the factory, never the player.** Anthropic's terms allow the
  Max plan for the owner's own Claude Code sessions (including the headless rounds) and forbid
  routing players' requests through it, from any machine, the Mac mini included
  ([legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)). A session never
  builds a path where a player's action reaches the owner's Claude credentials.
- **A model lives in one of three places**, all free for the owner:

  | Place | Who pays | What it teaches |
  |---|---|---|
  | The factory, at build time (a session generates content, a judge filters it, the result is committed as static data) | The owner's plan | Evals, content pipelines |
  | The player's device (a small open model in the browser, WebGPU) | Nobody | The limits of the device |
  | The owner's server (an open model on the Mac mini behind a free tunnel, or Cloudflare Workers AI's free daily quota, which answers 429 when spent and never bills on the free plan) | Nobody, with a hard cap | Operating a model of one's own |

  **Build time is the default.** Runtime (device or server) is a lab experiment with a measured
  question, and the game degrades gracefully without it (no judge: the table decides).
- **Everything in development sits behind the lab** (D-395, D-409): a lab game, a flag, a card in
  `/labs/`. A piece that sends a player's text off the phone changes `/privacy/` in the same PR (🔴).
- **Every piece runs in three moments**: *concept* (one page the owner reads, with the decision
  that is theirs, before any code), *build* (lab PRs, the owner sees numbers), *learnings* (what
  the owner learned, in the piece file). A step is not done until its learnings are written.
- **One number per piece**: each piece names the metric that says it worked, before building.
- **A mechanism states how it is removed.** The factory is already heavy; a piece that adds a
  mechanism (a job, a check, a ledger) writes in its file what would make it unnecessary.

## Spending the plan slowly

The owner's Claude plan is the programme's only budget. Rules for a session on this programme:

- **Read two files**: this one and the piece's file. Open CLAUDE.md's rules as every session does,
  and nothing else unless the step names it. Do not re-read decisions the piece already quotes.
- **Pick the cheapest model that does the step** (`/model` in Claude Code): the current Sonnet
  for building, running and recording; the current Opus only for the few design moments the piece
  marks ⚖️ (an eval rubric, a statistical test, a trust ladder). Never Fable for a step.
- **Plain scripts first.** Anything deterministic (counting, grouping, drawing a table) is a
  `tools/` script with its test, as the factory already does (`failures.mjs` groups without a
  model). The model is called only for what needs judgment.
- **Short sessions, one step each.** Finish the step, write its status line, push, stop. A session
  that drifts into another piece spends tokens twice.
- **A judge is small.** When a piece uses a model as a judge or a generator (piece 1), it uses the
  smallest model whose eval score is good enough, and the eval decides, not the name.

## The pieces

| # | Piece | File | Status | The number |
|---|---|---|---|---|
| 1 | Endless content with quality control (Agentes, then Bachillerato, puzzles, translations) | [learning/01-content-pipeline.md](learning/01-content-pipeline.md) | concept closed (1.1); next 1.2, the mechanical checks, the cases and the `agents-m3` flag | share of generated clues the judge accepts and the owner agrees with |
| 2 | The factory's dashboard | [learning/02-factory-metrics.md](learning/02-factory-metrics.md) | planned | a weekly factory section the owner reads |
| 3 | The owner's taste as data | [learning/03-taste-model.md](learning/03-taste-model.md) | planned | how often the ideas agent predicts the owner's answer |
| 4 | Earned autonomy | [learning/04-earned-autonomy.md](learning/04-earned-autonomy.md) | planned | agreement between agent and owner in shadow mode |
| 5 | Closing the hypothesis loop | [learning/05-hypothesis-loop.md](learning/05-hypothesis-loop.md) | planned | experiments closed with a verdict |
| 6 | Where the model lives: a judge in three places | [learning/06-model-placement.md](learning/06-model-placement.md) | planned, after 1 | latency, quality and availability of the same judge in each place |

**Order**: 1 first (cheapest, and its eval is what every other piece needs to choose a model); 2
in parallel because it needs no decision from the owner; 3, 4 and 5 once there is history to
read; 6 after 1, because the eval of 1 is what picks the open model.

## How a session advances a piece

1. Read this file and the piece's file. Find the first step whose status is not done.
2. If the step is a *concept*, write the page in the piece file (plain words, one page, the
   owner's decision at the end as a question with options) and stop: the owner answers in chat or
   on the PR.
3. If it is a *build* step, build it as a lab PR by the house rules (CLAUDE.md), with the number
   the piece names measured and shown.
4. Append one line to the piece's *Status* (date, what happened, PR) and, when a step ends, what
   the owner learned to *Learnings*, in the owner's words when they gave them.
5. Update the status column above.

## What this programme is not

- Not a reason to use Claude at play time: the game stays static by default.
- Not a new agent: the pieces reuse the ones that exist (ideas, processes, the weekly report).
- Not a backlog of features: a piece whose number does not move is closed with its learnings,
  and that is a result.
