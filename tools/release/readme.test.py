#!/usr/bin/env python3
"""
Ejecutar: python3 tools/release/readme.test.py

Prueba la parte de `tools/release/readme.py` que decide si un cambio cuenta o no: el estampado de
versión tocaba todos los `index.html` en cada publicación (C-11) y no cambia ninguna pantalla,
así que no puede envejecer las capturas (D-51). Desde D-205 la versión ya no está en git, pero los
commits viejos que miran las capturas siguen trayendo esos estampados.
"""
import importlib.util, pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('readme', RAIZ / 'tools/release/readme.py')
readme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(readme)

CASOS = [
    # (qué es, diff, ¿es solo estampado?)
    ('la hoja de estilos re-estampada',
     '--- a/index.html\n+++ b/index.html\n'
     '-  <link rel="stylesheet" href="style.css?v=0.25.2">\n'
     '+  <link rel="stylesheet" href="style.css?v=0.25.3">', True),
    ('la versión del pie del menú',
     '-  <p class="pie">v0.25.2 · hecho con cariño</p>\n'
     '+  <p class="pie">v0.25.3 · hecho con cariño</p>', True),
    ('el import map entero, con varios módulos',
     '-{"a.js": "a.js?v=0.25.2", "b.js": "b.js?v=0.25.2"}\n'
     '+{"a.js": "a.js?v=0.25.3", "b.js": "b.js?v=0.25.3"}', True),
    # El día que la versión salió de git (D-205): el import map se fue entero y las marcas, sin número
    ('la versión sacada de las páginas',
     '-  <script type="importmap" id="importmap">{"imports": {"./a.js": "./a.js?v=0.98.1"}}</script>\n'
     '-  <link rel="stylesheet" href="style.css?v=0.98.1">\n'
     '+  <link rel="stylesheet" href="style.css">\n'
     '-  <meta property="og:image" content="https://x.cl/assets/og/menu.jpg?v=0.98.1">\n'
     '+  <meta property="og:image" content="https://x.cl/assets/og/menu.jpg">\n'
     '-  <p class="pie">v0.98.1 · hecho con cariño</p>\n'
     '+  <p class="pie">v0.0.0 · hecho con cariño</p>', True),
    # Lo que sí es un cambio, aunque la línea lleve un ?v= al lado
    ('un módulo nuevo en el import map',
     '-{"a.js": "a.js?v=0.25.2"}\n'
     '+{"a.js": "a.js?v=0.25.3", "b.js": "b.js?v=0.25.3"}', False),
    ('texto cambiado en la misma línea que la marca',
     '-<p data-v="0.25.2">Toca para sacar carta</p>\n'
     '+<p data-v="0.25.3">Toca para dar vuelta la carta</p>', False),
    ('una pantalla nueva',
     '+  <section class="screen" id="screen-nueva"></section>', False),
    ('un diff vacío', '', False),
    ('solo imágenes', 'Binary files a/x.png and b/x.png differ', False),
]

fallas = 0
for nombre, diff, esperado in CASOS:
    obtenido = readme.solo_estampa(diff)
    if obtenido != esperado:
        fallas += 1
        print(f'  ✗ {nombre}: devolvió {obtenido} y se esperaba {esperado}')

# La marca reconoce las dos formas que estampaba set-version.py, y ninguna otra versión suelta
assert readme.ESTAMPA.search('href="a.css?v=1.2.3"'), 'no reconoce ?v='
assert readme.ESTAMPA.search('v0.25.2 · Juegos de Salón'), 'no reconoce la del pie'
assert not readme.ESTAMPA.search('la versión 1.2.3 del juego'), 'reconoce de más'

if fallas:
    sys.exit(f'readme: {fallas} caso(s) mal')
print(f'readme: {len(CASOS)} casos de "esto es solo un estampado" en verde')
