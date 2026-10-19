# tools/jobs/

Every job of Juegos de Salón, in one registry (D-365): [`jobs.json`](jobs.json). A job that is not
there does not exist. `jobs.test.mjs` fails if a scheduled workflow is missing from it.

```bash
node tools/jobs/jobs.mjs status            # every job, where it runs, its last run
node tools/jobs/jobs.mjs install           # (re)writes and loads the launchd jobs, on the Mac mini
node tools/jobs/jobs.mjs uninstall <id>    # unloads one
node tools/jobs/jobs.mjs run <id>          # runs one now, as launchd does
```

## Where a job runs

| `where` | What it is | Use it for |
|---|---|---|
| `github` | a scheduled workflow in `.github/workflows/` | what needs no key on the Mac (the feedback upload, push notifications) |
| `mac` | a launchd job on the owner's Mac mini, a plain script | frequent checks: free to check, Claude only when there is work |
| `app` | a scheduled task in the Claude app | rounds that are Claude's work every time (processes, weekly report) |
| `hook` | a Claude Code hook (`.claude/settings.json`) | what runs with each session |

## Adding a job

1. Add its entry to `jobs.json`: `id`, `where`, the schedule (`every` in seconds for `mac`, `cron` for
   `github` and `app`), `what` and its `decisions`.
2. `mac`: a script in `tools/jobs/` that exits 0 when all went well and prints a last line that sums
   it up (`status` shows it). Then `node tools/jobs/jobs.mjs install` on the Mac mini, after merging and
   pulling the main folder: launchd runs the main folder's code, never a worktree's.
3. `github`: the workflow, with the same cron. `app`: create the task in the app with the same `task` id.

## The jobs on the Mac

- **`inbox-watch`** ([`inbox-watch.mjs`](inbox-watch.mjs)), every 5 minutes: counts the emails in
  `buzon/` (D-318). With one, runs the support agent headless with Haiku, allowed only
  `inbox.mjs`, Read and Write, and launches `feedback.yml` so the issue appears at once.

Logs: `~/Library/Logs/juegos-de-salon/<id>.log`. Last run: `~/.config/juegos-de-salon/jobs/<id>.json`.
