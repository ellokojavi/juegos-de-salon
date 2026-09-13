#!/usr/bin/env python3
"""
El README, al día: bloques generados del código, capturas rehechas por el navegador.

  python3 tools/readme.py revisar      ¿El README quedó viejo? (lo corre set-version.py)
  python3 tools/readme.py actualizar   Reescribe los bloques generados del README
  python3 tools/readme.py capturas [seccion] [--sin-red]
                                       Rehace las capturas con Chrome headless
  python3 tools/readme.py sellar       "Ya revisé el README con estos hechos"

Por qué existe: el README cuenta cosas que el código sabe —cuántos juegos hay, qué
modos tiene cada uno, cuántas cartas trae cada temática, qué tests hay— y muestra
capturas de pantallas que cambian. Nada de eso avisa cuando queda viejo. Acá:

  1. Lo que se puede derivar del código se genera. Entre las marcas

         <!-- generado: juegos -->  ...  <!-- /generado -->

     nadie edita a mano: `actualizar` lo reescribe desde `tools/hechos.mjs`, que
     importa los módulos de verdad.

  2. Lo que es prosa —cómo se juega, por qué está bueno— lo escribe una persona,
     así que la herramienta no lo toca: lo delata. `revisar` compara los hechos de
     hoy contra los del último sello (`docs/hechos.json`) y falla nombrando qué
     cambió y qué sección hay que releer. Al terminar, `sellar` deja constancia.

  3. Las capturas se rehacen solas: `docs/capturas.json` dice de qué guion de
     tools/e2e/ y de qué toma sale cada imagen, y `capturas` corre los guiones y
     copia los PNG a docs/screenshots/. Las que dependen de una sala de Firebase
     van marcadas `"red": true` y se saltan con --sin-red.

El gancho para que esto pase siempre y no cuando alguien se acuerde: `set-version.py`
—obligatorio antes de cada publicación (C-11)— corre `revisar` y se planta si el
README quedó atrás.
"""
import json, re, shutil, socket, subprocess, sys, tempfile, time, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
README = RAIZ / 'README.md'
CATALOGO = RAIZ / 'docs/capturas.json'
SELLO = RAIZ / 'docs/hechos.json'
PUERTO = 8765
MARCA = re.compile(r'(<!-- generado: ([\w:-]+)[^>]*-->\n)(.*?)(<!-- /generado -->)', re.S)


def hechos():
    """La hoja de hechos de la app, leída del código real."""
    salida = subprocess.run(['node', str(RAIZ / 'tools/hechos.mjs')], cwd=RAIZ,
                            capture_output=True, text=True)
    if salida.returncode:
        sys.exit(f'no se pudo leer los hechos de la app:\n{salida.stderr.strip()}')
    return json.loads(salida.stdout)


def catalogo():
    return json.loads(CATALOGO.read_text())


def ancla(nombre):
    """El ancla que GitHub le pone al encabezado '## 👑 Cuarto Rey': el emoji se va
    pero su espacio queda, y por eso el guion del principio."""
    limpio = ''.join(c for c in nombre.lower() if c.isalnum() or c in ' -_')
    return '#-' + re.sub(r'\s+', '-', limpio.strip())


def sin_emoji(texto):
    """El texto del modo sin su emoji y sin la aclaración que va tras la coma."""
    t = re.sub(r'^[^\w¡¿]+', '', texto).split(',')[0].strip()
    return t


def anio(n):
    return f'{abs(n)} a. C.' if n < 0 else str(n)


# ------------------------------------------------------------- bloques generados

def bloque_juegos(H, C):
    filas = ['| Juego | Jugadores | Modos | Estado |', '|---|---|---|---|']
    for j in H['juegos']:
        nombres = ' / '.join(dict.fromkeys([j['nombre']['es'], j['nombre']['en'], j['nombre']['pt']]))
        modos = ' · '.join(sin_emoji(m['es']) for m in j['modos']) or 'Un celular'
        filas.append(f"| {j['emoji']} [{nombres}]({ancla(j['nombre']['es'])}) | {j['jugadores']} "
                     f"| {modos} | {j['estado'] or '—'} |")
    return '\n'.join(filas) + '\n'


