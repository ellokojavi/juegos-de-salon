level: patch

- **Rooms no longer leak:** a new room and its note in the cleanup index are now one write, so a room created on a bad connection (the create timed out and the player tried again) is still deleted once it expires; before, it could stay in the database forever. New `tools/firebase/unnoted-rooms.mjs` finds the rooms that leaked before this, and the rules let a code be noted again the same day (D-321).
