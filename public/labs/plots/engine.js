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
 * El puntaje, sobre 100: 12 por tablero resuelto y, solo si se resuelven los cinco, hasta 40 por rapidez
 * (40 en 5 minutos o menos, 0 en 15 o más). Cada ayuda resta 10; nunca bajo 0.
 */
export function puntajePartida(hechas, segundos, ayudas = 0) {
  const completa = hechas >= ETAPAS.length;
  const base = PUNTOS_ETAPA * Math.min(hechas, ETAPAS.length);
  const rapidez = completa ? Math.max(0, Math.min(1, (LENTO_S - segundos) / (LENTO_S - RAPIDO_S))) : 0;
  const ptsRapidez = Math.round(BONO_RAPIDEZ * rapidez);
  const resta = RESTA_AYUDA * ayudas;
  return { total: Math.max(0, base + ptsRapidez - resta), base, ptsRapidez, resta, completa };
}

/**
 * La tarjeta para compartir: ✅ o ⬛ por tablero, con su tamaño, sin delatar la solución. En el modo
 * servicios dice el modo arriba.
 */
export function tarjeta(hechas, ayudas = 0, modo = 'numeros') {
  const servicios = modo === 'servicios';
  const filas = (servicios ? ETAPAS_SERVICIOS : ETAPAS).map((e, k) => `${k < hechas ? '✅' : '⬛'} ${e.lado}×${e.lado}`).join('  ');
  return [servicios ? `${ICONOS.luz}${ICONOS.agua} Servicios` : null, filas, ayudas ? `💡 ${ayudas}` : null].filter(Boolean).join('\n');
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
 * Las etapas del modo: dos para calentar (6×6 de 3 y 6×6 de 4) y tres difíciles (6×6 de 6, 8×8 de 4 y
 * 8×8 de 8), con lotes más grandes, menos a la vista de entrada y más pasos de deducción. Elegidas
 * midiendo (D-311). Sin 🌐: un tercer servicio da más tableros únicos, pero más fáciles.
 */
export const ETAPAS_SERVICIOS = [
  { lado: 6, tam: 3, servicios: ['luz', 'agua'], dificil: false },
  { lado: 6, tam: 4, servicios: ['luz', 'agua'], dificil: false },
  { lado: 6, tam: 6, servicios: ['luz', 'agua'], dificil: true },
  { lado: 8, tam: 4, servicios: ['luz', 'agua'], dificil: true },
  { lado: 8, tam: 8, servicios: ['luz', 'agua'], dificil: true },
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

/** Todos los lotes posibles de un tablero de servicios: del tamaño justo y con uno de cada servicio. */
export function lotesPosibles(t) {
  const { lado, tam } = t, out = [];
  for (const [h, w] of formas(tam, lado)) {
    for (let f1 = 0; f1 + h <= lado; f1++) for (let c1 = 0; c1 + w <= lado; c1++) {
      const r = { f1, c1, f2: f1 + h - 1, c2: c1 + w - 1 };
      const cuenta = serviciosEn(t, r);
      if (t.servicios.every(s => cuenta[s] === 1)) out.push({ r, k: casillas(r, lado) });
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
 * Deduce un tablero de servicios como lo haría alguien, sin adivinar. En cada ronda: (1) un ícono o una
 * casilla libre que solo cabe en un lote posible fija ese lote; si ninguno, (2) una casilla libre cuyos
 * lotes posibles llevan todos el mismo ⚡ (o el mismo 💧…) obliga al lote de ese ícono a cubrirla: se
 * descartan sus otros lotes. Devuelve `{ resuelto, rondas, deEntrada }`, como `deducir`.
 */
export function deducirServicios(t) {
  const N = t.lado * t.lado;
  // Cada lote posible, con el ícono de cada servicio que lleva
  let vivos = lotesPosibles(t).map(x => ({ ...x, de: t.servicios.map(s => x.k.find(k => t.iconos[k] === s)) }));
  const ocupada = new Uint8Array(N);
  let rondas = 0, deEntrada = -1;
  const cubrenA = k => vivos.filter(x => x.k.includes(k));
  for (let cambio = true; cambio;) {
    cambio = false; rondas++;
    vivos = vivos.filter(x => x.k.every(k => !ocupada[k]));
    // (1) Lo que solo cabe en un lote: lo fija
    const fijos = new Set();
    for (let k = 0; k < N; k++) {
      if (ocupada[k]) continue;
      const c = cubrenA(k);
      if (!c.length) return { resuelto: false, rondas, deEntrada: Math.max(0, deEntrada) };
      if (c.length === 1) fijos.add(c[0]);
    }
    if (deEntrada < 0) deEntrada = fijos.size;
    for (const x of fijos) {
      if (x.k.some(k => ocupada[k])) continue;
      x.k.forEach(k => { ocupada[k] = 1; });
      cambio = true;
    }
    if (cambio) continue;
    // (2) Una casilla que solo alcanza el lote de un ícono: ese lote la cubre
    for (let k = 0; k < N && !cambio; k++) {
      if (ocupada[k]) continue;
      const c = cubrenA(k);
      for (let s = 0; s < t.servicios.length && !cambio; s++) {
        const icono = c[0].de[s];
        if (!c.every(x => x.de[s] === icono)) continue;
        const antes = vivos.length;
        vivos = vivos.filter(x => x.de[s] !== icono || x.k.includes(k));
        if (vivos.length < antes) cambio = true;
      }
    }
  }
  let todo = true;
  for (let k = 0; k < N; k++) if (!ocupada[k]) todo = false;
  return { resuelto: todo, rondas, deEntrada: Math.max(0, deEntrada) };
}

/**
 * El tablero de servicios de una semilla: parte la grilla en lotes de `tam` (`partirIguales`), pone en
 * cada uno un ícono de cada servicio en casillas distintas al azar, y se queda con uno de solución única
 * (`resolverServicios`) que se deduzca sin adivinar (`deducirServicios`). Los fáciles, el primero que
 * sirve; los difíciles arman varios y se quedan con el que pide más pasos. Determinista con la semilla.
 */
export function generarServicios(semilla, { lado = 6, tam = 4, servicios = ['luz', 'agua'], dificil = false } = {}) {
  if ((lado * lado) % tam || tam < servicios.length) throw new Error('tamaño imposible');
  const r = azar(`servicios:${semilla}`);
  const quiero = dificil ? 20 : 1;
  let mejor = null, mejorD = -Infinity, hallados = 0;
  for (let intento = 0; intento < 3000 && hallados < quiero; intento++) {
    const rects = partirIguales(r, lado, tam);
    if (!rects) continue;
    const iconos = new Array(lado * lado).fill(null);
    for (const x of rects) {
      const ks = barajar(r, casillas(x, lado));
      servicios.forEach((s, j) => { iconos[ks[j]] = s; });
    }
    const t = { modo: 'servicios', lado, tam, servicios: [...servicios], iconos, solucion: rects };
    if (resolverServicios(t, 2).n !== 1) continue;
    const d = deducirServicios(t);
    if (!d.resuelto) continue;
    hallados++;
    if (dificultad(d) > mejorD) { mejor = t; mejorD = dificultad(d); }
  }
  if (!mejor) throw new Error('no se pudo armar el tablero');
  return { semilla: String(semilla), ...mejor };
}

/** El tablero de una etapa (0 a 4) del modo servicios. */
export const generarEtapaServicios = (semilla, n) => generarServicios(`${semilla}:etapa-${n + 1}`, ETAPAS_SERVICIOS[n]);

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
