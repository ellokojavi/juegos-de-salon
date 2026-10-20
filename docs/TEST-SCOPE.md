# Test scope: which tests a change runs, and how the system learns it (D-391)

Every push to a PR runs the `tests` check (unit tests, ~2 min) and the `end-to-end` check (scripts in
`tools/e2e/` playing the site in headless Chrome, up to 76 jobs and ~25 min). The end-to-end check is
the expensive one, so it should run **only the scripts that can break with this change**, and run
**all** of them only when the change truly reaches all of the site.

That has gone wrong several times. Each time it was fixed for one case (D-329, D-346, D-378, D-388) and
the next case was only found when a PR was already slow. This document is the design that ends the
case-by-case cycle: one place for the knowledge, guards that fail when it is missing, and a loop that
measures and fixes it on its own.

## Principles

1. **Derive, don't declare.** What a page loads is read from the code (tags, imports, `import('…')`,
   `new URL('<file>', …)`), never kept in a list by hand. A list goes stale; the code is the truth.
2. **What cannot be derived is declared in one place, with its reason.** A few facts are not in the
   code (a page that reuses another game's engine on purpose, the scripts that open every page). They
   live in a short list in `tools/e2e/affected.mjs`, each entry with a comment saying why.
3. **No silent "run everything".** "I cannot tell" is a bug in the knowledge, not a safe default. The
   graph still runs everything when in doubt (safety first), but a test fails the PR that creates the
   doubt, in the fast `tests` check, with a message saying how to fix it.
4. **Measure both errors.** Over-testing (jobs that could not break) costs time; under-testing (a
   script skipped that would have failed) costs a broken `main`. Both are measured, and each is fixed
   by improving the knowledge, never by running more "just in case".
5. **The system improves itself.** The processes agent reads the measures in its daily round and turns
   each recurring miss into a fix in the graph, the declared list or a guard (D-273: a mechanism, not
   an instruction).

## The four layers

```
 change (files in the PR)
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
 4. FEEDBACK    measure over- and under-testing, fix          ledger + processes round (phase 2–3)
```

### 1. Knowledge

| What | How it is known | Where |
|---|---|---|
| Which files each page loads | Derived: `<script src>`, `<link href>`, `import`, `import('…')`, `new URL('<file>', …)`, CSS `@import`/`url()` | `references()`, `assetsNamed()`, `closures()` |
| Which pages each script opens | Derived: `${SITE}/<page>/` (also `${BASE}`, `${SITIO}`), the game names a looping script names as strings, its folder | `scriptPages()`, `dynamicPages()` |
| A page that runs another game's engine on purpose | Declared, with why | `REUSES` |
| Small modules every page may load though they live in a game's folder | Declared, with why | `SHARED` |
| Scripts that open every page on purpose | Declared | `EVERY_PAGE` (today `smoke.mjs`) |
| A long script split in parts named after pages | Declared | `PARTS` in `ci.mjs` |
| Files no browser loads (docs, agents, workflows, rules) | Derived from the path | `changes.mjs` (`noBrowser`) |

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

### 4. Feedback

Two signals, measured from GitHub runs, not from memory:

- **Over-testing.** For each PR run: its level, its jobs, its minutes, and the reason the scope gave
  (`ci.mjs --scope` already writes it to the run summary, D-378). A run at N3 for "a change the graph
  cannot narrow", or one over its level's budget, is a candidate. The file that caused it is in the
  summary's table.
- **Under-testing (an escape).** `publish.yml` runs the whole suite on `main` unless the tree already
  passed (D-302, D-308). If a script fails there that the PR skipped, the scope missed a dependency:
  the PR's files and the failing script name the missing edge.

Both go into a ledger, `docs/test-scope.json` (one entry per merged PR: number, level, jobs, minutes,
reason, escapes), written by `node tools/e2e/scope-audit.mjs record`. The processes agent runs
`scope-audit.mjs check` in its daily round (D-276):

1. It lists the misses since the last round: over-budget runs with their file, and escapes with their
   PR and script.
2. A miss seen once is recorded (`processes.mjs pattern`); seen twice, it gets a mechanism: a fix in the
   graph (a new load pattern it reads), a declared fact with its reason, or a new guard, in a PR with
   a test (`processes.mjs mechanism`, D-273).
3. Its weekly report says how many end-to-end minutes PRs used, against the week before.

## Phases

| Phase | What | State |
|---|---|---|
| 1 | The graph reads on-demand loads (`import('…')`, `new URL`); `scope-guard.test.mjs`; the lab index counts as lab for N2 · home | **Built** in this PR (D-391) |
| 2 | `tools/e2e/scope-audit.mjs` (`record`, `check`) and the ledger `docs/test-scope.json`, fed from the runs' summaries through `gh`; in the processes round | Proposed |
| 3 | Escapes: `publish.yml`'s report names a failing script the PR skipped, and the audit records it | Proposed |
| 4 | The declared facts (`REUSES`, `SHARED`, `EVERY_PAGE`, `PARTS`) move to one module, `tools/e2e/scope-facts.mjs`, each with its reason and decision | Proposed |

## Where this knowledge lives

| What | File |
|---|---|
| This design | `docs/TEST-SCOPE.md` |
| Why each step was taken | `docs/DECISIONES.md`: D-329, D-346, D-378, D-388, D-391 |
| How to run and write scripts | `tools/e2e/README.md` |
| The code | `tools/e2e/affected.mjs`, `changes.mjs`, `ci.mjs` |
| The guards | `tools/e2e/*.test.mjs` |
| Who watches it | `.claude/agents/processes.md` (owns the test-level criterion, D-346) |
| The measures (phase 2) | `docs/test-scope.json` |

## Checking a PR's scope by hand

```bash
git diff --name-only origin/main...HEAD > /tmp/changes.txt
node tools/e2e/ci.mjs --scope --changes /tmp/changes.txt   # level, jobs and why, file by file
```

If it says "a change the graph cannot narrow" or runs more than the level's budget, fix the knowledge
before pushing; don't accept it.