def bloque_tematicas(H, C):
    filas = ['| Temática | Cartas | Años | De qué va |', '|---|---|---|---|']
    for t in H['tematicas']:
        filas.append(f"| {t['emoji']} {t['nombre']['es']} | {t['cartas']} | "
                     f"{anio(t['desde'])} a {anio(t['hasta'])} | {t['pista']['es']} |")
    filas.append(f"| **Total** | **{sum(t['cartas'] for t in H['tematicas'])}** | | |")
    return '\n'.join(filas) + '\n'


def bloque_idiomas(H, C):
    filas = ['| Español | English | Português |', '|---|---|---|',
             f"| {H['app']['es']} | {H['app']['en']} | {H['app']['pt']} |"]
    for j in H['juegos']:
        filas.append(f"| {j['nombre']['es']} | {j['nombre']['en']} | {j['nombre']['pt']} |")
    return '\n'.join(filas) + '\n'


def bloque_pruebas(H, C):
    return '\n'.join(['```bash'] + [f'node {t}' for t in orden_tests(H['tests'])] + ['```']) + '\n'


def orden_tests(tests):
    """Primero los motores de los juegos, después lo compartido: se lee mejor."""
    motores = [t for t in tests if t.endswith('engine.test.mjs')]
    return motores + [t for t in tests if t not in motores]


# De lo general a lo particular: los documentos nuevos caen al final, donde se ven.
ORDEN_DOCS = ['docs/CANONES.md', 'docs/REQUERIMIENTOS.md', 'docs/DECISIONES.md',
              'docs/AGREGAR-JUEGO.md', 'docs/PANEL.md',
              'tools/e2e/README.md', 'firebase/README.md']


def bloque_documentacion(H, C):
    def peso(d):
        if d['ruta'] in ORDEN_DOCS:
            return (0, ORDEN_DOCS.index(d['ruta']))
        if d['ruta'].startswith('docs/juegos/'):
            return (1, d['ruta'])
        return (2, d['ruta'] != 'CHANGELOG.md', d['ruta'])
    return '\n'.join(f"- [{d['titulo']}]({d['ruta']})" for d in sorted(H['documentos'], key=peso)) + '\n'


def ancho(C, seccion):
    """Con cuántos píxeles muestra el README las imágenes de esa sección."""
    return C['ancho']['portada'] if seccion == 'portada' else C['ancho']['galeria']


def bloque_capturas(H, C, seccion):
    tomas = [c for c in C['capturas'] if c['seccion'] == seccion]
    if not tomas:
        return ''
    w = ancho(C, seccion)
    if seccion == 'portada':
        c = tomas[0]
        return f'<p align="center"><img src="{c["imagen"]}" width="{w}" alt="{c["pie"]}"></p>\n'
    filas = []
    for i in range(0, len(tomas), 4):
        celdas = [f'<td align="center"><img src="{c["imagen"]}" width="{w}" alt="{c["pie"]}">'
                  f'<br><sub>{c["pie"]}</sub></td>' for c in tomas[i:i + 4]]
        celdas += ['<td></td>'] * (4 - len(celdas))
        filas.append('  <tr>\n' + '\n'.join('    ' + c for c in celdas) + '\n  </tr>')
    return '<table>\n' + '\n'.join(filas) + '\n</table>\n'


def generar(nombre, H, C):
    if nombre.startswith('capturas:'):
        return bloque_capturas(H, C, nombre.split(':', 1)[1])
    fn = {'juegos': bloque_juegos, 'tematicas': bloque_tematicas, 'idiomas': bloque_idiomas,
          'pruebas': bloque_pruebas, 'documentacion': bloque_documentacion}.get(nombre)
    return fn(H, C) if fn else None


def bloques_del_readme():
    return [(m.group(2), m.group(3)) for m in MARCA.finditer(README.read_text())]


# ------------------------------------------------------------------- actualizar

