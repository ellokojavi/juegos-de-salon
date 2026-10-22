#!/usr/bin/env node
/**
 * The home page's order, refreshed every week (D-361): counts the games finished in the last four
 * weeks and rewrites `POPULARIDAD` and `POPULARIDAD_FECHA` in public/assets/js/games.js.
 *
 *   node tools/agents/popularity.mjs check     # today's count against the list, and whether it is due
 *   node tools/agents/popularity.mjs update    # rewrites the two lines (only if the order changed)
 *
 * It reads Firebase as administrator (the owner's key, tools/firebase/firebase-admin.mjs) with the
 * panel's own accounts, so the order and the panel's "games finished" never disagree:
 *   - offline games finished, in every mode (group, solo, Uno al día): the per-game log
 *     (`live/<id>.fin`, D-210) or the `fin` counter (D-348, from v0.178.0), whichever says more for
 *     that game, so a game is never counted twice and the weeks before the counter still count;
 *   - rooms that ended (someone won or a tie): `embudoSalas`;
 *   - La Copa days played, under the game they played (`linea` → `linea-de-tiempo`), and all of
 *     them together as La Copa itself: `resumenCopas`.
 * Finished, not started (D-361): a game people often leave halfway should not be the first thing a
 * new player meets. A game with nothing finished keeps its old place among the others with nothing.
 * The processes round runs `update` once the list is a week old (step 8 of its guide) and opens the
 * PR with auto-merge; a week with the same order leaves no PR.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FILE = join(ROOT, 'public/assets/js/games.js');
const DAY = 24 * 3600 * 1000;
/** How many days are counted, and how old the list may get before the round refreshes it. */
export const WINDOW = 28;
export const EVERY = 7;
/** The cup's day ids that are not the game's id. */
export const CUP_ALIAS = { linea: 'linea-de-tiempo', numero: 'toque-y-fama' };

/* ------------------------------------------------------------------ */
/* Pure logic (tested by popularity.test.mjs)                          */
/* ------------------------------------------------------------------ */

/** Offline games that ended, by game, from the per-game log of the days in the range (D-210). */
export function terminadasLog(days, { from, to }) {
  const n = {};
  for (let d = from; d <= to; d++) for (const x of Object.values((days || {})[String(d)]?.live || {})) {
    if (!x?.fin || !x.game || ['online', 'copa'].includes(x.mode)) continue;
    n[x.game] = (n[x.game] || 0) + 1;
  }
  return n;
}

/**
 * Games finished by id: offline (the larger of the log and the counter, per game), ended rooms and
 * cup days, each cup day also counted under La Copa.
 */
export function terminadas({ finales = {}, log = {}, salas = {}, copa = [] }) {
  const n = {};
  const add = (id, k) => { if (k > 0) n[id] = (n[id] || 0) + k; };
  for (const id of new Set([...Object.keys(finales), ...Object.keys(log)])) add(id, Math.max(Number(finales[id]?.terminadas) || 0, log[id] || 0));
  for (const [id, g] of Object.entries(salas)) add(id, Number(g?.terminadas) || 0);
  let dias = 0;
  for (const g of copa) {
    const base = String(g.id).split(':')[0];
    dias += Number(g.jugadas) || 0;
    if (base !== 'final') add(CUP_ALIAS[base] || base, Number(g.jugadas) || 0);
  }
  add('copa', dias);
  return n;
}

/**
 * The new order: every game the home page offers (`ofrecidos`, ids), most finished first; a tie,
 * or a game with none, keeps its place in the old list (`viejo`), and one missing from it goes last.
 * Ids that the home page does not offer (lab games, the Gran Final) are dropped.
 */
export function nuevoOrden(conteo, ofrecidos, viejo) {
  const antes = id => { const i = viejo.indexOf(id); return i < 0 ? viejo.length + ofrecidos.indexOf(id) : i; };
  return [...ofrecidos].sort((a, b) => (conteo[b] || 0) - (conteo[a] || 0) || antes(a) - antes(b));
}

/** Days since the list was written (its `POPULARIDAD_FECHA`), and whether the round should refresh it. */
export function vence(fecha, hoy = Date.now()) {
  const dias = Math.floor((hoy - Date.parse(`${fecha}T00:00:00Z`)) / DAY);
  return { dias, toca: !(dias < EVERY) };
}

