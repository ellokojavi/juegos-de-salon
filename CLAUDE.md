# Juegos de Salón — contexto para Claude

App web estática (HTML, CSS y JavaScript con módulos ES, sin build ni npm) con juegos de salón,
publicada en GitHub Pages: https://juegosdesalon.cl/

## Dónde está cada cosa (D-192)

- **`public/` es el sitio**, tal como se sirve: carpeta = URL, en inglés (`public/hangman/` →
  `/hangman/`). Es lo único que se publica: `.github/workflows/publicar.yml` lo sube a Pages en cada
  fusión a main, si las pruebas pasan. Se sirve con `python3 -m http.server 8765 -d public`.
- **El id de un juego no es su carpeta**: `'ahorcado'` vive en `/hangman/`. El id lo guardan las
  salas, el panel y el `localStorage`, y no se cambia. Las rutas viejas en español (`public/ahorcado/`,
  `public/copa/`, `public/minijuegos/…`, `public/minigames/…`) son páginas puente generadas: no se editan.
- **El taller**, al lado: `docs/`, `firebase/`, `marketing/` y `tools/` por función (`release/`,
  `firebase/`, `generators/`, `agents/`, `e2e/<juego>/`).
- Las carpetas nuevas van en inglés. La documentación, los mensajes y los nombres de archivo de las
  herramientas siguen en español.

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
- **Al fusionar, la copia se borra.** El worktree y su rama son andamios, no el edificio: cuando el
  PR entra a `main`, se sacan en el mismo movimiento, desde la carpeta principal.
  ```bash
  git worktree remove ../juegos-de-salon-<tema>   # se niega si quedó algo sin commitear
  git branch -d <rama>                            # se niega si la rama no estaba fusionada
  ```
  Si alguno se niega, hay trabajo que no está en `main`: se mira antes de forzar (`--force`, `-D`).
  El 2026-10-04 había 26 carpetas `juegos-de-salon-*` (2,1 GB) de ramas ya fusionadas, y el dueño
  no podía distinguir el trabajo en curso del abandonado; una de ellas guardaba un commit que
  nunca se subió. Sin trabajo pendiente se ve **una sola** carpeta `juegos-de-salon`. Para ver qué
  quedó vivo: `git worktree list`; si una carpeta se borró a mano, `git worktree prune` (D-206).
- **Pruebas en paralelo:** servir la copia propia en un puerto propio (`python3 -m http.server 87xx -d public`),
  correr los guiones con `SITIO=http://localhost:87xx PUERTO_CDP=94xx` y **matar solo el Chrome
  propio** (`pkill -f "remote-debugging-port=948[4]"`). Nunca `pkill -f remote-debugging-port` a secas:
  mata las pruebas de todas las sesiones.
  - **El corchete en el último dígito no es adorno:** sin él, el patrón también calza con la línea de
    comandos del propio shell que corre `pkill`, y lo mata (sale con 144 a mitad de camino).
  - **Un guion puede abrir varios Chrome:** el segundo usa `PUERTO_CDP + 1`, y así (`tools/e2e/cdp.mjs`).
    Entre sesiones, dejar diez puertos de distancia (9480, 9490…), no puertos vecinos.

## Si trabajas en un fork (D-189)

Quien aporta desde afuera sigue [CONTRIBUTING.md](CONTRIBUTING.md): rama de tema y PR hacia
`ellokojavi/juegos-de-salon`. Ahí Claude **no** estampa versión ni escribe el CHANGELOG, numera las
decisiones como `D-??`, no publica reglas de Firebase ni lee el panel o los reportes (necesitan la
llave del dueño) y no fusiona. Todo lo demás de esta guía vale igual.

## Publicar

La versión ya no se estampa en git (D-205): las páginas de `public/` no llevan `?v=` ni import
map. Al fusionar se escribe la entrada de la versión en `CHANGELOG.md` (`## X.Y.Z — fecha`) y
`.github/workflows/publicar.yml` hace el resto: corre las pruebas, estampa esa versión en la copia
que publica (con el commit en la clave de caché) y comprueba que el sitio en línea la sirva.

