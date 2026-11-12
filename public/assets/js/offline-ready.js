/**
 * The home page's ☁️ button (offline mode, D-538, docs/OFFLINE.md; behind `flag('offline')`): whether
 * this phone keeps everything it needs to play with no signal, in four states drawn on the button:
 *
 * - `loading`: the service worker is storing the release; a cloud with an arrow and a ring that fills.
 * - `ready`: every file of the release's list is in its cache, checked file by file; the cloud glows with a ✓.
 * - `missing`: the storing stopped short (signal lost, no space); an amber cloud with "!", and the
 *   sheet's Reintentar asks the worker to store what is missing (`offline-retry`, sw.js).
 * - `unsupported`: the browser keeps no site (private mode, an old browser); a grey cloud, struck through.
 *
 * A tap opens a sheet (the `.hoja` of offline-sheet.js) that says what is happening in that state and
 * follows it live while open. The worker tells progress with `offline-progress` messages and keeps it
 * in its config cache (`progress`, `list`), so any page can read where it stands. While storing, the
 * open sheet shows the progress: a bar, the percentage and how many files.
 *
 * lab: #seccion-offline
 */
import { el } from './ui.js';
import { getLang } from './i18n.js';
import { pasosDe } from './instalar.js';
import { loadCss } from './load-css.js';

const CONFIG = 'jds-config';
/** The last state read on this phone: the button starts in it (✓ when it was ready), never in a loading it already finished. */
export const LAST_KEY = 'juegos-de-salon:offline-ready-last';

/** The state to draw before the check ends: the last one read here, or null (then the button waits for the check). */
export function lastState(storage = globalThis.localStorage) {
  try { const s = JSON.parse(storage.getItem(LAST_KEY) || 'null'); return ['ready', 'missing', 'unsupported'].includes(s?.state) ? s : null; } catch (_) { return null; }
}
const RAIZ = new URL('../../', import.meta.url);
/** A storing not heard from in this long stopped (the worker was killed): it is not loading any more. */
export const STALE_MS = 60_000;
/** With no list and no word from the worker after this long, nothing is being stored. */
export const NOTHING_MS = 15_000;

export const TEXTS = {
  es: {
    button: 'Juegos sin señal',
    loading: { title: 'Preparando los juegos…', body: 'Este celular está guardando los juegos para jugar sin señal.', more: 'Puedes seguir jugando mientras tanto.' },
    ready: { title: 'Listo para jugar sin señal', body: 'Este celular ya guardó los juegos que se juegan en un solo celular. Si pierdes la señal, siguen funcionando.', more: 'Las salas con varios celulares, La Copa y los rankings vuelven con la señal.' },
    missing: { title: 'Faltan algunos juegos', body: (have, total) => `Se cortó la descarga: este celular guardó ${have} de ${total} archivos.`, more: 'Toca Reintentar y deja esta página abierta un momento.', none: 'Este celular todavía no guardó los juegos.', offline: 'Sin señal no se puede seguir: vuelve a intentarlo cuando la tengas.' },
    unsupported: { title: 'Este navegador no guarda juegos', body: 'Este navegador no deja guardar sitios en el celular (puede ser el modo incógnito o un navegador antiguo).', more: 'Ábrelo en Chrome o Safari normal, o instala la app.' },
    ios: '📲 En iPhone, lo guardado dura más con la app en la pantalla de inicio: Safari puede borrar los datos de un sitio que no abres en unos días.',
    retry: 'Reintentar',
    ok: 'Entendido',
  },
  en: {
    button: 'Games with no signal',
    loading: { title: 'Getting the games ready…', body: 'This phone is saving the games to play with no signal.', more: 'You can keep playing meanwhile.' },
    ready: { title: 'Ready to play with no signal', body: 'This phone has saved the games that need only one phone. If you lose the signal, they keep working.', more: 'Rooms with several phones, La Copa and the leaderboards come back with the signal.' },
    missing: { title: 'Some games are missing', body: (have, total) => `The download was cut: this phone saved ${have} of ${total} files.`, more: 'Tap Try again and keep this page open for a moment.', none: 'This phone has not saved the games yet.', offline: 'It can\'t continue without signal: try again once you have it.' },
    unsupported: { title: 'This browser can\'t save games', body: 'This browser does not let sites be saved on the phone (it may be private mode or an old browser).', more: 'Open it in regular Chrome or Safari, or install the app.' },
    ios: '📲 On iPhone, what is saved lasts longer with the app on your home screen: Safari may clear the data of a site you have not opened for a few days.',
    retry: 'Try again',
    ok: 'Got it',
  },
  pt: {
    button: 'Jogos sem sinal',
    loading: { title: 'Preparando os jogos…', body: 'Este celular está salvando os jogos para jogar sem sinal.', more: 'Você pode continuar jogando enquanto isso.' },
    ready: { title: 'Pronto para jogar sem sinal', body: 'Este celular já salvou os jogos que se jogam em um só celular. Se você perder o sinal, eles continuam funcionando.', more: 'As salas com vários celulares, La Copa e os rankings voltam com o sinal.' },
    missing: { title: 'Faltam alguns jogos', body: (have, total) => `O download foi interrompido: este celular salvou ${have} de ${total} arquivos.`, more: 'Toque em Tentar de novo e deixe esta página aberta um momento.', none: 'Este celular ainda não salvou os jogos.', offline: 'Sem sinal não dá para continuar: tente de novo quando tiver.' },
    unsupported: { title: 'Este navegador não salva jogos', body: 'Este navegador não deixa salvar sites no celular (pode ser o modo anônimo ou um navegador antigo).', more: 'Abra no Chrome ou Safari normal, ou instale o app.' },
    ios: '📲 No iPhone, o que foi salvo dura mais com o app na tela de início: o Safari pode apagar os dados de um site que você não abre há alguns dias.',
    retry: 'Tentar de novo',
    ok: 'Entendi',
  },
};

