# Juegos de Salón — contexto para Claude

App web estática (HTML, CSS y JavaScript con módulos ES, sin build ni npm) con juegos de salón,
publicada en GitHub Pages: https://juegosdesalon.cl/

## Antes de construir o modificar un juego

Leer **[docs/CANONES.md](docs/CANONES.md)**: son las reglas de construcción de todos los juegos
(identidad, estructura, idiomas, sonido, modos, memoria de partida, transporte, interfaz táctil,
anti-trampa, versionado, pruebas y documentación). Cada regla tiene un ID (C-n) para citarla.

Al terminar, recorrer la lista de chequeo al final de ese archivo.

## Varias sesiones a la vez

Puede haber varias sesiones de Claude trabajando en este repo al mismo tiempo (D-135):

- **Cada sesión trabaja en su propia copia** (`git worktree add ../juegos-de-salon-<tema> -b <rama>`),
  nunca en la carpeta principal: ahí los archivos sin commitear de una se cuelan en el commit de otra.
- **Ramas con nombre de tema** (`copa-reglas-plegadas`, `tyf-jugar-solo`), no de versión.
- **La versión se asigna al fusionar**, en el orden que decida el dueño: mientras los PR esperan,
  numerarlos antes produce choques (dos "0.61"). Las decisiones (D-n) también: se toma el número
  siguiente al más alto en `main` **y en los PR abiertos** (`gh pr list`).
- Antes de tocar la rama de otro PR, preguntarle a esa sesión (ListAgents / SendMessage).
- **Pruebas en paralelo:** servir la copia propia en un puerto propio (`python3 -m http.server 87xx`),
  correr los guiones con `SITIO=http://localhost:87xx PUERTO_CDP=94xx` y **matar solo el Chrome
  propio** (`pkill -f "remote-debugging-port=94xx"`). Nunca `pkill -f remote-debugging-port` a secas:
  mata las pruebas de todas las sesiones.

## Publicar

```bash
python3 tools/set-version.py X.Y.Z   # obligatorio antes de cada commit publicado (C-11)
```

Estampa la versión y, antes, revisa que el README no haya quedado atrás del código:
si lo quedó, no estampa y dice qué le falta (C-13, D-51).

## Mantener el README al día

**El README va en inglés** (C-13, D-78): es la cara pública del proyecto. Todo el resto de la
documentación, y los mensajes de las herramientas, siguen en español.

El README repite datos que el código ya sabe y muestra capturas que envejecen.
`tools/readme.py` genera lo derivable, delata lo que cambió y rehace las capturas:

```bash
python3 tools/readme.py revisar        # ¿quedó algo atrás? (lo corre set-version.py)
python3 tools/readme.py actualizar     # reescribe los bloques <!-- generado: ... -->
python3 tools/readme.py capturas <seccion> [--sin-red]   # rehace las capturas con Chrome
python3 tools/readme.py sellar         # "ya releí el README con estos hechos"
```

Rehacerlas no es revisarlas. Antes de publicar, la hoja de contacto pone todas las capturas de
una sección juntas, al tamaño en que el README las muestra (D-76):

```bash
node tools/e2e/contacto.mjs cuarto-rey --salida /tmp/contacto
```

Dentro de las marcas `<!-- generado: ... -->` no se edita a mano. La prosa sí es a mano:
`revisar` compara los hechos de hoy (`tools/hechos.mjs`, que importa los módulos reales)
contra el último sello (`docs/hechos.json`) y dice qué sección releer. Cada captura declara
en [docs/capturas.json](docs/capturas.json) de qué guion de `tools/e2e/` y de qué toma sale.

## Tarjetas sociales (Open Graph)

Lo que se ve cuando alguien pega un link de la app en WhatsApp o en un chat. Importa más que en
otras apps: los links de sala se comparten por ahí, así que la invitación a jugar **es** una de
estas tarjetas.

```bash
node tools/og.mjs tarjetas    # reescribe el bloque <!-- generado: og --> (lo corre set-version.py)
node tools/og.mjs imagenes    # rehace los 1200×630 con Chrome (necesita internet: Google Fonts)
node tools/og.mjs revisar     # ¿falta una tarjeta o una imagen?
```

Los textos salen de `assets/js/games.js` y el dibujo de [tools/og/tarjeta.html](tools/og/tarjeta.html),
que importa los módulos reales. Las imágenes se rehacen a mano: solo cambian si cambia un nombre,
un emoji o el diseño (D-72).

## Pruebas

