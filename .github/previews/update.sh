#!/usr/bin/env bash
# Updates the previews repo (D-429): puts a PR's site in its folder, deletes the folders of PRs that
# are no longer open, and pushes it all as a single commit without history (the repo doesn't grow).
# Two PRs may push at once: the push only goes through if nobody pushed since the clone
# (--force-with-lease); otherwise it clones again and retries.
#
#   update.sh <folder> <site>   # a PR's preview; `update.sh - -` only cleans up
# Env: PREVIEWS_REPO (owner/name), SOURCE_REPO (this repo, to list open PRs), GH_TOKEN, and
# GIT_SSH_COMMAND with the deploy key (PREVIEWS_URL replaces the address, to try it on a local repo).
set -euo pipefail
folder=$1; site=$2
here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
slug() { tr 'A-Z' 'a-z' | sed 's/[^a-z0-9-]/-/g'; }
open=$(gh pr list -R "$SOURCE_REPO" --state open --limit 300 --json headRefName --jq '.[].headRefName' | slug)
[ "$site" = - ] || site=$(cd "$site" && pwd)

for attempt in 1 2 3 4 5; do
  rm -rf "$work/repo"
  git clone -q --depth 1 "${PREVIEWS_URL:-git@github.com:$PREVIEWS_REPO.git}" "$work/repo" 2>/dev/null
  cd "$work/repo"
  lease=$(git rev-parse -q --verify HEAD || true)
  for d in */; do
    d=${d%/}
    [ "$d" = '*' ] && continue
    grep -qx -- "$d" <<<"$open" || { echo "deleted: $d (its PR is not open)"; rm -rf "$d"; }
  done
  if [ "$folder" != - ]; then rm -rf "$folder"; cp -R "$site" "$folder"; fi
  cp "$here/index.html" index.html
  mkdir -p .github/workflows && cp "$here/pages.yml" .github/workflows/pages.yml
  git config user.name 'github-actions[bot]'
  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
  git checkout -q --orphan next
  git add -A
  git commit -qm "Previews: ${folder/#-/cleanup}" --allow-empty
  if git push -q --force-with-lease="main:$lease" origin next:main; then echo "pushed (attempt $attempt)"; exit 0; fi
  cd "$work"; sleep $((attempt * 5))
done
echo "::error::the previews repo kept changing under this push"; exit 1
