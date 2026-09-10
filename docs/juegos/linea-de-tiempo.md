# Diseño: Línea de Tiempo ⏳

**Estado:** implementado (v0.9, los tres modos) · **Fecha:** 2026-09-09 · **Ruta:** `/linea-de-tiempo/` · **Jugadores:** 1 a 6 · **Idiomas:** es, en (“Timeline”)

## 1. Resumen

Cuarto juego de la app y el primero **colectivo sin alcohol**: cada jugador recibe cartas con hitos
(sin año) y debe ubicarlas en el lugar correcto de una línea de tiempo común. Gana quien se queda
sin cartas. Se elige una **temática** al empezar; la primera versión trae **Historia** y **Música**,
y el mazo es un archivo de datos, así que agregar temáticas es solo contenido.

Sigue los [cánones](../CANONES.md). Dos diferencias respecto de los juegos anteriores, ambas por la
naturaleza del juego:

- **No hay información secreta** (C-10 no aplica): las manos no revelan años, así que nadie gana nada
  mirando la pantalla ajena. En modo un celular no hace falta tapar la pantalla, solo anunciar el turno.
- **Admite hasta seis jugadores en todos los modos**, también en dos celulares, lo que obliga a
  ampliar los roles de sala de A–B a A–F.

## 2. Reglas

| Regla | Decisión |
|---|---|
| Objetivo | Quedarse sin cartas colocándolas en el lugar correcto de la línea. |
| Mano inicial | 5 cartas. Configurable: corta 3, normal 5, larga 7. |
| Inicio | Una carta del mazo se pone al centro como primer hito, con su año a la vista. |
| Turno | El jugador ve una de sus cartas (sin año) y elige la ranura donde cree que va. |
| Acierto | La carta entra en la línea con su año. La mano baja en uno. |
| Error | La carta se descarta y el jugador **roba una nueva** del pozo. La mano no baja. |
| Fin | Gana quien coloca su última carta correctamente. Si el pozo se agota, gana quien tenga menos cartas; si hay empate, ganan todos los empatados. |
| Empates de año | Dos hitos del mismo año se aceptan en cualquier orden entre ellos. |
| Temática | Historia o Música. Se elige al configurar y define el mazo. |

## 3. Modos

| Modo | Jugadores | Transporte |
|---|---|---|
| 📱 Un celular | 2 a 6 | `local` |
| 🧍 Jugar solo | 1 | `local` |
| 📡 Varios celulares | 2 a 6 | `firebase` |

En varios celulares, el anfitrión (rol A) crea la sala y abre la partida con el botón **Empezar** cuando hay al menos dos jugadores; el mensaje `start` fija el orden. Cada celular ve solo su mano, y el veredicto de cada jugada se muestra a todos y se cierra solo.

En varios celulares hay además un **chat de sala** (canon C-15): una burbuja 💬 con globito de no leídos, disponible en la sala de espera y durante la partida. No aparece sobre el veredicto de una jugada ni en la pantalla de resultado, y no se guarda: muere con la partida.

En solitario no hay rival: el objetivo es vaciar la mano en la menor cantidad de intentos. Se guarda un
récord personal por temática y tamaño de mano. Se descartó jugar contra una IA porque la máquina conoce
los años y la partida no tenía sentido (D-27).

## 4. Estado y protocolo

Todo el estado se deriva de **la semilla del mazo más la lista de jugadas**. Como las cartas y sus
años están en el código, cada dispositivo calcula el resultado de una jugada por su cuenta: no hacen
falta mensajes de respuesta.

```jsonc
{ "t": "hello", "from": "A", "name": "Javi" }
{ "t": "start", "from": "A", "order": ["A","B","C"] }   // solo varios celulares: el anfitrión abre el juego
{ "t": "place", "from": "B", "card": "luna", "slot": 2 }   // carta y ranura elegida ("at" lo usa el transporte)
{ "t": "rematch", "from": "A", "code": "KXTR" }
{ "t": "chat", "from": "C", "text": "esa iba antes de la luna" }   // solo varios celulares; no es estado
```

- El mazo se baraja con un generador sembrado (`mulberry32`), así que la semilla basta para que
  todos tengan el mismo mazo y el mismo reparto.
- `view()` deriva: manos, línea de tiempo, pozo, turno, aciertos y errores, ganador.
- Jugadas fuera de turno, repetidas o con cartas que no están en la mano se descartan en el reductor.
- `chat` es la excepción: el reductor lo dibuja y lo olvida, y avisa que **no** hay que volver a dibujar la partida. Si el chat se redibujara con el juego, cada mensaje recibido borraría lo que el jugador está escribiendo.

## 5. Interfaz

