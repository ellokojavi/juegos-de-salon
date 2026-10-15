/**
 * Rutas rotas — el motor (from the lab, D-293; a La Copa game and the standalone /routes/ since D-331). Inspirado en Junction Nine (Bricks and Chips): un tablero de
 * 3×3 piezas con tramos de líneas de metro. Una jugada gira 180° cualquier rectángulo del tablero (una
 * pieza, una fila, un bloque de 2×2, el tablero entero…): sus piezas cambian de lugar como en un
 * espejo y quedan dadas vuelta. Se gana cuando todas las líneas siguen sin cortes de pieza en pieza, y
 * el desafío es lograrlo en el mínimo de giros, que el motor calcula exacto.
 *
 * Cada pieza tiene 8 puertas, dos por lado (N, E, S, O; la 0 y la 1 van de izquierda a derecha o de
 * arriba abajo), y sus tramos unen dos puertas con un color. Un estado es, por cada lugar (0 a 8, por
 * filas), la pieza que hay y si está dada vuelta: `{ p, v }`.
 */
export const LADO = 3;
const LADOS = ['N', 'E', 'S', 'O'];
const OPUESTO = { N: 'S', S: 'N', E: 'O', O: 'E' };
export const COLORES = [
  { nombre: 'celeste', color: '#2ee6d6' }, { nombre: 'verde', color: '#7ddc3a' }, { nombre: 'morado', color: '#b48bff' },
  { nombre: 'rosado', color: '#ff6fa8' }, { nombre: 'naranjo', color: '#ff9f1c' }, { nombre: 'amarillo', color: '#ffd23f' },
];

