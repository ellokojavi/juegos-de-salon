# Prototipo: El caso 🔍

> **Desde D-259 este prototipo usa el motor de La Copa** (`public/cup/games/case/engine.js`): su
> `engine.js` solo lo adapta al español. Los dos tienen siempre la misma dificultad.

**Ruta:** `/labs/case/` (laboratorio, sin entrada en `games.js`) · **Jugadores:** 1 · **Estado:**
prototipo para probar con amigos (D-256) · **Idiomas:** solo español, por ahora

> **Ya existe la versión de La Copa** (D-257): `public/cup/games/case/`, id `caso`, en los cuatro
> idiomas, con su propio motor (las pistas como datos, la frase armada en cada idioma). Se juega
> suelta en `/case/` (el laboratorio la abre con `/case/?labs`, D-262), pero todavía no está en `POZO`. Está descrita
> en [cup.md](cup.md). Esta página documenta el prototipo de `/labs/case/`, que desde D-259 usa
> ese mismo motor, adaptado al español; cuando El caso salga del laboratorio, el prototipo se va.

En `/labs/`, el botón **🔍 Jugar El caso** (`#btn-caso`) abre la versión de La Copa
(`/case/?labs`), con la experiencia completa: la portada, la prueba, el 3, 2, 1, el juego y el
resultado con su desglose. Este prototipo queda como el segundo botón, **📅 El caso del día
(prototipo)** (`#btn-caso-dia`). `tools/e2e/case/lab.mjs` comprueba los dos.

## Resumen

Un misterio de deducción al estilo de *Clues by Sam*: veinte sospechosos en una grilla de 4 por 5,
cada uno inocente o criminal. Se parte sabiendo qué es uno y lo que dice; cada persona que se marca
bien da su pista. Las pistas siempre dicen la verdad y **nunca hay que adivinar**: en todo momento
hay al menos una persona más que se puede deducir con lo que ya se sabe.

Es para mostrárselo a amigos y ver si engancha antes de decidir si entra como juego de La Copa y de
Uno al día. Ya está listo como juego de La Copa (D-257, arriba); falta que el dueño lo sume al
pozo (RP-50).

## Reglas

- **Marcar:** se toca a alguien y se elige "😇 es inocente" o "🔪 es criminal".
  - Si se podía deducir y está bien, queda marcado y su pista se suma a la lista.
  - Si se podía deducir y está mal, es un error: se cuenta y se marca con ✕ en la grilla.
  - Si todavía no se puede deducir con las pistas que hay, no se acepta, **cuenta como error**
    (D-261) y no dice si estaba bien ("Todavía no se puede saber qué es Ana: cuenta como error.").
    Así no se puede tantear persona por persona hasta dar con la que se deduce.
