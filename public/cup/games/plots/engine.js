/**
 * Loteo — the engine (born in the lab, D-310; a La Copa game since D-331). Inspired by Shikaku (Nikoli, 1989):
 * una grilla con algunos números; hay que dividirla entera en rectángulos, cada uno con exactamente un
 * número, y ese número es su área. Cada tablero tiene solución única.
 *
 * Un tablero es `{ lado, numeros, pistas, solucion }`: `numeros` tiene una casilla por lugar (por filas),
 * con 0 o el número; `pistas` son las casillas con número (`{ i, n }`, en el orden de lectura) y
 * `solucion` el rectángulo de cada pista, en el mismo orden. Un rectángulo es `{ f1, c1, f2, c2 }`, de la
 * esquina de arriba a la izquierda a la de abajo a la derecha.
 */

/**
 * Las etapas (pedido del dueño): dos para calentar los dedos y tres difíciles, cada una más grande.
 * Las difíciles traen lotes más grandes, menos lotes que se ven de entrada y más pasos de deducción.
 */
export const ETAPAS = [
  { lado: 5, dificil: false }, { lado: 6, dificil: false },
  { lado: 7, dificil: true }, { lado: 7, dificil: true }, { lado: 8, dificil: true },
];
/** El puntaje: cada tablero resuelto vale 12; la rapidez, hasta 40 (solo con los cinco); la ayuda resta 10. */
export const PUNTOS_ETAPA = 12, BONO_RAPIDEZ = 40, RESTA_AYUDA = 10;
/** La rapidez: 40 en RAPIDO_S o menos, 0 en LENTO_S o más, en línea recta entre medio. */
export const RAPIDO_S = 5 * 60, LENTO_S = 15 * 60;
export const MAXIMO = PUNTOS_ETAPA * ETAPAS.length + BONO_RAPIDEZ;

function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

export const area = r => (r.f2 - r.f1 + 1) * (r.c2 - r.c1 + 1);
export const alto = r => r.f2 - r.f1 + 1;
export const ancho = r => r.c2 - r.c1 + 1;
export const contiene = (r, f, c) => f >= r.f1 && f <= r.f2 && c >= r.c1 && c <= r.c2;
export const iguales = (a, b) => a.f1 === b.f1 && a.c1 === b.c1 && a.f2 === b.f2 && a.c2 === b.c2;
export const seTocan = (a, b) => a.f1 <= b.f2 && b.f1 <= a.f2 && a.c1 <= b.c2 && b.c1 <= a.c2;
/** Las casillas (índices) de un rectángulo. */
export function casillas(r, lado) {
  const out = [];
  for (let f = r.f1; f <= r.f2; f++) for (let c = r.c1; c <= r.c2; c++) out.push(f * lado + c);
  return out;
}

/** El tope de área de cada tamaño. */
const TOPE = { 5: 8, 6: 9, 7: 10, 8: 12 };
/** Cuánto gusta cada área al partir: en los fáciles las medianas (3 a 8), el 2 menos y el 1 casi nada;
 *  en los difíciles, lotes más grandes (4 a 10) y casi ningún 1 ni 2. */
const GUSTO = (a, dificil) => (dificil
  ? (a === 1 ? 0.01 : a === 2 ? 0.12 : a === 3 ? 0.4 : a <= 10 ? 1 : 0.7)
  : (a === 1 ? 0.04 : a === 2 ? 0.45 : a === 3 ? 0.8 : a <= 6 ? 1 : a <= 8 ? 0.95 : 0.6));

/**
 * Parte la grilla en rectángulos al azar: toma la primera casilla libre (en el orden de lectura) y le
 * pone un rectángulo que parte en ella, elegido según el gusto por su área. Devuelve los rectángulos.
 */
function partir(r, lado, dificil = false) {
  const libre = new Uint8Array(lado * lado).fill(1);
  const rects = [];
  const tope = TOPE[lado] || 10;
  for (let i = 0; i < lado * lado; i++) {
    if (!libre[i]) continue;
    const f = Math.floor(i / lado), c = i % lado;
    // Los rectángulos que parten en (f, c) y solo pisan casillas libres
    const opciones = [];
    let anchoMax = lado - c;
    for (let h = 1; f + h - 1 < lado; h++) {
      let w = 0;
      while (w < anchoMax && libre[(f + h - 1) * lado + c + w]) w++;
      anchoMax = w;
      if (!anchoMax) break;
      for (let ww = 1; ww <= anchoMax; ww++) if (h * ww <= tope) opciones.push({ f1: f, c1: c, f2: f + h - 1, c2: c + ww - 1 });
    }
    const total = opciones.reduce((a, o) => a + GUSTO(area(o), dificil), 0);
    let x = r() * total, elegido = opciones[0];
    for (const o of opciones) { x -= GUSTO(area(o), dificil); if (x <= 0) { elegido = o; break; } }
    for (const k of casillas(elegido, lado)) libre[k] = 0;
    rects.push(elegido);
  }
  return rects;
}

