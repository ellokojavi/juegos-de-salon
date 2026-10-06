# Uno al día

**Estado:** propuesta, espera al dueño (D-230) · **Fecha:** 2026-10-05 ·
**Toca:** D-188 (Juego al azar), D-212 y D-217 (rankings), D-221 a D-229 (avisos), D-97 (semillas)

Una modalidad nueva en la portada, al lado de **Juego al azar**: cada día la app sorprende con un
juego, el mismo desafío para todos, y lleva la cuenta de cuántos días seguidos juega cada uno, cómo
le fue y si está mejorando. El objetivo es que la gente vuelva todos los días por su cuenta o
con un aviso que pidió, y que de paso conozca los demás juegos.

Las pantallas están dibujadas en un lienzo aparte (privado del dueño).

## En corto

1. **Un botón nuevo en la portada**: 📅 **Uno al día**, junto a 🎲 **Juego al azar**. Muestra la
   racha (🔥 6) y si ya se jugó hoy.
2. **El juego de hoy es el mismo para todos**, con el mismo contenido: sale de la fecha, como el
   contenido de un día de La Copa sale del código y del día (D-97). Así hay ranking del día y algo
   que compartir ("hoy me fue mejor que a ti").
3. **La sorpresa es el dado** de Juego al azar (D-188): la primera vez del día, el dado rueda y
   cae en el juego de hoy. Las veces siguientes abre directo.
4. **Se lleva la cuenta en el celular, sin cuenta ni red**: racha, calendario, puntajes. Con
   jugador (nombre y PIN, D-212) la cuenta se guarda en Firebase, pasa de un celular a otro y
   entra a los rankings.
5. **Los avisos los pide el jugador** y elige la hora: el recordatorio del día, el aviso de que la racha
   se corta y el resumen de la semana. Para quien no quiere avisos hay otras formas de acordarse:
   la portada, el ícono con un globo, el calendario y la tarjeta para compartir.
6. Todo **sin servidor nuevo**: lo que ya hay de semillas, rankings, `push.js`, `sw.js` y el
   workflow de avisos de GitHub (D-224).

## Qué juegos entran

Solo los que se juegan solo y tienen semilla (los de La Copa sueltos, D-142): **Línea Relámpago,
Toque y Fama: adivina el número, Conexiones, Toque y Fama: Palabra, ¿En qué año?, Reinas y
Desenredo**. Son siete, uno por día de la semana. Zip, Tango y ¿Dónde queda? entran al salir del
laboratorio, y con ellos la regla pasa a ser "no se repite en 7 días".

Los juegos de grupo (Dudo, Batalla Naval, Cuarto Rey…) no entran, porque necesitan gente al lado. Sí aparecen
**después** de jugar, como "¿Otro más?" (abajo): Uno al día es la puerta a todos.

**La rotación:** cada semana (lunes a domingo, la misma semana ISO de los rankings) baraja los
siete juegos con la semilla `uno-al-dia:s2026-41`. El contenido del día sale de
`uno-al-dia:2026-10-05`, con el `azar()` de `cup/games/semilla.js`. Es una semilla distinta de las
de cualquier copa, así que no adelanta nada de una copa en curso.

**Cuándo cambia el día:** a la medianoche **del jugador**, como Wordle. Un jugador en Madrid juega
el "5 de octubre" antes que uno en Santiago, con el mismo desafío. La alternativa (medianoche de
Chile para todos) haría que en Europa el juego cambie a media mañana. Se numera desde el
lanzamiento: **Uno al día n.° 1, n.° 2…**, para compartir.

## Cómo lo vive el jugador

### Día 1: lo descubre

1. En la portada ve **📅 Uno al día** con un punto que brilla (hoy no se ha jugado).
2. Lo toca: el dado rueda y cae en 👑 **Reinas**. Abajo: "Uno al día n.° 12 · Hoy te toca Reinas".
3. Se abre el juego en su intro de siempre, con una línea arriba: "📅 Uno al día · el mismo
   desafío para todos hoy". Cómo se juega y el puntaje son los del juego (U-18), no se repiten.
4. Juega. Al terminar, el resultado de siempre y debajo una tarjeta nueva:

   > **🔥 Racha: 1 día** · Vuelve mañana para el día 2.
   > Hoy: 87 puntos · mejor que el 64 % de los que jugaron.
   > **Compartir** · **¿Otro más?**

