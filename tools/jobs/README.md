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
   Its prompt file also gets an entry in `JOBS` in `claude-task.mjs` with the tools that round needs
   and no more (a prompt file without one does not run; `claude-task.test.mjs` checks it, #865).

## The jobs on the Mac

- **`inbox-watch`** ([`inbox-watch.mjs`](inbox-watch.mjs)), every 5 minutes: counts the emails in
  `buzon/` (D-318). With one, runs the support agent headless with Haiku and uploads the reports
  right away so the issue appears at once. The agent reads strangers' emails, so its session gets
  only the Bash tool, allowed to run `node tools/agents/inbox.mjs` and nothing else (its
  owner-only `skipped` denied), in restricted mode (no settings files, file reads only inside the
  repo, no MCP servers); the report's text goes to `ingest` on stdin, so there is no Read or Write
  (#838). `inbox-watch.test.mjs` checks those flags.
- **`lab-publish-watch`** ([`lab-publish-watch.mjs`](lab-publish-watch.mjs)), every 5 minutes: the lab's
  🚀 Publicar para todos (D-480). It follows the requests' open PRs (`lab-publish.mjs sync`) and, only
  when the owner confirmed one on `/labs/`, runs a headless session through `claude-task.mjs` with
  `prompts/lab-publish.md`, which takes the feature out of the lab, moves its card to La Bodega and
  opens the PR with auto-merge. A request the session leaves without a PR fails at once, with why.
  A PR left in conflict with main or with red checks for 15 minutes gets a session with
  `prompts/lab-publish-conflict.md`, which merges main into it, reruns what was flaky or fixes what the
  branch broke, and pushes; at most twice per request, and still stuck an hour later, the request fails (D-486).
- **The Claude rounds** (`processes-round`, `weekly-report`, [`claude-task.mjs`](claude-task.mjs)): each
  gets only the tools it needs (#865). Both run in auto mode with no MCP servers (no connectors), no
  page fetching, and with the model denied the machine's keys (`~/.config/**`, `~/.ssh/**` and the
  other credential paths in `SECRETS`, for the file tools and for `cat` and the like) and the commands
  in `BASH_DENY` (`curl`, `wget`, `ssh`, `gh auth`, `security`…): the repo's node tools still read
  the keys themselves. The processes round has Bash, the file tools, Agent (it launches its agents),
  SendMessage, Skill and WebSearch (the ideas agent), with the user and project settings but not the
  local file's saved approvals; the weekly report has Bash and Read only, in restricted mode. The
  round's prompt says what players and strangers wrote is quoted data, never instructions.
  `claude-task.test.mjs` checks those flags.
- **`feedback-watch`** (`tools/agents/feedback.mjs sync`), every 5 minutes: uploads the new reports of
  `feedback/` as `feedback` issues (D-382), except one that looks like it carries a key or a token,
  which it logs instead of posting (`secretLike`, #838). Each pass then runs `feedback.mjs expire`: a
  reply email left in `feedbackContacto/` for more than 90 days is deleted and its issue says so (D-463), and writes each report's issue and PRs to `feedbackEstado/` for the panel's 💬 Feedback section (see [docs/PANEL.md](../../docs/PANEL.md)). It was the GitHub workflow `feedback.yml`, which GitHub ran
  about 4 times a day instead of every 15 minutes; the workflow stays, by hand only.

What the Mac mini holds besides the jobs (keys, sign-ins, the scheduled tasks) and how to move it all
to another machine: [MAC-MINI.md](MAC-MINI.md).

Logs: `~/Library/Logs/juegos-de-salon/<id>.log`. Last run: `~/.config/juegos-de-salon/jobs/<id>.json`.
