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

## Requerimientos no funcionales

- **Accesible al tacto:** botones de al menos 44 px de alto, texto grande, alto contraste sobre fondo oscuro.
- **Rendimiento:** carga inicial < 200 KB sin contar fuentes web; sin frameworks.
- **Privacidad:** no se envía ningún dato a servidores; todo vive en `localStorage` del dispositivo.
- **Responsabilidad:** el menú incluye un mensaje de consumo responsable.

## Toque y Fama (TF) — propuestos, ver [estudio de factibilidad](juegos/toque-y-fama-factibilidad.md)

| ID | Requerimiento | Estado |
|---|---|---|
| TF-01 | Dos jugadores; cada uno elige un número secreto de 3, 4 o 5 cifras distintas (4 por defecto). | 📝 propuesto |
| TF-02 | El celular calcula toques y famas automáticamente; nunca se cuenta a mano. | 📝 propuesto |
| TF-03 | Modo un celular (pasar y jugar) con pantalla opaca entre turnos. | 📝 propuesto (Fase 1) |
| TF-04 | Modo contra el celular: adivinar un número al azar, o que el celular adivine el tuyo. | 📝 propuesto (Fase 1) |
| TF-05 | Modo dos celulares conectados por sala con código de 4 letras y QR. | 📝 propuesto (Fase 2) |
| TF-06 | El secreto no sale del celular durante la partida; compromiso por hash al inicio y revelación verificada al final. | 📝 propuesto (Fase 2) |
| TF-07 | Reconexión: si un celular se cierra, retoma la partida desde la sala. | 📝 propuesto (Fase 2) |
| TF-08 | Derecho a réplica configurable; sorteo verificable de quién parte. | 📝 propuesto |
| TF-09 | Textos en español e inglés (“Bulls and Cows”). | 📝 propuesto |
