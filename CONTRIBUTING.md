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

### As an invited collaborator

If the owner invited you (Settings → Collaborators, **Write** role), you do not need a fork:

1. Accept the invitation (email or https://github.com/notifications).
2. Clone `ellokojavi/juegos-de-salon` directly and create your **topic branch** from an up-to-date `main`
   (`git fetch origin && git switch -c <topic> origin/main`).
3. Push your branch and open the PR to `main`. Never push to `main` directly (it is protected), and do not
   push to someone else's branch without asking them.
4. Same as a fork from here on: green `tests` and `end-to-end`, and the owner merges. What is listed in
   "What the owner does on merge" stays with the owner, also for collaborators.

A big idea (a new game, a rules change) is worth discussing first in an issue,
so as not to do work that later does not fit.

## Language

Everything in the repo is **English**: code, comments, docs, commits, PR titles and descriptions, issues
(D-316). The exceptions are what the player reads (Spanish, English and Portuguese, below) and persisted
keys (game ids like `'ahorcado'`, Firebase paths, `localStorage` keys), which never change. New file
names in Spanish fail `english.test.mjs`.

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

- **[docs/CANONS.md](docs/CANONS.md)**: today's rules for every game (languages, sound, modes,
  game memory, touch interface, anti-cheating, tests, documentation). At the end it has a
  checklist.
- **[docs/USABILIDAD.md](docs/USABILIDAD.md)**: how texts are written and where buttons go.
- **[docs/ADD-GAME.md](docs/ADD-GAME.md)**, if it is a new game.
- **[docs/DECISIONS.md](docs/DECISIONS.md)**: why things are the way they are. Before changing something
  that looks odd, look it up there.

### The rules

<!-- generated: rules (node tools/agents/rules.mjs contributing) -->

64 rules are registered in `docs/rules.json` (index in [docs/RULES.md](docs/RULES.md)): 34 🤖 checked and 6 📈 ratcheted by tests, 48 👁 judged by a reviewer. A bot comment on your PR lists the 👁 rules its files touch. They live in:

- [docs/RULES.md](docs/RULES.md): R-10, R-8
- [CLAUDE.md](CLAUDE.md): flags
- [docs/CANONS.md](docs/CANONS.md): C-1, C-2, C-3, C-4, C-5, C-6, C-7, C-8, C-8b, C-9, C-10, C-13, C-14, C-15, C-17, C-19, C-20
- [docs/USABILIDAD.md](docs/USABILIDAD.md): U-1, U-3, U-5, U-6, U-7, U-8, U-18, U-36, U-12, U-13, U-14, U-15, U-16, U-17, U-20, U-21, U-22, U-23, U-37, U-38, U-30, U-33, U-31, U-32, U-35, U-34, U-40, U-41

<!-- /generated: rules -->

What gets forgotten most:

- **Every player-facing text goes in Spanish, English and Brazilian Portuguese**, with the same keys in
  all of them (C-3). Chilean Spanish, informal "tú". The others adapted, not copied word for word. German left the
  app (D-514).
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

## Checklist before opening the PR

- [ ] Topic branch, up to date with `main`.
- [ ] Changelog entry without a number in `changelog/<your-branch>.md`
      (`node tools/release/changelog.mjs new patch` or `minor`).
- [ ] Player-facing texts in the three languages; buttons ≥ 44 px; no horizontal scroll at 320 px.
- [ ] Anything new on a player page sits behind its lab flag (`flag('<id>')`, `public/assets/js/flags.js`)
      and is listed in `/labs/` (D-395, D-498): the owner turns it on, not the PR.
- [ ] If the game changed, its `docs/games/<folder>.md` says so.
- [ ] The 👁 rules the bot comment lists for your PR are respected (above, "The rules").
- [ ] All `*.test.mjs` / `*.test.py` pass locally, plus the end-to-end script of the screen you touched.
- [ ] Nothing over 5 MB in git (D-494).
- [ ] The PR description says what changed, why, and how to see it (the PR gets a preview, D-429).

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

## Questions

Open an issue, or ask in the PR itself. Feedback the players send from the app also arrives as issues:
they are a good place to find something to work on.

## License

By contributing, you agree that your code is published under the project's [MIT license](LICENSE).
