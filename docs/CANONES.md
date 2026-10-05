# Cánones y estándares de Juegos de Salón

Reglas de construcción para **todos** los juegos de la app, actuales y futuros.
Se revisa **antes** de construir un juego nuevo y **antes** de modificar uno existente.
Cada canon tiene un ID (C-n) para citarlo en el código, en los commits y en las decisiones.

> Si un canon estorba en un caso concreto, no se ignora en silencio: se documenta la excepción
> en la especificación del juego y, si conviene para todos, se cambia este archivo.

---

## C-1 · Identidad y tono

- Español chileno informal por defecto; inglés, portugués y alemán son opcionales y se eligen a mano (C-3, D-197). Tuteo, humor liviano, sin groserías fuertes.
- **Instrucciones concisas** (U-8, U-18, D-184): la meta primero y con verbo, a lo más 3 puntos, nada de lo que el dibujo de ejemplo ya muestra y el puntaje en una frase. Un tope en `public/cup/games/juegos.test.mjs` frena lo que se pasa. Concisas no es telegrama: frases completas (U-1).
- Paleta y tipografías compartidas desde `public/assets/css/base.css`: fondo oscuro con degradados, acentos neón (rosado, amarillo, cian, lima), **Bangers** en títulos y **Nunito** en el cuerpo.
- **Las cifras que el jugador lee o compara** (teclados, intentos, números secretos) van en `var(--font-num)` (Nunito 900) con `tabular-nums`, nunca en Bangers: ahí el 1 y el 7 son casi el mismo trazo y los jugadores se equivocan (D-30). Bangers se queda en títulos, nombres, palabras y códigos de sala (letras, sin I ni O).
- Nada de estilos "de marca" propios por juego: un juego puede tener colores temáticos (el mar en Batalla Naval), pero botones, paneles, chips y títulos salen de las clases comunes.
- Cada juego tiene un emoji propio que lo identifica en el menú, la pestaña y la barra superior.
- Momentos de cierre con celebración: confeti y sonido al ganar o al terminar una partida.

## C-2 · Estructura de un juego

Una carpeta por juego dentro de `public/` (la raíz del sitio: carpeta = URL), con nombre en inglés,
en minúsculas y con guiones (`public/hangman/` → `/hangman/`, D-192), y siempre estos archivos:

```
public/<carpeta>/
  index.html      Pantallas como <section class="screen">, barra superior, contenedores #handoff y #cover
  style.css       Solo lo específico del juego
  rules.js        GAME_ID, DEFAULT_CONFIG y LOCALES = { es, en, pt, de }. Datos, sin lógica ni DOM
  engine.js       Reglas puras, sin DOM ni estado global. Testeable con node
  engine.test.mjs Tests del motor (node public/<carpeta>/engine.test.mjs)
  game.js         Máquina de estados y render. Lo único que toca el DOM
```

- **El id no es la carpeta** (D-192): el `id` es un dato —lo guardan las salas, el panel y el
  `localStorage`— y no cambia nunca; la carpeta es la URL y va en `path`. Un juego nuevo puede usar
  el mismo nombre en inglés para los dos. Si una carpeta se renombra, la ruta vieja queda como
  página puente (la genera `node tools/release/og.mjs tarjetas`).
- Los juegos de La Copa siguen la misma idea en `public/cup/games/<carpeta>/`: `engine.js`
  (reglas puras), `ui.js` (pantalla) y sus datos propios; lo común a todos queda en `games/`.
- El juego se registra en `public/assets/js/games.js` con `id`, `emoji`, `name` y `tagline` por idioma, `players`, `duration`, `path` y `available`. Con sala, también `jugadas`: los tipos de mensaje que hace una persona, que es lo que el panel cuenta como jugadas (D-138).
- El `<head>` de cada página de la app lleva el manifest, el ícono y el nombre del iPhone
  (`apple-touch-icon` y `apple-mobile-web-app-title`), el script que elige el manifest del idioma
  justo después del `<link rel="manifest">`, y, después de las hojas de estilo, el
  registro del service worker (`import '<…>assets/js/instalable.js'`, que además pone el manifest y
  el nombre del idioma elegido): así la app se puede instalar desde cualquier juego, con su nombre.
  Se copian de otro juego; `public/assets/js/instalable.test.mjs` los exige (D-221, D-222).
- Las páginas en git no llevan import map: lo escribe `set-version.py` solo en la copia que se publica,
  recorriendo todos los módulos del sitio, así que los de un juego nuevo entran solos (C-11, D-192, D-205).
- Reutilizar siempre los módulos compartidos antes de escribir uno nuevo:
  `public/assets/js/ui.js` (DOM, confeti, vibración, wake lock), `i18n.js`, `sound.js`, `session.js`, `handoff.js`, `transport/`.

## C-3 · Idiomas

