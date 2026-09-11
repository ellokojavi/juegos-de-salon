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

## La herramienta

```bash
python3 tools/lab.py espejar <id>   # crea o refresca lab/<id>/index.html
python3 tools/lab.py revisar        # ¿los espejos están al día? ¿lab.css bien marcado?
python3 tools/lab.py revisar && echo ok   # sirve como puerta antes de publicar
python3 tools/lab.py promover       # lleva el experimento aprobado a producción
```

## Cómo empezar un experimento

1. Escribir los cambios en **`lab.css`**, y solo ahí. La hoja se carga **después** de
   `base.css` y del `style.css` del juego, así que alcanza con especificidad normal.

2. **Cada bloque declara adónde va** el día que se apruebe:

   ```css
   /* @destino assets/css/base.css */
   .btn { ... }

   /* @destino linea-de-tiempo/style.css */
   .hand .card { ... }
   ```

   `revisar` falla si falta la marca y `promover` la usa para mover el bloque solo.
   Un estilo sin destino es un estilo que alguien va a tener que adivinar dónde va,
   meses después.

3. Si el experimento necesita imágenes, crear `lab/img/`. Las rutas de `url()` en CSS
   se resuelven **contra `lab.css`**, no contra el HTML que lo carga: `img/x.webp`
   sirve igual para `lab/index.html` y para `lab/<juego>/index.html`. Al promover, la
   herramienta las mueve a `assets/img/` con la versión en el nombre y **reescribe las
   rutas según dónde caiga cada bloque**, que es distinto para `base.css` y para el
   `style.css` de un juego.

4. Si hace falta cambiar el HTML (agregar un elemento que no existe), tocar la copia
   del laboratorio, nunca la del juego. Ojo: eso desincroniza el espejo, y `revisar`
   lo va a marcar. Conviene anotarlo y rehacerlo a mano tras el próximo `espejar`.

5. **Subir la marca de revisión de `lab.css` en las dos páginas que lo cargan**, cada
   vez que se cambia la hoja:

   ```
   lab/index.html           <link rel="stylesheet" href="lab.css?r=2">
   lab/<juego>/index.html   <link rel="stylesheet" href="../lab.css?r=2">
   ```

   GitHub Pages manda `cache-control: max-age=600`. Sin subir la marca, uno abre el
   celular y ve la versión anterior durante diez minutos sin entender por qué.
   `promover` la sube solo.

6. Probar en celular: `python3 -m http.server 8765` y abrir `/lab/`.

**La prueba de que un experimento está bien aislado:** borrar `lab.css` tiene que dejar
las páginas funcionando y con el aspecto actual de la app. Si algo se rompe, es que se
puso ahí una base en vez de un cambio.

Si el experimento se descarta, se vacía `lab.css` y listo. Queda en el historial de git
por si alguna vez se quiere rescatar.

## Cómo espejar otro juego

Los cuatro juegos aparecen en el menú del laboratorio, pero solo los espejados se
abren adentro; el resto lleva al sitio publicado con una flecha `↗`.

```bash
python3 tools/lab.py espejar batalla-naval
```

Eso deriva `lab/batalla-naval/index.html` del `index.html` real y lo agrega a
`EN_EL_LAB` en el menú del laboratorio. Lo que hace, por si hay que entenderlo:
saca el import map (el laboratorio va sin `?v=`) y el `manifest`, corrige las rutas de
`base.css`, del `style.css` del juego y del icono, agrega `noindex`, la hoja `lab.css`
y la barra de aviso, y cambia `import './game.js'` por `import '../../<id>/game.js'`.

Los `import` internos de `game.js` (`./rules.js`, `../assets/js/ui.js`) se resuelven
contra la ubicación real del módulo, así que no hay que tocar nada más.

### El espejo se desincroniza, y eso es lo peligroso

Si el `index.html` de un juego cambia y el espejo no, uno cree que está probando el
juego y está probando una copia vieja. No hay síntoma: la página carga igual.

```bash
python3 tools/lab.py revisar
```

compara cada espejo contra lo que *debería* ser hoy y falla si quedó atrás. Vale la
pena correrlo antes de publicar cualquier cosa, junto con los tests de motor.

## Diferencias con la app publicada, a propósito

- **Sin `?v=`.** `tools/set-version.py` no toca estas páginas: el laboratorio siempre
  carga la última versión de cada módulo. Es lo que uno quiere al probar. La contra es
  que `lab.css` y las imágenes del experimento **sí quedan cacheadas** diez minutos, y
  por eso llevan marca de revisión a mano (`lab.css?r=2`, `img/x.webp?2`).
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

```bash
python3 tools/lab.py promover
```

Hace **lo mecánico**, que es donde uno se equivoca:

- Mueve `lab/img/*` a `assets/img/` con la versión en el nombre (`trama.v1.png`),
  porque `set-version.py` no estampa imágenes (C-11), y **reescribe las rutas de
  `url()`** según dónde caiga cada bloque: `../img/…` desde `assets/css/base.css`,
  `../assets/img/…` desde el `style.css` de un juego.
- Copia cada bloque de `lab.css` al archivo que declaró en su `@destino`, marcado con
  la fecha.
- Vacía `lab.css`, borra `lab/img/` y sube la marca `?r=` de los espejos.

Antes de tocar nada corre `revisar` y **se niega si el árbol de git está sucio**: la
migración reescribe archivos de producción y su diff tiene que poder leerse solo.

Lo que **no** hace, porque es criterio y no mecánica:

- **Fundir reglas duplicadas.** Si el experimento redefine `.btn` y `.btn` ya existe en
  `base.css`, `revisar` lo avisa y `promover` deja las dos reglas: la última gana y
  funciona, pero hay que fundirlas a mano para no dejar el código sucio.
- **Repasar los cuatro juegos.** Si el experimento tocó `base.css`, cambió la base de
  todos, no solo la del que probaste (C-12).
- Tests, capturas, `set-version.py`, canon, decisión, changelog (C-11, C-13).

La lista queda impresa al terminar, para no tener que acordarse.

## Historial

- **Insignias serigrafiadas** (descartado). Ilustraciones impresas por juego en
  reemplazo del emoji, y después toda la interfaz llevada al mismo lenguaje: papel con
  grano, tinta plana, sombras duras corridas y movimiento a saltos. No convenció y se
  descartó. Vive en los commits `8efd11c` y `d5071c9`; el arte original de 2048 px, en
  `arte-original/`, fuera de git y se puede borrar.