/**
 * The state, from what the phone knows: `supported` (service workers and caches), the worker's
 * `progress`, and `have`/`total`, the release's files counted in its cache (null when there is no list yet).
 */
export function stateOf({ supported = true, progress = null, have = null, total = null, online = true, now = Date.now() } = {}) {
  if (!supported) return { state: 'unsupported' };
  if (progress?.storing && now - (progress.at || 0) < STALE_MS) return { state: 'loading', have: progress.have || 0, total: progress.total || 0 };
  if (total && have >= total) return { state: 'ready', have, total };
  if (total) return { state: 'missing', have: have || 0, total };
  // Nothing stored yet: with signal the worker is about to start; without it, nothing will come
  return online ? { state: 'loading', have: 0, total: 0 } : { state: 'missing', have: 0, total: 0 };
}

/** The sheet's lines for a state: what is happening, and what to do. */
export function linesOf(s, { lang = getLang(), online = true, steps = null } = {}) {
  const T = TEXTS[lang] || TEXTS.es;
  const ios = String(steps || '').startsWith('ios') && s.state !== 'unsupported' ? [T.ios] : [];
  // Storing: the bar and the percentage say how far it went, never a count of files (the owner, 2026-11-11)
  if (s.state === 'loading') return [T.loading.body, T.loading.more, ...ios];
  if (s.state === 'ready') return [T.ready.body, T.ready.more, ...ios];
  if (s.state === 'missing') return [s.total ? T.missing.body(s.have, s.total) : T.missing.none, online ? T.missing.more : T.missing.offline, ...ios];
  return [T.unsupported.body, T.unsupported.more];
}

const json = async r => { try { return r ? await r.json() : null; } catch (_) { return null; } };

/** Reads where this phone stands, from the worker's config cache and the release's cache. */
export async function readState({ nav = globalThis.navigator, cachesApi = globalThis.caches } = {}) {
  const supported = !!nav?.serviceWorker && !!cachesApi;
  if (!supported) return stateOf({ supported });
  const online = nav.onLine !== false;
  try {
    const config = await cachesApi.open(CONFIG);
    const progress = await json(await config.match('progress'));
    const list = await json(await config.match('list'));
    if (progress?.storing && Date.now() - (progress.at || 0) < STALE_MS) return stateOf({ progress, online });
    if (!list?.urls?.length) return stateOf({ progress, online });
    const cache = await cachesApi.open(`jds-release-${list.release}`);
    let have = 0;
    for (const u of list.urls) if (await cache.match(new URL(u, RAIZ).href)) have++;
    return stateOf({ progress, have, total: list.urls.length, online });
  } catch (_) {
    return stateOf({ supported: false });
  }
}

// The cloud, the 3d of the proposals (the owner, 2026-11-11): a cyan→lime cloud that glows when ready
const CLOUD = 'M7 19h10.5a4.5 4.5 0 0 0 .9-8.9A6.5 6.5 0 0 0 5.9 9.3 4.9 4.9 0 0 0 7 19z';
const MARK = {
  loading: '<path class="or-flecha" d="M12 9.2v5.6M9.6 12.6l2.4 2.4 2.4-2.4"/>',
  ready: '<path d="M8.8 12.6l2.4 2.4 4.6-4.6"/>',
  missing: '<path d="M12 9.6v3.6"/><circle cx="12" cy="16" r="1.1" class="or-punto"/>',
  unsupported: '<path d="M5 5l14 14"/>',
};
export function iconSvg(state) {
  return `<svg class="or-icono" viewBox="0 0 24 24" aria-hidden="true"><defs>`
    + '<linearGradient id="or-cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="or-c1"/><stop offset="1" class="or-c2"/></linearGradient>'
    + '<linearGradient id="or-ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="or-a1"/><stop offset="1" class="or-a2"/></linearGradient>'
    + (state === 'loading' ? shimmer() : '')
    + `</defs><path class="or-nube" d="${CLOUD}"/><g class="or-marca">${MARK[state] || ''}</g></svg>`;
}

