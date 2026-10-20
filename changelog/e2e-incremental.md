level: patch

- **A push to a PR tests only what changed since it last passed** (D-392). A fix, a changelog entry or the agents' commits after a green run no longer rerun the whole PR's end-to-end scope; the first push, or one after a red run, still tests it all.
