/**
 * The achievements already told, on the player's account (the owner: an achievement belongs to an account and a
 * date; told once on one phone, it is told on every phone). Before a window or a «¡Nueva!» is drawn, the
 * account's marks are merged into this phone's, and this phone's marks the account lacks are uploaded:
 * `a` the windows celebrated (secret-achievements.js `announced`), `v` the badges shown on the profile
 * (`profile-badges:<jid>`). Signed out, nothing to do. Never throws.
 */
import { ANNOUNCED_KEY, announced } from './secret-achievements.js';

const SEEN = jid => `juegos-de-salon:profile-badges:${jid}`;
const BASE_KEY = 'juegos-de-salon:logros-base';
const read = (k, storage) => { try { const v = JSON.parse(storage.getItem(k) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; } };
const write = (k, v, storage) => { try { storage.setItem(k, JSON.stringify(v)); } catch (_) { /* not kept */ } };
/** `from`'s entries `into` lacks. Pure. */
export const missing = (from = {}, into = {}) => Object.fromEntries(Object.entries(from).filter(([id]) => into[id] == null));

let once = null;
/** Merges both ways, once a page (again after signing in: `fresh`). Resolves when done or after `cap` ms. */
export function syncTold({ storage = globalThis.localStorage, cap = 2500, fresh = false } = {}) {
  if (fresh) once = null;
  once ||= (async () => {
    try {
      const { jugador, leerYo } = await import('./jugador.js');
      const yo = leerYo();
      if (!yo?.jid) { once = null; return false; } // signed in later on this page: tried again
      const J = await jugador();
      const cuenta = await J.logrosContados();
      const aqui = { a: announced(storage), v: read(SEEN(yo.jid), storage) };
      const bajar = { a: missing(cuenta.a, aqui.a), v: missing(cuenta.v, aqui.v) };
      if (Object.keys(bajar.a).length) write(ANNOUNCED_KEY, { ...aqui.a, ...bajar.a }, storage);
      if (Object.keys(bajar.v).length) write(SEEN(yo.jid), { ...aqui.v, ...bajar.v }, storage);
      // Told on the account: this phone's first look has nothing left to announce of it
      if (Object.keys(cuenta.a).length + Object.keys(cuenta.v).length) { try { if (!storage.getItem(BASE_KEY)) storage.setItem(BASE_KEY, String(Date.now())); } catch (_) { /* not kept */ } }
      await J.anotarLogros({ a: missing(aqui.a, cuenta.a), v: missing(aqui.v, cuenta.v) }).catch(() => {});
      return true;
    } catch (_) { return false; }
  })();
  return Promise.race([once, new Promise(r => setTimeout(() => r(false), cap))]);
}

/** After a mark is written on this phone: up to the account at once (best effort). */
export function pushTold(tipo, id, ms = Date.now()) {
  import('./jugador.js').then(async ({ jugador, leerYo }) => { if (leerYo()) await (await jugador()).anotarLogros({ [tipo]: { [id]: ms } }); }).catch(() => {});
}
