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
| RP-24 | Los juegos registran señales de uso anonimizadas: de los modos sin red solo contadores, de las salas lo que ya viaja a Firebase. Nunca IP, secretos ni chat. Desde v0.33.6, de una sala también el país del celular y quién ganó (D-79). | ✅ v0.20 |
| RP-25 | El panel separa por entorno también las salas vivas, que viven en un `rooms/` común a todos: las de otro entorno no se cuentan y se nombran debajo de la lista, para que ninguna desaparezca en silencio (D-45). | ✅ v0.21.1 |
| RP-26 | Se registra el idioma elegido en el juego, aparte del idioma del navegador: uno dice de dónde es la persona y el otro en cuál prefiere jugar (D-46). | ✅ v0.21.2 |
| RP-28 | El idioma puede venir en el link (`?lang=`, y las puertas `/pt/` y `/en/`) y viaja pegado a la invitación de una sala, para que quien la reciba abra la app en el idioma en que se la mandaron (D-74). | ✅ v0.33 |
| RP-30 | El panel filtra todo —cifras, barras y bitácora— con seis rangos: 7, 30, 60 y 90 días, 1 año y lo que va del año. Se baja de la base solo lo que el rango pide (D-80). | ✅ v0.33.7 |
| RP-29 | El panel muestra la **bitácora de salas jugadas** del rango elegido (7 o 30 días), paginada: día y hora, jugadores con la bandera de su país, juego y ganador. Las pruebas y las salas donde nunca entró nadie más quedan fuera por defecto (D-79). | ✅ v0.33.6 |
| RP-27 | Una sala que se cancela se cierra en el acto: quien se va a propósito se despide, la sala queda sin nadie y se borra sola, y el panel deja de mostrarla viva. Cerrar la pestaña no cancela nada: esa partida se puede retomar (D-50). | ✅ v0.25 |
| RP-31 | El panel muestra en vivo las partidas sin red que se están jugando (contra el celular, un celular, solo), con juego, modo, cuántos juegan y país, sin nombres (D-140). | ✅ v0.64.7 |

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
| CR-18 | Historial de cartas sacadas en la partida: plegado al pie de la pantalla final, con palo, quién la sacó y qué decía. | ✅ v0.27 |
| CR-19 | Transición entre turnos: tras resolver la carta, pantalla "¡Salud!" con quiénes toman y luego "Pásale el celular a X" con confirmación del siguiente jugador. | ✅ v0.2 |
| CR-20 | La carta boca abajo ocupa la mayor parte de la pantalla (fácil de tocar); al descubrirse gira y se encoge para dejar espacio a las instrucciones. | ✅ v0.2 |
| CR-21 | Todo el contenido del juego (reglas, mini-juegos, penitencias, categorías, ideas de Nunca Nunca) disponible en español e inglés. | ✅ v0.2 |
| CR-22 | Todo el contenido del juego en portugués (Quarto Rei, Era Uma Vez, Porquinho Bochechudo, Cultura de Boteco, Eu Nunca, prendas y categorías adaptadas). | ✅ v0.22 |

## Dudo (DU) — ver [especificación](juegos/dudo.md)