- **Español es el idioma por defecto.** Quien entra a juegosdesalon.cl sin haber elegido nada ve la app en español, sea cual sea el idioma de su navegador: nunca se detecta con `navigator.language`. Inglés, portugués y alemán son opcionales: solo se activan cuando la persona toca el toggle, y la elección queda guardada en el dispositivo (D-47, D-197).
- **El idioma también puede venir en el link:** `?lang=pt` en cualquier página, o las puertas `/pt/`, `/en/` y `/de/`. Se aplica, se guarda y el parámetro se saca de la barra. No es detección: alguien lo eligió, para sí mismo o para quien recibe el link. La invitación a una sala lo lleva pegado con `withLang()` (D-74).
- Todo texto visible vive en `LOCALES.es`, `LOCALES.en`, `LOCALES.pt` y `LOCALES.de` de `rules.js`. Ninguna cadena literal en `game.js`.
- Los textos fijos del HTML se marcan con `data-i18n="clave"` (o `data-i18n-html`) y se aplican con `applyStatic(T)`.
- El idioma se lee con `getLang()` y el toggle `langToggle()` va en la intro de cada juego.
- Las traducciones se adaptan, no se calcan: los chistes y las referencias locales se reemplazan por equivalentes. El portugués es el de Brasil, informal ("você", "celular", "rolê"), y los nombres de los juegos se traducen (Quarto Rei, Toque e Fama, Batalha Naval, Linha do Tempo) igual que en inglés (D-48).
- **En La Copa, lo personal va en tu idioma y lo del grupo en el de la copa** (D-170): la pantalla
  sigue el toggle de quien mira, pero las palabras de Conexiones y Palabra, los mensajes que se
  comparten al grupo y su link van en el idioma que se eligió al crear la copa. El contenido con
  palabras es propio de cada idioma, no una traducción.
- **Todos los diccionarios (`IDIOMAS`, también los del laboratorio) tienen exactamente las mismas claves**, las listas el mismo largo y las plantillas las mismas `{llaves}`: un texto que falta en un idioma se ve como `undefined` en pantalla, y `errText` (C-14) busca la misma clave en cualquier idioma. Lo verifica `node public/assets/js/i18n.test.mjs` (menú, frases, mazos y todos los juegos). Los mazos de Línea de Tiempo llevan `es`, `en`, `pt` y `de` en cada carta, y el test del motor también lo exige.
- Las plantillas usan `{llaves}` y una función `fmt()`; nunca se arman frases concatenando palabras sueltas.
- **Un idioma nuevo entra por el laboratorio** (D-191): con todos sus textos (la paridad recorre
  `IDIOMAS`), pero en `EN_LABS`, que lo ofrece solo en el dispositivo que entró por
  `/labs/<idioma>/`. Sale del laboratorio cuando quienes lo hablan lo revisaron. Hoy no hay
  ninguno: el alemán pasó por ahí y salió (D-197); su glosario fijo está en [ALEMAN.md](ALEMAN.md).

## C-4 · Sonido y vibración

- Efectos sintetizados con Web Audio en `public/assets/js/sound.js`. Sin archivos de audio.
- Botón 🔊/🔇 en la barra superior de cada juego. La preferencia se guarda y vale para toda la app.
- Se desbloquea el audio con el primer toque (`initSound()`), requisito de iOS.
- Hay sonido en: toque de botón, acción principal del juego, resultado (bueno y malo), cambio de turno, final.
- `vibrate()` acompaña los momentos importantes, nunca sola como único indicio.

## C-5 · Modos de juego

Un juego para dos personas ofrece los tres modos, en este orden en la intro:

1. **📱 Un celular** (pasar y jugar). Es el modo base y el respaldo cuando la red falla.
2. **📡 Dos celulares** (sala con código de 4 letras y QR).
3. **Un jugador**: **🤖 Contra el celular** cuando el juego tiene información oculta que le da sentido a una IA (Batalla Naval, Dudo), o **🧍 Jugar solo** con puntaje y récord cuando un rival de máquina no agrega nada (Línea de Tiempo, ver D-27; Toque y Fama, ver D-129). La tarjeta del menú dice "1–N jugadores".

Un juego de grupo (más de dos) elige si se ofrece en un celular, en varios o en los dos; lo que
no ofrece no se muestra (D-213). "Próximamente", deshabilitado y a la vista, es solo para un
modo que el juego piensa tener.

## C-6 · Memoria de partida (obligatorio en todos los modos)

**Toda partida en curso se puede retomar.** Vale para un celular, contra el celular y dos celulares.

