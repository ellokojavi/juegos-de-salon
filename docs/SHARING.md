# Sharing: every share button, its template and its review

Everything the app shares goes through `public/assets/js/compartir.js` (D-165). The rules a share
follows are U-30 to U-35 in [USABILIDAD.md](USABILIDAD.md); this page is the **inventory** of every
place that shares, the **templates** they fit in, and the **review** of each one (2026-11-24).

## The pipe (one for all)

`compartir({ titulo, texto, url, imagen, que })` in `compartir.js`:

1. Marks the link `from=link` (D-208) and appends it as the last line, `🔗 …` (D-124).
2. With an image and a phone that shares files: the system menu with image + text.
   Without image: the system menu with text only (the link inside the text, never as `url`).
3. No menu (a computer): copies the whole message; an image is downloaded.
4. Returns `shared` / `copied` / `downloaded` / `failed`, and counts the share for the panel
   (`comparte/<que>`, D-349; without `que` the page decides: `app`, `copa`, `resultado-<page>`).

Builders on top of it: `cabecera()` (the header line), `botonInvitar()` (room invite button),
`botonCompartir()` (a button that builds an image first), `botonResultadoSolo()` (solo result),
`lamina()` / `laminaResultado()` (the image frame and the result image), `shareButton()` in `ui.js`
(round icon button), `compartirApp()` (the app message), `shareGrid()` in `share-grid.js` (the
spoiler-free emoji grid).

## The templates

Every share is one of six kinds. A new share picks one; it does not invent a seventh without a D-n.

| Kind | Header (`{emoji} *{title}* · {context}`) | Body | Image | Link | `que` |
|---|---|---|---|---|---|
| **T1 Invite to a room** | `{game emoji} *{game}* · Sala {code}` | `👋 {name} te invita…` | none: the link's social card (D-72) | the room | `invita` |
| **T2 Invite to a thing** (cup, duel, Uno al día) | the thing's emoji and name · what it is | one idea per line: who, what, when | none | the thing | `copa` / `duelo` / `uno-al-dia` |
| **T3 Present the app** | `🎲 *Juegos de Salón* · {n} juegos…` | `LO_PRINCIPAL`, one line each (U-35) | the home social card of the language (D-226) | home | `app` |
| **T4 Present a game** | `{emoji} *{game}*` | `shareGameCta` | none | the game's cover / sheet | `cover` |
| **T5 A result** | game or competition · context | only what the image lacks: the challenge, the grid, the streak (D-171) | `laminaResultado()` | the game | `resultado-<page>` |
| **T6 A table / ranking** | competition · day or month | who is missing / my place | `lamina()` + the table | the competition | `copa` / `uno-al-dia-ranking` |
| (video) | `🎬 *Juegos de Salón* · Mira el video` | `videoLines` | none: YouTube's thumbnail (D-253) | the Short | `video` |

## The game's line (flag `share-tagline`)

