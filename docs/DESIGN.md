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
boundary the system respects. The analysis: [design/cup-unification.md](design/cup-unification.md).

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
| `--red` | `#e0243c` | errors, collisions and losses; as a button only a destructive confirmation (`.btn--red`, deleting a cup), never a game action (`.btn--red` lives in `cup/style.css` today, not in `base.css`: it moves with phase 7, #1196) |
| `--ink` | white | text on the dark background |
| `--muted` | white at 72 % | secondary text on the dark background (`.muted`) |
| `--glass`, `--glass-border` | white at 8 % and 16 % | panels, chips, ghost buttons: surfaces on the dark background |
| `--card`, `--card-ink` | cream and near-black | a light card (a playing card, a note) and its text |
| `--ink-on-yellow`, `--ink-on-cyan` | dark brown, dark teal | text on a yellow or cyan surface |
| `--edge-pink`, `--edge-yellow`, `--edge-cyan` | darkened accents | the 3D edge under a button of that colour |
| `--well`, `--well-deep` | black at 25 % and 30 % | a sunken surface on the dark background: rows, segmented controls (`--well`), inputs (`--well-deep`) |
| `--placeholder` | white at 35 % | an input's placeholder |

**A token colour at an alpha** (a glow, a tint, a shadow in the brand's colour) is written with the
relative-colour syntax, never as a new literal: `rgb(from var(--cyan) r g b / 0.6)`. The lint names
the idiom for every `rgba(46, 230, 214, 0.6)` it meets. A white surface (`background: #fff`) is
not ink: it is `var(--card)` if it is a card, or an escape.

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
| Topbar | `.topbar`, `.back`, `.tools`, `.icon-btn`, `.sound-toggle`, `.lang-toggle` | `.back` is 40 px tall: a debt, §5 |
| Button | `.btn` (pink), `.btn--yellow` (the action), `.btn--cyan`, `.btn--ghost`, `.btn--sm`, `.btn-row` | 60 px tall, 50 for `--ghost`, 44 for `--sm`; 44 is U-10's floor for anything tapped; the label fits in one line at 320 px (U-17) |
| Choice buttons | `.opciones.dos/.tres`, `.opcion` | two or three options side by side, one on; part of the game shell below (phase 4), from La Copa |
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

**The game shell** (phase 4, #1192): what every game's screens are made of, once in `base.css`.
Until November 2026 each game copied these from the one before (eleven copies of `.screen`, eight
of `.field` and `.form-error`, seven of `.mode`, `.code-big`, `.qr`, `.or` and `.result-hero`, six of
`.switch`, five of `.player-row` and `.lobby-players`, three of `.toggle-row`).

| Component | Class | Notes |
|---|---|---|
| Screens | `.screen`, `.screen.active` | one visible, sliding up |
| The cover's hero | `.intro-hero`, `.icon`, `.icon--cyan` | the emoji glowing above the title |
| A mode to pick | `.modes`, `.mode`, `.mode .go`, `.mode .soon` | title, a line, the › |
| A form field | `.field`, `label`, `input`, `input.name`, `input.code`, `.sub`, `.sub.warn` | the input in a well |
| The form's error | `.form-error` | |
| Segmented control | `.seg`, `.seg button.on` | |
| Choice buttons | `.opciones.dos/.tres`, `.opcion`, `.opcion.on` | La Copa's, now everyone's |
| A player's row | `.player-row`, `.num`, `input`, `.del`, `.cpu .cpu-name` | |
| A row with a switch | `.toggle-row`, `.txt`, `.switch`, `.switch.on` | |
| A link that is a button | `.link-btn` | |
| The room | `.code-big`, `.qr`, `.or`, `.lobby-players .p`, `.waiting`, `.dots` | |
| Whose turn | `.status`, `.who`, `.sub` | |
| The result's hero | `.result-hero`, `.trophy` | |

A game that still carries its own copy is a `copied` hit of the lint until it migrates (phase 5):
its copy wins the cascade meanwhile, so nothing changes for it. Ahorcado was the pilot.

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
| Batalla Naval | the sea and the ships (`--mar`, `--casco-*`, and the fire's edges and flash: `--tocado-borde`, `--hundido-borde`, `--fogonazo`, `--brasa`, `--espuma-luz`); the cell's 4 px corner (2 px on the small board and the chip's ship squares); the small board's 0.55 rem glyphs and labels | thematic board colours (C-1); a cell is a tile of a 10×10 grid, not a card; the result's 220 px boards still show their 💥 and row numbers (allowlisted) |
| Pintaminas | each drawing's palette | the game is about those colours |
| 🕵️ Agentes | the four clue colours | tested by `palette.test.mjs` |
| Seasonal templates (`season.css`) | the Halloween and other palettes | a dated skin over the tokens (D-457) |
| Ahorcado | the word's letters at 2.5, 2.1, 1.8 and 1.9 rem | a board's own sizes, between the title steps and the text steps, so a long word fits at 320 px (C-8) |
| Línea de Tiempo | the deck card's emoji at 1.8 rem (`.theme-card .em`); the solo score at 3.2 rem (`.puntos b`) | the same deck card as Ahorcado's, a candidate shell component; the score is a figure read like a title, in `--font-num` (D-30) |
| Generala | the kept-die tag (`.dado-btn .tag`) at 0.62 rem | "Guardado" under each of five dice must fit under a 50 px die at 320 px (C-8); the smallest text step overflows it |
| Julepe (`labs/julep/style.css`) | the playing card's rank and suit at 1.35 and 1.15 rem (`.pcard .r`, `.pcard .s`), and the tiny card's at 0.8 and 0.7 rem (`.pcard--xs`) | a card's own sizes, scaled with the card (five fit in a row at 320 px, C-8): the card is `--card` on the dark table, no thematic token of its own |
| `base.css` (the chat bubble, the install bubble) | the bubble's 4 px tail; the room the page and the text keep for the install bubble and its ✕ (170, 48 and 30 px) | a tail is a shape, not a corner on the scale; the room is another element's size, not rhythm (allowlisted) |
| La Copa (`cup/style.css`) | the podium's flat 4 px feet (`.escalon`) and the speech bubble's 4 px tail (`.cs-globo`) | the same shapes as `base.css`'s bubble (allowlisted) |
| Toque y Fama | the hero's emoji at 3.2 rem: the cover's icon on a short phone (under 600 px tall) and the solo result's trophy | between the shell's 4.2 rem and the text steps, so the first mode stays above the fold at 320×568 (`landing-fold.mjs`) and the solo result fits without scrolling (C-8) |
| Dudo | the ace's gold (`--ace-light`, `--ace-deep`) and the shaking cloth's green (`--cloth`); the rivals' dice glyphs at 0.62 rem and the bid's quantity at 2.6 rem | thematic colours of the dice and the felt (D-447); a board's own sizes: five glyphs fit the rival card's 74 px, the figure is read across the table (both allowlisted) |
| El Camaleón (lab) | the chameleon's reveal at 5 rem (`.big-lizard`); the word grid's cells at `clamp(0.68rem, 3.4vw, 0.9rem)` | the one card without a word: the lizard is bigger than the cover's icon so whoever holds the phone knows at once; 16 words in four columns of ~68 px at 320 px, the board's own size by the width (the lint does not measure a `clamp`) |
| Cuarto Rey | the king's gold (`--king-light`, `--king-deep`) and the big card's drop (`--card-drop`); the countdown at 3.2 rem, the final crown at 3.6 rem and the handoff's glasses at 3.8 rem | thematic colours of the K card and the deck; the figure is read across the table (D-30), the crown and the glasses are heroes compacted so the buttons stay on screen with six players (C-8, C-9) (allowlisted) |
| Stick Ninja (`labs/stick/style.css`) | the cover's 🥷 at 2.2 rem; black in the canvas' fade mask | the emoji is drawn to the title's height; a mask's black is opacity, not a colour (allowlisted) |

(The table grows as migrations meet a legitimate exception; the baseline of phase 2 found none that
was a whole file. The rows above are the first entries of the allowlist, read from the baseline:
every other hit is a migration, not an escape. A 4 px tail used by three bubbles and a podium is a
candidate scale step, `--r-4`: a decision, not an allowlist entry forever.)

## 5. Known debts of the system itself

Found while building the components page (phase 3); each is a visible change on every page, so it
is a decision for the owner, not a migration:

- `.back`, the topbar's "‹ Menú" link, is 40 px tall: under U-10's 44 px floor. The e2e script of
  the components page leaves it out of its check until it is decided.
- `.switch`, the toggle's switch (58 × 34 px in the six games that copied it, now in the shell), is
  under 44 px tall: the row around it is tappable, the switch alone is not. A taller switch or a
  larger hit area is a visible change on six games' setup screens, so it is the owner's call; the
  components page's script leaves it out of its check until then.
- `base.css` writes 14 and 18 px corners, 7 and 11 px paddings and 0.95, 1.05 and 1.15 rem sizes in
  its own components (the chat sheet, the ghost button, the folding panel's summary): the baseline of
  phase 2 counts them; they move to a step when base.css is migrated, in phase 5, with screenshots.

## 6. Migration recipe

From the pilot, Ahorcado (phase 4, #1192; 276 lines, 101 hits before, 0 after). One game per PR.

1. **Measure first.** `node tools/agents/design-lint.mjs public/<game>/style.css` says every hit and
   its fix. Take the "before" with the computed-styles dump and screenshots of the game's screens at
   390 and 320 px (the usability agent's `look.mjs`, or a Playwright dump of `getComputedStyle` of
   every element of the active screen: it tells a 1 px shift apart from a real change).
2. **Delete the shell copies.** Every rule the sheet repeats from the game shell (§2) goes; what the
   game adds on top of a shell component stays as a modifier (`.field--name`, `.seg--src`). If the
   game's copy differed from the shell, the shell wins: list the difference as intended.
3. **Tokens, mechanically.** Colours → the token; a token at an alpha → `rgb(from var(--x) r g b / a)`;
   `rgba(0,0,0,.25/.3)` → `--well`/`--well-deep`; `#fff` as text → `--ink`, as a surface → `--card`
   or an escape; corners → `--r-*`; padding, gap, margin → `--s-*` (an odd value takes the nearer
   step; a negative margin is `calc(-1 * var(--s-18))`); rem sizes → `--fs-*` (the nearer step; a
   board's own letters, like the word of Ahorcado at 2.5 rem, are an escape with their reason).
4. **Run** the lint on the file (zero, or escapes with a reason), `design-lint.mjs baseline`,
   `design-lint.test.mjs`, the game's e2e scripts, and the "after" dump: diff it against the
   "before" and read every property that changed. The list of intended differences goes in the PR
   body with the two screenshots; anything not on the list is a bug.
5. **Write it down:** the game's doc notes the migration; the changelog entry says what moved.

What the pilot taught: the copies were not identical (two paddings for `.toggle-row`, two input
fonts for `.player-row`, `.seg` with and without a 44 px floor), so step 2 is where the eye is
needed; step 3 is mechanical and takes minutes; the dump in step 4 caught every 1 px shift. One
game of Ahorcado's size takes one session.
