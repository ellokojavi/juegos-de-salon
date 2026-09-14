# Cómo agregar un juego nuevo

> Antes de empezar, leer los [cánones y estándares](CANONES.md): son obligatorios para todos los juegos.

1. **Crear la carpeta** `/<id-del-juego>/` (en minúsculas, con guiones), con:
   - `index.html`: incluye `../assets/css/base.css` y su propio `style.css`. Reutiliza las clases `.app`, `.topbar`, `.panel`, `.btn`, `.display`, etc.
   - `rules.js`: datos del juego (reglas, textos, listas). Sin lógica de UI. Exportar `LOCALES = { es: {...}, en: {...}, pt: {...} }` con todos los textos por idioma, con las mismas claves en los tres.
   - `game.js`: máquina de estados y render. Importa helpers desde `../assets/js/ui.js`.
   - `style.css`: solo lo específico del juego.
2. **Registrarlo** en `assets/js/games.js` agregando una entrada con `id`, `emoji`, `name` y `tagline` (objetos `{ es, en, pt }`), `players`, `duration`, `path` y `available: true`. El menú se genera solo.
3. **Seguir el flujo estándar** de pantallas: `intro` (dinámica y materiales) → `setup` (jugadores) → `play` → `end`. Guardar el estado en `localStorage` con la clave `juegos-de-salon:<id>:game` y reutilizar `juegos-de-salon:players` para los nombres.
4. **Documentar**: crear `docs/juegos/<id>.md` con la especificación, agregar requerimientos con prefijo propio en `docs/REQUERIMIENTOS.md` y registrar decisiones nuevas en `docs/DECISIONES.md`.
5. **Si el juego usa varios celulares**, seguir el patrón de Toque y Fama: estado derivado de una lista de mensajes, interfaz `Transport` (`create`, `join`, `send`, `onMessage`, `onPresence`, `leave`) con implementaciones `local` y `firebase`, y reglas de seguridad en `firebase/database.rules.json` (campo `game` en la sala para separar juegos).
6. **Registrar sus módulos JS** en la lista `MODULES` de `tools/set-version.py` para que entren en el import map de versiones.
7. **Dejar la señal de uso para el panel** (D-44): al empezar una partida sin red, llamar `trackStart({ game, mode, players })` de `assets/js/transport/stats.js` (no al retomar). Las salas de dos celulares las apunta el transporte solo. El panel no hay que tocarlo: el juego nuevo aparece ahí con su emoji y su nombre en cuanto manda la primera señal (C-16). Si el juego estrena un **modo** que no está en `MODES` de `assets/js/games.js`, se agrega esa línea y basta. Ver `docs/PANEL.md`.
8. **Sumarlo al README**, que es la única parte del proyecto que va en inglés (C-13, D-78): la
   sección del juego con su prosa, las tomas nuevas en el guion de `tools/e2e/` y sus entradas en
   `docs/capturas.json`, con el `pie` en inglés. Después, `python3 tools/readme.py capturas <seccion>`
   y `actualizar`. La tabla de juegos y los modos se generan solos desde el `en` de `rules.js`.
9. **Probar en el celular** desde la URL publicada y actualizar `CHANGELOG.md`.

Publicar: antes de cada commit que se publique, correr `python3 tools/set-version.py X.Y.Z` (nueva versión) para que el navegador no mezcle archivos en caché.

Módulos compartidos: `assets/js/handoff.js` (pásale el celular, pantalla tapada), `assets/js/transport/` (local y Firebase), `assets/js/sound.js`, `assets/js/i18n.js`.

Convenciones:
- Idioma: leer `getLang()` de `assets/js/i18n.js`, marcar textos fijos del HTML con `data-i18n="clave"` (o `data-i18n-html`) y llamar `applyStatic(LOCALES[lang].ui)` al iniciar. Incluir `langToggle()` en la intro del juego.
- Textos en español chileno informal, tuteo, sin groserías fuertes. Inglés y portugués de Brasil adaptados, no calcados (C-3, D-48).
- Botones de acción principal con `.btn` (rosado) o `.btn--yellow`; secundarios con `.btn--ghost`.
- Usar `vibrate()` en momentos clave y `confetti()` en cierres.
