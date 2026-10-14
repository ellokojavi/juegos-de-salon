"""Draws Battleship's fleet and water, and writes `public/battleship/flota.js`.

    python3 tools/generators/fleet.py        # remakes the module with the maps

The module it writes is **generated**: to change a ship you touch this file and run it again;
the maps are not edited by hand (they would be lost on the next run).

The maps are 16×16 pixels per square, seen from above with the bow to the right; vertical is
the same drawing rotated 90°.

Two rules rule over everything else:
  1. A ship **begins and ends in a point**: a sharp bow and a stern narrower than the middle.
     The outline is the only thing really read at 30 px.
  2. The detail is stamped with functions (turrets, bridges, hatches, rivets), so every ship has
     the same hand, the same highlights and the same line weight.

The JavaScript it writes (HEAD, TAIL and the comments inside the module) is the app's code and
stays as the app names it until the app itself switches to English (D-316, phase 4).
"""
import random

N = 16

def canvas():
    return [['.'] * N for _ in range(N)]

def px(m, x, y, ch):
    if 0 <= x < N and 0 <= y < N:
        m[y][x] = ch

def rect(m, x0, y0, x1, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px(m, x, y, ch)

def hline(m, x0, x1, y, ch):
    rect(m, x0, y, x1, y, ch)

# ---------------------------------------------------------------- the water
def water(seed=7):
    """A single tile, repeated in every square: short horizontal strokes in four shades, like
    the sea seen from high above. The strokes do not touch the vertical edges so that, repeated,
    they do not form an endless line."""
    r = random.Random(seed)
    m = [['1'] * N for _ in range(N)]
    for y in range(N):
        for _ in range(r.randint(1, 3)):
            length = r.randint(2, 5)
            x = r.randint(0, N - length)
            shade = r.choice('2223')
            for i in range(length):
                m[y][x + i] = shade
    for _ in range(3):                        # a few highlights, few and short
        y = r.randrange(N); x = r.randrange(N - 3)
        for i in range(r.randint(2, 3)):
            m[y][x + i] = '4'
    return m

# ---------------------------------------------------------------- hull
def bounds(top, bot, shape, y):
    """From which column to which column the hull reaches in this row."""
    center = (top + bot) / 2
    d = abs(y - center)
    if shape == 'bow':
        return 0, max(2, int(round((N - 1) - d * 1.85)))
    if shape == 'stern':
        return min(N - 3, int(round(d * 1.15))), N - 1
    return 0, N - 1

def hull(m, top, bot, shape='middle', fill='#'):
    center = (top + bot) / 2
    for y in range(top, bot + 1):
        x0, x1 = bounds(top, bot, shape, y)
        if y in (top, bot):
            ch = 'o'
        elif y == top + 1:
            ch = '+'
        elif y == bot - 1:
            ch = 's'
        else:
            ch = fill
        hline(m, x0, x1, y, ch)
        if ch != 'o':                       # the hull's edge, always dark
            if shape == 'bow':
                px(m, x1, y, 'o')
            if shape == 'stern':
                px(m, x0, y, 'o')
        if ch == fill and abs(y - center) < 1:
            hline(m, x0 + 1, x1 - 1, y, 'm')   # deck seam, lengthwise


def sub_hull(m, top, bot, shape):
    """The submarine is not a box with points: it is a cylinder. The hull is shaded top to
    bottom (light, hull, dark) so it reads round, and the ends are circle caps instead of
    wedges: the bow ends blunt, like a cigar."""
    h = (bot - top) / 2
    c = (top + bot) / 2
    shades = ['o', '+', '#', 'm', 's', 'o']
    for y in range(top, bot + 1):
        d = abs(y - c)
        cap = int(round(h - (max(h * h - d * d, 0)) ** 0.5))
        if shape == 'bow':
            x0, x1 = 0, (N - 1) - cap
        elif shape == 'stern':
            x0, x1 = cap, N - 1
        else:
            x0, x1 = 0, N - 1
        ch = shades[int(round((y - top) / (bot - top) * (len(shades) - 1)))]
        hline(m, x0, x1, y, ch)
        if shape == 'bow':
            px(m, x1, y, 'o')
        if shape == 'stern':
            px(m, x0, y, 'o')

def rivets(m, top, bot, shape, cols=(3, 8, 13)):
    """Hull seams: a short mark at each frame."""
    for x in cols:
        for y in (top + 2, bot - 2):
            x0, x1 = bounds(top, bot, shape, y)
            if x0 + 1 <= x <= x1 - 1:
                px(m, x, y, 'm')

def hatches(m, xs, y, width=2):
    for x in xs:
        rect(m, x, y, x + width - 1, y, 'o')
        px(m, x, y - 1, '+')

def bow_foam(m, top, bot, shape='bow'):
    center = int((top + bot) / 2)
    for y, dx in ((center - 1, 1), (center, 2), (center + 1, 1)):
        x0, x1 = bounds(top, bot, shape, y)
        px(m, min(N - 1, x1 + dx), y, 'w')

def wake(m, top, bot):
    """Churned water behind the stern."""
    center = int((top + bot) / 2)
    for y in (center - 2, center + 2):
        px(m, 0, y, 'w')
    px(m, 1, center, 'w')

# ---------------------------------------------------------------- parts
def turret(m, x, y, length=5, barrels=(-2, 1), facing=1):
    """Turret: dark base, light roof and thick guns. `facing=-1` points to the stern."""
    rect(m, x, y - 3, x + 4, y + 3, 'o')
    rect(m, x + 1, y - 2, x + 4, y + 2, 'm')
    rect(m, x + 1, y - 1, x + 3, y + 1, '+')
    px(m, x + 2, y, 'o')
    for dy in barrels:
        a = x + 5 if facing > 0 else x - length
        b = a + length - 1
        rect(m, a, y + dy, b, y + dy + 1, 'o')
        tip = b if facing > 0 else a
        px(m, tip, y + dy, 'y'); px(m, tip, y + dy + 1, 'y')

def bridge(m, x, y, height=7, width=6):
    rect(m, x, y - height // 2, x + width - 1, y + height // 2, 'o')
    rect(m, x, y - height // 2 + 1, x + width - 2, y + height // 2 - 1, 'm')
    rect(m, x + 1, y - height // 2 + 2, x + width - 3, y + height // 2 - 2, '+')
    hline(m, x + 1, x + width - 3, y, 'o')          # windows
    px(m, x + width - 2, y - 1, '+')

def funnel(m, x, y, smoke=True):
    rect(m, x, y - 3, x + 3, y + 3, 'o')
    rect(m, x, y - 2, x + 2, y + 2, 'm')
    rect(m, x + 1, y - 1, x + 2, y + 1, 'o')
    if smoke:
        px(m, x + 1, y - 5, 'w'); px(m, x + 2, y - 6, 'w')

def radar(m, x, y):
    rect(m, x - 1, y, x + 1, y, 'c'); px(m, x, y + 1, 'c')
    px(m, x, y + 2, '+'); px(m, x, y + 3, '+')

def mast(m, x, y0, y1):
    rect(m, x, y0, x, y1, 'm')
    px(m, x - 1, y0 + 1, '+'); px(m, x + 1, y0 + 1, '+')
    px(m, x, y0, 'y')

def boats(m, xs, top, bot):
    for x in xs:
        rect(m, x, top + 2, x + 1, top + 2, 'w')
        rect(m, x, bot - 2, x + 1, bot - 2, 'w')

def helipad(m, cx, cy, r=3):
    rect(m, cx - r, cy - r, cx + r, cy + r, 'o')
    rect(m, cx - r + 1, cy - r + 1, cx + r - 1, cy + r - 1, 'm')
    px(m, cx - 1, cy - 1, '+'); px(m, cx + 1, cy - 1, '+')
    px(m, cx - 1, cy, '+');     px(m, cx, cy, '+');      px(m, cx + 1, cy, '+')
    px(m, cx - 1, cy + 1, '+'); px(m, cx + 1, cy + 1, '+')       # the H

def anchor(m, x, y):
    px(m, x, y, 'o'); px(m, x, y + 1, 'o'); px(m, x + 1, y, 'm')

def tubes(m, x, y, n=3):
    for i in range(n):
        rect(m, x, y + i * 2, x + 1, y + i * 2, 'o')

def rows(m):
    return ["'" + ''.join(f) + "'" for f in m]

FLEET = {}

# ---------------- Carrier (5): the widest, a runway deck ----------------
CT, CB = 1, 14
def deck(m, shape='middle'):
    hull(m, CT, CB, shape, fill='d')
    y = (CT + CB) // 2
    for x in range(1, N - 1, 5):                       # runway centerline
        rect(m, x, y, x + 2, y, 'y')
    for edge in (CT + 2, CB - 2):                     # runway edges
        x0, x1 = bounds(CT, CB, shape, edge)
        hline(m, x0 + 1, x1 - 1, edge, 'm')
    rivets(m, CT, CB, shape, cols=(2, 7, 12))

car = []
m = canvas(); deck(m, 'stern')
for x in (4, 7, 10):                                    # arresting wires
    rect(m, x, CT + 3, x, CB - 3, 'm')
wake(m, CT, CB); car.append(m)

m = canvas(); deck(m)
rect(m, 6, 6, 11, 9, 'c'); rect(m, 4, 7, 12, 8, 'c')    # cyan fighter
px(m, 13, 7, '+'); px(m, 13, 8, '+'); px(m, 5, 5, 'c'); px(m, 5, 10, 'c')
px(m, 12, 6, 'o'); px(m, 12, 9, 'o')
car.append(m)

m = canvas(); deck(m)
rect(m, 6, 0, 11, 5, 'o'); rect(m, 6, 1, 10, 4, 'm'); rect(m, 7, 2, 9, 3, '+')
hline(m, 7, 9, 3, 'o')                                 # the island's windows
radar(m, 8, 0); px(m, 12, 1, 'r'); px(m, 12, 2, 'r'); mast(m, 11, 0, 3)
car.append(m)

m = canvas(); deck(m)
rect(m, 4, 5, 9, 8, 's'); rect(m, 3, 6, 10, 7, '+')      # folded grey plane
rect(m, 11, 11, 15, 14, 'o'); rect(m, 12, 12, 14, 13, 'm')   # deck elevator
car.append(m)

m = canvas(); deck(m, 'bow')
for y in (6, 9):                                          # catapults
    hline(m, 2, 11, y, 'm')
bow_foam(m, CT, CB); car.append(m)
FLEET['carrier'] = car

# ---------------- Battleship (4) ----------------
BT, BB = 2, 13
bat = []
m = canvas(); hull(m, BT, BB, 'stern'); rivets(m, BT, BB, 'stern')
turret(m, 7, 8, length=3, barrels=(-2, 1), facing=-1)     # stern turret, facing back
hatches(m, (12,), 5); wake(m, BT, BB); bat.append(m)

m = canvas(); hull(m, BT, BB); rivets(m, BT, BB, 'middle')
turret(m, 3, 8); boats(m, (1, 13), BT, BB); hatches(m, (11,), 4); bat.append(m)

m = canvas(); hull(m, BT, BB); rivets(m, BT, BB, 'middle')
bridge(m, 5, 8, 9, 6); funnel(m, 1, 8); radar(m, 8, 0); mast(m, 12, 3, 7)
boats(m, (13,), BT, BB); bat.append(m)

m = canvas(); hull(m, BT, BB, 'bow'); rivets(m, BT, BB, 'bow', cols=(3, 7))
turret(m, 1, 8, length=3); anchor(m, 9, 4); bow_foam(m, BT, BB); bat.append(m)
FLEET['battleship'] = bat

# ---------------- Cruiser (3) ----------------
RT, RB = 3, 12
cru = []
m = canvas(); hull(m, RT, RB, 'stern'); rivets(m, RT, RB, 'stern')
helipad(m, 10, 8, 3); wake(m, RT, RB); cru.append(m)
m = canvas(); hull(m, RT, RB); rivets(m, RT, RB, 'middle')
bridge(m, 4, 8, 7, 6); funnel(m, 11, 8); radar(m, 8, 0); boats(m, (1,), RT, RB); cru.append(m)
m = canvas(); hull(m, RT, RB, 'bow'); rivets(m, RT, RB, 'bow', cols=(3, 7))
turret(m, 1, 8, length=4, barrels=(-1,)); tubes(m, 2, 4, 2); anchor(m, 9, 5)
bow_foam(m, RT, RB); cru.append(m)
FLEET['cruiser'] = cru

# ---------------- Destroyer (2) ----------------
DT, DB = 3, 12
des = []
m = canvas(); hull(m, DT, DB, 'stern'); rivets(m, DT, DB, 'stern')
funnel(m, 7, 8); bridge(m, 11, 8, 7, 5); radar(m, 13, 0); tubes(m, 3, 6, 2)
wake(m, DT, DB); des.append(m)
m = canvas(); hull(m, DT, DB, 'bow'); rivets(m, DT, DB, 'bow', cols=(3, 7))
turret(m, 1, 8, length=4, barrels=(-1,)); anchor(m, 9, 5); bow_foam(m, DT, DB); des.append(m)
FLEET['destroyer'] = des

# ---------------- Submarine (3): thin, cylindrical, blunt ----------------
# Seen from above, the sail is a SMALL block on the hull, not a cross: what rises outside the
# silhouette is the periscope, which is exactly what is seen of a surfacing submarine.
ST, SB = 5, 10
sub = []
m = canvas(); sub_hull(m, ST, SB, 'stern')                  # stern: rudders and propeller
# The rudders go in mid shade, not outline: on dark water, dark does not exist.
rect(m, 4, ST - 2, 8, ST - 1, 'm'); hline(m, 4, 8, ST - 2, 's')        # top rudder
rect(m, 4, SB + 1, 8, SB + 2, 'm'); hline(m, 4, 8, SB + 2, 's')        # bottom rudder
rect(m, 2, 7, 4, 8, 'm'); rect(m, 1, 6, 1, 9, 'o'); px(m, 0, 7, 'w'); px(m, 0, 8, 'w')
sub.append(m)

m = canvas(); sub_hull(m, ST, SB, 'middle')                 # sail, periscope and hatches
rect(m, 6, ST + 1, 10, SB - 1, 'm'); rect(m, 7, ST + 1, 9, SB - 1, '+')
rect(m, 8, 1, 8, ST, 'y')                                    # raised periscope
px(m, 9, 2, 'c'); px(m, 9, 3, 'c'); px(m, 10, 2, 'c')        # antenna
rect(m, 2, 7, 3, 7, 'o'); rect(m, 12, 7, 13, 7, 'o')         # hatches
sub.append(m)

m = canvas(); sub_hull(m, ST, SB, 'bow')                  # blunt bow and tubes
rect(m, 12, 7, 13, 7, 'o'); rect(m, 12, 8, 13, 8, 'o')       # torpedo tubes
rect(m, 3, ST - 1, 6, ST - 1, 'm')                                       # diving planes
rect(m, 3, SB + 1, 6, SB + 1, 'm')
px(m, 15, 7, 'w'); px(m, 15, 8, 'w')                         # foam at the nose
sub.append(m)
FLEET['submarine'] = sub

# ---------------- output: the game's module ----------------
NAMES = {'carrier': 'Portaaviones (5)', 'battleship': 'Acorazado (4)', 'cruiser': 'Crucero (3)',
           'submarine': 'Submarino (3)', 'destroyer': 'Destructor (2)'}

HEAD = """/**
 * La flota y el agua, en pixel art (D-91).
 *
 * **Generado por `tools/generators/fleet.py`.** Para cambiar un barco se edita ese script y se vuelve a
 * correr; lo que se escriba a mano acá se pierde en la próxima pasada.
 *
 * Cada casilla del tablero dibuja un trozo de 16×16 píxeles, visto desde arriba y con la proa
 * a la derecha; un barco vertical es el mismo dibujo rotado 90° por CSS. Los trozos calzan
 * entre sí: popa, tramos del medio y proa. Un barco empieza y termina en punta.
 *
 * Los colores no van escritos en el dibujo sino en variables CSS, así el barco elegido es el
 * mismo trazado con otra paleta (`.cell.sel` en `style.css`) y no hay que dibujarlo dos veces.
 *
 * El agua es una sola baldosa repetida en todas las casillas, como en un tileset: va de fondo
 * (`--agua`, una imagen), no de contenido, para no meter cien SVG al DOM solo para pintar mar.
 */

/** Píxel → color. Todo sale de variables CSS menos el rojo de la bandera. */
const PALETA = {
  o: 'var(--casco-borde)', '+': 'var(--casco-luz)', '#': 'var(--casco)', s: 'var(--casco-sombra)',
  m: 'var(--casco-medio)', d: 'var(--cubierta)', y: 'var(--marca)', c: 'var(--antena)',
  r: '#e0243c', w: 'var(--espuma)',
};

/** Los cuatro tonos del mar. Van literales: el fondo es una imagen, y ahí no llegan las variables. */
const AGUA_TONOS = { 1: '#132a45', 2: '#1a3757', 3: '#24476a', 4: '#3f6f9e' };
"""

TAIL = """
/** Un mapa a <svg>: cada corrida de píxeles iguales es un <rect>, que son muchos menos. */
function svgDe(mapa, paleta, fondo = false) {
  let r = '';
  mapa.forEach((fila, y) => {
    let x = 0;
    while (x < LADO) {
      const ch = fila[x];
      let n = 1; while (fila[x + n] === ch) n++;
      if (fondo || ch !== '.') r += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${paleta[ch]}"/>`;
      x += n;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}" shape-rendering="crispEdges" class="barco">${r}</svg>`;
}

/** El agua, lista para `background-image`. Se calcula una vez y se repite en cada casilla. */
export const FONDO_AGUA = `url("data:image/svg+xml,${encodeURIComponent(svgDe(AGUA, AGUA_TONOS, true))}")`;

// Cada trozo se arma una sola vez y después se clona: son 17 dibujos para todo el tablero.
const hechos = new Map();

/**
 * El trozo `i` del barco `id`, como elemento listo para colgar de una casilla.
 * Devuelve null si el barco o el trozo no existen, para no romper una partida vieja.
 */
export function trozoDe(id, i) {
  const piezas = PIEZAS[id];
  if (!piezas || !piezas[i]) return null;
  const clave = `${id}${i}`;
  if (!hechos.has(clave)) {
    const caja = document.createElement('div');
    caja.innerHTML = svgDe(piezas[i], PALETA);
    hechos.set(clave, caja.firstElementChild);
  }
  return hechos.get(clave).cloneNode(true);
}

/**
 * El dibujo que le toca a la casilla (r, c) según un reparto de flota, ya rotado si el barco
 * va vertical. Devuelve null si ahí no hay barco.
 */
export function barcoEn(layout, r, c) {
  for (const [id, p] of Object.entries(layout || {})) {
    const tam = TAMANOS[id] || 0;
    const dentro = p.dir === 'h' ? (r === p.r && c >= p.c && c < p.c + tam) : (c === p.c && r >= p.r && r < p.r + tam);
    if (!dentro) continue;
    const svg = trozoDe(id, p.dir === 'h' ? c - p.c : r - p.r);
    if (svg && p.dir === 'v') svg.classList.add('v');
    return svg;
  }
  return null;
}

/** La flota entera en chico, para la ficha de la lista: los trozos en fila. */
export function barcoEntero(id) {
  const tira = document.createElement('span');
  tira.className = 'barco-tira';
  (PIEZAS[id] || []).forEach((_, i) => tira.append(trozoDe(id, i)));
  return tira;
}
"""

parts = [HEAD, f"\nexport const LADO = {N};\n",
          "\n/** El agua: una sola baldosa, repetida. */\nexport const AGUA = [\n  " +
          ',\n  '.join(rows(water())) + ',\n];\n',
          "\n/** Cuántas casillas ocupa cada barco (lo mismo que dice el motor). */\nexport const TAMANOS = { " +
          ', '.join(f"{k}: {len(v)}" for k, v in FLEET.items()) + " };\n",
          "\n/** Los trozos de cada barco, de popa a proa. */\nexport const PIEZAS = {\n"]
for k in ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']:
    parts.append(f"  // {NAMES[k]}\n  {k}: [\n")
    for m in FLEET[k]:
        parts.append('    [' + ', '.join(rows(m)) + '],\n')
    parts.append('  ],\n')
parts.append('};\n')
parts.append(TAIL)

import pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
target = ROOT / 'public' / 'battleship' / 'flota.js'
target.write_text(''.join(parts), encoding='utf-8')
print(f'written: {target.relative_to(ROOT)} ({len(FLEET)} ships, {sum(len(v) for v in FLEET.values())} pieces)')
