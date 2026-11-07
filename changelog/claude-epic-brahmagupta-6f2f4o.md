level: patch

- **Every online game's room follows the same rules** (D-539): Battleship, Bulls and Cows and the lab's Julep now apply joining and rematch through `room-state.js`, like Hangman, Timeline, Generala and Liar's Dice. In Julep a second rematch offer from the same player no longer replaces the first, so two phones cannot end up in different rooms. A join can carry more than a name through `onHello` (Julep's key for its sealed hand).
