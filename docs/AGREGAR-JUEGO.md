# Cómo agregar un juego nuevo

> Las reglas están en los [cánones](CANONES.md); esta página es solo el orden de los pasos y dónde
> está cada pieza. Lo que dice un canon no se repite aquí (D-213).

1. **La carpeta**: `public/<carpeta>/`, en inglés, con los archivos de C-2 (`index.html`,
   `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`, `game.js`). Las reglas van en
   `engine.js`, puras, con sus pruebas en `engine.test.mjs`. El `<head>` de `index.html` se copia
   de otro juego: trae el manifest, el ícono y el nombre del iPhone y `instalable.js` (C-2, D-221,
   D-222), and the preload of `nunito-latin.woff2` right before `base.css` (C-1's fonts line, #851;
   `public/assets/css/fonts-preload.test.mjs` fails without it).
2. **Los textos** en `LOCALES = { es, en, pt, de }` de `rules.js`: los cuatro idiomas se ofrecen a
   todos y la paridad los exige (C-3). El alemán respeta el glosario de [ALEMAN.md](ALEMAN.md).
   Las instrucciones siguen U-18.
3. **El registro** en `public/assets/js/games.js` (C-2): con eso aparecen el menú y el panel (C-16).
   Sus `tipos` (`words`, `logic`, `trivia` o `tabletop`, las claves de `TIPOS`) dicen con qué
   filtros de la portada aparece (D-214); lo demás que la portada le pide está en C-17.
   Su `id` va también en `POPULARIDAD`, el orden de la portada (D-255): sin partidas que contar,
   al final de los disponibles; si no está en la lista, igual queda al final.
   It also brings `nuevoDesde: 'YYYY-MM-DD'`, the day it reaches the home page: its card says
   "New" for two weeks (D-333).
   Si estrena un modo, se agrega a `MODES` y basta.
   **Its search keywords** (D-404): `keywords` in its own `games.js` entry (the manifest, #855; `search.js` reads them from there), in es,
   en, pt and de, at least three each: what the game is, what it is played with, what it is like
   (`dados`, `dice`, `dados`, `Würfel`). Without them `search.test.mjs` fails. Something new inside an
   existing card (a new kind of La Copa, a new mode) adds its words to that card's keywords.
   **If it plays another game's engine on purpose** (as 🔢 Picas y Fijas plays La Copa's number game),
   list those files in `reuses` in its `games.js` entry (#855): `tools/e2e/affected.mjs` builds `REUSES`
   from it, and `scope.test.mjs` fails otherwise.
4. **Los modos** que le tocan según C-5, con el transporte de C-7 (`create`, `join`, `send`,
   `onMessage`, `onPresence`, `leave`, `dispose`) y, si tiene sala, sus reglas en
   `firebase/database.rules.json`.
5. **La memoria**: la partida con `createSessionStore(GAME_ID)` y el nombre con
   `createNameStore(GAME_ID)`, de `public/assets/js/session.js` (C-6).
6. **Los módulos compartidos**, nunca uno propio: `handoff.js` para pasar el celular (C-9),
   `compartir.js` para todo lo que se comparte (C-7), `chat.js` en los modos de varios celulares
   (C-15), `sound.js` (C-4) y `arrastre.js` si hay arrastre (C-8). El tablero lleva
   `data-tablero`: así queda con el aire de todos hasta sus botones (D-309).
7. **La señal para el panel** (C-7, D-210): en los modos sin red, `trackStart({ game, mode, players })`
   al empezar y `trackFinish({ ganador, empate, detalle })` al terminar, de
   `public/assets/js/transport/stats.js`. Las salas las apunta el transporte. Y en su `index.html`,
   antes de las hojas de estilo, `<script src="../assets/js/vigia.js"></script>`, con `trackVisit()` al
   cargar: así el panel ve si la página no arranca o tira errores (D-251).
7b. **Rankings** (D-212): hoy anotan récords solo los juegos sueltos de La Copa (los que tienen
   `suelto` en `games.js`), y lo hace `public/cup/game.js` sin que el juego haga nada: su página
   sale de `public/cup/suelto/index.html`, que ya carga `ranking.css`. Un juego de salón no anota
   récords; si uno nuevo debería, es una decisión para el dueño, no algo que se agrega de pasada.
7c. **The result screen** (C-19): its exits come from `fin.js` for each context it can be played
   in (on its own, One a Day, La Copa), in C-19's order, and each fact is said once (the score, the
   time, the winner, the name); the long detail goes folded or after the exits, and Sign in is the
   one-line card. Before calling it done, look at it at 390×812 and 320 px with the screen's path.
8. **Las pruebas de punta a punta** (C-12): las pantallas del juego como entradas en
   `tools/e2e/paths.mjs`, su `tools/e2e/<carpeta>/languages.mjs` y los guiones de partida en
   `tools/e2e/<carpeta>/`. `node tools/e2e/look.mjs <juego> <pantalla> --width 320` para mirar.
8b. **Variants** (D-331): if a one-player game of La Copa can be played in more than one way, its
   variants go in `VARIANTES` (`public/cup/engine.js`, the default first), its engine's
   `generarDia` takes `variante`, and its `texts.js` names each one (`variantes`). The waiting room
   offers them standalone and the cup's admin picks one per day, without anything else to do.
9. **La especificación** en `docs/games/<carpeta>.md`, con la plantilla de C-13 (incluidas las
   excepciones a los cánones y el gancho `window.__…`), más requerimientos y decisiones.
10. **El README**, en inglés (C-13): la sección del juego, sus tomas en `docs/capturas.json` y
    después `python3 tools/release/readme.py screenshots <seccion>`, `update` y, ya releído,
    `seal`. Las capturas se miran juntas con `node tools/e2e/contact-sheet.mjs <seccion>`. La tarjeta
    social sale con `node tools/release/og.mjs cards` e `images`; `cards` also writes the game's JSON-LD
    (only once it is on the home page, not in the lab) and its line in `public/sitemap.xml` (#887).
11. **La lista de chequeo** del final de los cánones, entera. La parte que se puede contar la
    cuenta `node public/assets/js/games.test.mjs`: motor, tests, gancho y especificación (C-12).

La versión no la escribe quien hace el juego: su entrada va sin número en `changelog/<rama>.md`
(`node tools/release/changelog.mjs new minor`), el número se pone solo al fusionar y
`publish.yml` hace el resto (C-11, D-205, D-300). Un juego entra al laboratorio con documentación y
una revisión corta de usabilidad; el PR que lo saca lleva la pasada completa (D-304).