/** Los rectángulos posibles de cada pista: de su área, que la contienen y no pisan otro número. */
export function candidatos(t) {
  const { lado, numeros } = t;
  return t.pistas.map(({ i, n }) => {
    const f = Math.floor(i / lado), c = i % lado, out = [];
    for (let h = 1; h <= n; h++) {
      if (n % h) continue;
      const w = n / h;
      if (h > lado || w > lado) continue;
      for (let f1 = Math.max(0, f - h + 1); f1 <= Math.min(f, lado - h); f1++) {
        for (let c1 = Math.max(0, c - w + 1); c1 <= Math.min(c, lado - w); c1++) {
          const r = { f1, c1, f2: f1 + h - 1, c2: c1 + w - 1 };
          if (casillas(r, lado).every(k => k === i || !numeros[k])) out.push(r);
        }
      }
    }
    return out;
  });
}

/**
 * Cuántas soluciones tiene un tablero, hasta `limite`: backtracking por pista, siempre la que tiene menos
 * rectángulos que todavía caben, y con una poda: cada casilla libre tiene que poder cubrirse.
 * Devuelve `{ n, solucion }` (la primera que encontró, un rectángulo por pista).
 */
export function resolver(t, limite = 2) {
  const { lado } = t;
  const cand = candidatos(t).map(lista => lista.map(r => ({ r, k: casillas(r, lado) })));
  const ocupada = new Uint8Array(lado * lado);
  const puesta = new Array(cand.length).fill(null);
  // Qué pistas pueden cubrir cada casilla
  const cubren = Array.from({ length: lado * lado }, () => []);
  cand.forEach((lista, p) => lista.forEach(x => x.k.forEach(k => { if (!cubren[k].includes(p)) cubren[k].push(p); })));
  let n = 0, primera = null;
  const cabe = x => x.k.every(k => !ocupada[k]);
  const paso = () => {
    // La pista que tiene menos opciones
    let mejor = -1, opciones = null;
    for (let p = 0; p < cand.length; p++) {
      if (puesta[p]) continue;
      const o = cand[p].filter(cabe);
      if (!o.length) return;
      if (!opciones || o.length < opciones.length) { mejor = p; opciones = o; if (o.length === 1) break; }
    }
    if (mejor < 0) { n++; if (!primera) primera = puesta.map(x => x.r); return; }
    for (const x of opciones) {
      x.k.forEach(k => { ocupada[k] = 1; });
      puesta[mejor] = x;
      // Poda: cada casilla libre la tiene que poder cubrir alguna pista sin poner
      let vivo = true;
      for (let k = 0; k < ocupada.length && vivo; k++) {
        if (ocupada[k]) continue;
        vivo = cubren[k].some(p => !puesta[p] && cand[p].some(y => y.k.includes(k) && cabe(y)));
      }
      if (vivo) paso();
      puesta[mejor] = null;
      x.k.forEach(k => { ocupada[k] = 0; });
      if (n >= limite) return;
    }
  };
  paso();
  return { n, solucion: primera };
}

/** Arma el tablero de unos rectángulos con el número en una casilla de cada uno. */
function armar(lado, rects, lugares) {
  const numeros = new Array(lado * lado).fill(0);
  const pares = rects.map((r, k) => ({ i: lugares[k], n: area(r), r }));
  pares.sort((a, b) => a.i - b.i);
  for (const { i, n } of pares) numeros[i] = n;
  return { lado, numeros, pistas: pares.map(({ i, n }) => ({ i, n })), solucion: pares.map(({ r }) => r) };
}

/**
 * Deduce el tablero como lo haría alguien, sin adivinar: en cada ronda, (1) la pista a la que le queda un
 * solo rectángulo que cabe se pone, y (2) una casilla libre que solo una pista puede cubrir obliga a esa
 * pista a cubrirla. Devuelve `{ resuelto, rondas, deEntrada }`: si llega al final, cuántas rondas le
 * tomó y cuántos lotes se veían de entrada (los de un solo rectángulo posible). Mide la dificultad.
 */
export function deducir(t) {
  const { lado } = t;
  let cand = candidatos(t).map(lista => lista.map(r => ({ r, k: casillas(r, lado) })));
  const ocupada = new Uint8Array(lado * lado);
  const puesta = new Array(cand.length).fill(false);
  const deEntrada = cand.filter(l => l.length === 1).length;
  let rondas = 0;
  for (let cambio = true; cambio;) {
    cambio = false; rondas++;
    cand = cand.map((l, p) => (puesta[p] ? l : l.filter(x => x.k.every(k => !ocupada[k]))));
    for (let p = 0; p < cand.length; p++) {
      if (puesta[p] || cand[p].length !== 1) continue;
      cand[p][0].k.forEach(k => { ocupada[k] = 1; });
      puesta[p] = true; cambio = true;
    }
    if (cambio) continue;
    for (let k = 0; k < lado * lado && !cambio; k++) {
      if (ocupada[k]) continue;
      const pueden = [];
      cand.forEach((l, p) => { if (!puesta[p] && l.some(x => x.k.includes(k))) pueden.push(p); });
      if (pueden.length === 1) {
        const p = pueden[0], antes = cand[p].length;
        cand[p] = cand[p].filter(x => x.k.includes(k));
        if (cand[p].length < antes) cambio = true;
      }
    }
  }
  return { resuelto: puesta.every(Boolean), rondas, deEntrada };
}

