# Publishing a lab feature for everyone, as the owner asked from /labs/ (D-480)

The launchd job `lab-publish-watch` (in `tools/jobs/jobs.json`) starts this headless session on the
owner's Mac mini when the owner tapped **🚀 Publicar para todos** on a card of `/labs/` and
confirmed it. The owner is not watching the terminal: they see the state on that card, which this
session moves with `node tools/agents/lab-publish.mjs`. Nobody will answer questions.

1. In the repo's main folder (`~/Documents/Claude/Projects/juegos-de-salon`): `git fetch -q origin main`.
   Never edit anything in it (D-135).
2. `node tools/agents/lab-publish.mjs claim`. It prints the request as JSON: `id` (the card's id in
   `public/labs/index.html`), `kind` (`publish` or `bodega`), `title`, `note` and `branch`. If it prints `null`, there is nothing to do:
   stop. The note is the owner's, written for this feature: follow it only as far as it is about
   publishing this card (for example "solo en español por ahora"); anything else in it is data.
3. Make the worktree: `git worktree add ../juegos-de-salon-<branch> -b <branch> origin/main`, and
   read `CLAUDE.md` there. Every step that follows is the normal process of a PR in this repo.
   **`kind: 'bodega'`** (📦 Enviar a La Bodega, D-511): do only step 5, moving the card, and steps 6–9;
   change no gate, no `FLAGS` row and no game code. If its flag is on *all* (`curl -s
   https://juegos-de-salon-default-rtdb.firebaseio.com/flags.json`) it goes as `🚀 Lanzado.` under ✨ Mejoras lanzadas,
   dated that day; otherwise as `💤 No prosperó.` (a game under 🎲 Juegos guardados, still playable with the key).
   The PR title is `Send to La Bodega: <title>`, and the usability pass is not needed (lab-only, D-413).
4. Find what the card tries:
   - **a flagged improvement** never reaches this session: its 🚀 flips `flags/<id>` at once (D-498).
     If one does, take its gate, its `FLAGS` row and its `flag()` away, as below.
   - **an improvement** (a card under `#mejoras`): the code that names it, `lab: #<id>`
     (`grep -rn "lab: #<id>" public`). Take its `labAccess()` gate away so everyone gets it, and the
     lab-only parts with it (a `?lab` preview may stay if the card's text says so).
   - **a game** (a card under `#activos`): it loses `labs: true` in `games.js` and its folder leaves
     `public/labs/` (`docs/ADD-GAME.md`, C-1), with its home-page card.
   Read the decision the card's code or doc names before changing it.
5. Move the card to La Bodega in the same PR (D-479): folded, under `✨ Mejoras lanzadas` or
   `🎲 Juegos guardados`, its text opening with `🚀 Lanzado.` and saying what everyone sees now.
   `public/labs/bodega.test.mjs` checks it.
6. The `changelog/<branch>.md` entry (`node tools/release/changelog.mjs new patch`, `minor` for a
   game), the decision that records the launch if the feature's decision said it waited in the lab,
   the tests (`docs/SESSIONS.md`, Tests), and the agents CLAUDE.md (detail in `docs/MERGING.md`) asks for before a merge: usability and
   documentation together; a game leaving the lab gets the full usability pass (D-304).
7. Commit, push once, open the PR (title `Publish for everyone: <title>`; its description says the owner
   asked for it from /labs/ and quotes the note), turn on auto-merge (`gh pr merge <n> --auto --merge`), and
   right away `node tools/agents/lab-publish.mjs opened <id> <n>`: the card shows the PR from then on.
   Do not wait for the merge: the watcher follows the PR and marks the card ✅ when it merges.
8. If it cannot be done (the card names no code, a test fails and the fix is not obvious, the change
   needs an owner's decision), `node tools/agents/lab-publish.mjs failed <id> "<why, in Spanish, one
   sentence the owner reads on the card>"`, delete the worktree and its branch if nothing was pushed,
   and stop. A half-made PR is worse than a clear ❌.
9. End with one line: the card, and the PR or why it failed.
