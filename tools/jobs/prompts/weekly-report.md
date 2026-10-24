# The weekly report, as the scheduled task runs it (D-352, D-440)

The scheduled task **Juegos de Salón · weekly report** (`weekly-report` in `tools/jobs/jobs.json`)
runs on the owner's Mac mini every Sunday at 8:00 Pacific. Its prompt only says to read this file
from `origin/main` and follow it.

1. In the repo's main folder on the Mac mini (`~/Documents/Claude/Projects/juegos-de-salon`):
   `git fetch -q origin main`, and if the folder is clean and on `main`, `git merge --ff-only origin/main`.
   Never edit anything in it (D-135).
2. **Once a week, not twice.** The report for the week that ended on Saturday is
   `~/Documents/Juegos de Salón/Weekly reports/juegos-de-salon-weekly-<that Saturday>.pdf`. If it
   already exists, this week's report already went out: stop and say so in one line.
3. `node tools/reports/weekly.mjs --send`. It writes the PDF and emails it to the owner.
4. Report in two lines: the file written and whether the email went out. If it failed (the Firebase
   key, the mail account, Chrome), say which step and its error.
