level: patch

- **Offline mode goes back online on its own** (D-538): out of airplane mode, the first check often failed because the phone had no route yet, and the next one waited 15 seconds and then needed a second one, so the screen stayed in Candlelight. Now `connection.js` retries quickly (2, 4 and 8 seconds) while the browser says it is online, and checks again when the page comes back to the front (switched from the phone's settings, where the `online` event may never reach it).
