level: patch

- **Panel timeline: where a game came from.** An offline game that finishes now says whether it was opened from its card on the home page (👆), the 🎲 Random game dice or One a Day (📅); La Copa days already said so. Recorded as `o` on `live/<id>` (new Firebase rule).
- **A red PR the owner asked for in a session is approved by that session** (D-540): it ticks the owner-approval box itself; what agents produce on their own still waits for the owner.
- **A tick no longer fails while end-to-end is still running**: the approval waits until the `end-to-end` check exists before watching it.
