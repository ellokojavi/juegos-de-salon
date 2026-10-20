/**
 * Pips — lab prototype (D-381), inspired by Pips (The New York Times Games, 2025): place every domino
 * on the board so each colored zone keeps its rule: its pips add up to a number (6), are all equal
 * (=), all different (≠), add up to less (<5) or more (>9) than a number, or anything goes.
 *
 * A board is built from a solution: dominoes laid one next to another make the shape, each one gets
 * a different domino of a double-six set, the cells are split into small zones, and each zone gets a
 * rule its own pips keep. Then a solver counts the solutions; while there is more than one, a zone
 * that differs between two of them gets a stricter rule (an exact sum), until only one is left. So
 * every board has exactly one solution and never needs a guess. A player's board counts as solved when
 * every cell is covered and every zone keeps its rule, whatever the order. Pure: no DOM, tested by
 * engine.test.mjs.
 */

/** The three boards of a game, from easy to hard: how many dominoes, inside a box of columns × rows. */
export const NIVELES = [
  { id: 'facil', fichas: 4, caja: [4, 3] },
  { id: 'medio', fichas: 6, caja: [4, 4] },
  { id: 'dificil', fichas: 8, caja: [5, 5] },
];
export const PUNTOS_TABLERO = 20;            // each board solved
export const PUNTOS_RAPIDEZ = 40;            // all three, quickly
export const RAPIDO_MS = 4 * 60 * 1000;      // 40 in 4 minutes or less…
export const LENTO_MS = 12 * 60 * 1000;      // …0 in 12
export const RESTA_AYUDA = 10;
export const MAXIMO = PUNTOS_TABLERO * NIVELES.length + PUNTOS_RAPIDEZ;

