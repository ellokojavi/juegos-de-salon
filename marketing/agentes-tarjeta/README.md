# Tarjeta de Agentes

La memoria de la imagen que invita a probar 🕵️ Agentes, el juego del laboratorio (D-286). Sigue el
modelo de [`../promo-video/`](../promo-video/README.md) (D-178): se lee antes de tocarla y cada
vuelta se anota en [Historia](#historia) y en [`../registro.json`](../registro.json).

## Hoy: versión 1 (2026-10-11)

| | |
|---|---|
| Archivo | [`output/agentes-1200x630.jpg`](output/agentes-1200x630.jpg) (1200×630) |
| Idioma | Español (el prototipo está solo en español) |
| Dónde va | Se manda por WhatsApp junto al link de un amigo que prueba, y es la vista previa del link de `/labs/agents/` (`og:image` → `public/labs/agents/tarjeta.jpg`) |
| App que muestra | 0.158.0 |

**Qué dice:** "🧪 Nuevo · en prueba", el título con el sello de Clasificado, "Una pista. 12
palabras. Encuentra a tus agentes.", la advertencia del asesino y "un tablero nuevo cada día". A la
derecha, la pista «MAR · 3» con tres agentes destapados, la 🔍 sobre RÍO marcado 📌 y "¿RÍO? 💀 Ojo,
que puede ser el asesino…". Abajo, `juegosdesalon.cl` y el crédito a Codenames, como en el juego.

**Muestra un juego que no está en la portada, a propósito** (`"laboratorio": ["agentes"]` en
`registro.json`, U-34).

## Cómo se rehace

`tarjeta.html` es la fuente (600×315 CSS, escalada al ancho de la ventana) y
`node marketing/agentes-tarjeta/construir.mjs` la fotografía con Chrome y deja el JPG en `output/` y
en `public/labs/agents/tarjeta.jpg`. Usa las fuentes del sitio (Bangers y Nunito) desde Google Fonts.

## Historia

- **v1 (2026-10-11):** pedido del dueño, para que un amigo que prueba el juego lo vea al recibir el
  link.
