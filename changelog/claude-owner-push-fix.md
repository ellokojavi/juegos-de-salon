level: patch

- **The panel's 🔔 turns on**: it was refused (PERMISSION_DENIED) when the phone's clock ran a little
  ahead of Firebase's, since the rules ask the record's time to be no later than now; the time is now
  the server's.