Every share about one game (T1, T4, T5 and a duel) carries, right after the header, one line with
what the game is about: `🎮 {tagline}`, the game's own tagline (`tagline` in its manifest or in
`games.js`, the one its card shows), in the message's language, built by `taglineLine()` in
`compartir.js` (the owner, 2026-11-24). Never in Uno al día, whose share must not name the game
(#215), nor in a custom duel (it mixes games). `compartir.test.mjs` checks every playable game has a
tagline in the three languages, short enough for one or two lines (≤ 120 characters).

## Inventory

| # | Where (player sees) | Button | Kind | Code |
|---|---|---|---|---|
| 1 | Home, top bar | 📤 → sheet: «💬 Invitar a jugar» | T3 | `compartir-portada.js`, `index.html` |
| 2 | Home, same sheet | «🎬 Compartir el video» (tab ES/EN) | video | `compartir-portada.js` `textoVideo` |
| 3 | Home, a game's sheet (carousels) | 📤 icon | T4 | `home-carousels.js` |
| 4 | A game's cover (lab flag `cover-share`) | 📤 icon | T4 | `cover-share.js` |
| 5 | Room lobby of every group game (Ahorcado, Batalla Naval, Toque y Fama, Generala, Dudo, Línea de tiempo, Julepe, Blackjack) | «Compartir link» / «Copiar link» | T1 | `botonInvitar()`, each `game.js` `shareButton(url)` |
| 6 | End of a solo game (Toque y Fama, Línea de tiempo, labs: Memoria, Code, Dominorama, Números explosivos, Torre) | «📤 Compartir mi resultado» | T5 | `botonResultadoSolo()` |
| 7 | Labs with their own result (Transfer, Críptico, Sudoku, Blackjack) | own label | T5 | `botonCompartir()` in each `game.js` |
| 8 | La Copa: invite | «Invitar» | T2 | `cup/game.js` `mensajeInvitacion` |
| 9 | La Copa: my result of the day | 📤 | T5 | `cup/result.js` |
| 10 | La Copa: table (partial and final, podium) | 📤 | T6 | `cup/game.js` `compartirTabla`, `table-image.js` |
| 11 | La Copa: admin messages (today, reminders, final) | small buttons | T2 / T6 | `cup/admin.js` |
| 12 | La Copa: a game played loose inside it | «📤 Compartir mi resultado» | T5 | `cup/game.js:2515` |
| 13 | Uno al día: result | «📤 Compartir mi resultado» | T5 + grid | `uno-al-dia-ui.js` (≈ line 199) |
| 14 | Uno al día: invite a friend (+10) | «Invitar» | T2 | `uno-al-dia-ui.js` (≈ line 285) |
| 15 | Uno al día: ranking on /today/ | «📤 Compartir la tabla» | T6 | `botonCompartirRanking()` |
| 16 | Duels: challenge a rival | «Retar» | T2 | `duels-ui.js` `shareInvite` |

## Review

✅ fits its template · ⚠️ works but strays · ❌ breaks a rule.

| # | Verdict | Finding |
|---|---|---|
| 1 | ⚠️ | Fits T3, but the message is **ten lines** (header + eight `LO_PRINCIPAL` lines): in a WhatsApp group it is a wall, and the card already says the essentials. U-35 asks it to name everything; it does not ask it to be long. See «Home» below. |
| 2 | ✅ | Short, own header, YouTube makes the preview. |
| 3, 4 | ✅ | Same text (`coverShareText`), header without context, one CTA line. Only 2 lines: the friend does not learn what the game is about (no one-line description). |
| 5 | ⚠️ | Header ok. «👋 {name} te invita a jugar en juegosdesalon.cl.» names the domain and then the link repeats it. If `name` is empty the line reads «👋  te invita…». Two parallel helpers: each game defines its own `shareButton(url)` wrapping `botonInvitar` (same code ×8). |
| 6 | ✅ | Reference implementation of T5. |
| 7 | ⚠️ | Each lab builds its own `botonCompartir` text: to be checked against T5 when each leaves the lab. |
| 8–12 | ✅ | `mensajeCopa()` keeps the blank line after the header; image and text share `cabCopa`. |
| 13–15 | ❌ U-30 | The text joins header and body with a single `\n`: every other share leaves a blank line after the header. |
| 16 | ❌ U-30 | **No header line**: it opens with «⚔️ {a} te reta…», so it is the only share without `{emoji} *{title}* · {context}`. |
| — | ⚠️ | `compartir.js` has an orphan doc comment («Dibuja con halo claro…») above `cargarIcono`; it belongs to `conHalo`. |
| — | ⚠️ | No central list: each caller assembles its text, so U-30 is only checked by eye (👁). A template module would let a test check it (🤖). |

## Home: what to improve

1. **Shorter app message**: header + 3 lines (what it is, how you play, «sin cuenta, gratis»),
   with `LO_PRINCIPAL` kept in full on the card and the `/about` text (needs U-35 amended).
2. **The sheet**: today it is video first, then two options. Proposal: the two options first
   (what most people tap), the video below, smaller.
3. **Share a game from the sheet**: a third option «🎮 Compartir un juego» (T4) with the list.
