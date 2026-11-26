# What the factory costs, and the levers (D-558)

`node tools/agents/costs.mjs` measures it; the processes round runs it once a week and takes on at most
one saving. **The rule:** a saving makes the same work cheaper; it never drops a test case, a check, a
rule, or speed for players, and its PR shows the proof (same tests and counts, moved text identical).

## The three costs

| Cost | What it is | Who pays |
|---|---|---|
| **Claude tokens** | Every turn re-reads the whole context from the cache, so a session costs about *turns × context*. Output tokens are a small share. | The owner's plan: the only one that is money |
| **Waiting for checks** | A PR merges when its slower check is green: `tests` (~1 min) or `end-to-end` (0 when the PR touches nothing a browser loads, ~7 min on a full run). | Time, every PR |
| **GitHub runners** | Free on a public repo. What matters is the 20 runners at a time: e2e takes up to 18 (`groups.mjs` MAXIMUM). | Queues, not money |

## The picture on 2026-11-15 (14 days)

- **Tokens:** interactive sessions 95%, subagents 4%, scheduled jobs (processes round, inbox…) 1%. A
  turn carries ~165k tokens on average. **8 sessions of 122 that ran over 300 turns took half** of
  the interactive tokens: a long session drags its whole history into every turn.
- **A session starts at ~80k** before any work: ~22k is Claude Code itself, ~10k this repo (CLAUDE.md,
  memory, the agent and skill descriptions), ~48k the desktop/remote app's own tools, which the repo
  cannot change. Connectors such as Gmail or Drive load on demand and add almost nothing.
- **Tests:** `tests` went from ~2 min to ~1 (parallel runner, three slow files split, PRs #1470, #1471).
- **End to end:** ~100–120 min of browser time when everything runs, split into up to 18 jobs; a full
  run lasts as long as the target (440 s since D-624) or the longest script, plus ~1 min setup. `landing-fold.mjs`
  (~8 min whole) was split by phone width.

## The levers, in order of size

1. **Shorter sessions (tokens, the biggest).** One task per session, a new session for the next one.
   It is the owner's habit, not code; no quality is lost (a fresh context is if anything sharper).
   A hook helps: `tools/agents/session-length.mjs` (UserPromptSubmit) shows the owner a one-line 📏 note
   at 250 turns and every 150 after. It only informs; Claude never sees it.
2. **What every session loads:** CLAUDE.md, MEMORY.md, the agents' and skills' `description` lines.
   Each KB there is paid on every turn of every session. Move what only some tasks need to the doc
   it belongs to (D-213, D-497).
3. **Docs read whole:** CANONS.md, UNO-AL-DIA.md, games/cup.md, DECISIONS.md and REQUERIMIENTOS.md are
   60–75 KB. Agents should `grep` them or read the section; splitting one by topic (as decisions were,
   D-394) makes that the default.
4. **Noisy commands:** a script that prints a line per passing check fills the context of whoever runs
   it. Print failures and a one-line summary; keep the details in a file.
5. **End to end:** keep every script under the group target (`ci.mjs` PARTS); never fewer checks.
6. **Unit tests:** the slowest file sets the floor of the parallel runner (`TIMES=8 node tools/release/run-tests.mjs`).

Not levers: lowering the auto-compact window or the effort level saves tokens but loses context or
care, so it breaks the rule; that is the owner's call, not a round's.
