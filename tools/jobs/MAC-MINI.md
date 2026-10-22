# The owner's Mac mini

What runs on the Mac mini and what it holds that is not in the repo, so the project can move to
another machine (D-383). `tools/jobs/jobs.json` is the list of jobs; this page is everything else the
machine needs. `machine.test.mjs` fails if a `mac` or `app` job, or a file under
`~/.config/juegos-de-salon/` that the code reads, is missing here.

## What runs there

| Job | Kind | Schedule | How it is set up |
|---|---|---|---|
| `inbox-watch` | launchd (`cl.juegosdesalon.inbox-watch`) | every 5 min | `node tools/jobs/jobs.mjs install` |
| `feedback-watch` | launchd (`cl.juegosdesalon.feedback-watch`) | every 5 min | `node tools/jobs/jobs.mjs install` |
| `processes-round` | scheduled task in the Claude app (`ronda-procesos-juegos-de-salon`) | 4:30 Pacific, daily | by hand in the app → Scheduled |
| `weekly-report` | scheduled task in the Claude app | Sundays 08:00 local | by hand in the app → Scheduled |

The launchd plists are generated from `jobs.json` (`~/Library/LaunchAgents/cl.juegosdesalon.<id>.plist`)
and run the code of the **main folder** (today `~/Documents/Claude/Projects/juegos-de-salon`), which
stays on `main`; `jobs.mjs run` fast-forwards it to origin/main before each run (only when clean and on `main`; the log says when it could not). The app's scheduled tasks live
only in the Claude app: their prompts are not in the repo.

## What the machine holds (never in the repo)

In `~/.config/juegos-de-salon/` (copy the folder to the new machine, by hand, never through git):

| File | What it is | Used by |
|---|---|---|
| `firebase-admin.json` | Firebase service account key (also the `FIREBASE_ADMIN_JSON` secret on GitHub) | panel, reports, `rules.mjs`, `labs-key.mjs`, `ideas.mjs` |
| `buzon.json` | the inbox user, limited by the rules to `buzon/` (D-318) | `inbox.mjs`, `inbox-watch` |
| `mail.json` | the account that sends the replies and the weekly report | `send-mail.py` |
| `vapid-privada.txt` | backup of the push notifications' private key (the real one is a GitHub secret) | `vapid.mjs` |
| `inbox-log.jsonl`, `mail-log.jsonl` | what was triaged and what was sent (history, not needed to run) | `inbox.mjs`, `send-mail.py` |
| `jobs/<id>.json` | each `mac` job's last run (recreated on its own) | `jobs.mjs status` |

Signed in on the machine: `gh auth login` (the jobs create issues with it) and `claude` (the
support agent runs headless). Logs: `~/Library/Logs/juegos-de-salon/`. Optional: Tailscale
(`tailscale serve`, to try the site on a phone, D-67).

## Moving to another machine

1. Install Node (24), Python 3, `git`, `gh` and Claude Code; sign in to `gh` and `claude`.
2. Clone the repo; that folder is the main folder.
3. Copy `~/.config/juegos-de-salon/` from the old machine.
4. `node tools/jobs/jobs.mjs install`, and on the old machine `node tools/jobs/jobs.mjs uninstall <id>`
   for each `mac` job, so the two do not both run.
5. Recreate the app's scheduled tasks with the same ids and schedules, and turn them off on the old one.
6. Keep it awake: System Settings → Energy → prevent automatic sleeping.
7. `node tools/jobs/jobs.mjs status`: every `mac` job ✅ within 10 minutes.
