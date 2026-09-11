#!/usr/bin/env python3
"""
Laboratorio: espejar juegos, revisar que esté sano y promover un experimento.

  python3 tools/lab.py espejar <id>   Crea o refresca lab/<id>/index.html
  python3 tools/lab.py revisar        ¿Los espejos están al día? ¿lab.css está bien marcado?
  python3 tools/lab.py promover       Lleva el experimento aprobado a producción

Por qué existe (D-42): el laboratorio espeja el index.html de cada juego a mano.
Si el juego cambia y el espejo no, uno cree que está probando el juego y está
probando una copia vieja. `revisar` es lo que ataja eso; `espejar` lo arregla.

En lab.css cada bloque declara adónde va cuando el experimento se apruebe:

    /* @destino laboratorio */            nunca migra (la barra de aviso)
    /* @destino assets/css/base.css */    va a los estilos compartidos
    /* @destino linea-de-tiempo/style.css */

Sin esa marca, `revisar` falla: un estilo sin destino es un estilo que alguien
va a tener que adivinar dónde va, seis semanas después.
"""
import re, sys, os, shutil, subprocess, pathlib
from datetime import date

RAIZ = pathlib.Path(__file__).resolve().parent.parent
LAB = RAIZ / 'lab'
LAB_CSS = LAB / 'lab.css'
MARCA = re.compile(r'^\s*/\*\s*@destino\s+([^\s*]+)\s*\*/\s*$', re.M)

def juegos():
    """Los ids de juego, leídos del registro real para no repetir la lista."""
    txt = (RAIZ / 'assets/js/games.js').read_text()
    return re.findall(r"id:\s*'([^']+)'", txt)

# ---------------------------------------------------------------- espejar

def espejo(jid, rev):
    """El index.html del laboratorio, derivado del index.html real del juego."""
    h = (RAIZ / jid / 'index.html').read_text()

    # El laboratorio carga los módulos sin ?v=: siempre lo último del disco
    h = re.sub(r'\n?\s*<script type="importmap" id="importmap">.*?</script>', '', h, flags=re.S)
    h = re.sub(r'href="\.\./assets/css/base\.css(\?v=[^"]*)?"', 'href="../../assets/css/base.css"', h)
    h = re.sub(r'href="style\.css(\?v=[^"]*)?"', f'href="../../{jid}/style.css"', h)
    # No se instala como app
    h = re.sub(r'\s*<link rel="manifest"[^>]*>\n', '\n', h)
    h = re.sub(r'href="\.\./assets/icon\.svg"', 'href="../../assets/icon.svg"', h)
    h = re.sub(r'(<link rel="icon"[^>]*>)', r'\1\n  <meta name="robots" content="noindex">', h)
    h = re.sub(r'<title>([^<]*?)\s*·[^<]*</title>', r'<title>Laboratorio · \1</title>', h)
    # La hoja del experimento va al final: solo agrega, nunca reemplaza
    h = h.replace('</head>', f'  <link rel="stylesheet" href="../lab.css?r={rev}">\n</head>')
    # Aviso de que esto no es el sitio de verdad
    h = re.sub(r'(<main class="app"[^>]*>)',
               r'\1\n    <div class="lab-bar"><span>🧪 Laboratorio</span>'
               f'<a href="../../{jid}/">ir al juego real</a></div>', h)
    # El juego se importa desde su carpeta real: no hay lógica duplicada
    h = h.replace("import './game.js';", f"import '../../{jid}/game.js';")
    return h

def revision():
    """La marca ?r= que llevan hoy los espejos."""
    m = re.search(r'lab\.css\?r=(\d+)', (LAB / 'index.html').read_text())
    return int(m.group(1)) if m else 1

def cmd_espejar(jid):
    if jid not in juegos():
        sys.exit(f'no existe el juego "{jid}". Hay: {", ".join(juegos())}')
    destino = LAB / jid / 'index.html'
    destino.parent.mkdir(parents=True, exist_ok=True)
    nuevo = espejo(jid, revision())
    existia = destino.exists()
    destino.write_text(nuevo)
    print(f'{"refrescado" if existia else "creado"}: lab/{jid}/index.html')

    # Que aparezca en el menú del laboratorio
    menu = LAB / 'index.html'
    txt = menu.read_text()
    if f"'{jid}':" not in txt:
        txt = re.sub(r'(const EN_EL_LAB = \{)', r"\1 " + f"'{jid}': '{jid}/',", txt)
        menu.write_text(txt)
        print(f'agregado a EN_EL_LAB en lab/index.html')