| ID | Requerimiento | Estado |
|---|---|---|
| DU-01 | De 2 a 6 jugadores, cinco dados cada uno; cada jugador ve solo los suyos. | ✅ v0.28 |
| DU-02 | Apuesta de cantidad + pinta sobre el total de la mesa, con los ases de comodín. | ✅ v0.28 |
| DU-03 | La app no deja hacer una apuesta ilegal: subir es más cantidad o la misma con pinta mayor, y entrar y salir de los ases cuesta la mitad y el doble más uno. | ✅ v0.28 |
| DU-04 | Dudar destapa la mesa, cuenta la pinta más los ases y quita un dado a quien se equivocó. | ✅ v0.28 |
| DU-05 | Calzar: acertar la cantidad exacta devuelve un dado (tope cinco) y fallar quita uno. Desde la mitad de los dados de la mesa y con tres jugadores o más; en un duelo no existe (D-71). Es configurable. | ✅ v0.29 |
| DU-06 | Quien pierde el dado abre la ronda siguiente; quien se queda sin dados sale y gana el último con dados. | ✅ v0.28 |
| DU-07 | Modo un celular, de 2 a 6, con pantalla de pase entre turnos (C-9). | ✅ v0.28 |
| DU-08 | Modo contra el celular: el aparato apuesta por probabilidad y **solo** con sus propios dados. | ✅ v0.28 |
| DU-09 | Modo varios celulares con sala, chat y turnos. Los dados no viajan: se comprometen con hash y se destapan al dudar (C-10). | ✅ v0.32 |
| DU-10 | Memoria de partida en todos los modos (C-6). | ✅ v0.28 |
| DU-11 | Textos e interfaz en español, inglés y portugués, con el plural de cada pinta (C-3). | ✅ v0.28 |
| DU-12 | El destape muestra los dados de todos con los que cuentan marcados, el total y quién pierde el dado. | ✅ v0.28 |
| DU-13 | Repaso de la partida al final: qué se apostó, cuánto había y quién perdió el dado en cada ronda. | ✅ v0.28 |
| DU-14 | Ronda obligada: con un jugador en un dado, esa ronda se juega sin comodín y sin cambiar de pinta. | ⏳ pendiente |
| DU-15 | En español, las pintas se nombran como en la mesa chilena (ases, tontos, trenes, cuadras, quintas y sextas), con un interruptor para volver a los números. Encendido por defecto; inglés y portugués van por número (D-71). | ✅ v0.29 |

## La Copa (LIG) — ver [docs/juegos/copa.md](juegos/copa.md)