5. Si no tiene jugador: "Guarda tu racha en cualquier celular: entra con tu nombre y un PIN"
   (**Entrar**, el mismo de los rankings). Si dice que no, la racha queda igual en el celular.
6. Si es la segunda vez que termina Uno al día (el día 2, no el 1, para no pedirlo antes de que
   le guste), se le ofrecen los avisos (más abajo).

### Día 2 en adelante: vuelve

- **Por su cuenta:** abre la app y el botón dice **🔥 1 · Juega el de hoy**.
- **Con un aviso** a la hora que eligió: "📅 Tu juego de hoy ya está. 🔥 Racha: 1 día." Al tocarlo
  rueda el dado.
- Si ya jugó, el botón dice **✅ Listo · 🔥 2** y al tocarlo abre su página de Uno al día (sus
  números, el ranking del día y cuánto falta para el próximo: "El próximo, en 7 h 12 min").

### Quiere jugar más

- Después de Uno al día, **¿Otro más?** tira el dado de Juego al azar (cualquier juego de la
  portada, también los de grupo). No cuenta para la racha, pero sí para "Juegos esta semana" y
  para los rankings normales de ese juego.
- **Repetir el desafío de hoy** se puede, como práctica: el ranking del día toma solo el
  primer intento completo, igual que en La Copa.

### Se le olvida un día

- **Comodines** 🧊 (como en Duolingo): cada 7 días seguidos se gana uno, y se pueden tener hasta
  2. Si un día no juega, se gasta uno solo y la racha sigue. Al volver, el jugador lee: "🧊 Usaste un
  comodín ayer. Tu racha sigue: 🔥 9."
- Sin comodines, la racha vuelve a cero, pero la **mejor racha** queda: "Tu mejor racha: 14
  días. ¿La superas?"

### Una semana, un mes

- El lunes, el **resumen de la semana**: días jugados, puntos totales, el juego en que más mejoró
  y su puesto en la semana.
- En su página, un **calendario** del mes: cada día pintado según cómo le fue, con el emoji del
  juego, y 🧊 en los días que salvó un comodín.

## Su página: 📅 Uno al día

En `/today/` (carpeta en inglés, D-192; el id es `'uno-al-dia'`). Arriba lo de hoy y abajo lo
acumulado:

| Bloque | Qué muestra |
|---|---|
| **Hoy** | El juego de hoy y su resultado, o **Jugar** si falta; el reloj al próximo |
| **Racha** | 🔥 actual, mejor racha y comodines 🧊 |
| **Calendario** | El mes, con un cuadro por día; se va a meses anteriores |
| **Por juego** | Una fila por juego: veces jugado, promedio, mejor y una línea con los últimos 8. La flecha dice si va mejorando: el promedio de los últimos 3 contra los 5 de antes (▲ +12) |
| **Rankings** | Pestañas: **Hoy** (el desafío de hoy) · **Semana** (suma de puntos) · **Rachas** (mejor racha) · **Amigos** (los de sus copas, que `jugador.js` ya conoce) |
| **Avisos** | La campana con su estado y la hora elegida, y **Agregar a mi calendario** |

**"Mejoró o no"** se dice en palabras además de la flecha: "En Reinas vas mejorando: tus últimas 3
promedian 82, antes 70." Así se entiende sin leer gráficos.

## Avisos (push): los que pide el jugador

D-221 dejó fuera los avisos de "¡vuelve a jugar!" porque nadie los pidió. Estos son distintos: el
jugador los activa a propósito, elige la hora y los apaga de un toque. Por eso caben, con su
propia casilla, apagados hasta que el jugador diga que sí.

### Cuándo se ofrecen

- **Al terminar Uno al día por segunda vez**, en la tarjeta del resultado:
  "🔔 ¿Te avisamos mañana? Elige la hora." con tres botones de hora: **Mañana · 9:00**,
  **Almuerzo · 13:00**, **Tarde · 19:00** (y "otra hora" en su página). Después, **Ahora no**.
- **Siempre**, desde la campana de su página.
- El camino según el celular es el de La Copa (`push.js`): directo en Android y en la app instalada,
  la hoja de "Agrega la app a tu inicio" en Safari del iPhone y "Ábrela en Safari" dentro de
  WhatsApp. En el iPhone, la app instalada parte en la portada (D-227), así que el paso 3 de la hoja
  dice "toca **Uno al día** y después la campana".
