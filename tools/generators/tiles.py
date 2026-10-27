#!/usr/bin/env python3
"""Cuts the whole satellite image into square tiles `row-column.webp` (D-160) and writes the whole
image at the given widths (D-159), all in WebP (D-460).

Called by `node tools/generators/map.mjs satellite`. sips used to cut them, which with
`--cropOffset 0 0` cuts from the center and not from the corner, and ignores some cuts that touch
the edge: the north pole tiles came out with the equator's band (D-201). PIL cuts exactly, and it
writes WebP straight from NASA's original, so the image is compressed only once.

    python3 tools/generators/tiles.py <image> <folder> <columns> <rows> <size> [<width>=<path> ...]
"""
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # NASA's has 233 million pixels, on purpose

WHOLE_QUALITY = 82  # the whole globe, what everyone sees: 60 % lighter than the JPEG at 78, same look
TILE_QUALITY = 78   # a tile, seen only zoomed in: 30 % lighter than the JPEG at 72

image, folder, columns, rows, size = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:6])
im = Image.open(image).convert('RGB')
if im.size != (columns * size, rows * size):
    sys.exit(f'The image measures {im.size[0]} × {im.size[1]} and {columns * size} × {rows * size} was expected')
for arg in sys.argv[6:]:
    width, path = arg.split('=', 1)
    w = int(width)
    im.resize((w, w // 2), Image.LANCZOS).save(path, quality=WHOLE_QUALITY, method=6)
    print(path)
for r in range(rows):
    for c in range(columns):
        im.crop((c * size, r * size, (c + 1) * size, (r + 1) * size)).save(f'{folder}/{r}-{c}.webp', quality=TILE_QUALITY, method=6)
