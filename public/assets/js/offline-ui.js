/**
 * What offline mode shows (D-538, docs/OFFLINE.md, PR 4), on every page while the flag `offline` is
 * on and connection.js says offline. Nothing is added while online.
 *
 * - **Dimmed, tagged "📡 Con señal"**: every link to a page of the site the phone does not keep
 *   offline (La Copa, Rankings, /privacy/…; the kept ones are the offline-capable games and the home
 *   page) and every game's two-phone mode (`.mode[data-mode="online"]`). They stay in place; a tap
 *   says in one line why, instead of opening.
 * - **The chip** "📴 Sin conexión · 2 por subir": one small pill at the top of the page, in its flow (it never covers the top bar), with how
 *   many finished games wait to upload (jugador.js's pending queue).
 *
 * The page's own code is not touched: one class on <html> and the CSS in offline.css do the dimming,
 * and one click listener in the capture phase stops the taps.
 */
import { COMMON, getLang } from './i18n.js';
import { GAMES, SUELTOS, offlineOk, OFFLINE_PAGES } from './games.js';
import { loadCss } from './load-css.js';

export const PENDING_KEY = 'juegos-de-salon:jugador:pendientes';
const ROOT = new URL('../../', import.meta.url);

/** The site's paths a phone keeps offline: the home page, OFFLINE_PAGES (Uno al día) and each offline-capable game's page. */
export const KEPT = new Set(['', ...OFFLINE_PAGES.map(p => p.replace(/\/$/, '')), ...[...GAMES, ...SUELTOS].filter(g => offlineOk(g) && g.path).map(g => g.path.replace(/\/$/, ''))]);

