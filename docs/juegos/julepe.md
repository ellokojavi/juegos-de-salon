# Diseño: Julepe 🍹

**Ruta:** `/julepe/` · **Jugadores:** 2 a 6 · **Versión:** 0.34 · **Idiomas:** es, en (“Julep”), pt (“Paga o Bolo”)

**Estado:** fuera del menú por ahora, mientras se reescriben las reglas (D-88). El juego sigue entero acá.

## 1. Resumen

Juego de bazas de la familia del Tute, adaptado a tragos. En cada mano hay un **plato** de tragos
sobre la mesa. Cada jugador mira sus cinco cartas y dice, en secreto, si **va** o **se pasa**.
Ir es comprometerse a ganar **dos bazas de las cinco**: quien va y lo consigue se salva y además
reparte dos tragos por baza a quien quiera; quien va y no llega **se toma el plato entero**, y eso
es el **julepe**. Lo que se bebió vuelve al plato, así que la mano siguiente sale más cara: dos
julepes seguidos dejan un plato de veinte antes de que nadie se dé cuenta.

El celular hace lo que en la mesa real se hace mal: baraja, **no deja tirar una carta que no
corresponde** —asistir, montar y fallar son tres reglas que en una mesa con tragos se discuten
toda la noche—, lleva la cuenta del plato y se acuerda de quién le debe tragos a quién.

## 2. Reglas

- **Baraja inglesa de 52 cartas**, sin comodines. De mayor a menor: A > K > Q > J > 10 > … > 2.
- **El plato:** cuando está vacío, cada jugador pone 2 tragos. Solo se vuelve a poner cuando se
  vacía, y se vacía cuando nadie se julepea.
- **Reparto:** cinco cartas a cada uno y una más a la vista; el palo de esa carta es el **triunfo**
  y le gana a cualquier carta de los otros palos. El reparto rota hacia la derecha.
- **Declaración:** desde la derecha del dador, cada uno dice si va o se pasa. Pasarse no cuesta
  nada y deja al que se pasó fuera de la mano: no gana, no pierde y no bebe.
- **Si van dos o más**, se juega. **Si se pasan todos**, la mano se anula, el plato queda como
  estaba y reparte el siguiente. **Si va uno solo**, el dador se queda **obligado** (D-83).
- **Cambio:** los que van sueltan hasta tres cartas y reciben otras tantas.
- **Las cinco bazas.** Sale el primero de los que van, contando desde la derecha del dador. Hay
  tres obligaciones, en este orden:
  1. **asistir**: si tiene del palo de salida, juega de ese palo;
  2. **montar**: si con una de esas le gana a la más alta del palo de salida que está en la mesa,
     tiene que jugar una que gane;
  3. **fallar**: si no tiene del palo de salida pero tiene triunfos, juega un triunfo.
  Si no puede ninguna, tira lo que quiera. Se lleva la baza el triunfo más alto, y si no hubo, la
  carta más alta del palo de salida. Quien gana la baza abre la siguiente.
- **La cuenta:** con dos bazas o más, se salva y reparte `2 × bazas` tragos a quien quiera de la
  mesa, todos a la misma persona o repartidos. Con menos de dos, **julepe**: se toma el plato
  entero. El plato de la mano siguiente es el plato por la cantidad de julepes (dos julepes lo
  doblan); si no hubo ninguno, queda vacío y se vuelve a poner.
- **Fin de la partida:** 5, 8 o 12 manos, a elección. Gana quien terminó más seco.

### Lo que no está y por qué

**Obligar a sobremontar el triunfo** (cuando la baza ya viene fallada, jugar un triunfo más alto
si se tiene) es regla de mesa en el Bourré y en varias casas. Acá no está: son cuatro reglas para
explicar en tres idiomas en la primera baza de la noche, y la tercera ya es la que más cuesta. El
motor la tiene a un `if` de distancia, en `legales()`.

**Apostar el plato** (subir la entrada, o que el que se salva se lleve el plato) tampoco: el plato
que crece solo con los julepes ya es el motor del juego, y sumarle una apuesta lo convierte en otra
cosa.

## 3. Modos

| Modo | Jugadores | Cómo |
|---|---|---|
| 📱 Un celular | 2 a 6 | Se pasa el celular. Cada uno mira sus cartas, declara, cambia y tira, y el aparato vuelve a la mesa entre turno y turno (C-9). Es el modo con más pases de toda la app: una mano de tres son más de veinte. |
| 📡 Varios celulares | 2 a 6 | Sala con código de 4 letras, QR y chat. El reparto viaja **cerrado para cada jugador** (D-81) y al cerrar la mano cada celular destapa lo suyo para que todos verifiquen (C-10). |
| 🤖 Contra el celular | 1 | De uno a cinco rivales del aparato, a elección: declaran, cambian y juegan mirando **solo sus propias cartas**. |

## 4. De dónde salen las cartas, y por qué no de la semilla

