# Teasers: the rules and the engine (D-505)

A teaser is a splash campaign for a game that is coming: it builds expectation and gives nothing
away. Players should want the game before they know what it is. These are the owner's rules
(2026-10-28); `teaser.test.mjs` checks the ones a machine can.

## The rules

1. **It looks like its game.** It draws with the game's own scene (`public/<game>/scene.js`) or
   sprites: the same view, colors and characters, so the player recognizes it on launch day. A game
   whose drawing lives in `game.js` moves it to `scene.js` first. *(tested)*
2. **It shows the world and the goal, never the play.** No input, no mechanic, no score, no win or
   loss: Stack's tower is already built and the view circles it; the ninja runs to the edge and looks
   at the next pillar, no stick. If a frame explains how the game is played, it goes.
3. **One moment of tension, never resolved.** Three beats: the world, the approach, the moment it
   stops on (`beats()` in the engine). The loop ends before anything is answered.
4. **No words in the clip.** The splash's title carries them: a statement or a hint that intrigues
   ("Llegar al cielo es el objetivo", "El ninja enfrenta una misión nunca antes vista"), never how to
   play. Kicker "Muy pronto"; no game name, no link, no Play. *(tested: no `fillText`)*
5. **One format.** 8 s at 30 fps, 512×320 (`ratio: '8 / 5'`, `smooth: true`), in and out of black,
   all given by the engine. *(tested: on the engine)*
6. **Looked at as players see it.** `look.mjs splash <id>` at 320, 390 and 1280 px, in the four
   languages; a title that breaks a word or takes four lines is shortened.

## The engine

`teaser/_teaser.js` gives every teaser the fixed clock (the game's own effects draw the same frames
on every capture), the background and game canvases, the fades, the recording contract and `beats()`.
A teaser page is only its story: `setup` (the game's scene and a world set up by hand),
`background` and `draw`.

## A new teaser, step by step

1. The game exists in the lab with its drawing in `scene.js` (rule 1). A game that is only an idea
   gets its scene first: the teaser is never drawn on its own.
2. `node marketing/splash/teaser.mjs new <name> <game folder>` (e.g. `labs/stack`) writes
   `teaser/<name>.html` from `_template.html`; write its three beats.
3. `node marketing/splash/teaser.mjs <name>` records `public/assets/splash/<name>-teaser.mp4`, its
   poster and its still.
4. The campaign as in [README.md](README.md) ("Making a campaign"): an item with `video`, `img`,
   `still`, `ratio: '8 / 5'` and `smooth: true`, the title in four languages (rule 4), its folder with
   screenshots (rule 6), off until the owner turns it on.

Tren en Vilo's teaser (`bridges.html`) predates the engine: pixel art with the game's sprites, and a
"?" drawn in the clip. It is kept as it ran and is not a model for new ones.
