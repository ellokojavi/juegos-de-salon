/**
 * The Weekly Business Review (WBR): the trend the panel's 📋 WBR view and the weekly email show, one
 * account for both (D-352, D-560). The closed week and the four before it, this month so far and the
 * two months before; the headline metrics and the top 10 games. Pure, no DOM:
 * `node tools/reports/weekly-data.test.mjs` tests it.
 */
import { partidasDominio, finales, embudoSalas, usuarios, variacion } from './dominios.js';
import { trafico, DAY, pacificDay } from './aggregate.js';
import { resumenCopas } from './copas.js';
import { publicGameCheck } from './public-games.js';
import { gameById, isLocalMode, MODES } from '../assets/js/games.js';
import { juegosCopa } from '../cup/rules.js';


/**
 * Pacific time (D-561): the owner's weeks, months and days are Pacific dates, not UTC ones. A UTC
 * day's bucket (`stats/<env>/days/<utc day>`) holds the end of one Pacific date and the start of the
 * next, so `toPacificDays` moves what carries its moment to the Pacific date of that moment:
 * offline games (`live/`, with `local/` and `fin/` rebuilt from them), rooms (`rooms/`, by `at`) and,
 * since D-561, active browsers and visits (`activosPt/`, `entradasPt/`). What carries no moment stays
 * on its UTC day: games before `live/` existed (before 2026-10-04), browsers and visits before D-561,
 * and the other counters. Day numbers keep their form (days since 1970-01-01), now naming Pacific dates.
 */
export { pacificDay };

export function toPacificDays(days = {}) {
  const out = {};
  const caja = d => (out[d] ||= {});
  const movidos = new Map(), conActivosPt = new Set(), conEntradasPt = new Set();
  for (const [k, b] of Object.entries(days || {})) {
    const d = Number(k);
    if (!b || typeof b !== 'object' || !Number.isFinite(d)) continue;
    const todos = Object.entries(b.live || {}).filter(([, x]) => x && Number.isFinite(x.at));
    // live/ took a few weeks to cover every game: a day whose live/ does not match its counters keeps them
    const cuenta = x => isLocalMode(x?.mode) && !MODES[x.mode]?.torneo;
    let enLocal = 0;
    for (const modes of Object.values(b.local || {})) for (const [m, ns] of Object.entries(modes || {})) if (cuenta({ mode: m })) enLocal += Object.values(ns || {}).reduce((a, v) => a + (Number(v) || 0), 0);
    const live = Math.abs(todos.filter(([, x]) => cuenta(x)).length - enLocal) <= 1 ? todos : [];
    for (const [key, val] of Object.entries(b)) {
      if (key === 'live' || key === 'rooms' || key === 'activosPt' || key === 'entradasPt' || key === 'juegosPt' || key === 'perfilPt' || key === 'perfilIdPt') continue;
      // local/ and fin/ come from live/ when the day has it (they match it one to one since 2026-10-04)
      if ((key === 'local' || key === 'fin') && live.length) continue;
      const c = caja(d);
      c[key] = key in c && typeof val === 'object' && val ? { ...c[key], ...val } : val;
    }
    for (const [id, x] of live) {
      const p = pacificDay(x.at);
      if (!movidos.has(p)) movidos.set(p, []);
      movidos.get(p).push(x);
      (caja(p).live ||= {})[id] = x;
    }
    if (!live.length && b.live) Object.assign(caja(d).live ||= {}, b.live);
    for (const [code, r] of Object.entries(b.rooms || {})) (caja(r && Number.isFinite(r.at) ? pacificDay(r.at) : d).rooms ||= {})[code] = r;
    for (const [p, ids] of Object.entries(b.activosPt || {})) { conActivosPt.add(Number(p)); Object.assign(caja(Number(p)).activosPt ||= {}, ids); }
    // Active browsers by game (D-590): `jugadores/<game>/<id>` on its Pacific date, 1 started and 2 finished (the higher kept)
    for (const [p, juegos] of Object.entries(b.juegosPt || {})) {
      const j = (caja(Number(p)).jugadores ||= {});
      for (const [g, ids] of Object.entries(juegos || {})) { const m = (j[g] ||= {}); for (const [id, v] of Object.entries(ids || {})) m[id] = Math.max(m[id] || 0, Number(v) || 0); }
    }
    // The profile's use (D-615): `perfil/<event>` summed and `perfilIds/<id>` on its Pacific date
    for (const [p, evs] of Object.entries(b.perfilPt || {})) {
      const e = (caja(Number(p)).perfil ||= {});
      for (const [k, v] of Object.entries(evs || {})) e[k] = (e[k] || 0) + (Number(v) || 0);
    }
    for (const [p, ids] of Object.entries(b.perfilIdPt || {})) Object.assign(caja(Number(p)).perfilIds ||= {}, ids);
    for (const [p, pags] of Object.entries(b.entradasPt || {})) {
      conEntradasPt.add(Number(p));
      const e = (caja(Number(p)).entradasPt ||= {});
      for (const [pg, v] of Object.entries(pags || {})) e[pg] = (e[pg] || 0) + (Number(v) || 0);
    }
  }
  for (const [p, xs] of movidos) {
    // Added to what a day kept of its own counters (a day whose live/ did not match, at the edge)
    const c = out[p], local = structuredClone(c.local || {}), fin = structuredClone(c.fin || {});
    for (const x of xs) {
      const m = x.mode || 'solo', n = String(Math.max(1, Number(x.n) || 1));
      ((local[x.game] ||= {})[m] ||= {})[n] = (local[x.game][m][n] || 0) + 1;
      if (x.fin) (fin[x.game] ||= {})[m] = (fin[x.game][m] || 0) + 1;
    }
    c.local = local; c.fin = fin;
  }
  // From the day the Pacific counters exist, they are the day's browsers and visits
  for (const p of conActivosPt) out[p].activos = out[p].activosPt;
  for (const p of conEntradasPt) out[p].entradas = out[p].entradasPt;
  for (const c of Object.values(out)) { delete c.activosPt; delete c.entradasPt; }
  return out;
}

