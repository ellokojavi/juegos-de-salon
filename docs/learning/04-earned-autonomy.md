# Piece 4 · Earned autonomy

Part of the [learning programme](../LEARNING.md) (D-532). Read that file first.

## Goal

Today a PR's lane (🟢🟡🔴, D-519) depends on the files it touches. This piece adds two things:
**shadow mode**, where a new agent capability decides, the owner decides too, the two are compared,
and only a track record of agreement releases the capability; and **automatic retreat**, where a
flag published to everyone (D-498) goes back to *lab* on its own when its error rate rises
(the reverse of `lab-ready`, D-528).

## Why

- **For the app**: less of the owner's time without more risk; a published feature that breaks
  retreats before a player reports it.
- **For the owner**: deploying autonomy by stages is the central problem of every company putting
  agents into its operation. Being able to say "this agent may do this alone, that one not yet,
  and here is the evidence" is a leadership skill, and the trust ladder is the artefact.

## The number

Agreement between agent and owner in shadow mode, per capability, over at least ten decisions;
and for retreat, the time from an error rise to the flag back in *lab*.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 4.1 | concept ⚖️ | The trust ladder: what a capability must show to climb a rung (shadow → proposes → acts with veto → acts), and the first candidate (the usability agent's "obvious fixes", or the lab-publish request) | Page written, owner picks the candidate |
| 4.2 | build | Shadow mode for the candidate: the agent's decision recorded next to the owner's (`processes.mjs`), a plain script that prints agreement | Ten decisions compared |
| 4.3 | build | `lab-retreat`: the hourly `lab-ready` job also reads `labsUso/` of flags on *all* and flips one back to *lab* when failures exceed the threshold, telling the owner | A simulated failure rise retreats a flag in a test |
| 4.4 | learnings | What the ladder taught about trust, blast radius and reversibility | Learnings written |

Needs history: starts after piece 2's first reports.

**How this mechanism is removed**: a capability that reaches the top rung leaves shadow mode;
a ladder with no capability on it is deleted.

## Status

- 2026-11-04 · planned in the planning session.

## Learnings

*(written with the owner when a step ends)*
