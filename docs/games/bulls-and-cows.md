# Especificación: Toque y Fama 🔢

**Ruta:** `/bulls-and-cows/` (id `toque-y-fama`) · **Jugadores:** 1–2 · **Desde:** v0.4 · **Estado:** publicado (v0.4) · **Idiomas:** es, en (“Bulls and Cows”), pt (“Toque e Fama”) y de (“Bullen und Kühe”, D-191, D-197)

## Resumen

El Mastermind con números de la mesa chilena: cada jugador piensa un número de cifras distintas y
trata de adivinar el del rival, que le responde con **famas** (cifra en su lugar) y **toques** (cifra en
otro lugar). El celular calcula las respuestas, así que nadie cuenta mal ni miente. El estudio previo
está en [bulls-and-cows-factibilidad.md](bulls-and-cows-factibilidad.md).

## Reglas

- Cada jugador elige un número secreto de **3, 4 o 5 cifras distintas** (4 por defecto). Cero inicial permitido (configurable). Jugando solo no se configura nada (D-142).
- Por turnos, cada uno intenta adivinar el del rival. El celular responde solo: **fama** = cifra correcta en su posición, **toque** = cifra correcta en otra posición.
- Gana quien llega a todas las famas. Con **derecho a réplica** (por defecto), si acierta quien partió, el otro tiene un último intento; si también acierta, empate.
- **Quién parte:** el invitado (B) en la primera partida; en la revancha, el perdedor (D-19).
- **📡 Two phones: both at once (D-367).** There are no turns: each guesses at their own pace. Whoever cracks it waits for the rival, watching their board, and the final screen comes when both have it. Fewer guesses wins; the same number is a tie. No right of reply (its switch only shows on one phone). The rules above about turns, right of reply and who starts apply to 📱 one phone.

### Vocabulario en pantalla

