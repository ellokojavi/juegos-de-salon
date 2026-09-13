# Changelog

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
