# Juegos de Salón — contexto para Claude

App web estática (HTML, CSS y JavaScript con módulos ES, sin build ni npm) con juegos de salón,
publicada en GitHub Pages: https://juegosdesalon.cl/

Esta guía es el índice y las reglas de sesión. **Las reglas de los juegos no se repiten aquí:
viven en un solo lugar** (D-213), y este archivo dice dónde.

## Dónde está cada cosa (D-192)

- **`public/` es el sitio**, tal como se sirve: carpeta = URL, en inglés (`public/hangman/` →
  `/hangman/`). Es lo único que se publica. Se sirve con `python3 -m http.server 8765 -d public`.
- **El id de un juego no es su carpeta**: `'ahorcado'` vive en `/hangman/`. El id lo guardan las
  salas, el panel y el `localStorage`, y no se cambia. Las rutas viejas en español (`public/ahorcado/`,
  `public/copa/`, `public/minijuegos/…`, `public/minigames/…`) son páginas puente generadas: no se editan.
- **El taller**, al lado: `docs/`, `firebase/`, `marketing/` y `tools/` por función (`release/`,
  `firebase/`, `generators/`, `agents/`, `e2e/<juego>/`).
- Las carpetas nuevas van en inglés. La documentación, los mensajes y los nombres de archivo de las
  herramientas siguen en español. El README va en inglés (C-13, D-78).

## Dónde está cada regla (D-213)

| Qué | Dónde | Cuándo se lee |
|---|---|---|
| Cómo se construye un juego (C-n) | [docs/CANONES.md](docs/CANONES.md), con su lista de chequeo al final | Antes de construir o modificar un juego o la portada (C-17), y al terminar |
| Textos, botones, compartir (U-n) | [docs/USABILIDAD.md](docs/USABILIDAD.md): U-1, U-8 y **U-18** antes de escribir instrucciones | Antes de escribir algo que el jugador lee |
| Por qué es así (D-n) | [docs/DECISIONES.md](docs/DECISIONES.md), con un índice por tema arriba | Antes de cambiar algo que parece raro |
| Un juego nuevo, paso a paso | [docs/AGREGAR-JUEGO.md](docs/AGREGAR-JUEGO.md) | Al empezar uno |
| Cada juego | `docs/games/<carpeta>.md`, con sus excepciones a los cánones | Antes de tocarlo |
| Qué se pidió (RP-n…) | [docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md) | Al cerrar uno |
| Alemán | [docs/ALEMAN.md](docs/ALEMAN.md), el glosario | Al traducir |
| Panel del dueño | [docs/PANEL.md](docs/PANEL.md) | Al tocar señales o el panel |
| Pruebas de punta a punta | [tools/e2e/README.md](tools/e2e/README.md) | Al correr o escribir un guion |
| Firebase | [firebase/README.md](firebase/README.md) | Al tocar las reglas |

**Una regla que cambia se cambia en su lugar, en el mismo PR:** si una decisión nueva cambia un
canon, el PR edita el canon y marca la decisión vieja (`corregida por` / `reemplazada por`). Un
canon que contradice a una decisión vigente es un error, no historia.

## Varias sesiones a la vez (D-135)

Puede haber varias sesiones de Claude trabajando en este repo al mismo tiempo:

- **Cada sesión trabaja en su propia copia** (`git worktree add ../juegos-de-salon-<tema> -b <rama>`),
  nunca en la carpeta principal: ahí los archivos sin commitear de una se cuelan en el commit de otra.
- **Ramas con nombre de tema** (`copa-reglas-plegadas`, `tyf-jugar-solo`), no de versión.
- **La versión se asigna al fusionar**, en el orden que decida el dueño: mientras los PR esperan,
  numerarlos antes produce choques (dos "0.61"). Las decisiones (D-n) toman el número siguiente
  al más alto en `main` **y en los PR abiertos** (`gh pr list`).
