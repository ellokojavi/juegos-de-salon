# Pruebas de punta a punta (Chrome headless por CDP)

Scripts que juegan partidas completas en Chrome headless, sin dependencias de npm: usan el
protocolo de depuración de Chrome por WebSocket (`cdp.mjs`). Cada script recibe una carpeta
de salida donde deja capturas PNG, e imprime en consola lo que verificó.

## Requisitos

- Google Chrome instalado en `/Applications/Google Chrome.app` (ruta en `cdp.mjs`), u otro navegador con `CHROME=/ruta/al/chrome`.
- Node 20 o superior (usa `fetch` y `WebSocket` nativos).
- El sitio servido en `http://localhost:8765`:

```bash
python3 -m http.server 8765 -d public
```

## Uso

```bash
mkdir -p /tmp/e2e && node tools/e2e/battleship/local.mjs /tmp/e2e
```

Con otra sesión probando al mismo tiempo (D-135), cada una sirve su copia en su puerto y se lo
pasa a los guiones en `SITIO` (**todos** lo leen; sin él, el 8765). Los puertos de Chrome no se
eligen: `cdp.mjs` abre cada Chrome con `--remote-debugging-port=0`, el sistema le da uno libre y
`launch` lo lee del archivo `DevToolsActivePort` del perfil (D-213). Dos sesiones, o dos guiones
de la misma, corren a la vez sin pisarse. El puerto que de verdad usó cada Chrome queda en `b.port`.

```bash
SITIO=http://localhost:8791 node tools/e2e/hangman/online.mjs /tmp/e2e
```

`PUERTO_CDP` sigue existiendo para quien quiera puertos fijos (para conectarse a mano a un Chrome
del guion, por ejemplo): el primer Chrome del guion usa `PUERTO_CDP`, el segundo el siguiente, y
así. Es opcional; sin él no hay nada que coordinar.

## En GitHub (D-193)

`ci.mjs` corre los guiones que no tocan el Firebase de producción, y GitHub lo usa en cada PR
(`.github/workflows/e2e.yml`, un job por guion). Un guion falla si sale con error, si imprime
una línea con ✗ o ❌, o si pasa los 15 minutos (ahí `ci.mjs` le manda SIGTERM, para que cierre su
Chrome, y SIGKILL si a los 5 s sigue vivo). Los que solo imprimen lo que ven igual caen si
algo se rompe del todo. Los `online.mjs`, los `chat.mjs` y los de la lista `TAMBIEN_FIREBASE` de
`ci.mjs` abren salas de verdad y siguen a mano. Los de `OBSOLETOS` prueban algo que ya no
existe y esperan que alguien los reescriba.

El check entero tarda lo que su job más lento, así que un guion que pase de unos 4 minutos se
reparte en partes (`PARTES` en `ci.mjs`, D-204): `cup/torneo.mjs` en `copa`, `laboratorio` y `demos`, y
`cup-games/idiomas.mjs` en un job por juego. Cada parte le llega al guion como `--parte <nombre>`;
sin parte, el guion corre entero (así lo corren `readme.py capturas` y quien lo prueba a mano).

Un PR que solo trae documentación (`docs/`, `marketing/`, `.claude/` y los `.md` fuera de `public/`
y de esta carpeta) no corre ningún guion: `ci.mjs --lista --cambios <archivo>` sale vacía, y
[`cambios.mjs`](cambios.mjs) decide qué cuenta como documentación (D-205; lo prueba
`node tools/e2e/cambios.test.mjs`). Si las pruebas salen
en rojo en `main`, el job `avisar` abre un issue "main en rojo: Punta a punta".

```bash
node tools/e2e/ci.mjs              # todos los de CI, uno tras otro, con resumen
node tools/e2e/ci.mjs --lista      # cuáles son (con sus partes)
node tools/e2e/ci.mjs cup/torneo.mjs   # solo ese
node tools/e2e/ci.mjs cup/torneo.mjs:demos   # solo esa parte
```