- Se guarda con `createSessionStore(GAME_ID)` de `public/assets/js/session.js`, bajo `juegos-de-salon:<id>:session`, con caducidad de 12 horas.
- Se guarda después de cada acción que cambia el estado, no solo al final de un turno. Incluye el trabajo a medio hacer (una flota a medio colocar, notas del jugador).
- La intro muestra un panel "⏯ Hay una partida a medias" con **Continuar** y **Borrar** mientras exista una partida sin terminar.
- Al terminar la partida se marca `done: true` y el panel deja de ofrecerse.
- Empezar una partida nueva borra la guardada.
- En juegos con reductor de mensajes se guarda la lista de mensajes y se retoma reproduciéndola (`createLocalTransport({ seed })`); los datos privados (número secreto, flota) van en `private`, nunca viajan por la red.
- Al retomar en modo un celular se vuelve a mostrar la pantalla de pase o la pantalla tapada: nadie sabe quién tiene el teléfono.
- Escribir en `localStorage` puede fallar (modo privado, cuota). Siempre en `try/catch`: si falla, el juego sigue funcionando sin memoria.
- El nombre del jugador se recuerda entre partidas con `createNameStore(GAME_ID)`. Un juego de grupo en un celular recuerda además la mesa entera con su `list()`/`setList()` (`juegos-de-salon:<id>:names`); una clave vieja de esa lista va en `legacyKeys` y se muda sola la primera vez.

## C-7 · Transporte y multijugador

- El estado de una partida se deriva de una **lista de mensajes** (`view()`), nunca de variables sueltas de turno. Así la reconexión es "volver a leer los mensajes".
- Los mensajes se procesan en serie; los duplicados y los fuera de turno se descartan en el reductor.
- **Lo que se reparte sale de la semilla:** cartas, palabras y todo lo repartible se derivan de la
  semilla compartida que va en la lista de mensajes, así cada celular llega al mismo reparto sin
  mandarlo. La excepción es lo oculto que nadie debe poder calcular con el código, que es público: los
  dados de Dudo van comprometidos con hash y sal (D-70) y las manos de Julepe en sobres cerrados
  (D-81). Ver C-10.
- Todos los modos usan la misma lógica: cambia el transporte, no el juego.
  `public/assets/js/transport/local.js` (mismo dispositivo, también para la IA) y `firebase.js` (sala remota).
- Interfaz del transporte: `create`, `join`, `send`, `onMessage`, `onPresence`, `leave`, `dispose`.
- **Campos reservados del transporte:** `from`, `at` (marca de tiempo) e `id`. Un juego que necesite enviar una posición o una cantidad usa otro nombre, o el transporte se lo pisará sin avisar.
- **Firebase no guarda una lista vacía:** el campo simplemente no queda. Una lista que puede ir vacía viaja como texto (`"1,4,8"`, o `""`) y el motor la lee aceptando la cadena, la lista cruda del transporte local y el campo ausente (D-60).
- Salas: código de 4 letras mayúsculas sin I ni O, QR con `?sala=CÓDIGO`, campo `game` para separar juegos, caducidad de media hora sin jugadas y de 6 horas en total (D-89). Roles de A a F (hasta seis jugadores).
- **Antes de tocar la sala se espera la conexión.** Crear o entrar espera a `.info/connected` (8 s) y corre con tope (12 s), y el tope de salas por celular se revisa antes de la red (`errors.js`, `ratelimit.js`). Sin eso, quedarse sin señal se ve como un botón pegado para siempre.
- **Un celular no puede abrir salas sin parar:** 20 por hora y 80 por día (D-41). El tope está sobre el uso legítimo más intenso, no sobre el promedio, porque la revancha abre sala nueva. Si `localStorage` falla, se deja crear: bloquear a un jugador legítimo es peor que dejar pasar a un abusivo.
- **Cada partida deja una señal de uso para el panel del dueño** (`public/assets/js/transport/stats.js`, D-44). El transporte apunta las salas solo; los modos sin red llaman `trackStart({ game, mode, players })` al empezar (no al retomar) y `trackFinish({ ganador, empate, detalle })` al terminar. Es un `fetch` por REST, sin SDK, mejor esfuerzo: nunca se espera ni se muestra. Un modo sin red manda quién juega —los nombres que la partida ya tiene (`nombres` en `trackStart`) o, si no hay, el último que la persona escribió en la app (`nombreDelCelular`)— y cómo terminó, una sola vez (D-210), además del idioma elegido en la app (D-211). Nunca sale un secreto, el chat ni una IP. Quien **entra a propósito** con su nombre y PIN para los rankings (D-212) manda además su mejor puntaje y sus partidas a su jugador; sin entrar, nada de eso. De una **sala** quedan además el país del celular y quién ganó, que es lo que el panel muestra como bitácora (D-79). Una partida sin red se ve en vivo en el panel porque `trackStart` le arranca un latido (D-140): el juego no tiene que hacer nada más.
- **Irse a propósito cierra la sala.** `leave()` suelta los oyentes y deja la sala esperando; `dispose()` es la despedida: escribe `left` en el rol y borra la sala si con eso no queda nadie adentro (`public/assets/js/transport/dispose.js`, D-50). Lo llaman el botón de cancelar o salir de la sala del lobby, el de cambiar de modo al final y el cambio a la sala de la revancha. **Cerrar la pestaña o quedarse sin señal no es irse:** eso solo apaga `online`, porque esa partida se puede retomar (C-6), así que nada de esto cuelga de `pagehide`. Nunca lanza, lleva tope corto y, si falla, la sala queda marcada y la borra la papelera.
- **Las salas vencidas se borran solas.** Al crear o entrar a una sala, el celular la apunta en la papelera (`cleanup/days/<día>`) y de vez en cuando barre los días pendientes borrando lo vencido (`public/assets/js/transport/cleanup.js`, D-39). Nada de esto se le muestra al jugador ni puede voltear una partida: si falla, barre el celular siguiente.
- Con más de dos jugadores, el reparto de roles es una carrera: se escribe el rol con un identificador de dispositivo y se relee para confirmar quién lo obtuvo. Nunca se asume que el primer rol libre que se leyó sigue libre.
- Cuando hay más de dos jugadores, uno es anfitrión (rol A) y abre la partida cuando están todos.
- Quien abre un enlace de sala (`?sala=CÓDIGO`) llega a una pantalla que **solo** deja unirse a esa sala: título propio de invitación, nada de botón para crear otra, el código va fijo y de solo lectura, y los ajustes de la partida no se muestran porque los fija el anfitrión. Ofrecer las dos cosas confunde a quien fue invitado.
- El enlace de la sala se comparte con el diálogo nativo del sistema (`botonInvitar` en `public/assets/js/compartir.js`); copiar al portapapeles es solo el respaldo cuando el navegador no tiene ese diálogo. El diálogo del celular ya incluye copiar, así que no se pierde nada.
- **Todo lo que se comparte** pasa por `public/assets/js/compartir.js` y sigue su estándar (D-165, U-30, U-33): cabecera `{emoji} *{título}* · {contexto}`, una idea por línea y el link solo al final; si va imagen, lleva arriba la misma cabecera y abajo el mismo link (`lamina`, `laminaResultado`), y se manda junto con su texto. Las invitaciones van solo con texto; la app, desde la portada, con su tarjeta social del idioma como imagen (`compartirApp`, D-226). Un juego nuevo no arma su propio mensaje ni su propio botón.
- Se muestra cuando el rival se desconecta y se retoma solo cuando vuelve.
- La revancha crea una sala nueva y mueve a los dos jugadores; parte quien perdió.

