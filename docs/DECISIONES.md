# Decisiones de diseño y arquitectura

Registro tipo ADR (Architecture Decision Record). Las decisiones se numeran y no se borran: si una cambia, se agrega una nueva que la reemplaza.

## D-01 · Stack: HTML/CSS/JS puro, sin build
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Sitio estático con módulos ES nativos. Sin bundler, sin framework, sin `package.json`.
**Por qué:** Se publica directo en GitHub Pages, cualquiera puede leer y modificar el código, y la complejidad de los juegos de salón no justifica un framework. Cumple RP-10.
**Consecuencias:** Hay que servir por HTTP en local (`python3 -m http.server`). Si el proyecto crece mucho (decenas de juegos, estado compartido), se reevalúa.

## D-02 · Un juego = una carpeta con su propia URL
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Cada juego vive en `/<id>/` con su `index.html`, `game.js`, `rules.js` y `style.css`. El menú se genera desde `assets/js/games.js`.
**Por qué:** URLs compartibles por juego, aislamiento total entre juegos (uno roto no rompe a los demás) y facilidad para agregar juegos (ver [AGREGAR-JUEGO.md](AGREGAR-JUEGO.md)).

## D-03 · Datos separados de la lógica
**Decisión:** Las reglas, textos, penitencias y categorías viven en `rules.js` como datos puros. `game.js` solo contiene la máquina de estados y el render.
**Por qué:** Permite ajustar reglas y variantes (CR-17) sin tocar lógica, y eventualmente cargar variantes desde JSON.

## D-04 · Orden de asiento = orden de ingreso, hacia la derecha
**Decisión:** Los jugadores se anotan en el orden en que están sentados, avanzando hacia la derecha. Así, el “compañero de la derecha” del jugador N es el N+1 y el de la izquierda es el N−1 (circular). El turno también avanza hacia la derecha.
**Por qué:** Es la convención más natural para pasar el celular por la mesa y permite que la app nombre a las personas (CR-06) en vez de solo decir “el de la derecha”.

## D-05 · Género para J y Q
**Decisión:** Al ingresar jugadores se elige ♂ hombre, ♀ mujer o ⚧ otro. J hace tomar a ♂ y ⚧; Q hace tomar a ♀ y ⚧. Si no hay nadie del género que corresponde, toma quien sacó la carta.
**Por qué:** Las reglas originales usan género. “Otro” toma en ambas para no dejar a nadie fuera de la fiesta (regla de la casa, documentada y fácil de cambiar en `resolveTargets`).

## D-06 · Fin de partida con el cuarto rey
**Decisión:** Al salir el cuarto rey, ese jugador se toma el vaso y la partida termina con pantalla final y opción de “otra ronda” con mazo nuevo y los mismos jugadores.
**Por qué:** Es la versión más común del juego y evita rondas largas sin tensión después del cuarto rey. Se descartó “seguir hasta agotar el mazo” (queda como variante posible, CR-17).

## D-07 · Mini-juegos: reglas + ayudas simples, no implementación completa
**Decisión:** Cuenta Cuentos, Chancho Inflado, Cultura Chupística y Nunca Nunca se juegan de viva voz. La app explica las reglas, indica quién parte y ofrece ayudas: temporizador de 5 s, categoría al azar, idea de “nunca nunca”, y selector de perdedor (suma 2 sorbos).
**Por qué:** Estos juegos son sociales por naturaleza; llevarlos a pantalla les quita gracia y alarga la versión inicial. Una implementación completa queda como mejora futura.

## D-08 · Chancho Inflado es “diferido”
**Decisión:** Quien saca el 6 puede inflar las mejillas en cualquier momento posterior. La app lo explica y deja marcar al perdedor de inmediato o seguir jugando (“Nadie perdió / seguir”).
**Por qué:** Así se juega habitualmente en Chile; la sorpresa es la gracia.

## D-09 · Contador de sorbos aproximado
**Decisión:** La app lleva un ranking de sorbos por jugador solo con fines lúdicos (pantalla final). Cuenta automáticamente las reglas deterministas y suma 2 sorbos al perdedor de mini-juegos o al que se arruga en una penitencia. El cuarto rey se cuenta como “fondo”.
**Por qué:** Da un cierre entretenido sin obligar a los jugadores a registrar nada durante el juego.

## D-10 · Persistencia en localStorage
**Decisión:** La partida completa (`juegos-de-salon:cuarto-rey:game`) y la lista de jugadores (`juegos-de-salon:players`) se guardan en `localStorage` tras cada acción. Al abrir el juego se ofrece “Continuar”.
**Por qué:** El celular pasa de mano en mano y se bloquea o cierra fácil. No se usa servidor (privacidad, RP-10).

## D-11 · Identidad visual
**Decisión:** Fondo oscuro morado/azul con degradados y luces flotantes; acentos neón (rosado `#ff2e88`, amarillo `#ffd23f`, cian `#2ee6d6`, lima). Titulares en **Bangers** (cómic/fiesta), cuerpo en **Nunito** (redonda, legible). Botones grandes tipo “pill” con sombra sólida y rebote al presionar. Animaciones: volteo 3D de carta, pop de textos, confeti en el cuarto rey y al final.
**Por qué:** Refleja el ambiente de carrete nocturno pedido en RP-07, mantiene legibilidad con poca luz y respeta `prefers-reduced-motion`.

## D-12 · El celular reemplaza al mazo físico
**Decisión:** No se pide un naipe real: la app baraja 52 cartas y muestra la carta con palo y número.
**Por qué:** Cumple RP-06 (el celular guía) y evita desincronización entre mazo real y app. Si un grupo quiere usar naipe real, es una variante posible (CR-17).

## D-13 · Publicación en GitHub Pages desde `main`
**Decisión:** Repo público `ellokojavi/juegos-de-salon`, Pages sirviendo la raíz de `main`, con `.nojekyll`.
**Por qué:** Cero configuración de CI; cada push publica. La URL de GitHub Pages (`ellokojavi.github.io/juegos-de-salon/`) quedó después detrás del dominio propio https://juegosdesalon.cl/, y redirige con un 301.

## D-14 · Transición entre turnos como overlay de dos etapas
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Al cerrar una carta, un overlay a pantalla completa muestra (1) "¡Salud!" con los que toman, que avanza solo a los 2,6 s o al tocar, y (2) "Pásale el celular a X" con el botón "¡Dame la carta!". El estado del juego avanza antes de mostrar el overlay y la mesa se redibuja detrás.
**Por qué:** Separa tres momentos que antes se pisaban: decidir quién toma, tomar, y que el siguiente jugador reciba el celular listo para sacar carta (CR-19). Avanzar el estado primero garantiza que, si se cierra el navegador en la transición, la partida se retoma en el turno correcto.

## D-15 · Carta grande que se encoge al descubrirse
**Decisión:** Boca abajo la carta mide el 80 % del ancho (máx. 340 px) con brillo pulsante; al tocarla gira en 3D (0,75 s), se encoge al 38 % (0,5 s) y recién ahí aparece el panel de instrucciones. El tamaño del pip se define con unidades de contenedor (`cqw`) para que escale con la carta.
**Por qué:** Un objetivo grande es más fácil de tocar en una mesa con poca luz (CR-20), y encoger la carta deja las instrucciones visibles sin scroll en la mayoría de los celulares.

## D-16 · Internacionalización simple con diccionarios por idioma
**Decisión:** Un módulo compartido `assets/js/i18n.js` guarda el idioma en `localStorage` (`juegos-de-salon:lang`, por defecto `es`), entrega un toggle ES/EN y aplica textos estáticos vía atributos `data-i18n`. Cada juego expone `LOCALES = { es, en }` en su `rules.js` con reglas, mini-juegos, listas y textos de interfaz; la lógica del juego solo lee `LOCALES[lang]`. Cambiar de idioma recarga la página.
**Por qué:** Cumple RP-15 sin librerías ni build. Los datos por idioma viven junto a cada juego, así que agregar un juego o un idioma no toca el resto. Recargar al cambiar es más simple y seguro que re-renderizar todo en caliente, y no afecta la partida guardada.
**Consecuencias:** Las claves de las listas (penitencias, categorías) no son equivalentes uno a uno entre idiomas: la versión inglesa adapta referencias chilenas a genéricas. Una partida guardada en un idioma se retoma en el idioma activo.

## D-17 · Sonidos sintetizados con Web Audio, sin archivos
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Los efectos (`assets/js/sound.js`) se generan con osciladores y ruido filtrado en Web Audio: click de botón, whoosh al voltear, pop al descubrir, clink de brindis, glug al tomar, fanfarria de rey (corta) y de cuarto rey (grande, con tambor), tic y bocina del temporizador, dado al pedir otra opción, whoosh al pasar el celular, fanfarria final y buzz de error. El audio se desbloquea con el primer toque y hay un botón 🔊/🔇 persistente (`juegos-de-salon:muted`).
**Por qué:** Cumple RP-14 sin descargar ni licenciar archivos de audio, mantiene el sitio liviano y sin dependencias (D-01), y evita el problema de iOS con audio no iniciado por gesto del usuario. Si más adelante se quieren sonidos "reales", basta reemplazar la implementación de `SFX` manteniendo la misma interfaz.
**Consecuencias:** El sonido se apaga con el toggle pero no con el modo silencio del celular en todos los navegadores (iOS Safari sí respeta el switch físico para Web Audio en la mayoría de versiones).

## D-18 · Transporte para juegos con varios celulares
**Fecha:** 2026-09-08 · **Estado:** vigente (aprobada por el dueño del proyecto)
**Decisión:** Los juegos con dos o más celulares hablan con una interfaz `Transport` (`createRoom`, `joinRoom`, `send`, `onMessage`, `onPresence`, `leave`). La primera implementación remota sería **Firebase Realtime Database** (salas por código de 4 letras, mensajes append-only, expiración a 6 h); se mantiene un transporte `local` para jugar en un solo celular.
**Por qué:** Desde GitHub Pages no hay servidor; una base en tiempo real gratuita funciona entre redes distintas (4G y Wi‑Fi), da reconexión y estado persistente sin código propio, y sirve para futuros juegos de 4 a 6 celulares. WebRTC (PeerJS o QR) queda como alternativa sin cuenta, limitada por NAT fuera de la misma Wi‑Fi. Detalle y comparación en [juegos/toque-y-fama-factibilidad.md](juegos/toque-y-fama-factibilidad.md).
**Consecuencias:** Proyecto de Firebase `juegos-de-salon` creado el 2026-09-08 (plan Spark, sin Analytics ni Gemini). Reglas publicadas y versionadas en `firebase/database.rules.json`; configuración pública en `assets/js/firebase-config.js`. Ver [firebase/README.md](../firebase/README.md).

## D-19 · Quién parte en Toque y Fama: determinista, sin sorteo
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** En la primera partida parte el invitado (rol B); en la revancha parte quien perdió (en empate, quien no partió). No hay sorteo.
**Por qué:** El sorteo con nonces públicos propuesto en el estudio era manipulable: quien confirma segundo ve el nonce del otro y puede elegir el suyo. Además, un sorteo asíncrono (SHA-256) impedía reconstruir la partida de forma síncrona al reconectar. Con el derecho a réplica activado, la ventaja de partir es mínima, así que una regla fija es justa, simple y reproducible en ambos celulares.

## D-20 · Un solo reductor de mensajes para los tres modos
**Decisión:** El estado de una partida de Toque y Fama se reconstruye siempre desde una lista de mensajes (`hello`, `commit`, `guess`, `reply`, `reveal`, `rematch`), tanto en un celular (transporte en memoria) como en dos (Firebase). En modo un celular ambos roles son locales; contra el celular, el rol B es un bot con solver por eliminación.
**Por qué:** Una sola lógica de juego probada en los tres modos; la reconexión es solo “volver a leer los mensajes”; y el mismo esquema sirve para futuros juegos con varios celulares.
**Consecuencias:** Toda regla de turno vive en `view()` (derivada), nunca en variables sueltas. Los mensajes se procesan en serie para evitar carreras.

## D-21 · Compromiso del secreto con sal privada
**Decisión:** Al fijar el secreto se publica `sha256(secreto + sal)` con una sal aleatoria privada de 16 bytes; al final se revela secreto y sal, y cada celular verifica el hash y recalcula todas las respuestas del rival.
**Por qué:** Con solo 5040 secretos posibles, un hash sin sal se rompe por fuerza bruta en milisegundos. La sal privada lo impide y la revelación final permite detectar respuestas falsas.

## D-22 · Versionado de archivos con import maps para evitar caché mezclada
**Fecha:** 2026-09-08 · **Estado:** vigente
**Decisión:** Cada página lleva un `<script type="importmap">` que mapea todos los módulos JS del sitio a su ruta con `?v=VERSION`, y las hojas de estilo llevan el mismo sufijo. Se estampa con `python3 tools/set-version.py X.Y.Z` en cada publicación. Además, el menú dibuja la lista de juegos antes de cualquier decoración y las decoraciones van en `try/catch`.
**Por qué:** GitHub Pages y los navegadores cachean cada archivo por separado (10 minutos en Pages). Tras una publicación, un celular podía recibir el `index.html` nuevo con un `i18n.js` viejo; el código nuevo esperaba datos que el archivo viejo no tenía, fallaba, y el menú quedaba vacío (ocurrió con la v0.4.5). Con el import map, cambiar la versión cambia la URL de todos los módulos, incluidos los importados por otros módulos y los `import()` dinámicos, así que una página nueva siempre trae JS nuevo.
**Consecuencias:** Hay que correr el script al publicar (queda documentado en el README y en AGREGAR-JUEGO). Los import maps funcionan en Chrome 89+, Safari 16.4+ y Firefox 108+; en navegadores más antiguos los módulos cargan igual, solo sin el sufijo.

## D-23 · Reglas de Batalla Naval v1
**Fecha:** 2026-09-08 · **Estado:** vigente (aprobada por el dueño del proyecto)
**Decisión:** Tablero 10×10, flota clásica de 5 barcos, barcos que pueden tocarse (solo no superponerse), tiro extra al acertar (configurable, por defecto sí), parte el invitado y en la revancha el perdedor, sin réplica.
**Por qué:** Es la versión más conocida, la más rápida de colocar en un celular y la más dinámica de jugar. El tiro extra es la costumbre chilena. La regla de “sin contacto” y la flota de 10 barcos quedan como variantes futuras porque alargan la colocación y la partida.
**Consecuencias:** Con tiro extra un turno es una secuencia de disparos; el reductor calcula quién dispara a partir del historial completo, no de un contador de turnos. No hay réplica porque el segundo jugador ya tuvo su secuencia completa cuando el primero termina.

## D-24 · Transportes compartidos entre juegos
**Decisión:** `local.js` y `firebase.js` pasan de `toque-y-fama/transport/` a `assets/js/transport/`, parametrizados por `game`. Toque y Fama y Batalla Naval los importan desde ahí.
**Por qué:** Evita duplicar la lógica de salas, presencia y reconexión; cualquier juego futuro con varios celulares la reutiliza (D-18).

## D-25 · Memoria de partida en todos los modos y de todos los juegos
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** Todos los juegos guardan la partida en curso con `assets/js/session.js` (clave `juegos-de-salon:<id>:session`, caducidad 12 h) en **todos** los modos, y ofrecen "Continuar" en la intro. Los juegos con reductor guardan la lista de mensajes y retoman reproduciéndola con `createLocalTransport({ seed })`; los datos privados (número secreto, flota, notas) van aparte en `private`.
**Por qué:** Había disparidad: Cuarto Rey guardaba siempre, mientras Toque y Fama y Batalla Naval solo guardaban en modo dos celulares, así que salir al menú o recargar perdía la partida en un celular y contra el celular. Es el caso más común en un carrete: alguien toca "Menú" sin querer.
**Consecuencias:** Queda como canon C-6, obligatorio para los juegos futuros. Cuarto Rey migró a la clave común leyendo la antigua una vez.

## D-26 · Cánones escritos en el repo
**Decisión:** `docs/CANONES.md` reúne las reglas de construcción de todos los juegos (C-1 a C-14) con una lista de chequeo final, y `CLAUDE.md` en la raíz apunta a él para que se cargue como contexto al abrir el proyecto.
**Por qué:** Las convenciones estaban repartidas entre decisiones sueltas y el código de cada juego. Un solo archivo evita que cada juego nuevo redescubra o contradiga lo ya acordado.

## D-27 · Línea de Tiempo: solitario en vez de IA
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** El modo individual de Línea de Tiempo es un solitario con puntaje (vaciar la mano en la menor cantidad de intentos, con récord por temática y tamaño de mano), no una partida contra el celular.
**Por qué:** Toda la información del juego es pública: la máquina conoce los años, así que solo podía ganar o dejarse ganar a propósito. Eso no es un rival, es un número al azar. Un récord personal sí da motivo para volver a jugar.
**Consecuencias:** El canon C-5 admite que el tercer modo sea "contra el celular" o "jugar solo", según el juego tenga o no información oculta que le dé sentido a una IA.

## D-28 · Chat de sala solo en varios celulares
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** Línea de Tiempo estrena un chat de texto en la sala y durante la partida, con el módulo compartido `assets/js/chat.js`. Está disponible únicamente en el modo de varios celulares, no aparece sobre el veredicto de una jugada ni en la pantalla final, y no se guarda en ninguna parte: muere con la partida.
**Por qué:** En varios celulares el turno ajeno es tiempo muerto y la gracia del juego es discutir si el hito va antes o después. En un celular la conversación ya ocurre en voz alta y en el solitario no hay con quién hablar, así que un chat ahí solo sería ruido. Las pantallas de acierto y error existen para que el jugador lea una explicación corta (C-8b): un chat encima competiría con eso.
**Cómo:** Los mensajes viajan por el mismo transporte que las jugadas (`{ t: 'chat', text }`), pero el reductor los dibuja y los olvida, y devuelve una marca para **no** volver a dibujar la partida: si el chat viviera dentro de `#screen-play`, cada mensaje recibido borraría lo que el jugador está escribiendo. Por eso el chat tiene su propio contenedor, hermano de `#handoff`, y por eso queda debajo de ese overlay en z-index, que es todo lo que se necesita para que el veredicto lo tape.
**Detalle (v0.10.1):** Además del globito de no leídos, el mensaje nuevo se asoma unos segundos en una etiqueta al lado de la burbuja. El globito responde "cuántos" y la etiqueta "qué": sin ella, saber qué dijeron obliga a abrir el chat justo cuando puede estar por llegar el turno.
**Consecuencias:** Queda como canon C-15 para los demás juegos con salas; en v0.11 se enciende también en Toque y Fama, donde la espera del número secreto del rival es el rato más muerto de todos. En el celular, el teclado no achica la ventana: el panel se levanta con `visualViewport` y el campo usa 16 px exactos para que iOS no haga zoom. Se agregan límites (120 caracteres, un mensaje cada 1,2 s) y las reglas de Firebase validan el largo del texto. La sala se lee con solo saber el código de cuatro letras: el chat **no es privado** y así se documenta.

