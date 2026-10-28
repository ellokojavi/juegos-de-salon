/**
 * The panel's domains (D-348): the pure accounts behind each section — group games, individual
 * games, La Copa, users and the shares — and what every section needs to read a number
 * (the previous period, the change, the versions on the timeline, a CSV). No DOM, no Firebase:
 * `node public/panel/dominios.test.mjs`.
 *
 * Everything reads `stats/<env>/days/<day>` as it comes, by shape and not by list (C-16): a game,
 * a mode or a band the code starts sending tomorrow counts without touching the panel.
 */
import { isLocalMode, isIndividualMode, MODES } from '../assets/js/games.js';
import { activos, fuera } from '../cup/engine.js';
import { dayOf } from './aggregate.js';
import { copasDe, estadoCopa } from './copas.js';

const num = v => Number(v) || 0;
const add = (o, k, v = 1) => { o[k] = (o[k] || 0) + v; };
const bucketOf = (days, d) => (days || {})[String(d)] || {};

/* ------------------------------------------------------------------ */
/* Reading a number: against the previous period                      */
/* ------------------------------------------------------------------ */

/** The period of the same length right before `{ from, to }` (day numbers, inclusive). */
export function rangoAnterior({ from, to }) {
  const largo = to - from + 1;
  return { from: from - largo, to: from - 1 };
}

/** The change from `antes` to `ahora`, in whole percent; null when there is nothing to compare with. */
export function variacion(ahora, antes) {
  if (!antes) return ahora ? null : 0;
  return Math.round(((ahora - antes) / antes) * 100);
}

/** Percentiles of a list (0 to 1): [p25, p50, p75] by default, nearest rank. Empty → nulls. */
export function percentiles(xs, ps = [0.25, 0.5, 0.75]) {
  const o = xs.filter(x => Number.isFinite(x)).sort((a, b) => a - b);
  return ps.map(p => (o.length ? o[Math.min(o.length - 1, Math.max(0, Math.ceil(p * o.length) - 1))] : null));
}

/* ------------------------------------------------------------------ */
/* Group and individual games                                          */
/* ------------------------------------------------------------------ */

/** A mode belongs to the individual domain if the registry says so; an unknown one goes with the group. */
const dominioDe = mode => (isIndividualMode(mode) ? 'individual' : 'grupo');

/**
 * Games started in the range, split by domain (D-348). Group: rooms with a rival and the local
 * modes for several people; individual: the modes the registry marks `individual`. The Cup's own
 * mode is not here: it has its section. Each domain: total, by game, by mode and by day.
 */
export function partidasDominio(days, { from, to }) {
  const nuevo = () => ({ total: 0, byGame: {}, byMode: {}, byDay: [] });
  const out = { grupo: nuevo(), individual: nuevo() };
  for (let d = from; d <= to; d++) {
    const b = bucketOf(days, d);
    const fila = { grupo: 0, individual: 0 };
    for (const r of Object.values(b.rooms || {})) {
      if (!r || Object.keys(r.players || {}).length < 2) continue;
      const g = out.grupo; g.total++; add(g.byGame, r.game || '?'); add(g.byMode, 'online'); fila.grupo++;
    }
    for (const [game, modes] of Object.entries(b.local || {})) {
      for (const [mode, ns] of Object.entries(modes || {})) {
        if (!isLocalMode(mode) || MODES[mode]?.torneo) continue;
        const c = Object.values(ns || {}).reduce((s, v) => s + num(v), 0);
        const g = out[dominioDe(mode)]; g.total += c; add(g.byGame, game, c); add(g.byMode, mode, c); fila[dominioDe(mode)] += c;
      }
    }
    out.grupo.byDay.push({ day: d, total: fila.grupo });
    out.individual.byDay.push({ day: d, total: fila.individual });
  }
  return out;
}

/**
 * Finished games and replays (D-348): `fin/<game>/<mode>` and `otra/<game>`, against the games
 * started in local modes. Rooms finish through `end`, counted in `embudoSalas`.
 * `{ porJuego: { game: { empezadas, terminadas, otras, grupo, individual, finGrupo, finIndividual } }, terminadas, otras }`:
 * `grupo`/`individual` are the games started in each domain, `finGrupo`/`finIndividual` those finished.
 * `otra/<game>` carries no mode, so `otras` is not split by domain.
 */
