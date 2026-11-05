# 🎨 The components page (the design system, in the lab)

Not a game: the live catalogue of the design system (D-533, [DESIGN.md](../DESIGN.md)), phase 3 of
#1188. Every token of `base.css` and every shared class of `base.css`, `ranking.css` and
`teclado.css`, drawn from those sheets alone, so the owner and the agents look at one page before a
screen is designed, a new game copies from here, and the usability agent's round compares it with
the games.

## Summary

- **Where:** `https://juegosdesalon.cl/labs/design/`, behind the lab's door (D-281), `noindex`; its
  card in `/labs/` among the active projects (`#seccion-design`; not a game, but ✨ Mejoras en prueba
  is for a flag a page outside the lab asks, `bodega.test.mjs`). Not in `games.js`, not on the
  home page: it is the owner's and the agents', never a player's.
- **Language:** Spanish, the lab's (D-191); most of what it shows are token names.
- **What it shows:** the colour tokens as swatches with their value, the space, corner and text
  scales as drawn boxes, the four `.display` steps and `.rainbow`, every button variant and state
  (pink, yellow, cyan, ghost, small, disabled, in a row, the back link, the icon button, the language
  toggle), chips, the folding panel, the stack, a ranking with three rows from `ranking.css`, the
  keyboard and the entry boxes from `teclado.css`, and where the escapes live.
- **Live, not copied:** the tokens are read from `base.css` itself (fetched and parsed), so a new
  token appears without touching the page; each component is the shared class, and the page's own
  stylesheet (`style.css`) holds layout only, on the tokens: `node tools/agents/design-lint.mjs
  public/labs/design/style.css` reports zero.
- **Test:** `tools/e2e/design/page.mjs`: the page opens behind the lab key, shows every section,
  the tokens are read, no sideways scroll at 320 px, every tappable thing is 44 px or more.

## Exceptions to the canons

- No game id, no usage signal of its own beyond the page visit (`vigia.js`), no rankings, no share.
- One language.
