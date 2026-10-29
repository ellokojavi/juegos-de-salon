# La Copa 🏆

**Ruta:** `/cup/` (id `copa`) · **Jugadores:** 2 a 10 por copa · **Desde:** v0.42 · **Estado:** en el menú (v0.83, D-175) · **Idiomas:** es, en, pt y de (D-170, D-191, D-197)

## Resumen

Un torneo entre amigos que dura una semana: cada día se abre un juego distinto, idéntico
para todos, que se juega **una sola vez** y reparte puntos según la posición del día. Gana
quien suma más al cierre. Es la primera modalidad de la app que no es una partida sino una
serie de partidas en el tiempo (un macro-juego). El diseño completo, con la revisión y el plan
de construcción, se discutió en el documento *La Copa — requisitos del torneo de varios días*.

- **Estado:** en el menú desde v0.83.0 (D-175). `/labs/` ya no tiene nada de La Copa salvo El caso,
  que todavía no entra al pozo (D-262).
- **URL:** `/cup/` (portada) · `/cup/?K7Q2X` (una copa) · `/cup/?three` (ofrece la Copa de 3 días
  en la pantalla de antes, D-100, D-262, D-437) · `?test` (almacén local y reloj adelantable, sin
  Firebase) · `/cup/?K7Q2X&day=3` (abre el día 3 listo para empezar, si se puede jugar; lo usan
  los avisos, D-229) · `/cup/?K7Q2X&mute` (silencia los avisos de esa copa: el botón del aviso
  en Android) · `/cup/?practice=<juego>&labs&seed=K7Q2X` (un juego suelto con la semilla a la vista,
  repetible; los que tienen página se van a `/<slug>/?labs&seed=K7Q2X`, D-164). Desde la portada el juego suelto es `/<slug>/` (D-142, D-149, D-162, D-198; uno del laboratorio, `/labs/<slug>/`, D-267): la misma
  pantalla, sin "copa" en el link, que vuelve al menú, sin sesión de prueba ni semilla a la vista, y
  con su señal de uso. `/cup/?practice=<juego>` sin `&labs` lleva ahí. `/<slug>/?today` (o
  `/cup/suelto/?<juego>&today` para los que no tienen página) es el juego de Uno al día, con la semilla
  de la fecha del jugador; si hoy toca otro juego, se va a ese (D-230, [UNO-AL-DIA.md](../UNO-AL-DIA.md)).
  Bajo su resultado no va el ranking del juego, solo el de Uno al día (el primer intento igual entra al del juego).
  With `?today`, a game with variants plays its default one and the waiting room hides the picker (`practica()`, D-334).
- **Jugadores:** de 2 a 10 por copa (`MIN_JUGADORES` y `MAX_JUGADORES` en `engine.js`, D-118). Con
  el administrador solo, la copa no parte y el tablero pide "al menos un jugador más". **Público:** 🌎 global, 🇨🇱 Chile o 🇧🇷 Brasil, que se elige al crear la copa (D-187, `meta.aud`; las copas `intl` de D-186 se leen como global). Decide qué contenido local entra (`public/cup/games/audiencia.js`).
  **Idioma:** español, inglés, portugués (D-170) y alemán (D-191, para todos desde D-197). La
  pantalla va en el idioma de quien mira; las palabras de Agentes, Conexiones (copas de antes de D-421) y Palabra, los mensajes al
  grupo y su link, en el de la copa (`meta.lang`, se elige al crearla).