`mirar.mjs` no es una prueba: abre una pantalla suelta para revisarla de a una, sin jugar la
partida. `node tools/e2e/mirar.mjs ahorcado juego --ancho 320` saca la captura y avisa si hay
scroll horizontal o botones bajo 44 px (C-8). `--idioma de` (o `en`, `pt`) la abre en ese idioma. El
panel se mira con datos sembrados: `mirar.mjs panel <toma>`, con `datos`, `ahora`, `torneo`, `juegos`,
`audiencia`, `trafico`, `copa-ficha`, `copa-dias`, `copa-historia`, `juego-ficha` o `sala-ficha` (D-207). Los
caminos a cada pantalla están en [`caminos.mjs`](caminos.mjs), que comparte con las pruebas de idiomas.

`contacto.mjs` tampoco: arma una hoja con **todas** las capturas del README de una sección,
al tamaño en que el README las muestra, para mirarlas juntas antes de publicar (D-76).

```bash
node tools/e2e/contacto.mjs cuarto-rey --salida /tmp/contacto
```

| Script | Qué prueba |
|---|---|
| `fourth-king/partida.mjs` | Botón de sonido, mazo completo hasta el cuarto rey y el menú en inglés |
| `bulls-and-cows/local.mjs` | Un celular y jugar solo (dos veces, para ver el récord), hasta el resultado |
| `bulls-and-cows/online.mjs` | Dos celulares contra Firebase real: unión por URL, recarga a mitad, revancha |
| `battleship/local.mjs` | Colocación, batalla en un celular y contra el celular |
| `battleship/colocacion.mjs` | Seleccionar, girar, mover y deseleccionar barcos en la grilla |
| `battleship/alineacion.mjs` | Que los números de fila queden alineados con las casillas en tres anchos |
| `battleship/online.mjs` | Dos celulares contra Firebase real, con recarga y revancha |
| `battleship/chat.mjs` | Chat de sala: se guarda al colocar la flota propia, globito y etiqueta, no mueve la partida, vuelve al recargar y sigue en el resultado. |
| `hangman/local.mjs` | Cadena de tres en un celular, comprar una letra, retomar y el solitario |
| `hangman/online.mjs` | Tres celulares contra Firebase real: cadena, reconexión a mitad y revancha |
| `liars-dice/local.mjs` | Duelo contra el celular y partida de tres en un celular, con retomar a mitad |
| `liars-dice/online.mjs` | Tres celulares contra Firebase real: sala, destape verificado, recarga a mitad y revancha |
| `julep/local.mjs` | Mesa de tres contra el celular y partida en un celular, con retomar a mitad |
| `julep/online.mjs` | Tres celulares contra Firebase real: reparto cerrado, sello de cartas verificadas, recarga a mitad y chat |
| `timeline/local.mjs` | Un celular con tres jugadores, con retomar a mitad |
| `timeline/solo.mjs` | Jugar solo (⏳ Línea Relámpago): solo la temática, error en rojo, retomar, puntaje, récord por temática, cartas sin repetir, y en cada idioma |
| `timeline/error.mjs` | Pantalla de error que se queda hasta tocar; el rival espera |
| `timeline/online.mjs` | Tres celulares contra Firebase real, recarga y revancha |
| `bulls-and-cows/chat.mjs` | Chat de sala en Toque y Fama: no leídos, etiqueta, y que muera con la partida |
| `timeline/eleccion.mjs` | Que se coloque la carta elegida y que sin elegir no se pueda colocar nada |
| `timeline/veredicto.mjs` | Que el veredicto hable en tercera persona cuando se equivocó otro |
| `timeline/mazos.mjs` | Todas las temáticas y que diez partidas seguidas no repitan cartas |
| `timeline/pozo.mjs` | Pozo común: tira de 6, reposición por el final, meta y ajuste que viaja en la sala |
| `timeline/mesa.mjs` | Todas a la vista: mesa del doble de la meta y sin reposición |
| `timeline/arrastre.mjs` | El gesto de arrastrar con eventos táctiles: elegir sin colocar, retomar, soltar fuera y desliz lateral |
| `timeline/empate.mjs` | Que la ronda se termine y que el empate lo gane el más rápido |
| `timeline/chat.mjs` | Chat de sala: no leídos, freno al spam, veredicto que lo tapa, reconexión y muerte al terminar |
| `memoria-de-partida.mjs` | Guardar y retomar en los tres juegos (canon C-6) |
| `versionado.mjs` | Que todos los módulos carguen con `?v=` del import map. Desde D-205 `public/` no lo lleva: correrlo contra una copia estampada (`set-version.py --sitio /tmp/sitio`, servida y pasada en `SITIO`) |
| `instalable.mjs` | La app instalable (D-221): en la portada, un juego, La Copa, un juego suelto y `/records/`, Chrome registra `/sw.js` con alcance `/`, lee el manifest sin errores y deja instalar. En los cuatro idiomas, en la portada y en un juego, revisa que la app se llame con el `appTitle` del idioma, en el manifest y en el `apple-mobile-web-app-title` (D-222). Contra una copia estampada (`SITIO`) prueba además que el import map no se rompa |
| `compartir-sala.mjs` | Botón de compartir: diálogo nativo si existe, copiar si no |
| `compartir-portada.mjs` | El 📤 de la portada (D-226), en los cuatro idiomas: la tarjeta social del idioma como imagen, el texto con su cabecera y el link a la portada de ese idioma; en un computador, solo el texto copiado y nada descargado |
| `enlace-invitacion.mjs` | Quien llega por un enlace solo puede unirse a esa sala, en los cuatro juegos con sala |
| `sala-error.mjs` | Sin llegar a Firebase: el mensaje de cada juego con sala, Toque y Fama en cada idioma y los demás repartidos entre ellos |
| `idioma-por-url.mjs` | El idioma que viene en el link, en cada idioma: `?lang=`, las puertas (`/en/`, `/pt/`, `/de/`), el puente `/labs/de/` y las invitaciones a sala y a copa |
| `sala-tope.mjs` | Pasado el tope de salas por celular, avisa al instante y sin tocar la red |
| `hangman/idiomas.mjs` | El Ahorcado en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `battleship/idiomas.mjs` | Batalla Naval en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `bulls-and-cows/idiomas.mjs` | Toque y Fama en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `timeline/idiomas.mjs` | Línea de Tiempo en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `liars-dice/idiomas.mjs` | Dudo en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `julep/idiomas.mjs` | Julepe en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `fourth-king/idiomas.mjs` | Cuarto Rey en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |
| `cup-games/idiomas.mjs` | Los juegos sueltos de La Copa en todos los idiomas: cada pantalla de `caminos.mjs` contra el español (D-199) |