## D-29 · El enlace de sala solo deja unirse
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** Al abrir un enlace `?sala=CÓDIGO`, la pantalla de datos se titula "¡Invitado a jugar!" y muestra únicamente el bloque para unirse a esa sala: sin botón de "Crear sala", con el código fijo y de solo lectura, y sin los ajustes de la partida. Vale para los tres juegos con salas.
**Por qué:** Quien recibe una invitación veía la misma pantalla que quien empieza de cero, con "Crear sala" arriba y el código abajo. Tocar el botón de arriba abre una sala **distinta**, y los dos quedan esperándose en salas separadas sin entender por qué. Los ajustes (dígitos, temática, cartas en mano, reglas de disparo) tenían el mismo problema al revés: se podían tocar y no hacían nada, porque la configuración es la del anfitrión.
**Consecuencias:** Queda en el canon C-7. La pantalla del invitado dice de quién es la sala y que la partida la configura quien invitó. Prueba: `tools/e2e/enlace-invitacion.mjs`.

## D-30 · Las cifras no van en Bangers
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** En Toque y Fama, todo lo que es número (teclado, casillas de entrada, lista de intentos, pistas, número secreto propio y números revelados al final) pasa de Bangers a Nunito 900 con `font-variant-numeric: tabular-nums`, con el token compartido `--font-num`. Bangers se queda en los títulos, los nombres y el botón de probar.
**Por qué:** Jugadores reales reclamaron que el **7 se ve igual que el 1** en el teclado. Es cierto: en Bangers los dos son un trazo inclinado con un ganchito arriba, y a tamaño de tecla no se distinguen. En un juego que consiste en leer y comparar cifras, eso no es un detalle de estilo: es el juego funcionando mal.
**Consecuencias:** Queda en el canon C-1 y vale para cualquier juego nuevo. El teclado se ve menos "de fiesta", pero se lee. Se aplicó también a los años de Línea de Tiempo (y a las cartas que quedan en cada mano) y a las coordenadas de Batalla Naval: la casilla del aviso va en su propio `span`, porque el resto de la frase sigue en Bangers. Los números de fila de la grilla ya estaban en Nunito.

## D-31 · Línea de Tiempo: la ronda se termina y el empate lo gana el más rápido
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** La partida ya no termina en el instante en que alguien se queda sin cartas: se completa la ronda, así todos juegan la misma cantidad de turnos. Si más de uno termina sin cartas, gana quien haya acumulado **menos tiempo respondiendo**. El tiempo no se muestra durante la partida; aparece al final, para cada jugador, en el ranking.
**Por qué:** Antes ganaba automáticamente el que jugaba primero en el orden de turnos, que es una ventaja repartida por sorteo y no por mérito. Con la ronda completa, todos tienen las mismas oportunidades, y el desempate premia algo que el juego sí mide: quién resolvió más rápido.
**Cómo:** Cada dispositivo cronometra el turno desde que el jugador ve el tablero (después de la pantalla de pase o del veredicto anterior) hasta que confirma, y manda ese `ms` dentro del mensaje `place`. El motor lo suma por jugador y lo usa solo para desempatar; con `ms` ausente cuenta cero, así que las partidas guardadas antes de este cambio se siguen reproduciendo sin romperse. El fin de ronda es `moves.length % players.length === 0`.
**En pantalla:** El ranking muestra el tiempo de cada jugador en segundos; si dos caen en el mismo segundo, todos pasan a mostrarse con una décima, porque si no el orden parecería arbitrario justo cuando el tiempo es lo que decidió la partida. La fila del ranking no repite "sin cartas" (ya lo dice la nota de arriba), así cada jugador cabe en una línea.
**Consecuencias:** Cada jugada tiene un tope de 5 minutos (`MAX_MOVE_MS`): una ida al baño no puede decidir un desempate. Si alguien recarga la página a mitad de su turno, el cronómetro de ese turno parte de nuevo; se prefiere eso a guardar relojes en la sesión. El tiempo lo mide y lo declara el propio dispositivo del jugador: no es a prueba de tramposos y no pretende serlo (el canon C-10 es para la información oculta, no para esto). Un empate exacto al milisegundo sigue siendo posible y se muestra como empate.

## D-32 · Línea de Tiempo: pozo común
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** La pantalla de configuración ofrece dos formas de repartir: **mano propia** (la de siempre) o **pozo común**, donde hay una sola tira de **6 cartas a la vista de todos** y cada uno juega de ahí. Cuando una carta sale de la tira —porque entró a la línea o porque se falló— entra otra del mazo **por el final**, así el orden de las que ya estaban no cambia. Con pozo común gana quien coloque primero la cantidad de cartas acordada; el selector que decía "Cartas en mano" pasa a decir "Cartas para ganar".
**Por qué:** Con mano propia cada uno juega su suerte: te puede tocar una mano fácil o una imposible, y nadie más ve lo que tienes. Con el pozo común todos miran las mismas cartas, así que el mérito es de quien elige mejor, y se puede comentar la jugada del otro (que es justo lo que hace el chat).
**Cómo:** El motor recibe `shared` y `visible`; la tira se deriva igual que todo lo demás, de la semilla más la lista de jugadas, así que los dispositivos llegan a la misma tira sin mensajes extra (canon C-7). Una carta fallada **no** vuelve a la tira: el veredicto acaba de mostrar su año a todo el mundo, así que dejarla sería regalarle el punto al siguiente. El ajuste viaja en la `config` de la sala, de modo que el que se une juega con lo que eligió el anfitrión.
**Por defecto (v0.16):** El pozo común quedó como opción marcada al abrir la configuración, y en la lista va primero. Con mano propia cada uno mira su mano en silencio; con el pozo común todos miran lo mismo y la partida se comenta sola, que es lo que se busca en un juego de salón.
**Consecuencias:** El final por meta se combina con lo de D-31: la ronda se juega completa y, si más de uno llega a la meta, gana el más rápido. Si el mazo se acaba, gana quien colocó más. El récord del solitario se guarda aparte (`tema:cartas:pozo`), porque son dos juegos distintos. El marcador muestra `colocadas/meta` en vez de las cartas que quedan.

## D-33 · Fuera la barra de "Llevas"
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Se elimina la barra fija que repetía, sobre la línea, la carta que el jugador tenía elegida ("Llevas … Cambiar ↑"). La carta elegida se sigue marcando en la mano (borde amarillo, el resto atenuado) y se dibuja dentro de la ranura elegida antes de confirmar.
**Por qué:** Se agregó para que no se perdiera de vista la carta al recorrer una línea larga, pero en la práctica queda pegada justo encima de la mano, mostrando la misma carta dos veces a dos centímetros de distancia. Probándolo en un celular real se ve redundante y confunde: parece un control más, no un recordatorio.
**Consecuencias:** Con una línea muy larga y sin ranura elegida todavía, el jugador ya no tiene el recordatorio a la vista. Si vuelve a molestar, la salida no es reponer la barra sino mostrarla **solo** cuando la mano se sale de la pantalla.

## D-34 · Mazos de Chile y cultura pop, y cartas que no se repiten
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Se agregan dos temáticas, **🇨🇱 Chile** (114 cartas) y **🍿 Cultura pop** (110), y un mecanismo para que jugar seguido no repita los mismos hitos: cada celular recuerda las cartas vistas por temática y, al armar una partida, las más recientes quedan fuera del mazo. La lista de excluidas viaja en `config.skip`.
**Por qué:** El juego funcionaba igual de bien en Santiago que en Oslo, que es otra manera de decir que no tenía nada propio. El mazo chileno es lo único de la app que hace que alguien diga "esta la sé". Y con noventa cartas y partidas de veinte, jugar tres veces la misma noche empezaba a mostrar las mismas cartas: eso mata la gracia de un juego que se trata de no saber.
**Cómo:** El filtro se aplica sobre la lista de cartas **antes** de barajar, así que sigue siendo determinista y todos los dispositivos de una sala arman el mismo mazo (canon C-7). Se guarda un máximo de 200 ids por temática y se excluyen solo las últimas, dejando siempre al menos 70 cartas disponibles: con manos de siete y seis jugadores nunca falta mazo. Una partida guardada de antes, sin `skip`, se sigue reproduciendo igual.
**Consecuencias:** Medido con diez partidas seguidas de la misma temática: **cero cartas repetidas entre una partida y la siguiente**, y 70 hitos distintos en 80 repartidos. La memoria es por celular, no por sala: quien crea la partida es el que aporta su historial, que es lo razonable porque es quien más ha jugado.

## D-35 · El chat sigue vivo en la pantalla final
**Fecha:** 2026-09-10 · **Estado:** vigente · **Revisa:** D-28
**Decisión:** El chat de sala ya no se apaga al terminar la partida: sigue disponible en la pantalla de victoria o derrota, en Línea de Tiempo y en Toque y Fama. Muere con la **sala**, no con la partida; la revancha crea una sala nueva y empieza con el chat en blanco.
**Por qué:** El final es justo cuando la gente tiene algo que decir: el que ganó quiere celebrarlo y el que perdió quiere reclamar o pedir revancha. Apagar el chat ahí cortaba la conversación en su mejor momento, y obligaba a coordinar la revancha fuera de la app. La razón original para apagarlo (que no compitiera con las pantallas de veredicto, D-28) sigue valiendo para el veredicto de cada jugada, que es un aviso corto que se cierra solo; la pantalla final no tiene apuro.
**Consecuencias:** La pantalla de resultado deja aire abajo (`body.chat-on`) para que la burbuja no tape los botones de revancha, cambiar modo y volver al menú (C-8). El canon C-15 se corrige: el chat muere con la sala.

## D-36 · El veredicto habla de quien jugó
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** En Línea de Tiempo, la pantalla de veredicto se dirige al jugador correcto: si la jugada fue mía dice “¡Te equivocaste!” o “¡Correcto!”; si fue de otro, “¡Cata se equivocó!” o “¡Cata acertó!”. La explicación también cambia de persona (“La puso antes de…”, “roba una nueva”), y el fondo rojo del error queda solo en la pantalla de quien se equivocó.
**Por qué:** En varios celulares el veredicto se muestra a todos. Decirle “¡Te equivocaste!” a alguien que estaba mirando es confuso y, con el fondo rojo, se siente como un reto inmerecido. Para el que mira es una noticia, no un error.
**Consecuencias:** El canon C-8b se precisa: la señal fuerte del error es para quien lo cometió. En un celular y en solitario no cambia nada, porque quien mira la pantalla es siempre quien acaba de jugar. Prueba: `tools/e2e/linea-de-tiempo-veredicto.mjs`.

## D-37 · Cartas que se puedan situar en el tiempo
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Una carta no puede describir un hecho que se repite en la historia sin algo que la ancle a su año. Se sacó “un gran incendio golpea los cerros de Valparaíso” y “el terremoto de marzo sacude la zona central”; “el movimiento estudiantil se toma el año” pasó a nombrar a Camila Vallejo, y el incendio de Valparaíso a decir que fue el mayor de su historia y cuántas casas se llevó.
**Por qué:** Chile tiene terremotos, incendios y marchas cada pocos años. Si la carta no dice cuál, el jugador no está pensando, está adivinando, y eso rompe el juego para todos.
**Consecuencias:** Regla para escribir mazos: superlativo, nombre propio o cifra que ancle el año. Si no hay ninguno, la carta no entra. Vale también para los mazos futuros.

## D-38 · La carta la elige el jugador, nunca la app
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Línea de Tiempo deja de preseleccionar la primera carta de la mano. Si el jugador no tocó ninguna, no hay nada elegido: las ranuras no reaccionan y el botón de confirmar se queda deshabilitado. Además, ese botón ahora **dice qué carta va a colocar**, con su emoji y su título.
**Por qué:** Un jugador reportó que eligió una carta, la puso en la línea y apareció otra. Es cierto y se reproduce: la mano es una tira que se desplaza a lo ancho, y en un celular un toque con un par de píxeles de arrastre se convierte en scroll y el `click` nunca ocurre. Como la app dejaba siempre preseleccionada la primera carta, el jugador tocaba la ranura, confirmaba… y colocaba una carta que nunca eligió. Con el pozo común (seis cartas a la vista) hay que desplazarse más, así que el problema se volvió más probable.
**Consecuencias:** Un toque perdido ya no coloca nada: el jugador ve que no pasó nada y vuelve a tocar. El botón nombrando la carta cierra el caso contrario (haber elegido otra sin darse cuenta), y se suma a las dos señales que ya existían: el borde amarillo en la tira y el fantasma de la carta dentro de la ranura. Regla general: **ninguna acción irreversible puede ejecutarse sobre algo que el jugador no eligió explícitamente** (canon C-8). Prueba: `tools/e2e/linea-de-tiempo-eleccion.mjs`.

## D-39 · Las salas vencidas se barren con una papelera pública
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Firebase gana un nodo `cleanup` que es el índice de salas por borrar: `cleanup/days/<día>` junta los códigos creados ese día y `cleanup/sweptDay` es la marca de agua de lo ya barrido. Al crear o entrar a una sala, el celular apunta su código en el balde del día; además, como mucho una vez cada 6 horas, barre en segundo plano los baldes pendientes (siempre los últimos 8 días, y hasta 30 si venía atrasado) borrando esas salas y el balde. Un balde solo se puede leer y borrar 6 horas después de su último apunte.
**Por qué:** Una sala vence a las 6 horas pero nadie la borraba: el que la creó ya cerró el navegador, y la limpieza solo ocurría por casualidad, cuando una sala nueva sacaba el mismo código de cuatro letras que una vencida. La base crecía para siempre con partidas y chats muertos. El plan gratuito no tiene Cloud Functions, así que el barrendero tiene que ser el mismo celular que juega.
**Por qué un índice y no listar `rooms/`:** dejar leer `rooms/` entero regalaría los códigos de todas las salas **vivas**, y con el código se lee el chat (C-15). La condición de las 6 horas sobre el último apunte hace que un balde solo se pueda abrir cuando todas sus salas ya vencieron: el índice nunca delata una sala en juego.
**Dos cosas que aparecieron al probarlo contra Firebase de verdad:** las reglas no dejan borrar una sala que no existe, y eso es un caso corriente (un barrido anterior que se cortó, o un código reusado), así que un solo apunte huérfano habría dejado su balde —y todos los días siguientes— sin barrer para siempre: ahora un apunte sin sala cuenta como trabajo hecho. Y tampoco dejan pisar un código ya apuntado, así que el apunte va en una escritura separada del `lastAt`; si no, cada jugador que entraba a una sala dejaba un `permission_denied` en la consola. El que crea la sala la apunta con la hora del servidor, no con la del celular.
**Consecuencias:** La marca de agua es pública y cualquiera puede adelantarla, por eso el barrido siempre repasa los últimos 8 días aunque la marca diga lo contrario. Un balde que no se deja leer o cuyas salas no se dejan borrar corta el barrido y queda para la próxima: nunca se salta un balde. Todo esto es "mejor esfuerzo": si falla, la partida sigue igual y barre el celular siguiente. Las salas creadas antes de esta versión no están apuntadas en ningún balde; se borran una sola vez a mano desde la consola de Firebase. Módulo `assets/js/transport/cleanup.js`, con tests en `cleanup.test.mjs`; reglas en `firebase/database.rules.json`.

## D-40 · Una falla de red no se cuenta como "no hay internet"
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Crear o entrar a una sala espera primero la conexión con la base (`.info/connected`, 8 s) y después corre con tope (12 s). Los códigos `offline`, `busy` y `no-code` comparten un texto nuevo (`errOffline`) que nombra las dos causas posibles sin elegir una, y ofrece el modo de un solo celular. El mapa de código a texto, que estaba copiado igual en los tres juegos, vive ahora en `assets/js/transport/errors.js`.
**Por qué:** `join` distinguía sus errores, pero `create` mandaba todo a `errNet` — *"No se pudo conectar. ¿Hay internet?"*. El plan gratuito tiene techo de conexiones simultáneas: cuando se llena, el jugador leía que su internet estaba mala. Además, sin espera ni tope, quedarse sin señal se veía como un botón pegado para siempre, que es lo que C-14 prohíbe.
**Por qué un solo texto para tres causas:** desde el navegador no se pueden distinguir. Quedarse sin señal y toparse con el tope de conexiones producen exactamente el mismo síntoma: `.info/connected` nunca pasa a `true`. Inventar una causa sería mentirle al jugador con más precisión que antes, no con más verdad. El texto dice lo que se sabe ("puede ser tu internet o que haya mucha gente jugando") y da la salida que la app ya tenía.
**Lo que apareció al probarlo:** bloquear la URL de Firebase no sirve para provocar el error — el canal de RTDB es un WebSocket y se cuela igual. Hay que emular la red caída, y recién después de precargar el módulo del transporte: si no, lo que falla es la descarga del SDK desde gstatic y nunca se llega a probar la espera de conexión. Eso obligó a exponer el CDP crudo en `tools/e2e/cdp.mjs`.
**Consecuencias:** Los errores previstos ya no van a la consola; solo los inesperados (`failWith`), que es lo que hace útil el criterio de "consola limpia" de C-12. Módulo `assets/js/transport/errors.js` con tests en `errors.test.mjs`; prueba de punta a punta en `tools/e2e/sala-error.mjs`, que verifica el mensaje en los tres juegos y en los dos idiomas.

