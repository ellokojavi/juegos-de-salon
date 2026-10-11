# 🔐 La clave (prototipo del laboratorio)

Un código de 4 cifras repartido entre una **base fija** y **4 cartas transparentes**. Cada carta
tiene unos pocos trazos de siete segmentos y aparece girada o volteada al azar. Hay que ponerlas
todas sobre la base y orientar cada una hasta que los trazos formen las cuatro cifras, y escribir el
código en el teclado (D-270). Como las tarjetas transparentes de los juegos de escape.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/code/`, en el laboratorio. Id `clave` en la señal de uso.
- **Para quién:** uno solo. En los cuatro idiomas, con su diccionario en `game.js`.
- **Cartas:** 4, ninguna viene derecha. Hubo un modo de 8 y el dueño lo sacó: demasiado complejo.
- **Estado:** prototipo, sin publicar: la v1 de dos figuras se probó y el dueño pidió más cartas.

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
  combinación de orientaciones sin choques que forma cuatro cifras es la del código (lo revisa con
  las 256 combinaciones).
- **El código:** el teclado de Toque y Fama (`teclado.js`). Uno equivocado cuenta como intento
  fallido; el bueno muestra "🔓 ¡Abierto!", el tiempo y los intentos, compartir,
  "🔁 Otra clave" y el formulario "¿Qué te pareció?" al final. **💬 Dejar un
  comentario** va al final de la portada y del juego (D-268).

## La onda espacial

Animaciones pasivas, que no dicen nada del juego (pedido del dueño, "una onda más espacial"):
detrás de la base un cielo de estrellas que deriva despacio y una nebulosa violeta y celeste que
respira; los trazos puestos laten como luces, cada carta a su ritmo, y los de la base titilan apenas;
las cartas de la bandeja flotan en gravedad cero, cada una con su desfase, y un brillo tornasol las
cruza de vez en cuando. Todo en `style.css`; con movimiento reducido, quietas.

## Archivos

```
public/labs/code/index.html · style.css · game.js (pantalla y textos)
public/labs/code/engine.js · engine.test.mjs (orientaciones, reparto, lectura única; sin DOM)
tools/e2e/code/lab.mjs   poner, elegir, girar, voltear y quitar cartas; los choques rayados; leer y escribir el código, en los cuatro idiomas a 320 px
```

## Excepciones a los cánones

- **C-3 (los textos en `i18n.js` o `rules.js`):** el prototipo trae su diccionario en `game.js`, en
  los cuatro idiomas, como lo hizo el de El caso (D-256).
