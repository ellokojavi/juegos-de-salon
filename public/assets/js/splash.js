/**
 * The splash (D-351, the owner's request): a promotional window over the home page, for the
 * moments worth telling (three new games, a new mode, a novelty). It is off by default and the
 * owner turns it on for one campaign at a time:
 *
 *   node tools/agents/splash.mjs list                       the campaigns, and which one is on
 *   node tools/agents/splash.mjs on <id> [--until YYYY-MM-DD]
 *   node tools/agents/splash.mjs off
 *
 * That rewrites ACTIVE below, and the change goes out like any other (a PR with auto-merge).
 * Each player sees a campaign once: closing it records its id in localStorage, and it does not come
 * back until a different campaign is turned on. `?splash=<id>` shows any campaign on demand, on
 * the home page or anywhere that calls showSplash (the lab demo, /labs/splash/), without recording it.
 *
 * The decision of whether to show it is pure (shouldShow), so node tests it without a DOM.
 */
import { param, tiene } from './parametros.js';

/** The campaign that is on, or null. `until` (optional, inclusive) turns it off by itself. */
export const ACTIVE = { id: 'tres-juegos-demo', until: '2026-10-23' };

export const SEEN_KEY = 'juegos-de-salon:splash-visto';

/**
 * The campaigns. Each one: an id (never reused: it is what a player's phone remembers), the texts
 * in the four languages, and its items, each one a game of games.js by id (name, emoji, tagline and
 * link come from there) or its own content (`title`, `text`, `href`). Each item shows a few seconds
 * of play: `video` (a looping MP4, muted) with its `img` as the poster, or just `img` (a still or a
 * GIF). Paths are from the site root; the clips are made with marketing/splash/capture.mjs, and each campaign is kept in marketing/splash/campaigns/<id>/ (D-355).
 */
export const CAMPAIGNS = {
  'tres-juegos-demo': {
    emoji: '🎉',
    kicker: { es: 'Novedades', en: "What's new", pt: 'Novidades', de: 'Neuigkeiten' },
    title: { es: '¡Tres juegos nuevos!', en: 'Three new games!', pt: 'Três jogos novos!', de: 'Drei neue Spiele!' },
    lead: {
      es: 'Tres desafíos de lógica para jugar solo. Elige uno y empieza.',
      en: 'Three logic puzzles to play on your own. Pick one and start.',
      pt: 'Três desafios de lógica para jogar sozinho. Escolha um e comece.',
      de: 'Drei Logikrätsel für dich allein. Such dir eins aus und leg los.',
    },
    items: [
      { game: 'rutas', video: 'assets/splash/routes.mp4', img: 'assets/splash/routes.jpg' },
      { game: 'loteo', video: 'assets/splash/plots.mp4', img: 'assets/splash/plots.jpg' },
      { game: 'pintaminas', video: 'assets/splash/paint-mines.mp4', img: 'assets/splash/paint-mines.jpg' },
    ],
  },
};

/** The words the window itself uses. */
const UI = {
  play: { es: 'Jugar', en: 'Play', pt: 'Jogar', de: 'Spielen' },
  dismiss: { es: 'Cerrar', en: 'Close', pt: 'Fechar', de: 'Schließen' },
  later: { es: 'Ahora no', en: 'Not now', pt: 'Agora não', de: 'Jetzt nicht' },
};

const pick = (obj, lang) => (obj && typeof obj === 'object' ? obj[lang] ?? obj.es : obj);

/**
 * Whether the home page shows the splash: the forced id (`?splash=`) always wins; otherwise the
 * active campaign, if it exists, has not expired and this phone has not closed it.
 */
export function shouldShow({ active = ACTIVE, campaigns = CAMPAIGNS, seen = null, forced = null, today = new Date(), automated = false } = {}) {
  if (forced) return campaigns[forced] ? forced : null;
  if (automated || !active?.id || !campaigns[active.id]) return null;
  if (active.until) {
    const end = Date.parse(`${active.until}T23:59:59`);
    if (Number.isFinite(end) && today.getTime() > end) return null;
  }
  return seen === active.id ? null : active.id;
}

const storage = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
export const seenId = () => { try { return storage()?.getItem(SEEN_KEY) ?? null; } catch (_) { return null; } };
const markSeen = id => { try { storage()?.setItem(SEEN_KEY, id); } catch (_) {} };

const ROOT = new URL('../../', import.meta.url);

function loadStyle() {
  if (document.getElementById('splash-css')) return;
  const link = Object.assign(document.createElement('link'), { id: 'splash-css', rel: 'stylesheet', href: new URL('assets/css/splash.css', ROOT).href });
  document.head.append(link);
}

