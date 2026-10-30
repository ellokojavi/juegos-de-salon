# Repo weight (D-494, #856)

The git pack was 887 MB on 2026-10-27, three weeks in. This is the plan to stop it growing and to move
the media that weighs most out of the repo. **History is not rewritten** (until #1038): `git filter-repo` would break
every open worktree and PR, and only the owner can approve it (a `processes` decision, once the steps
below are done and no PR is open).

## 1. The guard (done, D-494)

`tools/agents/repo-weight.test.mjs`, in the `tests` check: no tracked file over 5 MB, no Chrome profile
file (`Default/`, `Local State`, `*.tflite`…), and the same for every blob the branch's commits add, so
a file added and then deleted in a PR still fails. Its `GRANDFATHERED` list is empty since step 2 and
may only shrink. Since step 2 it also rejects any video (`.mp4`, `.mov`, `.webm`) a branch adds under
`marketing/`, whatever its size.

## 2. Promo video → GitHub Releases (done, #1036)

`marketing/promo-video/output/*.mp4` (~22 MB each, replaced on every version, 335 MB of history).

1. Each video version is a release `promo-video-v<n>` with the MP4s as assets
   (`gh release create promo-video-v<n> output/*.mp4 --notes …`); YouTube keeps being the public copy.
2. `construir.sh` writes the MP4s to a scratch folder outside git (or `output/` in `.gitignore`), and
   the step that publishes uploads them to the release.
3. `marketing/promo-video/README.md` (its "Archivos" row and the note that Pages serves the MP4s),
   `marketing/README.md` and `marketing/registro.json` link the release instead of `output/`.
4. `git rm` the three MP4s and empty `GRANDFATHERED`. Thumbnails (`miniatura-*.jpg`) stay: small.

Every future marketing video takes the same path: git ignores `marketing/**/*.mp4|mov|webm` and
`tools/release/video-release.mjs <folder> <version> <file>...` makes the release `<folder>-v<n>` and
prints the URLs. The small clips already in git (`share-tutorial`, `caso-teaser`, ~2 MB) stay; a new
version of one goes to a release too.

## 3. README screenshots: re-commit only real changes (done for 1, #1037)

`docs/screenshots/` is 6 MB today but changed 778 times (268 MB of history): a documentation round
re-saves 76–95 PNGs whose pixels barely moved (antialiasing, a clock, a version number).

1. The screenshot tool (the `readme-and-cards` skill's capture) compares each new PNG with the
   committed one and keeps the old file when fewer than ~0.5 % of pixels differ (`NOISE` and
   `barely_changed` in `tools/release/readme.py`, tested in `readme.test.py`). Done.
2. If that is not enough, the PNGs move to an orphan branch (`screenshots`) that the README links via
   `raw.githubusercontent.com`; then `main` stops carrying them at all.

## 4. Later: generated files out of git

The decisions index, `facts.json` and the bridge pages could be generated in `publish.yml` instead
of committed. Not before the steps above: each needs its own design (the `tests` check reads them).
