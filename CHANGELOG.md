# Changelog

## 0.117.1 — 2026-10-06
- **Del dado al juego, sin pantalla vacía** (D-237): en Juego al azar y Uno al día, el dado queda
  en pantalla mientras el juego carga y se desvanece recién cuando el juego está listo debajo.

## 0.117.0 — 2026-10-06
- **Uno al día con rankings, comodines e invitaciones, en el laboratorio** (D-230): entrando con
  tu nombre y PIN, tu Uno al día pasa de un celular a otro y entra a los rankings de hoy, de la
  semana y de rachas. Cada 7 días seguidos ganas un comodín 🧊, que salva tu racha si un día no
  juegas. Puedes invitar a un amigo: le llega "Sara te desafía" con tu racha, juega el mismo desafío,
  ven quién ganó y tú ganas un comodín.

## 0.116.0 — 2026-10-06
- **Uno al día suma El Ahorcado, Batalla Naval y Dudo, en el laboratorio** (D-230): desde el 12 de
  octubre el dado también puede caer en ellos. Abren directo, sin elegir modo: El Ahorcado con una
  palabra del mazo, Batalla Naval y Dudo contra el celular. La palabra, la flota del celular y los
  dados son los mismos para todos ese día. El puntaje va de 0 a 100: en El Ahorcado, por las vidas
  que te quedan; en Batalla Naval, por los disparos que usaste o los barcos que tocaste; en Dudo,
  por los dados que te quedan o las rondas que aguantaste.

## 0.115.0 — 2026-10-06
- **Uno al día, en el laboratorio** (D-230): un botón nuevo en la portada, al lado de Juego al
  azar. El dado rueda y cae en el juego de hoy, el mismo desafío para todos. Al terminar ves tu
  racha y puedes compartir el resultado sin decir qué juego tocó, o tirar el dado por otro juego. En
  `/today/` están tu racha, un calendario del mes y cómo te va en cada juego. Por ahora entran los 7
  juegos de La Copa que se juegan solos, y todo se guarda en el celular. Se activa en `/labs/`,
  donde también se puede probar con una tarjeta junto a La Copa en vez del botón.

## 0.114.2 — 2026-10-06
- **Cambiar el PIN va en "Juegas como"** (D-236): al tocar tu nombre se despliegan Cambiar el PIN,
  con una línea que explica para qué sirve, y Salir. En Rankings queda solo **Tus partidas**, con
  cuántas veces jugaste cada juego.

## 0.114.1 — 2026-10-06
- **Del dado al juego, sin corte** (D-235): en Juego al azar, el dado se desvanece en el fondo
  de la app y el juego aparece con un fundido, en vez de cambiar de golpe.

## 0.114.0 — 2026-10-06
- **"Tus copas" separa las terminadas** (D-234): en la portada de La Copa, las copas que ya
  terminaron llevan la etiqueta **Terminó** y no se ven de entrada. Para verlas, se prende
  **Mostrar copas terminadas**, al pie de la lista.

## 0.113.0 — 2026-10-05
- **Un globo en la portada invita a agregar la app a inicio, en el laboratorio** (D-232): con un
  toque en **Agregar** salen los pasos de tu celular (Safari o Chrome, en iPhone o Android); en
  Android, si Chrome lo ofrece, su propio botón de instalar. La ✕ lo cierra para siempre. Se
  activa en `/labs/` para probarlo.

## 0.112.0 — 2026-10-05
- **Los avisos se miden en el panel** (D-233): cuántos celulares los tienen, cuántos avisos se
  mandan y se tocan por tipo, cuántos abren la app instalada y a qué hora pasó la última vuelta,
  para notar si GitHub dejó de mandarlos. Para el jugador no cambia nada.

## 0.111.1 — 2026-10-05
- **El selector de idioma lleva las banderas también en el celular** (D-231): antes, en una
  pantalla angosta quedaban solo ES EN PT DE. Ahora la bandera va arriba de cada código, sin
  que el selector crezca, y en una pantalla ancha va al lado, como siempre.

## 0.111.0 — 2026-10-05
- **Avisos más justos** (D-229): a lo más 2 por copa al día, y si se vencen dos días a la vez,
  van en un aviso. Al tocarlo abre el día que avisa, listo para jugar, y en Android trae los botones
  **Jugar** y **Silenciar esta copa**. Si tienes días nuevos en varias copas, llega uno solo. Si la
  copa termina empatada arriba, el aviso nombra a todos los que ganaron.

## 0.110.0 — 2026-10-05
- **Avisos de La Copa para todos** (D-228): la 🔔 de cada copa ya no está solo en el laboratorio.
  Quien la activa recibe en el celular cuándo se abre un día, cuándo se le acaba el plazo para
  jugarlo, La Gran Final y quién ganó. En iPhone, con la app agregada a inicio.

## 0.109.1 — 2026-10-05
- **La campana de avisos aparece en la app del iPhone** (D-227): el iPhone abre la app agregada a
  inicio en la portada, sin lo que se activó en Safari, así que la campana no salía. Ahora sale
  siempre en esa app, y los pasos para agregarla dicen cómo volver a la copa: con su código, tu
  nombre y tu PIN.

## 0.109.0 — 2026-10-05
- **Compartir la app manda imagen y texto** (D-226): el 📤 de la portada manda la tarjeta de Juegos
  de Salón y un mensaje con cuántos juegos hay, La Copa, para jugar en grupo o solo, y el link.
  Los dos en el idioma en que se mira la app. En un computador se copia el texto, como antes.

## 0.108.1 — 2026-10-05
- **Los avisos de La Copa ya tienen su clave** (D-225): con ella se pueden mandar de verdad, todavía
  en el laboratorio. En iPhone, la app agregada a inicio desde una copa con los avisos del
  laboratorio activados ya muestra la campana: antes no la veía, porque no comparte lo guardado en
  Safari.

## 0.108.0 — 2026-10-05
- **Los avisos de La Copa llegan de verdad, en el laboratorio** (D-224): cuando se abre un día,
  cuando se te acaba el plazo para jugarlo, en La Gran Final (con tu lugar en la tabla) y al
  terminar la copa; al admin, cuando alguien se inscribe. Nunca de noche, en tu idioma y a tu
  hora. Los manda GitHub cada 15 minutos; se abren a todos cuando el dueño vea llegar uno.

## 0.107.0 — 2026-10-05
- **Avisos de La Copa, en el laboratorio** (D-223): una campana en cada copa para activar los
  avisos al celular, con la oferta después de jugar, el permiso del sistema, un aviso de
  confirmación y los ajustes. En iPhone, los pasos para agregar la app a inicio. Todavía no se
  mandan avisos: se activa en `/labs/` para probarlo.

## 0.106.1 — 2026-10-05
- **La app instalada se llama Juegos de Salón** (D-222), o Party Games, Jogos de Salão o
  Salonspiele, según el idioma elegido. Antes decía solo "Juegos", y en iPhone tomaba el nombre del
  juego que estaba abierto. Quien ya la instaló la ve con el nombre nuevo al reinstalarla.

## 0.106.0 — 2026-10-05
- **"Tus copas" te sigue a cualquier celular** (D-220): si entras con tu nombre y PIN de jugador,
  la portada de La Copa muestra también las copas que juegas en otros celulares. Al abrir una, tu
  nombre ya está elegido y solo falta el PIN de esa copa.

## 0.105.0 — 2026-10-05
- **La app se puede instalar de verdad** (D-221): íconos para Android y iPhone, y un service worker
  que todavía no guarda nada. Es el primer paso de los avisos de La Copa al celular, para quien los
  quiera ([PWA-NOTIFICACIONES.md](docs/PWA-NOTIFICACIONES.md)). Nada cambia al jugar.

## 0.103.0 — 2026-10-05
- **`/records/` más fácil de leer** (D-219): arriba el Ranking general y una tabla nueva, Más
  partidas jugadas; abajo, un filtro entre 🎮 Juegos y 🏆 Copas. Línea Relámpago es una sola ficha
  con sus temáticas adentro.
- **La bandera junto a cada nombre** en todos los rankings, el medallero y las últimas copas.

## 0.102.2 — 2026-10-05
- **Lo de después de fusionar se hace solo** (D-218): las reglas de Firebase se publican en cada
  fusión, antes que el sitio; las copias de trabajo ya fusionadas se borran al empezar cada sesión
  de Claude, y GitHub borra la rama. Sin cambios para quien juega.

## 0.102.1 — 2026-10-05
- **Rankings: tu partida aparece apenas terminas** en Línea Relámpago y en Toque y Fama solo. La
  tabla del final se leía mientras la partida se guardaba y salía sin ella; ahora se vuelve a leer
  cuando queda guardada (en los juegos de La Copa ya era así).

## 0.102.0 — 2026-10-05
- **Los rankings, para todos** (D-217): ya no hace falta activarlos en `/labs/`. El 🏆 de la
  portada lleva a `/records/`; cada juego muestra su ranking (récords o victorias) y la invitación a
  entrar con nombre y PIN, y La Copa muestra sus campeones.

## 0.101.1 — 2026-10-05
- **Los PR se fusionan solos cuando pasan sus pruebas** (D-216): cada PR listo lleva el auto-merge
  de GitHub, y `main` exige, además de `pruebas`, un check que resume todas las pruebas en Chrome
  (`punta-a-punta`). Sin cambios para quien juega.

## 0.101.0 — 2026-10-05
- **Cada juego con su ranking, en el laboratorio** (D-215): los juegos de grupo (Línea de Tiempo,
  Toque y Fama, El Ahorcado, Dudo y Batalla Naval) cuentan las victorias de cada jugador, de la
  semana y de siempre, con su tabla en la intro. Toque y Fama solo y Línea Relámpago (una tabla por
  temática) guardan su récord de 0 a 100. `/records/` suma las dos secciones.

## 0.100.0 — 2026-10-05
- **Rankings, en el laboratorio** (D-212): con un nombre y un PIN de 4 dígitos, sin cuenta y en
  cualquier celular, los juegos sueltos guardan tu mejor puntaje y cuentan tus partidas. Cada juego
  tiene su ranking (semana, siempre, amigos de La Copa y Copa) con tus vecinos si quedaste abajo;
  `/records/` suma el Todoterreno y el medallero de La Copa. Por ahora solo en los celulares que
  los activan en `/labs/`. La historia de La Copa ya está cargada: quien jugó antes reclama sus
  puntajes al entrar con su nombre.

## 0.99.7 — 2026-10-05
- **Cuarto Rey: el pase del celular en una sola pantalla** (D-213): lo que pasó ("¡Salud!", quién
  toma) y "Pásale el celular a X" se ven juntos, y solo avanza el botón "¡Dame la carta!": ya no se
  cierra solo ni con un toque en cualquier parte.
- Cuarto Rey: las cifras y las letras de las cartas en la letra de los números, como en los demás
  juegos, y los botones de género de 44 px. La mesa recordada se conserva.
- Panel: las partidas de Cuarto Rey dicen cómo terminaron (quién sacó el cuarto rey y con cuántas
  cartas).

## 0.99.6 — 2026-10-05
- **Las reglas se revisan solas** (D-213): una prueba exige a cada juego su motor con tests, su
  gancho de pruebas y su especificación, o una excepción con su decisión; el revisor de la
  documentación avisa de números de decisión que faltan, estados sin marcar, IDs repetidos y rutas
  que no existen. Las pruebas en Chrome toman un puerto libre y cierran su navegador al terminar,
  así que varias sesiones pueden probar a la vez. Sin cambios para quien juega.

## 0.99.5 — 2026-10-05
- **Las reglas, en un solo lugar** (D-213): los cánones dicen la regla de hoy y se pusieron al día
  con las decisiones que los habían dejado atrás (la privacidad de las partidas sin red, la semilla
  y sus excepciones, el pase del celular, lo que se preselecciona, los modos de un juego de grupo).
  Las decisiones tienen un estado cerrado, un índice por tema y una tabla de rutas de entonces y de
  hoy; los requerimientos ya no repiten IDs y cada juego tiene su especificación con la misma
  plantilla. Sin cambios para quien juega.

## 0.99.4 — 2026-10-04
- **El filtro de la portada, en inglés en la URL** (D-214): `?type=logic`, `?type=tabletop`, en vez
  de `?tipo=logica` o `?tipo=mesa`. Los links viejos siguen filtrando lo mismo.

## 0.99.3 — 2026-10-04
- **Panel: en qué idioma se jugó** (D-211): cada copa, sala y partida sin red lleva una etiqueta
  con su idioma (ES, EN, PT, DE; las dos si en una sala cada uno jugó en el suyo), y hay un
  desglose de copas por idioma y del idioma de cada juego.

## 0.99.2 — 2026-10-04
- **Panel: quién juega sin red** (D-210): las partidas contra el celular, en un celular o en
  solitario muestran el nombre que la persona ya usa en la app, con su bandera, y cómo terminaron
  (quién ganó, o el puntaje y el tiempo jugando solo). La sección Juegos las lista todas.

## 0.99.1 — 2026-10-04
- **Panel: la bandera junto a cada nombre** (D-209), también en "va primero", en los retirados y
  en la historia de una copa. Quien se inscribió antes de que La Copa guardara el país lo anota
  solo la próxima vez que abre su copa.
- Panel: los juegos de La Copa jugados sueltos salen con su nombre, no con su clave.

## 0.99.0 — 2026-10-04
- **El panel se navega** (D-207): cuatro secciones —Ahora, La Copa, Juegos, Audiencia— y una ficha
  por cada copa, juego y sala. La de una copa trae la tabla completa, una grilla de cada jugador
  por cada día y su historia evento por evento. Cada cifra de Ahora abre la lista que la suma, la
  vista queda en la URL y las horas son del Pacífico. Cada nombre lleva la bandera de su país: La
  Copa lo guarda ahora al inscribirse, y los reportes 🐞 también.
- **El tráfico del sitio, aunque nadie juegue** (D-208): visitas, páginas vistas, de dónde llegan
  (solo el dominio), por qué link, primera vez o vuelve, aparato, país y cuántas visitas llegan a
  jugar, en la sección nueva 📈 Tráfico del panel. Los links que comparte la app llevan `de=link`
  al final: WhatsApp no dice de dónde viene nadie.
- Arreglo: una copa que el admin terminó antes ya no sale en curso en el panel.

## 0.98.2 — 2026-10-04
- **Publicar es más rápido** (D-204, D-205): las pruebas de punta a punta más largas corren en
  partes a la vez, la versión se pone al publicar y no en cada PR (dos cambios abiertos ya no
  chocan), y un cambio que solo trae documentación no espera esas pruebas. Si fallan después de
  fusionar, se abre un aviso solo. Para quien juega no cambia nada.

## 0.98.1 — 2026-10-04
- **README: capturas rehechas en todas las secciones** después de la mudanza a `public/` (D-192),
  con los emojis de Apple y las salas en el Firebase real. La del cuarto rey ya no sale con el
  confeti tapando la instrucción, y los guiones de sala de Toque y Fama y Batalla Naval abren el
  segundo celular en el servidor propio de la sesión, no en el 8765 (D-135).

## 0.98.0 — 2026-10-04
- **¿Dónde queda? a pantalla completa** (D-203): el globo ocupa toda la pantalla, en el celular y
  en el computador. La ciudad, el reloj, las reglas plegadas, la brújula, + y − y Confirmar flotan
  encima.

## 0.97.0 — 2026-10-04
- **¿Dónde queda?: el mapa se gira con dos dedos** (D-200), como en los mapas del celular. Con el
  mapa girado aparece una brújula sobre + y −; tocarla vuelve a poner el norte arriba.
- **¿Dónde queda?: el zoom llega a 64 veces** (D-202, antes 16), para que el dedo pueda apuntar
  dentro de los 25 km del 🎯.
- **¿Dónde queda?: se acabó el polo mal parchado** (D-201). Las imágenes nítidas que se cargan al
  acercar estaban cortadas corridas: sobre el Ártico aparecía África estirada. Se rehicieron todas.

## 0.96.0 — 2026-10-04
- **Todas las pantallas, probadas en todos los idiomas** (D-199): cada juego tiene una prueba que
  recorre sus pantallas en español, inglés, portugués y alemán, y avisa si algo quedó sin traducir,
  a medio armar o fuera de la pantalla. Las pruebas de La Copa, Línea de Tiempo, los errores de sala
  y los links con idioma ahora prueban también el alemán, y cualquier idioma que se sume.
- **Palabra en alemán**: la nota de las diéresis es más corta y el botón "Zurück zum Menü" vuelve a
  caber en la pantalla.

## 0.95.0 — 2026-10-04
- **Ya no hay minijuegos** (D-198): Conexiones, Reinas, Tango, Zip, Desenredo, ¿Dónde queda?,
  ¿En qué año? y Toque y Fama: Palabra son juegos como los demás. Viven en la raíz (`/queens/`,
  `/tango/`, `/connections/`…) y los links con `/minigames/` siguen andando. La Copa dice "un
  juego distinto cada día" en los cuatro idiomas, y el panel los cuenta como juegos.

## 0.94.0 — 2026-10-04
- **🇩🇪 El alemán, para todos** (D-197): sale del laboratorio. El toggle ofrece DE en cualquier
  celular y `juegosdesalon.cl/de/` deja la app en alemán, con su tarjeta para los chats
  (Salonspiele). El link del laboratorio, `/labs/de/`, ahora lleva a `/de/`, y el laboratorio ya
  no muestra la sección del alemán. Quien tenía la marca del laboratorio deja de ver 🧪 y 🐞.

## 0.93.0 — 2026-10-03
- **Portada: los filtros quedan pegados arriba** (D-196). Al bajar por la lista, los tipos de
  juego (Palabras, Lógica, Cultura, Cartas/Dados) se quedan a mano. Elegir uno desde abajo lleva
  la lista a su primera tarjeta.

## 0.92.1 — 2026-10-03
- **Laboratorio alemán: el idioma ya no se queda pegado en alemán** (D-195). Con otro idioma
  elegido, "‹ Menú" lleva al menú de siempre en ese idioma (antes llevaba a la portada del
  laboratorio, que está en alemán). En alemán sigue volviendo al laboratorio.

## 0.91.0 — 2026-10-03
- **Sin destello de idioma** (D-194): al abrir una página en inglés, portugués o alemán ya no se
  ven los textos en español una fracción de segundo antes de cambiar.
- **Laboratorio alemán** (D-194): todo el alemán pasa a Hochdeutsch común para Alemania, Austria
  y Suiza (con ß, sin palabras ni referencias de un solo país). Una copa con palabras en alemán cambia de día a medianoche de
  Europa central (Berlín, Viena, Zúrich), y las instrucciones de Palabra y del Ahorcado dicen que
  las diéresis van sin puntos (Ä es A) y la ß como SS.

- **Las direcciones pasan al inglés** (D-192): `/hangman/`, `/cup/`, `/timeline/`, `/bulls-and-cows/`,
  `/liars-dice/`, `/battleship/`, `/julep/`, `/fourth-king/` y `/minigames/<slug>/`. Los links
  viejos siguen andando: cada ruta en español es una página puente que manda a la nueva con todo
  lo que traía (la sala, el nombre de la copa, el idioma) y con la misma tarjeta para los chats.
  Nada guardado cambia: los ids de los juegos son los de siempre.
- **El sitio vive en `public/`** y es lo único que se publica, con un workflow que corre las
  pruebas antes: si una falla, el sitio no cambia. `docs/`, `tools/`, las reglas de Firebase y el
  video dejan de ser públicos.
- **El taller, ordenado:** `tools/` por función (`release/`, `firebase/`, `generators/`, `agents/`,
  `e2e/<juego>/`), un minijuego de La Copa por carpeta (`cup/games/<slug>/`) y el import map de
  versiones armado solo, sin lista que mantener.

## 0.90.6 — 2026-10-03
- **README al día, con capturas** (C-13): la tabla de juegos suma los minijuegos que se juegan
  sueltos desde la portada (`tools/release/hechos.mjs` ahora lee `SUELTOS`, así que uno nuevo aparece
  solo), con sus nombres en la tabla de idiomas. Se rehicieron las capturas de todas las
  secciones con las fuentes reales; el pie de Cuarto Rey "Cheers!" pasa a "Who drinks", porque
  esa pantalla cambia de título según la carta.
- **"Actualiza el README" es una pasada entera** (CLAUDE.md): bloques generados, prosa y capturas.

