# 📐 Loteo (prototipo del laboratorio, en Proyectos activos)

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

El título con un 📐 que salta, el lema («Cada número es un lote: dibújalo del tamaño justo.»), el
crédito, el selector de modo («🔢 Números» / «⚡💧 Servicios», ver abajo) y un 5×5 que se resuelve solo, lote por lote: el marco crece de una esquina a la otra, como
cuando se arrastra, y el lote se pinta de su color. Al final el tablero se apaga y «¡Listo!» aparece
grande al centro (sin emoji: el título ya lo tiene); después sigue con otro (con movimiento reducido
queda resuelto y quieto). Después los tres pasos, «📅 El tablero de hoy es el mismo para todos.» (sin
`?seed=`) y «📐 Empezar», que pasa por la cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`,
«¡A lotear!»). Los pasos:

1. 📐 Divide el tablero en lotes: rectángulos con un solo número cada uno.
2. 🔢 El número dice cuántas casillas tiene su lote: un 6 puede ser de 2×3 o de 1×6.
3. 👆 Arrastra de una esquina a otra para dibujar un lote; tócalo para borrarlo. Son 5 tableros
   contra el reloj (el número sale de `ETAPAS`).

La tarjeta del laboratorio: «Inspirado en Shikaku, de Nikoli: divide el tablero en rectángulos, cada
uno con un solo número, que dice cuántas casillas tiene. Arrastra para dibujar cada lote. Son cinco
tableros contra el reloj: dos para calentar y tres difíciles. En el modo ⚡💧 Servicios, los lotes
son todos del mismo tamaño y cada uno lleva un ⚡ y un 💧.».

## Cómo se juega

- **Cinco tableros** (pedido del dueño): dos para calentar, 5×5 y 6×6, y tres difíciles, 7×7, 7×7 y
  8×8, con lotes más grandes, ninguno a la vista de entrada y más pasos de deducción («Tablero n de
  5», con un punto por tablero que se pone verde al resolverlo). Todos se deducen sin adivinar, y los
  números van repartidos, lejos entre sí. El reloj sube desde el «¡A lotear!» y se pausa con la pantalla oculta (U-20).
- **Dibujar:** se arrastra de una casilla a otra; el marco blanco muestra el rectángulo y el aviso de
  arriba, su medida («2×3 = 6»). Al soltar:
  - si tiene un solo número y su área es ese número, se pinta de un color claro (dos lotes vecinos
    nunca del mismo) y su número queda encima, oscuro. Reemplaza los lotes que pisa;
  - si no, el marco tiembla en rojo y el aviso dice por qué: «Ese rectángulo no tiene número.»,
    «Tiene 2 números: cada uno va en su propio lote.» o «El 6 pide 6 casillas; ese tiene 4.».
- **Tocar** un lote lo borra («Lote borrado.»); tocar un 1 lo dibuja (es su propio lote); tocar otra
  casilla recuerda el gesto («Arrastra de una esquina a otra para dibujar un lote.»).
- **Tablero listo:** cuando los lotes lo cubren entero, brilla («📐 ¡Tablero n listo!») y viene el
  siguiente; tras el quinto, directo al resultado, con confeti.
- **Abajo, tres controles iguales en una fila** (pedido del dueño):
  - **↩ Deshacer:** vuelve atrás la última jugada (dibujar, borrar un lote, borrar el tablero o la
    ayuda); gratis.
  - **🧹 Borrar:** pide un segundo toque («🧹 ¿Seguro?») y deja el tablero vacío («Borraste el
    tablero: ↩ Deshacer lo trae de vuelta.»). Apagado con el tablero vacío.
  - **🏳️ Rendirse:** pide un segundo toque («🏳️ ¿Seguro?»).
- **💡 Ayuda (−10), aparte**, más chica y debajo de la fila: no es un control del tablero. Pide un
  segundo toque («Toca de nuevo (−10)», 3 segundos) y pone un lote de la solución que no estaba bien
  puesto, con el borde punteado («💡 Ese lote va así.»).
- **Puntaje, sobre 100:** 12 por tablero resuelto y, solo con los cinco, hasta 40 por rapidez (40 en
  5 minutos o menos, 0 en 15 o más, en línea recta entre medio). Cada ayuda resta 10; nunca bajo 0.
- **El resultado:** una sola pantalla. El último tablero en chico (el del jugador si lo terminó; si se
  rindió, «Así se resolvía el tablero n.» con la solución), el sello («¡Todo loteado!» o «Te
  rendiste»), el puntaje, el desglose («📐 Tableros (5 de 5): +60.», «⏱ Rapidez (6:30): +34.», «💡 1
  ayuda: −10.»), el tiempo (si no los resolvió todos), compartir, otro tablero, el de hoy (si se jugó
  con semilla), volver al laboratorio y, tras una línea, el formulario de comentarios (D-265, D-268).
- **Compartir:** la tarjeta dice qué tableros resolvió («✅ 5×5  ✅ 6×6  ⬛ 7×7  ⬛ 7×7  ⬛ 8×8»), las ayudas y el
  tiempo, sin delatar la solución.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## El modo ⚡💧 Servicios (D-311, D-312)

Pedido del dueño («Utilities»; en la app, «Servicios»). Se elige en la portada con un selector de dos
opciones bajo el crédito, «🔢 Números» y «⚡💧 Servicios» (cada una de 46 px de alto; la elegida, en
amarillo). Al cambiar, cambian el lema («Lotes del mismo tamaño, cada uno con su ⚡ y su 💧.»), los
pasos y la demo: un 4×4 en lotes de 4, con «Lotes de 4 casillas» arriba, que se resuelve solo como la
de números. El celular recuerda el modo (`localStorage`, `juegos-de-salon:loteo:modo`) y el link lo
dice: `?mode=utilities` entra directo (y `?mode=numbers`, al de números). Los pasos:

1. 📐 Divide el tablero en lotes, todos del tamaño que dice arriba.
2. ⚡ Cada lote lleva un ⚡ y un 💧, ni más ni menos. Si un lote deja a un ⚡ sin su 💧, no va.
3. 👆 Arrastra de una esquina a otra para dibujar un lote; tócalo para borrarlo. Son 5 tableros;
   los 3 últimos, difíciles.

- **Las reglas:** en vez de números, la grilla trae ⚡ y 💧. Se divide entera en lotes rectangulares,
  todos del tamaño que dice «Lotes de n casillas» (arriba del tablero, junto al reloj), y cada lote
  lleva exactamente un ⚡ y un 💧. Solución única, que se deduce sin adivinar.
- **Cinco tableros:** 6×6 en lotes de 3 y 6×6 en lotes de 4 para calentar; 6×6 de 6 y dos 8×8 de 8,
  difíciles (D-312, pedido del dueño): ninguno muestra un lote obvio de entrada, piden deducciones más
  profundas y los íconos quedan cerca de los del lote vecino. La cuenta 3, 2, 1 dice «📐 Loteo ·
  ⚡💧 Servicios».
- **El aviso de los difíciles:** al empezar el tablero 3, el primero difícil, el aviso de arriba dice
  «Ahora, difíciles: piensa un paso adelante. Si un lote deja un ⚡ sin 💧, no va.» (solo ahí, no en
  los dos que siguen).
- **Los rechazos:** «Ese lote tiene 3 casillas; cada lote tiene 4.», «Le falta 💧.» y «Tiene dos ⚡:
  cada lote lleva uno.» (primero el tamaño, después lo que sobra, después lo que falta).
- **Todo lo demás es igual:** la medida en vivo, tocar para borrar, ↩ Deshacer, 🧹 Borrar,
  🏳️ Rendirse, la 💡 Ayuda, el reloj, el puntaje y el resultado, que dice «⚡💧 Servicios» sobre el
  sello. La tarjeta para compartir empieza con «⚡💧 Servicios»; «Otro tablero» y «El de hoy» llevan
  `mode=utilities`. La señal de uso cuenta la partida con `mode: 'servicios'`.
- **Sin 🌐:** se midió un tercer servicio, internet; da más tableros únicos pero más fáciles (D-311).

## Cómo funciona

- `engine.js`: `generar(semilla, { lado, dificil })` parte la grilla al azar (la primera casilla
  libre recibe un rectángulo elegido por su área: en los fáciles gustan las de 3 a 8, poco las de 2 y
  casi nada las de 1; en los difíciles, las de 4 a 10 y casi nada las de 1 y 2; tope 8, 9, 10 o 12
  según el tamaño), descarta particiones con muchos 1 (ninguno en los difíciles) o con pocos lotes
  grandes, y pone los números con `repartir`: cada uno en la casilla de su lote más lejos de los ya
  puestos, castigando las vecinas y, en los difíciles, premiando las que quedan lejos de las esquinas
  del lote (el orden de los lotes se baraja con Fisher-Yates, para que dé igual en todo navegador).
  Pide `resolver(t, 2)` (una sola solución) y `deducir(t)` (se resuelve sin adivinar); si no, prueba
  otro reparto (6 veces) y después otra partición. Los fáciles se quedan con el primero que sirve;
  los difíciles arman 8 y se quedan con el más difícil (más rondas de `deducir`, menos lotes a la
  vista de entrada).
  `deducir` resuelve como una persona: pone la pista a la que le queda un solo rectángulo que cabe y,
  si ninguna, obliga a una pista a cubrir la casilla libre que solo ella alcanza; devuelve
  `{ resuelto, rondas, deEntrada }`.
  `resolver` hace backtracking por pista, siempre la que tiene menos rectángulos posibles (de su
  área, que la contienen, sin otro número), y poda si una casilla libre ya no la puede cubrir nadie.
  `validar(t, r)` dice si un rectángulo vale (`sin-numero`, `dos-numeros` o `area`); `poner` agrega
  uno sacando los que pisa; `resuelto`, `pista` (la ayuda), `puntajePartida` y `tarjeta`.
  `generarEtapa(semilla, n)` usa `<semilla>:etapa-<n>`.
  El modo servicios: `generarServicios(semilla, { lado, tam, servicios, dificil, exige })` parte la
  grilla en lotes de `tam` (`partirIguales`, con vuelta atrás), pone un ícono de cada servicio en
  casillas distintas de cada lote con `ubicarIconos` (en los fáciles, al azar con Fisher-Yates; en los
  difíciles, de preferencia en el borde del lote que toca a otro, cerca de los íconos del vecino) y
  pide `resolverServicios(t, 2)` (cubrir la grilla con lotes posibles: del tamaño justo y con uno de
  cada servicio, que `lotesPosibles` cuenta con sumas acumuladas) y `deducirServicios`. Los fáciles se
  quedan con el primero que salga con las reglas simples. Los difíciles (D-312) sirven solo si no
  muestran ningún lote de entrada y piden al menos `exige` deducciones profundas (3, 4 y 6, en
  `ETAPAS_SERVICIOS`); de 12 que sirvan (hasta 6000 intentos) se quedan con el más difícil, y si
  ninguno sirve, con el mejor de reserva (uno sin lotes a la vista gana siempre).
  `deducirServicios(t, { avanzado })` repite las reglas simples (`propagar`): (1) un ícono o una
  casilla que solo cabe en un lote posible lo fija; (2) una casilla cuyos lotes posibles llevan todos
  el mismo ⚡ (o 💧) obliga al lote de ese ícono a cubrirla. Con `avanzado` (por omisión), cuando se
  traban mira un paso adelante: un lote que deja una casilla sin lote posible no va. Devuelve
  `{ resuelto, rondas, deEntrada, avanzadas, intermedias }`: `intermedias` cuenta las veces que hizo
  falta la regla (2) y `avanzadas` los lotes descartados mirando adelante; las dos son las
  deducciones profundas. Su tablero es `{ modo: 'servicios', lado, tam, servicios, iconos,
  solucion }`. `validar` lo atiende con `validarServicios` (`tam`, `sobra`, `falta`); `resuelto` pide
  lotes válidos que sumen la grilla, en los dos modos. `ETAPAS_SERVICIOS`, `ICONOS` y
  `generarEtapaServicios`; `tarjeta(hechas, ayudas, modo)`. Constantes: `ETAPAS`, `PUNTOS_ETAPA` (12),
  `BONO_RAPIDEZ` (40), `RAPIDO_S` (300), `LENTO_S` (900), `RESTA_AYUDA` (10) y `MAXIMO` (100).
- `game.js`: la portada, la partida y el resultado. El tablero tiene tres capas (el fondo
  cuadriculado, los lotes y los números) y el marco del arrastre encima; el arrastre es el de Rutas
  rotas (`pointerdown/move/up` con `setPointerCapture`). El nombre vive en `T.nombre`.
- `window.__loteo = { P, dibujar(r), tocar(f, c) }`: el estado, y dibujar un rectángulo o tocar una
  casilla por el mismo camino que el dedo (para las pruebas).
- `engine.test.mjs` revisa la validación, el resolvedor (una, dos y ninguna solución), que los
  tableros de cada etapa (200 de las fáciles, 80 de las difíciles) tengan una sola solución, se
  deduzcan sin adivinar, pasen la validación y se generen en menos de 400 ms, que los números casi
  nunca queden pegados, que las difíciles pidan más rondas y dejen menos lotes a la vista que las
  fáciles, la ayuda y el puntaje; `tools/e2e/plots/lab.mjs` juega de punta a punta (los tres rechazos,
  pintar y borrar, la ayuda, deshacer, Borrar con su segundo toque y Deshacer que lo trae de vuelta,
  los cinco tableros con la solución del motor, el resultado y rendirse). Con `ANCHO=320` corre a 320 px.
  El modo servicios: 120 tableros de cada etapa fácil y 40 de cada difícil, con lotes del tamaño
  justo y un ⚡ y un 💧, únicos, deducibles, en menos de 300 ms; las fáciles salen con las reglas
  simples, las difíciles no muestran lotes de entrada (85 % o más) y piden 3 o más deducciones
  profundas por tablero, y son más difíciles que las fáciles; `tools/e2e/plots/servicios.mjs` lo
  juega de punta a punta (el selector, que se recuerda y va en el link, los pasos, los tres rechazos,
  los cinco tableros, el aviso del tablero 3 y el final).

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
- El arrastre es el de Rutas rotas, no `assets/js/arrastre.js` (C-8): dibuja un rectángulo sobre la
  grilla, no lleva una pieza de un lugar a otro, y soltar sí juega (como en Rutas rotas: deshacer es
  gratis).
- Las casillas del 8×8 miden unos 42 px a 375 px de ancho y algo menos a 320 px; el gesto es
  arrastrar sobre la grilla entera, no tocar una casilla chica.
