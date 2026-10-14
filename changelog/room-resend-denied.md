level: patch

- **Rooms after a dropped connection:** when a phone locks or loses signal right after a move, Firebase sends that move again on reconnecting, and the room turned the repeat away because it already had it. The game never noticed, but the page counted it as a failure, and it showed up on the owner's Health panel as a Batalla Naval "PERMISSION_DENIED". Now the room transport recognizes that repeat and stops counting it, and the presence writes no longer leave errors unhandled either (D-320).