def cmd_actualizar():
    H, C = hechos(), catalogo()
    texto = README.read_text()
    cambiados, desconocidos = [], []

    def cambiar(m):
        nombre, actual = m.group(2), m.group(3)
        nuevo = generar(nombre, H, C)
        if nuevo is None:
            desconocidos.append(nombre)
            return m.group(0)
        if nuevo != actual:
            cambiados.append(nombre)
        return m.group(1) + nuevo + m.group(4)

    texto = MARCA.sub(cambiar, texto)
    README.write_text(texto)
    for d in desconocidos:
        print(f'  ERROR · <!-- generado: {d} --> no lo sabe generar nadie')
    if cambiados:
        print('actualizado: ' + ', '.join(cambiados))
    else:
        print('los bloques generados ya estaban al día')
    print('\nLo que queda es prosa y no lo escribe una herramienta:\n'
          '  [ ] La sección del juego que cambió: ¿sigue contando lo que hace hoy?\n'
          '  [ ] python3 tools/readme.py capturas <seccion>  si cambió alguna pantalla\n'
          '  [ ] python3 tools/readme.py sellar             cuando ya lo releíste')
    return 1 if desconocidos else 0


# ---------------------------------------------------------------------- sellar

def cmd_sellar():
    H = hechos()
    SELLO.write_text(json.dumps(H, ensure_ascii=False, indent=2) + '\n')
    print(f'sellado: docs/hechos.json con los hechos de hoy '
          f"({len(H['juegos'])} juegos, {len(H['tematicas'])} temáticas, v{H['version']})")
    return 0


# --------------------------------------------------------------------- revisar

def diferencias(viejo, nuevo, ruta=''):
    """Los caminos de la hoja de hechos que cambiaron, con su antes y después."""
    if isinstance(viejo, dict) and isinstance(nuevo, dict):
        out = []
        for k in dict.fromkeys(list(viejo) + list(nuevo)):
            out += diferencias(viejo.get(k), nuevo.get(k), f'{ruta}.{k}' if ruta else k)
        return out
    if isinstance(viejo, list) and isinstance(nuevo, list):
        if all(isinstance(x, dict) and 'id' in x for x in viejo + nuevo):
            out = []
            for k in dict.fromkeys([x['id'] for x in viejo + nuevo]):
                a = next((x for x in viejo if x['id'] == k), None)
                b = next((x for x in nuevo if x['id'] == k), None)
                out += diferencias(a, b, f'{ruta}.{k}')
            return out
        if viejo != nuevo:
            faltan, sobran = [x for x in viejo if x not in nuevo], [x for x in nuevo if x not in viejo]
            return [(ruta, resumen(faltan), resumen(sobran))]
        return []
    return [] if viejo == nuevo else [(ruta, resumen(viejo), resumen(nuevo))]


def resumen(v):
    if isinstance(v, list):
        return ', '.join(resumen(x) for x in v) if v else '—'
    if isinstance(v, dict):
        if 'nombre' in v and 'cartas' in v:
            return f"{v['nombre']['es']} ({v['cartas']} cartas)"
        if 'nombre' in v:
            return v['nombre'].get('es', '')
        return v.get('es') or v.get('id') or json.dumps(v, ensure_ascii=False)[:60]
    return '—' if v is None else str(v)


def contar(ruta, antes, ahora):
    """El cambio dicho como lo diría una persona: apareció, desapareció o cambió."""
    if antes == '—':
        return f'apareció {ruta}: {ahora}'
    if ahora == '—':
        return f'desapareció {ruta}: {antes}'
    return f'cambió {ruta}: {antes} → {ahora}'


SECCIONES = {
    'juegos': 'la sección del juego y la tabla de arriba',
    'tematicas': 'la sección de Línea de Tiempo (las temáticas se cuentan en la prosa)',
    'idiomas': 'la sección Idiomas', 'frases': 'la sección Idiomas',
    'app': 'la portada y la tabla de nombres', 'modulos': 'el árbol de Estructura',
    'sinVersionar': 'set-version.py (C-11)', 'tests': 'la sección Correr en local',
    'e2e': 'las pruebas de punta a punta (tools/e2e/README.md)',
    'documentos': 'el índice de Documentación', 'capturas': 'las galerías de capturas',
}


COMMITS_MIRADOS = 40   # tope de commits que se revisan hacia atrás buscando uno de verdad

