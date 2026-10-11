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

## Cómo se juega

- **Tablero:** 12 palabras: 9 agentes (3 pistas de 3), 2 neutrales y 1 asesino.
- **Pistas:** llegan de a una, «MAR · 3». Tocar un agente de la pista suma; uno de otra pista
  también suma y no corta. Un neutral (−15) o el asesino (−40) cortan la pista y pasa la
  siguiente. "⏭️ Siguiente pista" se planta; en la última dice "🏁 Terminar".
- **Puntaje:** 100 × agentes encontrados / 9, menos las restas, nunca bajo 0.
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos. "🔁 Otro
  tablero" abre uno al azar con su semilla en el link, para compartirlo.
- **El final:** el puntaje con su desglose, la tarjeta de emojis para compartir (🟩 agente, 🟨 el
  que faltó, 🟥 neutral tocado, 💀 asesino tocado), el tablero entero destapado con la pista de
  cada agente, y el formulario de comentarios al final (D-265, D-268).

## Cómo funciona

- `pistas.js`: 40 pistas, cada una con 9 palabras que van con ella (`si`) y 3 tentaciones
  (`casi`). Una palabra nueva se piensa como jugador: que la asociación se vea sin explicarla.
- `engine.js`: `generar(semilla)` elige 3 pistas que no se pisen (ninguna es palabra o tentación de
  otra), 3 agentes de cada una que no sean de otra elegida, el asesino de las tentaciones (y que no
  sea agente de ninguna) y los neutrales de otras pistas. Ninguna pista aparece en su propio tablero.
  `estado(t, jugadas)` reconstruye la partida desde las jugadas (`{i}` o `{pasar:true}`).
- `engine.test.mjs` revisa la lista y 300 tableros; `tools/e2e/agents/lab.mjs`, la partida entera.

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
