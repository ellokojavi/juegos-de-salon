# La Copa 🏆

**Ruta:** `/cup/` (id `copa`) · **Jugadores:** 2 a 10 por copa · **Desde:** v0.42 · **Estado:** en el menú (v0.83, D-175) · **Idiomas:** es, en, pt y de (D-170, D-191, D-197)

## Resumen

Un torneo entre amigos que dura una semana: cada día se abre un juego distinto, idéntico
para todos, que se juega **una sola vez** y reparte puntos según la posición del día. Gana
quien suma más al cierre. Es la primera modalidad de la app que no es una partida sino una
serie de partidas en el tiempo (un macro-juego). El diseño completo, con la revisión y el plan
de construcción, se discutió en el documento *La Copa — requisitos del torneo de varios días*.

- **Estado:** en el menú desde v0.83.0 (D-175). **`/labs/`** sigue para probar: la Copa de 3 días, la
  práctica con semilla y las demos (D-101).
- **URL:** `/cup/` (portada) · `/cup/?K7Q2X` (una copa) · `/cup/?labs` (copa real con la Copa
  de 3 días, D-100; `?tres` sigue funcionando) · `?prueba` (almacén local y reloj adelantable, sin
  Firebase) · `/cup/?K7Q2X&dia=3` (abre el día 3 listo para empezar, si se puede jugar; lo usan
  los avisos, D-229) · `/cup/?K7Q2X&silenciar` (silencia los avisos de esa copa: el botón del aviso
  en Android) · `/cup/?practica=<id>&labs&semilla=K7Q2X` (un juego suelto del laboratorio,
  repetible; los que tienen página se van a `/<slug>/?labs&semilla=K7Q2X`, D-164). Desde la portada el juego suelto es `/<slug>/` (D-142, D-149, D-162, D-198): la misma
  pantalla, sin "copa" en el link, que vuelve al menú, sin sesión de prueba ni semilla a la vista, y
  con su señal de uso. `/cup/?practica=<id>` sin `&labs` lleva ahí. `/<slug>/?hoy` (o
  `/cup/suelto/?<id>&hoy` para los que no tienen página) es el juego de Uno al día, con la semilla
  de la fecha del jugador; si hoy toca otro juego, se va a ese (D-230, [UNO-AL-DIA.md](../UNO-AL-DIA.md)).
  Bajo su resultado no va el ranking del juego, solo el de Uno al día (el primer intento igual entra al del juego).
- **Jugadores:** de 2 a 10 por copa (`MIN_JUGADORES` y `MAX_JUGADORES` en `engine.js`, D-118). Con
  el administrador solo, la copa no parte y el tablero pide "al menos un jugador más". **Público:** 🌎 global, 🇨🇱 Chile o 🇧🇷 Brasil, que se elige al crear la copa (D-187, `meta.aud`; las copas `intl` de D-186 se leen como global). Decide qué contenido local entra (`public/cup/games/audiencia.js`).
  **Idioma:** español, inglés, portugués (D-170) y alemán (D-191, para todos desde D-197). La
  pantalla va en el idioma de quien mira; las palabras de Conexiones y Palabra, los mensajes al
  grupo y su link, en el de la copa (`meta.lang`, se elige al crearla).
- **Modalidades:** Copa de 7 días (la que se ofrece) y Copa de 3 días (solo pruebas).
- **Calendario:** lo arma el admin al crear la copa (D-163): qué juegos entran y en qué orden,
  a partir de una propuesta al azar. La final va siempre el último día y no cambia.

### Pendiente (después de la v1)

Recordatorios `.ics` (LIG-29), verificación cruzada de puntajes (LIG-30), papelera de copas
viejas (LIG-31), avisos automáticos (LIG-33: al celular, abiertos a todos desde D-228) y juegos de reserva (LIG-84). Ya no están
pendientes: inglés y portugués con contenido propio (LIG-32, hecho en D-170) y las copas en el
panel del dueño (D-137).

## Reglas

