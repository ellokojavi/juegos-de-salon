# 🖌️ Pintaminas (prototipo del laboratorio, en Proyectos activos)

Un Buscaminas de colores para uno solo (D-289): cada casilla es de **tinta** o de **fondo**, y su
número dice cuántas de sus 8 vecinas son de su mismo color. Al pintarlo entero aparece un dibujo.
**Inspirado en [ColorSweeper](https://store.steampowered.com/app/3128730/ColorSweeper/), de ARRKKA**,
y lo dice en la portada y en el laboratorio.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/paint-mines/`, en el laboratorio (con la llave de cada
  persona, D-281, D-284). Id `pintaminas` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo).
- **Estado:** proyecto activo desde v0.161.0, para probarlo con amigos. Si gusta, la idea es que
  entre a La Copa.

## Portada

El título con una 🖌️ que pinta, el lema («Pinta la grilla y descubre el dibujo escondido. Cada número
cuenta cuántas de sus vecinas son de su mismo color.»), el crédito, y un tablero chico que se pinta
solo hasta mostrar su dibujo y vuelve a empezar (con movimiento reducido queda pintado). Después los
tres pasos y Empezar, que pasa por la cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`).

## Cómo se juega

- **Tablero:** 7×7. Algunas casillas vienen dadas, con su color y su número.
- **Pincel:** dos botones, 🎨 Tinta (del color del dibujo) y ⬜ Fondo; el elegido se nota. Tocar una
  casilla sin pintar la pinta con el pincel.
- **Acertar:** aparece su número, que da más pistas. **Errar:** la casilla se destapa igual con su
  color verdadero, con un borde rojo, y resta 15 («❌ Era tinta: −15.»). Arriba: errores y cuántas faltan.
- **Al terminar:** los números se van, el fondo se apaga, la tinta brilla y se dice qué era
  («🐟 ¡Era un pez!»).
- **Puntaje:** 100 − 15 por error, nunca bajo 0. Con 70 o más, confeti.
- **El final:** el dibujo, su nombre, un sello (¡Perfecto! sin errores, si no ¡Pintado!), el puntaje
  con su desglose, el tiempo, compartir, otro tablero, el de hoy (si se jugó con semilla) y, tras una
  línea, el formulario de comentarios (D-265, D-268).
- **Compartir:** la tarjeta muestra dónde se equivocó (🟥 en una grilla de ⬛), no el dibujo, para no
  arruinárselo a quien juega el mismo tablero.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## Cómo funciona

- `dibujos.js`: 17 dibujos de 7×7 (`#` tinta, `.` fondo), cada uno con nombre, emoji, color y el
  emoji cuadrado de su color. Un dibujo nuevo tiene que reconocerse a 7×7 y tener entre 12 y 40 de
  tinta (lo revisa el test).
- `engine.js`: `resolver(sol, dadas)` deduce como un jugador: cada casilla conocida dice cuántas de sus
  vecinas desconocidas son de tinta; si son todas o ninguna, se saben; y si las desconocidas de una
  están todas entre las de otra, la diferencia también. Cada deducida suma su número y se sigue.
  `generar(semilla)` elige un dibujo (quizás espejado), agrega dadas al azar hasta que `resolver` lo
  termina y saca las que sobran (en promedio quedan 1 o 2: el resto se deduce en cadena).
  `estado(t, jugadas)` reconstruye la partida desde las jugadas `{ i, color }`.
- `engine.test.mjs` revisa los dibujos y 300 tableros (se resuelven sin adivinar, sin dadas de sobra,
  y el estado y el puntaje); `tools/e2e/paint-mines/lab.mjs`, la partida entera.

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
