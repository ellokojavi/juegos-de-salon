# Juegos de Salón — contexto para Claude

App web estática (HTML, CSS y JavaScript con módulos ES, sin build ni npm) con juegos de salón,
publicada en GitHub Pages: https://juegosdesalon.cl/

## Antes de construir o modificar un juego

Leer **[docs/CANONES.md](docs/CANONES.md)**: son las reglas de construcción de todos los juegos
(identidad, estructura, idiomas, sonido, modos, memoria de partida, transporte, interfaz táctil,
anti-trampa, versionado, pruebas y documentación). Cada regla tiene un ID (C-n) para citarla.

Al terminar, recorrer la lista de chequeo al final de ese archivo.

## Publicar

```bash
python3 tools/set-version.py X.Y.Z   # obligatorio antes de cada commit publicado (C-11)
```

Estampa la versión y, antes, revisa que el README no haya quedado atrás del código:
si lo quedó, no estampa y dice qué le falta (C-13, D-51).

## Mantener el README al día

El README repite datos que el código ya sabe y muestra capturas que envejecen.
`tools/readme.py` genera lo derivable, delata lo que cambió y rehace las capturas:

```bash
python3 tools/readme.py revisar        # ¿quedó algo atrás? (lo corre set-version.py)
python3 tools/readme.py actualizar     # reescribe los bloques <!-- generado: ... -->
python3 tools/readme.py capturas <seccion> [--sin-red]   # rehace las capturas con Chrome
python3 tools/readme.py sellar         # "ya releí el README con estos hechos"
```

Dentro de las marcas `<!-- generado: ... -->` no se edita a mano. La prosa sí es a mano:
`revisar` compara los hechos de hoy (`tools/hechos.mjs`, que importa los módulos reales)
contra el último sello (`docs/hechos.json`) y dice qué sección releer. Cada captura declara
en [docs/capturas.json](docs/capturas.json) de qué guion de `tools/e2e/` y de qué toma sale.

## Pruebas

```bash
node toque-y-fama/engine.test.mjs
node batalla-naval/engine.test.mjs
node linea-de-tiempo/engine.test.mjs
node assets/js/i18n.test.mjs             # paridad es/en/pt (C-3)
node assets/js/transport/cleanup.test.mjs
node assets/js/transport/dispose.test.mjs
node assets/js/transport/errors.test.mjs
node assets/js/transport/ratelimit.test.mjs
node assets/js/transport/stats.test.mjs
node panel/aggregate.test.mjs
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

## Panel del dueño

`panel/` es una página privada (entrada con Google, lectura solo para el UID del dueño en las
reglas) que muestra salas vivas, partidas por juego y modo, jugadores, origen e idioma. Las
señales las mandan los juegos con `trackStart` y el transporte (`assets/js/transport/stats.js`).
Ver [docs/PANEL.md](docs/PANEL.md) y D-44. `window.__panel.seed({ rooms, days })` lo dibuja con
datos sembrados sin entrar.

## Documentación

`docs/PANEL.md` · `docs/REQUERIMIENTOS.md` · `docs/DECISIONES.md` (ADR) · `docs/AGREGAR-JUEGO.md` ·
`docs/juegos/<id>.md` · `firebase/README.md` · `CHANGELOG.md`
