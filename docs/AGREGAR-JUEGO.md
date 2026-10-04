# Cómo agregar un juego nuevo

> Las reglas están en los [cánones](CANONES.md); esta página es solo el orden de los pasos y dónde
> está cada pieza. Lo que dice un canon no se repite aquí (D-213).

1. **La carpeta**: `public/<carpeta>/`, en inglés, con los archivos de C-2 (`index.html`,
   `style.css`, `rules.js`, `engine.js`, `engine.test.mjs`, `game.js`). Las reglas van en
   `engine.js`, puras, con sus pruebas en `engine.test.mjs`.
2. **Los textos** en `LOCALES = { es, en, pt, de }` de `rules.js`: los cuatro idiomas se ofrecen a
   todos y la paridad los exige (C-3). El alemán respeta el glosario de [ALEMAN.md](ALEMAN.md).
   Las instrucciones siguen U-18.
3. **El registro** en `public/assets/js/games.js` (C-2): con eso aparecen el menú y el panel (C-16).
   Si estrena un modo, se agrega a `MODES` y basta.
4. **Los modos** que le tocan según C-5, con el transporte de C-7 (`create`, `join`, `send`,
   `onMessage`, `onPresence`, `leave`, `dispose`) y, si tiene sala, sus reglas en
   `firebase/database.rules.json`.
5. **La memoria**: la partida con `createSessionStore(GAME_ID)` y el nombre con
   `createNameStore(GAME_ID)`, de `public/assets/js/session.js` (C-6).
6. **Los módulos compartidos**, nunca uno propio: `handoff.js` para pasar el celular (C-9),
   `compartir.js` para todo lo que se comparte (C-7), `chat.js` en los modos de varios celulares
   (C-15), `sound.js` (C-4) y `arrastre.js` si hay arrastre (C-8).
7. **La señal para el panel** (C-7, D-210): en los modos sin red, `trackStart({ game, mode, players })`
   al empezar y `trackFinish({ ganador, empate, detalle })` al terminar, de
   `public/assets/js/transport/stats.js`. Las salas las apunta el transporte.
8. **Las pruebas de punta a punta** (C-12): las pantallas del juego como entradas en
   `tools/e2e/caminos.mjs`, su `tools/e2e/<carpeta>/idiomas.mjs` y los guiones de partida en
   `tools/e2e/<carpeta>/`. `node tools/e2e/mirar.mjs <juego> <pantalla> --ancho 320` para mirar.
9. **La especificación** en `docs/games/<carpeta>.md`, con la plantilla de C-13 (incluidas las
   excepciones a los cánones y el gancho `window.__…`), más requerimientos y decisiones.
10. **El README**, en inglés (C-13): la sección del juego, sus tomas en `docs/capturas.json` y
    después `python3 tools/release/readme.py capturas <seccion>`, `actualizar` y, ya releído,
    `sellar`. Las capturas se miran juntas con `node tools/e2e/contacto.mjs <seccion>`. La tarjeta
    social sale con `node tools/release/og.mjs tarjetas` e `imagenes`.
11. **La lista de chequeo** del final de los cánones, entera.

La versión y la entrada del `CHANGELOG.md` no las escribe quien hace el juego: se ponen al
fusionar, y `publicar.yml` hace el resto (C-11, D-205).
