level: patch

- **Launch workflow**: its input to turn a splash campaign off is now `turn_off`. A bare `off` is a YAML boolean, so GitHub rejected it at Sudoku's launch (Aletazo's promotion was ended by its end time instead); a test stops input names that YAML reads as booleans.
- **Sudoku's icon on the home page**: its card and the search show the game's drawn 3×3 icon instead of #️⃣.
- **Game icons everywhere**: Sudoku's drawing now shows wherever a game's icon is on screen (its top-bar chip, cover, result, Play buttons, La Copa's day screens, game picker and calendars, Rankings, Uno al día's page), through one helper, `gameIcon()` in `game-icon.js`; text (share messages, titles, notifications, share images) keeps #️⃣. DESIGN.md rule 9 lists the places and `game-icons.test.mjs` keeps new screens on the helper.
