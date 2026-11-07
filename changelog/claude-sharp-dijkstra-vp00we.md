level: patch

- **Architecture boundary** (#1249 step 5): `tools/agents/architecture.test.mjs` fails when a game imports another game's folder, calls an external host or writes a storage key outside `juegos-de-salon:`; today's hits (40 imports, the Firebase SDK from its CDN, `uad-pts-cache` and `copa:prueba:uid`) are frozen in `docs/architecture-allowlist.json` with reasons, and Firebase paths are counted for step 7's manifests. `docs/ARCHITECTURE.md` explains it; registered as the `architecture` ratchet.
