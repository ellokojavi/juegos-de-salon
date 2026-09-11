# Especificación: Cuarto Rey 👑

**Ruta:** `/cuarto-rey/` · **Jugadores:** 4 a 6 · **Versión:** 0.2 · **Idiomas:** es, en, pt (“Quarto Rei”)

## Origen
Juego de naipes para tomar, popular en Chile. Reglas base según instrucciones entregadas por el cliente (ver abajo). El celular reemplaza al mazo (D-12).

## Flujo de pantallas

```
Intro ──► Setup jugadores ──► Mesa (turnos) ──► Cuarto Rey ──► Final
  ▲                                                             │
  └──────────────── otra ronda / cambiar jugadores ─────────────┘
```

1. **Intro:** explica la preparación (vaso a tope, nadie toma fuera de regla, pasar el celular hacia la derecha), lista desplegable con la regla de cada carta y, si existe, la opción de continuar una partida guardada.
2. **Setup:** de 4 a 6 filas con nombre (máx. 14 caracteres) y género (♂ ♀ ⚧). Validaciones: todos con nombre, sin repetidos. Recuerda los últimos jugadores.
3. **Mesa:** muestra a quién le toca, la fila de asientos, el contador de cartas restantes y 4 coronas que se encienden con cada rey. La carta boca abajo ocupa casi todo el ancho; al tocarla gira en 3D, se encoge y debajo aparece el panel con la instrucción y los botones para resolverla.
4. **Transición entre turnos:** al resolver la carta, overlay "¡Salud!" con los que toman (avanza solo o al tocar) y luego "Pásale el celular a X" con botón "¡Dame la carta!". Al cerrarse, la carta nueva entra con animación.
5. **Final:** nombre del que sacó el cuarto rey, ranking de sorbos y botones de otra ronda / cambiar jugadores / menú.

## Reglas por carta (implementadas)

| Carta | Regla | Comportamiento en la app |
|---|---|---|
| A | Todos toman 2 sorbos | Lista a todos. +2 a cada uno. |
| 2 | Toma el de la derecha | Nombra al jugador siguiente (D-04). +2. |
| 3 | Toma el de la izquierda | Nombra al jugador anterior. +2. |
| 4 | Cuenta Cuentos | Reglas + temporizador 5 s + selector de perdedor (+2). |
| 5 | Penitencia | Penitencia al azar (24 opciones). Botones: otra, cumplida, se arrugó (+2). |
| 6 | Chancho Inflado | Reglas (diferido, D-08) + selector de perdedor (+2). |
| 7 | Cultura Chupística | Reglas + categoría al azar (35) + selector de perdedor (+2). |
| 8 | Regala 2 sorbos | Selector de jugadores: toca para asignar sorbos hasta completar 2. |
| 9 | Nunca Nunca | Reglas + ideas al azar (16) + selector de perdedor (+2). |
| 10 | Toma quien sacó la carta | +2 al jugador actual. |
| J | Toman los hombres | ♂ y ⚧ (D-05). Si no hay, toma quien sacó. |
| Q | Toman las mujeres | ♀ y ⚧ (D-05). Si no hay, toma quien sacó. |
| K | Contar reyes | 1º, 2º, 3º: mensaje y corona. 4º: fondo, confeti y fin (D-06). |

## Estado de la partida (localStorage)

```json
{
  "players": [{ "name": "Javi", "gender": "m" }],
  "deck": [{ "rank": "K", "suit": "♠", "color": "black" }],
  "turn": 0, "kings": 0, "drawn": 0,
  "sorbos": [0], "fondos": [0],
  "current": { "card": {…}, "applied": true, "data": {} },
  "finished": false, "victim": null, "startedAt": 1757000000000
}
```

`current` guarda la carta en juego y datos elegidos (penitencia, categoría) para que, al retomar, se vea exactamente lo mismo.

## Idiomas
Todos los textos viven en `rules.js` bajo `LOCALES.es`, `LOCALES.en` y `LOCALES.pt` (reglas, mensajes de reyes, mini-juegos, 24 penitencias, 35 categorías, 16 ideas de Nunca Nunca y la interfaz), con las mismas claves en los tres. Nombres en inglés: Fourth King, Story Time, Puffer Pig, Categories, Never Have I Ever, Dare. En portugués de Brasil: Quarto Rei, Era Uma Vez, Porquinho Bochechudo, Cultura de Boteco, Eu Nunca, Prenda; los sorbos son "goles" y el fondo es "vira, vira, vira" (D-48).

## Ideas para versiones futuras
- Variantes de reglas configurables (sorbos, “seguir hasta agotar el mazo”, usar naipe real).
- Historial de cartas de la partida.
- Sonidos (tambor al voltear, fanfarria del cuarto rey).
- Modo “una carta por pantalla” para tablets en el centro de la mesa.

## Reglas originales (texto del cliente)
- Naipe inglés sin jokers (52 cartas), tragos, mínimo 4 jugadores.
- Cada jugador parte con el vaso a tope. Nadie toma salvo por regla.
- Mazo al centro boca abajo; cada jugador muestra una carta por turno.
- A: todos toman 2 sorbos · 2: derecha · 3: izquierda · 4: Cuenta Cuentos · 5: penitencia · 6: Chancho Inflado · 7: Cultura Chupística · 8: regala 2 sorbos · 9: Nunca Nunca · 10: toma quien sacó · J: hombres · Q: mujeres · K: contar reyes; el cuarto se toma el vaso.
