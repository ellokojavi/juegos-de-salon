# Requerimientos

Documento vivo. Cada requerimiento tiene un ID para poder referenciarlo desde decisiones, commits e issues.

## Plataforma (RP)

| ID | Requerimiento | Estado |
|---|---|---|
| RP-01 | App web que funcione en celulares y tablets (mobile-first) y también en navegador de escritorio. | ✅ v0.1 |
| RP-02 | Menú principal para escoger el juego a jugar. | ✅ v0.1 |
| RP-03 | Varios juegos disponibles desde la misma dirección; cada juego con su propia URL (`/<id-juego>/`). | ✅ v0.1 (estructura) |
| RP-04 | Cada juego presenta su dinámica (reglas, materiales) antes de empezar. | ✅ v0.1 |
| RP-05 | Cada juego prepara a los jugadores (ingreso de nombres y datos necesarios). | ✅ v0.1 |
| RP-06 | El celular/tablet es la interfaz principal: guía turnos, situaciones y decisiones. | ✅ v0.1 |
| RP-07 | Tono distendido y festivo: colores vivos, animaciones, tipografías expresivas. | ✅ v0.1 |
| RP-08 | Publicado en una URL pública para probar desde el celular (GitHub Pages, cuenta ellokojavi). | ✅ v0.1 |
| RP-09 | Documentar requerimientos y decisiones dentro del proyecto. | ✅ v0.1 |
| RP-10 | Sin dependencias ni paso de build: abrir el repo publicado debe bastar. | ✅ v0.1 |
| RP-11 | Instalable como “app” en la pantalla de inicio (manifest PWA básico). | ✅ v0.1 (sin service worker / offline) |
| RP-12 | Idioma español chileno, informal. | ✅ v0.1 |
| RP-13 | Funcionar sin conexión (service worker). | ⏳ pendiente |
| RP-14 | Sonidos en las acciones clave, con botón para silenciar. | ✅ v0.3 |
| RP-15 | Jugar en español o inglés, con un toggle al inicio (menú) que aplica a todos los juegos. | ✅ v0.2 |
| RP-25 | Jugar en portugués (de Brasil): toda la experiencia —menú, juegos, salas, chat, errores, cartas— en el idioma elegido, con las mismas claves que español e inglés (D-48). | ✅ v0.22 |
| RP-16 | Toda partida en curso se puede retomar, en todos los juegos y en todos los modos (canon C-6). | ✅ v0.7 |
| RP-17 | Cánones de construcción documentados y revisados antes de crear o cambiar un juego. | ✅ v0.7 |
| RP-18 | Quien entra por un enlace de sala solo puede unirse a esa sala: no se le ofrece crear otra ni configurar la partida. | ✅ v0.10.1 |
| RP-19 | Las salas vencidas se borran solas de Firebase, sin servidor ni tarea manual. | ✅ v0.17 |
| RP-20 | Cuando no se puede abrir una sala, el jugador ve por qué en su idioma y con una salida, sin que se le culpe a su internet. | ✅ v0.18 |
| RP-21 | Un celular no puede abrir salas sin parar: hay un tope por dispositivo que protege la cuota del plan gratuito. | ✅ v0.19 |
| RP-22 | Vigilar el uso de la cuota de Firebase (conexiones simultáneas y descarga mensual) con una alerta antes de llegar al techo. | ⏳ pendiente (consola) |
| RP-23 | Un panel privado del dueño (`/panel/`), con entrada por Google, que muestra salas vivas, celulares conectados, partidas por juego y modo, jugadores por partida, origen (zona horaria), idioma y hora del día (D-44). | ✅ v0.20 |
| RP-24 | Los juegos registran señales de uso anonimizadas: de los modos sin red solo contadores, de las salas lo que ya viaja a Firebase. Nunca IP, secretos, chat ni quién ganó. | ✅ v0.20 |
| RP-25 | El panel separa por entorno también las salas vivas, que viven en un `rooms/` común a todos: las de otro entorno no se cuentan y se nombran debajo de la lista, para que ninguna desaparezca en silencio (D-45). | ✅ v0.21.1 |
| RP-26 | Se registra el idioma elegido en el juego, aparte del idioma del navegador: uno dice de dónde es la persona y el otro en cuál prefiere jugar (D-46). | ✅ v0.21.2 |

## Cuarto Rey (CR)

