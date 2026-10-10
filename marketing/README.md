# Marketing

Los assets de marketing de Juegos de Salón: lo que se usa para mostrar la app afuera (videos,
y lo que venga). Cada uno es un objeto del repositorio con su carpeta, su memoria y su forma de
rehacerse (D-178).

| Asset | Versión | Archivos | Memoria |
|---|---|---|---|
| Video promocional | 6 · 2026-10-08 · 39,2 s | [16:9 para YouTube](promo-video/output/promo-youtube-16x9.mp4) · [vertical](promo-video/output/promo-vertical.mp4) | [promo-video/README.md](promo-video/README.md) |
| Teaser de El caso | 1 · 2026-10-10 · 6,0 s | [vertical](caso-teaser/output/el-caso-6s.mp4) · [GIF](caso-teaser/output/el-caso-6s.gif) | [caso-teaser/README.md](caso-teaser/README.md) |

[`registro.json`](registro.json) es la misma lista para leer con código: versión, fecha,
archivos, formatos, duración y estado de cada asset.

## Reglas

- **Antes de tocar un asset, se lee su memoria entera** (el README de su carpeta): qué pidió el
  dueño en cada vuelta, lo que ya se probó y las trampas conocidas.
- **Al terminar cada vuelta se anota:** una entrada en la Historia de su README (lo que pidió el
  dueño, en sus palabras cuando importa, y lo que se hizo), lo que cambió en "Lo que el dueño
  quiere" si aprendimos algo de sus gustos, y la versión, fecha y archivos en `registro.json` y
  en la tabla de arriba.
- **Solo la última versión de cada archivo final** vive en el repo (en `output/`); las anteriores
  quedan en la historia de git. Lo que se rehace solo (capturas, cuadros sueltos, intermedios)
  no va al repo.
- Todo lo de esta carpeta se publica con el sitio (GitHub Pages): nada privado acá.
- **El agente de usabilidad revisa cada asset en su ronda diaria** (U-34): `node tools/agents/marketing.mjs
  revisar` dice qué quedó atrás de la app (un juego nuevo que no sale, una versión vieja, commits
  que tocaron lo que muestra) y lo anota en el campo `revision` de `registro.json`. Rehacerlo lo
  decide el dueño.
- Un asset nuevo es una carpeta nueva con su README, que sigue el de `promo-video/` como modelo.