## C-8 · Interfaz táctil

- Objetivos táctiles de 44 px como mínimo; los controles pequeños llevan área táctil ampliada invisible.
- `.app` mide `calc(100svh - muescas)`, el alto chico de la pantalla, no `100dvh`: lo que se apoya abajo tiene que verse también cuando el navegador muestra toda su interfaz. Se revisa con `node tools/e2e/mirar.mjs <juego> <pantalla> --muescas` (D-77).
- Las acciones irreversibles se confirman: seleccionar y luego confirmar (por ejemplo elegir casilla y tocar "¡Fuego!").
- **Nada se preselecciona** en una jugada que se confirma. La app no elige por el jugador: sin selección explícita, el botón de confirmar va deshabilitado. En una lista que se desplaza, un toque puede irse en scroll y no llegar nunca; si había algo preseleccionado, el jugador termina confirmando lo que no eligió (D-38). Un ajuste de la partida sí puede venir con un valor por defecto, si se ve y se puede cambiar antes de empezar (D-213). **Jugada** es lo que se elige durante la partida y se confirma con un botón (una casilla, una carta, una apuesta, una respuesta). **Ajuste** es lo que se elige antes de que la partida empiece y vale para toda ella (jugadores, mazo, temática, número de rondas, el género en Cuarto Rey, las opciones de una copa al crearla o inscribirse), aunque se elija entre una partida y la siguiente.
- El botón que confirma **dice sobre qué actúa** ("Colocar aquí · 🔍 Se funda Google"), no solo la acción.
- Nada importante bajo la línea de flotación en un celular de 812 px: los botones de la pantalla final deben verse sin desplazar.
- Si una lista puede crecer sin límite, el botón de confirmar va flotando (`position: sticky; bottom: 0`) con un degradado detrás, nunca al final del contenido.
- Los bloques largos (repaso de la partida, reglas) van colapsados por defecto.
- Sin scroll horizontal. Las grillas y tablas se adaptan al ancho.
- Las etiquetas de una grilla (letras, números) van **dentro** de la misma grilla CSS, como una fila y una columna más; nunca en un contenedor aparte que se alinea "a ojo", porque cada navegador lo estira distinto (pasó en Safari con Batalla Naval).
- Se respeta `prefers-reduced-motion`.
- Un toque fuera de un elemento seleccionado lo deselecciona.
- **De quién es el turno se ve sin leer** (D-92): con señales redundantes —el color y la forma de la barra de estado o el asiento encendido, lo tocable vivo y lo ajeno apagado—, un toque fuera de turno que responde (C-8b) y, al llegar el turno, `SFX.turn()` con vibración.
- **Arrastrar es elegir, nunca confirmar** (D-85). Donde haya arrastre, soltar deja la jugada
  elegida y la acción irreversible sigue colgando del botón que la nombra; el camino de toques
  queda intacto, y el gesto sale de `public/assets/js/arrastre.js`, no de una implementación propia.
  El navegador no se lo puede llevar: `overscroll-behavior: none` en `<html>` y `<body>` (que el
  deslizar para actualizar no recargue la partida) y `touch-action` en toda la zona de arrastre, no
  solo en cada pieza (D-86). Un gesto nuevo se prueba en un celular de verdad (D-67).
  Lo que se arrastra se dibuja en grande y **por sobre el dedo**: si el texto era chico en la
  lista, arrastrarlo bajo el dedo lo deja igual de ilegible y además tapado.
