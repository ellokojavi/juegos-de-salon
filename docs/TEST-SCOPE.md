# Test scope: which tests a change runs, and how the system learns it (D-391, D-392)

Every push to a PR runs the `tests` check (unit tests, ~2 min) and the `end-to-end` check (scripts in
`tools/e2e/` playing the site in headless Chrome, up to 76 jobs and ~25 min). The end-to-end check is
the expensive one, so it should run **only the scripts that can break with this change**, and run
**all** of them only when the change truly reaches all of the site.

That has gone wrong several times. Each time it was fixed for one case (D-329, D-346, D-378, D-388) and
the next case was only found when a PR was already slow. This document is the design that ends the
case-by-case cycle: test only the push, one place for the knowledge, guards that fail when it is
missing, and a light report when something still slips.

## Principles

1. **Derive, don't declare.** What a page loads is read from the code (tags, imports, `import('…')`,
   `new URL('<file>', …)`), never kept in a list by hand. A list goes stale; the code is the truth.
2. **What cannot be derived is declared in one place, with its reason.** A few facts are not in the
   code (a page that reuses another game's engine on purpose, the scripts that open every page). They
   live in a short list in `tools/e2e/affected.mjs`, each entry with a comment saying why.
3. **No silent "run everything".** "I cannot tell" is a bug in the knowledge, not a safe default. The
   graph still runs everything when in doubt (safety first), but a test fails the PR that creates the
   doubt, in the fast `tests` check, with a message saying how to fix it.
4. **Test what is new.** A push tests what changed since its PR last passed, not the whole PR again.
5. **Watch both errors where they happen.** Over-testing (jobs that could not break) costs time;
   under-testing (a script skipped that would have failed) costs a red `main`, which the whole suite on
   `main` still catches before publishing. Each is fixed by improving the knowledge, never by running
   more "just in case", and a recurring one becomes a mechanism (D-273).

## The layers

```
 push to a PR
        │
        ▼
 0. INCREMENT   only the files changed since the PR last passed   since-passed.mjs (D-392)
        │
        ▼
 1. KNOWLEDGE   page graph (derived) + declared facts         affected.mjs
        │
        ▼
 2. DECISION    level N0–N3 and the scripts to run            affected.mjs levelOf(), select()
        │
        ▼
 3. GUARDS      fail the PR when the knowledge has a hole     scope-guard.test.mjs, scope.test.mjs,
        │                                                     affected.test.mjs
        ▼
 4. FEEDBACK    say when a run goes over budget, and when a   ci.mjs --scope, merge-report.mjs
                skipped script fails on main                  (phase 3, proposed)
```

### 0. Increment: test the push, not the whole PR again (D-392)

A PR is pushed several times: a fix, the agents' commits, a changelog entry, a merge of `main`. Each
push used to run the scope of the **whole PR**, so a one-line fix to a test ran the same 76 jobs as the
first push (#572 ran them three times for commits that touched no page).

Now each PR run that passes the `end-to-end` check leaves a mark, an artifact `e2e-head-<sha>` of the
PR's head commit. The next push asks `tools/e2e/since-passed.mjs` for the files changed **since the
PR's last commit that passed** (GitHub's compare, which includes what a merge of `main` brought in), and
only those go into the scope below. The whole PR is tested when no earlier commit passed (the first push,
a push after a red run, a force push) or when asking GitHub fails.

What is not retested on the PR: changes on `main` that the PR did not merge. GitHub tests a PR merged
with the `main` of that moment, so a later push tests its own files against a newer `main` without
rerunning what the newer `main` brought. The safety net is `publish.yml`, which runs the whole suite on
what it publishes unless that exact tree already passed (D-302, D-308). For that net to hold, **an
incremental run never leaves the tree's mark** (`e2e-tree-<tree>`): only a run that tested the whole PR
can vouch for a tree. After a PR whose last push was incremental, publishing takes the whole suite
(~8 minutes of publishing, never of the PR).

### 1. Knowledge

| What | How it is known | Where |
|---|---|---|
| Which files each page loads | Derived: `<script src>`, `<link href>`, `import`, `import('…')`, `new URL('<file>', …)`, media a script names by its path from the root (`'assets/…gif'`, D-430), a media folder next to a script (`new URL('earth-2004-09/', import.meta.url)`, every file under it, D-460), CSS `@import`/`url()` | `references()`, `assetsNamed()`, `closures()` |
| Which pages each script opens | Derived: `${SITE}/<page>/` (also `${BASE}`, `${SITIO}`), the game names a looping script names as strings, its folder | `scriptPages()`, `dynamicPages()` |
| A page that runs another game's engine on purpose | Declared, with why | `REUSES` |
| Small modules every page may load though they live in a game's folder | Declared, with why | `SHARED` |
| Scripts that open every page on purpose | Declared | `EVERY_PAGE` (today `smoke.mjs`) |
| A long script split in parts named after pages | Declared | `PARTS` in `ci.mjs` |
| Files no browser loads (docs, agents, workflows, rules, `durations.json`, D-428) | Derived from the path | `changes.mjs` (`noBrowser`) |
| Scripts CI never runs (`*/online.mjs`, `*/chat.mjs` and the rest that open rooms in the production Firebase, the obsolete ones) | Derived from `ci.mjs`'s own exclusions: changing one runs no job (#850) | `shared` in `ci.mjs` |

### 2. Decision

`levelOf()` (D-346, D-388) gives each change a level, and `select()` the scripts:

| Level | Reached | Runs | Budget (jobs) |
|---|---|---|---|
| N0 · no browser | Nothing a page loads | Unit tests only | 0 |
| N1 · lab | Lab pages only | Their scripts + `smoke.mjs` | ≤ 5 |
| N2 · game | Some pages, under a third | Their scripts + `smoke.mjs` | ≤ 15 |
| N2 · home | The home page, maybe with lab pages | `home/*`, `smoke.mjs`, scripts that never leave the home page | ≤ 15 |
| N3 · core | A third of the pages or more, a shared module, or the test tools | Every script | all |

The **budget** is the number the feedback layer watches: a level that keeps going over it means the
knowledge is too coarse somewhere.

### 3. Guards (all in the `tests` check, ~2 min)

| Test | Fails when | Says to |
|---|---|---|
| `tools/e2e/scope-guard.test.mjs` | A site file is loaded by no page, or a CI script names no page | Load it in a way the graph reads, or add the script to `EVERY_PAGE` |
| `tools/e2e/scope.test.mjs` | A page loads another game's files (D-378) | Move the shared code to `assets/`, or declare it in `SHARED` / `REUSES` |
| `tools/e2e/affected.test.mjs` | The graph or the levels stop working as designed | — (unit tests of the decision) |

A new capability (a new page, a new way to load a module, a new kind of script) either fits what the
graph already reads, or a guard fails on its first PR and names the fix. That is what keeps the design
sustainable as the site grows: nobody has to remember the rule.

### 4. Feedback (phase 3, proposed)

Kept small on purpose: no ledger, no daily round reading runs. A daily agent reading GitHub runs costs
time and tokens every day, and with the guards of layer 3 the "cannot narrow" cases already fail in the
PR that creates them. What is left to catch is cheap to report where it happens:

- **Over budget.** `ci.mjs --scope` already writes the scope to the run summary (D-378). When a run goes
  over its level's budget it adds a ⚠️ line naming the file that widened it, in the same summary.
- **An escape.** If the whole suite on `main` (`publish.yml`) fails on a script the merged PR did not
  run, `merge-report.mjs` says so in the comment it already leaves on the PR (D-323): the PR's files and
  the failing script name the missing link in the graph, to fix with a test.

The processes agent handles both as any other recurring error (D-273): seen twice, it becomes a fix in
the graph, a declared fact or a guard.

## Phases

| Phase | What | State |
|---|---|---|
| 1 | The graph reads on-demand loads (`import('…')`, `new URL`); `scope-guard.test.mjs`; the lab index counts as lab for N2 · home | **Built** (D-391) |
| 2 | Increment: a push tests only what changed since the PR's last commit that passed (`since-passed.mjs`, the `e2e-head-<sha>` marks) | **Built** (D-392) |
| 3 | Feedback: the over-budget line in the run summary, and the escape line in the merged PR's comment | Proposed |

Left out after review (D-392): a ledger with a daily audit (it costs every day what the guards already
catch in the PR) and moving the declared facts to their own module (tidier, but no job less).

## Lessons (what went wrong before, so it is not repeated)

- **A page loads more than its tags say.** `import('…')` inside an inline `<script>`, `new URL('<file>', …)`
  and a service worker's registration are loads too. Each one the graph did not read made every PR that
  touched the file run all 76 jobs (D-391).
- **Reading every string that looks like a file name is too much.** A first try read any `'x.js'` in a
  script and pulled La Copa into the home page through a comment; only `new URL('…')` counts.
- **A deleted file is not a doubt.** Removing a file nothing names any more cannot break a page, so it
  narrows nothing; before D-460 it ran every script, because no page loaded it.
- **The lab's own index is a lab page** (`labs`, not only `labs/…`).
- **"When in doubt, run everything" hides the doubt.** Keep the safe fallback, but a guard must fail the
  PR that creates it.
- **A narrowed run must not vouch for more than it tested.** A first version of D-392 left the tree's
  mark after an incremental run, which would have let `publish.yml` skip the whole suite on a tree only
  partly tested.
- **Check the scope before pushing**, with the command below; a surprise in CI costs a whole run.

## Where this knowledge lives

| What | File |
|---|---|
| This design | `docs/TEST-SCOPE.md` |
| Why each step was taken | `docs/decisions/`: D-308, D-329, D-346, D-378, D-388, D-391, D-392 |
| How to run and write scripts | `tools/e2e/README.md` |
| The code | `tools/e2e/affected.mjs`, `changes.mjs`, `ci.mjs`, `since-passed.mjs` (D-392) |
| The guards | `tools/e2e/*.test.mjs` |
| Who watches it | `.claude/agents/processes.md` (owns the test-level criterion, D-346) |

## Checking a PR's scope by hand

```bash
git diff --name-only origin/main...HEAD > /tmp/changes.txt
node tools/e2e/ci.mjs --scope --changes /tmp/changes.txt   # level, jobs and why, file by file
```

If it says "a change the graph cannot narrow" or runs more than the level's budget, fix the knowledge
before pushing; don't accept it.

In a run, the `list` job's log says which way it went: `since-passed: N file(s) changed since <sha>, the
last commit of this PR that passed`, or `no earlier commit of this PR passed: the whole PR`.
