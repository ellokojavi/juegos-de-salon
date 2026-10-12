# 🖌️ Pintaminas (prototipo del laboratorio, en Proyectos activos)

Un Buscaminas de colores para uno solo (D-289): cada casilla **se pinta** (de un color que cambia con
cada tablero) **o no**, y su número dice cuántas de sus 8 vecinas son como ella (D-290). Al pintarlo entero aparece un dibujo.
**Inspirado en [ColorSweeper](https://store.steampowered.com/app/3128730/ColorSweeper/), de ARRKKA**,
y lo dice en la portada y en el laboratorio.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/paint-mines/`, en el laboratorio (con la llave de cada
  persona, D-281, D-284). Id `pintaminas` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo).
- **Estado:** proyecto activo desde v0.161.0 (los pinceles «Pinta» y «No pinta» desde v0.161.1, el
  modo difícil desde v0.162.0), para probarlo con amigos. Si gusta, la idea es que
  entre a La Copa.

## Portada

El título con una 🖌️ que pinta, el lema («Pinta la grilla y descubre el dibujo escondido.»), el crédito, y un tablero chico que se pinta
solo hasta mostrar su dibujo y vuelve a empezar (con movimiento reducido queda pintado). Después los
tres pasos y Empezar, que pasa por la cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`).

## Cómo se juega

- **Tablero:** 7×7. Algunas casillas vienen dadas, con su color y su número.
- **Pincel:** dos botones, «Pinta {color}» (el color del tablero, al azar de `PALETA`) y «No pinta»
  (gris, como las casillas sin pintar); el elegido se nota. Tocar una
  casilla sin pintar la pinta con el pincel.
- **Acertar:** aparece su número, que da más pistas. **Errar:** la casilla se destapa igual con su
  color verdadero, con un borde rojo, y resta 15 («❌ Se pintaba de morado: −15.» o «❌ No se pintaba: −15.»). Arriba: errores y cuántas faltan.
- **Al terminar:** los números se van, las sin pintar se apagan, las pintadas brillan y se dice qué era
  («🐟 ¡Era un pez!»).
- **Puntaje:** 100 − 15 por error, nunca bajo 0. Con 70 o más, confeti.
- **El final:** el dibujo, su nombre, un sello (¡Perfecto! sin errores, si no ¡Pintado!), el puntaje
  con su desglose, el tiempo, compartir, otro tablero, el de hoy (si se jugó con semilla) y, tras una
  línea, el formulario de comentarios (D-265, D-268).
- **Compartir:** la tarjeta muestra dónde se equivocó (🟥 en una grilla de ⬛), no el dibujo, para no
  arruinárselo a quien juega el mismo tablero.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## Modo difícil (D-291)

- **El interruptor:** en la portada, antes de Empezar, una palanca sobre una placa de metal («⚡ Modo
  difícil · Dos colores · puntaje ×1.5»). Bajo el título dice «APAGADO» o «ENCENDIDO». Al subirla la placa se electrifica: titila en celeste y
  amarillo, saltan chispas ⚡, suena y vibra. Es un `role="switch"`; el celular recuerda su posición
  (`juegos-de-salon:pintaminas:dificil`) y el link lo trae con `?colors=2`.
- **El tablero:** dos colores al azar de `PALETA` (nunca amarillo con naranjo juntos: se confundían), con los dibujos de `DIBUJOS2` (de dos colores), un
  borde eléctrico y tres pinceles («Pinta rojo», «Pinta verde», «No pinta»). El marcador dice
  «⚡ Modo difícil ×1.5». Un número cumplido ya no dice de qué color son las demás: solo que no son del
  suyo.
- **El puntaje:** (100 − 15 por error) × 1,5, hasta 150. El desglose lo dice («⚡ Modo difícil: ×1.5.»),
  el confeti sale desde el 70 % del máximo y «Otro tablero» sigue en el modo difícil.

## Cómo funciona

- `dibujos.js`: 17 dibujos de 7×7 (`#` se pinta, `.` no), cada uno con nombre y emoji, todos
  irregulares: uno simétrico se adivina por espejo y el test lo rechaza (D-290). Un dibujo nuevo tiene
  que reconocerse a 7×7 y tener entre 12 y 40 pintadas. `DIBUJOS2`: los 10 del modo difícil (`#` y
  `+`, un color cada uno), también irregulares y con al menos 4 casillas de cada color (D-291).
  `PALETA`: los 6 colores con su nombre y su emoji cuadrado.
- `engine.js`: `resolver(sol, dadas)` deduce como un jugador, con los colores que todavía puede tener
  cada casilla (sirve para uno o dos colores): cada casilla conocida dice cuántas de sus
  vecinas desconocidas se pintan; si son todas o ninguna, se saben; y si las desconocidas de una
  están todas entre las de otra, la diferencia también. Cada deducida suma su número y se sigue.
  `generar(semilla, { colores })` elige un dibujo (de `DIBUJOS2` con `colores: 2`; quizás espejado) y sus
  colores al azar de `PALETA`, agrega dadas al azar hasta que `resolver` lo
  termina y saca las que sobran (en promedio quedan 1 o 2: el resto se deduce en cadena).
  `estado(t, jugadas)` reconstruye la partida desde las jugadas `{ i, color }`.
  `puntaje(e, { colores })` aplica `PREMIO_DIFICIL` (×1.5) con dos colores, y `maximo(colores)` da
  100 o 150.
- `engine.test.mjs` revisa los dibujos (irregulares), la paleta y 300 tableros de cada modo (se
  resuelven sin adivinar, sin dadas de sobra, y el estado y el puntaje); `tools/e2e/paint-mines/lab.mjs`,
  la partida entera, el interruptor y una partida difícil sin errores (150/150).

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
