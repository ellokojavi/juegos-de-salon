# 🕵️ Agentes (prototipo del laboratorio, en Juegos en prueba)

Un *Codenames* mini para uno solo (D-286, D-287): el juego da una pista con su número y el jugador
encuentra a sus agentes entre 15 palabras, sin tocar las neutrales ni al asesino. **Inspirado en
[Codenames](https://czechgames.com/en/codenames/), de Vlaada Chvátil (Czech Games Edition)**, y lo
dice en la portada y en el laboratorio (en el resultado estuvo hasta v0.160.0: el dueño lo sacó, D-288).

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/agents/`, en el laboratorio (con la llave de cada
  persona, D-281, D-284). Id `agentes` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo): las pistas son palabras de Chile.
- **Estado:** proyecto activo desde v0.157.0, para probarlo con amigos. Si gusta, la idea es que
  entre a La Copa.

## Portada

El título con un 🕵️ que se mece y un sello rojo de **Clasificado** que cae al cargar. Debajo, el
cuento en una línea, que es lo que le da sentido a «agente» y a «asesino» (D-288): «Cada palabra es el
nombre en clave de un espía. Con las pistas, encuentra a los tuyos.» Después el crédito y una
demostración que juega sola: llega una pista que se descifra letra a letra («MAR · 3»), una 🔍
recorre las cartas y destapa a sus 3 agentes, y al final se destapa el asesino, que se parece a la
pista (RÍO). Después, otra pista (NOCHE, CIRCO) y vuelve a empezar. Con movimiento reducido queda la
primera, resuelta. Luego los tres pasos (desde v0.167.1, U-36) y Empezar:

1. 🕵️ Toca las palabras que van con la pista: «MAR · 3» son 3. Llegan 4 pistas, de a una.
2. ⚠️ Evita las 3 neutrales (−15) y al asesino (−40): se parecen a una pista y la cortan.
3. 📌 Si dudas de una carta, mantenla apretada para marcarla, o pasa de pista. Un agente de otra pista también suma.

Los números salen de las constantes de `engine.js` (`CUANTAS`, `NEUTRALES`, `RESTA_NEUTRAL`, `RESTA_ASESINO`).

## Cómo se juega

- **Al empezar:** la cuenta 3, 2, 1, ¡A jugar! de La Copa (D-105, `assets/js/cuenta-regresiva.js`);
  el tablero se arma con el "¡A jugar!" y el tiempo corre desde ahí.

- **Tablero:** 15 palabras en 3×5: 11 agentes en 4 pistas (tres de 3 y una de 2, «· 2»; cuál cambia
  cada tablero), 3 neutrales y 1 asesino. Las neutrales y el asesino salen de las tentaciones de las
  pistas: las 4 cartas que no son tuyas se parecen a alguna.
- **Pistas:** llegan de a una, «MAR · 3». Tocar un agente de la pista suma; uno de otra pista
  también suma y no corta. Un neutral (−15) o el asesino (−40) cortan la pista y pasa la
  siguiente. "⏭️ Siguiente pista" se planta; en la última dice "🏁 Terminar", que si faltan agentes pregunta primero ("¿Terminas igual?", U-15).
- **Marcas:** mantener apretada una carta (450 ms, el gesto de las notas de Toque y Fama: no se
  inventa UX, D-102) la marca sin
  destaparla: 📌 sospecha, otra vez 🚫 descartada, otra vez sin marca. Una 🚫 no se destapa al
  tocarla (se sacude), para no tocar por error al asesino que ya se adivinó. Mientras se mantiene
  apretada, el borde se va llenando (se ve venir la marca), y al marcar la línea de avisos lo dice
  («📌 Marcada, sin destapar. Tócala para destaparla.», «🚫 Descartada: así no la destapas por
  error.» o «Sin marca.»): un toque que duraba de más marcaba en silencio y la carta parecía
  elegida, así que la pista no avanzaba y no se entendía por qué. La sospecha va sin relleno, solo
  el borde punteado amarillo. Bajo el tablero, una línea lo explica hasta la primera marca. La señal de uso cuenta cuántas marcas se hicieron.
- **Colores por pista:** cada pista tiene su color (verde, celeste, rosado, violeta; ni amarillo,
  que es de las marcas, ni rojo, que es del asesino). El cartel de la pista en curso lo lleva, y cada
  agente destapado toma el de su pista, también si se encontró antes de tiempo. Los de pistas ya
  cerradas se apagan: no cuentan para la jugada actual (pedido del dueño). El tablero final usa los
  mismos colores.
- **Entre pistas:** a la pista que se cierra le cae un sello (**Completa** en verde, **Cortada**
  en rojo, **Pasada** en amarillo), se va girando hacia atrás y la siguiente llega girando, con su
  palabra descifrándose. Un agente brilla al destaparse, un neutral se sacude, y el asesino sacude el
  tablero con un destello rojo en la pantalla. Al terminar, las cartas que nadie tocó se destapan
  de a una antes del resultado.
- **Puntaje:** 100 × agentes encontrados / 11, menos las restas, nunca bajo 0.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos. Sus pistas salen
  de un calendario (D-288): recorre las 118 en vueltas barajadas y una pista no vuelve antes de 15
  días, para que quien juega todos los días no vea las mismas. "🔁 Otro tablero" abre uno al azar con
  su semilla en el link, para compartirlo.
- **El final:** un sello grande según cómo salió: **¡Misión cumplida!** en verde, con confeti
  (70 o más); **Misión a medias** en amarillo; **Misión fracasada** (menos de 35) o **Te descubrió
  el asesino** en rojo, con destello y una falla de transmisión cada tanto. El puntaje sube desde 0,
  y después vienen su desglose, la trampa explicada («💀 Caíste con RÍO: parecía de MAR…», o
  «Esquivaste al asesino…» si no lo tocaste), el tablero entero destapado con la pista de cada
  agente y, bajo el asesino y cada neutral, la pista a la que se parecía («≈ MAR»), plegado en el
  panel «🗺️ El tablero entero» para que los botones del final se vean sin desplazar (C-8: los bloques
  largos, colapsados); el pliegue lleva `data-tablero`, así que el aire hasta los botones es el de D-309, y el formulario de comentarios al final (D-265, D-268), separado del juego por una línea.
  La tarjeta de emojis (🟩 agente, 🟨 el que faltó, 🟥 neutral tocado, 💀 asesino tocado) va solo
  en el mensaje de compartir: en pantalla repetía el tablero.

## Cómo funciona

- `pistas.js`: 118 pistas, cada una con 9 o 10 palabras que van
  con ella (`si`) y 3 tentaciones (`casi`): 100 de cosas concretas (`CLASICAS`: 40 desde D-286 y
  60 desde D-288) y 18 de ideas (`ABSTRACTAS`: MIEDO, SUERTE, LIBERTAD…, pedido de Cris en #383,
  que aprobó el dueño en #387), donde las palabras evocan la idea sin ser de su rubro (SUERTE →
  TRÉBOL, SIETE; tienta GATO). Las de ideas entran al calendario el 16 de octubre de 2026
  (`ABSTRACTAS_DESDE`), barajadas con la cola que quedaba: los días de antes no cambian. «Otro
  tablero» las usa desde que se publicaron (los links con `?seed=` de antes abren otro tablero). Una palabra nueva se piensa como jugador: que la asociación se vea sin explicarla.
- `engine.js`: `pistasDelDia(n)` es el calendario: camina día a día desde el 1 de octubre de 2026 con
  una cola de vueltas barajadas (`vuelta:<k>`) y deja fuera las pistas de los últimos `SIN_REPETIR`
  (15) días; `generar` la usa para las semillas `dia:<fecha>` y elige al azar si un día no se arma.
  Una pista vuelve entre 16 y 37 días después, 25 en promedio.
  `generar(semilla)` elige 4 pistas que no se pisen (ninguna es palabra o tentación de
  otra) y, al azar, la que lleva un agente menos; los agentes de cada una (3, o 2 la corta) que no
  sean de otra elegida; el asesino de las tentaciones, que no sea agente de ninguna, y los 3
  neutrales también de las tentaciones, de preferencia de otra pista que la del asesino. El asesino
  y los neutrales llevan `tienta`, la pista a la que se parecen. Ninguna pista aparece en su propio
  tablero. Las cantidades son constantes (`POR_PISTA`, `CUANTAS`, `CORTAS`, `NEUTRALES`) y los
  textos de la portada las toman de ahí.
  `estado(t, jugadas)` reconstruye la partida desde las jugadas (`{i}` o `{pasar:true}`).
- `engine.test.mjs` revisa la lista y 300 tableros (cada pista con los agentes que dice, 11 en
  total, y que el asesino y las neutrales tienten a la pista que dicen), y un año de tableros del
  día (todos con las pistas del calendario, ninguna antes de 15 días, todas en el año, ninguna de ideas antes de su día y varias en sus dos primeras semanas); `tools/e2e/agents/lab.mjs`, la partida entera.

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