/**
 * Storing: the cloud shimmers like the site's titles (`.rainbow` in base.css: yellow, pink, cyan,
 * lime), sliding across in SHIMMER_S (the owner, 2026-11-12). The button is drawn again on each progress
 * tick, so the slide starts where the clock is, never from the beginning; still with reduced motion.
 */
/** One pass of the shimmer, in seconds: brisk, like a light running over it (the owner, 2026-11-12: "más rápido y fluido"). */
export const SHIMMER_S = 2.4;
function shimmer(now = Date.now()) {
  const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const move = still ? '' : `<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="1 0" dur="${SHIMMER_S}s" begin="-${((now % (SHIMMER_S * 1000)) / 1000).toFixed(2)}s" repeatCount="indefinite"/>`;
  return '<linearGradient id="or-tg" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat">'
    + '<stop offset="0" class="or-t1"/><stop offset=".25" class="or-t2"/><stop offset=".5" class="or-t3"/><stop offset=".75" class="or-t4"/><stop offset="1" class="or-t1"/>'
    + `${move}</linearGradient>`;
}

const RING = 2 * Math.PI * 23;
function paint(btn, s, lang) {
  const T = TEXTS[lang] || TEXTS.es;
  const was = btn.dataset.state;
  btn.dataset.state = s.state;
  const p = s.total ? s.have / s.total : 0;
  // Same state, only the ring moves: the cloud is never drawn again, so its shimmer runs unbroken
  const ring = btn.querySelector('.or-lleno');
  if (was === s.state && btn.querySelector('.or-icono')) {
    ring?.setAttribute('stroke-dasharray', `${(RING * p).toFixed(1)} ${RING.toFixed(1)}`);
    return;
  }
  btn.innerHTML = iconSvg(s.state);
  if (s.state === 'loading') {
    btn.insertAdjacentHTML('afterbegin', `<svg class="or-anillo" viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="23"/><circle class="or-lleno" cx="25" cy="25" r="23" stroke-dasharray="${(RING * p).toFixed(1)} ${RING.toFixed(1)}"/></svg>`);
  }
  // The glow lights up once, with a flash, when it just finished
  if (was === 'loading' && s.state === 'ready') btn.classList.add('or-destello');
  const title = `${T.button}: ${T[s.state].title.replace(/…$/, '')}`;
  btn.setAttribute('title', title);
  btn.setAttribute('aria-label', title);
}

