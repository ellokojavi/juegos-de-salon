# Diseño: Línea de Tiempo ⏳

**Estado:** implementado (v0.9, los tres modos) · **Fecha:** 2026-09-09 · **Ruta:** `/linea-de-tiempo/` · **Jugadores:** 1 a 6 · **Idiomas:** es, en (“Timeline”), pt (“Linha do Tempo”)

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

## 2a. De dónde salen las cartas (D-32, D-43)

La sección **Cartas** de la configuración ofrece tres formas de repartir, en un selector de una
sola fila con el emoji arriba y el nombre completo debajo (D-52). **Todas a la vista viene elegida
por defecto**, porque es la que más conversación genera y la única que se va poniendo más difícil
sola.

| | Todas a la vista | Pozo común | Mano propia |
|---|---|---|---|
| Cartas | **El doble de la meta**, a la vista de todos desde el primer turno (6, 10 o 14) | Una tira de **6 a la vista de todos** | Cada jugador tiene la suya, privada |
| Al colocar | Sale de la mesa y **no entra ninguna nueva** | Sale de la tira y entra otra **por el final** | La carta sale de tu mano |
| Al fallar | Se descarta y tampoco entra una nueva; no vuelve a la mesa | Se descarta y entra otra por el final; no vuelve a la tira | Descartas y robas una carta nueva |
| Se gana | Colocando primero las cartas acordadas ("Cartas para ganar") | Colocando primero las cartas acordadas | Quedándote sin cartas |
| Si se acaban | La mesa se vacía: gana quien colocó más | El mazo se agota: gana quien colocó más | Gana quien tenga menos cartas |

Una carta fallada no vuelve a la mesa porque el veredicto acaba de mostrar su año a todos: dejarla
ahí sería regalarle el punto al siguiente. En los dos modos compartidos el marcador muestra
`colocadas/meta` en vez de las cartas que quedan, y el ajuste viaja en la `config` de la sala.

Con todas a la vista la mesa solo se achica, así que las cartas difíciles de situar van quedando
para el final, sobre una línea de tiempo que para entonces está llena y deja huecos cada vez más
estrechos: la partida se pone más difícil sola, sin ninguna regla extra. El contador de arriba a la
derecha dice cuántas cartas quedan **en la mesa**, no en el mazo, que en este modo no se usa.

## 2b. Final de la partida y desempate (D-31)

Cuando alguien se queda sin cartas **no** termina la partida: se completa la ronda, de modo que
todos juegan la misma cantidad de turnos. Terminada la ronda gana quien haya quedado sin cartas y,
si son varios, **el que acumuló menos tiempo respondiendo**.

Cada dispositivo mide su propio turno desde que el jugador ve el tablero hasta que confirma, y lo
manda como `ms` en el mensaje `place`; el motor lo suma por jugador. No se muestra durante la
partida: aparece al final, en el ranking, junto a las cartas y los aciertos, en segundos (con una
décima si dos jugadores caen en el mismo segundo). Cada jugada tope de 5 minutos, para que una
interrupción larga no decida el desempate.

## 3. Modos

| Modo | Jugadores | Transporte |
|---|---|---|
| 📱 Un celular | 2 a 6 | `local` |
| 🧍 Jugar solo | 1 | `local` |
| 📡 Varios celulares | 2 a 6 | `firebase` |

En varios celulares, el anfitrión (rol A) crea la sala y abre la partida con el botón **Empezar** cuando hay al menos dos jugadores; el mensaje `start` fija el orden. En la sala de espera, el anfitrión puede **cancelar la sala** y quien se unió puede **salir de la sala**: quien se va a propósito se despide y la sala se borra si no queda nadie (D-50). Cada celular ve solo su mano, y el veredicto de cada jugada se muestra a todos y se cierra solo.

El botón de compartir usa el diálogo nativo del celular y el texto que lo acompaña nombra la temática elegida, para que quien recibe el enlace sepa a qué lo invitan.

En varios celulares hay además un **chat de sala** (canon C-15): una burbuja 💬 con globito de no leídos, disponible en la sala de espera y durante la partida. No aparece sobre el veredicto de una jugada, pero **sí sigue vivo en la pantalla final**, para celebrar o pedir revancha (D-35). No se guarda en ninguna parte: muere con la sala.

En solitario no hay rival: el objetivo es vaciar la mano en la menor cantidad de intentos. Se guarda un
récord personal por temática, tamaño de mano y forma de repartir: las tres formas llevan su propio
récord y no se comparan. Con todas a la vista se puede terminar sin lograrlo, si la mesa se vacía
antes de llegar a la meta; en ese caso la pantalla final lo dice y no se guarda récord. Se descartó
jugar contra una IA porque la máquina conoce los años y la partida no tenía sentido (D-27).

## 4. Estado y protocolo

Todo el estado se deriva de **la semilla del mazo más la lista de jugadas**. Como las cartas y sus
años están en el código, cada dispositivo calcula el resultado de una jugada por su cuenta: no hacen
falta mensajes de respuesta.