- **Línea vertical**, de lo más antiguo arriba a lo más reciente abajo, que es lo natural al leer en
  un celular. Cada hito es una fila con año, emoji y título. Entre filas hay **ranuras tocables**;
  también hay ranura antes de la primera y después de la última.
- Arriba, la **carta en juego** grande, con emoji y título, sin año.
- La carta elegida queda **fija en una barra sobre la línea** mientras se busca la ranura, con la mano atenuada detrás; tocar la barra vuelve a la mano. Se toca una ranura y luego **📍 Colocar aquí** para confirmar (C-8), botón que flota abajo.
- Al confirmar, la carta se revela con su año. Un **acierto** se muestra un par de segundos y se cierra solo.
  Un **error** tiñe la pantalla de rojo, sacude la carta, suena distinto y explica entre qué hitos iba y entre
  cuáles se puso; se queda hasta que el jugador toca. Mientras tanto, el celular no juega y las jugadas de
  otros esperan.
- La línea larga vive en un contenedor con su propio desplazamiento vertical, y salta sola a la zona
  donde quedó la última carta.
- Marcador con las cartas que le quedan a cada jugador.
- En modo un celular, entre turnos aparece el resultado y **“Pásale el celular a X”** (C-9).

## 6. Contenido

`decks/historia.js` y `decks/musica.js`, con la forma:

```js
{ id: 'luna', year: 1969, emoji: '🚀', es: 'El hombre llega a la Luna', en: 'First Moon landing' }
```

- Hitos **universales y reconocibles**, con años indiscutibles.
- Cada mazo trae al menos noventa cartas, bien repartidas en el tiempo.
- Los mazos se registran en `decks/index.js` con su nombre por idioma y su emoji, que es lo único que
  hay que tocar para agregar una temática nueva.

### Tipografía de los años
Los años (y las cartas que le quedan a cada jugador) van en Nunito 900 con `tabular-nums`, no en
Bangers: ahí el 1 y el 7 son casi el mismo trazo y un 1917 se puede leer como 1911 (D-30, canon C-1).

## 7. Archivos

```
linea-de-tiempo/
  index.html · style.css · rules.js (LOCALES es/en, config) · engine.js + engine.test.mjs · game.js
  decks/index.js · decks/historia.js · decks/musica.js
```

Del lado compartido usa `assets/js/chat.js` (chat de sala) montado en `<div id="chat">`, hermano de `#handoff`.

## 8. Plan

| Fase | Contenido |
|---|---|
| 1 | Mazos, motor con tests, un celular y contra el celular |
| 2 | Varios celulares (roles A–F, reglas de Firebase ampliadas, anfitrión que abre el juego) |
| 3 | Sonidos, capturas, documentación |

## 8b. Estado de la implementación (v0.8)
- Fase 1 lista: mazos de Historia (98 cartas) y Música (89), motor con tests, modo un celular de 2 a 6 jugadores y modo solitario con récord (v0.9.2; antes había una IA, ver D-27).
- Memoria de partida en ambos modos (canon C-6), incluida la selección de temática.
- Fase 2 lista (v0.9): varios celulares de 2 a 6 con sala, QR, lobby con la lista de quienes van llegando, botón de empezar del anfitrión, reconexión, presencia y revancha que mueve a todos a la sala nueva.
- Reglas de Firebase ampliadas de A–B a A–F.
- Lecciones aprendidas:
  - `at` es un campo reservado del transporte, así que la ranura viaja como `slot` (ver C-7).
  - Con más de dos jugadores, dos personas pueden reclamar el mismo rol a la vez. El transporte ahora escribe el rol con un identificador de dispositivo y vuelve a leer para confirmar quién ganó la carrera.

### Chat de sala (v0.10)
- Solo en varios celulares, en la sala de espera y en la partida. Texto, 120 caracteres, un mensaje cada 1,2 s, últimos 60 en pantalla.
- Se cierra solo cuando llega el turno del jugador, salvo que tenga algo escrito.
- Con el chat cerrado, cada mensaje nuevo se asoma 4,2 s en una etiqueta al lado de la burbuja (nombre y texto, dos líneas como máximo). Tocarla abre el chat; llega otro y manda el último.
- Al reconectar se recupera la conversación desde la sala, sin sonido ni globito (los mensajes de los primeros 1,5 s se consideran historia).
- El teclado del celular no achica la ventana: el panel se levanta con `visualViewport` y el campo usa 16 px para que iOS no haga zoom.
- Prueba: `node tools/e2e/linea-de-tiempo-chat.mjs <carpeta>`.

## 9. Variantes futuras
Más temáticas (cine, deporte, ciencia, Chile), mazo musical con adelantos de audio del catálogo de
iTunes (el audio es gratis y sin cuenta, pero los años vienen de la reedición y hay que curarlos),
modo por equipos, y cartas con pista para los hitos menos conocidos.
