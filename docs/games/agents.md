# 🕵️ Agentes (prototipo del laboratorio, en Proyectos activos)

Un *Codenames* mini para uno solo (D-286): el juego da una pista con su número y el jugador
encuentra a sus agentes entre 12 palabras, sin tocar las neutrales ni al asesino. **Inspirado en
[Codenames](https://czechgames.com/en/codenames/), de Vlaada Chvátil (Czech Games Edition)**, y lo
dice en la portada, en el final y en el laboratorio.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/agents/`, en el laboratorio (con la llave de cada
  persona, D-281, D-284). Id `agentes` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo): las pistas son palabras de Chile.
- **Estado:** proyecto activo desde v0.157.0, para probarlo con amigos. Si gusta, la idea es que
  entre a La Copa.

## Portada

El título con un 🕵️ que se mece y un sello rojo de **Clasificado** que cae al cargar. Debajo, una
demostración que juega sola: llega una pista que se descifra letra a letra («MAR · 3»), una 🔍
recorre las cartas y destapa a sus 3 agentes, y al final se destapa el asesino, que se parece a la
pista (RÍO). Después, otra pista (NOCHE, CIRCO) y vuelve a empezar. Con movimiento reducido queda la
primera, resuelta. Luego el lema, los tres pasos y Empezar.

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
- **Puntaje:** 100 × agentes encontrados / 9, menos las restas, nunca bajo 0.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos. "🔁 Otro
  tablero" abre uno al azar con su semilla en el link, para compartirlo.
- **El final:** un sello grande según cómo salió: **¡Misión cumplida!** en verde, con confeti
  (70 o más); **Misión a medias** en amarillo; **Misión fracasada** (menos de 35) o **Te descubrió
  el asesino** en rojo, con destello y una falla de transmisión cada tanto. El puntaje sube desde 0,
  y después vienen su desglose, la trampa explicada («💀 Caíste con RÍO: parecía de MAR…», o
  «Esquivaste al asesino…» si no lo tocaste; bajo la carta del asesino, «≈ MAR»), el tablero entero destapado con la pista de
  cada agente, y el formulario de comentarios al final (D-265, D-268).
  La tarjeta de emojis (🟩 agente, 🟨 el que faltó, 🟥 neutral tocado, 💀 asesino tocado) va solo
  en el mensaje de compartir: en pantalla repetía el tablero.

## Cómo funciona

- `pistas.js`: 40 pistas, cada una con 9 palabras que van con ella (`si`) y 3 tentaciones
  (`casi`). Una palabra nueva se piensa como jugador: que la asociación se vea sin explicarla.
- `engine.js`: `generar(semilla)` elige 3 pistas que no se pisen (ninguna es palabra o tentación de
  otra), 3 agentes de cada una que no sean de otra elegida, el asesino de las tentaciones (y que no
  sea agente de ninguna; su carta lleva `tienta`, la pista a la que se parece) y los neutrales de otras pistas. Ninguna pista aparece en su propio tablero.
  `estado(t, jugadas)` reconstruye la partida desde las jugadas (`{i}` o `{pasar:true}`).
- `engine.test.mjs` revisa la lista y 300 tableros; `tools/e2e/agents/lab.mjs`, la partida entera.

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
