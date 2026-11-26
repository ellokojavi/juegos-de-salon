# The player profile and what sits around it

`/profile/` (`public/profile/`, flag `profile`, live for all since 2026-11-22) is where a player sees their own
figures, achievements and settings. The decisions behind it are D-349, D-602 to D-605 and D-615 (the use counted by
name, for the owner only); this file says what the code does today. Every feature below that is still in the lab
has its own flag, listed with its switch on `/labs/` (`flag-list.js`).

## The card and the tabs
- **Figures** (`profile.js`): streak, games played and cups won. A figure is only the server's: until it arrives
  there is a spinner, never this phone's partial count; a failed read shows «—», not zero; once in, it counts up
  from where it stood (never from zero again) and, with reduced motion, shows the number at once.
- **Logros** (achievements, `badges.js`): bronze, silver and gold in groups (daily, cup, duels, games). `?reveal`
  on the URL replays the last badge earned, `?reveal=<id>` a given earned one, to try the reveal as often as wanted;
  nothing is recorded.
- **Tus partidas** (flag `profile-plays`, lab): one bar per game on Logros, the most played first, five shown and
  the rest under a button; it leaves Rankings.

## ⚙️ Preferencias
- **Sound and language only here** (flag `settings-in-profile`, lab): a class on `<html>` hides 🔊 and the
  language on every other page, before the first paint on a phone that saw it on.
- **Vibration** (flag `vibration-setting`, on for all since 2026-11-24): a 📳/📴 switch that turns vibration off in every game on this
  phone (`juegos-de-salon:no-vibration`); `ui.js` wraps `navigator.vibrate`, so games that call it directly obey too (C-4).
- **Games without signal**: the offline row, see [OFFLINE.md](OFFLINE.md).

## Another player's sheet (`player-peek.js`, `player-peek.css`)
A tap on a name opens that player's public sheet (flag `ranking-peek` for rankings; always from the profile and
La Copa's table, see [games/cup.md](games/cup.md)): flag and name, streak, games and cups won, since when they play,
their three most played games with their all-time place in each (never a play count), the overall place when in
the top 10 and the achievements public data can tell (`PUBLIC_BADGES`). Only public records are read. It opens
saying where it was tapped: a medal with their place, the table and tab, what the row counts with its unit
(`unitWord`, singular for exactly 1) and their all-time place there. Your own row says «(tú)» with a link to
your profile. The badges sit in a card and CERRAR stays at the bottom. The medal carries the place engraved, with a
light crossing it (2026-11-25). While their facts load, the sheet shows a skeleton of the same shape (chips, three
stats, games, badges) so it opens near its final height; when they arrive it eases to the new height and the
content fades in, unless the phone asks for reduced motion (2026-11-26, `settle`).

## Duels' badges
While the lab flag `rivals` is on, group ⚔️ Duelos holds: first duel, first win, 5 different rivals, 10 wins,
5 in a row, 3 in a row against the same rival, and beating a game's reigning champion in a duel (1st ever in
that game's table, read when the profile opens; the badge stays earned once seen). The duels themselves are
D-603 and `public/assets/js/duels*.js`.
