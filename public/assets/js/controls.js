/**
 * The panel's switches for what is temporary on the site, beyond the splash (D-477): the 🎨 skins
 * (season.js templates) and the 🧩 site features (today ☕ Buy me a coffee). The owner sets them in
 * 📣 Campaigns; they live in Firebase `controls/`, public to read:
 *
 *   controls/skins/<id>        { mode: 'yearly' | 'dates' | 'off', from?, until?, at }
 *                              yearly: the template's own days every year (its from/to in templates.js);
 *                              dates: only from…until ('YYYY-MM-DD', both included); off: never.
 *   controls/features/<id>     { <part>: true | false, at }   e.g. support: { footer, endings }
 *
 * With nothing saved, or if Firebase does not answer, everything is as the code says. The home page
 * reads `controls/` on each visit (`loadControls`) and keeps the last answer on the device, so a game's
 * ending (which never reads Firebase for this) follows the switch from the next visit on.
 */
const KEY = 'juegos-de-salon:controls';
export const REMOTE = 'https://juegos-de-salon-default-rtdb.firebaseio.com/controls.json';

/** The last `controls/` this device saw, or {}. */
export function cachedControls(store = globalThis.localStorage) {
  try { const v = JSON.parse(store?.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}

let pending = null;
/** `controls/` from Firebase, kept on the device; the cached one if it does not answer in time. */
export function loadControls({ fetchFn = globalThis.fetch, store = globalThis.localStorage, timeout = 1500 } = {}) {
  pending ??= (async () => {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeout);
      const r = await fetchFn(REMOTE, { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (!r.ok) return cachedControls(store);
      const v = (await r.json()) || {};
      try { store?.setItem(KEY, JSON.stringify(v)); } catch (_) { /* nothing is remembered */ }
      return v;
    } catch (_) { return cachedControls(store); }
  })();
  return pending;
}

/** Whether a part of a site feature is on: on unless the panel switched it off. */
export const featureOn = (controls, id, part) => controls?.features?.[id]?.[part] !== false;

/**
 * Whether a skin is on for a day ('YYYY-MM-DD'), given its control (or none) and the yearly test
 * the template's own dates make (`yearly(day)`). Pure, for node.
 */
export function skinOn(control, day, yearly) {
  const mode = control?.mode || 'yearly';
  if (mode === 'off') return false;
  if (mode === 'dates') return !!control.from && control.from <= day && (!control.until || day <= control.until);
  return yearly(day);
}