/** Opens the sheet for the current state; it follows the state while open. */
function openSheet({ doc, lang, get, retry, online }) {
  if (doc.getElementById('hoja-offline-ready')) return null;
  const T = TEXTS[lang] || TEXTS.es;
  const y = doc.defaultView?.scrollY || 0;
  const bodyStyle = doc.body.getAttribute('style');
  let layer = null;
  const close = () => {
    if (!layer) return;
    layer.remove(); layer = null;
    if (bodyStyle === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', bodyStyle);
    doc.defaultView?.scrollTo?.(0, y);
    doc.removeEventListener('keydown', onKey);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const icon = el('div', { class: 'or-hoja-icono' });
  const title = el('h2', { id: 'hoja-offline-ready-titulo' });
  const lines = el('div', { class: 'or-lineas' });
  const bar = el('div', { class: 'or-barra' }, el('i'));
  const pct = el('p', { class: 'or-pct', 'aria-live': 'polite' });
  const row = el('div', { class: 'btn-row' });
  const panel = el('div', { class: 'hoja hoja-offline-ready', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hoja-offline-ready-titulo', id: 'hoja-offline-ready' },
    el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }), icon, title, bar, pct, lines, row);
  const draw = s => {
    if (!layer) return;
    panel.dataset.state = s.state;
    if (panel.dataset.drawn !== s.state) { icon.innerHTML = iconSvg(s.state); panel.dataset.drawn = s.state; }
    title.textContent = T[s.state].title;
    lines.replaceChildren(...linesOf(s, { lang, online: online(), steps: pasosDe() }).filter(Boolean).map(p => el('p', {}, p)));
    bar.hidden = s.state !== 'loading';
    const p = s.total ? Math.round(100 * s.have / s.total) : 0;
    bar.firstChild.style.width = `${Math.max(p, 4)}%`;
    pct.hidden = s.state !== 'loading' || !s.total;
    pct.textContent = `${p}%`;
    const ok = el('button', { type: 'button', class: 'btn btn--yellow', onClick: close }, T.ok);
    row.replaceChildren(...(s.state === 'missing' && online()
      ? [el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-offline-retry', onClick: () => retry() }, T.retry), el('button', { type: 'button', class: 'btn btn--ghost', onClick: close }, T.ok)]
      : [ok]));
  };
  layer = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
  doc.body.append(layer);
  Object.assign(doc.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  doc.addEventListener('keydown', onKey);
  draw(get());
  panel.querySelector('.btn')?.focus?.();
  return { panel, draw, isOpen: () => !!layer };
}

/**
 * The button, for the home page's bar. Empty and hidden until the flag says offline mode is on for
 * this visitor; then it draws its state and keeps it current.
 */
export function offlineReadyButton({ doc = globalThis.document, lang = getLang(), nav = globalThis.navigator, tap = () => {} } = {}) {
  const btn = el('button', { type: 'button', class: 'icon-btn offline-ready', hidden: true });
  let current = lastState();
  let sheet = null;
  // A tester's pretend state (the T tab): while set, what the phone really keeps is not drawn
  let demo = null;
  const draw = s => { current = s; paint(btn, s, lang); if (sheet?.isOpen()) sheet.draw(s); };
  const show = s => {
    if (demo) return;
    btn.hidden = false;
    draw(s);
    try { globalThis.localStorage?.setItem(LAST_KEY, JSON.stringify(s)); } catch (_) { /* no storage */ }
  };
  // Nothing known yet and nothing heard from the worker in a while: it is not storing, so the sheet
  // offers Reintentar instead of a ring that never fills
  const born = Date.now();
  const settle = s => (s.state === 'loading' && !s.total && Date.now() - born > NOTHING_MS ? { state: 'missing', have: 0, total: 0 } : s);
  const refresh = () => readState({ nav }).then(s => {
    show(settle(s));
    if (s.state === 'loading' && !s.total) setTimeout(refresh, NOTHING_MS + 500);
  }).catch(() => {});
  const pretend = state => {
    clearInterval(demo); demo = null;
    if (!state) { refresh(); return; }
    if (state !== 'loading') { demo = -1; draw(state === 'missing' ? { state, have: 291, total: 318 } : { state, have: 318, total: 318 }); return; }
    // Storing: the ring and the sheet fill in about six seconds, then ready with its flash
    let have = 0;
    draw({ state: 'loading', have, total: 318 });
    demo = setInterval(() => {
      have = Math.min(318, have + 16);
      if (have < 318) { draw({ state: 'loading', have, total: 318 }); return; }
      clearInterval(demo); demo = -1; draw({ state: 'ready', have, total: 318 });
    }, 300);
  };
  const retry = () => {
    if (demo) { pretend('loading'); return; }
    show({ state: 'loading', have: current?.have || 0, total: current?.total || 0 });
    nav.serviceWorker?.ready?.then(r => r.active?.postMessage({ type: 'offline-retry' })).catch(() => {});
    // No word from the worker in a while: read again, so the sheet never spins forever
    setTimeout(refresh, 8000);
  };
  btn.addEventListener('click', () => { tap(); sheet = openSheet({ doc, lang, get: () => current || { state: 'loading', have: 0, total: 0 }, retry, online: () => nav.onLine !== false }) || sheet; refresh(); });
  import('./flags.js').then(m => m.flag('offline')).then(on => {
    if (!on) return;
    loadCss(new URL('../css/offline-ready.css', import.meta.url));
    // The last state read here draws at once; with none yet, the button shows when the check ends,
    // so a phone that already keeps everything never flashes the loading ring on its way back home
    if (current) { btn.hidden = false; paint(btn, current, lang); }
    refresh();
    nav.serviceWorker?.addEventListener?.('message', e => {
      if (e.data?.type !== 'offline-progress') return;
      if (e.data.storing) show({ state: 'loading', have: e.data.have || 0, total: e.data.total || 0 });
      else refresh();
    });
    globalThis.addEventListener?.('online', refresh);
    globalThis.addEventListener?.('offline', refresh);
    // The T tab, for testers: one button per state, to see each one without cutting the network
    import('./tester-ribbon.js').then(({ setTesterContext }) => setTesterContext(testerControls(pretend))).catch(() => {});
  }).catch(() => {});
  return btn;
}

/** The tester's buttons: the four states and back to the real one (labels for testers, like the tab's other controls). */
export const TESTER_STATES = [['loading', '⏳ Cargando'], ['ready', '✅ Listo'], ['missing', '⚠️ Falta algo'], ['unsupported', '🚫 No se puede'], [null, '↩️ Estado real']];
export function testerControls(pretend) {
  const buttons = TESTER_STATES.map(([state, label]) => el('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'data-state': state || 'real', onClick: () => pretend(state) }, label));
  return el('div', { class: 'tr-sim', id: 'tr-offline-ready' }, el('small', {}, '☁️ Estados de la nube'), el('div', { class: 'tr-or-grid' }, ...buttons));
}
