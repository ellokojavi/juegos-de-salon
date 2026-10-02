#!/usr/bin/env python3
"""La hoja de contacto de las jugadas capturadas: una fila por juego, con un círculo rojo donde
fue el toque que llevó a esa captura. Para revisar jugar.mjs antes de renderizar.

Uso: python3 hoja.py [juego…] → hoja.png
"""
import json, os, sys
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(AQUI, 'plays/plays.json')))
ids = sys.argv[1:] or list(d)
W, H = 234, 506
hoja = Image.new('RGB', (W * max(len(d[i]) for i in ids), H * len(ids)), 'black')
for r, i in enumerate(ids):
    for c, f in enumerate(d[i]):
        im = Image.open(os.path.join(AQUI, 'plays', f['img'])).convert('RGB').resize((W, H))
        if f['tap']:
            x, y = f['tap']['x'] * W / 390, f['tap']['y'] * H / 844
            ImageDraw.Draw(im).ellipse((x - 9, y - 9, x + 9, y + 9), outline='red', width=3)
        hoja.paste(im, (c * W, r * H))
hoja.save(os.path.join(AQUI, 'hoja.png'))
print('listo hoja.png')
