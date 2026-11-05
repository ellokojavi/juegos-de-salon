# The referee: an open model on the Mac mini, serving the games

Part of the [learning programme](../../docs/LEARNING.md), piece 6 (D-532): the Mac mini as the
owner's own model server, with no variable cost. This folder is the gateway, its templates and
its test; this page is the runbook. The design and the service levels are in
[docs/learning/06-model-placement.md](../../docs/learning/06-model-placement.md).

```
phone ── https://referee.juegosdesalon.cl ── Cloudflare (tunnel, WAF, rate limit)
                                                   │ outbound tunnel, no open port
                                             Mac mini: cloudflared ── 127.0.0.1:8790 gateway.mjs ── 127.0.0.1:11434 Ollama (open model)
```

**Never the owner's Claude plan**: the model is an open one (Ollama). Anthropic's terms forbid
serving players through Free, Pro or Max credentials from any machine (D-532).

## What the gateway does (`gateway.mjs`)

- `POST /v1/judge` with `{ key, template, fields }`: the client never sends a prompt, only a
  template id (`templates.mjs`) and short word fields. The endpoint cannot be used as a free model.
- A **lab key** (D-281) is required: its SHA-256 fingerprint must be in Firebase `labsLlaves/`
  (cached 5 minutes), or listed in the config's `keys`.
- **Limits**: 30 questions per key per minute, 120 in all, 2 model calls at a time, 6 s per call.
- **Breaker**: after 3 failures in a row it answers 503 at once for 30 s instead of queueing on a
  dead model. Every refusal says `"the table decides"` and `retry: true`: the game degrades to the
  players judging, which is what a party game does anyway.
- **Cache**: the same question gets the same answer (consistent, and free).
- **No player text kept**: `/health` and the heartbeat carry counters and timings only.
  `REFEREE_LOG_TEXT=1` prints questions and answers to the log, for debugging, never in service.
- `GET /health`: `ok`, model, uptime, p95, counters. 503 while the breaker is open.

```bash
node tools/referee/gateway.test.mjs     # a fake Ollama; no model, no network
node tools/referee/gateway.mjs          # serves on 127.0.0.1:8790
curl -s localhost:8790/health
curl -s localhost:8790/v1/judge -H 'content-type: application/json' \
  -d '{"key":"<lab key>","template":"bachillerato","fields":{"category":"animal","letter":"g","answer":"gato"}}'
```

Config, every key optional, in `~/.config/juegos-de-salon/referee.json` (see `DEFAULTS` in
`gateway.mjs`): `model`, `port`, `concurrency`, `timeoutMs`, `perKeyPerMin`, `globalPerMin`,
`origins`, `keys` (fingerprints accepted without Firebase: the owner's own, for the warm-up).

## Setting it up on the Mac mini

1. **Ollama**, bound to localhost (its default): `brew install ollama && brew services start ollama`,
   then `ollama pull gemma3:4b` (the placeholder model; piece 1's eval picks the real one). Check
   `curl -s localhost:11434/api/tags`. Ollama must never be reachable from outside: do not set
   `OLLAMA_HOST` to `0.0.0.0`.
2. **The gateway as a service**: it is the `referee` job in `tools/jobs/jobs.json` (`service: true`,
   launchd keeps it alive and restarts it). On the main folder, on `main`:
   `node tools/jobs/jobs.mjs install`, then `node tools/jobs/jobs.mjs status` shows its heartbeat
   (`up · n answered · p95 ms`) like any other job. Logs: `~/Library/Logs/juegos-de-salon/referee.launchd.log`.
3. **The tunnel** (free, no inbound port, no public IP): `brew install cloudflared`,
   `cloudflared tunnel login`, `cloudflared tunnel create referee`,
   `cloudflared tunnel route dns referee referee.juegosdesalon.cl`, a config
   `~/.cloudflared/config.yml` with `ingress: [{hostname: referee.juegosdesalon.cl, service: http://127.0.0.1:8790}, {service: http_status:404}]`,
   then `sudo cloudflared service install` (a LaunchDaemon, so it survives logouts). Check
   `curl -s https://referee.juegosdesalon.cl/health`.
4. **At Cloudflare** (dashboard, free plan): a rate-limiting rule on `referee.juegosdesalon.cl`
   (60 requests per minute per IP, block for 1 minute), the managed WAF rules on, and Bot Fight
   Mode on. These stop a flood before it reaches the Mac.
5. **The Mac**: firewall on (System Settings → Network → Firewall), no port forwarding on the
   router, never sleep (already, for the jobs). The gateway and Ollama listen on 127.0.0.1 only,
   so even on the home network nothing reaches them but cloudflared.
6. **A warm-up key**: `node tools/agents/labs-key.mjs new referee`, and its fingerprint in
   `referee.json` `keys`, so the gateway can ask the model one question at start and every 20
   minutes and the first player never pays the model's load time.

## Service levels (what the owner promises, and how it is known)

| What | Target | Measured by |
|---|---|---|
| A verdict or a shrug within 4 s, always | 100% | the client's own timeout (4 s): past it, the table decides |
| Availability of the referee | 99% per month (about 7 h down) | an external probe of `/health` every 15 min (`referee-watch`, a GitHub workflow, 🔴, step 6.3b) that opens an issue after two misses |
| Latency of a verdict | p95 ≤ 3 s | `/health` `p95Ms`, in the heartbeat |
| Failed verdicts (timeouts, model errors) | ≤ 2% | `/health` counters |
| Capacity | 60 to 120 verdicts per minute | 2 calls at a time, 1 to 2 s each; well above the site's volume |

The first target is the only one a player feels, and it is kept by the client, not by the Mac:
the service may be down and the game still works. The others are the owner's dashboard.

## What is not done yet

- The probe (`referee-watch`, 🔴 because it is a workflow) and the issue it opens.
- A client: a lab game that asks the referee, with `/privacy/` edited in the same PR (🔴: the
  player's answer leaves the phone, to the owner's machine, and is not kept).
- The model choice: piece 1's eval, run against this same endpoint with the `agents-clue` template.

## How it is removed

`node tools/jobs/jobs.mjs uninstall referee`, `sudo cloudflared service uninstall`, the DNS route
deleted at Cloudflare, `brew services stop ollama`. Nothing else on the Mac changes.
