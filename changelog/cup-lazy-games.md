level: patch

- **La Copa and its games load half as much**: each page now downloads only the game being played, with its own styles, instead of all seventeen Cup games and every Timeline deck. `/zip/` goes from 140 requests and 2.5 MB to 67 and 1.2 MB, `/cup/` from 141 and 2.5 MB to 66 and 1.2 MB, `/where/` from 2.7 MB to 1.6 MB. Same games, same look (D-468).