## Todos los idiomas (D-199)

Cada juego tiene su `<carpeta>/idiomas.mjs` (`hangman/`, `battleship/`, `bulls-and-cows/`,
`timeline/`, `liars-dice/`, `julep/`, `fourth-king/`, y `cup-games/` para los juegos de La Copa
que se juegan sueltos). Recorren cada pantalla de [`caminos.mjs`](caminos.mjs) en cada idioma de
`LANGS` —un idioma nuevo entra solo— y la comparan con la misma pantalla en español:

- la página está en ese idioma (`<html lang>`) y llega a la misma pantalla;
- no asoma `undefined`, `NaN`, `[object …]` ni un `{marcador}` sin reemplazar;
- no quedó nada en español: ni un texto de los diccionarios (`LOCALES` del juego y `COMMON`) que
  en ese idioma diga otra cosa, ni una línea larga idéntica a la de la pantalla en español, que
  es como se delata un texto escrito a mano fuera de los diccionarios;
- el texto más largo no rompe la pantalla (C-8): sin scroll horizontal, botones bajo 44 px ni
  botones que se salgan por abajo que el español no tenga.

La lógica vive en [`idiomas-comun.mjs`](idiomas-comun.mjs), y cada toma queda como captura
`<pantalla>-<idioma>.png`. Una pantalla nueva para revisar en todos los idiomas se agrega a
`caminos.mjs`, el mismo catálogo que usa `mirar.mjs`; un juego nuevo, con un `idiomas.mjs` de
tres líneas. `cup/idiomas.mjs` hace lo mismo con la portada de La Copa y su formulario.

## De acá salen las capturas del README

Varias de estas tomas son las imágenes que muestra el README. El catálogo
[`docs/capturas.json`](../../docs/capturas.json) dice cuál sale de qué guion y con qué
nombre, y `python3 tools/release/readme.py capturas <seccion>` corre los guiones que hagan falta y
copia los PNG a `docs/screenshots/` (ver D-51). Por eso, al renombrar o sacar una toma de
un guion conviene correr `python3 tools/release/readme.py revisar`: avisa si dejó una imagen huérfana.

