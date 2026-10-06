# Video promocional

La memoria del video promocional de Juegos de Salón: qué es, qué quiere el dueño, cómo está
hecho, cómo se rehace y todo lo que pasó en cada versión. **Se lee entero antes de tocar el
video** (D-178), y al terminar cada vuelta se anota en [Historia](#historia) y en
[`../registro.json`](../registro.json).

## Hoy: versión 5 (2026-10-02)

| | |
|---|---|
| Archivos | [`salida/promo-youtube-16x9.mp4`](output/promo-youtube-16x9.mp4) (1920×1080, YouTube) · [`salida/promo-vertical.mp4`](output/promo-vertical.mp4) (1080×1920, Shorts, Reels, estados de WhatsApp) |
| Duración | 48,5 s, H.264 + AAC 256 kb/s, 30 cuadros por segundo |
| Idioma | Español (dice que la app también está en inglés y portugués) |
| Música | [`musica/cancion.mp3`](music/cancion.mp3), la que puso el dueño (ver [La canción](#la-canción)) |
| App que muestra | 0.82.x (las capturas de la v5 son de antes de los textos cortos de 0.84.0) |

En `salida/` vive **solo la última versión**: al publicar una nueva, se reemplazan los dos mp4.
Las anteriores quedan en la historia de git. Ojo: GitHub Pages publica el repo entero, así que
los mp4 también quedan en `juegosdesalon.cl/marketing/promo-video/output/…`.

## Pendiente: versión 6

Registrada el 2026-10-03 a pedido del dueño: **no empezarla hasta que él la pida.** Sale de la
revisión de usabilidad (U-34, `node tools/agents/marketing.mjs revisar`):

- **Sumar 🧶 Desenredo**, que salió del laboratorio en 0.89.0. Hoy no está ni entre los ocho
  juegos ni en la grilla de "¡Y muchos más!". Decidir con el dueño si entra a la escena de juegos
  (y cuál sale, o cuántos golpes más dura) o a la grilla.
- **Cuatro idiomas, no tres:** desde 0.94.0 (D-197) la portada ofrece también el alemán. La escena
  de modos ("Y en tres idiomas") y el cierre muestran 🇪🇸 🇬🇧 🇧🇷: sumar 🇩🇪 y ajustar el texto.
- **Recapturar todo con la app de hoy** (0.90.5 o la que haya). Las capturas de la v5 son de la
  0.82.x, así que se ven atrás:
  - Textos más cortos en todos los juegos (0.84.0, D-177).
  - ☀️ Tango: candado chico en las casillas dadas (0.87.1), el sol dado más intenso (0.90.3), y el
    choque que se marca al tocar otra casilla (0.90.3). Revisar que la jugada de "sol, sol, luna
    (dos toques)" se siga viendo bien.
  - 🏆 La Copa: si el podio que se muestra tiene empate en puntos, ahora sale la línea "⚖️ Empate
    en … puntos" (0.90.2).
- **Sumar 📅 Uno al día** (D-230, para todos desde 0.121.0; dueño, 2026-10-06, dilema #235): un
  plano corto con el botón de la portada al lado de "🎲 Al azar", el dado que cae en el juego de
  hoy y la tarjeta del resultado con la racha 🔥 y el n.° del día. Es la razón para volver cada día.
- **Cerrar con "agrégala a tu inicio"** (D-232, el globo de la portada, para todos desde 0.121.0): la
  app se puede tener como ícono en el celular.
- Al terminar: la vuelta en [Historia](#historia), `registro.json` (versión, fecha, `app`) y
  `node tools/agents/marketing.mjs anotar video-promo --al-dia`.

## Lo que el dueño quiere

Lo que fue pidiendo en cada vuelta, para no tener que volver a preguntarlo:

- **Pantallas de verdad, jugándose.** Nada de maquetas ni capturas quietas en lo que se ve más
  de un segundo: cada juego se juega en la app real y se ve el dedo tocando (v3).
- **Poca densidad.** Mejor menos juegos con más tiempo cada uno que todos de pasada (v4). Lo que
  sale de la pasada principal va en la grilla de "¡Y muchos más!", con su nombre y su jugada
  en bucle, el tiempo suficiente para encontrar uno por su nombre (v5).
- **Todos los juegos se nombran como juegos.** Nunca "minijuegos" (v2).
- **La Copa es un desafío, no un "próximamente":** "¿Te atreves a desafiar a tus amigos por una
  semana?". Escena larga para leerla con calma, con 🏆 junto al título (v2, v4, v5).
- **Eslogan general, no de noche:** "¡JUNTOS SE JUEGA MEJOR!" reemplazó a "¡ARMA LA NOCHE!" (v3).
- **Decir que hay tres idiomas** aunque el video sea en español: "Y en tres idiomas: tú eliges"
  en la escena de modos y las tres banderas en el cierre (v3).
- **Su canción**, cortada al largo del video, con fundido de entrada y de salida de 1 s (v4, v5).
- **Dos formatos:** 16:9 para YouTube y vertical para Shorts y redes, con el mismo contenido
  (v4).
- Le gustó el estilo desde la v1: neón, Bangers + Nunito, emojis, un celular flotando.

## El guion de la v5

La canción va a 130 BPM: un golpe dura 0,4615 s y cada corte cae en un golpe.

| Escena | Golpes | Segundos | Qué pasa |
|---|---|---|---|
| Gancho | 7 | 0 – 3,2 | "JUNTA A TUS AMIGOS · SACA EL CELULAR · ¡Y A JUGAR!", con emojis girando |
| Logo | 7 | 3,2 – 6,5 | 🎲 cae, "JUEGOS DE SALÓN", "Los juegos de toda la vida, en tu celular" |
| Juegos | 44 | 6,5 – 26,8 | Ocho juegos jugados en un celular (tabla de abajo) |
| ¡Y muchos más! | 14 | 26,8 – 33,2 | Grilla de cinco celulares chicos, cada uno jugando en bucle |
| Modos | 8 | 33,2 – 36,9 | "JUEGA COMO QUIERAS": en un celular, en varios, contra el celular; "Y en tres idiomas: tú eliges" 🇪🇸 🇬🇧 🇧🇷 |
| La Copa | 16 | 36,9 – 44,3 | "¿Te atreves a desafiar a tus amigos por una semana?", "🏆 LA COPA", el celular baja por podio, calendario, tabla y gráfico |
| Cierre | 9 | 44,3 – 48,5 | "¡JUNTOS SE JUEGA MEJOR!", "Gratis · Sin descargar nada · Sin cuentas", **juegosdesalon.cl**, banderas |

Los juegos, en orden, con lo que pasa en pantalla (cada uno con su semilla, ver `jugar.mjs`):

| Juego | Golpes | La jugada |
|---|---|---|
| ⏳ Línea de Tiempo | 5 | Solo: elige una carta, la pone y sale "¡Correcto!" |
| 🔢 Toque y Fama | 5 | Solo: ya hay un intento; escribe 4-5-1-7 y prueba |
| 🎲 Dudo | 5 | Contra el celular: pinta, sube a 2, apuesta, el celular canta, Javi duda y se destapa |
| 📍 ¿Dónde queda? | 6 | Santiago, Chile: arrastra el globo de Europa a Sudamérica (14 capturas del giro), marca y confirma: 98 puntos |
| ⚓ Batalla Naval | 5 | Contra el celular: apunta, ¡fuego!, ¡tocado!, y otra vez |
| 👑 Reinas | 6 | Cinco reinas puestas; arrastra una fila de X y pone las tres que faltan: "¡Resolviste las reinas!" |
| ☀️ Tango | 5 | Faltan tres casillas: sol, sol, luna (dos toques): "¡Resolviste el tango!" |
| 〰️ Zip | 7 | Un solo trazo del 1 al 5 por las 16 casillas; queda en verde |

La grilla de "¡Y muchos más!": 👑 Cuarto Rey (saca el As: "¡Todos toman!"), 🔗 Conexiones
(arma los pintores españoles), 🪢 El Ahorcado, 📅 ¿En qué año? (1985, 100 puntos) y
🔤 Toque y Fama: Palabra. En vertical van en dos filas; en horizontal, en una.

## Cómo está hecho

- **`promo.html`** es el video: una página donde todo lo que se ve es función del tiempo
  (`window.render(t)`), así que cada render sale idéntico. Abierta en un navegador se reproduce
  sola; con `?wide` es la versión 16:9 (el celular a la derecha y los textos a la izquierda, el
  mismo guion). Las escenas se definen en golpes (`S`, `GAMES`, `MORE`).
- **Las jugadas son capturas reales:** `jugar.mjs` abre cada juego en Chrome, lo juega con el
  mouse y saca una captura por jugada, anotando dónde fue el toque (y el recorrido, si arrastró).
  `promo.html` las pasa una tras otra y dibuja un círculo donde va el dedo, con una onda al
  tocar. Los arrastres llevan capturas intermedias (`mids`), así el globo gira y el trazo crece.
- **El azar está fijo:** cada juego entra con una `?semilla=` (los sueltos usan `WNDRN`) y
  `jugar.mjs` reemplaza `Math.random` y `crypto.getRandomValues` por uno con semilla. Así cada
  corrida reparte lo mismo y los toques caen donde deben. Las soluciones de Reinas, Tango y Zip
  salen de `generar(semilla, 1)` de cada motor (`public/cup/games/*.js`).
- **La Copa** es la demo `podio` del laboratorio, capturada entera de arriba abajo (`copa.mjs`).
- **`render.mjs`** dibuja cuadro a cuadro con Playwright y se los pasa a ffmpeg (sin audio).
- **`construir.sh`** hace todo: capturas, `preparar.py` (achica y escribe `plays/plays.js`),
  los dos renders, la música y los mp4 de `salida/`.

## Rehacerlo

```bash
python3 -m http.server 8765 -d public         # en otra terminal
marketing/promo-video/construir.sh            # unos 30 min: capturas, dos renders y la música
```

Necesita Playwright (`npm i -g playwright`, o `PLAYWRIGHT=<ruta a index.mjs>`), ffmpeg y Pillow
(`pip install pillow`). En la nube: `SITIO=http://localhost:<puerto>` si el 8765 está ocupado
por otra sesión (D-135). Las capturas (`plays/`) no van al repo: se rehacen.

Para trabajar por partes:

```bash
node jugar.mjs reinas tango        # vuelve a jugar solo esos (deja los demás en plays/)
python3 preparar.py                # siempre después de capturar
python3 hoja.py reinas tango       # hoja.png: las capturas con el toque marcado, para revisarlas
node render.mjs --fotos fotos --tiempos 19.9,21.0,22.6          # cuadros sueltos, para mirar
node render.mjs --wide --fotos fotos --tiempos 28.6,40.0
open promo.html                    # o ?wide: se reproduce en el navegador, sin música
```

**Antes de entregar se miran cuadros sueltos de las dos versiones** (`--tiempos` en los cortes y
en medio de cada jugada) y la hoja de las capturas. Rehacerlas no es revisarlas (D-76).

## La canción

`musica/cancion.mp3` (47,1 s) la subió el dueño. Lo que se sabe de ella:

- **130 BPM**; un compás = 1,846 s. Tiene **2,975 s de silencio al principio**: el video parte
  ahí, en su primer golpe. La música termina a los 44,07 s del archivo.
- Partes: introducción hasta 10,36 s (compás 4), entra fuerte; un respiro cerca de 16,4–17,7 s;
  un tramo más tranquilo cerca de 23,5–32,4 s; fuerte otra vez hasta el final.
- Sola alcanza 41,1 s. Para los 48,5 s de la v5 se **repiten los compases 4 a 8**: después del
  respiro (17,744 s) vuelve al 10,36 s, que suena como una segunda entrada. El empalme queda en el
  segundo 14,8 del video; si el dueño lo nota, se busca otro punto.
- Fundido de entrada y de salida de 1 s (pedido en v5).

Si el video cambia de largo, se ajustan los golpes de las escenas para que sumen lo que alcanza
la música (89 golpes sola, 105 con la repetición) y la cuenta de `construir.sh`.

## Trampas conocidas

- **Chrome se cae decodificando** las ~150 capturas a 780 px ("EncodingError: The source image
  cannot be decoded"): por eso `preparar.py` las deja en 546 px. `render.mjs` dice cuáles no
  cargaron.
- **Algunos juegos sortean con `crypto`**, no con `Math.random`: sin fijarlo, Línea de Tiempo
  daba "¡Te equivocaste!" y El Ahorcado cambiaba de palabra.
- **Los toques dependen de la app.** Si cambia un texto o un tamaño, un botón se mueve; `jugar.mjs`
  busca casi todo por su texto o su `data-i`, pero ¿Dónde queda? toca una coordenada del globo
  (`DONDE`, por defecto 217,546: Santiago). Se revisa con `hoja.py` después de cada captura.
- **Cuarto Rey responde a la posición real del mouse**, no a `.click()`; los arrastres de Reinas
  y Zip necesitan eventos de puntero de verdad: por eso `jugar.mjs` usa el mouse de Playwright.
- **El "null" de Toque y Fama: Palabra** (un error de la app en `public/cup/games/word/ui.js`: un
  `append` nativo recibe `null`) se borra de la pantalla al capturar. Cuando se arregle en la app,
  sobra ese paso de `jugar.mjs`.
- **El servidor local se cae** en sesiones largas: `construir.sh` avisa si `SITIO` no responde.
- La Copa del video es la demo del laboratorio (`?prueba&labs&demo=podio`): no toca Firebase.

## Para YouTube

Lo que se propuso al dueño (v4):

- **Título (16:9):** "Juegos de Salón: juegos para jugar con amigos en el celular, gratis".
- **Título (Short):** "¿Aburridos? Saca el celular y a jugar 🎲 #shorts".
- **Descripción:** la promesa y el link primero ("Junta a tus amigos, saca el celular y a jugar…
  gratis, sin descargar nada y sin crear cuentas. ▶ https://juegosdesalon.cl"), después los
  juegos por grupo, los modos, La Copa y los tres idiomas, y al final hashtags
  (#juegosdesalon #juegosconamigos #juegosdemesa).
- Cuarto Rey es de tomar: para evitar la restricción de edad, en la descripción va como "naipes,
  retos y el temido rey".

## Historia

Cada vuelta, con lo que pidió el dueño (en sus palabras cuando importa) y lo que se hizo.

### v1 · 2026-10-02 · 34 s, vertical
El dueño propuso hacer el video con código: una página animada que se renderiza cuadro a cuadro.
Se hizo así: capturas reales de los guiones `tools/e2e/` dentro de un celular animado, una
canción propia de 120 BPM generada en Python (sin derechos de por medio) y seis escenas: gancho,
logo, siete juegos de 2 s, modos con ES/EN/PT, La Copa como **"Próximamente"** y "¡Arma la
noche!".

### v2 · 2026-10-02 · 40 s
> "La Copa no está en próximamente. Promociónala como 'quieres desafiar a tus amigos por una
> semana?' o algo parecido. Y no menciones 'minijuegos' sino que nómbralos como si todos fuesen
> juegos normales."

La Copa pasó a ser el desafío ("¿Te atreves a desafiar a tus amigos por una semana?", con su
podio y confeti) y se nombraron los 13 juegos, los minijuegos de 1 s cada uno.

### v3 · 2026-10-02 · 40 s
> "Las pantallas de celular de los juegos que están por más tiempo en vista deben ser animadas
> como si se estuviesen jugando en realidad. Al final, cambiemos el slogan 'Arma la noche' por
> algo más general. También, indica explícitamente que puedes escoger de tres idiomas."

Nació `jugar.mjs`: siete juegos jugados de verdad con el dedo a la vista; La Copa se desliza;
"¡JUNTOS SE JUEGA MEJOR!"; "Y en tres idiomas: tú eliges" y las banderas en el cierre.

### v4 · 2026-10-02 · 41,5 s, vertical y 16:9
> "Me gusta mucho, pero no me gusta el audio y la densidad de información actual." Pidió su
> canción con fundido al final, sacar El Ahorcado, ¿En qué año? y Toque y Fama: Palabra, más
> tiempo por juego, decir que hay más juegos, el globo de ¿Dónde queda? girando, Reinas jugado y
> La Copa más larga. Y: "el formato del video no funciona bien en YouTube".

Su canción a 130 BPM con los cortes en golpe; diez juegos con más tiempo; escena "¡Y hay más
juegos!" con tres nombres; el globo gira (capturas del arrastre); Reinas con X y reinas; La Copa
de 4 a 5,1 s. Se eligió hacer **los dos formatos** (16:9 con diseño propio y vertical).

### v5 · 2026-10-02 · 48,5 s, vertical y 16:9 (la de hoy)
> Fundido de entrada y de salida de 1 s; sacar Cuarto Rey y Conexiones de la pasada y llevarlos a
> "muchos más"; en "muchos más", títulos e imágenes animadas de cada juego en grilla, más larga,
> "para que el espectador pueda encontrar alguno por su título"; ¿Dónde queda? después de Dudo;
> Tango y Zip jugados; La Copa más larga y con emoji de copa.

Ocho juegos (ver el guion); la grilla de cinco celulares en bucle (6,5 s); Tango y Zip jugados;
"🏆 LA COPA" con tres pasadas (7,4 s); la canción con los compases 4 a 8 repetidos para alcanzar
y los dos fundidos. Al registrarlo en el repo se fijó también el azar de `crypto` en
`jugar.mjs`: las capturas que se rehagan desde ahora pueden mostrar otras palabras que las de la
v5 (en la v5 El Ahorcado adivina "PISCO").

## Ideas que quedaron en el aire

- Una miniatura de 1280×720 para YouTube (un cuadro de "¡JUNTOS SE JUEGA MEJOR!" o del podio).
- Versiones en inglés y portugués del video: los textos están todos en `promo.html` y la app ya
  se captura en cualquier idioma (`juegos-de-salon:lang` en `jugar.mjs`).
