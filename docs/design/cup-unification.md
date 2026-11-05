# La Copa inside the design system: the analysis (phase 7, #1196)

The owner (2026-11-05): the system governs everything, La Copa included. This page says why La Copa
behaves as a system apart today, what in its layer is a copy and what is really its own, which
interaction patterns differ from the home games, and the PRs that dissolve the layer. It changes no
code; the decision (D-n) and the PRs come after it.

## In five minutes

**Why it grew apart.** La Copa was built as a separate product: a week-long tournament with its own
screens (cover, create, join, board, day, result, podium), designed in its own requirements document
and built in a burst of decisions (D-96 to D-175, September 2026) before `base.css` had components.
Its mini-games were born inside its screens (`cup/game.js` is their shell), so every control they
needed (`opciones`, `campo`, `seg`, sheets, `.field`) was written into `cup/style.css`. When the home
games later grew the same controls, they were lifted into `base.css` (`.hoja` with D-232, `.opcion`,
`.field`, `.seg`, `.result-hero`, `.switch`), but the cup's originals were never deleted: both now
load, the cup's win by order and differ in small values. Nobody owned the difference because the cup
had its own e2e scripts and its own reviewers, and every later cup feature (D-425, D-521: the week
builder, the length picker, the time zone) added its controls next to the old ones instead of
reaching for the shared ones (`.dur-switch` beside `.switch`, `.dur-atajo` beside `.chip-btn`).

**How big.** `cup/style.css` is 883 lines with 309 lint hits (137 token colours by hand, 80 other
colours, 58 text sizes, 17 spacings, 6 radii, 11 copied classes). About **14 groups of classes are
copies or near-copies** of a shared component; about **9 groups are really the cup's** (the week
builder, the calendar, the table with its day blocks, the trajectory chart, the podium, the memorial,
"Tus copas", the day card, El caso's scene). The copies are roughly 30 % of the file; the rest is the
cup's own, mostly off the tokens.

