# 🥷 ¿Llegará al otro lado? (`ninja-pronto`)

A teaser of 🥷 Stick Ninja, still in the lab (D-446): it says something is coming, not what. No game
name and no link: a question the game answers once it launches.

| | |
|---|---|
| Texts | kicker "Muy pronto / Coming soon / Em breve / Demnächst"; title "El ninja enfrenta una misión nunca antes vista / The ninja faces a mission never seen before / O ninja enfrenta uma missão nunca vista / Eine Mission wie keine andere für den Ninja" |
| Item | a teaser: `public/assets/splash/ninja-teaser.mp4` (512×320, 8 s loop at 30 fps, 39 KB), its first frame `ninja-teaser-start.png` as the poster and its still `ninja-teaser.png`, made by [`teaser.mjs`](../../teaser.mjs) from [`teaser/ninja.html`](../../teaser/ninja.html) |
| The scene | drawn with the game's own scene (`public/labs/stick/scene.js`), cryptic on purpose: the night with its crescent moon and mountains, the neon-edged pillars with their flags; the ninja dashes to the edge of its pillar and stops, looking across the gap at the next one, and stays. No stick grows: the play is not shown |
| On | off: made 2026-10-28, waiting for the owner to turn it on from the panel (📣 Campaigns) |
| Usability | full pass before it is turned on (D-355) |

Screenshots at 390 px, as `node tools/e2e/look.mjs splash ninja-pronto --lang <xx>` shows it:
[es](es-390.jpg) · [en](en-390.jpg) · [pt](pt-390.jpg) · [de](de-390.jpg).

## History

- **2026-10-28:** made at the owner's request, off, together with [`stack-pronto`](../stack-pronto/README.md).
- **2026-10-28:** redrawn with the game's own scene: the first version was its own pixel art, with a full moon over roofs and black pillars, and did not look like the game.
- **2026-10-28:** rewritten cryptic (the owner's request): no stick, the ninja only looks at the next pillar; new title.
