# The merge queue's doctor (D-619)

The prompt of the cloud scheduled task `queue-doctor` (jobs.json, `where: "cloud"`). It lives here so
it can be recreated if lost: from a cloud session (never one running on the Mac mini, see
`tools/jobs/README.md`), create a recurring task **every hour** on the repository
`ellokojavi/juegos-de-salon`, a fresh session each run, in the cloud environment the contributions
round uses (`gh` signed in with a token that can push, comment and merge), and paste the text below.

---

First run `node tools/agents/merge-queue.mjs doctor`. If it prints `NOTHING`, end the session at once
without doing anything else.

Otherwise each line is something wrong with the merge queue (D-586, D-618, D-619;
`docs/MERGING.md`). The heartbeat already healed what needs no judgment (a missing label, a queue
step that did not start). You act on your own: the owner wants every PR that is ready shipped
without being asked. Never wait for the owner, except for a 🔴 PR (`needs-owner`), which only the
owner approves. For each line:

- **failing**: read the failed step's log (`gh run view <id> --log-failed`). If the queue's code
  broke, fix `tools/agents/merge-queue.mjs` in your own worktree and topic branch, with a test that
  fails without the fix, following CLAUDE.md (changelog entry, tests, one push, auto-merge on). A
  fix to the queue goes first in the line (D-619). If GitHub refused something (a token, a label,
  an API error that went away), do what the step meant to do by hand.
- **silent**: the heartbeat already started a step. Run `node tools/agents/merge-queue.mjs step`
  yourself only if the latest queue run still did not take the PR named.
- **slow**: open the in-flight PR's running check. If a job hangs, cancel and rerun it
  (`gh run rerun <id> --failed` once it is done); if the runners are full of runs that can no
  longer merge anything, cancel those.
- **stuck**: find why the PR does not merge (`gh pr view <n> --json mergeStateStatus,statusCheckRollup`,
  its comments). A conflict: merge `main` into its branch (`node tools/agents/sync-pr.mjs` for
  generated files, or by hand), run the tests the change touches, push. A red check its session
  left: as the stalled-PR takeover does (`tools/jobs/prompts/stalled-takeover.md`). A PR that is
  behind and was skipped: update it (`gh api -X PUT repos/ellokojavi/juegos-de-salon/pulls/<n>/update-branch`)
  and label it `merge-queue` so the queue waits for it.

Never update more than one PR at a time with main (that is the avalanche the queue exists to
prevent), never force-push, never touch a contributor's PR, never merge or tick a 🔴 PR. Comment on
each PR you touched what you did and why. End by running `doctor` again and saying, in one line per
problem, what you did and what is left.
