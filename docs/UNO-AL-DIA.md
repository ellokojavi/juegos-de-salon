# Uno al día

**Estado:** aprobada por el dueño (D-230); en el laboratorio: el PR 1, el núcleo (v0.115.0), el PR 2, los juegos de grupo (v0.116.0), el PR 3, jugador, rankings, comodines e invitaciones (v0.117.0), y el PR 4, los avisos y recordatorios (v0.118.0) · **Fecha:** 2026-10-05 ·
**Toca:** RP-44, D-188 (Juego al azar), D-212 y D-217 (rankings), D-221 a D-229 (avisos), D-97 (semillas)

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
3. **Entran todos los juegos que tienen modo para uno**: los solitarios y los de grupo que se
   juegan contra el celular o con su mazo.
4. **La sorpresa es el dado** de Juego al azar (D-188), con la misma experiencia: **cada vez** que
   se abre el juego de hoy, el dado rueda y cae en él. Aunque el resultado sea el mismo para todos,
   el jugador siente que le tocó.
5. **Invitar a un amigo** después de jugar, con un dato llamativo de quien invita ("Sara lleva una
   racha de 33 días y está en el 10 % mejor de la semana. ¿Te atreves?"). El amigo abre su propio Uno al
   día y se comparan.
6. **Se lleva la cuenta en el celular, sin cuenta ni red**: racha, calendario, puntajes. Con
   jugador (nombre y PIN, D-212) la cuenta se guarda en Firebase, pasa de un celular a otro y
   entra a los rankings.
7. **Los avisos los pide el jugador** y elige la hora: el recordatorio del día, el aviso de que la racha
   se corta y el resumen de la semana. Para quien no quiere avisos hay otras formas de acordarse:
   la portada, el ícono con un globo, el calendario y la tarjeta para compartir.
8. Todo **sin servidor nuevo**: lo que ya hay de semillas, rankings, `push.js`, `sw.js` y el
   workflow de avisos de GitHub (D-224).

## Qué juegos entran

**Todos los que se pueden jugar de a uno** (pedido del dueño), cada uno en su modo para uno y con
el contenido del día:

| Juego | Modo | El desafío común del día | Puntaje del día (0 a 100) |
|---|---|---|---|
| ⏳ Línea Relámpago, 🔢 Toque y Fama: adivina el número, 🔗 Conexiones, 🔤 Toque y Fama: Palabra, 📅 ¿En qué año?, 👑 Reinas, 🧶 Desenredo | Su pantalla suelta (D-142) | Todo el contenido, como un día de La Copa | El de La Copa, el mismo de siempre |
| 🪢 El Ahorcado | 🎴 Mazo del celular, con 1 jugador | La palabra (ya sale de la semilla del mazo) | Las vidas que quedan, llevadas a 100, y el tiempo desempata |
| 🚢 Batalla Naval | 🤖 Contra el celular | La flota del celular | Menos disparos para hundirla, más puntos. Si te hunden antes, cuentan los barcos que hundiste |
| 🎲 Dudo | 🤖 Contra el celular | Los dados de cada ronda | Ganar vale 60, y cada dado que te queda suma; perder suma por las rondas que aguantaste |

- **Cuarto Rey no entra:** es un juego de mesa para 4 a 6 personas y no tiene modo para uno (su
  documento lo explica). **Julepe** tampoco, porque hoy no se ofrece en la portada; si vuelve,
  entra con su modo contra el celular.
- Zip, Tango y ¿Dónde queda? entran al salir del laboratorio.
- En Dudo y Batalla Naval el rival responde a lo que haces, así que lo común es el punto de partida
  (los dados, la flota) y no la partida entera. Igual se pueden comparar, y el ranking del día lo dice:
  "Todos parten con los mismos dados".
- **🎲 Jugar otro** (abajo) ofrece cualquier juego de la portada, también Cuarto Rey.

**La rotación:** son 10 juegos, así que no cabe uno por día de la semana. Funciona como un mazo: se
barajan todos con la semilla `uno-al-dia:ciclo:<n>` y salen de a uno por día, sin repetir, hasta
que se acaba el mazo (10 días). Al barajar el mazo siguiente, ningún juego puede salir antes de 7
días desde la última vez. Cada juego lleva la fecha desde la que entra a Uno al día. Así un juego
nuevo se suma en el mazo siguiente y los días ya pasados no cambian. El contenido del día sale de
`uno-al-dia:2026-10-05`, convertida en un código de copa de 5 letras (ver "Lo que el PR 1 hizo"). Es una semilla distinta de las
de cualquier copa, así que no adelanta nada de una copa en curso.

**Cuándo cambia el día:** a la medianoche **del jugador**, como Wordle. Un jugador en Madrid juega
el "5 de octubre" antes que uno en Santiago, con el mismo desafío. La alternativa (medianoche de
Chile para todos) haría que en Europa el juego cambie a media mañana. Se numera desde el
lanzamiento: **Uno al día n.° 1, n.° 2…**, para compartir.

## Cómo lo vive el jugador

### Día 1: lo descubre

1. En la portada ve **📅 Uno al día** con un punto que brilla (hoy no se ha jugado).
2. Lo toca: el dado rueda y cae en 👑 **Reinas**. Abajo: "Uno al día n.° 12 · ¡Hoy te toca Reinas!".
   Las caras del dado son los juegos que pueden salir, como en Juego al azar, y tocar en cualquier
   parte lo abre de inmediato.
3. Se abre el juego en su intro de siempre, con una línea arriba: "📅 Uno al día: hoy todos
   juegan el mismo desafío.". Cómo se juega y el puntaje son los del juego (U-18), no se repiten.
4. Juega. Al terminar, el resultado de siempre y debajo una tarjeta nueva:

   > **🔥 Racha: 1 día** · Vuelve mañana para el día 2.
   > Hoy: 87 puntos · mejor que el 64 % de los que jugaron.
   >
   > (El porcentaje sale solo si hoy jugaron 20 o más; con menos, la línea dice solo "Hoy: 87
   > puntos".)
   > **Compartir** · **🎲 Jugar otro**
   >
   > **👋 Invita a un amigo** (abajo, en "Invitar a un amigo")

5. Si no tiene jugador: "Guarda tu racha en cualquier celular: entra con tu nombre y un PIN."
   (**Entrar**, el mismo de los rankings). Si dice que no, la racha queda igual en el celular.
6. Si es la segunda vez que termina Uno al día (el día 2, no el 1, para no pedirlo antes de que
   le guste), se le ofrecen los avisos (más abajo).

### Día 2 en adelante: vuelve

- **Por su cuenta:** abre la app y el botón dice **📅 Uno al día 🔥 1**, con el punto que brilla
  (el botón va en una línea, ver "Lo que el PR 1 hizo").
- **Con un aviso** a la hora que eligió: "📅 Uno al día n.° 13 ya está. 🔥 Racha: 1 día." (el de la tabla de
  avisos) Al tocarlo
  rueda el dado.
- **Mientras no lo haya jugado, el dado rueda cada vez** que toca el botón, el aviso o un link, y
  siempre cae en el mismo juego (decisión del dueño: la misma experiencia de Juego al azar).
- Si ya jugó, el botón queda cian, **✅ Uno al día 🔥 2**, y al tocarlo abre su página de Uno al día (sus
  números, el ranking del día y cuánto falta para el próximo: "El próximo sale en 7 h 12 min.").

### Quiere jugar más

- Después de Uno al día, **🎲 Jugar otro** tira el dado de Juego al azar (cualquier juego de la
  portada, también los de grupo). No cuenta para la racha, pero sí para "Juegos esta semana" y
  para los rankings normales de ese juego.
- **Repetir el desafío de hoy** se puede, como práctica: el ranking del día toma solo el
  primer intento completo, igual que en La Copa.

### Se le olvida un día

- **Comodines** 🧊 (como en Duolingo): se gana uno cada 7 días seguidos y otro cada vez que un
  amigo que invitó termina su primer Uno al día, y se pueden tener hasta 2. Si un día no juega,
  se gasta uno solo y la racha sigue. Al volver, el jugador lee: "🧊 Usaste un
  comodín ayer y tu racha sigue: 9 días."
- Sin comodines, la racha vuelve a cero, pero la **mejor racha** queda: "Tu mejor racha: 14
  días. ¿La superas?"

### Una semana, un mes

- El lunes, el **resumen de la semana**: días jugados, puntos totales, el juego en que más mejoró
  y su puesto en la semana.
- En su página, un **calendario** del mes: cada día pintado según cómo le fue, con el emoji del
  juego, y 🧊 en los días que salvó un comodín.

## Invitar a un amigo

Después de jugar, debajo de **Compartir**, una tarjeta propia:

> **👋 Invita a un amigo**
> 🧊 Si tu amigo termina su primer Uno al día, ganas un comodín.
> "Llevo una racha de 33 días y estoy en el 10 % mejor de la semana. ¿Te atreves?"
> **Invitar**

**El dato de quien invita** se elige solo, entre los que son verdad para esa persona: se toman
los dos primeros que se cumplan, en este orden, y se unen con "y". Cada dato se escribe en
primera persona (el mensaje que manda quien invita) y en tercera (la tarjeta que ve el amigo), y
ninguno empieza con "y", para que se lea bien solo o en segundo lugar.

| Dato | Se usa si… | Primera persona | Tercera persona |
|---|---|---|---|
| Racha | 7 días o más | "Llevo una racha de 33 días" | "Sara lleva una racha de 33 días" |
| Puesto | Está en el 25 % mejor de la semana o de las rachas, y en esa tabla hay 20 jugadores o más | "estoy en el 10 % mejor de la semana" (o "…de las rachas") | "está en el 10 % mejor de la semana" |
| Hoy | Le fue mejor que a la mitad, y hoy jugaron 20 o más | "hoy saqué 87, mejor que el 64 %" | "hoy sacó 87, mejor que el 64 %" |
| Mejora | Su flecha sube en algún juego (la de su página) | "voy mejorando en Reinas" | "va mejorando en Reinas" |
| Constancia | Ninguno de los de arriba | "Ya jugué 12 días de Uno al día" | "Ya jugó 12 días de Uno al día" |

- **"Racha" y no "días seguidos":** un día salvado por un comodín no se jugó, así que "jugó los
  últimos 33 días seguidos" podría ser falso; "una racha de 33 días" es siempre verdad.
- **"Hoy" no dice el juego:** la tarjeta del amigo se lee antes del dado, y la sorpresa es del dado.
- **"Mejora" usa la misma flecha de su página** (los últimos 3 contra los 5 de antes), no "5 días
  mejorando", que la app no mide.
- **Los porcentajes nunca dicen algo falso:** se redondean hacia arriba al escalón siguiente (10,
  15, 20, 25 %), así que quien está en el 12 % lee "en el 15 % mejor". Con menos de 20 jugadores
  en la tabla no se habla de porcentajes.

**Quien invita** toca **Invitar** y se abre el diálogo de compartir del celular, solo con texto y
en primera persona, porque lo manda él. Como toda invitación, va sin imagen dibujada: la imagen la
pone la tarjeta social del link (U-33, D-72), la de Uno al día, que es fija y se lee igual para
cualquiera. El texto sigue el formato de U-30 (cabecera, una idea por línea y el link al final):

```
📅 *Uno al día* · Te desafío
🔥 Llevo una racha de 33 días y estoy en el 10 % mejor de la semana. ¿Te atreves?

🔗 juegosdesalon.cl/today/?inv=k7q2x9ab
```

**El amigo** abre el link y ve, antes del dado, una tarjeta en tercera persona:

> **🔥 Sara te desafía**
> Sara lleva una racha de 33 días y está en el 10 % mejor de la semana. ¿Te atreves?
> **Jugar el de hoy**

Toca, rueda el dado y juega **el mismo desafío que Sara**. Al terminar, además de su resultado,
ve el duelo: "**Tú 87 · Sara 92**. Mañana hay otro." Si Sara todavía no juega el de hoy, se dice
así: "Sara todavía no juega el de hoy." Desde ahí parte su propia racha, y Sara queda entre sus **Amigos** del ranking.

**Lo que se necesita:**
- `?inv=` lleva el `jid` de quien invita, que es público (es lo que guardan los rankings, D-212).
  El link no lleva ni el nombre ni el PIN: la página lee el nombre y los datos públicos de ese jid.
  Por eso la tarjeta del amigo dice el dato de hoy, no el del día en que se mandó el link: si la
  racha se cortó, se elige otro dato verdadero.
- **Sin jugador también se invita:** el texto lleva el dato, pero el link va sin `?inv=` y el
  amigo ve la bienvenida general ("Te invitaron a Uno al día"). Al invitar se ofrece entrar para
  que el amigo vea quién lo desafía.
- Si el amigo entra con su jugador, se anota `invitados/<jid de Sara>/<jid del amigo>`, y los dos
  quedan como amigos en el ranking de **Amigos** (hoy son solo los de las copas).

### El comodín por invitar (decisión del dueño)

Cuando un invitado termina su **primer** Uno al día, quien lo invitó gana un comodín 🧊, con el
mismo tope de 2. Al que invita le llega en la app (y en un aviso, si tiene avisos):
"🧊 Pedro aceptó tu desafío: ganaste un comodín." Si el amigo no tiene jugador, no hay nombre:
"🧊 Un amigo aceptó tu desafío: ganaste un comodín." Si ya tenía 2, no se promete lo que se
pierde: "👋 Pedro aceptó tu desafío." y nada más.

**Se dice, para que el jugador lo sepa** (pedido del dueño). Se anuncia en cuatro lugares, siempre
en una línea, con 🧊 al inicio (U-2), y nunca en el mensaje que recibe el amigo, porque ahí
parecería que se le invita por interés. La condición se dice siempre igual, "un amigo que
invitaste termina su primer Uno al día" (U-5): "juega" prometería el comodín a quien solo abre el
link.

| Dónde | Qué dice |
|---|---|
| La tarjeta **Invita a un amigo**, en el resultado | "🧊 Si tu amigo termina su primer Uno al día, ganas un comodín." |
| La tarjeta de la racha, cuando no tiene comodines y la racha es de 3 días o más | "🧊 No tienes comodines. Invita a un amigo y gana uno." con el botón **Invitar** |
| Su página, en el bloque de la racha y en el de invitar | "🧊 Comodines: 0 de 2. Ganas uno cada 7 días seguidos y cada vez que un amigo que invitaste termina su primer Uno al día." |
| La primera vez que gana un comodín por racha | "🧊 Ganaste un comodín por 7 días seguidos. También ganas uno cuando un amigo que invitaste termina su primer Uno al día." |

- **Con 2 comodines no se promete nada:** el tope es 2 y un comodín de más se perdería, así que
  mientras tenga 2 la línea del comodín se esconde y la tarjeta queda solo con el dato.
- **Necesita jugador a quien invita** (el link lleva su jid). Sin jugador, la tarjeta dice: "🧊 Entra
  con tu nombre y un PIN, y ganas un comodín cuando un amigo que invitaste termina su primer Uno al
  día." y ofrece **Entrar**. (No dice "por cada amigo": con el tope de 2, no sería verdad.)
- **Uno por celular invitado:** al terminar su primer día, el celular del amigo escribe
  `invitados/<jid de quien invita>/<uid del amigo>` = `{ fecha, j? }`, una sola vez (las reglas no
  dejan reescribirlo, ni que alguien se invite a sí mismo). El comodín se suma al leer esa lista,
  así que no hace falta que los dos estén conectados a la vez.

## Su página: 📅 Uno al día

En `/today/` (carpeta en inglés, D-192; el id es `'uno-al-dia'`). Arriba lo de hoy y abajo lo
acumulado:

| Bloque | Qué muestra |
|---|---|
| **Hoy** | El juego de hoy y su resultado, o **Jugar** si falta; el reloj al próximo |
| **Racha** | 🔥 actual, mejor racha y comodines 🧊 |
| **Calendario** | El mes, con un cuadro por día; se va a meses anteriores |
| **Por juego** | Una fila por juego: veces jugado, promedio, mejor y una línea con los últimos 8. La flecha dice si va mejorando: el promedio de los últimos 3 contra los 5 de antes (▲ +12) |
| **Rankings** | Pestañas: **Hoy** (el desafío de hoy) · **Semana** (suma de puntos) · **Rachas** (mejor racha) · **Amigos** (los de sus copas, que `jugador.js` ya conoce, y los que invitó o lo invitaron) |
| **Invitar** | Cuántos aceptaron sus desafíos, y **Invitar** |
| **Avisos** | La campana con su estado y la hora elegida, y **Agregar al calendario** (botón chico) |

**"Mejoró o no"** se dice en palabras además de la flecha: "En Reinas vas mejorando: tus últimas 3
promedian 82, antes 70." Así se entiende sin leer gráficos.

## Avisos (push): los que pide el jugador

D-221 dejó fuera los avisos de "¡vuelve a jugar!" porque nadie los pidió. Estos son distintos: el
jugador los activa a propósito, elige la hora y los apaga de un toque. Por eso caben, con su
propia casilla, apagados hasta que el jugador diga que sí.

### Cuándo se ofrecen

- **Al terminar Uno al día por segunda vez**, en la tarjeta del resultado:
  "🔔 ¿Te avisamos cada día para jugar? Elige la hora." con tres botones de hora (la pregunta no
  dice "mañana", que chocaría con el botón **Mañana · 9:00**): **Mañana · 9:00**,
  **Almuerzo · 13:00**, **Tarde · 19:00**. Después, **Ahora no**. (El diseño sumaba "otra hora" en su página; el PR 4
  dejó las mismas tres horas en la hoja de la campana.)
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
| **Tu juego de hoy** | A la hora elegida, si no ha jugado | "📅 Uno al día n.° 13 ya está. 🔥 Racha: 6 días." (sin racha, solo la primera frase) |
| **Se corta la racha** | 21:00 del jugador, si no ha jugado y tiene racha de 2 o más | Sin comodines: "🔥 Tu racha de 6 días se corta a medianoche. Te quedan 3 horas." Con comodines no se corta, así que no se dice que se corta: "🧊 Si no juegas hoy, gastas un comodín para salvar tu racha de 6 días. Te quedan 3 horas." |
| **Tu semana** | Lunes, a la hora elegida (casilla aparte, encendida por defecto) | "📊 Tu semana: jugaste 6 de 7 días y quedaste 14.° de 230. Donde más mejoraste: Reinas." (sin "Semana 40": el número de la semana no lo lleva nadie en la cabeza. El puesto, solo con jugador.) El PR 4 dice solo cuántos días jugó: "📊 Tu semana: jugaste 6 de 7 días." |

- **El aviso no dice qué juego toca**: la sorpresa queda para el dado, y la curiosidad es un motivo
  más para tocarlo.
- **A lo más 2 al día**, y de noche nunca (22:00 a 8:00), como los de La Copa. El diseño juntaba
  los dos cuando el celular tenía un día de copa pendiente ("…y tu Uno al día también te espera");
  el PR 4 no los junta: cada uno lleva su propio tope de 2.
- **Se calman solos:** si pasan 14 días sin jugar, el diario pasa a día por medio. Si
  pasan 30 días sin jugar, llega uno último ("🔥 Tu mejor racha fue de 14 días. Uno al día te
  espera cuando quieras.") y se apagan. Así no terminan bloqueando también los de La Copa.
- La hoja de la campana: tres interruptores (el diario, el de la racha y el de la semana), la
  hora, **Probar los avisos** (el mismo botón de La Copa) y **Silenciar**, que apaga los tres de
  un toque (como "Silenciar esta copa" en La Copa).

## Sin avisos: lo que el jugador va a buscar

Para quien no quiere avisos, o tiene un iPhone sin la app instalada:

| Forma | Cómo funciona |
|---|---|
| **El botón de la portada** | Su estado se ve al entrar: el punto que brilla mientras falta jugar, 🔥 6, y cian con ✅ cuando ya jugó. |
| **El globo en el ícono** | En la app instalada (Android, y iPhone con avisos permitidos), un **1** en el ícono si hoy no ha jugado (`navigator.setAppBadge`). Lo pone la página al abrir y lo quita al terminar; el service worker lo pone con el aviso del día. |
| **Agregar al calendario** | Un evento que se repite cada día a la hora que elige, con el link a `/today/`. Sale de un `.ics` armado en el celular, sin servidor ni permisos, y sirve en cualquier celular. |
| **La tarjeta para compartir** | Al estilo Wordle, sin adelantar la respuesta: el grupo de WhatsApp le recuerda a cada uno que juegue. |
| **El link fijo** | `juegosdesalon.cl/today/` siempre abre el de hoy: se guarda en favoritos o se fija en un grupo. |

La tarjeta para compartir es un resultado, así que va con imagen y texto juntos (U-33): la
imagen es la lámina de resultado de siempre (`laminaResultado`, con la misma cabecera, el puntaje,
el tiempo y "mejor que el 64 %" si hoy jugaron 20 o más), y el texto sigue U-30 y no repite lo que
la imagen ya dice (D-171): la cabecera, la racha, que la imagen no trae, y el link.

**Ni el texto ni la imagen dicen qué juego tocó hoy** (decisión del dueño, #215): quien lee la
tarjeta en el grupo casi siempre todavía no juega, y el juego se descubre en el dado, como con el
aviso (decisión 3 del dueño, abajo). La imagen va sin el nombre ni el emoji del juego, y el puntaje se lee como
"87 puntos". Es una excepción a U-31, que pide nombrar el juego en un resultado.

```
📅 *Uno al día n.° 12*
🔥 Racha: 6 días

🔗 juegosdesalon.cl/today/
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
| "Mejor que el 64 %" | Se cuenta con el ranking del día ya leído (`LEER = 100`) | Solo con 20 jugadores o más. Con más de 100 la app no sabe el total, y un porcentaje (o un "de 230") sería inventado: quien está entre los 100 leídos ve su puesto ("14.° de hoy") y el resto, solo su puntaje. Lo mismo vale para el puesto del resumen de la semana. |

El **primer intento** de Uno al día **también** va al ranking normal del juego y al Todoterreno:
es el mismo juego, con un tablero que nadie conocía. Los intentos repetidos son práctica y no van a
ningún ranking, porque el tablero ya es conocido: es la misma regla de D-212, que deja fuera la
semilla elegida en el link. Todos los intentos se cuentan en `partidas` (D-219).

**Avisos:** `pushDia/<subId>` = `{ h, d, r, w, u, c, k, m, sp, sn, at }`, al lado de `push/<subId>`
(que ya trae idioma y zona horaria), y nadie lo lee. El último día jugado (`u`) y la racha los
escribe el celular al terminar, así que el aviso sabe si ya jugó aunque no tenga jugador.
`tools/push/uno-al-dia.mjs` decide los avisos dentro de la vuelta de `avisar.mjs`, cada 15 minutos
(detalle en "Lo que el PR 4 hizo").

## Qué se mide (panel, D-44)

- **Cuántos juegan Uno al día** cada día, y cuántos lo terminan.
- **Retención**: de los que jugaron por primera vez un día, cuántos volvieron al día siguiente, a los 7 y a los 30 días. Es la
  cifra que dice si funciona.
- **Rachas**: cuántos tienen 1, 2 a 6, 7 a 29, y 30 o más.
- **De dónde llegan**: botón de la portada, aviso (`?aviso=uaddia`, y `uadracha`, `uadsemana`, `uadadios`), calendario (`?de=cal`), link
  compartido (`?de=compartir`) e invitación (`?inv=`).
- **Invitaciones**: cuántas se mandan, cuántos amigos abren el link, cuántos terminan su primer
  Uno al día y cuántos vuelven al día siguiente. Cuántos jugadores nuevos trae cada invitación es
  la cifra del crecimiento.
- **Tráfico a otros juegos**: cuántos tocan **🎲 Jugar otro** y qué juegan.
- **Avisos**: se ofrecieron → eligió hora → permiso → avisos tocados, y cuántos se silencian. Desde
  el PR 4, el bloque "🔔 Avisos al celular" del panel cuenta los mandados de cada tipo (`uaddia`,
  `uadracha`, `uadsemana`, `uadadios`); el embudo de la oferta y los silenciados no se miden
  todavía.

## Por partes

| PR | Qué trae | Detrás del laboratorio |
|---|---|---|
| **1. El núcleo** | Botón, rotación y semilla, dado, línea en la intro, tarjeta del resultado, racha y calendario en el celular, compartir, `/today/` con lo local. Los 7 juegos solitarios | Sí (`UNO_AL_DIA_EN_LABS`) |
| **2. Los demás juegos** | El Ahorcado, Batalla Naval y Dudo con la semilla del día y su puntaje de 0 a 100 | Sí |
| **3. Con jugador e invitaciones** | Historial en Firebase, ranking del día, de la semana y de rachas, comodines, amigos, **invitar a un amigo**, reglas | Sí |
| **4. Avisos y recordatorios** | Los tres avisos, la hoja de la hora, el globo del ícono, el calendario | Sí, como los de La Copa |
| **5. Panel y salida** | Las cifras del panel; se abre a todos | No |

Cada juego tiene que saber que es el de hoy (`/queens/?hoy`, ver "Lo que el PR 1 hizo") y
avisar al terminar. Los siete solitarios ya aceptan `?semilla=` (D-142), así que para ellos el cambio
es chico y se hace una sola vez en `cup/game.js`. El Ahorcado, Batalla Naval y Dudo tienen cada
uno su motor, y por eso van en su propio PR: el modo para uno abre directo, sin elegir modo, y el
celular saca la palabra, la flota o los dados de la semilla del día.

### Lo que el PR 1 hizo (v0.115.0)

- **El link no lleva la fecha:** es `?hoy` (`/untangle/?hoy`, o `/cup/suelto/?linea&hoy` para
  Línea Relámpago y el número, que no tienen página propia). La página calcula la fecha del jugador,
  el juego y la semilla, así un link viejo abre el de hoy y nadie elige el tablero. Si el link es de
  otro juego, la página se va al de hoy.
- **El mazo con 7 juegos:** "ningún juego antes de 7 días" con justo 7 juegos dejaba el mismo orden
  todas las semanas. Con menos de 9 juegos la espera es de dos días menos que los que hay (con 7,
  cinco días; con 8, seis); con 9 o más, 7 días, como dice arriba (`SIN_REPETIR`). El día n.° 1 es el 5 de octubre de 2026
  (`LANZAMIENTO` en `uno-al-dia.js`); se puede mover mientras esté en el laboratorio.
- **La semilla** es un código de copa de 5 letras sacado de la fecha (`semillaDel`), así los juegos
  no cambian: generan con ella como en cualquier copa. Las palabras van en el idioma de quien juega,
  como en el juego suelto: el desafío es el mismo para los que juegan en el mismo idioma.
- **La tarjeta del resultado** va justo bajo el puntaje: la racha, "Vuelve mañana para el día N", lo
  que cuenta de hoy (o que fue práctica), **Compartir mi resultado**, **🎲 Jugar otro**, **📅 Ver tu
  Uno al día** y **Repetir el de hoy**. Reemplaza al "Jugar otra vez" y al compartir del juego suelto.
- **Sin comodines, sin ranking del día y sin invitar todavía:** necesitan el jugador en Firebase
  (PR 3). El primer intento del día sí va al ranking normal del juego, si hay jugador; los demás no.
- **`/today/`**: hoy (el dado si falta, o el resultado con el reloj al próximo, compartir y jugar
  otro), la racha, la mejor racha, los días jugados, el calendario del mes (con el emoji del juego en
  cada día jugado, y los meses anteriores) y una fila por juego con su línea de los últimos 8 y la
  flecha, más la frase del que más mejoró o, si ninguno, del que más bajó.
- **Dónde va en la portada** (decisión del dueño, 2026-10-05): en la misma fila que Juego al azar,
  a su derecha, sin una línea extra. Los dos llevan etiqueta corta (**🎲 Al azar** y **📅 Uno al
  día 🔥 6**; en inglés *Random*, en portugués *Aleatório*, en alemán *Zufall*) para caber, también
  a 320 px y en alemán. Sin Uno al día, el dado sigue diciendo **Juego al azar**. La otra forma que se probó, una tarjeta de media fila al lado de La Copa (las dos como
  accesos de más jerarquía que los juegos), queda para probarla desde `/labs/` ("Junto a La Copa")
  o con `?uad=tarjeta`.
- El CSS del dado pasó de la portada a `base.css`, para tirarlo desde cualquier página.
- Se prueba con `uno-al-dia.test.mjs` (el mazo, la semilla, la racha, lo anotado) y
  `tools/e2e/uno-al-dia.mjs` (de la portada a `/today/`, a 320 px y en los cuatro idiomas).

### Lo que el PR 2 hizo (v0.116.0)

- **Entran El Ahorcado, Batalla Naval y Dudo** al mazo, con el id de la portada (`ahorcado`,
  `batalla-naval`, `dudo`) y `desde: '2026-10-07'` (`DESDE_GRUPO`). Los días anteriores no
  cambian: el primer mazo, del 5 al 11 de octubre, sigue con los 7 solitarios, y los 10 se barajan
  desde el mazo siguiente, que empieza el 12 (el primero de grupo sale el 13, Dudo). Con 10 juegos la
  espera es de 7 días, como decía el diseño. El link es el de su página: `/hangman/?hoy`,
  `/battleship/?hoy`, `/liars-dice/?hoy`. El dado y `/today/` los nombran con su nombre y emoji
  de `games.js` (Batalla Naval es ⚓, no 🚢 como decía la tabla de arriba).
- **Abren directo el modo para uno**, sin elegir modo: la intro de siempre lleva la línea de Uno al
  día y, en lugar de los modos, un solo botón **Jugar el de hoy**. El Ahorcado juega solo con el
  mazo del celular; Batalla Naval y Dudo, contra el celular (Dudo, un rival). Los ajustes son los de
  siempre y el nombre, el que se recuerda o "Jugador 1": no se pide nada. En Batalla Naval el
  jugador igual coloca su flota (con **Al azar** a mano).
- **Lo común sale de la semilla del día** con `azarDel(semilla, que)`: la palabra del Ahorcado (la
  semilla del mazo), la flota del celular en Batalla Naval y los dados de cada ronda de Dudo (por
  ronda y rol). Son partidas locales, así que la semilla no adelanta secretos (D-70 y C-10 hablan de
  la sala, donde se sigue tirando con el azar del navegador). En los dos con rival, la intro agrega
  "Todos parten con los mismos dados." o "Todos se enfrentan a la misma flota del celular." (se
  cambió "con la misma flota" por "se enfrentan a": la flota es la del celular, no la de cada uno).
- **Los puntajes**, funciones puras en `uno-al-dia.js` con su prueba: El Ahorcado, las vidas que
  quedan llevadas a 100 (0 si lo colgaron; el tiempo que se anota es el del juego). Batalla Naval,
  ganando, 100 con 17 disparos y bajando parejo hasta 40 con 100; perdiendo, 6 por casilla
  acertada **hasta 39**: con 6 por casilla, 7 aciertos ya pasaban de 40, el mínimo al ganar, así que
  se topó para que perder valga siempre menos. Dudo, ganando, 60 más 8 por dado que queda;
  perdiendo, 10 por ronda aguantada (todas menos la última) hasta 50.
- **La tarjeta del resultado** va arriba de los botones del juego, que siguen ahí (a diferencia de
  los solitarios, donde la tarjeta reemplaza "Jugar otra vez"): el resultado de cada juego tiene su
  propia forma. La revancha del juego es una partida cualquiera, sin tarjeta; para repetir el
  desafío está **Repetir el de hoy**. El primer intento cuenta; los siguientes son práctica.
- La lógica común de los tres está en `uno-al-dia-ui.js`: `modoHoy` (la fecha, la semilla, si ya
  jugó y el salto al juego de hoy), `introHoy`, `terminarHoy` y `ponerTarjeta`.
- **Sin rankings del día** todavía (PR 3), y estos tres no anotan en el ranking normal jugando solo
  o contra el celular más que lo de siempre (las victorias contra el celular, D-215).
- Se prueba con `uno-al-dia.test.mjs` (el mazo con 10 juegos, los días anteriores sin cambios, las
  fórmulas, la flota con semilla) y `tools/e2e/uno-al-dia-grupo.mjs` (cada juego jugado hasta el
  resultado con el reloj en un día en que le toca).

### Lo que el PR 3 hizo (v0.117.0)

- **La historia en Firebase** va por número de día y no por fecha: `unoAlDia/<jid>/<n>` =
  `{ j, s, ms, at, w? }`, con `n` los días desde 1970 (`numDia`, 20731 es el 5 de octubre de 2026).
  Se escribe una vez y la lee cualquiera (la tarjeta de quien invita necesita su racha). `w` marca que
  ese día ya se sumó a la semana.
- **Los rankings** usan las tablas de siempre (`records`, D-212): `uno-al-dia/d<n>` (el día: el
  período nuevo `d` + número), `uno-al-dia/s2026-41` (la suma de la semana de la fecha del jugador) y
  `uno-al-dia-racha/siempre` (la mejor racha). Las reglas exigen que el puntaje del día sea el de la
  historia, y que la semana sume un día de la historia (`u`) que no se había sumado (`w`, en la misma
  escritura). Se ven en `/today/` y bajo el resultado: **Hoy · Semana · Rachas · Amigos**.
- **Lo que las reglas no pueden revisar:** no convierten texto en número, así que no comparan el
  número del período con la hora del servidor, y la mejor racha la calcula el celular. Un tramposo
  podría inflar su racha o anotar un día que no es el suyo. Mientras esté en el laboratorio se
  acepta; si molesta, el workflow de los avisos puede recalcular las rachas desde la historia.
- **Los comodines** no se guardan: salen de recorrer la historia (`recorrer` en uno-al-dia.js),
  igual sin jugador. Cada 7 días jugados seguidos se gana uno; un día sin jugar gasta uno o corta la
  racha; tope 2. Los días salvados van con 🧊 en el calendario, y la tarjeta del resultado dice
  cuándo se usó o se ganó uno.
- **Entrar con el jugador** sube el de hoy (si se jugó antes de entrar) y trae la historia de
  otros celulares. Los días viejos del celular no se suben: las reglas aceptan solo escrituras
  frescas, así que quedan en el celular y se juntan al mostrar.
- **Invitar:** el link es `today/?inv=<jid>` si quien invita tiene jugador (sin jugador, `today/`
  y la tarjeta le ofrece entrar para ganar el comodín). El amigo ve "🔥 Sara te desafía" con su dato
  de hoy y, al terminar su primer Uno al día, su celular escribe `invitados/<jid>/<uid>` (una vez por
  celular; no vale invitarse a sí mismo) y queda Sara en sus Amigos; desde ese día ve el duelo.
  Quien invitó suma el comodín al abrir `/today/` y lee una sola vez "🧊 Pedro aceptó tu desafío:
  ganaste un comodín." (o "Un amigo", si el amigo no tiene jugador).
- **El dato de quien invita** sale de `datosDe` (uno-al-dia-red.js), con las reglas de la tabla de
  arriba. Para quien recién empieza: "Ya jugué mi primer Uno al día".
- Se prueba con `uno-al-dia-jugador.test.mjs` (contra el almacén de prueba, que repite las reglas) y
  `tools/e2e/uno-al-dia-jugador.mjs` (Sara juega y entra, invita; Pedro acepta en otro celular).

### Lo que el PR 4 hizo (v0.118.0)

- **Lo que pide cada celular** va en `pushDia/<subId>` = `{ h, d, r, w, u, c, k, m, sp, sn, at }`: la
  hora del diario (9, 13 o 19), cuáles quiere (diario, racha, semana) y, para escribir el aviso, su
  último día jugado (`u`, número de día), su racha y comodines de ese día, su mejor racha y cuántos
  días jugó esa semana. Lo escribe el celular dueño de la suscripción (`push/<subId>`, la misma de La
  Copa) al activarlos y después de cada Uno al día; nadie lo lee. No hace falta jugador.
- **Quién decide** es `tools/push/uno-al-dia.mjs` (puro, con prueba), dentro de la vuelta de
  `avisar.mjs` cada 15 minutos. Lo mandado va a `pushEnviadosDia/<subId>/<clave>` y se limpia a la
  semana. La racha del aviso es la que sigue viva hoy: la del último día si fue ayer, o anteayer con
  un comodín.
- **Lo que quedó distinto del diseño:** no se juntan con los de La Copa en un aviso ("…y tu Uno al
  día también te espera"): cada uno respeta su tope. La semana dice solo cuántos días jugó (el puesto
  y "donde más mejoraste" piden leer los rankings en cada vuelta).
- **En la pantalla** (`uno-al-dia-avisos.js`): la oferta sale en la tarjeta del resultado la
  segunda vez que termina, con las tres horas y **Ahora no**; la campana de `/today/` muestra la
  hora y abre la hoja (los tres interruptores, la hora, **Probar los avisos** y **Silenciar**). Los
  caminos de cada celular son los de La Copa (`push.js`), con sus hojas y un paso 3 propio.
- **El globo del ícono**: la página pone un 1 mientras falta jugar hoy y lo quita al terminar; el
  aviso del día también lo pone (`sw.js`).
- **Agregar al calendario**: un `.ics` armado en el celular, con un evento diario a la hora elegida
  (o 9:00) y el link `today/?de=cal`.
- **Las reglas de la vuelta:** nunca de 22:00 a 8:00 del celular, a lo más 2 al día por celular
  (contados en `pushEnviadosDia`, aparte de los de La Copa); el de la racha sale desde las 21:00 si
  la racha es de 2 o más y no ha jugado, y va primero; el de la semana, los lunes desde su hora si
  jugó la semana anterior; el del día, desde su hora si no ha jugado, día por medio después de 14
  días sin jugar. A los 30 días sin jugar llega el de despedida (`adios`, con su mejor racha) y se
  borran `pushDia/<subId>` y lo mandado. Si la suscripción muere o desaparece, `pushDia` se borra
  con ella. Los avisos no van con `--prueba <código>` (esa es la de una copa).
- **En el panel:** cada aviso abre `today/?aviso=uad<tipo>` (`uaddia`, `uadracha`, `uadsemana`,
  `uadadios`), para que no se junte con el `dia` de La Copa, y `avisar.mjs` suma los entregados en
  `mandados/uad<tipo>`: salen como filas propias en el bloque "🔔 Avisos al celular" (D-233), con sus
  tocados (`TIPOS_AVISO` en `stats.js` los conoce). Sin guion, porque las reglas de `aviso/<tipo>`
  y `mandados/<tipo>` piden solo letras.
- Se prueba con `tools/push/uno-al-dia.test.mjs`, el caso nuevo de `avisar.test.mjs`,
  `uno-al-dia-avisos.test.mjs` y `tools/e2e/uno-al-dia-avisos.mjs` (con un servicio de avisos falso).

## Lo que decidió el dueño (2026-10-05)

1. **El mismo desafío para todos, y el dado rueda igual**, cada vez, con la experiencia de Juego al
   azar, para que se sienta al azar.
2. **El día cambia a la medianoche de cada jugador.**
3. **El aviso no dice qué juego toca.**
4. **Comodines**: uno cada 7 días seguidos, hasta 2.
5. **Nombres:** *One a Day*, *Um por dia*, *Spiel des Tages* (el alemán se revisa contra
   [ALEMAN.md](ALEMAN.md)).
6. **El resumen de la semana viene encendido** al activar los avisos, con su interruptor.
7. **Entran todos los juegos con modo para uno** (agregado del dueño).
8. **Invitar a un amigo** después de jugar, con un dato de quien invita (agregado del dueño).
9. **Un comodín para quien invita** cuando el invitado termina su primer Uno al día, con el mismo
   tope de 2, **y se anuncia** para que el jugador lo sepa.
10. **La tarjeta para compartir no nombra el juego de hoy** (#215), ni en el texto ni en la imagen.

## Textos para revisar (U-1, U-3, U-17)

Botones (caben en 320 px, unos 18 caracteres): **Uno al día**, **Jugar el de hoy**, **Compartir**,
**🎲 Jugar otro**, **Invitar**, **Entrar**, **Ahora no**, **Mañana · 9:00**, **Almuerzo · 13:00**,
**Tarde · 19:00**, **Silenciar**, **Probar los avisos** y **Agregar al calendario** (pasa de 18,
así que va en botón chico, como lo secundario de U-17). El botón de la portada va en una línea,
**📅 Uno al día**, con la racha en una píldora (**🔥 6**) y, al lado, **🎲 Al azar** (decisión del
dueño: etiquetas cortas). Mientras falta jugar el de hoy brilla un punto; jugado, se pone cian con ✅.
Lo que hace cada estado va en su `aria-label`. "Racha", "comodín" y "Silenciar" se dicen siempre así (U-5). Los
textos los propone el agente de usabilidad y el dueño los corrige en el PR.

**Lo que cambió en la revisión de usabilidad** (U-3: el dueño los corrige si no le gustan):

| Antes | Ahora | Por qué |
|---|---|---|
| **Juega el de hoy** (portada) y **Jugar el de hoy** (amigo) | **Jugar el de hoy** en los dos | Una acción, una palabra (U-5), y en infinitivo como los demás botones |
| **¿Otro más?** | **🎲 Jugar otro** | Verbo y objeto (U-17); el dado dice que es al azar |
| **Agregar a mi calendario** / **Al calendario** | **Agregar al calendario**, botón chico | "Al calendario" no tiene verbo (U-17) |
| "📅 Uno al día · el mismo desafío para todos hoy" | "📅 Uno al día: hoy todos juegan el mismo desafío." | Frase completa (U-1) |
| "El próximo, en 7 h 12 min" | "El próximo sale en 7 h 12 min." | Frase completa (U-1) |
| "Sara jugó los últimos 33 días seguidos" | "Sara lleva una racha de 33 días" | Con un comodín, "jugó 33 días seguidos" puede ser falso; y "racha" es el término (U-5) |
| "y lleva 5 días mejorando en Reinas" | "va mejorando en Reinas" | La app mide la flecha (últimos 3 contra 5), no días seguidos mejorando |
| "Hoy sacó 87 en Reinas" | "hoy sacó 87" | La tarjeta del amigo se lee antes del dado: no adelanta el juego |
| "está en el 10 % mejor de Uno al día" | "…de la semana" o "…de las rachas" | Dice de qué tabla sale el porcentaje |
| Porcentajes "redondeados hacia el lado de quien invita" | Redondeados hacia arriba al escalón siguiente | Redondear a favor puede decir algo falso (12 % no es "10 % mejor") |
| Dos versiones del mensaje de invitar | Una, con cabecera y 🔗 (U-30), solo texto (U-33) | La invitación no lleva imagen dibujada: la pone el link |
| "Sara te desafía 🔥" | "🔥 Sara te desafía" | Emoji al inicio (U-2) |
| "Si juega su primer Uno al día, ganas un comodín 🧊." (y "juega su primer día") | "🧊 Si tu amigo termina su primer Uno al día, ganas un comodín." | Quién juega queda claro, el comodín llega al terminar, emoji al inicio (U-2) y una sola forma en los cuatro lugares (U-5) |
| "Sin comodines. Invita a un amigo y gana uno 🧊." | "🧊 No tienes comodines. Invita a un amigo y gana uno." | Frase completa (U-1), emoji al inicio (U-2) |
| "…ganar un comodín por cada amigo que juegue." | "…ganas un comodín cuando un amigo que invitaste termina su primer Uno al día." | Con el tope de 2, "por cada amigo" promete de más |
| "🧊 Pedro aceptó tu desafío: ganaste un comodín." siempre | Sin nombre si el amigo no tiene jugador; sin comodín si ya tenía 2 | No promete lo que se pierde |
| "🔔 ¿Te avisamos mañana?" con el botón **Mañana · 9:00** | "🔔 ¿Te avisamos cada día para jugar?" | "Mañana" se leía a la vez como el día de mañana y como la hora de la mañana; y el aviso es diario |
| "📅 Tu juego de hoy ya está." | "📅 Uno al día n.° 13 ya está." | Un aviso, un texto |
| "Se corta a medianoche… Tienes un comodín 🧊, pero mejor no gastarlo." | "🧊 Si no juegas hoy, gastas un comodín para salvar tu racha de 6 días." | Con comodín la racha no se corta: el texto decía algo falso |
| "📊 Semana 40: … Lo mejor: Reinas." | "📊 Tu semana: … Donde más mejoraste: Reinas." | Nadie sabe qué semana es la 40 (U-1), y "lo mejor" no decía qué |
| "Cuando quieras, aquí está." | "🔥 Tu mejor racha fue de 14 días. Uno al día te espera cuando quieras." | "Aquí está" no decía qué |
| "Mismos dados de partida para todos" | "Todos parten con los mismos dados." | Frase completa (U-1) |
| "…mejor que el 64 %" con cualquier cantidad de jugadores | Solo con 20 o más, y sin porcentaje con más de 100 | Con 1 jugador, "mejor que el 0 %"; con más de 100 el total no se conoce |
| Tarjeta para compartir con todo en el texto, sin 🔗 | Cabecera de U-30, racha y 🔗; el puntaje va en la imagen | U-30, U-33 y D-171 |
