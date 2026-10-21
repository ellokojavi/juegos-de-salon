/**
 * The timeline of key events (D-408): the moments of truth, one row each, with who and when.
 * A key event is something that happened, not something that was tried: a game that reached its
 * end (a room, an offline game, a One a Day, a La Copa day), a cup created, joined or finished, a
 * feedback message sent. Opening a page, starting a game and leaving it halfway are not key events.
 *
 * Pure, no DOM and no Firebase, so it runs under node (`node public/panel/timeline.test.mjs`).
 *
 * Where each one comes from:
 * - rooms and offline games: `stats/<env>/days/<day>` (`rooms/<code>/end`, `live/<id>/fin`), so they
 *   follow the panel's environment, like the room log;
 * - cups: `torneos/`, read through the cup engine (`historiaCopa`), which has no environment: a lab
 *   cup carries its tag;
 * - feedback: `feedback/`, also with no environment.
 *
 * Days are Pacific days (the panel's clock, the one La Copa splits its days with): "the last 7 days"
 * are the last 7 Pacific dates, ending today in Pacific time (`pacificRange`).
 */
import { isTorneo, MODO_UNO_AL_DIA } from '../assets/js/games.js';
import { DAY, roomLog, localLog, ZONA_PANEL, diaPanel } from './aggregate.js';
import { copasDe, estadoCopa, historiaCopa, paisDe } from './copas.js';

/** The kinds, in the order the filters show them. The panel gives each its icon and name. */
export const KINDS = ['cup-game', 'room', 'offline', 'daily', 'cup-new', 'cup-join', 'cup-end', 'feedback'];

/** A day number as its calendar date ("2026-10-20"). */
const isoOf = d => new Date(d * DAY).toISOString().slice(0, 10);
const dayOfIso = iso => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);
/** Monday of that day, as a day number: day 0 was a Thursday. */
const mondayOf = d => d - ((d + 3) % 7);

/**
 * The range's day numbers (UTC days) as Pacific dates: the same length, ending on today's Pacific
 * date. In the evening, Pacific time, UTC is already on the next day, which has not happened here yet.
 */
export function pacificRange({ from, to }, now = Date.now()) {
  const shift = Math.min(0, dayOfIso(diaPanel(now)) - Math.floor(now / DAY));
  return { from: from + shift, to: to + shift };
}

/**
 * Every key event of the range, newest first. Each one: `{ at, kind, day, who: [{ name, co }],
 * game?, mode?, detail?, winner?, tie?, cup?: { code, name, lab, day }, startedAt?, text?, to? }`,
 * where `to` is the panel card it opens (`['sala', [code, day]]`).
 */
