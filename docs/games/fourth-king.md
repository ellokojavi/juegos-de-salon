# Especificación: Cuarto Rey 👑

**Ruta:** `/fourth-king/` (id `cuarto-rey`) · **Jugadores:** 4 a 6 · **Desde:** v0.1 · **Estado:** publicado (v0.27, con el historial de cartas) · **Idiomas:** es, en (“Fourth King”), pt (“Quarto Rei”) y de (“Der vierte König”, D-191, D-197)

## Resumen

Juego de naipes para tomar, popular en Chile. Reglas base según instrucciones entregadas por el cliente (ver
"Reglas originales"). El celular reemplaza al mazo (D-12): se pasa de mano en mano, cada jugador saca una carta y
la app dice qué hacer y quién toma. Termina cuando sale el cuarto rey.

## Reglas

| Carta | Regla | Comportamiento en la app |
|---|---|---|
| A | Todos toman 2 sorbos | Lista a todos. +2 a cada uno. |
| 2 | Toma el de la derecha | Nombra al jugador siguiente (D-04). +2. |
| 3 | Toma el de la izquierda | Nombra al jugador anterior. +2. |
| 4 | Cuenta Cuentos | Reglas + temporizador 5 s + selector de perdedor (+2). |
| 5 | Penitencia | Cumple la penitencia o toma 2. Penitencia al azar (24 opciones). Botones: otra, cumplida, se arrugó (+2). |
| 6 | Chancho Inflado | Reglas (diferido, D-08) + selector de perdedor (+2). El selector está solo mientras la carta está en la mesa: si el chancho pasa más adelante, el perdedor toma igual pero no queda anotado, y la pantalla lo dice así (D-177). |
| 7 | Cultura Chupística | Reglas + categoría al azar (35) + selector de perdedor (+2). |
| 8 | Regala 2 sorbos | Selector de jugadores: toca para asignar sorbos hasta completar 2. |
| 9 | Nunca Nunca | Reglas + ideas al azar (16) + selector de perdedor (+2). |
| 10 | Toma quien sacó la carta | +2 al jugador actual. |
| J | Toman los hombres | ♂ y ⚧ (D-05). Si no hay, toma quien sacó. |
| Q | Toman las mujeres | ♀ y ⚧ (D-05). Si no hay, toma quien sacó. |
| K | Contar reyes | 1º, 2º, 3º: mensaje y corona. 4º: fondo, confeti y fin (D-06). |

### Reglas originales (texto del cliente)
- Naipe inglés sin jokers (52 cartas), tragos, mínimo 4 jugadores.
- Cada jugador parte con el vaso a tope. Nadie toma salvo por regla.
- Mazo al centro boca abajo; cada jugador muestra una carta por turno.
- A: todos toman 2 sorbos · 2: derecha · 3: izquierda · 4: Cuenta Cuentos · 5: penitencia · 6: Chancho Inflado · 7: Cultura Chupística · 8: regala 2 sorbos · 9: Nunca Nunca · 10: toma quien sacó · J: hombres · Q: mujeres · K: contar reyes; el cuarto se toma el vaso.

### Ideas para versiones futuras
- Modo “una carta por pantalla” para tablets en el centro de la mesa.

Las variantes de reglas configurables se descartaron en D-68. El historial ya está (CR-18) y los sonidos también
(`SFX.flip` al voltear, `SFX.fourthKing` al cuarto rey).

## Modos

Solo **📱 Un celular**, de 4 a 6 jugadores, pasándolo hacia la derecha. Es un juego de grupo en la misma mesa:
la gracia es mirar todos la misma carta y hablar en voz alta, y no hay información oculta que justifique varios
celulares ni un rival de máquina. Bajo C-5, un juego de grupo elige sus modos, así que ofrecer uno solo cumple
el canon (D-213).

## Flujo

```
Intro ──► Setup jugadores ──► Mesa (turnos) ──► Cuarto Rey ──► Final
  ▲                                                             │
  └──────────────── otra ronda / cambiar jugadores ─────────────┘
```

1. **Intro:** explica la preparación (vaso a tope, nadie toma fuera de regla, pasar el celular hacia la derecha), lista desplegable con la regla de cada carta y, si existe, la opción de continuar una partida guardada.
2. **Setup:** de 4 a 6 filas con nombre (máx. 14 caracteres) y género (♂ ♀ ⚧, botones de 44 px a cualquier ancho, C-8).
   Cada fila parte en ♂: es un ajuste a la vista que se cambia antes de empezar, no una jugada (`DEFAULT_CONFIG`, C-8, D-213).
   Validaciones: todos con nombre, sin repetidos. Recuerda los últimos jugadores.
3. **Mesa:** muestra a quién le toca, la fila de asientos, el contador de cartas restantes y 4 coronas que se encienden con cada rey. La carta boca abajo ocupa casi todo el ancho; al tocarla gira en 3D, se encoge y debajo aparece el panel con la instrucción y los botones para resolverla.
4. **Transición entre turnos (C-9):** al resolver la carta, una sola pantalla con lo que pasó arriba ("¡Salud!" y los que
   toman, o "¡Cumplida!", "¡Van 2 reyes!"…) y debajo "Pásale el celular a X" con el botón "¡Dame la carta!", armada con
   `showHandoff` y `passBlock` de `handoff.js`. Solo el botón avanza: ni un toque fuera de él ni un temporizador la cierran
   (D-213). Al tocarlo, la carta nueva entra con animación.