## D-41 · Tope de salas por celular, sabiendo que no ataja al que quiere abusar
**Fecha:** 2026-09-10 · **Estado:** vigente
**Decisión:** Un celular puede abrir hasta 20 salas por hora y 80 por día, contadas en `localStorage`. El tope se revisa antes de tocar la red y falla con `too-many`, que tiene su propio texto. Si `localStorage` no se puede leer, se deja crear.
**Por qué:** El plan gratuito tiene techo de conexiones y de descarga mensual, y la app es estática: no hay servidor que modere nada. Esto ataja el caso realista —una pestaña en bucle, un script ingenuo, un error nuestro creando salas sin freno— a un costo mínimo.
**Lo que no hace, dicho claro:** no frena a nadie decidido. Quien quiera abusar le pega a la REST API con `curl` y jamás carga este módulo. Cerrar esa puerta de verdad pide autenticación anónima y reglas con `auth != null`: otro modelo de seguridad y otra decisión. Si alguna vez el uso muestra tráfico que no se reconoce, ese es el paso siguiente — no subir este tope.
**Por qué 20 y no 6:** la revancha abre una sala nueva (C-7) y una partida dura minutos, así que quien juega en serie abre muchas salas seguidas siendo legítimo. Un tope pensado para el promedio habría dejado afuera a los que más juegan. Un bucle descontrolado abre miles por hora: la distancia es tan grande que no hace falta afinar el número.
**Por qué falla abierto:** dejar pasar a un abusivo es barato; dejar a un jugador legítimo sin poder jugar porque su navegador está en modo privado, no. Es la misma postura que C-6 toma con la memoria de partida.
**Consecuencias:** El tope se revisa antes de la red, así que avisa al instante y no gasta una conexión para después descartarla. Solo cuenta la sala que quedó creada de verdad, no el intento. Módulo `assets/js/transport/ratelimit.js` con tests en `ratelimit.test.mjs`; prueba de punta a punta en `tools/e2e/sala-tope.mjs`, que siembra el historial en vez de abrir 20 salas contra Firebase.

## D-42 · Un laboratorio con URL propia para probar interfaz
**Fecha:** 2026-09-11 · **Estado:** ~~derogada por D-67~~
**Decisión:** Los cambios de interfaz que valga la pena mirar antes de decidir se prueban en `/lab/`, una carpeta con su propia URL que **espeja** el menú y los juegos que haga falta. Las páginas del laboratorio importan los módulos reales (`game.js`, `rules.js`, `engine.js`, `assets/js/*`): lo único propio es la presentación, en `lab.css` y en el HTML espejado. En reposo `lab.css` está vacío y el laboratorio se ve idéntico a la app.
**Por qué:** Un cambio de aspecto no se puede evaluar leyendo un diff ni mirando una captura suelta: hay que jugarlo en un celular de verdad, y ojalá pasárselo a otra persona. Sin un lugar donde hacerlo, la única forma era publicar el cambio en la app y arriesgarse, o dejarlo en local y no probarlo nunca en el aparato donde se juega. El laboratorio da una URL que se manda por WhatsApp sin tocar lo que funciona.
**Por qué espejar el HTML y no duplicar el juego:** duplicar `game.js` crea un segundo juego que se desincroniza en una semana y vuelve inútil la prueba. Espejando solo el `index.html` y apuntando al módulo real, un arreglo en el juego se ve en el laboratorio sin copiar nada. El costo es que la copia hay que rehacerla si cambia la estructura del `index.html` del juego, que es raro.
**Por qué `lab.css` solo agrega:** se carga después de `base.css` y del `style.css` del juego, nunca en su lugar. La prueba de que un experimento está bien aislado es que borrar `lab.css` deja las páginas funcionando con el aspecto actual. Si algo se rompe, es que se puso ahí una base en vez de un cambio.
**Por qué sin `?v=`:** el laboratorio siempre carga lo último, que es lo que uno quiere al probar. La contra, anotada en su README, es que el navegador cachea `lab.css` y las imágenes, y al iterar hay que forzar la recarga.
**Excepción a C-11:** un cambio que solo toca `lab/` no corre `set-version.py` ni sube el número de versión. Ese canon existe para que el navegador no mezcle archivos viejos y nuevos, y acá no cambió ningún archivo versionado: estampar `?v=` nuevo obligaría a todos los celulares a rebajar el JS y el CSS completos sin nada nuevo que bajar.
**Cómo se migra un experimento aprobado (`tools/lab.py`):** cada bloque de `lab.css` declara con `/* @destino <ruta> */` adónde va el día que se apruebe, y `promover` lo mueve solo: los estilos a su archivo, las imágenes a `assets/img/` con la versión en el nombre —porque `set-version.py` no estampa imágenes— y las rutas de `url()` reescritas según dónde caiga cada bloque, que es distinto desde `base.css` que desde el `style.css` de un juego. Se niega si el árbol de git está sucio: la migración reescribe archivos de producción y su diff tiene que poder leerse solo. Lo que **no** hace es fundir reglas duplicadas ni decidir qué probar: eso queda impreso como lista al terminar. Un migrador que adivina dónde va cada regla es peor que no tenerlo, porque se confía en él.
**Por qué `revisar` importa más que `promover`:** el espejo de un juego puede quedar viejo respecto del `index.html` real sin ningún síntoma —la página carga igual— y uno cree que está probando el juego cuando está probando una copia de hace dos meses. `revisar` compara cada espejo contra lo que debería ser hoy y falla si quedó atrás. Es la única parte de todo esto que ataja un error silencioso.
**Consecuencias:** El laboratorio comparte origen con la app, así que comparte `localStorage` (memoria de partida, idioma, nombre) y las salas de Firebase. Una partida a medias empezada en el laboratorio aparece en el juego publicado. Va con `noindex` y sin `manifest`. Primer uso: las insignias serigrafiadas, descartadas; quedan en los commits `8efd11c` y `d5071c9`.

## D-43 · Línea de Tiempo: todas las cartas a la vista desde el primer turno
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** La sección "Cartas" de la configuración pasa de dos opciones a tres: **todas a la vista**, **pozo común** y **mano propia**. Con todas a la vista se despliegan de una vez **el doble de las cartas que hay que colocar para ganar** —6, 10 o 14 según la meta de 3, 5 o 7— y no entra ninguna carta nueva en toda la partida: cada carta que sale, porque entró a la línea o porque se falló, achica la mesa. Es la opción marcada al abrir la configuración, en el lugar que tenía el pozo común.
**Por qué:** Con el pozo común de 6 cartas que se repone, la dificultad es plana de principio a fin: siempre hay caras nuevas y una carta difícil se puede postergar indefinidamente sin costo, porque va a seguir ahí junto a otras cinco recién llegadas. Con la mesa completa y sin reposición la partida tiene curva: los primeros turnos se eligen las fáciles, y lo que queda al final es exactamente lo que nadie se atrevió a situar, sobre una línea de tiempo que además ya está llena de hitos y deja huecos cada vez más estrechos. El juego se pone más difícil solo, sin ninguna regla extra que explicar.
**Por qué el doble de la meta y no una cantidad fija:** la mesa tiene que alcanzar para que todos lleguen a la meta si juegan perfecto, y no mucho más. Con el doble justo, dos jugadores que no fallan nunca terminan empatados en la meta y desempata el tiempo (D-31); cada error le quita a alguien una carta que ya no vuelve. Una mesa más grande devolvería la dificultad plana del pozo común; una más chica haría que la partida se decidiera antes de empezar.
**Cómo:** El motor recibe `refill`. Es la única diferencia con el pozo común: el reparto, la tira compartida, el marcador de `colocadas/meta`, el fin de ronda y los desempates son los mismos (D-32). En la configuración viaja como `spread`, y de ahí se derivan el tamaño de la mesa (`2 × handSize`) y `refill: false`. Las partidas guardadas y las salas abiertas antes de este cambio no traen `spread`, así que se siguen reproduciendo como pozo común con reposición.
**En pantalla:** Con tres opciones el selector ya no cabe lado a lado en un celular, así que va apilado y cada opción lleva su nombre completo (C-8). El contador de arriba a la derecha deja de decir cuántas cartas quedan en el mazo —que en este modo no entra nunca— y dice cuántas quedan en la mesa, que es lo que el jugador está mirando agotarse. La ayuda de la configuración nombra el número concreto y se reescribe al cambiar la meta: "Se despliegan 14 cartas desde el primer turno…".
**Consecuencias:** La mesa se puede vaciar antes de que nadie llegue a la meta, y ahí gana quien colocó más, que ya era el final por mazo agotado del pozo común. En solitario eso significa que se puede terminar sin lograrlo: la pantalla final lo dice con sus propias palabras ("Se acabaron las cartas · Alcanzaste a colocar 1 de las 3 cartas que necesitabas") y **no** se guarda récord, porque si no una partida abandonada a los dos intentos quedaría como la mejor marca. El récord del solitario se guarda con su propia clave (`tema:cartas:mesa`), aparte de la del pozo común y la de mano propia.

## D-44 · Señales de uso para un panel privado del dueño, sin identificar a nadie
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** Los juegos y el transporte dejan constancia de cada partida en `stats/<entorno>/days/<día>` de Firebase: las salas de dos celulares con juego, hora, versión y los nombres de quienes entraron; los modos sin red (un celular, contra el celular, solo) como un **contador** por juego, modo y cantidad de jugadores, sin nombre ni nada más; y de cualquier modo un contador de zona horaria, idioma del navegador y hora local. Una página nueva, `/panel/`, entra con Google y lo muestra; las reglas solo dejan leer `stats/` y listar `rooms/` al UID del dueño. Documentado en [PANEL.md](PANEL.md).
**Por qué:** Hasta acá no había forma de saber si alguien jugaba, qué juego gustaba ni cuántos se juntaban. La base solo tenía salas vivas que se borran a las 6 horas, nadie podía listarlas (D-39) y los modos sin red no tocaban la red. Un panel con historia pide un registro aparte que la papelera no barra.
**Por qué señales vagas y no personas:** el objetivo es ver uso, no identificar. Que alguien juegue desde Brasil o se llame "Fausto" no dice quién es. Por eso no se consulta ninguna geolocalización por IP (que además sería un tercero) y "de dónde" se contesta con la zona horaria del celular, que es gruesa y honesta. Los nombres de las salas ya viajan a Firebase para que el rival los vea; el registro no los expone más de lo que estaban, y ahora solo el dueño puede listarlos. De los modos sin red no sale ni un nombre, porque hasta hoy no salía nada, y la promesa de privacidad cambia de "no se envía ningún dato" a "no se envía nada que identifique a alguien" (requerimientos no funcionales).
**Por qué REST y no el SDK:** los modos sin red no cargan Firebase, y cargarlo para un contador habría abierto una conexión persistente por cada partida local, que es justo lo que cuenta contra el tope de conexiones simultáneas del plan gratuito (D-41). Un `fetch` con `keepalive` y `{".sv": {"increment": 1}}` suma de a uno en el servidor sin SDK, sin conexión abierta y sin esperar. Las reglas solo aceptan subir cada contador exactamente en uno y crear cada registro de sala una sola vez.
**Por qué Google y un UID en las reglas:** el plan Spark incluye Authentication gratis, los jugadores siguen sin autenticarse y las reglas de Firebase son el único lugar donde una app estática puede guardar un secreto de acceso. El UID no es secreto; sirve para que las reglas fallen cerradas mientras no esté puesto.
**Por qué un entorno en la ruta:** las pruebas de punta a punta pegan contra Firebase de verdad y habrían ensuciado las cifras. `prod`, `lab` y `dev` se separan por la URL desde donde se juega y el panel muestra `prod` por defecto.
**Consecuencias:** `stats/` crece unos cientos de bytes por partida y no se barre: a la escala de esta app es despreciable frente al giga del plan. Cada celular que entra a una sala suma en origen e idioma, así que esas cifras cuentan celulares, no partidas. Lo que entra a la papelera no cambia. Retomar una partida no cuenta como empezar otra; la revancha sí, porque abre partida nueva (C-7). El panel es solo en español (excepción a C-3 anotada en PANEL.md). Quién ganó y cuánto duró no se registran: no interesa por ahora. Módulos `assets/js/transport/stats.js` y `panel/aggregate.js`, con tests; reglas en `firebase/database.rules.json`; pasos de la consola en `firebase/README.md`. Sigue pendiente RP-22: la cuota real no se lee desde el navegador.


## D-45 · El panel separa por entorno también las salas vivas
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** La sección "Ahora" del panel muestra solo las salas del entorno elegido en el selector, cruzando cada sala viva por código contra los que `stats/<env>/days` registró hoy y ayer. Las que quedan fuera no desaparecen sin más: debajo de la lista se nombran con su código, diciendo que no quedaron registradas en ese entorno.
**Por qué:** El selector de entorno separaba `stats/<env>/days`, o sea las cifras de "Últimos 7 / 30 días" hacia abajo, pero "Ahora" lee `rooms/` directo. Y `rooms/` es el nodo real del transporte: hay una sola base, así que una partida de prueba en `localhost` o en el laboratorio abre una sala tan real como la de un jugador, con nombres y todo. Al estrenar el panel aparecieron ahí las salas de las pruebas de punta a punta —Javi, Cata y Nico— indistinguibles de gente jugando. Un panel que cuenta mal las salas en juego y los celulares conectados no sirve para lo que existe, que es mirar el uso real y aproximar la cuota del plan gratuito.
**Cómo:** El entorno no se puede guardar en `rooms/`: las reglas rechazan cualquier campo que no esté previsto, y agregar uno obligaría a tocar las reglas de las salas, que son las que sostienen el juego. Pero el dato ya existe por fuera, en `stats/<env>/days/<día>/rooms/<CÓDIGO>`, y el panel ya lo tiene cargado en memoria para dibujar el resto. El cruce es local, sin pedir nada más a la base. Se miran hoy y ayer y no más atrás, porque una sala vive seis horas como mucho y los códigos de cuatro letras se reciclan: uno de hace tres semanas podría colarse.
**Por qué se nombran las ocultas:** el registro de señales es mejor esfuerzo y falla callado (D-44). Si una sala real no llegó a registrarse, filtrar sin avisar la borraría del panel para siempre y no habría forma de notarlo. La línea de abajo convierte eso en algo visible, y de paso hace obvio cuándo uno está mirando el entorno equivocado (C-14).
**Consecuencias:** Mientras el snapshot de `stats/<env>/days` no ha llegado, no se filtra nada: se prefiere mostrar de más un instante antes que parpadear en blanco. Cambiar de entorno en el selector vuelve a dejar sin filtrar hasta que llega el snapshot nuevo. Las pruebas de punta a punta siguen abriendo salas reales contra Firebase, y eso no cambia: lo que cambia es que el panel ya no las cuenta como uso.

## D-46 · Dos idiomas en las señales de uso, no uno
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** Además del idioma del navegador (`lang`, de `navigator.language`), se registra el idioma **elegido en el juego** (`applang`, de `getLang()`). El panel los muestra en dos secciones vecinas: "Idioma del navegador" e "Idioma elegido para jugar".
**Por qué:** Son preguntas distintas y la primera no contesta la segunda. `navigator.language` dice de dónde es la persona y con qué configuró su teléfono; el toggle de la app dice en cuál prefiere jugar. Un celular en `es-CL` jugando en inglés, o al revés, es exactamente el dato que decide si vale la pena seguir manteniendo dos idiomas (C-3) y cuál de los dos se lleva el esfuerzo de las traducciones. Con un solo número no se distingue "nadie juega en inglés" de "no hay nadie de habla inglesa".
**Cómo:** Sale del mismo `fingerprint()` que el resto, con `getLang()` inyectable para poder probarlo. Es un contador más, con el mismo contrato que los otros: sube de a uno y la clave va acotada. El valor es `es` o `en`, no un código de región: el juego solo ofrece esos dos.
**Consecuencias:** Las reglas tienen que aceptar la clave nueva, y **hay que republicarlas a mano en la consola**. Hasta que eso pase, la escritura se rechaza y no se entera nadie —el registro es mejor esfuerzo y falla callado (D-44)—, así que la sección aparece vacía. Por eso su texto de vacío dice "se empieza a contar desde esta versión" y no "nada todavía": distingue no tener datos de estar roto.

## D-47 · Español por defecto; inglés y portugués, solo a pedido
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** Quien entra a juegosdesalon.cl ve la app en español mientras no elija otra cosa. El idioma del navegador (`navigator.language`) no se usa para elegir: sirve como señal de uso (D-46), nunca para decidir qué se muestra. Inglés y portugués son opcionales: se activan solo con el toggle del menú o de la intro de cada juego, y la elección queda en `localStorage` del dispositivo. Con la llegada del portugués, el juego ofrece tres idiomas y no dos, lo que corrige el detalle de D-46.
**Por qué:** El público es chileno y las mesas son de habla hispana; el humor, las referencias y las cartas están pensados primero en español (C-1). Detectar el idioma del teléfono parece amable pero falla en la mesa: un celular configurado en inglés en manos de alguien que juega en español muestra chistes traducidos que nadie pidió, y en una mesa el que sostiene el teléfono no siempre es el dueño. Un valor fijo y predecible (español) más un toggle a la vista es más simple de explicar y de probar que una heurística.
**Cómo:** `getLang()` devuelve lo guardado si es un idioma conocido y, si no, `'es'`. Ningún módulo lee `navigator.language` para decidir textos; solo `stats.js` lo registra como contador. Cada `index.html` declara `lang="es"` y el idioma elegido se aplica sobre `document.documentElement.lang` al cargar.
**Consecuencias:** Agregar un idioma es sumarlo a `LANGS`, al toggle y a los `LOCALES`; no cambia el arranque. Las pruebas de punta a punta parten siempre en español salvo que toquen el toggle. Si algún día se quiere ofrecer el idioma del navegador, será una sugerencia visible y no un cambio silencioso.

