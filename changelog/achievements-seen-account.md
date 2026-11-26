level: patch

- **Achievements, recaps and challenges already told are not told again after signing back in.** Signing out cleared the marks of what was already celebrated (badges, secret achievements, the month's recap, a cup's summary, duel challenges), so signing in again announced old achievements as new. Those marks now belong to the phone and stay; `storage-keys.test.mjs` fails if a new "told" mark is listed as progress.
