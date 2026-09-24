# Pruebas de punta a punta (Chrome headless por CDP)

Scripts que juegan partidas completas en Chrome headless, sin dependencias de npm: usan el
protocolo de depuración de Chrome por WebSocket (`cdp.mjs`). Cada script recibe una carpeta
de salida donde deja capturas PNG, e imprime en consola lo que verificó.

## Requisitos

- Google Chrome instalado en `/Applications/Google Chrome.app` (ruta en `cdp.mjs`).
- Node 20 o superior (usa `fetch` y `WebSocket` nativos).
- El sitio servido en `http://localhost:8765`:

```bash
python3 -m http.server 8765
```

## Uso

```bash
mkdir -p /tmp/e2e && node tools/e2e/batalla-naval-local.mjs /tmp/e2e
```

`mirar.mjs` no es una prueba: abre una pantalla suelta para revisarla de a una, sin jugar la
partida. `node tools/e2e/mirar.mjs ahorcado juego --ancho 320` saca la captura y avisa si hay
scroll horizontal o botones bajo 44 px (C-8).

`contacto.mjs` tampoco: arma una hoja con **todas** las capturas del README de una sección,
al tamaño en que el README las muestra, para mirarlas juntas antes de publicar (D-76).

```bash
node tools/e2e/contacto.mjs cuarto-rey --salida /tmp/contacto
```

| Script | Qué prueba |
|---|---|
| `cuarto-rey.mjs` | Botón de sonido, mazo completo hasta el cuarto rey y el menú en inglés |
| `toque-y-fama-local.mjs` | Un celular y contra el celular, hasta el resultado |
| `toque-y-fama-online.mjs` | Dos celulares contra Firebase real: unión por URL, recarga a mitad, revancha |
| `batalla-naval-local.mjs` | Colocación, batalla en un celular y contra el celular |
| `batalla-naval-colocacion.mjs` | Seleccionar, girar, mover y deseleccionar barcos en la grilla |
| `batalla-naval-alineacion.mjs` | Que los números de fila queden alineados con las casillas en tres anchos |
| `batalla-naval-online.mjs` | Dos celulares contra Firebase real, con recarga y revancha |
| `ahorcado-local.mjs` | Cadena de tres en un celular, comprar una letra, retomar y el solitario |
| `ahorcado-online.mjs` | Tres celulares contra Firebase real: cadena, reconexión a mitad y revancha |
| `dudo-local.mjs` | Duelo contra el celular y partida de tres en un celular, con retomar a mitad |
| `dudo-online.mjs` | Tres celulares contra Firebase real: sala, destape verificado, recarga a mitad y revancha |
| `julepe-local.mjs` | Mesa de tres contra el celular y partida en un celular, con retomar a mitad |
| `julepe-online.mjs` | Tres celulares contra Firebase real: reparto cerrado, sello de cartas verificadas, recarga a mitad y chat |
| `linea-de-tiempo-local.mjs` | Un celular con tres jugadores y solitario |
| `linea-de-tiempo-solo.mjs` | Solitario: récord, plural, retomar |
| `linea-de-tiempo-error.mjs` | Pantalla de error que se queda hasta tocar; el rival espera |
| `linea-de-tiempo-online.mjs` | Tres celulares contra Firebase real, recarga y revancha |
| `toque-y-fama-chat.mjs` | Chat de sala en Toque y Fama: no leídos, etiqueta, y que muera con la partida |
| `linea-de-tiempo-eleccion.mjs` | Que se coloque la carta elegida y que sin elegir no se pueda colocar nada |
| `linea-de-tiempo-veredicto.mjs` | Que el veredicto hable en tercera persona cuando se equivocó otro |
| `linea-de-tiempo-mazos.mjs` | Todas las temáticas y que diez partidas seguidas no repitan cartas |
| `linea-de-tiempo-pozo.mjs` | Pozo común: tira de 6, reposición por el final, meta y ajuste que viaja en la sala |
| `linea-de-tiempo-mesa.mjs` | Todas a la vista: mesa del doble de la meta, sin reposición, y solitario que se queda sin cartas |
| `linea-de-tiempo-arrastre.mjs` | El gesto de arrastrar con eventos táctiles: elegir sin colocar, retomar, soltar fuera y desliz lateral |
| `linea-de-tiempo-empate.mjs` | Que la ronda se termine y que el empate lo gane el más rápido |
| `linea-de-tiempo-chat.mjs` | Chat de sala: no leídos, freno al spam, veredicto que lo tapa, reconexión y muerte al terminar |
| `memoria-de-partida.mjs` | Guardar y retomar en los tres juegos (canon C-6) |
| `versionado.mjs` | Que todos los módulos carguen con `?v=` del import map |
| `compartir-sala.mjs` | Botón de compartir: diálogo nativo si existe, copiar si no |
| `enlace-invitacion.mjs` | Quien llega por un enlace solo puede unirse a esa sala, en los cuatro juegos con sala |
| `sala-error.mjs` | Sin llegar a Firebase: el mensaje se ve en los cuatro juegos con sala y en los tres idiomas |
| `idioma-por-url.mjs` | El idioma que viene en el link: `?lang=`, las puertas `/pt/` y `/en/`, y la invitación |
| `sala-tope.mjs` | Pasado el tope de salas por celular, avisa al instante y sin tocar la red |

