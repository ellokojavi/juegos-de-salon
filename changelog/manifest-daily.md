level: patch

- **Which games come out in Uno al día lives in each game's entry**: the date a game joins the daily deck, the day it leaves and whether it is a group game are now `unoAlDia` in `games.js`, and `uno-al-dia.js` builds its list from there, in the same order, so no day's game changes (#855, phase 3).