| Regla | Detalle |
|---|---|
| Días | El día 1 parte a las 00:00 del día de inicio, en la zona de la copa (`meta.tz`: hora del Pacífico en las nuevas, D-113; hora de Chile en las anteriores). Cada día termina a las 23:59. |
| Día de gracia | Un día se puede jugar ese día o el siguiente, con puntaje completo. La final no tiene gracia: la copa cierra a las 23:59 del último día, y ahí vence también la gracia del penúltimo. |
| Un intento | "Cómo se juega" no cuenta. El intento empieza al tocar **Empezar**; recargar retoma el mismo intento (C-6). |
| Puntos del día | Por posición entre quienes jugaron: 10-8-6-5-4-3-2-1-1-1. Manda el puntaje del juego; a igual puntaje, el menor **tiempo activo** (D-95). Empate total: comparten la mejor posición. |
| Comodín ×2 | Uno por jugador y copa. Se activa antes de Empezar (el servidor lo rechaza después). No vale en la final. |
| Final ×2 | El último día vale doble para todos. |
| Resultados ocultos | Los puntajes de un día se ven después de jugarlo o cuando cierra. La tabla y el gráfico tampoco lo delatan: suman solo los días que ya puedes ver. |
| Nombre | El admin lo puede cambiar hasta que la copa termina; el link sigue igual (D-148). |
| Terminar antes | El admin puede terminar la copa en cualquier momento desde que parte. Nadie más juega, la tabla de ese momento queda como la final y los días que no alcanzaron a abrirse no se juegan ni suman (D-161). |
| Inscripción | Abierta hasta que empieza la final, salvo que el administrador la cierre o la copa llegue a 10 (quien llega lee por qué no puede entrar: terminó, cerrada, cerrada por el administrador o llena). Los días que ya cerraron quedan con 0; el aviso sale desde el día 3, porque el día 2 el día 1 sigue en su día de gracia (D-177). |
| Tabla | Suma de puntos. Desempata quien ganó más días y después quien quedó mejor en la final; si el 1.° y el 2.° empatan en puntos, el podio y el resumen dicen cuál de los dos criterios decidió (dilema #79). Es **provisoria** mientras el último día que muestra sigue abierto y alguien no lo ha jugado (D-147). |
| Medallas | Campeón, más días ganados, la remontada (más puestos subidos desde la mitad) y "al descenso" (el último). |

### Cuenta: nombre y PIN

No hay cuentas de la app: una persona es un `pid` de 6 caracteres dentro de una copa, con nombre
y PIN de 4 dígitos (D-96). El celular entra con acceso anónimo de Firebase Auth; para escribir por
un jugador, su `uid` tiene que estar "sentado" como ese `pid`, y las reglas solo aceptan el asiento
si trae el mismo `sha256("copa:código:pid:PIN")` que se guardó al inscribirse, en una rama que
nadie puede leer.

**Con los rankings (D-212).** Si en el celular hay un jugador de los rankings (nombre y PIN para
toda la app), al inscribirse el nombre viene puesto, y al abrir la copa su jugador queda enlazado
en `players/<pid>/j`. Con eso: los de la copa que también lo están pasan a ser sus **amigos** en
los rankings; cada día jugado cuenta para la pestaña **Copa** del ranking de ese juego; y cuando la
copa termina, el primero que la abre guarda su podio en `torneoPodios/<código>`, del que sale el
medallero de **Campeones de La Copa** al final de la portada. El PIN de la copa sigue siendo aparte.
Las copas del laboratorio no cuentan.

### Admin

Quien crea la copa también juega. Puede renombrar, sacar (y volver a meter) y ponerle PIN nuevo a
un jugador, y compartir cuatro mensajes armados con el diálogo del celular (D-99): invitación,
**recordatorio del día** (sirve cualquier día: antes de empezar, con el día de gracia y con quién
falta), tabla parcial y resumen final. La **invitación** sigue en Administrar mientras alguien
nuevo pueda entrar —inscripción abierta y menos de 10 jugadores—, no solo antes de partir; ya
partida dice "📅 Ya partió: va en el día 3 de 7 y todavía puedes entrar." y, desde el día 3, que
los días cerrados quedan en 0 (D-176, D-177). El botón "Invitar al grupo" del tablero sigue solo
antes de partir.

**Terminar la copa antes** (D-161): desde que parte, el admin puede cerrarla en ese momento, por
ejemplo si el último no va a jugar la final. Antes de confirmar ve quiénes todavía no juegan el día
de hoy (y el de gracia) y si quedan días que no se van a jugar. No se puede deshacer.

**Tabla final** (D-161): terminada la copa, sola o por el admin, Administrar ofrece la imagen de la
tabla con las posiciones día a día y una planilla CSV (`planilla.js`) para Excel o Google Sheets,
con la tabla final, el lugar de cada uno después de cada día y el detalle de cada día.

## Juegos

Todo el contenido de un día sale de una semilla `código:día:sal` (D-97): es idéntico para todos
sin que nada viaje por la red.

Todos los juegos puntúan **de 0 a 100** (D-113). Igual lo que decide la copa es el lugar de cada día.

| Día | Juego | Puntaje (0 a 100) | Reusa |
|---|---|---|---|
| 1 | ⏳ Línea Relámpago: 10 hitos, 9 en la mano en cualquier orden | 100 × aciertos / 9 | la mano, las ranuras, el arrastre y el veredicto de Línea de Tiempo |
| 2 | 🔢 Toque y Fama: adivina el número. 4 cifras, 10 intentos | 100 − 10 × (intentos − 1), 0 si no | el teclado con notas, el tablero y las pistas de Toque y Fama |
| 3 | 🔗 Conexiones: 16 palabras, 4 grupos, 4 errores | 25 × grupo − 5 × error | 12 grillas por significado, con distractores (`public/cup/games/connections/grillas.js` y sus versiones por idioma, D-128) |
| 4 | 👑 Reinas: una por fila, columna y zona, sin tocarse | por tiempo: 100 hasta 30 s, 10 a los 5 min (D-107) | nuevo (Queens de LinkedIn) |
| 5 | 🔤 Toque y Fama: Palabra. 5 letras, 8 intentos | 10 × letra encontrada en su lugar (una vez por lugar) + si la saca 50 − 5 × (intentos − 1) (D-108) | lo mismo que el día 2, con letras |
| 6 | 📅 ¿En qué año?: 6 hitos | promedio de los hitos (100 cada uno, baja con la distancia) | mazos de Línea de Tiempo y teclado de Toque y Fama |
| 7 | 🏁 La Gran Final: 5 rondas cortas | promedio de las rondas (0 a 100 cada una) | los cinco motores |

Recién creada, la copa abre en **Administrar** con una guía para invitar (D-110). Ahí el admin
comparte los mensajes, **cierra o reabre la inscripción** y **mueve el inicio a hoy o mañana**
mientras nadie haya jugado. En el laboratorio, `?prueba&demo=<escena>` abre una copa de ejemplo
en cualquier punto (`public/cup/demo.js`).

Al tocar Empezar, una **cuenta de 3 a 1** y "¡A jugar!" (D-105): recién ahí aparece el tablero y
parte el reloj. Al terminar, el resultado explica **cómo se calculó el puntaje** línea por línea
(`public/cup/desglose.js`, D-106), y abajo va la tabla del día. En la de 🏁 La Gran Final, cada
jugador lleva además su tarjeta de cinco rondas (⏳75 🔢85 👑100 🔤60 📅90), para comparar ronda a
ronda (#259); en la demo `podio` o `llena` se ve con datos.

Antes de Empezar cada día se puede jugar una **sesión de prueba** (D-103): la misma mecánica con
otro contenido (código derivado con `codigoEnsayo`, otra temática, una grilla fuera del sorteo,
tableros más chicos), que no se guarda ni cuenta. La antesala lo dice bajo el botón de la prueba,
y las reglas plegadas de la prueba lo repiten: "La prueba es más corta que el juego de verdad y no
cuenta para la copa" (`trialNote`, D-177).

Al crear la copa, apenas se elige la duración aparece **¿Qué se juega cada día?** con una propuesta
al azar (`calendarioAlAzar`): juegos distintos del pozo (`POZO` en `engine.js`: los seis de siempre
más Zip, Tango, ¿Dónde queda? y Desenredo), sin dos días seguidos de la misma habilidad. Es la mano y la línea
de Línea de Tiempo con su arrastre: un día se arrastra a otro lugar de la semana (en un celular,
por su agarre ⠿) y un juego de la mano, hasta el día que reemplaza; tocando se llega a lo mismo
(el juego y después la ranura o el día). 🎲 propone otro orden. La final queda fija al último. El calendario se guarda en
`meta.cal` y `nuevaMeta` rechaza uno que no se puede jugar (`calendarioValido`). Sin elección
(las demos) se usa el de siempre, `CALENDARIOS`: Línea, Toque y Fama, Conexiones, Reinas, Palabra,
Año y la final; o Línea, Conexiones y la final en la de 3 días (D-163).

Los tres juegos más nuevos del pozo son **〰️ Zip** (un solo trazo por todas las casillas, pasando por los números en orden; por niveles: diez, de 4 × 4 a 7 × 7, en tres minutos; con los diez son 100 y la partida termina ahí, y entre quienes los resuelven todos gana quien terminó antes, D-250) y **☀️ Tango**
(soles y lunas, mitad y mitad por línea, nunca tres seguidos, con marcas = y ×), y **📍 ¿Dónde
queda?** (cinco ciudades con su país, un alfiler en un globo sin nombres que se gira sin fin y,
con dos dedos, también en torno a la pantalla, con una brújula que endereza el norte; 100 puntos
por ciudad menos 4 cada 100 km, D-155, D-156, D-200).

- **¿Dónde queda?** saca sus ciudades de `games/where/ciudades.js` (las 195 capitales, ciudades famosas y de
  segunda línea, 529 en total, con nivel y código ISO; D-157) y su mapa de `games/where/mapa.js`, que genera `node tools/generators/mapa.mjs generar`; `revisar`
  comprueba que cada ciudad cae dentro de su país. La vista del globo (ortográfica) y su inversa
  están en el motor, `games/where/engine.js`; `games/where/globo.js` lo dibuja en un canvas con la imagen satelital
  (Blue Marble de la NASA, con WebGL; D-159), y la distancia se mide sobre la esfera. Mientras la
  imagen baja el globo no se dibuja y aparece con un fundido al llegar (D-245); sin WebGL, o si la
  imagen no llega, se dibuja con el mapa vectorial, recortando cada país en el borde. La antesala muestra el globo girando solo
  (`portada()` de `games/where/ui.js`).

- **🧶 Desenredo** (D-179; fuera del laboratorio desde D-190) es el Untangle de Simon Tatham: nudos unidos por
  hilos que se cruzan, y se arrastran los nudos hasta que ningún hilo cruce a otro. Por niveles
  como Zip: diez, de 6 a 15 nudos, y cuatro minutos; 10 puntos por nivel y el desempate es cuándo
  se resolvió el último. El motor (`games/untangle/engine.js`) arma primero un dibujo sin cruces (nudos al
  azar bien repartidos y hilos de los pares más cercanos a los más lejanos, hasta 4 por nudo) y
  después reparte los nudos en un círculo en desorden: siempre tiene solución, pero no una sola.
  Todo en enteros sobre 1000 × 1000; un hilo que pasa a menos de 24 unidades de un nudo ajeno
  cuenta como cruce, lo que además cierra la trampa de amontonar los nudos. Los hilos se dibujan como cuerdas con una curva leve y una segunda onda de torsión, sutil (D-182, D-183, D-185), pero
  los cruces se cuentan sobre la recta. **🔄 Reiniciar nivel**, bajo el tablero, devuelve los nudos a
  donde partió el nivel: como Borrar todo en Zip y Reinas, el primer toque lo arma, el segundo lo hace
  y el reloj sigue; está apagado mientras no se haya movido nada. Su habilidad es
  `espacial`, propia, para que el sorteo del calendario la pueda separar de Reinas, Zip y Tango.

- **🔍 El caso** (D-257, en el laboratorio): un misterio de deducción al estilo de *Clues by Sam*, el
  mismo del prototipo de `/labs/case/` (D-256). Veinte sospechosos en una grilla de 4 × 5, inocentes
  o criminales; cada uno que se marca bien da su pista, y las pistas siempre dicen la verdad. Nunca
  hay que adivinar: el motor (`games/case/engine.js`) simula al jugador y arma las pistas para que en
  todo momento alguien más se pueda deducir, y marcar antes de tiempo no se acepta ni cuenta (no se
  guarda como jugada). **100 puntos con el caso resuelto, menos 10 por error, hasta 10**; sin
  resolver, 0. Las pistas son datos (`{ t, a, b, k, g, h }`) y la frase la arma `texto()` en el
  idioma de quien juega, con las plantillas de `casoTexto` en `rules.js`: el caso es el mismo en los
  cuatro idiomas. La antesala muestra cartas de espaldas que se dan vuelta solas mientras una lupa
  las recorre (`portada()` de `games/case/ui.js`). Se juega suelto en `/case/` y en la práctica del
  laboratorio, pero **todavía no está en `POZO`**: una copa no lo elige hasta que salga del
  laboratorio. Su habilidad es `deducción`, propia.
- **Línea y Año** usan temáticas distintas dentro de la misma copa (`temasDeLaCopa`), para que no
  sean dos días de lo mismo.
- **Reinas, Zip y Tango** tienen solución única garantizada. Reinas ajusta las zonas de a una
  casilla hasta que el resolvedor encuentra una sola solución; Tango suma pistas hasta que es única
  y después saca las que sobran; Zip suma números sobre un camino al azar y después saca los que
  sobran (quedan 7 a 12 en 6 × 6).
- **Tango** no cuenta como error pasar por el sol para llegar a la luna: solo dejar la casilla
  rompiendo una regla (D-102). La pantalla dice lo mismo: el choque se pinta en rojo recién cuando
  el jugador toca otra casilla, nunca por tiempo; con el tablero lleno se muestra sin contarse,
  para que se vea qué arreglar (#135). La casilla con sol es ámbar y la de luna azul noche, con la luna
  plateada: los dos emojis son amarillos y así no se confunden (D-146). Las dadas llevan su color más
  vivo (el sol, además, el borde entero) y un candado chico (#61).
- **Toque y Fama: Palabra** acepta cualquier combinación de 5 letras distintas como intento, sin
  diccionario, igual que Toque y Fama acepta cualquier número de cifras distintas. La palabra
  secreta sale de la lista del idioma de la copa (`games/word/palabras.js`: 120 en español, 185 en
  inglés, 143 en portugués y 162 en alemán). El teclado es QWERTY con Ñ en español; en inglés y
  portugués deja un hueco donde iría la Ñ, y en alemán es QWERTZ con el mismo hueco, así la tercera
  fila empieza en su letra (`alfabeto(lang)` en `games/word/engine.js`, D-170, D-191).
  Cada letra se pinta verde si está en su lugar (fama) y amarilla si está en otro (toque), como en
  Wordle; la tarjeta usa 🟩 y 🟨 (#196).
- **¿En qué año?** tiene un margen que crece con la antigüedad: `max(8, (2026 − año) / 4)` años.
- Las copas creadas antes de D-102 con el Solitario o Dudo en el calendario juegan Reinas y Toque y
  Fama: Palabra en esos días.

## Modos

Una copa no tiene los modos de C-5: es un torneo de varios días en que cada jugador juega solo,
en su celular, el juego del día, y lo que se comparte es la tabla. Los juegos de la copa se juegan
además **sueltos**, de un jugador y sin copa, desde la portada (`/<slug>/`, D-142, D-198).

### Laboratorio, práctica y reportes

`/labs/` (D-101) ofrece la práctica de cada juego, la copa simulada y la copa real. La práctica
arma el contenido con una semilla al azar como si fuera el día 1 de una copa con ese código, y la
muestra al final. El botón **🐞 Reportar un problema o dejar un comentario** (práctica, tablero y
resultado) guarda en `feedback/<id>`, por REST y sin cuenta (D-104), el texto, un nombre opcional, la versión
y un contexto en JSON: copa, jugador, pantalla, día, juego, semilla, URL y navegador. Se leen con
`node tools/firebase/reportes.mjs`; en `?prueba` queda en `localStorage` (`juegos-de-salon:copa:prueba:reportes`).

### Avisos al celular (D-223, D-224, D-225, D-227, D-228)

Abiertos a todos desde D-228: se ven en cualquier celular que pueda recibirlos, siempre que
`public/assets/js/vapid.js` tenga la clave (la tiene desde D-225). `AVISOS_EN_LABS = true` en
`push.js` los vuelve a cerrar en el laboratorio. El diseño y lo que falta están en
[PWA-NOTIFICACIONES.md](../PWA-NOTIFICACIONES.md).

- **La campana** va junto a Invitar y Administrar en el tablero, hasta que la copa termina:
  **Activar avisos**, **Avisos activos** (abre los ajustes: los dos avisos, "Probar los avisos" y
  "Silenciar esta copa") o **Avisos bloqueados** (cómo desbloquearlos). Si el celular no puede
  recibir avisos, no aparece.
- **La tarjeta** que los ofrece sale una vez por copa: en el tablero antes de que parta, en el
  resultado de un día si queda otro, o al abrir la copa desde la app instalada. "Ahora no" la
  apaga en esa copa.
- El permiso del sistema se pide solo después de tocar **Avisarme**. Al activar, el celular se manda
  un aviso de confirmación. Si ya activó avisos en otra copa, la nueva los trae puestos ("Te
  avisaremos de esta copa", con "Cambiar").
- **iPhone:** en Safari, la campana abre los pasos para agregar la app a inicio y deja `&app=<pid>`
  en la dirección (nunca el PIN); la app instalada abre en "Ya estoy inscrito" con ese nombre
  elegido, si iOS la respetara. No la respeta: la app instalada abre en la portada, así que los
  pasos dan el código de la copa (D-227). Dentro de WhatsApp o Instagram, pide abrir el link en Safari.
- **Lo que llega** (D-224): `.github/workflows/avisos.yml` corre `tools/push/avisar.mjs` cada 15
  minutos, y `tools/push/calendario.mjs` decide con `engine.js` qué toca, en la hora y el idioma
  del celular y nunca entre las 22:00 y las 8:00: **se abrió el día** (desde las 9:00, si no lo ha
  jugado ni empezado), **se te acaba el plazo** (4 horas antes del cierre, o desde las 20:00 si
  cierra de noche), **La Gran Final** (con su lugar en la tabla), **terminó la copa** y, al admin
  que activó avisos, **quién se inscribió**. A lo más uno por copa y celular en cada vuelta, y dos
  por copa en un día (D-229). Los textos son los `avMsg*` de `rules.js`. Al tocarlo abre ese día
  (`&dia=<d>`) o, el del cierre, el podio; en Android trae **Jugar** y **Silenciar esta copa**
  (`&silenciar`). Los días nuevos de varias copas van juntos en un aviso, y un empate arriba nombra
  a todos los que ganaron (D-229). Cada dirección lleva `&aviso=<tipo>`, que la página cuenta al
  abrirse y saca de la dirección; el panel muestra mandados y tocados por tipo (D-233).

## Flujo

`intro` (portada: crear, tus copas —las de este celular y, con jugador, las suyas de otros
celulares, D-220; las terminadas con su etiqueta y escondidas tras "Mostrar copas terminadas", D-234—,
tengo un código) → `crear` → `entrar` (invitación: Soy nuevo
/ Ya estoy inscrito) → `tablero` → `jugar` (primero Cómo se juega y el comodín) → `resultado` →
`admin`. En el tablero van **tus días** (los pasados con su resultado y deshabilitados, el de hoy
como tarjeta grande, el de ayer habilitado mientras dure su gracia, los que vienen deshabilitados),
la **tabla** y el **gráfico de tu posición día a día**. Al terminar, el **podio**.

## Protocolo de mensajes

No tiene: no hay sala ni mensajes entre celulares. Cada celular escribe su resultado en Firebase bajo reglas que imponen las ventanas y una sola escritura, y el contenido del día sale de la semilla (D-97).

### Datos (Firebase)

```
torneos/<código>/meta               nombre, días, calendario (cal), ventanas, admin, joinUntil, final, idioma (lang), público (aud), zona (tz)
torneos/<código>/players/<pid>      { name, at, out?, co?, j? }   co: país, al inscribirse o al volver a abrir (D-207, D-209); j: su jugador de los rankings (D-212)
torneos/<código>/started/<d>/<pid>  hora del servidor al tocar Empezar
torneos/<código>/results/<d>/<pid>  { s, ms, t, r, at }
torneos/<código>/wild/<pid>         "3" (el día del comodín, como texto)
torneos/<código>/fin                hora del servidor en que el admin la terminó antes (D-161)
torneoKeys/<código>/<pid>           hash del PIN (ilegible)
torneoSeats/<código>/<pid>/<uid>    el mismo hash: el celular uid puede escribir por pid (ilegible)
pushCopa/<código>/<pid>/<subId>     { dia, plazo, at }: qué avisos quiere ese celular (ilegible, D-223); la suscripción va en push/<subId>
pushEnviados/<código>/<subId>/<clave>  hora en que se entregó ese aviso (dia:3, plazo:3, final, fin, insc:<pid>); solo la toca avisar.mjs (D-224)
```

Las reglas imponen: escribir una sola vez, las ventanas de cada día con la hora del servidor, el
comodín antes de Empezar y fuera de la final, la inscripción antes de la final y que solo el admin
renombre, saque o cambie PINes. El árbol no se llama `copas` porque las reglas no pueden nombrar
juegos (C-16, `public/panel/adapta.test.mjs`).

## Archivos

Todo bajo `public/cup/`:

| Archivo | Qué hace |
|---|---|
| `engine.js` | Calendario, ventanas con zona horaria, puntos, tabla, evolución, medallas, reloj activo |
| `games/<carpeta>/engine.js` | Motor puro de cada juego (`case`, `connections`, `final`, `number`, `queens`, `tango`, `timeline`, `untangle`, `where`, `word`, `year`, `zip`), con sus datos propios al lado |
| `games/<carpeta>/ui.js` | La pantalla de cada juego |
| `games/index.js` · `games/semilla.js` · `games/mazos.js` · `games/audiencia.js` · `games/solo.js` | Lo común a los juegos: el registro, la semilla, los mazos, el público y el modo suelto con su récord |
| `store-firebase.js` · `store-local.js` | El mismo almacén contra Firebase o contra localStorage (`?prueba`) |
| `cuenta.js` | Con quién está sentado este celular, el intento a medio jugar, los avisos de cada copa (D-223) y "Tus copas" (las del celular más las del jugador, `juntarCopas`, D-220) |
| `avisos.js` | Los avisos al celular en pantalla: la campana, la tarjeta y sus hojas (D-223; la lógica del navegador está en `assets/js/push.js`). El estilo de la hoja de abajo (`.hoja`) es de todo el sitio y vive en `assets/css/base.css` (D-232); `style.css` guarda solo lo propio de los avisos |
| `desglose.js` | Cómo se calculó el puntaje, línea por línea (D-106) |
| `demo.js` | Las escenas de ejemplo del laboratorio |
| `reportes.js` | El botón 🐞 y los reportes que esperan reenvío |
| `planilla.js` | La tabla final como CSV (D-161) |
| `rules.js` | Textos (`LOCALES` es, en, pt, de, también los de los avisos al celular, `avMsg*`) y la explicación de cada juego |
| `game.js` | Pantallas |
| `suelto/index.html` | La página de un juego suelto (`/<slug>/`), de la que `og.mjs tarjetas` genera las demás |

Gancho de pruebas (C-14): `window.__copa`, en `game.js` (LIG-27).

### Pruebas

```bash
node public/cup/engine.test.mjs
node public/cup/games/juegos.test.mjs
node public/cup/store.test.mjs
node public/cup/planilla.test.mjs
node public/cup/reportes.test.mjs
node tools/e2e/cup/torneo.mjs /tmp/copa            # Copa de 3 días, tres jugadores
node tools/e2e/cup/torneo.mjs /tmp/copa --siete    # los siete juegos
node tools/e2e/cup/avisos.mjs /tmp/avisos          # los avisos al celular, con un servicio falso (D-223)
node tools/push/calendario.test.mjs                # qué aviso toca y cuándo, con relojes inventados (D-224)
node tools/push/avisar.test.mjs                    # una vuelta del envío, con una base falsa
node tools/push/webpush.test.mjs                   # el cifrado y la firma, contra el ejemplo del RFC 8291
```

## Excepciones a los cánones

- **C-5 no aplica:** la copa no es una partida de dos con tres modos (ver “Modos”).
- **C-10 no aplica como secreto por celular:** el contenido del día es el mismo para todos y sale de
  la semilla; la protección contra trampas está en las reglas de Firebase (ventanas con la hora del
  servidor, una sola escritura, el asiento con el hash del PIN, D-96). La verificación cruzada de
  puntajes sigue pendiente (LIG-30).
