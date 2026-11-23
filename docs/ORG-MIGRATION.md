# Moving the repo to an organization, for GitHub's merge queue (plan, not started)

**Status:** plan only, written 2026-11-23 at the owner's request. Nothing here has been done.
The owner runs it when no new features are in progress and both the sessions and GitHub's runners
have room. When it runs, it gets a D-n (reserve it then) that replaces D-586.

## Why

- About 30–60 PRs merge a day (2026-11-16 → 23: 17, 47, 61, 44, 45, 26, 29, 31).
- `main` requires branches up to date (D-586). The homemade queue (`merge-queue.yml`) brings **one** PR
  at a time up to date and re-runs `tests` + `end-to-end` (18 min median, 39 min p90 in the last two
  days). That is 2–3 merges an hour at best, so on busy days PRs wait about an hour.
- The fix is to test PRs **in batches** (main + A + B + C tested once; if it fails, split it to find
  the culprit), and to **test ahead** (main+A and main+A+B at the same time). GitHub's merge queue
  does both. It is only offered on repos owned by an **organization** (D-586), and a free organization
  gets it for public repos.
- Concurrency is a separate limit: GitHub Free runs 20 jobs at a time, and one full `end-to-end` uses
  about 18 (measured 2026-11-23: 20 running, 33 queued). The migration does not change that limit. An
  organization on GitHub Team raises it to 60 (decided separately; see "Costs").

## What does NOT change

- The site and its address: `juegosdesalon.cl` (the apex `A` records point at GitHub Pages' IPs, the
  same for every account).
- Firebase, its data and its rules; push subscriptions (VAPID keys do not depend on the repo).
- Git history, branches, issues, PRs, labels, the wiki and stars all move with a transfer, and GitHub
  redirects the old URLs (`github.com/ellokojavi/juegos-de-salon`, `git` remotes, API calls).
- The owner's GitHub account. `ellokojavi` stays the person; only the repo's owner changes.
  Checks that name the **person** (`sender.login == 'ellokojavi'` in `approve.yml` and `lane-box.yml`,
  `OWNER`/`INSIDERS` in `approve.mjs`, `lanes.mjs`, `pending.mjs`, `processes.mjs`, `merge-queue.mjs`)
  stay correct. Only references to the **repo path** have to be updated.
- **The previews repo stays under `ellokojavi`** (`ellokojavi/juegos-de-salon-previews`, served at
  `ellokojavi.github.io/juegos-de-salon-previews/`). Moving it would change the previews' origin: the
  lab key in each browser's storage, the referee gateway's allowed origins and `preview-seed.js` would
  all have to follow, for no gain. The `PREVIEWS_DEPLOY_KEY` deploy key works across owners.

## Choices to make before the day

| Choice | Proposal | Why |
|---|---|---|
| Organization name | `juegosdesalon` (free on 2026-11-23; `juegos-de-salon` and `juegosdesalon-cl` too) | Matches the domain. The repo becomes `juegosdesalon/juegos-de-salon` |
| Organization plan | Free | The merge queue is free for public repos. Team (US$4 per member a month, one member) only adds concurrency (20 → 60) |
| Rules on `main` | A **ruleset** (not the classic branch protection) with "Require merge queue" and the two required checks | Rulesets are where GitHub adds new options |
| Merge method in the queue | Merge commit (as today, D-216: `--merge`, never squash or rebase) | History and `changelog/<branch>.md` keep working as they do |
| Queue settings (start) | Build concurrency 3, group size min 1 / max 5, wait 2 min for more PRs, "only merge non-failing PRs" on, status check timeout 45 min | 3 groups × ~18 e2e jobs already fills 20 runners; tune with the numbers |
| Homemade queue | Keep the code one month with `MERGE_QUEUE=off`, then delete it in a later PR | Rollback path (see "Rollback") |

## Inventory: everything that names the repo (taken 2026-11-23)

`grep -rI ellokojavi` finds 72 files. Grouped by what breaks if left alone:

