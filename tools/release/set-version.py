#!/usr/bin/env python3
"""
Estampa una versión en el sitio para evitar caché mezclada (HTML nuevo con JS viejo).

- Escribe/actualiza un <script type="importmap"> en cada página de public/ que carga módulos, que
  mapea TODOS los módulos JS del sitio (public/**/*.js, D-190) a la misma ruta con ?v=VERSION.
  Los import maps se aplican también a los imports anidados (un módulo que importa a otro) y a
  los import() dinámicos.
- Agrega ?v=VERSION a las hojas de estilo.
- Actualiza el número de versión visible en el pie del menú.

- Antes de estampar, revisa que el README no haya quedado viejo (tools/release/readme.py revisar)
  y que las imágenes de las tarjetas sociales estén al día (tools/release/og.mjs revisar, D-181):
  la publicación es el único momento por el que pasan todos los cambios, así que es el
  lugar donde preguntarlo. Con --igual se estampa igual, para una urgencia.

Uso:  python3 tools/release/set-version.py 0.4.6 [--igual]
"""
import re, sys, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITIO = ROOT / 'public'


def modulos():
    """Todos los módulos JS del sitio (D-190): uno nuevo entra solo, sin lista que mantener."""
    return sorted(str(f.relative_to(SITIO)) for f in SITIO.rglob('*.js'))


def paginas():
    """Las páginas que cargan módulos, con lo que hay que subir desde ellas hasta la raíz del sitio.
    Las puertas de /en/ y /pt/ y las páginas puente no cargan módulos: no llevan import map."""
    for f in sorted(SITIO.rglob('index.html')):
        if 'type="module"' in f.read_text():
            rel = f.relative_to(SITIO)
            yield rel, '../' * (len(rel.parts) - 1)


def tarjetas_sociales():
    """Las etiquetas de Open Graph salen de games.js: se rehacen antes de estampar (D-72)."""
    r = subprocess.run(['node', str(ROOT / 'tools/release/og.mjs'), 'tarjetas'], capture_output=True, text=True)
    ultima = [l for l in r.stdout.splitlines() if l and not l.startswith('  ')]
    print('Tarjetas sociales:', ultima[-1] if ultima else r.stderr.strip())


def revisar_imagenes():
    """Las imágenes de las tarjetas, contra su dibujo y sus textos de hoy (D-181). True si están al día."""
    print('Imágenes de las tarjetas:', flush=True)
    return subprocess.run(['node', str(ROOT / 'tools/release/og.mjs'), 'revisar']).returncode == 0


def revisar_readme():
    """El README, contra el código de hoy. Devuelve True si está al día."""
    print('README:', flush=True)
    return subprocess.run([sys.executable, str(ROOT / 'tools/release/readme.py'), 'revisar']).returncode == 0


def main(version):
    mods = modulos()
    for page, prefix in paginas():
        path = SITIO / page
        html = path.read_text()
        imports = { f'{prefix or "./"}{m}': f'{prefix or "./"}{m}?v={version}' for m in mods }
        block = '<script type="importmap" id="importmap">' + json.dumps({ 'imports': imports }, ensure_ascii=False) + '</script>'
        if 'id="importmap"' in html:
            html = re.sub(r'<script type="importmap" id="importmap">.*?</script>', block, html, flags=re.S)
        else:
            # antes de la primera hoja de estilos (y por lo tanto antes de cualquier módulo)
            html = html.replace('  <link rel="stylesheet"', '  ' + block + '\n  <link rel="stylesheet"', 1)
        html = re.sub(r'(<link rel="stylesheet" href="[^"?]+)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={version}"', html)
        html = re.sub(r'v\d+\.\d+\.\d+ ·', f'v{version} ·', html)
        path.write_text(html)
        print(f'public/{page}: importmap con {len(imports)} módulos, versión {version}')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--igual']
    if len(args) != 1 or not re.fullmatch(r'\d+\.\d+\.\d+', args[0]):
        sys.exit('uso: python3 tools/release/set-version.py X.Y.Z [--igual]')
    if not revisar_readme() and '--igual' not in sys.argv:
        sys.exit('\nel README quedó atrás del código. Arriba dice qué le falta.\n'
                 'Para estampar igual (y arreglarlo después): '
                 f'python3 tools/release/set-version.py {args[0]} --igual')
    # Una imagen hecha con el dibujo viejo o antes de cambiar una bajada (las píldoras desalineadas
    # volvieron así más de una vez): se rehace antes de publicar, no después (D-181)
    if not revisar_imagenes() and '--igual' not in sys.argv:
        sys.exit('\nhay imágenes de tarjetas que quedaron atrás: node tools/release/og.mjs imagenes\n'
                 'Para estampar igual (y arreglarlo después): '
                 f'python3 tools/release/set-version.py {args[0]} --igual')
    print()
    main(args[0])
    # Después de estampar: las tarjetas llevan la versión en la URL de la imagen, para que un
    # cambio de dibujo no se quede pegado en la caché de WhatsApp (D-72).
    tarjetas_sociales()
