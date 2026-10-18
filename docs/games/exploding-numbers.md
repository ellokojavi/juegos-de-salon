# 💥 Números explosivos (prototipo del laboratorio, en Juegos en prueba)

Un solitario de números para uno solo (D-297): en una grilla de 9 columnas con números del 1 al 9 se
hacen estallar de a pares dos números **iguales o que suman 10**, si están juntos en línea, hasta
dejar el tablero limpio. Las reglas son las del juego de lápiz y papel *Take Ten*, del que viene
Number Match; las explosiones las pidió el dueño. **Inspirado en
[Number Match](https://easybrain.com/numbermatch), de Easybrain**, y lo dice en la portada y en el
laboratorio.

## Resumen

- **Dónde:** `https://juegosdesalon.cl/labs/exploding-numbers/`, en el laboratorio (con la llave de
  cada persona, D-281, D-284). Id `numeros-explosivos` en la señal de uso.
- **Para quién:** uno solo. Solo en español (es un prototipo).
- **Estado:** proyecto activo desde v0.168.0, para probarlo con amigos.

## Portada

El título con un 💥 que late, el lema («Haz estallar los números de a pares hasta dejar el tablero
limpio.»), el crédito y un tablero chico de 2 filas que se juega solo, par por par en el orden del
motor, hasta «¡Limpio!» (sin 💥: el título ya lo tiene), grande y al centro del espacio del tablero, que conserva su alto de 2 filas (pedido del dueño); después sigue con otro (con movimiento reducido queda quieto). Después
los tres pasos, «📅 El tablero de hoy es el mismo para todos.» (sin `?seed=`) y «💥 Empezar», que
pasa por la cuenta 3, 2, 1 compartida (`assets/js/cuenta-regresiva.js`, «¡A estallar!»). Los pasos:

1. 💥 Toca dos números iguales (7 y 7) o que sumen 10 (4 y 6): estallan.
2. ↔️ Deben estar en línea (de lado, arriba, abajo o en diagonal) o al final de una fila y al inicio
   de la siguiente. Lo estallado no estorba.
3. ➕ ¿Sin pares? ➕ copia abajo los que quedan (3 veces). Cada ➕ sin usar suma 10.

La tarjeta del laboratorio: «Inspirado en Number Match: haz estallar de a pares los números iguales o
que suman 10, si están juntos en línea, hasta dejar el tablero limpio. Si te quedas sin pares, ➕
copia abajo los que quedan.».

## Cómo se juega

- **Tablero:** 36 números en 4 filas de 9. Cada número lleva en el borde el color de su familia (1 y
  9, 2 y 8, 3 y 7, 4 y 6, y el 5). Arriba, «Quedan n números».
- **Elegir:** se toca un número (queda marcado) y después otro. Tocar el mismo lo suelta.
- **Juntos en línea:** de lado, de arriba abajo o en diagonal, con solo casillas estalladas entre
  medio (lo estallado no estorba), o en el orden de lectura: el último de una fila con el primero de
  la siguiente, también saltando estallados.
- **Si no se unen:** los dos tiemblan, dice por qué y se sueltan los dos, para empezar la jugada de
  nuevo (pedido del dueño: antes quedaba elegido el segundo): «3 y 4 no son iguales
  ni suman 10.», «Hay números entre medio: haz estallar esos primero.» o «No están en línea: de lado,
  arriba o en diagonal.».
- **Si se unen:** estallan con una onda, un destello, un 💥 de historieta, chispas de su color y
  pedazos del número, y el tablero tiembla.
- **Una fila estallada entera se va:** explota de punta a punta y se aplasta («💥 ¡Fila!», o
  «💥 ¡2 filas!»); las de abajo suben.
- **➕ Agregar (n):** copia al final, en orden, los números que quedan; 3 veces por partida, y sin
  ninguno dice «➕ No quedan». Con pares a la vista pide un segundo toque («Hay pares: ¿seguro?», 3
  segundos); sin pares, el botón llama la atención y el aviso dice «💥 No quedan pares: usa ➕.».
- **💡 Ayuda (−10):** pide un segundo toque («Toca de nuevo (−10)», 3 segundos) y marca el par más
  cercano que se puede hacer estallar («💡 Esos dos estallan juntos.»); mientras ese par siga en el
  tablero, «💡 Ver la ayuda» lo vuelve a marcar sin cobrar.
- **🏳️ Rendirse:** pide un segundo toque («🏳️ ¿Seguro?»).
- **El final:** una sola pantalla, como en los otros juegos: al terminar aparece de inmediato el
  resumen (pedido del dueño). Al limpiarlo todo, tres estallidos grandes salen del puntaje, con confeti
  («¡Limpio!»). Sin pares ni ➕, se acaba («Sin jugadas», y el desglose dice «No quedan pares ni ➕.»).
- **Puntaje, sobre 100:** limpiar vale 70 y cada ➕ sin usar 10. Si no se limpia (al rendirse o sin
  jugadas), la parte estallada de los 70, contando lo agregado con ➕. Cada ayuda resta 10; nunca bajo 0.
- **El resultado:** el sello (¡Limpio!, Sin jugadas o Te rendiste), el puntaje, el desglose
  («💥 Tablero limpio: 70.», «➕ Sin usar: 2 × 10 = 20.», o «🧹 Estallaste el 40 %: 28 de 70.», y
  «💡 1 ayuda: −10.»), el tiempo, compartir, otro tablero, el de hoy (si se jugó con semilla), volver
  al laboratorio y, tras una línea, el formulario de comentarios (D-265, D-268).
- **Compartir:** la tarjeta dice si quedó limpio («✨ Tablero limpio» o «🧹 40 % estallado»), los ➕
  usados («➕➕⬜ 2 de 3 ➕») y las ayudas, sin delatar el tablero. El ➕ se dibuja con halo claro
  (`EMOJI_OSCUROS` en `compartir.js`, D-164).
- **El día:** sin `?seed=` es el tablero de hoy (`dia:<fecha>`), el mismo para todos.

## Cómo funciona

- `engine.js`: `generar(semilla, { n })` arma un tablero con salida: sus pares van anidados como
  paréntesis en el orden de lectura y se los numera iguales o que suman 10, así que tacharlos de
  adentro hacia afuera (`orden`) lo limpia entero sin ➕ (el orden de lectura no cambia cuando una fila
  se va). Un mal orden igual puede trabarlo. `une(p, i, j)` dice si se pueden tachar, o por qué no
  (`numeros`, `tapado` o `linea`); `quitar` los tacha y saca las filas enteras; `agregar` es el ➕;
  `pares(p)` da los que se pueden tachar ahora, los más cercanos primero (la ayuda toma el primero);
  `puntaje` y `tarjeta`, el puntaje y lo que se comparte. Constantes: `COLUMNAS` (9), `INICIALES` (36),
  `MAS` (3), `PUNTOS_LIMPIO` (70), `PUNTOS_MAS` (10), `RESTA_AYUDA` (10) y `MAXIMO` (100).
- `game.js`: la portada, la partida (las explosiones son spans en una capa encima, que se borran
  solos) y el resultado.
- `engine.test.mjs` revisa las reglas de los pares (de lado, de arriba abajo, en diagonal, del final
  de una fila al comienzo de la siguiente, lo tachado no estorba), las filas que se van, ➕, el puntaje
  y que 400 tableros se limpien enteros sin ➕ siguiendo su orden; `tools/e2e/exploding-numbers/lab.mjs`
  juega uno entero de punta a punta (pares que no se unen, la ayuda, ➕, limpiarlo con 100/100 y
  rendirse).

## Excepciones a los cánones

- Solo en español (C-3): es un prototipo del laboratorio, como permite D-191.
- Las casillas miden menos de 44 px a 375 px de ancho: son 9 columnas, como el original (D-297).
