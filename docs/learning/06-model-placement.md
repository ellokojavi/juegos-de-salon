# Piece 6 · Where the model lives: one judge in three places

Part of the [learning programme](../LEARNING.md) (D-532). Read that file first.

## Goal

The party games the app does not have are the ones that need a referee: Bachillerato (Tutti
Frutti, Scattergories), "name three". A model can be that referee. This piece builds **the same
referee** and deploys it in the three free places the programme allows, measuring each:

1. **Build time**: a precomputed answer bank per category and letter (synonyms, regional
   variants), validated offline with piece 1's pipeline; on the phone the judgment is a lookup,
   and what is not in the bank the table decides.
2. **The player's device**: a small open model in the browser (WebGPU), loaded once, behind a
   flag; measured on how many devices it runs and how long it takes to load and answer.
3. **The owner's server**: an open model on the Mac mini behind a free tunnel, or Cloudflare
   Workers AI's free daily quota (fails closed with 429, never bills on the free plan), behind the
   same flag; measured on latency from a phone, availability and abuse attempts.

Never the owner's Claude plan: a player's request may not reach it (D-532).

## Why

- **For the app**: maybe a free referee for a classic party game; maybe the lesson that the
  table is the better referee. Both are results.
- **For the owner**: the question "which part of the AI can live on the device, which on my own
  server, which must be precomputed" is the product-architecture decision most repeated today, and
  almost no product lead has seen the comparison on their own data. Also: operating a model of
  one's own (single point of failure, graceful degradation, protecting an exposed endpoint from
  abuse, privacy of text leaving the phone).

## The number

For the same set of judgments (piece 1's eval cases, Bachillerato edition): quality (agreement
with the owner), latency from a phone, availability over two weeks, and the share of lab devices
where the on-device variant runs at all.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 6.1 | concept | Bachillerato as a house game (C-n canons, phone first, 3 to 10 minutes, the table in the loop), and the referee's eval cases | Page written, owner approves the game's shape |
| 6.2 | build | The lab game with the precomputed bank (place 1) and "the table decides" as the default path; `/privacy/` unchanged because nothing leaves the phone | Playable with a lab key |
| 6.3 | build ⚖️ | The server variant behind flag `referee-server`: first Workers AI free quota (no Mac mini work), then the Mac mini; `/privacy/` edited in the same PR (🔴: the player's words leave the phone); rate limit by lab key | Latency and availability measured for two weeks |
| 6.4 | build | The on-device variant behind flag `referee-device`, with `lab-usage` counting devices that load it | Share of devices measured |
| 6.5 | learnings | The three columns side by side and the owner's call | Learnings written |

Depends on piece 1: its eval is what picks the open model for 6.3 and 6.4.

**How this mechanism is removed**: a variant that loses on its numbers is deleted with its flag;
if all three lose to "the table decides", the game keeps only that path and this file records why.

## Status

- 2026-11-04 · planned in the planning session; waits for piece 1.

## Learnings

*(written with the owner when a step ends)*