- **Modalidades:** Copa de 7 días (six games and the Grand Final) y Copa de 3 días (three games, **no final**, D-438: nothing counts double for everyone, the wildcard goes on any day, the last day has no grace day and breaks a tie; the 3-day test cups from before keep their final). The 3-day one is offered on the new create screen, in the lab, next to when it starts (D-437); on the screen of before only with `?three` or in the test store (D-100).
- **🎉 Copa de fin de semana** (D-439, a one-off for the owner's friends: offered in Spanish on both create screens on Friday 2026-10-23 only, closed that night by `FINDE_HASTA` in `engine.js`; the test store still offers it with `&weekend=on`; the cups created play on): 3 days, **3 games a day**, nine different games of the pool drawn by 🎲. A day (`linea+tango+donde` in `meta.cal`, game `trio`) is played like the Grand Final's rounds but with each game whole; the day's score is the average of the three (0 to 100) and hands out the usual points by place. No final, like the 3-day cup (D-438); a day of three counts for no game's ranking.
- **Calendario:** lo arma el admin al crear la copa (D-163): qué juegos entran y en qué orden,
  a partir de una propuesta al azar. La final va siempre el último día y repite los juegos de la semana, en su orden (D-418); the 3-day cup has none since D-438, and its three days are all games of the pool.
  In the lab (D-425; flag `copa-crear`, D-498), a key holder sees a new create screen: the week in view from the start, 🎲 Crear al
  azar, week styles (Balanced, Puzzles, Trivia and words, What's new), a sheet with the
  13 games to change, move or pick the version of a day, Ahora/Mañana with their weekday, the PIN once with 👁, and the language, audience and
  link folded in "More options"; the length (3 or 7 days) goes next to when it starts (D-437). The test store shows it only with `&lab` (`tools/e2e/cup/create-week.mjs`).

### Pendiente (después de la v1)

Recordatorios `.ics` (LIG-29), verificación cruzada de puntajes (LIG-30), papelera de copas
viejas (LIG-31), avisos automáticos (LIG-33: al celular, abiertos a todos desde D-228) y juegos de reserva (LIG-84). Ya no están
pendientes: inglés y portugués con contenido propio (LIG-32, hecho en D-170) y las copas en el
panel del dueño (D-137).

## Reglas

| Regla | Detalle |
|---|---|
| Días | El día 1 parte a las 00:00 del día de inicio, en la zona de la copa (`meta.tz`: hora del Pacífico en las nuevas, D-113; hora de Chile en las anteriores). Cada día termina a las 23:59. |
| Día de gracia | Un día se puede jugar ese día o el siguiente, con puntaje completo. La final no tiene gracia: la copa cierra a las 23:59 del último día, y ahí vence también la gracia del penúltimo. Neither does the last day of a cup without a final (D-438): the card and the reminder say "until today". On its first day the card says so: "Puedes jugarlo hasta mañana a las 23:59 (48 h)". |
| Un intento | "Cómo se juega" no cuenta. El intento empieza al tocar **Empezar**; recargar retoma el mismo intento (C-6). Since D-433 (for everyone since 2026-10-23): a day resumed with **Seguir jugando** where this phone has no save (another phone, the browser's memory cleared) takes its clock from the server's start (`started/<d>/<pid>`), not from zero, and the screen says so; the `resumed` demo shows it on one phone. |
| Puntos del día | Por posición entre quienes jugaron: 10-8-6-5-4-3-2-1-1-1. Manda el puntaje del juego; a igual puntaje, el menor **tiempo activo** (D-95). Leer el dato de cada carta en Línea Relámpago (al errar y al acertar) o de cada hito en ¿En qué año? no cuenta, hasta 6 s cada vez (D-277, D-314). Empate total: comparten la mejor posición. |
| Comodín ×2 | Uno por jugador y copa. Se activa antes de Empezar (el servidor lo rechaza después). No vale en la final; in a cup without a final (D-438) it goes on any day, the last one included. **Unused, it is not lost (D-444):** once no day it is valid on is left to use it on (each played, started or closed), it lands on the last of those days the player played: day 6 or an earlier one in a cup with a final; up to the last day in a cup without one (D-438, D-439). The last such day warns «No has usado tu comodín ×2. Se aplicará hoy automáticamente.» and the day it lands on carries a gold **×2 auto** pill. Retroactive for every cup still running on 2026-10-25 (`meta.end` after `AUTO_WILD_FROM` in `engine.js`); a cup ended before keeps its table and saved podium. Not in a cup the admin ended early. |
| Final ×2 | El último día vale doble para todos. The 3-day cup has no final: its last day counts single (D-438). |
| Resultados ocultos | Los puntajes de un día se ven después de jugarlo o cuando cierra. La tabla y el gráfico tampoco lo delatan: suman solo los días que ya puedes ver. |
| Nombre | El admin lo puede cambiar hasta que la copa termina; el link sigue igual (D-148). |
| Terminar antes | El admin puede terminar la copa en cualquier momento desde que parte. Nadie más juega, la tabla de ese momento queda como la final y los días que no alcanzaron a abrirse no se juegan ni suman (D-161). |
| Inscripción | Abierta hasta que empieza la final (in a cup without one, the last day; whoever arrives later reads "Esta copa ya está en su último día…", D-438), salvo que el administrador la cierre o la copa llegue a 10 (quien llega lee por qué no puede entrar: terminó, cerrada, cerrada por el administrador o llena). Los días que ya cerraron quedan con 0; el aviso sale desde el día 3, porque el día 2 el día 1 sigue en su día de gracia (D-177). |
| Out of the cup | Whoever lets **2 days in a row** close without playing them (each with its grace day) is out (D-347). Their points stay in the table, faded with 🚪, below everyone still playing, the days they will not play turned into one "Eliminado" pill; their line fades in the chart, and the shared image draws them faded with 🚪 and ELIMINADO (D-376); they can't play any more days, the final included, and nobody waits for them (the "missing" lists, the provisional table, the notifications). The day before, the board and the "Before closing" notification warn them. Only days that closed after they signed up count, and the last two days never do: they close with the cup. The admin can **bring them back** («Devolver a la copa»): the days missed before that are forgiven. It is not the admin removing someone (`out`). |
| Tabla | Suma de puntos. Desempata quien ganó más días y después quien quedó mejor en la final (in the 3-day cup, on the last day, D-438); si el 1.° y el 2.° empatan en puntos, el podio y el resumen dicen cuál de los dos criterios decidió (dilema #79). Es **provisoria** mientras el último día que muestra sigue abierto y alguien no lo ha jugado (D-147). |
| Medallas | Campeón, más días ganados, la remontada (más puestos subidos desde la mitad) y "al descenso" (el último). |

### Cuenta: nombre y PIN

No hay cuentas de la app: una persona es un `pid` de 6 caracteres dentro de una copa, con nombre
y PIN de 4 dígitos (D-96). El celular entra con acceso anónimo de Firebase Auth; para escribir por
un jugador, su `uid` tiene que estar "sentado" como ese `pid`, y las reglas solo aceptan el asiento
si trae el mismo `sha256("copa:código:pid:PIN")` que se guardó al inscribirse, en una rama que
nadie puede leer.

**PIN attempts (D-464).** Before the seat, the phone writes its attempt in
`torneoIntentos/<código>/<pid>`, one every 5 s per cup player, and the seat is accepted only with
this phone's attempt from the last minute holding the same hash. A quick retry after a typo waits
the 5 s on its own; refused again, it says to wait a few seconds (`errEspera`).

El celular recuerda con quién está sentado en `localStorage`, pero el asiento es del `uid`: si el
navegador pierde la sesión de Firebase, o el admin le da un PIN nuevo al jugador, las reglas niegan
empezar o enviar aunque el día esté abierto. Entonces la copa pide el PIN de nuevo, con el nombre
ya elegido, en vez de decir que el día se cerró (D-285). If that cup player is linked to the phone's
player (D-359), the player's seat was lost with the same session, so it asks for the player's PIN instead (D-416, below).

**Con los rankings (D-212).** Si en el celular hay un jugador de los rankings (nombre y PIN para
toda la app), al inscribirse el nombre viene puesto, y al abrir la copa su jugador queda enlazado
en `players/<pid>/j`. Con eso: los de la copa que también lo están pasan a ser sus **amigos** en
los rankings; cada día jugado cuenta para la pestaña **Copa** del ranking de ese juego; y cuando la
copa termina, the nightly `cup-podiums` job saves its podium in `torneoPodios/<código>` (D-450, D-499; the app no longer writes it), del que sale el
medallero de **Campeones de La Copa** al final de la portada. A win by name alone (without a player) joins the
player with that name when exactly one has it (D-357). With a player on the phone there is no cup PIN (D-359, below).
Las copas del laboratorio no cuentan.

**An archived cup's link (D-476, D-478, D-492).** Two years after it ends, the nightly archive moves a
cup out of `torneos/`. Its link (for everyone since D-492) reads `torneoPodios/<code>` before saying it does
not exist: if the podium is there, it shows the cup's name, the day it ended (with the year), its
podium 🥇🥈🥉, a note that it was archived, **🏆 Crear una copa nueva** (the creator with the same
name) and **🥇 Ver el medallero**. Without a podium, the usual "No encontramos una copa".
Tested by `tools/e2e/cup/archived.mjs`.

**The usual name and PIN (D-358).** With no player on the phone, whoever creates, joins or sits in a
cup with the name and PIN of their player enters as that player: the cup PIN is tried as the player
PIN, and if it opens a player with that name, the phone signs in (a toast says so) and the cup links
as above. A hint under the PIN says it. Nothing is created and a PIN that opens no player changes
nothing. When a signed-in player sits in a finished cup whose podium was saved without them, their
jid is written into `torneoPodios/<code>/p/<pid>/j`, once; the rules accept it only from a phone
seated as that cup player.

**No cup PIN with a player (D-359).** With a player signed in on the phone, La Copa asks for no cup
PIN: creating or joining hides the PIN fields (a line says the player stands in for them) and the cup
keeps a random key for that cup player that nobody needs. Opening a cup where this phone's player is
linked to one of its players seats the phone at once; on "Ya estoy inscrito", picking that player
needs no PIN. The seat carries the jid, and the rules accept it only if that cup player is linked to
it and this phone is seated as that player. Without a player, everything is as before: name and cup
PIN.

**A linked player who lost their session (D-416).** The player's seat (`jugadorSeats/<jid>/<uid>`)
hangs from the same anonymous session as the cup seat, so a phone that lost it still shows the player
but the rules refuse `sentarseComoJugador`. Then "Ya estoy inscrito" does not say the PIN is wrong:
it shows "Este celular dejó de entrar como tu jugador {name}" and asks for the **player's**
PIN (right away when coming back from a lost seat, D-285). The PIN seats the phone as the player again
(`jugador.reseat(pin)`), which also brings back rankings and Uno al día on that phone, and then sits
as the cup player with no cup PIN. A PIN that is not the player's is tried as a cup PIN, so a new
cup PIN from the admin also works. The test store (`store-local.js`) refuses `sentarseComoJugador`
without the player seat, like the rules; `tools/e2e/cup/player-cups.mjs` plays it.

### Admin

Quien crea la copa también juega. Puede renombrar, sacar (y volver a meter) y ponerle PIN nuevo a
un jugador (confirming with their own PIN, the cup one or their linked player's, D-464), y compartir cuatro mensajes armados con el diálogo del celular (D-99): invitación,
**recordatorio del día** (sirve cualquier día: antes de empezar, con el día de gracia y con quién
falta), tabla parcial y resumen final. La **invitación** sigue en Administrar mientras alguien
nuevo pueda entrar —inscripción abierta y menos de 10 jugadores—, no solo antes de partir; ya
partida dice "📅 Ya partió: va en el día 3 de 7 y todavía puedes entrar." y, desde el día 3, que
los días cerrados quedan en 0 (D-176, D-177). El botón "Invitar al grupo" del tablero sigue solo
antes de partir.

**Terminar la copa antes** (D-161): desde que parte, el admin puede cerrarla en ese momento, por
ejemplo si el último no va a jugar la final. Antes de confirmar ve quiénes todavía no juegan el día
de hoy (y el de gracia) y si quedan días que no se van a jugar. No se puede deshacer.

**Tabla final** (D-161): terminada la copa, sola o por el admin, Administrar ofrece la imagen de la
tabla con las posiciones día a día y una planilla CSV (`planilla.js`) para Excel o Google Sheets,
con la tabla final, el lugar de cada uno después de cada día y el detalle de cada día.

## Juegos

Todo el contenido de un día sale de una semilla `código:día:sal` (D-97): es idéntico para todos
sin que nada viaje por la red.

Todos los juegos puntúan **de 0 a 100** (D-113). Igual lo que decide la copa es el lugar de cada día.

| Día | Juego | Puntaje (0 a 100) | Reusa |
|---|---|---|---|
| 1 | ⏳ Línea Relámpago: 10 hitos, 9 en la mano en cualquier orden | 100 × aciertos / 9 | la mano, las ranuras, el arrastre y el veredicto de Línea de Tiempo |
| 2 | 🔢 Toque y Fama: Número. 4 cifras, 10 intentos | 100 − 15 per guess the earlier clues had already ruled out (⚠️ on the finished board), minimum 10 if solved, 0 if not (D-453; until then D-113's 100 − 10 × (guesses − 1)). The Final's number round uses the same rule | el teclado con notas, el tablero y las pistas de Toque y Fama; tocar una casilla elige dónde va la cifra (#604; probado en el lab, D-409) |
| 3 | 🕵️ Agentes: 15 palabras, 4 pistas una a una, 11 agentes, 3 neutrales y el asesino (D-421) | 100 × agentes / 11 − 15 por neutral − 40 por el asesino, nunca bajo 0 | el mazo de pistas por idioma (`public/cup/games/agents/clues.js`, `clues-en.js`, `clues-pt.js`, `clues-de.js`); see [agents.md](agents.md). Until D-421, 🔗 Conexiones (16 palabras, 4 grupos, 4 errores; 25 × grupo − 5 × error), which the cups created before still play |
| 4 | 👑 Reinas: una por fila, columna y zona, sin tocarse | por tiempo: 100 hasta 30 s, 10 a los 5 min (D-107) | nuevo (Queens de LinkedIn) |
| 5 | 🔤 Toque y Fama: Palabra. 5 letras, 8 intentos | 10 × letra encontrada en su lugar (una vez por lugar) + si la saca 50 − 5 × (intentos − 1) (D-108) | lo mismo que el día 2, con letras |
| 6 | 📅 ¿En qué año?: 6 hitos | promedio de los hitos (100 cada uno, baja con la distancia) | mazos de Línea de Tiempo y teclado de Toque y Fama |
| 7 | 🏁 La Gran Final: one round per game of the week, in order (D-418): the short version of the five that have one, any other game whole with new content | average of the rounds (0 to 100 each) | each game's engine and screen |

Between rounds of 🏁 La Gran Final, the intro of the next round shows the running score: the average of the rounds played so far, out of 100, the same scale as the result, which it equals after the last round (D-417).

The final's folded rules list its rounds: a short round carries how it is played, a game played whole only its name, under one line above the list saying those are played whole with new content (`finalWholeNote`). The final outside a cup (the lab's practice and its trial) has no week, so it plays the five fixed short rounds and its texts say so (`comoSuelta`, `puntajeSuelto` in `rules.js`; D-418 review, option A).

Recién creada, la copa abre en **Administrar** con una guía para invitar (D-110). Ahí el admin
comparte los mensajes, **cierra o reabre la inscripción** y **mueve el inicio a hoy o mañana**
mientras nadie haya jugado. `?test&demo=<escena>` abre una copa de ejemplo en cualquier
punto (`public/cup/demo.js`: `new`, `guest`, `waiting`, `not-started`, `player`, `admin`, `final`,
`final-admin`, `podium`, `full`, `out` and `risk` for D-347, and `last-day` for D-444 (day 6 not played, the wildcard unused: its notice); los nombres en español de antes de D-266 se leen igual); el laboratorio ya no las ofrece, pero las usan las pruebas y las capturas (D-262). Exception: `resumed` (D-433), a day started 4 minutes ago on another phone, opens with `?test&demo=resumed`, linked from its card `#seccion-copa-reloj` in La Bodega (🚀 Lanzado).

Al tocar Empezar, una **cuenta de 3 a 1** y "¡A jugar!" (D-105; la capa es
`assets/js/cuenta-regresiva.js`, con sus estilos `.cuenta` en `assets/css/base.css`): recién ahí aparece el tablero, y
el reloj parte cuando el "¡A jugar!" ya se fue y terminó la entrada del juego, si la tiene (las
cartas de El caso, con `entrada()` en su registro): la cuenta no es tiempo de juego (D-258). **No clock shows while playing** (D-379): the time counts as always (paused for a fact and with the tab hidden, stopped when the board ends) and appears only at the end, on the result, the standings and the share text; a game's own ⏳ countdown stays. **Except where speed scores and there is no countdown** (D-384): Loteo and Reinas show the ⏱ elapsed time in the play head (`clock` in their `ui.js`), dimmed while a fact is read and stopped when the board ends. Al
terminar, el resultado explica **cómo se calculó el puntaje** línea por línea
(`public/cup/desglose.js`, D-106). Order (C-19, D-343): the place, then **Back to the board**, share and
the next-day notice (its button cyan); the breakdown starts folded (open in practice) and the day table goes
below. The podium has **🏠 Back to the menu** under Share the summary; "Leave this Cup" stays a
quiet link at the end. The trial run (D-103) ends with only its way back to the waiting room. En la de 🏁 La Gran Final, cada
jugador lleva además su tarjeta de rondas, one per game of the week (⏳75 🔢85 👑100 🔤60 📅90 in the classic week), para comparar ronda a
ronda (#259); en la demo `podium` o `full` se ve con datos.

Antes de Empezar cada día se puede jugar una **sesión de prueba** (D-103): la misma mecánica con
otro contenido (código derivado con `codigoEnsayo`, otra temática, una grilla fuera del sorteo,
tableros más chicos), que no se guarda ni cuenta. La antesala lo dice bajo el botón de la prueba,
y las reglas plegadas de la prueba lo repiten: "La prueba es más corta que el juego de verdad y no
cuenta para la copa" (`trialNote`, D-177).

Al crear la copa, apenas se elige la duración aparece **¿Qué se juega cada día?** con una propuesta
al azar (`calendarioAlAzar`): juegos distintos del pozo (`POZO` en `engine.js`, derived since #855 from the `copa: { pozo }` of each entry in `games.js`, in that order: los seis de siempre
más Zip, Tango, ¿Dónde queda?, Desenredo and, since D-332, 🚇 Rutas rotas, 📐 Loteo and 🖌️ Pintaminas; since D-421 🕵️ Agentes in 🔗 Conexiones' place), sin dos días seguidos de la misma habilidad. Es la mano y la línea
de Línea de Tiempo con su arrastre: un día se arrastra a otro lugar de la semana (en un celular,
por su agarre ⠿) y un juego de la mano, hasta el día que reemplaza; tocando se llega a lo mismo
(el juego y después la ranura o el día). 🎲 propone otro orden. La final queda fija al último y juega una ronda de cada juego elegido (D-418; the finals that opened before 2026-10-22 noon Pacific keep the five fixed rounds). The 3-day cup of the new create screen has no final: its three days are games, the calendar ends with a game and `meta.final` is `'0'` (D-438); whether a cup has a final is read from its calendar (`tieneFinal(meta)`). El calendario se guarda en
`meta.cal` y `nuevaMeta` rechaza uno que no se puede jugar (`calendarioValido`). Sin elección
(las demos) se usa el de siempre, `CALENDARIOS`: Línea, Toque y Fama, Agentes, Reinas, Palabra,
Año y la final; o Línea, Agentes y la final en la de 3 días (D-163; Agentes took Conexiones' place in D-421), as the 3-day cups from before D-438 and the screen of before (`?three`) still make them.

Los otros juegos del pozo, antes de los tres de D-332, son **〰️ Zip** (un solo trazo por todas las casillas, pasando por los números en orden; por niveles: diez, de 4 × 4 a 7 × 7, en tres minutos; con los diez son 100 y la partida termina ahí, y entre quienes los resuelven todos gana quien terminó antes, D-250) y **☀️ Tango**
(soles y lunas, mitad y mitad por línea, nunca tres seguidos, con marcas = y ×), y **📍 ¿Dónde
queda?** (cinco ciudades con su país, un alfiler en un globo sin nombres que se gira sin fin y,
con dos dedos, también en torno a la pantalla, con una brújula que endereza el norte; 100 puntos
por ciudad menos 4 cada 100 km, D-155, D-156, D-200).

- **¿Dónde queda?** saca sus ciudades de `games/where/ciudades.js` (las 195 capitales, ciudades famosas y de
  segunda línea, 529 en total, con nivel y código ISO; D-157) y su mapa de `games/where/mapa.js`, que genera `node tools/generators/map.mjs generate`; `check`
  comprueba que cada ciudad cae dentro de su país. La vista del globo (ortográfica) y su inversa
  están en el motor, `games/where/engine.js`; `games/where/globo.js` lo dibuja en un canvas con la imagen satelital
  (Blue Marble de la NASA, con WebGL; D-159), y la distancia se mide sobre la esfera. Mientras la
  imagen baja el globo no se dibuja y aparece con un fundido al llegar (D-245); sin WebGL, o si la
  imagen no llega, se dibuja con el mapa vectorial, recortando cada país en el borde. La antesala muestra el globo girando solo
  (`portada()` de `games/where/ui.js`). The images are WebP, next to the game in `games/where/earth-2004-09/`
  (`2048.webp`, `4096.webp` and the 128 tiles), and the 4096 px one is downloaded only on a canvas wider than
  2048 device pixels or once the globe is zoomed in: a phone at rest gets about 200 KB of images (D-460).

- **🧶 Desenredo** (D-179; fuera del laboratorio desde D-190) es el Untangle de Simon Tatham: nudos unidos por
  hilos que se cruzan, y se arrastran los nudos hasta que ningún hilo cruce a otro. Por niveles
  como Zip: diez, de 6 a 15 nudos, y cuatro minutos; 10 puntos por nivel y el desempate es cuándo
  se resolvió el último. El motor (`games/untangle/engine.js`) arma primero un dibujo sin cruces (nudos al
  azar bien repartidos y hilos de los pares más cercanos a los más lejanos, hasta 4 por nudo) y
  después reparte los nudos en un círculo en desorden: siempre tiene solución, pero no una sola.
  Todo en enteros sobre 1000 × 1000; un hilo que pasa a menos de 24 unidades de un nudo ajeno
  cuenta como cruce, lo que además cierra la trampa de amontonar los nudos. Its share card (🧶 and a 🟩 per level) only repeats the score, so it goes in the shared text but not on the result screen (the owner's request; `SIN_TARJETA_EN_RESULTADO` in `cup/game.js`). Los hilos se dibujan como cuerdas con una curva leve y una segunda onda de torsión, sutil (D-182, D-183, D-185), pero
  los cruces se cuentan sobre la recta. **🔄 Reiniciar nivel**, bajo el tablero, devuelve los nudos a
  donde partió el nivel: como Borrar todo en Zip y Reinas, el primer toque lo arma, el segundo lo hace
  y el reloj sigue; está apagado mientras no se haya movido nada. Su habilidad es
  `espacial`, propia, para que el sorteo del calendario la pueda separar de Reinas, Zip y Tango.

- **🔍 El caso** (D-257, en el laboratorio; su página propia es [case.md](case.md)): un misterio de
  deducción al estilo de *Clues by Sam*. Veinte sospechosos en una grilla de 4 × 5, inocentes
  o criminales; cada uno que se marca bien da su pista, y las pistas siempre dicen la verdad. Nunca
  hay que adivinar: el motor (`games/case/engine.js`) simula al jugador y arma las pistas para que en
  todo momento alguien más se pueda deducir. Marcar antes de tiempo no se acepta y cuenta como error
  (se guarda como jugada `{ i, v, falta }`, D-261), sin decir si estaba bien. **100 puntos con el caso resuelto, menos 10 por error y 15 por ayuda, hasta 10**; sin
  resolver, 0. La **💡 Ayuda** (D-263, jugada `{ ayuda: i }`, `ayuda()` del motor) elige a alguien que ya se
  puede deducir y dice qué pistas juntar; en la tarjeta su celda va en 🟨. Las pistas son datos (`{ t, a, b, k, g, h }`) y la frase la arma `texto()` en el
  idioma de quien juega, con las plantillas de `casoTexto` en `rules.js`: el caso es el mismo en los
  cuatro idiomas. La antesala muestra cartas de espaldas que se dan vuelta solas mientras una lupa
  las recorre (`portada()` de `games/case/ui.js`), y el título lleva la lupa y los colores que se
  mueven (`titulo()`, un gancho opcional de `games/index.js` que la antesala y la práctica usan si
  el juego lo trae; los demás muestran su nombre como siempre). Las cartas del tablero se dan vuelta
  recién cuando la cuenta del 3, 2, 1 se fue del documento, no mientras la tapa. Se juega suelto en
  `/labs/case/` (D-267: los juegos del laboratorio viven en `/labs/<slug>/` y `/case/` es puente; el
  botón 🔍 de `/labs/` lleva ahí, y desde D-262 es lo único del laboratorio), con `diario: true`: sin
  semilla es el caso del día, sigue al recargar y su final ofrece otro caso, el de hoy y el comentario
  (el detalle, en [case.md](case.md)). **Todavía no está en `POZO`**: una copa no lo elige hasta que salga
  del laboratorio. Los mensajes de acierto y de error se van solos (2,5 s y 4 s, excepción a C-8b anotada en
  [case.md](case.md)). Suma condicionales y parejas, y de cada semilla se queda con el más difícil de cuatro casos
  (`dificultad`, D-260). Su habilidad es `deducir`, la misma de Toque y Fama, para que el sorteo del
  calendario no los ponga en días seguidos.
  **Las pistas se eligen para que haya que combinarlas** (D-259): `notaPista` premia la que destapa
  a alguien solo junto con las que ya se saben, castiga la que lo dice todo sola y prefiere las
  comparaciones, los pares e impares y "al menos / a lo más" a "hay exactamente N" en grupos chicos;
  si en un paso todo sale de una sola pista, se cambia la del último que habló por una que obligue a
  combinar. Un tipo propio, "Exactamente uno de Ana y Beto es criminal" (`g.tipo: 'dos'`, plantilla
  `unoDeDos`), nunca nombra a quien habla. `juegos.test.mjs` frena un caso con menos de 25 % de
  deducciones combinadas o más de 35 % de pistas "hay exactamente N".
- **Línea y Año** usan temáticas distintas dentro de la misma copa (`temasDeLaCopa`), para que no
  sean dos días de lo mismo.
- **Reinas, Zip y Tango** tienen solución única garantizada. Reinas ajusta las zonas de a una
  casilla hasta que el resolvedor encuentra una sola solución; Tango suma pistas hasta que es única
  y después saca las que sobran; Zip suma números sobre un camino al azar y después saca los que
  sobran (quedan 7 a 12 en 6 × 6).
- **Reinas** tiene bajo el tablero **↩️ Deshacer**, **🧹 Borrar todo** (dos toques, D-169) y, en su
  propia línea, **🏳️ Rendirse** (D-110). Deshacer quita el último gesto (un toque, un toque largo,
  un arrastre entero o un Borrar todo) hasta el comienzo, sin pedir confirmación, y el reloj sigue
  (D-283). El botón y sus pasos están en `games/deshacer.js`, listos para Zip.
- **Queens' regions carry a texture** over their color (D-481, #896, for everyone since 2026-10-27, first tried in the lab as
  `#seccion-tramas`): thin lines, dots or a grid per region, from `assets/js/region-patterns.js`, so
  players with protanopia or deuteranopia tell the regions apart. Region 0 stays plain; a clash keeps
  its red stripes. Tango, Zip and Loteo need none (symbols, a path, outlined plots), and Pintaminas
  already stripes its second color (#349).
- **Tango** has **↩️ Undo** too (D-342), to the left of Clear all: it takes back the last tap or
  Clear all, but it is kept as a play (`'U'`), so a mistake already counted and a hint stay in the
  score; undoing the tap that just broke a rule forgives it.
- **Tango** has **🏳️ Give up** too, on its own line under Clear all and the hint, as in Reinas
  (D-110): it asks to confirm, shows the solution and the game gives 0 points (`'R'`).
- **Tango** no cuenta como error pasar por el sol para llegar a la luna: solo dejar la casilla
  rompiendo una regla (D-102). La pantalla dice lo mismo: el choque se pinta en rojo recién cuando
  el jugador toca otra casilla (never on a timer alone); con el tablero lleno se muestra sin contarse,
  para que se vea qué arreglar (#135). In both cases the red, its sound and the counter wait 1.5 s
  (`ROJO_MS`, restarted by each tap, D-337), because players found the instant red too abrupt. La casilla con sol es ámbar y la de luna azul noche, con la luna
  plateada: los dos emojis son amarillos y así no se confunden (D-146). Las dadas llevan su color más
  vivo (el sol, además, el borde entero) y un candado chico (#61).
- **Toque y Fama: Palabra** acepta cualquier combinación de 5 letras distintas como intento, sin
  diccionario, igual que Toque y Fama acepta cualquier número de cifras distintas. La palabra
  secreta sale de la lista del idioma de la copa (`games/word/palabras.js`: 120 en español, 185 en
  inglés, 143 en portugués y 162 en alemán). El teclado es QWERTY con Ñ en español; en inglés y
  portugués deja un hueco donde iría la Ñ, y en alemán es QWERTZ con el mismo hueco, así la tercera
  fila empieza en su letra (`alfabeto(lang)` en `games/word/engine.js`, D-170, D-191).
  Cada letra se pinta verde si está en su lugar (fama) y amarilla si está en otro (toque), como en
  Wordle; la tarjeta usa 🟩 y 🟨 (#196).
- **¿En qué año?** has a margin that grows with the event's age: `max(12, (2026 − year) / 3)` years
  (D-325). The score is `100 / (1 + (2·distance / margin)²)`: 50 at half the margin, 20 at its
  edge, and from there it keeps falling slowly instead of dropping to 0.
  The answer is typed in four boxes with a d. C. / a. C. switch, shown only when the theme has a
  card before Christ (today only Historia, D-326); while a. C. is on, its label also
  shows next to the boxes, switching the era keeps the digits already typed, and the reveal says
  "Tu respuesta: …" (`yearAnswer`) so the player's answer is not read as the real year (a friend's
  report: 622 with a. C. on looked like a bug).
- Las copas creadas antes de D-102 con el Solitario o Dudo en el calendario juegan Reinas y Toque y
  Fama: Palabra en esos días.

- **Variants** (D-331): Pintaminas (easy / ⚡ hard) and Loteo (🔢 Numbers / ⚡💧 Utilities) are
  played in one variant per day. When the week has one of them, a row below the week ("¿En qué
  versión?") lets the admin pick it; the random week and the default pick the first one.
  `meta.cal` writes the day as `id` or `id:variant` (`pintaminas:hard`); `calendario()` and
  `juegoDelDia()` name the game without it, `varianteDelDia()` gives it. The day's card, its
  waiting room, its rules and the trial say the variant and play it. Standalone, the player picks it
  in the waiting room (`?mode=`), with one ranking table per variant.
- **🚇 Rutas rotas, 📐 Loteo and 🖌️ Pintaminas** (D-332) came from the lab; each one's page is
  [routes.md](routes.md), [plots.md](plots.md) and [paint-mines.md](paint-mines.md). They bring their
  texts (`games/<slug>/texts.js`, merged into `rules.js`), their styles (`games/<slug>/style.css`)
  and their score breakdown (`desglose()` in their `ui.js`). Like any game of the week without a short version, the Gran Final plays them whole, with new content (D-418).
- **🕵️ Agentes** (D-421) came from the lab in 🔗 Conexiones' place, in the pool (`POZO`) and the demo
  calendars (`CALENDARIOS`); its page is [agents.md](agents.md). Like the three of D-332 it brings its
  texts, styles and breakdown (`games/agents/`), its words follow the cup's language (`CON_PALABRAS`),
  its trial is two clues, and the Gran Final plays it whole. **🔗 Conexiones** stays registered in
  `JUEGOS`, so the cups created before keep playing it, their final included; new cups cannot pick it,
  and outside La Copa it sits in the lab's 📦 La Bodega at `/connections/`.
- **🚂 Tren en Vilo** (D-456) came from the lab into the pool (`POZO`); its page is [bridges.md](bridges.md).
  It brings its texts, styles and breakdown (`games/bridges/`), its trial is two easy crossings in a minute and
  a half (`NIVELES_ENSAYO`, `TIEMPO_ENSAYO_S`), and a stage's summary pauses the cup's clock (`ctx.pausa`). It is
  the one game of the week the Gran Final skips (`NOT_IN_FINAL` in `engine.js`: seven minutes of building).

## Modos

Una copa no tiene los modos de C-5: es un torneo de varios días en que cada jugador juega solo,
en su celular, el juego del día, y lo que se comparte es la tabla. Los juegos de la copa se juegan
además **sueltos**, de un jugador y sin copa, desde la portada (`/<slug>/`, D-142, D-198).

### Laboratorio, práctica y reportes

`/labs/` (D-101) ofrecía la práctica de cada juego, las demos y la copa real; desde D-262 tiene
solo El caso, que vive en `/labs/case/` (D-267). La práctica (`?practice=<juego>&labs`, que sigue funcionando) arma el contenido con una semilla al azar como si fuera el día 1 de una copa con ese código, y la
muestra al final (salvo en un juego `diario`, cuya semilla va en el link de compartir). Un juego
jugado desde el laboratorio (`?labs` o `/labs/<slug>/`) termina con el formulario
**"¿Qué te pareció?"** abierto (`formularioComentario` de `labs-idioma.js`, D-265, D-267) en vez
del botón 🐞. El botón **🐞 Reportar un problema o dejar un comentario** (práctica, tablero y
resultado de la copa) guarda en `feedback/<id>`, por REST y sin cuenta (D-104), el texto, un nombre o apodo opcional (a name or nickname, never asked as a full name), la versión
y un contexto en JSON: copa, jugador, pantalla, día, juego, semilla, URL y navegador. El contexto
no se muestra en el formulario, y quien entró al laboratorio con su llave manda también su etiqueta
(`tester`, nunca la llave; D-306). Se leen con
`node tools/firebase/reports.mjs`; en `?test` queda en `localStorage` (`juegos-de-salon:copa:prueba:reportes`).
Every one of these forms also has an optional **email** field (`campoCorreo` in `buzon-form.js`, re-exported by `labs-idioma.js`, D-317)
that says it is only to tell the player we replied: `feedback/<id>` gets only its mask
(`correoMascara`, `j********n@g********m`, D-366), the address goes to `feedbackContacto/<id>`, readable only with the owner's key,
and the processes agent emails the reply and deletes it (`tools/agents/feedback.mjs reply`); one nobody answered is deleted
after 90 days (`feedback.mjs expire`, D-463). The field's note links the privacy page, `/privacy/` (D-463).

### Avisos al celular (D-223, D-224, D-225, D-227, D-228)

Abiertos a todos desde D-228: se ven en cualquier celular que pueda recibirlos, siempre que
`public/assets/js/vapid.js` tenga la clave (la tiene desde D-225). `AVISOS_EN_LABS = true` en
`push.js` los vuelve a cerrar en el laboratorio. El diseño y lo que falta están en
[PWA-NOTIFICACIONES.md](../PWA-NOTIFICACIONES.md).

- **La campana** va junto a Invitar y Administrar en el tablero, hasta que la copa termina:
  **Activar avisos**, **Avisos activos** (abre los ajustes: los dos avisos, "Probar los avisos" y
  "Silenciar esta copa") o **Avisos bloqueados** (cómo desbloquearlos). Si el celular no puede
  recibir avisos, no aparece.
- **La tarjeta** que los ofrece sale una vez por copa: en el tablero antes de que parta, en el
  resultado de un día si queda otro, o al abrir la copa desde la app instalada. "Ahora no" la
  apaga en esa copa.
- El permiso del sistema se pide solo después de tocar **Avisarme**. Al activar, el celular se manda
  un aviso de confirmación. Si ya activó avisos en otra copa, la nueva los trae puestos ("Te
  avisaremos de esta copa", con "Cambiar").
- **iPhone:** en Safari, la campana abre los pasos para agregar la app a inicio y deja `&app=<pid>`
  en la dirección (nunca el PIN); la app instalada abre en "Ya estoy inscrito" con ese nombre
  elegido, si iOS la respetara. No la respeta: la app instalada abre en la portada, así que los
  pasos dan el código de la copa (D-227). Dentro de WhatsApp o Instagram, pide abrir el link en Safari.
- **Lo que llega** (D-224): `.github/workflows/notifications.yml` corre `tools/push/notify.mjs` cada 15
  minutos, y `tools/push/schedule.mjs` decide con `engine.js` qué toca, en la hora y el idioma
  del celular y nunca entre las 22:00 y las 8:00: **se abrió el día** (desde las 9:00, si no lo ha
  jugado ni empezado), **se te acaba el plazo** (4 horas antes del cierre, o desde las 20:00 si
  cierra de noche; to whoever already missed the day before, it also says that missing this one leaves them out of the cup, D-347; whoever is out gets nothing more), **La Gran Final** (con su lugar en la tabla; a cup without a final sends the usual "se abrió el día" on its last day, D-438), **terminó la copa** y, al admin
  que activó avisos, **quién se inscribió**. A lo más uno por copa y celular en cada vuelta, y dos
  por copa en un día (D-229). Los textos son los `avMsg*` de `rules.js`. Al tocarlo abre ese día
  (`&day=<d>`) o, el del cierre, el podio; en Android trae **Jugar** y **Silenciar esta copa**
  (`&mute`). Los días nuevos de varias copas van juntos en un aviso, y un empate arriba nombra
  a todos los que ganaron (D-229). Cada dirección lleva `&notif=<tipo>` (en inglés, D-266: `day`, `deadline`, `end`…), que la página cuenta al
  abrirse y saca de la dirección; el panel muestra mandados y tocados por tipo (D-233). The
  cup-ended one ends with "Toca para ver la tabla final." (`avEndSee`, D-423).
- **The recap on the home page** (D-423, in the lab: only with a lab key, listed in /labs/ as
  `#seccion-resumen-copa`): when a cup this phone played ("Tus copas", `copa:mias`) ended by its
  planned end less than a week ago and its recap was not seen here, the home page opens a window
  over itself: "La Copa terminó", the `fin` notification's sentence, and the final table as the
  image the cup shares from its podium (D-427): the trajectory day by day and the table, the first
  three on gold, silver and bronze plates, in the cup's language and with its link (the cup's name,
  which the image carries, stays only for screen readers). If the image cannot be drawn, the window
  shows its own table: 🥇🥈🥉 or the place, a small line of each player's place day by day, the places
  climbed or lost since day 1 (▲2, ▼1, =) and the points, the player's row marked. **🏆 Ver la copa** opens
  the cup, **Cerrar** and ✕ close it. Closing it or following the link marks it seen
  (`copa:resumen-visto`); with several due, one in `OPEN_CUPS` first (D-426), then the most recent. That visit the splash (D-351) waits.
  `/?recap=demo` shows it with the podium demo, recording nothing.
  Since D-424 the same window also tells a season of Uno al día that ended (`assets/js/daily-recap.js`,
  docs/UNO-AL-DIA.md); La Copa's goes first when both are due, one per visit.
  The owner can open one cup's recap to all its players before the window leaves the lab: its code
  goes in `OPEN_CUPS` (`assets/js/recap.js`, D-426); the first is Thursday Guys #4 (`QNPFM`).
- **Where you stand, in "Tus copas"** (for everyone since 2026-10-24, after the lab; kept in La Bodega
  as `#seccion-copa-estado`): under each cup in course, one line from
  `estadoEnLista` (`engine.js`) in the player's words (`mine*` in `rules.js`, the owner's copy of 2026-10-24): ▶ "¡entra a jugar!"
  for a day ready to play ("hoy último día para jugar" when it closes tonight; "tienes n días por jugar"
  with several), ⏸ "termina tu juego" for one half played, ✅ "Ya jugaste" and when the next day opens
  (or nothing left to play), ⏳ how long until day 1, 🚪 "Eliminado" when out of the cup (D-347). The line takes the place of "name · code" (the code goes next to the cup's name), in the state's
  color: yellow to play, cyan when played, grey otherwise. It is drawn at once from a slim copy of
  each cup the phone keeps (`recorteLista` in `engine.js`, `cuenta.lista` in `copa:lista:<code>`, forgotten with the cup; saved
  on every read, the open cup's included) and corrected after the cup is read again. With a single day to play, the cup's link opens it (`&day=<d>`). Finished cups carry
  no line; without network the line stays as this phone last saw it. Screen: `copa mine-status-all`; `/cup/?test&demo=mine` seeds one cup per status.

## Flujo

`intro` (portada: crear, tus copas —las de este celular y, con jugador, las suyas de otros
celulares, D-220; las terminadas con su etiqueta y escondidas tras "Mostrar copas terminadas", D-234, all of them, newest first, D-336; each in course with its status line—,
tengo un código) → `crear` → `entrar` (invitación: Soy nuevo
/ Ya estoy inscrito) → `tablero` → `jugar` (primero Cómo se juega y el comodín) → `resultado` →
`admin`. En el tablero van **tus días** (los pasados con su resultado y deshabilitados, el de hoy
como tarjeta grande, el de ayer habilitado mientras dure su gracia, los que vienen deshabilitados),
la **tabla** y el **gráfico de tu posición día a día**. Al terminar, el **podio**.

## Protocolo de mensajes

No tiene: no hay sala ni mensajes entre celulares. Cada celular escribe su resultado en Firebase bajo reglas que imponen las ventanas y una sola escritura, y el contenido del día sale de la semilla (D-97).

### Datos (Firebase)

```
torneos/<código>/meta               nombre, días, calendario (cal), ventanas, admin, joinUntil, final (the final's day as text, `'0'` without a final, D-438), idioma (lang), público (aud), zona (tz)
torneos/<código>/players/<pid>      { name, at, out?, back?, co?, j? }   back: when the admin brought them back after being out of the cup (D-347); co: país, al inscribirse o al volver a abrir (D-207, D-209); j: su jugador de los rankings (D-212)
torneos/<código>/started/<d>/<pid>  hora del servidor al tocar Empezar
torneos/<código>/results/<d>/<pid>  { s, ms, t, r, at }
torneos/<código>/wild/<pid>         "3" (el día del comodín, como texto): only the one chosen by hand; the one that lands on its own is read by the engine, never written (D-444)
torneos/<código>/fin                hora del servidor en que el admin la terminó antes (D-161)
torneoKeys/<código>/<pid>           hash del PIN (ilegible)
torneoSeats/<código>/<pid>/<uid>    el mismo hash: el celular uid puede escribir por pid (ilegible)
torneoIntentos/<código>/<pid>       { h, u, at }: the last PIN attempt, one every 5 s (unreadable, D-464)
pushCopa/<código>/<pid>/<subId>     { dia, plazo, at }: qué avisos quiere ese celular (ilegible, D-223); la suscripción va en push/<subId>
pushEnviados/<código>/<subId>/<clave>  hora en que se entregó ese aviso (dia:3, plazo:3, final, fin, insc:<pid>); solo la toca notify.mjs (D-224)
```

Las reglas imponen: escribir una sola vez, las ventanas de cada día con la hora del servidor, el
comodín antes de Empezar y fuera de la final, la inscripción antes de la final (or of the last day, without a final, D-438) y que solo el admin
renombre, saque o cambie PINes, and that a player out of the cup (D-347) can't press Empezar. El árbol no se llama `copas` porque las reglas no pueden nombrar
juegos (C-16, `public/panel/adapta.test.mjs`).

## Archivos

Todo bajo `public/cup/`:

| Archivo | Qué hace |
|---|---|
| `engine.js` | Calendario, ventanas con zona horaria, puntos, tabla, evolución, medallas; re-exports `code.js` and `clock.js` |
| `code.js` · `clock.js` | The cup code (`codigoAlAzar`) and the active-time clock (`reloj`, `pausaDeLectura`, and `mmss` re-exported from `assets/js/time-format.js`, the one copy every page uses), apart so Toque y Fama, Línea de tiempo and Generala alone use them without loading La Copa (D-377) |
| `games/<carpeta>/engine.js` | Motor puro de cada juego (`agents`, `case`, `connections`, `final`, `number`, `queens`, `tango`, `timeline`, `untangle`, `where`, `word`, `year`, `zip`), con sus datos propios al lado |
| `games/<carpeta>/ui.js` | La pantalla de cada juego; its optional flags (`caro`, `pruebaCompleta`, `pantallaCompleta`, `clock`) are read by `games/index.js`: a new game whose speed scores and that has no ⏳ countdown sets `clock = true` (D-384) |
| `games/index.js` · `games/semilla.js` · `games/mazos.js` · `games/audiencia.js` · `games/solo.js` | Lo común a los juegos: el registro, la semilla, los mazos, el público y el modo suelto con su récord |
| `games/lazy.test.mjs` · `../assets/js/load-css.js` | Only the game being played loads (D-468): `games/index.js` fetches each game with `loadGame(id)` (literal `import()`s), a screen that needs one awaits it, and a game with a `style.css` loads it from its `ui.js` with `loadCss()`; no page links a Cup game's stylesheet. Adding a game: its folder, its entry in `CODE` and `BUILD`, nothing in any page |
| `store-firebase.js` · `store-local.js` | El mismo almacén contra Firebase o contra localStorage (`?test`) |
| `cuenta.js` | Con quién está sentado este celular, el intento a medio jugar, los avisos de cada copa (D-223) y "Tus copas" (las del celular más las del jugador, `juntarCopas`, D-220) |
| `avisos.js` | Los avisos al celular en pantalla: la campana, la tarjeta y sus hojas (D-223; la lógica del navegador está en `assets/js/push.js`). El estilo de la hoja de abajo (`.hoja`) es de todo el sitio y vive en `assets/css/base.css` (D-232); `style.css` guarda solo lo propio de los avisos |
| `desglose.js` | Cómo se calculó el puntaje, línea por línea (D-106) |
| `demo.js` | Las escenas de ejemplo de `?test&demo=`, para las pruebas y las capturas; `escena()` builds one without storing it, for the home page's recap demo (D-423) |
| `recap.js` · `recap/index.html` | The recap of an ended cup for the home page (D-423): `/cup/recap/` is a page with no screen that the home page opens in a hidden frame; it reads the due cup over REST and posts back its table (`cupRecap`) and the final table's image (`cupImage`, D-427), so the home page never loads the engine; it links `base.css` (with the font preload, #851) only for the fonts the image is drawn with (Bangers, Nunito), and waits for them. The window itself is `assets/js/recap.js` and `assets/css/recap.css` |
| `reportes.js` | El botón 🐞 y los reportes que esperan reenvío |
| `planilla.js` | La tabla final como CSV (D-161) |
| `rules.js` | Textos (`LOCALES` es, en, pt, de, también los de los avisos al celular, `avMsg*`; the help sheets' texts come from `assets/js/notification-sheets.js`, shared with Uno al día, D-377) y la explicación de cada juego |
| `table-image.js` | The cup's table as a 1080 × 1350 image (D-126, D-141, D-153): the trajectory chart and the table, with the podium on plates once the cup ended (`imagenDeTabla`, `cabeceraTabla`, `COLORES_GRAFICO`). No screen state: `game.js` shares it from the board and the podium, `admin.js` from Administrar, and `recap.js` draws it for the home page's recap (D-427) |
| `game.js` | Screens, except Administrar, Crear and Entrar |
| `admin.js` | The admin screen (Administrar), loaded with `import()` the first time it opens (#860); what it needs from `game.js` comes in its context `c` |
| `create.js` | The create-a-Cup screen (Crear), loaded with `import()` the first time it opens (#860), like `admin.js`; what it needs from `game.js` comes in its context |
| `join.js` | The join screen (Entrar: sign up or sit back down), loaded with `import()` the first time it opens (#860), like `create.js`; what it needs from `game.js` comes in its context |
| `suelto/index.html` | La página de un juego suelto (`/<slug>/`), de la que `og.mjs cards` genera las demás |

Gancho de pruebas (C-14): `window.__copa`, en `game.js` (LIG-27).

### Pruebas

```bash
node public/cup/engine.test.mjs
node public/cup/games/juegos.test.mjs
node public/cup/store.test.mjs
node public/cup/planilla.test.mjs
node public/cup/reportes.test.mjs
node tools/e2e/cup/tournament.mjs /tmp/copa            # Copa de 3 días, tres jugadores
node tools/e2e/cup/tournament.mjs /tmp/copa --siete    # los siete juegos
node tools/e2e/cup/notifications.mjs /tmp/avisos          # los avisos al celular, con un servicio falso (D-223)
node tools/push/schedule.test.mjs                # qué aviso toca y cuándo, con relojes inventados (D-224)
node public/cup/recap.test.mjs                   # the recap of an ended cup: which cup is due, its rows and its sentence (D-423)
node tools/e2e/home/recap.mjs                    # the recap window on the home page, with ?recap=demo (D-423) and ?recap=season-demo (D-424)
node tools/push/notify.test.mjs                    # una vuelta del envío, con una base falsa
node tools/push/webpush.test.mjs                   # el cifrado y la firma, contra el ejemplo del RFC 8291
```

## Excepciones a los cánones

- **C-5 no aplica:** la copa no es una partida de dos con tres modos (ver “Modos”).
- **C-10 no aplica como secreto por celular:** el contenido del día es el mismo para todos y sale de
  la semilla; la protección contra trampas está en las reglas de Firebase (ventanas con la hora del
  servidor, una sola escritura, el asiento con el hash del PIN, D-96). La verificación cruzada de
  puntajes sigue pendiente (LIG-30).
- **The top-left button on a day's cover is "‹ Volver a la copa" and goes to the cup's board**, not to the app's menu: there
  the cup is the menu, and the button replaces the "Volver a la copa" that used to close that screen.
  Everywhere else in the cup it goes to the app's menu (or to the lab, with `?labs`).