/**
 * Dónde va el número de cada lote: repartidos por la grilla (pedido del dueño), cada uno en la casilla
 * de su lote más lejos de los ya puestos, y en los difíciles, lejos de las esquinas del lote (un número en
 * la esquina deja menos rectángulos posibles). Un poco de azar entre las mejores, para variar.
 */
function repartir(r, lado, rects, dificil) {
  // Barajar a mano (Fisher-Yates): un sort con comparador al azar da distinto en cada navegador
  const orden = rects.map((x, k) => k);
  for (let k = orden.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [orden[k], orden[j]] = [orden[j], orden[k]]; }
  const lugares = new Array(rects.length);
  const puestos = [];
  const fc = i => [Math.floor(i / lado), i % lado];
  for (const k of orden) {
    const x = rects[k];
    const op = casillas(x, lado).map(i => {
      const [f, c] = fc(i);
      const lejos = puestos.length ? Math.min(...puestos.map(j => { const [g, d] = fc(j); return Math.sqrt((f - g) ** 2 + (c - d) ** 2); })) : 3;
      const vecino = puestos.some(j => { const [g, d] = fc(j); return Math.abs(f - g) + Math.abs(c - d) === 1; });
      const adentro = Math.min(f - x.f1, x.f2 - f) + Math.min(c - x.c1, x.c2 - c);
      return { i, v: Math.min(lejos, 3) - (vecino ? 1.5 : 0) + (dificil ? 0.4 * adentro : 0) + r() * 0.6 };
    }).sort((a, b) => b.v - a.v);
    lugares[k] = op[0].i;
    puestos.push(op[0].i);
  }
  return lugares;
}

/** Qué tan difícil es un tablero que se deduce entero: más rondas y menos lotes a la vista, más difícil. */
const dificultad = d => d.rondas - 1.5 * d.deEntrada;

/**
 * El tablero de una semilla, con solución única y que se deduce sin adivinar: parte la grilla al azar,
 * reparte los números (`repartir`) y revisa con `resolver` que no haya otra solución. Los fáciles se
 * quedan con el primero que sirve; los difíciles arman varios y se quedan con el más difícil
 * (`deducir`). Determinista con la semilla.
 */
export function generar(semilla, { lado = 7, dificil = false } = {}) {
  const r = azar(String(semilla));
  const quiero = dificil ? 8 : 1;
  let mejor = null, mejorD = -Infinity, hallados = 0;
  for (let intento = 0; intento < 600 && hallados < quiero; intento++) {
    const rects = partir(r, lado, dificil);
    const unos = rects.filter(x => area(x) === 1).length;
    if (unos > (dificil ? 0 : lado >= 7 ? 2 : 1)) continue;
    if (lado >= 7 && rects.filter(x => area(x) >= 6).length < (dificil ? 3 : 2)) continue;
    if (lado < 7 && rects.filter(x => area(x) >= 4).length < 2) continue;
    for (let vez = 0; vez < 6; vez++) {
      const t = armar(lado, rects, repartir(r, lado, rects, dificil));
      if (resolver(t, 2).n !== 1) continue;
      const d = deducir(t);
      if (!d.resuelto) continue;
      hallados++;
      if (dificultad(d) > mejorD) { mejor = t; mejorD = dificultad(d); }
      break;
    }
  }
  if (!mejor) throw new Error('no se pudo armar el tablero');
  return { semilla: String(semilla), ...mejor };
}

/** El tablero de una etapa (0 a 4) de una partida: la semilla de la partida, con su número. */
export const generarEtapa = (semilla, n) => generar(`${semilla}:etapa-${n + 1}`, ETAPAS[n]);

/** Los números que hay dentro de un rectángulo: `[{ i, n }]`. */
export const numerosEn = (t, r) => casillas(r, t.lado).filter(k => t.numeros[k]).map(k => ({ i: k, n: t.numeros[k] }));

/**
 * ¿Vale un rectángulo dibujado? `{ ok: true, n }`, o `{ ok: false, motivo }`: 'sin-numero', 'dos-numeros'
 * (con cuántos tiene, `cuantos`) o 'area' (con el número `n` y el área que tiene, `area`).
 */
export function validar(t, r) {
  if (t.modo === 'servicios') return validarServicios(t, r);
  const nums = numerosEn(t, r);
  if (!nums.length) return { ok: false, motivo: 'sin-numero' };
  if (nums.length > 1) return { ok: false, motivo: 'dos-numeros', cuantos: nums.length };
  const { n, i } = nums[0];
  if (area(r) !== n) return { ok: false, motivo: 'area', n, area: area(r) };
  return { ok: true, n, i };
}

/**
 * Pone un rectángulo válido en la lista de parcelas: saca las que pisa. Devuelve la lista nueva (no
 * cambia la de entrada).
 */
