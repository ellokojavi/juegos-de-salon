level: patch

- **Rooms and Cup podiums are now the night's job** (D-499, #854): phones no longer sweep expired rooms; a nightly job deletes them from every closed cleanup bucket, however old, plus the rooms no bucket names (`room-sweep.mjs`). A finished Cup's podium is saved only by the nightly `cup-podiums` job the night after its close; the app no longer writes it, and the rules refuse it. Nothing changes on screen.