- Antes de tocar la rama de otro PR, preguntarle a esa sesión (ListAgents / SendMessage).
- **Al fusionar, la copia se borra**, en el mismo movimiento, desde la carpeta principal (D-206):
  ```bash
  git worktree remove ../juegos-de-salon-<tema>   # se niega si quedó algo sin commitear
  git branch -d <rama>                            # se niega si la rama no estaba fusionada
  ```
  Si alguno se niega, hay trabajo que no está en `main`: se mira antes de forzar (`--force`, `-D`).
  Sin trabajo pendiente se ve **una sola** carpeta `juegos-de-salon` (`git worktree list`; si una
  carpeta se borró a mano, `git worktree prune`). Con el auto-merge, el PR puede fusionarse cuando
  nadie mira: **al empezar cada sesión**, un hook (`.claude/settings.json`) corre
  `node tools/agents/limpiar-copias.mjs`, que borra las copias cuya rama ya entró a `main` por un
  merge y nombra las que tienen cambios sin commitear (D-218). GitHub borra la rama remota al fusionar.
- **Ninguna copia queda sin uso** (D-252, pedido del dueño): la sesión que crea una copia la borra
  apenas sabe que no va a dar PR (el trabajo ya estaba hecho, se descartó o se juntó con otro), sin
  esperar al hook, y al terminar su trabajo solo quedan las copias con PR abierto. El hook barre
  lo que se escape, también las de la app (`.claude/worktrees/`): las **vacías** (sin commits
  propios, de más de un día) y las **abandonadas** (commits fuera de `main`, sin PR abierto y
  quietas más de tres días), que antes de borrarse suben su rama a GitHub para no perder nada.
  Nunca toca una copia con cambios sin commitear.
- **Pruebas en paralelo:** cada sesión sirve su copia en su puerto (`python3 -m http.server 87xx -d public`),
  y corre los guiones con `SITIO=http://localhost:87xx`. Los puertos de Chrome no se eligen: cada
  Chrome toma uno libre y muere con su guion, también si el guion falla o se corta (`cdp.mjs`,
  D-213). Si alguno quedara vivo, se busca por su perfil, no por el puerto, y nunca con
  `pkill -f remote-debugging-port` a secas. Detalle en [tools/e2e/README.md](tools/e2e/README.md).

## Si trabajas en un fork (D-189)

Quien aporta desde afuera sigue [CONTRIBUTING.md](CONTRIBUTING.md): rama de tema y PR hacia
`ellokojavi/juegos-de-salon`. Ahí Claude **no** estampa versión ni escribe el CHANGELOG, numera las
decisiones como `D-??`, no publica reglas de Firebase ni lee el panel o los reportes (necesitan la
llave del dueño) y no fusiona. Todo lo demás de esta guía vale igual.

## Antes de proponer una fusión

1. **Los agentes de usabilidad y de documentación, a la vez**, en el mismo mensaje
   (`.claude/agents/usabilidad.md` y `documentacion.md`, D-132, D-172): uno mira la app y el otro
   los documentos. Los dos arreglan en la rama del mismo PR (D-213).
2. **¿Hay alguien jugando?** `node tools/firebase/en-curso.mjs` (sale con 3 si hay salas en vivo
   o copas en curso; necesita la llave del dueño).
3. **No se fusiona sin ✅ en GitHub en `pruebas` y en `punta-a-punta`** (D-143,
   D-193, D-213, D-216), aunque ya hayan pasado aquí. `main` exige los dos: `punta-a-punta` es el
   job que resume el workflow `Punta a punta` (un job por guion) y sale en rojo si alguno falla.
   En un PR que solo trae documentación no corre ningún guion y sale en verde igual.
4. **Auto-merge por defecto** (D-216, pedido del dueño): cuando el PR está listo para fusionarse
   —los agentes terminaron y sus arreglos están subidos, y la entrada del `CHANGELOG.md` ya está
   en la rama—, se activa el auto-merge de GitHub en vez de esperar el ✅ a mano:
   ```bash
   gh pr merge <n> --auto --merge
   ```
   GitHub lo fusiona solo cuando `pruebas` y `punta-a-punta` pasan; si fallan o hay conflicto,
   no fusiona y hay que arreglarlo. Un PR que no está listo (un borrador, uno que espera una
   decisión del dueño) no lleva auto-merge.