- Si el celular ya dio permiso por La Copa, no se vuelve a preguntar al sistema: solo se elige la
  hora (principio 7 de D-221).

### Los avisos

| Aviso | Cuándo | Texto (propuesta) |
|---|---|---|
| **Tu juego de hoy** | A la hora elegida, si no ha jugado | "📅 Uno al día n.° 13 ya está. 🔥 Racha: 6 días." |
| **Se corta la racha** | 21:00 del jugador, si no ha jugado y tiene racha de 2 o más | "🔥 Tu racha de 6 días se corta a medianoche. Te quedan 3 horas." (con comodín: "…Tienes un comodín 🧊, pero mejor no gastarlo.") |
| **Tu semana** | Lunes, a la hora elegida (casilla aparte, encendida por defecto) | "📊 Semana 40: jugaste 6 de 7 días y quedaste 14.° de 230. Lo mejor: Reinas." |

- **El aviso no dice qué juego toca**: la sorpresa queda para el dado, y la curiosidad es un motivo
  más para tocarlo.
- **A lo más 2 al día**, y de noche nunca (22:00 a 8:00), como los de La Copa. Si el mismo celular
  tiene un día de copa pendiente, va primero el de la copa y Uno al día se suma en una línea:
  "…y tu Uno al día también te espera".