# ---------------------------------------------------------------- lab.css

def bloques():
    """[(destino, css)] del experimento. Lo anterior a la primera marca es cabecera."""
    txt = LAB_CSS.read_text()
    cortes = list(MARCA.finditer(txt))
    if not cortes:
        return txt, []
    cabecera = txt[:cortes[0].start()]
    out = []
    for i, m in enumerate(cortes):
        fin = cortes[i + 1].start() if i + 1 < len(cortes) else len(txt)
        out.append((m.group(1), txt[m.end():fin].strip('\n')))
    return cabecera, out

def selectores(css):
    """Los selectores de un bloque, para avisar cuál ya existe en el destino."""
    sin_comentarios = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    return [s.strip() for m in re.finditer(r'([^{}]+)\{', sin_comentarios)
            for s in m.group(1).split(',') if s.strip() and not s.strip().startswith('@')]

# ---------------------------------------------------------------- revisar

def cmd_revisar():
    problemas, avisos = [], []

    # 1. Los espejos, al día con el juego real
    rev = revision()
    for d in sorted(LAB.iterdir()):
        if not d.is_dir() or not (d / 'index.html').exists():
            continue
        if d.name not in juegos():
            avisos.append(f'lab/{d.name}/ no corresponde a ningún juego del registro')
            continue
        if (d / 'index.html').read_text() != espejo(d.name, rev):
            problemas.append(f'lab/{d.name}/index.html quedó viejo respecto de {d.name}/index.html'
                             f'  →  python3 tools/lab.py espejar {d.name}')

    # 2. lab.css: todo bloque declara su destino
    cabecera, bs = bloques()
    if re.search(r'[.#a-zA-Z\[][^{}]*\{', re.sub(r'/\*.*?\*/', '', cabecera, flags=re.S)) and not bs:
        problemas.append('lab.css tiene estilos pero ningún /* @destino */: no se sabe adónde migrarían')
    for destino, css in bs:
        if destino == 'laboratorio':
            continue
        if not (RAIZ / destino).exists():
            problemas.append(f'@destino {destino}: ese archivo no existe')
            continue
        ya = (RAIZ / destino).read_text()
        for s in selectores(css):
            if re.search(r'(^|[,}])\s*' + re.escape(s) + r'\s*[,{]', ya, re.M):
                avisos.append(f'{s}  ya existe en {destino}: al promover hay que fundirlo, no agregarlo aparte')

    # 3. Un experimento no pelea con !important (en reglas; en un comentario da igual)
    if '!important' in re.sub(r'/\*.*?\*/', '', LAB_CSS.read_text(), flags=re.S):
        problemas.append('lab.css usa !important: si hace falta, el cambio va en base.css, no en un experimento')

    # 4. Las imágenes del experimento, referenciadas
    img = LAB / 'img'
    if img.is_dir():
        css_total = LAB_CSS.read_text() + (LAB / 'index.html').read_text()
        for f in sorted(img.iterdir()):
            if f.name not in css_total:
                avisos.append(f'lab/img/{f.name} no lo usa nadie')

    for a in avisos:
        print(f'  aviso · {a}')
    for p in problemas:
        print(f'  ERROR · {p}')
    if not problemas and not avisos:
        hay = [d for d, _ in bs if d != 'laboratorio']
        print('laboratorio sano' + (f' · experimento hacia {", ".join(sorted(set(hay)))}'
                                    if hay else ' · sin experimento en curso'))
    return 1 if problemas else 0

# ---------------------------------------------------------------- promover

