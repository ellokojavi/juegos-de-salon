# Laboratorio

Ambiente de pruebas para cambios de interfaz **antes** de tocar la app publicada.
Vive en su propia URL y no modifica ningún archivo de los juegos.

- Local: `http://localhost:8765/lab/`
- Publicado: `https://ellokojavi.github.io/juegos-de-salon/lab/`

## Qué se está probando ahora

**La app impresa en serigrafía.** No son solo iconos nuevos: la página entera se
mudó a la misma imprenta que las insignias.

- **Papel en vez de degradado.** El fondo es un color plano más el grano real,
  recortado del arte original (`img/papel.webp`). Se fueron los degradados radiales
  que hacían ver el fondo iluminado.
- **Tinta plana.** Ningún degradado en botones, paneles ni fichas.
- **Nada de vidrio.** Sin `blur` ni `backdrop-filter`: el papel no es traslúcido.
- **Nada de resplandor.** Las sombras son duras y desplazadas, sin difuminado, como
  una plancha que quedó corrida. Los títulos se imprimen dos veces, corridos.
- **El movimiento va a saltos** (`steps`), como fotogramas impresos. Un cartel no
  hace easing.
- Las **insignias** reemplazan al emoji en la tarjeta del menú y en el encabezado de
  la intro. En el chip de la barra se queda el emoji: a 22 px la insignia es una
  mancha de color.

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
   `set-version.py` no estampa imágenes. En el laboratorio el papel va con `?2` a
   mano, que sirve para probar pero no para publicar.
2. Lo de `lab.css` a `assets/css/base.css`. Ojo: `lab.css` pisa estilos de los cuatro
   juegos, así que llevarlo a producción obliga a repasar Cuarto Rey, Toque y Fama y
   Batalla Naval, no solo Línea de Tiempo (C-12).
3. Campo `icon` en `assets/js/games.js`, con caída a `emoji` si la imagen falla.
4. `apple-touch-icon` y los iconos PNG del `manifest.webmanifest`.
5. Una línea en C-1 y una decisión (D-n) en `docs/DECISIONES.md`.
6. `CHANGELOG.md` y las capturas del `README.md`.

Los archivos originales de 2048 px están en `arte-original/`, fuera de git.
