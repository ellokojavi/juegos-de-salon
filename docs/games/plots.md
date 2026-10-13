# 🧱 Loteo (prototipo del laboratorio, en Proyectos activos)

Un puzzle de lógica para uno solo (D-310): una grilla con algunos números se divide entera en
rectángulos, los **lotes**, cada uno con exactamente un número, que dice cuántas casillas tiene. Cada
tablero tiene una sola solución. **Inspirado en [Shikaku](https://en.wikipedia.org/wiki/Shikaku), de
Nikoli (1989)**, y lo dice en la portada y en el laboratorio. Se armó con el nombre provisorio
«Parcelas» (por eso la carpeta es `plots`); el dueño eligió Loteo antes de publicarlo.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/plots/`, en el laboratorio (con la llave de cada persona,
  D-281, D-284). Id `loteo` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo).
- **Estado:** proyecto activo, para probarlo con amigos.

## Portada

El título con un 🧱 que salta, el lema («Cada número es un lote: dibújalo del tamaño justo.»), el
crédito y un 5×5 que se resuelve solo, lote por lote: el marco crece de una esquina a la otra, como
cuando se arrastra, y el lote se pinta de su color. Al final el tablero se apaga y «¡Listo!» aparece
grande al centro (sin emoji: el título ya lo tiene); después sigue con otro (con movimiento reducido
queda resuelto y quieto). Después los tres pasos, «📅 El tablero de hoy es el mismo para todos.» (sin
`?seed=`) y «🧱 Empezar», que pasa por la cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`,
«¡A lotear!»). Los pasos:

1. 🧱 Divide el tablero en rectángulos, cada uno con un solo número.
2. 🔢 El número es cuántas casillas tiene: un 6 puede ser de 2×3 o de 1×6.
3. 👆 Arrastra de una esquina a otra para dibujarlo; tócalo para borrarlo. Son 3 tableros contra el
   reloj.

La tarjeta del laboratorio: «Inspirado en Shikaku, de Nikoli: divide el tablero en rectángulos, cada
uno con un solo número, que dice cuántas casillas tiene. Arrastra para dibujar cada lote. Son tres
tableros contra el reloj.».

## Cómo se juega

- **Tres tableros:** 5×5, 6×6 y 7×7 («Tablero n de 3», con un punto por tablero que se pone verde al
  resolverlo). El reloj sube desde el «¡A lotear!» y se pausa con la pantalla oculta (U-20).
- **Dibujar:** se arrastra de una casilla a otra; el marco blanco muestra el rectángulo y el aviso de
  arriba, su medida («2×3 = 6»). Al soltar:
  - si tiene un solo número y su área es ese número, se pinta de un color claro (dos lotes vecinos
    nunca del mismo) y su número queda encima, oscuro. Reemplaza los lotes que pisa;
  - si no, el marco tiembla en rojo y el aviso dice por qué: «Ese rectángulo no tiene número.»,
    «Tiene 2 números: cada uno va en su propio rectángulo.» o «El 6 pide 6 casillas; ese tiene 4.».
- **Tocar** un lote lo borra («Lote borrado.»); tocar un 1 lo dibuja (es su propio lote); tocar otra
  casilla recuerda el gesto («Arrastra de una esquina a otra para dibujar un rectángulo.»).
- **Tablero listo:** cuando los lotes lo cubren entero, brilla («🧱 ¡Tablero n listo!») y viene el
  siguiente; tras el tercero, directo al resultado, con confeti.
- **Abajo, tres botones iguales en una fila** (como en Rutas rotas):
  - **↩ Deshacer:** vuelve atrás la última jugada (dibujar, borrar o la ayuda); gratis.
  - **💡 Ayuda (−10):** pide un segundo toque («Toca de nuevo (−10)», 3 segundos) y pone un lote de
    la solución que no estaba bien puesto, con el borde punteado («💡 Ese lote va así.»).
  - **🏳️ Rendirse:** pide un segundo toque («🏳️ ¿Seguro?»).
