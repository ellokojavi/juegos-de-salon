# The design system

One visual language for every screen of Juegos de Salón: the colours, the distances, the corners,
the shadows, the titles and the components every game draws from. It lives in two places, and only
two: this document (the rules) and `public/assets/css/base.css` (the tokens and the shared classes),
with `public/assets/css/ranking.css` for rankings. Nothing visual is decided in a game's own CSS
that could be decided here (C-1, D-533).

**What it governs:** everything (the owner, 2026-11-05). Every element of design and every
experience of the site, La Copa and its mini-games included: not only how a button looks, but how
a screen starts, passes the phone, confirms, shares and shows a result. Nothing is a game's own
without an escape in §4 with its reason. La Copa behaves today as a system apart (`cup/style.css`,
its own controls in `cup/game.js`); that is a defect the plan dissolves (phase 7, #1196), not a
boundary the system respects.

**Who keeps it:** the usability agent (`.claude/agents/usability.md`). It owns this document, the
design lint (`tools/agents/design-lint.mjs`, phase 2 of #1188), and the components page
(`/labs/design/`, phase 3). A change to a token or a shared class is reviewed by it. A game does
not get a visual rule of its own without an entry in the escapes section below.

**Why it exists:** by November 2026 the 26 game stylesheets held 325 hex colours written by hand
(148 distinct ones that were not a token), 338 hand-written radii against 11 with a token, and the
same row, toggle or link button copied into four to six games with different paddings (#1188).
The palette and the fonts were respected; distances, corners and second-level components were not,
because there was nothing to respect.

## 1. Tokens

Every value below is a CSS custom property on `:root` in `base.css`. A game uses the token, never
the value. Tokens are named by value where the value is the meaning (`--s-12` is 12 px) and by
role where the role is the meaning (`--edge-pink` is the shadow under a pink button).

### Colours

| Token | Value | Use |
|---|---|---|
| `--bg1`, `--bg2`, `--bg3` | dark purples and blue | the background gradient (`--fondo`), never as a surface colour |
| `--pink`, `--pink-deep` | `#ff2e88`, `#c2185b` | the brand accent: main buttons, highlights, danger that is still fun |
| `--yellow`, `--orange` | `#ffd23f`, `#ff7a1a` | the call to action (`.btn--yellow`), gold, the winner |
| `--cyan` | `#2ee6d6` | the secondary accent: info, selection, "your turn" |
| `--lime` | `#9dff3a` | success, correct, done |
| `--purple` | `#8a4dff` | tertiary accent, used sparingly: the hidden digit of the keyboard, the owner's panel; a game does not need it |
| `--red` | `#e0243c` | errors, collisions and losses; as a button only a destructive confirmation (`.btn--red`, deleting a cup), never a game action |
| `--ink` | white | text on the dark background |
| `--muted` | white at 72 % | secondary text on the dark background (`.muted`) |
| `--glass`, `--glass-border` | white at 8 % and 16 % | panels, chips, ghost buttons: surfaces on the dark background |
| `--card`, `--card-ink` | cream and near-black | a light card (a playing card, a note) and its text |
| `--ink-on-yellow`, `--ink-on-cyan` | dark brown, dark teal | text on a yellow or cyan surface |
| `--edge-pink`, `--edge-yellow`, `--edge-cyan` | darkened accents | the 3D edge under a button of that colour |

A game may have thematic colours (the sea in Batalla Naval, a painting's palette in Pintaminas)
for its board. They are declared once, at the top of its stylesheet, as that game's own tokens
(`--mar: …`), and listed in the escapes section. They never colour a button, a panel, a chip or a
title.

### Space

A 2 px grid up to 20 px, then steps of 4. Padding, gap and margin take one of these:

| Token | px | Typical use |
|---|---|---|
| `--s-2` | 2 | a hairline gap between cells |
| `--s-4` | 4 | tight gaps: inside chips, between a label and its value |
| `--s-6` | 6 | chip padding, gaps in dense boards |
| `--s-8` | 8 | the default gap between small things (chips, keys) |
| `--s-10` | 10 | the gap in a button row (`.btn-row`), small paddings |
| `--s-12` | 12 | the gap in a `.stack`, row padding |
| `--s-14` | 14 | horizontal padding of a row |
| `--s-16` | 16 | button padding, section gaps |
| `--s-18` | 18 | the panel's padding (`.panel`), the ghost button's sides |
| `--s-20` | 20 | breathing room between blocks |
| `--s-24` | 24 | between sections of a screen |
| `--s-28` | 28 | the board's air before its buttons (`--aire-tablero`, D-309) |
| `--s-32` | 32 | the largest step; above this, use `rem` with a reason |

`--aire-tablero`, `--gap-contenedor` and `--aire-ya` (D-309) stay as they are: they are a rule
about the board, not a size.

### Corners

| Token | px | Use |
|---|---|---|
| `--r-8` | 8 | chips that are not pills, cells, keys, small inputs |
| `--r-10` | 10 | small cards and inputs |
| `--r-12` | 12 | inputs, cards inside a panel |
| `--r-14` | 14 | rows (`.player-row` and its kin: the radius most games already use for a row) |
| `--r-16` | 16 | large cards, sheets, modals |
| `--r-22` | 22 | the panel (`.panel`); `--radius` is its alias and stays for what already uses it |
| `--r-pill` | 999 | buttons and chips |
| `50%` | | a circle (avatars, dots, round buttons): written as `50%`, it needs no token |

### Shadows

| Token | Use |
|---|---|
| `--shadow-panel` | the panel and anything that floats over the background |
| `--shadow-text` | the drop under a title; `.display` writes it with its glow on top |
| `--edge-*` | under a button, with its glow written in the button class |

A glow that signals a state (the selected card, the winning row) is written with the token colour
it glows in and is not a shadow token.

### Type

Two families, three roles (C-1): `--font-display` (Bangers) for titles, names, words and room
codes; `--font-body` (Nunito) for everything else; `--font-num` for every figure the player reads or
compares (D-30): the token is the family, and where it is used it is written at 900 with
`font-variant-numeric: tabular-nums`.

Titles take one of the four steps of `.display` (`--xl`, `--lg`, `--md`, `--sm`), never a size of
their own. Body text takes one of the steps, named in hundredths of a rem: `--fs-75`, `--fs-85`,
`--fs-90`, `--fs-100` (the body), `--fs-110`, `--fs-120`, `--fs-140`, `--fs-160`, `--fs-200`. A size
between two steps (0.95, 1.05, 1.3) is the wrong step, not a new one.

## 2. Components

What exists today in `base.css` and `ranking.css`, and what each is for. A game that needs one of
these uses the class; a game that needs something close to one asks for a variant here, not a copy.

| Component | Class | Notes |
|---|---|---|
| Title | `.display` + `--xl/--lg/--md/--sm`, `.rainbow` | the rainbow only on the game's own title |
| Text | `.muted`, `.lead`, `.center` | |
| Button | `.btn` (pink), `.btn--yellow` (the action), `.btn--cyan`, `.btn--ghost`, `.btn--sm`, `.btn-row` | 60 px tall, 50 for `--ghost`, 44 for `--sm`; 44 is U-10's floor for anything tapped; the label fits in one line at 320 px (U-17) |
| Choice buttons | `.opcion` (today in `cup/style.css`; moves here in phase 4) | two or three options side by side, one on |
| Panel | `.panel`, `details.panel` | the glass card |
| Chips | `.chip`, `.chip--hot`, `.chip--gold`, `.chips` | |
| Stack | `.stack` | vertical rhythm of 12 px |
| Sheet | `.hoja*` | the bottom sheet (D-232) |
| Chat | `.chat*` | the room's chat bubble |
| Random | `.azar*` | the random-game control (D-237) |
| One a day | `.uad*` | |
| Ranking | `.rk-*` in `ranking.css` | tables, rows, medals (D-212) |
| Keyboard | `teclado.css` | |
| Topbar, footer | `.topbar`, footer | |

Planned for phase 4 (#1192), because games copy them today: the list row (`.player-row`), the
toggle row (`.toggle-row`), the link button (`.link-btn`), the section title, the score line.

## 3. Rules

1. **A value the player sees comes from a token.** A colour, a distance, a corner, a shadow or a
   text size written by hand in a game's CSS is a lint hit (`node tools/agents/design-lint.mjs`).
   The lint tells the file and the line; the fix is the token, or an escape with its reason. Until
   phase 6 the lint reports and the ratchet holds (no file's count grows); then it gates.
2. **A component is used, not copied.** A class that exists in `base.css` or `ranking.css` is not
   redeclared in a game. A variant the game needs goes into `base.css`, with its place on the
   components page, in the same PR.
3. **Thematic colours are declared, not sprinkled.** A game's own palette sits at the top of its
   stylesheet as its own tokens, listed below, and colours only its board.
4. **The scales do not grow for one case.** A new step in a scale is a decision (D-n) reviewed by
   the usability agent, because the lint measures against it. The scales were first drawn from
   `base.css` and then widened once, with the games measured (D-533): 18 px joined the space scale
   because the panel itself uses it; 10 and 14 px joined the corners because 14 is the row radius
   most games use and 10 the small card's; 0.9, 1.1 and 1.4 rem joined the text steps because they
   are, after the steps, the sizes games write most. What is still off the scales (0.95 and 1.05
   rem, 18 px corners, 7 and 11 px paddings) moves to a step when its game is migrated, not by
   widening the scale again.
5. **Migration is per game, never two in one PR** (phase 5, #1193), with before and after
   screenshots at 390 and 320 px and the intended differences listed in the PR. A PR that touches a
   game's CSS for another reason migrates it in the same PR.
6. **What a program can measure, a program checks** (D-520). The usability agent reviews what the
   lint cannot: whether a colour means what it should, whether a title took the right step,
   whether a new control should be a component.

## 4. Escapes

A game's own visual rules, with their reason. The design lint (`node tools/agents/design-lint.mjs`,
D-533) reads `docs/design-allowlist.json`, one entry per exception with its reason; this list is the
human-readable side, kept in sync by the usability agent. A game's thematic colours declared as its
own tokens at the top of its stylesheet (`--mar`, `--casco`) are not hits and need no entry: the
lint never reads a `--token:` declaration. What the lint measures today, and the ratchet
(`docs/design-baseline.json`: a file's count never grows, `design-lint.mjs baseline` rewrites it
after a migration), is in the lint's header.

| Game | What | Why |
|---|---|---|
| Batalla Naval | the sea and the ships | thematic board colours (C-1) |
| Pintaminas | each drawing's palette | the game is about those colours |
| 🕵️ Agentes | the four clue colours | tested by `palette.test.mjs` |
| Seasonal templates (`season.css`) | the Halloween and other palettes | a dated skin over the tokens (D-457) |

(The table grows as migrations meet a legitimate exception; the baseline of phase 2 found none that was a whole file.)

## 5. Migration recipe

Written in phase 4 (#1192) from what the pilot (Ahorcado) teaches: what maps to what, what to look
at in the screenshots, and how long one game takes.
