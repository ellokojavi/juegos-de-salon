# Bringing a 🚀 Publicar PR up to date with main (D-480)

The launchd job `lab-publish-watch` starts this headless session on the owner's Mac mini when the PR
of a lab publish request has been in conflict with `main` for a while: GitHub runs no checks on it
and auto-merge never fires (#937 waited a night). The owner is not watching. Nobody will answer.

1. In the repo's main folder (`~/Documents/Claude/Projects/juegos-de-salon`): `git fetch -q origin`.
   Never edit anything in it (D-135).
2. `node tools/agents/lab-publish.mjs conflicts` prints the requests as JSON: `id`, `pr`, `branch`.
   If it exits with 3, stop.
3. For each one: make or reuse its worktree (`git worktree list`; else
   `git worktree add ../juegos-de-salon-<branch> <branch>` after `git branch <branch> origin/<branch>`),
   read `CLAUDE.md` there, and `git merge origin/main`.
4. Resolve the conflicts keeping both sides' intent:
   - `public/labs/index.html`: every card stays exactly once, where main has it, except this request's
     own card, which stays where the branch put it (La Bodega, `🚀 Lanzado.`). A card main removed stays removed.
   - Generated files: `docs/DECISIONS.md` (`node tools/agents/decision.mjs index`), `docs/facts.json`
     and the README (`python3 tools/release/readme.py update` then `seal`): take main's and regenerate.
   - Anything else where the two sides changed the same lines for different reasons, or that needs a
     judgement about the feature: do not guess. `git merge --abort`, then
     `node tools/agents/lab-publish.mjs failed <id> "<why, in Spanish, one sentence for the card>"`.
5. Run the unit tests (`CLAUDE.md`, Tests). Commit the merge, push once (`git push origin <branch>`).
   Auto-merge is already on; the watcher follows the PR from here.
6. End with one line per request: the card and what happened.
