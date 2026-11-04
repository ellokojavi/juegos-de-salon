# Piece 5 · Closing the hypothesis loop

Part of the [learning programme](../LEARNING.md) (D-532). Read that file first.

## Goal

Every idea the ideas agent proposes names "the number that would prove it" (D-360), and the home
page runs experiments (D-361, D-389). Nobody reads the number back. This piece gives each
experiment a closing date and an automatic verdict with an honest statistical test, recorded in a
hypothesis ledger.

## Why

- **For the app**: no experiments left open; the lab (`/labs/`, La Bodega) tells the truth about
  what worked.
- **For the owner**: experimentation as a discipline, including its hardest lesson: most ideas do
  not work, and closing them is a result. Sequential testing instead of peeking at a p-value daily
  is the technical part; the product part is writing a hypothesis that can fail.

## The number

Experiments closed with a verdict (worked / did not / inconclusive) over experiments opened, and
the median days open.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 5.1 | concept ⚖️ | What a falsifiable hypothesis looks like in this app; which test fits small samples (the site's weekly numbers are small); what "inconclusive" means | Page written, owner agrees on the template |
| 5.2 | build | `docs/hypotheses.json` and `tools/agents/hypotheses.mjs open | verdict | list` (plain script, test), reading the panel's numbers as `ideas.mjs check` does; the ideas agent's Yes opens one | The next approved idea has a hypothesis with a closing date |
| 5.3 | build | The processes round runs `verdict` and tells the owner once per closed experiment | A verdict appears in a round |
| 5.4 | learnings | What the first five verdicts taught | Learnings written |

Needs history: starts once piece 3 has at least one approved idea in flight.

**How this mechanism is removed**: if three months pass with no hypothesis opened, the ledger
is archived with its verdicts.

## Status

- 2026-11-04 · planned in the planning session.

## Learnings

*(written with the owner when a step ends)*