function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) { h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Los 36 rectángulos del tablero: `{ f1, c1, f2, c2 }`, de la esquina de arriba a la izquierda a la de abajo a la derecha. */
export const RECTANGULOS = [];
for (let f1 = 0; f1 < LADO; f1++) for (let f2 = f1; f2 < LADO; f2++) for (let c1 = 0; c1 < LADO; c1++) for (let c2 = c1; c2 < LADO; c2++) RECTANGULOS.push({ f1, c1, f2, c2 });

/** Girar 180° un rectángulo: cada pieza va al lugar espejo y se da vuelta. */
export function girar(estado, { f1, c1, f2, c2 }) {
  const nuevo = estado.slice();
  for (let f = f1; f <= f2; f++) for (let c = c1; c <= c2; c++) {
    const { p, v } = estado[f * LADO + c];
    nuevo[(f1 + f2 - f) * LADO + (c1 + c2 - c)] = { p, v: 1 - v };
  }
  return nuevo;
}

/** El color en una puerta de la pieza que hay en un lugar (o null): dada vuelta, N0 pasa a ser S1, etc. */
const puerta = (piezas, { p, v }, lado, k) => (v ? piezas[p].puertas[OPUESTO[lado]][1 - k] : piezas[p].puertas[lado][k]);

/** ¿Siguen todas las líneas? Cada borde entre dos piezas vecinas tiene que calzar, puerta por puerta. */
export function resuelto(piezas, estado) {
  for (let f = 0; f < LADO; f++) for (let c = 0; c < LADO; c++) {
    const aqui = estado[f * LADO + c];
    for (let k = 0; k < 2; k++) {
      if (c + 1 < LADO && puerta(piezas, aqui, 'E', k) !== puerta(piezas, estado[f * LADO + c + 1], 'O', k)) return false;
      if (f + 1 < LADO && puerta(piezas, aqui, 'S', k) !== puerta(piezas, estado[(f + 1) * LADO + c], 'N', k)) return false;
    }
  }
  return true;
}


const clave = estado => estado.reduce((s, { p, v }) => s * 18 + p * 2 + v, 0);
const META = Array.from({ length: LADO * LADO }, (_, p) => ({ p, v: 0 }));

/**
 * El mínimo de giros de un estado a una solución, buscando desde los dos lados a la vez: cada giro se
 * deshace con el mismo giro, así que hacia atrás se busca igual. Las soluciones son la meta (las piezas
 * en su lugar y derechas) y el tablero entero dado vuelta, que también une todas las líneas; hacia
 * atrás se parte de las dos. Hasta `tope` giros (más allá devuelve null).
 */
export const TODO = { f1: 0, c1: 0, f2: LADO - 1, c2: LADO - 1 };
export function minimo(estado, tope = 8) {
  const metas = [META, girar(META, TODO)];
  const ka = clave(estado);
  if (metas.some(m => clave(m) === ka)) return 0;
  let desdeA = new Map([[ka, estado]]), desdeB = new Map(metas.map(m => [clave(m), m]));
  const vistosA = new Map([[ka, 0]]), vistosB = new Map(metas.map(m => [clave(m), 0]));
  for (let pasos = 1, da = 0, db = 0; pasos <= tope; pasos++) {
    // Se expande el lado con menos estados
    const porA = desdeA.size <= desdeB.size;
    const [frente, vistos, otros, d] = porA ? [desdeA, vistosA, vistosB, ++da] : [desdeB, vistosB, vistosA, ++db];
    const siguiente = new Map();
    for (const e of frente.values()) for (const r of RECTANGULOS) {
      const n = girar(e, r), k = clave(n);
      if (vistos.has(k)) continue;
      if (otros.has(k)) return d + otros.get(k);
      vistos.set(k, d); siguiente.set(k, n);
    }
    if (porA) desdeA = siguiente; else desdeB = siguiente;
  }
  return null;
}

/**
 * Las piezas: un mapa de metro de 3×3. Cada línea entra por un borde del tablero, pasa de pieza en
 * pieza sin repetir y sale por otro borde; en cada borde entre piezas usa una de sus dos puertas. Se
 * rehace hasta que toda pieza tenga al menos un tramo y no haya dos piezas iguales (si no, habría más
 * de una solución con el mismo dibujo).
 */
function mapa(r, lineas) {
  for (let intento = 0; intento < 400; intento++) {
    const piezas = Array.from({ length: LADO * LADO }, () => ({ puertas: { N: [null, null], E: [null, null], S: [null, null], O: [null, null] }, tramos: [] }));
    const colores = barajar(COLORES, r).slice(0, lineas);
    let bien = true;
    for (const col of colores) {
      // Una caminata por las piezas, de borde a borde, sin repetir pieza
      const borde = [...Array(LADO * LADO).keys()].filter(i => Math.floor(i / LADO) % (LADO - 1) === 0 || (i % LADO) % (LADO - 1) === 0);
      let i = borde[Math.floor(r() * borde.length)];
      const camino = [i];
      const largo = 2 + Math.floor(r() * 3);
      while (camino.length < largo + 1) {
        const f = Math.floor(i / LADO), c = i % LADO;
        const pasos = barajar([[f - 1, c, 'N'], [f + 1, c, 'S'], [f, c - 1, 'O'], [f, c + 1, 'E']], r)
          .filter(([ff, cc]) => ff >= 0 && ff < LADO && cc >= 0 && cc < LADO && !camino.includes(ff * LADO + cc));
        if (!pasos.length) break;
        i = pasos[0][0] * LADO + pasos[0][1];
        camino.push(i);
      }
      if (camino.length < 2) { bien = false; break; }
      // Por dónde entra a la primera y sale de la última: un lado que da al borde del tablero
      const haciaFuera = j => { const f = Math.floor(j / LADO), c = j % LADO; return barajar([f === 0 && 'N', f === LADO - 1 && 'S', c === 0 && 'O', c === LADO - 1 && 'E'].filter(Boolean), r); };
      const libre = (j, lado) => [0, 1].filter(k => piezas[j].puertas[lado][k] === null);
      const usar = (j, lado, k) => { piezas[j].puertas[lado][k] = col.color; return { lado, k }; };
      const entradas = [];
      // Entrada desde fuera
      const fuera0 = haciaFuera(camino[0]).find(l => libre(camino[0], l).length);
      if (!fuera0) { bien = false; break; }
      entradas.push(usar(camino[0], fuera0, libre(camino[0], fuera0)[Math.floor(r() * libre(camino[0], fuera0).length)]));
      const salidas = [];
      for (let s = 0; s + 1 < camino.length && bien; s++) {
        const a = camino[s], b = camino[s + 1];
        const lado = b === a - LADO ? 'N' : b === a + LADO ? 'S' : b === a - 1 ? 'O' : 'E';
        // La misma puerta en los dos lados del borde (en la pieza vecina es el lado opuesto, misma k)
        const ks = [0, 1].filter(k => piezas[a].puertas[lado][k] === null && piezas[b].puertas[OPUESTO[lado]][k] === null);
        if (!ks.length) { bien = false; break; }
        const k = ks[Math.floor(r() * ks.length)];
        salidas.push(usar(a, lado, k));
        entradas.push(usar(b, OPUESTO[lado], k));
      }
      if (!bien) break;
      const ultima = camino[camino.length - 1];
      const fuera1 = haciaFuera(ultima).find(l => libre(ultima, l).length && !(entradas.at(-1).lado === l));
      if (!fuera1) { bien = false; break; }
      salidas.push(usar(ultima, fuera1, libre(ultima, fuera1)[Math.floor(r() * libre(ultima, fuera1).length)]));
      camino.forEach((j, s) => piezas[j].tramos.push({ de: entradas[s], a: salidas[s], color: col.color }));
    }
    if (!bien || piezas.some(p => !p.tramos.length)) continue;
    // Dos piezas iguales (también dada vuelta una) harían ambiguo el dibujo
    const firma = (p, v) => LADOS.map(l => [0, 1].map(k => (v ? p.puertas[OPUESTO[l]][1 - k] : p.puertas[l][k]) || '-').join()).join('|');
    const firmas = new Set();
    let repetida = false;
    for (const p of piezas) { const a = firma(p, 0), b = firma(p, 1); if (firmas.has(a) || firmas.has(b)) repetida = true; firmas.add(a); firmas.add(b); }
    if (repetida) continue;
    return { piezas, colores };
  }
  throw new Error('no se pudo armar el mapa');
}

/**
 * Las etapas (D-294): cada partida son cinco tableros, cada uno más difícil. Sube el mínimo de giros y,
 * desde la cuarta, hay una línea más que seguir con la vista. El mínimo se pide exacto: un tablero de
 * la etapa 3 se resuelve en 4 giros, ni uno menos.
 */
export const ETAPAS = [
  { lineas: 3, minimo: 2 },
  { lineas: 4, minimo: 3 },
  { lineas: 4, minimo: 4 },
  { lineas: 5, minimo: 4 },
  { lineas: 5, minimo: 5 },
];

/**
 * El tablero de una semilla: `{ piezas, colores, inicio, minimo, revuelta }`. Se desordena desde la meta
 * con giros al azar y se calcula el mínimo exacto; se rehace hasta que dé el que se pide (`minimo`), o,
 * sin pedirlo, uno de 3 a `giros`. `revuelta`: los giros con que se desordenó; deshechos al revés lo
 * resuelven (no siempre en el mínimo).
 */
export function generar(semilla, { lineas = 4, giros = 5, minimo: pedido = null } = {}) {
  const r = azar(String(semilla));
  const vueltas = pedido ? pedido + 1 : giros;
  for (let intento = 0; intento < 200; intento++) {
    const { piezas, colores } = mapa(r, lineas);
    let inicio = META;
    const revuelta = [];
    for (let g = 0; g < vueltas; g++) { const rect = RECTANGULOS[Math.floor(r() * RECTANGULOS.length)]; revuelta.push(rect); inicio = girar(inicio, rect); }
    if (resuelto(piezas, inicio)) continue;
    const m = minimo(inicio, vueltas);
    if (m === null || (pedido ? m !== pedido : m < 3)) continue;
    return { piezas, colores, inicio, minimo: m, revuelta };
  }
  throw new Error('no se pudo armar el tablero');
}

/** El tablero de una etapa (0 a 4) de una partida: la semilla de la partida, con su número. */
export const generarEtapa = (semilla, n) => generar(`${semilla}:etapa-${n + 1}`, ETAPAS[n]);

/**
 * El puntaje de la partida (D-295), por capas y en este orden: completar, la velocidad y los giros.
 * Cada etapa completada vale PUNTOS_ETAPA (17; las cinco, 85). Encima, un bono de hasta 15 —menos que
 * una etapa, así que completar más siempre gana—: hasta 10 por velocidad (10 si las cinco se terminan
 * en RAPIDO_S o menos, 0 si se acaba el reloj, en línea recta entre medio; solo si se completan todas)
 * y hasta 5 por giros (5 si todas las etapas hechas fueron en el mínimo, 0 con el doble o más).
 * `hechas`: [{ giros, minimo }] de las etapas completadas; `segundos`: el tiempo usado.
 * A shorter game (the trial session, D-103: `etapas` 2 and its own `tiempo` in seconds) scales the
 * same layers: the stages share the 85 points and the fast mark shrinks with the stages.
 */
export const TIEMPO_S = 7 * 60, RAPIDO_S = 60;
export const PUNTOS_ETAPA = 17, BONO_VELOCIDAD = 10, BONO_GIROS = 5;
const entre01 = x => Math.max(0, Math.min(1, x));
export function puntajePartida(hechas, segundos, { etapas = ETAPAS.length, tiempo = TIEMPO_S } = {}) {
  const completa = hechas.length >= etapas;
  const base = Math.round((PUNTOS_ETAPA * ETAPAS.length * Math.min(hechas.length, etapas)) / etapas);
  const rapido = Math.min(tiempo / 2, (RAPIDO_S * etapas) / ETAPAS.length);
  const velocidad = completa ? entre01((tiempo - segundos) / (tiempo - rapido)) : 0;
  const giros = hechas.reduce((a, h) => a + h.giros, 0), minimos = hechas.reduce((a, h) => a + h.minimo, 0);
  const eficiencia = hechas.length ? entre01((minimos / giros - 0.5) / 0.5) : 0;
  const ptsVelocidad = Math.round(BONO_VELOCIDAD * velocidad), ptsGiros = Math.round(BONO_GIROS * eficiencia);
  return { total: base + ptsVelocidad + ptsGiros, base, ptsVelocidad, ptsGiros, giros, minimos, completa };
}

/**
 * A La Copa day or a standalone game (D-331): what `montar` receives. The boards are built stage by
 * stage on screen from `semilla`, the same for everyone with the same cup code and day (the
 * standalone page gets a random code each time). The trial session (`ensayo`, D-103) has the same
 * mechanics with other boards (`sal`), only the first two stages and 2 minutes. `tiempo` is in ms,
 * like Zip's, so the test clock (`?test&timer=12`) can shorten it.
 */
export const TIEMPO_ENSAYO_S = 2 * 60;
export function generarDia(codigo, dia, { sal = '', ensayo = false } = {}) {
  return { semilla: `${codigo}:${dia}${sal ? `:${sal}` : ''}`, etapas: ensayo ? 2 : ETAPAS.length, tiempo: 1000 * (ensayo ? TIEMPO_ENSAYO_S : TIEMPO_S) };
}

/**
 * The share card (D-295): one line per stage, the turns against the minimum, without giving the boards
 * away; 🟩 at the minimum, 🟨 with extra turns and ⬛ the stages not reached.
 */
export const tarjeta = (hechas, etapas = ETAPAS.length) => Array.from({ length: etapas }, (_, k) => {
  const h = hechas[k];
  return h ? `${h.giros <= h.minimo ? '🟩' : '🟨'} ${k + 1}: ${h.giros}/${h.minimo}` : `⬛ ${k + 1}: —`;
}).join('\n');
