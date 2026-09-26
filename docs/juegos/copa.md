# La Copa 🏆

Un torneo entre amigos que dura una semana: cada día se abre un minijuego distinto, idéntico
para todos, que se juega **una sola vez** y reparte puntos según la posición del día. Gana
quien suma más al cierre. Es la primera modalidad de la app que no es una partida sino una
serie de partidas en el tiempo (un macro-juego). El diseño completo, con la revisión y el plan
de construcción, se discutió en el documento *La Copa — requisitos del torneo de varios días*.

- **Estado:** en el laboratorio (D-101). En el menú aparece como "Próximamente"; se prueba desde
  **`/labs/`**.
- **URL:** `/copa/` (portada) · `/copa/?K7Q2X` (una copa) · `/copa/?labs` (copa real con la Copa
  de 3 días, D-100; `?tres` sigue funcionando) · `?prueba` (almacén local y reloj adelantable, sin
  Firebase) · `/copa/?practica=<id>&semilla=K7Q2X` (un minijuego suelto, repetible). Desde la portada se
  abre sin `&labs` y es el minijuego suelto para cualquiera: vuelve al menú, sin sesión de prueba
  ni semilla a la vista, y con su señal de uso; desde el laboratorio, con `&labs` (D-142).
- **Jugadores:** de 1 a 10 por copa. **Idioma:** solo español (D-98).
- **Modalidades:** Copa de 7 días (la que se ofrece) y Copa de 3 días (solo pruebas).

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
| Inscripción | Abierta hasta que empieza la final. Los días que ya cerraron quedan con 0. |
| Tabla | Suma de puntos. Desempata quien ganó más días y después quien quedó mejor en la final. |
| Medallas | Campeón, más días ganados, la remontada (más puestos subidos desde la mitad) y el farolito rojo. |

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
tableros más chicos), que no se guarda ni cuenta.

La Copa de 3 días juega Línea, Conexiones y la final. En el laboratorio se pueden practicar además
**〰️ Zip** (un solo trazo por todas las casillas, pasando por los números en orden; por niveles, tres minutos para resolver la mayor cantidad) y **☀️ Tango**
(soles y lunas, mitad y mitad por línea, nunca tres seguidos, con marcas = y ×), candidatos a
entrar al calendario.

- **Línea y Año** usan temáticas distintas dentro de la misma copa (`temasDeLaCopa`), para que no
  sean dos días de lo mismo.
- **Reinas, Zip y Tango** tienen solución única garantizada. Reinas ajusta las zonas de a una
  casilla hasta que el resolvedor encuentra una sola solución; Tango suma pistas hasta que es única
  y después saca las que sobran; Zip suma números sobre un camino al azar y después saca los que
  sobran (quedan 7 a 12 en 6 × 6).
- **Tango** no cuenta como error pasar por el sol para llegar a la luna: solo dejar la casilla
  rompiendo una regla (D-102). La casilla con sol es ámbar y la de luna azul noche, con la luna
  plateada: los dos emojis son amarillos y así no se confunden (D-144).
- **Toque y Fama: Palabra** acepta cualquier combinación de 5 letras distintas como intento, sin
  diccionario, igual que Toque y Fama acepta cualquier número de cifras distintas. La palabra
  secreta sale de una lista de 120 palabras comunes (`juegos/palabras.js`).
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
falta), tabla parcial y resumen final.

## Archivos

| Archivo | Qué hace |
|---|---|
| `engine.js` | Calendario, ventanas con zona horaria, puntos, tabla, evolución, medallas, reloj activo |
| `juegos/*.js` | Motor puro de cada minijuego, la semilla y las grillas |
| `juegos/ui-*.js` | La pantalla de cada minijuego |
| `store-firebase.js` · `store-local.js` | El mismo almacén contra Firebase o contra localStorage (`?prueba`) |
| `cuenta.js` | Con quién está sentado este celular y el intento a medio jugar |
| `rules.js` | Textos y la explicación de cada minijuego |
| `game.js` | Pantallas |

## Pruebas

```bash
node copa/engine.test.mjs
node copa/juegos/juegos.test.mjs
node copa/store.test.mjs
node tools/e2e/copa.mjs /tmp/copa            # Copa de 3 días, tres jugadores
node tools/e2e/copa.mjs /tmp/copa --siete    # los siete minijuegos
```

## Pendiente (después de la v1)

Recordatorios `.ics` (LIG-29), verificación cruzada de puntajes (LIG-30), papelera de copas
viejas (LIG-31), inglés y portugués con contenido propio (LIG-32), avisos automáticos (LIG-33),
calendario elegido por el admin (LIG-34) y que el panel del dueño muestre las copas y su progreso.
