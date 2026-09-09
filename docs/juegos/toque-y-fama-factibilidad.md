# Toque y Fama — estudio de factibilidad y propuesta de mecánica

**Estado:** propuesta, pendiente de aprobación · **Fecha:** 2026-09-08 · **Autor:** equipo del proyecto

## 1. Resumen

Toque y Fama es un juego de deducción numérica para dos personas, muy popular en Chile (equivale a *Bulls and Cows* en inglés y *Picas y Fijas* en otros países). **Es factible implementarlo como segundo juego** de la app, y es un candidato especialmente bueno porque:

- La lógica es pequeña y determinista: el celular puede calcular los toques y famas solo, eliminando el error humano (el motivo número uno de peleas en el juego de papel).
- Funciona con **un solo celular** (modo pasar y jugar) sin ninguna infraestructura, y con **dos celulares conectados**, que es lo que pide el requerimiento.
- Para conectar dos celulares desde un sitio estático en GitHub Pages hay tres caminos viables. Se recomienda **una base de datos en tiempo real gratuita (Firebase Realtime Database)** como transporte principal, con una capa de abstracción que permita agregar después **WebRTC peer-to-peer** (PeerJS o señalización por QR) sin tocar el juego.

Recomendación de entrega: **Fase 1** un celular + modo contra el celular (sin infraestructura), **Fase 2** dos celulares con sala por código de 4 letras.

## 2. El juego

### 2.1 Reglas base (versión chilena habitual)

1. Cada jugador escribe en secreto un número de **4 cifras distintas** (por ejemplo 4071). Se juega con dígitos del 0 al 9.
2. Los jugadores se turnan para intentar adivinar el número del rival diciendo un número, también de 4 cifras distintas.
3. El dueño del secreto responde con dos cantidades:
   - **Fama:** cifra correcta en la posición correcta.
   - **Toque:** cifra correcta en la posición incorrecta.
4. Cada jugador anota sus intentos y las respuestas para ir deduciendo.
5. Gana quien logra **4 famas** (adivina el número completo) primero.

Ejemplo con secreto **1234**: el intento **1356** da 1 fama (el 1) y 1 toque (el 3). El intento **4321** da 0 famas y 4 toques.

### 2.2 Variantes documentadas

| Variante | Descripción | Propuesta para la app |
|---|---|---|
| Cantidad de cifras | 3 (niños / rápido), 4 (estándar), 5 (experto). | Configurable: 3, 4 o 5. Por defecto 4. |
| Cifras repetidas | Casi siempre prohibidas. Con repetidas, la cuenta de toques se vuelve ambigua. | No permitir (validación en el teclado). |
| Cero al inicio | Algunas mesas lo prohíben. | Permitir (el número es una secuencia, no una cantidad). Opción para desactivar. |
| Derecho a réplica | Si el jugador que partió acierta, el segundo tiene un último intento; si también acierta, es empate. | Activado por defecto: elimina la ventaja de partir. |
| Límite de intentos | Se juega hasta acertar; con 4 cifras el promedio son 6 a 8 intentos, y un solver óptimo necesita a lo más 7. | Sin límite. Mostrar el número de intentos como puntaje. |
| Modo solitario | Adivinar un número generado al azar. | Incluir como “Contra el celular”. También el celular puede adivinar el tuyo con un solver (modo “que te adivine”). |

Duración típica de una partida: 5 a 12 minutos.

### 2.3 Por qué calza con “Juegos de Salón”

Es un juego de mesa clásico chileno, de dos personas, con tono de competencia amistosa. La app aporta: teclado con validación, cálculo automático de toques y famas, historial ordenado por jugador, y la posibilidad de que cada persona vea solo su tablero (algo imposible con un papel compartido).

## 3. Modos de juego propuestos

| Modo | Dispositivos | Infraestructura | Fase |
|---|---|---|---|
| **A. Un celular, dos jugadores** (pasar y jugar) | 1 | Ninguna | 1 |
| **B. Contra el celular** (adivinar / que te adivine) | 1 | Ninguna | 1 |
| **C. Dos celulares conectados** | 2 | Sala en tiempo real (ver §5) | 2 |

El modo A ya cumple el 80 % del valor: cada jugador ingresa su secreto tapando la pantalla, el celular pasa de mano en cada turno y muestra solo el tablero de quien tiene el turno (con una pantalla de “pásale el celular a X”, reutilizando la transición de Cuarto Rey). Sirve además como respaldo si la conexión de dos celulares falla.

