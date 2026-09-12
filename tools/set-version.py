#!/usr/bin/env python3
"""
Estampa una versión en el sitio para evitar caché mezclada (HTML nuevo con JS viejo).

- Escribe/actualiza un <script type="importmap"> en cada página HTML que mapea TODOS los
  módulos JS del sitio a la misma ruta con ?v=VERSION. Los import maps se aplican también a
  los imports anidados (un módulo que importa a otro) y a los import() dinámicos.
- Agrega ?v=VERSION a las hojas de estilo.
- Actualiza el número de versión visible en el pie del menú.

Uso:  python3 tools/set-version.py 0.4.6
"""
import re, sys, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODULES = [
    'assets/js/ui.js', 'assets/js/i18n.js', 'assets/js/sound.js', 'assets/js/games.js', 'assets/js/firebase-config.js', 'assets/js/frases.js',
    'cuarto-rey/game.js', 'cuarto-rey/rules.js',
    'toque-y-fama/game.js', 'toque-y-fama/rules.js', 'toque-y-fama/engine.js',
    'assets/js/transport/local.js', 'assets/js/transport/firebase.js', 'assets/js/transport/cleanup.js', 'assets/js/transport/dispose.js', 'assets/js/transport/errors.js', 'assets/js/transport/ratelimit.js', 'assets/js/transport/stats.js', 'assets/js/handoff.js', 'assets/js/session.js', 'assets/js/chat.js',
    'batalla-naval/game.js', 'batalla-naval/rules.js', 'batalla-naval/engine.js',
    'linea-de-tiempo/game.js', 'linea-de-tiempo/rules.js', 'linea-de-tiempo/engine.js',
    'linea-de-tiempo/decks/index.js', 'linea-de-tiempo/decks/historia.js', 'linea-de-tiempo/decks/musica.js',
    'linea-de-tiempo/decks/chile.js', 'linea-de-tiempo/decks/pop.js', 'linea-de-tiempo/decks/brasil.js', 'linea-de-tiempo/decks/futbol.js',
    'panel/panel.js', 'panel/aggregate.js',
]
PAGES = { 'index.html': '', 'cuarto-rey/index.html': '../', 'toque-y-fama/index.html': '../', 'batalla-naval/index.html': '../', 'linea-de-tiempo/index.html': '../', 'panel/index.html': '../' }

def main(version):
    for page, prefix in PAGES.items():
        path = ROOT / page
        html = path.read_text()
        imports = { f'{prefix}{m}' if prefix else f'./{m}': f'{prefix}{m}?v={version}' if prefix else f'./{m}?v={version}' for m in MODULES }
        block = '<script type="importmap" id="importmap">' + json.dumps({ 'imports': imports }, ensure_ascii=False) + '</script>'
        if 'id="importmap"' in html:
            html = re.sub(r'<script type="importmap" id="importmap">.*?</script>', block, html, flags=re.S)
        else:
            # antes de la primera hoja de estilos (y por lo tanto antes de cualquier módulo)
            html = html.replace('  <link rel="stylesheet"', '  ' + block + '\n  <link rel="stylesheet"', 1)
        html = re.sub(r'(<link rel="stylesheet" href="[^"?]+)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={version}"', html)
        html = re.sub(r'v\d+\.\d+\.\d+ ·', f'v{version} ·', html)
        path.write_text(html)
        print(f'{page}: importmap con {len(imports)} módulos, versión {version}')

if __name__ == '__main__':
    if len(sys.argv) != 2 or not re.fullmatch(r'\d+\.\d+\.\d+', sys.argv[1]):
        sys.exit('uso: python3 tools/set-version.py X.Y.Z')
    main(sys.argv[1])