```bash
python3 tools/release/set-version.py --version             # la versión de hoy, la del CHANGELOG
python3 tools/release/set-version.py --sitio /tmp/sitio    # estampa una copia, como al publicar
```

Que el README y las tarjetas no hayan quedado atrás lo frena el check `pruebas` de cada PR
(C-13, D-51, D-181). Dos PR abiertos ya no chocan en los `index.html`: solo en la línea del
CHANGELOG, si los dos la escriben.

## Mantener el README al día

**"Actualiza el README" es una pasada entera**, por pedido del dueño: bloques generados, prosa
**y capturas**. Se rehacen todas las secciones que `revisar` marque con capturas atrasadas, se
miran en la hoja de contacto y recién ahí se sella. No se entrega un README al día con avisos de
capturas pendientes.

**El README va en inglés** (C-13, D-78): es la cara pública del proyecto. Todo el resto de la
documentación, y los mensajes de las herramientas, siguen en español.

El README repite datos que el código ya sabe y muestra capturas que envejecen.
`tools/release/readme.py` genera lo derivable, delata lo que cambió y rehace las capturas:

```bash
python3 tools/release/readme.py revisar        # ¿quedó algo atrás? (lo corre el check pruebas)
python3 tools/release/readme.py actualizar     # reescribe los bloques <!-- generado: ... -->
python3 tools/release/readme.py capturas <seccion> [--sin-red]   # rehace las capturas con Chrome
python3 tools/release/readme.py sellar         # "ya releí el README con estos hechos"
```

Rehacerlas no es revisarlas. Antes de publicar, la hoja de contacto pone todas las capturas de
una sección juntas, al tamaño en que el README las muestra (D-76):

```bash
node tools/e2e/contacto.mjs cuarto-rey --salida /tmp/contacto
```

Dentro de las marcas `<!-- generado: ... -->` no se edita a mano. La prosa sí es a mano:
`revisar` compara los hechos de hoy (`tools/release/hechos.mjs`, que importa los módulos reales)
contra el último sello (`docs/hechos.json`) y dice qué sección releer. Cada captura declara
en [docs/capturas.json](docs/capturas.json) de qué guion de `tools/e2e/` y de qué toma sale.

## Tarjetas sociales (Open Graph)

Lo que se ve cuando alguien pega un link de la app en WhatsApp o en un chat. Importa más que en
otras apps: los links de sala se comparten por ahí, así que la invitación a jugar **es** una de
estas tarjetas.

```bash
node tools/release/og.mjs tarjetas    # reescribe el bloque <!-- generado: og --> (si falta, el check pruebas lo dice)
node tools/release/og.mjs imagenes    # rehace con Chrome las 1200×630 atrasadas (--todas: todas; necesita internet)
node tools/release/og.mjs revisar     # ¿falta una tarjeta, o una imagen se hizo con otro dibujo u otros textos? (D-181)
```

Los textos salen de `public/assets/js/games.js` y el dibujo de [tools/release/og/tarjeta.html](tools/release/og/tarjeta.html),
que importa los módulos reales. Las imágenes se rehacen a mano: solo cambian si cambia un nombre,
un emoji, una bajada o el diseño (D-72). Cada una guarda la huella de su dibujo y sus textos, y una
atrasada frena el PR (D-181): **se rehacen desde una rama al día con `main`**. La URL de cada
imagen lleva `?v=` solo en el sitio publicado: la pone `set-version.py` al publicar (D-205).

## Pruebas

GitHub corre todas las de abajo (menos el servidor) en cada PR y en cada fusión a main
(`.github/workflows/pruebas.yml`, D-143): el PR muestra ✅ o ❌. Encuentra solo cualquier
`*.test.mjs` o `*.test.py`, así que un test nuevo no se agrega al workflow. Igual se corren
aquí antes de abrir el PR. Las de punta a punta también corren en GitHub (ver abajo).

