# PR previews (D-429)

Each PR from this repo gets its own copy of the site on GitHub Pages, so the owner reviews a change
before it merges instead of merging a PR for every review round:

```
https://ellokojavi.github.io/juegos-de-salon-previews/<branch>/
```

`.github/workflows/preview.yml` builds the PR's site on every push (as `publish.yml` builds the real
one, plus `noindex` on every page and without the `CNAME`), puts it in the branch's folder of the
`juegos-de-salon-previews` repo with `.github/previews/update.sh`, and comments the link on the PR (one
comment, updated on each push). That repo publishes itself with its own Pages workflow, which
`update.sh` writes on every push. When the PR closes its folder is deleted, and every push also
deletes the folders of PRs no longer open: nothing piles up and nobody maintains it. The repo keeps a
single commit, with no history.

What a preview is and isn't:

- **It is the PR merged with `main`**, the same tree the tests see.
- **It uses the real Firebase**: a room opened there is a real room, as in the lab.
- **It is test traffic** (`envOf` in `stats.js`, `entorno` in `vigia.js`): its plays don't reach the
  panel, its scores stay on the phone (not in the rankings) and its push notifications use the test key.
- **The lab asks for a key there too**: the preview is another site, so each browser needs the lab
  link opened once on it (below). The key stays saved for every preview.
- **Not for forks**: GitHub gives them no secrets, so their PRs get no preview.
- **A preview never stops a PR**: without the secret, or if GitHub Pages fails, the `Preview` check
  says so and the PR merges and publishes as always.

## Setting it up, once

On the Mac mini, with `gh` signed in as the owner (about two minutes):

```bash
# 1. The previews repo, public (this repo is public too) and published by GitHub Actions
gh repo create ellokojavi/juegos-de-salon-previews --public \
  --description "Previews of juegosdesalon.cl pull requests (not the game: juegosdesalon.cl)"
gh api -X POST repos/ellokojavi/juegos-de-salon-previews/pages -f build_type=workflow

# 2. A key that can push only to that repo, and never expires
ssh-keygen -t ed25519 -N "" -C "juegos-de-salon previews" -f /tmp/previews_key
gh repo deploy-key add /tmp/previews_key.pub -R ellokojavi/juegos-de-salon-previews \
  --allow-write --title "juegos-de-salon preview.yml"
gh secret set PREVIEWS_DEPLOY_KEY -R ellokojavi/juegos-de-salon < /tmp/previews_key
rm /tmp/previews_key /tmp/previews_key.pub
```

If step 1's `gh api` answers with an error, the same setting is in the previews repo on GitHub:
Settings → Pages → Source: **GitHub Actions**.

3. **Try it:** on any open PR, push a commit (or Actions → Preview → the PR's last run → Re-run).
   The PR gets the 🔍 comment, and the link works about two minutes later.
4. **The lab, once per browser:** open `https://ellokojavi.github.io/juegos-de-salon-previews/?key=<your key>`
   (your lab link with `juegosdesalon.cl/labs/` replaced by that address). The previews' front page
   saves the key for every preview, also when no PR is open, and says ✅ when it did. The key is checked
   when a preview's lab opens; a removed key stops working there too.

## If something goes wrong

- **No comment on the PR:** the `Preview` check's log says why. "No PREVIEWS_DEPLOY_KEY secret" is
  step 2; `Permission denied (publickey)` means the deploy key was removed or lacks write access
  (repeat step 2).
- **The comment is there but the link gives 404:** the previews repo's Actions tab shows the Pages
  run; if Pages is not set to "GitHub Actions", that is step 1.
- **To turn previews off:** delete the `PREVIEWS_DEPLOY_KEY` secret. The PRs carry on without them.
