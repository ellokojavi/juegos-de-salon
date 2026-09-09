# Changelog

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