```jsonc
{ "t": "hello", "from": "A", "name": "Javi" }
{ "t": "start", "from": "A", "order": ["A","B","C"] }   // solo varios celulares: el anfitrión abre el juego
{ "t": "place", "from": "B", "card": "luna", "slot": 2, "ms": 4200 }   // ranura elegida y cuánto tardó ("at" lo usa el transporte)
{ "t": "rematch", "from": "A", "code": "KXTR" }
{ "t": "chat", "from": "C", "text": "esa iba antes de la luna" }   // solo varios celulares; no es estado
```

- El mazo se baraja con un generador sembrado (`mulberry32`), así que la semilla basta para que
  todos tengan el mismo mazo y el mismo reparto.
- `view()` deriva: manos, línea de tiempo, pozo, turno, aciertos y errores, tiempo por jugador y ganador.
- Jugadas fuera de turno, repetidas o con cartas que no están en la mano se descartan en el reductor.
- `chat` es la excepción: el reductor lo dibuja y lo olvida, y avisa que **no** hay que volver a dibujar la partida. Si el chat se redibujara con el juego, cada mensaje recibido borraría lo que el jugador está escribiendo.

## 5. Interfaz

- **Línea vertical**, de lo más antiguo arriba a lo más reciente abajo, que es lo natural al leer en
  un celular. Cada hito es una fila con año, emoji y título. Entre filas hay **ranuras tocables**;
  también hay ranura antes de la primera y después de la última.
- Arriba, la **carta en juego** grande, con emoji y título, sin año.
- El veredicto se dirige a quien jugó: “¡Te equivocaste!” para el que falló y “¡Cata se equivocó!” para el resto, con el fondo rojo solo en la pantalla del que falló (D-36).
- Nada viene preseleccionado: hasta que el jugador toca una carta, las ranuras no reaccionan y el botón de confirmar está deshabilitado (D-38). El botón nombra la carta que va a colocar.
- La carta elegida se marca en la propia mano (borde amarillo, el resto atenuado) y aparece dibujada dentro de la ranura elegida antes de confirmar. Se toca una ranura y luego **📍 Colocar aquí** (C-8), botón que flota abajo. Hubo una barra aparte que repetía la carta elegida sobre la línea; se quitó por redundante (D-33).
- Al confirmar, la carta se revela con su año. Un **acierto** se muestra un par de segundos y se cierra solo.
  Un **error** tiñe la pantalla de rojo, sacude la carta, suena distinto y explica entre qué hitos iba y entre
  cuáles se puso; se queda hasta que el jugador toca. Mientras tanto, el celular no juega y las jugadas de
  otros esperan.
- La línea larga vive en un contenedor con su propio desplazamiento vertical, y salta sola a la zona
  donde quedó la última carta.
- Marcador con las cartas que le quedan a cada jugador.
- En modo un celular, entre turnos aparece el resultado y **“Pásale el celular a X”** (C-9).

## 6. Contenido

Seis temáticas, cada una en su archivo dentro de `decks/`:

| Temática | Archivo | Cartas | De qué va |
|---|---|---|---|
| 📜 Historia | `historia.js` | 98 | Hitos de la humanidad |
| 🎵 Música | `musica.js` | 89 | De Beethoven a TikTok |
| 🇨🇱 Chile | `chile.js` | 127 | Del terremoto del 60 al estallido |
| 🍿 Cultura pop | `pop.js` | 110 | Cine, memes y videojuegos |
| 🇧🇷 Brasil | `brasil.js` | 140 | De Cabral a la COP30, con novelas y carnaval |
| ⚽ Fútbol | `futbol.js` | 123 | Mundiales, clubes, goles y fichajes |

```js
{ id: 'luna', year: 1969, emoji: '🚀', es: 'El hombre llega a la Luna', en: 'First Moon landing', pt: 'O homem chega à Lua' }
```

- Hitos **reconocibles**, con años indiscutibles: si la fecha se discute, la carta no entra.
- Y que se puedan **situar**: nada de “un gran incendio” o “manifestaciones” a secas, porque eso pasa cada pocos años. Superlativo, nombre propio o cifra que ancle el año (D-37).
- Cada mazo trae al menos noventa cartas, bien repartidas en el tiempo.
- Los mazos se registran en `decks/index.js` con su nombre, su pista y su emoji por idioma. Además el
  archivo nuevo tiene que sumarse a `MODULES` en `tools/set-version.py`, o el import map no lo versiona
  y el navegador puede mezclar un índice nuevo con un mazo en caché (C-11). Nada más hay que tocar:
  la grilla de temáticas se dibuja sola a partir del registro.
- El test del motor exige por carta `id` único, `year` numérico entre -4000 y 2026, `emoji` y los tres
  idiomas, y rechaza el apóstrofo recto en `pt` (se usa ’).
- Los mazos temáticos (Brasil, Fútbol) pueden repetir hitos de otros mazos (el Maracanazo, el Mundial
  del 62): cada mazo se juega solo, así que no hay choque de ids mientras lleven su prefijo (`br-`, `fut-`).

### Que no se repitan las cartas (D-34)
Cada celular recuerda las cartas que ha visto por temática (`juegos-de-salon:linea-de-tiempo:vistas`).
Al armar una partida, las más recientes se excluyen del mazo y la lista viaja en `config.skip`, así
todos los celulares de la sala excluyen exactamente lo mismo y el estado sigue derivándose de la
config más las jugadas (canon C-7). Siempre quedan al menos 70 cartas disponibles para repartir.

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