/** The moment a Pacific date ends (its next midnight, Pacific time), in ms: 07:00 or 08:00 UTC. */
export function pacificEndMs(d) {
  let t = (d + 1) * DAY + 7 * 3600e3;
  while (pacificDay(t) <= d) t += 3600e3;
  return t;
}

/** The first Pacific date whose browsers and visits are by Pacific day (D-561), or null. */
export function pacificCountersSince(days = {}) {
  let min = Infinity;
  for (const b of Object.values(days || {})) for (const p of Object.keys(b?.activosPt || {})) min = Math.min(min, Number(p));
  return Number.isFinite(min) ? min : null;
}

/** A UTC day number as "Nov 8, 2026". */
export const dayLabel = d => new Date(d * DAY).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
const fechaDia = dayLabel;
const COPA = juegosCopa('en');
/** A game's English name with its emoji, from the registry or from La Copa's games. */
export function gameName(id) {
  const g = gameById(id);
  if (g) return `${g.emoji || ''} ${g.name?.en || g.name?.es || id}`.trim();
  const c = COPA[id];
  return c ? `${c.emoji} ${c.nombre}` : String(id);
}
const nombreJuego = gameName;

/** The first day the trend of week `w` reads: the first of the month two months before. */
export const trendStart = w => { const f = new Date(w.to * DAY); return Date.UTC(f.getUTCFullYear(), f.getUTCMonth() - 2, 1) / DAY; };

/** The UTC day number of the first day of the month `atras` months before the one holding day `d`. */
const inicioMes = (d, atras = 0) => { const f = new Date(d * DAY); return Date.UTC(f.getUTCFullYear(), f.getUTCMonth() - atras, 1) / DAY; };
const mesCorto = d => new Date(d * DAY).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' });
/** A week as short as a column allows: "Nov 15–19", or "Oct 26–Nov 1" across two months. */
const sinAno = d => fechaDia(d).replace(/, \d{4}$/, '');
export const weekRange = ({ from, to }) => (mesCorto(from) === mesCorto(to) ? `${sinAno(from)}–${sinAno(to).replace(/^\D+/, '')}` : `${sinAno(from)}–${sinAno(to)}`);
// The name it had inside this file, kept so another branch's new call to it still works
const rangoTxt = weekRange;
/** A game's versions read as one (Bulls and Cows: Word is Bulls and Cows); its modes already split off by `:`. */
const VERSIONES = { letras: 'toque-y-fama', numero: 'toque-y-fama' };
export const baseGame = id => { const b = String(id).split(/:| · /)[0]; return VERSIONES[b] || b; };

