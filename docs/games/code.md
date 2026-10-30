# 🔐 La clave (prototipo del laboratorio, en La Bodega)

Un código de 5 cifras repartido entre una **base fija** y **4 cartas transparentes**. Cada carta
tiene unos pocos trazos de siete segmentos y aparece girada o volteada al azar. Hay que ponerlas
todas sobre la base y orientar cada una hasta que los trazos formen las cinco cifras, y escribir el
código en el teclado (D-270). Como las tarjetas transparentes de los juegos de escape.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/code/`, en el laboratorio. Id `clave` en la señal de uso.
- **Para quién:** uno solo. En los tres idiomas, con su diccionario en `game.js`.
- **Modos:** 🔢 Cifras (en los tres idiomas) y 🔤 Palabra (solo en español, más abajo).
- **Cartas:** 4, ninguna viene derecha. Hubo un modo de 8 y el dueño lo sacó: demasiado complejo.
- **Estado:** prototipo en el laboratorio desde v0.147.0, aprobado por el dueño; no prosperó y
  desde D-280 está en La Bodega, jugable pero sin trabajarse; ahí se ve solo su título y un
  toque abre la descripción y el botón (v0.168.2). Sin una llave del laboratorio (cada
  persona tiene la suya) no se abre (D-281, D-284). Empezó como una v1
  de dos figuras que se arrastraban una sobre otra; la historia está en D-270.

## Portada

El título con el degradé que se mueve (`.rainbow`) y un 🔐 que se mece, una ilustración en que las
cuatro cartas, encima de la base, prueban combinaciones a toda velocidad (giran, se voltean,
cambian de cara) mientras los trazos blancos de la base saltan al azar (v0.147.2); todo se va
acomodando hasta formar CLAVE (en los otros idiomas, un código), que brilla en sus trazos de
display; la clave queda dibujada con sus trazos y no se escribe como texto, porque el título ya la
dice (v0.147.1); después vuelve a empezar, y "¿Cómo se juega?" en tres pasos con su ícono. En el juego, el título va
arriba y "¿Cómo se juega?" plegado al final.

## Cómo funciona

- **La base** tiene unos pocos trazos blancos y no se mueve: dice cuál es el derecho, así que el
  código no se puede leer "dado vuelta".
- **La bandeja:** una miniatura por carta, con su color y su número. Tocar una carta la pone sobre
  la base y la elige (borde brillante, y sus trazos más gruesos en la base). **↻ Girar** la da media
  vuelta, **⇋ Voltear** la da vuelta de lado y **✕ Quitar** la saca de la base. Con girar y voltear
  se llega a las cuatro orientaciones (I, R, H, V: cada una es su inversa y R·H = V).
- **Nada avisa que una carta quedó bien:** se sabe leyendo, cuando los trazos forman cifras. Con
  cartas mal puestas a veces aparece una cifra falsa, que despista.
- **Un trazo encima de otro no vale:** cada trazo del código está en una sola capa (la base o una
  carta), así que la solución nunca tiene choques. Cuando dos capas ponen un trazo en el mismo
  lugar, ese trazo se ve **rayado en diagonal con los colores de las capas que chocan** (blanco si
  una es la base), con un borde oscuro y un brillo que respira despacio: se nota que hay dos cosas
  ahí, sin texto ni rojo (pedido del dueño: "se ve visualmente que así no es"). Dice que algo está
  mal y entre qué cartas, no cuál hay que mover.
- **Una sola lectura:** el motor arma la clave de modo que, con todas las cartas puestas, la única
  combinación de orientaciones sin choques que forma cinco cifras es la del código (lo revisa con
  las 256 combinaciones).
- **El código:** el teclado de Toque y Fama (`teclado.js`). Uno equivocado cuenta como intento
  fallido; el bueno muestra "🔓 ¡Abierto!", el tiempo y los intentos, compartir,
  "🔁 Otra clave" y el formulario "¿Qué te pareció?" al final. **💬 Dejar un
  comentario** va al final de la portada y del juego (D-268).

## Palabra (solo en español, por ahora)

El modo que pidió el dueño cuando el de cifras se volvió mecánico ("se hace bastante aburrido una
vez que ya se entiende el mecanismo"): una palabra de 5 letras de **catorce segmentos** (como las
calculadoras viejas), de las de Toque y Fama: Palabra sin Ñ, repartida entre la base y 4 cartas de
**dos caras**. La cara buena tiene trazos de la palabra; la otra, trazos que despistan (de las
mismas letras en otro lugar y otros sueltos). **⇋ Voltear** cierra la carta de lado y la abre con la
otra cara (dos puntitos bajo la miniatura dicen cuál se ve); **↻ Girar** le da media vuelta.

- **Leer a medias ya sirve:** "LL_VE" es LLAVE, así que se puede arriesgar antes de terminar.
- **Mirar una carta no dice lo que tiene la otra cara:** hay que voltearla, y el método de descartar
  posiciones mirando las miniaturas pierde su certeza.
- Igual que en cifras: un trazo encima de otro se ve rayado, y con todas las cartas puestas la única
  lectura sin choques es la palabra. Motor: `engine-palabra.js` (`engine-palabra.test.mjs`); el
  teclado es el de letras de Toque y Fama: Palabra.

## La onda espacial

Animaciones pasivas, que no dicen nada del juego (pedido del dueño, "una onda más espacial"):
detrás de la base un cielo de estrellas que deriva despacio y una nebulosa violeta y celeste que
respira; los trazos puestos laten como luces, cada carta a un ritmo al azar, y los de la base titilan
apenas; las cartas de la bandeja flotan en gravedad cero, cada una con su ritmo, altura y vaivén al
azar, y un brillo tornasol las cruza a intervalos que cambian en cada pasada (`brillosAlAzar`), así
que nunca se repite igual. Todo en `style.css`; con movimiento reducido, quietas.

## Archivos

```
public/labs/code/index.html · style.css · game.js (pantalla y textos)
public/labs/code/engine.js · engine.test.mjs (cifras: orientaciones, reparto, lectura única; sin DOM)
public/labs/code/engine-palabra.js · engine-palabra.test.mjs (palabra: catorce segmentos y dos caras)
tools/e2e/code/lab.mjs   poner, elegir, girar, voltear y quitar cartas; los choques rayados; leer y escribir el código, en los tres idiomas a 320 px
```

## Excepciones a los cánones

- **C-3 (los textos en `i18n.js` o `rules.js`):** el prototipo trae su diccionario en `game.js`, en
  los tres idiomas, como lo hizo el de El caso (D-256).