Rehacerlas no es revisarlas: después de `capturas`, la hoja de contacto (`contacto.mjs`) las
pone juntas y ahí se ve lo que una imagen sola no delata —una fila más ancha que la de arriba,
una pantalla que no corresponde al pie, algo tapado por el confeti— (D-76).

## Cómo simulan varios celulares

Cada "celular" es una instancia de Chrome con su propio perfil (`dir`) y su propio puerto de
depuración, que elige el sistema. Para que no compartan `localStorage`, cada una usa un origen distinto del mismo
servidor: `localhost`, `127.0.0.1` y `[::1]`. Los scripts "online" hablan con el proyecto de
Firebase real, así que necesitan internet y dejan salas de prueba que caducan a la media hora de quedar quietas (D-89).

## Cuidados

- **Chromes zombis:** cada Chrome muere con su guion, termine como termine: bien, con una
  excepción, con Ctrl-C o con un `kill` (SIGINT, SIGTERM, SIGHUP; `cdp.mjs`). No hace falta
  `pkill`. La única salida que se lo salta es un `kill -9` al proceso de node. Si alguna vez queda
  uno vivo, se busca por **su perfil**, que es la carpeta de salida del guion, y no por el puerto:
  `pgrep -af "user-data-dir=/tmp/e2e/"` para verlo y `pkill -f "user-data-dir=/tmp/e2[e]/"` para
  matarlo (con corchete: sin él, el patrón calza con el propio shell). Nunca
  `pkill -f remote-debugging-port` a secas, que mata las pruebas de todas las sesiones. Un Chrome
  vivo con el mismo perfil hace que el siguiente no abra: `launch` lo dice en el error.
- El `port` que cada guion le pasa a `launch` ya no es un puerto: solo lo usa `PUERTO_CDP` para
  saber qué Chrome es cuál. Un guion que necesite el puerto lo lee de `b.port`.
- En una pestaña oculta el navegador acelera los temporizadores de forma distinta; las esperas
  (`sleep`) están calibradas para headless.

## La Copa

`node tools/e2e/cup/torneo.mjs <salida> [--siete]` juega una Copa de 3 días (o la de 7 con `--siete`) con
tres jugadores en un solo Chrome, con el almacén de prueba y el reloj adelantado día por día. Cada
jugador es la misma pestaña con el `sessionStorage` limpio. Revisa en cada pantalla que no haya
scroll horizontal ni botones bajo 44 px (C-8), y captura el recordatorio, la tabla parcial y el
resumen que compartiría la admin.

`node tools/e2e/cup/idiomas.mjs <salida>` crea una copa en cada idioma que no es el español
(D-170, D-199): revisa que la copa guarde el idioma de sus palabras, que la pantalla siga el idioma
de quien mira (otro, el siguiente de la lista) y que lo que se comparte al grupo salga en el de la
copa, con su `?lang=`. Después abre cinco juegos sueltos en cada idioma (el teclado de Palabra sin
Ñ, la grilla de Conexiones del idioma) y recorre la portada y el formulario de crear contra el
español. Los textos esperados salen de los diccionarios, no están escritos en el guion.

`node tools/e2e/cup/copas-del-jugador.mjs <salida>` prueba que "Tus copas" siga al jugador (D-220):
un celular entra con su jugador y abre una copa en que está sentado; otro celular, que nunca la vio,
entra con el mismo jugador, la encuentra en la portada y al abrirla tiene su nombre ya elegido.
Usa el almacén de prueba de la copa y el de los jugadores.

`node tools/e2e/cup/avisos.mjs [salida]` recorre los avisos de La Copa (D-223) con el almacén de
prueba, la clave VAPID de `vapid.js` (D-225) y un servicio de avisos falso (nada sale del Chrome): la tarjeta y
"Ahora no", la campana que activa los avisos y el aviso de confirmación, los ajustes y "Silenciar
esta copa", los avisos bloqueados, y el camino de iPhone (agregar a inicio, dentro de Instagram, y
los pasos que dan el código de la copa, porque iOS abre la app en la portada, D-227, y la app
instalada que abre con el nombre ya elegido si la dirección lleva `&app=`). También lo que abre un
aviso (D-229): `&dia=<d>` parte en ese día listo para empezar (o en el tablero, si no se puede
jugar) y `&silenciar` silencia la copa. Los botones del aviso en Android se prueban a mano: Chrome
headless no los muestra. Deja capturas de cada hoja.