/** The games' own pages: they keep their colours offline; every other page takes the offline palette (PR 8). */
export const GAME_PATHS = new Set([...GAMES, ...SUELTOS].filter(g => g.path).map(g => g.path.replace(/^\/|\/$/g, '')));
/** Whether `pathname` is a game's page, under the site's root. */
export function isGamePage(pathname = globalThis.location?.pathname || '/', root = ROOT) {
  const p = pathname.startsWith(root.pathname) ? pathname.slice(root.pathname.length) : pathname.replace(/^\//, '');
  const path = p.replace(/index\.html$/, '').replace(/\/$/, '');
  return [...GAME_PATHS].some(g => g && (path === g || path.startsWith(`${g}/`)));
}

/** Whether a link needs signal: a page of this site that is not kept offline. Anchors and other sites never. */
export function needsSignal(href, { root = ROOT, base = root } = {}) {
  let u;
  try { u = new URL(href, base); } catch (_) { return false; }
  if (u.origin !== root.origin || !u.pathname.startsWith(root.pathname)) return false;
  const path = u.pathname.slice(root.pathname.length).replace(/index\.html$/, '').replace(/\/$/, '');
  if (/\.\w+$/.test(path)) return false;   // a file, not a page
  return !KEPT.has(path);
}

export function pendingCount(storage = globalThis.localStorage) {
  try { return (JSON.parse(storage?.getItem(PENDING_KEY) || '[]') || []).length; } catch (_) { return 0; }
}

export function chipText(n, lang = getLang()) {
  const T = (COMMON[lang] || COMMON.es).offline;
  return n > 0 ? `📴 ${T.chip} · ${T.pending.replace('{n}', n)}` : `📴 ${T.chip}`;
}

/**
 * The toast when queued games upload (D-538, PR 5): how many went, and if any did not, how many and
 * why. Empty when there is nothing to say. `r` is jugador.js's `pendientes-subidas` detail.
 */
export function uploadText(r, lang = getLang()) {
  const T = (COMMON[lang] || COMMON.es).offline;
  const out = [];
  if (r?.sent) out.push(r.sent === 1 ? T.uploaded1 : T.uploaded.replace('{n}', r.sent));
  for (const [k, t] of [['old', T.lostOld], ['full', T.lostFull], ['refused', T.lostRefused]]) if (r?.[k]) out.push(t.replace('{n}', r[k]));
  return out.join(' ');
}

/** Marks what needs signal under `scope`: `.needs-signal` and the tag text, read by offline.css. */
export function mark(scope, { lang = getLang(), root = ROOT } = {}) {
  const tag = `📡 ${(COMMON[lang] || COMMON.es).offline.tag}`;
  const found = [];
  for (const a of scope.querySelectorAll('a[href]')) if (needsSignal(a.getAttribute('href'), { root, base: a.baseURI || root }) && !a.closest('.offline-chip')) found.push(a);
  for (const b of scope.querySelectorAll('.mode[data-mode="online"]')) found.push(b);
  for (const e of found) {
    e.classList.add('needs-signal');
    // The tag only on the outermost dimmed thing, and only where it fits: a round icon button (🏅)
    // or a button inside a dimmed card is dimmed without a tag of its own
    const inside = e.parentElement?.closest('.needs-signal');
    const wide = !e.getBoundingClientRect || e.getBoundingClientRect().width >= 140;
    if (!inside && wide) e.dataset.signalTag = tag; else delete e.dataset.signalTag;
  }
  return found;
}

let started = null;
export function startOfflineUi({ connection, doc = globalThis.document, win = globalThis.window, storage = globalThis.localStorage, lang = getLang() } = {}) {
  if (started) return started;   // once per page, however many times it is asked
  loadCss(new URL('../css/offline.css', import.meta.url));
  const html = doc.documentElement;
  let chip = null;
  let observer = null;
  let toastTimer = null;

  const drawChip = () => { if (chip) chip.textContent = chipText(pendingCount(storage), lang); };

  function toast(text = (COMMON[lang] || COMMON.es).offline.needsSignal, ms = 3200) {
    let t = doc.querySelector('.offline-toast');
    if (!t) { t = doc.createElement('div'); t.className = 'offline-toast'; t.setAttribute('role', 'status'); doc.body.append(t); }
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }
  // Queued games uploaded (jugador.js): one toast, online or not, and the chip's count goes down
  win.addEventListener('pendientes-subidas', e => {
    drawChip();
    const text = uploadText(e.detail, lang);
    if (text) toast(text, 5000);
  });

  // A tap on something that needs signal says why, in the capture phase so the page never sees it
  doc.addEventListener('click', e => {
    if (!html.classList.contains('offline')) return;
    const hit = e.target.closest?.('.needs-signal');
    if (!hit) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    toast();
  }, true);

  function apply(mode) {
    const off = mode === 'offline';
    html.classList.toggle('offline', off);
    html.classList.toggle('offline-shell', off && !isGamePage(win.location?.pathname));
    if (off) {
      mark(doc, { lang });
      // In the page's flow, first thing: it pushes the screen down a line instead of covering its top bar
      chip ||= doc.querySelector('.offline-chip');
      if (!chip) { chip = doc.createElement('div'); chip.className = 'offline-chip'; chip.setAttribute('role', 'status'); doc.body.prepend(chip); }
      drawChip();
      // The first time on this phone, one sheet says what works and what happens to the scores (PR 6)
      import('./offline-sheet.js').then(m => m.showOfflineSheetOnce({ doc, storage, lang })).catch(() => {});
      // Screens drawn later (a game's modes, the home page's cards) are marked as they appear
      observer ||= new win.MutationObserver(() => mark(doc, { lang }));
      // Once the page has settled: a link drawn before its layout (a card's hidden overlay) loses a tag it has no room for
      setTimeout(() => mark(doc, { lang }), 1200);
      observer.observe(doc.body, { childList: true, subtree: true });
    } else {
      observer?.disconnect();
      chip?.remove(); chip = null;
      doc.querySelector('.offline-toast')?.remove();
    }
  }

  win.addEventListener('storage', e => { if (e.key === PENDING_KEY) drawChip(); });
  connection.onChange(apply);
  apply(connection.mode());
  return (started = { apply, drawChip });
}
