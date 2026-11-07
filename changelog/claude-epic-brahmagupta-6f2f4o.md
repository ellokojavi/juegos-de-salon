level: patch

- **Online rooms follow one set of rules** in Hangman, Timeline, Generala and Liar's Dice: joining, the host's start and the rematch offer now go through one shared, tested piece (`room-state.js`). In Generala and Liar's Dice a second rematch offer from the same player no longer replaces the first, and in Hangman a reveal that arrives before the game starts no longer breaks the page.
