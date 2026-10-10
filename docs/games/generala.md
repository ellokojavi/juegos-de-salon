# Diseño: Generala 📝

**Ruta:** `/generala/` (id `generala`) · **Jugadores:** 1 a 6 · **Estado:** en la portada como "Próximamente" (D-248) ·
**Idiomas:** es, en ("Generala"), pt ("General", como se le dice en Brasil) y de ("Generala") ·
**Decisiones:** D-246 (el juego), D-247 (Uno al día), D-248 (próximamente)

## Resumen

El clásico de dados de la sobremesa latinoamericana: en cada turno se tiran cinco dados hasta tres
veces, guardando los que sirven entre tiro y tiro, y el resultado se anota en una casilla libre de la
planilla (o se tacha con un 0). Después de 11 turnos cada uno, gana el que sumó más; una generala
servida gana al tiro.

El celular hace lo que en la mesa se hace mal: **suma**, muestra lo que valdría cada casilla con los
dados de ahora, no deja anotar dos veces en el mismo lugar ni tirar una cuarta vez, y lleva la
planilla de todos.

Es el primer juego de grupo de la app que se puede jugar **sin coincidir**: cada uno llena su propia
planilla y nadie depende de la jugada del otro. Por eso está listo para Uno al día, donde todos
tiran los mismos dados (D-247).

**Por ahora se anuncia:** la portada lo muestra como "Próximamente", al final de la lista y sin
abrirlo, igual que Julepe (C-17); la página `/generala/` funciona entera para quien tenga el link (D-248).

## Reglas

- **Cinco dados, hasta tres tiros por turno.** Entre tiro y tiro se tocan los dados que se guardan;
  se tiran los demás. No se puede tirar con los cinco guardados.
- **Después de tirar, se anota** en una casilla libre, aunque valga 0 (tachar). Cada casilla se usa
  una sola vez: son 11, así que son 11 turnos.
- **Las casillas y lo que valen:**

| Casilla | Qué pide | Vale | Servida |
|---|---|---|---|
| Unos a Seises | — | la suma de los dados de esa cara | igual |
| Escalera | 1-2-3-4-5, 2-3-4-5-6 o 3-4-5-6-1 (el as arriba) | 20 | 25 |
| Full | tres iguales y dos iguales | 30 | 35 |
| Póker | cuatro iguales (cinco también) | 40 | 45 |
| Generala | cinco iguales | 50 | gana la partida |
| Doble generala | cinco iguales, con la generala ya anotada con sus 50 | 100 | gana la partida |

- **Servida** es que sale en el primer tiro del turno.
- **La generala servida gana la partida al tiro**, con dos jugadores o más. Es un ajuste encendido
  por defecto y se puede apagar antes de empezar; jugando solo no existe (no hay a quién ganarle) y la
  generala servida vale 50 como cualquier otra.
- **Gana el que suma más** después de las 11 vueltas; si empatan, empatan.

### Lo que no está y por qué (D-246)

- **El bono de los números** (el "63" del Yahtzee) no es de la Generala.
- **Anotar un juego que no salió con puntaje** (la escalera "de mentira" por 20) tampoco: se tacha.
- **Rival de máquina:** no hay información oculta ni decisiones contra otro, así que un rival que
  tira sus dados no agrega nada. Es un juego de "🧍 Jugar solo" con récord, como Toque y Fama (C-5).
- **Kniffel y Yahtzee** son marcas (de Schmidt y de Hasbro) y además otro juego (otras casillas, el
  bono, el "chance"). En alemán se llama Generala, con las casillas con nombre alemán.

## Modos

| Modo | Jugadores | Cómo |
|---|---|---|
| 📱 Un celular | 2 a 6 | Se pasa el celular en cada turno. Antes del pase, lo que anotó el anterior (C-9). |
| 📡 Varios celulares | 2 a 6 | Sala con código de 4 letras, QR y chat. Cada uno tira en su celular y todos ven los dados y la planilla de quien juega. |
| 🧍 Jugar solo | 1 | Once turnos para el mejor puntaje. Récord del celular (`juegos-de-salon:generala:record-solo`) y, con jugador, la tabla `generala_solo` de los rankings, con el tiempo como desempate (D-212). |

**Rankings (D-215):** con un jugador abierto, cada partida de grupo terminada cuenta en
`jugadores/<jid>/juegos/generala` y, si ganó solo (un empate no es victoria), suma en
`generala_victorias`. La tabla de victorias va en la intro, debajo de los modos; la de jugar solo,
debajo de Empezar y en el final.

### De dónde salen los dados (D-246)

En la Generala **no hay nada oculto**: en la mesa todos ven el cubilete. Así que, a diferencia de
Dudo (D-70), los dados viajan en claro en el mensaje `roll` y no se comprometen con hash. Tampoco
salen de la semilla compartida (C-7): el código es público, y con la semilla cualquiera podría
calcular **sus próximos tiros** y elegir qué guardar sabiendo lo que viene. Cada celular tira con su
azar y lo publica.

Lo que eso no evita es que alguien modifique su página para mandarse cinco seises. Es lo mismo que
cargar un dado en la mesa: se aceptó, como en un juego entre amigos (D-246).

### Uno al día: los dados sí salen de la semilla (`/generala/?today`, D-247)

