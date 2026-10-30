level: patch

- Repo: the promo video's MP4s leave git for a GitHub release (`promo-video-v8`), and every future marketing video goes there too: git ignores them, `tools/release/video-release.mjs` publishes them and `repo-weight.test.mjs` rejects any video a branch adds under `marketing/` (#1036, D-494).
