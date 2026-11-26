level: patch

- **No more endless waiting on La Copa and Uno al día**: on a stuck connection, La Copa's «…» gives up after 10 s, and a page whose scripts never arrived stops staying blank. Either way the player sees «No pudimos…» with a button to try again (`stall-guard.js`). While waiting, a spinner turns under the title with a fun line that changes every 2 s («Barajando las cartas…», «Buscando el dado bajo el sillón…»), instead of a bare «…» or an empty page.
