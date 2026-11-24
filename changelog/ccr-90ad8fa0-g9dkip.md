level: patch

- **Duels open straight on the quick duel** (lab flag rivals): «Nuevo duelo» no longer asks ⚡ or 🛠️ first; the rival, the format and the game are there at once, and «🛠️ Arma un duelo a tu medida» is a link right under the button, with «⚡ Volver al duelo rápido» to come back.
- **A custom duel picks how to win, then how many rounds**: 🏆 most rounds won, over 3, 5, 7 or 9 rounds (odd, so there is always a winner), or ➕ most points, over any number from 2 to 9. The rules (`firebase/database.rules.json`), the test store and a round's link take up to nine rounds.
- **The custom duel's sheet changes size smoothly** (lab flag rivals): going from step to step, switching between most rounds won and most points, or opening a round to change its game, the sheet eases to its new height instead of jumping, and each new step fades in. With reduced motion it changes at once.