## D-48 · Portugués de Brasil como tercer idioma, en las mismas claves
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** La app se puede jugar entera en portugués: menú, frases del pie, los cuatro juegos con sus modos, salas, chat, errores de transporte, pantallas de pase y las cartas de los cuatro mazos de Línea de Tiempo. Es portugués **de Brasil**, informal ("você", "celular", "bora jogar", "vira, vira, vira"), y se agrega como un tercer diccionario `pt` con exactamente las mismas claves que `es` y `en`: en `COMMON` de `i18n.js`, en `games.js`, en `FRASES`, en `LOCALES` de cada `rules.js`, en el nombre y la pista de cada mazo y en cada carta. Los nombres de los juegos se traducen, como ya se hacía en inglés: Quarto Rei, Toque e Fama, Batalha Naval, Linha do Tempo; los mini-juegos de Cuarto Rey pasan a Era Uma Vez, Porquinho Bochechudo, Cultura de Boteco y Eu Nunca; los sorbos son "goles", la penitencia es "prenda".
**Por qué:** Brasil es el vecino más grande y el panel ya mostraba celulares en `pt-BR` (D-44). Se elige la variante brasileña y no la europea porque es la que van a leer casi todos los que toquen el botón, y porque las dos difieren justo en las palabras que la app más usa ("celular" contra "telemóvel", "você" contra "tu"). Un solo diccionario con las mismas claves, y no un idioma "parcial" que caiga al inglés donde falte, porque una pantalla a medias en dos idiomas se ve peor que no ofrecer el idioma: C-3 dice que toda la experiencia va en el idioma elegido.
**Cómo:** `LANGS = ['es', 'en', 'pt']` y una etiqueta 🇧🇷 PT en el toggle; `yearLabel` de Línea de Tiempo usa "a.C." para español y portugués y "BC" solo para inglés; el test del motor exige `pt` en cada carta y rechaza apóstrofos rectos dentro del texto. `sala-error.mjs` prueba el mensaje de sala caída también en portugués. Las traducciones se adaptan (C-3): las comunas de Santiago son bairros, los equipos chilenos son times brasileiros, y las frases del pie se reescribieron con humor de rolê.
**Consecuencias:** Cada texto nuevo se escribe tres veces, y las claves tienen que coincidir en los tres diccionarios (`assets/js/i18n.test.mjs` lo verifica: claves, largo de listas, `{llaves}` y textos vacíos). El panel del dueño sigue en español (excepción anotada en PANEL.md) pero etiqueta `pt` en "Idioma elegido para jugar". El `manifest.webmanifest` sigue en español: es uno solo para la app y no cambia con el toggle. Una partida guardada en un idioma se retoma en el idioma activo, como ya pasaba entre español e inglés (D-16).

## D-49 · Las frases del pie dejan el humor de carrete por chistes genéricos de sobremesa
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** Las 100 frases por idioma de `assets/js/frases.js` (D-48) se reemplazan enteras: ya no hacen chistes sobre los juegos de la app (Toque y Fama, Cuarto Rey, etc.) ni mezclan mensajes de agua, moderación o manejar sobrio. El contenido nuevo es humor genérico de sobremesa —chistes cortos, sobre la vida, para ligar y de WhatsApp—, pedido explícitamente por el dueño a partir de una lista de 200 frases en español que traía además una categoría de chistes de cumpleaños. Se descartó esa categoría completa por no tener sentido en el contexto del juego, y de las 163 frases restantes se descartaron duplicadas (algunas venían repetidas dentro de la lista original), una frase con una traducción rota en el propio español, tres chistes de pronunciación fingida en otro idioma (por el estereotipo que cargan y porque no se pueden adaptar a inglés o portugués sin perder el chiste) y algunas frases de ligar demasiado explícitas o que nombraban a personas reales, hasta llegar a las 100 exigidas por `assets/js/i18n.test.mjs`. Cada frase se tradujo adaptando el chiste (C-3), no calcándolo: los juegos de palabras que solo funcionan en español se reemplazaron por un chiste equivalente en inglés y en portugués de Brasil, no por una traducción literal.
**Por qué:** Es un pedido directo y explícito del dueño de reemplazar el contenido existente por uno nuevo. Selección y traducción quedaron en manos de Claude porque el pedido no especificaba cuáles de las 200 frases usar ni cómo resolver el choque con el tope de 100 por idioma que exige el test.
**Consecuencias:** Se pierde el humor específico de la app (las referencias a Toque y Fama, Cuarto Rey, etc.) y los mensajes de agua/moderación/no manejar tomado que mezclaban las frases anteriores; el pie del menú ya no tiene relación temática con los juegos. La selección de cuáles 100 frases entran es una decisión editorial de Claude, no una lista cerrada del dueño: si alguna no cuadra, se ajusta a mano en `assets/js/frases.js` respetando el tope de 100 por idioma y sin frases repetidas (C-13).

## D-50 · Una sala cancelada se cierra sola: despedida explícita y borrado en el acto
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** El transporte suma una despedida (`dispose()`, `assets/js/transport/dispose.js`) aparte de `leave()`. Quien se va **a propósito** —cancela la sala en el lobby, se sale de ella, cambia de modo al terminar, o se muda a la sala de la revancha— escribe `left: true` en su rol y, si con eso no queda nadie adentro, borra la sala en el acto. Las reglas de Firebase dejan borrar una sala viva únicamente cuando todos los jugadores que están adentro se despidieron. El panel deja de mostrar como vivas las salas en ese estado.
**Por qué:** Una sala vivía sus seis horas pasara lo que pasara: la papelera (D-39) recién puede tocarla cuando vence, porque el índice de limpieza se lee solo cuando ya no queda nada vivo adentro. Eso está bien para las partidas que se terminan solas, pero dejaba viva —y en el panel del dueño con nombre, código y "creada hace 5 min", igual que una partida de verdad— cada sala que alguien abrió y canceló: creó la sala, nadie llegó, se fue. Cada revancha dejaba otra. El panel existe para mirar el uso real (D-44) y estaba contando fantasmas.
**Por qué una despedida y no una desconexión:** `online: false` ya existía y no sirve para esto. Quedarse sin señal, bloquear el celular o cerrar la pestaña apagan `online`, y esas partidas se pueden retomar hasta que la sala venza (C-6): tratarlas como canceladas borraría salas que alguien está por volver a abrir. El caso más claro es el que más duele: crear la sala, salir a mandar el código por WhatsApp y volver. Por eso nada de esto cuelga de `pagehide` ni de `visibilitychange`, solo de un gesto del jugador, y al reconectar se limpia la despedida (`left: false`) por si quedó una a medias.
**Cómo:** Son dos pasos, porque las reglas miran la sala como está *antes* del borrado: primero la despedida, después el borrado si al releer los jugadores no queda nadie. Nada de eso lanza ni se muestra, y lleva un tope corto (`LEAVE_MS`, 4 s): quien ya se está yendo no puede quedarse con el botón pegado. Si algo falla, la sala queda marcada y la borra la papelera cuando venza. El nombre del que se fue no se borra: la sala sigue diciendo quién estuvo. La regla de borrado enumera los seis roles (A–F) porque las reglas de Firebase no saben recorrer hijos.
**Interfaz:** el lobby de los tres juegos con sala gana un botón al final, "Cancelar la sala" para quien la creó y "Salir de la sala" para quien se unió. Antes no había ninguna salida explícita: se volvía al menú con la flecha de arriba, que es una navegación y no una intención.
**Consecuencias:** Las reglas se **publican a mano** en la consola ([Realtime Database → Rules](https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules)), paso que ya se hizo para esta versión. Mientras unas reglas nuevas no estén publicadas, la despedida se escribe igual pero el borrado se rechaza y la sala espera su vencimiento; el panel igual deja de mostrarla viva, porque eso lo decide el cliente. Alguien que sepa el código de una sala puede escribir la despedida de otro rol y, si todos quedan despedidos, borrarla: es el mismo alcance que ya tenía cualquiera que supiera el código (puede leer la sala y escribir mensajes, C-15), y no abre nada nuevo. Una sala que se quedó sin jugadores apuntados no se borra: `deserted` exige que haya alguien adentro, para que la sala recién creada —que existe un instante sin jugadores— no sea borrable por nadie.

## D-51 · El README se sostiene solo: lo derivable se genera, lo escrito se delata, las capturas se rehacen
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** El README deja de mantenerse a pulso. `tools/hechos.mjs` importa los módulos reales y arma una hoja de hechos (juegos, modos, temáticas con su cuenta de cartas, idiomas, módulos, tests, documentos, capturas). `tools/readme.py` la usa para tres cosas: **generar** lo derivable dentro de marcas `<!-- generado: ... -->`; **delatar** lo que cambió desde el último sello (`docs/hechos.json`) nombrando qué sección de prosa hay que releer, con `sellar` para anotar que se releyó; y **rehacer las capturas** corriendo los guiones de `tools/e2e/` según el catálogo `docs/capturas.json`, que dice de qué guion y de qué toma sale cada imagen. `set-version.py` corre `revisar` antes de estampar, así que un README viejo frena la publicación (C-11, C-13).
**Por qué:** El README es la cara del proyecto y la única documentación que lee alguien de afuera, y se pudre en silencio. Al escribir esto decía "las cartas de los cuatro mazos" cuando había seis, daba a Cuarto Rey una versión que su propia especificación no reconocía, y sus capturas eran de pantallas que ya habían cambiado. Nada de eso lo avisa un test: son datos repetidos a mano en prosa. Repetidos a mano y sin dueño, cada cambio de la app los deja un poco más falsos.
**Por qué no generarlo todo:** Porque lo que hace bueno a este README es lo que no se puede derivar: por qué el juego está entretenido, qué se siente al pasar el celular, el chiste de las temáticas. Un README generado entero sería un listado correcto que no lee nadie. Por eso la herramienta se parte en dos: escribe las tablas y deja la prosa en paz, pero no deja que la prosa envejezca callada.
**Por qué el sello y no la fecha del commit:** Comparar fechas de git (¿el README es más nuevo que el código?) grita con cualquier cambio, hasta el de una coma, y a un soplón que grita por todo no lo mira nadie. El sello compara **hechos**: las claves de los modos, los mazos, los tests. Un texto de ayuda que se corrige no molesta a nadie; un modo nuevo sí, y es el que efectivamente obliga a releer.
**Por qué las capturas salen de las pruebas y no de la mano:** Los guiones de `tools/e2e/` ya juegan partidas completas en Chrome headless y sacan capturas para revisarlas (C-12). Sacarlas de ahí no cuesta nada, garantiza que la imagen es de una partida de verdad y no de un estado armado, y hace que una pantalla nueva en el README sea una toma nueva en un guion: algo que después se puede repetir. Las que necesitan una sala de Firebase van marcadas y se saltan con `--sin-red`.
**Consecuencias:** Dentro de las marcas no se edita a mano: lo que se escriba ahí lo pisa `actualizar`. Agregar una pantalla al README son tres pasos (toma en el guion, entrada en el catálogo, `capturas` y `actualizar`). Las capturas se guardan al doble del ancho con que se muestran y con paleta de 256 colores, para que rehacerlas seguido no engorde el repo. Los guiones de e2e calibran sus esperas para una máquina desocupada: con el computador ocupado fallan a medias, y entonces `capturas` deja la imagen vieja en su lugar y lo dice. El estado de cada juego sale de la cabecera de su especificación (`docs/juegos/<id>.md`): si ahí dice una versión vieja, la tabla del README la repite, y ese es el archivo que hay que arreglar.

**Qué no cuenta como cambio:** el estampado de versión. `set-version.py` reescribe los seis `index.html` en cada publicación (C-11), así que medir la edad de una captura contra "la última vez que se tocó la carpeta del juego" dejaba viejas, publicación tras publicación, a las capturas de juegos que nadie había tocado. `git_fecha` se salta los commits —y los cambios sin commitear— cuyo único contenido en esos caminos son las marcas `?v=` y la versión del pie: compara las líneas quitadas contra las puestas con el número de versión borrado, que es lo que distingue un estampado de un módulo nuevo en el import map (la misma línea cambia en los dos casos). Lo prueba `python3 tools/readme.test.py`. Sin esa salvedad el aviso salía siempre y dejaba de querer decir algo, que es la única forma en que este canon se muere.

## D-52 · El selector de Cartas va en fila, como el toggle de idioma
**Fecha:** 2026-09-11 · **Estado:** vigente
**Decisión:** Las tres formas de repartir de Línea de Tiempo (todas a la vista, pozo común, mano propia) dejan de ser tres botones apilados y pasan a ser un selector de una sola fila (`.seg--cards`), con el mismo aire que el toggle de idioma: tres pastillas, la elegida en amarillo. El emoji va arriba y el **nombre completo** debajo, en dos líneas si hace falta.
**Por qué:** Apiladas, las tres opciones medían 169 px de alto en un celular de 375 px: un tercio de la pantalla para un ajuste que se toca una vez. La pantalla de configuración ya es larga (temática, jugadores, cartas, cartas para ganar) y el botón de jugar quedaba lejos. En fila el control mide 78 px y la pantalla entera se acorta casi 100 px, que es justo lo que hace falta para que el final de la configuración se vea sin desplazar tanto (C-8).
**Cómo:** El emoji sale del texto (`LOCALES` guarda solo el nombre) y pasa a `CARD_MODES` en `game.js`, que es donde vive el resto de lo que define cada modo. Así el botón puede dibujarlo en su propia línea, más grande, y el nombre queda libre para partirse en dos renglones (`text-wrap: balance`) en vez de abreviarse. Cabe en portugués —el idioma de nombres más largos— y a 320 px de ancho, sin scroll horizontal y con 68 px de alto por pastilla, bastante más que los 44 px del canon.
**Por qué el nombre completo y no una abreviatura:** el nombre es lo que distingue las tres formas de jugar, y la ayuda de abajo explica la elegida pero no nombra a las otras dos. Partir el texto en dos líneas cuesta unos píxeles; abreviarlo cuesta que alguien elija a ciegas.
**Consecuencias:** `seg--stack` deja de existir (era el único uso) y con él la regla que ponía el texto a la izquierda. Los scripts de punta a punta que buscaban `.seg--stack` apuntan ahora a `.seg--cards`; los que buscan por texto siguen igual, porque los nombres no cambiaron. Los emojis siguen viéndose en pantalla, así que la sección del README que describe las tres formas sigue siendo cierta tal cual está.

## D-53 · El ahorcado se juega en cadena: nadie se queda mirando
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En El Ahorcado, cada jugador le escribe la palabra **al siguiente** y el último al primero; todos adivinan una palabra y todos ponen una. La alternativa —la app reparte del mazo— queda como la otra opción del selector "La palabra" (`🤝 Cadena` / `🎴 Mazo de la app`), con cadena marcada por defecto. El puntaje son **los errores que le sobraron a quien adivinó**; quien pone una palabra no suma nada.
**Por qué:** El ahorcado de toda la vida reparte mal los papeles: uno juega y el otro mira cómo juega. Con la cadena el juego es simétrico sin dejar de ser el ahorcado, funciona igual con dos que con seis, y el modo "fiesta" no necesita código propio: es varios celulares con más gente adentro.
**Por qué el verdugo no suma:** si colgar a la víctima diera puntos, la jugada ganadora sería poner una palabra imposible, que es exactamente lo que arruina al ahorcado. Sin premio, una palabra impenetrable solo le quita puntos al de al lado —y él te escribe la tuya en la misma partida.
**Consecuencias:** Con cadena hay un secreto por celular, así que corre el compromiso con hash (C-10); con mazo no hay secreto que comprometer. En un celular la cadena obliga a una vuelta de pantallas tapadas antes de empezar: de cuatro jugadores para arriba se hace largo, y por eso la recomendación de la especificación es de dos a cuatro.

## D-54 · La misma palabra para todos, solo cuando juegan a la vez
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** Con el mazo de la app, en varios celulares toda la mesa recibe **una sola palabra**; pasándose un celular, cada jugador recibe **una distinta**.
**Por qué:** La misma palabra para todos es la comparación más justa que existe: mismo largo, mismas letras, mismas trampas. Pero en un celular las rondas van en serie, y el segundo jugador estaría adivinando una palabra que acaba de ver revelarse en la pantalla. La regla no es "una o varias palabras": es que la palabra se comparte solo cuando nadie puede haberla visto antes.
**Consecuencias:** `dealWords({ same })` decide con el modo, no con la configuración, así que no hay un ajuste más que explicar. El reparto sale de la semilla y no depende de cuántos sean, de modo que dos celulares de la misma sala llegan a lo mismo sin hablarse.

## D-55 · La tira de rivales muestra vidas y avance, nunca qué letras
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En El Ahorcado, el chip de cada jugador muestra su nombre, las vidas que le quedan y una barra con cuánto lleva revelado. No muestra las letras que probó ni el patrón de su palabra.
**Por qué:** La tensión de la carrera está en ver que al otro le queda poco, no en copiarle la tarea. Con las letras a la vista, mirar el tablero ajeno pasaría a ser una forma de jugar —y en varios celulares con mazo, donde la palabra es la misma para todos, sería directamente la mejor forma de jugar.
**Consecuencias:** Las respuestas sí viajan por la sala (el reductor las necesita), así que quien abra la consola puede leerlas: es el mismo trato que Línea de Tiempo hace con los años de las cartas. Se acepta y se anota, porque taparlo costaría cifrar mensajes para atajar a quien ya decidió arruinarse el juego.

## D-56 · Una letra errada no bloquea la pantalla
**Fecha:** 2026-09-12 · **Estado:** vigente · **Excepción a C-8b**
**Decisión:** En El Ahorcado, una letra que no está no abre un aviso que haya que cerrar **en los modos donde el celular no cambia de mano** —varios celulares y contra el celular—: se señala con fondo rojo, sacudida, sonido propio, la tecla tachada y el trazo nuevo del dibujo, y el juego sigue. Lo que sí se queda hasta que el jugador toque es el **veredicto de la ronda**: te colgaron, o la sacaste. En un celular es distinto y no por el error: ahí cada jugada termina con el celular cambiando de mano, así que el resultado de la letra y el “pásale el celular a X” van juntos en una pantalla que espera al jugador (C-9, D-59).
**Por qué:** El canon C-8b está escrito para el error que interrumpe —colocar mal una carta—, que pasa pocas veces por partida. Acá errar es la jugada normal: en una partida de seis vidas se falla cinco o seis veces, y en varios celulares todos están jugando al mismo tiempo. Un aviso que hay que cerrar seis veces convierte el juego en un trámite y, peor, le come el turno a quien está corriendo contra otros.
**Consecuencias:** La señal tiene que bastar sin texto, y por eso va por cuatro canales a la vez (color, movimiento, sonido y el dibujo que avanza). El veredicto de ronda mantiene el trato del canon: fondo rojo solo para el que se colgó, tercera persona para los demás.

