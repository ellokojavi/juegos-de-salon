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
| 📱 Un celular, dos jugadores | Cada uno ingresa su secreto con la pantalla tapada; entre turnos aparece el resultado y “Pásale el celular a X”. | `transport/local.js` (memoria) |
| 🤖 Contra el celular | Duelo: el jugador adivina el número del celular mientras el celular (solver por eliminación) adivina el suyo. | `transport/local.js` + bot |
| 📡 Dos celulares | Sala con código de 4 letras y QR (`?sala=CODE`). Cada celular calcula las respuestas contra su propio secreto. | `transport/firebase.js` (Realtime Database) |

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
```
El estado (`view()`) se deriva de la lista de mensajes: fase (`lobby`, `secret`, `play`, `reveal`, `done`), turno esperado, intento pendiente, resultado y réplica. Mensajes fuera de turno o duplicados se ignoran.

## Firebase (modo dos celulares)
- Sala: `rooms/<CODE>` con `createdAt`, `game`, `config`, `players/{A,B}` (nombre, online) y `messages/<pushId>` (append-only).
- Creación en dos pasos (sala, luego jugador) por las reglas de seguridad; salas válidas 6 horas.
- Reconexión: el secreto y el rol se guardan en `localStorage` (`juegos-de-salon:tyf:session`); al abrir `?sala=CODE` o “Continuar” se retoma.
- Revancha: quien la propone crea una sala nueva (queda como A) y avisa con `rematch`; el otro se une como B.
- Presencia con `onDisconnect`; si el rival se desconecta, se avisa en pantalla.

## Anti-trampa
Compromiso `sha256(secreto + sal privada)` al inicio; al final se revelan secreto y sal, se verifica el hash y se recalculan todas las respuestas del rival. Resultado en pantalla: “verificado ✅” o “⚠️ no coincide”.

## Archivos
```
toque-y-fama/
  index.html · style.css · rules.js (LOCALES es/en, config por defecto)
  engine.js (score, isValid, randomSecret, Solver, sha256, verifyPlayer) · engine.test.mjs
  game.js (reductor, agentes locales, bot, render)
  transport/local.js · transport/firebase.js
firebase/database.rules.json · assets/js/firebase-config.js
```
Tests del motor: `node toque-y-fama/engine.test.mjs`.

## Pendientes / ideas
- Modo espectador (leer la sala sin rol).
- Historial de partidas y ranking.
- Transporte sin cuenta (PeerJS / QR) como alternativa.
