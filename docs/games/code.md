# 🔐 La clave (prototipo del laboratorio)

Un código de 4 cifras repartido entre una **base fija** y **4 u 8 cartas transparentes**. Cada carta
tiene unos pocos trazos de siete segmentos y aparece girada o volteada al azar. Hay que ponerlas
todas sobre la base y orientar cada una hasta que los trazos formen las cuatro cifras, y escribir el
código en el teclado (D-270). Como las tarjetas transparentes de los juegos de escape.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/code/`, en el laboratorio. Id `clave` en la señal de uso.
- **Para quién:** uno solo. En los cuatro idiomas, con su diccionario en `game.js`.
- **Modos:** **4 cartas** (ninguna viene derecha) y **8 cartas** (cada una con una orientación al
  azar, también la derecha). Se elige en la portada; al terminar se ofrece el otro.
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
- **Una sola lectura:** el motor arma la clave de modo que, con todas las cartas puestas, la única
  combinación de orientaciones que forma cuatro cifras es la del código (lo revisa con las 4ⁿ
  combinaciones; con 8 cartas tarda unos 20 ms).
- **El código:** el teclado de Toque y Fama (`teclado.js`). Uno equivocado cuenta como intento
  fallido; el bueno muestra "🔓 ¡Abierto!", las cartas, el tiempo y los intentos, compartir,
  "🔁 Otra clave", el otro modo y el formulario "¿Qué te pareció?" al final. **💬 Dejar un
  comentario** va al final de la portada y del juego (D-268).

## Archivos

```
public/labs/code/index.html · style.css · game.js (pantalla y textos)
public/labs/code/engine.js · engine.test.mjs (orientaciones, reparto, lectura única; sin DOM)
tools/e2e/code/lab.mjs   poner, elegir, girar, voltear y quitar cartas; leer y escribir el código, con 4 y 8, en los cuatro idiomas a 320 px
```

## Excepciones a los cánones

- **C-3 (los textos en `i18n.js` o `rules.js`):** el prototipo trae su diccionario en `game.js`, en
  los cuatro idiomas, como lo hizo el de El caso (D-256).
