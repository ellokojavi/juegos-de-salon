level: patch

- **Rankings load lighter**: the tables at the end of a game, on /today/, in /records/ and the home page's Uno al día place are read without opening a live connection to the server, which now opens only when a score is saved or a player signs in. Pages load about 110 kB less, and many more people can play at once on the free plan (D-470).