export const poner = (parcelas, r) => [...parcelas.filter(p => !seTocan(p, r)), r];

/** ¿Está resuelto? Todas las parcelas valen (en su modo), no se pisan y suman la grilla: la cubren entera. */
export function resuelto(t, parcelas) {
  if (parcelas.reduce((a, p) => a + area(p), 0) !== t.lado * t.lado) return false;
  if (!parcelas.every(p => validar(t, p).ok)) return false;
  for (let a = 0; a < parcelas.length; a++) for (let b = a + 1; b < parcelas.length; b++) if (seTocan(parcelas[a], parcelas[b])) return false;
  return true;
}

/** La ayuda: el rectángulo de la solución de la primera pista que no está bien puesta (o null). */
export function pista(t, parcelas) {
  return t.solucion.find(s => !parcelas.some(p => iguales(p, s))) || null;
}

/**
 * The score, out of 100: 12 per solved board and, only with all five, up to 40 for speed (40 in 5
 * minutes or less, 0 at 15 or more). Each hint takes 10; never below 0. With `total` boards (the trial
 * session has 2, D-103) the same 60 and 40 are shared among them and the speed limits shrink in proportion.
 */
export function puntajePartida(hechas, segundos, ayudas = 0, total = ETAPAS.length) {
  const completa = hechas >= total;
  const porTablero = (PUNTOS_ETAPA * ETAPAS.length) / total, escala = total / ETAPAS.length;
  const base = Math.round(porTablero * Math.min(hechas, total));
  const rapido = RAPIDO_S * escala, lento = LENTO_S * escala;
  const rapidez = completa ? Math.max(0, Math.min(1, (lento - segundos) / (lento - rapido))) : 0;
  const ptsRapidez = Math.round(BONO_RAPIDEZ * rapidez);
  const resta = RESTA_AYUDA * ayudas;
  return { total: Math.max(0, base + ptsRapidez - resta), base, ptsRapidez, resta, completa };
}

/**
 * The card to share: ✅ or ⬛ per board, with its size, without giving the solution away, and the hints.
 * The variant's name already goes with the game's name in the shared message (D-331), so it is not here.
 */
export function tarjeta(hechas, ayudas = 0, etapas = ETAPAS) {
  const filas = etapas.map((e, k) => `${k < hechas ? '✅' : '⬛'} ${e.lado}×${e.lado}`).join('  ');
  return [filas, ayudas ? `💡 ${ayudas}` : null].filter(Boolean).join('\n');
}

/* ------------------------------------------------------------------ */
/* El modo «Servicios» (D-311)                                         */
/* ------------------------------------------------------------------ */

/**
 * En vez de números, la grilla trae íconos de servicios: ⚡ luz y 💧 agua (y 🌐 internet, si la etapa lo
 * pide). Hay que dividirla entera en lotes rectangulares **todos del mismo tamaño** (`tam`, que se dice
 * arriba del tablero) y cada lote lleva **exactamente uno de cada servicio**. Sin el tamaño fijo casi
 * ningún tablero tiene solución única; con él, sí (lo que se midió está en la decisión).
 *
 * Un tablero de este modo es `{ modo: 'servicios', lado, tam, servicios, iconos, solucion }`: `iconos`
 * tiene una casilla por lugar (por filas), con null o el servicio ('luz', 'agua', 'red'), y `solucion`
 * los lotes, en el orden de lectura de su esquina de arriba a la izquierda.
 */
export const ICONOS = { luz: '⚡', agua: '💧', red: '🌐' };

/**
 * Las etapas del modo: dos para calentar (6×6 de 3 y 6×6 de 4) y tres difíciles (6×6 de 6 y dos 8×8 de
 * 8), con lotes más grandes, ninguno a la vista de entrada y deducciones más profundas. Elegidas
 * midiendo (D-311). Sin 🌐: un tercer servicio da más tableros únicos, pero más fáciles.
 */
export const ETAPAS_SERVICIOS = [
  { lado: 6, tam: 3, servicios: ['luz', 'agua'], dificil: false },
  { lado: 6, tam: 4, servicios: ['luz', 'agua'], dificil: false },
  // Las difíciles (pedido del dueño): ningún lote a la vista de entrada y al menos `exige` deducciones
  // que no son las simples (la regla 2 de `propagar` o mirar un paso adelante). El 8×8 de 4 salió: con
  // lotes tan chicos siempre deja lotes a la vista
  { lado: 6, tam: 6, servicios: ['luz', 'agua'], dificil: true, exige: 3 },
  { lado: 8, tam: 8, servicios: ['luz', 'agua'], dificil: true, exige: 4 },
  { lado: 8, tam: 8, servicios: ['luz', 'agua'], dificil: true, exige: 6 },
];

/** Las formas de un lote de `tam` casillas que caben en la grilla: `[alto, ancho]`. */
const formas = (tam, lado) => {
  const out = [];
  for (let h = 1; h <= tam; h++) if (!(tam % h) && h <= lado && tam / h <= lado) out.push([h, tam / h]);
  return out;
};

