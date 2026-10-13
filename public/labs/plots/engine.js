/**
 * Loteo — el motor (laboratorio, D-310). Inspirado en Shikaku (Nikoli, 1989):
 * una grilla con algunos números; hay que dividirla entera en rectángulos, cada uno con exactamente un
 * número, y ese número es su área. Cada tablero tiene solución única.
 *
 * Un tablero es `{ lado, numeros, pistas, solucion }`: `numeros` tiene una casilla por lugar (por filas),
 * con 0 o el número; `pistas` son las casillas con número (`{ i, n }`, en el orden de lectura) y
 * `solucion` el rectángulo de cada pista, en el mismo orden. Un rectángulo es `{ f1, c1, f2, c2 }`, de la
 * esquina de arriba a la izquierda a la de abajo a la derecha.
 */

/** Las etapas: tres tableros, cada uno más grande. */
export const ETAPAS = [{ lado: 5 }, { lado: 6 }, { lado: 7 }];
/** El puntaje: cada tablero resuelto vale 20; la rapidez, hasta 40 (solo con los tres); la ayuda resta 10. */
export const PUNTOS_ETAPA = 20, BONO_RAPIDEZ = 40, RESTA_AYUDA = 10;
/** La rapidez: 40 en RAPIDO_S o menos, 0 en LENTO_S o más, en línea recta entre medio. */
export const RAPIDO_S = 90, LENTO_S = 6 * 60;
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

/** El tope de área de cada tamaño: los números caben en una cifra salvo en el 7×7, que llega a 10. */
const TOPE = { 5: 8, 6: 9, 7: 10 };
/** Cuánto gusta cada área al partir: las medianas (3 a 8) mucho, el 2 menos y el 1 casi nada. */
const GUSTO = a => (a === 1 ? 0.04 : a === 2 ? 0.45 : a === 3 ? 0.8 : a <= 6 ? 1 : a <= 8 ? 0.95 : 0.6);

/**
 * Parte la grilla en rectángulos al azar: toma la primera casilla libre (en el orden de lectura) y le
 * pone un rectángulo que parte en ella, elegido según el gusto por su área. Devuelve los rectángulos.
 */
function partir(r, lado) {
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
    const total = opciones.reduce((a, o) => a + GUSTO(area(o)), 0);
    let x = r() * total, elegido = opciones[0];
    for (const o of opciones) { x -= GUSTO(area(o)); if (x <= 0) { elegido = o; break; } }
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
 * El tablero de una semilla, con solución única: parte la grilla al azar, pone cada número en una
 * casilla al azar de su rectángulo y revisa con `resolver` que no haya otra solución; si la hay, prueba
 * otros lugares para los números y, si no resulta, otra partición. Determinista con la semilla.
 */
export function generar(semilla, { lado = 7 } = {}) {
  const r = azar(String(semilla));
  for (let intento = 0; intento < 400; intento++) {
    const rects = partir(r, lado);
    const unos = rects.filter(x => area(x) === 1).length;
    if (unos > (lado >= 7 ? 2 : 1)) continue;
    if (lado >= 7 && rects.filter(x => area(x) >= 6).length < 2) continue;
    if (lado < 7 && rects.filter(x => area(x) >= 4).length < 2) continue;
    for (let vez = 0; vez < 6; vez++) {
      const lugares = rects.map(x => { const k = casillas(x, lado); return k[Math.floor(r() * k.length)]; });
      const t = armar(lado, rects, lugares);
      if (resolver(t, 2).n === 1) return { semilla: String(semilla), ...t };
    }
  }
  throw new Error('no se pudo armar el tablero');
}

/** El tablero de una etapa (0 a 2) de una partida: la semilla de la partida, con su número. */
export const generarEtapa = (semilla, n) => generar(`${semilla}:etapa-${n + 1}`, ETAPAS[n]);

/** Los números que hay dentro de un rectángulo: `[{ i, n }]`. */
export const numerosEn = (t, r) => casillas(r, t.lado).filter(k => t.numeros[k]).map(k => ({ i: k, n: t.numeros[k] }));

/**
 * ¿Vale un rectángulo dibujado? `{ ok: true, n }`, o `{ ok: false, motivo }`: 'sin-numero', 'dos-numeros'
 * (con cuántos tiene, `cuantos`) o 'area' (con el número `n` y el área que tiene, `area`).
 */
export function validar(t, r) {
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

/** ¿Está resuelto? Todas las parcelas valen, no se pisan y son tantas como números: cubren todo. */
export function resuelto(t, parcelas) {
  if (parcelas.length !== t.pistas.length) return false;
  if (!parcelas.every(p => validar(t, p).ok)) return false;
  for (let a = 0; a < parcelas.length; a++) for (let b = a + 1; b < parcelas.length; b++) if (seTocan(parcelas[a], parcelas[b])) return false;
  return true;
}

/** La ayuda: el rectángulo de la solución de la primera pista que no está bien puesta (o null). */
export function pista(t, parcelas) {
  return t.solucion.find(s => !parcelas.some(p => iguales(p, s))) || null;
}

/**
 * El puntaje, sobre 100: 20 por tablero resuelto y, solo si se resuelven los tres, hasta 40 por rapidez
 * (40 en 90 s o menos, 0 en 6 minutos o más). Cada ayuda resta 10; nunca bajo 0.
 */
export function puntajePartida(hechas, segundos, ayudas = 0) {
  const completa = hechas >= ETAPAS.length;
  const base = PUNTOS_ETAPA * Math.min(hechas, ETAPAS.length);
  const rapidez = completa ? Math.max(0, Math.min(1, (LENTO_S - segundos) / (LENTO_S - RAPIDO_S))) : 0;
  const ptsRapidez = Math.round(BONO_RAPIDEZ * rapidez);
  const resta = RESTA_AYUDA * ayudas;
  return { total: Math.max(0, base + ptsRapidez - resta), base, ptsRapidez, resta, completa };
}

/** La tarjeta para compartir: ✅ o ⬛ por tablero, con su tamaño, sin delatar la solución. */
export function tarjeta(hechas, ayudas = 0) {
  const filas = ETAPAS.map((e, k) => `${k < hechas ? '✅' : '⬛'} ${e.lado}×${e.lado}`).join('  ');
  return [filas, ayudas ? `💡 ${ayudas}` : null].filter(Boolean).join('\n');
}
