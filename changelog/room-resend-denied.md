level: patch

- **Rooms after a dropped connection:** when a phone locks or loses signal right after a move, Firebase sends that move again on reconnecting, and the room turned the repeat away because it already had it. The game never noticed, but the page counted it as a failure, and it showed up on the owner's Health panel as a Batalla Naval "PERMISSION_DENIED". Now that repeat is no longer counted as a failure (a move that really didn't get through still is), and the presence writes no longer leave errors unhandled either (D-320).
