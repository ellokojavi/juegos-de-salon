# 🎨 The components page (the design system, in the lab)

Not a game: the live catalogue of the design system (D-533, [DESIGN.md](../DESIGN.md)), phase 3 of
#1188. Every token of `base.css` and every shared class of `base.css`, `ranking.css` and
`teclado.css`, drawn from those sheets alone, so the owner and the agents look at one page before a
screen is designed, a new game copies from here, and the usability agent's round compares it with
the games.

## Summary

- **Where:** `https://juegosdesalon.cl/labs/design/`, behind the lab's door (D-281), `noindex`; its
  card in `/labs/` under ✨ Mejoras en prueba (`#seccion-design`; the page names its own card, which
  `bodega.test.mjs` accepts from a page that lives in the lab). Not in `games.js`, not on the
  home page: it is the owner's and the agents', never a player's.
- **Language:** Spanish, the lab's (D-191); most of what it shows are token names.
- **What it shows:** the colour tokens as swatches with their value, the space, corner and text
  scales as drawn boxes, the four `.display` steps and `.rainbow`, every button variant and state
  (pink, yellow, cyan, ghost, small, disabled, in a row, the back link, the icon button, the language
  toggle), chips, the folding panel, the stack, the game shell (`#ds-armazon`, phase 4: the cover's
  hero, modes, fields and the form's error, the segmented control, choice buttons, player rows, the
  toggle row and its switch, the link button, the room's code, QR, players, "or" and waiting, whose
  turn, the result's hero), from `ranking.css` a ranking with three rows, the
  record line, the tabs (`.rk-seg`) and the sign-in fields (`.rk-campo`, `.rk-link`), from
  `teclado.css` the keyboard with its ⌫ and OK keys and the entry boxes, and where the exceptions live.
- **The full-screen pieces** (`#ds-pantallas`, phase 3b, #1200): each overlay of `base.css` in a
  phone-sized frame (`.ds-telefono`, 360 × 560 at most), with the real markup (`handoff.js`'s inline
  styles included) and `.ds-marco` turning its `position: fixed` into `absolute` inside the frame
  (the page's own stylesheet, layout only; `isolation` keeps their z-index in the frame). The
  pass-the-phone overlay with a good verdict and a bad one (the bad one's pink is Ahorcado's own
  `.handoff.bad`), the cover with whom to pass it to, the countdown, the bottom sheet open, the room
  chat's bubble with its unread badge and peek, its sheet open with messages, the random-game die
  (the emoji fallback, no WebGL), the One-a-day card and the footer's tiles. The section is not a
  `.panel`, so at 320 px a frame is as wide as a phone's content.
- **Live, not copied:** the tokens are read from `base.css` itself (fetched and parsed), so a new
  token appears without touching the page; each component is the shared class, and the page's own
  stylesheet (`style.css`) holds layout only, on the tokens: `node tools/agents/design-lint.mjs
  public/labs/design/style.css` reports zero.
- **Test:** `tools/e2e/design/page.mjs`: the page opens behind the lab key, shows every section,
  the tokens are read, each of the ten frames draws its piece inside it (`window.__design.marcos`),
  pinned absolute, nothing in a frame wider than it, no sideways scroll at 320 px, every tappable thing is 44 px or more (except
  `.back` and `.switch`, the system's own debts in DESIGN.md §5), no
  button label wraps on the page or on its lab card (U-17).

## Exceptions to the canons

- No game id, no usage signal of its own beyond the page visit (`vigia.js`), no rankings, no share.
- One language.
