/**
 * Batalla Naval — motor puro (sin DOM). Testeable con node.
 * Tablero N×N (10 por defecto), columnas A–J y filas 1–10. Celda: 'B4' ↔ { r: 3, c: 1 }.
 * layout: { carrier: { r, c, dir: 'h'|'v' }, ... }
 */
export const N = 10;
export const COLS = 'ABCDEFGHIJ';
export const FLEET = [
  { id: 'carrier', size: 5 },
  { id: 'battleship', size: 4 },
  { id: 'cruiser', size: 3 },
  { id: 'submarine', size: 3 },
  { id: 'destroyer', size: 2 },
];
export const SHIP_SIZE = Object.fromEntries(FLEET.map(f => [f.id, f.size]));

export const cellName = (r, c) => `${COLS[c]}${r + 1}`;
export const parseCell = name => ({ r: parseInt(name.slice(1), 10) - 1, c: COLS.indexOf(name[0]) });
export const isCell = name => typeof name === 'string' && /^[A-J](10|[1-9])$/.test(name);

/** Casillas que ocupa un barco de tamaño `size` colocado en {r,c,dir}. */
export function cellsOf(size, { r, c, dir }) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(dir === 'h' ? { r, c: c + i } : { r: r + i, c });
  return out;
}

const inBounds = ({ r, c }, n = N) => r >= 0 && c >= 0 && r < n && c < n;

/** ¿Puede colocarse `shipId` en `placement` sin salirse ni superponerse con los demás barcos de `layout`? */
export function isValidPlacement(layout, shipId, placement, n = N) {
  const cells = cellsOf(SHIP_SIZE[shipId], placement);
  if (!cells.every(x => inBounds(x, n))) return false;
  const occupied = new Set();
  for (const [id, p] of Object.entries(layout)) {
    if (id === shipId || !p) continue;
    cellsOf(SHIP_SIZE[id], p).forEach(x => occupied.add(`${x.r},${x.c}`));
  }
  return cells.every(x => !occupied.has(`${x.r},${x.c}`));
}

/** Flota completa y válida. */
export function isValidLayout(layout, n = N) {
  if (!layout) return false;
  return FLEET.every(f => layout[f.id] && ['h', 'v'].includes(layout[f.id].dir) && isValidPlacement(layout, f.id, layout[f.id], n));
}

/** Flota al azar (los barcos pueden tocarse; solo no se superponen). */
export function randomLayout(n = N) {
  const layout = {};
  for (const f of FLEET) {
    for (let tries = 0; tries < 500; tries++) {
      const dir = Math.random() < 0.5 ? 'h' : 'v';
      const r = Math.floor(Math.random() * (dir === 'v' ? n - f.size + 1 : n));
      const c = Math.floor(Math.random() * (dir === 'h' ? n - f.size + 1 : n));
      if (isValidPlacement(layout, f.id, { r, c, dir }, n)) { layout[f.id] = { r, c, dir }; break; }
    }
    if (!layout[f.id]) return randomLayout(n); // muy improbable; reintentar desde cero
  }
  return layout;
}

/** Mapa celda → id de barco. */
export function occupancy(layout) {
  const map = {};
  for (const [id, p] of Object.entries(layout)) if (p) cellsOf(SHIP_SIZE[id], p).forEach(x => { map[cellName(x.r, x.c)] = id; });
  return map;
}

/** Cadena canónica de la flota (para el compromiso por hash). */
export function layoutKey(layout) {
  return FLEET.map(f => { const p = layout[f.id]; return `${f.id}:${p.r},${p.c},${p.dir}`; }).join('|');
}

/**
 * Responde un disparo contra `layout`. `previousCells`: celdas ya disparadas antes (nombres).
 * → { result: 'agua' } | { result: 'tocado', ship } | { result: 'hundido', ship, cells: [...] }
 */
export function shoot(layout, previousCells, cell) {
  const occ = occupancy(layout);
  const ship = occ[cell];
  if (!ship) return { result: 'agua' };
  const shipCells = cellsOf(SHIP_SIZE[ship], layout[ship]).map(x => cellName(x.r, x.c));
  const prev = new Set(previousCells);
  const hits = shipCells.filter(x => x === cell || prev.has(x));
  if (hits.length === shipCells.length) return { result: 'hundido', ship, cells: shipCells };
  return { result: 'tocado', ship };
}