def cmd_promover():
    if cmd_revisar():
        sys.exit('\nse arregla lo de arriba antes de promover')
    if subprocess.run(['git', 'diff', '--quiet', 'HEAD'], cwd=RAIZ).returncode:
        sys.exit('hay cambios sin commitear: promover reescribe archivos de producción\n'
                 'y conviene que el diff de la migración se lea solo')

    cabecera, bs = bloques()
    migrables = [(d, c) for d, c in bs if d != 'laboratorio']
    if not migrables:
        sys.exit('no hay nada que promover: lab.css no tiene bloques con destino')

    hoy = date.today().isoformat()
    movidas = {}

    # 1. Las imágenes, a assets/img/ con la versión en el nombre.
    #    set-version.py no estampa imágenes (C-11), así que versiona el nombre.
    img = LAB / 'img'
    if img.is_dir():
        (RAIZ / 'assets/img').mkdir(parents=True, exist_ok=True)
        for f in sorted(img.iterdir()):
            if not f.is_file():
                continue
            base, ext = f.stem, f.suffix
            n = 1
            while (RAIZ / 'assets/img' / f'{base}.v{n}{ext}').exists():
                n += 1
            nuevo = f'{base}.v{n}{ext}'
            shutil.copy2(f, RAIZ / 'assets/img' / nuevo)
            movidas[f.name] = nuevo
            print(f'imagen · lab/img/{f.name} → assets/img/{nuevo}')

    def rutas(css, destino):
        """url() se resuelve contra el CSS: hay que reescribir según dónde cae."""
        prefijo = '../img/' if destino.startswith('assets/css/') else '../assets/img/'
        for viejo, nuevo in movidas.items():
            css = re.sub(r"url\((['\"]?)img/" + re.escape(viejo) + r"(\?[^'\")]*)?\1\)",
                         f"url({prefijo}{nuevo})", css)
        return css

    # 2. El CSS, a su destino declarado
    for destino, css in migrables:
        css = rutas(css, destino).strip()
        f = RAIZ / destino
        f.write_text(f.read_text().rstrip() + f'\n\n/* --- promovido del laboratorio, {hoy} --- */\n{css}\n')
        print(f'estilos · {len(selectores(css))} selectores → {destino}')

    # 3. El laboratorio vuelve a reposo: se queda la cabecera y todo lo marcado
    #    como "laboratorio", que por definición nunca migra.
    SEPARADOR = '/* ---------- El experimento va de acá para abajo ---------- */'
    queda = cabecera.rstrip()
    for destino, css in bs:
        if destino == 'laboratorio':
            queda += '\n\n/* @destino laboratorio */\n' + css.replace(SEPARADOR, '').strip()
    LAB_CSS.write_text(queda + f'\n\n{SEPARADOR}\n')
    if img.is_dir():
        shutil.rmtree(img)
    nueva_rev = revision() + 1
    for f in [LAB / 'index.html'] + [d / 'index.html' for d in LAB.iterdir() if d.is_dir()]:
        if f.exists():
            f.write_text(re.sub(r'(lab\.css\?r=)\d+', r'\g<1>' + str(nueva_rev), f.read_text()))
    print(f'laboratorio · lab.css vaciado y marca subida a ?r={nueva_rev}')

    print(f"""
Lo mecánico está hecho. Lo que queda es criterio, y no lo hace una herramienta:

  [ ] Fundir los selectores duplicados que avisó `revisar`, en vez de dejar
      dos reglas para lo mismo.
  [ ] Repasar LOS CUATRO juegos, no solo el que probaste: si el experimento
      tocó base.css, cambió la base de todos (C-12).
  [ ] Tests de motor en verde y partida completa en cada modo, con capturas.
  [ ] python3 tools/set-version.py X.Y.Z  (ahora sí: cambiaron archivos versionados)
  [ ] Canon (C-1), decisión (D-n), CHANGELOG y capturas del README (C-13).
  [ ] Anotar el experimento en el historial de lab/README.md.""")
    return 0

# ----------------------------------------------------------------

def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    cmd = argv[1]
    if cmd == 'espejar':
        if len(argv) != 3:
            sys.exit('uso: python3 tools/lab.py espejar <id>')
        cmd_espejar(argv[2])
    elif cmd == 'revisar':
        sys.exit(cmd_revisar())
    elif cmd == 'promover':
        sys.exit(cmd_promover())
    else:
        sys.exit(__doc__)

if __name__ == '__main__':
    main(sys.argv)