export function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const entero = (rnd, n) => Math.floor(rnd() * n);
const barajar = (rnd, xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = entero(rnd, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clave = (r, c) => `${r},${c}`;
const VECINOS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

/** What a zone asks, in a short label for its badge. */
export const etiqueta = z => ({ suma: String(z.n), igual: '=', distinto: '≠', menor: `<${z.n}`, mayor: `>${z.n}`, libre: '' })[z.tipo];

/**
 * Does a zone keep its rule with these pips (one per cell, `null` where nothing is placed yet)?
 * `true` kept, `false` broken, `null` not decided yet. A partial zone already says `false` when no
 * way of filling it could work (used by the solver to prune, and by the screen only once full).
 */
export function cumple(z, valores) {
  const puestos = valores.filter(v => v !== null && v !== undefined);
  const faltan = valores.length - puestos.length;
  const suma = puestos.reduce((a, b) => a + b, 0);
  switch (z.tipo) {
    case 'libre': return faltan ? null : true;
    case 'igual': if (puestos.some(v => v !== puestos[0])) return false; return faltan ? null : true;
    case 'distinto': if (new Set(puestos).size !== puestos.length) return false; return faltan ? null : true;
    case 'suma': if (suma > z.n || suma + 6 * faltan < z.n) return false; return faltan ? null : suma === z.n;
    case 'menor': if (suma >= z.n) return false; return faltan ? null : true;
    case 'mayor': if (suma + 6 * faltan <= z.n) return false; return faltan ? null : suma > z.n;
    default: return false;
  }
}

/* ------------------------------------------------------------------ */
/* The solver                                                          */
/* ------------------------------------------------------------------ */

/**
 * Every way of laying the dominoes on the board that keeps all the rules, up to `max`. Each solution
 * is `valores`, one pip count per cell; layouts that leave the same pips everywhere count once.
 * With `limite`, it gives up after that many steps and returns `null`. Cells are filled in reading order: the first empty one always
 * takes a domino's half, the other half going right or down.
 */
export function resolver(t, max = 2, limite = Infinity) {
  const n = t.celdas.length;
  const idx = new Map(t.celdas.map((c, i) => [clave(c.r, c.c), i]));
  const derecha = t.celdas.map(c => idx.get(clave(c.r, c.c + 1)) ?? -1);
  const abajo = t.celdas.map(c => idx.get(clave(c.r + 1, c.c)) ?? -1);
  const zonaDe = Array(n);
  t.zonas.forEach((z, k) => z.celdas.forEach(i => { zonaDe[i] = k; }));
  const valores = Array(n).fill(null);
  const usada = t.fichas.map(() => false);
  const sols = [], vistas = new Set();
  let pasos = 0;
  const ok = i => { const z = t.zonas[zonaDe[i]]; return cumple(z, z.celdas.map(j => valores[j])) !== false; };
  const paso = desde => {
    if (sols.length >= max || ++pasos > limite) return;
    let i = desde; while (i < n && valores[i] !== null) i++;
    // Two layouts that leave the same pips on every cell are the same answer
    if (i === n) { const k = valores.join(); if (!vistas.has(k)) { vistas.add(k); sols.push([...valores]); } return; }
    for (const j of [derecha[i], abajo[i]]) {
      if (j < 0 || valores[j] !== null) continue;
      const vistos = new Set();
      for (let f = 0; f < t.fichas.length; f++) {
        if (usada[f]) continue;
        const [x, y] = t.fichas[f];
        for (const [a, b] of x === y ? [[x, y]] : [[x, y], [y, x]]) {
          const k = `${a},${b}`; if (vistos.has(k)) continue; vistos.add(k);
          valores[i] = a; valores[j] = b; usada[f] = true;
          if (ok(i) && ok(j)) paso(i + 1);
          valores[i] = null; valores[j] = null; usada[f] = false;
          if (sols.length >= max) return;
        }
      }
    }
  };
  paso(0);
  // Too much work to be sure: `null` (the board is too loose to prove in time)
  return pasos > limite ? null : sols;
}

/* ------------------------------------------------------------------ */
/* Building a board                                                    */
/* ------------------------------------------------------------------ */

/** The 28 dominoes of a double-six set. */
const JUEGO = []; for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) JUEGO.push([a, b]);

/**
 * A shape made of `n` dominoes laid next to each other: `[{ a: [r, c], b: [r, c] }]`, inside a box of
 * `ancho` × `alto`. Compact, like a board: a new domino goes where its cells touch more of the shape
 * (weighted by the square of the neighbors already taken), so it rarely grows a long thin arm.
 */
function forma(rnd, n, ancho, alto = ancho) {
  const ocupadas = new Set();
  const lugares = [];
  const libre = (r, c) => r >= 0 && c >= 0 && c < ancho && r < alto && !ocupadas.has(clave(r, c));
  const toca = (r, c) => VECINOS.filter(([dr, dc]) => ocupadas.has(clave(r + dr, c + dc))).length;
  const poner = (a, b) => { ocupadas.add(clave(...a)); ocupadas.add(clave(...b)); lugares.push({ a, b }); };
  const r0 = entero(rnd, alto - 1), c0 = entero(rnd, ancho - 1);
  poner([r0, c0], rnd() < 0.5 ? [r0, c0 + 1] : [r0 + 1, c0]);
  while (lugares.length < n) {
    const opciones = [];
    for (const k of ocupadas) {
      const [r, c] = k.split(',').map(Number);
      for (const [dr, dc] of VECINOS) {
        const a = [r + dr, c + dc]; if (!libre(...a)) continue;
        for (const [er, ec] of VECINOS) {
          const b = [a[0] + er, a[1] + ec]; if (!libre(...b)) continue;
          const peso = (toca(...a) + toca(...b)) ** 2;
          opciones.push([a, b, peso]);
        }
      }
    }
    if (!opciones.length) break;
    let x = rnd() * opciones.reduce((s, o) => s + o[2], 0);
    const elegida = opciones.find(o => (x -= o[2]) < 0) || opciones[opciones.length - 1];
    poner(elegida[0], elegida[1]);
  }
  return lugares;
}

/**
 * Splits the cells into connected zones of 1 to 4 cells, in a random order. A zone grows first into
 * a neighbor with the same pips when there is one (most of the time), so `=` zones come up, as in
 * the real Pips. A zone never holds both halves of a domino with two different numbers: turned
 * round, it would leave the same pips in the zone, a second answer no rule can tell apart.
 */
function zonas(rnd, celdas, valores, pareja) {
  const idx = new Map(celdas.map((c, i) => [clave(c.r, c.c), i]));
  const de = Array(celdas.length).fill(-1);
  const out = [];
  for (const i of barajar(rnd, celdas.map((_, i) => i))) {
    if (de[i] >= 0) continue;
    const tam = [1, 2, 2, 2, 3, 3, 4][entero(rnd, 7)];
    const z = [i]; de[i] = out.length;
    while (z.length < tam) {
      const cand = [];
      for (const j of z) for (const [dr, dc] of VECINOS) { const k = idx.get(clave(celdas[j].r + dr, celdas[j].c + dc)); if (k !== undefined && de[k] < 0 && !z.some(m => pareja[m] === k && valores[m] !== valores[k])) cand.push(k); }
      if (!cand.length) break;
      const iguales = cand.filter(k => valores[k] === valores[i]);
      const k = iguales.length && rnd() < 0.8 ? iguales[entero(rnd, iguales.length)] : cand[entero(rnd, cand.length)];
      de[k] = out.length; z.push(k);
    }
    out.push(z);
  }
  // Cells left alone (their neighbors were taken first) mostly join a small neighboring zone: the
  // real Pips has few one-cell zones
  for (const z of out) {
    if (z.length !== 1 || rnd() < 0.25) continue;
    const i = z[0];
    const vecinas = VECINOS.map(([dr, dc]) => idx.get(clave(celdas[i].r + dr, celdas[i].c + dc))).filter(k => k !== undefined && out[de[k]].length > 1 && out[de[k]].length < 4 && !out[de[k]].some(m => pareja[i] === m && valores[m] !== valores[i]));
    if (!vecinas.length) continue;
    const k = (vecinas.find(k => valores[k] === valores[i]) ?? vecinas[entero(rnd, vecinas.length)]);
    out[de[k]].push(i); de[i] = de[k]; z.length = 0;
  }
  return out.filter(z => z.length).map(z => z.sort((a, b) => a - b));
}

/** A rule this zone's pips keep, chosen at random among the ones that make sense for them. */
function regla(rnd, vals) {
  const suma = vals.reduce((a, b) => a + b, 0);
  const opciones = [{ tipo: 'suma', n: suma }];
  if (vals.length > 1 && vals.every(v => v === vals[0])) opciones.push({ tipo: 'igual' }, { tipo: 'igual' }, { tipo: 'igual' });
  if (vals.length > 2 && new Set(vals).size === vals.length) opciones.push({ tipo: 'distinto' }, { tipo: 'distinto' });
  if (suma < 6 * vals.length) opciones.push({ tipo: 'menor', n: suma + 1 + entero(rnd, 2) });
  if (suma > 0) opciones.push({ tipo: 'mayor', n: suma - 1 - entero(rnd, Math.min(2, suma)) });
  opciones.push({ tipo: 'libre' });
  return opciones[entero(rnd, opciones.length)];
}

/**
 * The stricter rule that tells our pips from the `otras` solutions': among the zones that differ, a
 * rule ours keep and theirs break, preferring `=`, `≠`, `<` and `>` (the tightest bound) to an exact
 * sum, so the boards are not all adding up, and among those the one that rules out the most of them.
 * `{ z, regla }`, or null when no zone can tell them apart.
 */
function ajuste(rnd, zs, valores, otras) {
  const nuestras = [], sumas = [];
  for (const z of zs) {
    const v = z.celdas.map(i => valores[i]);
    const ws = otras.map(o => z.celdas.map(i => o[i])).filter(w => w.some((x, k) => x !== v[k]));
    if (!ws.length) continue;
    const suma = v.reduce((a, b) => a + b, 0);
    const mata = r => ws.filter(w => cumple(r, w) === false).length;
    const reglas = [{ tipo: 'igual' }, { tipo: 'distinto' }, { tipo: 'menor', n: suma + 1 }, { tipo: 'mayor', n: suma - 1 }]
      .filter(r => (r.tipo !== 'igual' && r.tipo !== 'distinto') || v.length > 1)
      .filter(r => r.tipo !== z.tipo || r.n !== z.n)
      .filter(r => cumple(r, v) === true);
    for (const r of reglas) { const k = mata(r); if (k) nuestras.push({ z, regla: r, k }); }
    const exacta = { tipo: 'suma', n: suma };
    if (z.tipo !== 'suma') { const k = mata(exacta); if (k) sumas.push({ z, regla: exacta, k }); }
  }
  const pool = nuestras.length && rnd() < 0.75 ? nuestras : sumas.length ? sumas : nuestras;
  if (!pool.length) return null;
  const mejor = Math.max(...pool.map(o => o.k));
  const top = pool.filter(o => o.k === mejor);
  return top[entero(rnd, top.length)];
}

/**
 * Once a board has one answer: a one-cell zone joins a small neighboring zone whenever the board keeps
 * a single answer with the joined zone's new rule (`=`, `≠`, `<` or `>` before an exact sum), so the
 * tightening leaves fewer loose numbers behind.
 */
function pulir(rnd, t, valores, pareja, limite) {
  const junto = (i, j) => Math.abs(t.celdas[i].r - t.celdas[j].r) + Math.abs(t.celdas[i].c - t.celdas[j].c) === 1;
  for (const z of barajar(rnd, t.zonas.filter(z => z.celdas.length === 1))) {
    if (z.celdas.length !== 1) continue;   // another one joined it already
    const i = z.celdas[0];
    const cerca = barajar(rnd, t.zonas.filter(u => u !== z && u.celdas.length < 4 && u.celdas.some(j => junto(i, j))
      && !u.celdas.some(j => pareja[i] === j && valores[j] !== valores[i])));
    for (const u of cerca) {
      const cs = [...u.celdas, i].sort((a, b) => a - b), vs = cs.map(j => valores[j]);
      const suma = vs.reduce((a, b) => a + b, 0);
      const reglas = [...barajar(rnd, [{ tipo: 'igual' }, { tipo: 'distinto' }, { tipo: 'menor', n: suma + 1 }, { tipo: 'mayor', n: suma - 1 }]), { tipo: 'suma', n: suma }]
        .filter(r => cumple(r, vs) === true);
      const antes = { celdas: u.celdas, tipo: u.tipo, n: u.n };
      const k = t.zonas.indexOf(z);
      t.zonas.splice(k, 1);
      const ok = reglas.some(r => { Object.assign(u, { celdas: cs, n: undefined }, r); const s = resolver(t, 2, limite); return s && s.length === 1; });
      if (ok) break;
      Object.assign(u, antes); t.zonas.splice(k, 0, z);
    }
  }
  for (const z of t.zonas) if (z.n === undefined) delete z.n;
}

/**
 * A board for a seed and a level (`NIVELES[k].id`): `{ nivel, ancho, alto, celdas: [{ r, c }],
 * fichas: [[x, y]], zonas: [{ celdas, tipo, n }], solucion: [{ f, a, b }] }`, where the domino `f`
 * lays its `x` on cell `a` and its `y` on cell `b`. Exactly one solution (`resolver(t).length === 1`).
 */
export function generar(semilla, nivel = 'facil') {
  const N = NIVELES.find(x => x.id === nivel) || NIVELES[0];
  for (let intento = 0; ; intento++) {
    const rnd = azar(`${semilla}:${nivel}:${intento}`);
    const lugares = forma(rnd, N.fichas, ...N.caja);
    if (lugares.length < N.fichas) continue;
    // Cells in reading order, from the top-left corner of the shape
    const todas = lugares.flatMap(l => [l.a, l.b]);
    const r0 = Math.min(...todas.map(x => x[0])), c0 = Math.min(...todas.map(x => x[1]));
    const celdas = todas.map(([r, c]) => ({ r: r - r0, c: c - c0 })).sort((x, y) => x.r - y.r || x.c - y.c);
    const idx = new Map(celdas.map((c, i) => [clave(c.r, c.c), i]));
    const piezas = barajar(rnd, JUEGO).slice(0, N.fichas);
    const valores = Array(celdas.length);
    const solucion = lugares.map((l, f) => {
      const a = idx.get(clave(l.a[0] - r0, l.a[1] - c0)), b = idx.get(clave(l.b[0] - r0, l.b[1] - c0));
      const [x, y] = rnd() < 0.5 ? piezas[f] : [piezas[f][1], piezas[f][0]];
      valores[a] = x; valores[b] = y;
      return { f, a, b, x, y };
    });
    const pareja = Array(celdas.length);
    for (const { a, b } of solucion) { pareja[a] = b; pareja[b] = a; }
    const zs = zonas(rnd, celdas, valores, pareja).map(cs => ({ celdas: cs, ...regla(rnd, cs.map(i => valores[i])) }));
    const t = { nivel, ancho: Math.max(...celdas.map(c => c.c)) + 1, alto: Math.max(...celdas.map(c => c.r)) + 1, celdas, fichas: solucion.map(s => [s.x, s.y]), zonas: zs, solucion: solucion.map(({ f, a, b }) => ({ f, a, b })) };
    // Tighten until only one solution is left: a zone that differs from ours gets its exact sum. A
    // board too loose to prove quickly gets one more exact sum, on a zone that has none (a phone
    // builds three boards when the game starts, D-381)
    const LIMITE = 20000;
    let sols = resolver(t, 2, LIMITE), vueltas = 0;
    while (sols === null && vueltas++ < 30) {
      const flojas = t.zonas.filter(z => z.tipo !== 'suma');
      if (!flojas.length) break;
      const z = flojas[entero(rnd, flojas.length)];
      z.tipo = 'suma'; z.n = z.celdas.reduce((a, i) => a + valores[i], 0);
      sols = resolver(t, 2, LIMITE);
    }
    if (sols === null) continue;
    while (sols.length > 1 && vueltas++ < 60) {
      const otras = sols.filter(s => s.some((v, i) => v !== valores[i]));
      const otra = otras[0];
      const cambio = ajuste(rnd, t.zonas, valores, otras);
      if (cambio) Object.assign(cambio.z, cambio.regla);
      else {
        // The two differ only inside zones whose sums agree (2 and 4 against 4 and 2): one of those
        // cells moves to a small neighboring zone, so the next round can tell them apart there, or,
        // with none, becomes a zone of its own with its exact pips. The zone it leaves keeps a rule
        // its pips still keep
        const w = t.zonas.find(w => w.celdas.length > 1 && w.celdas.some(i => otra[i] !== valores[i]));
        if (!w) break;
        const i = w.celdas.find(i => otra[i] !== valores[i]);
        w.celdas = w.celdas.filter(j => j !== i);
        const resto = w.celdas.map(j => valores[j]);
        if (cumple(w, resto) !== true || w.tipo === 'suma') Object.assign(w, { tipo: 'suma', n: resto.reduce((a, b) => a + b, 0) });
        const cerca = t.zonas.filter(u => u !== w && u.celdas.length < 4 && u.celdas.some(j => Math.abs(celdas[j].r - celdas[i].r) + Math.abs(celdas[j].c - celdas[i].c) === 1)
          && !u.celdas.some(j => pareja[i] === j && valores[j] !== valores[i]));
        if (cerca.length) {
          const u = cerca[entero(rnd, cerca.length)];
          u.celdas = [...u.celdas, i].sort((a, b) => a - b);
          const vs = u.celdas.map(j => valores[j]);
          if (u.tipo === 'suma' || cumple(u, vs) !== true) Object.assign(u, { tipo: 'suma', n: vs.reduce((a, b) => a + b, 0) });
        } else t.zonas.push({ celdas: [i], tipo: 'suma', n: valores[i] });
      }
      sols = resolver(t, 2, LIMITE);
      if (sols === null) break;
    }
    if (!sols || sols.length !== 1) continue;
    pulir(rnd, t, valores, pareja, LIMITE);
    // The tray shows the dominoes in a shuffled order, each one turned at random
    const orden = barajar(rnd, t.fichas.map((_, f) => f));
    const giro = orden.map(() => rnd() < 0.5);
    const fichas = orden.map((f, k) => (giro[k] ? [t.fichas[f][1], t.fichas[f][0]] : t.fichas[f]));
    const solucionTray = t.solucion.map(s => { const k = orden.indexOf(s.f); return giro[k] ? { f: k, a: s.b, b: s.a } : { f: k, a: s.a, b: s.b }; });
    return { ...t, fichas, solucion: solucionTray };
  }
}

/* ------------------------------------------------------------------ */
/* A game in progress                                                  */
/* ------------------------------------------------------------------ */

/** A board being played: no domino placed. `puestas[f]` is `{ a, b }` (its x on a, y on b) or null. */
export const nuevaPartida = t => ({ t, puestas: t.fichas.map(() => null), ayudas: 0 });

/** The cell to the right of / below `i`, or -1. */
export function vecina(t, i, abajo) {
  const c = t.celdas[i];
  return t.celdas.findIndex(x => (abajo ? x.r === c.r + 1 && x.c === c.c : x.r === c.r && x.c === c.c + 1));
}

/** The pips on each cell now (null where empty). */
export function valores(p) {
  const v = p.t.celdas.map(() => null);
  p.puestas.forEach((s, f) => { if (s) { v[s.a] = p.t.fichas[f][0]; v[s.b] = p.t.fichas[f][1]; } });
  return v;
}
/** Which domino covers each cell (or -1). */
export function ocupacion(p) {
  const o = p.t.celdas.map(() => -1);
  p.puestas.forEach((s, f) => { if (s) { o[s.a] = f; o[s.b] = f; } });
  return o;
}

/**
 * The cells a domino would take if dropped with its first half on `i`, turned `giro` times a
 * quarter (0: x|y, 1: x over y, 2: y|x, 3: y over x): `{ a, b }` for its x and y, or null off the board.
 */
export function lugar(t, i, giro) {
  const j = vecina(t, i, giro % 2 === 1);
  if (j < 0) return null;
  return giro < 2 ? { a: i, b: j } : { a: j, b: i };
}

/** Places domino `f` on `{ a, b }`. Refuses (returns the reason) when a cell is already taken. */
export function poner(p, f, sitio) {
  if (!sitio) return { ok: false, motivo: 'fuera' };
  const o = ocupacion(p);
  if ((o[sitio.a] >= 0 && o[sitio.a] !== f) || (o[sitio.b] >= 0 && o[sitio.b] !== f)) return { ok: false, motivo: 'ocupada' };
  p.puestas[f] = { a: sitio.a, b: sitio.b };
  return { ok: true };
}
export function sacar(p, f) { p.puestas[f] = null; }

/** Each zone: `true` kept, `false` broken, `null` still open (decided only once it is full). */
export function estadoZonas(p) {
  const v = valores(p);
  return p.t.zonas.map(z => { const vs = z.celdas.map(i => v[i]); return vs.some(x => x === null) ? null : cumple(z, vs); });
}
export const lleno = p => p.puestas.every(Boolean);
export const resuelto = p => lleno(p) && estadoZonas(p).every(x => x === true);

/**
 * The 💡 help: one domino of the solution, put in its place (taking off whatever was on those cells),
 * the first one not already right. Returns its index, or -1 if all are right.
 */
export function ayudar(p) {
  const s = p.t.solucion.find(s => { const q = p.puestas[s.f]; return !q || q.a !== s.a || q.b !== s.b; });
  if (!s) return -1;
  const o = ocupacion(p);
  for (const i of [s.a, s.b]) if (o[i] >= 0) p.puestas[o[i]] = null;
  p.puestas[s.f] = { a: s.a, b: s.b };
  p.ayudas++;
  return s.f;
}

/* ------------------------------------------------------------------ */
/* The score                                                           */
/* ------------------------------------------------------------------ */

/**
 * Out of 100: each board solved 20; with the three, up to 40 for speed (40 in 4 minutes or less, 0
 * in 12, straight between); each help −10; never below 0.
 */
export function puntaje({ resueltos, ms, ayudas }) {
  let s = resueltos * PUNTOS_TABLERO;
  if (resueltos === NIVELES.length) s += Math.round(PUNTOS_RAPIDEZ * Math.min(1, Math.max(0, (LENTO_MS - ms) / (LENTO_MS - RAPIDO_MS))));
  return Math.max(0, s - ayudas * RESTA_AYUDA);
}

/** What is shared: one mark per board, and the helps, never the boards. */
export function tarjeta({ resueltos, ayudas }) {
  const marcas = NIVELES.map((_, k) => (k < resueltos ? '✅' : '⬜')).join('');
  return `${marcas} ${resueltos} de ${NIVELES.length}${ayudas ? ` · 💡 ${ayudas}` : ''}`;
}
