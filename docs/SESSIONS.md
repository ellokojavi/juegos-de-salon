# Working in parallel sessions

<!-- Moved out of CLAUDE.md by D-497: read on demand; CLAUDE.md points here. -->

How several Claude sessions share this repo, how a fork contributes, and how tests run side by side. CLAUDE.md keeps the one-line rules; this is the detail.

## Several sessions at once (D-135)

Several Claude sessions may be working in this repo at the same time:

- **Each session works in its own worktree** (`git worktree add ../juegos-de-salon-<topic> -b <branch>`),
  never in the main folder: there, one session's uncommitted files leak into another's commit.
- **Branches named by topic** (`copa-reglas-plegadas`, `tyf-jugar-solo`), not by version.
- **The version is assigned on merge** (D-300): the PR leaves its entry **without a number** in
  `changelog/<branch>.md` (`node tools/release/changelog.mjs new [patch|minor]`), and the number comes
  from the order in which PRs land on `main`. `CHANGELOG.md` is not touched in a PR: that is where they all collided.
  A PR opened before this moves its entry over with `node tools/release/changelog.mjs migrate`.
- **Decisions (D-n) are reserved** before they are written (D-301):
  `node tools/agents/decision.mjs reserve [--count n]` pushes a `reserve/D-n` branch that GitHub
  rejects if it already exists, so two sessions never take the same number, and writes the skeleton
  of its file in `docs/decisions/`. Each decision is its own file (D-394), so two PRs do not collide; the
  index `docs/DECISIONS.md` is generated (`decision.mjs index`, also when it collides on pulling
  `main`), never edited by hand. When two PRs that touch decisions merge one after the other, `main`'s
  index falls a row behind: the `tests` check then rebuilds it in its copy and only warns, and the
  processes round rebuilds it on `main` (D-401). A branch from before D-394 that still has the old single
  DECISIONES.md runs `decision.mjs split`.
- **A single push at the end** (D-303): commits are made locally and pushed together when the
  work, including the agents' work, is ready. Each push to a PR launches the 58 scripts and cancels
  the previous run's: a third of the end-to-end compute was going to canceled runs. Since D-392 a
  push after a green `end-to-end` run tests only the files changed since that commit, so it is cheap;
  a push after a red or canceled run retests the whole PR again.
- Before touching another PR's branch, ask that session (ListAgents / SendMessage).
- **On merge, the worktree is deleted**, in the same move, from the main folder (D-206):
  ```bash
  git worktree remove ../juegos-de-salon-<topic>   # refuses if anything is left uncommitted
  git branch -d <branch>                           # refuses if the branch was not merged
  ```
  If either refuses, there is work that is not in `main`: look at it before forcing (`--force`, `-D`).
  With no pending work there is **a single** `juegos-de-salon` folder (`git worktree list`; if a
  folder was deleted by hand, `git worktree prune`). With auto-merge, the PR may merge while
  nobody is watching: **at the start of each session**, a hook (`.claude/settings.json`) runs
  `node tools/agents/clean-worktrees.mjs`, which deletes the worktrees whose branch already reached `main` through a
  merge and names those with uncommitted changes (D-218). GitHub deletes the remote branch on merge.
- **No worktree is left unused** (D-252, the owner's request): the session that creates a worktree deletes it
  as soon as it knows it will not produce a PR (the work was already done, was discarded or was merged into another), without
  waiting for the hook, and when its work is done only worktrees with an open PR remain. The hook sweeps
  whatever slips through, including the worktrees the Claude app creates (in .claude/worktrees): the **empty** ones (no commits
  of their own, older than a day) and the **abandoned** ones (commits outside `main`, no open PR and
  idle for more than three days), which push their branch to GitHub before being deleted so nothing is lost
  (and `pending-watch.yml` lists that branch until someone opens its PR or deletes it, D-441).
  It never touches a worktree with uncommitted changes; **test junk** (`undefined/`,
  `--parte/` with only Chrome profiles and screenshots) does not count as a change and goes with the worktree.
  It also deletes **local branches** without a worktree that already reached `main` or that no longer have a branch
  on GitHub holding all their commits; one with commits that exist only here is named and left alone.
  Besides the hook, **the processes agent's round runs it every day** and counts it in its report
  (D-315). The scripts in `tools/e2e/` take their output folder with `output()`, never from
  `process.argv[2]` by hand.
- **Tests in parallel:** each session serves its worktree on its own port (`python3 -m http.server 87xx -d public`),
  and runs the scripts with `SITE=http://localhost:87xx`. Chrome ports are not chosen: each
  Chrome takes a free one and dies with its script, also if the script fails or is cut off (`cdp.mjs`,
  D-213). If one were left alive, look for it by its profile, not by the port, and never with a bare
  `pkill -f remote-debugging-port`. Details in [tools/e2e/README.md](tools/e2e/README.md).

## If you work in a fork (D-189)

Outside contributors follow [CONTRIBUTING.md](CONTRIBUTING.md): topic branch and PR to
`ellokojavi/juegos-de-salon`. There Claude does **not** stamp a version (its entry goes without a number in
`changelog/`, as in every PR), numbers decisions as `D-??` (it cannot reserve), does not publish Firebase rules or read the panel or the reports (they need the
owner's key) and does not merge. Everything else in this guide applies the same.

## Tests (C-12)

GitHub runs every `*.test.mjs` and `*.test.py` on each PR (`.github/workflows/tests.yml`), so
a new test is not added to any list: one that tests something special says so on its first
line. Run them here anyway before opening the PR, in parallel (~20 s instead of a minute):

```bash
git ls-files '*.test.mjs' | xargs -P8 -I{} sh -c 'node "{}" > /dev/null 2>&1 || echo "FALLA {}"'
for f in $(git ls-files '*.test.py'); do python3 "$f" || echo "FALLA $f"; done
```

**End-to-end** (D-193, D-199, D-204): `tools/e2e/` plays complete games in headless Chrome,
and GitHub runs on each PR every script its changes reach, except those that open rooms in the
production Firebase. For a script to fail red, it must print ✗ or ❌ or exit with an error.

**The `end-to-end` check is the gate, not your machine** (D-428): GitHub runs the PR's scripts in
18 parallel jobs in 6–7 minutes; the same list one after another here took up to 10, and in October
a third of the sessions' working time went to running locally what CI then ran again. Here, run
only the script of the screen you changed while you work (in the background when it is long), and
look at the screens with `look.mjs`; **never the whole `ci.mjs` before pushing**. To see which
scripts the PR will run: `git diff --name-only origin/main > /tmp/changes && node tools/e2e/ci.mjs --list --changes /tmp/changes`.
If the check goes red, its run summary and its `screenshots-g<n>` artifact say what failed.

```bash
node tools/e2e/ci.mjs cup/tournament.mjs        # one script, with a summary (or one part: cup/tournament.mjs:cup)
node tools/e2e/look.mjs ahorcado game --width 320 [--lang pt]       # a single screen (C-8)
node tools/e2e/look.mjs panel data --width 900                      # the panel, with seeded data
```

The paths to each screen are in `tools/e2e/paths.mjs`: adding one is adding an entry, and
with that the screen also enters the language tests. To see it on a real phone,
`tailscale serve --bg 8765` (D-67; turned off with `tailscale serve --https=443 off`).