/** Baraja una lista en su lugar (Fisher-Yates): un sort con comparador al azar da distinto en cada navegador. */
function barajar(r, lista) {
  for (let k = lista.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [lista[k], lista[j]] = [lista[j], lista[k]]; }
  return lista;
}

/**
 * Parte la grilla en lotes de `tam` casillas, al azar: la primera casilla libre (en el orden de lectura)
 * es la esquina de arriba a la izquierda de su lote, con una forma al azar entre las que caben; si
 * ninguna cabe, vuelve atrás. Devuelve los lotes, o null si no se puede (no pasa con las etapas).
 */
function partirIguales(r, lado, tam) {
  const libre = new Uint8Array(lado * lado).fill(1);
  const fs = formas(tam, lado), rects = [];
  let pasos = 0;
  const cabe = (f, c, h, w) => {
    if (f + h > lado || c + w > lado) return false;
    for (let y = f; y < f + h; y++) for (let x = c; x < c + w; x++) if (!libre[y * lado + x]) return false;
    return true;
  };
  const marcar = (x, v) => { for (const k of casillas(x, lado)) libre[k] = v; };
  const paso = desde => {
    let i = desde;
    while (i < lado * lado && !libre[i]) i++;
    if (i === lado * lado) return true;
    if (++pasos > 5000) return false;
    const f = Math.floor(i / lado), c = i % lado;
    for (const [h, w] of barajar(r, fs.slice())) {
      if (!cabe(f, c, h, w)) continue;
      const x = { f1: f, c1: c, f2: f + h - 1, c2: c + w - 1 };
      marcar(x, 0); rects.push(x);
      if (paso(i + 1)) return true;
      marcar(x, 1); rects.pop();
    }
    return false;
  };
  return paso(0) ? rects : null;
}

/** Cuántos íconos de cada servicio hay en un rectángulo: `{ luz: 1, agua: 0, … }`. */
export function serviciosEn(t, r) {
  const cuenta = Object.fromEntries(t.servicios.map(s => [s, 0]));
  for (const k of casillas(r, t.lado)) if (t.iconos[k]) cuenta[t.iconos[k]]++;
  return cuenta;
}

/**
 * Todos los lotes posibles de un tablero de servicios: del tamaño justo y con uno de cada servicio.
 * Cuenta los íconos de cada rectángulo con sumas acumuladas (es lo que más se repite al generar).
 */
export function lotesPosibles(t) {
  const { lado, tam } = t, out = [], L = lado + 1;
  const sumas = t.servicios.map(s => {
    const a = new Int16Array(L * L);
    for (let f = 0; f < lado; f++) for (let c = 0; c < lado; c++) {
      a[(f + 1) * L + c + 1] = (t.iconos[f * lado + c] === s ? 1 : 0) + a[f * L + c + 1] + a[(f + 1) * L + c] - a[f * L + c];
    }
    return a;
  });
  const cuenta = (a, f1, c1, f2, c2) => a[(f2 + 1) * L + c2 + 1] - a[f1 * L + c2 + 1] - a[(f2 + 1) * L + c1] + a[f1 * L + c1];
  for (const [h, w] of formas(tam, lado)) {
    for (let f1 = 0; f1 + h <= lado; f1++) for (let c1 = 0; c1 + w <= lado; c1++) {
      const f2 = f1 + h - 1, c2 = c1 + w - 1;
      if (sumas.every(a => cuenta(a, f1, c1, f2, c2) === 1)) {
        const r = { f1, c1, f2, c2 };
        out.push({ r, k: casillas(r, lado) });
      }
    }
  }
  return out;
}

/**
 * Cuántas soluciones tiene un tablero de servicios, hasta `limite`: cubrir la grilla con lotes posibles
 * sin que se pisen, siempre por la casilla libre que menos lotes pueden cubrir. `{ n, solucion }`.
 */
export function resolverServicios(t, limite = 2) {
  const N = t.lado * t.lado;
  const lotes = lotesPosibles(t);
  const cubren = Array.from({ length: N }, () => []);
  lotes.forEach((x, j) => x.k.forEach(k => cubren[k].push(j)));
  const ocupada = new Uint8Array(N);
  const puestos = [];
  let n = 0, primera = null;
  const cabe = j => lotes[j].k.every(k => !ocupada[k]);
  const paso = () => {
    let mejor = -1, opciones = null;
    for (let k = 0; k < N; k++) {
      if (ocupada[k]) continue;
      const o = cubren[k].filter(cabe);
      if (!o.length) return;
      if (!opciones || o.length < opciones.length) { mejor = k; opciones = o; if (o.length === 1) break; }
    }
    if (mejor < 0) { n++; if (!primera) primera = puestos.map(j => lotes[j].r); return; }
    for (const j of opciones) {
      lotes[j].k.forEach(k => { ocupada[k] = 1; }); puestos.push(j);
      paso();
      puestos.pop(); lotes[j].k.forEach(k => { ocupada[k] = 0; });
      if (n >= limite) return;
    }
  };
  paso();
  return { n, solucion: primera };
}

