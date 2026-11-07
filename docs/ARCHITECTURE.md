# The architecture boundary (#1249 step 5)

A game is a folder that leans only on the shared code, so it can be moved, renamed or retired
without touching another game. A ratchet (📈, docs/RULES.md) keeps the old debt from growing.

- **Tool:** `node tools/agents/architecture.mjs [--all|--gate]` prints the hits and a count per rule.
- **Test:** `tools/agents/architecture.test.mjs` (run by the `tests` check).
- **Debt list:** `docs/architecture-allowlist.json`, which only shrinks.

## What a game folder is

Every `path` of `GAMES` and `SUELTOS` in `public/assets/js/games.js`, every folder under
`public/cup/games/` and every folder under `public/labs/`. A file belongs to the deepest one
(`public/cup/games/zip/` is its own game, not part of `public/cup/`). The shared code in
`public/assets/` is read too, as one more folder.

## The rules

| Rule | A hit is | Fails? |
|---|---|---|
| `import` | an import (static, dynamic or `export … from`) that resolves outside `public/assets/` and the game's own folder. Another game's folder is a hit. The shared modules beside a host's games count as the host's: `public/cup/games/*.js` for Cup games, `public/labs/*.js` for lab games. Shared code importing a game is a hit. | yes |
| `external` | `fetch(`, `XMLHttpRequest.open`, `new WebSocket(` or an import to an absolute http(s) URL whose host is not juegosdesalon.cl. | yes |
| `storage-key` | a `localStorage`/`sessionStorage` key written as a string literal that does not start with `juegos-de-salon:`. Keys held in a variable are not seen. | yes |
| `firebase-path` | a literal path in `ref(db, '…')` or `child(…, '…')`. | no: informational, listed and counted until step 7 adds the manifests that declare each game's paths |

## Adding an exception

Prefer the fix: move the shared piece into `public/assets/js/` (rule 6 of RULES.md), or prefix the key.
When the exception is right, add an entry to `docs/architecture-allowlist.json`:

```json
{ "file": "public/x/game.js", "rule": "import", "what": "../y/engine.js", "why": "the reason, in one line" }
```

`what` is the hit exactly as the tool prints it. An entry that no longer matches a hit is stale and
fails the test: remove it in the PR that pays the debt.

## Remaining (step 7)

The manifests that declare each game's Firebase paths, the check that a game writes only its own,
and the mirror of the boundary in the Firebase rules (`firebase/`).