| ID | Requerimiento | Estado |
|---|---|---|
| CR-01 | Entre 4 y 6 jugadores, con nombre. | ✅ |
| CR-02 | Mazo inglés de 52 cartas, sin jokers, barajado al azar. El celular reemplaza al mazo físico. | ✅ |
| CR-03 | Los jugadores sacan cartas por turnos, en orden de asiento hacia la derecha. | ✅ |
| CR-04 | Todos ven la carta que salió (pantalla grande, carta con animación de volteo). | ✅ |
| CR-05 | Regla por carta según instrucciones originales (A al K), ver [especificación](juegos/cuarto-rey.md). | ✅ |
| CR-06 | Para 2 y 3 la app nombra explícitamente al compañero de la derecha / izquierda. | ✅ |
| CR-07 | Para J y Q la app nombra a quiénes les toca tomar según el género registrado. | ✅ |
| CR-08 | Para 8 la app permite elegir a quién se regalan los 2 sorbos (repartidos o a una sola persona). | ✅ |
| CR-09 | Para 5 la app propone una penitencia al azar, con opción de pedir otra o de “arrugarse” y tomar. | ✅ |
| CR-10 | Para 4, 6, 7 y 9 la app explica el mini-juego, dice quién parte, entrega ayudas simples (temporizador, categoría, idea de “nunca nunca”) y permite marcar al perdedor. | ✅ |
| CR-11 | Contador visible de reyes (0 a 4). Al cuarto rey, quien lo sacó se toma todo el vaso y la partida termina. | ✅ |
| CR-12 | Pantalla final con el “ganador” del cuarto rey, ranking aproximado de sorbos y opción de otra ronda. | ✅ |
| CR-13 | La partida se guarda automáticamente y se puede retomar si se cierra el navegador. | ✅ |
| CR-14 | Los nombres de los jugadores se recuerdan para la próxima partida. | ✅ |
| CR-15 | La pantalla no se apaga mientras se juega (Wake Lock, donde el navegador lo permita). | ✅ |
| CR-16 | Vibración al sacar carta y en momentos clave (donde el dispositivo lo permita). | ✅ |
| CR-17 | Variantes configurables (p. ej. cantidad de sorbos, reglas alternativas). | ⏳ pendiente |
| CR-18 | Historial de cartas sacadas en la partida. | ⏳ pendiente |
| CR-19 | Transición entre turnos: tras resolver la carta, pantalla "¡Salud!" con quiénes toman y luego "Pásale el celular a X" con confirmación del siguiente jugador. | ✅ v0.2 |
| CR-20 | La carta boca abajo ocupa la mayor parte de la pantalla (fácil de tocar); al descubrirse gira y se encoge para dejar espacio a las instrucciones. | ✅ v0.2 |
| CR-21 | Todo el contenido del juego (reglas, mini-juegos, penitencias, categorías, ideas de Nunca Nunca) disponible en español e inglés. | ✅ v0.2 |
| CR-22 | Todo el contenido del juego en portugués (Quarto Rei, Era Uma Vez, Porquinho Bochechudo, Cultura de Boteco, Eu Nunca, prendas y categorías adaptadas). | ✅ v0.22 |

## Requerimientos no funcionales

- **Accesible al tacto:** botones de al menos 44 px de alto, texto grande, alto contraste sobre fondo oscuro.
- **Rendimiento:** carga inicial < 200 KB sin contar fuentes web; sin frameworks.
- **Privacidad:** no se envía nada que identifique a una persona. La partida vive en `localStorage` del dispositivo; a Firebase van la sala (modo de dos celulares) y señales de uso anonimizadas para el panel del dueño: contadores por juego, modo, jugadores, zona horaria, idioma y hora (D-44). Nunca IP, secretos, chat ni quién ganó.
- **Responsabilidad:** el menú incluye un mensaje de consumo responsable.

## Toque y Fama (TF) — ver [especificación](juegos/toque-y-fama.md) y [estudio de factibilidad](juegos/toque-y-fama-factibilidad.md)

| ID | Requerimiento | Estado |
|---|---|---|
| TF-01 | Dos jugadores; cada uno elige un número secreto de 3, 4 o 5 cifras distintas (4 por defecto). | ✅ v0.4 |
| TF-02 | El celular calcula toques y famas automáticamente; nunca se cuenta a mano. | ✅ v0.4 |
| TF-03 | Modo un celular (pasar y jugar) con pantalla opaca entre turnos. | ✅ v0.4 |
| TF-04 | Modo contra el celular: duelo (tú adivinas el suyo mientras él adivina el tuyo con un solver). | ✅ v0.4 |
| TF-05 | Modo dos celulares conectados por sala con código de 4 letras y QR (Firebase Realtime Database). | ✅ v0.4 |
| TF-06 | El secreto no sale del celular durante la partida; compromiso por hash (con sal privada) al inicio y revelación verificada al final. | ✅ v0.4 |
| TF-07 | Reconexión: si un celular se cierra, retoma la partida desde la sala (secreto guardado en el dispositivo). | ✅ v0.4 |
| TF-08 | Derecho a réplica configurable. Quién parte es determinista: el invitado en la primera partida, el perdedor en la revancha (ver D-19). | ✅ v0.4 |
| TF-09 | Textos en español e inglés (“Bulls and Cows”). | ✅ v0.4 |
| TF-18 | Textos en portugués (“Toque e Fama”). | ✅ v0.22 |
| TF-10 | Revancha en los tres modos; en dos celulares se crea una sala nueva y ambos se mueven solos. | ✅ v0.4 |
| TF-11 | Indicador de rival desconectado en modo dos celulares. | ✅ v0.4 |
| TF-12 | Al adivinar, el jugador ve su propio número como recordatorio. En modo un celular parte oculto y se muestra al tocarlo. | ✅ v0.4.1 |
| TF-13 | Pulsación larga sobre una cifra del teclado la marca como bloqueada (no está en el número del rival). Las marcas son por jugador, se recuerdan durante la partida y se ven tachadas; otra pulsación larga las libera. Instrucción breve en pantalla. | ✅ v0.4.2 |
| TF-14 | En el resultado, bloque colapsado “Ver todos los intentos” con los tableros de ambos jugadores; colapsado no empuja los botones fuera de la pantalla. | ✅ v0.4.3 |