/**
 * Las reglas simples, hasta que no avanzan: (1) un ícono o una casilla libre que solo cabe en un lote
 * posible fija ese lote; si ninguno, (2) una casilla libre cuyos lotes posibles llevan todos el mismo ⚡
 * (o el mismo 💧…) obliga al lote de ese ícono a cubrirla. Cambia `estado` ({ vivos, ocupada }) y
 * devuelve `{ rondas, deEntrada, intermedias, choque }`: `intermedias` cuenta las veces que hizo falta la
 * regla (2), y `choque` si una casilla se quedó sin lote posible.
 */
function propagar(t, estado) {
  const N = t.lado * t.lado, { ocupada } = estado;
  let rondas = 0, deEntrada = -1, intermedias = 0;
  const cubrenA = k => estado.vivos.filter(x => x.k.includes(k));
  for (let cambio = true; cambio;) {
    cambio = false; rondas++;
    estado.vivos = estado.vivos.filter(x => x.k.every(k => !ocupada[k]));
    const fijos = new Set();
    for (let k = 0; k < N; k++) {
      if (ocupada[k]) continue;
      const c = cubrenA(k);
      if (!c.length) return { rondas, deEntrada: Math.max(0, deEntrada), intermedias, choque: true };
      if (c.length === 1) fijos.add(c[0]);
    }
    if (deEntrada < 0) deEntrada = fijos.size;
    for (const x of fijos) {
      if (x.k.some(k => ocupada[k])) return { rondas, deEntrada, intermedias, choque: true };
      x.k.forEach(k => { ocupada[k] = 1; });
      cambio = true;
    }
    if (cambio) continue;
    for (let k = 0; k < N && !cambio; k++) {
      if (ocupada[k]) continue;
      const c = cubrenA(k);
      for (let s = 0; s < t.servicios.length && !cambio; s++) {
        const icono = c[0].de[s];
        if (!c.every(x => x.de[s] === icono)) continue;
        const antes = estado.vivos.length;
        estado.vivos = estado.vivos.filter(x => x.de[s] !== icono || x.k.includes(k));
        if (estado.vivos.length < antes) { cambio = true; intermedias++; }
      }
    }
  }
  return { rondas, deEntrada: Math.max(0, deEntrada), intermedias, choque: false };
}

/**
 * Deduce un tablero de servicios como lo haría alguien, sin adivinar. Con `avanzado: false`, solo las
 * reglas simples (`propagar`). Con `avanzado: true` (los difíciles, D-312), cuando las simples se
 * traban, mira un paso adelante: si poner un lote posible y seguir con las reglas simples deja una
 * casilla sin lote, ese lote no va. Devuelve `{ resuelto, rondas, deEntrada, avanzadas, intermedias }`:
 * `avanzadas` cuenta los lotes descartados mirando adelante, e `intermedias` las veces que hizo falta la
 * regla (2) de `propagar`: las dos hacen difícil un tablero.
 */
export function deducirServicios(t, { avanzado = true } = {}) {
  const N = t.lado * t.lado;
  const estado = {
    vivos: lotesPosibles(t).map(x => ({ ...x, de: t.servicios.map(s => x.k.find(k => t.iconos[k] === s)) })),
    ocupada: new Uint8Array(N),
  };
  let rondas = 0, deEntrada = -1, avanzadas = 0, intermedias = 0;
  for (;;) {
    const p = propagar(t, estado);
    rondas += p.rondas; intermedias += p.intermedias;
    if (deEntrada < 0) deEntrada = p.deEntrada;
    if (p.choque) return { resuelto: false, rondas, deEntrada, avanzadas, intermedias };
    if (estado.ocupada.every(Boolean)) return { resuelto: true, rondas, deEntrada, avanzadas, intermedias };
    if (!avanzado) return { resuelto: false, rondas, deEntrada, avanzadas, intermedias };
    // Un paso adelante: descarta los lotes que llevan a un choque
    let descarte = null;
    for (const x of estado.vivos) {
      const prueba = { vivos: estado.vivos.slice(), ocupada: estado.ocupada.slice() };
      x.k.forEach(k => { prueba.ocupada[k] = 1; });
      if (propagar(t, prueba).choque) { descarte = x; break; }
    }
    if (!descarte) return { resuelto: false, rondas, deEntrada, avanzadas, intermedias };
    estado.vivos = estado.vivos.filter(x => x !== descarte);
    avanzadas++; rondas++;
  }
}

/**
 * Dónde van los íconos de un lote. En los fáciles, en casillas al azar. En los difíciles (D-312), de
 * preferencia en el borde del lote que toca a otro lote: así cada ícono queda cerca de los del vecino y
 * hay varios emparejamientos que parecen posibles.
 */
