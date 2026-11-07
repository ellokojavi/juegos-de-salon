level: patch

- **📴 Offline mode, step 2 of 8** (D-538), in the lab (🧪 `offline`): with the flag on, the phone stores the games that can be played without signal (about 4 MB, generated at each publish into `precache.json`) and opens them in airplane mode. Pages still come from the network first, so nobody gets stuck on an old version; with the flag off nothing is cached, as before.
