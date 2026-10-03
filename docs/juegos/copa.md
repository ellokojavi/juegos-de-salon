# La Copa 🏆

**Estado:** en el menú (v0.83, D-175) · **Ruta:** `/copa/`

Un torneo entre amigos que dura una semana: cada día se abre un minijuego distinto, idéntico
para todos, que se juega **una sola vez** y reparte puntos según la posición del día. Gana
quien suma más al cierre. Es la primera modalidad de la app que no es una partida sino una
serie de partidas en el tiempo (un macro-juego). El diseño completo, con la revisión y el plan
de construcción, se discutió en el documento *La Copa — requisitos del torneo de varios días*.

- **Estado:** en el menú desde D-175. **`/labs/`** sigue para probar: la Copa de 3 días, la
  práctica con semilla y las demos (D-101).
- **URL:** `/copa/` (portada) · `/copa/?K7Q2X` (una copa) · `/copa/?labs` (copa real con la Copa
  de 3 días, D-100; `?tres` sigue funcionando) · `?prueba` (almacén local y reloj adelantable, sin
  Firebase) · `/copa/?practica=<id>&labs&semilla=K7Q2X` (un minijuego suelto del laboratorio,
  repetible; los que tienen página se van a `/minijuegos/<id>/?labs&semilla=K7Q2X`, D-164). Desde la portada el minijuego suelto es `/minijuegos/<id>/` (D-142, D-149, D-162): la misma
  pantalla, sin "copa" en el link, que vuelve al menú, sin sesión de prueba ni semilla a la vista, y
  con su señal de uso. `/copa/?practica=<id>` sin `&labs` lleva ahí.
- **Jugadores:** de 2 a 10 por copa (`MIN_JUGADORES` y `MAX_JUGADORES` en `engine.js`, D-118). Con
  el administrador solo, la copa no parte y el tablero pide "al menos un jugador más". **Público:** 🌎 global, 🇨🇱 Chile o 🇧🇷 Brasil, que se elige al crear la copa (D-187, `meta.aud`; las copas `intl` de D-186 se leen como global). Decide qué contenido local entra (`copa/juegos/audiencia.js`).
  **Idioma:** español, inglés y portugués (D-170); el alemán, solo en el laboratorio (D-191). La
  pantalla va en el idioma de quien mira; las palabras de Conexiones y Palabra, los mensajes al
  grupo y su link, en el de la copa (`meta.lang`, se elige al crearla).
- **Modalidades:** Copa de 7 días (la que se ofrece) y Copa de 3 días (solo pruebas).
- **Calendario:** lo arma el admin al crear la copa (D-163): qué juegos entran y en qué orden,
  a partir de una propuesta al azar. La final va siempre el último día y no cambia.

## Reglas del torneo

