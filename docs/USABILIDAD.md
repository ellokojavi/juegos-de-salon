# Guía de usabilidad

La guía que aplica el agente de usabilidad (D-132) en cada revisión. Reúne lo que el dueño ya
decidió. **Crece con cada dilema resuelto**: la respuesta del dueño se anota aquí con su número de
issue, para no volver a preguntarla.

Cada regla tiene un ID (U-n) para citarla en los PR y en los issues. Los IDs van por bloques
(1–18 textos, pantallas y botones; 20–23 interacciones; 30–34 compartir y marketing): U-9 y U-19
nunca se usaron, y no se renumera.

## Textos

- **U-1 · Frases completas y explícitas.** Sin comas que fragmentan ni abreviaciones de la jerga de
  la app. Los modos y pantallas se nombran completos. Más largo pero inequívoco vale más que breve.
  En los botones no: ver U-17.
- **U-2 · Emojis al inicio de línea o en botones y títulos**, no en medio de una frase.
- **U-3 · Los textos nuevos salen con la mejor propuesta** y se anotan en el PR para que el dueño
  los vea; si algo no le gusta, lo corrige después (D-213, como "Dilemas sin backlog"). Corregir
  ortografía, gramática o concordancia no es un texto nuevo. La excepción es lo que una copa está
  jugando hoy: eso no cambia, ni siquiera el texto (U-21).