## 4. Mecánica de juego con dos dispositivos

### 4.1 Flujo de pantallas

```
Intro y reglas
   │
   ├─► [Crear sala] ── muestra código ABCD + QR ──┐
   │                                              ├─► Ambos conectados
   └─► [Unirse]  ── escribe código / escanea QR ──┘
                                                  │
                          Elegir secreto (teclado 0–9, sin repetir) + “Listo”
                                                  │
                     Sorteo de quién parte (visible en ambos, verificable)
                                                  │
        ┌────────────────── Turnos alternados ──────────────────┐
        │  Yo adivino: escribo intento → envío                   │
        │  El rival: su celular calcula toques/famas → responde  │
        │  Ambos ven el historial de ambos tableros              │
        └────────────────────────────────────────────────────────┘
                                                  │
                 4 famas → (réplica del segundo si corresponde) → Resultado
                                                  │
                 Se revelan ambos secretos y se verifica la partida
                                                  │
                          Revancha (mismos jugadores, misma sala)
```

### 4.2 Principios de la mecánica

- **El secreto nunca sale del celular durante la partida.** Cada celular calcula las respuestas para los intentos del rival contra su propio secreto. Nadie tiene que contar nada a mano.
- **Compromiso al inicio, revelación al final (anti-trampa).** Al fijar el secreto, cada celular envía un `hash = SHA-256(secreto + nonce)` a la sala. Al terminar, envía `secreto + nonce`; el otro celular verifica el hash y recalcula todas las respuestas recibidas. Si algo no cuadra, la app lo dice (“las respuestas de X no coinciden con su número”). Esto hace imposible cambiar el número a mitad de partida sin que se note.
- **Sorteo verificable de quién parte.** Cada uno aporta un nonce; parte quien indique la paridad de `SHA-256(nonceA + nonceB)`. Ninguno puede manipularlo.
- **Turnos estrictos con número de ronda.** Cada mensaje lleva `ronda` y `turno`; se descartan duplicados y mensajes fuera de orden (tolerancia a reconexiones).
- **Ambos ven todo lo público:** los intentos y respuestas de los dos jugadores (como en la mesa, donde se escucha al rival). Opcional: modo “ciego” donde solo ves tu tablero.
- **Reconexión:** el estado de la partida vive en la sala; si un celular se bloquea o pierde la señal, al volver recupera el estado y sigue.

### 4.3 Protocolo de mensajes (independiente del transporte)

```jsonc
{ "t": "hello",   "from": "A", "name": "Javi", "lang": "es", "v": 1 }
{ "t": "config",  "digits": 4, "replica": true, "zeroFirst": true }   // solo el anfitrión
{ "t": "commit",  "from": "A", "hash": "…sha256…" }                    // secreto fijado
{ "t": "nonce",   "from": "A", "nonce": "…" }                          // para el sorteo
{ "t": "guess",   "from": "A", "round": 3, "value": "4071" }
{ "t": "reply",   "from": "B", "round": 3, "toques": 1, "famas": 2 }
{ "t": "reveal",  "from": "A", "secret": "1234", "nonce": "…" }
{ "t": "rematch", "from": "B" }
```

### 4.4 Motor del juego (puro, testeable)

```js
// toque-y-fama/engine.js
export function score(guess, secret) {
  let famas = 0, toques = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) famas++;
    else if (secret.includes(guess[i])) toques++;
  }
  return { famas, toques };
}
export function isValid(value, digits, { zeroFirst = true } = {}) {
  return new RegExp(`^\\d{${digits}}$`).test(value)
    && new Set(value).size === digits
    && (zeroFirst || value[0] !== '0');
}
```

El modo “que te adivine” usa un solver por eliminación de candidatos (con 4 cifras hay 5040 candidatos; filtrar por consistencia con las respuestas es instantáneo en un celular).

## 5. Opciones para conectar dos celulares desde un sitio estático

GitHub Pages solo sirve archivos: no hay servidor propio, ni WebSockets, ni estado. Las alternativas reales son:

| Opción | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **1. Base de datos en tiempo real gratuita** (Firebase Realtime Database o Firestore; alternativas: Supabase Realtime, Ably, PubNub) | La sala es un documento `rooms/ABCD`; cada celular escribe sus mensajes y escucha los del otro. | Funciona entre cualquier red (4G + Wi‑Fi mezclados), reconexión y estado persistente gratis, sirve para juegos futuros con 4 a 6 celulares, capa gratuita amplia (Firebase: 100 conexiones simultáneas, 1 GB, 10 GB/mes). | Requiere crear una cuenta y un proyecto (lo hace el dueño del repo), claves públicas en el código (normal; se protege con reglas de seguridad), dependencia de un tercero, ~100 KB de SDK. |
| **2. WebRTC P2P con broker público** (PeerJS + su servidor gratuito 0.peerjs.com) | El broker solo presenta a los dos celulares; luego hablan directo por DataChannel. | Sin cuenta ni claves, código simple (sala = ID de PeerJS), tráfico directo. | El servidor público es comunitario, sin garantías y con caídas históricas; **sin TURN**: entre dos celulares con datos móviles (NAT simétrico) la conexión falla con frecuencia; sin persistencia (si uno recarga, se pierde la sala). Funciona muy bien en la misma Wi‑Fi. |
| **3. WebRTC sin servidor, señalización por QR** (protocolos tipo QWBP) | Los celulares intercambian la oferta y respuesta WebRTC mostrando y escaneando códigos QR mutuamente. | Cero infraestructura, cero cuentas, privacidad total. Los jugadores están en la misma pieza, así que el QR es natural. | Fricción alta: cámara, dos escaneos, esperar la recolección de candidatos ICE; mismos problemas de NAT que la opción 2 fuera de la Wi‑Fi común; recuperación tras recarga implica reescanear. |
| **4. Servidor propio de señalización o de sala** (Node en Render/Fly/Glitch capa gratuita) | Un WebSocket mínimo. | Control total. | Servidor que mantener, arranques en frío de 20 a 60 s en capas gratuitas, o costo mensual. No aporta sobre la opción 1. |
| **5. Un solo celular** (modo A) | Sin conexión. | Siempre funciona. | No cumple “dos dispositivos”, pero es el respaldo obligatorio. |

### 5.1 Recomendación

**Transporte principal: Firebase Realtime Database** (opción 1), por robustez entre redes distintas, reconexión gratis y reutilización futura (cualquier juego con varios celulares: votaciones, trivia, roles secretos). Costo esperado: USD 0 a esta escala.

**Diseño desacoplado:** el juego habla con una interfaz `Transport` (`createRoom`, `joinRoom`, `send`, `onMessage`, `onPresence`, `leave`). Se implementan dos transportes en la Fase 2: `local` (modo A, mismo celular) y `firebase`. Si más adelante se quiere quitar la dependencia, se agrega `peerjs` o `qr` sin tocar la lógica del juego.

**Salas por código de 4 letras** (sin vocales ni caracteres ambiguos, p. ej. `KXTR`) más un QR con la URL `…/toque-y-fama/?sala=KXTR`. Las salas expiran a las 6 horas (regla de seguridad + limpieza al crear).

**Qué necesita el dueño del proyecto:** crear un proyecto en Firebase (gratuito), activar Realtime Database y pegar la configuración pública en `assets/js/firebase-config.js`. Las reglas de seguridad propuestas van en el anexo A.

Si se prefiere **no crear ninguna cuenta**, la alternativa es PeerJS (opción 2) con la advertencia clara en pantalla de “ambos en la misma Wi‑Fi”, y el modo de un celular como respaldo.

## 6. Arquitectura propuesta

```
toque-y-fama/
  index.html          intro → modo → sala/secreto → tablero → resultado
  style.css           teclado numérico grande, tablero de intentos, fichas de toque/fama
  rules.js            LOCALES es/en (textos), configuración por defecto
  engine.js           score(), isValid(), solver (sin DOM; con tests)
  game.js             máquina de estados y render
  transport/
    index.js          interfaz Transport y selección (local | firebase)
    local.js          modo un celular
    firebase.js       sala en Realtime Database
assets/js/firebase-config.js   claves públicas (solo si se aprueba la opción 1)
```

Estructura de la sala en la base de datos:

```jsonc
"rooms/KXTR": {
  "createdAt": 1757000000000,
  "config": { "digits": 4, "replica": true, "zeroFirst": true },
  "players": { "A": { "name": "Javi", "online": true }, "B": { "name": "Cata", "online": true } },
  "messages": { "<pushId>": { "t": "guess", "from": "A", "round": 1, "value": "4071", "at": 1757000001000 } }
}
```

