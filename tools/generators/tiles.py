#!/usr/bin/env python3
"""Cuts the whole satellite image into square tiles `row-column.jpg` (D-160).

Called by `node tools/generators/map.mjs satellite`. sips used to cut them, which with
`--cropOffset 0 0` cuts from the center and not from the corner, and ignores some cuts that touch
the edge: the north pole tiles came out with the equator's band (D-201). PIL cuts exactly.

    python3 tools/generators/tiles.py <image> <folder> <columns> <rows> <size>
"""
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # NASA's has 233 million pixels, on purpose

image, folder, columns, rows, size = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:6])
im = Image.open(image).convert('RGB')
if im.size != (columns * size, rows * size):
    sys.exit(f'The image measures {im.size[0]} × {im.size[1]} and {columns * size} × {rows * size} was expected')
for r in range(rows):
    for c in range(columns):
        im.crop((c * size, r * size, (c + 1) * size, (r + 1) * size)).save(f'{folder}/{r}-{c}.jpg', quality=72)