## De acá salen las capturas del README

Varias de estas tomas son las imágenes que muestra el README. El catálogo
[`docs/capturas.json`](../../docs/capturas.json) dice cuál sale de qué guion y con qué
nombre, y `python3 tools/readme.py capturas <seccion>` corre los guiones que hagan falta y
copia los PNG a `docs/screenshots/` (ver D-51). Por eso, al renombrar o sacar una toma de
un guion conviene correr `python3 tools/readme.py revisar`: avisa si dejó una imagen huérfana.

Rehacerlas no es revisarlas: después de `capturas`, la hoja de contacto (`contacto.mjs`) las
pone juntas y ahí se ve lo que una imagen sola no delata —una fila más ancha que la de arriba,
una pantalla que no corresponde al pie, algo tapado por el confeti— (D-76).

## Cómo simulan varios celulares

Cada "celular" es una instancia de Chrome con su propio perfil (`dir`) y su propio puerto de
depuración. Para que no compartan `localStorage`, cada una usa un origen distinto del mismo
servidor: `localhost`, `127.0.0.1` y `[::1]`. Los scripts "online" hablan con el proyecto de
Firebase real, así que necesitan internet y dejan salas de prueba que caducan a la media hora de quedar quietas (D-89).

## Cuidados

- **Chromes zombis:** si un script falla a medias, su Chrome puede quedar vivo escuchando en su
  puerto, y el siguiente script se conectaría a esa instancia vieja (con código viejo cargado).
  Antes de repetir: `pkill -f remote-debugging-port`. `cdp.mjs` ya cierra Chrome ante
  excepciones no capturadas, pero no ante un `kill` del proceso de node.
- Los puertos están fijos dentro de cada script (rango 93xx a 94xx); si dos scripts corren a la
  vez deben usar puertos distintos.
- En una pestaña oculta el navegador acelera los temporizadores de forma distinta; las esperas
  (`sleep`) están calibradas para headless.

## La Copa

`node tools/e2e/copa.mjs <salida> [--siete]` juega una Copa de 3 días (o la de 7 con `--siete`) con
tres jugadores en un solo Chrome, con el almacén de prueba y el reloj adelantado día por día. Cada
jugador es la misma pestaña con el `sessionStorage` limpio. Revisa en cada pantalla que no haya
scroll horizontal ni botones bajo 44 px (C-8), y captura el recordatorio, la tabla parcial y el
resumen que compartiría la admin.