| ID | Requerimiento | Estado |
|---|---|---|
| LIG-1 | Tarjeta "La Copa" en el menú principal que lleva a `/copa/`. | ✅ v0.42 |
| LIG-2 | Crear una copa: nombre, duración, inicio hoy o mañana, nombre y PIN del admin. | ✅ v0.42 |
| LIG-3 | Código de 5 letras sin I ni O y link `/copa/?CÓDIGO`. | ✅ v0.42 |
| LIG-4 | Inscribirse con nombre (hasta 20 caracteres, no repetido) y PIN de 4 dígitos escrito dos veces. | ✅ v0.42 |
| LIG-5 | Entrar como jugador ya inscrito tocando el nombre y escribiendo el PIN; el celular recuerda la sesión. | ✅ v0.42 |
| LIG-6 | Máximo 10 jugadores por copa (lo cuida el celular; las reglas no cuentan hijos). | ✅ v0.42 |
| LIG-7 | Calendario fijo por modalidad, visible desde el primer día. | ✅ v0.42 |
| LIG-8 | Ventana de cada día: ese día más uno de gracia, impuesta por el servidor; la final sin gracia. | ✅ v0.42 |
| LIG-9 | Un solo intento por día; recargar retoma el intento (C-6). | ✅ v0.42 |
| LIG-10 | Puntos del día por posición (10-8-6-5-4-3-2-1-1-1), desempate por tiempo activo. | ✅ v0.42 |
| LIG-11 | Comodín ×2, uno por jugador, activado antes de Empezar, no en la final. | ✅ v0.42 |
| LIG-12 | La Gran Final ×2 el último día. | ✅ v0.42 |
| LIG-13 | Resultados del día ocultos hasta jugarlo o hasta que cierre, también en la tabla y el gráfico. | ✅ v0.42 |
| LIG-14 | Tabla general con flechas contra el día anterior y quién falta por jugar hoy. | ✅ v0.42 |
| LIG-15 | Resultado del día con puntaje, posición provisoria y tarjeta para compartir. | ✅ v0.42 |
| LIG-16 | Podio final con confeti y medallas. | ✅ v0.42 |
| LIG-17 | ⏳ Línea Relámpago, con 10 hitos y la mano, las ranuras y el arrastre de Línea de Tiempo (D-102). | ✅ v0.44 |
| LIG-18 | 🔢 Toque y Fama: adivina el número, con el teclado, las notas y el tablero de Toque y Fama. | ✅ v0.44 |
| LIG-19 | 🔗 Conexiones con 12 grillas difíciles, de temas generales y con distractores. | ✅ v0.44 |
| LIG-20 | ~~⚓ Batalla Naval: Solitario~~ reemplazado por 👑 Reinas, con solución única (D-102). | ✅ v0.44 |
| LIG-21 | ~~🎲 ¿Dudo o le creo?~~ reemplazado por 🔤 Toque y Fama con letras (D-102). | ✅ v0.44 |
| LIG-22 | 📅 ¿En qué año?. | ✅ v0.42 |
| LIG-23 | 🏁 La Gran Final. | ✅ v0.42 |
| LIG-24 | Admin: renombrar, sacar y cambiar PIN de jugadores. | ✅ v0.42 |
| LIG-25 | Admin: invitación, recordatorio del día (cualquier día), tabla parcial y resumen final por el diálogo de compartir. | ✅ v0.42 |
| LIG-26 | Cuenta segura: hash del PIN ilegible y escritura autorizada por reglas (D-96). | ✅ v0.42 (falta publicar reglas y habilitar el acceso anónimo) |
| LIG-27 | Modo de prueba local con reloj adelantable y gancho `window.__copa` (C-14). | ✅ v0.42 |
| LIG-28 | Señal al panel por día jugado (C-16) y documentación (C-13). | ✅ v0.42 |
| LIG-29 | Recordatorios `.ics` para el calendario del celular. | ⏳ pendiente |
| LIG-30 | Verificación cruzada: cada celular recalcula los puntajes ajenos desde las jugadas. | ⏳ pendiente |
| LIG-31 | Papelera: borrar copas una semana después de terminadas. | ⏳ pendiente |
| LIG-32 | Inglés y portugués, con contenido propio por idioma (D-98). | ⏳ pendiente |
| LIG-33 | Avisos automáticos por WhatsApp, correo o push (D-99). | ⏳ pendiente |
| LIG-34 | Calendario elegido por el admin y minijuegos de reserva (La Palabra, Ahorcado Contrarreloj). | ⏳ pendiente |
| LIG-35 | Pantalla de espera antes del día 1: cuándo parte, calendario e inscritos. | ✅ v0.42 |
| LIG-36 | "Cómo se juega" antes de cada minijuego y de cada ronda de la final; el intento empieza en Empezar. | ✅ v0.42 |
| LIG-37 | Tiempo activo: el cronómetro se pausa con la pantalla oculta (D-95). | ✅ v0.42 |
| LIG-38 | Tablero con tus días: los pasados con su resultado y deshabilitados, hoy habilitado, los que vienen deshabilitados. | ✅ v0.42 |
| LIG-39 | Gráfico de tu posición día a día. | ✅ v0.42 |
| LIG-40 | El panel del dueño muestra las copas creadas y su progreso. | ⏳ pendiente |
| LIG-41 | Práctica de cada minijuego suelto, con semilla repetible, desde el laboratorio (D-101). | ✅ v0.43 |
| LIG-42 | Reportar un problema o dejar un comentario con su contexto, desde la práctica, el tablero y el resultado, sin cuenta (D-104). | ✅ v0.45 (se leen con `node tools/reportes.mjs`) |
| LIG-43 | Laboratorio `/labs/`: La Copa sale del menú (Próximamente) y se prueba ahí, con la Copa de 3 días. | ✅ v0.43 |
| LIG-44 | El panel del dueño muestra los reportes. | ⏳ pendiente |
| LIG-45 | 〰️ Zip y ☀️ Tango en el laboratorio, con solución única, para decidir si entran al calendario. | ✅ v0.44 |
| LIG-47 | Sesión de prueba antes de cada día: la misma mecánica con otro contenido, que no cuenta (D-103). | ✅ v0.45 |
| LIG-48 | Zip por niveles contra el reloj (3 minutos) y aviso cuando el trazo llega al final sin pasar por todas. | ✅ v0.45 |
| LIG-49 | Reinas: toque para la reina, toque largo para la X. Tango: ≠, borrar todo, pista (−15) y consejos. | ✅ v0.45 |
| LIG-50 | Cuenta regresiva de 5 a 1 y "¡A jugar!" antes de cada juego; el reloj parte ahí (D-105). | ✅ v0.45 |
| LIG-51 | Al terminar, cómo se calculó el puntaje, línea por línea (D-106). | ✅ v0.45 |
| LIG-52 | El nombre del reporte queda guardado en el dispositivo (D-104). | ✅ v0.45 |
| LIG-53 | Reinas puntúa el tiempo en resolverlo (100 hasta 30 s, 10 a los 5 min), sin castigo por error (D-107). | ✅ v0.46 |
| LIG-54 | 🔤 pasa a llamarse Toque y Fama: Palabra y suma puntos por cada letra encontrada en su lugar, una vez por lugar (D-108). | ✅ v0.47 |
| LIG-55 | La práctica del laboratorio ofrece la sesión de prueba, como un día de la copa (D-109). | ✅ v0.47 |
| LIG-56 | Zip muestra la solución del nivel a medias al acabarse el tiempo (D-109). | ✅ v0.47 |
| LIG-57 | Los reportes que no se pueden enviar se guardan y se reenvían (D-109). | ✅ v0.47 |
| LIG-58 | Recién creada, la copa abre en Administrar con una guía para invitar (D-110). | ✅ v0.48 |
| LIG-59 | El admin cierra y reabre la inscripción (D-110). | ✅ v0.48 |
| LIG-60 | El admin mueve el inicio a hoy o mañana mientras nadie haya jugado (D-110). | ✅ v0.48 |
| LIG-61 | Demos de cada vista de la copa en el laboratorio (D-110). | ✅ v0.48 |
| LIG-62 | Rendirse en Reinas (D-110). | ✅ v0.48 |
| LIG-63 | La copa no usa la temática de Brasil (D-111). | ✅ v0.48 |
| LIG-64 | Todos los minijuegos puntúan de 0 a 100 (D-113). | ✅ v0.49 |
| LIG-65 | Las copas nuevas usan la hora del Pacífico y Administrar muestra la zona (D-113). | ✅ v0.49 |
| LIG-66 | Inicio de la copa: hoy, mañana u otra fecha (hasta 30 días) con calendario (D-115). | ✅ v0.51 |
| LIG-67 | Copas del laboratorio: el admin pasa al día siguiente (D-115). | ✅ v0.51 |
| LIG-68 | El admin elimina la copa, con dos confirmaciones (D-117). | ✅ v0.53 |
| LIG-69 | La copa se juega entre 2 y 10; con el admin solo no parte ni avanza de día (D-118). | ✅ v0.54 |
| LIG-70 | El nombre de la copa llega a 40 caracteres, con contador (D-119). | ✅ v0.55 |
| LIG-71 | Link propio de la copa (?pirata), único mientras dure y reusable 7 días después de terminar (D-121). | ✅ v0.57 |
| LIG-72 | Compartir la tabla parcial como imagen, con "(-1J)" para quien lleva menos juegos (D-126). | ✅ v0.59 |
| LIG-73 | Invitación promocional, sin revelar los minijuegos (D-127). | ✅ v0.60 |
| LIG-74 | Conexiones agrupa por significado, sin juegos de palabras (D-128). | ✅ v0.61 |
| LIG-75 | El tiempo se corta al terminar el tablero, no al tocar "Ver resultado" (D-130). | ✅ v0.62 |
| LIG-75 | El tiempo se corta al terminar el tablero, no al tocar "Ver resultado" (D-130). | ✅ v0.62 |
| LIG-76 | La tabla muestra los 7 días de cada jugador con su estado y una leyenda (D-131). | ✅ v0.63 |
| LIG-75 | El tiempo se corta al terminar el tablero, no al tocar "Ver resultado" (D-130). | ✅ v0.62 |
| LIG-76 | La tabla muestra los 7 días de cada jugador con su estado y una leyenda (D-131). | ✅ v0.63 |
| LIG-77 | Reglas plegadas debajo del tablero en cada minijuego, con las palabras de sus botones (D-133). | ✅ v0.64 |
| LIG-78 | La imagen de la tabla pone gráfico y tabla en el mismo eje, con todos los días y los empates a la vista (D-141). | ✅ v0.64.9 |
| LIG-46 | El teclado, el tablero y la línea se comparten con Toque y Fama y Línea de Tiempo (`assets/js/teclado.js`, `assets/css/teclado.css`, `assets/css/linea.css`). | ✅ v0.44 |

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
| TF-04 | ~~Modo contra el celular: duelo contra un solver.~~ Reemplazado por jugar solo (TF-19, D-129). | ✅ v0.4 |
| TF-05 | Modo dos celulares conectados por sala con código de 4 letras y QR (Firebase Realtime Database). | ✅ v0.4 |
| TF-06 | El secreto no sale del celular durante la partida; compromiso por hash (con sal privada) al inicio y revelación verificada al final. | ✅ v0.4 |
| TF-07 | Reconexión: si un celular se cierra, retoma la partida desde la sala (secreto guardado en el dispositivo). | ✅ v0.4 |
| TF-08 | Derecho a réplica configurable. Quién parte es determinista: el invitado en la primera partida, el perdedor en la revancha (ver D-19). | ✅ v0.4 |
| TF-09 | Textos en español e inglés (“Bulls and Cows”). | ✅ v0.4 |
| TF-18 | Textos en portugués (“Toque e Fama”). | ✅ v0.22 |
| TF-19 | Jugar solo: el celular elige el número y el jugador lo adivina en la menor cantidad de intentos, con récord por cifras y cero al inicio; pistas con palabra completa en su tablero (D-129). | ✅ v0.61 |
| TF-10 | Revancha en los tres modos; en dos celulares se crea una sala nueva y ambos se mueven solos. | ✅ v0.4 |
| TF-11 | Indicador de rival desconectado en modo dos celulares. | ✅ v0.4 |
| TF-12 | Al adivinar, el jugador ve su propio número como recordatorio. En modo un celular parte oculto y se muestra al tocarlo. | ✅ v0.4.1 |
| TF-13 | Pulsación larga sobre una cifra del teclado la marca como bloqueada (no está en el número secreto). Las marcas son por jugador, se recuerdan durante la partida y se ven tachadas; otra pulsación larga las libera. Instrucción breve en pantalla. | ✅ v0.4.2 |
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
| LT-17 | Mazos de Brasil (historia, tele, música y farándula, 140 cartas) y de Fútbol mundial (123 cartas), en los tres idiomas. | ✅ v0.23 |
| LT-15 | Opción de todas las cartas a la vista: se despliega el doble de la meta desde el primer turno, no entra ninguna carta nueva y la mesa solo se achica. Es la opción marcada al abrir la configuración. | ✅ v0.21 |
| LT-16 | Arrastrar la carta de la mano a su lugar en la línea, y retomar la ya puesta para moverla o devolverla. Soltar elige; el botón coloca. | ✅ v0.35 |