- Se muestra en pantalla lo que el jugador necesita recordar (su número secreto, su flota), tapado si el celular pasa de mano.

## C-8b · Errores del jugador

- Un error se muestra con una señal inconfundible (color, sacudida, sonido propio) y se queda en pantalla hasta que el jugador toca; nunca se cierra solo ni lo pisa la jugada de otro.
- Esa señal es **para quien se equivocó**. A los demás el mismo hecho les llega como noticia, en tercera persona y sin el fondo rojo: “¡Cata se equivocó!”, no “¡Te equivocaste!” (D-36).
- Va acompañado de una explicación corta y concreta de qué estuvo mal, con los datos del juego (por ejemplo, entre qué hitos iba la carta y entre cuáles se puso).
- Un acierto o la jugada de otro puede cerrarse solo tras un par de segundos, si después no viene un pase de celular; un toque lo cierra antes. Si viene un pase, manda C-9 (D-213).
- El temporizador que cierra un aviso solo puede cerrar ese aviso, no uno más nuevo.
- **Excepción, cuando errar es la jugada normal** (D-56): en El Ahorcado, una letra que no está no abre un aviso que haya que cerrar en los modos donde el celular no cambia de mano; se señala por cuatro canales (color, sacudida, sonido y el dibujo que avanza) y el juego sigue. El veredicto de la ronda sí se queda hasta que el jugador toque.

## C-9 · Transiciones de "pasar el celular"

- En modo un celular, entre turnos siempre hay: **resultado de lo que acaba de pasar** y, debajo, **"Pásale el celular a X"** con un botón. Nunca se salta el resultado.
- Se usa `public/assets/js/handoff.js` (`showHandoff`, `passBlock`, `showCover`), no una implementación propia.
- Cuando hay un botón de pase, solo el botón avanza: un toque accidental no puede cerrar la pantalla antes de leerla. El resultado se queda hasta el botón; nada lo cierra con un temporizador (D-213).
- La información secreta se tapa con `showCover` antes de que el siguiente jugador mire.

## C-10 · Anti-trampa

Cuando cada dispositivo guarda un secreto (un número, una flota):

- Al fijarlo se publica `sha256(secreto + sal privada)`; la sal se revela solo al final.
- Al terminar se revelan los secretos y cada dispositivo verifica el hash **y** recalcula todas las respuestas dadas por el rival.
- El resultado se muestra al jugador: "verificado ✅" o "⚠️ no coincide".
- El secreto nunca viaja por la red durante la partida.
- **Lo oculto que sí tiene que viajar** no sale de la semilla (C-7): los dados se tiran en cada celular y se publica `sha256(dados + sal)`, que se verifica al destapar (D-70); un reparto se cierra por jugador, con la llave pública de cada uno (`public/assets/js/sobre.js`), y al cerrar la mano cada uno destapa lo suyo para verificarlo contra lo jugado (D-81).

## C-11 · Publicación y versionado

- La versión de una publicación es la primera entrada de `CHANGELOG.md` (`## X.Y.Z — fecha`), que se escribe al fusionar. Las páginas en git no la llevan (D-205).
- Al publicar, `publicar.yml` corre `set-version.py --sitio _site`: estampa `?v=X.Y.Z-<commit>` en los import maps, las hojas de estilo y las imágenes de las tarjetas, y la versión en el pie del menú, solo en la copia que se sube. Así el navegador no mezcla archivos viejos y nuevos, y dos PR abiertos no chocan.
- Que el README (C-13) y las tarjetas (D-181) no hayan quedado atrás lo frena el check `pruebas` de cada PR, y se vuelve a revisar antes de publicar.
- Los módulos nuevos entran solos: el script recorre `**/*.js` del sitio y estampa toda página que cargue módulos (D-192).
- Se publica solo `public/`, con `.github/workflows/publicar.yml`, en cada fusión a main y solo si las pruebas pasan (D-192).
- El menú dibuja la lista de juegos **antes** que cualquier adorno, y los adornos van en `try/catch`: un adorno roto no puede dejar la app vacía.
- Cada cambio publicado entra en `CHANGELOG.md` con su versión.
- Se verifica que el sitio publicado sirva la versión nueva antes de darla por lista: lo hace el último paso de `publicar.yml` (D-205).

