# El caso 🔍

**Ruta:** `/labs/case/` (id `caso`, en `SUELTOS` con `labs: true` y `diario: true`; `/case/` lleva
ahí) · **Jugadores:** 1 · **Estado:** juego de La Copa en el laboratorio, todavía fuera de `POZO`
(D-257, D-267; RP-50) · **Idiomas:** es, en, pt y de

Esta página describe El caso tal como se prueba hoy. Lo que comparte con los demás juegos de La
Copa (la antesala, la cuenta, el desglose, la sesión de prueba, el puntaje sobre 100) está en
[cup.md](cup.md). El prototipo solo en español que vivió en `/labs/case/` (D-256) se borró en
0.144.0: lo que solo él tenía pasó al juego (D-267).

## Resumen

Un misterio de deducción al estilo de *Clues by Sam*: veinte sospechosos en una grilla de 4 por 5,
cada uno inocente o criminal. Se parte sabiendo qué es uno y lo que dice; cada persona que se marca
bien da su pista. Las pistas siempre dicen la verdad y **nunca hay que adivinar**: en todo momento
hay al menos una persona más que se puede deducir con lo que ya se sabe.

Está en el laboratorio para mostrárselo a amigos y ver si engancha. Ya es un juego de La Copa
completo; falta que el dueño lo sume al pozo (RP-50). **Hay una sola versión para probar**
(D-267): `https://juegosdesalon.cl/labs/case/`, con la pantalla de La Copa.

## Reglas

- **Marcar:** se toca a alguien y se elige "😇 es inocente" o "🔪 es criminal".
  - Si se podía deducir y está bien, queda marcado y su pista se suma a la lista.
  - Si se podía deducir y está mal, es un error: se cuenta y se marca con ✕ en la grilla.
  - Si todavía no se puede deducir con las pistas que hay, no se acepta, **cuenta como error**
    (D-261) y no dice si estaba bien ("Todavía no se puede saber qué es Ana: cuenta como error.").
    Así no se puede tantear persona por persona hasta dar con la que se deduce.