#: Las marcas que estampa set-version.py: `?v=0.25.2` en el import map y las hojas de
#: estilo, y `v0.25.2 ·` en el pie del menú.
ESTAMPA = re.compile(r'\?v=\d+\.\d+\.\d+|v\d+\.\d+\.\d+ ·')


def git(*args, rutas=()):
    """Un comando de git acotado a esos caminos, con la salida como texto."""
    orden = ['git', *args] + (['--', *rutas] if rutas else [])
    return subprocess.run(orden, cwd=RAIZ, capture_output=True, text=True).stdout


def solo_estampa(diff):
    """
    ¿Ese diff no cambia nada más que la versión estampada?

    Se comparan las líneas quitadas contra las puestas con el número de versión borrado: si
    quedan iguales, lo único que pasó fue una publicación. No basta con "todas las líneas
    tienen un ?v=", porque el import map es una línea sola y enorme que también cambia
    cuando se agrega un módulo, y eso sí es un cambio.
    """
    mas, menos = [], []
    for linea in diff.splitlines():
        if linea.startswith(('+++', '---')):
            continue
        if linea.startswith('+'):
            mas.append(ESTAMPA.sub('V', linea[1:]))
        elif linea.startswith('-'):
            menos.append(ESTAMPA.sub('V', linea[1:]))
    return bool(mas or menos) and sorted(mas) == sorted(menos)


def git_fecha(rutas):
    """
    Cuándo cambió de verdad por última vez alguno de esos caminos (0 si nunca).

    El estampado de versión no cuenta: `set-version.py` reescribe los seis `index.html` en
    cada publicación (C-11) y eso no cambia ninguna pantalla. Sin esta salvedad, publicar
    dejaba "más viejas que el código" a las capturas de todos los juegos, incluidos los que
    nadie tocó, y el aviso dejaba de querer decir algo (D-51).
    """
    rutas = [r for r in rutas if (RAIZ / r).exists()]
    if not rutas:
        return 0
    sucio = git('status', '--porcelain', rutas=rutas).strip()
    # Un archivo nuevo sin commitear es un cambio de verdad; lo modificado se mira igual
    # que un commit, porque ahí también puede haber solo un estampado a medio publicar.
    if sucio and (any(l.startswith('??') for l in sucio.splitlines())
                  or not solo_estampa(git('diff', 'HEAD', '-U0', rutas=rutas))):
        return 10 ** 12  # sin commitear: más nuevo que cualquier commit
    for linea in git('log', f'-{COMMITS_MIRADOS}', '--format=%H %ct', rutas=rutas).splitlines():
        sha, fecha = linea.split()
        if solo_estampa(git('show', sha, '-U0', '--format=', rutas=rutas)):
            continue
        return int(fecha)
    return 0