## D-57 · Acentos plegados, Ñ con tecla propia y solo en español
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** Las palabras se comparan normalizadas: mayúsculas, sin tildes y con la Ç plegada a C. Tocar la **A** revela también las **Á**, y la palabra se muestra con su tilde puesta. La **Ñ** es una tecla aparte y existe solo en el teclado español: 27 teclas en español, 26 en inglés y portugués.
**Por qué:** Pedir la tilde exacta convierte el juego en un examen de ortografía y castiga a quien escribe desde un teclado sin acentos. La Ñ es otra cosa: no es una N con adorno sino una letra distinta, y adivinar "año" tocando la N sería tan raro como adivinar "casa" tocando la Z. En inglés y portugués no existe, así que no ocupa una tecla.
**Consecuencias:** `normalize()` aparta la Ñ antes de descomponer el texto, porque en NFD la Ñ es justamente una N con una tilde encima. Una palabra con Ñ escrita en una partida en inglés se rechaza al escribirla, con el mismo aviso que una con números.

## D-58 · Comprar una letra cuesta un error y revela la más rara
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** El Ahorcado ofrece **comprar una letra**: revela la letra que falta más rara del idioma y cuesta un error. Se puede comprar mientras queden dos errores de margen, sin tope de compras, y va con confirmación.
**Por qué:** Le da al turno una decisión de verdad —¿gasto margen por información?— sin regla nueva que explicar, porque el precio se paga en la misma moneda del juego. No necesita tope: cada compra baja el puntaje, así que comprarlo todo es ganar la palabra y perder la partida. Se revela la más rara y no una al azar porque es la que más informa, y así la compra vale lo que cuesta.
**Consecuencias:** Se deshabilita con un solo error de margen —nadie puede comprarse su propia horca— y la letra comprada se pinta distinta (amarilla) de las adivinadas (cian), para que al final se vea cómo se sacó la palabra. Con cadena la elige el celular de quien puso la palabra, que es el único que la conoce, y viaja en la misma respuesta que una letra normal.

## D-59 · Los turnos se alternan letra a letra, no palabra por palabra
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En los modos por turnos de El Ahorcado —un celular y contra el celular— cada jugada pasa el turno al **siguiente que sigue vivo**: se prueba una letra y le toca al de al lado. Antes cada jugador terminaba su palabra entera y recién ahí pasaba el turno.
**Por qué:** Con rondas completas, el que espera es público de la partida del otro durante seis o siete letras seguidas, que es justo lo que este juego venía a arreglar (D-53). Alternando, todos los tableros avanzan a la vez y la carrera se ve: que al de al lado le quede una vida mientras a ti te quedan cuatro es información que llega en el momento en que sirve. Contra el celular cambia todavía más: antes la máquina jugaba su palabra entera después de que tú terminabas la tuya, y lo último de la partida era mirar.
**Cómo:** El turno sale de la lista de jugadas, no de una variable: `current` es el siguiente vivo después del que hizo la última jugada, y saltea a los que ya terminaron. Una jugada que todavía espera respuesta (cadena) no mueve el turno, así nadie juega encima de una pendiente. ~~Sin turnos —varios celulares— no cambia nada: ahí todos juegan a la vez desde siempre.~~ **D-66 llevó los turnos también a la sala.**
**Cómo se ve contra el celular:** su jugada duraría un parpadeo, así que su tablero se retiene 1,5 s después de que tira la letra, con "El celular probó la X" abajo. Sin esa retención, el turno volvía tan rápido que no se alcanzaba a ver qué había hecho.
**Consecuencias:** En un celular el aparato cambia de mano después de **cada letra**, así que el resultado de la jugada y el pase viajan juntos en una sola pantalla (C-9), y la pantalla de pase suelta queda solo para entrar al primer turno o al retomar una partida. Son más pantallas que antes, pero es el mismo ritmo que Línea de Tiempo: una jugada, un pase. El desempate por letras gastadas y el puntaje no cambian.

## D-60 · Las posiciones de una respuesta viajan como texto
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En El Ahorcado, el mensaje `reply` manda las posiciones de la letra como una cadena —`"1,4,8"`, o `""` cuando la letra no está— y no como una lista. Al recibir, `readPos()` acepta la cadena, la lista cruda (que es lo que manda el transporte local) y el campo ausente, y devuelve la lista o `null` si no sirve. Además, una respuesta que el otro lado no aplica se reintenta tres veces y se deja de mandar.
**Por qué:** Firebase no guarda una lista vacía: el campo simplemente no queda. Y en este juego la lista vacía no es un caso raro sino la mitad del juego —es la letra que no está—, así que la respuesta llegaba sin `pos`, el reductor la descartaba por no ser una lista, y el aparato de quien puso la palabra la volvía a mandar en cada vuelta. Una letra errada en varios celulares con cadena bastaba para dejar la sala escribiendo sin parar y colgar ese celular. Salió probando de punta a punta, no leyendo el código: el guion se quedaba mudo siempre en el mismo lugar.
**Por qué el tope de reintentos además del arreglo:** el arreglo tapa este caso, pero la forma es la peligrosa. Cualquier mensaje que un lado manda y el otro descarta se convierte en un bucle de escrituras contra la sala, que es lento y caro y no avisa. Con tope, un mensaje que no se puede aplicar deja la partida trabada —visible, y se retoma— en vez de hacer ruido para siempre.
**Consecuencias:** El protocolo de `docs/juegos/ahorcado.md` dice `"pos": "1,4"`. `readPos()` vive en `engine.js` y no en `game.js` justamente para poder probarlo: `engine.test.mjs` cubre el vacío, el ausente, la lista cruda y lo que no sirve. Ningún otro mensaje del juego manda listas que puedan quedar vacías (`order` de `start` tiene dos jugadores como mínimo).

## D-61 · Colgarse no gana, y entre colgados gana quien llegó más lejos
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** En El Ahorcado, el ranking pone primero a todos los que sacaron su palabra —más margen, y a igualdad menos letras y menos tiempo— y después a los colgados, ordenados por **cuántas letras alcanzaron a revelar**. Si no la sacó nadie, no hay ganador: la pantalla dice "No la sacó nadie" con una calavera, y no se corona a nadie ni se le dice a nadie que perdió.
**Por qué:** El desempate por "menos letras gastadas" solo tiene sentido entre quienes sacaron la palabra: sacarla en seis letras es mejor que sacarla en diez. Entre colgados dice exactamente lo contrario —gastar menos letras es haber revelado menos antes de que se acabaran los errores—, así que premiaba al que peor lo hizo. Salió en la primera partida de prueba en varios celulares: los tres se colgaron y la pantalla coronó al que no había revelado ni una letra.
**Por qué nadie gana:** el puntaje del juego son los errores que te sobraron, y al colgado no le sobró ninguno. Coronar al mejor de los que perdieron es contarle al jugador algo que no pasó; con seis jugadores donde cinco se cuelgan y uno la saca, el ranking sigue teniendo sentido sin inventar un ganador donde no lo hay.
**Consecuencias:** `winner` es una lista vacía en vez de "el primero del ranking", así que la pantalla final tiene tres formas: ganador, empate y nadie. `buildState` necesita `total` y `left` para ordenar a los colgados, que ya los calculaba. Cubierto en `engine.test.mjs`.

## D-62 · Con cadena, la temática sugiere en vez de repartir
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** Arriba de los campos, antes de pedir nada, El Ahorcado ofrece seis palabras del mazo de la temática elegida, con su emoji. Tocar una llena la palabra y la pista; después se pueden editar las dos, o ignorarlas y escribir la propia. Si se edita la palabra, la sugerencia deja de estar marcada. No se repiten las que ya se pusieron desde ese mismo celular, y cada jugador ve otras.
**Por qué:** Con cadena, la temática elegida en la configuración no hacía **nada**: `deckRoles()` devuelve lista vacía y no se reparte ninguna carta. Y cadena es la opción marcada por defecto, así que en el camino por defecto se le pedía al jugador una decisión que no tenía consecuencia —y que el mensaje de compartir la sala y la tarjeta de retomar anunciaban igual, como si se fuera a jugar con ella.
**Por qué sugerir y no obligar:** convertir la temática en regla ("tiene que ser de Comida") es una regla que nadie puede verificar y que queda en el honor de la mesa. Sugerir resuelve el problema real, que es la pantalla en blanco: pensar una palabra de la nada es lo que más demora la vuelta de escritura, sobre todo de cuatro jugadores para arriba, que es justo donde la especificación avisa que se hace larga.
**Por qué arriba de los campos:** puestas debajo se leían como un detalle opcional, después de que el jugador ya se quedó mirando el campo vacío. Arriba son lo primero que ve, que es el momento en que sirven; el campo libre queda debajo para quien ya sabe qué va a poner.
**Cómo se ven:** el emoji arriba y la palabra debajo, como las tarjetas de temática. Al lado, en dos columnas, la palabra más larga de los mazos —CORDILHEIRA, once letras— se partía a la mitad a 320 px; centrada usa todo el ancho de la pastilla y entra en una línea (C-8).
**Consecuencias:** Las sugerencias se calculan en el celular de quien escribe y **no viajan**: la palabra sigue siendo secreta (C-10). Salen de la semilla de la partida corrida por la posición del jugador, así que al retomar se ofrecen las mismas y en las pruebas son predecibles. La temática vuelve a tener sentido en los tres modos, de modo que el texto de compartir y el de retomar dejan de prometer algo que no pasaba.

## D-63 · Una letra confirmada se ve antes de que cambie el turno
**Fecha:** 2026-09-12 · **Estado:** vigente
**Decisión:** Al confirmar una letra, El Ahorcado pasa un cartel breve sobre el área del dibujo —"¡Va!" en cian, "No está" en rosa, "Comprada" en amarillo, con la letra al lado— que aparece y se va solo en un segundo, sin pedir ningún toque. Va en **contra el celular** y en **varios celulares**. Además, contra el celular el tablero propio se retiene 900 ms antes de que el turno pase al celular.
**Por qué:** Contra el celular la jugada no abría ninguna pantalla y el turno cambiaba en el acto: el tablero saltaba al del celular sin que se alcanzara a ver cómo había ido la letra propia. El celular ya tenía su retención por D-59; el jugador no. Ahora el trato es simétrico: cada uno tira, se ve cómo le fue, y recién ahí le toca al otro.
**Por qué también en varios celulares:** ahí nada interrumpe a propósito (D-56) y eso sigue igual —el cartel no se toca, no espera y no frena la carrera—, pero el color y la sacudida se pierden si el jugador está mirando la tira de rivales en vez del teclado. Un segundo de cartel lo recupera sin costo.
**Por qué no en un celular:** ahí cada letra ya termina en la pantalla de veredicto y pase, que dice lo mismo y además espera al jugador porque el aparato cambia de mano (C-9, D-59). Sumar el cartel sería un momento de más en cada letra.
**La barra de acciones no flota:** pegada al fondo del viewport se montaba sobre el teclado en cuanto el tablero no entraba —bastaban 16 px—, y tapaba la última fila de teclas. Va en el flujo, y en pantallas cortas el teclado se compacta hasta los 44 px del canon para que igual entre sin desplazar (C-8).
**Cuánto dura:** dos segundos. Con uno, la jugada pasaba antes de que el jugador levantara la vista del teclado, y en la sala eso es todo lo que se ve del turno ajeno.
**Cómo se ve:** un velo sobre el área del dibujo, no un cartel suelto. Suelto y centrado tapaba la palabra y la pista de forma sucia; como velo sobre esa zona se lee deliberado, y la palabra, la tira de rivales y el teclado quedan a la vista. Respeta `prefers-reduced-motion`: sin animación aparece y se va igual, porque es información y no adorno.
**Consecuencias:** Durante la retención del tablero propio no se puede jugar, pero el título sigue diciendo "¡Te toca, Javi!": hablarle en tercera persona sobre su propio tablero era un parpadeo confuso. El cartel se dispara por jugada nueva, así que al entrar o al retomar una partida a mitad no aparece ninguno.

## D-64 · El celular adivina con un diccionario de verdad, no con el mazo
**Fecha:** 2026-09-12 · **Estado:** ~~derogada por D-65~~ · duró unas horas
**Lo que la derogó:** el modo dejó de ser un duelo. Sin una máquina que adivine, el diccionario
de cien mil palabras y todo `tools/diccionario/` se fueron con ella. Queda anotada porque lo que
costó sacar esas listas —y las tres formas en que la extracción salió mal sin avisar— es lo que
haría falta saber si algún día vuelve a hacer falta un diccionario grande.
**Decisión:** Contra el celular, la IA filtra un diccionario del idioma en curso de más de cien mil palabras (`ahorcado/decks/dict-<idioma>.js`) y no las cien del mazo. El archivo pesa, así que se pide con `import()` al entrar a ese modo y llega mientras el jugador escribe su palabra; si no llegara, el celular sigue jugando con el mazo. Los otros dos modos no lo descargan nunca.
**Por qué:** El diccionario eran las cien cartas del mazo Mezcla. Con una palabra común que no estuviera ahí, el celular sacaba **10 de 74** y gastaba 5,7 errores de 6: no adivinaba, buscaba en una lista corta. Y como el juego empuja a usar las sugerencias del mazo (D-62), el diseño premiaba justo lo que hace el duelo menos interesante. Con el diccionario grande saca **69 de 74** con 2,5 errores.
**De dónde salen las palabras:** de los correctores de macOS, con `tools/diccionario/`. No hace falta red ni inventar listas a mano, y se regeneran con `bash tools/diccionario/generar.sh <idioma>`. La herramienta solo corre en macOS; las listas quedan versionadas, así que solo se necesita una vez.
**Lo que costó sacarlas bien:** la API de completado devuelve **como mucho veinte palabras por prefijo**, así que "par" nunca llega a "paraguas"; y devolver menos de veinte **no** quiere decir que estén todas —el corrector inglés contesta doce para "j" y se queda ahí, dejando afuera *january* y *journey*—. Por eso los primeros tres niveles se abren siempre y de ahí en más solo donde trunca. Además la corrida es larga y se cortaba a mitad de camino sin avisar: la primera versión salió con 138 mil palabras y **medio alfabeto afuera**, ni una con "camp", y parecía correcta justamente por lo grande. Ahora va letra inicial por letra inicial y en anchura.
**La poda:** dos de cada nueve palabras del español eran formas verbales que nadie escribe en un ahorcado (*ejecutaríamos*, *silbásemos*). `podar.py` las saca exigiendo que el infinitivo exista y usando solo sufijos inequívocos: los participios quedan **fuera** de la poda porque *pescado*, *helado*, *comida*, *salida* y *bebida* son sustantivos de todos los días. Baja un 19% el peso, no cambia el acierto y deja cada jugada en la mitad de tiempo.
**Consecuencias:** `dictionary(lang)` devuelve el mazo hasta que el grande llega, y `loadDictionary(lang)` lo trae. Los `dict-*.js` entran en `set-version.py` porque el import map también alcanza a los `import()` dinámicos: sin eso quedarían cacheados sin forma de invalidarlos (C-11). `cpuGuess` normaliza una sola vez por diccionario, que con cien mil palabras se nota. `ahorcado/dict.test.mjs` exige que **todas las iniciales** tengan palabras: es lo que atrapó las dos extracciones defectuosas, que ningún chequeo de tamaño habría visto.

## D-65 · Contra el celular se va; en su lugar queda jugar solo
**Fecha:** 2026-09-12 · **Estado:** vigente · **Deroga D-64**
**Decisión:** El tercer modo deja de ser un duelo contra la máquina y pasa a ser **🧍 Jugar solo**: un jugador, una palabra que reparte la app de la temática elegida, y a sacarla. La máquina ya no adivina nada. Se van con ella `cpuGuess` y `matches` del motor, los diccionarios `dict-<idioma>.js` (tres megas) y las herramientas de `tools/diccionario/`.
**Por qué:** que el celular tratara de adivinar *tu* palabra era una simetría forzada. El ahorcado es alguien que pone una palabra y alguien que la saca; poner al aparato del lado del que adivina no agrega un rival, agrega una animación de un rival. Y salía caro: para que adivinara de verdad hacía falta un diccionario de cien mil palabras por idioma, que es más peso que todo el resto del juego junto.
**Lo que se gana además:** jugando solo la palabra sale del mazo, así que no hay secreto que comprometer. Este modo no necesita `crypto.subtle` y por lo tanto anda por http, que es justo lo que hacía falta para probarlo desde un celular de la red local sin montar https.
**Un solo aviso al terminar:** jugando solo no hay veredicto de ronda. Decía lo mismo que la pantalla final —"¡La sacaste!" dos veces seguidas—, y encima entraba encima del cartel de la última letra, que así no se alcanzaba a ver. Ahora la letra que cierra la palabra se ve sobre el tablero completo y de ahí se pasa al resultado. En los otros modos el veredicto se queda: ahí sí hay a quién pasarle el celular o gente esperando.
**Consecuencias:** `hasTurns()` pasa a ser solo el modo de un celular —jugando solo no hay turno que esperar, y en varios celulares nunca lo hubo—, así que `current` puede venir en nulo y el tablero cae al único jugador. La pantalla final tiene una tercera forma: sin ranking, sin "ganó fulano" y con "la palabra era". El cartel de la letra (D-63) se queda, porque este modo tampoco abre ninguna pantalla; la retención del tablero propio se va, porque no hay a quién pasarle el turno.