5. **Final:** nombre del que sacó el cuarto rey, ranking de sorbos, botones de otra ronda / cambiar jugadores / menú
   y, plegado al pie, el historial de las cartas que salieron (CR-18): cada una con su palo, quién la sacó y qué
   decía. Va **después** de los botones, al revés que en los otros juegos, porque acá el ranking tiene hasta seis
   filas y un bloque encima de los botones los empuja fuera de la pantalla. Toda la pantalla está medida para que
   con seis jugadores los tres botones se vean sin desplazar en un celular de 812 px, en los tres idiomas que había entonces, es, en y pt (C-8):
   corona más chica, filas del ranking compactas y los dos botones secundarios compartiendo fila. El último cierra
   en 774 px.

### Memoria de partida (C-6)

Se guarda con `createSessionStore(GAME_ID)`, con `GAME_ID = 'cuarto-rey'` (con la clave vieja `juegos-de-salon:cuarto-rey:game` como
`legacyKeys`):

```json
{
  "players": [{ "name": "Javi", "gender": "m" }],
  "deck": [{ "rank": "K", "suit": "♠", "color": "black" }],
  "turn": 0, "kings": 0, "drawn": 0,
  "sorbos": [0], "fondos": [0],
  "history": [{ "rank": "K", "suit": "♠", "color": "black", "by": 0 }],
  "current": { "card": {…}, "applied": true, "data": {} },
  "finished": false, "victim": null, "startedAt": 1757000000000
}
```

`current` guarda la carta en juego y datos elegidos (penitencia, categoría) para que, al retomar, se vea exactamente lo mismo.
`history` son las cartas que ya salieron, en orden, con el índice de quien la sacó; una partida guardada de antes de la
v0.27 no la trae y se retoma igual, solo que al final no muestra historial.

Los últimos jugadores (nombre y género) se recuerdan aparte con `createNameStore(GAME_ID).list()`, en
`juegos-de-salon:cuarto-rey:names`. Hasta que se llevó el juego al canon vivían en `juegos-de-salon:players`: la primera
vez que se abre la mesa, si la clave nueva está vacía y la vieja tiene una lista, se copia a la nueva y la vieja se borra
(`legacyKeys`, igual que la partida). Nadie pierde su mesa.

### Señal de uso (C-7, D-210)
`trackStart` con los nombres al empezar (no al retomar) y `trackFinish` al salir el cuarto rey, una sola vez. Acá nadie
gana —el cuarto rey es un castigo—, así que el final va como `detalle` (`👑 Javi · 37 cartas`) y no como `ganador`.

### Idiomas
Todos los textos viven en `rules.js` bajo `LOCALES.es`, `LOCALES.en`, `LOCALES.pt` y `LOCALES.de` (reglas, mensajes de reyes, minijuegos, 24 penitencias, 35 categorías, 16 ideas de Nunca Nunca y la interfaz), con las mismas claves en todos. Nombres en inglés: Fourth King, Story Time, Puffer Pig, Categories, Never Have I Ever, Dare. En portugués de Brasil: Quarto Rei, Era Uma Vez, Porquinho Bochechudo, Cultura de Boteco, Eu Nunca, Prenda; los sorbos son "goles" y el fondo es "vira, vira, vira" (D-48). En alemán (D-191; para todos desde D-197), `LOCALES.de` adapta el juego a un grupo alemán en vez de calcarlo: Der vierte König, Wort für Wort, Hamsterbacken, Kategorien, Ich hab noch nie, Aufgabe; el glosario está en [ALEMAN.md](../ALEMAN.md).

## Protocolo de mensajes

No tiene: solo un celular.

## Archivos

- `public/fourth-king/index.html`: pantallas.
- `public/fourth-king/rules.js`: `GAME_ID`, `DEFAULT_CONFIG`, palos, rangos, `CARD_RULES`, límites de jugadores y
  `LOCALES` (es, en, pt, de).
- `public/fourth-king/engine.js`: las reglas puras (C-2): el mazo barajado con azar inyectable (`rng(semilla)` en los
  tests), `drawCard` (saca y aplica lo automático: sorbos, reyes, la penitencia o la categoría sorteada),
  `resolveTargets` y `genderFallback` (quién toma, D-04, D-05), el regalo del 8, el turno, el cuarto rey y el ranking.
- `public/fourth-king/engine.test.mjs`: tests del motor (`node public/fourth-king/engine.test.mjs`).
- `public/fourth-king/game.js`: máquina de estados y dibujo; el pase con `handoff.js`, la mesa con `createNameStore`,
  `trackStart` y `trackFinish` (D-44, D-210).
- `public/fourth-king/style.css`: estilos propios (carta, mesa, coronas, final).
- `public/cuarto-rey/index.html`: página puente generada desde la ruta vieja (D-192); no se edita.

Gancho de solo lectura para las pruebas (C-14): `window.__cuartoRey`, con `state()` (una copia de la partida),
`screen()` (la pantalla activa), `guardada()` (lo que hay en la memoria de partida) y `mesa()` (los últimos jugadores).

## Excepciones a los cánones

Ninguna. Se llevó al canon en el PR de Cuarto Rey (D-213): motor y tests (C-2, C-12), pase con `handoff.js` (C-9),
cifras en `--font-num` (C-1, D-30; las esquinas de las cartas también, letras incluidas, para que el mazo se lea
parejo), botones de género de 44 px (C-8), gancho `window.__cuartoRey` (C-14), mesa recordada con `createNameStore`
(C-6) y `trackFinish` (C-7, D-210).
