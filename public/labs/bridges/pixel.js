/**
 * A small pixel-art renderer (lab, Tren en Vilo). Everything is drawn on a low-resolution buffer —
 * one art pixel every `px` screen pixels — and scaled up without smoothing, so lines, sprites and
 * particles share the same chunky grid. No dependencies; meant to move to assets/js/ later.
 *
 *   const r = pixelado(canvas, { px: 3 });     // after sizing the canvas
 *   r.limpiar(); r.linea(...); r.sprite(...); r.volcar();
 */

/** A renderer over `canvas` (already sized in device pixels). `px` is screen pixels per art pixel. */
export function pixelado(canvas, { px = 3 } = {}) {
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(1, Math.floor(canvas.width / (px * dpr))), H = Math.max(1, Math.floor(canvas.height / (px * dpr)));
  const buf = document.createElement('canvas');
  buf.width = W; buf.height = H;
  const b = buf.getContext('2d');
  const r = {
    W, H, px, ctx: b,
    /** Art pixels per screen pixel: to turn layout coordinates (CSS px) into buffer ones. */
    a: (x) => Math.round(x / px),
    limpiar(color = null) { if (color) { b.fillStyle = color; b.fillRect(0, 0, W, H); } else b.clearRect(0, 0, W, H); },
    punto(x, y, color) { b.fillStyle = color; b.fillRect(Math.round(x), Math.round(y), 1, 1); },
    rect(x, y, w, h, color) { b.fillStyle = color; b.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    /** A pixel-perfect line (Bresenham), `grosor` art pixels thick. */
    linea(x0, y0, x1, y1, color, grosor = 1) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      b.fillStyle = color;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      const o = Math.floor((grosor - 1) / 2);
      let err = dx + dy;
      for (let n = 0; n < 4000; n++) {
        b.fillRect(x0 - o, y0 - o, grosor, grosor);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    },
    /** A filled pixel circle. */
    circulo(cx, cy, radio, color) {
      b.fillStyle = color;
      const R = Math.max(0, Math.round(radio));
      for (let y = -R; y <= R; y++) {
        const w = Math.round(Math.sqrt(Math.max(0, R * R - y * y)));
        b.fillRect(Math.round(cx) - w, Math.round(cy) + y, 2 * w + 1, 1);
      }
    },
    /**
     * A sprite from text rows: each character is a palette key, '.' is empty. Anchored at its
     * bottom-centre (`x`, `y`), so a vehicle sits on the line it rides.
     */
    sprite(filas, paleta, x, y, { voltear = false, inclinar = 0, cortarY = Infinity } = {}) {
      const h = filas.length, w = filas[0].length;
      const y0 = Math.round(y - h);
      for (let j = 0; j < h; j++) {
        const fila = filas[j];
        // `inclinar`: each row shifts that many pixels from the middle row, a pixel-art tilt
        const x0 = Math.round(x - w / 2 + (j - h / 2) * inclinar);
        // `cortarY`: rows below that line are not drawn (a whale under the water's surface)
        if (y0 + j > cortarY) continue;
        for (let i = 0; i < w; i++) {
          const c = fila[voltear ? w - 1 - i : i];
          if (c === '.' || c === ' ') continue;
          b.fillStyle = paleta[c] || '#f0f';
          b.fillRect(x0 + i, y0 + j, 1, 1);
        }
      }
    },
    /** Scales the buffer up to the canvas, with no smoothing: the pixel look. */
    volcar() {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(buf, 0, 0, W, H, 0, 0, W * px * dpr, H * px * dpr);
    },
  };
  return r;
}

/* ------------------------------------------------------------------ */
/* Particles: smoke, sparks, splinters, splashes                        */
/* ------------------------------------------------------------------ */

/** A particle system in art pixels; `paso(dt)` moves them, `dibujar(r)` paints them. */
export function particulas() {
  const lista = [];
  return {
    lista,
    /** Adds one: { x, y, vx, vy, vida, g (gravity), radio, crece, colores: [...from young to old], tipo } */
    agregar(p) { lista.push({ edad: 0, g: 0, radio: 0, crece: 0, ...p }); },
    paso(dt) {
      for (let k = lista.length - 1; k >= 0; k--) {
        const p = lista[k];
        p.edad += dt;
        if (p.edad >= p.vida) { lista.splice(k, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.radio += p.crece * dt;
      }
    },
    dibujar(r) {
      for (const p of lista) {
        const t = p.edad / p.vida, c = p.colores[Math.min(p.colores.length - 1, Math.floor(t * p.colores.length))];
        if (p.radio >= 1) r.circulo(p.x, p.y, p.radio, c);
        else r.punto(p.x, p.y, c);
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* The train's sprites                                                  */
/* ------------------------------------------------------------------ */

export const PALETA_TREN = {
  k: '#14081f',   // outline
  r: '#e0243c',   // body red
  R: '#ff5a6e',   // red highlight
  d: '#8a1426',   // red shade
  g: '#ffd23f',   // brass
  b: '#2b2f4a',   // boiler dark
  B: '#4a5078',   // boiler light
  w: '#9be8ff',   // window
  s: '#c9c9d6',   // steel
  S: '#6c6c80',   // steel shade
  y: '#fff3a0',   // lamp
};

// The locomotive faces right; 3 frames for the wheels (the rod moves) — 22 × 14 art pixels
const LOCO_CUERPO = [
  '......kkk.............',
  '......kgk.............',
  '.....kbbbk.....kkkkkk.',
  '.....kbBbk.....krrrrk.',
  '..kkkkbbbkkkkkkkrwwrk.',
  '.kbBBBBBBBBBBBBkrwwrkk',
  'ykbBgBBBBgBBBBBkrrrrdk',
  'ykbbbbbbbbbbbbbkrRRrdk',
  '.kdddddddddddddddddddk',
  '.kkkkkkkkkkkkkkkkkkkkk',
];
const RUEDAS = [
  ['..kSSk..kSSk...kSSSk..', '.kSsSSk.kSsSk.kSsssSk.', '..kSSk..kSSk...kSSSk..', '...kk....kk.....kkk...'],
  ['..kSSk..kSSk...kSSSk..', '.kSSsSk.kSSsk.kSSsSSk.', '..kSSk..kSSk...kSSSk..', '...kk....kk.....kkk...'],
  ['..kSSk..kSSk...kSSSk..', '.kSSSsk.kSSSsk.kSSSsSk', '..kSSk..kSSk...kSSSk..', '...kk....kk.....kkk...'],
];
export const LOCO = RUEDAS.map(r => [...LOCO_CUERPO, ...r]);
/** Where the chimney's top is, from the sprite's bottom-centre, in art pixels. */
export const CHIMENEA = { dx: -4, dy: -14 };

// A wagon, 16 × 10, with two wheel frames
const VAGON_CUERPO = [
  '.kkkkkkkkkkkkkk.',
  '.kggggggggggggk.',
  '.krrrrrrrrrrrrk.',
  '.krwwrrwwrrwwrk.',
  '.krRRrrRRrrRRrk.',
  '.kddddddddddddk.',
  'kkkkkkkkkkkkkkkk',
];
export const VAGON = [
  [...VAGON_CUERPO, '..kSSk....kSSk..', '.kSsSSk..kSsSSk.', '..kkkk....kkkk..'],
  [...VAGON_CUERPO, '..kSSk....kSSk..', '.kSSsSk..kSSsSk.', '..kkkk....kkkk..'],
];

/* ------------------------------------------------------------------ */
/* A bird, flapping: two frames, wings up and wings down, facing right */
/* ------------------------------------------------------------------ */

// Muted on purpose: a bird should pass almost unnoticed, close to the night sky's colors
export const PALETA_PAJARO = { k: '#7d6aa8', o: '#c49a5a' };
// Three wing positions (up, spread, down), with a body, a head and a beak: it reads as a bird, not a squiggle.
// Played up → spread → down → spread. 11 × 5, facing right.
export const PAJARO = [
  [
    '.k.......k.',
    '..k.....k..',
    '...k...k...',
    '....kkkkko.',
    '.....kk....',
  ],
  [
    '...........',
    '...........',
    'kkk.....kkk',
    '...kkkkkko.',
    '.....kk....',
  ],
  [
    '...........',
    '...........',
    '....kkkkko.',
    '...k.kk.k..',
    '..k.....k..',
  ],
];

/* ------------------------------------------------------------------ */
/* A flying saucer (two frames: its lights blink) and its "?"           */
/* ------------------------------------------------------------------ */

export const PALETA_PLATILLO = { k: '#14081f', d: '#9be8ff', D: '#e6fbff', s: '#c9c9d6', S: '#6c6c80', y: '#ffd23f', p: '#ff2e88', c: '#2ee6d6' };
const PLATILLO_CUERPO = [
  '.....kkkk.....',
  '....kdDdDk....',
  '...kdddddDk...',
  '.kkkkkkkkkkkk.',
  'kssssssssssssk',
];
export const PLATILLO = [
  [...PLATILLO_CUERPO, 'kSySSpSScSSySk', '.kkkkkkkkkkkk.', '....kkkkkk....'],
  [...PLATILLO_CUERPO, 'kSpSScSSySSpSk', '.kkkkkkkkkkkk.', '....kkkkkk....'],
];
export const PREGUNTA = [
  '.kkkk.',
  'kyyyyk',
  'kykkyk',
  '.k.kyk',
  '..kyk.',
  '..kyk.',
  '..kk..',
  '..kyk.',
  '..kk..',
];

/* ------------------------------------------------------------------ */
/* A whale that breaches: three drawn frames, all facing right — going  */
/* up (head up), at the top (level) and coming down (head down)          */
/* ------------------------------------------------------------------ */

export const PALETA_BALLENA = { k: '#0b1430', b: '#3d5a9e', B: '#5b7cc4', l: '#b9c8ee', w: '#ffffff' };
const ARRIBA = [
  '..........kkkkkk......',
  '........kkBBBBBBkk....',
  'k.k...kkBBBBBBBBBBkk..',
  'kbbkkkbBBBBBBBBBBwBbk.',
  '.kbbbbbbbbbbbbbbbbbbbk',
  '...kbbbbbbbbblllllllbk',
  '....kkkbbbllllllllllk.',
  '........kkkkkkkkkkkk..',
];

/**
 * The level whale, tilted by shifting each column up or down (more toward the head, on the right):
 * the hump and the outline stay as drawn, it only leans. `paso` is rows per column; > 0 raises the head.
 */
function inclinarColumnas(filas, paso) {
  const h = filas.length, w = filas[0].length, extra = Math.ceil(Math.abs(paso) * w);
  const out = Array.from({ length: h + extra }, () => Array(w).fill('.'));
  for (let i = 0; i < w; i++) {
    const d = Math.round(paso > 0 ? (w - 1 - i) * paso : (i * -paso));
    for (let j = 0; j < h; j++) if (filas[j][i] !== '.') out[j + d][i] = filas[j][i];
  }
  return out.map(r => r.join(''));
}
export const BALLENA = { sube: inclinarColumnas(ARRIBA, 0.14), arriba: ARRIBA, baja: inclinarColumnas(ARRIBA, -0.14) };

/* A little fish (the saucer's catch): 7 × 4, facing right */
export const PALETA_PEZ = { k: '#14081f', o: '#ff8a3d', y: '#ffd23f', w: '#ffffff' };
export const PEZ = [
  '.k..kk.',
  'koookwk',
  'kooyook',
  '.k..kk.',
];

/* A mole that lives in the cliff's rock: with glasses, or with a miner's helmet and lamp. 10 × 9, facing right */
export const PALETA_TOPO = { k: '#1a0b14', b: '#7a4a2a', B: '#9a6440', w: '#9be8ff', p: '#ff8aa8', y: '#ffd23f', l: '#fff8d0' };
export const TOPO = {
  anteojos: [
    '...kkkk...',
    '..kBBBBk..',
    '.kbBBBBbk.',
    'kkkkbbkkkk',
    'kwwkbbkwwk',
    'kkkkbbkkkk',
    'kbbbbbbppk',
    'kbbbbbbbbk',
    'kbbbbbbbbk',
  ],
  minero: [
    '...kkkk...',
    '..kyyyyk..',
    '.kyyyyllk.',
    'kkkkkkkkkk',
    'kbkbbbbkbk',
    'kbbbbbbbbk',
    'kbbbbbbppk',
    'kbbbbbbbbk',
    'kbbbbbbbbk',
  ],
};