export function keyEvents({ days = {}, torneos = {}, feedback = {} } = {}, range, now = Date.now()) {
  const { from, to } = pacificRange(range, now);
  const desde = isoOf(from), hasta = isoOf(to);
  const out = [];
  const push = e => { const day = diaPanel(e.at); if (e.at && day >= desde && day <= hasta) out.push({ ...e, day }); };
  // One UTC day more on each side: a Pacific date spans two UTC days
  const span = { from: from - 1, to: to + 1 };

  // Rooms that reached an end (a winner or a tie); a room nobody else joined has none
  for (const f of roomLog(days, { ...span, soloJugadas: true })) {
    if (!f.endAt || (!f.winner && !f.empate)) continue;
    push({ at: f.endAt, kind: 'room', game: f.game, who: f.players.map(p => ({ name: p.name, co: p.co })),
      winner: f.winnerName || '', tie: f.empate, startedAt: f.at, to: ['sala', [f.code, f.day]] });
  }

  // Offline games with an ending; La Copa days are counted from the cups, not here
  for (const p of localLog(days, span)) {
    if (!p.fin || isTorneo(p.game) || p.mode === 'copa') continue;
    push({ at: p.fin.at || p.beat, kind: p.mode === MODO_UNO_AL_DIA ? 'daily' : 'offline', game: p.game, mode: p.mode,
      who: [{ name: p.name, co: p.co }], winner: p.fin.ganador, tie: p.fin.empate, detail: p.fin.detalle, startedAt: p.at, to: ['juego', [p.game]] });
  }

  // Cups: each day played, each cup created and joined, and each one that ended with a winner
  for (const L of copasDe(torneos)) {
    const c = estadoCopa(L, now);
    const cup = { code: L.code, name: c.name, lab: c.lab };
    const quien = pid => ({ name: L.players[pid]?.name || '?', co: paisDe(L, pid) });
    const { eventos } = historiaCopa(L, now);
    for (const e of eventos) {
      if (e.tipo === 'termino') {
        const startedAt = L.started[e.dia]?.[e.pid];
        push({ at: e.at, kind: 'cup-game', game: e.juego, who: [quien(e.pid)], cup: { ...cup, day: e.dia, days: L.meta.days },
          s: e.s, ms: e.ms, startedAt: typeof startedAt === 'number' ? startedAt : null, to: ['torneo', [L.code]] });
      } else if (e.tipo === 'creada') push({ at: e.at, kind: 'cup-new', who: [quien(e.pid)], cup: { ...cup, days: L.meta.days }, to: ['torneo', [L.code]] });
      else if (e.tipo === 'inscripcion') push({ at: e.at, kind: 'cup-join', who: [quien(e.pid)], cup, to: ['torneo', [L.code]] });
      // Ended on its date, with a winner: one the admin cut short, or with no points, is not a moment of truth
      else if (e.tipo === 'fin' && !L.fin && c.primero) {
        push({ at: e.at, kind: 'cup-end', who: [{ name: c.primero.name, co: c.primero.co }], cup, winner: c.primero.name,
          tie: c.primero.empatados > 1, detail: `${c.jugadores} ${c.jugadores === 1 ? 'player' : 'players'}`, to: ['torneo', [L.code]] });
      }
    }
  }

  // Feedback: the 🐞 reports and the inbox at the end of every game
  for (const [id, f] of Object.entries(feedback || {})) {
    if (!f || typeof f.at !== 'number') continue;
    push({ at: f.at, kind: 'feedback', id, who: [{ name: f.nombre || '', co: '' }], tipo: f.tipo || '', text: String(f.texto || ''), tester: f.tester || '' });
  }

  return out.sort((a, b) => b.at - a.at || KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
}

/** The period an event's day falls in: the day itself, the Monday of its week, or its month. */
export function periodOf(iso, grain = 'day') {
  if (grain === 'month') return iso.slice(0, 7);
  if (grain === 'week') return isoOf(mondayOf(dayOfIso(iso)));
  return iso;
}

/** "Tue, Oct 20", "Week of Oct 19", "Oct 2026". */
export function periodLabel(key, grain = 'day') {
  const opts = { timeZone: 'UTC' };
  if (grain === 'month') return new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-US', { ...opts, month: 'short', year: 'numeric' });
  const d = new Date(`${key}T00:00:00Z`);
  if (grain === 'week') return `Week of ${d.toLocaleDateString('en-US', { ...opts, month: 'short', day: 'numeric' })}`;
  return d.toLocaleDateString('en-US', { ...opts, weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * The range's periods, oldest first, empty ones included (a quiet week is news too), each with its
 * events counted by kind: `[{ key, label, total, byKind: { room: 2, … } }]`.
 */
export function periods(events, range, grain = 'day', now = Date.now()) {
  const { from, to } = pacificRange(range, now);
  const keys = [];
  for (let d = from; d <= to; d++) { const k = periodOf(isoOf(d), grain); if (keys[keys.length - 1] !== k) keys.push(k); }
  const rows = new Map(keys.map(key => [key, { key, label: periodLabel(key, grain), total: 0, byKind: {} }]));
  for (const e of events) {
    const row = rows.get(periodOf(e.day, grain));
    if (!row) continue;
    row.total++; row.byKind[e.kind] = (row.byKind[e.kind] || 0) + 1;
  }
  return [...rows.values()];
}

/** The Pacific hour of a moment, 0 to 23. */
export const hourOf = ts => Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: ZONA_PANEL }).format(new Date(ts)));

/** Events by Pacific hour of the day, 0 to 23: when the moments of truth happen. */
export function byHour(events) {
  const h = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0 }));
  for (const e of events) h[hourOf(e.at)].total++;
  return h;
}

/** How many of each kind: `{ room: 3, … }`, every kind present. */
export function countKinds(events) {
  const c = Object.fromEntries(KINDS.map(k => [k, 0]));
  for (const e of events) c[e.kind] = (c[e.kind] || 0) + 1;
  return c;
}
