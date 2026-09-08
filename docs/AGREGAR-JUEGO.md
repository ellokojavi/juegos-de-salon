# Cómo agregar un juego nuevo

1. **Crear la carpeta** `/<id-del-juego>/` (en minúsculas, con guiones), con:
   - `index.html`: incluye `../assets/css/base.css` y su propio `style.css`. Reutiliza las clases `.app`, `.topbar`, `.panel`, `.btn`, `.display`, etc.
   - `rules.js`: datos del juego (reglas, textos, listas). Sin lógica de UI.
   - `game.js`: máquina de estados y render. Importa helpers desde `../assets/js/ui.js`.
   - `style.css`: solo lo específico del juego.
2. **Registrarlo** en `assets/js/games.js` agregando una entrada con `id`, `name`, `emoji`, `tagline`, `players`, `duration`, `path` y `available: true`. El menú se genera solo.
3. **Seguir el flujo estándar** de pantallas: `intro` (dinámica y materiales) → `setup` (jugadores) → `play` → `end`. Guardar el estado en `localStorage` con la clave `juegos-de-salon:<id>:game` y reutilizar `juegos-de-salon:players` para los nombres.
4. **Documentar**: crear `docs/juegos/<id>.md` con la especificación, agregar requerimientos con prefijo propio en `docs/REQUERIMIENTOS.md` y registrar decisiones nuevas en `docs/DECISIONES.md`.
5. **Probar en el celular** desde la URL publicada y actualizar `CHANGELOG.md`.

Convenciones:
- Textos en español chileno informal, tuteo, sin groserías fuertes.
- Botones de acción principal con `.btn` (rosado) o `.btn--yellow`; secundarios con `.btn--ghost`.
- Usar `vibrate()` en momentos clave y `confetti()` en cierres.