- **U-4 · Nombres propios sin artículo:** "La Copa: Valdenenas", nunca "la Valdenenas".
- **U-5 · Un mismo concepto, una misma palabra** en toda la app (día de gracia, inscripción,
  jugadores, link, PIN, administrador, el celular, tachar, vidas, sorbos, "cada intento después
  del primero", cantidades en cifras; D-177).
- **U-6 · El plural y el singular concuerdan con el número** ("1 jugador inscrito", "2 pistas").
- **U-7 · Los juegos por significado, no por juegos de palabras** (D-128): en Conexiones, lo que
  las cosas son; nada de "___ roja" o "esconden un animal".
- **U-8 · Cada regla, una vez por pantalla** (D-177): si ya la dice un botón, la pantalla de justo
  antes o una ayuda bajo el tablero, sale del texto de arriba. Sin frases que solo tranquilizan
  ("hay una sola solución") ni que describen lo que ya se ve. Corto no es telegrama (U-1).
- **U-18 · Instrucciones concisas** (D-184). Al escribir "Cómo se juega" y "Puntaje" de un
  juego:
  - **La meta primero, en una frase con verbo:** qué hace el jugador ("Arrastra los nudos hasta
    que ningún hilo se cruce"), no qué hay en pantalla ("Hay nudos unidos por hilos").
  - **A lo más 3 puntos**, cada uno una sola idea en una o dos frases cortas. Solo lo que cambia
    cómo se juega: la meta, la regla que no es obvia y el límite (tiempo, intentos, niveles).
  - **Lo que el dibujo de ejemplo ya muestra no se escribe**, ni en el texto ni en su pie: si el
    dibujo pinta en rojo lo que se cruza, el texto no dice "se ven en rojo".
  - **Los colores, los gestos finos y los mensajes de la pantalla no se anuncian:** se descubren
    jugando, y ya los dice la ayuda bajo el tablero.
  - **El puntaje en una frase**, sin topes que salen solos de la regla ("10 niveles, 10 puntos
    cada uno" ya dice que son 100).
  - **Tope que vigila una prueba** (`public/cup/games/juegos.test.mjs`), en los cuatro idiomas: a
    lo más 3 puntos y 280 caracteres para "Cómo se juega", y 170 para el puntaje. Además frena un
    primer punto que describe la pantalla ("Hay…", "There is…", "Há…", "Es gibt…"). Es un techo, no una meta: la mitad de los juegos queda bajo 210.

## Pantallas y botones

- **U-10 · Botones de 44 px o más** y sin scroll horizontal (C-8). Lo verifica `revisarPantalla`.
- **U-11 · Botones con aire:** separados de lo que tienen arriba y centrados en su caja cuando van
  solos. El botón que cierra un tablero va debajo de lo que resume, no encima (La Gran Final).
- **U-12 · Nada se encima:** nombres largos parten línea; etiquetas de empatados se apilan.
- **U-13 · Lo que se muestra es lo que se juega:** el laboratorio tiene la misma UX que producción.
- **U-14 · Cada cosa en su momento de la copa** (D-116): la invitación mientras se pueda
  entrar (en Administrar, D-176), la tabla parcial mientras se juega, el resumen al terminar,
  "sacar" nunca con la copa terminada.
- **U-15 · Las acciones que no se deshacen piden confirmación** (rendirse, eliminar la copa,
  cerrar la inscripción, mover el inicio). Eliminar pide escribir el nombre.

- **U-16 · Las reglas están a mano sin estorbar:** plegadas debajo del tablero en cada juego
  (D-133), con las mismas palabras de los botones.
- **U-17 · El botón dice la acción, nada más:** verbo y objeto, en una sola línea a 320 px (unos
  18 caracteres). Lo que haya que explicar va en el texto de arriba. Si dos botones se parecen,
  se distinguen en la palabra principal y no con una cola ("Jugar de nuevo" / "Repetir esta
  partida", no "Jugar otra vez con otro contenido"). Lo secundario o técnico va en botón chico.
  Si un botón igual parte línea, el texto va centrado.

## Interacciones

- **U-20 · El reloj corre solo mientras se juega:** parte con la pantalla de juego a la vista (después
  de la cuenta regresiva y de la entrada del juego, si la tiene), se pausa con la pantalla oculta y se
  detiene al terminar el tablero (D-105, D-130, D-258).
- **U-21 · Nada cambia a mitad de un día:** contenido, grilla o reglas nuevas entran para los días
  que todavía no empiezan (D-128).
- **U-22 · Un reintento nunca traba:** si algo llegó aunque el celular mostró error, el segundo
  intento sigue normal (D-123).
- **U-23 · Lo que se escribe no se pierde** con una actualización de la pantalla (campos enfocados,
  reportes guardados).

## Compartir

- **U-30 · Formato de los mensajes:** cabecera `{emoji} *{título}* · {contexto}` (en la copa,
  "La Copa: {nombre}"), una idea por línea con su emoji al inicio, y el link solo en la última
  línea ("🔗 …"). Vale para todo lo que se comparte, también las salas (D-165).
- **U-33 · La imagen dice lo mismo que el texto:** arriba la misma cabecera (título y contexto),
  abajo el mismo link. Un resultado o una tabla se comparten siempre con imagen y texto juntos,
  desde cualquier botón; una invitación, solo con texto (la imagen la pone la tarjeta del link).
  La app, desde la portada ("Invitar a jugar"), va con esa tarjeta como imagen, la de su idioma
  (D-226); el video de la portada (solo en español, D-254), solo con texto: la vista previa la arma
  el chat con la miniatura de YouTube (D-253).
- **U-31 · Completo:** el resultado dice copa, día, juego, jugador y puntaje; la tabla dice quién
  falta y marca "(-1J)" a quien lleva menos juegos. Excepción: el resultado de Uno al día no
  nombra el juego de hoy (#215).
- **U-32 · Sin spoilers:** lo que se comparte no revela respuestas ni los juegos que vienen.

## Marketing

- **U-34 · El marketing muestra la app de hoy:** cada asset de `marketing/` (el video y lo que
  venga) y las tarjetas sociales enseñan los juegos que hay, con sus nombres, emojis, textos y
  pantallas actuales. Un juego nuevo que no sale, uno que ya no está, un nombre o un texto viejo o
  una pantalla que cambió se anotan como pendiente del asset (`node tools/agents/marketing.mjs anotar`).
  Rehacerlo lo decide el dueño: el revisor anota, no rehace. Un asset que muestra a propósito
  solo algunos juegos (`"seleccion": true` en `marketing/registro.json`; el video desde la v6, que
  el dueño pidió corto y con pocos juegos) no queda atrás porque falte uno nuevo, pero sí si sale
  uno que ya no está o una pantalla que cambió.

## Resuelto con el dueño

Las respuestas a dilemas (issues con la etiqueta `usabilidad`) se anotan aquí:

- **El caso, comparaciones en dos colores** (#282, D-259): en "Hay más criminales A que B", A se
  ilumina en amarillo y B en rosado, en la grilla y en la frase; quien está en los dos lleva los dos.
  Desde D-264, en la grilla se iluminan solo las personas que cada grupo nombra por su nombre
  ("junto a Omar": Omar, en el color de su grupo; "en la columna A": nadie); la frase sigue igual.
- **El caso (laboratorio, D-256):** tocar a alguien ya marcado muestra su pista bajo la grilla
  (#271); "número par de criminales" no sale cuando son cero, porque ahí ya está "No hay
  criminales" (#272); el link del caso del día lleva su fecha (`?day=`), así un amigo que lo abre al
  día siguiente juega el mismo (#273). Las tres con la recomendación del agente, en el PR #270.
- **Reinas sin bordes gruesos entre zonas** (D-134): decisión del dueño, sabiendo lo de C-8. No
  marcarlo.
- **Textos del dibujo de Reinas:** "Así: una reina por fila, por columna y por color." y "Así no:
  se tocan." (aprobados por el dueño).
- **Leyenda de "(-1J)"** (#54, D-141): "(-1J), (-2J)… = uno, dos o más juegos por jugar", en la
  imagen de la tabla y en el tablero (aprobada por el dueño).
- **El número de día del título de la tabla** (#67, D-147): es el último día que la tabla muestra,
  no el de hoy. Quien todavía no juega hoy comparte "· día 4" con "⏳ ¡Día 5 en curso!" debajo.
- **"Ver todos" en la portada** (#71, D-149): con un solo filtro posible, el enlace bajo las fichas
  dice "Ver todos" (EN "Show all", PT "Ver todos") y no "Quitar filtros". El aviso de lista vacía
  se borró: solo se ofrecen tipos con algún juego.
- **Sin empates fuera de una copa** (#72): en el juego suelto, la práctica y la sesión de
  prueba, el puntaje no dice "Si empatas…" y el resultado dice solo "Tu tiempo fue 0:42.". El
  desempate vive aparte (`desempate` en `JUEGOS_COPA`) y solo se suma dentro de una copa.
- **¿Dónde queda? se juega en un globo** (D-156, reemplaza la decisión de #85): cada ciudad parte
  con el globo entero a la vista, mirando al Atlántico; arrastrar lo gira sin fin. Los botones + y
  − van abajo a la derecha. La portada es el globo girando solo.
- **Pista de girar el globo** (#88, opción B): en la primera ciudad de cada partida, "↔ Arrastra
  para girar" arriba al centro, sobre el Ártico (abajo chocaba con + y − en 320 px); se va con el primer arrastre y no vuelve.
- **Los niveles de las ciudades chilenas quedan como están** (#90, opción B): Los Ángeles, Pucón y
  Puerto Natales siguen en nivel 3; de vez en cuando la difícil es una "amable". No marcarlo.
- **Juego al azar no se cancela** (#139, opción A): tirar el dado es un compromiso. Sin ✕ ni
  Escape; tocar durante la tirada abre el juego de inmediato y "atrás" vuelve al menú limpio (D-188).
- **Dilemas sin backlog** (2026-10-03): el dueño pide que los dilemas no se acumulen. Se resuelven
  con la opción recomendada y se arreglan apenas se pueda; él corrige después si algo no le gusta.
- **El emoji del juego encabeza el recordatorio** (#114, opción B): "⏳ Hoy toca Línea
  Relámpago."; la línea de gracia queda con 🕐 y el nombre sin emoji.
- **Bienvenida del admin sin repetir** (#102, opción A): con link propio, el paso 3 dice "Cuando
  estén todos, cierra la inscripción: tu link es fácil de adivinar y así no se suma nadie más."
- **Botones de Administrar con verbo** (#65, opción A): "📤 Invitar al grupo" (el mismo del
  tablero), "📤 Recordar el juego de hoy" y "📤 Compartir la tabla".
- **El empate en puntos se explica donde se ve** (#79, opción B): bajo el podio y en el resumen,
  solo si 1.° y 2.° empatan, "⚖️ Empate en 68 puntos: desempató quien ganó más días." (o "…quien
  quedó mejor en la final"); y el desempate en "Cómo funciona".
- **Tango marca el choque al tocar otra casilla** (#135, opción B): sin espera de 500 ms. Lo rojo
  es lo que se cobra; el último toque del tablero lleno se pinta sin sonar ni contar.
- **Sol dado más intenso** (#61, opción A): ámbar al 84 % con borde propio.
- **La etiqueta del chat no se toca** (#48, opción B): deja pasar los toques; solo la burbuja abre
  el chat.
- **Batalla Naval baja a ¡Zarpar!** (#47, opción B): al completar la flota, si ¡Zarpar! no se ve,
  la pantalla baja hasta él. Una sola vez, al soltar.
- ~~**El 🐞 del laboratorio alemán puede achicar el nombre del juego en la barra**~~ (#159): ya no
  aplica: el alemán salió del laboratorio (D-197) y ya no muestra 🐞. Vuelve a valer para el
  próximo idioma que entre al laboratorio (D-191).
- **Uno al día: compartir sin el juego de hoy** (#215, D-230): ni el texto ni la imagen del
  resultado nombran el juego que tocó ("📅 *Uno al día n.° 12*" y "87 puntos"), porque quien lo lee
  en el grupo casi siempre todavía no juega y el juego se descubre en el dado, como con el aviso.
  Es una excepción a U-31.
- **Uno al día: sin revancha en los juegos de grupo** (#226, D-230): jugados como Uno al día, El
  Ahorcado, Batalla Naval y Dudo no muestran su botón de revancha; la tarjeta ya ofrece 🎲 Jugar
  otro y Repetir el de hoy. Bajo el resultado de los solitarios queda solo el ranking de Uno al día.
- **Uno al día: sin recordatorio con los avisos activos** (#230, D-230): con los avisos activos, `/today/`
  no muestra "⏰ Agregar recordatorio" ni su línea, que repetirían el aviso. Reemplazado el mismo día
  por el dueño: el recordatorio es el aviso diario, y el del calendario se sacó.
- **El video promocional suma Uno al día** (#235, D-230): la v6 lleva un plano de 📅 Uno al día (el
  botón, el dado y la tarjeta con la racha) y cierra con "agrégala a tu inicio" (D-232). Anotado en
  "Pendiente: versión 6" de `marketing/promo-video/README.md`; la v6 se empieza cuando el dueño la pida.
- **Entrar va antes de "Empezar"** (#186, D-249): en la antesala de cada juego suelto, la invitación
  a entrar con nombre y PIN va justo bajo "Empezar" y "Volver al menú", plegada en una fila con su botón
  "Entrar" a la vista, porque el ingreso se ofrece antes de jugar. Lo mismo bajo el puntaje y, en
  Uno al día, antes de los botones del resultado y de la racha en `/today/`.
- **La fama es verde y el toque amarillo** (#196, opción B): como en Wordle, en todos los Toque y
  Fama (las letras de Palabra, las pistas de Número y del juego de sala) y en la tarjeta de Palabra
  (🟩 fama, 🟨 toque, ⬛ no está), que así habla igual que la de Número (🟢, 🟡, ⚪).
- **La final muestra las rondas de cada uno** (#259, opción A): en la tabla del día de 🏁 La Gran
  Final, bajo el puntaje y el tiempo de cada jugador, su tarjeta de cinco rondas, para comparar
  ronda a ronda. Solo en la final: en los otros días las tarjetas de varias líneas alargarían
  mucho la tabla (opción B, por si se echa de menos). A 320 px la línea se corta entre ronda y ronda.
- **Portada bajo 375 px: las acciones bajan a una segunda línea** (#250, opción A): entre 320 y 374
  px el idioma queda arriba a la izquierda y sonido, rankings y compartir bajan a la derecha. Se
  acepta la escalera antes que achicar los botones de idioma bajo 44 px (C-8) o volver atrás D-231.