En los tableros las pistas van abreviadas (“3F 1T”, en inglés “3B 1C”) para caber en una línea; en la pantalla grande de respuesta y en las instrucciones se usan las palabras completas. Las famas van en verde y los toques en amarillo, como en Wordle, y "nada" en gris: los mismos colores en el tablero, en la respuesta grande, en 🔤 Palabra y en la tarjeta para compartir (🟢 🟡 ⚪; #196, `assets/css/teclado.css`). Siempre se habla de “número secreto” (en inglés, “secret number”), nunca de “secreto” a secas.

## Modos

| Modo | Cómo | Transporte |
|---|---|---|
| 📱 Un celular, dos jugadores | Cada uno ingresa su secreto con la pantalla tapada; tras cada intento aparece, en una sola pantalla, la respuesta (toques y famas) y debajo “Pásale el celular a X”. | `public/assets/js/transport/local.js` (memoria) |
| 🧍 Jugar solo | Es el juego 🔢 “Toque y Fama: adivina el número” de La Copa (D-142): 4 cifras distintas (puede empezar con cero), 10 intentos y puntaje de 0 a 100 con reloj de tiempo activo. Sin configuración. Ver “Jugar solo” más abajo. | Sin transporte: `public/cup/games/number/ui.js` montado con `public/cup/games/solo.js` |
| 📡 Dos celulares | Sala con código de 4 letras y QR (`?room=CODE`). Cada celular calcula las respuestas contra su propio secreto. | `public/assets/js/transport/firebase.js` (Realtime Database) |

**Rankings (D-215):** con un jugador de los rankings abierto en el celular (nombre y PIN,
D-212, abiertos a todos desde D-217), cada partida terminada se cuenta en `jugadores/<jid>/juegos/toque-y-fama`
y, si ganó, suma una victoria en la tabla `toque-y-fama_victorias` (semana y siempre): en sala, la de su
rol; contra el celular, la del humano; en un celular, la del jugador que se llama como él. Un
empate no es victoria. La tabla (semana, siempre y amigos) va en la intro, debajo de los modos
(`finDePartida` y `bloqueVictorias` de `public/assets/js/ranking.js`), y en `/records/`. Sin jugador
abierto (D-274), `finDePartida` pone en la pantalla final, después de los botones (`#result-actions`),
"¿Quieres que esta partida cuente en el ranking?" con el nombre y PIN de siempre y el nombre de su
rol ya puesto: al entrar, se anota esa partida y la victoria, si fue suya. Jugar solo tiene su propio
ranking (ver abajo).

### Jugar solo (D-142)

Hasta D-142 el modo solo pasaba por el reductor con un bot B que elegía el número, con cifras y cero
configurables, intentos ilimitados y récord por menos intentos (D-129). Ahora es exactamente el
juego 🔢 de La Copa, con sus reglas, su pantalla y su puntaje, pero en el idioma de quien juega:

- **Reglas:** 4 cifras distintas, puede empezar con cero, 10 intentos. Score from 0 to 100 (D-453):
  start at 100, 15 off for each guess the earlier clues had already ruled out (`descartado()`), never
  below 10 if solved, 0 if not (`puntaje` in `public/cup/games/number/engine.js`). The finished board
  marks each ruled-out guess with ⚠️ and says what each one cost; never while playing. Until D-453 it
  was 100 on the first guess and 10 less for each one after it (D-113).
- **Número:** sale de un código de 5 letras al azar (`codigoAlAzar` de `public/cup/code.js`, D-377) con
  `numero.generar(codigo, 1)`. No hay secreto que guardar ni que verificar.
- **Pantallas:** una previa con “Cómo se juega” (3 puntos), cómo se calcula el puntaje, el récord y
  Empezar; la del juego (`#screen-solo`) con el título y el reloj arriba y `ui-numero` montado por
  `jugarSolo` (el reloj solo corre con la pantalla visible, D-95, y se detiene al terminar el
  tablero); y el resultado propio: puntaje X/100, intentos y tiempo, récord, número secreto, la
  tarjeta de emojis (🟢 fama, 🟡 toque, ⚪ nada; con más de 5 intentos va en dos columnas para que
  los botones se vean sin desplazar en 812 px), el repaso colapsado y Jugar otra vez, Cambiar modo
  y Volver al menú. Confeti y sonido de victoria si lo saca; sonido de tiempo si no.
- **Textos:** los de `LOCALES` del juego. `ui-numero` lee `solved`, `notSolved`, `triesLeft`,
  `tryLeft1`, `seeResults` y `yourGuesses`; la ayuda del teclado es la del juego (`blockHint`: "Mantén apretada
  una cifra para tacharla") pasada como `blockHintDigits`.
- **Memoria (C-6):** `{ mode: 'solo', codigo, jugadas: { i, n }, ms, done }` en el mismo
  `createSessionStore`, al empezar, tras cada intento o nota y al ocultar la pantalla. Al retomar se
  vuelve a montar con las jugadas y el tiempo. Una partida guardada del solo viejo (con `messages`
  y sin `codigo`) no se ofrece.
- **Récord:** el mejor `{ s, ms }` en `juegos-de-salon:toque-y-fama:record-solo` (`crearRecord`):
  más puntos y, a igualdad, menos tiempo. Un 0 no se anota. La clave vieja (`…:record`, por
  intentos) queda sin uso.
- **Ranking (D-215):** la tabla `toque-y-fama_solo`, con el mismo 0–100 y el tiempo, debajo de
  Empezar, al pie del resultado y en la portada del juego, arriba de las victorias (D-274: es como
  más se juega). En el resultado, con un jugador de los rankings abierto, el aviso de los rankings
  (`avisoPartida`) reemplaza al récord del celular; sin jugador, después de los botones va
  "¿Quieres que esta partida cuente?" con nombre y PIN, y al entrar se anota esa partida (D-274).
  No suma al Todoterreno.
- **Panel:** `trackStart({ game, mode: 'solo', players: 1 })` al empezar, no al retomar.

### Pendientes / ideas

- Modo espectador (leer la sala sin rol).
- Historial de partidas.
- Transporte sin cuenta (PeerJS / QR) como alternativa.

## Flujo

```
Intro (elige modo) → Setup (nombres, cifras, réplica, cero) → [Lobby: código + QR + cancelar la sala] → Secreto → Juego (tableros) → Resultado → Revancha
Jugar solo: Intro → Cómo se juega y puntaje → Juego (teclado, tablero y reloj) → Ver resultado → Resultado → Jugar otra vez
```

### Recordatorio del número propio

En la pantalla de juego aparece una ficha “🔒 Tu número secreto”. En dos celulares se ve directo; en un celular parte oculta (••••) y se muestra al tocarla, porque el celular pasa de mano.

### Cifras tachadas (notas del jugador)

En el teclado de adivinar, una pulsación larga (450 ms) sobre una cifra la tacha: se ve con 🚫, se quita de la entrada actual y el toque corto no la ingresa. Otra pulsación larga la destacha. En pantalla se dice **tachar**, no bloquear (U-5, D-177). El teclado con notas es el compartido, `public/assets/js/teclado.js` (D-102). Las marcas son por jugador (en un celular cada uno tiene las suyas), duran toda la partida, se guardan con la sesión en modo dos celulares y se limpian en la revancha. Bajo el teclado hay una instrucción de una línea para usuarios nuevos.

### Deduction notes (lab, D-483)

#895: with a lab key, a **✏️ Notes** pill sits under the guess keypad. On, a tap on a digit cycles
its mark instead of typing it (none → 🚫 not in it → ? maybe → ★ sure → none), ⌫ and the guess
button are off, and a one-line hint explains the marks; **⌨️ Back to typing** turns it off. 🚫 is the
same strike as the long press (the digit does not type); ? and ★ only mark. The marks are kept in the
same `notes` set as the strikes (`?3`, `★5`), so they last the game wherever strikes already did. No
rule or score change: solo, rooms, Uno al día and La Copa alike. Lab card `#seccion-tyf-notas`;
checked at the end of `tools/e2e/bulls-and-cows/choose-box.mjs`.

### Choosing the box

A player asked for it by email (#604, approved in #607): tapping a box chooses where the next digit
goes, instead of always filling left to right, so a digit whose place is already deduced can be put
there and the others thought around it. The next digit goes to the chosen box, then the first empty
one after it; ⌫ clears the chosen box (or the one before it, if it is empty); a gap in the middle
cannot be confirmed; the 0 still cannot go first when the game forbids it. It is the shared keyboard's
`elegir` option (`teclado.js`), on in Toque y Fama's games, the secret number, playing solo and La
Copa's 🔢, for everyone; the other users of the keyboard do not turn it on. Both were tried in the
lab first (D-409) and the owner published them; their cards are in La Bodega, marked 🚀 Lanzado. The hint under
the keypad says it («Toca una casilla para elegir dónde va la cifra…»). Checked by
`tools/e2e/bulls-and-cows/choose-box.mjs`.

**One card on the home page** (#767, RP-75): 🔤 Palabra (`/word/`) no longer has its own card on the
home page; Toque y Fama's card says "the number or the word", and on the game's
home a two-button toggle under the language picks 🔢 Número or 🔤 Palabra, like a game's variants in
La Copa's waiting room (Loteo, D-331): Palabra opens `/word/`, whose waiting room shows the same toggle
with Palabra on (`selectorTyf` in `public/cup/game.js`), and Número comes back here. Tried in the lab
first (D-409), now for every player; its lab card is in La Bodega, marked 🚀 Lanzado.

### Repaso al final

Bajo “Los números secretos eran” hay un desplegable “🔎 Ver todos los intentos”, colapsado por defecto (una línea de alto, para que Revancha, Cambiar modo y Volver al menú queden a la vista en un celular de 812 px), con los tableros completos de ambos jugadores.

### Tipografía de las cifras

Todo lo que es número (teclado, casillas de entrada, intentos, pistas, número secreto propio y
números revelados al final) va en Nunito 900 con `tabular-nums`, no en Bangers: en Bangers el 1 y
el 7 son casi el mismo trazo y los jugadores se equivocaban al teclear (D-30, canon C-1). Los
títulos, los nombres y el botón de probar siguen en Bangers.

## Protocolo de mensajes

Vale para un celular y dos celulares; jugando solo no hay mensajes.

```jsonc
{ "t": "hello",   "from": "A", "name": "Javi" }
{ "t": "commit",  "from": "A", "hash": "sha256(secreto+sal)" }
{ "t": "guess",   "from": "A", "round": 0, "value": "4071" }
{ "t": "reply",   "from": "B", "round": 0, "famas": 1, "toques": 2 }
{ "t": "reply",   "from": "B", "of": "A", "n": 0, "famas": 1, "toques": 2 }   // two phones (D-367): names the guess by player and number
{ "t": "reveal",  "from": "A", "secret": "1234", "salt": "…" }
{ "t": "rematch", "from": "B", "code": "KXTR" }      // solo dos celulares
{ "t": "chat",    "from": "B", "text": "no le achuntas ni una" }   // solo dos celulares; no es estado
```
El estado (`view()`) se deriva de la lista de mensajes: fase (`lobby`, `secret`, `play`, `reveal`, `done`), turno esperado, intento pendiente, resultado y réplica. Mensajes fuera de turno o duplicados se ignoran.

### Firebase (modo dos celulares)

- Sala: `rooms/<CODE>` con `createdAt`, `game`, `config`, `players/{A,B}` (nombre, online) y `messages/<pushId>` (append-only).
- Creación en dos pasos (sala, luego jugador) por las reglas de seguridad; salas válidas mientras se juegue (media hora quieta y vencen; seis horas de tope).
- El lobby tiene botón para cancelar la sala: quien se va a propósito se despide y la sala se borra si no queda nadie (D-50).
- Reconexión: el secreto y el rol se guardan en `localStorage` (`juegos-de-salon:tyf:session`); al abrir `?room=CODE` o “Continuar” se retoma.
- Revancha: quien la propone crea una sala nueva (queda como A) y avisa con `rematch`; el otro se une como B.
- Presencia con `onDisconnect`; si el rival se desconecta, se avisa en pantalla.

### Chat de sala (solo dos celulares)

Burbuja 💬 con globito de no leídos, disponible desde la sala de espera y durante toda la partida
(también mientras cada uno elige su número secreto, que es puro tiempo muerto). Usa el módulo
compartido `public/assets/js/chat.js` montado en `<div id="chat">`, hermano de `#handoff` (canon C-15).
Sigue vivo en la pantalla de resultado, para celebrar o pedir revancha (D-35), y no se guarda en ninguna parte: muere con la sala. Al reconectar, la
conversación vuelve desde la sala, sin sonido ni globito. Se cierra solo cuando llega tu turno,
salvo que estés escribiendo. Con el chat en pantalla, la pantalla de juego deja aire abajo para
que la burbuja no tape el último intento.

## Archivos

```
public/bulls-and-cows/
  index.html · style.css · rules.js (LOCALES es/en/pt/de, config por defecto)
  engine.js (score, isValid, randomSecret, sha256, verifyPlayer) · engine.test.mjs
  game.js (reductor, agentes locales, render; jugar solo con public/cup/games/number/ui.js y solo.js)
firebase/database.rules.json · public/assets/js/firebase-config.js
```
Tests del motor: `node public/bulls-and-cows/engine.test.mjs`.

Gancho de pruebas (C-14): `window.__tyf` (`view`, `match`, `session`, `guardada`).

## Excepciones a los cánones

Ninguna.

El anti-trampa es el de C-10: compromiso `sha256(secreto + sal privada)` al inicio; al final se revelan
secreto y sal, se verifica el hash y se recalculan todas las respuestas del rival. Resultado en
pantalla: “verificado ✅” o “⚠️ no coincide”. Jugando solo no hay secreto que comprometer: el número
lo elige el celular.
