level: minor

- **Panel: a 💬 Feedback section** (`#/feedback`). Every player message in full, from the start: who sent it, the game, whether they want a reply, and where it stands (new, open issue, in a PR, fixed, closed), with links to its issue and PRs. The `feedback-watch` job now also writes each report's issue and PRs to `feedbackEstado/` (owner-only) on every pass.
