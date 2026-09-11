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
**Por qué:** Cero configuración de CI; cada push publica. URL: https://ellokojavi.github.io/juegos-de-salon/

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
