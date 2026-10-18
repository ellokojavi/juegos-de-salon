level: patch

- **Every splash campaign gets a usability review before it goes live, and is kept in `marketing/splash/`** (D-355). `covers.mjs check` flags a PR that turns on or changes a campaign, each campaign has a screen for `look.mjs` and the language tests, and its folder keeps a README and screenshots in the four languages.
- **The splash says "¡Upa, papá! Tres juegos nuevos" in Spanish**, and opening it no longer draws a frame around "Ahora no": the focus goes to the window (the keyboard still sees the ring).
