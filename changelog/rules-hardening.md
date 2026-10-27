level: patch

- **Rooms:** the database rules check each room's settings, seats and messages against what the games send, and a new room is accepted only with its cleanup note, so every room is swept when it expires (D-469).
- **Reports:** each pass of the 🐞 inbox upload creates at most 20 issues and warns when more are waiting (D-469).
