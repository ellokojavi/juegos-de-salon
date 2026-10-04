#!/usr/bin/env python3
"""Corta la imagen satelital entera en teselas cuadradas `fila-columna.jpg` (D-160).

Lo llama `node tools/generators/mapa.mjs satelite`. Antes las cortaba sips, que con
`--cropOffset 0 0` corta del centro y no de la esquina, e ignora algunos cortes que tocan el
borde: las teselas del polo norte salieron con la franja del ecuador (D-200). PIL corta exacto.

    python3 tools/generators/teselas.py <imagen> <carpeta> <columnas> <filas> <lado>
"""
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # la de la NASA tiene 233 millones de píxeles, a propósito

imagen, carpeta, columnas, filas, lado = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:6])
im = Image.open(imagen).convert('RGB')
if im.size != (columnas * lado, filas * lado):
    sys.exit(f'La imagen mide {im.size[0]} × {im.size[1]} y se esperaba {columnas * lado} × {filas * lado}')
for f in range(filas):
    for c in range(columnas):
        im.crop((c * lado, f * lado, (c + 1) * lado, (f + 1) * lado)).save(f'{carpeta}/{f}-{c}.jpg', quality=72)