## C-12 · Pruebas

- El motor de cada juego tiene tests que corren con node, sin navegador. GitHub los corre todos en cada PR y en cada fusión a main (D-143): un PR con ❌ no se fusiona. `main` exige `pruebas` y `punta-a-punta` (el resumen de los guiones en Chrome), y un PR listo lleva auto-merge: GitHub lo fusiona solo cuando los dos pasan (D-216).
- **Lo vigila un test, no la memoria** (D-213): `node public/assets/js/games.test.mjs` exige a cada juego de `GAMES` su motor y sus tests (C-2), el gancho `window.__…` (C-14) y la especificación con las secciones de C-13 en orden y el gancho nombrado. Lo que un juego todavía no cumple va en `EXCEPCIONES` de ese test, con la decisión que lo deja pendiente; cuando el juego se pone al día, el test pide borrar la excepción.
- Antes de publicar se prueba el juego de punta a punta en Chrome headless: partida completa en cada modo, con recarga a mitad de partida y revancha.
- El modo de dos celulares se prueba con dos instancias del navegador, y al menos una vez contra la URL publicada.
- Un cambio en un módulo compartido obliga a repetir la regresión de **todos** los juegos.
- Se revisan capturas reales de cada pantalla, no solo el resultado de los asertos: los problemas de diseño se ven, no se afirman. Rehacerlas no es revisarlas: antes de publicar se mira la hoja de contacto (`node tools/e2e/contacto.mjs <seccion>`), que las pone juntas al tamaño del README (D-76).
- Una captura se saca con la pantalla quieta. Congelada a media animación, una lista con entradas escalonadas se fotografía con las filas a distintos anchos y parece un error de CSS que no existe (D-76).
- Consola sin errores es parte del criterio de aceptación.
- **Cada pantalla se prueba en todos los idiomas que se ofrecen** (D-199): el `idiomas.mjs` de cada
  juego en `tools/e2e/` recorre las pantallas de `caminos.mjs` en cada idioma de `LANGS` contra
  el español. Un guion que mira algo de un idioma recorre `LANGS`, no una lista escrita a mano, y
  saca del diccionario lo que espera: así un idioma nuevo queda probado el día que entra.

## C-13 · Documentación

Con cada juego o cambio relevante se actualiza:

- `docs/games/<carpeta>.md`: la especificación, con estas secciones en este orden: Resumen,
  Reglas, Modos, Flujo, Protocolo de mensajes, Archivos y Excepciones a los cánones (D-213). Lo que
  un juego necesite además va en una sección propia. Los juegos de La Copa viven en `cup.md`.
- `docs/REQUERIMIENTOS.md`: requerimientos con prefijo propio y estado.
- `docs/DECISIONES.md`: una decisión numerada (D-n) por cada elección no obvia, con su porqué y sus consecuencias.
- `README.md`: sección del juego con capturas, **en inglés** (ver abajo).
- `CHANGELOG.md`: qué cambió, en qué versión.

**El README va en inglés; el resto de la documentación, en español** (D-78). Es la única página
del proyecto que lee gente de cualquier parte: la app es chilena y se construye en español, pero
quien llega al repositorio desde afuera llega ahí. Eso alcanza también a lo que el README muestra
generado: los modos salen del `en` de cada `rules.js`, las temáticas del `en` de los mazos y los
pies de foto de `docs/capturas.json` se escriben en inglés. Los cánones, las decisiones, las
especificaciones y los mensajes de las herramientas siguen en español, que es el idioma en que se
piensa este proyecto.

El README no se mantiene a pulso: `python3 tools/release/readme.py` lo sostiene.

- Lo derivable del código —tabla de juegos, modos, temáticas con su cuenta de cartas, nombres
  por idioma, tests, índice de documentos y galerías de capturas— vive entre marcas
  `<!-- generado: ... -->` y lo reescribe `actualizar` desde `tools/release/hechos.mjs`, que importa
  los módulos de verdad. Dentro de esas marcas no se edita a mano.
- La prosa la escribe una persona. `revisar` compara los hechos de hoy contra el último sello
  (`docs/hechos.json`) y nombra qué cambió y qué sección hay que releer; `sellar` lo anota
  cuando ya se releyó. Un cambio material que no pasó por ahí no llega a publicarse:
  el check `pruebas` corre `revisar` en cada PR y antes de publicar (C-11, D-205).