/** Ids de barcos hundidos según los disparos respondidos [{cell, result, ship, cells}]. */
export function sunkShips(replies) {
  return replies.filter(x => x.result === 'hundido').map(x => x.ship);
}
export function allSunk(replies) { return sunkShips(replies).length === FLEET.length; }

/**
 * IA: cacería por paridad + persecución.
 *  - Cacería: dispara a casillas de paridad según el barco más chico que queda (con 2, un tablero de ajedrez).
 *  - Persecución: con un tocado prueba las vecinas; con dos alineados sigue la línea por ambos extremos.
 */
export class Hunter {
  constructor(n = N) {
    this.n = n;
    this.shot = new Set();
    this.hits = [];                     // tocados aún no hundidos: [{r,c}]
    this.remaining = FLEET.map(f => f.size);
  }
  _free(r, c) { return inBounds({ r, c }, this.n) && !this.shot.has(cellName(r, c)); }
  next() {
    // Persecución
    if (this.hits.length >= 2) {
      const [a, b] = this.hits;
      const horizontal = this.hits.every(h => h.r === a.r);
      const vertical = this.hits.every(h => h.c === a.c);
      if (horizontal || vertical) {
        const sorted = this.hits.slice().sort((x, y) => horizontal ? x.c - y.c : x.r - y.r);
        const first = sorted[0], last = sorted[sorted.length - 1];
        const cands = horizontal
          ? [{ r: a.r, c: first.c - 1 }, { r: a.r, c: last.c + 1 }]
          : [{ r: first.r - 1, c: a.c }, { r: last.r + 1, c: a.c }];
        const ok = cands.filter(x => this._free(x.r, x.c));
        if (ok.length) return cellName(ok[0].r, ok[0].c);
      }
      void b;
    }
    if (this.hits.length >= 1) {
      for (const h of this.hits) {
        const cands = [{ r: h.r - 1, c: h.c }, { r: h.r + 1, c: h.c }, { r: h.r, c: h.c - 1 }, { r: h.r, c: h.c + 1 }].filter(x => this._free(x.r, x.c));
        if (cands.length) { const x = cands[Math.floor(Math.random() * cands.length)]; return cellName(x.r, x.c); }
      }
    }
    // Cacería por paridad
    const minSize = Math.max(2, Math.min(...this.remaining));
    const pool = [];
    for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) if (this._free(r, c) && (r + c) % minSize === 0) pool.push({ r, c });
    if (!pool.length) for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) if (this._free(r, c)) pool.push({ r, c });
    const x = pool[Math.floor(Math.random() * pool.length)];
    return cellName(x.r, x.c);
  }
  learn(cell, reply) {
    this.shot.add(cell);
    const p = parseCell(cell);
    if (reply.result === 'tocado') this.hits.push(p);
    if (reply.result === 'hundido') {
      const sunk = new Set(reply.cells);
      sunk.forEach(x => this.shot.add(x));
      this.hits = this.hits.filter(h => !sunk.has(cellName(h.r, h.c)));
      const i = this.remaining.indexOf(SHIP_SIZE[reply.ship]);
      if (i >= 0) this.remaining.splice(i, 1);
    }
  }
}

/** Quién dispara después de una respuesta. */
export function nextShooter(shooter, result, extraShot) {
  if (result !== 'agua' && extraShot) return shooter;
  return shooter === 'A' ? 'B' : 'A';
}

/** SHA-256 en hexadecimal (requiere contexto seguro). */
export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export function randomNonce(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Verifica el compromiso y que todas las respuestas dadas coincidan con la flota revelada. */
export async function verifyPlayer({ layout, salt, commit, repliesGiven }) {
  const hashOk = isValidLayout(layout) && (await sha256(layoutKey(layout) + salt)) === commit;
  const prev = [];
  let repliesOk = true;
  for (const r of repliesGiven) {
    const expected = shoot(layout, prev, r.cell);
    if (expected.result !== r.result || (expected.ship || null) !== (r.ship || null)) { repliesOk = false; break; }
    prev.push(r.cell);
  }
  return { hashOk, repliesOk, ok: hashOk && repliesOk };
}
