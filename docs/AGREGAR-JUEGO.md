# Cómo agregar un juego nuevo

> Antes de empezar, leer los [cánones y estándares](CANONES.md): son obligatorios para todos los juegos.

1. **Crear la carpeta** `public/<carpeta>/`, con el nombre del juego en inglés, en minúsculas y con guiones (`public/hangman/`): es su URL (D-192). Con:
   - `index.html`: incluye `../assets/css/base.css` y su propio `style.css`. Reutiliza las clases `.app`, `.topbar`, `.panel`, `.btn`, `.display`, etc.
   - `rules.js`: datos del juego (reglas, textos, listas). Sin lógica de UI. Exportar `LOCALES = { es: {...}, en: {...}, pt: {...} }` con todos los textos por idioma, con las mismas claves en los tres.
   - `game.js`: máquina de estados y render. Importa helpers desde `../assets/js/ui.js`.
   - `style.css`: solo lo específico del juego.
2. **Registrarlo** en `public/assets/js/games.js` agregando una entrada con `id`, `emoji`, `name` y `tagline` (objetos `{ es, en, pt }`), `players`, `duration`, `path` (la carpeta, `'hangman/'`), `tipos` (con qué filtros de la portada aparece: `words`, `logic`, `trivia` o `tabletop`, las claves de `TIPOS`, D-214) y `available: true`. El `id` es un dato que guardan las salas y el panel y no cambia nunca; para un juego nuevo puede ser el mismo nombre de la carpeta (D-192). Si tiene modo de dos celulares, también `jugadas`: los tipos de mensaje que son una jugada de una persona (un disparo, un intento), para que el panel no cuente como jugadas las respuestas automáticas ni el chat (D-138). El menú se genera solo.
3. **Seguir el flujo estándar** de pantallas: `intro` (dinámica y materiales) → `setup` (jugadores) → `play` → `end`. Guardar el estado en `localStorage` con la clave `juegos-de-salon:<id>:game` y reutilizar `juegos-de-salon:players` para los nombres.
4. **Documentar**: crear `docs/games/<carpeta>.md` con la especificación, agregar requerimientos con prefijo propio en `docs/REQUERIMIENTOS.md` y registrar decisiones nuevas en `docs/DECISIONES.md`.
5. **Si el juego usa varios celulares**, seguir el patrón de Toque y Fama: estado derivado de una lista de mensajes, interfaz `Transport` (`create`, `join`, `send`, `onMessage`, `onPresence`, `leave`) con implementaciones `local` y `firebase`, y reglas de seguridad en `firebase/database.rules.json` (campo `game` en la sala para separar juegos).
6. **Sus módulos JS entran solos** al import map de versiones: al publicar, `tools/release/set-version.py` recorre el sitio (D-192, D-205).
7. **Dejar la señal de uso para el panel** (D-44): al empezar una partida sin red, llamar `trackStart({ game, mode, players })` de `public/assets/js/transport/stats.js` (no al retomar). Las salas de dos celulares las apunta el transporte solo. El panel no hay que tocarlo: el juego nuevo aparece ahí con su emoji y su nombre en cuanto manda la primera señal (C-16). Si el juego estrena un **modo** que no está en `MODES` de `public/assets/js/games.js`, se agrega esa línea y basta. Ver `docs/PANEL.md`.
7b. **Rankings** (D-212): hoy anotan récords solo los juegos sueltos de La Copa (los que tienen
   `suelto` en `games.js`), y lo hace `public/cup/game.js` sin que el juego haga nada: su página
   sale de `public/cup/suelto/index.html`, que ya carga `ranking.css`. Un juego de salón no anota
   récords; si uno nuevo debería, es una decisión para el dueño, no algo que se agrega de pasada.
8. **Sumarlo al README**, que es la única parte del proyecto que va en inglés (C-13, D-78): la
   sección del juego con su prosa, las tomas nuevas en el guion de `tools/e2e/` y sus entradas en
   `docs/capturas.json`, con el `pie` en inglés. Después, `python3 tools/release/readme.py capturas <seccion>`
   y `actualizar`. La tabla de juegos y los modos se generan solos desde el `en` de `rules.js`.
9. **Probar en el celular** desde la URL publicada y actualizar `CHANGELOG.md`.

Publicar: al fusionar, la entrada de la versión en `CHANGELOG.md`. `publicar.yml` la estampa en lo que publica para que el navegador no mezcle archivos en caché (D-205).

Módulos compartidos: `public/assets/js/handoff.js` (pásale el celular, pantalla tapada), `public/assets/js/transport/` (local y Firebase), `public/assets/js/sound.js`, `public/assets/js/i18n.js`.

Convenciones:
- Idioma: leer `getLang()` de `public/assets/js/i18n.js`, marcar textos fijos del HTML con `data-i18n="clave"` (o `data-i18n-html`) y llamar `applyStatic(LOCALES[lang].ui)` al iniciar. Incluir `langToggle()` en la intro del juego.
- Textos en español chileno informal, tuteo, sin groserías fuertes. Inglés, portugués de Brasil y alemán adaptados, no calcados (C-3, D-48). El alemán está en el laboratorio, pero la prueba de paridad lo pide igual, con el glosario de [ALEMAN.md](ALEMAN.md) (D-191).
- Botones de acción principal con `.btn` (rosado) o `.btn--yellow`; secundarios con `.btn--ghost`.
- Usar `vibrate()` en momentos clave y `confetti()` en cierres.