## El Ahorcado (AH) — ver [docs/juegos/ahorcado.md](juegos/ahorcado.md)

| ID | Requerimiento | Estado |
|---|---|---|
| AH-01 | Palabra tapada que se adivina por letras; cada error dibuja un trazo del ahorcado. | ✅ v0.26 |
| AH-02 | Errores permitidos configurables: 5, 6 u 8, y el último trazo siempre son los ojos en X. | ✅ v0.26 |
| AH-03 | La palabra sale de una cadena entre jugadores (cada uno para el siguiente, con pista) o del mazo de la app. | ✅ v0.26 |
| AH-04 | Cinco temáticas y una mezcla, con palabra y pista propias en español, inglés y portugués. Con cadena, la temática sugiere palabras a quien escribe (D-62). | ✅ v0.26 |
| AH-05 | Puntaje: los errores que le sobraron a quien adivinó; desempata quien gastó menos letras y después menos tiempo. Los colgados van al final, por cuánto revelaron, y si no la sacó nadie no hay ganador (D-61). | ✅ v0.26 |
| AH-06 | Comprar una letra: revela la que falta más rara y cuesta un error (D-58). | ✅ v0.26 |
| AH-07 | Modo un celular, de 2 a 6 jugadores, con pantalla tapada para escribir y pase en cada letra (D-59). | ✅ v0.26 |
| AH-08 | Modo varios celulares, de 2 a 6 (roles A–F), con sala, anfitrión y turnos alternados (D-66). | ✅ v0.26 |
| AH-09 | Modo jugar solo: la app reparte una palabra de la temática elegida y el jugador la saca. Sin rival y sin secreto que comprometer (D-65). | ✅ v0.26 |
| AH-10 | Con cadena, la palabra no viaja: se compromete con hash y se verifica al final (canon C-10). | ✅ v0.26 |
| AH-11 | Memoria de partida en todos los modos, incluida la palabra a medio escribir (canon C-6). | ✅ v0.26 |
| AH-12 | Teclado de 27 teclas en español y 26 en los otros idiomas; acentos plegados y Ñ aparte (D-57). | ✅ v0.26 |
| AH-13 | Chat de sala en varios celulares (canon C-15). | ✅ v0.26 |
| AH-14 | La tira de rivales muestra vidas y avance, nunca las letras (D-55). | ✅ v0.26 |
| AH-16 | Turnos alternados letra a letra, salteando a quien ya terminó y a quien se fue de la sala (D-59, D-66). | ✅ v0.26 |
| AH-17 | Al confirmar una letra, un cartel breve dice cómo fue antes de que cambie el turno (D-63). | ✅ v0.26 |
| AH-15 | Entra al menú publicado cuando esté probado de punta a punta y con capturas en el README. | ✅ v0.26 |

