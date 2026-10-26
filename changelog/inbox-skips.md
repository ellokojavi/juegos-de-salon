level: patch

- **Skipped emails to hola@ no longer vanish** (D-452). The processes round lists every email the support agent skipped, with when, the masked sender and why, and the owner can read their text with `node tools/agents/inbox.mjs skipped`; it stays on the owner's machine, never on GitHub. Nothing changes for players.