function ubicarIconos(r, x, lado, dificil, n) {
  const ks = barajar(r, casillas(x, lado));
  if (!dificil) return ks.slice(0, n);
  const peso = k => {
    const f = Math.floor(k / lado), c = k % lado;
    let p = 1;
    if (f === x.f1 && f > 0) p += 2; if (f === x.f2 && f < lado - 1) p += 2;
    if (c === x.c1 && c > 0) p += 2; if (c === x.c2 && c < lado - 1) p += 2;
    return p;
  };
  const out = [], resto = ks.slice();
  while (out.length < n) {
    const total = resto.reduce((a, k) => a + peso(k), 0);
    let v = r() * total, j = 0;
    for (; j < resto.length - 1; j++) { v -= peso(resto[j]); if (v <= 0) break; }
    out.push(resto.splice(j, 1)[0]);
  }
  return out;
}

/** Qué tan difícil es un tablero de servicios: lo que se descarta mirando adelante pesa más que las rondas. */
const dificultadServicios = d => 5 * d.avanzadas + 2 * d.intermedias + d.rondas - 4 * d.deEntrada;

/**
 * El tablero de servicios de una semilla: parte la grilla en lotes de `tam` (`partirIguales`), pone en
 * cada uno un ícono de cada servicio (`ubicarIconos`), y se queda con uno de solución única
 * (`resolverServicios`) que se deduzca sin adivinar (`deducirServicios`). Los fáciles: el primero que
 * sale con las reglas simples. Los difíciles (pedido del dueño, D-312): ninguno a la vista de entrada,
 * que las reglas simples no alcancen y haya que mirar un paso adelante; de muchos, el más difícil.
 * Determinista con la semilla.
 */
export function generarServicios(semilla, { lado = 6, tam = 4, servicios = ['luz', 'agua'], dificil = false, exige = 3 } = {}) {
  if ((lado * lado) % tam || tam < servicios.length) throw new Error('tamaño imposible');
  const r = azar(`servicios:${semilla}`);
  const quiero = dificil ? 8 : 1;
  let mejor = null, mejorD = -Infinity, hallados = 0, plan = null;
  for (let intento = 0; intento < (dificil ? 6000 : 3000) && hallados < quiero; intento++) {
    const rects = partirIguales(r, lado, tam);
    if (!rects) continue;
    const iconos = new Array(lado * lado).fill(null);
    for (const x of rects) ubicarIconos(r, x, lado, dificil, servicios.length).forEach((k, j) => { iconos[k] = servicios[j]; });
    const t = { modo: 'servicios', lado, tam, servicios: [...servicios], iconos, solucion: rects };
    if (resolverServicios(t, 2).n !== 1) continue;
    if (!dificil) {
      if (!deducirServicios(t, { avanzado: false }).resuelto) continue;
      mejor = t; hallados++;
      break;
    }
    // Primero las reglas simples, que son baratas; mirar adelante solo si se traban
    const simple = deducirServicios(t, { avanzado: false });
    const d = simple.resuelto ? simple : deducirServicios(t);
    if (!d.resuelto) continue;
    // Los que sí sirven pero se resuelven con las reglas simples o muestran lotes de entrada quedan de reserva
    const bueno = d.deEntrada === 0 && d.avanzadas + d.intermedias >= exige;
    // De reserva, el más difícil; uno sin lotes a la vista siempre gana a uno con
    if (!bueno) { const v = dificultadServicios(d) - 100 * d.deEntrada; if (!plan || v > plan.d) plan = { t, d: v }; continue; }
    hallados++;
    if (dificultadServicios(d) > mejorD) { mejor = t; mejorD = dificultadServicios(d); }
  }
  if (!mejor && plan) mejor = plan.t;
  if (!mejor) throw new Error('no se pudo armar el tablero');
  return { semilla: String(semilla), ...mejor };
}

/**
 * El tablero de una etapa (0 a 4) del modo servicios. Los dos últimos (8×8 de 8) salen con las mismas
 * reglas, y uno de cada cuatro días el cuarto resultaba más difícil que el quinto («El penúltimo me
 * costó más que el último», #401): se arman los dos y el más difícil va al final.
 */
const finales = new Map();
export function generarEtapaServicios(semilla, n) {
  const etapa = k => generarServicios(`${semilla}:etapa-${k + 1}`, ETAPAS_SERVICIOS[k]);
  const k = ETAPAS_SERVICIOS.length - 2;
  if (n < k) return etapa(n);
  if (!finales.has(semilla)) {
    const par = [etapa(k), etapa(k + 1)];
    const cuanto = t => dificultadServicios(deducirServicios(t));
    finales.set(semilla, cuanto(par[0]) > cuanto(par[1]) ? [par[1], par[0]] : par);
  }
  return structuredClone(finales.get(semilla)[n - k]);
}

/**
 * ¿Vale un lote dibujado en el modo servicios? `{ ok: true }`, o `{ ok: false, motivo }`: 'tam' (con el
 * tamaño pedido `tam` y el que tiene, `area`), 'sobra' (con el servicio y `cuantos`) o 'falta' (con el
 * servicio).
 */
