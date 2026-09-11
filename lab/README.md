# Laboratorio

Ambiente de pruebas para cambios de interfaz. Vive en su propia URL y **no modifica
ningún archivo de la app publicada**, así que se puede experimentar sin riesgo y
mostrarle el resultado a alguien antes de decidir.

- Local: `http://localhost:8765/lab/`
- Publicado: `https://ellokojavi.github.io/juegos-de-salon/lab/`

Ahora mismo **no hay ningún experimento en curso**: el laboratorio se ve igual que la
app. Ese es el estado correcto en reposo (ver D-42).

## Cómo está armado

```
lab/
  index.html            Menú propio. Importa los mismos módulos de /assets/js/
  lab.css               La hoja del experimento. Vacía cuando no hay ninguno
  linea-de-tiempo/
    index.html          Espejo de la página del juego
  README.md             Este archivo
```

**No hay lógica duplicada.** Las páginas del laboratorio importan los módulos reales
(`game.js`, `rules.js`, `engine.js`, `assets/js/*`), así que un arreglo en un juego se
ve acá solo, sin copiar nada. Lo único propio del laboratorio es la presentación:
`lab.css` y el HTML espejado.

## Cómo empezar un experimento

1. Escribir los cambios en **`lab.css`**, y solo ahí. La hoja se carga **después** de
   `base.css` y del `style.css` del juego, así que alcanza con especificidad normal.
2. Si el experimento necesita imágenes, crear `lab/img/`. Las rutas de `url()` en CSS
   se resuelven **contra `lab.css`**, no contra el HTML que lo carga: `img/x.webp`
   sirve igual para `lab/index.html` y para `lab/<juego>/index.html`.
3. Si hace falta cambiar el HTML (agregar un elemento que no existe), tocar la copia
   del laboratorio, nunca la del juego.
4. Probar en celular: `python3 -m http.server 8765` y abrir `/lab/`.

**La prueba de que un experimento está bien aislado:** borrar `lab.css` tiene que dejar
las páginas funcionando y con el aspecto actual de la app. Si algo se rompe, es que se
puso ahí una base en vez de un cambio.

Si el experimento se descarta, se vacía `lab.css` y listo. Queda en el historial de git
por si alguna vez se quiere rescatar.

## Cómo espejar otro juego

Los cuatro juegos aparecen en el menú del laboratorio, pero solo los espejados se
abren adentro; el resto lleva al sitio publicado con una flecha `↗`.

Para sumar uno, copiar su `index.html` a `lab/<id>/index.html` y hacer estos cambios:

| En el juego | En el laboratorio |
|---|---|
| `<script type="importmap" id="importmap">…</script>` | se borra entero |
| `href="../assets/css/base.css?v=X"` | `href="../../assets/css/base.css"` |
| `href="style.css?v=X"` | `href="../../<id>/style.css"` |
| `<link rel="manifest" …>` | se borra |
| `<link rel="icon" href="../assets/…">` | `href="../../assets/…"` |
| `import './game.js'` | `import '../../<id>/game.js'` |
| — | se agrega `<link rel="stylesheet" href="../lab.css">` al final del `<head>` |
| — | se agrega el `<div class="lab-bar">` arriba del `<main>` |

Después, agregarlo a `EN_EL_LAB` en `lab/index.html`.

Los `import` internos de `game.js` (`./rules.js`, `../assets/js/ui.js`) se resuelven
contra la ubicación real del módulo, así que no hay que tocar nada más.

## Diferencias con la app publicada, a propósito

- **Sin `?v=`.** `tools/set-version.py` no toca estas páginas: el laboratorio siempre
  carga la última versión de cada módulo. Es lo que uno quiere al probar. La contra es
  que el navegador **sí cachea `lab.css` y las imágenes**; al iterar hay que recargar
  sin caché o poner una marca a mano (`img/x.webp?2`).
- **Sin `manifest.webmanifest`.** El laboratorio no se instala como app.
- **`noindex`.** No queremos que aparezca en buscadores.
- **Sin versión ni entrada de versión.** Un cambio que solo toca `lab/` no corre
  `set-version.py`: no cambió ningún archivo versionado, y estampar `?v=` nuevo
  obligaría a todos los celulares a rebajar el JS y el CSS sin nada nuevo que bajar.

## Lo que comparte con la app publicada, ojo

Mismo origen, así que **misma `localStorage`**: el idioma, el silencio, el nombre del
jugador y la **memoria de partida** (C-6) son los mismos. Una partida empezada en el
laboratorio aparece como "partida a medias" en el juego publicado, y al revés. Para
probar desde cero, borrar la partida guardada o usar una ventana privada.

También comparte las **salas de Firebase** (C-7): una sala creada desde el laboratorio
es una sala común y corriente, y cuenta para el tope por celular (D-41).

## Cuando un experimento se aprueba

1. Llevar lo de `lab.css` a `assets/css/base.css` o al `style.css` del juego.
2. Las imágenes a `assets/img/`, **con la versión en el nombre** (`<id>.v1.webp`):
   `set-version.py` no estampa imágenes.
3. Repasar **los cuatro juegos**, no solo el espejado: si el experimento tocó estilos
   de `base.css`, cambió la base de todos (C-12).
4. Canon, decisión, changelog y capturas del README (C-1, C-13).

## Historial

- **Insignias serigrafiadas** (descartado). Ilustraciones impresas por juego en
  reemplazo del emoji, y después toda la interfaz llevada al mismo lenguaje: papel con
  grano, tinta plana, sombras duras corridas y movimiento a saltos. No convenció y se
  descartó. Vive en los commits `8efd11c` y `d5071c9`; el arte original de 2048 px, en
  `arte-original/`, fuera de git y se puede borrar.
