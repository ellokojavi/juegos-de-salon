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
  modo difícil desde v0.162.0, la ayuda 💡 desde v0.163.0), para probarlo con amigos. Si gusta, la idea es que
  entre a La Copa.

## Portada

El título con una 🖌️ que pinta, el lema («Pinta la grilla y descubre el dibujo escondido.»), el crédito, y una partida de verdad en chico: parte con las casillas dadas y se pinta de a una, en el orden en que un jugador las deduciría (el de la ayuda), cada una con su número; al completarse aparece el dibujo y dice qué era («🐟 ¡Era un pez!»), y sigue con otro tablero. Con el modo difícil encendido, la partida de la portada es de dos colores, y mover la palanca la vuelve a empezar con el modo nuevo.
Después los tres pasos (desde v0.167.1, U-36), la palanca del modo difícil y Empezar, que pasa por la
cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`). Los pasos:

1. 🔢 Cada número dice cuántas de sus 8 vecinas son iguales a ella: del mismo color, o sin pintar.
2. 🖌️ Elige «Pinta» o «No pinta» y toca una casilla. Si aciertas, aparece su número.
3. 🧠 Nunca hay que adivinar. Cada error resta 15; si te trabas, la 💡 ayuda muestra dónde mirar.

La tarjeta del laboratorio agrega, desde v0.167.1, «Con un modo difícil de dos colores.».

## Cómo se juega

- **Tablero:** 7×7. Algunas casillas vienen dadas, con su color y su número.
- **Pincel:** dos botones, «Pinta {color}» (el color del tablero, al azar de `PALETA`) y «No pinta»
  (gris, como las casillas sin pintar); el elegido se nota. Tocar una
  casilla sin pintar la pinta con el pincel.
- **Acertar:** aparece su número, que da más pistas. **Errar:** la casilla se destapa igual con su
  color verdadero, con un borde rojo, y resta 15 («❌ Se pintaba de morado: −15.» o «❌ No se pintaba: −15.»). Arriba: errores y cuántas faltan.
- **Al terminar:** los números se van, las sin pintar se apagan, las pintadas brillan y se dice qué era
  («🐟 ¡Era un pez!»).
- **💡 Ayuda (−10)** (D-292; desde v0.163.2 pide confirmar, #351): el primer toque cambia el botón a «Toca de
  nuevo para usar la ayuda (−10)» por 3 segundos y el segundo la cobra, como en El caso; mientras la
  casilla que señaló siga sin pintar, «💡 Ver la ayuda» la vuelve a mostrar sin cobrar. bajo los pinceles. Marca, latiendo en amarillo, una casilla que se
  puede deducir con lo que se ve, y los números que lo explican; no dice de qué color es («💡 La casilla
  que late se deduce de los números marcados.»). Las marcas se van con la jugada siguiente,
  y el botón, al terminar.
- **🏳️ Rendirse** (D-296): junto a la ayuda, en una fila de dos botones iguales. Pide un segundo toque
  («🏳️ ¿Seguro?»); al rendirse se destapa el dibujo (lo que faltaba, más apagado), el sello dice «Te
  rendiste» y el puntaje vale la parte pintada.
- **Puntaje:** 100 − 15 por error − 10 por ayuda, nunca bajo 0. Al rendirse, por la parte pintada. Con 70 o más, confeti.
- **El final:** el dibujo, su nombre, un sello (¡Perfecto! sin errores ni ayudas, si no ¡Pintado!), el puntaje
  con su desglose, el tiempo, compartir, otro tablero, el de hoy (si se jugó con semilla) y, tras una
  línea, el formulario de comentarios (D-265, D-268).
- **Compartir:** la tarjeta muestra dónde se equivocó (🟥 en una grilla de ⬛), no el dibujo, para no
  arruinárselo a quien juega el mismo tablero.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## Modo difícil (D-291)

- **El interruptor:** en la portada, antes de Empezar, una palanca sobre una placa de metal («Modo fácil · Un color · puntaje normal», y al subirla «⚡ Modo difícil · Dos colores · puntaje ×1.5»; la placa lleva grabado el recorrido de la bola
  (una ranura oscura en arco), que muestra hacia dónde se mueve. Al pasar al modo difícil, un destello corto cubre toda la vista (volver al fácil no lleva destello). Al subirla, el rectángulo entero brilla y parpadea al azar, como una luz con mal contacto (D-292; con movimiento reducido queda encendido y quieto), y la placa se electrifica: titila en celeste y
  amarillo, saltan chispas ⚡, suena y vibra. Es un `role="switch"`; el celular recuerda su posición
  (`juegos-de-salon:pintaminas:dificil`) y el link lo trae con `?colors=2`.
- **El fondo:** encendido, toda la página pasa de su morado de siempre a un azul noche con
  resplandores celestes (`body.modo-dificil`), en la portada, el juego y el resultado (pedido del dueño).
- **La trama del segundo color** (#349): en el modo difícil, las casillas del segundo color y su pincel
  llevan rayas finas, para quien no distingue bien los colores; al revelarse el dibujo se van.
- **El tablero:** dos colores al azar de `PALETA` (nunca amarillo con naranjo juntos: se confundían), con los dibujos de `DIBUJOS2` (de dos colores), un
  borde eléctrico y tres pinceles («Pinta rojo», «Pinta verde», «No pinta»). El marcador dice
  «⚡ Modo difícil ×1.5». Un número cumplido ya no dice de qué color son las demás: solo que no son del
  suyo.
- **El puntaje:** (100 − 15 por error − 10 por ayuda) × 1,5, hasta 150. El desglose lo dice («⚡ Modo difícil: ×1.5.»),
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
  `ayuda(sol, conocidas)` usa la misma deducción y se detiene en la primera casilla que sabe: devuelve
  `{ celda, por }` (la casilla y las conocidas cuyas reglas la dedujeron) o `null` (D-292).
  `estado(t, jugadas)` reconstruye la partida desde las jugadas `{ i, color }` y cuenta las
  `{ ayuda: true }` en `ayudas`. `puntaje(e, { colores })` resta `RESTA_ERROR` (15) por error y
  `RESTA_AYUDA` (10) por ayuda, y aplica `PREMIO_DIFICIL` (×1.5) con dos colores, y `maximo(colores)` da
  100 o 150.
- `engine.test.mjs` revisa los dibujos (irregulares), la paleta y 300 tableros de cada modo (se
  resuelven sin adivinar, sin dadas de sobra, y el estado y el puntaje) y tableros de uno y dos colores
  jugados solo con ayudas hasta el final; `tools/e2e/paint-mines/lab.mjs`, la partida entera (con un
  error y una ayuda: 75/100), el interruptor y una partida difícil sin errores (150/150).

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