/**
 * The trend the email's tables show: the closed week and the four before it, then this month so
 * far (partial), and the two months before. Every column is one range; `null` is "n/a": nothing
 * measured yet (the counter did not exist), or the game was not out yet. Games: the top 10 of the
 * closed week by games finished (as the headline counts them), every mode, version and La Copa's plays together, lab plays left out (a game outside
 * ALL_GAMES, or a play before the day its `flags/<id>` went to all). With `actual` (the week in
 * progress, the panel's view of the latest closed week), a partial column goes first; the % changes,
 * the top 10 and the highlights still read the closed week, at index `cerrada`. `totales`: every
 * public game's finished games per column and the share of them the top 10 take (the same ten in every column).
 */
export function trend({ days = {}, torneos = {}, flags = {} } = {}, w, { actual = null } = {}) {
  // The panel's WBR puts the week in progress first (partial); every comparison still reads the closed week, at `k`
  const k = actual ? 1 : 0;
  const cols = [...(actual ? [{ from: actual.from, to: actual.to, titulo: `${weekRange(actual)}*`, semana: true }] : []), ...[0, 1, 2, 3, 4].map(i => ({ from: w.from - 7 * i, to: w.to - 7 * i, titulo: weekRange({ from: w.from - 7 * i, to: w.to - 7 * i }), semana: true }))];
  // The month so far ends with the newest column: today when the week in progress shows, else the closed week's Saturday
  const hasta = actual ? actual.to : w.to;
  for (const atras of [0, 1, 2]) {
    const from = inicioMes(hasta, atras), to = atras ? inicioMes(hasta, atras - 1) - 1 : hasta;
    cols.push({ from, to, titulo: atras ? mesCorto(from) : `${mesCorto(from)}*`, semana: false });
  }
  const dias = Object.keys(days).map(Number).filter(Number.isFinite);
  const primerDato = clave => Math.min(...dias.filter(d => days[d]?.[clave] && Object.keys(days[d][clave]).length), Infinity);
  const desde = { activos: primerDato('activos'), visitas: Math.min(primerDato('entradas'), primerDato('vistas')) };
  const medido = (col, k) => (desde[k] <= col.to ? undefined : null);
  const filas = cols.map(col => {
    const fin = pacificEndMs(col.to), rc = resumenCopas(torneos, col, fin, { dayFn: pacificDay }), pd = partidasDominio(days, col), f = finales(days, col);
    const salas = Object.values(embudoSalas(days, col)).reduce((k, g) => k + g.terminadas, 0);
    return {
      terminadas: f.terminadas + salas + rc.jugadas, empezadas: pd.grupo.total + pd.individual.total + rc.jugadas,
      ...(medido(col, 'activos') === null ? { activos: null, diarios: null, porActivo: null } : (u => ({
        activos: u.rango, diarios: u.diario,
        // Games started per browser active in the range: how much each one plays
        porActivo: u.rango ? Math.round(((pd.grupo.total + pd.individual.total + rc.jugadas) / u.rango) * 10) / 10 : null,
      }))(usuarios(days, col))),
      visitas: medido(col, 'visitas') === null ? null : trafico(days, col).visitas,
    };
  });
  const metricas = [['Games finished', 'terminadas'], ['Games started', 'empezadas'], ['Active browsers', 'activos'], ['Daily active browsers (average)', 'diarios'], ['Games started per active browser', 'porActivo'], ['Visits', 'visitas']].map(([nombre, m]) => ({
    nombre, valores: filas.map(x => x[m]), decimales: m === 'porActivo', cambio: filas[k][m] === null || filas[k + 1][m] === null || !filas[k + 1][m] ? null : variacion(filas[k][m], filas[k + 1][m]),
  }));

  // Games, day by day so a launch in the middle of a range cuts it on its day (lab plays already out of `days`)
  const esPublico = publicGameCheck(flags);
  const desdeCuando = {}, porCol = cols.map(() => ({})), finPorDia = {}, empPorDia = {}, totalDia = {};
  const inicio = Math.min(...cols.map(c => c.from)), fin = Math.max(...cols.map(c => c.to));
  // La Copa's plays by day read in one pass over the cups, not one pass per day (the panel froze)
  const copasPorDia = resumenCopas(torneos, { from: inicio, to: fin }, pacificEndMs(fin), { dayFn: pacificDay }).porDiaJuego;
  for (let d = inicio; d <= fin; d++) {
    // Counted: games finished, as the headline's (one phone's `fin/`, rooms that ended, La Copa's plays);
    // a game is out from the first day anyone started it
    const dia = { from: d, to: d }, pd = partidasDominio(days, dia), f = finales(days, dia), salasDia = embudoSalas(days, dia);
    const hoy = {}, emp = {};
    for (const [id, n] of [...Object.entries(pd.grupo.byGame), ...Object.entries(pd.individual.byGame), ...Object.entries(copasPorDia[d] || {})]) if (n && esPublico(id, d)) emp[baseGame(id)] = (emp[baseGame(id)] || 0) + n;
    const empezados = Object.keys(emp);
    empPorDia[d] = emp;
    const terminadosHoy = [...Object.entries(f.porJuego).map(([id, g]) => [id, g.terminadas]), ...Object.entries(salasDia).map(([id, g]) => [id, g.terminadas]), ...Object.entries(copasPorDia[d] || {})];
    for (const [id, n] of terminadosHoy) {
      if (!n || !esPublico(id, d)) continue;
      const b = baseGame(id); hoy[b] = (hoy[b] || 0) + n;
    }
    // The headline's games finished on this day, for the pace chart: the same sum as its column
    totalDia[d] = f.terminadas + Object.values(salasDia).reduce((a, g) => a + g.terminadas, 0) + Object.values(copasPorDia[d] || {}).reduce((a, n) => a + n, 0);
    for (const b of empezados) desdeCuando[b] ??= d;
    for (const b in hoy) desdeCuando[b] ??= d;
    finPorDia[d] = hoy;
    cols.forEach((c, i) => { if (d >= c.from && d <= c.to) for (const b in hoy) porCol[i][b] = (porCol[i][b] || 0) + hoy[b]; });
  }
  // Out since its launch day, or since its first play when no flag launched it
  const lanzados = {};
  const lanzadoEl = b => (lanzados[b] ??= (() => { for (let d = inicio; d <= fin; d++) if (esPublico(b, d)) return d; return Infinity; })());
  const salio = b => (lanzadoEl(b) > inicio ? lanzadoEl(b) : desdeCuando[b]);
  const filaJuego = b => {
    const valores = cols.map((c, i) => (salio(b) > c.to ? null : porCol[i][b] || 0));
    // A launch inside the week before makes a % that says nothing
    const cambio = valores[k + 1] === null || salio(b) > cols[k + 1].from || (!valores[k] && !valores[k + 1]) ? null : variacion(valores[k], valores[k + 1]);
    return { juego: nombreJuego(b), valores, cambio, nuevo: salio(b) > cols[k + 1].to ? fechaDia(salio(b)) : null };
  };
  const juegos = Object.entries(porCol[k]).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => filaJuego(b));
  // Every public game finished in any column, for the panel's "all games": the closed week's order, then the
  // week in progress, then the whole trend
  const suma = b => porCol.reduce((a, p) => a + (p[b] || 0), 0);
  const todos = [...new Set(porCol.flatMap(p => Object.keys(p)))]
    .sort((a, b) => (porCol[k][b] || 0) - (porCol[k][a] || 0) || (porCol[0][b] || 0) - (porCol[0][a] || 0) || suma(b) - suma(a))
    .map(filaJuego);
  // Every public game's finished games in each column, and the share the top 10 take of them: how spread the play is
  const total = porCol.map(p => Object.values(p).reduce((a, v) => a + v, 0));
  const totales = {
    valores: total,
    cambio: total[k + 1] ? variacion(total[k], total[k + 1]) : null,
    // The share the top N take, N = 3, 5, 10, 20: each column ranks its own games, most finished first, so a
    // week (the partial one too) or a month reads its own concentration, not the closed week's ranking
    cuota: Object.fromEntries([3, 5, 10, 20].map(nn => [nn, total.map((t, i) => (t ? Math.round((Object.values(porCol[i]).sort((a, b) => b - a).slice(0, nn).reduce((a, v) => a + v, 0) / t) * 1000) / 10 : null))])),
  };
  // Active browsers by game, week by week (D-590), at two levels: those that finished it (2, the one
  // that matters) and those that started it (1 or 2). Real (distinct ids in `jugadores/`) where that
  // counter covers the whole week; before it, an estimate: the browsers that started a game that week
  // split by each game's share of the games finished (or started). It reads low: one browser plays
  // several games. A month is the average of its full weeks (Sunday to Saturday).
  const conJugadores = dias.filter(d => days[d]?.jugadores && Object.keys(days[d].jugadores).length);
  const desdeReal = conJugadores.length ? Math.min(...conJugadores) : Infinity;
  const semanaUsuarios = (r, nivel) => {
    if (desdeReal <= r.from) {
      const ids = {};
      for (let d = r.from; d <= r.to; d++) for (const [g, xs] of Object.entries(days[d]?.jugadores || {})) {
        if (!esPublico(g, d)) continue;
        const set = (ids[baseGame(g)] ||= new Set());
        for (const [id, v] of Object.entries(xs || {})) if (Number(v) >= nivel) set.add(id);
      }
      return { por: Object.fromEntries(Object.entries(ids).map(([b, x]) => [b, x.size])), real: true };
    }
    if (desde.activos > r.from) return null;
    // Browsers that started something in the week (level 2 in `activos/`), not every visitor
    const jugaron = new Set();
    for (let d = r.from; d <= r.to; d++) for (const [id, v] of Object.entries(days[d]?.activos || {})) if (v === 2) jugaron.add(id);
    const act = jugaron.size, n = {}, porDia = nivel === 2 ? finPorDia : empPorDia;
    for (let d = r.from; d <= r.to; d++) for (const [b, x] of Object.entries(porDia[d] || {})) n[b] = (n[b] || 0) + x;
    const tot = Object.values(n).reduce((a, v) => a + v, 0);
    return { por: Object.fromEntries(Object.entries(n).map(([b, x]) => [b, tot ? (act * x) / tot : 0])), real: false };
  };
  // One decimal: an estimate or a month's average is rarely whole (a real week always is)
  const redondo = v => Math.round(v * 10) / 10;
  const tablaUsuarios = nivel => {
    const porCol = cols.map(c => {
      if (c.semana) return semanaUsuarios(c, nivel);
      const semanas = [];
      for (let s = c.from + ((7 - ((c.from + 4) % 7)) % 7); s + 6 <= c.to; s += 7) { const u = semanaUsuarios({ from: s, to: s + 6 }, nivel); if (u) semanas.push({ ...u, to: s + 6 }); }
      if (!semanas.length) return null;
      // Each game's average over the full weeks it was out (any day of them): the weeks before its
      // launch are not zeros, and a game with no such week yet is n/a (null). Launch is its flag's day
      // to all; a game out before the trend starts counts every week, its quiet ones too
      const por = {};
      for (const b of new Set(semanas.flatMap(u => Object.keys(u.por)))) {
        const suyas = semanas.filter(u => u.to >= (lanzadoEl(b) > inicio ? lanzadoEl(b) : -Infinity));
        por[b] = suyas.length ? suyas.reduce((a, u) => a + (u.por[b] || 0), 0) / suyas.length : null;
      }
      return { por, real: semanas.every(u => u.real) };
    });
    const en = new Set([...Object.keys(porCol[k]?.por || {}), ...Object.keys(k ? porCol[0]?.por || {} : {})]);
    return {
      estimado: porCol.map(u => (u ? !u.real : false)),
      real: porCol.map(u => !!u?.real),
      desdeReal: Number.isFinite(desdeReal) ? fechaDia(desdeReal) : null,
      filas: [...en].map(b => {
        const valores = cols.map((c, i) => (!porCol[i] || salio(b) > c.to || porCol[i].por[b] === null ? null : redondo(porCol[i].por[b] || 0)));
        const comparable = valores[k] !== null && valores[k + 1] && porCol[k].real === porCol[k + 1].real;
        return { id: b, juego: nombreJuego(b), valores, cambio: comparable ? variacion(valores[k], valores[k + 1]) : null };
      }).filter(f => f.valores[k] || (k && f.valores[0])).sort((a, b) => (b.valores[k] || 0) - (a.valores[k] || 0) || (b.valores[0] || 0) - (a.valores[0] || 0)),
    };
  };
  const usuariosJuego = tablaUsuarios(2), usuariosEmpiezan = tablaUsuarios(1);
  // A game browsers start and none finishes, in a week the real count covers: likely broken before its end
  const sinTerminar = [];
  for (const i of [k, ...(k ? [0] : [])]) {
    if (!usuariosEmpiezan.real[i]) continue;
    const fin = Object.fromEntries(usuariosJuego.filas.map(f => [f.id, f.valores[i] || 0]));
    for (const f of usuariosEmpiezan.filas) if (f.valores[i] >= 2 && !fin[f.id] && !sinTerminar.some(x => x.id === f.id)) sinTerminar.push({ id: f.id, juego: f.juego, empiezan: f.valores[i], columna: cols[i].titulo });
  }
  // The pace: games finished day by day, added up from Sunday, of the newest week (the week in
  // progress, or the closed week), against the week before it and the average of the four before it
  const foco = actual || w, acumula = (from, n) => { const out = []; for (let i = 0; i < n; i++) out.push((out[i - 1] || 0) + (totalDia[from + i] || 0)); return out; };
  const previas = [1, 2, 3, 4].map(i => acumula(foco.from - 7 * i, 7));
  const ritmo = {
    semana: cols[0].titulo, anterior: weekRange({ from: foco.from - 7, to: foco.from - 1 }), parcial: !!actual,
    esta: acumula(foco.from, foco.to - foco.from + 1), pasada: previas[0],
    promedio: previas[0].map((_, i) => Math.round((previas.reduce((a, x) => a + x[i], 0) / 4) * 10) / 10),
  };
  // The * columns, said once under the tables
  const leyenda = `* Partial: ${actual ? `the week so far (to ${sinAno(actual.to)}) and ` : ''}the month up to ${sinAno(hasta)}.`;
  return { columnas: cols.map(c => c.titulo), semanas: cols.map(c => c.semana), ritmo, metricas, juegos, todos, totales, usuariosJuego, usuariosEmpiezan, sinTerminar, cerrada: k, leyenda };
}