**Interaction.** La Copa already uses the shared share, back-guard, end-of-game and how-to-play-facts
modules, so the gap is smaller than the CSS suggests. What a player still meets differently: the
start screen (a Cup mini-game shows "Empezar" plus a "Volver al menú" button and an open how-to-play
card; a home game shows mode cards and a collapsed "Cómo se juega"), the how-to-play block
(`.reglas` vs `details.panel`), confirmations and switches (the create screen's own switch), toasts
and notices (`.toast`, `.aviso` exist only in the cup), and waiting/errors (`espera()` vs the home
games' `.waiting`). Passing the phone is not a real gap: Cup days are played alone, and the one Cup
game that passes it (Línea de tiempo) already uses `handoff.js`.

**The order.** Seven PRs, smallest risk first: delete the exact copies; adopt `.switch`/`.chip-btn`;
adopt the shared field/option variants; lift `.toast`/`.aviso` into `base.css`; one how-to-play
block; one start screen; then tokenise what stays the cup's own. Three of them change what a player
sees on a live cup and need the owner's decision first (marked below).

## Design: copy or the cup's own

"Copy" means a class `base.css` already has (the lint's `copied`) or a control that does the same job
as a shared one. The move is one of: **use** the shared class and delete the cup's; **variant** (add
a modifier to `base.css`, then use it); **keep** as the cup's own, on the tokens, with its escape in
DESIGN.md §4.

| Cup class or builder | Shared component | How far apart today | Move |
|---|---|---|---|
| `.screen`, `.screen.active` | `base.css` `.screen` | identical | use (delete) |
| `.intro-hero` (+ `.icon`, h1/h2) | `base.css` `.intro-hero` | icon 4rem vs 4.2rem, padding by hand; `.emoji-claro` and the globe are the cup's | use; `.emoji-claro` becomes a base variant (other games have dark emoji too); globe stays |
| `campo()` → `.field`, `input.mini`, `.field .contador` | `.field` | label 0.85 vs 0.9rem, input background and placeholder by hand; the counter and `input.pin` do not exist in base | use `.field`; `.contador` and `.pin` become base variants |
| `campoPin()` → `.field input.pin`, `.pin-fila`, `.ver-pin` | the player's PIN in `jugador.js` sign-in | same job, two looks | variant `.field .pin` in base, one PIN field for the app |
| `campoFecha()` → `input.fecha`, `.fecha-campo` | none | the cup's need, but generic | variant in base (`.field input[type=date]`) |
| `.form-error` | `.form-error` | identical | use (delete) |
| `.waiting`, `espera()` | `.waiting` | cup adds 30px padding | use; padding as a base modifier if needed |
| `.link-btn`, `.linkish` | `.link-btn` | 0.85 vs 0.95rem, margin; `.linkish` is a cyan inline link | use `.link-btn`; `.linkish` becomes base `.link-inline` |
| `.seg` | `.seg` | `#3a1200` vs `--ink-on-yellow`, 1.05 vs 0.95rem | use (delete) |
| `opciones()` → `.opciones`, `.opcion` (`.dos`, `.tres`, `.variantes`) | `.opcion` | background 0.25 alpha by hand; the grid wrappers and the narrow-column rules are not in base | use `.opcion`; `.opciones` with `.dos`/`.tres` moves to base |
| `.chip-btn`, `.semana-estilos .estilo`, `.dur-atajo` | base `.chip` / `.chips` | three pill toggles, three looks (cyan on, yellow on) | one toggle-chip in base (`.chip-btn`, yellow = choice, U-7 colour meaning) |
| `.chip--final` (cyan ×2, D-151) | `.chip` | a colour variant | variant `.chip--cyan` in base; the meaning stays the cup's |
| `.dur-switch`, `.dur-final` row | `.switch`, `.toggle-row` | 52×30 white vs 58×34 yellow; row built by hand | use `.toggle-row` + `.switch` |
| `.btn-dado` | `.btn` (yellow) | its own pressed shadow `#b86e00`, own height | variant `.btn--sm` in base (or plain `.btn`) |
| `.btn--red`, `.btn--peligro`, `.peligro` | base `.btn` variants | two names for "danger" | one `.btn--danger` in base |
| `.hoja .field`, `.hoja-cabeza`, `.hoja-juegos`, `.hoja-juego`, `.hoja-switch.mias-switch` | `.hoja` (base since D-232), `.hoja-switch` | the sheet is shared; its inner list is the cup's | `.hoja-cabeza` to base; the game list stays the cup's |
| `.reglas` (how to play, `<details>`) | `details.panel` | centred muted summary vs left bold summary | one how-to-play block (pattern 3 below) |
| `.toast`, `.aviso`, `.aviso.bien`, `.ok` | none in base; home games have their own messages | colours by hand | lift into base (pattern 4) |
| `.result-hero` | `.result-hero` | cup removes padding | use (delete) |
| `.btn-row.tres`, `.btn-row:has(#btn-avisos)` wrap | `.btn-row` | wrap at 320 px | base `.btn-row--wrap` |
| `.mas-opciones` (`<details>` "more options") | `details.panel` | own summary | use `details.panel` |
| **The week builder** (`.semana-*`, `.cal-linea`, `.cal-mini`, `.cal-variantes`, `.dur*` stepper) | — | the cup's own | keep, on tokens; the stepper (− 7 días +) may become a base stepper later |
| **The calendar** (`.calendario`, `.cal-fila`, `.cal-dia`, `.cal-est`) | — | the cup's own | keep, on tokens |
| **The table** (`.tabla`, `.fila`, `.pd.*` day blocks D-131, `.puntitos`, `.tabla-leyenda`) | `ranking.css` rows are the closest | the cup's own (seven blocks per row) | keep; share the row shell with `ranking.css` if the colours agree |
| **The trajectory chart** (`table-image.js`, `COLORES_GRAFICO`) | — | the cup's own | keep; its colours become `--token`s |
| **The podium** (`.podio`, `.escalones`, `.medalla`, `.podio--anticipado`, `.podio-archivado`) | — | the cup's own | keep, on tokens |
| **The memorial** (`memorial()`) | — | the cup's own | keep |
| **"Tus copas"** (`.mias`, `.mia*`, `.etiqueta-fin`) | `.player-row`-like rows | the cup's own list | keep; reuse the row radius/spacing tokens |
| **The day card and board head** (`.dia-card`, `.copa-head`, `.quienes`) | `.panel` | the cup's own | keep, on tokens |
| **El caso's scene** (`.cs-*`, ~150 lines) | — | a game's own, misplaced | move to `cup/games/case/style.css` (loaded with `loadCss`, D-468) |

Count: 21 rows are copies or near-copies (14 groups once merged), 9 are the cup's own.

## Interaction: what a player meets

Screenshots taken for this page (390 px): `look.mjs reinas intro` (a Cup mini-game played alone),
`look.mjs ahorcado intro` (a home game), `look.mjs copa create`. The patterns below are the ones a
player feels.

| # | Moment | Home games | La Copa / Cup mini-game | Which wins and why | Shared module |
|---|---|---|---|---|---|
| 1 | **Start screen** | Cover, mode cards (`.mode`), "Cómo se juega" collapsed, top-left "‹ Menú" | Cover, one big "Empezar", **plus a "🏠 Volver al menú" button** that repeats the top-left link, how-to-play open | Home's shape: one way back (C-19), the start above the fold (U-39). The cup keeps "Empezar" because it has one mode | a shared cover builder (`assets/js/cover.js`, new) used by both |
| 2 | **Choosing and confirming** | `.opcion`, `.switch` in `.toggle-row`, `.seg` | `.opcion` copy, `.dur-switch`, three chip toggles with different "on" colours | Base: yellow is the action/choice, one switch (DESIGN.md: yellow is the action; U-10) | `base.css` only |
| 3 | **How to play** | `details.panel` "🧠 Cómo se juega", left, bold, ▾ | `.reglas`: centred muted summary, open on the day's cover | One block, folded and at hand (U-16 says rules are folded); the cup's open-on-cover is the exception to decide | `how-to-play-facts.js` + one `details.how` class |
| 4 | **Notices, waiting, errors** | `.waiting`, `.form-error`, game-specific messages | `.toast`, `.aviso`, `espera(texto, { error, reintentar })` with a retry button | La Copa's: it is the only one with a retry and a toast, and home games online (rooms) need both (an error that offers no way out strands the player; U-15's confirmations already match) | lift `.toast`/`.aviso` to base, `espera()` to `assets/js/` |
| 5 | **Back and leaving** | "‹ Menú", back-guard on a live game | "‹ Volver a la copa" one level up (#1040), back-guard (D-432) | Already one system (`back-guard.js`, `fin.js`); only the label differs by design. Keep | — (done) |

Not patterns to unify: **sharing** (the cup already uses `compartir.js` and `laminaResultado`) and
**passing the phone** (Cup days are played alone; Línea de tiempo uses `handoff.js`).

## The order: PRs that dissolve the layer

Each PR in phase 5's style: before/after screenshots at 390 and 320 px, the intended differences in
the body, the design baseline rewritten, and `cup/tournament.mjs`, `cup/languages.mjs` and
`cup-games/languages.mjs` green. U-21: a PR that changes what a live cup shows merges on a day no cup
is playing a changed screen, or behind a flag.

| # | PR | Risk | Owner's decision? |
|---|---|---|---|
| 1 | Delete the exact copies (`.screen`, `.form-error`, `.result-hero`, `.seg`, `.field` base rules) and move El caso's `.cs-*` to its own stylesheet | lowest: pixel-level differences only | no |
| 2 | `.dur-switch` → `.switch` in `.toggle-row`; the three chip toggles → one `.chip-btn` in base; `.chip--final` → `.chip--cyan` | low: the create screen (admin only) | no, intended differences listed |
| 3 | `.opciones` grid, `.field .pin`, `.field .contador`, date field, `.link-inline`, `.btn--danger`, `.btn-row--wrap` into base; the cup uses them | low–medium: join and create screens | no |
| 4 | `.toast`, `.aviso`, `espera()` lifted to base / `assets/js/`; home online games may adopt them later | medium | no (a new component on the components page) |
| 5 | One how-to-play block for home and Cup | medium: every Cup day's cover | **yes**: folding the Cup's open rules (U-16) changes what every player sees |
| 6 | One start screen: drop the Cup mini-game's "Volver al menú" button, shared cover builder | medium–high: every Cup day and every solo Cup game | **yes**: removes a button players use (U-21) |
| 7 | Tokenise the cup's own (table, calendar, podium, week builder, chart colours as `--token`s with their rows in DESIGN.md §4) | high in size, low in looks | **yes** for any colour whose meaning changes (the day blocks of D-131, the ×2 of D-151) |

**The owner's decision (2026-11-05):** PRs 1 to 5 go ahead, PR 5 as "fold La Copa's own rules into
the shared classes". **PR 6 and PR 7 are declined**: the Cup mini-game's "🏠 Volver al menú" button
stays, and the cup's own colours (the day blocks of D-131, the final's ×2 of D-151, the table, the
calendar, the podium, the chart) keep their values and meanings as they are. What each done PR
changed is in [docs/games/cup.md](../games/cup.md) ("In the design system").

| # | Status |
|---|---|
| 1 | done (branch `phase7-cup-1`) |
| 2 | done (branch `phase7-cup-2`) |
| 3 | done (branch `phase7-cup-3`) |
| 4 | done (branch `phase7-cup-4`): as `.notice` and `.snackbar`, because Batalla Naval's `.toast` and Aletazo's `.aviso` already mean something else |
| 5 | done (branch `phase7-cup-5`): the rules are `details.panel`, open on the covers as before (folding them there is still the owner's call, U-16) |
| 6 | declined by the owner, 2026-11-05 |
| 7 | declined by the owner, 2026-11-05 |

Done when `cup/style.css` holds only the cup's own, on tokens, under a third of its size (#1196).
