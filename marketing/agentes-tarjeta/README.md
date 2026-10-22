# Tarjeta de Agentes

La memoria de la imagen que invitaba a probar 🕵️ Agentes, el juego del laboratorio (D-286). **Retired from the site in D-421:** Agentes left the lab for the home page, and the link preview of `/agents/` is now the game card that `tools/release/og.mjs` draws (`public/assets/og/agentes.jpg`, owned by the share cards). The image and the video stay here as the lab invitation; they still say "en prueba" and "un tablero nuevo cada día", which stopped being true in D-421. Sigue el
modelo de [`../promo-video/`](../promo-video/README.md) (D-178): se lee antes de tocarla y cada
vuelta se anota en [Historia](#historia) y en [`../registro.json`](../registro.json).

## Hoy: versión 2 (2026-10-11)

| | |
|---|---|
| Archivos | [`output/agentes-1200x630.jpg`](output/agentes-1200x630.jpg) (1200×630) · [`output/agentes-6s.mp4`](output/agentes-6s.mp4) (1200×630, 6 s, 30 cuadros por segundo, sin audio) · [`output/agentes-6s.gif`](output/agentes-6s.gif) (600×315, 15 cuadros por segundo, en bucle) |
| Idioma | Español (el prototipo está solo en español) |
| Dónde va | Se mandaba por WhatsApp junto al link de un amigo que prueba, y era la vista previa del link de `/labs/agents/` (`og:image` → `public/labs/agents/tarjeta.jpg`) until D-421, when `/labs/agents/` became a bridge to `/agents/` and the file left the site |
| App que muestra | 0.159.0 |

**Qué dice:** "🧪 Nuevo · en prueba", el título con el sello de Clasificado, "Una pista. 15
palabras. Encuentra a tus agentes.", la advertencia del asesino y "un tablero nuevo cada día". A la
derecha, la pista «MAR · 3» con tres agentes destapados, la 🔍 sobre RÍO marcado 📌 y "¿RÍO? 💀 Ojo,
que puede ser el asesino…". Abajo, `juegosdesalon.cl` y el crédito a Codenames, como en el juego.

**Muestra un juego que no está en la portada, a propósito** (`"laboratorio": ["agentes"]` en
`registro.json`, U-34).

**El video** es la misma tarjeta, animada en 6 s: entra "Nuevo · en prueba", cae el título y el
sello, la pista se descifra, las cartas aparecen de a una, la 🔍 destapa OLA, BARCO e ISLA y se
detiene en RÍO, que se marca 📌 ("¿RÍO? 💀 Ojo…"); a los 4,85 s RÍO resulta ser el asesino, con un
destello rojo ("💀 ¡Era el asesino! ¿Lo habrías visto?"), y el último cuarto de segundo se apaga
para que el GIF vuelva a empezar sin salto.

## Cómo se rehace

`tarjeta.html` es la fuente (600×315 CSS, escalada al ancho de la ventana) y
`node marketing/agentes-tarjeta/construir.mjs` la fotografía con Chrome y deja el JPG en `output/`
(until D-421 it also copied it to `public/labs/agents/tarjeta.jpg`). Usa las fuentes del sitio (Bangers y Nunito) desde Google Fonts.
El video sale de `animada.html` (la tarjeta con `render(t)`, determinista; abierta sin `?render` se
mueve sola, para mirarla): `node marketing/agentes-tarjeta/construir-video.mjs` la dibuja cuadro a
cuadro con Chrome y arma el MP4 y el GIF con ffmpeg.

## Historia

- **v1 (2026-10-11):** pedido del dueño, para que un amigo que prueba el juego lo vea al recibir el
  link. El mismo día, el video de 6 s y su GIF, para mandarlo por WhatsApp.
- **v2 (2026-10-11):** dice 15 palabras, por el tablero nuevo (D-287).
- **Retired (2026-10-22):** Agentes left the lab in Conexiones' place (D-421); the card is no longer served, and the build script no longer copies it into `public/`.