**No se fusiona un PR hasta que GitHub muestre ✅ en su check `pruebas`**, aunque las pruebas ya
hayan pasado aquí: abrir el PR, esperar el resultado y recién ahí fusionar.

```bash
node public/bulls-and-cows/engine.test.mjs
node public/battleship/engine.test.mjs
node public/timeline/engine.test.mjs
node public/hangman/engine.test.mjs
node public/liars-dice/engine.test.mjs
node public/julep/engine.test.mjs
node public/cup/engine.test.mjs               # La Copa: torneo, juegos y almacén de prueba
node public/cup/games/juegos.test.mjs
node public/cup/store.test.mjs
node public/cup/planilla.test.mjs            # la tabla final como CSV (D-161)
node public/cup/reportes.test.mjs             # un reporte que no sale queda guardado y se reenvía
node public/assets/js/arrastre.test.mjs
node public/assets/js/i18n.test.mjs             # paridad es/en/pt/de (C-3, D-191)
node public/assets/js/compartir.test.mjs        # el estándar de lo que se comparte (D-165)
node public/assets/js/records.test.mjs          # rankings: orden, semanas, Todoterreno, medallero y el almacén de prueba (D-212)
node public/assets/js/transport/cleanup.test.mjs
node public/assets/js/transport/dispose.test.mjs
node public/assets/js/transport/errors.test.mjs
node public/assets/js/transport/ratelimit.test.mjs
node public/assets/js/transport/stats.test.mjs
node public/panel/aggregate.test.mjs
node public/panel/adapta.test.mjs               # el panel se entera solo de lo nuevo (C-16)
node public/panel/copas.test.mjs                # La Copa en el panel: en curso, juegos, participación
node tools/agents/documentar.test.mjs           # la memoria y las comprobaciones del agente de documentación
node tools/agents/marketing.test.mjs            # qué cuenta como marketing atrasado (U-34)
node tools/release/version.test.mjs             # la versión sale del CHANGELOG (D-205)
node tools/e2e/cambios.test.mjs                 # qué PR se salta las pruebas de punta a punta (D-205)
python3 tools/release/readme.test.py       # qué cuenta como cambio para las capturas (D-51)
python3 -m http.server 8765 -d public   # el sitio es public/; los módulos ES necesitan HTTP, no file://
```

## Mirar una pantalla

Para revisar cómo quedó una pantalla concreta, sin jugar una partida entera:

```bash
node tools/e2e/mirar.mjs ahorcado juego --ancho 320
node tools/e2e/mirar.mjs ahorcado resultado --idioma pt
node tools/e2e/mirar.mjs panel datos --ancho 900   # el panel, con datos sembrados
node tools/e2e/mirar.mjs panel copa-ficha   # la ficha de una copa (también ahora, torneo, copa-dias,
                                            # copa-historia, juegos, juego-ficha, sala-ficha, trafico, audiencia)
```

Saca la captura y avisa si hay scroll horizontal o botones bajo 44 px (C-8). Los caminos a
cada pantalla están en `tools/e2e/caminos.mjs`: agregar uno es sumar una entrada, no escribir un
guion nuevo, y con eso la pantalla entra también a las pruebas de idiomas.

Para verlo en un celular de verdad, se sirve el árbol de trabajo por Tailscale (D-67):

```bash
tailscale serve --bg 8765     # queda en https://<equipo>.<tailnet>.ts.net/
tailscale serve --https=443 off
```

## Pruebas de punta a punta

`tools/e2e/` tiene scripts que juegan partidas completas en Chrome headless (ver su README):
sirven el sitio en el puerto 8765, corren `node tools/e2e/<script>.mjs <carpeta-salida>` y
revisan las capturas.