- Las capturas salen de los guiones de `tools/e2e/`: `docs/capturas.json` dice de qué guion y
  de qué toma sale cada imagen, y `capturas <seccion>` las rehace. Una pantalla nueva en el
  README es una toma nueva en el guion, no un recorte a mano. Se miran antes de publicar
  (C-12) y se guardan al doble del ancho con que se muestran.
- Una captura atrasada es un aviso en un PR cualquiera, no lo frena. Solo "actualiza el README"
  exige dejarlas todas al día (D-213).

Lo que se atrasa igual lo recoge el agente `documentacion` (D-172): una ronda diaria sobre lo que
entró a `main` y una revisión de cada PR antes de proponer su fusión, con
`node tools/agents/documentar.mjs revisar` y su memoria en `docs/documentacion.json`. No reemplaza esta
regla: quien cambia algo lo documenta en su mismo PR.

## C-14 · Robustez

- Nada de dependencias de npm ni de paso de compilación: el repo publicado se abre y funciona.
- Las bibliotecas externas (QR) se cargan bajo demanda y su falla no rompe la pantalla.
- Cada juego expone un gancho de solo lectura `window.__…` para las pruebas automatizadas, nombrado en la especificación del juego (D-213).
- La pantalla no se apaga jugando (`keepAwake()`).
- Los errores previsibles se muestran al jugador en su idioma, con una salida clara; nunca una pantalla en blanco.
- **El mensaje no inventa la causa.** Si desde el navegador no se puede distinguir entre dos causas (quedarse sin señal y toparse con el tope de conexiones se ven igual), el texto las nombra a las dos en vez de elegir una. Precisión falsa es peor que vaguedad honesta (D-40).
- Los errores del transporte se traducen con `errText`/`failWith` de `public/assets/js/transport/errors.js`, nunca con un mapa propio en cada juego.
- **Un reintento nunca traba** (U-22, D-123): si una escritura que se hace una sola vez choca al reintentar, primero se mira si la anterior llegó (aunque el celular haya mostrado error); si llegó, se sigue como si hubiera salido bien.
- **A la consola solo va lo inesperado.** Un error previsto que ya se le mostró al jugador no se registra: si la consola se llena de fallas normales, "consola sin errores" deja de servir como criterio (C-12).

## C-15 · Chat de sala

Solo en los modos de **varios celulares**: en un celular la gente está mirando la misma pantalla y hablando en voz alta, y en solitario no hay con quién.

- Se usa `public/assets/js/chat.js` (`createChat`), no una implementación propia. Los textos salen de `LOCALES` del juego (C-3).
- Vive en su propio contenedor (`<div id="chat">`), hermano de `#handoff` y **fuera** de las `.screen`: los re-render de la partida no pueden borrar lo que el jugador está escribiendo.
- Los mensajes viajan por el mismo transporte que las jugadas (`{ t: 'chat', text }`), pero **no son parte del estado**: el reductor los dibuja y no los guarda. Un mensaje de chat no vuelve a dibujar la partida.
- El chat **muere con la sala**, no con la partida: sigue vivo en la pantalla de victoria o derrota, que es donde la conversación se cierra sola (D-35). No se guarda en la memoria de partida (C-6), y la revancha crea una sala nueva y por lo tanto un chat en blanco. Al reconectar se recupera de la sala, sin sonido ni globito de no leídos.
- No aparece sobre las pantallas de veredicto: el chat va por debajo de `#handoff` y se cierra solo cuando llega el turno del jugador (salvo que esté escribiendo).
- Donde esté la burbuja, la pantalla deja aire abajo para que no tape lo que importa: el último intento del tablero o los botones del final (C-8).
- Burbuja flotante con globito de no leídos; sonido discreto y vibración corta al recibir, sujetos al botón de silencio (C-4).
- Un mensaje nuevo se asoma unos segundos al lado de la burbuja, con el nombre de quien escribe: el globito dice *cuántos*, la etiqueta dice *qué*. Se puede tocar para abrir el chat y desaparece sola.
- Límites: 120 caracteres por mensaje, un mensaje cada 1,2 s por celular y los últimos 60 en pantalla. Las reglas de Firebase validan el largo del texto.
- La sala se lee con solo saber el código: el chat no es privado y no se usa para nada sensible.

## C-16 · El panel se entera solo

El panel del dueño (`/panel/`) no lleva su propia lista de juegos, ni de modos, ni de idiomas:
lee las mismas listas que usa la app y dibuja las señales que le llegan. **Un juego, un modo,
un idioma o un entorno nuevo tiene que aparecer ahí sin que nadie se acuerde de ir a editarlo**,
porque el día que se agrega un juego nadie se acuerda del panel, y una cifra que falta no se ve
como un error: se lee como que nadie jugó.

