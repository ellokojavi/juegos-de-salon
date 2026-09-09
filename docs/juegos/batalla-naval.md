# Diseño: Batalla Naval ⚓

**Estado:** implementado (v0.6) · **Fecha:** 2026-09-08 · **Ruta:** `/batalla-naval/` · **Jugadores:** 1 a 2 · **Idiomas:** es, en (“Battleship”)

## 1. Resumen

Tercer juego de la app: el clásico de hundir la flota del rival. Reutiliza la arquitectura de Toque y Fama (D-20): un reductor de mensajes único para tres modos, transportes `local` y `firebase`, compromiso con sal y verificación al final, reconexión y revancha. Lo nuevo es el motor de tablero, la interfaz de colocación de barcos por toque, la grilla de disparos y una IA de cacería.

Reglas acordadas con el dueño del proyecto:

| Regla | Decisión | Configurable |
|---|---|---|
| Tablero | 10×10, columnas A–J y filas 1–10 | No (v1) |
| Flota | Clásica: portaaviones 5, acorazado 4, crucero 3, submarino 3, destructor 2 (17 casillas) | No (v1); la flota de 10 barcos queda como variante futura |
| Contacto | Los barcos pueden tocarse por lados y esquinas; solo no pueden superponerse ni salirse | No (v1) |
| Turnos | Al acertar sigues disparando; al fallar pasa el turno | Sí, por defecto activado (“tiro extra”) |
| Quién parte | Invitado (B) en la primera partida; en la revancha, el perdedor (misma regla que D-19) | No |
| Fin | Gana quien hunde las 5 naves del rival. Sin réplica: con tiro extra el turno es una secuencia, no un intento único | — |
| Respuestas | Agua 🌊 · Tocado 💥 · Hundido 🔥 (con el nombre y las casillas del barco hundido) | — |

## 2. Modos

| Modo | Cómo | Transporte |
|---|---|---|
| 📱 Un celular | Cada jugador coloca su flota con la pantalla tapada. En cada turno se ve solo el tablero de disparos del jugador activo (su flota queda oculta tras una ficha “ver mi flota”, igual que el número secreto en Toque y Fama). Al fallar, pantalla de resultado + “Pásale el celular a X”. | `local` |
| 🤖 Contra el celular | La IA coloca al azar y dispara con cacería por paridad + persecución al acertar (ver §6). | `local` + bot |
| 📡 Dos celulares | Sala con código y QR (`?sala=CODE`, `game: 'batalla-naval'`). Cada celular responde los disparos contra su propia flota. | `firebase` |

## 3. Flujo de pantallas

```
Intro (reglas, modos) → Setup (nombres, tiro extra) → [Lobby: código + QR]
   → Colocar flota → Batalla (dos grillas) → Resultado (flotas reveladas y verificadas) → Revancha
```

### 3.1 Colocar flota (la pantalla clave)
- Grilla 10×10 grande (casillas de ~32 px) con letras y números.
- Lista de barcos a la derecha o debajo como fichas: 🚢 5 · 4 · 3 · 3 · 2. Se toca una ficha (queda seleccionada) y luego una casilla de la grilla: el barco se coloca desde esa casilla hacia la derecha (horizontal) o hacia abajo (vertical).
- Tocar un barco ya puesto lo **selecciona** (queda amarillo) y muestra un botón **↻** en su esquina superior derecha para girarlo ahí mismo; con un barco seleccionado, tocar una casilla vacía lo **mueve** y **arrastrarlo** también. Tocarlo de nuevo lo deselecciona; seleccionar otro quita el color y el botón. El botón inferior **Girar ↔/↕** sirve además para elegir la orientación antes de colocar.
- Casillas inválidas (fuera de borde o superpuestas) se muestran en rojo y no se aceptan.
- **🎲 Al azar** coloca toda la flota válida en un toque (mismo generador que usa la IA). **Limpiar** vacía el tablero.
- **¡Zarpar!** se habilita con los 5 barcos puestos. Al confirmar se envía el compromiso `sha256(layout + sal)`.

### 3.2 Batalla
- Arriba, **grilla de disparos** al rival (grande, es donde se toca): agua 🌊 en gris, tocado 💥 en naranjo, hundido 🔥 en rojo con el contorno del barco. Tocar una casilla la selecciona; **🎯 ¡Fuego!** confirma (evita disparos por error). Opción “disparo directo con un toque” en configuración.
- Abajo, **mi flota** en una grilla chica (mitad de tamaño) con los impactos recibidos. En modo un celular esta grilla va tapada con “toca para ver”.
- Marcador: barcos hundidos de cada lado como iconos tachados (🚢🚢🚢🚢🚢).
- Turno: “¡Te toca! Dispara a Cata” / “Cata está apuntando…”. Con tiro extra: “¡Tocado! Sigues disparando”.
- Sonidos: splash al agua, explosión al tocar, explosión larga + vibración al hundir, sirena al perder la flota.

### 3.3 Resultado
Ganador, disparos totales y precisión de cada uno, ambas flotas reveladas (con los disparos encima), verificación ✅ del compromiso, desplegable con la secuencia de disparos, Revancha / Cambiar modo / Menú.

## 4. Motor (`batalla-naval/engine.js`, puro y testeable)

