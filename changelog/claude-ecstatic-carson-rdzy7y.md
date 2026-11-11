level: patch

- **Splash campaigns check themselves**: the panel's preview of each campaign says ✓ or ⚠️ (an icon drawn too big, an old stylesheet, a window taller than the screen, a clip not flush), and the end-to-end tests check every campaign the same way. The splash's stylesheet now follows each release, which drew Sudoku's icon huge in the panel.
- **Lab games named in the panel**: ¡Al toque!, Sudoku, Memorice, Artefactos, Dominorama, La clave, El Camaleón and Números explosivos showed their internal id in the panel's lists; they now show their name, and a test stops a game from sending signals without one.