- **Una lista por eje, y una sola.** Los juegos y los modos viven en `public/assets/js/games.js`
  (`GAMES`, `MODES`, y de ahí salen `gameLabel`, `modeIcon`, `ROOM_MODE`, `LOCAL_MODES` y
  `MAX_PLAYERS`); los entornos, en `public/assets/js/transport/stats.js` (`ENVS`); los idiomas, en
  `public/assets/js/i18n.js` (`LANGS`). El panel las importa. No las copia **en ninguna parte**: ni en
  el JavaScript, ni en las opciones del HTML, ni en una regla de CSS por modo.
- **Lo desconocido se muestra, no se descarta.** Una señal de un juego, un modo o un idioma que
  el panel no conoce se dibuja igual, con su clave cruda por nombre. Pasa siempre: la app
  publicada empieza a mandar lo nuevo antes de que nadie mire el panel, y lo de un juego que ya
  se fue del menú queda guardado. Descartarlo en silencio es mentir en la cifra total.
- **Se valida la forma, no la lista.** Las reglas de `firebase/database.rules.json` aceptan un
  modo por su forma (`^[a-z][a-z-]{0,15}$`, la misma de `MODE_KEY`) y no por enumeración, igual
  que ya hacían con el id del juego. Una lista en las reglas es peor que una lista en el código:
  rechaza la señal en el servidor, la partida ni se entera y el dato no existe nunca más.
- **Ningún tope escrito a mano.** Cuántos jugadores caben sale de `MAX_PLAYERS`, derivado del
  juego más numeroso del registro. Un juego de ocho sube el tope solo (y obliga a crecer los
  roles de sala `A`–`F` y el patrón de `$p` en las reglas, que es un cambio aparte).
- **El color y el ícono se reparten, no se asignan uno por uno.** Los colores de las barras se
  toman por orden de la paleta y el ícono sale del registro: un modo nuevo entra con su color y
  con `·` mientras nadie le elija emoji, nunca gris ni invisible.
- **Lo vigila un test, no la memoria:** `node public/panel/adapta.test.mjs` inventa un juego, un modo y
  una partida más numerosa, y exige que lleguen hasta la barra; además falla si el panel o las
  reglas vuelven a nombrar un juego o un modo. Para mirarlo: `node tools/e2e/mirar.mjs panel datos`,
  que siembra el panel con un juego y un modo que no existen.
- **Lo que sí hay que tocar a mano:** una **categoría** de señal nueva (algo que no sea juego,
  modo, jugadores, zona horaria, idioma ni hora) necesita su línea en las reglas, su sección en
  el panel y publicar las reglas en la consola (ver [PANEL.md](PANEL.md)).

---

## Lista de chequeo antes de dar por listo un juego

- [ ] Los modos que ofrece (los tres, si es para dos) funcionan y la partida se puede retomar en **todos** (C-5, C-6).
- [ ] Las instrucciones siguen U-18: la meta primero, a lo más 3 puntos, sin repetir el dibujo de ejemplo (C-1).
- [ ] Todo el texto está en español, inglés, portugués y alemán (el de `IDIOMAS`, también el del laboratorio), con las mismas claves en todos, sin cadenas sueltas en el código (C-3, D-191).
- [ ] Sus pantallas están en `tools/e2e/caminos.mjs` y su `idiomas.mjs` pasa en todos los idiomas (C-12, D-199).
- [ ] Hay sonido y vibración en las acciones clave, con botón de silencio (C-4).
- [ ] Los botones tienen 44 px, los botones finales se ven sin desplazar y no hay scroll horizontal (C-8).
- [ ] En un celular, el resultado se ve antes del pase, y lo secreto va tapado (C-9).
- [ ] Los secretos se comprometen y verifican (C-10).
- [ ] Las fallas de sala se ven en pantalla, en todos los idiomas, y la consola queda limpia (C-14).
- [ ] Tests del motor y `node public/assets/js/games.test.mjs` en verde, y partida completa probada en cada modo, con capturas revisadas (C-12).
- [ ] Lo que cambió, descrito en el PR para que quien fusiona escriba la entrada de `CHANGELOG.md` con su versión; publicada y comprobada en la URL pública por `publicar.yml` (C-11, D-205).
- [ ] Si tiene varios celulares, el chat de sala usa el módulo compartido y muere con la sala (C-15).
- [ ] Lo que comparte (sala, resultado) sale de `compartir.js`, con la cabecera del estándar, y un resultado va con su imagen (C-7, D-165).
- [ ] Registro en el menú, README, especificación, requerimientos y decisiones (C-2, C-13).
- [ ] Las excepciones a los cánones están escritas en su especificación (C-13).
- [ ] El panel lo muestra sin haberlo tocado: `node public/panel/adapta.test.mjs` en verde y una mirada a `node tools/e2e/mirar.mjs panel datos` (C-16).
- [ ] Capturas del README rehechas y miradas, y `python3 tools/release/readme.py revisar` en verde (C-13).
- [ ] `node tools/agents/documentar.mjs revisar --desde origin/main` sin ✗ nuevos: decisiones, pruebas, guiones y CHANGELOG al día (D-172).
