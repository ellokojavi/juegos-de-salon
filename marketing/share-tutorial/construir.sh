#!/usr/bin/env bash
# Rehace el tutorial de compartir: capturas reales → render vertical y horizontal (sin audio).
#   marketing/share-tutorial/construir.sh                  (todo)
#   marketing/share-tutorial/construir.sh --sin-capturas   (usa las de capturas/ que ya están)
# Necesita el sitio servido en $SITIO, Playwright y ffmpeg, como el video promocional (../promo-video/README.md).
set -euo pipefail
cd "$(dirname "$0")"
export SITIO="${SITIO:-http://localhost:8765}"
if [[ "${1:-}" != "--sin-capturas" ]]; then
  curl -sf -o /dev/null "$SITIO/" || { echo "El sitio no responde en $SITIO: python3 -m http.server 8765 -d public"; exit 1; }
  node capturar.mjs
  cp ../../public/assets/img/trailer.jpg capturas/trailer.jpg   # la miniatura del video, la misma de la portada
fi
node ../promo-video/render.mjs output/compartir-vertical.mp4 --pagina tutorial.html
node ../promo-video/render.mjs output/compartir-16x9.mp4 --pagina tutorial.html --wide
ls -la output
