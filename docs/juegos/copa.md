# La Copa 🏆

Un torneo entre amigos que dura una semana: cada día se abre un minijuego distinto, idéntico
para todos, que se juega **una sola vez** y reparte puntos según la posición del día. Gana
quien suma más al cierre. Es la primera modalidad de la app que no es una partida sino una
serie de partidas en el tiempo (un macro-juego). El diseño completo, con la revisión y el plan
de construcción, se discutió en el documento *La Copa — requisitos del torneo de varios días*.

- **URL:** `/copa/` (portada) · `/copa/?K7Q2X` (una copa) · `/copa/?tres` (ofrece la Copa de 3
  días, solo para probar, D-100) · `?prueba` (almacén local y reloj adelantable, sin Firebase).
- **Jugadores:** de 1 a 10 por copa. **Idioma:** solo español (D-98).
- **Modalidades:** Copa de 7 días (la que se ofrece) y Copa de 3 días (solo pruebas).

## Reglas del torneo

| Regla | Detalle |
|---|---|
| Días | El día 1 parte a las 00:00 del día de inicio, hora de Chile. Cada día termina a las 23:59. |
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

| Día | Minijuego | Puntaje | Reusa |
|---|---|---|---|
| 1 | ⏳ Línea Relámpago: 8 hitos, 7 por colocar | aciertos, 0 a 7 | mazos de Línea de Tiempo |
| 2 | 🔢 El Número del Día: 4 cifras, 10 intentos | 11 − intentos, 0 si no | motor de Toque y Fama |
| 3 | 🔗 Conexiones: 16 palabras, 4 grupos, 4 errores | 25 × grupo − 5 × error | 12 grillas chilenas (`juegos/grillas.js`) |
| 4 | ⚓ Batalla Naval: Solitario (Bimaru) 8×8 | 100 − 15 × revisión fallida, piso 10 | pixel art de la flota |
| 5 | 🎲 ¿Dudo o le creo?: 8 manos | probabilidad de acertar × 100 por mano | probabilidades de Dudo |
| 6 | 📅 ¿En qué año?: 6 hitos | 100 por hito, baja con la distancia | mazos de Línea de Tiempo |
| 7 | 🏁 La Gran Final: 5 rondas cortas | 0 a 100 por ronda, 0 a 500 | los cinco motores |

La Copa de 3 días juega Línea, Conexiones y la final.

- **Línea y Año** usan temáticas distintas dentro de la misma copa (`temasDeLaCopa`), para que no
  sean dos días de lo mismo.
- **El solitario** tiene solución única garantizada: el generador agrega pistas —casillas
  destapadas— hasta que el resolvedor encuentra una sola solución (`resolver` cuenta hasta 2).
- **¿Dudo o le creo?** puntúa la calidad de la decisión y no el resultado (D-97).
- **¿En qué año?** tiene un margen que crece con la antigüedad: `max(8, (2026 − año) / 4)` años.

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
