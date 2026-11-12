level: patch

- **Launch workflow**: its input to turn a splash campaign off is now `turn_off`. A bare `off` is a YAML boolean, so GitHub rejected it at Sudoku's launch (Aletazo's promotion was ended by its end time instead); a test stops input names that YAML reads as booleans.
- **Sudoku's icon on the home page**: its card and the search show the game's drawn 3×3 icon instead of #️⃣.
