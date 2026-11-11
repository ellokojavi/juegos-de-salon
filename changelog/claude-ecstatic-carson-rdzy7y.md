level: patch

- **🧮 Sudoku splash, animated**: its clip shows how a digit is found: the copies already on the board draw their rows and columns across the grid, the view zooms into the 3×3 box they cross, the one free cell takes the digit, and it zooms out to the next one. Still off until the game launches.
- **Even margins in the big splash windows**: on a short or wide screen the clip sits as far from the card's top as from its sides, instead of flush on top. A new design rule, checked end to end.
- **Margins and preview links**: the design system's key margins (centered column, even card padding, even media in a card) are rules checked on every end-to-end screenshot, and a PR's preview link now appears only once the preview shows that version.
- **Even padding on the ranking invitation**: the compact One a Day invitation had more padding on its left than its right; the new margin rule caught it.
