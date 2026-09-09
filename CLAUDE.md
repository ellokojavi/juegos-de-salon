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
python3 -m http.server 8765          # los módulos ES necesitan HTTP, no file://
```

## Documentación

`docs/REQUERIMIENTOS.md` · `docs/DECISIONES.md` (ADR) · `docs/AGREGAR-JUEGO.md` ·
`docs/juegos/<id>.md` · `firebase/README.md` · `CHANGELOG.md`
