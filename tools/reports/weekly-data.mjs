/**
 * The weekly report's numbers (D-352): a pure function over what the panel reads (`stats/prod/days`,
 * `torneos/`, One a Day's history and the feedback), for the week that ended on Saturday, against
 * the week before. It reuses the panel's accounts (`public/panel/`) so the report and the panel
 * never disagree. No network, no DOM: `node tools/reports/weekly-data.test.mjs`.
 */
import { partidasDominio, finales, embudoSalas, dificultad, usuarios, senales, ordenTramos, embudoCopas, variacion } from '../../public/panel/dominios.js';
import { trafico, salud, unoAlDiaDelRango, origenesAgrupados, DAY } from '../../public/panel/aggregate.js';
import { resumenCopas, pct, copasDe } from '../../public/panel/copas.js';
import { gameById } from '../../public/assets/js/games.js';
import { juegosCopa } from '../../public/cup/rules.js';

/** The weekday of a UTC day number, Sunday = 0 (day 0, 1970-01-01, was a Thursday). */
export const diaSemana = d => (d + 4) % 7;

/**
 * The last full week (Sunday to Saturday, UTC days) before `now`. Run on a Sunday, it is the
 * week that ended yesterday; run on any other day, the last one that already ended.
 */
export function semanaCerrada(now = Date.now()) {
  const hoy = Math.floor(now / DAY);
  let sabado = hoy - 1;
  while (diaSemana(sabado) !== 6) sabado--;
  return { from: sabado - 6, to: sabado };
}

/** A day number as "Oct 12, 2026" (UTC). */
export const fechaDia = d => new Date(d * DAY).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

const COPA = juegosCopa('en');
/** A game's English name with its emoji, from the registry or from La Copa's games. */
export function nombreJuego(id) {
  const [base, variante] = String(id).split(/:| · /);
  const g = gameById(base);
  if (g) return `${g.emoji || ''} ${g.name?.en || g.name?.es || base}${variante ? ` · ${variante}` : ''}`.trim();
  const c = COPA[base];
  return c ? `${c.emoji} ${c.nombre}${variante ? ` · ${variante}` : ''}` : String(id);
}

/** The vigía writes load failures in Spanish (stored as data): in English here, as in the panel (D-350). */
const RECURSO_EN = { 'módulo': 'module', script: 'script', 'hoja de estilos': 'stylesheet' };
export const mensajeEn = m => String(m || '').replace(/^(módulo|script|hoja de estilos) que no cargó( \(el de la página\))?$/,
  (_, tipo, propio) => `${RECURSO_EN[tipo]} that did not load${propio ? " (the page's own)" : ''}`).replace(/^\(sin detalle\)$/, '(no detail)');

/** A metric with its value, the previous week's and the change in percent (null: nothing to compare). */
const fila = (nombre, ahora, antes) => ({ nombre, ahora, antes, cambio: variacion(ahora, antes) });
const top = (obj, n = 5) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
const pctDe = (a, b) => (b ? Math.round((a / b) * 100) : null);

