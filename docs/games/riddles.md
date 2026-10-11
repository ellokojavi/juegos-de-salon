# 🤔 Acertijos (prototipo del laboratorio)

Cinco acertijos con truco, al estilo de *Brain Test: Tricky Puzzles* (Unico Studio, 2019) y sus
clones como *Brainstorm Test: Tricky Puzzle*: la respuesta obvia casi nunca es la buena. Cada
acertijo es un minijuego con su propio gesto y un narrador que se burla un poco (D-269).

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/riddles/`, en el laboratorio (no está en el menú ni en
  los buscadores). Id `acertijos` en la señal de uso del panel.
- **Para quién:** uno solo, 1–3 min. En los cuatro idiomas, con su propio diccionario en `game.js`.
- **Estado:** prototipo para que lo prueben amigos y comenten. Si gusta, la idea es un "acertijo del
  día" con acertijos escritos a mano (para Uno al día o una ronda corta de La Copa).

## Los cinco acertijos

| # | Pregunta | La trampa | Respuesta | Gesto |
|---|---|---|---|---|
| 1 | Toca el animal más grande. | El ratón y la hormiga están dibujados enormes | 🐘, dibujado chiquito | tocar |
| 2 | ¿Cuántos cuadrados hay? | Una grilla de 2 × 2 parece 4 | 5 (el de afuera también) | elegir |
| 3 | Encuentra la llave. | Las cosas de la pieza no la tienen | Está debajo de la pregunta: se arrastra la pregunta | arrastrar |
| 4 | Tapa el sol. | Tocar el sol "quema" | Una nube se asoma por el borde: se arrastra sobre el sol | arrastrar |
| 5 | ¿Qué pesa más? (1 kg de plumas o de piedras) | Las piedras "pesan más" | Pesan lo mismo | elegir |

**Ninguno depende del idioma:** la trampa está en el dibujo o en la pantalla, nunca en un juego de
palabras (el "arrastra la palabra *negra*" de Brain Test no se traduce). Así se juegan igual en los
cuatro idiomas (C-3).

## Reglas

- La respuesta obvia (y cualquier otra equivocada) cuenta como **error**, con un comentario del
  narrador 😏. La buena trae un "¡Bien!" al azar 😎 y el botón **Siguiente**.
- **💡 Pista** dice por dónde va el truco y queda anotada.
- **Resultado:** cuántos se resolvieron sin pista, los errores y el tiempo, con una casilla por
  acertijo: 🟩 sin pista ni error, 🟨 con pista, 🟥 con algún error. Se comparte con
  `botonResultadoSolo` y termina con el formulario "¿Qué te pareció?" abierto.
- **💬 Dejar un comentario** va al final de la portada y de cada acertijo (D-268); abre el formulario
  en una capa con el acertijo, los errores y las pistas en el contexto.

## Archivos

```
public/labs/riddles/index.html · style.css · game.js (todo: textos, acertijos y pantalla)
tools/e2e/riddles/lab.mjs   los cinco con el puntero de verdad, a 320 px y en los cuatro idiomas
```

Arrastrar aquí es mover libre en dos dimensiones (la pregunta, la nube), no soltar en una fila de
destinos: por eso `game.js` trae su propio `arrastrable()`, de diez líneas, en vez de `arrastre.js`.
La partida no se guarda: dura un par de minutos.

## Excepciones a los cánones

- **C-3 (los textos en `i18n.js` o `rules.js`):** el prototipo trae su diccionario en `game.js`, en
  los cuatro idiomas, como lo hizo El caso en su prototipo (D-256). Si sale del laboratorio, sus
  textos pasan al lugar de siempre.