export function finales(days, { from, to }) {
  const porJuego = {};
  const caja = g => (porJuego[g] ||= { empezadas: 0, terminadas: 0, otras: 0, grupo: 0, individual: 0, finGrupo: 0, finIndividual: 0 });
  let terminadas = 0, otras = 0;
  for (let d = from; d <= to; d++) {
    const b = bucketOf(days, d);
    for (const [game, modes] of Object.entries(b.local || {})) for (const [mode, ns] of Object.entries(modes || {})) {
      if (!isLocalMode(mode) || MODES[mode]?.torneo) continue;
      const c = Object.values(ns || {}).reduce((s, v) => s + num(v), 0);
      caja(game).empezadas += c; caja(game)[dominioDe(mode)] += c;
    }
    for (const [game, modes] of Object.entries(b.fin || {})) for (const [mode, v] of Object.entries(modes || {})) {
      if (!isLocalMode(mode) || MODES[mode]?.torneo) continue;
      caja(game).terminadas += num(v); terminadas += num(v);
      caja(game)[dominioDe(mode) === 'grupo' ? 'finGrupo' : 'finIndividual'] += num(v);
    }
    for (const [game, v] of Object.entries(b.otra || {})) { caja(game).otras += num(v); otras += num(v); }
  }
  return { porJuego, terminadas, otras };
}

/**
 * Rooms, step by step (D-348): created → a rival came in → it ended (someone won or a tie), and
 * how long the ended ones took (median). By game.
 */
export function embudoSalas(days, { from, to }) {
  const porJuego = {};
  for (let d = from; d <= to; d++) for (const r of Object.values(bucketOf(days, d).rooms || {})) {
    if (!r) continue;
    const g = (porJuego[r.game || '?'] ||= { creadas: 0, conRival: 0, terminadas: 0, duraciones: [] });
    g.creadas++;
    if (Object.keys(r.players || {}).length >= 2) g.conRival++;
    if (r.end?.at) { g.terminadas++; if (num(r.at) && r.end.at > r.at) g.duraciones.push(r.end.at - r.at); }
  }
  for (const g of Object.values(porJuego)) { g.medianaMs = percentiles(g.duraciones, [0.5])[0]; delete g.duraciones; }
  return porJuego;
}

/**
 * What an individual game's ending says (D-210): `hard · 80/100 · 2:30` → the variant, the score
 * as a percent and the time in seconds. Whatever is missing comes back null.
 */
export function leerDetalle(d = '') {
  const partes = String(d).split('·').map(x => x.trim());
  const variante = /^[a-z][a-z-]*$/.test(partes[0] || '') && partes.length > 1 ? partes[0] : null;
  const p = String(d).match(/(\d+)\s*\/\s*(\d+)/);
  const t = String(d).match(/(\d+):(\d{2})(?!\d)/);
  return {
    variante,
    pct: p && num(p[2]) ? Math.round((num(p[1]) / num(p[2])) * 100) : null,
    seg: t ? num(t[1]) * 60 + num(t[2]) : null,
  };
}

/** How long a live game can go without ending before it counts as left halfway. */
export const ABANDONO_MS = 60 * 60 * 1000;

/**
 * The real difficulty of each individual game (D-348), from its live records: the score and
 * time quartiles of the finished ones, and how many were left halfway. A variant other than the
 * default counts apart (`pintaminas · hard`).
 */
export function dificultad(days, { from, to }, now = Date.now()) {
  const porJuego = {};
  for (let d = from; d <= to; d++) for (const x of Object.values(bucketOf(days, d).live || {})) {
    if (!x || !isIndividualMode(x.mode)) continue;
    const det = x.fin ? leerDetalle(x.fin.d) : {};
    const k = det.variante ? `${x.game} · ${det.variante}` : x.game;
    const g = (porJuego[k] ||= { game: x.game, variante: det.variante || null, empezadas: 0, terminadas: 0, abandonos: 0, pcts: [], segs: [] });
    g.empezadas++;
    if (x.fin) { g.terminadas++; if (det.pct !== null) g.pcts.push(det.pct); if (det.seg !== null) g.segs.push(det.seg); }
    else if (now - num(x.beat || x.at) > ABANDONO_MS) g.abandonos++;
  }
  return Object.entries(porJuego).map(([k, g]) => ({
    k, game: g.game, variante: g.variante, empezadas: g.empezadas, terminadas: g.terminadas, abandonos: g.abandonos,
    puntaje: percentiles(g.pcts), tiempo: percentiles(g.segs),
  })).sort((a, b) => b.empezadas - a.empezadas || a.k.localeCompare(b.k));
}

