# Se vienen cositas

La memoria del adelanto de 6 s que muestra lo que se viene del laboratorio sin nombrarlo. Sigue el
modelo de [`../promo-video/`](../promo-video/README.md) (D-178): se lee antes de tocarlo y cada
vuelta se anota en [Historia](#historia) y en [`../registro.json`](../registro.json).

## Hoy: versión 2 (2026-10-13)

| | |
|---|---|
| Archivos | [`output/se-vienen-cositas-6s.mp4`](output/se-vienen-cositas-6s.mp4) (1080×1080, 6 s, 30 cuadros por segundo, sin audio) |
| Idioma | Español |
| Dónde va | WhatsApp, estados y redes: un adelanto, sin link a ningún juego |
| App que muestra | 0.170.2 |

**Qué muestra, sin nombrar ningún juego** (pedido del dueño: «dar pistas de lo que se viene a través
de imágenes y acciones y no de explicar o nombrar los juegos»): arriba "¡Se vienen cositas!", y
**una sola escena** (v2): los cuatro tableros en una grilla de 2×2, **entrelazados** (pedido del
dueño): cada baldosa aparece justo antes de su jugada y la siguiente aparece mientras la anterior
todavía juega (un dedo por juego, a ratos dos a la vez). Así los cuatro quedan a la vista, terminados,
desde los 3,5 s; el que juega crece un poco:

| Aparece · juega (s) | Baldosa | Juego (no se nombra) | La acción |
|---|---|---|---|
| 0,15 · 0,4 – 1,5 | arriba a la izquierda | 🚇 Rutas rotas | Un plano de metro de 3×3; el dedo arrastra de una pieza a la otra, el rectángulo da media vuelta y las tres líneas calzan y brillan |
| 0,85 · 1,1 – 2,3 | arriba a la derecha | 🖌️ Pintaminas | Una grilla de 7×7 con los números de las casillas vacías; el dedo la recorre y se pintan dos cerezas, rojas con el tallo verde, que laten |
| 1,55 · 1,85 – 2,9 | abajo a la izquierda | 💥 Números explosivos | Una grilla de números con el borde de su color; el dedo une 7 y 3 (suman 10) y después 5 y 5: cada par estalla con un «¡BOOM!» y chispas, y el tablero tiembla |
| 2,25 · 2,55 – 3,45 | abajo a la derecha | 📐 Loteo, modo ⚡💧 Servicios | Un 4×4 con tres lotes ya pintados, cada uno con su ⚡ y su 💧; el dedo arrastra el que falta (2×2, con su ⚡ y su 💧), se pinta y el tablero brilla |
| 3,45 – 4,6 | los cuatro | — | Los cuatro terminados, a la vista |
| 4,6 – 6,0 | los cuatro | — | La grilla se achica, cae «PRÓXIMAMENTE» y abajo `juegosdesalon.cl` |

El primer y el último cuarto de segundo funden al color del fondo, para que se pueda repetir en
bucle sin salto (el dueño hace el GIF desde el video).

**Muestra juegos que no están en la portada, a propósito** (`"laboratorio"` en `registro.json`, U-34).
No son capturas de la app: los tableros se dibujan en la página, con los colores y la forma de cada
juego, para que la jugada sea clara en un segundo. **Nada dice "laboratorio"** ni nombra herramientas
internas (pedido del dueño en la v2).

## Lo que el dueño quiere

- **Pistas, no explicaciones:** imágenes y acciones de los juegos, sin sus nombres ni sus reglas.
- **"Se vienen cositas" y "Próximamente"**, sin la etiqueta "Desde el laboratorio" (la sacó).
- **Cerezas, no un corazón**, en el dibujo que se pinta.
- **Un video de 6 segundos como mucho, no un GIF: el GIF lo hace él.**
- **Poca carga cognitiva** (v2): «not a lot of different scenes/movements»: una sola escena (la
  grilla de 2×2) donde cada juego hace una sola jugada, en vez de escenas en serie.
- **Los cuatro a la vista el mayor tiempo posible** (v2): las baldosas aparecen y juegan entrelazadas.
- **Nada que suene a herramienta interna:** ni "laboratorio" ni "labs" (v2).
- **Loteo, en una sola de sus versiones:** el modo ⚡💧 Servicios (v2).

## Cómo se rehace

`animada.html` es la fuente (540×540 CSS, `render(t)` determinista; abierta sin `?render` se mueve
sola, para mirarla). Usa las fuentes del sitio (Bangers y Nunito) desde Google Fonts.

```bash
node marketing/proximamente-teaser/construir-video.mjs                     # el MP4 de output/
node marketing/proximamente-teaser/construir-video.mjs --fotos 0.95,2.3,3.3,4.3,5.6  # cuadros sueltos, para mirar
```

Necesita Chrome (`CHROME=<ruta>`, como los guiones de `tools/e2e/`) y ffmpeg. En la nube, Chromium
corre como root y necesita `--no-sandbox`: un `chrome.sh` que lo agregue y `CHROME=<ese archivo>`.

## Trampas conocidas

- **Las filas de la grilla de 7×7 se aplastan** si no llevan `grid-template-rows`: las casillas
  pintadas no tienen texto y su fila se encoge.
- **Las jugadas se dibujaron para un tablero de 330 px en 105,122** (la v1) y en la v2 se achican a su
  baldosa: el dedo, la onda y los «¡BOOM!» pasan por `aPagina(juego, x, y)`, que lleva esas
  coordenadas a la página con la escala de la baldosa, la de su turno y la de la grilla al final.
  Cada juego corre con su reloj corrido (`TURNO`), para que su jugada caiga en su turno, y tiene su
  propio dedo: dos jugadas pueden ir a la vez.
- El dibujo de cada juego es propio de esta página: si un juego cambia de colores o de forma, este
  adelanto no se entera solo (`marketing.mjs revisar` avisa de los commits que tocaron sus juegos).

## Historia

- **v1 (2026-10-13):** pedido del dueño: «una imagen promocional que, solo usando imágenes de los
  nuevos juegos que tenemos en Labs, diga próximamente y se vienen cositas… en vez de una imagen,
  un GIF… que no debe durar más de 6 segundos». Rutas rotas, Pintaminas y Números explosivos, en
  serie y al final juntos. Primero salió también un GIF; el dueño pidió solo el video («Crea un
  video, no un GIF. Yo crearé el GIF»), y el GIF se sacó. Después: «Elimina "desde el laboratorio"
  y cambia el corazón por una cereza»; quedaron dos cerezas rojas con el tallo verde.
- **v2 (2026-10-13):** pedido del dueño: «Refresh the 6 second promotional video with Loteo (one of
  the versions only), but since the max length is only 6 seconds, we might need to not do a lot of
  different scenes/movements in the sequence. Find a way it doesn't add a ton of cognitive load but
  shows the improvements. Don't use "labs" or anything denoting internal tooling.» Una sola escena:
  los cuatro juegos (con 📐 Loteo en su modo ⚡💧 Servicios) en una grilla de 2×2 fija; cada uno hace
  su jugada por turno. Después: «interlaza la aparición y animación de los recuadros, cosa de que el
  usuario pueda ver los cuatro desplegados por más tiempo»: cada baldosa aparece justo antes de su
  jugada, encadenadas (un dedo por juego); los cuatro quedan a la vista desde los 3,5 s.
