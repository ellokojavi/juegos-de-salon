# 🚇 Rutas rotas (prototipo del laboratorio, en Proyectos activos)

Nueve piezas de un plano de metro en 3×3 (D-293). Una jugada gira 180° cualquier rectángulo del
tablero; se gana uniendo todas las líneas, y el desafío es hacerlo pronto y en el mínimo de giros, en cinco
etapas cada vez más difíciles y con 7 minutos de reloj (D-294, D-295). **Inspirado
en [Junction Nine](https://bricksandchips.co/junction-nine), de Bricks and Chips**, y lo dice en la
portada y en el laboratorio.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/routes/`, en el laboratorio (con la llave de cada persona,
  D-281, D-284). Id `rutas` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo).
- **Estado:** proyecto activo desde v0.164.0, para probarlo con amigos.
- **Nombre:** se llamó *Rutas* hasta v0.167.3, cuando el dueño lo cambió a **Rutas rotas** (las líneas
  parten cortadas y hay que unirlas, D-293). La carpeta (`/labs/routes/`) y el id `rutas` no cambiaron.

## Portada

El título con un 🚇 que anda, el lema («Une todas las líneas del metro girando partes del tablero.»), el crédito, y un tablero que parte desordenado y se arma en 5 o 6
jugadas, alternando las dos clases de jugada: girar una carta sola (rotarla en su lugar) y girar dos
vecinas (cambian de lugar); antes de cada una se marca el rectángulo, y al armarse la ruta se ilumina.
Después vuelve a empezar con otro desorden (con movimiento reducido queda armado). Después los tres
pasos (desde v0.167.1, U-36) y Empezar, que pasa por la cuenta 3, 2, 1 compartida
(`assets/js/cuenta-regresiva.js`):

1. 🔄 Arrastra de una pieza a otra: el rectángulo da media vuelta y sus piezas quedan al revés. Un toque gira una sola.
2. 🚇 Une cada color en una línea, sin cortes entre piezas.
   Antes decía «Une todas las líneas, sin cortes»; un jugador no se dio cuenta de que el color
   tenía que calzar ([#385](https://github.com/ellokojavi/juegos-de-salon/issues/385)).
3. ⛳ Son 5 etapas en 7 minutos. Cuenta completarlas, luego la rapidez y los giros; deshacer y reiniciar son gratis.

La tarjeta del laboratorio termina, desde v0.167.1, en «…en el mínimo de giros. Son cinco etapas contra el reloj.».

## Cómo se juega

- **Etapas** (D-294): cada partida son 5 tableros, cada uno más difícil: 3 líneas y mínimo 2; 4 y 3;
  4 y 4; 5 y 4; 5 y 5. Arriba, «Etapa n de 5», cinco puntos (verde la hecha en el mínimo, amarilla
  la hecha con giros de más, blanca la actual), como la tarjeta para compartir; el mínimo lo dice el
  marcador de abajo. Al unir una etapa, «🚇 ¡Etapa 2 lista!» y llega
  la siguiente.

- **Girar:** se arrastra de una pieza a otra y queda marcado en blanco el rectángulo entre las dos (el amarillo se confundía con la línea amarilla);
  al soltar, gira media vuelta **como un solo bloque**, alrededor de su centro: cada pieza orbita a su lugar espejo y por eso queda dada vuelta (no gira por su cuenta mientras se desliza). Un toque gira una
  sola pieza (la deja dada vuelta en su lugar).
- **La meta:** que todas las líneas sigan sin cortes de pieza en pieza. Vale cualquier orden en que
  todos los bordes calcen, aunque no sea el original. **El tablero no marca qué bordes ya calzan**
  ([#359](https://github.com/ellokojavi/juegos-de-salon/issues/359), pedido del dueño): las líneas
  mismas muestran dónde siguen o se cortan, y leerlas es parte del juego.
- **Arriba:** «Giros: n · Mínimo: m». **↺ Reiniciar** vuelve al tablero del comienzo de la etapa con 0
  giros, gratis; sin giros está apagado y al terminar la etapa se va.
- **Al unirlas:** las líneas brillan, el tablero se marca en verde («🚇 ¡Etapa 2 lista!», o «🚇 ¡Etapa 2 en
  el mínimo!»), el punto de la etapa se pinta y llega la siguiente; después de la quinta, el resultado.
- **Reloj** (D-295): 7 minutos para las cinco etapas, arriba junto al marcador («⏱ 6:42»), en rojo el
  último minuto. Al acabarse, se acaba la partida y cuentan las etapas hechas.
- **Bajo el tablero, tres botones iguales en una fila**, en este orden: **↩ Deshacer** (deshace el último
  giro, que no cuenta; se apaga sin giros), **↺ Reiniciar** y **🏳️ Rendirse** (pide un segundo toque:
  «🏳️ ¿Seguro?», y cuenta las etapas hechas). Mientras se juega no se muestra el título, así los tres se
  ven sin bajar en un celular chico (#360).
- **Puntaje por capas** (D-295): 17 por etapa completada (85 las cinco) + hasta 10 por rapidez (solo
  completando las cinco: 10 en un minuto o menos, 0 al acabarse el reloj) + hasta 5 por giros (5 en el
  mínimo, 0 con el doble o más). Completar más siempre gana. Con 70 o más, confeti.
- **El final:** el último tablero, un sello (¡Todas en el mínimo!, ¡Rutas unidas!, Se acabó el tiempo o
  Te rendiste), el puntaje, el desglose (las tres capas y cada etapa: «🚇 Etapas (5 de 5): +85.», «⏱ Rapidez (2:10): +8.», «🔄 Giros (24, mínimo 18): +3.» y «🟨 Etapa 3: 5 giros (mínimo 4)»; sin las cinco, «⏱ Rapidez: +0 (faltaron etapas).», y cuántas veces reiniciaste),
  el tiempo, compartir (una línea por etapa: «🟩 1: 2/2», y «⬛ 4: —» las que faltaron), otro tablero, el de hoy (si se jugó con semilla) y, tras una línea, el
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
  `puntajePartida(hechas, segundos)` da el puntaje por capas (`TIEMPO_S`, `PUNTOS_ETAPA`, `BONO_VELOCIDAD`,
  `BONO_GIROS`) con cada capa por separado, para el desglose.
- `game.js`: dibuja cada pieza en SVG (curvas de puerta a puerta, con una estación blanca en la mitad),
  la posiciona con left/top y la gira con rotate, acumulando el ángulo para que siempre dé media vuelta
  hacia el mismo lado.
- `engine.test.mjs` revisa los giros, el mínimo contra una búsqueda simple (también que con un giro
  menos no se llega a ninguna de las dos soluciones), 60 tableros, las cinco etapas y los
  casos límite del puntaje (más rápido nunca da menos); `tools/e2e/routes/lab.mjs` arrastra, reinicia, juega
  las cinco etapas, se rinde y deja acabarse un reloj de prueba (`?test&time=12`, solo en el modo de prueba).

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
