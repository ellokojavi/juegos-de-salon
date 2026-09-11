# Cánones y estándares de Juegos de Salón

Reglas de construcción para **todos** los juegos de la app, actuales y futuros.
Se revisa **antes** de construir un juego nuevo y **antes** de modificar uno existente.
Cada canon tiene un ID (C-n) para citarlo en el código, en los commits y en las decisiones.

> Si un canon estorba en un caso concreto, no se ignora en silencio: se documenta la excepción
> en la especificación del juego y, si conviene para todos, se cambia este archivo.

---

## C-1 · Identidad y tono

- Español chileno informal por defecto, inglés como segundo idioma. Tuteo, humor liviano, sin groserías fuertes.
- Paleta y tipografías compartidas desde `assets/css/base.css`: fondo oscuro con degradados, acentos neón (rosado, amarillo, cian, lima), **Bangers** en títulos y **Nunito** en el cuerpo.
- **Las cifras que el jugador lee o compara** (teclados, intentos, números secretos) van en `var(--font-num)` (Nunito 900) con `tabular-nums`, nunca en Bangers: ahí el 1 y el 7 son casi el mismo trazo y los jugadores se equivocan (D-30). Bangers se queda en títulos, nombres, palabras y códigos de sala (letras, sin I ni O).
- Nada de estilos "de marca" propios por juego: un juego puede tener colores temáticos (el mar en Batalla Naval), pero botones, paneles, chips y títulos salen de las clases comunes.
- Cada juego tiene un emoji propio que lo identifica en el menú, la pestaña y la barra superior.
- Momentos de cierre con celebración: confeti y sonido al ganar o al terminar una partida.

## C-2 · Estructura de un juego

Una carpeta por juego, con su propia URL (`/<id>/`) y siempre estos archivos:

```
<id>/
  index.html      Pantallas como <section class="screen">, barra superior, contenedores #handoff y #cover
  style.css       Solo lo específico del juego
  rules.js        GAME_ID, DEFAULT_CONFIG y LOCALES = { es, en }. Datos, sin lógica ni DOM
  engine.js       Reglas puras, sin DOM ni estado global. Testeable con node
  engine.test.mjs Tests del motor (node <id>/engine.test.mjs)
  game.js         Máquina de estados y render. Lo único que toca el DOM
```

- El juego se registra en `assets/js/games.js` con `id`, `emoji`, `name` y `tagline` por idioma, `players`, `duration`, `path` y `available`.
- Sus módulos se agregan a `MODULES` en `tools/set-version.py` (C-11).
- Reutilizar siempre los módulos compartidos antes de escribir uno nuevo:
  `assets/js/ui.js` (DOM, confeti, vibración, wake lock), `i18n.js`, `sound.js`, `session.js`, `handoff.js`, `transport/`.

## C-3 · Idiomas

- Todo texto visible vive en `LOCALES.es` y `LOCALES.en` de `rules.js`. Ninguna cadena literal en `game.js`.
- Los textos fijos del HTML se marcan con `data-i18n="clave"` (o `data-i18n-html`) y se aplican con `applyStatic(T)`.
- El idioma se lee con `getLang()` y el toggle `langToggle()` va en la intro de cada juego.
- Las traducciones se adaptan, no se calcan: los chistes y las referencias locales se reemplazan por equivalentes.
- Las plantillas usan `{llaves}` y una función `fmt()`; nunca se arman frases concatenando palabras sueltas.

## C-4 · Sonido y vibración

- Efectos sintetizados con Web Audio en `assets/js/sound.js`. Sin archivos de audio.
- Botón 🔊/🔇 en la barra superior de cada juego. La preferencia se guarda y vale para toda la app.
- Se desbloquea el audio con el primer toque (`initSound()`), requisito de iOS.
- Hay sonido en: toque de botón, acción principal del juego, resultado (bueno y malo), cambio de turno, final.
- `vibrate()` acompaña los momentos importantes, nunca sola como único indicio.

## C-5 · Modos de juego

Un juego para dos personas ofrece los tres modos, en este orden en la intro:

1. **📱 Un celular** (pasar y jugar). Es el modo base y el respaldo cuando la red falla.
2. **📡 Dos celulares** (sala con código de 4 letras y QR).
3. **Un jugador**: **🤖 Contra el celular** cuando el juego tiene información oculta que le da sentido a una IA (Toque y Fama, Batalla Naval), o **🧍 Jugar solo** con puntaje y récord cuando toda la información es pública (Línea de Tiempo, ver D-27). La tarjeta del menú dice "1–N jugadores".

Un modo que todavía no existe se muestra deshabilitado con "Próximamente", nunca se oculta.