export function validarServicios(t, r) {
  if (area(r) !== t.tam) return { ok: false, motivo: 'tam', tam: t.tam, area: area(r) };
  const cuenta = serviciosEn(t, r);
  const sobra = t.servicios.find(s => cuenta[s] > 1);
  if (sobra) return { ok: false, motivo: 'sobra', servicio: sobra, cuantos: cuenta[sobra] };
  const falta = t.servicios.find(s => !cuenta[s]);
  if (falta) return { ok: false, motivo: 'falta', servicio: falta };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* A day of La Copa, or a standalone game (D-331)                       */
/* ------------------------------------------------------------------ */

/** The variants (D-331): 🔢 Numbers, the default, and ⚡💧 Utilities. */
export const VARIANTES = ['numbers', 'utilities'];
/** The boards of a variant: the five, or only the two warm-up ones in the trial session (D-103). */
export const etapasDe = (variante, ensayo = false) => {
  const todas = variante === 'utilities' ? ETAPAS_SERVICIOS : ETAPAS;
  return ensayo ? todas.filter(e => !e.dificil) : todas;
};

/**
 * The game of a cup day (or of a standalone seed, with day 1): the boards of its variant, the same for
 * every player with the same code, day and variant. Building the hard Utilities boards takes about half a
 * second, so the waiting room builds it ahead (`caro` in ui.js) and this keeps what it built.
 * Returns `{ semilla, variante, ensayo, tableros }`; each board carries its `dificil` flag.
 */
const hechos = new Map();
export function generarDia(codigo, dia, { variante = 'numbers', sal = '', ensayo = false } = {}) {
  const v = VARIANTES.includes(variante) ? variante : VARIANTES[0];
  const semilla = `${codigo}:${dia}${sal ? `:${sal}` : ''}`;
  const clave = `${semilla}|${v}|${ensayo ? 1 : 0}`;
  if (!hechos.has(clave)) {
    const etapas = etapasDe(v, ensayo);
    const tableros = etapas.map((e, n) => ({ ...(v === 'utilities' ? generarEtapaServicios(semilla, n) : generarEtapa(semilla, n)), dificil: !!e.dificil }));
    hechos.set(clave, { semilla, variante: v, ensayo: !!ensayo, tableros });
  }
  return structuredClone(hechos.get(clave));
}

/** A move as it is saved: `d:f1,c1,f2,c2` draw, `e:f,c` erase the plot there, `a` hint, `x` clear the board, `u` undo, `r` give up. */
export const jugada = {
  dibujar: r => `d:${r.f1},${r.c1},${r.f2},${r.c2}`,
  borrar: (f, c) => `e:${f},${c}`,
  AYUDA: 'a', LIMPIAR: 'x', DESHACER: 'u', RENDIRSE: 'r',
};

/**
 * The game rebuilt from its moves (so a reloaded cup day resumes where it was). Moves that do nothing
 * (a draw that is not valid, undo with nothing to undo) are skipped. A board that ends covered moves on
 * to the next one. `color(t, parcelas, r)`, if given, colors each new plot. Returns
 * `{ k, t, parcelas, historial, hechas, ayudas, rendido, fin, n, ultima }`: the current board (`k`, `t`),
 * its plots, the earlier states for undo, the boards solved, the hints, whether it ended, and the plots
 * of the last board solved (to show it shining while the next one comes).
 */
export function partida(p, jugadas = [], { color = null } = {}) {
  const tabs = p.tableros, n = tabs.length;
  let k = 0, parcelas = [], historial = [], hechas = 0, ayudas = 0, rendido = false, ultima = null;
  const conColor = (t, r, extra = {}) => ({ ...r, ...extra, ...(color ? { color: color(t, parcelas.filter(q => !iguales(q, r)), r) } : {}) });
  for (const j of jugadas) {
    if (rendido || hechas >= n) break;
    const t = tabs[k];
    const [tipo, datos = ''] = String(j).split(':');
    const x = datos.split(',').map(Number);
    let sig = null;
    if (tipo === 'd') {
      const [f1, c1, f2, c2] = x, r = { f1, c1, f2, c2 };
      if (x.length !== 4 || x.some(v => !Number.isInteger(v) || v < 0 || v >= t.lado) || f1 > f2 || c1 > c2 || !validar(t, r).ok) continue;
      sig = poner(parcelas, conColor(t, r));
    } else if (tipo === 'e') {
      const lote = parcelas.find(q => contiene(q, x[0], x[1]));
      if (!lote) continue;
      sig = parcelas.filter(q => q !== lote);
    } else if (tipo === 'a') {
      const r = pista(t, parcelas);
      if (!r) continue;
      ayudas++;
      sig = poner(parcelas, conColor(t, r, { ayuda: true }));
    } else if (tipo === 'x') {
      if (!parcelas.length) continue;
      sig = [];
    } else if (tipo === 'u') {
      if (historial.length) parcelas = historial.pop();
      continue;
    } else if (tipo === 'r') {
      rendido = true;
      break;
    } else continue;
    historial.push(parcelas);
    parcelas = sig;
    if (resuelto(t, parcelas)) {
      hechas++; ultima = parcelas;
      if (hechas < n) { k++; parcelas = []; historial = []; }
    }
  }
  return { k, t: tabs[k], parcelas, historial, hechas, ayudas, rendido, fin: rendido || hechas >= n, n, ultima };
}
