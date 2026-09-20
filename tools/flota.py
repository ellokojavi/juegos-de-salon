"""Dibuja la flota y el agua de Batalla Naval, y escribe `batalla-naval/flota.js`.

    python3 tools/flota.py        # rehace el módulo con los mapas

El módulo que sale es **generado**: para cambiar un barco se toca este archivo y se vuelve a
correr, no se editan los mapas a mano (se perderían en la siguiente pasada).

Los mapas son de 16×16 píxeles por casilla, vistos desde arriba y con la proa a la derecha;
vertical es el mismo dibujo rotado 90°.

Dos reglas mandan sobre todo lo demás:
  1. Un barco **empieza y termina en punta**: proa afilada y popa más angosta que el centro.
     El contorno es lo único que se lee de verdad a 30 px.
  2. El detalle se estampa con funciones (torretas, puentes, escotillas, remaches), para que
     todos los barcos tengan la misma mano, las mismas luces y el mismo grosor de línea.
"""
import random

N = 16

def lienzo():
    return [['.'] * N for _ in range(N)]

def px(m, x, y, ch):
    if 0 <= x < N and 0 <= y < N:
        m[y][x] = ch

def rect(m, x0, y0, x1, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px(m, x, y, ch)

def linea_h(m, x0, x1, y, ch):
    rect(m, x0, y, x1, y, ch)

# ---------------------------------------------------------------- el agua
def agua(semilla=7):
    """Una sola baldosa, repetida en todas las casillas: rayas horizontales cortas en cuatro
    tonos, como el mar visto desde muy arriba. Los trazos no tocan los bordes verticales para
    que al repetirse no se arme una raya infinita."""
    r = random.Random(semilla)
    m = [['1'] * N for _ in range(N)]
    for y in range(N):
        for _ in range(r.randint(1, 3)):
            largo = r.randint(2, 5)
            x = r.randint(0, N - largo)
            tono = r.choice('2223')
            for i in range(largo):
                m[y][x + i] = tono
    for _ in range(3):                        # algunos brillos, pocos y cortos
        y = r.randrange(N); x = r.randrange(N - 3)
        for i in range(r.randint(2, 3)):
            m[y][x + i] = '4'
    return m

# ---------------------------------------------------------------- casco
def limites(top, bot, forma, y):
    """De qué columna a qué columna llega el casco en esta fila."""
    centro = (top + bot) / 2
    d = abs(y - centro)
    if forma == 'proa':
        return 0, max(2, int(round((N - 1) - d * 1.85)))
    if forma == 'popa':
        return min(N - 3, int(round(d * 1.15))), N - 1
    return 0, N - 1

def casco(m, top, bot, forma='medio', relleno='#'):
    centro = (top + bot) / 2
    for y in range(top, bot + 1):
        x0, x1 = limites(top, bot, forma, y)
        if y in (top, bot):
            ch = 'o'
        elif y == top + 1:
            ch = '+'
        elif y == bot - 1:
            ch = 's'
        else:
            ch = relleno
        linea_h(m, x0, x1, y, ch)
        if ch != 'o':                       # el filo del casco, siempre oscuro
            if forma == 'proa':
                px(m, x1, y, 'o')
            if forma == 'popa':
                px(m, x0, y, 'o')
        if ch == relleno and abs(y - centro) < 1:
            linea_h(m, x0 + 1, x1 - 1, y, 'm')   # junta de cubierta, a lo largo


def casco_sub(m, top, bot, forma):
    """El submarino no es una caja con puntas: es un cilindro. El casco se sombrea de arriba
    abajo (luz, casco, oscuro) para que se lea redondo, y las puntas son casquetes de círculo
    en vez de cuñas: la proa termina roma, como un puro."""
    h = (bot - top) / 2
    c = (top + bot) / 2
    tonos = ['o', '+', '#', 'm', 's', 'o']
    for y in range(top, bot + 1):
        d = abs(y - c)
        casquete = int(round(h - (max(h * h - d * d, 0)) ** 0.5))
        if forma == 'proa':
            x0, x1 = 0, (N - 1) - casquete
        elif forma == 'popa':
            x0, x1 = casquete, N - 1
        else:
            x0, x1 = 0, N - 1
        ch = tonos[int(round((y - top) / (bot - top) * (len(tonos) - 1)))]
        linea_h(m, x0, x1, y, ch)
        if forma == 'proa':
            px(m, x1, y, 'o')
        if forma == 'popa':
            px(m, x0, y, 'o')

def remaches(m, top, bot, forma, cols=(3, 8, 13)):
    """Costuras del casco: una marca corta en cada cuaderna."""
    for x in cols:
        for y in (top + 2, bot - 2):
            x0, x1 = limites(top, bot, forma, y)
            if x0 + 1 <= x <= x1 - 1:
                px(m, x, y, 'm')

def escotillas(m, xs, y, ancho=2):
    for x in xs:
        rect(m, x, y, x + ancho - 1, y, 'o')
        px(m, x, y - 1, '+')

def espuma_proa(m, top, bot, forma='proa'):
    centro = int((top + bot) / 2)
    for y, dx in ((centro - 1, 1), (centro, 2), (centro + 1, 1)):
        x0, x1 = limites(top, bot, forma, y)
        px(m, min(N - 1, x1 + dx), y, 'w')

def estela(m, top, bot):
    """Agua revuelta detrás de la popa."""
    centro = int((top + bot) / 2)
    for y in (centro - 2, centro + 2):
        px(m, 0, y, 'w')
    px(m, 1, centro, 'w')

# ---------------------------------------------------------------- piezas
def torreta(m, x, y, largo=5, barriles=(-2, 1), hacia=1):
    """Torreta: base oscura, techo claro y cañones gruesos. `hacia=-1` apunta a la popa."""
    rect(m, x, y - 3, x + 4, y + 3, 'o')
    rect(m, x + 1, y - 2, x + 4, y + 2, 'm')
    rect(m, x + 1, y - 1, x + 3, y + 1, '+')
    px(m, x + 2, y, 'o')
    for dy in barriles:
        a = x + 5 if hacia > 0 else x - largo
        b = a + largo - 1
        rect(m, a, y + dy, b, y + dy + 1, 'o')
        punta = b if hacia > 0 else a
        px(m, punta, y + dy, 'y'); px(m, punta, y + dy + 1, 'y')

def puente(m, x, y, alto=7, ancho=6):
    rect(m, x, y - alto // 2, x + ancho - 1, y + alto // 2, 'o')
    rect(m, x, y - alto // 2 + 1, x + ancho - 2, y + alto // 2 - 1, 'm')
    rect(m, x + 1, y - alto // 2 + 2, x + ancho - 3, y + alto // 2 - 2, '+')
    linea_h(m, x + 1, x + ancho - 3, y, 'o')          # ventanas
    px(m, x + ancho - 2, y - 1, '+')

def chimenea(m, x, y, humo=True):
    rect(m, x, y - 3, x + 3, y + 3, 'o')
    rect(m, x, y - 2, x + 2, y + 2, 'm')
    rect(m, x + 1, y - 1, x + 2, y + 1, 'o')
    if humo:
        px(m, x + 1, y - 5, 'w'); px(m, x + 2, y - 6, 'w')

def radar(m, x, y):
    rect(m, x - 1, y, x + 1, y, 'c'); px(m, x, y + 1, 'c')
    px(m, x, y + 2, '+'); px(m, x, y + 3, '+')

def mastil(m, x, y0, y1):
    rect(m, x, y0, x, y1, 'm')
    px(m, x - 1, y0 + 1, '+'); px(m, x + 1, y0 + 1, '+')
    px(m, x, y0, 'y')

def botes(m, xs, top, bot):
    for x in xs:
        rect(m, x, top + 2, x + 1, top + 2, 'w')
        rect(m, x, bot - 2, x + 1, bot - 2, 'w')

def helipuerto(m, cx, cy, r=3):
    rect(m, cx - r, cy - r, cx + r, cy + r, 'o')
    rect(m, cx - r + 1, cy - r + 1, cx + r - 1, cy + r - 1, 'm')
    px(m, cx - 1, cy - 1, '+'); px(m, cx + 1, cy - 1, '+')
    px(m, cx - 1, cy, '+');     px(m, cx, cy, '+');      px(m, cx + 1, cy, '+')
    px(m, cx - 1, cy + 1, '+'); px(m, cx + 1, cy + 1, '+')       # la H

def ancla(m, x, y):
    px(m, x, y, 'o'); px(m, x, y + 1, 'o'); px(m, x + 1, y, 'm')

def tubos(m, x, y, n=3):
    for i in range(n):
        rect(m, x, y + i * 2, x + 1, y + i * 2, 'o')

def texto(m):
    return ["'" + ''.join(f) + "'" for f in m]

FLOTA = {}

# ---------------- Portaaviones (5): el más ancho, cubierta de pista ----------------
CT, CB = 1, 14
def cubierta(m, forma='medio'):
    casco(m, CT, CB, forma, relleno='d')
    y = (CT + CB) // 2
    for x in range(1, N - 1, 5):                       # eje de la pista
        rect(m, x, y, x + 2, y, 'y')
    for borde in (CT + 2, CB - 2):                     # bordes de la pista
        x0, x1 = limites(CT, CB, forma, borde)
        linea_h(m, x0 + 1, x1 - 1, borde, 'm')
    remaches(m, CT, CB, forma, cols=(2, 7, 12))

car = []
m = lienzo(); cubierta(m, 'popa')
for x in (4, 7, 10):                                    # cables de frenado
    rect(m, x, CT + 3, x, CB - 3, 'm')
estela(m, CT, CB); car.append(m)

m = lienzo(); cubierta(m)
rect(m, 6, 6, 11, 9, 'c'); rect(m, 4, 7, 12, 8, 'c')    # caza cian
px(m, 13, 7, '+'); px(m, 13, 8, '+'); px(m, 5, 5, 'c'); px(m, 5, 10, 'c')
px(m, 12, 6, 'o'); px(m, 12, 9, 'o')
car.append(m)

m = lienzo(); cubierta(m)
rect(m, 6, 0, 11, 5, 'o'); rect(m, 6, 1, 10, 4, 'm'); rect(m, 7, 2, 9, 3, '+')
linea_h(m, 7, 9, 3, 'o')                                 # ventanas de la isla
radar(m, 8, 0); px(m, 12, 1, 'r'); px(m, 12, 2, 'r'); mastil(m, 11, 0, 3)
car.append(m)

m = lienzo(); cubierta(m)
rect(m, 4, 5, 9, 8, 's'); rect(m, 3, 6, 10, 7, '+')      # avión gris plegado
rect(m, 11, 11, 15, 14, 'o'); rect(m, 12, 12, 14, 13, 'm')   # ascensor de cubierta
car.append(m)

m = lienzo(); cubierta(m, 'proa')
for y in (6, 9):                                          # catapultas
    linea_h(m, 2, 11, y, 'm')
espuma_proa(m, CT, CB); car.append(m)
FLOTA['carrier'] = car

# ---------------- Acorazado (4) ----------------
BT, BB = 2, 13
bat = []
m = lienzo(); casco(m, BT, BB, 'popa'); remaches(m, BT, BB, 'popa')
torreta(m, 7, 8, largo=3, barriles=(-2, 1), hacia=-1)     # torreta de popa, mirando atrás
escotillas(m, (12,), 5); estela(m, BT, BB); bat.append(m)

m = lienzo(); casco(m, BT, BB); remaches(m, BT, BB, 'medio')
torreta(m, 3, 8); botes(m, (1, 13), BT, BB); escotillas(m, (11,), 4); bat.append(m)

m = lienzo(); casco(m, BT, BB); remaches(m, BT, BB, 'medio')
puente(m, 5, 8, 9, 6); chimenea(m, 1, 8); radar(m, 8, 0); mastil(m, 12, 3, 7)
botes(m, (13,), BT, BB); bat.append(m)

m = lienzo(); casco(m, BT, BB, 'proa'); remaches(m, BT, BB, 'proa', cols=(3, 7))
torreta(m, 1, 8, largo=3); ancla(m, 9, 4); espuma_proa(m, BT, BB); bat.append(m)
FLOTA['battleship'] = bat

# ---------------- Crucero (3) ----------------
RT, RB = 3, 12
cru = []
m = lienzo(); casco(m, RT, RB, 'popa'); remaches(m, RT, RB, 'popa')
helipuerto(m, 10, 8, 3); estela(m, RT, RB); cru.append(m)
m = lienzo(); casco(m, RT, RB); remaches(m, RT, RB, 'medio')
puente(m, 4, 8, 7, 6); chimenea(m, 11, 8); radar(m, 8, 0); botes(m, (1,), RT, RB); cru.append(m)
m = lienzo(); casco(m, RT, RB, 'proa'); remaches(m, RT, RB, 'proa', cols=(3, 7))
torreta(m, 1, 8, largo=4, barriles=(-1,)); tubos(m, 2, 4, 2); ancla(m, 9, 5)
espuma_proa(m, RT, RB); cru.append(m)
FLOTA['cruiser'] = cru

# ---------------- Destructor (2) ----------------
DT, DB = 3, 12
des = []
m = lienzo(); casco(m, DT, DB, 'popa'); remaches(m, DT, DB, 'popa')
chimenea(m, 7, 8); puente(m, 11, 8, 7, 5); radar(m, 13, 0); tubos(m, 3, 6, 2)
estela(m, DT, DB); des.append(m)
m = lienzo(); casco(m, DT, DB, 'proa'); remaches(m, DT, DB, 'proa', cols=(3, 7))
torreta(m, 1, 8, largo=4, barriles=(-1,)); ancla(m, 9, 5); espuma_proa(m, DT, DB); des.append(m)
FLOTA['destroyer'] = des

# ---------------- Submarino (3): delgado, cilíndrico, romo ----------------
# Visto desde arriba, la vela es un bloque CHICO sobre el casco, no una cruz: lo que sube por
# fuera de la silueta es el periscopio, que es justo lo que se ve de un submarino asomado.
ST, SB = 5, 10
sub = []
m = lienzo(); casco_sub(m, ST, SB, 'popa')                  # popa: timones y hélice
# Los timones van en tono medio, no en contorno: sobre agua oscura, lo oscuro no existe.
rect(m, 4, ST - 2, 8, ST - 1, 'm'); linea_h(m, 4, 8, ST - 2, 's')        # timón de arriba
rect(m, 4, SB + 1, 8, SB + 2, 'm'); linea_h(m, 4, 8, SB + 2, 's')        # timón de abajo
rect(m, 2, 7, 4, 8, 'm'); rect(m, 1, 6, 1, 9, 'o'); px(m, 0, 7, 'w'); px(m, 0, 8, 'w')
sub.append(m)

m = lienzo(); casco_sub(m, ST, SB, 'medio')                 # vela, periscopio y escotillas
rect(m, 6, ST + 1, 10, SB - 1, 'm'); rect(m, 7, ST + 1, 9, SB - 1, '+')
rect(m, 8, 1, 8, ST, 'y')                                    # periscopio asomado
px(m, 9, 2, 'c'); px(m, 9, 3, 'c'); px(m, 10, 2, 'c')        # antena
rect(m, 2, 7, 3, 7, 'o'); rect(m, 12, 7, 13, 7, 'o')         # escotillas
sub.append(m)

m = lienzo(); casco_sub(m, ST, SB, 'proa')                  # proa roma y tubos
rect(m, 12, 7, 13, 7, 'o'); rect(m, 12, 8, 13, 8, 'o')       # tubos de torpedo
rect(m, 3, ST - 1, 6, ST - 1, 'm')                                       # planos de inmersión
rect(m, 3, SB + 1, 6, SB + 1, 'm')
px(m, 15, 7, 'w'); px(m, 15, 8, 'w')                         # espuma en la nariz
sub.append(m)
FLOTA['submarine'] = sub

# ---------------- salida: el módulo del juego ----------------
NOMBRES = {'carrier': 'Portaaviones (5)', 'battleship': 'Acorazado (4)', 'cruiser': 'Crucero (3)',
           'submarine': 'Submarino (3)', 'destroyer': 'Destructor (2)'}

CABEZA = """/**
 * La flota y el agua, en pixel art (D-91).
 *
 * **Generado por `tools/flota.py`.** Para cambiar un barco se edita ese script y se vuelve a
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

COLA = """
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

partes = [CABEZA, f"\nexport const LADO = {N};\n",
          "\n/** El agua: una sola baldosa, repetida. */\nexport const AGUA = [\n  " +
          ',\n  '.join(texto(agua())) + ',\n];\n',
          "\n/** Cuántas casillas ocupa cada barco (lo mismo que dice el motor). */\nexport const TAMANOS = { " +
          ', '.join(f"{k}: {len(v)}" for k, v in FLOTA.items()) + " };\n",
          "\n/** Los trozos de cada barco, de popa a proa. */\nexport const PIEZAS = {\n"]
for k in ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']:
    partes.append(f"  // {NOMBRES[k]}\n  {k}: [\n")
    for m in FLOTA[k]:
        partes.append('    [' + ', '.join(texto(m)) + '],\n')
    partes.append('  ],\n')
partes.append('};\n')
partes.append(COLA)

import pathlib
destino = pathlib.Path(__file__).resolve().parent.parent / 'batalla-naval' / 'flota.js'
destino.write_text(''.join(partes), encoding='utf-8')
print(f'escrito: {destino.relative_to(destino.parent.parent)} ({len(FLOTA)} barcos, {sum(len(v) for v in FLOTA.values())} trozos)')