```js
export const FLEET = [ { id: 'carrier', size: 5 }, { id: 'battleship', size: 4 }, { id: 'cruiser', size: 3 }, { id: 'submarine', size: 3 }, { id: 'destroyer', size: 2 } ];
// layout: { carrier: { r: 0, c: 3, dir: 'h' }, ... }   celda: 'B4' ↔ { r: 3, c: 1 }
export function cellsOf(ship, placement)            // casillas que ocupa un barco
export function isValidLayout(layout, N = 10)       // dentro del tablero y sin superposición
export function randomLayout(N = 10)                // flota válida al azar
export function shoot(layout, shotsSoFar, cell)     // → { result: 'agua' | 'tocado' | 'hundido', ship?: id, cells?: [...] }
export function allSunk(layout, shots)              // fin de partida
export function nextShooter(current, result, extraShot) // quién dispara después
export class Hunter { next(); learn(cell, result) } // IA (ver §6)
export async function sha256, randomNonce, verifyPlayer({ layout, salt, commit, repliesGiven })
```

`verifyPlayer` recalcula cada respuesta dada por el rival contra su layout revelado, igual que en Toque y Fama.

## 5. Protocolo de mensajes y estado

```jsonc
{ "t": "hello",   "from": "A", "name": "Javi" }
{ "t": "commit",  "from": "A", "hash": "sha256(JSON(layout)+sal)" }
{ "t": "shot",    "from": "A", "n": 0, "cell": "B4" }
{ "t": "reply",   "from": "B", "n": 0, "result": "hundido", "ship": "destroyer", "cells": ["B4","B5"] }
{ "t": "reveal",  "from": "A", "layout": { … }, "salt": "…" }
{ "t": "rematch", "from": "B", "code": "KXTR" }
```

Estado derivado (`view()`): fase (`lobby`, `placing`, `play`, `reveal`, `done`), quién dispara (a partir del historial y la regla de tiro extra), disparo pendiente, barcos hundidos por lado, ganador. Disparos repetidos a la misma casilla se rechazan en el reductor. Mensajes en serie, como en D-20.

Sala en Firebase: mismas reglas de seguridad (el campo `game` distingue el juego); los mensajes `reply` con `cells` caben en la validación actual (`t`, `from`, `at` obligatorios). Se agregará `batalla-naval/` a `MODULES` en `tools/set-version.py`.

## 6. IA “contra el celular”

1. **Cacería:** dispara al azar solo a casillas de paridad (tablero de ajedrez), porque el barco más chico mide 2: garantiza encontrar todo con la mitad de disparos.
2. **Persecución:** al tocar, prueba las 4 vecinas; con dos tocados alineados sigue la línea en ambos sentidos hasta hundir o fallar.
3. Al hundir vuelve a cacería. Cuando solo quedan barcos grandes, ajusta la paridad al tamaño mínimo restante.
Promedio esperado: 45 a 55 disparos para hundir la flota (un humano promedio ronda 60).

## 7. Interfaz y estilo

- Misma identidad: fondo neón, Bangers en títulos, botones pill, confeti al ganar. Paleta del mar: casillas azul profundo, agua gris-azul, tocado naranjo, hundido rojo con brillo.
- Grilla táctil: casillas mínimas de 30 px en 375 px de ancho. Es una sola grilla CSS de 11×11 donde la primera fila y la primera columna son las etiquetas, así números y letras quedan alineados con las casillas en todos los navegadores (v0.9.4). Sin scroll horizontal.
- Todo en español e inglés (“Battleship”): agua/miss, tocado/hit, hundido/sunk, ¡Fuego!/Fire!, ¡Zarpar!/Set sail!
- Accesible con dedo: selección + confirmación antes de disparar; vibración en tocado/hundido.

## 8. Archivos previstos

```
batalla-naval/
  index.html · style.css · rules.js (LOCALES es/en, FLEET, config por defecto)
  engine.js · engine.test.mjs
  game.js (reductor, agentes, bot, render: colocación y batalla)
  transport/ → se reutilizan los de Toque y Fama moviéndolos a assets/js/transport/ (local.js, firebase.js con parámetro game)
```
Mover los transportes a `assets/js/transport/` es la única refactorización previa: Toque y Fama pasa a importarlos de ahí.

## 8b. Estado de la implementación (v0.6)
- Fase 0: transportes movidos a `assets/js/transport/`; `randomRoomCode` vive en el transporte de Firebase. Nuevo módulo compartido `assets/js/handoff.js` (overlay de pase y pantalla tapada) y estilos `.cover` en `base.css`.
- Fase 1: motor con tests (`engine.test.mjs`, IA ≈ 50 disparos promedio), colocación por toque/girar/arrastrar/al azar, modo un celular y contra el celular.
- Fase 2: dos celulares con sala, QR, reconexión (flota guardada en `juegos-de-salon:bn:session`), presencia y revancha (parte el perdedor).
- Fase 3: sonidos propios (`SFX.splash`, `hit`, `sink`, `siren`), capturas en `docs/screenshots/batalla-naval/`, README.
- Diferencia con el diseño: la opción “disparo directo con un toque” es el toggle “Confirmar cada disparo” (activado por defecto).

## 9. Plan y estimación

| Fase | Contenido | Esfuerzo |
|---|---|---|
| 0 | Mover transportes a `assets/js/transport/` y registrar en el import map | 0,5 sesión |
| 1 | Motor con tests, colocación de flota (toque, girar, arrastrar, al azar), modo un celular y contra el celular con IA | 1,5 sesiones |
| 2 | Dos celulares: sala, compromiso, reconexión, revancha; pruebas con dos instancias | 1 sesión |
| 3 | Sonidos propios, capturas, README y docs | 0,5 sesión |

## 10. Variantes futuras (no en v1)
Flota de 10 barcos, regla de “sin contacto” con agua automática alrededor del hundido, tableros de 8×8 para partidas rápidas, salvas (varios disparos por turno según barcos vivos), modo espectador.
