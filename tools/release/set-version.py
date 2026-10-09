#!/usr/bin/env python3
"""
Estampa la versión en la copia del sitio que se publica, para evitar caché mezclada (HTML nuevo con
JS viejo). Lo corre `.github/workflows/publicar.yml` en cada fusión a main, sobre `_site/` (D-205):
las páginas de `public/` en git no llevan versión, así que dos PR abiertos ya no chocan en los
cincuenta `index.html` que antes se reestampaban en cada uno.

- Escribe un <script type="importmap"> en cada página que carga módulos, que mapea TODOS los módulos
  JS del sitio (**/*.js, D-192) a la misma ruta con ?v=CLAVE. Los import maps se aplican también a
  los imports anidados (un módulo que importa a otro) y a los import() dinámicos.
- Agrega ?v=CLAVE a las hojas de estilo, a los scripts clásicos del sitio (`vigia.js`, D-251) y a las imágenes de las tarjetas sociales (og:image,
  twitter:image), para que un cambio de dibujo no se quede pegado en la caché de WhatsApp (D-72).
- Pone el número de versión en el pie del menú.

El número es el de la primera entrada de CHANGELOG.md (`## X.Y.Z — fecha`), que se escribe al
fusionar. La CLAVE de caché es ese número más el commit (`0.98.1-09eb4db`): cada publicación
invalida la caché aunque alguien fusione sin subir la versión. `versionOf` (stats.js) lee igual el
X.Y.Z del principio.

Que el README y las tarjetas estén al día ya no se pregunta aquí: lo frena el check `pruebas` de
cada PR, y publicar.yml lo vuelve a correr antes de publicar (C-11, C-13, D-181).

Uso:
  python3 tools/release/set-version.py --sitio _site [--commit <sha>]   estampa esa copia
  python3 tools/release/set-version.py --version                        imprime X.Y.Z
"""
import re, sys, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
CHANGELOG = ROOT / 'CHANGELOG.md'
OG = re.compile(r'(/assets/og/[^"?]+\.jpg)(\?v=[^"]*)?"')


def version():
    """La de la primera entrada del CHANGELOG: `## 0.98.1 — 2026-10-04`."""
    m = re.search(r'^## (\d+\.\d+\.\d+)\b', CHANGELOG.read_text(), re.M)
    if not m:
        sys.exit('CHANGELOG.md no tiene ninguna entrada "## X.Y.Z — fecha"')
    return m.group(1)


def modulos(sitio):
    """Todos los módulos JS del sitio (D-192): uno nuevo entra solo, sin lista que mantener."""
    return sorted(str(f.relative_to(sitio)) for f in sitio.rglob('*.js'))


def estampar(sitio, numero, clave):
    mods = modulos(sitio)
    paginas = 0
    for path in sorted(sitio.rglob('index.html')):
        html = original = path.read_text()
        # Las tarjetas sociales están también en las páginas puente, que no cargan módulos
        html = OG.sub(lambda m: f'{m.group(1)}?v={clave}"', html)
        if 'type="module"' in html:
            prefix = '../' * (len(path.relative_to(sitio).parts) - 1) or './'
            imports = {f'{prefix}{m}': f'{prefix}{m}?v={clave}' for m in mods}
            block = '<script type="importmap" id="importmap">' + json.dumps({'imports': imports}, ensure_ascii=False) + '</script>'
            if 'id="importmap"' in html:
                html = re.sub(r'<script type="importmap" id="importmap">.*?</script>', lambda _: block, html, flags=re.S)
            else:
                # antes de la primera hoja de estilos (y por lo tanto antes de cualquier módulo)
                if '  <link rel="stylesheet"' not in html:
                    sys.exit(f'{path}: carga módulos y no tiene hoja de estilos antes de la cual poner el import map')
                html = html.replace('  <link rel="stylesheet"', '  ' + block + '\n  <link rel="stylesheet"', 1)
            html = re.sub(r'(<link rel="stylesheet" href="[^"?]+)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={clave}"', html)
            # Los scripts clásicos del sitio (el vigía, D-251): el import map no los alcanza
            html = re.sub(r'(<script src="(?![a-z]+:|//)[^"?]+\.js)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={clave}"', html)
            html = re.sub(r'v\d+\.\d+\.\d+ ·', f'v{numero} ·', html)
            paginas += 1
        if html != original:
            path.write_text(html)
    if not paginas:
        sys.exit(f'{sitio}: ninguna página carga módulos; ¿es la carpeta del sitio?')
    print(f'{sitio}: {paginas} páginas con import map de {len(mods)} módulos · versión {numero} · caché {clave}')


def main(args):
    if args == ['--version']:
        print(version())
        return
    if '--sitio' not in args or args.index('--sitio') + 1 >= len(args):
        sys.exit(__doc__ + '\nLa versión ya no se estampa en public/ antes de commitear (D-205): '
                 'se escribe la entrada en CHANGELOG.md y publicar.yml estampa al publicar.')
    sitio = pathlib.Path(args[args.index('--sitio') + 1]).resolve()
    if sitio == (ROOT / 'public').resolve():
        sys.exit('public/ no se estampa: es lo que está en git (D-205). Copia el sitio y estampa la copia.')
    commit = args[args.index('--commit') + 1] if '--commit' in args else \
        subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    numero = version()
    estampar(sitio, numero, f'{numero}-{commit[:7]}' if commit else numero)


if __name__ == '__main__':
    main(sys.argv[1:])
