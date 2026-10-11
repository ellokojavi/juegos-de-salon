# 🔐 La clave (prototipo del laboratorio)

Dos figuras transparentes esconden un código de 4 cifras: cada una tiene solo parte de los trazos y
ninguna lo dice sola. Hay que poner una encima de la otra con la misma orientación —girarla y
voltearla hasta que los bordes calcen— para que los trazos se junten y aparezcan las cifras, y
escribir el código en el teclado (D-270). Como las tarjetas transparentes de los juegos de escape.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/code/`, en el laboratorio. Id `clave` en la señal de uso.
- **Para quién:** uno solo, 1–2 min. En los cuatro idiomas, con su diccionario en `game.js`.
- **Estado:** prototipo con **dos figuras**, para ver si gusta. Lo que viene: tres figuras (una
  sola no basta con ninguna otra), formas que no son tarjetas, y palabras en vez de cifras.

## Cómo funciona

- **Las figuras:** una tarjeta rosada fija arriba y una celeste móvil abajo, del mismo tamaño, con
  la esquina de arriba a la izquierda cortada. El corte es la pista: la celeste aparece girada o
  volteada, con su corte en otra esquina.
- **Las cifras:** de siete segmentos, cuatro por tarjeta. Cada cifra reparte sus trazos entre las
  dos figuras (al menos uno en cada una).
- **Mover:** la celeste se arrastra libre; soltada cerca de la rosada, se encaja justo encima.
  **↻ Girar** la da media vuelta y **⇋ Voltear** la da vuelta de lado. Con las dos se llega a las
  cuatro orientaciones (I, R, H, V: un grupo en que cada una es su inversa y R·H = V).
- **Abrir:** encajada y con la orientación buena, los trazos se ponen blancos y brillan, el borde se
  pone dorado y dice "¡Calzan! Ahora lee el código." Con otra orientación los trazos se cruzan sin
  formar el código (a veces forman una cifra falsa, que despista).
- **El código:** el teclado de Toque y Fama (`teclado.js`). Uno equivocado cuenta como intento
  fallido; el bueno muestra "🔓 ¡Abierto!", el tiempo y los intentos, compartir, "🔁 Otra clave" y
  el formulario "¿Qué te pareció?" al final. **💬 Dejar un comentario** va al final de la portada y
  del juego (D-268).

## Archivos

```
public/labs/code/index.html · style.css · game.js (pantalla y textos)
public/labs/code/engine.js · engine.test.mjs (las orientaciones, el reparto y la lectura, sin DOM)
tools/e2e/code/lab.mjs   arrastrar, encajar, girar y voltear con el puntero de verdad; el teclado; en los cuatro idiomas a 320 px
```

El arrastre es libre en dos dimensiones, como en los Acertijos (D-269): `game.js` trae su propio
`arrastrable()` en vez de `arrastre.js`. La clave es al azar cada vez y no se guarda.

## Excepciones a los cánones

- **C-3 (los textos en `i18n.js` o `rules.js`):** el prototipo trae su diccionario en `game.js`, en
  los cuatro idiomas, como los Acertijos y el prototipo de El caso.
