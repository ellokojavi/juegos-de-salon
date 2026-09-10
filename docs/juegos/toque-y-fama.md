# Especificación: Toque y Fama 🔢

**Ruta:** `/toque-y-fama/` · **Jugadores:** 2 · **Versión:** 0.4 · **Idiomas:** es, en (“Bulls and Cows”)

## Reglas implementadas
- Cada jugador elige un número secreto de **3, 4 o 5 cifras distintas** (4 por defecto). Cero inicial permitido (configurable).
- Por turnos, cada uno intenta adivinar el del rival. El celular responde solo: **fama** = cifra correcta en su posición, **toque** = cifra correcta en otra posición.
- Gana quien llega a todas las famas. Con **derecho a réplica** (por defecto), si acierta quien partió, el otro tiene un último intento; si también acierta, empate.
- **Quién parte:** el invitado (B) en la primera partida; en la revancha, el perdedor (D-19).

## Modos
| Modo | Cómo | Transporte |
|---|---|---|
| 📱 Un celular, dos jugadores | Cada uno ingresa su secreto con la pantalla tapada; tras cada intento aparece, en una sola pantalla, la respuesta (toques y famas) y debajo “Pásale el celular a X”. | `assets/js/transport/local.js` (memoria) |
| 🤖 Contra el celular | Duelo: el jugador adivina el número del celular mientras el celular (solver por eliminación) adivina el suyo. | `assets/js/transport/local.js` + bot |
| 📡 Dos celulares | Sala con código de 4 letras y QR (`?sala=CODE`). Cada celular calcula las respuestas contra su propio secreto. | `assets/js/transport/firebase.js` (Realtime Database) |

## Recordatorio del número propio
En la pantalla de juego aparece una ficha “🔒 Tu número secreto”. En dos celulares y contra el celular se ve directo; en un celular parte oculta (••••) y se muestra al tocarla, porque el celular pasa de mano.

## Flujo
```
Intro (elige modo) → Setup (nombres, cifras, réplica, cero) → [Lobby: código + QR] → Secreto → Juego (tableros) → Resultado → Revancha
```

## Protocolo de mensajes (todos los modos)
```jsonc
{ "t": "hello",   "from": "A", "name": "Javi" }
{ "t": "commit",  "from": "A", "hash": "sha256(secreto+sal)" }
{ "t": "guess",   "from": "A", "round": 0, "value": "4071" }
{ "t": "reply",   "from": "B", "round": 0, "famas": 1, "toques": 2 }
{ "t": "reveal",  "from": "A", "secret": "1234", "salt": "…" }
{ "t": "rematch", "from": "B", "code": "KXTR" }      // solo dos celulares
{ "t": "chat",    "from": "B", "text": "no le achuntas ni una" }   // solo dos celulares; no es estado
```
El estado (`view()`) se deriva de la lista de mensajes: fase (`lobby`, `secret`, `play`, `reveal`, `done`), turno esperado, intento pendiente, resultado y réplica. Mensajes fuera de turno o duplicados se ignoran.

## Firebase (modo dos celulares)
- Sala: `rooms/<CODE>` con `createdAt`, `game`, `config`, `players/{A,B}` (nombre, online) y `messages/<pushId>` (append-only).
- Creación en dos pasos (sala, luego jugador) por las reglas de seguridad; salas válidas 6 horas.
- Reconexión: el secreto y el rol se guardan en `localStorage` (`juegos-de-salon:tyf:session`); al abrir `?sala=CODE` o “Continuar” se retoma.
- Revancha: quien la propone crea una sala nueva (queda como A) y avisa con `rematch`; el otro se une como B.
- Presencia con `onDisconnect`; si el rival se desconecta, se avisa en pantalla.

## Cifras bloqueadas (notas del jugador)
En el teclado de adivinar, una pulsación larga (450 ms) sobre una cifra la marca como bloqueada: se ve tachada con 🚫, se quita de la entrada actual y el toque corto no la ingresa. Otra pulsación larga la libera. Las marcas son por jugador (en un celular cada uno tiene las suyas), duran toda la partida, se guardan con la sesión en modo dos celulares y se limpian en la revancha. Bajo el teclado hay una instrucción de una línea para usuarios nuevos.

## Repaso al final
Bajo “Los números secretos eran” hay un desplegable “🔎 Ver todos los intentos”, colapsado por defecto (una línea de alto, para que Revancha, Cambiar modo y Volver al menú queden a la vista en un celular de 812 px), con los tableros completos de ambos jugadores.

## Tipografía de las cifras

Todo lo que es número (teclado, casillas de entrada, intentos, pistas, número secreto propio y
números revelados al final) va en Nunito 900 con `tabular-nums`, no en Bangers: en Bangers el 1 y
el 7 son casi el mismo trazo y los jugadores se equivocaban al teclear (D-30, canon C-1). Los
títulos, los nombres y el botón de probar siguen en Bangers.

## Vocabulario en pantalla
En los tableros las pistas van abreviadas (“3F 1T”, en inglés “3B 1C”) para caber en una línea; en la pantalla grande de respuesta y en las instrucciones se usan las palabras completas. Siempre se habla de “número secreto” (en inglés, “secret number”), nunca de “secreto” a secas.

## Chat de sala (solo dos celulares)

Burbuja 💬 con globito de no leídos, disponible desde la sala de espera y durante toda la partida
(también mientras cada uno elige su número secreto, que es puro tiempo muerto). Usa el módulo
compartido `assets/js/chat.js` montado en `<div id="chat">`, hermano de `#handoff` (canon C-15).
Sigue vivo en la pantalla de resultado, para celebrar o pedir revancha (D-35), y no se guarda en ninguna parte: muere con la sala. Al reconectar, la
conversación vuelve desde la sala, sin sonido ni globito. Se cierra solo cuando llega tu turno,
salvo que estés escribiendo. Con el chat en pantalla, la pantalla de juego deja aire abajo para
que la burbuja no tape el último intento.

## Anti-trampa
Compromiso `sha256(secreto + sal privada)` al inicio; al final se revelan secreto y sal, se verifica el hash y se recalculan todas las respuestas del rival. Resultado en pantalla: “verificado ✅” o “⚠️ no coincide”.

## Archivos
```
toque-y-fama/
  index.html · style.css · rules.js (LOCALES es/en, config por defecto)
  engine.js (score, isValid, randomSecret, Solver, sha256, verifyPlayer) · engine.test.mjs
  game.js (reductor, agentes locales, bot, render)
firebase/database.rules.json · assets/js/firebase-config.js
```
Tests del motor: `node toque-y-fama/engine.test.mjs`.

## Pendientes / ideas
- Modo espectador (leer la sala sin rol).
- Historial de partidas y ranking.
- Transporte sin cuenta (PeerJS / QR) como alternativa.
