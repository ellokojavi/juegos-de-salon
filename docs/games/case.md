# Prototipo: El caso 🔍

**Ruta:** `/labs/case/` (laboratorio, sin entrada en `games.js`) · **Jugadores:** 1 · **Estado:**
prototipo para probar con amigos (D-256) · **Idiomas:** solo español, por ahora

## Resumen

Un misterio de deducción al estilo de *Clues by Sam*: veinte sospechosos en una grilla de 4 por 5,
cada uno inocente o criminal. Se parte sabiendo qué es uno y lo que dice; cada persona que se marca
bien da su pista. Las pistas siempre dicen la verdad y **nunca hay que adivinar**: en todo momento
hay al menos una persona más que se puede deducir con lo que ya se sabe.

Es para mostrárselo a amigos y ver si engancha antes de decidir si entra como juego de La Copa y de
Uno al día. Si entra, va a `cup/games/` con los cuatro idiomas (C-3) y esta página se va.

## Reglas

- **Marcar:** se toca a alguien y se elige "😇 es inocente" o "🔪 es criminal".
  - Si se podía deducir y está bien, queda marcado y su pista se suma a la lista.
  - Si se podía deducir y está mal, es un error: se cuenta y se marca con ✕ en la grilla.
  - Si todavía no se puede deducir con las pistas que hay, no se acepta, **no** cuenta como error
    y no dice si estaba bien ("Con las pistas que hay, todavía no se puede saber qué es Ana."). Así
    probar las dos opciones no sirve para adivinar.
- **Vecinos** son los 8 de alrededor, también en diagonal. Las filas van del 1 al 5 y las columnas
  de la A a la D, escritas en la grilla.
- **Puntaje:** los errores; el tiempo (solo con la página a la vista) desempata.
- **Las pistas** hablan de grupos (una fila, una columna, un oficio, el borde, las esquinas, los
  vecinos de alguien, quienes están arriba, abajo, a la izquierda o a la derecha de alguien) y dicen
  cuántos criminales o inocentes hay, al menos o a lo más, si son par o impar (nunca con cero: ahí se dice "No hay criminales", #272), o comparan dos grupos.
  De respaldo, una pista dice directamente qué es otra persona (cerca de un 5 % de las pistas).

## Modos

Uno solo, para uno. Sin `?c=` es **el caso del día**, el mismo para todos ese día (la semilla es la
fecha del jugador). El link que se comparte lleva la fecha (`?dia=AAAA-MM-DD`), así quien lo abre
al día siguiente juega el mismo caso (#273); con `?c=CODIGO`, ese caso, y "🔍 Otro caso" abre uno con un código al azar. El
resultado se comparte con `compartir.js`: la cabecera, los errores y el tiempo, y una grilla de 🟩
con 🟥 donde hubo error (C-7).

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
  ilumina en amarillo a las personas de las que habla, en celeste a quien la dice, y apaga a los
  demás. Tocarla otra vez o tocar fuera lo apaga. Para tachar una pista está el ✓ a su derecha.
- **Bajo la grilla**, si no hay nada elegido, queda la última pista sabida (al empezar, la de
  partida) con "👁 ver a quiénes", para iluminarla sin bajar a la lista.
- **La última pista** va arriba de la lista, con borde amarillo, la etiqueta "Última" y letra más
  grande, y entra animada.
- **"¿Cómo se juega?"** va al final; el link junto a la bajada lo abre. La lupa 🔍 se mece junto al
  título.

La partida se guarda por caso en el celular (C-6): marcas, errores, tiempo y pistas tachadas (el ✓ de
cada pista la tacha, para llevar la cuenta). Tocar a alguien ya marcado muestra su pista bajo la grilla (#271).

## Protocolo de mensajes

No tiene: es de un jugador y sin red. Lo guardado está en `juegos-de-salon:caso:<semilla>` como
`{ marcas, errores, ms, tachadas, done, empezo, reportado }`. Con la primera marca y al resolverlo manda la señal de uso del panel
con el juego `caso` (D-44, D-210), que el panel muestra con su clave cruda (C-16).

## Archivos

```
public/labs/case/index.html · style.css · game.js (pantalla)
public/labs/case/engine.js · engine.test.mjs (generador, solver y pistas, sin DOM)
tools/e2e/case/lab.mjs   el laboratorio lo ofrece, la pista que ilumina, marcar antes de tiempo, un error, recargar y resolverlo entero
```

**El generador** (`generar(semilla)`): elige nombres (uno por letra de la A a la T, en orden
alfabético por la grilla), cinco oficios de cuatro personas, de 7 a 10 criminales y con quién se
parte. Después simula al jugador: cada vez que alguien se puede deducir, lo marca y le reparte una
pista elegida entre 14 verdaderas al azar, prefiriendo las que destapan a una o dos personas (para
que el caso dure). Si en algún momento nadie más se puede deducir, cambia la última pista por una
que destrabe; si no hay, prueba con otra solución. Un caso sale en unos 10 ms.

**El solver** busca con vuelta atrás y poda por rangos (cuántos criminales caben todavía en cada
grupo). Una persona se puede deducir si vale lo mismo en todas las soluciones que cumplen las
pistas que hay.

Gancho de pruebas (C-14): `window.__caso` (`caso`, `partida`, `estado`).

## Excepciones a los cánones

- **C-3 (cuatro idiomas):** solo español, porque es un prototipo para amigos (D-256). Las pistas
  salen de plantillas, así que traducirlo es traducir unas 20 frases.
- **C-2 (estructura):** vive en `/labs/case/` y no en `games.js`: no es un juego del menú.