## D-66 · En la sala también se juega por turnos
**Fecha:** 2026-09-12 · **Estado:** vigente · **Corrige D-53 y D-59**
**Decisión:** En varios celulares se juega **por turnos alternados**, igual que pasándose un celular: una letra cada uno, en el orden en que entraron a la sala. Quien no tiene el turno ve su tablero con el teclado bloqueado y el título dice a quién le toca. La tira de rivales marca en amarillo de quién es el turno.
**Por qué:** La sala se había diseñado simultánea para que nadie se quedara mirando (D-53). Pero jugando de a dos —que es como se juega la mayoría de las veces— la simultaneidad se come justo lo que hace divertido un duelo: ver la jugada del otro y responder. No hay secuencia que seguir ni contra quién medirse en el momento; son dos solitarios que terminan comparando puntajes. El argumento de "nadie mira" tampoco se sostiene ahí: esperar un turno es un segundo.
**Lo que cuesta:** con cuatro o más, cada jugador espera a que tiren todos los demás antes de volver a jugar. Es el precio de que haya una secuencia, y se paga con los ojos en la tira de rivales, que ahora sí cuenta algo mientras esperas. Si se vuelve pesado con mesas grandes, la salida sería elegirlo en la sala y no cambiar el reductor.
**El celular que se va:** con turnos, un jugador que cierra la pestaña trabaría la sala para siempre. `nextAlive` saltea a quien está marcado fuera, y si vuelve entra de nuevo en la rueda. Los ausentes salen de `M.presence`, que ya existía para el aviso de desconexión, y viajan a `buildState` como `config.away`: el motor no sabe de red, solo recibe a quiénes saltear.
**Mientras le toca a otro no hay teclado:** una botonera entera apagada ocupa media pantalla para decir "todavía no". Se esconde, y con ella la barra de acciones; quedan el dibujo, la pista, la palabra y la tira, que es lo que hay para mirar mientras esperas. El teclado vuelve con el turno.
**Consecuencias:** `hasTurns()` pasa a ser "todos menos jugando solo". En la sala, `mine` deja de ser siempre verdadero y pasa a ser "es mi turno": el reductor ya descartaba las jugadas fuera de turno, pero ahora el teclado tampoco las deja intentar. El título de la pantalla nombra a quien juega, que en la sala puede no ser el dueño del tablero que estás viendo.

## D-67 · El laboratorio se va: se sirve el árbol de trabajo
**Fecha:** 2026-09-12 · **Estado:** vigente · **Deroga D-42**
**Decisión:** Se sacan `lab/` y `tools/lab.py`. Para mirar un cambio de interfaz en un celular de verdad se sirve el árbol de trabajo con `tailscale serve --bg 8765`, que da una URL `https://<equipo>.<tailnet>.ts.net/` alcanzable desde cualquier aparato del tailnet. Para revisar una pantalla suelta sin jugar una partida entera está `tools/e2e/mirar.mjs`.
**Por qué:** D-42 lo dijo con todas las letras: el laboratorio existía porque «la única forma era publicar el cambio y arriesgarse, o dejarlo en local y no probarlo nunca en el aparato donde se juega». Eso dejó de ser cierto: servir el árbol de trabajo por Tailscale da lo mismo y mejor, porque es **la app entera** y no un espejo, con HTTPS —así que sirven también los modos que necesitan contexto seguro— y sin nada que mantener al día.
**Lo que costaba:** los espejos son copias del `index.html` de cada juego, y envejecen. Pasó el mismo día que se sacó: al sumarle dos `id` al HTML del resultado, `lab.py revisar` empezó a fallar. Es un aviso útil, pero de un problema que el laboratorio se inventa a sí mismo. En su vida útil nunca se promovió un experimento: `lab.css` estuvo vacío desde el principio y el único que hubo se descartó.
**Lo que se pierde:** comparar app y experimento lado a lado en dos pestañas, y aislar un cambio de estilo en un archivo que se borra de una. Si alguna vez hace falta, sale más barato volver a armarlo que mantenerlo vacío por si acaso.
**Consecuencias:** `stats.js` deja de emitir el entorno `lab` y `envOf()` ya no mira la ruta, solo el host; el panel sigue sabiendo nombrar `lab` para lo que quedó guardado de antes. Se va el paso de "revisar espejos" de la lista de antes de publicar.

## D-68 · Cuarto Rey no lleva variantes configurables
**Fecha:** 2026-09-13 · **Estado:** vigente · **Acota D-03, D-06 y D-12**
**Decisión:** Se saca CR-17 de los requerimientos. Cuarto Rey se juega de una sola forma: dos sorbos por regla, la partida termina con el cuarto rey y el celular reparte. Las tres variantes que se habían dejado anotadas —elegir la cantidad de sorbos, seguir hasta agotar el mazo, usar naipe real— no se van a construir.
**Por qué:** eran tres cosas distintas metidas en una línea, y ninguna se sostiene sola. Los sorbos configurables no son un número: "toma dos sorbos" está escrito en las cartas, en los overlays y en el ranking, en tres idiomas, así que la variante se paga entera en textos para cambiar un 2 por un 3 en una app donde el vaso lo sirve cada uno. Seguir hasta agotar el mazo revierte D-06, que eligió terminar con el cuarto rey justamente para no dejar rondas largas sin tensión. Y el naipe real revierte D-12: el celular dejaría de repartir y cada turno ganaría una pantalla de "¿qué carta salió?", que es fricción en el único momento en que el juego pide no tener ninguna.
**Lo que no cambia:** D-03 sigue valiendo por lo que hace hoy —las reglas son datos y por eso el juego existe en tres idiomas sin tocar lógica—, no por la variante que prometía. Si algún día aparece una variante que la mesa pida de verdad, cabe igual; lo que se descarta es construirla por si acaso.
**Consecuencias:** la especificación deja de listar las variantes entre las ideas futuras. De los pendientes de Cuarto Rey queda cerrado también CR-18, así que el juego no tiene requerimientos abiertos.

## D-69 · Dudo: cinco dados, ases comodín y calzar, pero sin ronda obligada
**Fecha:** 2026-09-13 · **Estado:** vigente
**Decisión:** El juego nuevo es **Dudo** 🎲 (2 a 6). Se juega con cinco dados por jugador, los ases son comodín, subir es más cantidad o la misma cantidad con pinta mayor —entrar a los ases cuesta la mitad y salir el doble más uno— y se puede **calzar** desde que la apuesta llega a la mitad de los dados de la mesa. **No** hay ronda obligada.
**Por qué este juego:** el menú tenía cartas, palabras, números y una grilla, y no tenía dados. Y es el juego donde el celular más mejora al original: no reemplaza un mazo como en Cuarto Rey, sino que reparte, **prohíbe la apuesta ilegal** y cuenta al instante, que es exactamente lo que se discute a gritos en la mesa real. Además casi no tiene contenido que traducir —no hay mazo—, así que los tres idiomas cuestan la interfaz y nada más.
**Por qué calzar con tope:** sin restricción es una apuesta gratis. Con muchos dados tapados, acertar la cantidad exacta es casi imposible, pero fallar cuesta lo mismo que dudar mal, así que el que va perdiendo lo intentaría siempre. Desde la mitad de la mesa la cuenta exacta ya es una decisión.
**Por qué sin ronda obligada:** es clásica en Chile y va a entrar, pero aparece tarde en la partida y hay que explicarla en tres idiomas justo cuando el juego recién se entendió. El motor la deja prevista: `countPinta` recibe `acesWild` y la apuesta legal se calcula aparte, así que sumarla no es rehacer nada. Queda como DU-14.
**Consecuencias:** el modo de varios celulares no entra en la v0.28 y se muestra "Próximamente", que es lo que C-5 manda para un modo que todavía no existe. El motor ya habla el protocolo de la sala, así que lo que falta es la sala, no el juego.

## D-70 · Los dados no salen de la semilla
**Fecha:** 2026-09-13 · **Estado:** vigente · **Excepción a C-7**
**Decisión:** En Dudo, los dados de cada ronda **no** se derivan de la semilla compartida: cada celular tira los suyos con `crypto.getRandomValues` y publica `sha256(dados + sal)`. Al dudar, cada uno manda sus dados y su sal, y todos verifican los hashes anunciados al abrir la ronda (C-10).
**Por qué:** C-7 dice que todo lo repartible sale de la semilla, y para las cartas de Línea de Tiempo o la palabra del mazo del Ahorcado está bien: son públicas apenas se juegan. Los dados no. **El código de esta app es público**: si los dados salieran de una semilla que todos los celulares conocen, cualquiera podría abrir la consola y calcular los del rival, que es el juego entero. Es el mismo problema que ya tenía la flota de Batalla Naval, y se resuelve igual: el secreto vive en el celular de su dueño.
**Cómo queda C-7 igual:** el estado se sigue derivando de la lista de mensajes. Lo que cambia es que el mensaje que abre la ronda lleva un hash en vez de los dados, y que la ronda no se puede contar hasta que estén todos los `open`. En un celular y contra el celular los dados van en claro en el mismo mensaje —no hay a quién escondérselos— y por eso el destape es instantáneo: un solo camino en el motor para los tres modos.
**Consecuencias:** una sala no puede resolver una ronda si alguien se va sin destapar. A diferencia del Ahorcado (D-66), acá **no se saltea el turno de quien se fue**: en el Ahorcado cada uno tiene su tablero y saltarlo solo cambia el orden, pero en Dudo los dados del ausente son parte de la cuenta y descartarlos cambiaría el resultado, además de depender de la presencia, que cada celular ve distinto. Una sala trabada se cancela (D-50). Queda anotado para cuando se construya DU-09.

## D-71 · Dudo se dice en chileno, y en un duelo no se calza
**Fecha:** 2026-09-13 · **Estado:** vigente · **Ajusta D-69**
**Decisión:** Tres cambios en Dudo, los tres sobre cómo se juega y cómo se lee la mesa.

**1. Calzar necesita tres jugadores.** Con dos, calzar deja de ser una apuesta: el que calza ve su
propia mano y solo hay **una** mano tapada, así que la cantidad exacta se calcula en vez de
arriesgarse. Se apaga solo cuando una mesa de seis se queda en dos, no solo al configurar la
partida, y por eso vive en el motor (`calzarOk` recibe cuántos siguen vivos) y no en la pantalla.
En la configuración, el interruptor de calzar aparece recién cuando hay tres nombres anotados:
ofrecer un ajuste que no va a poder usarse es peor que no ofrecerlo.

**2. En español, las pintas se llaman como en la mesa: ases, tontos, trenes, cuadras, quintas y
sextas.** Es la forma en que se juega Dudo en Chile —el juego se dice "cuatro quintas", no "cuatro
cincos"— y el canon manda español chileno informal (C-3, RP-12). Viene **encendido por defecto** y
se puede apagar para volver a los números, porque quien no conoce los nombres necesita una salida y
porque el juego también se juega fuera de Chile en español.
**Es una opción de un solo idioma.** En inglés y en portugués no hay un juego de nombres equivalente
instalado, así que las pintas van por su número y el interruptor no se ofrece. Por eso los nombres
viven en un `export const CHILENO` de `rules.js` y no dentro de `LOCALES`: no son una traducción que
falte en dos idiomas, son contenido de uno solo, y meterlos en `LOCALES` habría obligado a inventar
un equivalente en inglés y portugués solo para que cuadrara la prueba de paridad.

**3. Los dados de la botonera se dibujan en hueco.** Antes la botonera de pintas usaba el mismo dado
sólido que la mano del jugador, más chico. Dos cosas con la misma forma y el mismo peso visual son
dos cosas del mismo tipo, y no lo son: una es lo que te tocó y la otra es un botón para nombrar una
pinta. Ahora la botonera va con el contorno y los puntos en línea, y la cara sólida queda solo para
los dados de verdad. El elegido se rellena apenas, en cian, que es el color con que la app marca la
selección en todos los juegos.
**Consecuencias:** `MIN_CALZAR` queda en el motor y la prueba lo cubre con una mesa que empieza en
tres y termina en dos. Una partida guardada de antes no trae `chileno` en su configuración y se
retoma con los nombres encendidos, que es el valor por defecto.

## D-72 · La tarjeta que se ve al compartir un link
**Fecha:** 2026-09-13 · **Estado:** vigente
**Decisión:** Cada página publicada —el menú y los seis juegos— lleva sus propias etiquetas de Open Graph y de Twitter, con su título, su bajada y una imagen propia de 1200×630 en `assets/og/`. Las etiquetas las escribe `node tools/og.mjs tarjetas` desde `assets/js/games.js`, dentro de un bloque `<!-- generado: og -->`, y `set-version.py` lo corre en cada publicación. Las imágenes las dibuja `tools/og/tarjeta.html` —con los estilos y los datos reales— y las fotografía `node tools/og.mjs imagenes`.
**Por qué por página y no una sola para todo el sitio:** en esta app el link que más se comparte no es la portada, es **la invitación a una sala**: `juegosdesalon.cl/toque-y-fama/?sala=WDDT`, pegado en un WhatsApp. Con una tarjeta única, esa invitación mostraba el nombre del sitio y nada más; ahora muestra de qué juego es la sala, para cuántos y cuánto dura, que es exactamente lo que necesita saber el que la recibe. Antes de esto no había ninguna etiqueta: un link pegado en un chat salía sin imagen y con el título pelado.
**Por qué generadas y no escritas a mano:** son siete páginas por veinte etiquetas. Escribirlas a mano es copiar el nombre y la bajada de cada juego a un segundo lugar, y ese segundo lugar envejece: `games.js` ya es de donde salen el menú y el README. `revisar` avisa si una página quedó atrás o si falta una imagen.
**Por qué JPEG y no PNG:** son letras grandes sobre un degradado, y en PNG pesaban 430 KB cada una: 3 MB en el repo por siete imágenes que solo miran los robots de los chats. En JPEG al 82% pesan 130 KB y a este tamaño no se distingue la diferencia. Se convierten con `sips`, la misma herramienta que ya usa `readme.py` para las capturas.
**La versión va en la URL de la imagen** (`dudo.jpg?v=0.29.1`): WhatsApp y las redes cachean la tarjeta por semanas, así que sin eso un dibujo nuevo no se vería hasta que a ellos se les ocurriera volver a mirar. Como el sufijo `?v=` es el mismo que usa el estampado de C-11, `readme.py` ya sabe que un cambio así no envejece ninguna captura.
**Consecuencias:** el `panel/` no lleva tarjeta —es privado y ya va con `noindex`—. Las imágenes se rehacen a mano porque necesitan navegador e internet (las fuentes son de Google Fonts); solo cambian si cambia un nombre, un emoji o el diseño de la tarjeta.

## D-73 · El panel se entera solo de los juegos nuevos
**Fecha:** 2026-09-13 · **Estado:** vigente
**Decisión:** El panel del dueño no tiene listas propias. Los juegos y los modos viven en `assets/js/games.js` (`GAMES` y `MODES`, con `gameLabel`, `modeIcon`, `ROOM_MODE`, `LOCAL_MODES` y `MAX_PLAYERS` derivados), los entornos en `transport/stats.js` y los idiomas en `i18n.js`; el panel los importa y dibuja también lo que no reconoce, con su clave por nombre. Las reglas de la base validan el modo y la cantidad de jugadores por forma y no por enumeración. Queda escrito como canon C-16 y lo vigila `node panel/adapta.test.mjs`.
**Por qué:** el panel tenía cuatro listas copiadas —los juegos, los modos con su ícono, los idiomas con su nombre y los entornos del `<select>`— más una regla de CSS por modo y una enumeración de modos en las reglas de Firebase. Agregar un juego nuevo funcionaba de casualidad (el id se muestra tal cual si no está en el menú), pero agregar un **modo** fallaba de la peor manera posible: el contador ni salía del celular, porque `startChanges` filtraba contra su propia lista, y si salía, las reglas lo rechazaban con un 401 que nadie mira. El dato no se veía mal: no existía. Una lista copiada en una página que se abre una vez por semana no se mantiene sola, y el panel es justamente donde no se nota que falta algo.
**Por qué por forma y no por lista en las reglas:** una lista en las reglas rechaza en el servidor, la partida sigue igual (el registro es mejor esfuerzo, D-44) y el dato se pierde para siempre. Validar la forma (`^[a-z][a-z-]{0,15}$` para el modo, `^[1-9][0-9]?$` para la cantidad, `^[a-z]{2,10}$` para el entorno) deja pasar lo nuevo y sigue acotando lo que un extraño puede escribir: los contadores ya suben de a uno y solo por rutas con esa forma.
**Por qué preguntarle el nombre del idioma al navegador:** `Intl.DisplayNames` nombra cualquier código en español, así que un idioma nuevo en `i18n.js` aparece como "Francés" y no como `fr`, sin una tabla que mantener. Si el navegador no sabe, se muestra el código.
**Consecuencias:** hay que **publicar las reglas** en la consola de Firebase para que el cambio de validación tenga efecto; hasta entonces un modo nuevo seguiría rechazado. El tope de jugadores dejó de ser un 6 escrito en dos archivos, pero los roles de sala (`A`–`F`) y el patrón `$p` de las reglas siguen topando en seis: un juego de más de seis en dos celulares es otro cambio. Un modo desconocido en la base ahora suma al total del juego: lo que antes se descartaba como basura, si tiene forma de modo, cuenta.


## D-73 · La invitación dice quién invita
**Fecha:** 2026-09-13 · **Estado:** vigente · **Amplía D-72**
**Decisión:** Al compartir una sala, el mensaje es **"{nombre} te invita a jugar {juego} en juegosdesalon.cl - Sala: {código}"**. El texto es uno solo para los cuatro juegos con sala y vive en `COMMON` de `assets/js/i18n.js`, no en el `rules.js` de cada uno. Nombra a **quien toca compartir**, no al anfitrión: en una sala de seis cualquiera puede pasar el link, y el que invita es el que lo pasa.
**Por qué:** el mensaje decía "Únete a mi sala de Línea de Tiempo. Código: WFBN" — sin nombre. Llega por WhatsApp a alguien que muchas veces no conoce la app, y lo primero que hace falta saber es de parte de quién viene. El resto —de qué se trata el juego, para cuántos, cuánto dura— ya no hace falta escribirlo: lo pone la tarjeta que el chat arma solo con el link (D-72), y por eso también se sacó la temática que algunos juegos metían en el texto.
**Por qué compartido y no por juego:** eran cuatro juegos por tres idiomas, doce frases que decían lo mismo con doce redacciones distintas. La única parte que cambia es el nombre del juego, y ese ya viaja como `{game}`.
**Al copiar también viaja el mensaje.** Sin diálogo nativo —en un computador, o si el navegador no comparte— el portapapeles se llevaba **solo la URL** y el texto se perdía: quien invitaba tenía que escribir a mano de qué se trataba. Ahora se copia el mensaje y el link, en dos líneas.
**Y la tarjeta se dibuja adentro de una franja segura:** cada chat recorta la imagen al alto de su ventanita y lo que se come son los lados. Con 1200×630 recortada a 1,5:1 se van 127 px por lado, y ahí quedaba justo la última letra del título —la N de "SALÓN" salía cortada en WhatsApp—. Ahora todo lo que se lee vive dentro del 88% central, y `node tools/og.mjs imagenes` avisa si algo se acerca al borde. El degradado del fondo es lo único que puede perderse.

