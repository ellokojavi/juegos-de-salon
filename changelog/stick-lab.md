level: minor

- **🥷 Stick Ninja, a new game in the lab** (D-446), inspired by Stick Hero (Ketchapp): hold to stretch the stick, let go and it falls across the gap. Land its tip on the next pillar's flag for a perfect: +1, then +2, +3… for each one in a row, with a pulse of light from the flag, which stays gold. Tap while running to hang under the bridge and grab the ⭐, and flip back before the pillar. Achievements pop up as you go (your first flag, streaks, stars, a new best, 10, 25, 50 points…).
- Today's course is the same for everyone, and the result lists today's runs on the phone, so a group can pass it around and compare. In English only for now, at `/labs/stick/` with a lab key.
- **Tests:** a PR that adds a game's end-to-end script and measures it in `durations.json` no longer runs every script: that file only groups the scripts, as `docs/TEST-SCOPE.md` already said, but next to any other change it used to count as the e2e tools changing.
