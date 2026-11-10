level: patch

- **La Copa's board ends with the site footer** (lab, flag `cup-footer`): «Report a problem» and «Leave this cup» become tiles of the violet-sunset footer instead of two loose links (U-38). `site-footer.js` takes a screen's own `options`; `site-footer.test.mjs` fails on any new loose link outside a game.
- **Artefactos' lab test** pins the day it plays, so it no longer fails on dates whose five stages the drags were not placed for.
