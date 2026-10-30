level: patch

- **Repo:** retaking the README screenshots keeps the committed PNG when fewer than 0.5 % of its pixels moved (antialiasing, a clock), so documentation rounds stop re-saving near-identical images into git history (D-494, #1037).
- **Tests:** a tool named only in an end-to-end script's comment no longer makes a PR run every end-to-end job.
