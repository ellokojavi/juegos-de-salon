---
name: promo-video
description: El video promocional de Juegos de Salón (y cualquier asset de marketing). Úsalo siempre que se trabaje en el video, sea una versión nueva, un cambio a la existente, sus textos para YouTube, su música o un video nuevo desde cero, antes de tocar nada. Trae la memoria completa del video, lo que el dueño ya pidió, cómo se rehace y cómo dejar anotada la vuelta.
---

# Video promocional

El video y su memoria viven en `marketing/promo-video/` (D-178).

1. **Lee entero `marketing/promo-video/README.md` antes de proponer o tocar nada.** Ahí está lo
   que el dueño quiere (sus pedidos de cada versión), el guion actual, cómo está hecho, la
   canción, las trampas conocidas y la historia. Lee también `marketing/README.md` (las reglas
   de los assets) y `marketing/registro.json`. Un video nuevo desde cero parte igual: lo que el
   dueño quiere vale para todos.
2. **Trabaja como dice el README:** `jugar.mjs` para las jugadas (azar fijo, se revisa con
   `hoja.py`), `promo.html` para el guion, `render.mjs --fotos … --tiempos …` para mirar cuadros
   sueltos de **las dos versiones** (vertical y `--wide`) antes de renderizar completo, y
   `construir.sh` para el final. Sirve el sitio en un puerto propio si hay otras sesiones (D-135).
3. **Entrega los dos mp4** al dueño y di qué revisaste y qué no (por ejemplo, la música no se
   puede escuchar desde acá).
4. **Para subirlo a YouTube** (el canal del dueño, @eljotairi) se sigue "Para YouTube" del README:
   archivos de menos de 10 MB, Claude in Chrome, todo lleno y en *Unlisted*, y **"Save" lo aprieta el
   dueño**. Lo subido se anota en "Lo subido".
5. **Al cerrar la vuelta, anótala** antes de abrir el PR:
   - una entrada nueva en "Historia" del README, con lo que pidió el dueño (en sus palabras cuando
     importa) y lo que se hizo;
   - "Hoy", "Lo que el dueño quiere", "El guion" y "Trampas conocidas" al día;
   - `marketing/registro.json` y la tabla de `marketing/README.md` con la versión nueva;
   - los mp4 de `salida/` reemplazados (solo la última versión vive en el repo).
