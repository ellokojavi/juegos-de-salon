level: patch

- **A lab 🚀 / 📦 PR with red checks no longer waits forever**: the Mac mini's `lab-publish-watch` treated only a conflict with `main` as stuck, so #1099 sat for hours with `tests` and `end-to-end` red. Red checks that last 15 minutes now send the same fixing session (merge `main`, rerun what was flaky, fix what the branch broke), at most twice per request, and the card fails with Volver a pedir if it does not take (D-486).