/** The last full week (Sunday to Saturday, Pacific dates) before `now`, as the weekly email reads it. */
export function closedWeek(now = Date.now()) {
  // The owner's clock (D-561): the week that ended before today's Pacific date
  let sat = pacificDay(now) - 1;
  while ((sat + 4) % 7 !== 6) sat--;
  return { from: sat - 6, to: sat };
}

/** The week in progress (from Sunday to today, Pacific dates): the panel's partial first column. */
export function currentWeek(now = Date.now()) {
  return { from: closedWeek(now).to + 1, to: pacificDay(now) };
}

/** The week a WBR address names (`#/wbr/2026-11-14`, its Saturday), or the closed week; never one not closed yet. */
export function weekOf(arg, now = Date.now()) {
  const last = closedWeek(now);
  const t = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? Math.floor(Date.parse(`${arg}T00:00:00Z`) / DAY) : NaN;
  if (!Number.isFinite(t)) return last;
  let sat = t;
  while ((sat + 4) % 7 !== 6) sat++;
  return sat > last.to ? last : { from: sat - 6, to: sat };
}

/** A UTC day number as `2026-11-14`, how a week goes in the address. */
export const isoDay = d => new Date(d * DAY).toISOString().slice(0, 10);

/** The WBR's highlights from its trend: what moved and what was played most. */
export function highlights(t) {
  const out = [];
  const k = t.cerrada || 0, [fin] = t.metricas;
  if (fin && fin.cambio !== null && fin.cambio !== 0) out.push(`Games finished ${fin.cambio > 0 ? 'rose' : 'fell'} ${Math.abs(fin.cambio)}% (${fin.valores[k].toLocaleString('en-US')} vs. ${fin.valores[k + 1].toLocaleString('en-US')}).`);
  const [uno, dos] = t.juegos;
  if (uno) out.push(`Most finished: ${uno.juego} (${uno.valores[k]} games finished)${dos ? `, then ${dos.juego} (${dos.valores[k]})` : ''}.`);
  for (const g of t.sinTerminar || []) out.push(`⚠️ ${g.juego}: ${g.empiezan} browsers started it in ${g.columna} and none finished it: check that its end is recorded.`);
  const nuevos = t.juegos.filter(g => g.nuevo);
  if (nuevos.length) out.push(`New this week: ${nuevos.map(g => `${g.juego} (out ${g.nuevo.replace(/, \d{4}$/, '')})`).join(', ')}.`);
  return out;
}
