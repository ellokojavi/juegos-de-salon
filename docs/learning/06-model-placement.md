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

## The server, designed first (6.0, 2026-11-05)

The owner asked for the Mac mini to serve the games with a model, safe for the machine and with
service levels a player can rely on, at today's small volume. The design, built in
`tools/referee/` with its runbook ([tools/referee/README.md](../../tools/referee/README.md)):

- **One door, a gateway on 127.0.0.1** (`gateway.mjs`), reached only through a Cloudflare
  Tunnel (free, outbound, no open port, no public IP) at `referee.juegosdesalon.cl`. Ollama with
  an open model listens on localhost behind it and is never exposed. The owner's Claude plan is
  never on the path.
- **Templates, not prompts**: a client sends a template id and short word fields; the prompt is
  the server's. So the endpoint judges games and cannot be used as a free model, and a player's
  text cannot steer the instruction.
- **A lab key is required** (D-281), checked against Firebase as `/labs/` does, cached.
- **Limits that fail fast**: per key and global per minute, two model calls at a time, a 6 s
  timeout, a breaker that answers 503 at once while the model is down. Every refusal tells the
  game "the table decides". Cloudflare's free rate limiting and WAF stop a flood before the Mac.
- **No player text is kept**: counters and timings only, in `/health` and in the heartbeat that
  `jobs.mjs status` shows like any job's last run.
- **A cache**: the same question gets the same answer, consistent and free.
- **Kept alive by launchd** as the `referee` job (`service: true` in `jobs.json`, a new kind), warmed
  at start and every 20 minutes so the first player never pays the model's load.

**Service levels.** The only one a player feels is kept by the client, not by the Mac: *a verdict or
a shrug within 4 s, always*; past 4 s the table decides. The owner's own targets, read from
`/health` and an external probe to come (`referee-watch`, a workflow, 🔴): availability 99% a month
(about 7 hours down, honest for a home machine), p95 latency ≤ 3 s, failed verdicts ≤ 2%, capacity
60 to 120 verdicts a minute. Graceful degradation is the product's SLA; the rest is a dashboard.

**What the owner learns here**: operating a model of one's own (a single point of failure, a
warm model, a breaker), protecting an exposed model endpoint from abuse (templates, keys, limits,
an edge in front), and that a service level for a player is a product decision (the 4 s shrug)
before it is an infrastructure one.

**Two uses from day one**: the referee serves the player (Bachillerato, 6.2 onward) and the
factory (piece 1's judge runs on the same endpoint with the `agents-clue` template, so the eval
spends no Claude at all). The model choice comes from that eval.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 6.0 | build | The referee service: `tools/referee/` (gateway, templates, test, runbook), the `referee` launchd service in `jobs.json`; the owner installs Ollama, the tunnel and the Cloudflare rules by the runbook | `node tools/jobs/jobs.mjs status` shows the heartbeat and `https://referee.juegosdesalon.cl/health` answers |
| 6.0b | build ⚖️ | `referee-watch`: an external probe of `/health` every 15 min that opens an issue after two misses (🔴: a workflow) | A simulated outage opens the issue |
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
- 2026-11-05 · The owner asked for the Mac mini as a model server first. 6.0 designed and built in the repo (gateway, templates, test, runbook, launchd service); the owner runs the runbook on the Mac. The model is a placeholder until piece 1's eval, which can run on this endpoint.

## Learnings

*(written with the owner when a step ends)*