## 0.90.5 — 2026-10-03
- **⚓ Batalla Naval: la pantalla baja hasta ¡Zarpar!** (#47): en un celular chico, al poner el
  quinto barco, si "⚓ ¡Zarpar!" no se ve, la pantalla baja sola hasta él. Pasa una vez, al
  completar la flota (tocando, arrastrando o con Al azar), y nunca a mitad de un arrastre.

## 0.90.4 — 2026-10-03
- **💬 El aviso del chat ya no se come los toques** (#48, U-12): la etiqueta que asoma junto a la
  burbuja cuando llega un mensaje deja pasar los toques, así que tocar "🔁 Revancha" (o lo que
  quede debajo) hace lo que dice el botón. El chat se abre con la burbuja. Vale para los seis
  juegos con chat; los lectores de pantalla siguen oyendo cada mensaje.

## 0.90.3 — 2026-10-03
- **☀️ Tango: el choque se marca al tocar otra casilla** (#135): sin la espera de 500 ms. Un sol
  de paso que rompe una regla se pinta en rojo (con sonido y vibración) recién cuando el jugador
  toca otra casilla, que es cuando el puntaje lo cobra: lo rojo es lo que cuenta. El puntaje no
  cambia. Con el tablero lleno, el último choque se ve sin sonar ni contar.
- **El sol dado se distingue del jugado** (#61): ámbar más intenso y borde propio.

## 0.90.2 — 2026-10-03
- **🏆 La Copa: cuatro dilemas de usabilidad resueltos.**
  - El recordatorio del día abre con el emoji del minijuego ("⏳ Hoy toca Línea Relámpago."), sin
    emoji en medio de la frase (#114, U-2).
  - La bienvenida del admin con link propio dice una sola vez que cierre la inscripción, con el
    porqué al lado (#102).
  - Los botones de Administrar dicen la acción: "📤 Invitar al grupo", "📤 Recordar el juego de
    hoy" y "📤 Compartir la tabla" (#65, U-5, U-17).
  - Si el 1.° y el 2.° empatan en puntos, el podio y el resumen dicen qué desempató: "⚖️ Empate en
    68 puntos: desempató quien ganó más días." "Cómo funciona" cuenta el desempate (#79).

## 0.90.1 — 2026-10-03
- **☀️ Tango: el sol de paso ya no se marca como choque en iPhone** (U-20, reporte 🐞 del 2-oct).
  Para poner una luna hay que pasar por el sol; si se tocaba dos veces rápido la misma casilla,
  iOS podía tomar el segundo toque como zoom y el sol quedaba en rojo. El tablero ya no acepta
  ese gesto (`touch-action: manipulation`, como el teclado de los juegos).

## 0.90.0 — 2026-10-03
- **🇩🇪 El alemán, en el laboratorio** (D-191): la app entera en alemán (Salonspiele) para que la
  revisen amigos que lo hablan, en `/labs/de/`. Solo ese celular ofrece DE en el toggle; ahí los
  "‹ Menü" vuelven al laboratorio y 🐞 en la barra de arriba manda comentarios con su contexto
  (`node tools/firebase/reportes.mjs`). Es un borrador con glosario fijo: ver `docs/ALEMAN.md`.
- **Arreglos para todos**, que salieron de medir el alemán a 320 px: los acentos de los títulos
  con degradado ya no salen cortados (SALÓN, SALÃO); la barra de arriba no se parte en dos líneas
  (el nombre del juego se corta con "…"); Palabra ya no muestra "null", su teclado deja un hueco
  donde el español tiene la Ñ y el botón Probar va a lo ancho; el título de la pestaña de La Copa
  sale en el idioma de quien mira.
- **Reglas de Firebase:** una copa puede guardar `lang: "de"`.

## 0.89.0 — 2026-10-03
- **🧶 Desenredo sale del laboratorio** (D-190): su tarjeta ya no dice "Próximamente" y se juega
  suelto desde el menú, en `/minigames/untangle/`. En La Copa se puede elegir para cualquier día,
  como los demás minijuegos.

## 0.88.0 — 2026-10-03
- **🎲 Juego al azar** (D-188): un botón bajo el título del menú tira un dado blanco en 3D con un
  juego en cada cara; rueda, rebota, cae en uno y lo abre. Nunca sale La Copa, y si hay un filtro
  de tipo puesto, sale uno de esos. Se probó primero en el laboratorio.

## 0.87.1 — 2026-10-03
- **Tango: las casillas que no se pueden cambiar llevan un candado chico** en la esquina: las que
  vienen puestas (candado blanco) y las que reveló una pista (candado cian, como su borde). La
  esquina superior izquierda queda libre de las marcas = y ≠, que van en los otros bordes.

## 0.87.0 — 2026-10-03
- **La Copa: el público se elige entre 🌎 Global, 🇨🇱 Chile y 🇧🇷 Brasil** (D-187). Global deja
  fuera lo que se conoce solo en Chile o en Brasil (lo que antes era "Internacional"). Chile y
  Brasil suman los temas de su país y dejan fuera los del otro. Una copa para Brasil juega
  también la temática Brasil de Línea de Tiempo. La invitación y el tablero dicen el público.

## 0.86.0 — 2026-10-03
- **La Copa puede ser internacional** (D-186): al crearla se elige "Con temas locales" o
  "Internacional". La internacional deja fuera lo que se conoce solo en Chile o en Brasil: la
  temática Chile de Línea de Tiempo, las grillas de Conexiones con palabras locales, algunas
  palabras chilenas y las ciudades chilenas y brasileñas que no son capitales. La invitación y el
  tablero lo dicen. Las copas de siempre no cambian.

## 0.85.4 — 2026-10-02
- **🧶 Desenredo: instrucciones más cortas** (U-18, D-184): de 337 a 209 caracteres. La meta va
  primero y no se repite lo que muestra el dibujo de ejemplo.
- **Reglas para instrucciones concisas** (U-18): la meta primero, a lo más 3 puntos y el puntaje
  en una frase. Una prueba frena las que pasen de 280 caracteres, en los tres idiomas.
- **Desenredo: cuerdas menos onduladas** (D-185): la segunda onda queda a menos de la mitad y la
  curva más tensa.

## 0.85.3 — 2026-10-02
- **🧶 Desenredo: cuerdas más naturales** (D-183): cada cuerda lleva una segunda onda, más corta y
  suave, y una textura de dos cabos (uno oscuro y uno claro) que se alternan como en una cuerda
  torcida.

## 0.85.2 — 2026-10-02
- **🧶 Desenredo: los hilos son cuerdas** (D-182): con una curva leve, un poco más gruesos y con
  textura de cuerda torcida. Cada hilo tiene su forma y la mantiene al moverlo. Las reglas no
  cambian: un cruce sigue siendo el de la línea recta.
- **Desenredo: el nudo que arrastras ya no desaparece** mientras lo mueves. Chocaba con un estilo
  del arrastre de Línea de Tiempo.

## 0.85.1 — 2026-10-02
- **🧶 Desenredo, usabilidad:** la bajada del menú y de la tarjeta social queda en una frase, como
  la de los demás minijuegos; ya no repite con palabras los niveles y los minutos que la tarjeta
  dice en cifras (U-5, U-8). Al terminar, el contador de cruces vacío deja de abrir un hueco entre
  el tablero y el aviso del final (U-11).
- **Tarjetas para compartir: una imagen atrasada ya no se publica** (D-181). La de Desenredo había
  salido con las píldoras desalineadas, el mismo error de 0.84.2 y 0.84.3, porque se hizo desde
  una rama anterior al arreglo. Cada imagen guarda ahora la huella del dibujo y de los textos con
  que se hizo; si no coinciden con los de hoy, las pruebas del PR y `set-version.py` lo detienen.

## 0.85.0 — 2026-10-02
- **🧶 Desenredo, minijuego nuevo en el laboratorio** (D-179): el Untangle de Simon Tatham. Nudos
  unidos por hilos que se cruzan; se arrastran hasta que ningún hilo cruce a otro. Diez niveles de
  6 a 15 nudos y cuatro minutos, como Zip: 10 puntos por nivel. Entra al pozo de La Copa con su
  propia habilidad (espacial) y tiene su página suelta en `/minijuegos/desenredo/`.

## 0.84.4 — 2026-10-02
- **Línea de Tiempo: el año del veredicto, grande.** Después de colocar una carta, el año en que
  pasó es lo que se viene a mirar: ahora ocupa el ancho de la carta (antes era del tamaño del
  texto). Vale también para el minijuego de Línea de Tiempo de La Copa.
- **La tarjeta de La Copa resalta en el menú**: un degradé dorado, rosa y morado que se mueve
  despacio y un borde dorado, para invitar a armar un torneo de varios días. Con "reducir
  movimiento" queda quieto.

## 0.84.3 — 2026-10-02
- **Julepe vuelve a tener su tarjeta para compartir al día:** aunque está apagado, su página sigue
  y su link se comparte, pero la tarjeta se había quedado como en 0.35.2. Ahora la rehace la misma
  herramienta que las demás, con la bajada nueva, las píldoras centradas y el reloj ⏱️ a color.

## 0.84.2 — 2026-10-02
- **Tarjetas para compartir (lo que se ve al pegar un link en WhatsApp) sin textos desalineados:**
  en las píldoras de jugadores y duración, el texto queda a la misma altura en las dos, y el reloj
  ⏱️ sale a color. Los acentos de los títulos (SALÓN, ¿EN QUÉ AÑO?, ¿DÓNDE QUEDA?, LÍNEA DE
  TIEMPO) ya no salen cortados. Las imágenes traen las bajadas cortas nuevas, y la del menú suma 🏆.

## 0.84.1 — 2026-10-02
- **Conexiones, Reinas, Zip y los demás, jugados desde la portada, ya no se presentan como de
  La Copa:** su antesala no dice "Minijuego de La Copa" ni "no cuenta para ninguna copa" (U-8).
  Son juegos de juegosdesalon.cl; La Copa los agrupa. En el laboratorio sigue el aviso de que es
  una práctica.

## 0.84.0 — 2026-10-02
- **Textos de explicación más cortos en todos los juegos** (D-177, U-8): reglas, ayudas, modos,
  antesalas de La Copa, Administrar y las frases del menú bajan un 37 %. Cada regla se dice una
  vez por pantalla, con frases completas.
- **Reglas que no coincidían con el juego, corregidas:** El Ahorcado en varios celulares es por
  turnos; en Julepe se dice por turno si vas (no "en secreto"), montar es superar la mayor del palo
  de salida y el plato solo crece con dos julepeados o más; Dudo explica cómo se pasa a ases y
  cuándo se puede calzar; Línea de Tiempo dice cómo se gana; Toque y Fama explica el empate por
  réplica; el chancho de Cuarto Rey ya no promete anotarse "en cualquier momento".
- **La Copa:** el aviso de que los días cerrados quedan en 0 sale desde el día 3 (el día 2 el
  día 1 sigue en su día de gracia), también en la invitación; con la copa llena, quien llega lee
  que está llena; "Cómo funciona" ya no le da día de gracia a la final; la sesión de prueba avisa
  que es más corta que el juego y no cuenta.
- **Una palabra por concepto** (U-5): tachar, el celular, jugador, administrador, vidas en El
  Ahorcado, sorbos y "¿Cuántas manos?" en Julepe. Las reglas de Línea de Tiempo quedan plegadas.

## 0.83.1 — 2026-10-02
- **La Copa: en Administrar, la invitación sigue mientras alguien pueda entrar** (D-176). Antes
  desaparecía apenas partía la copa, aunque la inscripción tardía siguiera abierta. Ahora está
  mientras la inscripción esté abierta y haya cupo, y ya partida dice "📅 Ya partió: va en el día
  3 de 7 y todavía puedes entrar." en vez de cuándo parte. El botón del tablero sigue solo antes
  de partir.

## 0.83.0 — 2026-10-02
- **La Copa llega al menú.** Su tarjeta ya no dice "Próximamente": se abre desde la portada y su
  botón "‹ Menú" vuelve al menú. El laboratorio (`/labs/`) sigue para probar, con la Copa de 3
  días (D-175).

## 0.82.4 — 2026-10-02
- **Arreglo: la invitación a una copa en inglés o portugués abre la copa.** El link lleva el idioma
  (`?pirata&lang=pt`, D-170) y, al sacarlo de la barra, el resto quedaba como `?pirata=`, que La Copa
  no reconocía: se abría la portada. Ahora se saca solo el `lang=`. Las copas en español no estaban
  afectadas, porque su link no lleva idioma.

## 0.82.3 — 2026-10-02
- **"‹ Laboratorio" en una sola línea** (U-12): en la práctica de un minijuego con nombre largo
  (¿Dónde queda?, Toque y Fama: Palabra), el botón de volver partía y dejaba el ‹ solo arriba.

## 0.82.2 — 2026-10-02
- **La Copa: cuando falta uno solo, el aviso va en singular** (U-6). El recordatorio dice
  "👀 Falta por jugar hoy: Pancho.", la tabla parcial "Falta que juegue: Pancho." y, al terminar
  antes, "Falta que juegue el día 7: Cata. … se queda sin los puntos". Con dos o más, igual que antes.
  En inglés la misma frase sirve para uno o varios; en portugués también va en singular.

## 0.82.1 — 2026-10-02
- **La Copa: en Administrar, sin hueco vacío sobre los botones** de "Terminar la copa antes",
  "Tabla final" y "Eliminar la copa" (U-11). El aviso de error va debajo del botón, como en
  Nombre de la copa y Jugadores, y vacío no ocupa lugar.

## 0.82.0 — 2026-10-02
- **📍 ¿Dónde queda? sale del laboratorio** (D-174): su tarjeta ya no dice "Próximamente" y se
  juega suelto desde el menú, en `/minijuegos/donde/`, como los otros minijuegos de La Copa.

## 0.81.0 — 2026-10-01
- **Lo que se comparte con imagen ya no repite la imagen en el texto** (D-171). La tabla parcial
  lleva la cabecera y quién falta, sin la tabla escrita; la tabla final, la cabecera y las medallas;
  el resultado del día, solo la cabecera; y jugar solo, la cabecera y el reto. Todo lo demás está en
  la imagen.

## 0.80.0 — 2026-10-01
- **La Copa y sus minijuegos, en inglés y portugués** (D-170). Todo se traduce: la portada, crear
  la copa, el tablero, las reglas de cada minijuego, el desglose del puntaje, Administrar y los
  reportes. El idioma se cambia con el toggle de la portada, de la invitación o del minijuego.
- **Cada copa elige el idioma de sus palabras** al crearla (parte en el de quien la crea):
  Conexiones y Toque y Fama: Palabra se juegan con las mismas palabras para todos, y la
  invitación, los recordatorios, la tabla y los resultados que se comparten van en ese idioma.
  Lo personal (la pantalla) va en el de cada uno.
- **Contenido propio por idioma**, no traducido: grillas de Conexiones en inglés y en portugués,
  palabras secretas de cinco letras en cada idioma (sin Ñ fuera del español) y los nombres de
  países y ciudades de ¿Dónde queda?.
- **Los minijuegos sueltos de la portada** (Conexiones, Palabra, ¿En qué año?, Reinas, Tango,
  Zip) ya no dicen "🇪🇸 In Spanish": se juegan en el idioma de quien juega.
- **El selector de idioma (🇨🇱 ES · 🇬🇧 EN · 🇧🇷 PT) se toca más fácil:** sus botones miden 44 px
  de alto, como todos los demás (C-8). Vale para todos los juegos.

## 0.79.0 — 2026-10-01
- **Reinas: arrastrar desde una X las borra.** Es lo contrario de arrastrar desde una casilla
  vacía: el dedo borra las X por donde pasa y deja las reinas como estaban (D-168).
- **Reinas: 🧹 Borrar todo** deja el tablero en blanco para empezar de nuevo, con un segundo toque
  para confirmar, como en Tango. El reloj sigue corriendo (D-169).

## 0.78.0 — 2026-10-01
- **Reinas: arrastrar pinta X.** Arrastrar el dedo (o el mouse) desde una casilla vacía llena de X
  las casillas vacías por donde pasa: una fila o una columna se descarta de una pasada, como en el
  Queens de LinkedIn. Las reinas y las X que ya estaban no se tocan; el toque y el toque largo
  siguen igual (D-166).
- **Reinas: tocar otra vez una reina la cambia por una X**, y un tercer toque deja la casilla
  vacía. La X ya no depende de saber que existe el toque largo, que sigue funcionando (D-167).

## 0.77.0 — 2026-10-01
- **Todo lo que se comparte sigue un mismo estándar** (D-165). Cada mensaje abre con una cabecera
  —"🏆 *La Copa: Valdenenas* · Día 3 de 7", "📊 … · Tabla de posiciones · día 3 de 7",
  "🃏 *Julepe* · Sala WFBN"—, una idea por línea, y el link solo en la última. Cuando va una
  imagen, lleva arriba la misma cabecera y abajo el mismo link.
- **La Copa: el resultado del día se comparte con imagen**, que dice de qué copa y de qué día es,
  quién jugó, el puntaje, el tiempo y la tarjeta de colores.
- **La Copa: la tabla es una sola.** Desde el gráfico, "Tabla parcial", "Resumen final", el podio o
  exportar, se manda la misma imagen con el texto completo. Terminada, dice "Tabla final".
- **Jugar solo un minijuego también se comparte**, con la misma imagen de resultado y un reto: los
  minijuegos sueltos y el modo solo de Toque y Fama y de Línea de Tiempo.
- **Las invitaciones a una sala** llevan la cabecera del juego y el link en su propia línea.
- Sin menú para compartir (computador), la imagen se descarga y el texto queda copiado.

## 0.76.0 — 2026-09-30
- **Zip se ve mejor.** Su 〰️ lleva un contorno claro donde va sobre el fondo morado: en el menú,
  en la tarjeta al compartir y en sus pantallas (D-164).
- **El laboratorio abre cada minijuego en su propia página.** Un link copiado desde ahí muestra en
  WhatsApp la tarjeta del minijuego y no la de La Copa. La sesión de prueba y la semilla siguen igual (D-164).

## 0.75.1 — 2026-09-29
- **La Copa: con un juego en el aire, la ayuda dice "Suéltalo…"** al armar la semana, en vez de
  "Toca…", que es lo que dice mientras se elige tocando (D-163).
- **La carta que se arrastra ya no se sale de la pantalla.** Con el dedo en la primera carta de la
  mano, la carta en vilo se cortaba por la izquierda; ahora sigue al dedo pero se queda a 8 px del
  borde. Vale para Línea de Tiempo, Línea Relámpago y la semana de La Copa (`arrastre.js`).

## 0.75.0 — 2026-09-29
- **La Copa: el admin elige los juegos y su orden al crearla** (D-163). Después de la duración
  aparece "¿Qué se juega cada día?" con la mano y la línea de Línea de Tiempo: un día se arrastra
  a otro lugar de la semana y un juego de los que quedan fuera, hasta el día que reemplaza (o
  tocando: el juego y después dónde va). Parte con una propuesta al azar, sin dos días seguidos
  de la misma habilidad, y 🎲 propone otra. Entran también Zip, Tango y ¿Dónde queda?: la copa de
  7 días lleva seis de nueve. La final no cambia y va siempre al último.
- **La Copa: la invitación muestra los juegos de la copa**, no los del calendario de siempre.

## 0.74.0 — 2026-09-29
- **Cada minijuego tiene su propia tarjeta al compartirlo.** Un link a Reinas, Conexiones, Zip o
  cualquier minijuego pegado en WhatsApp muestra ese minijuego, con su nombre, de qué se trata y su
  imagen, y no la tarjeta de La Copa o del menú. Viven en `/minijuegos/reinas/` y así; los links de
  antes siguen funcionando (D-162).

## 0.73.0 — 2026-09-29
- **La Copa: el admin puede terminar la copa antes.** En Administrar, "Terminar la copa antes"
  la cierra en ese momento (por ejemplo, si el último no va a jugar la final): nadie más juega, la
  tabla queda como la final y aparece el podio. Antes de confirmar dice quién todavía no juega hoy.
  Los días que no alcanzaron a abrirse no se juegan ni suman (D-161).
- **La Copa: la tabla final se exporta.** Terminada la copa, Administrar ofrece compartir la imagen
  de la tabla con las posiciones día a día y descargar una planilla CSV para Excel o Google Sheets.
- **Reglas de Firebase:** `torneos/<código>/fin` (solo el admin, una vez) y, desde ahí, nadie empieza,
  juega, usa el comodín, se inscribe ni renombra la copa. Publicar con `node tools/reglas.mjs publicar`.

## 0.72.1 — 2026-09-29
- **La Copa: la práctica del laboratorio ya no dice "Práctica en el laboratorio"** sobre el nombre
  del minijuego.

## 0.72.0 — 2026-09-29
- **¿Dónde queda?: el globo se ve nítido al acercarse.** Acercado, se bajan solo los pedazos de la
  imagen satelital que se ven, con más de 5 veces la resolución de antes (D-160).

## 0.71.0 — 2026-09-29
- **¿Dónde queda?: el globo es una imagen satelital.** La Tierra vista desde el satélite (Blue
  Marble de la NASA): los desiertos, las selvas, las montañas y el hielo se ven como son. También
  en la portada. El zoom llega hasta 16 veces (D-159).

## 0.70.4 — 2026-09-29
- **¿Dónde queda?: el globo va sin fronteras.** La tierra es un solo verde; hay que saber dónde
  queda cada país (D-158).
- **¿Dónde queda?: la portada gira con perspectiva.** El aro de la ciudad se achata hacia el borde
  del globo y el alfiler se achica y se desvanece al irse por detrás, en vez de verse plano.

## 0.70.3 — 2026-09-29
- **¿En qué año?: "Ganaste 1 punto." en singular** cuando un hito da un solo punto (U-6).

## 0.70.2 — 2026-09-29
- **¿Dónde queda?: la primera ciudad avisa que el globo se gira.** "↔ Arrastra para girar" arriba
  del globo, hasta el primer arrastre (#88).
- **¿Dónde queda?: el doble toque solo acerca.** Ya no pone ni mueve el alfiler; un toque solo
  lo pone, un instante después.

## 0.70.1 — 2026-09-28
- **¿Dónde queda?: vuelven las islas que faltaban en el globo.** Nueva Zelanda, Japón, Cuba,
  Jamaica, Filipinas, Java, Madagascar, Rapa Nui y otras 280 islas habían quedado como un punto:
  al simplificar el mapa, una isla dibujada en un solo trazo cerrado se borraba entera. Una prueba
  nueva revisa que cada una de las 529 ciudades caiga sobre tierra dibujada.

## 0.70.0 — 2026-09-28
- **¿Dónde queda?: 223 ciudades más, de segunda línea.** Porto Alegre, Salta, Copiapó, Castro,
  Bilbao, Chengdú, Luxor, Queenstown… Las medianas y las difíciles ya no son casi siempre
  capitales: ahora hay que ubicar ciudades que uno sabe más o menos dónde quedan (D-157).

## 0.69.0 — 2026-09-28
- **¿Dónde queda?: un globo en vez del mapa plano.** Se gira arrastrando, sin fin, y se acerca
  pellizcando o con doble toque. La respuesta une el alfiler y la ciudad con el arco más corto
  sobre el globo. La portada del minijuego es el globo girando solo, como el afiche (D-156).

## 0.68.0 — 2026-09-28
- **La Copa: 📍 ¿Dónde queda?, un minijuego nuevo en el laboratorio.** Cinco ciudades con su país
  y un mapa del mundo sin nombres: se pone un alfiler donde se cree que queda cada una. Cada ciudad
  vale hasta 100 puntos y se pierden 4 por cada 100 km. Salen de las capitales de los 195 países
  (la ONU y sus dos observadores) y de ciudades famosas. El mapa se arrastra y se acerca con dos
  dedos o con doble toque, y en el celular parte acercado para llenar la caja (D-155, #85).

## 0.67.1 — 2026-09-28
- **La Copa: la imagen de la tabla ya no queda con aire de sobra.** La leyenda va justo bajo los
  días, las filas y la letra crecen para llenar la imagen, y con pocos jugadores la imagen se
  acorta, sin bajar de cuadrada (D-154).

## 0.67.0 — 2026-09-28
- **La Copa: la imagen de la tabla cuenta cada día.** Cada punto del gráfico lleva los puntos que
  sacó ese jugador ese día; dorado si usó el comodín, "–" si no jugó y "?" si todavía puede
  jugarlo. La final dice "Final ×2", y una leyenda explica solo lo que aparece. "(-1J)" pasa a ser
  una pill. Con la copa terminada, el campeón lleva 🏆 y el podio va en galvanos de oro, plata y
  bronce. La imagen ahora es 4:5 (1080 × 1350) (D-153).

## 0.66.8 — 2026-09-28
- **Reinas: las zonas ya no se confunden entre sí.** Naranja y durazno, celeste y turquesa, y los
  dos verdes casi no se distinguían; la paleta nueva los separa bien, sin rojos que se confundan
  con las reinas que chocan (D-134).

## 0.66.7 — 2026-09-28
- **La Copa: en el calendario, el nombre largo del minijuego parte línea** en vez de cortarse con
  "…" (U-12). A 390 px se leía "Toque y Fama: adivina el nú…", y a 320 px también se cortaban
  "Toque y Fama: Palabra" y el ×2 de La Gran Final.

## 0.66.6 — 2026-09-27
- **La Copa:** la medalla del último ya no es "🏮 Farolito rojo" sino "📉 Al descenso", en la
  pantalla final y en el resumen que se comparte.

## 0.66.5 — 2026-09-26
- **La Copa: la leyenda de la tabla explica los colores.** "puntos" ahora tiene bloque gris,
  "ganó el día" el dorado, y "vale doble" el borde naranjo (comodín, o la final para todos).
  Los dos nuevos aparecen cuando hay alguno en la tabla (D-152).

## 0.66.4 — 2026-09-26
- **La Copa: el ×2 de la final vuelve a los resultados, en cian** (D-151). El dorado queda para
  el comodín, así el doble de la final (para todos) no se confunde con el de un comodín. Lo
  mismo en la tarjeta del día y en el calendario.

## 0.66.3 — 2026-09-26
- **La Copa: en los resultados de la final nadie lleva "×2".** La final vale doble para todos, así
  que la píldora en cada fila no distinguía a nadie. En los otros días sigue marcando a quien usó
  el comodín.

## 0.66.2 — 2026-09-26
- **Portada: "Ver todos"** en vez de "Quitar filtros", ahora que se filtra por un solo tipo (#71).
- **Minijuegos fuera de una copa: sin frases de empate.** Suelto, en la práctica o en la sesión de
  prueba no hay con quién empatar: el puntaje ya no dice "Si empatas, gana quien tardó menos" y
  el resultado dice solo "Tu tiempo fue 0:42." (#72). Dentro de la copa todo sigue igual.

## 0.66.1 — 2026-09-26
- **La Copa: el resultado del día se envía apenas termina el tablero** (D-150), no al tocar
  "Ver resultado". Si el jugador cierra la pestaña sin tocarlo, igual cuenta, aunque el día
  cierre antes de que vuelva. El botón ahora solo muestra la pantalla de resultado.

## 0.66.0 — 2026-09-26
- **Portada: se filtra solo por tipo de juego** (D-149). Se va el filtro Todos · Solo · Con
  amigos: cada juego pregunta adentro cómo se juega. Con él se va el salto directo al modo solo
  de D-145.
- **Los minijuegos sueltos se abren en `/minijuegos/?reinas`**, y ya no en `/copa/?practica=…`:
  fuera de una copa, el link, el título de la pestaña y la ficha de arriba no dicen "copa". Los
  links viejos llevan a la dirección nueva; dentro de una copa y en el laboratorio nada cambia.

## 0.65.9 — 2026-09-26
- **La Copa: en los resultados del día, quien usó el comodín lleva "×2" junto a su nombre**
  (en la final, todos). Así se entiende por qué sus puntos no calzan con su lugar: 3º con +12.

## 0.65.8 — 2026-09-26
- **La Copa: el admin puede cambiar el nombre de la copa** mientras no termine. En Administrar,
  el panel "Nombre de la copa" dice cómo se llama y tiene "✏️ Cambiar nombre", con el mismo
  campo y contador de cuando se crea. El link no cambia, y todos ven el nombre nuevo al momento.
  Necesita publicar las reglas de Firebase.

## 0.65.7 — 2026-09-26
- **La Copa: la tabla dice "(provisoria)" mientras puede cambiar.** Si el último día que muestra
  sigue abierto y alguien todavía no lo juega, el título es "Tabla de posiciones (provisoria) ·
  día 3 de 7" en la imagen que se comparte, "Tabla (provisoria)" en el tablero, y también en el
  mensaje de WhatsApp. Cuando juegan todos o el día cierra, vuelve a decir solo "Tabla de
  posiciones". El mensaje sin marca pasa de "Tabla de posiciones (día 3)" a "Tabla de
  posiciones · día 3", la misma forma que la imagen y que el mensaje provisorio (U-5).
- **El número de día del título es el último día que muestra la tabla**, no el de hoy: quien
  todavía no juega hoy ve y comparte la tabla hasta ayer, y el título lo dice (dilema #67).

## 0.65.6 — 2026-09-26
- **La Copa: el día de gracia se lee entero.** En el calendario, la fila del día de ayer que
  todavía se puede jugar ponía el botón al lado del nombre: el nombre se cortaba ("Línea Rel…")
  y el aviso quedaba en una columna angosta. Ahora el botón va en su propia línea, abajo (U-11, U-12).
- **La Copa: el recordatorio dice "La Copa: {nombre}" en el título**, como el resto de los
  mensajes para compartir (U-30).

## 0.65.5 — 2026-09-25
- **Tango: el choque espera medio segundo**, y no 0,7 segundos. Alcanza para tocar dos veces y
  poner una luna, y cuando el sol queda mal puesto se nota antes.

## 0.65.4 — 2026-09-25
- **Tango: el sol de paso a la luna ya no marca error.** Para poner una luna hay que pasar por
  el sol, y si ese sol rompía una regla la pantalla se ponía en rojo por un instante. Ahora el
  choque espera 0,7 segundos: si en ese lapso vuelves a tocar la casilla, no aparece nada. Si
  dejas el sol, aparecen juntos el rojo, el aviso, el contador y el sonido.

## 0.65.3 — 2026-09-25
- **Botones más cortos y centrados** (U-17). Al terminar un minijuego suelto, "Jugar otra vez
  con otro contenido" pasa a "Jugar de nuevo", y "Repetir exactamente esta partida" a "Repetir
  esta partida". Si el texto de un botón parte línea, las dos líneas van centradas en toda la
  app, y ya no a la izquierda.

## 0.65.2 — 2026-09-25
- **Portada: los filtros en dos filas y una línea antes de los juegos** (D-144). A 320 px los
  filtros ya no se salen de la columna.
- **Con el filtro «Solo», el juego abre directo en su modo solo** (D-145).

## 0.65.1 — 2026-09-25
- **Tango: el sol y la luna ya no se confunden** (D-146). La casilla con sol es ámbar, la casilla
  con luna es azul noche y la luna se ve plateada, en el tablero y en el dibujo de las reglas.
  Las casillas dadas ya no se ven apagadas, y la que revela una pista lleva un borde cian.

## 0.65.0 — 2026-09-25
- **Los minijuegos de La Copa se juegan sueltos desde la portada** (D-142): Conexiones, Toque y
  Fama: Palabra, ¿En qué año?, Reinas, Tango y Zip, de un jugador y sin copa. Por ahora en
  español; en inglés y portugués la tarjeta lo avisa.
- **Jugar solo en Toque y Fama y en Línea de Tiempo es su minijuego de La Copa**: adivinar un
  número de 4 cifras en 10 intentos, y Línea Relámpago (10 hitos, el primero ya puesto). Puntaje
  de 0 a 100, reloj y récord por mejor puntaje, en los tres idiomas y con partida que se retoma.
- **La portada se filtra** por cuántos juegan (todos, solo, con amigos) y por tipo (palabras,
  lógica, cultura general, cartas y dados). El filtro queda en el link.
- **"Próximamente" va al lado del nombre** del juego, y no apagado abajo a la derecha.

## 0.64.10 — 2026-09-25
- **La Copa: Zip tiene Borrar todo**, el mismo botón de Tango. Va debajo de la grilla y deja
  solo el 1 pintado para empezar el trazo de nuevo, sin tocar el nivel ni el reloj. El primer
  toque pide confirmación y el segundo borra, para no perder un tablero grande sin querer. Las
  reglas lo cuentan.

## 0.64.9 — 2026-09-25
- **La Copa: la imagen de la tabla es más compacta** (D-141). El gráfico de posiciones y la tabla
  van lado a lado y la línea de cada jugador termina en su fila: cada nombre aparece una vez, con
  todos los días jugados y cada cambio de lugar. Los empatados van lado a lado en vez de taparse.
  La leyenda dice "(-1J), (-2J)… = uno, dos o más juegos por jugar". El laboratorio suma una
  demo con 10 jugadores y 7 días.

## 0.64.8 — 2026-09-25
- **Portada: jugadores y duración en una sola línea** en celulares angostos. En una tarjeta de
  380 px o menos (un celular de 360 px, o uno más ancho con la letra agrandada) las píldoras
  bajan a su propia fila, de borde a borde, en vez de partirse al lado del emoji.

## 0.64.7 — 2026-09-25
- **Panel del dueño: las partidas sin red se ven en vivo** (D-140). En "Ahora" hay una lista
  nueva, *Partidas sin red*, con las partidas contra el celular, en un celular o solitarias que
  se están jugando: juego, modo, cuántos juegan, país y última señal. Cada celular manda una
  señal por minuto mientras alguien toca la pantalla. Antes solo se veían las salas de dos
  celulares.

## 0.64.6 — 2026-09-25
- **La Copa: Tango y Zip se explican con un dibujo** antes de las reglas, como Reinas (D-139).
  Tango muestra un tablero resuelto con sus marcas = y ≠ y, al lado, tres soles seguidos que no
  valen. Zip muestra un trazo que cubre toda la grilla y otro que llega al último número dejando
  casillas sin pintar.

## 0.64.5 — 2026-09-25
- **Textos de espera sin «……»**: "Esperando al rival", "Esperando a {name} para la revancha" y
  los demás ya no terminan en "…"; los puntos los pone solo la animación, que antes se sumaba
  encima (Ahorcado, Batalla Naval, Dudo, Julepe, Línea de Tiempo y Toque y Fama).

## 0.64.4 — 2026-09-25
- **Batalla Naval: las dos fichas de abajo quedan centradas** al colocar la flota, en vez de
  pegadas a la izquierda con un hueco a la derecha (U-11).

## 0.64.3 — 2026-09-25
- **Batalla Naval: los cinco barcos se ven sin desplazar** al colocar la flota. Las fichas van en
  tres columnas (dibujo arriba, nombre abajo) y la instrucción pasa de cuatro líneas a tres. En un
  celular con la barra del navegador abajo, el quinto barco quedaba fuera de la pantalla.

## 0.64.2 — 2026-09-25
- **Batalla Naval: girar un barco casi siempre gira** (D-136). Si sobre su proa no cabe, gira
  igual y se acomoda en el lugar libre más cercano, sin irse lejos.

## 0.64.1 — 2026-09-25
- **Panel del dueño: La Copa aparte** (D-137). Tres vistas: Resumen, La Copa y Juegos. Se ve en
  todo momento qué copas están en curso, qué minijuego toca hoy en cada una, quién ya lo jugó y
  quién lo está jugando. Por minijuego: jugadas, sin terminar, puntaje promedio y tiempo típico.
  Los juegos de una partida se cuentan sin los días de La Copa. Sin cambios para los jugadores.
- **Chat de sala en Batalla Naval** (C-15, D-138): en la sala, esperando la flota del rival, en la
  batalla y en el resultado. Mientras uno coloca su propia flota se guarda.
- **Panel:** las salas vivas separan jugadas de mensajes de chat; "176 msjs" en una Batalla Naval
  eran disparos y sus respuestas automáticas, no conversación (D-138). Las salas sin rival ya no
  cuentan como partidas, los rótulos dicen qué se cuenta (partidas empezadas, entradas de un
  celular, día UTC) y la red de la casa y Tailscale cuentan como pruebas.

## 0.64.0 — 2026-09-25
- **Reglas plegadas en cada minijuego** (D-133): "📖 Reglas de …" debajo del tablero, cerrado por
  defecto, con las mismas palabras de los botones de cada pantalla.
- Las copas de `?prueba` (de mentira, en el navegador) ya no suman en las estadísticas del panel.
- **Reinas:** un dibujo explica las reglas antes del texto, y el tablero ya no tiene bordes
  gruesos entre zonas (D-134).
- Textos que ahora calzan con su pantalla: "apretada", ≠ en Tango, "tocar OK", Consejos y Pista.

## 0.63.1 — 2026-09-25
- **Herramientas:** agente de usabilidad con ronda diaria, guía `docs/USABILIDAD.md` y
  `node tools/dilemas.mjs` para manejar sus preguntas como issues de GitHub (D-132). Sin cambios
  para los jugadores.

## 0.63.0 — 2026-09-25
- **La tabla muestra los 7 días de cada jugador** (D-131): puntos, jugado, por jugar, no jugó y
  todavía no abre, con colores y una leyenda.

## 0.62.0 — 2026-09-25
- **El tiempo se corta al terminar el tablero** (D-130), en todos los minijuegos: lo que se tarda
  en tocar "Ver resultado" ya no cuenta para el desempate.
- Una copa con link propio muestra `?pirata` en la barra de direcciones aunque se haya entrado
  por su código.

## 0.61.0 — 2026-09-25
- **Conexiones por significado** (D-128): fuera los grupos de juegos de palabras ("___ roja",
  "esconden un animal"…); los grupos son lo que las cosas son (combustibles, metales, muebles…).
  Las copas que ya estaban jugando Conexiones terminan su día con la grilla de antes.
- **Toque y Fama: jugar solo** (D-129): el modo contra el celular pasa a ser "🧍 Jugar solo": el
  celular elige un número y tú lo adivinas en la menor cantidad de intentos, con récord.
- En el tablero de Toque y Fama de La Copa y en el de jugar solo, las pistas van completas: "2 famas", "1 toque".
- La pista del teclado dice "número secreto" en vez de "número del rival", que en La Copa no existe.

## 0.60.0 — 2026-09-25
- **Invitación promocional** (D-127): "¡Estás invitado!", el reto, cuándo parte, cuánto toma y quiénes
  ya se inscribieron. Los minijuegos no se nombran: son sorpresa.

## 0.59.3 — 2026-09-24
- **Posiciones día a día** también marca "(-1J)" a quien lleva menos juegos, con su leyenda (D-126).
- En el gráfico, los nombres de dos empatados en el mismo lugar ya no se enciman.

## 0.59.2 — 2026-09-24
- El botón del gráfico dice simplemente "📤 Compartir".

## 0.59.1 — 2026-09-24
- "Compartir como imagen" queda centrado y separado de la nota del gráfico.

## 0.59.0 — 2026-09-24
- **Compartir la tabla como imagen** (D-126): bajo el gráfico, una imagen con el gráfico de
  colores, la tabla y el link, lista para WhatsApp.
- **"(-1J)"** junto al nombre de quien lleva menos juegos, en la imagen y en el mensaje de la tabla.

## 0.58.0 — 2026-09-24
- **El gráfico de posiciones muestra a todos** (D-125): cada jugador con su color y su nombre al
  final de la línea; tocar un nombre destaca su línea.

## 0.57.3 — 2026-09-24
- **Tu resultado para compartir** dice la copa, el día, el nombre del juego y quién lo jugó (D-124).

## 0.57.2 — 2026-09-24
- **Mensajes para compartir** (D-124): la tabla se titula "📊 La Copa: … · Tabla de posiciones
  (día N)" y cierra con "⏳ ¡Día N en curso! Falta que jueguen: …"; el link va en su propia línea.
- **Con mala conexión**, tocar Empezar o enviar el resultado otra vez ya no se traba si la primera
  vez sí había llegado (D-123). El aviso de conexión dice que lo hecho no se pierde.

## 0.57.1 — 2026-09-24
- **Herramienta:** `node tools/reglas.mjs publicar` publica las reglas de Firebase sin pasar por la
  consola, con una llave de cuenta de servicio guardada fuera del repo (D-122).

## 0.57.0 — 2026-09-24
- **Link propio para la copa** (D-121): al crearla, `juegosdesalon.cl/copa/?pirata` en vez de un
  código. Se ve en vivo si está libre; queda tomado hasta 7 días después de terminar la copa.
- Los links ya no llevan `&labs`.
- **Paso manual:** volver a publicar `firebase/database.rules.json`.

## 0.56.0 — 2026-09-24
- **Calendario más claro** (D-120): el tablero y la tarjeta de hoy dicen la fecha, y el día de
  ayer que sigue abierto dice que es su **día de gracia** y hasta cuándo.
- **Invitación:** "7 días · Parte el viernes 25 de septiembre · 3 jugadores inscritos".
- **Inscribirse con un nombre y PIN que ya existen cuenta como entrar.**

## 0.55.0 — 2026-09-24
- **El nombre de la copa llega a 40 caracteres** (se recortaba a 20) y el campo muestra cuántos
  van; los nombres de jugador también tienen contador (D-119).
- **Paso manual:** volver a publicar `firebase/database.rules.json`.

## 0.54.0 — 2026-09-24
- **La Copa se juega entre 2 y 10** (D-118). Con el admin solo no se puede jugar ni pasar de día:
  la app pide que se inscriba al menos un competidor más.

## 0.53.1 — 2026-09-24
- **Laboratorio:** al final se ve la versión activa.

## 0.53.0 — 2026-09-24
- **Eliminar la copa** (D-117): al final de Administrar, en rojo, con dos confirmaciones (la
  segunda, escribir el nombre de la copa). El admin ve que se eliminó y los demás, que ya no existe.
- **Paso manual:** volver a publicar `firebase/database.rules.json`.

## 0.52.0 — 2026-09-24
- **Cada cosa en su momento** (D-116): la invitación solo antes de partir y con la inscripción
  abierta; la tabla parcial solo mientras se juega; sin "Sacar" con la copa terminada; el
  recordatorio no invita a inscribirse si está cerrada; el link de una copa terminada dice que
  terminó.

## 0.51.0 — 2026-09-24
- **Inicio de la copa:** hoy, mañana u **otra fecha** con un calendario (hasta 30 días), al crearla
  y en Administrar (D-115).
- **Copas de prueba del laboratorio:** el admin puede **pasar al día siguiente** (con
  confirmación) para probar sin esperar; en el último día, terminar la copa.
- El aviso flotante ("Listo: …") queda centrado; la animación lo corría a la derecha.
- **Paso manual:** volver a publicar `firebase/database.rules.json`.

## 0.50.0 — 2026-09-24
- **Resultado:** la tarjeta para compartir va justo bajo el puntaje, sin repetir el tiempo si ya
  lo trae (D-114). Primer arreglo que sale de un reporte 🐞.
- **Conexiones:** en *Piezas de ajedrez*, TORRE en vez de DAMA.

## 0.49.0 — 2026-09-23
- **Zip:** cuando se acaba el tiempo, el reloj de arriba se detiene en el tiempo final (seguía
  contando segundos) y la cuenta regresiva desaparece. Queda a la vista cuántos niveles resolviste.
- **Tango:** los signos = y ≠ son más grandes y tienen colores distintos (celeste y rosado) (D-112).
- **Fuera la barra "Modo de prueba"** de todas las pantallas, y el paso "Simular una copa" del
  laboratorio: las demos cubren lo mismo (D-112).
- **Todos los minijuegos puntúan de 0 a 100** (D-113), para que se lean parejos.
- **Las copas nuevas van en hora del Pacífico** (Los Ángeles), y Administrar dice la zona.
- "Invitar al grupo" solo antes de que parta la copa; "Tus días" pasa a **Calendario**.

## 0.48.0 — 2026-09-23
- **El admin de una copa nueva** (D-110): al crearla abre Administrar con una guía para invitar y
  esperar a los competidores. Se puede **cerrar y reabrir la inscripción** y **mover el inicio a
  hoy o a mañana** mientras nadie haya jugado. "Mensajes para los competidores" y Renombrar al lado
  del nombre.
- **Demos en el laboratorio**: ocho vistas de la copa ya en marcha, de jugador y de admin.
- **Reinas**: se puede rendir (dos toques; muestra la solución y vale 0).
- **La Gran Final**: sin cuenta regresiva, y "Siguiente ronda" debajo del tablero en todas las rondas.
- **Conexiones**: los grupos resueltos con los colores y el vidrio de la app.
- **Sin la temática de Brasil** en la copa (D-111).
- **Paso manual:** volver a publicar `firebase/database.rules.json` (inscripción cerrada y mover el inicio).

## 0.47.0 — 2026-09-23
- **🔤 Toque y Fama: Palabra** (antes "con letras", D-108): cada letra que encuentras en su lugar
  suma 10 puntos, una sola vez por lugar; sacar la palabra suma 50 más, menos 5 por cada intento
  después del primero. Quien se acercó gana más que quien no. La pantalla muestra lo que llevas.
- **El laboratorio juega como la copa** (D-109): la práctica ofrece la sesión de prueba antes de
  Empezar, igual que un día.
- **Zip:** si se acaba el tiempo con un nivel a medias, muestra cómo se resolvía.
- **Conexiones:** los grupos ya resueltos no parpadean al tocar palabras.
- **Reportes:** si no se pueden enviar, quedan guardados en el dispositivo y se reenvían solos.

## 0.46.0 — 2026-09-23
- **La cuenta regresiva ahora es de 3 a 1** (D-105).
- **Reinas puntúa el tiempo, no los errores** (D-107): hasta 30 segundos vale 100 y baja parejo
  hasta 10 a los 5 minutos. Una reina que choca se ve en rojo y se corrige sin costo. En la final,
  la ronda de Reinas vale 100 al resolverla.
- **Zip:** la cabeza del trazo tapaba el número de su casilla (parecía que faltaba uno); ahora es
  un anillo amarillo alrededor del número. El aviso de casillas faltantes va bajo la grilla, en un
  espacio reservado: arriba la movía al aparecer y el trazo saltaba bajo el dedo.

## 0.45.0 — 2026-09-23
- **Cuenta regresiva** (D-105): al tocar Empezar, una cuenta de 5 a 1 y "¡A jugar!". El tablero y
  el reloj aparecen recién ahí.
- **Cómo se calculó tu puntaje** (D-106): al terminar cada juego, la cuenta línea por línea, el
  desempate y, en la copa, cuántos puntos da el lugar del día.
- **Sesión de prueba en cada juego** (D-103): antes de Empezar un día aparece **🧪 Probar primero
  (no cuenta)**. Es la misma mecánica con otro contenido y no se guarda ni suma.
- **Zip por niveles contra el reloj**: tres minutos para resolver la mayor cantidad de tableros,
  de 4 × 4 a 7 × 7. Si el trazo llega al último número sin pasar por todas las casillas, ahora
  avisa cuántas faltan (antes no pasaba nada y parecía que el juego no terminaba).
- **Reinas**: un toque pone o saca la reina; el toque largo marca la X para descartar.
- **Tango**: la marca de distintas es ≠; se puede **borrar todo** y pedir una **pista** (cuesta 15
  puntos), los dos con un segundo toque para confirmar, y hay **consejos** para cuando te atascas.
- **Los reportes 🐞 ya no piden nada** (D-104): se mandan sin cuenta, el nombre queda guardado
  en el dispositivo y se leen con
  `node tools/reportes.mjs`. **Paso manual:** volver a publicar `firebase/database.rules.json`
  (<https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules>).

## 0.44.0 — 2026-09-23
- **La Copa reusa la UX de los juegos que ya existen** (D-102), a pedido del dueño después de
  probarla en el laboratorio:
  - **⏳ Línea Relámpago** se juega como el modo solo de Línea de Tiempo: una mano de 9 cartas en
    el orden que quieras (10 hitos en total), las ranuras, **el arrastre** de la carta a la línea,
    el botón que dice qué coloca y el veredicto que explica dónde iba.
  - **🔢 Toque y Fama: adivina el número** (antes "El Número del Día") usa el teclado, las
    **notas** (toque largo para tachar una cifra) y el tablero de Toque y Fama. ¿En qué año? usa el
    mismo teclado.
- **Nuevos minijuegos:** **👑 Reinas** (el Queens de LinkedIn) reemplaza a Batalla Naval:
  Solitario el día 4, y **🔤 Toque y Fama con letras** (una palabra de 5 letras con famas, toques y
  cada letra pintada, como Wordle) reemplaza a ¿Dudo o le creo? el día 5. **〰️ Zip** y **☀️ Tango**
  quedan en el laboratorio para probarlos. Los tres juegos de lógica tienen solución única.
- **Conexiones, más difícil:** 12 grillas nuevas de temas generales, con distractores y juegos de
  palabras (esconden un animal, empiezan con una nota musical, tienen ojos pero no ven).
- **Compartido:** el teclado de Toque y Fama pasó a `assets/js/teclado.js`, y los estilos de la
  línea y del teclado a `assets/css/linea.css` y `assets/css/teclado.css`. Línea de Tiempo y Toque
  y Fama se ven y funcionan igual que antes.

## 0.43.0 — 2026-09-23
- **La Copa pasa al laboratorio** (D-101). En el menú su tarjeta sigue a la vista, apagada y con
  "Próximamente". Se prueba en **`/labs/`**, una página fuera del menú con tres pasos: cada
  minijuego por separado, una copa entera simulada en un computador y una copa de verdad con
  amigos cercanos, donde también se ofrece la **Copa de 3 días**.
- **Práctica de cada minijuego** (`/copa/?practica=<id>`): contenido al azar, sin copa y sin que
  cuente. Al final dice la semilla de la partida; con ella se repite la misma para reportar un error.
- **🐞 Reportar un problema o dejar un comentario**, en la práctica, el tablero y el resultado del
  día. Manda el texto y el contexto (copa, día, pantalla, juego, semilla, versión y navegador) a
  `feedback/`, que solo lee el dueño.
- En el menú, cualquier juego que no está disponible dice "Próximamente" y ya no se puede abrir,
  ni con el teclado (C-5).
- **Paso manual:** volver a publicar `firebase/database.rules.json` por el nodo nuevo `feedback`
  (<https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules>).

## 0.42.0 — 2026-09-23
- **Llega La Copa** 🏆 (D-94): un torneo entre amigos que dura una semana. Una persona la crea y
  comparte el link; cada uno entra con su nombre y un PIN de 4 números, desde el celular o el
  computador. Cada día se abre un minijuego distinto, el mismo para todos, que se juega una sola
  vez y reparte puntos por posición. Tiene comodín ×2, una Gran Final que vale doble, tabla con
  flechas, un gráfico de la posición día a día, podio y medallas.
- **Siete minijuegos**, cinco sobre motores y mazos que ya existían: ⏳ Línea Relámpago, 🔢 El
  Número del Día, 🔗 Conexiones (12 grillas chilenas escritas a mano), ⚓ Batalla Naval: Solitario
  (el Bimaru, con solución única), 🎲 ¿Dudo o le creo? (puntúa la calidad de la decisión, D-97),
  📅 ¿En qué año? y 🏁 La Gran Final.
- **El admin avisa al grupo** con mensajes armados (D-99): invitación, recordatorio del día, tabla
  parcial y resumen final. Cada jugador comparte su tarjeta, que nunca revela la respuesta.
- **Solo en español por ahora** (D-98). La Copa de 3 días existe solo para probar, con `?tres`
  en la URL (D-100). `?prueba` juega una copa entera sin Firebase y con el reloj adelantable.
- **Pasos manuales para que funcione en juegosdesalon.cl**: publicar las reglas nuevas de
  `firebase/database.rules.json`
  (<https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules>)
  y habilitar el acceso anónimo en Authentication → Sign-in method → Anonymous (D-96). Mientras
  falten, crear una copa falla con un mensaje que lo dice.

## 0.41.0 — 2026-09-20
- **Los barcos se hunden, ya no se apagan** (D-93). Hundir uno pasa de un cambio de clase a durar
  1,4 s: fogonazo en la casilla que disparaste, el fuego corriendo por el casco 90 ms por casilla
  hacia los dos lados, el casco entero yéndose bajo el agua cuando la cascada termina, y cuatro
  burbujas subiendo a los ~630 ms. Pasa en los dos tableros: en el del rival cuando hundes tú, en
  el propio cuando te hunden.
- **El motivo no es adornar.** Hundir es el único momento en que el tablero del rival dibuja el
  casco: las casillas ya se conocían —para hundir hay que haberlas tocado todas—, pero el barco
  no, y recién ahí aparece el portaaviones con su pista o el submarino con el periscopio (D-91).
  Antes eso ocurría en un repintado y el barco que acababas de matar nunca se veía como barco.
- **La espuma va donde van las burbujas del sonido.** `SFX.sink()` ya duraba casi un segundo
  mientras la imagen tardaba cero: ahora las dos cuentan lo mismo al mismo tiempo.
- **El tiro que gana la partida por fin se ve.** La pantalla de resultado espera a que el barco
  termine de hundirse. En un celular no espera: ahí manda la pantalla de pase (C-9).

## 0.40.0 — 2026-09-20
- **En Batalla Naval se ve de quién es el turno sin leer nada** (D-92). Los jugadores decían no
  entenderlo, y con razón: la única diferencia entre las dos pantallas era una frase blanca del
  mismo tamaño arriba —"¡Te toca! Dispara a Javi" contra "Cata está apuntando…"—, y todo lo demás,
  tablero incluido, se veía igual. Ahora hay cuatro señales:
  - **La barra de estado cambia de color y de forma**: rellena en lima con 🎯 cuando te toca,
    apagada en gris con ⏳ cuando no. El titular se acorta ("¡Te toca!" / "Turno de Cata") y la
    instrucción baja a la bajada ("Dispara a la flota de Javi" / "Te está apuntando…").
  - **El tablero del rival se apaga cuando no puedes disparar** y late con un halo cian cuando sí.
    Apagado no es tapado: los impactos se siguen leyendo, que para eso se mira mientras se espera.
  - **Tocarlo fuera de turno responde**: el tablero se sacude, suena el error y la bajada explica
    qué pasó ("Espera tu turno: ahora dispara Cata"). Antes no pasaba absolutamente nada.
  - **Cuando llega tu turno, el celular avisa**: campanita nueva (`SFX.turn`) y vibración. En sala,
    además, el título de la pestaña pasa a "🎯 ¡Te toca!" mientras la app está de fondo. El aviso
    espera 650 ms si acaba de sonar el disparo del rival: dos sonidos encima se escuchan mal.
- **Arreglo: en sala con otra persona, la bajada decía "El celular disparó a I7"** aunque el rival
  fuera humano y el titular dijera su nombre. Esa línea ya no repite el disparo —lo canta el aviso
  grande de abajo— y con eso se cae el error.
- `tools/e2e/mirar.mjs` aprende Batalla Naval: `intro`, `colocacion`, `juego` (mi turno) y `espera`
  (el turno del rival), sin jugar una partida entera.

## 0.39.1 — 2026-09-20
- **Arreglo: la grilla chica de "Mi flota" se veía rectangular** aunque sus casillas fueran
  cuadradas. El número de la fila era más alto que la casilla y era él el que mandaba el alto de
  la fila: quedaba aire entre filas y ninguno entre columnas. Las etiquetas pasan a tener
  `line-height: 1` y el alto vuelve a decidirlo la casilla.
- **Un disparo al agua ya no tapa el agua**: la casilla conserva el mismo patrón de mar con un halo
  oscuro por dentro —el hoyo que deja la bomba— y el punto encima. Tocado y hundido también dejan
  ver el mar alrededor, con un resplandor naranja o rojo en vez de un cuadrado de color.
- **El barco hundido se le muestra al rival, ardiendo.** La respuesta de un hundimiento ya traía el
  barco y sus casillas en orden, así que de ahí sale qué trozo va en cada una: el casco aparece con
  la paleta quemada (negro, óxido y brasas) y el 🔥 encima. Antes el rival solo veía cinco cuadrados
  rojos y nunca sabía qué le había hundido.
- De paso: el 💥 y el 🔥 se dibujan por encima del barco. El dibujo va posicionado y les estaba
  pasando por arriba.

## 0.39.0 — 2026-09-20
- **La flota de Batalla Naval, en pixel art** (D-91). Los barcos dejan de ser bloques grises
  idénticos: cada casilla pinta un trozo de 16×16 píxeles visto desde arriba, y los trozos calzan
  entre sí para armar el barco. Todos **empiezan y terminan en punta**, y cada clase tiene lo suyo:
  el portaaviones lleva pista con marcas, un caza y la isla con radar; el acorazado, torretas con
  los cañones de boca amarilla, puente y chimenea; el crucero, helipuerto y tubos; el destructor,
  chimenea y radar; el submarino es un casco cilíndrico y delgado con el periscopio asomado. Girar
  un barco es el mismo dibujo rotado 90°.
- **El mar dejó de ser un color plano**: una sola baldosa de rayas horizontales, repetida en todas
  las casillas como en un tileset. Va de fondo, no de contenido: cien casillas con su propio SVG
  serían miles de nodos para pintar agua quieta.
- El barco elegido es **el mismo trazado con otra paleta** (las tres decenas de píxeles no se
  dibujan dos veces: los colores son variables CSS). Tocado y hundido siguen encima, y el barco se
  apaga debajo en vez de taparse: se ve el trozo ardiendo.
- Las fichas de la lista muestran el barco en chico, no tres cuadraditos.
- El dibujo lo **genera** `python3 tools/flota.py` y queda en `batalla-naval/flota.js`: 17 trozos de
  256 píxeles escritos a mano salen cada uno con distinta luz; con funciones (casco, torreta,
  puente, remaches) todos tienen la misma mano. Lo que se edite a mano en el módulo se pierde en la
  próxima pasada, y el archivo lo dice en la primera línea.

## 0.38.4 — 2026-09-20
- **Tocar en cualquier parte fuera de la grilla deselecciona el barco.** Antes los botones de abajo
  (Al azar, Limpiar, Zarpar) eran una excepción y la selección quedaba puesta sin que nada la
  hubiera pedido. Siguen salvándose solo las dos cosas que trabajan con la selección: la ficha de
  un barco, que es cómo se elige, y el botón de girar, que gira al elegido.

## 0.38.3 — 2026-09-20
- **Arreglo: tocar un barco no lo seleccionaba** (ni lo pintaba de amarillo, ni le aparecía el ↻).
  Lo rompió el arrastre nuevo de 0.38.0: tomaba el puntero al apoyar el dedo, y entonces el `click`
  que el navegador fabrica después se lo lleva el elemento que capturó — el toque moría en la
  pantalla sin llegar nunca a la casilla ni a la ficha. Ahora el puntero se toma recién cuando el
  gesto pasa el umbral y ya es un arrastre, que es como lo hace el módulo compartido de Línea de
  Tiempo desde el principio.
- **Los guiones de punta a punta tocan de verdad.** `tools/e2e/cdp.mjs` gana `toque` y `arrastre`,
  que mandan el gesto por el navegador (`Input.dispatchMouseEvent`) en vez de llamar a
  `elemento.click()`, que se salta esa cocina entera y por eso el error pasó en verde. Con la
  versión rota puesta a propósito, el guion de colocación imprime `sel: null`.

## 0.38.2 — 2026-09-20
- **Mientras se arrastra un barco, el ↻ desaparece** (D-90). Girar no se puede con el barco en el
  aire, y el botón se quedaba flotando sobre la casilla de la que había salido, ofreciendo algo que
  en ese momento no existe. Vuelve apenas se suelta.

## 0.38.1 — 2026-09-20
- La bajada de la colocación de Batalla Naval cuenta el gesto nuevo: "o arrastra la ficha hasta el
  tablero" (D-90), en los tres idiomas. El resto de la frase queda igual.

## 0.38.0 — 2026-09-20
- **Arrastrar un barco es elegirlo, y las fichas también se arrastran** (D-90, Batalla Naval).
  Antes se podía tener el portaaviones en amarillo, con su ↻ encima, y arrastrar el destructor: el
  que se movía no era el que la pantalla decía que estaba elegido. Ahora, apenas el dedo pasa el
  umbral de arrastre, el barco que se arrastra pasa a ser el seleccionado — la misma regla que
  Línea de Tiempo (D-85).
- **Un barco sin colocar se puede llevar desde su ficha hasta el tablero** y soltarlo ahí, que es
  lo primero que uno intenta al ver una ficha y una grilla. Antes había que tocar la ficha y
  después la casilla; eso sigue funcionando igual.
- Los oyentes del arrastre pasan de la grilla a la pantalla: la grilla se rehace entera cada vez
  que algo se pinta, y con ella se perdía la captura del puntero a mitad del gesto. Es la misma
  lección que dejó el arrastre de Línea de Tiempo.
- Las fichas llevan `touch-action: none` (D-86): sin eso, arrastrar una hacia el tablero desplazaba
  la página en Android en vez de mover el barco.
- El guion de punta a punta de la colocación arrastra de verdad (eventos de puntero) y deja una
  captura del barco arrastrado, elegido y con su ↻.

## 0.37.0 — 2026-09-19
- **Compartir la app desde la portada.** Al lado del idioma y del sonido hay un botón 📤 que abre
  el diálogo de compartir del celular; donde no existe, copia el texto y el link y lo avisa
  cambiando el ícono por un ✅ dos segundos, que no necesita traducción ni mueve nada de lugar.
- **Se comparte la puerta del idioma en que se está mirando** (D-74): `juegosdesalon.cl`,
  `/pt/` o `/en/`. Cada puerta tiene su propia tarjeta social en ese idioma, así que el link
  llega como corresponde a quien lo recibe. El texto que lo acompaña sale de `COMMON`
  (`shareText`) y dice lo mismo que la tarjeta: juegos tradicionales para jugar con amigos desde
  el celular, gratis, sin instalar y sin cuenta.
- El botón redondo de la barra deja de ser solo el del sonido: `.icon-btn` comparte las mismas
  medidas (44 px, C-8) y `shareButton` vive en `assets/js/ui.js`, al lado de `shareLink`, listo
  para cuando lo quiera también el encabezado de cada juego.

## 0.36.0 — 2026-09-19
- **Una sala se cae a la media hora de quedar quieta** (D-89). Antes vivía seis horas pasara lo que
  pasara: la que alguien abría a las ocho y quedaba vacía seguía ocupando su código —y apareciendo
  en el panel como si ahí hubiera gente— hasta las dos de la mañana. Ahora la sala late: cada
  jugada refresca `rooms/<CÓDIGO>/lastAt` con la hora del servidor, como mucho una vez por minuto,
  y sin latido fresco las reglas no aceptan ni un jugador ni un mensaje más.
- **Las seis horas siguen, como tope duro.** No son la vida normal de una sala: son lo que le
  permite a la papelera (D-39) prometer que un balde que se puede abrir no nombra ninguna sala
  viva. Sin tope, una partida larga podría sobrevivir a su propio balde y el índice delataría un
  código en juego.
- El despliegue no tiene ventana rota: el latido se escribe aparte y con el error tragado, así que
  un cliente nuevo con las reglas viejas sigue jugando con las seis horas de siempre, y una sala
  sin `lastAt` —creada por una pestaña vieja— también. **Las reglas se publican a mano**, y hasta
  que se publiquen no cambia nada.
- El panel descarta las salas sin latido fresco con la misma cuenta que las reglas, y su tarjeta
  dice "salas vivas" en vez de "salas de las últimas 6 h", que ya no era lo mismo.
- Lo que se pierde: una partida abandonada más de media hora ya no se puede retomar. Quien vuelve
  ve "esa sala ya venció" y arma otra.

## 0.35.7 — 2026-09-19
- **Las bajadas del menú, al día.** Línea de Tiempo decía "Historia o música" cuando ya son seis
  mazos (ahora: "Seis temáticas, de la historia al fútbol") y repetía los jugadores que la pastilla
  👥 ya muestra. Batalla Naval ofrecía "un celular o contra el celular" y se dejaba afuera la sala
  de dos, que tiene desde que hay salas. Dudo era la bajada más larga del menú y en español decía
  otra cosa que en inglés y portugués: ahora las tres hablan de aguantar la cara, y en portugués
  con un giro que se usa en Brasil ("sem entregar o jogo", no "segure a cara"). En Toque y Fama se
  va la coma antes del "o", y la bajada del ahorcado en portugués vuelve al largo de las otras.
- Ninguna de estas se había roto: envejecieron solas, y ningún test las compara contra el código.

## 0.35.6 — 2026-09-19
- **En portugués, "cueca" es ropa interior.** La carta chilena del baile se jugaba en Brasil con
  esa palabra tapada y la pista "a dança do lenço": el chiste se armaba solo. La carta sigue
  siendo la misma (💃, `cl-cueca`, cueca en español y en inglés), pero en portugués la palabra
  pasa a ser *musica* y la pista a *Toca em setembro, com lenço na mão*, que deja la imagen sin
  nombrar lo que no corresponde. Va sin tilde, como el resto del mazo en portugués
  (*onibus*, *pessego*, *violao*).

## 0.35.5 — 2026-09-19
- **Arreglo: entre "crear sala" y "unirse" decía "— o —" en los tres idiomas.** El separador
  estaba escrito a mano en el JS de los seis juegos con sala, sin pasar por `LOCALES`, así que en
  portugués y en inglés asomaba una palabra en español. Ahora es una clave de `COMMON` (`or`) y
  dice *o*, *or* u *ou* según el idioma.
- **Portugués de Forca: la pantalla de configuración** (C-3). Tres calcos del español se van:
  "Deixar comprar letras" → *Permitir comprar letras*, "a letra que falta mais rara" → *a letra
  mais rara que ainda falta*, y "a palavra do seguinte" → *a palavra do próximo jogador*. El
  mazo decía qué hace sin decir con qué ("O app distribui do tema escolhido" → *sorteia uma
  palavra*), y la ✕ de cada jugador, que es lo que lee un lector de pantalla, pasa de "Tirar
  jogador" a *Remover jogador*.
- **El portugués tenía dos imperativos mezclados** y esta pantalla usaba el de *tu*, que en Brasil
  suena regional: "Confere o código" → *Confira*, "Espera um pouquinho e tenta de novo" →
  *Espere … tente*. El resto de la app ya hablaba de *você*.
- La temática de deportes decía "Quadras, medalhas e árbitros": *quadra* es cancha techada y deja
  el fútbol afuera, que es lo primero que se le ocurre a un brasileño. Ahora dice *Campos*.

## 0.35.4 — 2026-09-19
- **Portugués de Forca: la portada, releída** (C-3). "Antes que os erros acabem" sonaba a que los
  errores se terminan solos; ahora dice "antes de gastar todos os erros permitidos", que es como se
  llama el ajuste en la pantalla de configuración. En el cómo se juega, "a letra que está" quedaba
  sin complemento ("estiver na palavra"), "quando o desenho termina, você foi enforcado" mezclaba
  tiempos, y "erros de sobra" era calco del español: el resto del juego cuenta la ventaja con
  *margem* y *sobrar*. El ejemplo nombra la acción real de la cadena ("escrever uma palavra
  impossível para o próximo") y la bajada de un celular dice a quién se le pasa la vez.
- La bajada del menú en portugués repite la primera frase, así que cambió con ella.

## 0.35.3 — 2026-09-18
- **Julepe sale del menú por ahora** (D-88). Varias vueltas seguidas de reglas no terminaron de
  aclarar el juego, ni para quien las estaba escribiendo — con más pasos encadenados que cualquier
  otro juego de la app, todavía no está bien resuelto en palabras simples. Queda apagado en el menú
  y sin click, igual que Batalla Naval y Toque y Fama mientras se construían; el juego sigue entero
  en `/julepe/` y nada de lo construido se pierde.
- **Arreglo: una tarjeta apagada del menú no se veía apagada.** `.game-card` anima su entrada con
  `opacity` hasta 1 y la deja puesta (`animation ... both`), así que el `opacity: 0.55` de
  `.soon` quedaba tapado: el juego no se podía tocar, pero se veía idéntico a uno jugable. Nadie lo
  había notado porque los tres usos anteriores de `available: false` fueron juegos que todavía no
  existían, no uno que se apagó después de publicado.
- La tabla de juegos del README dice **"⏸ paused"** en vez de una versión cuando el juego no está
  disponible, para no sugerir que se puede jugar desde la portada.

## 0.35.2 — 2026-09-18
- **Arreglo: el tablero pegaba un salto al apretar una carta** y otro cada vez que cambiaba el
  destino mientras se arrastraba (D-87). Elegir reconstruía la línea entera y las filas volvían a
  reproducir su animación de entrada. Ahora elegir repinta solo las ranuras: los hitos se quedan
  donde están, que es lo que hacen de verdad.

## 0.35.1 — 2026-09-18
- **Arreglo: arrastrar una carta hacia abajo disparaba el "deslizar para actualizar" de Chrome** en
  Android y recargaba la partida (D-86). `overscroll-behavior: none` pasa a estar también en `<html>`,
  que es de donde el viewport lo toma de verdad, y `touch-action: pan-x` cubre ahora toda la tira de
  la mano y no solo las cartas: entre dos cartas hay 6 px de hueco y el dedo mide más que eso.

## 0.35.0 — 2026-09-18
- **Arrastrar la carta a la línea**, en Línea de Tiempo (LT-16, D-85). Se saca la carta de la mano
  hacia abajo y se suelta en su lugar. Mientras viaja se dibuja en grande y por sobre el dedo: en la
  mano el título queda en 11 px y en un celular angosto no se alcanza a leer justo cuando hay que
  decidir. La carta ya puesta se puede retomar y llevar a otra ranura, o soltar fuera de la línea
  para devolverla a la mano.
- **Soltar elige, no coloca.** El botón amarillo sigue siendo el único que confirma (C-8), así que
  el motor, el transporte y el reductor no cambian y quien prefiera tocar sigue tocando igual.
- **La carta se enciende al apretar**, no al soltar el dedo. Si el gesto resulta ser desliz lateral
  de la mano, que es scroll, se devuelve la selección anterior (D-38).
- Mientras se arrastra, los dos hitos entre los que caería la carta encienden su año.
- **Módulo compartido** `assets/js/arrastre.js` para los juegos que lo necesiten, con sus pruebas
  (`node assets/js/arrastre.test.mjs`) y un guion de punta a punta que ejercita el gesto de verdad
  (`tools/e2e/linea-de-tiempo-arrastre.mjs`).

## 0.34.0 — 2026-09-14
- **Séptimo juego: Julepe** 🍹 (JU-01 a JU-15). Juego de bazas de la familia del Tute, adaptado a
  tragos: dices si vas o te pasas, y si vas y no haces dos bazas de las cinco te tomas el plato
  entero. Lo que se bebió vuelve al plato, así que dos julepes seguidos lo dejan en veinte.
  En inglés se llama **Julep** y en portugués **Paga o Bolo** (D-84).
- **Los tres modos**: un celular de 2 a 6 pasándoselo, sala de varios celulares con código y QR, y
  mesa de tres contra dos rivales del aparato.
- **En la sala, el reparto viaja cerrado** (D-81): cada celular publica una llave pública al entrar
  y quien reparte le cierra la mano a cada uno. Nadie más la puede abrir, ni mirando la sala desde
  la consola. Al terminar la mano todos destapan y se verifica que nadie jugó una carta que no
  tenía: "Cartas verificadas ✅" (C-10).
- **La reserva** (D-82): a cada jugador le tocan tres cartas tapadas para el cambio, así que las
  cartas nuevas también son secretas, y el cambio viaja por puestos y no por nombre de carta.
- **Si va uno solo, el dador se queda obligado** (D-83): repartir también arriesga.
- La app apaga las cartas que no se pueden tirar y dice por qué: asistir, montar o fallar. Nadie
  descubre una regla equivocándose.
- Módulo nuevo `assets/js/sobre.js`, compartido: sobres cerrados para cualquier juego con cartas.

---

## 0.33.7 — 2026-09-14
- **Seis rangos en el panel** (D-80, RP-30): 7, 30, 60 y 90 días, **1 año** y **lo que va del año**.
  El selector manda en toda la página, incluida la bitácora de salas.
- **Se baja de la base solo lo que el rango pide**, y nunca menos de lo que ya estaba bajado: mirar
  la semana no descarga un año, y volver de un año a la semana no descarga nada. Mientras llega, el
  título dice "cargando…", porque un año a medio bajar se ve igual que un año sin partidas.
- **La barra de "cuándo se juega" cambia de grano** según el rango: por día hasta 30, por semana
  hasta 90 (con la fecha del lunes) y por mes de ahí en adelante. Un año en barras diarias son 365
  barras de un píxel.
- Hacia atrás hay lo que esté registrado: las salas viejas traen fecha, juego y jugadores desde la
  v0.20; el país y el ganador, solo desde la 0.33.6.

---

## 0.33.6 — 2026-09-14
- **El panel muestra las salas jugadas** (D-79, RP-29). Al final de `/panel/` hay una lista del rango
  elegido arriba (7 o 30 días), de la más nueva a la más vieja y paginada de a 20: día y hora,
  jugadores con la bandera de su país, juego y quién ganó.
- **Se empieza a anotar quién ganó** en las salas de dos celulares. Cambia D-44, que decía que eso no
  se guardaba: lo manda cada celular al llegar a la pantalla final y las reglas solo lo dejan
  escribir una vez. De los modos sin red sigue sin salir ni un nombre.
- **Y el país del celular**, en dos letras, pegado al jugador de esa sala. Sale del huso horario y no
  del idioma: un celular chileno puesto en inglés diría `en-US`. Si no se puede saber, la lista
  muestra el nombre sin bandera; no se inventa un país.
- **Las pruebas no aparecen**: corren en el entorno de desarrollo y el panel abre en producción. Las
  salas donde nunca entró un segundo jugador tampoco, porque no son una partida, y hay una casilla
  para incluirlas.
- Nada de esto es retroactivo: las salas de antes salen sin bandera y con un guion en el ganador, que
  no es lo mismo que un empate.
- **Hay que publicar las reglas de la base** en la consola de Firebase para que los dos campos nuevos
  se acepten; hasta entonces se rechazan en silencio.

- **El celular de Dudo ahora farolea, y se le nota menos la mano.** Antes cantaba casi siempre la
  pinta de la que más tenía: lo que apostaba delataba su mano un 46% por encima del azar, así que
  bastaba con jugar dos partidas para leerlo. Ahora **disfraza**: canta una pinta creíble que no es
  su más fuerte, abre rondas con una pinta que no tiene, y **aprieta** al rival que queda con uno o
  dos dados, que es cuando decidir le cuesta más. Delata un 38%.
- **Y dejó de exagerar la cantidad**, que era la única mentira que tenía. Medida sola gana el 21%
  de las partidas contra el 46% del celular honesto: subir por encima de la mínima legal le regala
  al rival un piso más alto sin comprarle nada. Era la peor jugada de su repertorio.
- **La agresividad se eligió con un torneo**, no a ojo: tres rivales de prueba —uno que solo
  calcula, uno que supone que tienes lo que cantas, uno que supone lo contrario— y 2.500 partidas
  por celda. Contra quien lee patrones —que es lo que hace una persona después de un par de
  partidas— el farol vale +4,4 puntos; contra quien solo calcula cuesta 3,6. Quedó en 0,7 y no en 1
  porque con la perilla al tope **nunca** cantaría su pinta más fuerte, que es un patrón tan legible
  como cantarla siempre. Todo anotado en [docs/juegos/dudo.md](docs/games/liars-dice.md).
- **Los títulos del README llevan los dos nombres**: `👑 Fourth King (Cuarto Rey)`. Primero el
  inglés, que es por lo que alguien de afuera busca el juego; entre paréntesis, el nombre de verdad,
  que es el que va a ver en la pantalla de la app.
- El ancla de cada sección se genera del título completo (`#-fourth-king-cuarto-rey`) con la misma
  función que arma el título, así que el enlace de la tabla y el título no pueden quedar apuntando a
  distinto lado.
- La tabla de juegos ahora nombra primero el inglés: `Fourth King / Cuarto Rey / Quarto Rei`.

---

## 0.33.5 — 2026-09-14
- **Los títulos del README llevan los dos nombres**: `👑 Fourth King (Cuarto Rey)`. Primero el
  inglés, que es por lo que alguien de afuera busca el juego; entre paréntesis, el nombre de verdad,
  que es el que va a ver en la pantalla de la app.
- El ancla de cada sección se genera del título completo (`#-fourth-king-cuarto-rey`) con la misma
  función que arma el título, así que el enlace de la tabla y el título no pueden quedar apuntando a
  distinto lado.
- La tabla de juegos ahora nombra primero el inglés: `Fourth King / Cuarto Rey / Quarto Rei`.

---

## 0.33.4 — 2026-09-13
- **El README pasó a inglés** (D-78). Es la puerta del repositorio y por ahí entra gente de
  cualquier parte. La app sigue siendo chilena y todo lo demás sigue en español: los cánones, las
  decisiones, las especificaciones, los comentarios y los mensajes de las herramientas.
- **Los bloques generados también.** La tabla de juegos toma los modos del `en` de cada `rules.js`,
  las temáticas salen del `en` de los mazos y los pies de foto de `docs/capturas.json` se
  reescribieron en inglés. Si no, `readme.py actualizar` devolvía media página al español en la
  primera publicación.
- Los títulos de las secciones quedaron en español en esta versión. En la 0.33.5 pasaron a llevar
  los dos nombres.

---

## 0.33.3 — 2026-09-13
- **La barra de apostar de Dudo ya no se va fuera de la pantalla** (D-77). La app se arma con el
  **alto chico** de la pantalla (`svh`) y no con el del instante (`dvh`). En un Android con la app
  instalada los dos valores se separan —medimos `dvh` 1016 px y `svh` 960—, así que la pantalla se
  armaba 56 px más larga que lo que se alcanza a ver y lo que se apoya abajo quedaba afuera:
  alcanzable deslizando, pero afuera.
- **Las muescas ahora se prueban de verdad.** `mirar.mjs --muescas` se las pide a Chrome en vez de
  sobreescribir las variables CSS: un sustituto pinta los márgenes pero no mueve el viewport, y por
  eso el arreglo anterior daba verde con el error puesto. El informe además avisa si una pantalla se
  arma con `dvh` en vez de `svh`.
- El diagnóstico salió de una página que mide el alto en el celular de verdad (`tools/diag/`), que se
  publicó a propósito para poder abrirla de un toque y se saca en cuanto deje de hacer falta.

---

## 0.33.2 — 2026-09-13
- **Las capturas se sacan con la pantalla quieta** (D-76). En el README, la pantalla "¿Quiénes
  juegan?" de Cuarto Rey mostraba las cuatro filas con anchos distintos. La grilla estaba bien: cada
  fila entraba con una animación de escala escalonada y la foto se sacaba a mitad de camino, con dos
  filas asentadas y dos todavía creciendo. Ahora el capturador espera a que las animaciones finitas
  terminen antes de disparar.
- **La lista de jugadores de Cuarto Rey dejó de saltar entera.** Entra animada solo la fila recién
  agregada, y entra desplazándose en vez de escalándose: agregar un jugador ya no vuelve a animar a
  los que estaban.
- **La fila angosta le dejó de comer el ancho al nombre.** En un celular de 320 px el campo quedaba
  en dos letras: bajo 400 px la fila se aprieta y bajo 340 px el selector de género se baja entero a
  una segunda línea. Los botones de género y la ✕ miden 44 px de alto (C-8).
- **Hoja de contacto para mirar las capturas juntas**: `node tools/e2e/contacto.mjs <seccion>` arma
  un PNG con todas las imágenes de una sección al tamaño en que el README las muestra. Mirándola
  aparecieron tres tomas más para arreglar: el ranking final y el "¡Cuarto Rey!" tapados por el
  confeti, y un "¡Salud!" que en realidad mostraba "¡Cumplida!".

---

## 0.33.1 — 2026-09-13
- **El botón de apostar de Dudo se iba fuera de la pantalla** en un celular con muesca, con medio
  celular vacío más arriba. No era de Dudo: `.app` pedía `100dvh` adentro de un `body` que ya había
  reservado las muescas con su padding, así que **la página quedaba 81 px más alta que el celular**
  (47 arriba, 34 abajo). En los otros juegos eso se notaba solo como un scroll de la nada; en Dudo,
  donde la barra de apostar se apoya en el borde de abajo, se llevaba el botón fuera (D-76).
- **Ninguna prueba lo veía** porque en Chrome headless las muescas valen 0. Ahora
  `mirar.mjs --muescas` las simula, y el informe dice cuánto se pasa la página del alto del celular
  y qué botones caen por debajo del borde. Con el error de vuelta, avisa: "⚠️ 81 px · Apuesto 1 quinta".

## 0.33.0 — 2026-09-13
- **El idioma puede venir en el link** (D-74). `juegosdesalon.cl/?lang=pt` abre la app en
  portugués, y hay dos puertas de entrada para compartir sin parámetros a la vista:
  **`juegosdesalon.cl/pt/`** y **`/en/`**. El idioma se aplica, se guarda como cualquier elección y
  el parámetro se saca de la barra de direcciones: lo que circula sigue siendo la dirección de
  siempre.
- **La invitación a una sala lleva el idioma pegado.** Quien la recibe abre la app en el mismo
  idioma en que se la mandaron —`/dudo/?sala=WFBN&lang=pt`—, sin tocar el toggle y sin que la sala
  cambie en nada. Vale para los cinco juegos con sala, y también para el QR.
- **Las dos puertas se comparten en su idioma**: `/pt/` y `/en/` llevan sus propias etiquetas Open
  Graph y su propia imagen de 1200×630, así que pegar el link en un grupo de Brasil muestra la
  tarjeta en portugués. Las tres portadas se anuncian entre sí con `hreflang`.
- **Sigue sin detectarse nada del navegador** (D-47): entrar a juegosdesalon.cl sin haber elegido
  nada es ver la app en español. Un `?lang=` que no sea es, en o pt se ignora en silencio.
- Se eligieron rutas y no subdominios: `pt.juegosdesalon.cl` necesitaría otro destino de publicación
  —GitHub Pages sirve un dominio por repositorio— o un proxy delante. Las carpetas cuestan dos
  archivos y no tocan la infraestructura.

## 0.32.1 — 2026-09-13
- **La bajada de Dudo en el menú**: *"Apuesta cuántos dados hay en la mesa sin poner caras
  sospechosas"*. Y de paso decía en qué se juega como si la sala no existiera —"en un celular o
  contra el celular"—: ahora nombra los tres modos, en los tres idiomas.
- **La tabla del README mostraba Dudo con un solo modo y en v0.28.** No era la tabla: Dudo llamaba
  a sus modos `m1`, `m2` y `m3`, y la hoja de hechos busca `modeLocal`, `modeOnline` y `modeCpu`,
  que es como se llaman en los otros cinco juegos. Renombrados. Además `tools/hechos.mjs` solo
  miraba los textos sueltos de `rules.js` y no los que viven dentro de `ui`, que es como los
  escriben Cuarto Rey y Dudo: ahora mira las dos formas.
- El icono de "varios celulares" en Dudo era 📶 y en el resto de la app es 📡.

## 0.32.0 — 2026-09-13
- **Dudo se juega en varios celulares** (DU-09). Sala con código de cuatro letras, QR, chat y
  turnos, de dos a seis. Era el modo que quedó en "Próximamente" cuando entró el juego: el motor ya
  hablaba el protocolo, faltaba la sala.
- **Los dados no viajan hasta que alguien duda.** Cada celular tira los suyos, publica el hash y los
  guarda; al dudar los destapa y todos verifican que sean los que había comprometido. El destape lo
  dice en pantalla: **"Dados verificados ✅"**, o el nombre de quien no calza (C-10, D-70).
- **Recargar a mitad de partida devuelve a la misma sala**, sin volver a presentarse, y con los
  dados de la ronda intactos: van guardados en el celular con su sal, porque sin ellos nadie podría
  destapar y la mesa se quedaría esperando para siempre (C-6).
- **Quien entra a una sala empezada no ve el destape de las rondas que se jugaron antes de llegar.**
- La revancha abre una sala nueva y arrastra a los demás, como en el resto de los juegos (C-7).

## 0.31.0 — 2026-09-13
- **La invitación a una sala dice quién invita**: *"Javi te invita a jugar Línea de Tiempo en
  juegosdesalon.cl - Sala: WFBN"* (D-173). Antes decía "Únete a mi sala de Línea de Tiempo. Código:
  WFBN", sin nombre: el mensaje llega por WhatsApp a gente que muchas veces no conoce la app, y lo
  primero que hace falta saber es de parte de quién viene. Nombra a quien toca compartir, que es
  quien está invitando.
- **Al copiar el link también viaja el mensaje.** Sin diálogo nativo —en un computador— el
  portapapeles se llevaba solo la URL y el texto se perdía; quien invitaba tenía que escribir a mano
  de qué se trataba.
- **La N de "SALÓN" ya no sale cortada en WhatsApp.** La imagen estaba entera, pero cada chat la
  recorta al alto de su propia ventanita y lo que se come son los lados: de 1200×630 a 1,5:1 se van
  127 px por lado, justo donde terminaba el título. Ahora todo lo que se lee vive dentro del 88%
  central y el generador avisa si algo se acerca al borde.
- El texto de la invitación es **uno solo para los cuatro juegos con sala**, en `COMMON`: eran doce
  frases (cuatro juegos por tres idiomas) que decían lo mismo de doce formas.

## 0.30.1 — 2026-09-13
- **La bajada de la portada ya no cuenta los juegos.** Decía cuántos había, y ese número cambia
  cada vez que entra uno nuevo: una frase que envejece sola es peor que una que no cuenta nada.
  Ahora dice qué es la app: *"Juegos tradicionales llevados a tu celular para pasar el tiempo solo o
  con amigos"*. Va en los dos lugares donde se lee lo mismo —debajo del título en el menú y en la
  tarjeta que se ve al compartir el link— y está en los tres idiomas.
- La lista de juegos de la descripción sí se sigue armando de `games.js`: nombra cuáles hay sin
  decir cuántos son, así que no envejece.
- **El panel se entera solo de los juegos nuevos.** Tenía cuatro listas copiadas —los juegos, los
  modos con su ícono, los idiomas con su nombre y los entornos del `<select>`—, una regla de CSS por
  modo y una enumeración de modos en las reglas de Firebase. Ahora no tiene ninguna: los juegos y los
  modos los lee del registro de `assets/js/games.js`, los entornos de `transport/stats.js` y los
  idiomas de `i18n.js` (canon C-16, D-73).
- **Un modo nuevo era el caso que fallaba feo.** El contador ni salía del celular, porque el registro
  de señales filtraba contra su propia lista, y si salía, las reglas lo rechazaban con un 401 que no
  mira nadie. El dato no se veía mal: no existía. Ahora el modo se acepta por su forma, en el código
  y en las reglas, y agregar uno es una línea en `MODES`.
- **Lo que el panel no conoce se muestra igual**, con su clave por nombre: un juego recién publicado,
  uno que ya se fue del menú, un modo sin emoji propio (entra con su color y un `·`) o un idioma que
  el navegador sabe nombrar —`fr` se lee "Francés"—. Descartarlo en silencio era mentir en el total.
- **Se acabaron los topes escritos a mano:** cuántos jugadores caben sale del juego más numeroso del
  menú. Si algún día entra uno de ocho, el panel y los contadores lo siguen sin que nadie se acuerde.
- **Lo vigila un test, no la memoria:** `node panel/adapta.test.mjs` inventa un juego y un modo y
  exige verlos en la barra, y falla si vuelve a aparecer una lista copiada en el panel o una
  enumeración en las reglas. Para mirarlo, `node tools/e2e/mirar.mjs panel datos` siembra el panel
  con datos que incluyen un juego, un modo y un idioma que no existen.
- **Hay que publicar las reglas** de `firebase/database.rules.json` en la consola para que la
  validación por forma tenga efecto.

## 0.30.0 — 2026-09-13
- **Un link de la app pegado en un chat ahora se ve como algo.** No había ninguna etiqueta de Open
  Graph: WhatsApp, Slack o X mostraban el título pelado y ninguna imagen. Ahora cada página —el menú
  y los seis juegos— lleva su título, su bajada y **su propia imagen de 1200×630** (D-72).
- **Cada juego tiene la suya, y esa es la parte que importa.** El link que más se comparte en esta
  app no es la portada: es la invitación a una sala, `juegosdesalon.cl/toque-y-fama/?sala=WDDT`
  pegada en un WhatsApp. Antes llegaba sin decir a qué te estaban invitando; ahora muestra el juego,
  para cuántos y cuánto dura.
- **Las etiquetas se generan** desde `assets/js/games.js` con `node tools/og.mjs tarjetas`, que
  corre solo en cada publicación: son siete páginas por veinte etiquetas, y copiar a mano el nombre
  y la bajada de cada juego a un segundo lugar es crear algo que envejece. Las imágenes las dibuja
  `tools/og/tarjeta.html` con los estilos y los datos reales, y `node tools/og.mjs imagenes` las
  fotografía con Chrome.
- **La versión va en la URL de la imagen.** Las redes cachean estas tarjetas por semanas; sin eso,
  un dibujo nuevo no se vería hasta que a ellas se les ocurriera volver a mirar.
- De paso, cada página gana su `<link rel="canonical">` y una descripción propia: los juegos no
  tenían ninguna.

## 0.29.1 — 2026-09-13
- **El "¿Cómo se juega?" de Dudo se lee mejor.** Los siete pasos van en frases derechas, sin guiones
  largos partiendo las frases al medio: "El que sigue sube la apuesta: más cantidad, o la misma
  cantidad con pinta mayor, o bien dice «dudo»". Cada jugador **recibe** los dados en vez de tirarlos
  —que es lo que hace la app—, calzar dice cuántos jugadores hacen falta en vez de mandar a contar
  la mesa, y el final nombra lo que hay que mirar: gana el último jugador con dados **en su mano**.
  Mismos cambios en inglés y portugués.

## 0.29.0 — 2026-09-13
- **En español, Dudo se dice en chileno**: ases, tontos, trenes, cuadras, quintas y sextas (D-71).
  Es como se juega acá —"cuatro quintas", no "cuatro cincos"— y viene encendido. Los nombres salen
  en la apuesta, en el destape y en el repaso de la partida. Hay un interruptor en la configuración
  para volver a los números, porque quien no los conoce necesita una salida y porque en español
  también se juega fuera de Chile. **Es una opción de un solo idioma:** en inglés y en portugués no
  hay un juego de nombres equivalente, así que las pintas van por su número y el interruptor ni se
  ofrece.
- **En un duelo no se puede calzar.** Con dos jugadores hay una sola mano tapada, así que acertar la
  cantidad exacta deja de ser un riesgo y pasa a ser una cuenta. Ahora calzar pide **tres jugadores
  o más**, y se apaga solo cuando una mesa de seis se queda en dos: la regla vive en el motor, no en
  la pantalla. El interruptor de calzar aparece recién cuando hay tres nombres anotados.
- **Los dados de la botonera ya no se confunden con los tuyos.** Eran el mismo dado sólido, más
  chico, y dos cosas con la misma forma se leen como cosas del mismo tipo. La botonera pasa a ir
  **dibujada en hueco** —contorno y puntos en línea— y la cara sólida queda solo para los dados de
  la mano; el elegido se rellena apenas, en cian.

## 0.28.0 — 2026-09-13
- **Juego nuevo: Dudo 🎲** (2 a 6 jugadores). El clásico de los dados que se juega en bares y
  sobremesas: cada uno tira cinco y mira solo los suyos, se apuesta cuántos hay de una pinta en toda
  la mesa —"cuatro cincos", con los ases de comodín— y el que sigue sube o dice dudo. Se destapa,
  se cuenta, y el que se equivocó pierde un dado. Gana el último que le quede alguno (D-69).
- **Lo que aporta el celular no es reemplazar los dados, es arbitrar.** Reparte, **no deja hacer una
  apuesta ilegal** —subir es más cantidad o la misma con pinta mayor, y entrar y salir de los ases
  cuesta la mitad y el doble más uno— y cuenta al instante, que es exactamente lo que se discute a
  gritos en la mesa de verdad.
- **Calzar** es decir que la cantidad es exacta: aciertas y recuperas un dado, fallas y pierdes uno.
  Solo desde que la apuesta llega a la mitad de los dados de la mesa, porque antes es una apuesta
  gratis. Se puede apagar en la configuración.
- **Dos modos:** un celular de 2 a 6, con la pantalla de pase entre turnos, y contra el celular. El
  aparato **solo mira sus propios dados**: decide con la probabilidad de que entre los dados que no
  ve estén los que faltan, no espiando los tuyos. Salió barato —es una cuenta binomial— justo donde
  el rival de la máquina del Ahorcado salía carísimo (D-64, D-65).
- **Los dados no salen de la semilla** (D-70), y es la decisión que define el juego. El código de
  esta app es público: con una semilla compartida, cualquiera podría calcular los dados del rival
  desde la consola. Cada celular tira los suyos y publica el hash; al dudar se destapan y se
  verifica (C-10), igual que la flota de Batalla Naval. Es una excepción anotada a C-7.
- **Varios celulares queda "Próximamente"**, como manda C-5 para un modo que todavía no existe. El
  motor ya habla el protocolo de la sala; falta la sala.
- **La prueba de paridad de idiomas cambió de criterio.** Comprobaba que cada bloque de idioma
  tuviera más de cinco claves para saber que se había leído bien, y eso dejaba fuera a un juego chico
  como Dudo, que solo tiene los nombres de las pintas y la interfaz. Ahora compara que los tres
  idiomas den la misma cantidad de claves, que es lo que de verdad delata una lectura a medias.
- **`mirar.mjs --idioma` no hacía nada.** Guardaba el idioma con comillas (`JSON.stringify`) y
  `getLang()` compara contra `['es','en','pt']`, así que siempre caía al español y las capturas de
  otro idioma salían en español sin avisar.

## 0.27.1 — 2026-09-13
- **Los botones de la pantalla final de Cuarto Rey se ven sin desplazar** (C-8). Con seis jugadores
  quedaban fuera: "¡Otra ronda!" cerraba en 902 px y "Volver al menú" en 1026, en una pantalla de
  812. Venía de antes; apareció al medir dónde poner el historial nuevo. Ahora la corona es más
  chica, las filas del ranking más compactas y los dos botones secundarios comparten fila: el último
  cierra en 774 px con seis jugadores, y en los tres idiomas. Medido, no supuesto.
- **En 320 px ya no aparece barra horizontal en esa pantalla.** La corona se mece y en el punto más
  ancho del vaivén se salía medio píxel, que basta para que el navegador muestre la barra.

## 0.27.0 — 2026-09-13
- **Cuarto Rey guarda las cartas que salieron** (CR-18). Al pie de la pantalla final, plegado, queda
  el repaso de la partida: cada carta con su palo y su color, quién la sacó y qué decía, en el orden
  en que salieron. Los reyes se ven de una, con la carta dorada. Es para el que quiere revisar cómo
  se dio la noche, no para el que solo mira quién tomó más, así que va cerrado y no estorba.
- **Va después de los botones, al revés que en Toque y Fama y Línea de Tiempo.** En esos dos el
  repaso va entre el ranking y los botones, pero acá el ranking tiene hasta seis filas y los botones
  ya quedan justo en el borde de un celular de 812 px: sumarle un bloque encima los empujaba 64 px
  más abajo (C-8).
- **Una partida guardada de antes no trae historial** y se retoma igual; al final no muestra la
  sección en vez de mostrarla a medias.
- **Se descartan las variantes configurables de Cuarto Rey** (D-68). CR-17 pedía elegir la cantidad
  de sorbos, seguir hasta agotar el mazo o usar naipe real. Los sorbos configurables se pagan en
  textos —"toma dos sorbos" está escrito en las cartas, los overlays y el ranking, en tres idiomas—
  para cambiar un número en una app donde el vaso lo sirve cada uno; las otras dos revierten D-06 y
  D-12, que se decidieron con razones que siguen valiendo. Cuarto Rey queda sin pendientes.
- La especificación del juego decía que los sonidos eran una idea futura desde antes de que
  existieran: se voltea la carta con `SFX.flip` y el cuarto rey suena con su fanfarria desde la v0.3.

## 0.26.3 — 2026-09-13
- **Las capturas del README muestran la app de hoy.** Treinta y ocho imágenes de Cuarto Rey,
  Toque y Fama, Batalla Naval, Línea de Tiempo y el menú en inglés venían de código anterior;
  se rehicieron con los guiones de punta a punta.
- **La captura "Pásale el celular" de Toque y Fama mostraba el tablero, no el pase.** La toma
  se sacaba justo después de anotar los dos números secretos, y ahí no hay pase que mostrar:
  quien anotó último es quien juega primero. En el README quedaban dos imágenes iguales, una
  de ellas con un pie que no correspondía. Ahora sale la pantalla que junta la respuesta al
  intento y el pase al siguiente jugador (C-9), que además es la que muestra famas y toques.
  El guion la saca con nombre fijo, porque una toma numerada dentro de un bucle no la puede
  encontrar `readme.py revisar`.

## 0.26.2 — 2026-09-13
- **El menú se reordenó**: Línea de Tiempo, Toque y Fama, El Ahorcado, Batalla Naval y Cuarto Rey.
  Antes el orden era el de cuándo se fue construyendo cada juego, que no le dice nada a quien llega.
- **El Ahorcado aparece como v0.26 en la tabla del README** y no con un guión: la cabecera de su
  especificación no usaba el formato del que `tools/hechos.mjs` saca el estado publicado.

## 0.26.1 — 2026-09-12
- **La barra de acciones ya no flota sobre el teclado.** Estaba pegada al fondo de la pantalla, y
  eso hace que se monte sobre lo que haya debajo en cuanto el tablero no entra: bastaban 16 px de
  más para que se comiera la última fila de teclas. Ahora va en el flujo, al pie, y en pantallas
  cortas el teclado se compacta hasta el mínimo del canon —44 px— para que el tablero entre entero
  sin desplazar. El guion de punta a punta ahora lo comprueba.

## 0.26.0 — 2026-09-12
- **Juego nuevo: El Ahorcado 🪢** (1 a 6 jugadores). El ahorcado de toda la vida con el arreglo
  que le falta desde siempre: nadie se queda mirando. Cada jugador le escribe la palabra al
  siguiente —el último al primero— y todos adivinan la suya; con dos es un duelo y con seis una
  carrera (D-53). El puntaje son los errores que te sobraron, así que poner una palabra imposible
  no suma nada: el que puntúa es el que adivina. La otra forma de repartir es el mazo de la app,
  con cinco temáticas y una mezcla, y palabra y pista propias en los tres idiomas.
- **Los turnos se alternan letra a letra** (D-59): pruebas una y le toca al de al lado, en vez de
  jugar tu palabra entera mientras el resto mira. Todos los tableros avanzan a la vez y la carrera
  se ve. En un celular, eso significa que el aparato cambia de mano en cada jugada, así que el
  resultado de la letra y el pase van juntos en una sola pantalla (C-9).
- **Los tres modos:** un celular de 2 a 6 (pantalla tapada para escribir y pase en cada letra),
  varios celulares de 2 a 6 con sala, chat y turnos alternados, y jugar solo, donde la app
  reparte una palabra de la temática y la sacas tú. Con cadena la palabra no viaja: se compromete
  con hash y se verifica al final (C-10).
- **Comprar una letra** 💡 revela la que falta más rara y cuesta un error (D-58); la tira de
  rivales muestra vidas y avance, nunca las letras (D-55); los acentos se pliegan y la Ñ tiene
  tecla propia solo en español (D-57). Una letra errada no abre un aviso que haya que cerrar:
  excepción documentada al canon C-8b (D-56).
- **Ya está en el menú** (AH-15). Entró con dos guiones de punta a punta propios: `ahorcado-local.mjs`
  juega la cadena de tres en un celular y el duelo contra el celular, y `ahorcado-online.mjs` arma
  una sala de tres celulares contra Firebase real, con reconexión a mitad y revancha.
- **Una letra errada dejaba la sala escribiendo sin parar** (D-60). En varios celulares con cadena,
  quien puso la palabra responde con las posiciones de la letra, y la letra que no está es una lista
  vacía. Firebase no guarda listas vacías, así que el campo llegaba ausente, la respuesta se
  descartaba por no ser una lista y el aparato la volvía a mandar en cada vuelta: bucle de escrituras
  contra la sala y ese celular colgado. Ahora las posiciones viajan como texto —`"1,4"`, o vacío— y
  una respuesta que el otro lado no aplica se reintenta tres veces y se deja de mandar. Lo encontró
  el guion de punta a punta, que se quedaba mudo siempre en el mismo lugar.
- **Colgarse ya no gana** (D-61). El desempate por "menos letras gastadas" está pensado para quien
  sacó la palabra, pero entre colgados decía lo contrario: gastar menos letras es haber revelado
  menos. En la primera partida de prueba los tres se colgaron y la pantalla coronó justo al que no
  había revelado ni una letra. Ahora los colgados van al final del ranking, ordenados por cuánto
  alcanzaron a revelar, y si no la sacó nadie no hay ganador: dice "No la sacó nadie".
- **El modo Un celular ya no promete rondas enteras**: su texto decía "las rondas van una después de
  otra", que dejó de ser cierto con los turnos alternados (D-59). Ahora dice que cada uno prueba una
  letra y le toca al siguiente, en los tres idiomas.
- **En varios celulares la pantalla ya no dice "te toca"**: ahí nadie espera a nadie, así que sobre
  el tablero propio dice "Tu palabra, {nombre}". El "te toca" queda para los modos que sí tienen turno.
- **El tercer modo es 🧍 Jugar solo, y el celular ya no adivina** (D-65). Que la máquina tratara de
  sacar *tu* palabra era una simetría forzada: el ahorcado es alguien que pone una palabra y alguien
  que la saca, y poner al aparato del lado del que adivina no agregaba un rival sino la animación de
  un rival. Ahora la app reparte una palabra de la temática elegida, con su pista, y la sacas tú. Se
  fueron con el duelo la IA del motor y los diccionarios de cien mil palabras por idioma que hacían
  falta para que adivinara de verdad: tres megas menos. De yapa, jugando solo la palabra sale del
  mazo y no hay secreto que comprometer, así que es el único modo que anda sin https.
- **En la sala también se juega por turnos** (D-66). Varios celulares estaba pensado simultáneo para
  que nadie se quedara mirando, pero jugando de a dos —que es como se juega casi siempre— eso se
  comía justo lo que hace divertido un duelo: no había secuencia que seguir ni contra quién medirse
  en el momento, eran dos solitarios que al final comparaban puntajes. Ahora va una letra cada uno,
  en el orden en que entraron, con el teclado bloqueado para quien no tiene el turno y la tira de
  rivales marcando a quién le toca. Un celular que cierra la pestaña ya no traba la sala: el turno
  lo saltea y lo vuelve a tomar si regresa.
- **Una letra confirmada se ve antes de seguir** (D-63). Al confirmar, pasa un cartel de un segundo
  sobre el dibujo —"¡Va!", "No está" o "Comprada", con la letra— que aparece y se va solo. Va en los
  dos modos donde la jugada no abre ninguna pantalla: jugando solo y en varios celulares, donde el
  cartel no interrumpe nada y recupera la señal para quien estaba mirando la tira de rivales en vez
  del teclado. En un celular no cambia nada, porque ahí cada letra ya termina en la pantalla de
  veredicto y pase.
- **La temática ahora sirve también con cadena** (D-62). Antes solo repartía cartas con el mazo, así
  que en el camino por defecto —cadena— se pedía elegir una temática que no tenía ninguna
  consecuencia, y el mensaje de compartir la sala la anunciaba igual. Ahora, arriba de los campos y
  antes de pedirle nada, quien escribe ve seis palabras de esa temática con su emoji: toca una y se
  llenan la palabra y la pista, y después las puede cambiar o ignorar y poner la suya. Se calculan en ese celular y no viajan, así que la
  palabra sigue siendo secreta.
- **Escribir la palabra ya no se traba en silencio sin https** (C-14). Comprometerla con hash usa
  `crypto.subtle`, que solo existe con https o en localhost; al abrir el juego por la IP de la red
  —lo que uno hace para probarlo desde un celular— el botón de guardar quedaba deshabilitado para
  siempre, sin decir nada y con un error en la consola. Ahora lo explica en pantalla, en los tres
  idiomas, y el botón vuelve a estar usable.
- Los guiones compartidos de sala —enlace de invitación, falla de red y tope de salas por celular—
  ahora recorren también El Ahorcado: son cuatro los juegos con sala, no tres.
- **El test de idiomas ahora ve las claves repetidas** (C-3). Una clave escrita dos veces en el
  mismo idioma no da error en JavaScript: la segunda pisa a la primera, en silencio. Comparar los
  tres idiomas no lo detectaba, porque los tres quedaban igual de pisados. Pasó de verdad: el
  título nuevo de varios celulares salía sin el nombre porque una clave muerta con el mismo nombre
  lo tapaba. El test lee el archivo llevando la cuenta de las llaves, para mirar solo las claves
  del propio idioma y no las de los objetos que tenga adentro.
- **Se va el laboratorio** (D-67). Existía para mirar un cambio de interfaz en un celular sin
  publicarlo, y eso ahora se hace sirviendo el árbol de trabajo por Tailscale: la app entera, con
  HTTPS y sin espejos que mantener. Los espejos eran copias del `index.html` de cada juego y
  envejecían —el mismo día que se sacó, `lab.py revisar` falló por dos `id` nuevos—, y en su vida
  útil nunca se promovió un experimento. En su lugar queda `tools/e2e/mirar.mjs`, que abre una
  pantalla suelta y avisa si hay scroll horizontal o botones bajo 44 px, sin jugar la partida entera.
- **La barra de acciones se ve como una barra** y no como un rectángulo oscuro suelto. El botón de
  confirmar quedaba 72 px más corto que el de comprar —un hueco reservado para la burbuja del chat—
  y el fondo flotaba a media altura con el fondo de la página asomando debajo. Ahora los dos botones
  miden igual y usan todo el ancho, la barra llega de borde a borde y baja al pie cuando sobra
  pantalla. La que se corre es **la burbuja del chat**, que mientras se juega se va al vacío que deja
  el dibujo: dejarle su esquina obligaba a acortar los dos botones y a 360 px el texto de comprar
  quedaba partido en dos renglones.
- **Aire entre el teclado y los botones de acción**: estaban tan pegados que se tocaba "comprar una
  letra" queriendo la Z. Y el sobrante de pantalla ya no queda partiendo ese bloque al medio: se va
  arriba del teclado, así el teclado y sus botones bajan juntos al pie.
- **Esperando el turno no hay teclado**: una botonera entera apagada ocupaba media pantalla para
  decir "todavía no". Quedan el dibujo, la pista, la palabra y la tira de rivales, que es lo que
  hay para mirar mientras le toca a otro.
- **Jugando solo, un solo aviso al terminar**: salía "¡La sacaste!" en un pop-up y otra vez en la
  pantalla final. Se va el pop-up —no hay a quién pasarle el celular ni nadie esperando— y en su
  lugar la letra que cierra la palabra se ve sobre el tablero completo antes de pasar al resultado.
  Antes esa última jugada quedaba tapada por el aviso apenas aparecía.
- **El cartel de la letra dura dos segundos** y no uno: con uno la jugada pasaba antes de que el
  jugador levantara la vista del teclado.
- Detalles: en el ranking el ⏱ ya no se separa de su valor al partirse la línea.
- Suman a `assets/js/sound.js` cuatro efectos: la letra acertada sube medio tono sobre la anterior
  —una racha se escucha como una escala—, la errada es seca, el dibujo completo suena a trampa que
  se abre y con un solo error de margen entra un latido.
- `tools/hechos.mjs` ya no se cae cuando un juego todavía no tiene carpeta de capturas: eso es
  cero capturas, no una falla de la herramienta.


## 0.25.3 — 2026-09-12
- **El aviso de capturas viejas vuelve a querer decir algo** (D-51). Estampar la versión
  reescribe los seis `index.html` (C-11), y el chequeo del README lo leía como "esta pantalla
  cambió": después de cada publicación aparecían como viejas las capturas de todos los juegos,
  incluidos los que nadie había tocado. Ahora `git_fecha` se salta los cambios cuyo único
  contenido son las marcas de versión —comparando las líneas quitadas contra las puestas con
  el número borrado, que es lo que distingue un estampado de un módulo nuevo en el import map—
  y el aviso queda solo para las pantallas que de verdad cambiaron. Lo prueba
  `python3 tools/readme.test.py`, el primer test de las herramientas.

## 0.25.2 — 2026-09-12
- **La intro de Línea de Tiempo va al grano.** El "Cómo se juega" explicaba de corrido las
  tres maneras de repartir —todas a la vista, pozo común y mano propia— antes de que nadie
  hubiera elegido ninguna. Esa parte sale: cada manera ya se explica sola en la pantalla de
  configuración, donde el selector muestra la ayuda de la que está elegida. El panel de la
  intro baja de doce líneas a cinco y los tres modos se ven sin desplazar. En los tres idiomas.

## 0.25.1 — 2026-09-11
- **El README se mantiene solo** (D-51). `tools/readme.py` genera desde el código los datos que
  el README repetía a mano —tabla de juegos, temáticas con su cuenta de cartas, nombres por
  idioma, tests e índice de documentos, todo entre marcas `<!-- generado: ... -->`—, avisa qué
  sección de prosa hay que releer cuando cambian los hechos de la app (`docs/hechos.json`) y
  rehace las capturas corriendo los guiones de `tools/e2e/` según el catálogo nuevo
  `docs/capturas.json`. `set-version.py` lo corre antes de estampar, así que un README viejo
  frena la publicación. De paso quedan corregidos los datos que ya estaban vencidos: los mazos
  eran cuatro en el texto y seis en el código, y el estado de cada juego ahora sale de su
  especificación. `tools/e2e/cuarto-rey.mjs` saca ahora las nueve pantallas del juego y las dos
  en inglés; Cuarto Rey, Línea de Tiempo y el menú quedaron recapturados, al doble de
  resolución y pesando menos.

## 0.25.0 — 2026-09-11
- **Las salas canceladas se cierran en el acto** (RP-27, D-50). Hasta ahora una sala vivía sus
  seis horas pasara lo que pasara: el panel del dueño mostraba como "vivas" las salas que
  alguien abrió y abandonó, y cada revancha dejaba otra atrás. El transporte suma una
  despedida (`dispose()`, `assets/js/transport/dispose.js`): quien se va a propósito escribe
  `left` en su rol y, si con eso no queda nadie adentro, borra la sala. Cerrar la pestaña o
  quedarse sin señal **no** cancela nada: esa partida se puede retomar (C-6) y la sala sigue
  esperando.
- El lobby de los tres juegos con sala gana un botón al final: **Cancelar la sala** para quien
  la creó y **Salir de la sala** para quien se unió, en los tres idiomas. Antes no había
  ninguna salida explícita: solo la flecha de volver al menú, que es una navegación y no una
  intención.
- Cambiar de modo al terminar y mudarse a la sala de la revancha también se despiden, así que
  la sala que se deja atrás no queda dando vueltas.
- El panel deja de contar y de listar las salas cerradas. Las salas sin nadie conectado siguen
  apareciendo, apagadas: esas se pueden retomar.
- **Reglas de Firebase republicadas** (`firebase/database.rules.json`): son las que permiten
  borrar una sala viva cuando todos sus jugadores se despidieron, y las que validan `left`.
  Se pegan y se publican a mano en
  [la consola](https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules);
  sin eso, la despedida se escribe igual pero el borrado se rechaza en silencio.

- **El selector de Cartas de Línea de Tiempo va en fila** (D-52). Las tres formas de repartir
  eran tres botones apilados que se comían 169 px de alto en un celular; ahora son tres
  pastillas lado a lado, con el mismo aire que el toggle de idioma, con el emoji arriba y el
  nombre completo debajo. El control baja a 78 px y la pantalla de configuración se acorta
  casi 100 px. Probado en los tres idiomas y hasta 320 px de ancho.

## 0.23.2 — 2026-09-11
- Bajada del título del menú, más corta: "Elige un juego, para pasar el tiempo solo o con
  amigos." en los tres idiomas.

## 0.23.1 — 2026-09-11
- **Frases del pie renovadas** (D-49). Las 100 frases por idioma de `assets/js/frases.js` dejan
  el humor sobre los juegos de la app y los mensajes de agua/moderación por chistes genéricos
  de sobremesa: cortas, sobre la vida, para ligar y de WhatsApp. Traducidas y adaptadas (C-3)
  a inglés y portugués de Brasil, sin calcar los juegos de palabras que solo funcionan en
  español.

## 0.23.0 — 2026-09-11
- **Dos temáticas nuevas en Línea de Tiempo** (LT-17). 🇧🇷 **Brasil** (140 cartas): de Cabral
  y Tiradentes a la COP30, mezclando historia con la tele (Escrava Isaura, Xou da Xuxa, Vale
  Tudo, Avenida Brasil, BBB), la música (bossa nova, Tropicália, Mamonas, Anitta), el cine
  (Cidade de Deus, el Oscar de Ainda Estou Aqui) y la farándula (Gisele en el Maracaná,
  Madonna y Lady Gaga en Copacabana). ⚽ **Fútbol** (123 cartas): de las reglas de 1863 y el
  primer Mundial a la Superliga de 48 horas, con fundaciones de clubes, finales, goles
  famosos, fichajes récord, fútbol femenino y escándalos. Ambos en los tres idiomas.
- Los dos archivos se suman al import map de `tools/set-version.py`, y la especificación del
  juego ahora dice explícitamente que ese paso es parte de agregar un mazo.

## 0.22.0 — 2026-09-11
- **Portugués** (RP-25, D-48). La app entera se puede jugar en portugués de Brasil: el menú y
  sus 100 frases del pie, los cuatro juegos con sus tres modos, las salas, el chat, los
  errores de transporte, las pantallas de pase y las 424 cartas de los cuatro mazos de Línea
  de Tiempo. Tercer botón en el toggle: 🇧🇷 PT. Los nombres se traducen como ya se hacía en
  inglés: Quarto Rei, Toque e Fama, Batalha Naval, Linha do Tempo; los mini-juegos de Cuarto
  Rey son Era Uma Vez, Porquinho Bochechudo, Cultura de Boteco y Eu Nunca.
- Las traducciones se adaptan, no se calcan (C-3): las comunas de Santiago son bairros, los
  equipos chilenos son times brasileiros, la penitencia es una prenda y el "fondo" es "vira,
  vira, vira". Los años antes de Cristo se escriben "a.C." también en portugués.
- Los tres diccionarios tienen exactamente las mismas claves, listas del mismo largo y las
  mismas `{llaves}` en las plantillas: lo verifica el test nuevo `assets/js/i18n.test.mjs`,
  y el test del motor de Línea de Tiempo exige `pt` en cada carta. `sala-error.mjs` prueba el mensaje de sala caída también en portugués.
- El panel etiqueta `pt` en "Idioma elegido para jugar". El panel mismo sigue en español.

## 0.21.2 — 2026-09-11
- **Idioma elegido para jugar** (D-46). Las señales de uso ya guardaban el idioma del
  navegador, que dice de dónde es la persona. Ahora guardan también el del toggle de la app,
  que dice en cuál prefiere jugar: son preguntas distintas y con una sola no se distingue
  "nadie juega en inglés" de "no hay nadie de habla inglesa". El panel los muestra en dos
  secciones vecinas. **Hay que republicar las reglas de Firebase** para que acepten el
  contador nuevo.
- **Una sala recién creada dice "Sin msjs"**, no "2 msj". El transporte manda un `hello` por
  cada jugador que entra, y el panel los contaba como jugadas: una partida donde nadie había
  hecho nada aparecía con mensajes. Ahora se cuentan las jugadas y el chat, no los saludos, y
  el plural va bien ("1 msj", "3 msjs"). La hora de última actividad sí sigue mirando todos
  los mensajes: que alguien acabe de entrar también es actividad.
- El aviso de salas de otro entorno explica qué son en vez de describir cómo funciona por
  dentro: "Hay una sala abierta que no es de Publicado, así que no se cuenta acá: UWRD.
  Suelen ser partidas de prueba hechas en el computador o en el laboratorio, y se borran
  solas a las seis horas."

## 0.21.1 — 2026-09-11
- **El panel ya no cuenta las partidas de prueba como uso** (D-45). El selector de entorno
  separaba las cifras de los últimos días, pero la sección "Ahora" leía `rooms/` directo, que
  es el nodo real del transporte y es uno solo para todos los entornos: al estrenar el panel
  aparecieron ahí las salas de las pruebas de punta a punta, con sus jugadores de mentira,
  indistinguibles de gente jugando. Ahora cada sala viva se cruza por código contra lo que
  `stats/<entorno>` registró, sin pedirle nada más a la base.
- Las salas que quedan fuera **se nombran debajo de la lista** en vez de desaparecer. El
  registro de señales es mejor esfuerzo y falla callado: si una sala real no alcanzó a
  registrarse, filtrar sin avisar la borraría del panel y nadie podría notarlo.
- El sitio vive en **https://juegosdesalon.cl/**, no en `ellokojavi.github.io`, que redirige
  con un 301. Todo el repo lo tenía mal, y no era cosmético: el paso de configurar
  Authentication mandaba a autorizar el dominio equivocado, con lo que el panel habría
  fallado en producción funcionando perfecto en `localhost`.
- La pantalla de entrada del panel nombra las fallas de la primera vez —falta habilitar
  Google, falta el dominio— en vez de mostrar el código crudo de Firebase, y pregunta siempre
  con qué cuenta se entra: sin eso Google usa la sesión abierta y entrar con la cuenta
  equivocada no se nota, porque muestra un UID igual de válido.

## 0.21.0 — 2026-09-11
- **Línea de Tiempo: todas las cartas a la vista** (D-43, LT-15). La sección "Cartas" de la
  configuración pasa de dos opciones a tres, y la nueva queda marcada por defecto: se
  despliega **el doble de las cartas que hay que colocar para ganar** —6, 10 o 14 según la
  meta— desde el primer turno, y no entra ninguna carta nueva en toda la partida. Cada carta
  que sale, por acierto o por error, achica la mesa.
- Como la mesa solo se achica, las cartas difíciles de situar van quedando para el final,
  sobre una línea de tiempo que para entonces ya está llena y deja huecos cada vez más
  estrechos: la partida se pone más difícil sola, sin ninguna regla extra que explicar. El
  pozo común de 6 cartas que se reponen sigue disponible, y la mano propia también.
- El contador de arriba a la derecha deja de decir cuántas cartas quedan en el mazo —que en
  este modo no entra nunca— y dice cuántas quedan en la mesa. Con tres opciones el selector
  ya no cabe lado a lado en un celular, así que va apilado y cada una lleva su nombre completo.
- En solitario la mesa se puede vaciar antes de llegar a la meta: la pantalla final lo dice
  con sus palabras ("Se acabaron las cartas · Alcanzaste a colocar 1 de las 3 cartas que
  necesitabas") y no se guarda récord, para que una partida abandonada no quede como la mejor
  marca. Cada forma de repartir lleva su récord aparte.

## 0.20.0 — 2026-09-11
- **Panel privado del dueño en `/panel/`** (D-44, RP-23). Entra con Google y muestra, en vivo:
  salas en juego y celulares conectados (la mejor aproximación a la cuota de conexiones),
  partidas por juego y por modo en 7 o 30 días, jugadores por partida, de dónde se juega
  (zona horaria), idioma del navegador y a qué hora se juega. Filtra por entorno para que
  las pruebas locales y el laboratorio no ensucien las cifras publicadas.
- **Los juegos dejan señales de uso anonimizadas** (RP-24): las salas quedan registradas
  con juego, hora, versión y los nombres que ya viajaban a Firebase; los modos sin red
  mandan un contador por juego, modo y jugadores, sin nombre; todos suman zona horaria,
  idioma y hora local. Va por REST con un solo `fetch`, sin cargar el SDK ni abrir
  conexión, y si falla nadie se entera. Nunca sale una IP, un secreto, el chat ni quién ganó.
- Reglas de Firebase nuevas: `stats/` solo lo lee el dueño y solo acepta subir contadores
  de a uno; `rooms/` gana un índice por `createdAt` y lectura de lista para el dueño.
  **Hay que publicarlas en la consola y activar Google en Authentication** (pasos en
  `firebase/README.md`).
- La promesa de privacidad de los requerimientos pasa de "no se envía ningún dato" a
  "no se envía nada que identifique a una persona".

## Laboratorio — 2026-09-11

No es una versión de la app: **ningún archivo de los juegos cambió.** Se publica una
carpeta nueva, `/lab/`, como ambiente de pruebas de interfaz con URL propia (D-42).

- Sirve para mirar un cambio de aspecto en un celular de verdad, y pasarle el enlace a
  alguien, antes de decidir si va. Las páginas del laboratorio **espejan** el menú y los
  juegos, pero **importan los módulos reales**: no hay lógica duplicada y un arreglo en
  un juego se ve ahí solo.
- El experimento se escribe en `lab/lab.css`, que se carga después de `base.css` y solo
  agrega. Borrar ese archivo tiene que dejar las páginas funcionando con el aspecto
  actual: esa es la prueba de que el experimento está aislado.
- **`tools/lab.py`** hace lo mecánico del laboratorio: `espejar` deriva la página de un
  juego desde su `index.html` real, `revisar` avisa si un espejo quedó viejo —que es el
  error silencioso del asunto: la página carga igual y uno cree que prueba el juego
  cuando prueba una copia de hace meses— y `promover` migra un experimento aprobado a
  producción. Cada bloque de `lab.css` declara con `@destino` adónde va, y al promover
  las imágenes se mueven a `assets/img/` con la versión en el nombre y las rutas de
  `url()` se reescriben según dónde caiga el bloque. Lo que es criterio —fundir reglas
  duplicadas, repasar los cuatro juegos— queda impreso como lista al terminar.
- Documentado en `lab/README.md`, en el README principal y en `CLAUDE.md`.
- **Excepción a C-11, anotada y no ignorada en silencio:** un cambio que solo toca
  `lab/` no corre `set-version.py` ni sube el número de versión. Ese canon existe para
  que el navegador no mezcle archivos viejos y nuevos, y acá no cambió ningún archivo
  versionado: estampar `?v=` nuevo obligaría a todos los celulares a rebajar el JS y el
  CSS completos sin que haya nada nuevo que bajar.

**Primer experimento, descartado: insignias serigrafiadas.** Ilustraciones impresas por
juego en reemplazo del emoji, y después toda la interfaz llevada al mismo lenguaje: papel
con grano, tinta plana, sombras duras corridas y movimiento a saltos. No convenció y se
sacó. Queda en los commits `8efd11c` y `d5071c9` por si alguna vez se quiere rescatar.
El laboratorio vuelve a verse idéntico a la app, que es su estado correcto en reposo.

## 0.19.0 — 2026-09-10
- **Un celular ya no puede abrir salas sin parar.** Hay un tope por dispositivo (20 por hora, 80 por día) que ataja el caso realista: una pestaña en bucle o un error nuestro creando salas sin freno. El tope está muy por encima del uso legítimo más intenso, porque la revancha abre sala nueva y una tarde de partidas cortas son muchas salas seguidas (D-41).
- El tope se revisa **antes** de tocar la red, así que avisa al instante y no gasta una conexión para después descartarla.
- Si `localStorage` no está disponible (modo privado), se deja crear igual: dejar a un jugador legítimo sin jugar es peor que dejar pasar a un abusivo.

## 0.18.0 — 2026-09-10
- **Cuando no se puede abrir una sala, el juego ya no culpa a la internet del jugador.** Antes cualquier falla al crear sala decía "No se pudo conectar. ¿Hay internet?", incluso si el problema era el tope de conexiones del plan gratuito de Firebase. Ahora el mensaje dice lo que realmente se sabe y ofrece la salida que la app ya tenía: jugar en modo de un solo celular (D-40).
- Crear o entrar a una sala ahora **espera la conexión** (8 s) y tiene tope (12 s). Sin eso, quedarse sin señal se veía como un botón pegado para siempre.
- El mapa de errores de sala, que estaba copiado igual en los tres juegos, pasa a `assets/js/transport/errors.js`.
- La consola ya no registra errores previstos; solo los inesperados, que es lo que hace útil el criterio de "consola limpia" (C-12).

## 0.17.1 — 2026-09-10
- Fix del barrido de salas: un código apuntado cuya sala ya no existía dejaba ese día —y todos los siguientes— sin barrer para siempre. Las reglas no dejan borrar lo que no está, y eso se estaba tomando como un fracaso en vez de como trabajo hecho. Aparece seguido: basta que un barrido anterior se corte a medias.
- Fix del apunte en la papelera: cada jugador que entraba a una sala dejaba un `permission_denied` en la consola, porque intentaba apuntar un código que ya estaba. Ahora el apunte va separado del refresco de la marca, y el que crea la sala la apunta con la hora del servidor, así un celular con el reloj corrido no la deja en el balde equivocado.

## 0.17.0 — 2026-09-10
- **Las salas vencidas ahora se borran solas.** Antes una sala quedaba para siempre en Firebase y solo se limpiaba de casualidad, cuando una sala nueva sacaba su mismo código. Ahora cada celular apunta la sala que crea en una papelera por día y, cada 6 horas como mucho, barre en segundo plano lo que ya venció (D-39). Nada de esto se ve mientras se juega.
- Las reglas de Firebase suman el nodo `cleanup`: un balde de códigos solo se puede abrir 6 horas después de su último apunte, así que la papelera nunca delata una sala en juego.
- **Fix importante** en Línea de Tiempo: se podía colocar una carta que el jugador no eligió. La app dejaba preseleccionada la primera de la mano, así que si el toque se iba en scroll (la mano se desplaza a lo ancho), el jugador confirmaba y aparecía otra carta. Ahora no hay nada preseleccionado y el botón de confirmar **dice qué carta va a colocar** (D-38).

## 0.16.0 — 2026-09-10
- Línea de Tiempo: el **pozo común** pasa a ser la primera opción y viene elegido por defecto. Es el modo que más conversación genera, porque todos miran las mismas cartas.
- Línea de Tiempo: el campo **Tu nombre** ahora es grande y centrado, que es lo único que el jugador tiene que escribir.
- Línea de Tiempo: "Unirse a una sala" pasa a decir **"¿Tienes un código? ¡Únete!"**.

## 0.15.2 — 2026-09-10
- Mazo chileno: entran **Los Venegas** (1989), **Sucupira** (1996) y **Romané** (2000). Quedó en 127 cartas.

## 0.15.1 — 2026-09-10
- Mazo chileno: entran **Extra Jóvenes** (1986, con Katherine Salosny) y **Mekano** (1997, con José Miguel Viñuela). Quedó en 124 cartas.
- Fix de dato: el último Festival de Viña de Antonio Vodanovic fue **2004**, no 2005.

## 0.15.0 — 2026-09-10
- El chat de sala **sigue vivo en la pantalla de victoria o derrota**, en Línea de Tiempo y en Toque y Fama: el final es justo cuando hay algo que decir, sea para celebrar o para pedir la revancha. Ahora muere con la sala, no con la partida (D-35).
- Línea de Tiempo: cuando se equivoca otro, la pantalla dice **“¡Cata se equivocó!”** en vez de “¡Te equivocaste!”, y el fondo rojo queda solo en el celular del que falló (D-36).
- Mazo chileno: nueve cartas nuevas de tele y farándula (Miss Universo de Cecilia Bolocco, Viva el lunes, Morandé con Compañía, Rojo, Machos, el último Viña de Vodanovic, Los 80, El Chacotero Sentimental y Sábado Gigante en Estados Unidos).
- Mazo chileno: fuera las cartas que no se podían situar en el tiempo. El terremoto del 85 salió del mazo, y el incendio de Valparaíso y el movimiento estudiantil ahora dicen cuál fueron (D-37).

## 0.14.1 — 2026-09-10
- Línea de Tiempo: el texto que acompaña al enlace de la sala ahora dice la temática que eligió el anfitrión ("Únete a mi sala de Línea de Tiempo · 🍿 Cultura pop. Código: KMKB"), así quien lo recibe sabe a qué lo están invitando.

## 0.14.0 — 2026-09-10
- Línea de Tiempo estrena dos temáticas: **🇨🇱 Chile** (114 cartas, de la fundación de Santiago al estallido, con Colo-Colo, la Teletón y los 33 mineros en el camino) y **🍿 Cultura pop** (110 cartas de cine, tele, videojuegos, internet y memes).
- Las cartas **ya no se repiten** entre partidas seguidas: cada celular recuerda las que ha visto por temática y las deja fuera del mazo siguiente. Medido con diez partidas seguidas: cero repetidas entre una y la siguiente (D-34).
- Fix: la revancha en varios celulares perdía el ajuste de pozo común.

## 0.13.1 — 2026-09-10
- Línea de Tiempo: se quita la barra "Llevas …" que repetía la carta elegida justo encima de la mano. Mostraba lo mismo dos veces y parecía un control más (D-33).

## 0.13.0 — 2026-09-10
- Línea de Tiempo: nueva opción **pozo común** en la configuración. En vez de una mano privada por jugador, hay una sola tira de **6 cartas a la vista de todos**; cuando una sale, entra otra por el final. Gana quien coloque primero las cartas acordadas (D-32).
- El ajuste lo elige quien arma la partida y viaja en la sala: el que se une juega con lo que eligió el anfitrión.

## 0.12.0 — 2026-09-10
- Línea de Tiempo: **la ronda se juega completa**. Antes, apenas alguien se quedaba sin cartas se acababa la partida y ganaba quien jugara primero en el orden de turnos, que es una ventaja de sorteo. Ahora todos juegan la misma cantidad de turnos.
- Línea de Tiempo: si más de uno termina sin cartas, **gana quien respondió en menos tiempo**. El tiempo no se ve durante la partida; aparece al final, para cada jugador, en el ranking (D-31).
- Línea de Tiempo: la pantalla final muestra a cada jugador en una sola línea y ya no repite "sin cartas"; si dos tiempos caen en el mismo segundo, se muestran con una décima.

## 0.11.0 — 2026-09-09
- **Chat de sala en Toque y Fama** (modo dos celulares): mismo chat de Línea de Tiempo, con el módulo compartido. Disponible desde la sala de espera y mientras cada uno elige su número secreto, que es cuando más se espera. Muere con la partida y no aparece en el resultado.

## 0.10.4 — 2026-09-09
- Mismo arreglo de las cifras en los otros dos juegos: los **años de Línea de Tiempo** y las **casillas de Batalla Naval** (el aviso de cada disparo y la casilla grande del resultado) dejan Bangers y se leen sin confundir el 1 con el 7 (D-30).

## 0.10.3 — 2026-09-09
- Toque y Fama: **el 7 ya no se confunde con el 1**. Las cifras del teclado, las casillas, los intentos, las pistas y los números secretos pasan de Bangers a Nunito 900, que las distingue sin dudar (D-30). Los títulos y el botón de probar siguen igual.
- Toque y Fama: decía "1 intentos"; ahora dice "1 intento".

## 0.10.2 — 2026-09-09
- La pantalla de quien llega por un enlace de sala se titula **¡Invitado a jugar!** en vez de "¿Cómo jugamos?": no viene a configurar una partida, viene invitado a una que ya existe.

## 0.10.1 — 2026-09-09
- Chat de Línea de Tiempo: un mensaje nuevo se asoma unos segundos en una etiqueta al lado de la burbuja, con el nombre de quien escribe. El globito dice cuántos hay; la etiqueta, qué dijeron. Se puede tocar para abrir el chat.
- Los tres juegos con salas: quien llega por un enlace de invitación ya no ve el botón de **Crear sala** ni los ajustes de la partida, que son del anfitrión. Antes se podía abrir una sala distinta sin querer y quedar esperando en la sala equivocada (D-29).

## 0.10.0 — 2026-09-09
- **Chat de sala en Línea de Tiempo** (modo varios celulares): burbuja 💬 con globito de no leídos, disponible mientras esperan en la sala y durante la partida, para comentar las jugadas sin quedarse mirando el turno ajeno.
- El chat no aparece sobre las pantallas de acierto o error ni en el resultado, y muere con la partida: no se guarda en ninguna parte. Al reconectar se recupera la conversación de la sala, en silencio.
- Módulo compartido `assets/js/chat.js` listo para los demás juegos con salas, con su canon C-15.
- Reglas de Firebase: se valida el largo del texto de un mensaje.

## 0.9.6 — 2026-09-09
- Salas de Toque y Fama, Batalla Naval y Línea de Tiempo: botón **Compartir link** que abre el diálogo nativo del celular (WhatsApp, mensajes, copiar…). En navegadores sin ese diálogo sigue copiando al portapapeles.
- Pruebas de punta a punta dentro del repo (`tools/e2e/`) con guía de uso.

## 0.9.4 — 2026-09-09
- Fix Batalla Naval: en Safari de iPhone los números de fila (1 a 10) quedaban desalineados con las casillas y el 10 caía bajo la grilla. Las etiquetas ahora viven dentro de la misma grilla, como una fila y una columna más, así comparten el tamaño de las casillas en cualquier navegador. Verificado con cero píxeles de desfase en tres tamaños de pantalla.

## 0.9.3 — 2026-09-09
- Fix: el solitario de Línea de Tiempo mostraba “{tries}” en vez de “intentos” (se publicó a medias la versión anterior).

## 0.9.2 — 2026-09-09
- Línea de Tiempo: el modo contra el celular se reemplaza por **Jugar solo**: vaciar la mano en la menor cantidad de intentos, con récord personal por temática y tamaño de mano. Una IA no tenía sentido porque los años son públicos (D-27).

## 0.9.1 — 2026-09-09
- Línea de Tiempo: al equivocarse, la pantalla se tiñe de rojo, la carta se sacude y aparece una explicación de dónde iba el hito y dónde se puso. Se queda hasta que el jugador toca. Contra el celular no había señal visual del error y en varios celulares se cerraba a los dos segundos.
- Línea de Tiempo: el celular espera a que no haya un veredicto en pantalla antes de jugar, y un veredicto viejo ya no puede cerrar uno nuevo.

## 0.9.0 — 2026-09-09
- Línea de Tiempo en **varios celulares**, de dos a seis jugadores: sala con código y QR, lobby con quienes van llegando, el anfitrión abre la partida, cada uno ve su mano y el veredicto de cada jugada se muestra a todos.
- Reglas de Firebase ampliadas de dos a seis roles (A a F).
- Transporte: el reparto de roles ahora resuelve la carrera entre dos personas que entran a la vez, escribiendo un identificador de dispositivo y releyendo.
- Reconexión a mitad de partida y revancha que mueve a todos a la sala nueva.

## 0.8.2 — 2026-09-09
- Línea de Tiempo: la carta elegida queda fija en una barra sobre la línea mientras se busca dónde ponerla, con la mano atenuada detrás. Tocar la barra vuelve a la mano para cambiar de carta.

## 0.8.1 — 2026-09-09
- Línea de Tiempo: el botón “Colocar aquí” ahora flota sobre la línea. Con doce o más hitos quedaba fuera de la pantalla y había que desplazarse para confirmar.

## 0.8.0 — 2026-09-09
- Cuarto juego: **Línea de Tiempo / Timeline**. Ubica hitos sin fecha en el orden correcto; gana quien se queda sin cartas.
- Dos temáticas: Historia (98 hitos) y Música (89). Agregar una temática nueva es solo un archivo de datos.
- Modos: un celular de 2 a 6 jugadores y contra el celular con tres niveles. Varios celulares queda para la fase 2.
- Mazo determinista por semilla, memoria de partida, motor con tests.
- Canon C-7: `from`, `at` e `id` son campos reservados del transporte.

## 0.7.0 — 2026-09-09
- **Memoria de partida en todos los juegos y modos**: Toque y Fama y Batalla Naval ahora se pueden retomar también en un celular y contra el celular (antes solo en dos celulares). Nuevo módulo compartido `assets/js/session.js`; Cuarto Rey migrado a la misma clave.
- Batalla Naval: se conserva incluso la flota a medio colocar.
- Nuevo `docs/CANONES.md` con los estándares de construcción de todos los juegos (C-1 a C-14) y `CLAUDE.md` que lo enlaza. Decisiones D-25 y D-26; requerimientos RP-16 y RP-17.

## 0.6.4 — 2026-09-09
- Batalla Naval: tocar fuera de la grilla deselecciona el barco seleccionado.

## 0.6.3 — 2026-09-09
- Batalla Naval: botón ↻ del barco seleccionado más grande (40 px visibles, 52 px de área táctil) para tocarlo bien en el celular.

## 0.6.2 — 2026-09-09
- Batalla Naval: al colocar la flota, tocar un barco en la grilla lo selecciona (amarillo) y muestra un botón ↻ en su esquina para girarlo ahí mismo; con un barco seleccionado, tocar una casilla vacía lo mueve. Al seleccionar otro, color y botón desaparecen.

## 0.6.1 — 2026-09-08
- Batalla Naval, mejoras de usabilidad tras revisión visual: tableros del resultado que ya no se salen de la pantalla; orientación del barco (↔/↕) siempre visible en el botón Girar; último disparo recibido resaltado en la flota propia; texto “¡Tocado! Sigues disparando” sin signos duplicados.

## 0.6.0 — 2026-09-08
- Tercer juego: **Batalla Naval / Battleship** con tres modos (un celular, dos celulares sobre Firebase, contra el celular con IA). Colocación de flota por toque, girar, arrastrar y al azar; tiro extra al acertar; compromiso de la flota con hash y verificación; reconexión y revancha; sonidos de agua, impacto, hundimiento y sirena.
- Módulos compartidos nuevos: `assets/js/transport/` (antes en Toque y Fama) y `assets/js/handoff.js`.
- Tarjetas del menú: Toque y Fama y Batalla Naval dicen “1–2 jugadores”.
- Diseño de Batalla Naval aprobado (`docs/juegos/batalla-naval.md`): reglas, modos, colocación, protocolo, IA y plan. Requerimientos BN-01..10, decisiones D-23 y D-24. Tarjeta “Batalla Naval · próximamente” en el menú.

## 0.5.1 — 2026-09-08
- Fix Toque y Fama (un celular): tras un intento se mostraba directo “Pásale el celular” sin la respuesta de toques y famas. Ahora se ve la respuesta y, debajo, el pase al otro jugador en una sola pantalla.

## 0.5.0 — 2026-09-08
- Menú: base de 100 frases por idioma (`assets/js/frases.js`), casi todas de humor de carrete y unas pocas sobre agua, moderación y manejar sobrio. Se barajan en cada carga y rotan cada 10 s.

## 0.4.9 — 2026-09-08
- Toque y Fama: el subtítulo “Parte X” (quién partió) se reemplaza por “Ronda N”; era redundante, sobre todo contra el celular.

## 0.4.8 — 2026-09-08
- Toque y Fama: espacio bajo el título “¿Cómo jugamos?” (y el de la sala).

## 0.4.7 — 2026-09-08
- Menú: los mensajes del pie duran 10 segundos (antes 5) y tienen la fuente más grande y más contraste.

## 0.4.6 — 2026-09-08
- Fix: el menú podía quedar sin juegos tras una actualización si el navegador mezclaba `index.html` nuevo con `i18n.js` en caché. Ahora la lista de juegos se dibuja antes de cualquier decoración y las decoraciones no pueden romperla.
- Toque y Fama: pistas abreviadas en los tableros (3F 1T / 3B 1C) para que no se partan de línea.
- Versionado de archivos con import maps (`tools/set-version.py`): cada publicación cambia la URL de todos los módulos y estilos.

## 0.4.5 — 2026-09-08
- Menú: el dado del encabezado se transforma cada 3 segundos en otros emojis festivos (cervezas, dardo, martini, globos, sushi…) con giro y fundido.
- Menú: pie con 20 mensajes rotativos (consejos con humor y citas breves) en español e inglés, cambian cada 5 segundos con fundido.

## 0.4.4 — 2026-09-08
- Identidad de la app neutral entre juegos: ícono y título con 🎲 en vez de 🍻, textos “para jugar con amigos” y “guíe la partida” en vez de “carrete”, descripción del repo actualizada.

## 0.4.3 — 2026-09-08
- Toque y Fama: desplegable “Ver todos los intentos” en el resultado, colapsado por defecto.
- Toque y Fama: “Cómo se juega” explica que debes adivinar el número secreto de tu contendor; botón “¡Vamos!” al fijar el número; tarjeta del menú dice “Adivina el número secreto”.
- Estilos de panel desplegable movidos a `base.css`.

## 0.4.2 — 2026-09-08
- Toque y Fama: pulsación larga sobre una cifra del teclado para bloquearla como “no está en el número del rival”; marcas por jugador, persistentes en la partida, con instrucción en pantalla.

## 0.4.1 — 2026-09-08
- Toque y Fama: recordatorio del número propio al adivinar (oculto con toque para ver en modo un celular).
- Toque y Fama: en pantalla se habla siempre de “número secreto” en vez de “secreto”.

## 0.4.0 — 2026-09-08
- Segundo juego: **Toque y Fama / Bulls and Cows** con tres modos: un celular (pasar y jugar), contra el celular (duelo con solver) y dos celulares (sala con código y QR sobre Firebase Realtime Database).
- Motor puro con tests (`engine.test.mjs`), reductor de mensajes único para los tres modos, compromiso del secreto con sal privada y verificación al final, reconexión y revancha.
- Proyecto de Firebase `juegos-de-salon` creado; reglas de seguridad en `firebase/database.rules.json`.
- Estilos de transición entre turnos movidos a `base.css` para reutilizarlos.
- README reorganizado por juego, con capturas de ambos.
- Estudio de factibilidad de Toque y Fama (`docs/juegos/toque-y-fama-factibilidad.md`), decisiones D-18 a D-21.

## 0.3.0 — 2026-09-08
- Sonidos sintetizados (Web Audio) en las acciones clave: botones, volteo y descubrimiento de carta, brindis, reyes, temporizador, dados, pase de celular, final y error. Botón 🔊/🔇 en menú y juego.
- Capturas de pantalla en el README (`docs/screenshots/`).

## 0.2.0 — 2026-09-08
- Idioma español / inglés con toggle en el menú y en la intro del juego (se recuerda en el dispositivo).
- Cuarto Rey traducido completo: reglas, mini-juegos, penitencias, categorías, ideas de Nunca Nunca e interfaz.
- Transición entre turnos: "¡Salud!" con quiénes toman → "Pásale el celular a X" → carta nueva entra animada.
- Carta boca abajo más grande (80 % del ancho) con brillo; al descubrirse gira y se encoge para dejar espacio a las instrucciones.
- Fix: el atributo `hidden` ahora siempre oculta (base.css).

## 0.1.0 — 2026-09-08
- Menú principal con registro de juegos.
- Primer juego: **Cuarto Rey** (intro, setup de 4 a 6 jugadores con género, mesa con carta animada, todas las reglas A–K, mini-juegos con ayudas, penitencias, regalo de sorbos, contador de reyes, final con ranking).
- Persistencia de partida y jugadores en localStorage.
- Manifest PWA, wake lock, vibración, confeti.
- Documentación: requerimientos, decisiones, guía para agregar juegos y especificación del juego.
