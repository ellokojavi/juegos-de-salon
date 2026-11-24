/**
 * How the player profile is used (D-615), for the owner's 🎖️ Profile section in the panel.
 *
 * Anonymous, in the stats day (guests and players alike), by Pacific date (D-561):
 *   perfilPt/<pacific day>/<event>   a counter per event (`EVENTS`)
 *   perfilIdPt/<pacific day>/<id>    1: this browser opened the profile that day (the same random id as `activosPt/`)
 *
 * Named, only for a signed-in player and readable only by the owner (D-615, amending D-44 and D-349):
 *   perfilUso/<jid>/<YYYY-MM-DD>/<field>   a counter per field (`FIELDS`), the Pacific date
 *
 * Where the visit came from is a mark this tab leaves when the pill, its bubble or the achievement window
 * is tapped (`markVia`), read once on the profile (`takeVia`). Never a `?from=`: that is Traffic's channel.
 * The owner's own browser (not counted, D-471) and robots write nothing. Best effort: never throws.
 */
import { stats, dayPath, pacificDayOf, deviceId, esRobot, notCounted } from './transport/stats.js';
import { dayOf } from './transport/cleanup.js';
import { leerYo, jugador } from './jugador.js';

/** The anonymous events, as the rules list them. */
export const EVENTS = ['visit-guest', 'visit-signed', 'via-pill', 'via-bubble', 'via-window', 'via-link', 'via-direct',
  'tab-badges', 'tab-rankings', 'tab-settings', 'peek', 'public', 'aw-shown', 'aw-go', 'signin-start',
  'signin-profile', 'create-profile', 'signin-other', 'create-other'];
/** The named fields: visits, the three tabs, peeks, «see how others see me», the window's «see my badges», signed in and created here. */
export const FIELDS = { visit: 'v', 'tab-badges': 'b', 'tab-rankings': 'r', 'tab-settings': 's', peek: 'p', public: 'o', 'aw-go': 'w', 'signin-profile': 'i', 'create-profile': 'c' };
/** A player's counter for one day stops here (the rules cap it too). */
export const FIELD_MAX = 200;
export const VIAS = ['pill', 'bubble', 'window'];
export const VIA_KEY = 'juegos-de-salon:profile-via';
export const VIA_MS = 60 * 1000;
const PERFIL_ID_KEY = 'juegos-de-salon:profile-seen-day';
const INC = { '.sv': { increment: 1 } };

const leer = (st, k) => { try { return st?.getItem(k) ?? null; } catch (_) { return null; } };
const poner = (st, k, v) => { try { st?.setItem(k, v); } catch (_) { /* private or full */ } };
const sacar = (st, k) => { try { st?.removeItem(k); } catch (_) { /* nothing */ } };

/** The Pacific date as `YYYY-MM-DD`: the named path's day. */
export const pacificDate = ts => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

/** Is the profile this page? */
export const isProfilePath = (pathname = globalThis.location?.pathname) => /\/profile\/?(index\.html)?$/.test(String(pathname || ''));

/** The pill, its bubble or the achievement window was tapped on the way to the profile. */
export function markVia(o, sesion = globalThis.sessionStorage, now = Date.now()) {
  if (VIAS.includes(o)) poner(sesion, VIA_KEY, JSON.stringify({ o, at: now }));
}

/** Where this profile visit came from, once: the tab's fresh mark, else a link on the site, else straight in. */
export function takeVia({ sesion = globalThis.sessionStorage, now = Date.now(), referrer = globalThis.document?.referrer, host = globalThis.location?.host } = {}) {
  let o = '';
  try { const v = JSON.parse(leer(sesion, VIA_KEY) || 'null'); if (v && VIAS.includes(v.o) && now - v.at >= 0 && now - v.at < VIA_MS) o = v.o; } catch (_) { /* none */ }
  sacar(sesion, VIA_KEY);
  if (o) return o;
  try { if (referrer && host && new URL(referrer).host === host) return 'link'; } catch (_) { /* not a URL */ }
  return 'direct';
}

/** The anonymous changes for some events at `now`; unknown events are left out. */
export function eventChanges(events, now = Date.now()) {
  const pday = pacificDayOf(now);
  return Object.fromEntries([].concat(events).filter(e => EVENTS.includes(e)).map(e => [`perfilPt/${pday}/${e}`, INC]));
}

/** `perfilIdPt/<pacific day>/<id>` once a day per browser; empty when already written today or without storage. */
export function seenChange(local = globalThis.localStorage, now = Date.now()) {
  const pday = pacificDayOf(now);
  if (Number(leer(local, PERFIL_ID_KEY)) === pday) return {};
  const id = deviceId(local);
  if (!id) return {};
  poner(local, PERFIL_ID_KEY, String(pday));
  return { [`perfilIdPt/${pday}/${id}`]: 1 };
}

/** The named changes for some events: the fields they map to, for that player and Pacific date. */
export function namedChanges(jid, events, now = Date.now()) {
  if (!/^[a-z0-9]{8}$/.test(jid || '')) return {};
  const day = pacificDate(now);
  const out = {};
  for (const e of [].concat(events)) if (FIELDS[e]) out[`perfilUso/${jid}/${day}/${FIELDS[e]}`] = INC;
  return out;
}

/** May this page count? A real page, not a robot, not the owner's own browser. */
const countable = () => !!globalThis.location?.hostname && !esRobot(globalThis.navigator) && !notCounted();

/** Writes the named fields with the player's store (REST, no websocket). Capped on this phone too. */
async function named(events) {
  const yo = leerYo();
  if (!yo?.jid) return;
  const cambios = namedChanges(yo.jid, events);
  if (!Object.keys(cambios).length) return;
  const J = await jugador();
  await J.usoPerfil?.(cambios, FIELD_MAX);
}

/**
 * Counts profile events: anonymously always, and by name for a signed-in player when `withName` (the
 * profile's own events). `extra` adds raw changes (the visit's browser id). Never throws.
 */
export function trackProfile(events, { withName = true, extra = {} } = {}) {
  try {
    if (!countable()) return Promise.resolve();
    const s = stats(), now = Date.now();
    const c = { ...eventChanges(events, now), ...extra };
    const out = [];
    if (Object.keys(c).length) out.push(Promise.resolve(s.api.patch(dayPath(s.fp.env, dayOf(now)), c)).catch(() => {}));
    // The player's store is the test one on localhost and with ?test (jugador.js): nothing real is written there
    if (withName) out.push(named(events).catch(() => {}));
    return Promise.all(out).then(() => {});
  } catch (_) { return Promise.resolve(); }
}

/** The profile page opened: guest or signed, where from, this browser's day mark, and the player's visit. */
export function trackProfileVisit() {
  try {
    const signed = !!leerYo()?.jid;
    return trackProfile([signed ? 'visit-signed' : 'visit-guest', `via-${takeVia()}`, ...(signed ? ['visit'] : [])], { extra: countable() ? seenChange() : {} });
  } catch (_) { return Promise.resolve(); }
}

/** Signed in or created an account, anywhere: split by whether it was on the profile. */
export function trackAccount(kind) {
  if (kind !== 'signin' && kind !== 'create') return Promise.resolve();
  return trackProfile([`${kind}-${isProfilePath() ? 'profile' : 'other'}`], { withName: isProfilePath() });
}