5. **Monitor de CI** (D-218): junto con el auto-merge se activa el monitor del PR en la app
   (`set_monitor` con `auto_fix` y `address_comments`), que despierta a la sesión cuando una prueba
   falla, hay un conflicto o llega un comentario: lo único que necesita a alguien. Nunca se sondea
   el CI. Lo de después de fusionar ya no espera a nadie: las reglas de Firebase las publica
   `publicar.yml` y la copia la borra el hook de inicio de sesión.

## Al fusionar y publicar (C-11, D-205)

- Se escribe la entrada de la versión en `CHANGELOG.md` (`## X.Y.Z — fecha`). Las páginas de
  `public/` no llevan `?v=` ni import map: `.github/workflows/publicar.yml` corre las pruebas,
  estampa la versión en la copia que publica y comprueba que el sitio en línea la sirva.
  ```bash
  python3 tools/release/set-version.py --version             # la versión de hoy, la del CHANGELOG
  python3 tools/release/set-version.py --sitio /tmp/sitio    # estampa una copia, como al publicar
  ```
- Las reglas de Firebase las publica `publicar.yml` en cada fusión, antes que el sitio (D-218):
  no sube nada si ya están, y si Firebase las rechaza el sitio no se publica. Necesita el secreto
  `FIREBASE_ADMIN_JSON` en GitHub (la llave de la cuenta de servicio, que carga el dueño); sin él,
  avisa y se publican a mano, como antes (D-122; la llave en `~/.config/juegos-de-salon/firebase-admin.json`):
  ```bash
  node tools/firebase/reglas.mjs publicar     # sube las reglas y verifica que quedaron
  node tools/firebase/reglas.mjs revisar      # ¿lo publicado es lo del repo?
  ```
- La copia y la rama se borran solas (arriba, D-218, D-252); si se quiere ya, `node tools/agents/limpiar-copias.mjs`.

## README, capturas y tarjetas sociales (C-13, D-51, D-181)

El check `pruebas` de cada PR frena un README o una tarjeta atrasados.

```bash
python3 tools/release/readme.py revisar        # ¿quedó algo atrás?
python3 tools/release/readme.py actualizar     # reescribe los bloques <!-- generado: ... -->
python3 tools/release/readme.py capturas <seccion> [--sin-red]   # rehace las capturas con Chrome
python3 tools/release/readme.py sellar         # "ya releí el README con estos hechos"
node tools/e2e/contacto.mjs <seccion> --salida /tmp/contacto      # mirarlas juntas (D-76)
node tools/release/og.mjs tarjetas | imagenes | revisar           # tarjetas de WhatsApp (D-72)
node tools/release/iconos.mjs                                    # íconos PNG de la app instalable, desde assets/icon.svg (D-221)
node tools/push/vapid.mjs                                        # la clave de los avisos: ya se corrió (D-225), no se rehace
node tools/push/avisar.mjs --simular | --prueba <código>         # qué avisos mandaría (copas y Uno al día), o uno de prueba a una copa (D-224, D-230)
```

- **Una captura atrasada es un aviso en un PR común. "Actualiza el README" es una pasada entera**,
  por pedido del dueño: bloques generados, prosa **y todas las capturas** que `revisar` marque, miradas
  en la hoja de contacto y recién ahí selladas; no se entrega con avisos pendientes (D-213).
- Dentro de `<!-- generado: ... -->` no se edita a mano. Cada captura declara en
  [docs/capturas.json](docs/capturas.json) de qué guion de `tools/e2e/` y de qué toma sale.
- Las imágenes de las tarjetas se rehacen **desde una rama al día con `main`**; solo cambian si
  cambia un nombre, un emoji, una bajada o el diseño ([tools/release/og/tarjeta.html](tools/release/og/tarjeta.html)).

## Pruebas (C-12)

GitHub corre todos los `*.test.mjs` y `*.test.py` en cada PR (`.github/workflows/pruebas.yml`), así
que un test nuevo no se agrega a ninguna lista: lo que pruebe algo especial lo dice en su primera
línea. Igual se corren aquí antes de abrir el PR.

```bash
for f in $(git ls-files '*.test.mjs'); do node "$f" || echo "FALLA $f"; done
for f in $(git ls-files '*.test.py'); do python3 "$f" || echo "FALLA $f"; done
```