- **Se calman solos:** si en 14 días no toca ningún aviso ni juega, el diario pasa a día por medio. Si
  pasan 30 días sin jugar, llega uno último ("Tu mejor racha fue de 14 días. Cuando quieras,
  aquí está.") y se apagan. Así no terminan bloqueando también los de La Copa.
- La hoja de la campana: tres interruptores (el diario, el de la racha y el de la semana), la
  hora, **Probar los avisos** y **Silenciar**.

## Sin avisos: lo que el jugador va a buscar

Para quien no quiere avisos, o tiene un iPhone sin la app instalada:

| Forma | Cómo funciona |
|---|---|
| **El botón de la portada** | Su estado se ve al entrar: el punto que brilla, 🔥 6 y "Juega el de hoy" o "✅ Listo". |
| **El globo en el ícono** | En la app instalada (Android, y iPhone con avisos permitidos), un **1** en el ícono si hoy no ha jugado (`navigator.setAppBadge`). Lo pone la página al abrir y lo quita al terminar; el service worker lo pone con el aviso del día. |
| **Agregar a mi calendario** | Un evento que se repite cada día a la hora que elige, con el link a `/today/`. Sale de un `.ics` armado en el celular, sin servidor ni permisos, y sirve en cualquier celular. |
| **La tarjeta para compartir** | Al estilo Wordle, sin adelantar la respuesta: el grupo de WhatsApp le recuerda a cada uno que juegue. |
| **El link fijo** | `juegosdesalon.cl/today/` siempre abre el de hoy: se guarda en favoritos o se fija en un grupo. |

La tarjeta para compartir (texto, y la imagen como la de compartir la app, D-226):

```
📅 Uno al día n.° 12 · 👑 Reinas
87 puntos · 1:42 · mejor que el 64 %
🔥 6 días seguidos
juegosdesalon.cl/today/
```

## Rankings y datos

Sobre lo que ya hay en D-212 (`records/<tabla>/<periodo>/<jid>`), con lo mínimo nuevo:

| Qué | Dónde | Nota |
|---|---|---|
| El historial del jugador | `unoAlDia/<jid>/<fecha>` = `{ j, s, ms, at }` | Una vez por fecha: las reglas no dejan reescribirla, y la fecha tiene que estar a 14 horas o menos de la hora del servidor. |
| **Ranking del día** | `records/uno-al-dia/d2026-10-05/<jid>` | Un período nuevo, `dAAAA-MM-DD`, en `PERIODO` de `records.js` y en las reglas. |
| **Ranking de la semana** | `records/uno-al-dia/s2026-41/<jid>` | La suma de la semana. Solo sube, como cualquier récord, y las reglas exigen que suba lo que dice el historial del día. |
| **Mejor racha** | `records/uno-al-dia-racha/siempre/<jid>` | Solo sube. Las reglas exigen que no pase los días del historial. |
| La racha de hoy y los comodines | El celular, y `jugadores/<jid>/unoAlDia` = `{ racha, comodines, ultimo }` | Se recalcula del historial, que es la fuente. |
| Sin jugador | `localStorage` (`juegos-de-salon:uno-al-dia`) | Al entrar con jugador, lo del celular se sube al historial una vez. |
| "Mejor que el 64 %" | Se cuenta con el ranking del día ya leído (`LEER = 100`) | Con más de 100 jugadores es una aproximación, y se dice "de los primeros 100". |

El puntaje de Uno al día **también** va al ranking normal del juego y al Todoterreno: es el mismo
juego. Las partidas se cuentan en `partidas` (D-219).

**Avisos:** `pushDia/<subId>` = `{ hora, racha, semana, ultimo, at }`, al lado de `push/<subId>`
(que ya trae idioma y zona horaria) y nadie lo lee. `ultimo` (la última fecha jugada) lo escribe
el celular al terminar, así que el aviso sabe si ya jugó aunque no tenga jugador.
`tools/push/calendario.mjs` suma los tres avisos nuevos a su vuelta de cada 15 minutos.

## Qué se mide (panel, D-44)

- **Cuántos juegan Uno al día** cada día, y cuántos lo terminan.
- **Retención**: de los que jugaron por primera vez un día, cuántos volvieron al día siguiente, a los 7 y a los 30 días. Es la
  cifra que dice si funciona.
- **Rachas**: cuántos tienen 1, 2 a 6, 7 a 29, y 30 o más.
- **De dónde llegan**: botón de la portada, aviso (`?aviso=dia`), calendario (`?de=cal`), link
  compartido (`?de=compartir`).
- **Tráfico a otros juegos**: cuántos tocan **¿Otro más?** y qué juegan.
- **Avisos**: se ofrecieron → eligió hora → permiso → avisos tocados, y cuántos se silencian.

## Por partes

| PR | Qué trae | Detrás del laboratorio |
|---|---|---|
| **1. El núcleo** | Botón, rotación y semilla, dado, línea en la intro, tarjeta del resultado, racha y calendario en el celular, compartir, `/today/` con lo local | Sí (`UNO_AL_DIA_EN_LABS`) |
| **2. Con jugador** | Historial en Firebase, ranking del día, de la semana y de rachas, comodines, amigos, reglas | Sí |
| **3. Avisos y recordatorios** | Los tres avisos, la hoja de la hora, el globo del ícono, el calendario | Sí, como los de La Copa |
| **4. Panel y salida** | Las cifras del panel; se abre a todos | No |

Cada juego tiene que aceptar una **fecha** además de una semilla (`/queens/?dia=2026-10-05`) y
avisar al terminar. Ya aceptan `?semilla=` (D-142), así que el cambio es chico y se hace una sola
vez para todos en `cup/game.js`.

## Lo que decide el dueño

1. **¿El mismo juego y el mismo desafío para todos?** Recomendado: sí. Es lo que permite el ranking
   del día y compartir. La otra opción es un juego distinto para cada persona.
2. **¿El día cambia a la medianoche de cada jugador o a la de Chile?** Recomendado: la de cada uno.
3. **¿El aviso dice qué juego toca?** Recomendado: no, para guardar la sorpresa del dado.
4. **¿Comodines?** Recomendado: sí, uno cada 7 días, hasta 2.
5. **Los nombres en otros idiomas** (propuesta): *One a Day*, *Um por dia*, *Spiel des Tages*.
   El alemán se revisa contra [ALEMAN.md](ALEMAN.md).
6. **¿El resumen de la semana viene encendido** al activar los avisos? Recomendado: sí, con su
   interruptor.

## Textos para revisar (U-1, U-3, U-17)

Botones (caben en 320 px): **Uno al día**, **Juega el de hoy**, **Listo**, **Compartir**,
**¿Otro más?**, **Entrar**, **Ahora no**, **Mañana · 9:00**, **Almuerzo · 13:00**,
**Tarde · 19:00**, **Silenciar**, **Probar los avisos**, **Agregar a mi calendario** (este pasa de
18 caracteres: en 320 px va solo en su línea, o se acorta a **Al calendario**). "Racha" y
"comodín" se dicen siempre así (U-5). Los textos los propone el agente de usabilidad y el dueño
los corrige en el PR.
