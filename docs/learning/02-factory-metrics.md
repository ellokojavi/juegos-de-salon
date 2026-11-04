# Piece 2 · The factory's dashboard

Part of the [learning programme](../LEARNING.md) (D-532). Read that file first.

## Goal

The weekly report (D-352) counts players. A new section counts the agents: the factory measured
with the same rigour as the game.

## Why

- **For the app**: the owner learns which agent earns its keep, which mechanism only makes noise,
  and where the process can be cut (the factory is already heavy: 530 decisions, six agents).
- **For the owner**: managing a team of AI agents by numbers, the way a team of people is managed
  (throughput, rework, override rate, cost). Companies do not have this yet; a lead who can set it
  up has an edge.

## The number

A factory section in the weekly report that the owner reads and that changes at least one
decision in the first month (a mechanism dropped, a lane relaxed or tightened, an agent's cadence
changed).

## Concept (to write at step 2.1)

The candidate metrics, all computable from GitHub and the repo's own ledgers without a model:

- **Ideas**: proposed, approved, discarded, prototyped, graduated (`docs/ideas.json`); approval
  rate by lane.
- **PRs**: cycle time from open to merge by lane 🟢🟡🔴 (`lanes.mjs check --pr`), reverted or
  reopened PRs, PRs the owner edited after an agent's round.
- **Reviews**: findings of the usability agent accepted vs. dismissed; dilemmas opened vs.
  resolved; documentation round PRs that needed a fix.
- **Failures**: signatures seen, promoted to patterns, closed by a mechanism (`failures.mjs`);
  flaky rate.
- **Owner's time**: one-tap decisions opened, answered, median wait; the backlog the processes
  round lists.
- **Cost**: tokens are not visible from the plan; a proxy is sessions launched by jobs and their
  duration (`tools/jobs/jobs.mjs status`).

The concept page chooses five, no more, and names what each would change if it moved.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 2.1 | concept | The five metrics and what each decides, agreed with the owner | Listed here |
| 2.2 | build | `tools/reports/factory.mjs` (plain script, its test), reading GitHub and the ledgers; a section in `weekly.mjs` | The section appears in the Sunday PDF |
| 2.3 | learnings | After four reports: what moved, what the owner decided, what the numbers could not tell | Learnings written |

**How this mechanism is removed**: a metric nobody acted on in three months leaves the section;
a section nobody acted on in three months leaves the report.

## Status

- 2026-11-04 · planned in the planning session; needs no owner decision to start 2.1.

## Learnings

*(written with the owner when a step ends)*