**GitHub las corre en cada PR y en cada fusión a main** (`.github/workflows/e2e.yml`, D-193):
cada guion en su propio job, en paralelo, y el PR muestra cuál falló, con sus capturas como
artefacto. Los largos se reparten en partes (`PARTES` en `ci.mjs`, D-204): el check tarda lo que
su job más lento, así que un guion que pase de ~4 min se parte. `tools/e2e/ci.mjs` decide
cuáles: todos menos los que abren salas en el Firebase de producción (los `online.mjs`, los
`chat.mjs` y los de su lista), que siguen a mano. Un guion nuevo entra solo; para que falle en
rojo, que imprima ✗ o ❌ o salga con error. Aquí se corren igual:

```bash
node tools/e2e/ci.mjs              # todos los de CI, con resumen; o: node tools/e2e/ci.mjs cup/torneo.mjs
```

**Todos los idiomas** (D-199): cada juego tiene su `tools/e2e/<carpeta>/idiomas.mjs` (y
`cup-games/` para los juegos sueltos de La Copa), que recorre cada pantalla de `caminos.mjs` en
cada idioma de `LANGS` contra el español: nada sin traducir, nada a medio armar y nada que el texto
más largo rompa. Un idioma nuevo entra solo. Los guiones que miran algo de un idioma (La Copa,
Línea de Tiempo jugando solo, `sala-error`, `idioma-por-url`) también recorren `LANGS` y sacan lo
que esperan de los diccionarios, no de textos escritos a mano.

Antes de repetir uno que falló, matar solo el Chrome propio:
`pkill -f "remote-debugging-port=948[4]"`, con el corchete (ver "Varias sesiones a la vez").

## Panel del dueño

`public/panel/` es una página privada (entrada con Google, lectura solo para el UID del dueño en las
reglas) que muestra salas vivas, partidas por juego y modo, jugadores, origen e idioma. Las
señales las mandan los juegos con `trackStart` y el transporte (`public/assets/js/transport/stats.js`).
Ver [docs/PANEL.md](docs/PANEL.md) y D-44. `window.__panel.seed({ rooms, days, torneos, vista })` (`vista` es una ruta: `/torneo/OFICI`) lo dibuja con
datos sembrados sin entrar. Se navega por secciones (Ahora, La Copa, Juegos, Audiencia) y fichas de cada copa, juego y sala, con la hora del Pacífico (D-207).

## Reglas de Firebase

Cuando un cambio toca `firebase/database.rules.json`, después de fusionar se publican así (D-122):

```bash
node tools/firebase/reglas.mjs publicar     # sube las reglas y verifica que quedaron
node tools/firebase/reglas.mjs revisar      # ¿lo publicado es lo del repo?
```

Necesita la llave de la cuenta de servicio en `~/.config/juegos-de-salon/firebase-admin.json`
(fuera del repo). Si no está, el script dice cómo crearla.

## Textos para el jugador

Antes de escribir instrucciones, ayudas o bajadas, leer U-1, U-8 y **U-18** en
[docs/USABILIDAD.md](docs/USABILIDAD.md): la meta primero y con verbo, a lo más 3 puntos, nada
de lo que el dibujo de ejemplo ya muestra y el puntaje en una frase, en frases completas.
`node public/cup/games/juegos.test.mjs` frena unas instrucciones de juego que pasen de 280
caracteres (D-184).

## Usabilidad (D-132)

El agente `usabilidad` (`.claude/agents/usabilidad.md`) revisa cada PR antes de mostrárselo al
dueño y hace una ronda diaria a las 5:00 hora del Pacífico. En un PR mira solo lo que el PR
cambia y no repite lo que GitHub ya corre; la revisión completa (reportes, marketing, la copa
entera) es de la ronda (D-204). **Antes de proponer una fusión, los agentes de usabilidad y de
documentación se lanzan a la vez**, en el mismo mensaje: uno toca la app y el otro los documentos.
Su guía es [docs/USABILIDAD.md](docs/USABILIDAD.md). Los dilemas son issues de GitHub y se
manejan desde aquí:

```bash
node tools/agents/dilemas.mjs listar [--todos]
node tools/agents/dilemas.mjs ver <n>
node tools/agents/dilemas.mjs crear <archivo.md>
node tools/agents/dilemas.mjs resolver <n> "decisión"   # y anotarla en docs/USABILIDAD.md
node tools/agents/dilemas.mjs archivar <n> "motivo"
node tools/agents/dilemas.mjs reabrir <n>
```

