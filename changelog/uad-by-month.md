level: patch

- **Uno al día's history is also indexed by day** (D-475): each day played goes to `unoAlDiaDias/<n>/<jid>` too, so the panel, the nightly points rebuild, the weekly report and the ideas agent read only the days they need instead of everyone's whole history, once `tools/firebase/uad-index.mjs --apply` has copied the older days. Nothing changes for players.
