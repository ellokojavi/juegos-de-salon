/**
 * One window per visit on the home page (D-431): the windows the home page opens on its own when it
 * loads go through this gate, which opens at most one of them, by a fixed priority:
 *
 *   1. the recap (recap.js): La Copa's of a cup this phone played (D-423), or Uno al día's season (D-424)
 *   2. the splash (splash.js, D-351): only the first campaign still to see; the next waits for the
 *      next visit (D-430's queue keeps its order)
 *   3. the install bubble (instalar.js, D-232)
 *
 * Whatever is not opened stays pending for a later visit. Windows the player opens by tapping (the
 * share sheet, the inbox, the install steps, menus) are not part of it, and neither is what is not a
 * window: the dice's arrival veil (llegada.js), Uno al día's app badge, or the lab's experiments bar
 * (`?lab`). `?recap=` and `?splash=` previews keep working as before.
 *
 * For everyone since the owner validated it in the lab (D-409, D-431).
 *
 * The choice is pure (`readPending`, `choose`), so node tests it without a DOM.
 */
import { queue, seenIds, SEEN_KEY as SPLASH_SEEN_KEY, showSplash, startSplash, loadActive } from './splash.js';
import { dueCup, startRecap, MINE_KEY, SEEN_KEY as CUP_SEEN_KEY } from './recap.js';
import { dueSeason, DAILY_KEY, SEASON_SEEN_KEY, localDate } from './daily-recap.js';
import { INSTALAR_NO_KEY, pasosDe, globoInstalar } from './instalar.js';
import { param, tiene } from './parametros.js';

/** The order, first wins. A new window the home page opens on its own goes in here. */
export const PRIORITY = ['recap', 'splash', 'install'];

const json = (raw, empty) => { try { const v = JSON.parse(raw ?? 'null'); return v ?? empty; } catch (_) { return empty; } };

/**
 * What is pending on this phone, from what it keeps (`get(key)` reads localStorage), in every format
 * it has kept: the splash's seen ids as a list or, before D-430, a bare id; the install bubble's "no
 * more" as '1'. `active` and `campaigns` default to splash.js's. `installable` says whether this phone gets the bubble at all (pasosDe).
 */
export function readPending({ get, now = Date.now(), today = localDate(now), active, campaigns, installable = false, automated = false } = {}) {
  const list = key => { const v = json(get(key), []); return Array.isArray(v) ? v : []; };
  const days = Object.keys(json(get(DAILY_KEY), {})?.dias || {});
  return {
    recap: !!dueCup({ mine: list(MINE_KEY), seen: list(CUP_SEEN_KEY), now }) || !!dueSeason({ today, days, seen: list(SEASON_SEEN_KEY) }),
    splash: queue({ ...(active ? { active } : {}), ...(campaigns ? { campaigns } : {}), seen: seenIds(get(SPLASH_SEEN_KEY)), today: new Date(now), automated }),
    install: installable && get(INSTALAR_NO_KEY) !== '1',
  };
}

/**
 * The one window to open on this visit, and what is left for later, by PRIORITY. `open` is
 * `{ kind, id? }` or null; `later`, the rest in order. A splash counts once per campaign: only the
 * first of the queue can open.
 */
export function choose(pending) {
  const all = [];
  for (const kind of PRIORITY) {
    if (kind === 'splash') for (const id of pending.splash || []) all.push({ kind, id });
    else if (pending[kind]) all.push({ kind });
  }
  return { open: all[0] || null, later: all.slice(1) };
}

/**
 * The order the gate tries them in: a recap that turns out to have nothing to show (no network, the
 * cup's data gone) gives way to the next. Only the first campaign of the queue is ever a candidate.
 */
export function candidates(pending) {
  const { open, later } = choose(pending);
  return (open ? [open, ...later] : []).filter(w => w.kind !== 'splash' || w.id === pending.splash[0]);
}

/**
 * What the home page calls once it has drawn. `T`, `url` and `tap` are the install bubble's.
 */
export async function startHomeWindows({ lang = 'es', T, url, tap, search = globalThis.location?.search ?? '' } = {}) {
  const recap = () => startRecap({ lang, search }).catch(() => false);
  const install = () => { try { return !!globoInstalar({ T, url, tap }); } catch (_) { return false; } };
  // ☕ The support card or its thank-you (`?support=`, support.js, D-449) is this visit's window
  if (param('support', search) !== null) return null;
  // A preview (`?recap=`, `?splash=`) is the owner looking at one window: it opens that one, as before
  if (param('recap', search) !== null || param('splash', search) !== null) {
    recap().then(shown => shown || startSplash({ lang, search }));
    return;
  }
  // Under the end-to-end scripts the splash never opens and the recap checks it itself (startRecap);
  // the install bubble does open, as it always did, so install-prompt.mjs still finds it
  const automated = tiene('test', search) || globalThis.navigator?.webdriver === true;
  const get = k => { try { return globalThis.localStorage?.getItem(k) ?? null; } catch (_) { return null; } };
  // The campaigns on right now are the panel's, in Firebase (D-454); the scripts never ask
  const active = automated ? [] : await loadActive();
  const pending = readPending({ get, active, installable: !!pasosDe(), automated });
  for (const w of candidates(pending)) {
    if (w.kind === 'recap' && await recap()) return w;
    // After the home page has drawn its list, so the window lands on a page that is already there
    if (w.kind === 'splash') { setTimeout(() => showSplash(w.id, { lang }), 350); return w; }
    if (w.kind === 'install' && install()) return w;
  }
  return null;
}