Los mensajes son *append-only*: cada celular reconstruye el estado leyéndolos en orden, lo que hace trivial la reconexión y el modo espectador.

## 7. Interfaz (borrador)

- **Teclado propio 0–9** con las cifras ya usadas deshabilitadas, casillas grandes para las 4 cifras, botón “Probar”.
- **Tablero:** lista de intentos con el número y fichas 🎯 (fama) y 👆 (toque) como en la mesa (“2 famas 1 toque”).
- **Indicador de turno** y transición “¡Le toca a X!” con sonido (reutiliza `handoff` y `SFX`).
- **Modo un celular:** entre turnos, pantalla opaca “Pásale el celular a X” para que el rival no vea el tablero.
- **Resultado:** ganador, cantidad de intentos de cada uno, revelación de los secretos con verificación ✅, botón “Revancha”.
- Identidad visual igual a la app: fondo neón, Bangers para títulos, confeti al ganar.
- Inglés: “Bulls and Cows” (fama = bull, toque = cow).

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Dos celulares no logran conectarse (red del local, datos móviles). | Firebase evita el problema de NAT; además, el modo un celular está a un toque de distancia en la misma pantalla. |
| Un jugador cierra el navegador a mitad de partida. | Estado en la sala; al volver, la app retoma. Presencia con `onDisconnect` para avisar al otro. |
| Trampa (cambiar el número a mitad de partida). | Compromiso por hash al inicio y revelación verificada al final. |
| Claves de Firebase públicas. | Son públicas por diseño; las reglas de seguridad limitan a escribir solo en salas existentes, con esquema validado y expiración. |
| Costo si el juego se masifica. | Capa gratuita cubre miles de partidas al mes; si se supera, se migra el transporte (interfaz desacoplada). |

## 9. Estimación

| Fase | Contenido | Esfuerzo estimado |
|---|---|---|
| 1 | Motor + tests, modo un celular, contra el celular (adivinar y que te adivine), textos es/en, sonidos | 1 sesión de trabajo |
| 2 | Transporte Firebase, salas por código y QR, commit/reveal, reconexión, pruebas en dos celulares reales | 2 sesiones |
| 3 (opcional) | Transporte PeerJS o QR sin cuenta, modo espectador, ranking de partidas | 1 a 2 sesiones |

## 10. Decisiones que se necesitan del dueño del proyecto

1. Aprobar el plan por fases (Fase 1 sin infraestructura primero).
2. Elegir transporte para dos celulares: **Firebase (recomendado)** o PeerJS sin cuenta.
3. Si Firebase: crear el proyecto y compartir la configuración pública.
4. Reglas por defecto: 4 cifras, sin repetidas, cero inicial permitido, réplica activada.

## Anexo A · Reglas de seguridad propuestas (Firebase Realtime Database)

```jsonc
{
  "rules": {
    "rooms": {
      "$room": {
        ".read": true,
        ".write": "!data.exists() || (data.child('createdAt').val() > now - 6*60*60*1000)",
        "config": { ".validate": "newData.hasChildren(['digits'])" },
        "messages": { "$id": { ".validate": "newData.hasChildren(['t','from','at']) && newData.child('at').val() <= now + 60000" } }
      }
    }
  }
}
```

## Fuentes consultadas

- Reglas y ejemplo del juego: descripción en [Google Play — Toque y Fama](https://play.google.com/store/apps/details?id=toqueyfama.destinogames.com) y [Toque y Fama en TikTok](https://www.tiktok.com/discover/toque-y-fama-juego-numeros); equivalencia con *Bulls and Cows* / *Picas y Fijas* ([implementación de referencia](https://www.youtube.com/watch?v=3TWcXseo55Y)).
- Estado y limitaciones del broker público de PeerJS: [status.peerjs.com](https://status.peerjs.com/), [PeerServer Cloud](https://peerjs.com/server/cloud), [issue #805](https://github.com/peers/peerjs/issues/805), [alternativas 2026](https://medium.com/@jamesbordane57/peerjs-alternatives-in-2026-free-turn-auto-reconnect-and-which-webrtc-library-to-actually-pick-716efbdf55f2).
- Señalización WebRTC por QR sin servidor: [QWBP](https://github.com/magarcia/qwbp), [webrtc-via-qr](https://github.com/Qivex/webrtc-via-qr), [Serverless WebRTC using QR codes](https://franklinta.com/2014/10/19/serverless-webrtc-using-qr-codes/).