## D-74 · El idioma puede venir en el link
**Fecha:** 2026-09-13 · **Estado:** vigente · **Amplía D-47**
**Decisión:** Cualquier página de la app acepta `?lang=es|en|pt`. Al cargar, `i18n.js` lo aplica, lo guarda como cualquier elección y **saca el parámetro de la barra de direcciones**, dejando el resto de la URL intacto (el `?sala=` de una invitación sigue ahí). Además hay dos puertas de entrada, `/pt/` y `/en/`, que son dos archivos de veinte líneas: dejan el idioma elegido y mandan a la portada, que es una sola para los tres. Y **la invitación a una sala lleva el idioma pegado**: quien la recibe abre la app en el mismo idioma en que se la mandaron.
**Por qué no rompe D-47:** ese canon dice que el idioma **no se detecta** del navegador, y sigue siendo así. Acá no se adivina nada: alguien eligió el idioma —para sí mismo con el toggle, o para el que va a recibir el link— y esa elección viaja. Un `?lang=` que no sea uno de los tres se ignora en silencio y la app queda en español.
**Por qué rutas y no subdominios:** `pt.juegosdesalon.cl` es lo más bonito de leer, pero GitHub Pages sirve **un** dominio por repositorio (el `CNAME`), así que cada subdominio necesitaría otro destino de publicación o un proxy delante. Por una etiqueta de idioma es mucha máquina. Las carpetas cuestan dos archivos y no tocan la infraestructura.
**Por qué se saca el parámetro de la URL:** lo que circula tiene que ser la dirección de siempre —la que está en las tarjetas sociales, la que indexa el buscador, la que la gente copia—. El idioma ya quedó guardado, así que el parámetro no tiene nada más que hacer ahí; y donde sí hace falta que viaje, que es la invitación, lo pone el juego a propósito con `withLang()`.
**Las puertas también se comparten:** `/pt/` y `/en/` llevan sus propias etiquetas Open Graph y su propia imagen de 1200×630 en su idioma (D-72), y las tres se anuncian entre sí con `hreflang`. Pegar `juegosdesalon.cl/pt/` en un grupo de Brasil muestra la tarjeta en portugués.
**Consecuencias:** las páginas de los juegos no tienen una URL por idioma: adentro el idioma se elige y se guarda, así que no hay tres direcciones que ofrecerle al buscador. El panel es español solo y el parámetro no le hace nada. Prueba de punta a punta en `tools/e2e/idioma-por-url.mjs`.

## D-75 · La app mide lo que se ve, no lo que la pantalla dice que mide
**Fecha:** 2026-09-13 · **Estado:** vigente
**Decisión:** `.app` pide `calc(100dvh - var(--safe-top) - var(--safe-bottom))` y no `100dvh`. El `body` ya reserva las muescas con su `padding`, así que pedir la pantalla entera adentro de una caja que ya se achicó dejaba la página **más alta que el celular por exactamente el alto de las muescas**: 81 px en un iPhone con muesca (47 arriba, 34 abajo).
**Cómo se vio:** en Dudo, la barra de apostar se apoya en el borde de abajo (`margin-top: auto`), así que se iba fuera de la pantalla con medio celular vacío más arriba. En los otros juegos el contenido baja desde arriba y esos 81 px de más solo se notaban como un scroll de la nada. Es un error del armazón compartido, no de Dudo: se arregla una vez en `base.css` y vale para los seis juegos, el menú y el panel.
**Por qué ninguna prueba lo vio:** en Chrome headless `env(safe-area-inset-*)` vale 0, así que la página medía exactamente lo que tenía que medir y todo pasaba. El error solo existe en un celular con muesca, que es justo donde se juega.
**Lo que queda para que no vuelva:** `node tools/e2e/mirar.mjs <juego> <pantalla> --muescas` simula 47 y 34, y el informe ahora dice dos cosas más: cuánto se pasa la página del alto del celular y qué botones caen por debajo del borde. Con el error puesto de vuelta, avisa "⚠️ 81 px" y nombra el botón de apostar.

---

## D-76 · Las capturas se sacan con la pantalla quieta
**Fecha:** 2026-09-13 · **Estado:** vigente
**Decisión:** Antes de disparar, `b.shot()` (`tools/e2e/cdp.mjs`) espera a que terminen las
animaciones finitas que estén corriendo, con un tope de 900 ms; las infinitas —las burbujas del
fondo, el `wiggle`, el `shimmer`— no se esperan nunca porque no terminan. Además, la lista de
jugadores de Cuarto Rey dejó de animarse entera: entra animada **solo la fila recién agregada**, y
entra desplazándose, no escalándose.
**Por qué:** en el README, la pantalla "¿Quiénes juegan?" mostraba las cuatro filas con anchos
distintos, como si la grilla estuviera mal armada. No lo estaba: cada fila entraba con un `pop`
—`scale(0.6) → 1.08 → 1`— escalonado de a 40 ms, y la captura se sacaba a los 300 ms, con las dos
primeras filas ya asentadas y las dos últimas todavía creciendo. Una animación de escala sobre una
fila de ancho completo **cambia su ancho mientras dura**, así que congelarla a la mitad es
fotografiar cuatro anchos distintos. El bug no estaba en el CSS de la fila: estaba en el instante
en que se apretaba el obturador, y el mismo instante afectaba a las fichas de "¡Salud!" y a
cualquier pantalla con entradas escalonadas.
**Por qué el tope es corto:** varias pantallas se pasan solas —el pase del celular a los 1,8 s, el
"¡Salud!" a los 2,6 s—. Una espera larga no sacaría una foto más quieta: sacaría otra pantalla.
**Por qué además se cambió la animación y no solo la espera:** la lista se redibuja entera cada vez
que alguien agrega o borra un jugador, así que las cuatro filas saltaban de nuevo por una fila
nueva. Eso se veía en el celular, no solo en la captura, y ninguna espera lo arregla.
**Y de paso, la fila angosta:** el selector de género le comía el ancho al nombre —en un celular de
320 px el campo quedaba en dos letras—. Bajo 400 px la fila se aprieta (número, separaciones y
botones) y bajo 340 px el selector se baja entero a una segunda línea, a lo ancho. Los botones de
género y la ✕ miden 44 px de alto, con área táctil ampliada la ✕ (C-8).
**Consecuencias:** hay una hoja de contacto, `node tools/e2e/contacto.mjs [seccion]`, que arma un
PNG con todas las capturas de una sección al tamaño en que el README las muestra. Mirarla es parte
de publicar: las capturas se rehacen solas, pero nadie las revisaba de a una. Mirándola se
encontraron dos más —el ranking final y el "¡Cuarto Rey!" tapados por el confeti, y un "¡Salud!"
que en realidad decía "¡Cumplida!"—, que se arreglaron en el guion, no en el juego.

---

## D-77 · La app se arma con el alto chico de la pantalla
**Fecha:** 2026-09-13 · **Estado:** vigente · **Corrige D-75 (el alto), ajusta D-76**
**Decisión:** `.app` mide `calc(100svh - muescas)`, no `100dvh`. `svh` es el **alto chico**: el que
queda cuando el navegador muestra toda su interfaz. El `body` sigue pintando `100dvh` para que el
fondo llegue al borde. Y `mirar.mjs --muescas` dejó de simular las muescas con variables CSS: ahora
se las pide a Chrome (`Emulation.setSafeAreaInsetsOverride`), que es lo que la página lee con
`env(safe-area-inset-*)`.
**Por qué:** la barra de apostar de Dudo seguía saliéndose de la pantalla en un Android con la app
instalada, después de que D-75 diera el asunto por cerrado. La página del diagnóstico
(`tools/diag/`, abierta en ese mismo celular) mostró por qué: **`dvh` daba 1016 px y `svh` 960**. La
app se armaba con el valor de `dvh`, 56 px más larga que lo que se alcanza a ver, así que lo que se
apoya abajo —la barra de apostar— quedaba justo afuera: alcanzable deslizando, pero afuera. Las
muescas no tenían nada que ver: en ese aparato `env(safe-area-inset-*)` vale 0 y la ventana ya
excluye las barras del sistema.
**Por qué `svh` y no seguir con `dvh`:** `dvh` es el alto **de este instante**, y el instante puede
ser el bueno. Vale para animar, no para decidir dónde termina una pantalla: la app se arma una vez
y la barra tiene que estar adentro también cuando el navegador muestra su interfaz. Con `svh` lo
que puede sobrar es un poco de fondo abajo —invisible, porque el `body` pinta `100dvh`—; lo que
nunca pasa es que falte.
**Por qué el diagnóstico y no otro arreglo a ojo:** D-75 se validó con un sustituto —`--muescas`
sobreescribía `--safe-top` y `--safe-bottom`—, y un sustituto no mueve el viewport ni el `dvh`: por
eso daba verde con el error puesto. Con muescas de verdad la página mide exactamente el alto de la
pantalla, o sea que el error nunca estuvo ahí. Los números que lo decidieron no los tenía ninguna
prueba: los tenía el celular, y hubo que ir a buscarlos.
**Consecuencias:** `mirar.mjs` agrega una línea al informe —"se arma con el alto chico (svh)"— que
revisa la **regla**, no la medida, porque en Chrome headless `dvh` y `svh` valen lo mismo y una
medida nunca vería la diferencia. `tools/diag/` se publicó mientras duró el diagnóstico y se borró
apenas el celular confirmó el arreglo: era la única página del sitio que no es la app. Si vuelve a
hacer falta, está en la historia (`git show effd591:tools/diag/index.html`), y lo que mide —dvh,
svh, lvh, la ventana, las muescas y cuánto se pasa la página— es la lista de lo que hay que ir a
buscar al aparato cuando una pantalla se corta y en el escritorio se ve bien.

---

## D-78 · El README en inglés, el resto en español
**Fecha:** 2026-09-13 · **Estado:** vigente
**Decisión:** `README.md` se escribe en inglés. Todo lo demás sigue en español: los cánones, las
decisiones, las especificaciones de cada juego, los comentarios del código y los mensajes de las
herramientas. Lo que el README muestra generado también sale en inglés: los modos se leen del `en`
de cada `rules.js`, las temáticas del `en` de los mazos y el `pie` de `docs/capturas.json` se
escribe en inglés. Queda como canon en C-13.
**Por qué:** la app es chilena, se juega en chileno y se piensa en español, y eso no cambia. Pero el
README no es parte de la app: es la puerta del repositorio, y por ahí entra gente de cualquier
parte que no lee español. Todo lo demás lo lee quien trabaja en el proyecto.
**Por qué también los bloques generados:** si la prosa quedaba en inglés y las tablas en español,
`python3 tools/readme.py actualizar` devolvía la mitad del archivo al español en la primera
publicación. Un README bilingüe por accidente es peor que uno en cualquiera de los dos idiomas.
**Los títulos llevan los dos nombres:** `## 👑 Fourth King (Cuarto Rey)`. Primero el inglés, que es
por lo que alguien de afuera busca el juego, y entre paréntesis el nombre de verdad, que es como se
llama en la app y lo que va a ver en pantalla. La tabla de arriba muestra los tres
(`Fourth King / Cuarto Rey / Quarto Rei`). El ancla del índice sale del título completo
(`#-fourth-king-cuarto-rey`) y la arma `titulo_juego()` en `tools/readme.py`, la misma función que
dicta cómo se titula la sección: si cambia el título cambia el enlace, y no hay forma de que queden
apuntando a distinto lado.
**Consecuencias:** `tools/hechos.mjs` guarda los modos en los dos idiomas, no solo en español, y
`jugadores` viaja como "1 to 6". Al agregar un juego hay un paso más explícito en
`docs/AGREGAR-JUEGO.md`: la sección del README y el `pie` de las capturas van en inglés.

---

## D-79 · El panel anota quién ganó y de qué país se jugó
**Fecha:** 2026-09-14 · **Estado:** vigente · **Cambia D-44**
**Decisión:** El registro de una sala (`stats/<env>/days/<día>/rooms/<CÓDIGO>`) suma dos cosas:
`co/<rol>`, el país del celular de cada jugador en dos letras, y `end: { winner, name, at }`, quién
ganó esa partida. Con eso el panel muestra una **bitácora de salas jugadas**: cuándo, quiénes (con
la bandera al lado del nombre), qué juego y quién ganó, filtrada por el rango de 7 o 30 días que ya
tenía y paginada de a 20.
**Qué cambia de D-44:** esa decisión decía que del panel "nunca sale quién ganó". Ahora sí, porque
el dueño quiere leer las partidas como partidas y no solo como contadores. Lo demás de D-44 sigue
igual: sin IP, sin secretos, sin chat, y de los modos sin red no sale ni un nombre. La sala ya
guardaba los nombres, así que lo nuevo de verdad es el país y el resultado.
**Por qué el país sale del huso horario y no del idioma:** un celular chileno puesto en inglés dice
`en-US` y lo daría por estadounidense. Al navegador se le pregunta qué husos tiene cada país
(`Intl.Locale.getTimeZones`), así que no hay tabla de husos que mantener; el idioma queda de
respaldo y, si ninguno de los dos lo dice, la sala se muestra sin bandera. Preferimos un hueco a un
país inventado.
**Por qué se guarda el país y no el huso:** el huso es más fino que lo que se muestra y dice a qué
ciudad pertenece el celular. En el registro por día ya está el contador de husos, que es agregado y
no dice de quién es cada uno; acá, pegado a un nombre, se guarda solo lo que la lista enseña.
**Por qué lo manda cada celular al llegar al final:** el ganador lo sabe el juego, no el transporte.
Cada celular que llega a la pantalla final lo apunta y las reglas solo dejan escribirlo una vez: el
primero lo deja puesto y los demás rebotan, sin reintentos ni coordinación. Si no sale, no sale: es
mejor esfuerzo, como todo lo que va al panel.
**Por defecto no se ven las pruebas ni las salas vacías:** las partidas de prueba corren en el
entorno `dev` y el panel abre en `prod`, así que quedan fuera solas (D-45); y una sala donde nunca
entró un segundo jugador no es una partida, así que se muestra solo si se pide con la casilla.
**Consecuencias:** hay que **publicar las reglas** en la consola de Firebase; hasta entonces el país
y el ganador se rechazan en silencio y la lista los muestra en guion. Nada de esto es retroactivo:
las salas jugadas antes de esta versión salen sin bandera y sin ganador, y se muestran igual, porque
una sala de la que se sabe menos es una sala que igual pasó.

---

## D-80 · Seis rangos en el panel, y lo que se baja crece con ellos
**Fecha:** 2026-09-14 · **Estado:** vigente · **Amplía D-79**
**Decisión:** El panel ofrece seis rangos —7, 30, 60 y 90 días, 1 año y lo que va del año—, y con
ellos se filtran **todas** las cifras de la página, incluida la bitácora de salas. La lista de
rangos vive en `panel/aggregate.js` (`RANGOS`): de ahí salen el selector, el título, la ventana que
se le pide a la base y el grano de la barra "cuándo se juega".
**Lo que se baja crece con el rango, y nunca al revés:** la suscripción arranca en el día más
antiguo que pida el rango elegido y solo se vuelve a pedir si alguien elige uno más largo. Mirar la
semana no descarga un año, y volver de un año a la semana no descarga nada. Antes se bajaban
siempre 30 días fijos.
**Por qué la barra cambia de grano:** un año en barras diarias son 365 barras de un píxel. Hasta 30
días va por día, hasta 90 por semana (rotulada con su lunes) y de ahí en adelante por mes. Agrupar
no puede perder ni inventar partidas, y eso lo vigila `panel/aggregate.test.mjs`.
**Por qué "este año" se cuenta en UTC:** los días se numeran en UTC y el panel rotula todas sus
fechas en UTC. Tomar el año del reloj local mientras los días son UTC hace que en las primeras horas
del 1 de enero el rango empiece en enero del año pasado y termine mañana. La diferencia dura unas
horas al año; la incoherencia duraría todas.
**Consecuencias:** un rango largo tarda en llegar, así que mientras no esté el título dice
"cargando…": un año a medio bajar se ve igual que un año sin partidas, y son cosas distintas (C-14).
Los datos solo llegan hasta donde llegue el registro: el panel existe desde la v0.20, y del país y
el ganador solo hay desde la v0.33.6 (D-79).

## D-81 · Las cartas de la sala viajan en sobres cerrados
**Fecha:** 2026-09-14 · **Estado:** vigente · **Amplía D-70**
**Decisión:** En la sala de Julepe el reparto no viaja en claro ni sale de una semilla compartida:
cada celular genera un par de llaves al entrar (RSA-OAEP del propio navegador, `assets/js/sobre.js`)
y publica la pública junto con su nombre; quien reparte cierra la mano de cada jugador con la llave
de esa persona. El mensaje `reparte` lleva un sobre por rol y nadie más lo puede abrir.
**Por qué no la semilla:** es lo mismo que ya pasaba con los dados (D-70), pero peor. Un hash sirve
para *comprometer* un secreto que después se destapa entero; acá hay que **entregarle** cinco cartas
a alguien y que nadie más las vea mientras se juega, y para eso no hay hash que valga.
**Lo que no evita:** quien reparte arma las manos, así que pasan por su celular en claro. Es el
trato de la mesa real —el que baraja podría marcar las cartas— y por eso el reparto rota en cada
mano. Lo que sí queda probado al cerrar la mano es que nadie **jugó** una carta que no le tocó:
cada uno destapa sus ocho cartas y todos verifican contra lo que tiraron (C-10).
**Consecuencias:** hace falta contexto seguro (https o localhost). Sin `crypto.subtle` no se puede
cerrar nada, así que el reparto va en claro y el cierre de la mano lo dice con todas sus letras en
vez de fingir un secreto que no existe (C-14). La llave privada se guarda con la partida
(`private`, C-6): sin ella, un celular que recarga no podría volver a abrir su propia mano.