## C-6 · Memoria de partida (obligatorio en todos los modos)

**Toda partida en curso se puede retomar.** Vale para un celular, contra el celular y dos celulares.

- Se guarda con `createSessionStore(GAME_ID)` de `assets/js/session.js`, bajo `juegos-de-salon:<id>:session`, con caducidad de 12 horas.
- Se guarda después de cada acción que cambia el estado, no solo al final de un turno. Incluye el trabajo a medio hacer (una flota a medio colocar, notas del jugador).
- La intro muestra un panel "⏯ Hay una partida a medias" con **Continuar** y **Borrar** mientras exista una partida sin terminar.
- Al terminar la partida se marca `done: true` y el panel deja de ofrecerse.
- Empezar una partida nueva borra la guardada.
- En juegos con reductor de mensajes se guarda la lista de mensajes y se retoma reproduciéndola (`createLocalTransport({ seed })`); los datos privados (número secreto, flota) van en `private`, nunca viajan por la red.
- Al retomar en modo un celular se vuelve a mostrar la pantalla de pase o la pantalla tapada: nadie sabe quién tiene el teléfono.
- Escribir en `localStorage` puede fallar (modo privado, cuota). Siempre en `try/catch`: si falla, el juego sigue funcionando sin memoria.
- El nombre del jugador se recuerda entre partidas con `createNameStore(GAME_ID)`.

## C-7 · Transporte y multijugador

- El estado de una partida se deriva de una **lista de mensajes** (`view()`), nunca de variables sueltas de turno. Así la reconexión es "volver a leer los mensajes".
- Los mensajes se procesan en serie; los duplicados y los fuera de turno se descartan en el reductor.
- Todos los modos usan la misma lógica: cambia el transporte, no el juego.
  `assets/js/transport/local.js` (mismo dispositivo, también para la IA) y `firebase.js` (sala remota).
- Interfaz del transporte: `create`, `join`, `send`, `onMessage`, `onPresence`, `leave`.
- **Campos reservados del transporte:** `from`, `at` (marca de tiempo) e `id`. Un juego que necesite enviar una posición o una cantidad usa otro nombre, o el transporte se lo pisará sin avisar.
- Salas: código de 4 letras mayúsculas sin I ni O, QR con `?sala=CÓDIGO`, campo `game` para separar juegos, caducidad de 6 horas. Roles de A a F (hasta seis jugadores).
- **Antes de tocar la sala se espera la conexión.** Crear o entrar espera a `.info/connected` (8 s) y corre con tope (12 s), y el tope de salas por celular se revisa antes de la red (`errors.js`, `ratelimit.js`). Sin eso, quedarse sin señal se ve como un botón pegado para siempre.
- **Un celular no puede abrir salas sin parar:** 20 por hora y 80 por día (D-41). El tope está sobre el uso legítimo más intenso, no sobre el promedio, porque la revancha abre sala nueva. Si `localStorage` falla, se deja crear: bloquear a un jugador legítimo es peor que dejar pasar a un abusivo.
- **Las salas vencidas se borran solas.** Al crear o entrar a una sala, el celular la apunta en la papelera (`cleanup/days/<día>`) y de vez en cuando barre los días pendientes borrando lo vencido (`assets/js/transport/cleanup.js`, D-39). Nada de esto se le muestra al jugador ni puede voltear una partida: si falla, barre el celular siguiente.
- Con más de dos jugadores, el reparto de roles es una carrera: se escribe el rol con un identificador de dispositivo y se relee para confirmar quién lo obtuvo. Nunca se asume que el primer rol libre que se leyó sigue libre.
- Cuando hay más de dos jugadores, uno es anfitrión (rol A) y abre la partida cuando están todos.
- Quien abre un enlace de sala (`?sala=CÓDIGO`) llega a una pantalla que **solo** deja unirse a esa sala: título propio de invitación, nada de botón para crear otra, el código va fijo y de solo lectura, y los ajustes de la partida no se muestran porque los fija el anfitrión. Ofrecer las dos cosas confunde a quien fue invitado.
- El enlace de la sala se comparte con el diálogo nativo del sistema (`navigator.share`, helper `shareLink` en `ui.js`); copiar al portapapeles es solo el respaldo cuando el navegador no tiene ese diálogo. El diálogo del celular ya incluye copiar, así que no se pierde nada.
- Se muestra cuando el rival se desconecta y se retoma solo cuando vuelve.
- La revancha crea una sala nueva y mueve a los dos jugadores; parte quien perdió.

## C-8 · Interfaz táctil

