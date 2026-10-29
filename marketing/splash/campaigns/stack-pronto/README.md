# 🧱 Llegar al cielo es el objetivo (`stack-pronto`)

A teaser of 🧱 Stack, still in the lab: it says something is coming, not what. No game name and no
link: a hint the game makes clear once it launches.

| | |
|---|---|
| Texts | kicker "Muy pronto / Coming soon / Em breve / Demnächst"; title "Llegar al cielo es el objetivo / Reaching the sky is the goal / Chegar ao céu é o objetivo / Das Ziel ist der Himmel" |
| Item | a teaser: `public/assets/splash/stack-teaser.mp4` (512×320, 8 s loop at 30 fps, 160 KB), its first frame `stack-teaser-start.png` as the poster and its still `stack-teaser.png`, made by [`teaser.mjs`](../../teaser.mjs) from [`teaser/stack.html`](../../teaser/stack.html) |
| The scene | drawn with the game's own scene (`public/labs/stack/scene.js`), cryptic on purpose: a tall tower of neon slabs, already built, that the view circles and climbs from dusk at its foot to its top among the stars. Nothing slides, drops or is cut: the play is not shown |
| On | off: made 2026-10-28, waiting for the owner to turn it on from the panel (📣 Campaigns) |
| Usability | full pass before it is turned on (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash stack-pronto --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [de](de-390.jpg).

## History

- **2026-10-28:** made at the owner's request, off, together with [`ninja-pronto`](../ninja-pronto/README.md).
- **2026-10-28:** redrawn in the game's isometric view (the owner's request: the flat side view did not look like the game), and the window centered on a computer, where it sat to the left.
- **2026-10-28:** rewritten cryptic (the owner's request): the view circles a built tower, nothing drops; new title.
