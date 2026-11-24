level: patch

- **Profile ⚙️, «Juegos sin señal»**: the row no longer stays on «Preparando los juegos…» while the phone already keeps every game. It looked for what the service worker had saved under the profile's own address instead of the site's root, so it never found it; it now reads the same place the home page does. La Copa's upload with the app closed had the same slip from the Cup's pages and is fixed too.