- **💡 Ayuda** (D-263): con un segundo toque para confirmar, elige a alguien que ya se puede deducir
  (el que pide menos pistas), lo deja elegido y dice qué pistas juntar ("Mira a Pía: junta lo que
  dicen Bárbara y Nico."), que se destacan en la lista hasta marcarlo. Si se cierra el mensaje,
  "💡 Ver la ayuda" lo vuelve a mostrar sin cobrar otra vez.
- **Vecinos** son los 8 de alrededor, también en diagonal. Las filas van del 1 al 5 y las columnas
  de la A a la D, escritas en la grilla.
- **Puntaje:** 100 con el caso resuelto, menos 10 por error y 15 por ayuda, hasta 10; sin resolver,
  0. El resultado lo explica línea por línea (`desglose.js`, D-106).
- **Las pistas** hablan de grupos (una fila, una columna, un oficio, el borde, las esquinas, los
  vecinos de alguien, quienes están arriba, abajo, a la izquierda o a la derecha de alguien) y dicen
  cuántos criminales o inocentes hay, al menos o a lo más, si son par o impar (nunca con cero: ahí se
  dice "No hay criminales", #272), o comparan dos grupos que no comparten a nadie (D-263: la columna
  C y la fila 3 no, porque quien está en las dos se cancela). También hay pistas de dos personas:
  "Exactamente uno de Ana y Beto es criminal" (D-259), los **condicionales** ("Si Óscar es criminal,
  Rodrigo es inocente") y las **parejas** ("Ana y Beto son los dos inocentes o los dos
  criminales"), que solas no destapan a nadie (D-260). De respaldo, una pista dice directamente qué
  es otra persona (cerca de un 5 % de las pistas).

## Modos

Uno solo, para uno, con la pantalla de los juegos sueltos de La Copa (`public/cup/suelto/`). Lo
que lo distingue es `diario: true` en `games.js` (D-267):

- **El caso del día:** sin `?seed=` en el link se juega el del día, el mismo para todos
  (`semillaDel(fecha)` de `uno-al-dia.js`, con la fecha del jugador), y el link queda limpio, así
  mañana abre el de mañana. La antesala lo dice: "📅 El caso de hoy es el mismo para todos. Mañana
  hay otro." Con `?seed=K7Q2X` se juega ese caso.
- **Sigue donde iba al recargar:** las jugadas y el tiempo se guardan por caso en el celular; al
  volver, el tablero aparece sin la cuenta ni la vuelta de las cartas, con el reloj donde quedó.
- **El final:** **Compartir** manda el resultado con el link al mismo caso (`/labs/case/?seed=…`):
  quien lo recibe juega ese, también al día siguiente. **🔍 Otro caso** abre uno con una semilla
  al azar, y si el que se jugó no era el de hoy, **📅 El caso de hoy** vuelve a él. Abajo va
  **"¿Qué te pareció?"** (D-265), abierto en la página y no detrás de un botón.

El formulario de comentarios es `formularioComentario()` de `labs-idioma.js` y va al final de todo
juego que se juega desde el laboratorio, en vez del botón 🐞 de La Copa. Manda a `feedback/` el
texto, un nombre opcional y el contexto (juego, semilla, puntaje, tiempo, URL, tamaño de pantalla y
navegador); se lee con `node tools/firebase/reportes.mjs`, y sin red queda en el celular y se
reenvía (D-104, D-109).
Antes de terminar también se puede comentar: la antesala, la prueba y el juego terminan con
**"💬 Dejar un comentario"**, que abre el mismo formulario en una capa con la vista en el contexto
(`abrirComentario`, D-268). Durante la cuenta del 3, 2, 1 no está, y en el resultado el formulario
abierto es lo último de la pantalla, debajo de "Volver al laboratorio".

El resultado se comparte con `compartir.js` (C-7): la cabecera, el puntaje, el tiempo y una grilla
de 🟩 con 🟥 donde hubo error y 🟨 donde se pidió ayuda.

## Flujo

```
/labs/case/ (caso del día) o ?seed= → antesala (prueba opcional) → 3, 2, 1 → marcar de a uno
  → resultado con desglose → Compartir · 🔍 Otro caso · 📅 El caso de hoy · Volver · ¿Qué te pareció?
  ("💬 Dejar un comentario" al final de la antesala, la prueba y el juego; no en la cuenta)
```

**Cómo se ve** (`public/cup/games/case/ui.js`):

- **La antesala** muestra cartas de espaldas que se dan vuelta solas mientras una lupa las recorre
  (`portada()`), y el título lleva la lupa y los colores que se mueven (`titulo()`).
- **Al empezar**, las cartas del tablero parten de espaldas y se dan vuelta en ola, en diagonal
  desde A1, recién cuando la cuenta del 3, 2, 1 se fue del documento. El reloj parte cuando termina
  la ola (`entrada()`, D-258). Una partida retomada no la repite.
- **Con `prefers-reduced-motion`** no hay vuelta inicial, sello, ola ni lupa animada: solo cambian
  los colores.
- **Al marcar**, cae un sello sobre la carta: 😇 o 🔪 si acertó, ❌ si no, ❔ si todavía no se
  podía saber.
- **Tocar una pista** (en la lista o tocando a alguien ya marcado) ilumina en amarillo solo a
  quienes nombra por su nombre (D-264: "a la izquierda de Omar" ilumina a Omar, no a los de su
  izquierda; "en la fila 2", a nadie), en celeste a quien la dice, y apaga a los demás; en una
  comparación, quien nombra el segundo grupo va en rosado (#282). Ver a quiénes abarca el grupo
  queda para el jugador. Tocarla otra vez o tocar fuera lo apaga. El ✓ a su derecha la tacha.
- **La última pista** va arriba de la lista, destacada, y entra animada.
- **Los mensajes** de acierto se van solos a los 2,5 s, y los de error y "todavía no se puede
  saber" a los 4 s (ver Excepciones).

## Protocolo de mensajes

No tiene: es de un jugador y sin red. Las jugadas son `{ i, v }` (acierto o error), `{ i, v, falta:
1 }` (marcar antes de tiempo, D-261) y `{ ayuda: i }` (D-263). Lo guardado para seguir al
recargar está en `juegos-de-salon:diario:caso:<semilla>` como `{ jugadas, ms }`; las pistas
tachadas no se guardan. Si el almacenamiento está bloqueado, se juega igual sin guardar.

Manda la señal de uso del panel con el juego `caso` y el modo `solo` al empezar, y cómo salió al
terminar (D-44, D-210). Es el único juego que cuenta desde el laboratorio: es lo que se quiere
medir (D-267). El panel lo muestra con su clave cruda (C-16).

## Archivos

```
public/cup/games/case/engine.js   motor: genera el caso, el solver, la ayuda y el puntaje (sin DOM)
public/cup/games/case/ui.js       pantalla: grilla, pistas, sellos, portada de la antesala
public/cup/rules.js               casoTexto (las plantillas de cada pista) y los textos del caso, en los cuatro idiomas
public/cup/game.js                lo de `diario`: el caso del día, seguir al recargar y el final
public/cup/games/juegos.test.mjs  sus pruebas, con las de los demás juegos de La Copa
public/labs/case/index.html       generada por node tools/release/og.mjs tarjetas desde public/cup/suelto/: no se edita
public/case/index.html            página puente a /labs/case/, también generada
tools/e2e/case/lab.mjs            de punta a punta: el laboratorio lo ofrece, /case/ lleva ahí, el caso del día, marcar antes de tiempo, recargar, resolverlo entero, compartir, otro caso, el de hoy y el comentario
```

**El generador** (`deSemilla`) elige nombres (uno por letra de la A a la T, en orden alfabético
por la grilla), cinco oficios de cuatro personas, de 7 a 10 criminales y con quién se parte;
después simula al jugador y le reparte a cada persona deducida una pista elegida para que haya que
combinarlas (`notaPista`, D-259). De cada semilla arma cuatro casos y se queda con el que más hace
pensar (`dificultad`, D-260). Las pistas son datos (`{ t, a, b, k, g, h }`) y la frase la arma
`texto()` en el idioma de quien juega: el caso es el mismo en los cuatro idiomas. Cómo se eligen
las pistas, en detalle, está en [cup.md](cup.md).

**El solver** busca con vuelta atrás y poda por rangos (cuántos criminales caben todavía en cada
grupo). Una persona se puede deducir si vale lo mismo en todas las soluciones que cumplen las
pistas que hay.

**Al salir del laboratorio** (D-267): se saca `labs: true` y la página pasa a `/case/`; `diario`
puede quedarse.

## Excepciones a los cánones

- **C-8b (un error se queda hasta que el jugador toca):** el mensaje de error se va solo a los
  4 s, por pedido del dueño. El error no se pierde: la carta queda marcada con ✕ y se suma a la
  cuenta de errores. El temporizador solo cierra su propio mensaje.
