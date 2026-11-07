#!/usr/bin/env bash
# Rehace el teaser de El caso: capturas reales del prototipo → video vertical de 6 s (sin audio) y un GIF.
#   marketing/case-teaser/build.sh                  (todo)
#   marketing/case-teaser/build.sh --sin-capturas   (usa las de capturas/ que ya están)
# Necesita el sitio servido en $SITIO, Playwright y ffmpeg, como el video promocional (../promo-video/README.md).
set -euo pipefail
cd "$(dirname "$0")"
export SITIO="${SITIO:-http://localhost:8765}"
if [[ "${1:-}" != "--sin-capturas" ]]; then
  curl -sf -o /dev/null "$SITIO/labs/case/" || { echo "El sitio no responde en $SITIO: python3 -m http.server 8765 -d public"; exit 1; }
  node capture.mjs
fi
node render.mjs output/case-6s.mp4
# El GIF para WhatsApp: 540 px de ancho, 15 cuadros por segundo, en bucle
ffmpeg -loglevel error -y -i output/case-6s.mp4 \
  -vf "fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" \
  -loop 0 output/case-6s.gif
ls -la output
