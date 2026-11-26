/**
 * 🚅 Tren en Vilo in La Copa, Uno al día and its own page: the day's five crossings, the same for everyone.
 * The physics, the stages' catalog and the score are `physics.js` (the lab's engine until D-456); this
 * only picks the crossings from the catalog with the day's seed.
 */
import { rng } from '../../../assets/js/rng.js';
import { ETAPAS, TIEMPO_S, fijos, puntosMedios, esCubierta, COSTO_PISTA } from './physics.js';

/** The catalog's levels of the five crossings: one notch harder than the lab's 1 to 5 (the owner asked for "slightly hard"). */
export const NIVELES = [2, 3, 3, 4, 5];
/** The trial (D-103): two easy crossings in a minute and a half. */
export const NIVELES_ENSAYO = [1, 1];
export const TIEMPO_ENSAYO_S = 90;
export { TIEMPO_S, COSTO_PISTA };

/** The catalog of crossings with wood budgets (tools/generators/bridges.mjs). */
export const CATALOGO_URL = new URL('./catalog.json', import.meta.url);

/** The day's game: its seed, the levels of its crossings and its clock. */
export function generarDia(codigo, dia, { sal = '', ensayo = false } = {}) {
  return { semilla: `${codigo}:${dia}${sal ? `:${sal}` : ''}`, niveles: ensayo ? NIVELES_ENSAYO : NIVELES, tiempo: 1000 * (ensayo ? TIEMPO_ENSAYO_S : TIEMPO_S) };
}

const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/**
 * The crossings of a game: one per level, drawn from the catalog with the seed, never the same one twice.
 * Without the catalog (it did not load), the lab's five fixed stages.
 */
export function etapasDe(catalogo, semilla, niveles = NIVELES) {
  if (!Array.isArray(catalogo) || !catalogo.length) return niveles.map((_, k) => ETAPAS[Math.min(k, ETAPAS.length - 1)]);
  const r = rng(hash(semilla)), usadas = new Set();
  return niveles.map((n, k) => {
    const de = catalogo.filter(c => c.nivel === n && !usadas.has(c));
    if (!de.length) return ETAPAS[Math.min(k, ETAPAS.length - 1)];
    const c = de[Math.floor(r() * de.length)];
    usadas.add(c);
    return c;
  });
}

/** The share card: one line per crossing, ✅ crossed or ⬛ not, without giving the bridges away. */
export const tarjeta = (hechas, etapas) => Array.from({ length: etapas }, (_, k) => (hechas[k] ? `✅ ${k + 1}` : `⬛ ${k + 1}`)).join(' ');

/**
 * A beam as its steps between the grid points on its line ('x,y|x,y', ends sorted): a two-square beam is
 * two steps, so a bridge that has it as two one-square beams (split at a joint) has it too.
 */
const mcd = (x, y) => (y ? mcd(y, x % y) : x);
function pasos({ a, b }) {
  const dx = b[0] - a[0], dy = b[1] - a[1], g = mcd(Math.abs(dx), Math.abs(dy)) || 1, out = [];
  for (let k = 0; k < g; k++) {
    const p = `${a[0] + (dx * k) / g},${a[1] + (dy * k) / g}`, q = `${a[0] + (dx * (k + 1)) / g},${a[1] + (dy * (k + 1)) / g}`;
    out.push(p < q ? `${p}|${q}` : `${q}|${p}`);
  }
  return out;
}

/** Does the bridge `vigas` already have beam `v`, whole or split at its joints? */
export function cubre(vigas, v) {
  const hay = new Set(vigas.flatMap(pasos));
  return pasos(v).every(k => hay.has(k));
}

/**
 * The 💡 hint (flag bridges-hint): one beam of the crossing's known bridge (`solucion`, the catalog's)
 * that the player's bridge lacks, `{ a, b }`, or null when it has them all (or the crossing has no known
 * bridge). It is the first such beam, in the catalog's order, that touches the bridge as it stands (a
 * fixed point, a beam's end, or on wood a point inside a beam), so it can be laid from there; the same
 * bridge always gets the same hint.
 */
export function pista(e, vigas = []) {
  if (!Array.isArray(e?.solucion) || !e.solucion.length) return null;
  const hay = new Set(vigas.flatMap(pasos));
  const faltan = e.solucion.map(([a, b]) => ({ a, b })).filter(v => !esCubierta(v) && pasos(v).some(k => !hay.has(k)));
  if (!faltan.length) return null;
  const nudos = new Set([...fijos(e), ...vigas.flatMap(v => [v.a, v.b])].map(p => p.join(',')));
  if (e.madera) for (const k of puntosMedios(vigas)) nudos.add(k);
  return faltan.find(v => nudos.has(v.a.join(',')) || nudos.has(v.b.join(','))) || faltan[0];
}
