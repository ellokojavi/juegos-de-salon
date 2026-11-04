# Piece 3 · The owner's taste as data

Part of the [learning programme](../LEARNING.md) (D-532). Read that file first.

## Goal

The ideas agent keeps six hand-written lines of *taste* (`docs/ideas.json`, D-360). This piece
makes every Yes and No, with its reason, feed the agent's proposals, and measures once a month
whether the agent would have predicted the owner's answer before it was given.

## Why

- **For the app**: sharper ideas, fewer decisions that interrupt the owner.
- **For the owner**: feeling, on their own answers, how a system learns one person's preferences.
  It is the small version of the mechanism that aligns models with human judgment (preference
  modelling), and it answers a career question: how much of my judgment can be written down so
  that others, people or machines, apply it without me?

## The number

Prediction accuracy: before the owner answers an ideas issue, the agent writes its predicted
answer per idea in the ledger; after the owner answers, a script scores it. Target to discuss at
the concept step (a coin is 50%; the taste lines should beat that clearly).

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 3.1 | concept | How a preference ledger works, what it can and cannot learn, what the owner's reasons should contain to be useful | Page written, owner's decision on the target |
| 3.2 | build | `ideas.mjs predict` (the agent's guess, stored) and `ideas.mjs score` (plain script, test); the ideas agent's prompt reads the full ledger of reasons, not only *taste* | A prediction stored on the next ideas issue |
| 3.3 | build ⚖️ | After three rounds: the taste lines rewritten from the reasons, by a session, shown to the owner | Owner approves the lines |
| 3.4 | learnings | The accuracy curve and what it says | Learnings written |

Needs history: starts once piece 2 reports at least one month of ideas answered.

**How this mechanism is removed**: if accuracy stays at chance after six rounds, prediction
stops and the ledger keeps only the reasons.

## Status

- 2026-11-04 · planned in the planning session.

## Learnings

*(written with the owner when a step ends)*