NUMEROS = {'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8}


def cmd_revisar():
    H, C = hechos(), catalogo()
    texto = README.read_text()
    problemas, avisos = [], []

    # 1. Los bloques generados, al día con el código
    esperados = {'juegos', 'tematicas', 'idiomas', 'pruebas', 'documentacion'}
    esperados |= {f'capturas:{s}' for s in dict.fromkeys(c['seccion'] for c in C['capturas'])}
    presentes = dict(bloques_del_readme())
    for nombre in sorted(esperados - set(presentes)):
        problemas.append(f'falta el bloque <!-- generado: {nombre} --> en el README')
    for nombre, actual in presentes.items():
        nuevo = generar(nombre, H, C)
        if nuevo is None:
            problemas.append(f'<!-- generado: {nombre} --> no lo sabe generar nadie')
        elif nuevo != actual:
            problemas.append(f'el bloque "{nombre}" quedó viejo  →  python3 tools/readme.py actualizar')

    # 2. Los hechos, contra el último sello: lo que cambió pide releer prosa
    if not SELLO.exists():
        problemas.append('falta docs/hechos.json  →  python3 tools/readme.py sellar')
    else:
        for ruta, antes, ahora in diferencias(json.loads(SELLO.read_text()), H):
            raiz = ruta.split('.')[0]
            if raiz == 'version':  # la versión la estampa set-version.py; el README no la cita
                continue
            donde = SECCIONES.get(raiz, 'el README')
            problemas.append(f'{contar(ruta, antes, ahora)}\n'
                             f'           relee {donde}; después: python3 tools/readme.py sellar')

    # 3. Las capturas: catálogo, archivos y guiones que las sacan
    en_catalogo = {c['imagen'] for c in C['capturas']}
    for c in C['capturas']:
        if not (RAIZ / c['imagen']).exists():
            problemas.append(f"{c['imagen']} está en el catálogo pero no existe  →  "
                             f"python3 tools/readme.py capturas {c['seccion']}")
        guion = C['guiones'].get(c['guion'])
        if not guion:
            problemas.append(f"{c['imagen']} dice salir del guion \"{c['guion']}\", que no está en el catálogo")
        elif f"'{c['toma']}'" not in (RAIZ / 'tools/e2e' / guion['archivo']).read_text():
            problemas.append(f"{guion['archivo']} ya no saca la toma \"{c['toma']}\" que pide {c['imagen']}")
    for png in sorted((RAIZ / 'docs/screenshots').rglob('*.png')):
        rel = str(png.relative_to(RAIZ))
        if rel not in en_catalogo:
            avisos.append(f'{rel} no la usa el README ni está en el catálogo')

    # 4. Capturas más viejas que lo que muestran
    fuentes = C['fuentes']
    for seccion in dict.fromkeys(c['seccion'] for c in C['capturas']):
        codigo = git_fecha(fuentes.get(seccion, []) + fuentes['comunes'])
        viejas = [c['imagen'] for c in C['capturas'] if c['seccion'] == seccion
                  and (RAIZ / c['imagen']).exists() and git_fecha([c['imagen']]) < codigo]
        if viejas:
            avisos.append(f'{seccion}: {len(viejas)} captura(s) más viejas que el código que muestran  →  '
                          f'python3 tools/readme.py capturas {seccion}')

    # 5. Enlaces e imágenes del README que no existen
    for ruta in set(re.findall(r'\]\(([^)#\s]+)\)', texto)) | set(re.findall(r'<img src="([^"]+)"', texto)):
        if ruta.startswith(('http', 'mailto:', '#')):
            continue
        if not (RAIZ / ruta.split('#')[0]).exists():
            problemas.append(f'el README enlaza {ruta} y no existe')

    # 6. Los números escritos con palabras, que ningún bloque generado vigila
    cuentas = {'juegos': len(H['juegos']), 'mazos': len(H['tematicas']),
               'temáticas': len(H['tematicas']), 'idiomas': len(H['idiomas'])}
    for palabra, cosa in re.findall(r'\b(' + '|'.join(NUMEROS) + r')\s+(?:`?\w+\.js`?\s+de\s+)?(\w+)\b', texto):
        if cosa in cuentas and NUMEROS[palabra] != cuentas[cosa]:
            avisos.append(f'el README dice "{palabra} {cosa}" y hay {cuentas[cosa]}')

    # 7. El árbol de Estructura, contra lo que hay en el repo
    arbol = re.search(r'## Estructura\n+```\n(.*?)```', texto, re.S)
    if arbol:
        listadas = [l.split()[0] for l in arbol.group(1).splitlines() if l.strip()]
        for ruta in listadas:
            if not (RAIZ / ruta).exists():
                avisos.append(f'el árbol de Estructura nombra {ruta} y no existe')
        for f in sorted(RAIZ.iterdir()):
            nombre = f.name + ('/' if f.is_dir() else '')
            if f.name.startswith('.') or f.name in ('README.md', 'arte-original', 'CNAME', 'CHANGELOG.md', 'CLAUDE.md'):
                continue
            if not any(l.startswith(nombre) or l.startswith(f.name) for l in listadas):
                avisos.append(f'{nombre} no aparece en el árbol de Estructura')

    for a in avisos:
        print(f'  aviso · {a}')
    for p in problemas:
        print(f'  ERROR · {p}')
    if not problemas and not avisos:
        print(f"README al día · {len(H['juegos'])} juegos, {len(H['tematicas'])} temáticas, "
              f"{len(C['capturas'])} capturas")
    elif not problemas:
        print('README al día (los avisos de arriba son criterio, no error)')
    return 1 if problemas else 0


# -------------------------------------------------------------------- capturas

def achicar(png, pixeles):
    """La captura sale del navegador al doble de píxeles del celular emulado y pesa
    medio mega. Se guarda al doble del ancho con que la muestra el README y con
    paleta de 256 colores (con tramado, para que los degradados no hagan bandas):
    unos 50 kB, que es lo que aguanta un repo al que se le rehacen las capturas
    seguido. Con Pillow si está; si no, con sips, que viene en el Mac."""
    try:
        from PIL import Image
    except ImportError:
        if shutil.which('sips'):
            subprocess.run(['sips', '--resampleWidth', str(pixeles), str(png), '--out', str(png)],
                           capture_output=True)
        return
    im = Image.open(png).convert('RGB')
    if im.width > pixeles:  # nunca agrandar: una captura vieja y chica quedaría borrosa
        im = im.resize((pixeles, round(im.height * pixeles / im.width)), Image.LANCZOS)
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                dither=Image.Dither.FLOYDSTEINBERG).save(png, 'PNG', optimize=True)


