level: patch

- **Uno al día, in the lab: the ranking shows sooner.** With a lab key, /today/ draws the month's ranking once and keeps it while the page refreshes, shows the list seen last today while the new one arrives instead of "Cargando…", reads the table and last month's champion together, and reuses the read the page just made (D-436, card `#seccion-uad-ranking-rapido`).
- For everyone: the home page no longer draws its last-visit copy (D-435) from a link with `?daily=` (Uno al día next to the die), whose layout the copy does not have, nor saves one from it.
- For everyone: with `?daily=button`, the home page draws Uno al día's button next to the die again (an error had left it out).