- **Puntaje, sobre 100:** 20 por tablero resuelto y, solo con los tres, hasta 40 por rapidez (40 en
  1:30 o menos, 0 en 6 minutos o más, en línea recta entre medio). Cada ayuda resta 10; nunca bajo 0.
- **El resultado:** una sola pantalla. El último tablero en chico (el del jugador si lo terminó; si se
  rindió, «Así se resolvía el tablero n.» con la solución), el sello («¡Todo loteado!» o «Te
  rendiste»), el puntaje, el desglose («🧱 Tableros (3 de 3): +60.», «⏱ Rapidez (1:42): +38.», «💡 1
  ayuda: −10.»), el tiempo (si no los resolvió todos), compartir, otro tablero, el de hoy (si se jugó
  con semilla), volver al laboratorio y, tras una línea, el formulario de comentarios (D-265, D-268).
- **Compartir:** la tarjeta dice qué tableros resolvió («✅ 5×5  ✅ 6×6  ⬛ 7×7»), las ayudas y el
  tiempo, sin delatar la solución.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## Cómo funciona

- `engine.js`: `generar(semilla, { lado })` parte la grilla al azar (la primera casilla libre recibe
  un rectángulo elegido por su área: gustan las de 3 a 8, poco las de 2 y casi nada las de 1; tope 8,
  9 o 10 según el tamaño), descarta particiones con muchos 1 (o, en el 7×7, con menos de dos de 6 o
  más), pone cada número en una casilla al azar de su rectángulo y pide `resolver(t, 2)`: si hay más
  de una solución, prueba otros lugares para los números (6 veces) y después otra partición.
  `resolver` hace backtracking por pista, siempre la que tiene menos rectángulos posibles (de su
  área, que la contienen, sin otro número), y poda si una casilla libre ya no la puede cubrir nadie.
  `validar(t, r)` dice si un rectángulo vale (`sin-numero`, `dos-numeros` o `area`); `poner` agrega
  uno sacando los que pisa; `resuelto`, `pista` (la ayuda), `puntajePartida` y `tarjeta`.
  `generarEtapa(semilla, n)` usa `<semilla>:etapa-<n>`. Constantes: `ETAPAS`, `PUNTOS_ETAPA` (20),
  `BONO_RAPIDEZ` (40), `RAPIDO_S` (90), `LENTO_S` (360), `RESTA_AYUDA` (10) y `MAXIMO` (100).
- `game.js`: la portada, la partida y el resultado. El tablero tiene tres capas (el fondo
  cuadriculado, los lotes y los números) y el marco del arrastre encima; el arrastre es el de Rutas
  rotas (`pointerdown/move/up` con `setPointerCapture`). El nombre vive en `T.nombre`.
- `window.__loteo = { P, dibujar(r), tocar(f, c) }`: el estado, y dibujar un rectángulo o tocar una
  casilla por el mismo camino que el dedo (para las pruebas).
- `engine.test.mjs` revisa la validación, el resolvedor (una, dos y ninguna solución), que 300
  tableros de cada tamaño tengan una sola solución, que esta pase la validación y los resuelva, que
  se generen en menos de 200 ms, la ayuda y el puntaje; `tools/e2e/plots/lab.mjs` juega de punta a
  punta (los tres rechazos, pintar y borrar, la ayuda, deshacer, los tres tableros con la solución del
  motor, el resultado y rendirse). Con `ANCHO=320` corre a 320 px.

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
- El arrastre es el de Rutas rotas, no `assets/js/arrastre.js` (C-8): dibuja un rectángulo sobre la
  grilla, no lleva una pieza de un lugar a otro, y soltar sí juega (como en Rutas rotas: deshacer es
  gratis).
- Las casillas del 7×7 miden unos 44 px a 375 px de ancho y algo menos a 320 px; el gesto es
  arrastrar sobre la grilla entera, no tocar una casilla chica.
