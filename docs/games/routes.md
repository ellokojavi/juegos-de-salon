# 🚇 Rutas (prototipo del laboratorio, en Proyectos activos)

Nueve piezas de un plano de metro en 3×3 (D-293). Una jugada gira 180° cualquier rectángulo del
tablero; se gana uniendo todas las líneas, y el desafío es hacerlo en el mínimo de giros, en cinco
etapas cada vez más difíciles (D-294). **Inspirado
en [Junction Nine](https://bricksandchips.co/junction-nine), de Bricks and Chips**, y lo dice en la
portada y en el laboratorio.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/routes/`, en el laboratorio (con la llave de cada persona,
  D-281, D-284). Id `rutas` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo).
- **Estado:** proyecto activo desde v0.164.0, para probarlo con amigos.

## Portada

El título con un 🚇 que anda, el lema («Une todas las líneas del metro girando partes del tablero.»), el crédito, y un tablero resuelto que gira solo una parte y la devuelve,
una y otra vez (con movimiento reducido queda quieto). Después los tres pasos y Empezar, que pasa por
la cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`).

## Cómo se juega

- **Etapas** (D-294): cada partida son 5 tableros, cada uno más difícil: 3 líneas y mínimo 2; 4 y 3;
  4 y 4; 5 y 4; 5 y 5. Arriba, «Etapa n de 5», cinco puntos (verde la hecha en el mínimo, amarilla
  la hecha con giros de más, blanca la actual), como la tarjeta para compartir; el mínimo lo dice el
  marcador de abajo. Al unir una etapa, «🚇 ¡Etapa 2 lista!» y llega
  la siguiente. La partida vale el promedio de las etapas.

- **Girar:** se arrastra de una pieza a otra y queda marcado en blanco el rectángulo entre las dos (el amarillo se confundía con la línea amarilla);
  al soltar, gira media vuelta: cada pieza viaja a su lugar espejo y se da vuelta. Un toque gira una
  sola pieza (la deja dada vuelta en su lugar).
- **La meta:** que todas las líneas sigan sin cortes de pieza en pieza. Vale cualquier orden en que
  todos los bordes calcen, aunque no sea el original.
- **Arriba:** «Giros: n · Mínimo: m». **↺ Reiniciar** vuelve al tablero del comienzo de la etapa con 0
  giros, gratis; sin giros está apagado y al terminar la etapa se va.
- **Al unirlas:** las líneas brillan, el tablero se marca en verde («🚇 ¡Etapa 2 lista!», o «🚇 ¡Etapa 2 en
  el mínimo!»), el punto de la etapa se pinta y llega la siguiente; después de la quinta, el resultado.
- **Puntaje:** por etapa, 100 si se iguala el mínimo, −15 por cada giro de más, nunca menos de 10; la
  partida, el promedio. Con 70 o más, confeti.
- **El final:** el último tablero resuelto, un sello (¡Todas en el mínimo! o ¡Rutas unidas!), el
  puntaje, el desglose (cada etapa: «🟨 Etapa 3: 5 giros (mínimo 4) · 85/100», y cuántas veces reiniciaste),
  el tiempo, compartir (una línea por etapa: «🟩 1: 2/2»), otro tablero, el de hoy (si se jugó con semilla) y, tras una línea, el
  formulario de comentarios (D-265, D-268).
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## Cómo funciona

- `engine.js`: cada pieza tiene 8 puertas (dos por lado) y tramos que unen dos puertas con un color;
  un estado es, por lugar, la pieza y si está dada vuelta (`{ p, v }`). `girar(estado, rect)` gira un
  rectángulo (son 36, en `RECTANGULOS`); `resuelto` mira que cada borde entre piezas calce puerta por
  puerta (dada vuelta, la puerta N0 pasa a ser S1). `generar(semilla, { lineas, minimo })` arma un plano de
  líneas de borde a borde (sin piezas vacías ni repetidas, ni dada vuelta una), lo desordena con un giro
  más que el mínimo pedido (`revuelta`) y lo rehace hasta que `minimo` dé justo ese número. `minimo`
  busca desde los dos extremos a la vez, y hacia atrás parte de las dos soluciones: la meta y el
  tablero entero dado vuelta (`TODO`), que también une todas las líneas. `ETAPAS` dice líneas y mínimo
  de cada etapa, `generarEtapa(semilla, n)` arma la etapa con la semilla `<semilla>:etapa-<n>`, y
  `puntajeTotal` promedia los puntajes de las etapas.
- `game.js`: dibuja cada pieza en SVG (curvas de puerta a puerta, con una estación blanca en la mitad),
  la posiciona con left/top y la gira con rotate, acumulando el ángulo para que siempre dé media vuelta
  hacia el mismo lado.
- `engine.test.mjs` revisa los giros, el mínimo contra una búsqueda simple (también que con un giro
  menos no se llega a ninguna de las dos soluciones), 60 tableros y las cinco etapas;
  `tools/e2e/routes/lab.mjs` arrastra, reinicia y juega las cinco etapas.

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
