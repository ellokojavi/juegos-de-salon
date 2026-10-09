# Tutorial: cómo compartir

La memoria del video corto que enseña a compartir Juegos de Salón desde la portada, con la hoja de
compartir (D-253) en un iPhone. Sigue el modelo de [`../promo-video/`](../promo-video/README.md)
(D-178): **se lee entero antes de tocarlo** y cada vuelta se anota en [Historia](#historia) y en
[`../registro.json`](../registro.json).

## Hoy: versión 1 (2026-10-09)

| | |
|---|---|
| Archivos | [`output/compartir-vertical.mp4`](output/compartir-vertical.mp4) (1080×1920: estados de WhatsApp, Reels, Shorts) · [`output/compartir-16x9.mp4`](output/compartir-16x9.mp4) (1920×1080) |
| Duración | 6,0 s, H.264, 30 cuadros por segundo, **sin audio** |
| Idioma | Español (la hoja con el video sale solo en español, D-254) |
| Dispositivo | iPhone: la pantalla de 390×844 puntos, la isla dinámica y el menú de compartir de iOS |
| App que muestra | 0.134.1 |

## Lo que el dueño quiere

- **6 segundos o menos**, que expliquen cómo compartir el link y el video con la hoja nueva.
- **iOS:** el dispositivo es un iPhone.
- **Sin audio, solo animación.**
- Lo de todos los assets (ver el video promocional): pantallas de verdad, el dedo a la vista, el
  estilo neón con Bangers y Nunito.

## El guion

| Segundos | Paso (arriba) | Qué pasa en el celular |
|---|---|---|
| 0 – 1,3 | "¿CÓMO SE COMPARTE?" · ① Toca compartir | El iPhone sube con la portada; el dedo toca el botón de compartir |
| 1,3 – 2,75 | ② Elige el video | Sube la hoja de compartir (captura real); el dedo toca "Compartir el video" |
| 2,75 – 4,15 | ③ Elige el chat | Sube el menú de compartir de iOS (dibujado); el dedo toca WhatsApp |
| 4,15 – 6,0 | ✅ ¡Listo, enviado! · **juegosdesalon.cl** | El chat "Los primos" con el mensaje: la vista previa del video y su texto |

En 16:9 el celular va a la derecha (al 80 %) y el título, los pasos y la URL a la izquierda; en
vertical el celular va al 120 %, para que se lea en la pantalla de un teléfono.

## Cómo está hecho

- **`capturar.mjs`** abre la portada en español a 390×844 (el ancho de un iPhone), sin las
  partículas que flotan, y saca dos capturas: la portada y la hoja abierta. Anota dónde están el
  botón de compartir y las dos opciones (`capturas/puntos.json` y `puntos.js`, que la página
  carga como script porque se abre como `file://`).
- **`tutorial.html`** es el video: todo es función del tiempo (`render(t)`), como `promo.html`.
  La hoja sube como en la app: el fondo oscurecido aparece y el panel sube desde abajo (dos capas de
  la misma captura, recortadas en `puntos.hoja`). El menú de iOS y el chat están dibujados en HTML.
- **`../promo-video/render.mjs --pagina tutorial.html`** lo renderiza cuadro a cuadro (la opción
  `--pagina` se agregó para este asset); `construir.sh` hace todo, sin pista de audio.

```bash
python3 -m http.server 8765 -d public          # en otra terminal (o SITIO=… con otro puerto)
marketing/share-tutorial/construir.sh          # ~1 min: capturas y los dos renders
node ../promo-video/render.mjs --pagina tutorial.html --fotos fotos --tiempos 1.05,2.55,3.95,5.6
```

## Trampas conocidas

- **El menú de compartir de iOS y el chat son dibujos:** el del sistema no se puede capturar
  desde un navegador. Los íconos son genéricos (colores y símbolos), con el nombre de cada app
  debajo; no son los logos. Si iOS cambia mucho su menú, se ajusta el HTML.
- **El mensaje del chat copia el de la app** ("🎬 *Juegos de Salón* · Mira el video" y su primera
  línea, `shareSheet` en `i18n.js`): si cambia ese texto, se cambia en `tutorial.html`.
- **Las coordenadas de los toques salen de la app** (`puntos.js`); la de WhatsApp está fija en el
  dibujo del menú de iOS.
- La miniatura del video es `public/assets/img/trailer.jpg`, la misma de la portada.

## Historia

### v1 · 2026-10-09 · 6,0 s, vertical y 16:9, sin audio
> "Crea un video de 6 segundos o menos que explica cómo compartir el link y video de Juegos de
> Salón con la tarjeta nueva de share. Asume que el dispositivo es iOS." Y después: "sin audio,
> solo animación".

Cuatro pasos en 6 s sobre un iPhone: tocar compartir, elegir el video, elegir el chat y el mensaje
enviado, con juegosdesalon.cl al final. Las pantallas de la app son capturas reales de la 0.134.1.