def servidor_vivo():
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', PUERTO)) == 0


def cmd_capturas(seccion=None, sin_red=False):
    C = catalogo()
    tomas = [c for c in C['capturas'] if seccion in (None, c['seccion'])]
    if seccion and not tomas:
        sys.exit(f'no hay capturas de "{seccion}". Hay: ' +
                 ', '.join(dict.fromkeys(c['seccion'] for c in C['capturas'])))
    guiones = dict.fromkeys(c['guion'] for c in tomas)
    if sin_red:
        guiones = [g for g in guiones if not C['guiones'][g]['red']]
        tomas = [c for c in tomas if c['guion'] in guiones]

    servidor = None
    if not servidor_vivo():
        servidor = subprocess.Popen([sys.executable, '-m', 'http.server', str(PUERTO)],
                                    cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(20):
            if servidor_vivo():
                break
            time.sleep(0.2)
        print(f'servidor propio en el puerto {PUERTO}')

    nuevas, iguales, fallaron = [], [], []
    try:
        for g in guiones:
            guion = C['guiones'][g]
            print(f"\n▶ {guion['archivo']}  ({guion['que']}{', necesita internet' if guion['red'] else ''})")
            with tempfile.TemporaryDirectory() as tmp:
                r = subprocess.run(['node', f"tools/e2e/{guion['archivo']}", tmp], cwd=RAIZ)
                if r.returncode:
                    fallaron.append(guion['archivo'])
                    print(f"  falló. Si quedó un Chrome vivo: pkill -f remote-debugging-port")
                    continue
                for c in [t for t in tomas if t['guion'] == g]:
                    origen = pathlib.Path(tmp) / f"{c['toma']}.png"
                    if not origen.exists():
                        fallaron.append(f"{guion['archivo']} → {c['toma']}")
                        print(f"  sin toma \"{c['toma']}\": el guion no llegó hasta ahí")
                        continue
                    destino = RAIZ / c['imagen']
                    antes = destino.read_bytes() if destino.exists() else None
                    destino.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(origen, destino)
                    achicar(destino, 2 * ancho(C, c['seccion']))
                    igual = antes == destino.read_bytes()
                    (iguales if igual else nuevas).append(c['imagen'])
                    print(f"  {'=' if igual else '↻'} {c['imagen']}")
    finally:
        if servidor:
            servidor.terminate()

    print(f'\n{len(nuevas)} captura(s) cambiadas, {len(iguales)} iguales'
          + (f', {len(fallaron)} sin sacar' if fallaron else ''))
    if nuevas:
        print('Míralas antes de publicar (C-12: los problemas de diseño se ven, no se afirman):\n'
              '  git diff --stat docs/screenshots')
    return 1 if fallaron else 0


# ----------------------------------------------------------------------------

def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    cmd = argv[1]
    if cmd == 'revisar':
        sys.exit(cmd_revisar())
    elif cmd == 'actualizar':
        sys.exit(cmd_actualizar())
    elif cmd == 'sellar':
        sys.exit(cmd_sellar())
    elif cmd == 'capturas':
        resto = [a for a in argv[2:] if a != '--sin-red']
        sys.exit(cmd_capturas(resto[0] if resto else None, '--sin-red' in argv))
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main(sys.argv)