## Batalla Naval (BN) — ver [docs/juegos/batalla-naval.md](juegos/batalla-naval.md)

| ID | Requerimiento | Estado |
|---|---|---|
| BN-01 | Tablero 10×10 (A–J, 1–10) y flota clásica de 5 barcos (5, 4, 3, 3, 2). | ✅ v0.6 |
| BN-02 | Colocación por toque: seleccionar barco, tocar casilla, girar, arrastrar, “al azar” y “limpiar”; validación de bordes y superposición. Los barcos pueden tocarse. | ✅ v0.6 |
| BN-03 | Turnos con tiro extra al acertar (configurable, activado por defecto). | ✅ v0.6 |
| BN-04 | Respuestas agua / tocado / hundido, con el barco y sus casillas al hundir. Marcador de barcos hundidos. | ✅ v0.6 |
| BN-05 | Tres modos: un celular (flota tapada, pase al fallar), contra el celular (IA con cacería por paridad y persecución) y dos celulares (sala Firebase). | ✅ v0.6 |
| BN-06 | Compromiso de la flota con hash y sal, revelación y verificación al final. | ✅ v0.6 |
| BN-07 | Reconexión, revancha (parte el perdedor), presencia. | ✅ v0.6 |
| BN-08 | Selección + confirmación “¡Fuego!” antes de disparar (con opción de disparo directo). | ✅ v0.6 |
| BN-09 | Textos en español e inglés (“Battleship”); sonidos de agua, impacto y hundimiento. | ✅ v0.6 |
| BN-16 | Textos en portugués (“Batalha Naval”: água, acertou, afundou). | ✅ v0.22 |
| BN-10 | Los transportes `local` y `firebase` se mueven a `assets/js/transport/` para compartirlos entre juegos. | ✅ v0.6 |

## Línea de Tiempo (LT) — ver [docs/juegos/linea-de-tiempo.md](juegos/linea-de-tiempo.md)

| ID | Requerimiento | Estado |
|---|---|---|
| LT-01 | Cartas con hitos sin año que se ubican en una línea de tiempo común. | ✅ v0.8 |
| LT-02 | Temáticas seleccionables; agregar una es solo un archivo de datos. Vienen Historia y Música. | ✅ v0.8 |
| LT-03 | Acierto: la carta entra en la línea. Error: se descarta y el jugador roba otra. | ✅ v0.8 |
| LT-04 | Gana quien se queda sin cartas. Mano configurable de 3, 5 o 7. | ✅ v0.8 |
| LT-05 | Modo un celular de 2 a 6 jugadores, con pase entre turnos. | ✅ v0.8 |
| LT-06 | Modo solitario: vaciar la mano en la menor cantidad de intentos, con récord por temática y mano. | ✅ v0.9.2 |
| LT-07 | Modo varios celulares de 2 a 6 (roles A–F), con lobby y anfitrión que abre la partida. | ✅ v0.9 |
| LT-08 | Mazo determinista por semilla, para que todos los dispositivos vean el mismo reparto. | ✅ v0.8 |
| LT-09 | Memoria de partida en todos los modos (canon C-6). | ✅ v0.8 |
| LT-10 | Textos en español e inglés. | ✅ v0.8 |
| LT-16 | Textos y los cuatro mazos en portugués (“Linha do Tempo”). | ✅ v0.22 |
| LT-11 | Chat de sala en varios celulares, en la sala de espera y durante la partida; muere con la partida (canon C-15). | ✅ v0.10 |
| LT-12 | La ronda se juega completa y, si más de uno queda sin cartas, gana quien respondió en menos tiempo. El tiempo se muestra solo al final. | ✅ v0.12 |
| LT-13 | Opción de pozo común: 6 cartas a la vista para todos, se reponen por el final, y gana quien coloque primero las cartas acordadas. | ✅ v0.13 |
| LT-14 | Cuatro temáticas (Historia, Música, Chile, Cultura pop) y cartas que no se repiten entre partidas seguidas. | ✅ v0.14 |
| LT-15 | Opción de todas las cartas a la vista: se despliega el doble de la meta desde el primer turno, no entra ninguna carta nueva y la mesa solo se achica. Es la opción marcada al abrir la configuración. | ✅ v0.21 |
