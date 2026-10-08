#!/usr/bin/env bash
# Rehace el video promocional entero: capturas → render vertical y horizontal → música → mp4.
#   marketing/promo-video/construir.sh            (todo)
#   marketing/promo-video/construir.sh --sin-capturas   (usa las de plays/ que ya están)
# Necesita: el sitio servido en $SITIO (python3 -m http.server 8765 -d public),
# Playwright (ver navegador.mjs), ffmpeg y Pillow. Ver README.md.
set -euo pipefail
cd "$(dirname "$0")"
export SITIO="${SITIO:-http://localhost:8765}"

if [[ "${1:-}" != "--sin-capturas" ]]; then
  curl -sf -o /dev/null "$SITIO/" || { echo "El sitio no responde en $SITIO: python3 -m http.server 8765 -d public"; exit 1; }
  rm -rf plays
  node jugar.mjs linea dudo donde zip hoy   # los que salen en el video (ver GAMES en promo.html)
  node copa.mjs
fi
python3 preparar.py

node render.mjs trabajo-vertical.mp4
node render.mjs trabajo-horizontal.mp4 --wide

# La música (ver README, "La canción"): parte en su primer golpe (2,975 s del mp3) y dura lo que el
# video (76 golpes, 35,1 s: alcanza sin repetir compases), con fundido de entrada y de salida de 1 s.
DUR=$(node -e "console.log((76 * 60 / 130).toFixed(4))")
ffmpeg -y -loglevel error -i music/cancion.mp3 -filter_complex \
  "[0:a]atrim=start=2.975,asetpts=PTS-STARTPTS,atrim=end=$DUR,afade=t=in:st=0:d=1,afade=t=out:st=$(node -e "console.log(($DUR - 1).toFixed(4))"):d=1[o]" \
  -map "[o]" -ar 48000 trabajo-audio.wav

for f in vertical:promo-vertical horizontal:promo-youtube-16x9; do
  ffmpeg -y -loglevel error -i "trabajo-${f%%:*}.mp4" -i trabajo-audio.wav -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "output/${f#*:}.mp4"
done
rm -f trabajo-*.mp4 trabajo-audio.wav
ls -la output
