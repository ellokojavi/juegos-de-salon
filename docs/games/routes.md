# 🚇 Rutas (prototipo del laboratorio, en Proyectos activos)

Nueve piezas de un plano de metro en 3×3 (D-293). Una jugada gira 180° cualquier rectángulo del
tablero; se gana uniendo todas las líneas, y el desafío es hacerlo en el mínimo de giros. **Inspirado
en [Junction Nine](https://bricksandchips.co/junction-nine), de Bricks and Chips**, y lo dice en la
portada y en el laboratorio.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/routes/`, en el laboratorio (con la llave de cada persona,
  D-281, D-284). Id `rutas` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo).
- **Estado:** proyecto activo desde v0.164.0, para probarlo con amigos.

## Portada

El título con un 🚇 que anda, el lema («Une todas las líneas del metro girando partes del tablero, en
el menor número de giros.»), el crédito, y un tablero resuelto que gira solo una parte y la devuelve,
una y otra vez (con movimiento reducido queda quieto). Después los tres pasos y Empezar, que pasa por
la cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`).

## Cómo se juega

- **Girar:** se arrastra de una pieza a otra y queda marcado en amarillo el rectángulo entre las dos;
  al soltar, gira media vuelta: cada pieza viaja a su lugar espejo y se da vuelta. Un toque gira una
  sola pieza (la deja dada vuelta en su lugar).
- **La meta:** que todas las líneas sigan sin cortes de pieza en pieza. Vale cualquier orden en que
  todos los bordes calcen, aunque no sea el original.
- **Arriba:** «Giros: n · Mínimo: m». **↺ Reiniciar** vuelve al tablero del comienzo con 0 giros, gratis.
- **Al unirlas:** las líneas brillan y el tablero se marca en verde («🚇 ¡Todas las líneas unidas!»).
- **Puntaje:** 100 si se iguala el mínimo; −15 por cada giro de más; nunca menos de 10. Con 70 o más,
  confeti.
- **El final:** el tablero resuelto, un sello (¡Ruta perfecta! en el mínimo, si no ¡Rutas unidas!), el
  puntaje, el desglose (giros contra el mínimo, y cuántas veces reiniciaste), el tiempo, compartir
  («⛳ 6 giros · mínimo 5»), otro tablero, el de hoy (si se jugó con semilla) y, tras una línea, el
  formulario de comentarios (D-265, D-268).
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## Cómo funciona

- `engine.js`: cada pieza tiene 8 puertas (dos por lado) y tramos que unen dos puertas con un color;
  un estado es, por lugar, la pieza y si está dada vuelta (`{ p, v }`). `girar(estado, rect)` gira un
  rectángulo (son 36, en `RECTANGULOS`); `resuelto` mira que cada borde entre piezas calce puerta por
  puerta (dada vuelta, la puerta N0 pasa a ser S1). `generar(semilla)` arma un plano de 4 líneas de
  borde a borde (sin piezas vacías ni repetidas, ni dada vuelta una), lo desordena con 5 giros
  (`revuelta`) y calcula `minimo` buscando desde los dos extremos; vale si da de 3 a 5.
- `game.js`: dibuja cada pieza en SVG (curvas de puerta a puerta, con una estación blanca en la mitad),
  la posiciona con left/top y la gira con rotate, acumulando el ángulo para que siempre dé media vuelta
  hacia el mismo lado.
- `engine.test.mjs` revisa los giros, el mínimo contra una búsqueda simple y 60 tableros;
  `tools/e2e/routes/lab.mjs` arrastra, reinicia y termina una partida.

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