/** games.js with the two generated lines rewritten. Throws if either line is not where it should be. */
export function reescribir(src, orden, fecha) {
  const fl = /^export const POPULARIDAD_FECHA = '\d{4}-\d{2}-\d{2}';$/m, ll = /^export const POPULARIDAD = \[.*\];$/m;
  if (!fl.test(src) || !ll.test(src)) throw new Error('games.js lost the POPULARIDAD_FECHA or POPULARIDAD line');
  return src.replace(fl, `export const POPULARIDAD_FECHA = '${fecha}';`)
    .replace(ll, `export const POPULARIDAD = [${orden.map(id => `'${id}'`).join(', ')}];`);
}

/* ------------------------------------------------------------------ */
/* The count (network)                                                 */
/* ------------------------------------------------------------------ */

/** The counted days: the last four whole days up to yesterday, today left out (UTC day numbers). */
export function ventana(ahora = Date.now()) {
  const hoy = Math.floor(ahora / DAY);
  return { from: hoy - WINDOW, to: hoy - 1 };
}

/** Games finished by id in `range`, from the stats days and the cups already read from Firebase. */
export async function contarDe(days, torneos, range) {
  const { finales, embudoSalas } = await import('../../public/panel/dominios.js');
  const { resumenCopas } = await import('../../public/panel/copas.js');
  return terminadas({ finales: finales(days, range).porJuego, log: terminadasLog(days, range), salas: embudoSalas(days, range), copa: resumenCopas(torneos, range, (range.to + 1) * DAY).porJuego });
}

async function contar() {
  const { firebaseConfig } = await import('../../public/assets/js/firebase-config.js');
  const { token } = await import('../firebase/firebase-admin.mjs');
  const t = await token();
  const leer = async (ruta, q = {}) => {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(q).map(([k, v]) => [k, JSON.stringify(v)])), access_token: t });
    const r = await fetch(`${firebaseConfig.databaseURL}/${ruta}.json?${qs}`);
    if (!r.ok) throw new Error(`could not read ${ruta}/ (HTTP ${r.status})`);
    return (await r.json()) || {};
  };
  const range = ventana();
  const [days, torneos] = await Promise.all([leer('stats/prod/days', { orderBy: '$key', startAt: String(range.from) }), leer('torneos')]);
  return { range, conteo: await contarDe(days, torneos, range) };
}

async function main([command]) {
  if (!['check', 'update'].includes(command)) { console.error('Usage: node tools/agents/popularity.mjs check | update'); process.exit(2); }
  const { GAMES, SUELTOS, POPULARIDAD, POPULARIDAD_FECHA } = await import('../../public/assets/js/games.js');
  const ofrecidos = [...GAMES, ...SUELTOS].filter(g => !g.labs).map(g => g.id);
  const { dias, toca } = vence(POPULARIDAD_FECHA);
  const { range, conteo } = await contar();
  const orden = nuevoOrden(conteo, ofrecidos, POPULARIDAD);
  const fecha = d => new Date(d * DAY).toISOString().slice(0, 10);
  console.log(`Games finished, ${fecha(range.from)} to ${fecha(range.to)} (UTC days). The list is from ${POPULARIDAD_FECHA}, ${dias} day(s) ago${toca ? ': due' : ''}.`);
  orden.forEach((id, i) => {
    const was = POPULARIDAD.indexOf(id);
    console.log(`${String(i + 1).padStart(2)}. ${id} — ${conteo[id] || 0}${was === i ? '' : was < 0 ? ' · new in the list' : ` · was ${was + 1}`}`);
  });
  const igual = orden.join() === POPULARIDAD.join();
  if (command === 'check') return console.log(igual ? 'Same order: nothing to refresh.' : toca ? 'The order changed: run update in the round\'s PR.' : 'The order changed, but the list is less than a week old.');
  if (igual) return console.log('Same order: games.js untouched.');
  writeFileSync(FILE, reescribir(readFileSync(FILE, 'utf8'), orden, new Date().toISOString().slice(0, 10)));
  console.log('Rewrote POPULARIDAD and POPULARIDAD_FECHA in public/assets/js/games.js.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { await main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
