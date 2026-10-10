# Teaser de El caso

La memoria del video corto que invita a probar 🔍 El caso, el juego del laboratorio, y a dejar un
comentario al final. Sigue el modelo de [`../promo-video/`](../promo-video/README.md) (D-178):
**se lee entero antes de tocarlo** y cada vuelta se anota en [Historia](#historia) y en
[`../registro.json`](../registro.json).

## Hoy: versión 1 (2026-10-10)

| | |
|---|---|
| Archivos | [`output/el-caso-6s.mp4`](output/el-caso-6s.mp4) (1080×1920) · [`output/el-caso-6s.gif`](output/el-caso-6s.gif) (540×960, 15 cuadros por segundo, en bucle) |
| Duración | 6,0 s, H.264, 30 cuadros por segundo, **sin audio** |
| Idioma | Español (el prototipo del laboratorio está solo en español) |
| Lleva a | `juegosdesalon.cl/labs/case`, el caso del día, que termina con el formulario "¿Qué te pareció?" (D-265) |
| App que muestra | 0.142.2 |

En `output/` vive **solo la última versión**, y GitHub Pages la publica con el sitio
(`juegosdesalon.cl/marketing/caso-teaser/output/…`). Las capturas de `capturas/` se rehacen y no
van al repo.

**Muestra un juego que no está en la portada, a propósito** (`"laboratorio": ["caso"]` en
`registro.json`, U-34): `node tools/agents/marketing.mjs revisar` no lo marca como "ya no está".
Cuando El caso salga del laboratorio, se saca ese campo y el link pasa a la ruta del juego.

## Lo que el dueño quiere

- **6 segundos, en español**, para pasarlo a GIF y mandarlo por WhatsApp.
- **Invitar a probarlo y a comentar**: el cierre dice "🧪 Nuevo · En prueba" y "Resuélvelo y
  cuéntanos qué te parece 💬".
- Lo de todos los assets: pantallas de verdad, el dedo a la vista, el estilo neón con Bangers y
  Nunito, y el título con los colores que se mueven, como en la app.

## El guion

| Segundos | Arriba | En el celular |
|---|---|---|
| 0 – 1,35 | "🔍 EL CASO" entra de un salto · "¿Quién es criminal?" | El iPhone sube con el caso recién abierto |
| 1,35 – 2,6 | "Deduce sin adivinar" | El dedo toca a Joaquín (se acerca) y después "🔪 Joaquín es criminal": cae el sello y sale "¡Bien!" |
| 2,6 – 3,95 | "Las pistas nunca mienten" | El dedo toca la pista nueva y la grilla ilumina a quienes nombra (D-264) |
| 3,95 – 6,0 | Cierre | "🔍 EL CASO", "🧪 Nuevo · En prueba", "Resuélvelo y cuéntanos qué te parece 💬" y **juegosdesalon.cl/labs/case** |

## Cómo está hecho

- **`capturar.mjs`** abre `/labs/case/?c=PRUEBA` a 390×844 (un iPhone), sin las partículas, con la
  página quieta en el mismo lugar (`scrollTo`, y sin `scrollIntoView`), y saca cinco capturas: el
  inicio, la persona elegida, el sello, el "¡Bien!" y la pista tocada. Elige a alguien que ya se
  puede deducir y anota dónde caen los toques en `capturas/puntos.js`.
- **`teaser.html`** es el video: todo es función del tiempo (`render(t)`), como `promo.html`.
- **`render.mjs`** lo dibuja cuadro a cuadro y se lo pasa a ffmpeg; `construir.sh` hace todo,
  también el GIF.

```bash
python3 -m http.server 8765 -d public          # en otra terminal (o SITIO=… con otro puerto)
marketing/caso-teaser/construir.sh              # ~1 min: capturas, video y GIF
node marketing/caso-teaser/render.mjs --fotos /tmp/fotos --tiempos 0.4,1.25,2.4,3.3,5.5
```

## Trampas conocidas

- **La v1 muestra el prototipo, que se borró (D-267):** `/labs/case/` es ahora el juego de La Copa y
  `capturar.mjs` busca la pantalla del prototipo (`.persona`, `__caso`), así que no sirve tal cual.
  Para una v2: pasar por la antesala (`#btn-empezar`) y la cuenta, y usar `.cs-persona`,
  `#btn-inocente`/`#btn-criminal` y `.cs-pista`, como `tools/e2e/case/lab.mjs`.

- **Playwright sin su Chrome:** si `navegador.mjs` dice que falta el ejecutable, se le pasa uno con
  `CHROME=` (por ejemplo el `chrome-headless-shell` de `~/Library/Caches/ms-playwright/`) y
  `PLAYWRIGHT=$(npm root -g)/playwright/index.mjs`.
- **El caso PRUEBA cambia si cambia el motor:** las capturas salen de nuevo con otro caso y otras
  personas; el guion no nombra a nadie, así que no hay que tocar `teaser.html`.

## Historia

### v1 · 2026-10-10 · 6,0 s, vertical, sin audio
> "Create, in Spanish, a 6-second video and a whatsapp message promoting "El Caso". I will make it
> a gif to then share on whatsapp, inviting to test it out and to provide feedback."

Tres momentos del juego de verdad (elegir, marcar con su sello, tocar la pista) y un cierre que
invita a probarlo y a comentar. Se suma un GIF de muestra a 540 px. El mensaje de WhatsApp quedó
en la conversación con el dueño.

Revisión de usabilidad (mismo día): arriba del celular la captura dejaba cortada la línea "Descubre
quién es criminal…" y la isla tapaba "¿Cómo se juega?". Una franja del color de la página, donde va
la hora en un iPhone (`.barra`, 40 pt), la tapa; la pantalla empieza en el marcador (U-34: texto cortado y superpuesto).
