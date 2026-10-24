level: patch

- **The agents' daily round can no longer stop unnoticed** (D-440): it now runs as a scheduled task the owner can see from the phone, its instructions live in the repo, and if a day goes by without it GitHub opens a "Processes round missed" issue that closes itself when the round catches up. The ideas agent waits for answers to its last questions before proposing more. Nothing changes for players.