- Objetivos táctiles de 44 px como mínimo; los controles pequeños llevan área táctil ampliada invisible.
- Las acciones irreversibles se confirman: seleccionar y luego confirmar (por ejemplo elegir casilla y tocar "¡Fuego!").
- **Nada se preselecciona.** La app no elige por el jugador: sin selección explícita, el botón de confirmar va deshabilitado. En una lista que se desplaza, un toque puede irse en scroll y no llegar nunca; si había algo preseleccionado, el jugador termina confirmando lo que no eligió (D-38).
- El botón que confirma **dice sobre qué actúa** ("Colocar aquí · 🔍 Se funda Google"), no solo la acción.
- Nada importante bajo la línea de flotación en un celular de 812 px: los botones de la pantalla final deben verse sin desplazar.
- Si una lista puede crecer sin límite, el botón de confirmar va flotando (`position: sticky; bottom: 0`) con un degradado detrás, nunca al final del contenido.
- Los bloques largos (repaso de la partida, reglas) van colapsados por defecto.
- Sin scroll horizontal. Las grillas y tablas se adaptan al ancho.
- Las etiquetas de una grilla (letras, números) van **dentro** de la misma grilla CSS, como una fila y una columna más; nunca en un contenedor aparte que se alinea "a ojo", porque cada navegador lo estira distinto (pasó en Safari con Batalla Naval).
- Se respeta `prefers-reduced-motion`.
- Un toque fuera de un elemento seleccionado lo deselecciona.
- Se muestra en pantalla lo que el jugador necesita recordar (su número secreto, su flota), tapado si el celular pasa de mano.

## C-8b · Errores del jugador

- Un error se muestra con una señal inconfundible (color, sacudida, sonido propio) y se queda en pantalla hasta que el jugador toca; nunca se cierra solo ni lo pisa la jugada de otro.
- Esa señal es **para quien se equivocó**. A los demás el mismo hecho les llega como noticia, en tercera persona y sin el fondo rojo: “¡Cata se equivocó!”, no “¡Te equivocaste!” (D-36).
- Va acompañado de una explicación corta y concreta de qué estuvo mal, con los datos del juego (por ejemplo, entre qué hitos iba la carta y entre cuáles se puso).
- Un acierto o la jugada de otro puede cerrarse solo tras un par de segundos; un toque lo cierra antes.
- El temporizador que cierra un aviso solo puede cerrar ese aviso, no uno más nuevo.

## C-9 · Transiciones de "pasar el celular"

- En modo un celular, entre turnos siempre hay: **resultado de lo que acaba de pasar** y, debajo, **"Pásale el celular a X"** con un botón. Nunca se salta el resultado.
- Se usa `assets/js/handoff.js` (`showHandoff`, `passBlock`, `showCover`), no una implementación propia.
- Cuando hay un botón de pase, solo el botón avanza: un toque accidental no puede cerrar la pantalla antes de leerla.
- La información secreta se tapa con `showCover` antes de que el siguiente jugador mire.

## C-10 · Anti-trampa

Cuando cada dispositivo guarda un secreto (un número, una flota):

- Al fijarlo se publica `sha256(secreto + sal privada)`; la sal se revela solo al final.
- Al terminar se revelan los secretos y cada dispositivo verifica el hash **y** recalcula todas las respuestas dadas por el rival.
- El resultado se muestra al jugador: "verificado ✅" o "⚠️ no coincide".
- El secreto nunca viaja por la red durante la partida.

## C-11 · Publicación y versionado

- Antes de cada publicación: `python3 tools/set-version.py X.Y.Z`. Estampa `?v=` en los import maps y las hojas de estilo para que el navegador no mezcle archivos viejos y nuevos.
- Los módulos nuevos se agregan a `MODULES` en ese script, o quedarán sin versionar.
- El menú dibuja la lista de juegos **antes** que cualquier adorno, y los adornos van en `try/catch`: un adorno roto no puede dejar la app vacía.
- Cada cambio publicado entra en `CHANGELOG.md` con su versión.
- Se verifica que el sitio publicado sirva la versión nueva antes de darla por lista.

## C-12 · Pruebas

- El motor de cada juego tiene tests que corren con node, sin navegador.
- Antes de publicar se prueba el juego de punta a punta en Chrome headless: partida completa en cada modo, con recarga a mitad de partida y revancha.
- El modo de dos celulares se prueba con dos instancias del navegador, y al menos una vez contra la URL publicada.
- Un cambio en un módulo compartido obliga a repetir la regresión de **todos** los juegos.
- Se revisan capturas reales de cada pantalla, no solo el resultado de los asertos: los problemas de diseño se ven, no se afirman.
- Consola sin errores es parte del criterio de aceptación.

## C-13 · Documentación

Con cada juego o cambio relevante se actualiza:

- `docs/juegos/<id>.md`: reglas, modos, flujo, protocolo de mensajes, archivos.
- `docs/REQUERIMIENTOS.md`: requerimientos con prefijo propio y estado.
- `docs/DECISIONES.md`: una decisión numerada (D-n) por cada elección no obvia, con su porqué y sus consecuencias.
- `README.md`: sección del juego con capturas.
- `CHANGELOG.md`: qué cambió, en qué versión.

## C-14 · Robustez

- Nada de dependencias de npm ni de paso de compilación: el repo publicado se abre y funciona.
- Las bibliotecas externas (QR) se cargan bajo demanda y su falla no rompe la pantalla.
- Cada juego expone un gancho de solo lectura (`window.__<id>`) para las pruebas automatizadas.
- La pantalla no se apaga jugando (`keepAwake()`).
- Los errores previsibles se muestran al jugador en su idioma, con una salida clara; nunca una pantalla en blanco.
- **El mensaje no inventa la causa.** Si desde el navegador no se puede distinguir entre dos causas (quedarse sin señal y toparse con el tope de conexiones se ven igual), el texto las nombra a las dos en vez de elegir una. Precisión falsa es peor que vaguedad honesta (D-40).
- Los errores del transporte se traducen con `errText`/`failWith` de `assets/js/transport/errors.js`, nunca con un mapa propio en cada juego.
- **A la consola solo va lo inesperado.** Un error previsto que ya se le mostró al jugador no se registra: si la consola se llena de fallas normales, "consola sin errores" deja de servir como criterio (C-12).

## C-15 · Chat de sala

Solo en los modos de **varios celulares**: en un celular la gente está mirando la misma pantalla y hablando en voz alta, y en solitario no hay con quién.

- Se usa `assets/js/chat.js` (`createChat`), no una implementación propia. Los textos salen de `LOCALES` del juego (C-3).
- Vive en su propio contenedor (`<div id="chat">`), hermano de `#handoff` y **fuera** de las `.screen`: los re-render de la partida no pueden borrar lo que el jugador está escribiendo.
- Los mensajes viajan por el mismo transporte que las jugadas (`{ t: 'chat', text }`), pero **no son parte del estado**: el reductor los dibuja y no los guarda. Un mensaje de chat no vuelve a dibujar la partida.
- El chat **muere con la sala**, no con la partida: sigue vivo en la pantalla de victoria o derrota, que es donde la conversación se cierra sola (D-35). No se guarda en la memoria de partida (C-6), y la revancha crea una sala nueva y por lo tanto un chat en blanco. Al reconectar se recupera de la sala, sin sonido ni globito de no leídos.
- No aparece sobre las pantallas de veredicto: el chat va por debajo de `#handoff` y se cierra solo cuando llega el turno del jugador (salvo que esté escribiendo).
- Donde esté la burbuja, la pantalla deja aire abajo para que no tape lo que importa: el último intento del tablero o los botones del final (C-8).
- Burbuja flotante con globito de no leídos; sonido discreto y vibración corta al recibir, sujetos al botón de silencio (C-4).
- Un mensaje nuevo se asoma unos segundos al lado de la burbuja, con el nombre de quien escribe: el globito dice *cuántos*, la etiqueta dice *qué*. Se puede tocar para abrir el chat y desaparece sola.
- Límites: 120 caracteres por mensaje, un mensaje cada 1,2 s por celular y los últimos 60 en pantalla. Las reglas de Firebase validan el largo del texto.
- La sala se lee con solo saber el código: el chat no es privado y no se usa para nada sensible.

---

## Lista de chequeo antes de dar por listo un juego

- [ ] Los tres modos funcionan y la partida se puede retomar en **todos** (C-5, C-6).
- [ ] Todo el texto está en español e inglés, sin cadenas sueltas en el código (C-3).
- [ ] Hay sonido y vibración en las acciones clave, con botón de silencio (C-4).
- [ ] Los botones tienen 44 px, los botones finales se ven sin desplazar y no hay scroll horizontal (C-8).
- [ ] En un celular, el resultado se ve antes del pase, y lo secreto va tapado (C-9).
- [ ] Los secretos se comprometen y verifican (C-10).
- [ ] Las fallas de sala se ven en pantalla, en los dos idiomas, y la consola queda limpia (C-14).
- [ ] Tests del motor en verde y partida completa probada en cada modo, con capturas revisadas (C-12).
- [ ] Versión estampada, publicada y comprobada en la URL pública (C-11).
- [ ] Si tiene varios celulares, el chat de sala usa el módulo compartido y muere con la partida (C-15).
- [ ] Registro en el menú, README, especificación, requerimientos, decisiones y changelog (C-2, C-13).
