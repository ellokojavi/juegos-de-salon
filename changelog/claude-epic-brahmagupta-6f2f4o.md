level: patch

- **Battleship and Bulls and Cows share one phase rule** (`hidden-match.js`): lobby → hide your fleet or secret → play → reveal → done, worked out from the match the same way in both games instead of three hand-written copies. The commit and the reveal stay accepted in any phase, now written down why: messages are ordered by each phone's clock, and dropping an early reveal would leave the game stuck. Nothing changes for players.
