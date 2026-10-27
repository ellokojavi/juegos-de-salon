# Paths then and now

The paths cited by decisions before D-192 are those of that time; this table says where they live
today. The old page paths still work as bridge pages. (Moved here from the head of the old
DECISIONES.md, D-394.)

| Then | Today |
|---|---|
| `index.html`, `CNAME`, `en/`, `pt/`, `labs/`, `panel/` | the same inside `public/` (D-192) |
| `assets/` | `public/assets/` |
| `assets/img/tierra-2004-09…` (JPEG) | `public/cup/games/where/earth-2004-09/` (WebP, D-460) |
| `ahorcado/` | `public/hangman/` |
| `batalla-naval/` | `public/battleship/` |
| `copa/` | `public/cup/` |
| `copa/juegos/<juego>.js` and `ui-<juego>.js` | `public/cup/games/<carpeta>/` (`engine.js`, `ui.js`) |
| `cuarto-rey/` | `public/fourth-king/` |
| `dudo/` | `public/liars-dice/` |
| `julepe/` | `public/julep/` |
| `linea-de-tiempo/` | `public/timeline/` |
| `toque-y-fama/` | `public/bulls-and-cows/` |
| `/copa/?practica=<id>`, `/minijuegos/?<id>`, `/minijuegos/<id>/`, `/minigames/<slug>/` | `/<slug>/` at the root (D-198): `anio` → `year`, `conexiones` → `connections`, `desenredo` → `untangle`, `donde` → `where`, `letras` → `word`, `reinas` → `queens`, `tango`, `zip` |
| `minijuegos/index.html` (the template) | `public/cup/suelto/index.html` |
| `docs/juegos/<id>.md` | `docs/games/<carpeta>.md` (`toque-y-fama-factibilidad.md` → `bulls-and-cows-factibilidad.md`) |
| `tools/og.mjs`, `tools/og/`, `tools/readme.py`, `tools/readme.test.py`, `tools/hechos.mjs`, `tools/set-version.py` | `tools/release/` |
| `tools/reglas.mjs`, `tools/reportes.mjs`, `tools/en-curso.mjs`, `tools/firebase-admin.mjs` | `tools/firebase/` |
| `tools/dilemas.mjs`, `tools/documentar.mjs`, `tools/documentar.test.mjs`, `tools/marketing.mjs` | `tools/agents/` |
| `tools/mapa.mjs`, `tools/flota.py` | `tools/generators/` |
| `tools/e2e/<juego>-<guion>.mjs` | `tools/e2e/<carpeta>/<guion>.mjs` (`linea-de-tiempo-veredicto.mjs` → `timeline/veredicto.mjs`; `copa.mjs` → `cup/torneo.mjs`) |
| `marketing/video-promo/` | `marketing/promo-video/` |
| `.claude/skills/video-promo/` | `.claude/skills/promo-video/` |
| `tools/agents/procesos.mjs`, `tools/e2e/caminos.mjs`, `.github/workflows/publicar.yml` and the rest of the workshop's Spanish names | their English names (D-316: `processes.mjs`, `paths.mjs`, `publish.yml`, `timeline/verdict.mjs`, `cup/tournament.mjs`…) |
| `lab/`, `tools/lab.py`, `tools/diccionario/`, `tools/diag/` | no longer exist (D-67, D-65, D-77) |

| Then | Now | What it is |
|---|---|---|
| `?sala=ABCD` | `?room=ABCD` | the invitation to a room |
| `?semilla=K7Q2X` | `?seed=K7Q2X` | the content of a standalone game |
| `/cup/?practica=reinas` | `/cup/?practice=queens` | a standalone game from the lab |
| `?prueba` | `?test` | local storage, for the scripts |
| `?tres` | `?three` | offers the 3-day La Copa |
| `?hoy` | `?today` | Uno al día |
| `&dia=3` (La Copa), `?dia=AAAA-MM-DD` (El caso) | `&day=3`, `?day=AAAA-MM-DD` | the day a notification opens, that date's case |
| `&silenciar` | `&mute` | the notification button that mutes the cup |
| `&aviso=plazo` | `&notif=deadline` | which notification opened the page |
| `?de=link` | `?from=link` | the mark on what was shared |
| `&zipSeg=8` | `&timer=8` | only in tests: the clock of Zip and Desenredo |
| `?uad=boton` · `tarjeta` · `no` | `?daily=button` · `card` · `off` | where Uno al día goes on the home page |
| `&demo=nueva`, `invitado`, `espera`, `sin-jugar`, `jugador`, `podio`, `llena` | `&demo=new`, `guest`, `waiting`, `not-started`, `player`, `podium`, `full` | La Copa's test scenes |
| `&aviso=dia`, `plazo`, `fin`, `insc`, `copas`, `prueba`, `uaddia`, `uadracha`, `uadsemana`, `uadadios` | `&notif=day`, `deadline`, `end`, `signup`, `cups`, `test`, `dailyday`, `dailystreak`, `dailyweek`, `dailybye` | the notification types |
| `/cup/suelto/?linea&hoy`, `?practica=<id>` | `/cup/suelto/?timeline-flash&today`, `?practice=<carpeta>` | the game, by its folder name; those without a page: `timeline-flash`, `number` |
| `#/ahora`, `#/torneo/OFICI`, `#/juegos`, `#/juego/ahorcado`, `#/sala/ABCD`, `#/trafico`, `#/audiencia`, `#/salud` | `#/now`, `#/cup/OFICI`, `#/games`, `#/game/hangman`, `#/room/ABCD`, `#/traffic`, `#/audience`, `#/health` | the panel's addresses |

