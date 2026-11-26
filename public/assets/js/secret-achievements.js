/**
 * The secret achievements this phone can tell on its own, from what it keeps (play-hours.js), with no
 * network (lab flag `profile`): 🦉 night owl and the four dates. The profile's catalogue
 * (badges.js) takes their checks from here, and `stats.js`' `trackFinish` asks `dueSecret` after
 * each game, so the window that celebrates one (achievement-window.js) opens right after the game
 * that earned it, once per achievement and phone. Pure but for `readFacts`, `announced` and `markAnnounced`.
 */
import { readHours, readMarks } from './play-hours.js';

export const NIGHT_GAMES = 3;   // games between midnight and 4 in one night
const n = x => (Number.isFinite(Number(x)) ? Number(x) : 0);

/** `{ id: check(facts) → bool }`, from the phone's facts `{ hours, marks }`. */
export const LOCAL_SECRETS = {
  'night-owl': f => Object.values(f.hours || {}).some(h => n(h?.n) >= NIGHT_GAMES),
  fiestas: f => !!f.marks?.days?.fiestas,
  halloween: f => !!f.marks?.days?.halloween,
  xmas: f => !!f.marks?.days?.xmas,
  'new-year': f => !!f.marks?.days?.newyear,
};

/** The secret achievements already celebrated on this phone: `{ id: ms }`. */
export const ANNOUNCED_KEY = 'juegos-de-salon:logros-anunciados';
export function announced(storage = globalThis.localStorage) {
  try { const v = JSON.parse(storage?.getItem(ANNOUNCED_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}
export function markAnnounced(id, storage = globalThis.localStorage, now = Date.now()) {
  try { storage?.setItem(ANNOUNCED_KEY, JSON.stringify({ ...announced(storage), [id]: now })); } catch (_) { /* not kept */ }
  // On the player's account too: told once, on any phone, is told (told-sync.js)
  if (typeof window !== 'undefined' && storage === globalThis.localStorage) import('./told-sync.js').then(m => m.pushTold('a', id, now)).catch(() => {});
}

/** The phone's facts for the checks. */
export const readFacts = (storage = globalThis.localStorage) => ({ hours: readHours(storage), marks: readMarks(storage) });

/** The first local secret achievement earned and not yet celebrated, or null. Pure. */
export function dueSecret(facts = {}, done = {}) {
  for (const [id, check] of Object.entries(LOCAL_SECRETS)) {
    let got = false;
    try { got = !!check(facts); } catch (_) { got = false; }
    if (got && !done[id]) return id;
  }
  return null;
}