**Punta a punta** (D-193, D-199, D-204): `tools/e2e/` juega partidas completas en Chrome headless,
y GitHub corre en cada PR todos los guiones menos los que abren salas en el Firebase de
producción. Para que un guion falle en rojo, que imprima ✗ o ❌ o salga con error.

```bash
node tools/e2e/ci.mjs              # todos los de CI, con resumen; o: node tools/e2e/ci.mjs cup/torneo.mjs
node tools/e2e/mirar.mjs ahorcado juego --ancho 320 [--idioma pt]   # una pantalla suelta (C-8)
node tools/e2e/mirar.mjs panel datos --ancho 900                    # el panel, con datos sembrados
```

Los caminos a cada pantalla están en `tools/e2e/caminos.mjs`: agregar uno es sumar una entrada, y
con eso la pantalla entra también a las pruebas de idiomas. Para verlo en un celular de verdad,
`tailscale serve --bg 8765` (D-67; se apaga con `tailscale serve --https=443 off`).

## Agentes y herramientas del dueño

- **Usabilidad** (D-132): revisa cada PR y hace una ronda diaria a las 5:00 hora del Pacífico.
  Los dilemas son issues de GitHub: `node tools/agents/dilemas.mjs listar | ver <n> | crear <archivo.md> | resolver <n> "decisión" | archivar <n> "motivo" | reabrir <n>`;
  lo resuelto se anota en `docs/USABILIDAD.md`.
- **Documentación** (D-172): ronda diaria a las 3:54 hora del Pacífico, revisión de cada PR y a
  pedido ("documenta lo último"). Nunca fusiona ni toca código. Su memoria es
  `docs/documentacion.json`: `node tools/agents/documentar.mjs revisar [--desde <commit>] | anotar --hasta <commit> [--pr <url>] [--pendiente "…"] | historial`.
- **Marketing** (D-178): cada asset vive en `marketing/<asset>/` con un README que es su memoria.
  **Antes de trabajar en el video se lee `marketing/promo-video/README.md` entero** (el skill
  `promo-video` lo carga) y al terminar se anota la vuelta ahí y en `marketing/registro.json`.
  `node tools/agents/marketing.mjs revisar` dice qué asset quedó atrás (U-34).
- **Panel** (`public/panel/`, D-44, D-207): `window.__panel.seed({ rooms, days, torneos, push, vista })`
  lo dibuja con datos sembrados sin entrar. Ver [docs/PANEL.md](docs/PANEL.md).
- **Reportes de La Copa** (D-104): `node tools/firebase/reportes.mjs [--dias 3] [--json]`.
- **Rankings** (D-212): `records.js` (lógica), `jugador.js` (el jugador y su almacén:
  `jugador-firebase.js`, o `jugador-local.js` en pruebas y con `?prueba`; `?records=firebase` fuerza
  Firebase) y `ranking.js` + `ranking.css` (pantalla). Abiertos a todos desde D-217 (la puerta del
  laboratorio, `RANKINGS_EN_LABS`, queda en `false`). La
  historia de La Copa (podios, la pestaña "Copa" y las copas de cada jugador para "Tus copas", D-220,
con jugadores heredados que cada uno reclama):
  `node tools/firebase/rankings-historia.mjs [--con-laboratorio] [--escribir]`. Los juegos de grupo
  anotan victorias con `finDePartida` (`ranking.js`) al terminar, y muestran su tabla con
  `bloqueVictorias` en la intro (D-215). Uno al día (D-230) anota con `anotarDia` de `jugador.js` en
  `unoAlDia/<jid>/<n>` y en las tablas `uno-al-dia` (período del día `d<n>` y semana) y
  `uno-al-dia-racha`; su red (invitaciones, el dato de quien invita) está en `uno-al-dia-red.js`.

## Idiomas (C-3, D-197)

Español por defecto; inglés, portugués y alemán se eligen a mano. Un texto nuevo para el jugador
va en los cuatro: la prueba de paridad lo exige. Un idioma nuevo entra por el laboratorio
(`EN_LABS` en `i18n.js`, hoy vacío; D-191).
