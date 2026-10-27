/**
 * La Copa's recap for the home page (D-423): the table of a cup this phone played, once it ended.
 * The home page (assets/js/recap.js) says which cup is due and draws the window; this module runs
 * in /cup/recap/, a page with no screen the home page opens in a hidden frame, so the cup's engine
 * stays out of the home page (D-377). It reads the cup over REST (`torneos/<code>` is public to
 * read), with no Firebase SDK, and builds the rows the window draws and the cup's final table as
 * the image the cup shares (table-image.js, D-427): the trajectory and the podium in gold, silver
 * and bronze, in the cup's language (D-170).
 */
import { conCierre, terminada, tabla, evolucion } from './engine.js';
import { createCuenta } from './cuenta.js';
import { dueCup, markCupSeen } from '../assets/js/recap.js';

const DB = 'https://juegos-de-salon-default-rtdb.firebaseio.com';

/** The fonts the image is drawn with (base.css declares them; the page links it only for them). */
const FONTS = ['400 76px Bangers', '800 40px Nunito', '900 40px Nunito'];

/**
 * The cup's final table as the image it shares (D-427), the same one the podium's 📤 sends, as a
 * PNG file; null if it could not be drawn (the window then shows its own table).
 */
export async function cupImage(Lraw, pid, now, url) {
  try {
    const [{ imagenDeTabla }, { LOCALES }] = await Promise.all([import('./table-image.js'), import('./rules.js')]);
    try { await Promise.all(FONTS.map(f => document.fonts.load(f))); } catch (_) { /* the fallbacks */ }
    const Lc = conCierre(Lraw);
    return await imagenDeTabla({ Lc, yo: pid, now: Math.max(now, Lc.meta.end), T: LOCALES[Lc.meta.lang] || LOCALES.es, code: null, url });
  } catch (_) { return null; }
}

/**
 * What the window draws for `pid` in cup `L`, or null when there is nothing to tell (the cup has
 * not ended, nobody scored, or this player is not in its table):
 * `{ name, me: row, winners: [row], days: [1…], rows: [{ pid, name, lugar, total, lugares, delta, mine, fuera }] }`.
 * `lugares` is the place after each day; `delta`, places climbed from the first day to the end.
 */
export function cupRecap(Lraw, pid, now) {
  const L = conCierre(Lraw);
  if (!L?.meta || !terminada(L.meta, now)) return null;
  const end = L.meta.end;
  const filas = tabla(L, pid, end);
  const me = filas.find(f => f.pid === pid);
  if (filas.length < 2 || !me || !filas.some(f => f.total > 0)) return null;
  const ev = evolucion(L, pid, end);
  const lugares = Object.fromEntries(ev.filas.map(f => [f.pid, f.lugares]));
  const rows = filas.map(f => {
    const l = lugares[f.pid] || [];
    return { pid: f.pid, name: f.name, lugar: f.lugar, total: f.total, lugares: l, delta: l.length ? l[0] - f.lugar : 0, mine: f.pid === pid, fuera: !!f.fuera };
  });
  return { name: L.meta.name, days: ev.dias, rows, me: rows.find(r => r.mine), winners: rows.filter(r => r.lugar === 1) };
}

/**
 * The due cup and its recap, or null: `{ code, alias, recap, image }` (`image` with `withImage`). A cup that turns out to have
 * nothing to tell is marked seen, so it is not fetched again; one that could not be read is tried
 * on the next visit.
 */
export async function loadCupRecap({ now = Date.now(), fetchFn = globalThis.fetch, withImage = false } = {}) {
  const due = dueCup({ now });
  if (!due) return null;
  const pid = createCuenta().quien(due.code);
  if (!pid) { markCupSeen(due.code); return null; }
  let L;
  try {
    const r = await fetchFn(`${DB}/torneos/${due.code}.json`);
    if (!r.ok) return null;
    L = await r.json();
  } catch (_) { return null; }
  const recap = L ? cupRecap(L, pid, now) : null;
  if (!recap) { markCupSeen(due.code); return null; }
  const image = withImage ? await cupImage(L, pid, now, `https://juegosdesalon.cl/cup/?${L.meta.alias || due.code}`) : null;
  return { code: due.code, alias: L.meta.alias || null, recap, image };
}

/** `?recap=demo`: La Copa's podium demo (demo.js), as if it had just ended; its link opens that demo. */
export async function demoRecap() {
  const { escena } = await import('./demo.js');
  const now = Date.now();
  const { L, e, meta } = escena('podium', { now });
  return { code: null, path: 'cup/?test&demo=podium', recap: cupRecap(L, e.yo, Math.max(now, meta.end)), image: await cupImage(L, e.yo, now, 'https://juegosdesalon.cl/cup/') };
}
