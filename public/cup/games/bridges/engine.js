/**
 * 🚂 Tren en Vilo in La Copa: the day's five crossings, the same for everyone. The physics, the stages'
 * catalog and the score are the lab's (`labs/bridges/engine.js`); this only picks the crossings from the
 * catalog with the day's seed. It is registered in the cup's games but not in `POZO`: a cup plays it only
 * when its calendar names it (the owner's one-day cup of 2026-10-25), like El caso (D-257).
 */
import { rng } from '../../../assets/js/rng.js';
import { ETAPAS, TIEMPO_S } from '../../../labs/bridges/engine.js';

/** The catalog's levels of the five crossings: one notch harder than the lab's 1 to 5 (the owner asked for "slightly hard"). */
export const NIVELES = [2, 3, 3, 4, 5];
/** The trial (D-103): two easy crossings in a minute and a half. */
export const NIVELES_ENSAYO = [1, 1];
export const TIEMPO_ENSAYO_S = 90;
export { TIEMPO_S };

/** The catalog of crossings with wood budgets, the lab's game. */
export const CATALOGO_URL = new URL('../../../labs/bridges/catalogo-madera.json', import.meta.url);

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