## D-82 · La reserva: tres cartas tapadas en vez de un mazo común
**Fecha:** 2026-09-14 · **Estado:** vigente
**Decisión:** En Julepe a cada jugador le tocan **ocho** cartas: las cinco de la mano y tres tapadas
de reserva. Cambiar saca de la reserva propia y no del resto del mazo. Además el cambio viaja por
**puestos** (`i: '0,3'`) y no por nombres de carta.
**Por qué:** si el resto del mazo fuera público —que es lo que haría falta para repartir el cambio
desde la mesa—, los tres naipes que pide el rival se sabrían de antemano, que es peor que verle la
mano. Y si el mensaje dijera "cambio el 10♠ y la J♠", le estaría contando a toda la sala dos cartas
que tenía. El puesto no dice nada y alcanza para rehacer la jugada al retomar (C-6) y para
verificarla al destapar (C-10).
**Por qué alcanza:** seis jugadores por ocho cartas más la que marca el triunfo son 49 de 52. El
mazo nunca se queda corto, así que no hay que barajar los descartes a mitad de mano.
**Consecuencias:** las probabilidades cambian un pelo respecto de la mesa real (las cartas de la
reserva no pueden estar en otra mano), y a cambio el cambio es tan secreto como el reparto.

## D-83 · Si va uno solo, el dador se queda obligado
**Fecha:** 2026-09-14 · **Estado:** vigente
**Decisión:** En Julepe, si de la declaración sale **un solo** jugador dispuesto a ir, el dador
entra a la fuerza y juega esa mano quiera o no, con las cartas que se repartió. Si el solitario es
el propio dador, se queda obligado el de su derecha. Si se pasan **todos**, la mano se anula: el
plato queda acumulado y reparte el siguiente.
**Por qué:** una mano de a uno no es una mano —el solitario ganaría las cinco bazas sin jugarlas—
y anularla cada vez que alguien tiene mano buena y el resto se arruga deja el juego dando vueltas
sin que pase nada. La regla es de la mesa de toda la vida y le pone filo al reparto: repartir
también arriesga.
**Consecuencias:** el obligado puede caer en julepe sin haber querido entrar, que es justamente la
historia que la mesa cuenta después. La pantalla se lo dice con esas palabras ("¡Te quedaste
obligado!") y el asiento lo marca distinto, para que nadie crea que apretó el botón equivocado.

## D-84 · El nombre del séptimo juego cambia en cada idioma
**Fecha:** 2026-09-14 · **Estado:** vigente · **Amplía D-48**
**Decisión:** El juego se llama **Julepe** en español, **Julep** en inglés y **Paga o Bolo** en
portugués de Brasil.
**Por qué:** el criterio de esta app es que el nombre se reconozca en el idioma en que se juega
(Bulls and Cows, Liar's Dice, Forca). El Julepe es de la familia del Rams: su primo inglés se llama
**Loo** y el de Luisiana, **Bourré**; ninguno de los dos sirve de nombre en una app —"loo" hoy se
lee como el baño, y "bourré" lo conoce quien juega cartas en Nueva Orleans—. **Julep** sí: es
palabra inglesa corriente, es un trago, suena igual que el original y deja la frase "you got
juleped" a mano. En portugués no hay miembro de la familia: lo que sí se reconoce es **o bolo**, que
es como se llama allá el pozo que se junta, y "paga o bolo" cuenta el juego entero en tres palabras.
**Consecuencias:** las tarjetas sociales, el README y el menú muestran tres nombres distintos para
el mismo `id` (`julepe`), que es lo que ya hacen los otros seis. El castigo se sigue llamando
julepe dentro del juego en español y en inglés; en portugués es "pagar o bolo".

## D-85 · Arrastrar la carta a la línea es elegir, nunca colocar
**Fecha:** 2026-09-18 · **Estado:** vigente · **Amplía C-8 y D-38**
**Decisión:** En Línea de Tiempo la carta se puede **arrastrar** desde la mano hasta su lugar en la
línea, y la carta ya puesta se puede **retomar** y llevar a otra ranura, o soltar fuera de la línea
para devolverla a la mano. Soltar **elige**: deja la carta y el lugar marcados, exactamente como si
se hubieran tocado. Quien coloca sigue siendo el botón amarillo, que nombra la carta. El gesto vive
en un módulo compartido, `assets/js/arrastre.js`, que no sabe nada de las reglas de ningún juego.

**Por qué:** el problema concreto es el texto. En la mano, una carta mide 130 px y su título queda en
11 px; en un celular angosto —un Pixel normal, 393 px— eso no se alcanza a leer justo en el momento
en que hay que decidir dónde va. Al arrastrar, la carta sale de la tira y se dibuja en un clon de
268 px con el texto en 15 px, que es media pantalla de ancho y se lee de una. El arrastre no se
agregó por moderno: se agregó porque es la única postura en que la carta puede ser grande.

Que soltar no coloque no es timidez. Colocar es irreversible y se paga con la carta, así que el
canon pide elegir y después confirmar (C-8). Y como soltar deja el mismo estado que tocar, el
arrastre es un atajo hacia el camino de siempre: el motor, el transporte y el reductor no se
enteran, y quien prefiera tocar sigue tocando.

**Consecuencias:**
- **La carta en vilo va 60 px sobre el dedo.** Bajo el dedo, el pulgar tapa justo el texto que se
  agrandó: el remedio y la enfermedad en el mismo lugar.
- **Se elige al apretar, no al soltar.** La carta se enciende bajo el dedo. Si el gesto resulta ser
  desliz lateral —la mano es una tira que se desplaza— se devuelve la selección anterior, que es la
  protección de D-38 intacta. El eje lo reparte el navegador con `touch-action: pan-x`: se queda con
  el movimiento horizontal, que es scroll, y nos entrega el vertical. No hace falta toque largo.
- **`pointerdown` no cubre el teclado.** `Enter` sobre un botón llega como `click`, igual que el
  `el.click()` de los guiones de punta a punta. Los dos traen `detail === 0`; un toque de verdad trae
  1 o más y ya lo atendió `pointerdown`. Con eso, el mismo control sirve para las dos formas.
- **Los destinos se miden en coordenadas de documento**, no de pantalla, y se vuelven a medir cada
  vez que cambia el destino. Hacía falta: el destino se marca **abriendo la ranura** con la carta
  dentro, que es el mismo hueco que deja el camino de toques, y abrirlo corre la línea bajo el dedo.
  La alternativa —una barra que no mueve nada— se probó y se descartó: ver la carta en su lugar
  mientras se decide vale más que ahorrarse la medición.
- **Los dos hitos vecinos encienden su año**, en lima y sin tocar su borde. Dicen entre qué años cae
  la carta, que es la decisión que se está tomando y el mismo dato con que después se explica el
  error (C-8b). El borde encendido queda reservado al destino: con tres bordes del mismo color,
  ninguno dice "es aquí".
- **El puntero lo toma el contenedor, no la carta.** La carta arrastrada se destruye en el primer
  redibujo; `#hand` y `#line` sobreviven, y con ellos la captura y los oyentes.
- **Con una carta en el aire, la pantalla no se redibuja.** Lo que llegue mientras tanto se pinta al
  soltar. Sin eso, un mensaje de la sala se lleva el elemento que el dedo tiene tomado.
- El botón de confirmar se desvanece con opacidad mientras dura el gesto: estorba donde va el pulgar,
  y esconderlo con `display` movería la caja y echaría a perder lo medido.
- Batalla Naval mueve barcos con un arrastre propio, anterior a este módulo. No se migró en esta
  pasada; cuando se migre gana el clon en vilo y la vibración, y el módulo gana su primer destino
  de dos dimensiones, que es para lo que la clave del destino es cualquier cosa y no un índice.

## D-86 · El gesto de arrastrar no se lo puede llevar el navegador
**Fecha:** 2026-09-18 · **Estado:** vigente · **Corrige D-85**
**Decisión:** `overscroll-behavior: none` va en `<html>` **y** en `<body>`, y `touch-action: pan-x`
va en toda la tira de la mano, no solo en las cartas.

**Por qué:** publicado el arrastre, en un celular de verdad tirar la carta hacia abajo disparaba el
**deslizar para actualizar** de Chrome. Es el peor final posible para este gesto: no es que no
funcione, es que recarga la página y se lleva la partida por delante.

Dos causas, sumadas. La primera: el `overscroll-behavior` del viewport se toma de `<html>`, y desde
`<body>` solo se propaga si `<html>` vale `auto`. Esa propagación estaba escrita en la hoja desde el
principio y nadie la había puesto a prueba, porque hasta ahora ningún gesto de la app tiraba hacia
abajo desde el borde superior. La segunda: `touch-action: pan-x` estaba solo en `.card`, y entre dos
cartas hay 6 px de hueco; el dedo mide bastante más, así que un toque que cae en el hueco lo toma la
página y se va en desplazamiento vertical.

**Consecuencias:**
- La regla vale para toda la app, no solo para Línea de Tiempo: cualquier juego que arrastre hereda
  el viewport ya protegido.
- **Ninguna prueba automatizada podía atrapar esto.** `Input.dispatchTouchEvent` de CDP inyecta el
  toque directamente en el renderizador, saltándose `touch-action` y el sobre-desplazamiento;
  `Input.synthesizeScrollGesture` sí pasa por el canal de gestos, pero Chrome headless no implementa
  el deslizar para actualizar, que es una función del navegador de Android. El gesto que fallaba no
  existe en ningún Chrome que se pueda automatizar desde aquí. Lo que sí queda: **un gesto nuevo se
  prueba en un celular de verdad antes de publicarlo** (D-67), y eso no lo reemplaza ningún guion.
- Al revisar esto apareció otra trampa: `/linea-de-tiempo/` es un documento distinto del menú, y
  GitHub Pages los sirve con `max-age=600`. El menú puede mostrar la versión nueva mientras el juego
  todavía corre la vieja desde la caché del celular, hasta diez minutos. Al verificar una publicación
  (C-11) hay que pedir **la página del juego**, no solo la portada.

## D-87 · Elegir no reconstruye la línea
**Fecha:** 2026-09-18 · **Estado:** vigente · **Corrige D-85**
**Decisión:** Elegir una carta o un lugar repinta **solo las ranuras**, la mano y el botón. Las filas
de hitos no se tocan. La línea se reconstruye entera únicamente cuando cambia de verdad: cuando se
coloca una carta.

**Por qué:** cada toque reconstruía `#line` completo, y como `.event` lleva `animation: slideUp`, las
filas volvían a reproducir su animación de entrada: el tablero pegaba un salto al apretar una carta,
y otro cada vez que el destino cambiaba mientras se arrastraba. Arrastrando es peor que tocando,
porque ahí el salto se repite varias veces por segundo mientras el jugador mira la línea para decidir.

El error de fondo era tratar "cambió la selección" como "cambió la pantalla". No cambió: elegir una
carta no mueve ningún hito. Lo único que cambia es qué ranura está abierta y qué muestra adentro.

**Consecuencias:**
- `pintarLinea` (reconstruye) y `marcarRanuras` (repinta ranuras) quedan separadas, y con ellas
  `marcarEstado`, porque la línea de estado sí cambia con la selección ("elige una carta" →
  "elige el lugar") y antes venía de arrastre con el redibujo entero.
- Soltar tampoco reconstruye: soltar elige, y elegir no cambia la línea (D-85).
- La prueba es de identidad, no de aspecto: se marcan los nodos de las filas antes de apretar y se
  comprueba que sean los mismos después. Una captura no habría delatado nada, porque el estado final
  es idéntico: lo que molestaba era el camino, no el destino.

## D-88 · Julepe se retira del menú hasta que sus reglas se entiendan
**Fecha:** 2026-09-18 · **Estado:** vigente
**Decisión:** `julepe` pasa a `available: false` en `assets/js/games.js`. La tarjeta sigue en el
menú, apagada y sin click (el mismo trato que tuvieron Batalla Naval y Toque y Fama mientras se
construían), pero el juego entero sigue andando en `/julepe/`: quien tenga el link puede seguir
jugando, y nada de lo construido —motor, sala, cartas selladas, verificación— se toca.

**Por qué:** varias vueltas seguidas revisando el texto de reglas (qué es un palo, una baza, el
plato, "repartir en lo que dure la mano") no terminaron de aclarar el juego ni para quien lo estaba
explicando. Julepe es el juego con más reglas encadenadas de toda la app —declarar, cambiar cartas,
asistir, montar, fallar, el plato que se dobla solo— y ese peso todavía no está bien resuelto en
palabras simples. Publicarlo así es peor que no publicarlo: un juego que nadie entiende no se juega,
y las capturas y el README ya lo muestran como si estuviera listo.

**Lo que no cambia:** los quince requerimientos (JU-01 a JU-15) siguen marcados como cumplidos en
`docs/REQUERIMIENTOS.md` — el juego está construido y funciona, lo que falta es que se explique
bien. `docs/juegos/julepe.md` y la sección del README quedan, con una nota de que está pausado.

**Consecuencias:**
- La tabla de juegos del README (`tools/readme.py`, `bloque_juegos`) muestra "⏸ paused" en vez de
  la versión cuando `disponible` es falso, en lugar de mentir con un número de versión que sugiere
  que está en línea.
- La portada y sus tarjetas sociales (`tools/og.mjs`) dejan de nombrar a Julepe en la lista de
  juegos y en el emoji de la cabecera: se arman filtrando por `available`, así que no hubo que
  tocarlas.
- Reactivarlo es cambiar un booleano de vuelta a `true` una vez que las reglas se reescriban y se
  prueben con alguien que no las conozca de antes.

## D-89 · Una sala se cae a la media hora de quedar quieta
**Fecha:** 2026-09-19 · **Estado:** vigente
**Decisión:** Una sala vence **media hora después de la última jugada**, y sigue existiendo el tope
duro de seis horas desde que nació (D-15). Las dos cuentas las hacen las reglas de seguridad: la
sala gana un campo `lastAt` —el latido, con la hora del servidor— que el transporte refresca al
entrar y al jugar, como mucho una vez por minuto (`_touch` en `assets/js/transport/firebase.js`).
Sin latido fresco, las reglas dejan de aceptar jugadores y mensajes, y cualquiera puede borrar la
sala.

**Por qué:** seis horas era la vida de cualquier sala, jugara alguien o no. Una sala que se abrió a
las ocho y quedó vacía seguía ocupando su código de cuatro letras hasta las dos de la mañana, y
aparecía en el panel del dueño como si ahí hubiera gente. Las partidas duran entre cinco y cuarenta
minutos (`duration` en `games.js`): media hora quieta no es una pausa, es una sala abandonada.

**Por qué se queda el tope de seis horas:** la papelera (D-39) promete que un balde del índice solo
se puede leer cuando todas sus salas ya vencieron, y así el índice nunca delata el código de una
sala en juego (C-15). Esa promesa necesita que exista un plazo máximo: con vencimiento solo por
inactividad, una sala con gente jugando podría sobrevivir a su propio balde. Los seis horas dejan de
ser la vida normal de una sala y pasan a ser el tope que sostiene a la papelera.

**Compatible en los dos sentidos, porque las reglas se publican a mano:**
- Reglas nuevas con un cliente viejo en caché: esa sala nunca escribe `lastAt`, y las reglas tratan
  la ausencia del campo como "vale el tope de seis horas". La partida sigue como antes.
- Cliente nuevo con reglas viejas: el latido es un escrito aparte, en segundo plano y con el error
  tragado. Se rechaza, nadie lo nota y la sala vence a las seis horas.
Así ninguna de las dos mitades del despliegue tiene que esperar a la otra.

**Consecuencias:**
- Las reglas se **publican a mano** en la consola ([Realtime Database → Rules](https://console.firebase.google.com/u/0/project/juegos-de-salon/database/juegos-de-salon-default-rtdb/rules)).
  Hasta que se publiquen, todo sigue funcionando con las seis horas de siempre.
- Una partida que se deja a medias más de media hora ya no se puede retomar (C-6 vale hasta que la
  sala venza). Quien vuelve ve "esa sala ya venció" y arma una nueva.
- El panel descarta las salas sin latido fresco, con la misma cuenta que las reglas, así que deja de
  mostrar como vivas las salas que nadie puede usar.
- Un escrito más por sala cada minuto de juego, solo mientras se juega.

## D-90 · Arrastrar un barco es elegirlo
**Fecha:** 2026-09-20 · **Estado:** vigente
**Decisión:** En la colocación de la flota de Batalla Naval, un barco se puede arrastrar **desde su
ficha** (todavía fuera del tablero) y **desde el tablero**, y apenas el dedo pasa el umbral de
arrastre el barco arrastrado pasa a ser el **seleccionado**. Es la misma regla que Línea de Tiempo
(D-85): arrastrar elige, y lo irreversible sigue colgando de su botón —acá, zarpar—.

**Por qué:** la selección y el arrastre eran dos cosas distintas. Se podía tener el portaaviones en
amarillo, con su botón ↻ encima, y arrastrar el destructor: el que se movía no era el que la pantalla
decía que estaba elegido, y el ↻ seguía girando al otro. Y las fichas de los barcos sin colocar no se
podían arrastrar: había que tocar la ficha y después la casilla, un gesto que nadie intenta primero
cuando ve una ficha y un tablero.

**Cómo:** los oyentes de puntero pasan de la grilla a `#screen-place`. La grilla se rehace entera en
cada repintado —y se rehace, porque elegir pinta— así que colgados de ella se perdía la captura a
mitad del gesto; la pantalla sobrevive. Es la misma lección que dejó `assets/js/arrastre.js` en
Línea de Tiempo: el puntero lo toma el contenedor, no lo que se arrastra.

**Consecuencias:**
- Mientras no se pasa el umbral (`UMBRAL`, 8 px, el de la casa) no hay arrastre, así que el toque de
  siempre queda intacto: tocar un barco lo selecciona, tocarlo de nuevo lo deselecciona.
- Las fichas llevan `touch-action: none` (D-86): sin eso, arrastrar una hacia el tablero desplazaba
  la página en Android en vez de mover el barco.
- Soltar afuera del tablero, o sobre un lugar donde el barco no cabe, no coloca nada y suena el
  error —pero el barco arrastrado igual queda elegido, que es lo que el gesto pedía.
