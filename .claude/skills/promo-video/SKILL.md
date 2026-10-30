---
name: promo-video
description: The Juegos de Salón promo video (and any marketing asset). Use it whenever working on the video, whether a new version, a change to the existing one, its YouTube texts, its music or a new video from scratch, before touching anything. It brings the video's full memory, what the owner has already asked for, how it is remade and how to record the iteration.
---

# Promo video

The video and its memory live in `marketing/promo-video/` (D-178).

**Language (D-316):** notes written to `marketing/promo-video/README.md` and `marketing/registro.json` are in English; YouTube texts for the public stay in whatever language the owner chooses.

1. **Read `marketing/promo-video/README.md` in full before proposing or touching anything.** It has
   what the owner wants (their requests for each version), the current script, how it is made, the
   song, the known pitfalls and the history. Also read `marketing/README.md` (the rules
   for assets) and `marketing/registro.json`. A new video from scratch starts the same way: what the
   owner wants applies to all of them.
   **If the asset is a different one** (`marketing/share-tutorial/`, `marketing/caso-teaser/`…), its README is the
   memory to read in full; `promo-video/render.mjs --pagina <página>` renders any page that
   meets the same contract (`render(t)`, `DURATION`, `FPS`, `#stage`).
2. **Work as the README says:** `jugar.mjs` for the plays (fixed randomness, checked with
   `hoja.py`), `promo.html` for the script, `render.mjs --fotos … --tiempos …` to look at single
   frames of **both versions** (vertical and `--wide`) before rendering in full, and
   `construir.sh` for the final one. Serve the site on its own port if there are other sessions (D-135).
3. **Deliver both mp4s** to the owner and say what you checked and what you didn't (for example, the music
   cannot be listened to from here).
4. **To upload it to YouTube** (the owner's channel, @eljotairi) follow "Para YouTube" in the README:
   files under 10 MB, Claude in Chrome, everything filled in and set to *Unlisted*, and **the owner presses
   "Save"**. What was uploaded is recorded in "Lo subido", and the new Shorts go to the home page share sheet: each id in `SHORTS` (`public/assets/js/compartir-portada.js`, D-410).
5. **When closing the iteration, record it** before opening the PR:
   - a new entry in the README's "Historia", with what the owner asked for (in their own words when
     it matters) and what was done;
   - "Hoy", "Lo que el dueño quiere", "El guion" and "Trampas conocidas" up to date;
   - `marketing/registro.json` and the table in `marketing/README.md` with the new version;
   - the mp4s published as the release `promo-video-v<n>` with
     `node tools/release/video-release.mjs promo-video <n> marketing/promo-video/output/*.mp4`
     (D-494, docs/REPO-WEIGHT.md): `output/` is gitignored and `repo-weight.test.mjs` rejects any
     video a branch adds under `marketing/`; the URLs it prints go in the README, `marketing/README.md`
     and `registro.json`.
