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
**Consecuencias:** Queda como canon C-15 para los demás juegos con salas. En el celular, el teclado no achica la ventana: el panel se levanta con `visualViewport` y el campo usa 16 px exactos para que iOS no haga zoom. Se agregan límites (120 caracteres, un mensaje cada 1,2 s) y las reglas de Firebase validan el largo del texto. La sala se lee con solo saber el código de cuatro letras: el chat **no es privado** y así se documenta.

## D-29 · El enlace de sala solo deja unirse
**Fecha:** 2026-09-09 · **Estado:** vigente
**Decisión:** Al abrir un enlace `?sala=CÓDIGO`, la pantalla de datos se titula "¡Invitado a jugar!" y muestra únicamente el bloque para unirse a esa sala: sin botón de "Crear sala", con el código fijo y de solo lectura, y sin los ajustes de la partida. Vale para los tres juegos con salas.
**Por qué:** Quien recibe una invitación veía la misma pantalla que quien empieza de cero, con "Crear sala" arriba y el código abajo. Tocar el botón de arriba abre una sala **distinta**, y los dos quedan esperándose en salas separadas sin entender por qué. Los ajustes (dígitos, temática, cartas en mano, reglas de disparo) tenían el mismo problema al revés: se podían tocar y no hacían nada, porque la configuración es la del anfitrión.
**Consecuencias:** Queda en el canon C-7. La pantalla del invitado dice de quién es la sala y que la partida la configura quien invitó. Prueba: `tools/e2e/enlace-invitacion.mjs`.
