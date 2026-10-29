/**
 * Uno al día's place on the home page card, fresh from the server (the owner's request,
 * D-435). The card draws at once with the last place /today/ cached;
 * this reads the month's table afterwards, writes the same cache /today/ writes (so either page
 * reads the other's) and swaps the chip only if the place or the points changed. Only once today
 * is played (before that the chip says ▶ Jugar hoy) and for someone signed in. Loaded by the home
 * page alone, after the list is drawn.
 */
import { tarjetaUnoAlDia, fmt } from './uno-al-dia-ui.js';
import { estado, fechaLocal, leer } from './uno-al-dia.js';
import { walk } from './daily-points.js';
import { nocheTotales, conMiCuenta } from './uno-al-dia-red.js';
import { UAD_PUNTOS, periodoMes } from './records.js';
import { COMMON } from './i18n.js';

const CACHE = 'uad-pts-cache';
const leerCache = () => { try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (_) { return null; } };

/** Resolves true when it changed the chip; never throws. */
export async function refreshPlace(card, { lang, alTocar } = {}) {
  try {
    const chip = card?.querySelector('#btn-uad-chip');
    if (!chip || !card.classList.contains('hecho')) return false;
    const { jugador, rankingsVisibles } = await import('./jugador.js');
    if (!rankingsVisibles()) return false;
    const J = await jugador(), yo = J.yo();
    if (!yo) return false;
    const hoy = fechaLocal(), mes = periodoMes(hoy);
    const v = await J.tabla(UAD_PUNTOS, mes, { top: 100 });
    const filas = v ? [...v.top, ...(v.vecinos || [])] : [];
    const i = filas.findIndex(f => f.jid === yo.jid);
    if (i < 0) return false;
    let fila = filas[i], delante = i > 0 ? filas[i - 1] : null;
    // The night's totals (D-500): the same total and place /today/ shows, the rebuild's row plus this
    // phone's days it has not counted yet (the card showed the bare row, 50 pts and two places behind)
    if (await nocheTotales()) ({ fila, delante } = conMiCuenta({ filas, jid: yo.jid, w: walk(leer().dias, hoy, { gifts: leer().regalos || [] }), hoy }));
    const P = (COMMON[lang] || COMMON.es).uad.pts, miles = n => Number(n || 0).toLocaleString(lang);
    const antes = leerCache();
    // The same fields /today/ writes, its «faltan» line included
    localStorage.setItem(CACHE, JSON.stringify({ p: mes, s: fila.s, r: fila.puesto, d: hoy, h: !!estado().dia,
      l: delante ? fmt(P.faltan, { p: fila.puesto, f: miles(delante.s - fila.s + 1), n: delante.n }) : fmt(P.puesto, { p: fila.puesto }) }));
    if (antes?.p === mes && antes.d === hoy && antes.h && antes.s === fila.s && antes.r === fila.puesto) return false;
    // The chip as the card draws it now, with its own handlers
    const nuevo = tarjetaUnoAlDia({ lang, alTocar }).querySelector('#btn-uad-chip');
    if (!nuevo || !chip.isConnected) return false;
    chip.replaceWith(nuevo);
    return true;
  } catch (_) { return false; }
}
