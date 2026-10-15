level: patch

- **Faster checks on pull requests:** the end-to-end tests now run only the scripts whose pages load what a PR changed; a change to one lab game runs one to three scripts instead of 61, and anything shared or unclear still runs them all (D-329).