```bash
node toque-y-fama/engine.test.mjs
node batalla-naval/engine.test.mjs
node linea-de-tiempo/engine.test.mjs
node ahorcado/engine.test.mjs
node dudo/engine.test.mjs
node copa/engine.test.mjs               # La Copa: torneo, minijuegos y almacén de prueba
node copa/juegos/juegos.test.mjs
node copa/store.test.mjs
node copa/reportes.test.mjs             # un reporte que no sale queda guardado y se reenvía
node assets/js/i18n.test.mjs             # paridad es/en/pt (C-3)
node assets/js/transport/cleanup.test.mjs
node assets/js/transport/dispose.test.mjs
node assets/js/transport/errors.test.mjs
node assets/js/transport/ratelimit.test.mjs
node assets/js/transport/stats.test.mjs
node panel/aggregate.test.mjs
node panel/adapta.test.mjs               # el panel se entera solo de lo nuevo (C-16)
python3 tools/readme.test.py       # qué cuenta como cambio para las capturas (D-51)
python3 -m http.server 8765          # los módulos ES necesitan HTTP, no file://
```

## Mirar una pantalla

Para revisar cómo quedó una pantalla concreta, sin jugar una partida entera:

```bash
node tools/e2e/mirar.mjs ahorcado juego --ancho 320
node tools/e2e/mirar.mjs ahorcado resultado --idioma pt
node tools/e2e/mirar.mjs panel datos --ancho 900   # el panel, con datos sembrados
```

Saca la captura y avisa si hay scroll horizontal o botones bajo 44 px (C-8). Los caminos a
cada pantalla están declarados arriba del archivo: agregar uno es sumar una entrada, no
escribir un guion nuevo.

Para verlo en un celular de verdad, se sirve el árbol de trabajo por Tailscale (D-67):

```bash
tailscale serve --bg 8765     # queda en https://<equipo>.<tailnet>.ts.net/
tailscale serve --https=443 off
```

## Pruebas de punta a punta

`tools/e2e/` tiene scripts que juegan partidas completas en Chrome headless (ver su README):
sirven el sitio en el puerto 8765, corren `node tools/e2e/<script>.mjs <carpeta-salida>` y
revisan las capturas. Antes de repetir uno que falló, matar solo el Chrome propio:
`pkill -f "remote-debugging-port=<puerto>"` (ver "Varias sesiones a la vez").

## Panel del dueño

`panel/` es una página privada (entrada con Google, lectura solo para el UID del dueño en las
reglas) que muestra salas vivas, partidas por juego y modo, jugadores, origen e idioma. Las
señales las mandan los juegos con `trackStart` y el transporte (`assets/js/transport/stats.js`).
Ver [docs/PANEL.md](docs/PANEL.md) y D-44. `window.__panel.seed({ rooms, days })` lo dibuja con
datos sembrados sin entrar.

## Reglas de Firebase

Cuando un cambio toca `firebase/database.rules.json`, después de fusionar se publican así (D-122):

```bash
node tools/reglas.mjs publicar     # sube las reglas y verifica que quedaron
node tools/reglas.mjs revisar      # ¿lo publicado es lo del repo?
```

Necesita la llave de la cuenta de servicio en `~/.config/juegos-de-salon/firebase-admin.json`
(fuera del repo). Si no está, el script dice cómo crearla.

## Usabilidad (D-132)

El agente `usabilidad` (`.claude/agents/usabilidad.md`) revisa cada PR antes de mostrárselo al
dueño y hace una ronda diaria a las 5:00 hora del Pacífico. Su guía es
[docs/USABILIDAD.md](docs/USABILIDAD.md). Los dilemas son issues de GitHub y se manejan desde aquí:

```bash
node tools/dilemas.mjs listar [--todos]
node tools/dilemas.mjs ver <n>
node tools/dilemas.mjs crear <archivo.md>
node tools/dilemas.mjs resolver <n> "decisión"   # y anotarla en docs/USABILIDAD.md
node tools/dilemas.mjs archivar <n> "motivo"
node tools/dilemas.mjs reabrir <n>
```

## Reportes de La Copa

El botón 🐞 de La Copa escribe en `feedback/` sin cuenta (D-104). Para leerlos y conversarlos:

```bash
node tools/reportes.mjs            # todos; --dias 3 para los recientes, --json para el crudo
```

## Documentación

`docs/PANEL.md` · `docs/REQUERIMIENTOS.md` · `docs/DECISIONES.md` (ADR) · `docs/AGREGAR-JUEGO.md` ·
`docs/juegos/<id>.md` · `firebase/README.md` · `CHANGELOG.md`
