level: patch

- **Uno al día's card on the home page arrives together with La Copa**: the empty 📅 card no longer shows for a moment before turning into the real one (320 ms on a slow 4G). Two modules it imports (`fin.js`, `daily-points.js`) and the traffic module with its two were fetched one after another; now they are preloaded with the page, and `home-preload.test.mjs` fails if one goes missing again.
- Counting the visit (`trackVisit`, D-208) no longer holds up the home page's list: it loads on its own.