- **💡 Ayuda** (D-263): con un segundo toque para confirmar, elige a alguien que ya se puede deducir
  (el que pide menos pistas), lo deja elegido y dice qué pistas juntar ("Mira a Pía: junta lo que
  dicen Bárbara y Nico."), que se destacan en la lista hasta marcarlo. En La Copa resta 15; en el
  prototipo se anota aparte de los errores. Si se cierra el mensaje, "💡 Ver la ayuda" lo vuelve a
  mostrar sin cobrar otra vez.
- **Vecinos** son los 8 de alrededor, también en diagonal. Las filas van del 1 al 5 y las columnas
  de la A a la D, escritas en la grilla.
- **Puntaje:** los errores (y aparte, las ayudas); el tiempo (solo con la página a la vista) desempata.
- **Las pistas** hablan de grupos (una fila, una columna, un oficio, el borde, las esquinas, los
  vecinos de alguien, quienes están arriba, abajo, a la izquierda o a la derecha de alguien) y dicen
  cuántos criminales o inocentes hay, al menos o a lo más, si son par o impar (nunca con cero: ahí se dice "No hay criminales", #272), o comparan dos grupos
  que no comparten a nadie (D-263: la columna C y la fila 3 no, porque quien está en las dos se cancela).
  También hay pistas de dos personas: "Exactamente uno de Ana y Beto es criminal" (D-259), los
  **condicionales** ("Si Óscar es criminal, Rodrigo es inocente") y las **parejas** ("Ana y Beto son
  los dos inocentes o los dos criminales"), que solas no destapan a nadie (D-260).
  De respaldo, una pista dice directamente qué es otra persona (cerca de un 5 % de las pistas).

## Modos

Uno solo, para uno. Sin `?c=` es **el caso del día**, el mismo para todos ese día (la semilla es la
fecha del jugador). El link que se comparte lleva la fecha (`?dia=AAAA-MM-DD`), así quien lo abre
al día siguiente juega el mismo caso (#273); con `?c=CODIGO`, ese caso, y "🔍 Otro caso" abre uno con un código al azar. El
resultado se comparte con `compartir.js`: la cabecera, los errores, las ayudas y el tiempo, y una grilla de 🟩
con 🟥 donde hubo error y 🟨 donde se pidió ayuda (C-7).

## Flujo

```
Caso del día (o ?c=) → marcar de a uno → ¡Caso resuelto! → Compartir · Otro caso · El caso del día
```

**Cómo se ve** (0.137.0):

- **Al empezar**, las cartas parten de espaldas (🔍) y se dan vuelta en ola, en diagonal desde A1.
  Pasa cada vez que se abre un caso sin marcas (también al recargarlo antes de marcar a nadie).
- **Con `prefers-reduced-motion`** no hay vuelta inicial, sello, ola ni lupa animada: solo cambian
  los colores.
- **La elegida** se acerca con un zoom suave (`scale(1.09)`) y borde celeste.
- **Al marcar**, cae un sello sobre la carta: 😇 o 🔪 con la carta que gira y un destello verde o
  rosado si acertó; ❌ con destello rojo y sacudida si no; ❔ con destello amarillo si todavía no se
  podía saber. Al resolver el caso pasa una ola por la grilla.
- **Tocar una pista** (en la lista, en el mensaje bajo la grilla o tocando a alguien ya marcado)
  ilumina en amarillo solo a quienes nombra por su nombre (D-264: "a la izquierda de Omar" ilumina a
  Omar, no a los de su izquierda; "en la fila 2", a nadie), en celeste a quien la dice, y apaga a los
  demás; en La Copa, en una comparación, quien nombra el segundo grupo va en rosado (#282). Ver a quiénes abarca el grupo
  queda para el jugador. Tocarla otra vez o tocar fuera lo apaga. Para tachar una pista está el ✓ a
  su derecha.
- **Bajo la grilla**, si no hay nada elegido, solo "Toca a alguien para marcarlo."; al acertar,
  "¡Bien! Tati es inocente." La pista no se repite ahí: entra destacada arriba de la lista, que va
  justo abajo. Tocar a alguien ya marcado sí muestra su pista bajo la grilla, con "👁 Ver a quiénes
  nombra". Sin texto de ayuda sobre tocar o tachar pistas: se entiende solo. El acierto se va solo a
  los 2,5 s, y el error y el "todavía no se puede saber" a los 4 s (ver Excepciones). El reloj parte cuando
  termina la vuelta de las cartas, o con el primer toque.
- **La última pista** va arriba de la lista, con borde amarillo, la etiqueta "Última" y letra más
  grande, y entra animada.
- **"¿Cómo se juega?"** va al final; el link junto a la bajada lo abre y baja hasta él con un
  scroll suave (con `prefers-reduced-motion`, sin animación). La lupa 🔍 se mece junto al título.

La partida se guarda por caso en el celular (C-6): marcas, errores, tiempo y pistas tachadas (el ✓ de
cada pista la tacha, para llevar la cuenta). Tocar a alguien ya marcado muestra su pista bajo la grilla (#271).

## Protocolo de mensajes

No tiene: es de un jugador y sin red. Lo guardado está en `juegos-de-salon:caso:v2:<semilla>` (D-259) como
`{ marcas, errores, ayudas, ms, tachadas, done, empezo, reportado }`; `ayudas` lleva la celda que señaló cada ayuda (D-263), y `errores` lleva la celda de cada error,
también los de marcar antes de tiempo, y se repite si alguien se equivoca dos veces con la misma persona (D-261). Con la primera marca y al resolverlo manda la señal de uso del panel
con el juego `caso` (D-44, D-210), que el panel muestra con su clave cruda (C-16).

## Archivos

```
public/labs/case/index.html · style.css · game.js (pantalla)
public/labs/case/engine.js · engine.test.mjs (adapta al español el motor de La Copa, sin DOM)
tools/e2e/case/lab.mjs   el laboratorio lo ofrece, la pista que ilumina, marcar antes de tiempo, un error, recargar, la ayuda y resolverlo entero
```

**El generador** es el de La Copa (`public/cup/games/case/engine.js`, D-259): `generar(semilla)` del
prototipo llama a `deSemilla` y le pone a cada pista su frase en español (`texto` con las plantillas
de `casoTexto`). Elige nombres (uno por letra de la A a la T, en orden alfabético por la grilla),
cinco oficios de cuatro personas, de 7 a 10 criminales y con quién se parte; después simula al
jugador y le reparte a cada persona deducida una pista elegida para que haya que combinarlas
(`notaPista`, D-259). De cada semilla arma cuatro casos y se queda con el que más hace pensar
(`dificultad`, D-260); tarda unos 300 ms. El detalle está en [cup.md](cup.md).

**El solver** busca con vuelta atrás y poda por rangos (cuántos criminales caben todavía en cada
grupo). Una persona se puede deducir si vale lo mismo en todas las soluciones que cumplen las
pistas que hay.

Gancho de pruebas (C-14): `window.__caso` (`caso`, `partida`, `estado`).

## Excepciones a los cánones

- **C-8b (un error se queda hasta que el jugador toca):** en El caso, de La Copa y del prototipo, el
  mensaje de error se va solo a los 4 s, por pedido del dueño. El error no se pierde: la carta queda
  marcada con ✕ y se suma a la cuenta de errores. El temporizador solo cierra su propio mensaje.

- **C-3 (cuatro idiomas):** solo español, porque es un prototipo para amigos (D-256). El juego en
  los cuatro idiomas es el de La Copa, en `/case/` (D-257).
- **C-2 (estructura):** vive en `/labs/case/` y no en `games.js`: no es un juego del menú.