Es el mismo problema de los dados del Dudo (D-70): el código es público, así que una semilla
compartida deja a cualquiera calcular la mano del rival abriendo la consola. Pero las cartas son
peores que los dados, porque hay que **entregárselas** a alguien y que nadie más las vea *mientras*
se juega; un hash no sirve para eso.

La solución, en tres piezas:

1. **Sobres cerrados** (`assets/js/sobre.js`, D-81). Cada celular genera un par de llaves al entrar
   a la sala y publica la pública con su nombre. Quien reparte cierra la mano de cada uno con la
   llave de esa persona (RSA-OAEP del propio navegador, sin bibliotecas). Solo ese celular la abre.
2. **La reserva** (D-82). A cada jugador le tocan ocho cartas: las cinco de la mano y tres tapadas.
   Cambiar saca de la reserva propia, no de un mazo común, así que las cartas nuevas también son
   secretas. Además, el cambio viaja por **puestos** (`i: '0,3'`) y no por nombres de carta: decir
   "cambio el 10♠" es contarle a la sala una carta que se tenía.
3. **El destape** (C-10). Al cerrar la mano, cada celular publica las ocho cartas que recibió. Con
   eso y los puestos que cambió, cualquiera rehace su mano exacta y comprueba que todo lo que tiró
   estaba ahí, y que la misma carta no aparece en dos manos. La pantalla lo dice: "Cartas
   verificadas ✅" o el nombre del que no cuadra. Es también lo que la mesa quiere ver igual:
   qué tenía el que se julepeó.

Lo que esto **no** evita: quien reparte arma las manos, así que pasan por su celular en claro. Es
el mismo trato de la mesa real —el que baraja podría marcar las cartas— y por eso el reparto rota
en cada mano. Si el navegador no tiene `crypto.subtle` (http sin más), no se puede cerrar nada: el
reparto va en claro y el cierre de la mano lo dice, en vez de fingir un secreto que no existe (C-14).

## 5. Protocolo de mensajes

Todo el estado sale de la lista de mensajes (C-7). `buildState({ players, config, plays, yo, privadas })`
es la única verdad; lo que no corresponde se descarta en silencio.

| Mensaje | De | Qué lleva |
|---|---|---|
| `hello` | cada uno | `name` y, en la sala, `pub` (su llave pública) |
| `start` | anfitrión | `order`: la mesa, en el orden de llegada |
| `reparte` | el dador | `n` (nº de mano), `triunfo`, y `m` (manos en claro, un celular) **o** `s` (un sobre por jugador, sala) |
| `va` / `paso` | el de turno | — |
| `cambia` | el de turno | `i`: los puestos que suelta, `'0,3'` o `''` |
| `juega` | el de turno | `c`: la carta, `'10♦'` |
| `regala` | el que se salvó | `a`: un rol por cada baza ganada, `'B,B,C'` (dos tragos cada uno) |
| `revela` | cada uno | `n` y `cs`: las ocho cartas que le tocaron en esa mano, al cerrarla |
| `chat` | cada uno | `text` (no es parte del estado, C-15) |

## 6. El celular que juega

Tres decisiones, todas con lo que ese jugador ve y nada más (`julepe/engine.js`):

- **Ir o pasarse.** Le pone número a la mano: un triunfo vale de 0,30 (el 2) a 0,90 (el as), porque
  aunque sea bajo corta; fuera del triunfo solo mandan el as (0,65) y el rey (0,45). Se descuenta
  un 8% por cada rival de más y se suma lo que espera mejorar con el cambio. Entra si la suma pasa
  un umbral que **se mueve con el plato**: arriesgar veinte tragos por el derecho a repartir cuatro
  no es lo mismo que arriesgar seis. Queda un poco de ruido para que dos bots con la misma mano no
  hagan siempre lo mismo.
- **Qué cambia.** Guarda triunfos, ases y reyes; suelta lo bajo, y antes lo de los palos donde
  tiene poco.
- **Qué tira.** Abriendo: con dos triunfos o más sale de triunfo para arrastrar los del resto; si
  no, un as de otro palo; si no, lo más barato. Siguiendo: si puede ganar la baza, la gana con lo
  más barato que le sirva; si ya está perdida, suelta su peor carta.
- **A quién le da los tragos.** Todos a la misma persona, y a la que va más seca.

## 7. Archivos

```
julepe/
  index.html        Pantallas, barra superior, #handoff y #cover
  style.css         Naipes, mesa, plato, cierre de la mano
  rules.js          GAME_ID, DEFAULT_CONFIG, LARGOS y LOCALES = { es, en, pt }
  engine.js         Cartas, obligaciones, plato, julepe, bots y el reductor. Sin DOM
  engine.test.mjs   node julepe/engine.test.mjs
  game.js           Máquina de estados y render; lo único que toca el DOM
assets/js/sobre.js  Sobres cerrados de la sala (compartido, D-81)
tools/e2e/julepe-local.mjs    Partida completa contra el celular y en un celular
tools/e2e/julepe-online.mjs   Sala de tres celulares contra Firebase
```
