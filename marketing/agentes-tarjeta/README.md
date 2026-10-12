# Tarjeta de Agentes

La memoria de la imagen que invita a probar 🕵️ Agentes, el juego del laboratorio (D-286). Sigue el
modelo de [`../promo-video/`](../promo-video/README.md) (D-178): se lee antes de tocarla y cada
vuelta se anota en [Historia](#historia) y en [`../registro.json`](../registro.json).

## Hoy: versión 2 (2026-10-11)

| | |
|---|---|
| Archivos | [`output/agentes-1200x630.jpg`](output/agentes-1200x630.jpg) (1200×630) · [`output/agentes-6s.mp4`](output/agentes-6s.mp4) (1200×630, 6 s, 30 cuadros por segundo, sin audio) · [`output/agentes-6s.gif`](output/agentes-6s.gif) (600×315, 15 cuadros por segundo, en bucle) |
| Idioma | Español (el prototipo está solo en español) |
| Dónde va | Se manda por WhatsApp junto al link de un amigo que prueba, y es la vista previa del link de `/labs/agents/` (`og:image` → `public/labs/agents/tarjeta.jpg`) |
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
`node marketing/agentes-tarjeta/construir.mjs` la fotografía con Chrome y deja el JPG en `output/` y
en `public/labs/agents/tarjeta.jpg`. Usa las fuentes del sitio (Bangers y Nunito) desde Google Fonts.
El video sale de `animada.html` (la tarjeta con `render(t)`, determinista; abierta sin `?render` se
mueve sola, para mirarla): `node marketing/agentes-tarjeta/construir-video.mjs` la dibuja cuadro a
cuadro con Chrome y arma el MP4 y el GIF con ffmpeg.

## Historia

- **v1 (2026-10-11):** pedido del dueño, para que un amigo que prueba el juego lo vea al recibir el
  link. El mismo día, el video de 6 s y su GIF, para mandarlo por WhatsApp.
- **v2 (2026-10-11):** dice 15 palabras, por el tablero nuevo (D-287).
