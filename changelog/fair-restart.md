level: patch

- **👈 A back swipe mid-game asks before leaving** (D-432, lab): with a lab key, the iPhone's edge swipe and Android's Back no longer take the game away. They open «¿Salir de la partida?» with ▶ Seguir jugando and Salir. Every game gets it, and Back works as usual once the game is over.
- **📅 Uno al día: the first attempt counts from its start** (D-433, lab): with a lab key, leaving a bad attempt no longer lets you replay the same board from zero. A solo game left halfway goes on where it was, with its time; a group game left halfway, or a day that ends unfinished, counts 0. With a player, this also holds across phones (`unoAlDiaInicio/` in the Firebase rules).
- **🏆 La Copa: the clock does not reset on another phone** (D-433, lab): with a lab key, a day resumed where its save is missing keeps its clock from when it started, and the screen says so.
