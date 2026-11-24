level: patch

- **The merge queue labels the PR it updates again.** #1860's new label function was called `mark`, a name the step loop already used for a local, so every real update crashed before labelling the PR and the queue lost track of it. It is now `labelInFlight`, and a new test runs the whole step against a fake `gh`.
