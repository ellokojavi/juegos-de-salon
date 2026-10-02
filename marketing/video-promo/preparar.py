#!/usr/bin/env python3
"""Deja las capturas de plays/ listas para promo.html.

1. Las achica a 546 px de ancho: es lo que ocupan en el celular del video, y con las de 780 px
   Chrome no alcanza a decodificar las ~150 imágenes y el render se cae ("EncodingError").
2. Escribe plays/plays.js (window.PLAYS) desde plays/plays.json, que promo.html carga con <script>
   porque abierto como file:// no puede pedir el JSON.

Uso: python3 preparar.py   (necesita Pillow: pip install pillow)
"""
import glob, json, os
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
PLAYS = os.path.join(AQUI, 'plays')
ANCHO = 546

for f in glob.glob(os.path.join(PLAYS, '*.png')):
    im = Image.open(f)
    if im.width > ANCHO + 10:
        im.convert('RGB').resize((ANCHO, round(im.height * ANCHO / im.width)), Image.LANCZOS).save(f, optimize=True)

d = json.load(open(os.path.join(PLAYS, 'plays.json')))
def redondo(v):
    if isinstance(v, float): return round(v, 1)
    if isinstance(v, list): return [redondo(x) for x in v]
    return v
for jugadas in d.values():
    for fr in jugadas:
        if fr['tap']: fr['tap'] = {k: redondo(v) for k, v in fr['tap'].items()}
open(os.path.join(PLAYS, 'plays.js'), 'w').write('window.PLAYS = ' + json.dumps(d, ensure_ascii=False) + ';\n')
print('listo:', ', '.join(f'{k} {len(v)}' for k, v in d.items()))