/** The versions released in the week, from CHANGELOG.md ("## 0.178.0 — 2026-10-18" and its lines). */
export function versionesDeLaSemana(changelog, { from, to }) {
  const out = [];
  let actual = null;
  for (const linea of String(changelog || '').split('\n')) {
    const m = linea.match(/^## (\d+\.\d+\.\d+) — (\d{4}-\d{2}-\d{2})/);
    if (m) {
      const d = Math.floor(Date.parse(`${m[2]}T00:00:00Z`) / DAY);
      actual = d >= from && d <= to ? { v: m[1], fecha: m[2], cambios: [] } : null;
      if (actual) out.push(actual);
    } else if (actual && /^- \*\*/.test(linea)) actual.cambios.push(linea.match(/^- \*\*(.+?)\*\*/)[1].replace(/[.:]$/, ''));
  }
  return out;
}

/**
 * Everything the report says. `data`: { days, torneos, uad: { historia, invitados, rachas }, feedback,
 * changelog }. Returns the week, the headline, one block per domain and the week's events.
 */
export function semana(data, now = Date.now()) {
  const w = semanaCerrada(now), p = { from: w.from - 7, to: w.from - 1 };
  const { days = {}, torneos = {}, uad = {}, feedback = {}, changelog = '' } = data;
  const fin = Math.min(now, (w.to + 1) * DAY);

  const pd = partidasDominio(days, w), pp = partidasDominio(days, p);
  const f = finales(days, w), fp = finales(days, p);
  const salasT = r => Object.values(embudoSalas(days, r)).reduce((k, g) => k + g.terminadas, 0);
  const rc = resumenCopas(torneos, w, fin), rcp = resumenCopas(torneos, p, (p.to + 1) * DAY);
  const norte = f.terminadas + salasT(w) + rc.jugadas, norteP = fp.terminadas + salasT(p) + rcp.jugadas;
  const u = usuarios(days, w), up = usuarios(days, p);
  const t = trafico(days, w), tp = trafico(days, p);
  const s = senales(days, w), sp = senales(days, p);
  const h = salud(days, w), hp = salud(days, p);
  const ua = unoAlDiaDelRango({ days, ...uad }, { from: w.from, to: w.to, hoy: w.to });
  const uap = unoAlDiaDelRango({ days, ...uad }, { from: p.from, to: p.to, hoy: p.to });
  const ec = embudoCopas(torneos, w, fin);
  const salas = embudoSalas(days, w);
  const sum = k => Object.values(salas).reduce((x, g) => x + g[k], 0);

  const enSemana = ts => typeof ts === 'number' && ts >= w.from * DAY && ts < (w.to + 1) * DAY;
  const reportes = Object.values(feedback || {}).filter(r => enSemana(r?.at));
  const copasNuevas = copasDe(torneos).filter(L => enSemana(L.meta.createdAt)).map(L => ({ nombre: L.meta.name, dias: L.meta.days, lab: !!L.meta.lab }));

  return {
    semana: w, anterior: p, desde: fechaDia(w.from), hasta: fechaDia(w.to),
    titular: [
      fila('Games finished (main metric)', norte, norteP),
      fila('Games started', pd.grupo.total + pd.individual.total + rc.jugadas, pp.grupo.total + pp.individual.total + rcp.jugadas),
      fila('Active browsers in the week', u.rango, up.rango),
      fila('Visits', t.visitas, tp.visitas),
      fila('Shares', s.compartidos, sp.compartidos),
    ],
    grupo: {
      filas: [fila('Group games', pd.grupo.total, pp.grupo.total), fila('Rooms with a rival', sum('conRival'), Object.values(embudoSalas(days, p)).reduce((x, g) => x + g.conRival, 0))],
      rival: pctDe(sum('conRival'), sum('creadas')), final: pctDe(sum('terminadas'), sum('conRival')), otras: f.otras,
      top: top(pd.grupo.byGame).map(([id, n]) => ({ juego: nombreJuego(id), n })),
    },
    individual: {
      filas: [fila('Individual games', pd.individual.total, pp.individual.total)],
      dificultad: dificultad(days, w, fin).slice(0, 8).map(g => ({ juego: nombreJuego(g.k), empezadas: g.empezadas, terminadas: g.terminadas, abandonos: g.abandonos, mediana: g.puntaje[1], segundos: g.tiempo[1] })),
      top: top(pd.individual.byGame).map(([id, n]) => ({ juego: nombreJuego(id), n })),
    },
    copa: {
      filas: [fila('Cups active', rc.copas, rcp.copas), fila('Cups created', rc.nuevas, rcp.nuevas), fila('Cup games played', rc.jugadas, rcp.jugadas), fila('Players signed up', rc.inscripciones, rcp.inscripciones)],
      participacion: pct(rc.participacion), embudo: ec,
      juegos: rc.porJuego.slice(0, 8).map(g => ({ juego: nombreJuego(g.id), jugadas: g.jugadas, abandonos: g.abandonos, promedio: g.promedio, mediana: g.medianaMs })),
    },
    unoAlDia: { filas: [fila('One a Day games', ua.partidas, uap.partidas), fila('Players with a name', ua.jugadores, uap.jugadores)], d1: ua.d1, d7: ua.d7 },
    usuarios: {
      filas: [fila('Active per day (average)', u.diario, up.diario), fila('Active in the week', u.rango, up.rango)],
      pegajosidad: u.pegajosidad, nuevos: u.porDia.reduce((k, d) => k + d.nuevos, 0), desde: u.desde,
      vuelta: ordenTramos(s.vuelta), frec: ordenTramos(s.frec),
    },
    trafico: {
      filas: [fila('Visits', t.visitas, tp.visitas), fila('Page views', t.vistas, tp.vistas)],
      juegan: pctDe(t.juegan, t.visitas), origenes: top(origenesAgrupados(t.ref)), paginas: Object.entries(t.paginas).sort((a, b) => b[1].entradas - a[1].entradas).slice(0, 6).map(([k, v]) => ({ pagina: k, ...v })),
      compartidos: top(s.comparte), viral: s.compartidos ? Math.round(((t.via.link || 0) / s.compartidos) * 100) / 100 : null,
    },
    salud: {
      fallas: pctDe(h.total.alguna, h.total.cargas), fallasAntes: pctDe(hp.total.alguna, hp.total.cargas), noArranco: h.total.arranque,
      errores: (h.errores || []).slice(0, 5).map(e => ({ mensaje: `${e.k}: ${mensajeEn(e.m)}`, pagina: Object.keys(e.paginas || {}).join(', '), veces: e.n })),
    },
    eventos: { versiones: versionesDeLaSemana(changelog, w), reportes: reportes.length, copasNuevas },
    porDia: Array.from({ length: 7 }, (_, i) => {
      const d = w.from + i;
      return { dia: fechaDia(d).replace(/, \d{4}$/, ''), grupo: pd.grupo.byDay[i].total, individual: pd.individual.byDay[i].total, copa: rc.porDia[i]?.total || 0, activos: u.porDia[i].activos, visitas: t.porDia[i].visitas };
    }),
  };
}