## Documentación (D-172)

El agente `documentacion` (`.claude/agents/documentacion.md`) deja la documentación al día:
CHANGELOG, decisiones, requerimientos, docs de cada juego, README con sus capturas y esta guía.
Nunca fusiona ni toca código. Se usa de tres formas:

- **Ronda diaria**, a las 3:54 hora del Pacífico (Routine en la nube): lo que entró a `main` desde
  la última ronda, en un PR `Documentación al día: <fecha>`.
- **Antes de proponer la fusión de un PR**, como el de usabilidad: revisa lo que trae ese PR y lo
  documenta en su misma rama.
- **A pedido**: "documenta lo último" o "revisa la documentación de este PR".

Su memoria es `docs/documentacion.json` (hasta qué commit revisó, lo pendiente, los problemas que
esperan al dueño y las rondas anteriores), y su herramienta, que cualquier sesión puede correr:

```bash
node tools/agents/documentar.mjs revisar [--desde <commit>]   # qué entró y qué falta documentar
node tools/agents/documentar.mjs anotar --hasta <commit> [--pr <url>] [--pendiente "…"]
node tools/agents/documentar.mjs historial
```

## Marketing y video promocional (D-178)

Los assets de marketing viven en `marketing/`, cada uno con su carpeta y un README que es su
memoria (lo que pidió el dueño en cada vuelta, cómo está hecho, cómo se rehace, la historia).
**Antes de trabajar en el video, nuevo o existente, se lee `marketing/promo-video/README.md`
entero** (el skill `promo-video` lo carga) y al terminar se anota la vuelta ahí y en
`marketing/registro.json`. Solo la última versión de cada archivo final vive en el repo.

```bash
marketing/promo-video/construir.sh       # rehace el video entero (sitio servido en $SITIO)
```

El agente de usabilidad revisa en su ronda si cada asset quedó atrás de la app (U-34) y lo anota
en `marketing/registro.json`; no lo rehace:

```bash
node tools/agents/marketing.mjs revisar                          # ¿qué asset quedó atrás y por qué?
node tools/agents/marketing.mjs anotar <id> --pendiente "…"      # o --al-dia
```

## Idiomas: español, inglés, portugués y alemán (D-197)

El alemán salió del laboratorio y se ofrece a todos, con su puerta `/de/` como `/en/` y `/pt/`.
Un texto nuevo para el jugador va en los cuatro: la prueba de paridad lo exige. El **glosario** que
toda traducción al alemán respeta está en [docs/ALEMAN.md](docs/ALEMAN.md).

Un idioma nuevo entra por el laboratorio (D-191): se agrega a `EN_LABS` en `i18n.js` y solo se
ofrece en el dispositivo que entra por `/labs/<idioma>/`, con 🐞 para que lo revisen quienes lo
hablan. Hoy `EN_LABS` está vacío.

```bash
node tools/e2e/mirar.mjs dudo intro --idioma de --ancho 320
```

## Reportes de La Copa

El botón 🐞 de La Copa escribe en `feedback/` sin cuenta (D-104). Para leerlos y conversarlos:

```bash
node tools/firebase/reportes.mjs            # todos; --dias 3 para los recientes, --json para el crudo
```

## ¿Hay alguien jugando?

Antes de proponer una fusión a main: salas en vivo y copas en curso, leídas como administrador
(misma llave que las reglas; solo lectura).

```bash
node tools/firebase/en-curso.mjs            # sale con 3 si hay algo en juego; --todo, --json
```

## Documentación

`docs/PANEL.md` · `docs/REQUERIMIENTOS.md` · `docs/DECISIONES.md` (ADR) · `docs/AGREGAR-JUEGO.md` ·
`docs/games/<carpeta>.md` · `firebase/README.md` · `CHANGELOG.md`