| Regla | Detalle |
|---|---|
| Días | El día 1 parte a las 00:00 del día de inicio, en la zona de la copa (`meta.tz`: hora del Pacífico en las nuevas, D-113; hora de Chile en las anteriores). Cada día termina a las 23:59. |
| Día de gracia | Un día se puede jugar ese día o el siguiente, con puntaje completo. La final no tiene gracia: la copa cierra a las 23:59 del último día, y ahí vence también la gracia del penúltimo. |
| Un intento | "Cómo se juega" no cuenta. El intento empieza al tocar **Empezar**; recargar retoma el mismo intento (C-6). |
| Puntos del día | Por posición entre quienes jugaron: 10-8-6-5-4-3-2-1-1-1. Manda el puntaje del minijuego; a igual puntaje, el menor **tiempo activo** (D-95). Empate total: comparten la mejor posición. |
| Comodín ×2 | Uno por jugador y copa. Se activa antes de Empezar (el servidor lo rechaza después). No vale en la final. |
| Final ×2 | El último día vale doble para todos. |
| Resultados ocultos | Los puntajes de un día se ven después de jugarlo o cuando cierra. La tabla y el gráfico tampoco lo delatan: suman solo los días que ya puedes ver. |
| Nombre | El admin lo puede cambiar hasta que la copa termina; el link sigue igual (D-148). |
| Terminar antes | El admin puede terminar la copa en cualquier momento desde que parte. Nadie más juega, la tabla de ese momento queda como la final y los días que no alcanzaron a abrirse no se juegan ni suman (D-161). |
| Inscripción | Abierta hasta que empieza la final, salvo que el administrador la cierre o la copa llegue a 10 (quien llega lee por qué no puede entrar: terminó, cerrada, cerrada por el administrador o llena). Los días que ya cerraron quedan con 0; el aviso sale desde el día 3, porque el día 2 el día 1 sigue en su día de gracia (D-177). |
| Tabla | Suma de puntos. Desempata quien ganó más días y después quien quedó mejor en la final; si el 1.° y el 2.° empatan en puntos, el podio y el resumen dicen cuál de los dos criterios decidió (dilema #79). Es **provisoria** mientras el último día que muestra sigue abierto y alguien no lo ha jugado (D-147). |
| Medallas | Campeón, más días ganados, la remontada (más puestos subidos desde la mitad) y "al descenso" (el último). |

## Los minijuegos

Todo el contenido de un día sale de una semilla `código:día:sal` (D-97): es idéntico para todos
sin que nada viaje por la red.

Todos los minijuegos puntúan **de 0 a 100** (D-113). Igual lo que decide la copa es el lugar de cada día.

| Día | Minijuego | Puntaje (0 a 100) | Reusa |
|---|---|---|---|
| 1 | ⏳ Línea Relámpago: 10 hitos, 9 en la mano en cualquier orden | 100 × aciertos / 9 | la mano, las ranuras, el arrastre y el veredicto de Línea de Tiempo |
| 2 | 🔢 Toque y Fama: adivina el número. 4 cifras, 10 intentos | 100 − 10 × (intentos − 1), 0 si no | el teclado con notas, el tablero y las pistas de Toque y Fama |
| 3 | 🔗 Conexiones: 16 palabras, 4 grupos, 4 errores | 25 × grupo − 5 × error | 12 grillas por significado, con distractores (`juegos/grillas.js`, D-128) |
| 4 | 👑 Reinas: una por fila, columna y zona, sin tocarse | por tiempo: 100 hasta 30 s, 10 a los 5 min (D-107) | nuevo (Queens de LinkedIn) |
| 5 | 🔤 Toque y Fama: Palabra. 5 letras, 8 intentos | 10 × letra encontrada en su lugar (una vez por lugar) + si la saca 50 − 5 × (intentos − 1) (D-108) | lo mismo que el día 2, con letras |
| 6 | 📅 ¿En qué año?: 6 hitos | promedio de los hitos (100 cada uno, baja con la distancia) | mazos de Línea de Tiempo y teclado de Toque y Fama |
| 7 | 🏁 La Gran Final: 5 rondas cortas | promedio de las rondas (0 a 100 cada una) | los cinco motores |

Recién creada, la copa abre en **Administrar** con una guía para invitar (D-110). Ahí el admin
comparte los mensajes, **cierra o reabre la inscripción** y **mueve el inicio a hoy o mañana**
mientras nadie haya jugado. En el laboratorio, `?prueba&demo=<escena>` abre una copa de ejemplo
en cualquier punto (`copa/demo.js`).

Al tocar Empezar, una **cuenta de 3 a 1** y "¡A jugar!" (D-105): recién ahí aparece el tablero y
parte el reloj. Al terminar, el resultado explica **cómo se calculó el puntaje** línea por línea
(`copa/desglose.js`, D-106).

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

Los tres juegos más nuevos del pozo son **〰️ Zip** (un solo trazo por todas las casillas, pasando por los números en orden; por niveles, tres minutos para resolver la mayor cantidad) y **☀️ Tango**
(soles y lunas, mitad y mitad por línea, nunca tres seguidos, con marcas = y ×), y **📍 ¿Dónde
queda?** (cinco ciudades con su país, un alfiler en un globo sin nombres que se gira sin fin; 100
puntos por ciudad menos 4 cada 100 km, D-155, D-156).

- **¿Dónde queda?** saca sus ciudades de `ciudades.js` (las 195 capitales, ciudades famosas y de
  segunda línea, 529 en total, con nivel y código ISO; D-157) y su mapa de `mapa.js`, que genera `node tools/mapa.mjs generar`; `revisar`
  comprueba que cada ciudad cae dentro de su país. La vista del globo (ortográfica) y su inversa
  están en el motor, `donde.js`; `globo.js` lo dibuja en un canvas, recortando cada país en el
  borde, y la distancia se mide sobre la esfera. La antesala muestra el globo girando solo
  (`portada()` de `ui-donde.js`).

- **🧶 Desenredo** (D-179; fuera del laboratorio desde D-190) es el Untangle de Simon Tatham: nudos unidos por
  hilos que se cruzan, y se arrastran los nudos hasta que ningún hilo cruce a otro. Por niveles
  como Zip: diez, de 6 a 15 nudos, y cuatro minutos; 10 puntos por nivel y el desempate es cuándo
  se resolvió el último. El motor (`desenredo.js`) arma primero un dibujo sin cruces (nudos al
  azar bien repartidos y hilos de los pares más cercanos a los más lejanos, hasta 4 por nudo) y
  después reparte los nudos en un círculo en desorden: siempre tiene solución, pero no una sola.
  Todo en enteros sobre 1000 × 1000; un hilo que pasa a menos de 24 unidades de un nudo ajeno
  cuenta como cruce, lo que además cierra la trampa de amontonar los nudos. Los hilos se dibujan como cuerdas con una curva leve y una segunda onda de torsión, sutil (D-182, D-183, D-185), pero
  los cruces se cuentan sobre la recta. Su habilidad es
  `espacial`, propia, para que el sorteo del calendario la pueda separar de Reinas, Zip y Tango.

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
  secreta sale de la lista del idioma de la copa (`juegos/palabras.js`: 120 en español, 185 en
  inglés, 143 en portugués y 162 en alemán). El teclado es QWERTY con Ñ en español; en inglés y
  portugués deja un hueco donde iría la Ñ, y en alemán es QWERTZ con el mismo hueco, así la tercera
  fila empieza en su letra (`alfabeto(lang)` en `letras.js`, D-170, D-191).
- **¿En qué año?** tiene un margen que crece con la antigüedad: `max(8, (2026 − año) / 4)` años.
- Las copas creadas antes de D-102 con el Solitario o Dudo en el calendario juegan Reinas y Toque y
  Fama: Palabra en esos días.

## Flujo y pantallas

`intro` (portada: crear, tus copas, tengo un código) → `crear` → `entrar` (invitación: Soy nuevo
/ Ya estoy inscrito) → `tablero` → `jugar` (primero Cómo se juega y el comodín) → `resultado` →
`admin`. En el tablero van **tus días** (los pasados con su resultado y deshabilitados, el de hoy
como tarjeta grande, el de ayer habilitado mientras dure su gracia, los que vienen deshabilitados),
la **tabla** y el **gráfico de tu posición día a día**. Al terminar, el **podio**.

## Cuenta: nombre y PIN

No hay cuentas de la app: una persona es un `pid` de 6 caracteres dentro de una copa, con nombre
y PIN de 4 dígitos (D-96). El celular entra con acceso anónimo de Firebase Auth; para escribir por
un jugador, su `uid` tiene que estar "sentado" como ese `pid`, y las reglas solo aceptan el asiento
si trae el mismo `sha256("copa:código:pid:PIN")` que se guardó al inscribirse, en una rama que
nadie puede leer.

## Datos (Firebase)

```
torneos/<código>/meta               nombre, días, calendario, ventanas, admin, joinUntil, final
torneos/<código>/players/<pid>      { name, at, out? }
torneos/<código>/started/<d>/<pid>  hora del servidor al tocar Empezar
torneos/<código>/results/<d>/<pid>  { s, ms, t, r, at }
torneos/<código>/wild/<pid>         "3" (el día del comodín, como texto)
torneos/<código>/fin                hora del servidor en que el admin la terminó antes (D-161)
torneoKeys/<código>/<pid>           hash del PIN (ilegible)
torneoSeats/<código>/<pid>/<uid>    el mismo hash: el celular uid puede escribir por pid (ilegible)
```

Las reglas imponen: escribir una sola vez, las ventanas de cada día con la hora del servidor, el
comodín antes de Empezar y fuera de la final, la inscripción antes de la final y que solo el admin
renombre, saque o cambie PINes. El árbol no se llama `copas` porque las reglas no pueden nombrar
juegos (C-16, `panel/adapta.test.mjs`).

## Laboratorio, práctica y reportes

`/labs/` (D-101) ofrece la práctica de cada minijuego, la copa simulada y la copa real. La práctica
arma el contenido con una semilla al azar como si fuera el día 1 de una copa con ese código, y la
muestra al final. El botón **🐞 Reportar un problema o dejar un comentario** (práctica, tablero y
resultado) guarda en `feedback/<id>`, por REST y sin cuenta (D-104), el texto, un nombre opcional, la versión
y un contexto en JSON: copa, jugador, pantalla, día, juego, semilla, URL y navegador. Se leen con
`node tools/reportes.mjs`; en `?prueba` queda en `localStorage` (`juegos-de-salon:copa:prueba:reportes`).

## Admin

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

## Archivos

| Archivo | Qué hace |
|---|---|
| `engine.js` | Calendario, ventanas con zona horaria, puntos, tabla, evolución, medallas, reloj activo |
| `juegos/*.js` | Motor puro de cada minijuego, la semilla y las grillas |
| `juegos/ui-*.js` | La pantalla de cada minijuego |
| `store-firebase.js` · `store-local.js` | El mismo almacén contra Firebase o contra localStorage (`?prueba`) |
| `cuenta.js` | Con quién está sentado este celular y el intento a medio jugar |
| `planilla.js` | La tabla final como CSV (D-161) |
| `rules.js` | Textos y la explicación de cada minijuego |
| `game.js` | Pantallas |

## Pruebas

```bash
node copa/engine.test.mjs
node copa/juegos/juegos.test.mjs
node copa/store.test.mjs
node copa/planilla.test.mjs
node copa/reportes.test.mjs
node tools/e2e/copa.mjs /tmp/copa            # Copa de 3 días, tres jugadores
node tools/e2e/copa.mjs /tmp/copa --siete    # los siete minijuegos
```

## Pendiente (después de la v1)

Recordatorios `.ics` (LIG-29), verificación cruzada de puntajes (LIG-30), papelera de copas
viejas (LIG-31), avisos automáticos (LIG-33) y minijuegos de reserva (LIG-84). Ya no están
pendientes: inglés y portugués con contenido propio (LIG-32, hecho en D-170) y las copas en el
panel del dueño (D-137).
