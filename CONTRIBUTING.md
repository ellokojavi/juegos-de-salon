# How to contribute

Thanks for wanting to add something to Juegos de Salón. The app is HTML, CSS and JavaScript with ES
modules: no build, no npm and no account for anything to work on it.

## The path: fork and PR

1. **Fork** `ellokojavi/juegos-de-salon` on GitHub and clone it.
2. Create a **branch named by topic** (`dudo-modo-rapido`, not `v0-90`).
3. Work, test (below) and open a **PR to `main`**. The tests run on their own in the PR and
   show ✅ or ❌ in two checks, `tests` and `end-to-end`; with one red, it does not merge.
4. The owner reviews it, merges it and publishes it. `main` is protected: nothing goes in without a PR, and
   what goes into `main` goes out right away on https://juegosdesalon.cl/.

A big idea (a new game, a rules change) is worth discussing first in an issue,
so as not to do work that later does not fit.

## Running it

```bash
python3 -m http.server 8765 -d public   # the site is public/; ES modules need HTTP
```

and open http://localhost:8765/. To look at it on your phone, any way of serving `public/`
on the local network works.

**Careful:** the multi-phone modes use the **production** Firebase database (the
public config is in `public/assets/js/firebase-config.js`). A room opened from your
computer is a real room: it shows up in the owner panel. It breaks nothing, but open only as
many as you need.

## Before writing code

- **[docs/CANONES.md](docs/CANONES.md)**: today's rules for every game (languages, sound, modes,
  game memory, touch interface, anti-cheating, tests, documentation). At the end it has a
  checklist.
- **[docs/USABILIDAD.md](docs/USABILIDAD.md)**: how texts are written and where buttons go.
- **[docs/AGREGAR-JUEGO.md](docs/AGREGAR-JUEGO.md)**, if it is a new game.
- **[docs/DECISIONS.md](docs/DECISIONS.md)**: why things are the way they are. Before changing something
  that looks odd, look it up there.

What gets forgotten most:

- **Every player-facing text goes in Spanish, English, Brazilian Portuguese and German**, with the same keys in
  all of them (C-3). Chilean Spanish, informal "tú". The others adapted, not copied word for word. The German glossary
  is in [docs/ALEMAN.md](docs/ALEMAN.md).
- **Reuse before inventing**: drag and drop, the keyboard, the chat, the pass-the-phone
  screens and what gets shared already exist in `public/assets/` (D-102).
- **44 px buttons and no horizontal scroll** at 320 px width (C-8).

## Tests

GitHub runs every `*.test.mjs` and `*.test.py` on each PR and checks that the README is up to date.
The same, on your computer:

```bash
git ls-files '*.test.mjs' | xargs -P8 -I{} sh -c 'node "{}" > /dev/null 2>&1 || echo "FALLA {}"'
for f in $(git ls-files '*.test.py'); do python3 "$f" || echo "FALLA $f"; done
python3 tools/release/readme.py check
node tools/release/og.mjs check
```

The end-to-end tests (`tools/e2e/`) play complete games in Chrome; see their README.
To look at a single screen: `node tools/e2e/look.mjs <game> <screen> --width 320`.

## What the owner does on merge (do not do it in your PR)

- **The version number** (D-205, D-300): assigned on its own on merge, in the order the PRs
  land. Your PR brings its entry **without a number** in `changelog/<your-branch>.md` (first line
  `level: patch` or `level: minor`, and then `- …` lines that tell what changed); do not touch
  `CHANGELOG.md`.
- **The number of decisions** (D-n): if your change needs one, write it as `D-??` and it gets
  numbered on merge.
- **Publishing the Firebase rules** (`firebase/database.rules.json`): they need a key that
  only the owner has. If your PR changes them, say so in the description.
- **The owner panel** (`public/panel/`) cannot be opened without the owner's account; to look at it there is seeded
  data (`node tools/e2e/look.mjs panel data`).

## With Claude Code

If you work with Claude Code, just read `CLAUDE.md`: it has the same rules and the
tools. Some parts belong to the owner (merging, publishing rules, reading reports and the panel
with the owner's key); in a fork, Claude stops at opening the PR.

## License

By contributing, you agree that your code is published under the project's [MIT license](LICENSE).
