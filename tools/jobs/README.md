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
| `github` | a scheduled workflow in `.github/workflows/` | what needs no key on the Mac (push notifications) |
| `mac` | a launchd job on the owner's Mac mini: a plain script, or `claude-task.mjs <prompt>` for a headless Claude session (D-451) | frequent checks (free to check, Claude only when there is work) and the rounds that are Claude's work every time (processes, weekly report), their prompt in `tools/jobs/prompts/<id>.md` |
| `hook` | a Claude Code hook (`.claude/settings.json`) | what runs with each session |

## Adding a job

1. Add its entry to `jobs.json`: `id`, `where`, the schedule (`every` in seconds or `at` a local `{ hour, minute, weekday? }` for
   `mac`, `cron` for `github`), `what` and its `decisions`.
2. `mac`: a script in `tools/jobs/` that exits 0 when all went well and prints a last line that sums
   it up (`status` shows it). Then `node tools/jobs/jobs.mjs install` on the Mac mini, after merging and
   pulling the main folder: launchd runs the main folder's code, never a worktree's.
3. `github`: the workflow, with the same cron. A Claude round: a `mac` job whose command is
   `node tools/jobs/claude-task.mjs tools/jobs/prompts/<id>.md` (`jobs.test.mjs` checks every file the
   prompt names exists); not a desktop-app or claude.ai scheduled task, which stop or cannot reach the Mac (D-451).

## The jobs on the Mac

- **`inbox-watch`** ([`inbox-watch.mjs`](inbox-watch.mjs)), every 5 minutes: counts the emails in
  `buzon/` (D-318). With one, runs the support agent headless with Haiku and uploads the reports
  right away so the issue appears at once. The agent reads strangers' emails, so its session gets
  only the Bash tool, allowed to run `node tools/agents/inbox.mjs` and nothing else (its
  owner-only `skipped` denied), in restricted mode (no settings files, file reads only inside the
  repo, no MCP servers); the report's text goes to `ingest` on stdin, so there is no Read or Write
  (#838). `inbox-watch.test.mjs` checks those flags.
- **`feedback-watch`** (`tools/agents/feedback.mjs sync`), every 5 minutes: uploads the new reports of
  `feedback/` as `feedback` issues (D-382), except one that looks like it carries a key or a token,
  which it logs instead of posting (`secretLike`, #838). It was the GitHub workflow `feedback.yml`, which GitHub ran
  about 4 times a day instead of every 15 minutes; the workflow stays, by hand only.

What the Mac mini holds besides the jobs (keys, sign-ins, the scheduled tasks) and how to move it all
to another machine: [MAC-MINI.md](MAC-MINI.md).

Logs: `~/Library/Logs/juegos-de-salon/<id>.log`. Last run: `~/.config/juegos-de-salon/jobs/<id>.json`.