/* ------------------------------------------------------------------ */
/* Versions on the timeline                                            */
/* ------------------------------------------------------------------ */

const partesVersion = v => String(v).split('.').map(num);
const compararV = (a, b) => { const x = partesVersion(a), y = partesVersion(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

/**
 * When each version first shows up in the data (rooms and live games carry `v`): the marks on
 * every timeline, to read "we changed X" next to "Y happened" (D-348). Only versions newer than
 * any seen before them: a phone still on an old version does not move a mark.
 */
export function versiones(days) {
  const primera = {};
  for (const [k, b] of Object.entries(days || {})) {
    const d = Number(k);
    for (const x of [...Object.values(b?.rooms || {}), ...Object.values(b?.live || {})]) {
      const v = x?.v;
      if (!v || !/^\d+\.\d+\.\d+$/.test(v)) continue;
      if (!(v in primera) || d < primera[v]) primera[v] = d;
    }
  }
  const orden = Object.entries(primera).sort((a, b) => compararV(a[0], b[0]));
  const out = [];
  let ultimoDia = -Infinity;
  for (const [v, day] of orden) if (day >= ultimoDia) { out.push({ v, day }); ultimoDia = day; }
  return out;
}

/** The versions that came out inside a period of `grano` starting at `day`, for its label. */
export const versionesEn = (marcas, desde, hasta) => marcas.filter(m => m.day >= desde && m.day <= hasta).map(m => m.v);

/* ------------------------------------------------------------------ */
/* Users: active devices, cohorts, frequency and return (D-349)        */
/* ------------------------------------------------------------------ */

/** The ids active each day: `{ day: Map(id → 1 visited | 2 played) }`, from `activos/<id>`. */
function activosPorDia(days) {
  const out = {};
  for (const [k, b] of Object.entries(days || {})) {
    const m = new Map();
    for (const [id, v] of Object.entries(b?.activos || {})) if (/^[a-z0-9]{10}$/.test(id)) m.set(id, num(v) >= 2 ? 2 : 1);
    if (m.size) out[Number(k)] = m;
  }
  return out;
}

/**
 * Users in the range (D-349). A user is a browser: a random id that lives in it and says nothing
 * about the person. Day by day, the active ones and how many of them played; daily average,
 * the unique ones in the last 7 and 30 days of the range, and the stickiness (daily over monthly).
 * New: first seen that day **within the loaded data**, so the first days of a short range look
 * all new; the cohorts say so.
 */
export function usuarios(days, { from, to }) {
  const porDia = activosPorDia(days);
  const primera = {};
  for (const d of Object.keys(porDia).map(Number).sort((a, b) => a - b)) for (const id of porDia[d].keys()) if (!(id in primera)) primera[id] = d;
  const desdeDatos = Math.min(...Object.keys(porDia).map(Number), Infinity);
  const filas = [];
  let suma = 0, conDatos = 0;
  for (let d = from; d <= to; d++) {
    const m = porDia[d] || new Map();
    let jugaron = 0, nuevos = 0;
    for (const [id, v] of m) { if (v === 2) jugaron++; if (primera[id] === d) nuevos++; }
    filas.push({ day: d, activos: m.size, jugaron, nuevos });
    if (m.size) { suma += m.size; conDatos++; }
  }
  const unicos = (a, b) => { const s = new Set(); for (let d = a; d <= b; d++) for (const id of (porDia[d] || new Map()).keys()) s.add(id); return s.size; };
  const semana = unicos(to - 6, to), mes = unicos(to - 29, to), rango = unicos(from, to);
  const diario = conDatos ? Math.round(suma / conDatos) : 0;
  return {
    porDia: filas, diario, semana, mes, rango,
    pegajosidad: mes ? Math.round((diario / mes) * 100) : null,
    desde: Number.isFinite(desdeDatos) ? desdeDatos : null,
  };
}

/**
 * Cohorts by the week (Monday) of first sight, with how many came back exactly 1, 7 and 30 days
 * later (D-349). A return not yet reachable (its day is after `hoy`) is null, not 0.
 */
export function cohortes(days, { hoy }) {
  const porDia = activosPorDia(days);
  const primera = {};
  for (const d of Object.keys(porDia).map(Number).sort((a, b) => a - b)) for (const id of porDia[d].keys()) if (!(id in primera)) primera[id] = d;
  const lunes = d => d - ((d + 3) % 7); // day 0 (1970-01-01) was a Thursday
  const grupos = {};
  for (const [id, d] of Object.entries(primera)) (grupos[lunes(d)] ||= []).push([id, d]);
  return Object.entries(grupos).map(([w, ids]) => {
    const vuelta = n => {
      const alcanzables = ids.filter(([, d]) => d + n <= hoy);
      if (!alcanzables.length) return null;
      return Math.round((alcanzables.filter(([id, d]) => porDia[d + n]?.has(id)).length / alcanzables.length) * 100);
    };
    return { semana: Number(w), tamano: ids.length, d1: vuelta(1), d7: vuelta(7), d30: vuelta(30) };
  }).sort((a, b) => a.semana - b.semana);
}

/**
 * The counters that need no id (D-348): how long since the last visit (`vuelta/<band>`), how many
 * of the last 28 days a browser came (`frec/<band>`), and what was shared (`comparte/<what>`).
 */
export function senales(days, { from, to }) {
  const vuelta = {}, frec = {}, comparte = {};
  for (let d = from; d <= to; d++) {
    const b = bucketOf(days, d);
    for (const [k, v] of Object.entries(b.vuelta || {})) add(vuelta, k, num(v));
    for (const [k, v] of Object.entries(b.frec || {})) add(frec, k, num(v));
    for (const [k, v] of Object.entries(b.comparte || {})) add(comparte, k, num(v));
  }
  return { vuelta, frec, comparte, compartidos: Object.values(comparte).reduce((s, v) => s + v, 0) };
}

/** Order of the bands, by their number: `d1`, `d2-7`, `d8-30`, `d31`; `nueva` first. */
export const ordenTramos = obj => Object.entries(obj).sort((a, b) => {
  const k = x => (/^\D*$/.test(x) ? -1 : num(String(x).match(/\d+/)[0]));
  return k(a[0]) - k(b[0]);
});

/* ------------------------------------------------------------------ */
/* La Copa: the funnel, day by day, and who was left out (D-347)       */
/* ------------------------------------------------------------------ */

/**
 * The Cups created in the range, step by step: created → 2 or more players → started (someone
 * pressed Empezar) → finished with 2 or more. Participation by day number of the Cup (where people
 * drop), players out of the cup (D-347) and brought back by the admin.
 */
export function embudoCopas(torneos, { from, to }, now = Date.now()) {
  const enRango = copasDe(torneos).filter(L => { const d = dayOf(L.meta.createdAt || 0); return d >= from && d <= to; });
  const porDia = {};
  let conGente = 0, partieron = 0, terminadas = 0, fueraN = 0, devueltos = 0, jugadores = 0;
  for (const L of enRango) {
    const c = estadoCopa(L, now);
    const jug = activos(L);
    jugadores += jug.length;
    if (jug.length >= 2) conGente++;
    if (Object.values(L.started || {}).some(x => x && Object.keys(x).length)) partieron++;
    if (c.estado === 'terminada' && jug.length >= 2) terminadas++;
    for (const j of jug) {
      if (fuera(L, j.pid, Math.min(now, L.meta.end))) fueraN++;
      if (L.players[j.pid]?.back) devueltos++;
    }
    for (let d = 1; d <= L.meta.days; d++) {
      if (now < L.meta.win[d].b) continue;
      const x = (porDia[d] ||= { dia: d, esperado: 0, jugado: 0 });
      for (const j of jug) if ((j.at || 0) < L.meta.win[d].b) { x.esperado++; if (L.results?.[d]?.[j.pid]) x.jugado++; }
    }
  }
  return {
    creadas: enRango.length, conGente, partieron, terminadas, jugadores,
    tamano: enRango.length ? Math.round((jugadores / enRango.length) * 10) / 10 : null,
    fuera: fueraN, devueltos, porDia: Object.values(porDia).sort((a, b) => a.dia - b.dia),
  };
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/** Rows (objects) as CSV, with the keys of the first row as the header. Quotes what needs it. */
export function aCsv(filas) {
  if (!filas?.length) return '';
  const cols = Object.keys(filas[0]);
  const celda = v => { const s = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...filas.map(f => cols.map(c => celda(f[c])).join(','))].join('\n') + '\n';
}
