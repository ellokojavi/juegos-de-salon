level: patch

- **☁️ The offline cloud, only when it asks for something** (in Labs, flag `cloud-quiet`): on the home page's bar the cloud shows while the phone stores the games or when some are missing, and leaves once it is ready; the profile's ⚙️ always has a «Juegos sin señal» row with the state, which opens the same sheet. Its four states are tried from the «T» tab, with no network cut.
- **Tests**: the end-to-end groups may take 420 s each, up from 400 (D-611): main sat at the alarm with 1 s of headroom, and no new script could get in.
- **☁️ The cloud comes in as softly as it leaves**: its slot opens first, then the cloud grows from its centre, a little past its size and back. And the profile's «Juegos sin señal» row no longer stays on «Preparando los juegos…» after the home page's cloud has gone: while it says loading it reads again every 3 s, and an older read never draws over a newer one.