const node = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/** Each item as the window draws it: a game of games.js, or the campaign's own content. */
async function resolve(items, lang) {
  const needsGames = items.some(i => i.game);
  const all = needsGames ? await import('./games.js').then(m => [...m.GAMES, ...m.SUELTOS]) : [];
  return items.map(i => {
    const g = i.game ? all.find(x => x.id === i.game) : null;
    return {
      emoji: i.emoji ?? g?.emoji ?? '',
      name: pick(i.title, lang) ?? pick(g?.name, lang) ?? '',
      text: pick(i.text, lang) ?? pick(g?.tagline, lang) ?? '',
      href: i.href ? new URL(i.href, ROOT).href : g?.path ? new URL(g.path, ROOT).href : null,
      img: i.img ? new URL(i.img, ROOT).href : null,
      video: i.video ? new URL(i.video, ROOT).href : null,
    };
  });
}

/**
 * Opens the window for a campaign. `record: false` (the preview and the lab demo) does not mark it
 * as seen. Returns a promise that resolves when it closes.
 */
export async function showSplash(id, { lang = 'es', record = true, onClose } = {}) {
  const c = CAMPAIGNS[id];
  if (!c || document.querySelector('.splash-capa')) return;
  loadStyle();
  const items = await resolve(c.items || [], lang);

  const layer = node('div', 'splash-capa');
  const backdrop = node('div', 'splash-fondo');
  const card = node('section', 'splash');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'splash-titulo');

  const x = node('button', 'splash-x', '✕');
  x.type = 'button';
  x.setAttribute('aria-label', pick(UI.dismiss, lang));

  const head = node('header', 'splash-cabeza');
  if (c.emoji) head.append(node('div', 'splash-emoji', c.emoji));
  if (c.kicker) head.append(node('p', 'splash-kicker', pick(c.kicker, lang)));
  const h = node('h2', 'splash-titulo', pick(c.title, lang));
  h.id = 'splash-titulo';
  head.append(h);
  if (c.lead) head.append(node('p', 'splash-lead', pick(c.lead, lang)));

  const list = node('div', 'splash-items');
  list.style.setProperty('--n', String(Math.max(1, items.length)));
  for (const it of items) {
    // The whole item is the way in: tapping the clip, the name or Play opens the game
    const a = node(it.href ? 'a' : 'div', 'splash-item');
    if (it.href) a.href = it.href;
    if (it.video) {
      const v = node('video', 'splash-media');
      // With reduced motion, the poster: the board already solved, still
      const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      Object.assign(v, { src: it.video, muted: true, loop: true, autoplay: !still, playsInline: true, preload: still ? 'none' : 'auto' });
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      if (it.img) v.poster = it.img;
      a.append(v);
    } else if (it.img) {
      const img = node('img', 'splash-media');
      img.src = it.img; img.alt = ''; img.decoding = 'async';
      a.append(img);
    }
    const body = node('div', 'splash-item-cuerpo');
    body.append(node('h3', null, `${it.emoji} ${it.name}`.trim()));
    if (it.text) body.append(node('p', null, it.text));
    if (it.href) body.append(node('span', 'btn btn--yellow splash-jugar', `▶ ${pick(UI.play, lang)}`));
    a.append(body);
    list.append(a);
  }

  // With links to follow, the way out is quiet; a campaign with none closes with its own button
  const hasLinks = items.some(i => i.href);
  const done = node('button', hasLinks ? 'splash-luego' : 'btn btn--yellow splash-cerrar', pick(c.close, lang) ?? pick(hasLinks ? UI.later : UI.dismiss, lang));
  done.type = 'button';

  card.append(x, head, list, done);
  layer.append(backdrop, card);
  document.body.append(layer);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const before = document.activeElement;
  done.focus({ preventScroll: true });

  return new Promise(res => {
    const close = () => {
      if (record) markSeen(id);
      document.removeEventListener('keydown', onKey);
      layer.classList.add('sale');
      setTimeout(() => { layer.remove(); document.body.style.overflow = prevOverflow; before?.focus?.({ preventScroll: true }); }, 180);
      onClose?.();
      res();
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    for (const b of [x, done, backdrop]) b.addEventListener('click', close);
    // Following a game's link also counts as having seen it
    list.addEventListener('click', e => { if (e.target.closest('a') && record) markSeen(id); });
  });
}

/**
 * What the home page calls: shows the active campaign once per phone, or the one in `?splash=`.
 * Never under the end-to-end scripts (`?test`, or a browser driven by automation).
 */
export function startSplash({ lang = 'es', search = globalThis.location?.search ?? '' } = {}) {
  const forced = param('splash', search);
  const automated = tiene('test', search) || globalThis.navigator?.webdriver === true;
  const id = shouldShow({ seen: seenId(), forced, automated });
  if (!id) return null;
  // After the home page has drawn its list, so the window lands on a page that is already there
  setTimeout(() => showSplash(id, { lang, record: !forced }), 350);
  return id;
}
