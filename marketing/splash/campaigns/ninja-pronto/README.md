# 🥷 ¿Llegará al otro lado? (`ninja-pronto`)

A teaser of 🥷 Stick Ninja, still in the lab (D-446): it says something is coming, not what. No game
name and no link: a question the game answers once it launches.

| | |
|---|---|
| Texts | kicker "Muy pronto / Coming soon / Em breve / Demnächst"; title "¿Llegará al otro lado? / Will it reach the other side? / Será que chega do outro lado? / Reicht es bis drüben?" |
| Item | a teaser: `public/assets/splash/ninja-teaser.mp4` (512×320, 8 s loop at 30 fps, 114 KB), its first frame `ninja-teaser-start.png` as the poster and its still `ninja-teaser.png`, made by [`teaser.mjs`](../../teaser.mjs) from [`teaser/ninja.html`](../../teaser/ninja.html) |
| The scene | drawn with the game's own scene (`public/labs/stick/scene.js`): the night with its crescent moon and mountains, the neon-edged pillars with their flags. The ninja crosses onto a flag and once more; then the stick grows, tips toward the next pillar… and the night stops and dims the instant before it lands; a "?" pops up over the gap. It never lands |
| On | off: made 2026-10-28, waiting for the owner to turn it on from the panel (📣 Campaigns) |
| Usability | full pass before it is turned on (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash ninja-pronto --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [de](de-390.jpg).

## History

- **2026-10-28:** made at the owner's request, off, together with [`stack-pronto`](../stack-pronto/README.md).
- **2026-10-28:** redrawn with the game's own scene: the first version was its own pixel art, with a full moon over roofs and black pillars, and did not look like the game.