## Julepe (JU) — ver [docs/juegos/julepe.md](juegos/julepe.md)

| ID | Requerimiento | Estado |
|---|---|---|
| JU-01 | Juego de bazas con baraja inglesa de 52 cartas, cinco por jugador y una vuelta que marca el triunfo. De 2 a 6 jugadores. | ✅ v0.34 |
| JU-02 | El plato: cada jugador pone 2 tragos cuando queda vacío, y solo entonces. | ✅ v0.34 |
| JU-03 | Declaración en secreto: ir (comprometerse a dos bazas) o pasarse (no juega, no bebe). | ✅ v0.34 |
| JU-04 | Si se pasan todos, la mano se anula con el plato acumulado; si va uno solo, el dador se queda obligado (D-83). | ✅ v0.34 |
| JU-05 | Cambio de hasta tres cartas desde la reserva propia, por puestos y no por nombre de carta (D-82). | ✅ v0.34 |
| JU-06 | Las cinco bazas con las tres obligaciones —asistir, montar y fallar—: la app apaga las cartas que no se pueden tirar y dice por qué (C-8b). | ✅ v0.34 |
| JU-07 | Julepe: quien fue y no hizo dos bazas se toma el plato entero, y lo bebido vuelve al plato (se dobla con dos julepes). | ✅ v0.34 |
| JU-08 | Quien se salva reparte dos tragos por baza a quien quiera de la mesa. | ✅ v0.34 |
| JU-09 | Partida de 5, 8 o 12 manos; gana quien terminó más seco, con tabla de tragos y julepes. | ✅ v0.34 |
| JU-10 | Modo un celular, de 2 a 6, con pase y resultado antes de cada pase (C-9). | ✅ v0.34 |
| JU-11 | Modo varios celulares, de 2 a 6, con sala, QR y chat, y reparto cerrado por jugador (D-81). | ✅ v0.34 |
| JU-12 | Modo contra el celular: mesa de tres contra dos rivales que solo miran sus propias cartas. | ✅ v0.34 |
| JU-13 | Al cerrar la mano cada celular destapa sus cartas y todos verifican que nadie jugó una que no tenía (C-10). | ✅ v0.34 |
| JU-14 | Memoria de partida en los tres modos, incluida la llave privada de la sala (C-6). | ✅ v0.34 |
| JU-15 | Los tres idiomas, con nombre propio en cada uno: Julepe, Julep y Paga o Bolo (D-84). | ✅ v0.34 |
