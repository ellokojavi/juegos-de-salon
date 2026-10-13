# Se vienen cositas

La memoria del adelanto de 6 s que muestra lo que se viene del laboratorio sin nombrarlo. Sigue el
modelo de [`../promo-video/`](../promo-video/README.md) (D-178): se lee antes de tocarlo y cada
vuelta se anota en [Historia](#historia) y en [`../registro.json`](../registro.json).

## Hoy: versión 1 (2026-10-13)

| | |
|---|---|
| Archivos | [`output/se-vienen-cositas-6s.mp4`](output/se-vienen-cositas-6s.mp4) (1080×1080, 6 s, 30 cuadros por segundo, sin audio) |
| Idioma | Español |
| Dónde va | WhatsApp, estados y redes: un adelanto, sin link a ningún juego |
| App que muestra | 0.168.10 |

**Qué muestra, sin nombrar ningún juego** (pedido del dueño: «dar pistas de lo que se viene a través
de imágenes y acciones y no de explicar o nombrar los juegos»): arriba "¡Se vienen cositas!", y en
el medio, una tras otra:

| Segundos | Juego (no se nombra) | La acción |
|---|---|---|
| 0,25 – 1,85 | 🚇 Rutas rotas | Un plano de metro de 3×3 con dos piezas dadas vuelta; el dedo arrastra de una a la otra, el rectángulo da media vuelta y las tres líneas calzan y brillan |
| 1,75 – 3,25 | 🖌️ Pintaminas | Una grilla de 7×7 con los números de las casillas vacías; el dedo la recorre y se pintan dos cerezas, rojas con el tallo verde (como en el modo difícil del juego), que laten |
| 3,15 – 4,55 | 💥 Números explosivos | Una grilla de números con el borde de su color; el dedo une 7 y 3 (suman 10) y después 5 y 5: cada par estalla con un «¡BOOM!», chispas y el tablero tiembla |
| 4,45 – 6,0 | Los tres | Los tres tableros, chicos y terminados, en fila; cae «PRÓXIMAMENTE» y abajo `juegosdesalon.cl` |

El primer y el último cuarto de segundo funden al color del fondo, para que se pueda repetir en
bucle sin salto (el dueño hace el GIF desde el video).

**Muestra juegos que no están en la portada, a propósito** (`"laboratorio"` en `registro.json`, U-34).
No son capturas de la app: los tres tableros se dibujan en la página, con los colores y la forma de
cada juego (el plano oscuro con líneas celeste, amarilla y verde; las casillas con su número y las
cerezas de dos colores; los
números con el borde de su color), para que la jugada sea clara en 1,5 s.

## Lo que el dueño quiere

- **Pistas, no explicaciones:** imágenes y acciones de los juegos, sin sus nombres ni sus reglas.
- **"Se vienen cositas" y "Próximamente"**, sin la etiqueta "Desde el laboratorio" (la sacó).
- **Cerezas, no un corazón**, en el dibujo que se pinta.
- **Un video de 6 segundos como mucho, no un GIF: el GIF lo hace él**, con los tres juegos del
  laboratorio (juntos o en serie: aquí en serie y al final juntos).

## Cómo se rehace

`animada.html` es la fuente (540×540 CSS, `render(t)` determinista; abierta sin `?render` se mueve
sola, para mirarla). Usa las fuentes del sitio (Bangers y Nunito) desde Google Fonts.

```bash
node marketing/proximamente-teaser/construir-video.mjs                     # el MP4 de output/
node marketing/proximamente-teaser/construir-video.mjs --fotos 1.1,2.4,3.75  # cuadros sueltos, para mirar
```

Necesita Chrome (`CHROME=<ruta>`, como los guiones de `tools/e2e/`) y ffmpeg. En la nube, Chromium
corre como root y necesita `--no-sandbox`: un `chrome.sh` que lo agregue y `CHROME=<ese archivo>`.

## Trampas conocidas

- **Las filas de la grilla de 7×7 se aplastan** si no llevan `grid-template-rows`: las casillas
  pintadas no tienen texto y su fila se encoge.
- El dibujo de cada juego es propio de esta página: si un juego cambia de colores o de forma, este
  adelanto no se entera solo (`marketing.mjs revisar` avisa de los commits que tocaron sus juegos).

## Historia

- **v1 (2026-10-13):** pedido del dueño: «una imagen promocional que, solo usando imágenes de los
  nuevos juegos que tenemos en Labs, diga próximamente y se vienen cositas… en vez de una imagen,
  un GIF… que no debe durar más de 6 segundos». Rutas rotas, Pintaminas y Números explosivos, en
  serie y al final juntos. Primero salió también un GIF; el dueño pidió solo el video («Crea un
  video, no un GIF. Yo crearé el GIF»), y el GIF se sacó. Después: «Elimina "desde el laboratorio"
  y cambia el corazón por una cereza»; quedaron dos cerezas rojas con el tallo verde.
