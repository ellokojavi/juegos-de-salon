# 🕵️ Agentes

A mini *Codenames* for one player (D-286, D-287): the game gives a clue with its number and the
player finds their agents among 15 words, without touching the neutrals or the assassin. **Inspired
by [Codenames](https://czechgames.com/en/codenames/), by Vlaada Chvátil (Czech Games Edition)**, and
the waiting room says so, with the link.

## Summary

- **Where:** `https://juegosdesalon.cl/agents/`, on the home page with the ✨ Nuevo label from
  2026-10-22, in La Copa's pool and in Uno al día from 2026-10-24. Id `agentes` (the same as in the
  lab's usage signal). It left the lab in D-421, in Conexiones' place; `/labs/agents/` is a bridge
  to `/agents/`.
- **For whom:** one player. In the four languages, each with its own deck of clues (D-170).
- **History:** lab project from v0.157.0 (RP-55), with 100 concrete clues and a board of the day
  (D-288), 18 clues of ideas (#383), and out of the lab in D-421.

## Waiting room

It is La Copa's waiting room, like every one-player game (D-198): the title with a rocking 🕵️ and
a red **Clasificado** stamp over its corner (`titulo` in `ui.js`), the three steps, and a drawing
that plays by itself (`ejemplo`): a clue decodes letter by letter («MAR · 3»), a 🔍 goes over the
cards and turns over its 3 agents, and at the end the assassin, which looks like the clue (RÍO),
turns over. Then another clue (NOCHE, CIRCO) and it starts again; each language has its own three
(`agDemo` in `texts.js`). With reduced motion the first one stays, solved. Under it, the credit to
Codenames with its link. The steps:

1. Every word is a spy's codename. Tap the ones that go with the clue: «MAR · 3» means 3. 4 clues come, one at a time.
2. Avoid the 3 neutrals (−15) and the assassin (−40): they look like a clue and cut it short.
3. If you are unsure of a card, press and hold it to mark it, or skip the clue. An agent from another clue counts too.

The numbers come from `numbers.js` (`CUANTAS`, `NEUTRALES`, `RESTA_NEUTRAL`, `RESTA_ASESINO`).

## How it is played

- **To start:** La Copa's 3, 2, 1, ¡A jugar! (D-105); the board comes with the "¡A jugar!" and the
  clock runs from there.
- **Board:** 15 words in 3×5: 11 agents in 4 clues (three of 3 and one of 2, «· 2»; which one changes
  with each board), 3 neutrals and 1 assassin. The neutrals and the assassin come from the clues'
  temptations: the 4 cards that are not yours look like some clue.
- **Clues:** they come one at a time, «MAR · 3». Touching an agent of the clue scores; one of another
  clue also scores and does not cut. A neutral (−15) or the assassin (−40) cut the clue and the next
  one comes. "⏭️ Siguiente pista" passes; on the last one it says "🏁 Terminar", which asks first if
  agents are missing ("¿Terminas igual?", U-15).
- **Marks:** pressing and holding a card (450 ms, the gesture of Toque y Fama's notes: no new UX is
  invented, D-102) marks it without turning it over: 📌 suspect, again 🚫 ruled out, again no mark.
  A 🚫 does not turn over when tapped (it shakes), so the assassin already guessed is not touched by
  mistake. While held, the border fills (the mark is seen coming), and the notice line says what it
  did. Under the board, a line explains it until the first mark. The marks are saved with the moves.
- **Colors per clue:** each clue has its color (green, cyan, pink, violet; neither yellow, the marks',
  nor red, the assassin's). The current clue's sign has it, and every agent turned over takes its
  clue's, also if found early. Those of clues already closed dim: they do not count for the current one.
- **Between clues:** the closing clue gets a stamp (**Completa** green, **Cortada** red, **Pasada**
  yellow), turns away and the next arrives turning, its word decoding. An agent glows when turned
  over, a neutral shakes, and the assassin shakes the board with a red flash on the screen.
- **The end:** the cup clock stops (D-130), the cards nobody touched turn over one by one, and then
  a big stamp: **¡Misión cumplida!** green with confetti (70 or more), **Misión a medias** yellow,
  **Misión fracasada** (under 35) or **Te descubrió el asesino** red, with a glitch now and then. Under
  it, the trap explained («💀 Caíste con RÍO: parecía de MAR…», or «Esquivaste al asesino…»), and on
  the board, under every agent its clue and under the assassin and every neutral the clue it looked
  like («≈ MAR»). "Ver resultado" opens La Copa's result.
- **Score:** 100 × agents found / 11, minus the subtractions, never under 0. The breakdown (D-106):
  agents found, neutrals and the assassin. The share card (🟩 agent, 🟨 missed, 🟥 neutral touched,
  ⬜ neutral not touched, 💀 assassin touched, ⬛ not touched) goes in the share message.
- **Standalone** a random board every time (D-332): the lab's board of the day and its clue calendar
  (D-288) went away; Uno al día is the daily challenge. **In a cup** the code and the day decide it, in
  the cup's language (`CON_PALABRAS`), so everybody plays the same board; the **trial** is two clues
  (3 and 2 agents), one neutral and the assassin. **The Gran Final** plays it whole, with its own board
  (D-418).

## How it works

- `clues.js` (Spanish from Chile), `clues-en.js`, `clues-pt.js`, `clues-de.js`: about 118 clues
  each, every one with 9 or 10 words that go with it (`si`) and 3 temptations (`casi`): 100 of concrete
  things (`CLASICAS`) and 18 of ideas (`ABSTRACTAS`: MIEDO, SUERTE, LIBERTAD…, Cris's request in #383,
  approved in #387), where the words evoke the idea without being from its field (SUERTE → TRÉBOL,
  SIETE; it tempts ÉXITO). A temptation is never right for some table: SUERTE does not tempt GATO
  (bad luck is luck too), PASCUA does not tempt NAVIDAD (in Chile Pascua *is* Christmas), TIEMPO
  does not tempt CLIMA or LLUVIA (in Spanish tiempo is also the weather), and a season carries no month or
  Easter (JULIO is winter in Santiago and summer in Madrid). The other languages are adapted, not translated: a Chilean item (ONCE, KUCHEN,
  VOLANTÍN) becomes the language's own (POPCORN, PIPA, DRACHEN), and a clue that does not work becomes
  another (TIEMPO is also the weather, so in Portuguese it is CALENDÁRIO). A new word is thought of as a
  player: the association has to be seen without explaining it.
- **What only one country knows** (D-187): the clues marked `local: 'cl'` (CHILE, DIECIOCHO, FERIA)
  or `'br'` (BRASIL, ARRAIAL) and the words in each deck's `LOCALES` (COCHE, TACO, ONCE, CABRITAS…;
  PIX, CEP, BRIGADEIRO…) stay out of a cup for another audience: `mazoPara(lang, aud)` in `engine.js`.
  Standalone and Uno al día play the whole deck, like the other games.
- `numbers.js`: the numbers, apart so the texts (merged into `rules.js`) say them without loading the decks.
- `engine.js`: `generar(semilla, { lang, aud })` picks 4 clues that do not step on each other (none is a word
  or temptation of another) and, at random, the one with an agent less; the agents of each (3, or 2
  the short one) that are not of another chosen clue; the assassin from the temptations, not an agent of
  any, and the 3 neutrals from the temptations too, preferably of another clue than the assassin's. The
  assassin and the neutrals carry `tienta`, the clue they look like. No clue is on its own board.
  `generarDia(código, día, { sal, palabras, aud, ensayo })` is La Copa's (D-331). `estado(t, jugadas)`
  rebuilds the game from the moves (`{i}` or `{pasar:true}`).
- `ui.js`: the screen (`montar`), the waiting room's title and drawing, the result and the breakdown.
  `texts.js`: its texts in the four languages, keys prefixed `ag`. `style.css`: its classes prefixed `ag-`.
- `engine.test.mjs` checks the four decks (one word per card in capitals, at most 15 letters, 9 or 10
  words and 3 temptations per clue, and no month or Easter in a season in Spanish, Portuguese or English,
  which are spoken in both hemispheres) and 300 boards in each language (each clue with the agents it says,
  11 in all, and the assassin and the neutrals tempting the clue they say), the local words (each in
  some clue, marked `cl` or `br`) and 300 boards per audience without what it leaves out, the whole
  deck without an audience, the cup day and its trial,
  and the state and the score; `tools/e2e/agents/game.mjs`, the whole game at `/agents/`.

## Exceptions to the canons

None.
