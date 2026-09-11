# Laboratorio

Ambiente de pruebas para cambios de interfaz **antes** de tocar la app publicada.
Vive en su propia URL y no modifica ningún archivo de los juegos.

- Local: `http://localhost:8765/lab/`
- Publicado: `https://ellokojavi.github.io/juegos-de-salon/lab/`

## Qué se está probando ahora

Las **insignias serigrafiadas**: una ilustración impresa por juego, en reemplazo del
emoji del sistema, en la tarjeta del menú y en el encabezado de la intro.

Cubre la vista principal y **Línea de Tiempo**. Los otros tres juegos aparecen en el
menú con su insignia nueva, pero el enlace (`↗`) lleva al juego publicado.

## Cómo está armado

```
lab/
  index.html            Menú propio. Importa los mismos módulos de /assets/js/
  lab.css               Solo lo que cambia. Se carga DESPUÉS de base.css
  linea-de-tiempo/
    index.html          Espejo de la página del juego. Importa ../../linea-de-tiempo/game.js
  img/                  Las insignias: WebP de 256 px, más los PNG del icono de la app
```

**No hay lógica duplicada.** Las páginas del laboratorio importan los módulos reales
(`game.js`, `rules.js`, `engine.js`, `assets/js/*`), así que un arreglo en el juego se
ve acá solo, sin copiar nada. Lo único propio del laboratorio es la presentación.

Si se borra `lab.css`, las páginas siguen funcionando con el aspecto actual de la app.
Si una insignia no carga, vuelve el emoji del juego (C-14).

## Diferencias con la app publicada, a propósito

- **Sin `?v=`.** `tools/set-version.py` no toca estas páginas: el laboratorio siempre
  carga la última versión de cada módulo desde el disco. Es lo que uno quiere al probar.
- **Sin `manifest.webmanifest`.** El laboratorio no se instala como app; usa sus propios
  `icon` y `apple-touch-icon` para poder mirar cómo se ve el icono nuevo.
- **`noindex`.** No queremos que el laboratorio aparezca en buscadores.

## Lo que comparte con la app publicada, ojo

Mismo origen, así que **misma `localStorage`**: el idioma, el silencio, el nombre del
jugador y la **memoria de partida** (C-6) son los mismos. Una partida empezada en el
laboratorio aparece como "partida a medias" en el juego publicado, y al revés. Para
probar desde cero, borrar la partida guardada o usar una ventana privada.

## Cuando esto se apruebe

Lo que hay que llevar a la app de verdad:

1. `lab/img/*` a `assets/img/`, con la versión en el nombre (`<id>.v1.webp`), porque
   `set-version.py` no estampa imágenes.
2. Lo de `lab.css` a `assets/css/base.css`.
3. Campo `icon` en `assets/js/games.js`, con caída a `emoji` si la imagen falla.
4. `apple-touch-icon` y los iconos PNG del `manifest.webmanifest`.
5. Una línea en C-1 y una decisión (D-n) en `docs/DECISIONES.md`.
6. `CHANGELOG.md` y las capturas del `README.md`.

Los archivos originales de 2048 px están en `arte-original/`, fuera de git.