Cuando Generala es el juego de Uno al día, `/generala/?today` no ofrece modos: la intro lleva la línea
de Uno al día y "Los dados salen iguales para todos: lo que cambia es qué guardas.", y un solo
botón, **Jugar el de hoy**, que abre 🧍 Jugar solo con el nombre que se recuerda. Cada tiro sale de
`azarDel(semilla, 'generala:<turno>:<tiro>')`, consumido en orden de posición: quien guarda lo mismo
que otro recibe lo mismo. Ahí sí se pueden calcular los tiros con el código, igual que en los
solitarios de La Copa (D-97).

Puntaje del día (`puntajeDia` de `engine.js`): un tercio del total, hasta 100 (300 puntos ya es una
partida excelente; el máximo es 360). El primer intento cuenta; los siguientes son práctica. No hay
"Otra partida": la tarjeta de Uno al día ofrece jugar otro o repetir el de hoy. **Todavía no está en el mazo:**
entra cuando Generala salga de próximamente, el primer día de un mazo que no haya empezado (D-247,
D-248).

## Flujo

```
Intro (modos) → Setup (nombres y la servida) → [Lobby: código + QR] → Mesa (11 vueltas) → Resultado → Otra partida / Revancha
```

1. **Intro:** de qué se trata, los tres modos, la partida a medias si la hay y la tabla de victorias.
2. **Setup:** nombres (2 a 6, o el tuyo jugando solo) y el interruptor "La generala servida gana".
3. **Mesa:** arriba, el total de cada uno con el del turno encendido (jugando solo no va); el título
   dice de quién es el turno y la línea de abajo, la vuelta y el tiro. Al centro los cinco dados, que
   se tocan para guardarlos (borde lima, se levantan y dicen "Guardado"). Debajo, **Tirar** (dice
   cuántos dados tira) y **Anotar**, y la planilla en dos columnas: los números y los juegos.
4. **Anotar:** la casilla libre muestra lo que valdría con los dados de ahora (en lima si suma). Nada
   viene elegido; se toca una casilla y el botón dice **"Anotar 30 en Full"** o **"Tachar Generala
   (0)"** (C-8). Un toque fuera la suelta.
5. **Pase (un celular):** lo que anotó, con sus dados, y debajo "Pásale el celular a X"; solo el
   botón avanza (C-9). En la sala, la línea de estado dice "Ana anotó 30 en Full".
6. **Generala servida:** una pantalla que la celebra con los dados y quién gana; de ahí al final.
7. **Final:** quién ganó (o el empate), los puestos con sus totales y, plegadas, todas las planillas
   en una tabla. Jugando solo: el puntaje, el tiempo, el récord o el aviso de los rankings.

### Memoria de partida (C-6)

En un celular y jugando solo se guardan la configuración, los nombres, la lista de mensajes, **los
dados guardados a medio turno** y la hora de inicio (el tiempo de jugar solo). Retomar es reproducir
la lista; en un celular vuelve la pantalla de pase. En la sala se guarda cómo volver a entrar
(código, rol, nombre): el estado vive en Firebase.

## Protocolo de mensajes

La partida se deriva de la lista de mensajes (C-7). Cada turno es `roll{1,3} → score`.

| Mensaje | Campos | Cuándo |
|---|---|---|
| `roll` | `d` los cinco dados después de tirar ("31456"), `k` qué posiciones se guardaron ("10100") | En su turno, hasta tres veces |
| `score` | `c` la casilla (`1`…`6`, `escalera`, `full`, `poker`, `generala`, `doble`) | En su turno, después de tirar |

El motor descarta lo que no corresponde: fuera de turno, un cuarto tiro, un tiro sin soltar ningún
dado, un dado guardado que cambió de cara, una casilla ocupada o anotar sin haber tirado. Los puntos
no viajan: los calcula el motor con los dados y el tiro.

```json
{
  "mode": "local",
  "config": { "servidaGana": true, "players": ["A", "B"] },
  "names": { "A": "Javi", "B": "Cata" },
  "messages": [{ "t": "roll", "from": "A", "d": "33125", "k": "00000" }, { "t": "roll", "from": "A", "d": "33326", "k": "11000" }, { "t": "score", "from": "A", "c": "3" }],
  "keep": [true, true, true, false, false],
  "done": false
}
```

## Archivos

```
public/generala/index.html · public/generala/style.css · public/generala/rules.js · public/generala/game.js
public/generala/engine.js · public/generala/engine.test.mjs
tools/e2e/generala/local.mjs    jugar solo, tres en un celular con recarga y la generala servida
tools/e2e/generala/online.mjs   dos celulares contra Firebase real, con recarga y revancha
tools/e2e/generala/idiomas.mjs  cada pantalla de caminos.mjs en los cuatro idiomas
```

Gancho de pruebas (C-14): `window.__generala` (`view`, `match`, `session`).

## Excepciones a los cánones

- **C-7, lo que se reparte sale de la semilla:** los dados no salen de la semilla fuera de Uno al
  día, porque la semilla adelantaría los próximos tiros a quien la lea (D-246).
- **C-10, anti-trampa:** no hay secretos que comprometer; los dados van en claro, como en la mesa
  (D-246).