**Breaks or behaves wrong (must change on the day):**
- `public/sw.js:263`: recognises GitHub links by the prefix `/ellokojavi/juegos-de-salon/`. Accept both
  prefixes, so a cached link keeps working.
- `www.juegosdesalon.cl` is a DNS `CNAME` to `ellokojavi.github.io.` and must change to
  `juegosdesalon.github.io.` (at the `.cl` registrar's DNS). The apex `A` records stay.
- The repo secret `MERGE_QUEUE_TOKEN`: if it is a **fine-grained** token, its resource owner is
  `ellokojavi` and it stops reaching the repo once the org owns it. It is still needed after the
  migration (`visual-refs.yml` pushes with it, so its commit starts the checks) and by any other
  workflow that pushes and needs to wake checks. Make a new one with `juegosdesalon` as resource owner,
  and allow fine-grained tokens in the org settings first.
- **Required checks with no `merge_group` trigger**: `tests.yml` and `e2e.yml` only run on
  `pull_request`. With the merge queue, both must also run `on: merge_group`, or every group waits
  until the timeout and fails. See "Workflows".
- The Claude GitHub App: it is installed on the `ellokojavi` account. It must be installed on the
  `juegosdesalon` org too, with access to the repo. Otherwise the cloud sessions (claude.ai/code),
  `subscribe_pr_activity` and the cloud scheduled tasks lose the repo.

**Keeps working through GitHub's redirects, but update so nothing depends on them:**
- Defaults in scripts: `tools/e2e/groups.mjs:22` (`REPO`), `tools/e2e/already-tested.mjs:49`,
  `tools/push/release.mjs:97`, `tools/agents/preview-ready.mjs:18` (it uses the repo **owner** to
  build the previews URL: pin it to `ellokojavi`, since previews stay there, rather than reading
  `GITHUB_REPOSITORY_OWNER`, which becomes `juegosdesalon`).
- Links the player or owner sees: `public/assets/js/site-footer.js:15` (source code link),
  `public/panel/panel.js:1908`, `public/labs/publish.js:24`, `public/index.html`,
  `public/making-of/index.html`, `public/labs/footer/`, `public/labs/design/`.
- Agents and docs: `tools/agents/*.mjs` (sweep, round-watch, contributions, wait-pr, processes,
  lab-publish, failures, pending, feedback, dilemmas, decision, rules, ideas, approve, lanes,
  merge-queue), `tools/push/heartbeat-watch.mjs`, `tools/jobs/prompts/*.md` (launch,
  stalled-takeover, contributions, session-sweep), `.claude/skills/launch-game/SKILL.md`,
  `.github/pull_request_template.md`, `.github/workflows/{approve,lane-box,contrib-ready}.yml`, docs
  (`MERGING.md`, `SESSIONS.md`, `PREVIEWS.md`, `PANEL.md`, `REQUERIMIENTOS.md`, `games/routes.md`,
  `firebase/README.md`), `marketing/`, `CONTRIBUTING.md`, `LICENSE` (the copyright holder stays the
  person; only change a repo URL there), and the tests that carry the slug as a fixture.
- Generate the list again on the day: the counts above go stale fast.
  `grep -rIl 'ellokojavi/juegos-de-salon\b\|github.com/ellokojavi/juegos-de-salon' --exclude-dir=.git .`
  minus `changelog/archive/` and `docs/decisions/` (history, never rewritten).

**Outside the repo:**
- The Mac mini: the main clone's `origin` (`git remote set-url origin
  https://github.com/juegosdesalon/juegos-de-salon.git`; worktrees share it), and the 5 `mac` jobs in
  `tools/jobs/jobs.json` (inbox-watch, lab-publish-watch, referee, processes-round, weekly-report): read
  each launchd plist and script for a hard-coded repo slug.
- Claude cloud: the 3 `cloud` jobs (contributions, stalled-takeover, session-sweep) and the launch
  tasks (D-591) name the repo in their source and prompt. List them with `list_triggers` and update
  each one (`update_trigger`). Cloud environments that list `ellokojavi/juegos-de-salon` as a
  repository: add the new name.
- The 2 forks follow the transfer on their own. An open contributor PR stays open and points at the
  new repo.
- Firebase: check the authorised domains for sign-in still list `juegosdesalon.cl` (unchanged) and
  `ellokojavi.github.io` (previews, unchanged). Nothing to add unless the org's `github.io` is used,
  which it is not.

## Workflows: running the required checks in the merge queue

1. `tests.yml` and `e2e.yml` get `merge_group:` in `on:`. The check names (`tests`, `end-to-end`)
   must stay the same, so the queue recognises them.
2. **Scope in a merge group.** `e2e.yml` builds its groups from the PR (`PR`, `HEAD` from
   `github.event.pull_request`, `tools/e2e/affected.mjs`, `already-tested.mjs`). In a `merge_group`
   event there is no PR: use `github.event.merge_group.base_sha` and `head_sha`, and test what changed
   between them (the union of the PRs in the group). Never test less than that union (D-391, no
   degradation).
3. **Reuse.** A PR whose `end-to-end` passed on a main that differs from the group's base only in
   files outside its scope does not need everything again. That is the logic `already-tested.mjs`
   has; extend it to groups. Measure before and after: a group must not cost more runners than the
   PRs it carries would cost one by one.
4. Steps that only make sense on a PR (the preview comment, the "✅ both checks are green" comment,
   the artifact named after the PR's head) keep their `if: github.event_name == 'pull_request'`.
   Read every step for this.
5. `merge-queue.yml` is switched off (`MERGE_QUEUE=off`). `approve.mjs`'s step that "starts the
   Publish run such a merge does not wake" is no longer needed: merges made by the merge queue wake
   `publish.yml` on `push` to `main`. Check this in the rehearsal before removing it.
6. Statistics that read runs (`failures.mjs`, `failure-log.yml`, `round-watch.mjs`, the ci-health
   agent, `merge-report.mjs`, `merge-queue.mjs report`): `merge_group` runs have their own event and
   branch names (`gh-readonly-queue/main/pr-<n>-<sha>`). Make sure a red group is counted once, against
   the right PRs, and is not read as "main is red".

## The hardest edge case: conflicts in generated files

45 of the last 150 merged PRs (30 %) touched a generated file (`docs/DECISIONS.md`,
`docs/facts.json`, the README's generated blocks). Today `sync-pr.mjs` (D-580) resolves those
conflicts when a PR is brought up to date. **GitHub's merge queue cannot.** When two PRs in a group
both change the decisions index, the second one is removed from the queue with a conflict. Left
alone, that is many PRs a day kicked out.

Choose one before the day (proposal: B, then A when there is time):
- **A. Stop committing generated files in PRs.** Generate them on `main` after the merge (a bot commit
  from `publish.yml`). The `tests` check would then check that the source is valid, not that the
  generated file is fresh. This is the cleanest option, and the biggest change.
- **B. Re-queue automatically.** A workflow on `pull_request: [dequeued]`: if the reason is a
  conflict and the conflict is only in generated files, run `sync-pr.mjs` (merge main, regenerate,
  push with `MERGE_QUEUE_TOKEN`) and turn auto-merge back on, so the PR re-enters the queue. A real
  conflict gets one comment for its session, as today.
- Measure in the rehearsal how often it happens with groups of up to 5.

## Other edge cases

- **🔴 PRs** (D-519, D-540, D-575): the owner's tick turns auto-merge on (`approve.mjs`). With a merge
  queue, `gh pr merge --auto` enqueues the PR when its checks pass. Rehearse it: the tick must enqueue,
  not merge directly.
- **`gh pr merge <n> --auto --merge`** (D-216), used by every session: with a merge queue the method
  comes from the queue's settings. Check in the rehearsal that the flag is accepted and does nothing
  strange. If `gh` rejects it, change the command in CLAUDE.md, MERGING.md and the agents in one PR.
- **`wait-pr.mjs`** (D-400) reads the PR's state: it needs to know "in the merge queue" (the
  `mergeQueueEntry` field in GraphQL) and "removed from the queue", not only open, merged or closed.
- **A red group**: GitHub splits it and finds the PR that broke it. That PR leaves the queue, and its
  session must hear about it like a red check today (`subscribe_pr_activity` sends the event).
- **A flaky test in a group** throws out innocent PRs. A flake costs more in a batch, so the ci-health
  agent's flaky list matters more. Option: automatic retry of one group before it is split.
- **The publish lock** (`publish.yml`, `group: pages`): a group of 5 is one push to `main`, so one
  deploy and fewer queued deploys. The version (D-300) counts each `changelog/` entry, so a batch still
  bumps once per PR.
- **Firebase rules** published by `publish.yml` (`group: firebase-rules`): two PRs in one group that
  both change rules publish once, the merged result. That is fine, but run the rules test on the group.
- **Launches at a fixed hour** (D-591): the launch task flips a flag, it does not merge, so the queue
  does not delay it. A launch PR that must be live by a given hour must be enqueued with time to spare.
  Note this in `docs/LAUNCH.md`.
- **Contributor PRs from forks**: the queue runs their checks with the repo's permissions, on the
  merged group, not on the fork. The `contributions` agent's flow does not change; the owner's Yes
  still comes first.
- **The `merge-queue` label** and the homemade queue's comments: once the homemade queue is off,
  remove the label from open PRs, so nobody waits for a queue that is no longer running.
- **Links in old issues, PR comments and the changelog** keep working through the redirect. Never
  rewrite history.
- **Redirect risk**: GitHub's redirect from the old URL ends if a repo named `juegos-de-salon` is ever
  created again under `ellokojavi`. Never create one.
- **Concurrency**: the queue tests groups in parallel. With 20 runners and ~18 jobs per full
  `end-to-end`, a build concurrency above 2–3 only adds queued jobs. Raise it only with Team or with
  fewer jobs per run (the ci-health round of 2026-11-23 is working on that).

## Plan of action

### Phase 0: preparation (any time, no risk)
1. Back up every value that only exists as a secret: `FIREBASE_ADMIN_JSON` (or know how to generate
   a new service account key), `VAPID_PRIVADA` (**critical**: if lost, every push subscription
   breaks; confirm a copy exists outside GitHub), `PREVIEWS_DEPLOY_KEY` (can be regenerated, see
   PREVIEWS.md), `MERGE_QUEUE_TOKEN` (will be regenerated).
2. Write down the repo settings to restore if needed: Pages (`build_type: workflow`, `cname`
   `juegosdesalon.cl`, HTTPS enforced), the `github-pages` environment, the variables
   (`FIREBASE_ARCHIVE_APPLY=true`, `MERGE_QUEUE=on`), the `main` protection (required `tests` and
   `end-to-end`, strict, 0 reviews, no force pushes, no deletions), Actions permissions (read by
   default, may approve PRs), merge options (auto-merge on, delete branch on merge, all three methods
   allowed), and the 23 labels.
3. Create the `juegosdesalon` organization (Free). Owner: `ellokojavi`. Allow fine-grained tokens.
   Install the Claude GitHub App on it.
4. Verify `juegosdesalon.cl` as a domain of the org for Pages (Settings → Pages → verified domains,
   a DNS `TXT` record), so nobody else can claim it during the move.
5. Answer the open questions on a test repo (next phase).

### Phase 1: rehearsal on a test repo in the org (half a day, no risk)
On a public repo `juegosdesalon/queue-rehearsal` with two small workflows named `tests` and
`end-to-end` (both on `pull_request` and `merge_group`) and a ruleset with the merge queue:
- `gh pr merge --auto --merge` on 3–4 PRs at once: do they form a group, and how long does it take?
- Two PRs that conflict in one generated file: what does GitHub do, and what does the `dequeued`
  event carry? Prototype option B there.
- A PR that breaks the group: is it removed, and do the others merge?
- A push made by the merge queue: does it start a `push` workflow on `main`?
- Is a repo secret kept after a transfer? Transfer a second test repo with a dummy secret, variable
  and environment from `ellokojavi` to the org, and look.
- Write the answers in this file before Phase 2.

### Phase 2: the code PR, prepared and merged before the move (1–2 sessions)
One PR in this repo, which must work **both before and after** the transfer:
- `merge_group` in `tests.yml` and `e2e.yml`, with the group scope (Workflows 1–4). Under the user
  account no `merge_group` events arrive, so it changes nothing until the move.
- The generated-file conflict solution (A or B), written but switched off by a variable.
- `wait-pr.mjs` knows the queue states.
- `sw.js` accepts both GitHub prefixes. `preview-ready.mjs` pins the previews owner to `ellokojavi`.
- Every repo slug and URL comes from one constant or from `GITHUB_REPOSITORY`, with
  `juegosdesalon/juegos-de-salon` as the default. The redirect covers it until the move, and it is
  correct after.
- Tests for all of it. It merges through today's homemade queue.

### Phase 3: the day (about 2 hours, in a quiet slot)
1. Choose the slot: no sessions building features, few players (`node tools/firebase/in-progress.mjs`),
   no launch scheduled within 24 hours.
2. Drain: let open PRs merge or put them on hold; no new PRs during the window. Tell running sessions
   (ListAgents / SendMessage).
3. Pause the jobs that push or merge: `MERGE_QUEUE=off`; disable the cloud scheduled tasks and the Mac
   mini's launchd jobs that write to GitHub.
4. Transfer: repo Settings → Danger Zone → Transfer → `juegosdesalon`.
5. Check right away: the site loads at `https://juegosdesalon.cl/`, Pages still lists the custom domain
   with HTTPS, the secrets and variables are there (re-create from Phase 0 if not), the `github-pages`
   environment is there.
6. DNS: `www` `CNAME` → `juegosdesalon.github.io.` Check with `dig` and by opening
   `https://www.juegosdesalon.cl/`.
7. New `MERGE_QUEUE_TOKEN` (fine-grained, owner `juegosdesalon`, this repo, contents and pull requests
   write, workflows if needed). Set the secret.
8. Ruleset on `main`: required `tests` and `end-to-end`, merge queue with the settings above, no force
   pushes, no deletions. Then remove the old branch protection.
9. Claude: App access to the repo; update the cloud environments, the scheduled tasks (sources and
   prompts) and the Mac mini's `origin` and jobs. Turn the jobs back on.
10. Test PR: a changelog-only change, enqueued with `gh pr merge --auto --merge`. It must go through the
    queue, merge and publish. Then two PRs at once, to see a group of two.
11. Reopen the gates: tell the sessions, and turn on the generated-file solution.

### Phase 4: the following days
- Measure for 1–2 weeks with `merge-report.mjs` against the same period before: merges per day, time
  from green to merged (median, p90), PRs removed from the queue and why, "main is red" issues, runner
  minutes. Adjust group size and concurrency with those numbers.
- The documentation PR: a new D-n replacing D-586, `MERGING.md` (the merge queue section), CLAUDE.md
  ("Before proposing a merge" if the command changes), `SESSIONS.md`, `PREVIEWS.md` (previews stay under
  the user), `LAUNCH.md`, `tools/jobs/README.md`.
- After a month without a rollback: delete `merge-queue.yml`, `merge-queue.mjs` and the `merge-queue`
  label in one PR.

## Rollback

- **Before the transfer** (Phases 0–2): nothing to undo. The Phase 2 PR works under either owner.
- **Queue problems after the transfer**: turn off "Require merge queue" in the ruleset, put strict
  up-to-date back on, and set `MERGE_QUEUE=on`. The homemade queue works the same in the org (it only
  needs the new `MERGE_QUEUE_TOKEN`).
- **Serious problems with the org itself**: transfer the repo back to `ellokojavi` (redirects work
  again), restore the `www` `CNAME` and the Phase 0 settings.

## Costs

- The organization and its merge queue: free (public repo).
- Optional: GitHub Team, US$4 per member a month (one member, the owner), raises concurrency from 20
  to 60 jobs. Decide with Phase 4's numbers and the ci-health agent's report.
- Sessions: about 1 session for Phase 1, 1–2 for Phase 2, and one supervised session for the day.
