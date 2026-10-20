/**
 * Whether this visitor holds a lab key (D-395): what is still in development (the home page's
 * experiments, a splash campaign's preview) turns on only for them, and everyone else sees the
 * site as it is. The same test as the lab's door (`labs-puerta.js`, D-281, D-345): on localhost
 * and Tailscale it opens by itself (the scripts, the owner); elsewhere, the key saved on this
 * phone when its link was opened in /labs/ must still be in Firebase. With no network, a saved key
 * still counts, as at the door. Asked once per page.
 */
const BASE = 'https://juegos-de-salon-default-rtdb.firebaseio.com';
export const SAVED_KEY = 'juegos-de-salon:labs-llave';
export const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$|\.ts\.net$/;

const hex = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(x => x.toString(16).padStart(2, '0')).join('');

/** The answer, with what it reads passed in so node can test it. */
export async function checkLabAccess({ host = globalThis.location?.hostname ?? '', key = null, fetchFn = globalThis.fetch } = {}) {
  if (LOCAL.test(host)) return true;
  if (!key || !globalThis.crypto?.subtle) return false;
  try {
    const r = await fetchFn(`${BASE}/labsLlaves/${await hex(key)}.json`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const label = await r.json();
    return typeof label === 'string' && label !== '';
  } catch (_) { return true; }
}

let asked = null;
/** For the page: true when this visitor may see what is in development. */
export function labAccess() {
  if (!asked) {
    let key = null;
    try { key = globalThis.localStorage?.getItem(SAVED_KEY) ?? null; } catch (_) { /* no storage */ }
    asked = checkLabAccess({ key });
  }
  return asked;
}
