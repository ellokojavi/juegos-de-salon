# Juegos de Salón — contexto para Claude

App web estática (HTML, CSS y JavaScript con módulos ES, sin build ni npm) con juegos de salón,
publicada en GitHub Pages: https://ellokojavi.github.io/juegos-de-salon/

## Antes de construir o modificar un juego

Leer **[docs/CANONES.md](docs/CANONES.md)**: son las reglas de construcción de todos los juegos
(identidad, estructura, idiomas, sonido, modos, memoria de partida, transporte, interfaz táctil,
anti-trampa, versionado, pruebas y documentación). Cada regla tiene un ID (C-n) para citarla.

Al terminar, recorrer la lista de chequeo al final de ese archivo.

## Publicar

```bash
python3 tools/set-version.py X.Y.Z   # obligatorio antes de cada commit publicado (C-11)
```

## Pruebas

```bash
node toque-y-fama/engine.test.mjs
node batalla-naval/engine.test.mjs
node linea-de-tiempo/engine.test.mjs
node assets/js/transport/cleanup.test.mjs
node assets/js/transport/errors.test.mjs
node assets/js/transport/ratelimit.test.mjs
python3 -m http.server 8765          # los módulos ES necesitan HTTP, no file://
```

## Probar un cambio de interfaz

`lab/` es un ambiente de pruebas con URL propia (`/lab/`) que **no toca la app publicada**:
espeja el menú y los juegos, pero importa los módulos reales. El experimento se escribe
en `lab/lab.css`, que solo agrega, y cada bloque declara su `@destino` para poder migrarlo
después. Ver [lab/README.md](lab/README.md) y D-42.

```bash
python3 tools/lab.py espejar <id>   # sumar un juego al laboratorio
python3 tools/lab.py revisar        # ¿los espejos quedaron viejos? correr antes de publicar
python3 tools/lab.py promover       # llevar el experimento aprobado a producción
```

## Pruebas de punta a punta

`tools/e2e/` tiene scripts que juegan partidas completas en Chrome headless (ver su README):
sirven el sitio en el puerto 8765, corren `node tools/e2e/<script>.mjs <carpeta-salida>` y
revisan las capturas. Antes de repetir uno que falló: `pkill -f remote-debugging-port`.

## Documentación

`docs/REQUERIMIENTOS.md` · `docs/DECISIONES.md` (ADR) · `docs/AGREGAR-JUEGO.md` ·
`docs/juegos/<id>.md` · `firebase/README.md` · `CHANGELOG.md`
