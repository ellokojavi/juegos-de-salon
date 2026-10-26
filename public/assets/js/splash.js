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
 * Since D-454 the owner also runs them from the panel (📣 Campaigns, `#/campaigns`), on the phone:
 * on or off, start and end dates and their order, written to Firebase `splash/` and read by the
 * home page on each visit, with no PR. Once the panel has written, Firebase wins; while `splash/`
 * is empty or cannot be read, ACTIVE below is what holds. The campaigns themselves (texts,
 * clips) are still made here, in CAMPAIGNS, through a PR.
 * More than one can be on at once: ACTIVE is a queue, in the order they were turned on, and a player
 * with several still to see gets them in that order (D-430, the owner's request), one per visit: the
 * home page's gate (home-windows.js, D-431) shows only the first, through showSplash. Each player sees a campaign once: closing it records its id in localStorage, and it does
 * not come back. `?splash=<id>` shows any campaign on demand, on the home page or anywhere that
 * calls showSplash (the lab demo, /labs/splash/), without recording it.
 *
 * The decision of what to show is pure (queue), so node tests it without a DOM.
 */
import { param, tiene } from './parametros.js';

/** The campaigns that are on, in the order they were turned on. `from` and `until` (optional, inclusive) bound the days it shows. */
export const ACTIVE = [{ id: 'tres-juegos-demo', until: '2026-10-23' }, { id: 'tren-en-vilo-ya', until: '2026-11-09' }];

export const SEEN_KEY = 'juegos-de-salon:splash-visto';

/** Where the panel keeps each campaign's switch (D-454): `splash/<id>` = { on, order, from?, until?, at }. */
export const REMOTE = 'https://juegos-de-salon-default-rtdb.firebaseio.com/splash.json';

/**
 * Firebase's `splash/` as an ACTIVE queue: the campaigns that are on, by `order`. null when the
 * panel never wrote (or the answer is not a list of campaigns): then ACTIVE holds.
 */
export function fromRemote(val) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return null;
  return Object.entries(val)
    .filter(([, c]) => c && c.on === true)
    .sort(([a, x], [b, y]) => (Number(x.order) || 0) - (Number(y.order) || 0) || a.localeCompare(b))
    .map(([id, c]) => ({ id, ...(c.from ? { from: c.from } : {}), ...(c.until ? { until: c.until } : {}) }));
}

let remote = null;
/** The queue this visit uses: Firebase's, or ACTIVE if it does not answer in time. Asked once per page. */
export function loadActive({ fetchFn = globalThis.fetch, timeout = 2500 } = {}) {
  remote ??= (async () => {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeout);
      const r = await fetchFn(REMOTE, { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(t);
      return (r.ok && fromRemote(await r.json())) || ACTIVE;
    } catch (_) { return ACTIVE; }
  })();
  return remote;
}

/**
 * The campaigns. Each one: an id (never reused: it is what a player's phone remembers), the texts
 * in the four languages, and its items, each one a game of games.js by id (name, emoji, tagline and
 * link come from there) or its own content (`title`, `text`, `href`, and `cta` for a button that is not Play). Each item shows a few seconds
 * of play: `video` (a looping MP4, muted) with its `img` as the poster, or just `img` (a still or a
 * GIF, with `still` for reduced motion). An item with no name, text or link is a teaser: its picture
 * alone, wide (`ratio`). `hero` draws a campaign's one game big: its clip as wide as the window at its
 * `ratio`, and under it its card, with the text and Play. `langs` limits a campaign to some languages: the others get it in English
 * (the owner's request for a teaser in Spanish and English). Paths are from the site root; the clips
 * are made with marketing/splash/capture.mjs and the teasers with teaser.mjs, and each campaign is
 * kept in marketing/splash/campaigns/<id>/ (D-355).
 */
export const CAMPAIGNS = {
  'tres-juegos-demo': {
    emoji: '🎉',
    kicker: { es: 'Novedades', en: "What's new", pt: 'Novidades', de: 'Neuigkeiten' },
    title: { es: '¡Upa, papá! Tres juegos nuevos', en: 'Three new games!', pt: 'Três jogos novos!', de: 'Drei neue Spiele!' },
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
  // A teaser of 🚂 Tren en Vilo, still in the lab: a train stops at the edge of a gap where the bridge
  // should be. It says something is coming, not what: no name, no link, and the texts say nothing of
  // crossing (the owner's request: a mystery)
  'tren-en-vilo-pronto': {
    emoji: '🚂',
    langs: ['es', 'en'],
    kicker: { es: 'Muy pronto', en: 'Coming soon' },
    title: { es: 'Algo nuevo se viene…', en: 'Something new is coming…' },
    items: [{ img: 'assets/splash/bridges-teaser.gif', still: 'assets/splash/bridges-teaser.png', ratio: '8 / 5' }],
  },
  // 🚅 Tren en Vilo leaves the lab: the train the teaser left at the edge of the gap now crosses. Its
  // clip is a bridge being built and the bullet train going over it; Play opens the game
  'tren-en-vilo-ya': {
    emoji: '🚅',
    kicker: { es: '¡Nuevo!', en: 'New!', pt: 'Novo!', de: 'Neu!' },
    title: { es: '¡El tren ya cruza!', en: 'The train is crossing!', pt: 'O trem já está passando!', de: 'Der Zug fährt los!' },
    // One game, big (the owner's request): its scene as wide as the window, then its card with what it
    // is and Play
    hero: true,
    items: [{
      game: 'puentes', video: 'assets/splash/bridges.mp4', img: 'assets/splash/bridges-start.jpg', still: 'assets/splash/bridges.jpg', ratio: '72 / 73',
      text: {
        es: 'Arma un puente de vigas sobre el abismo: si aguanta, el tren cruza; si no, se cae. Ya está en Uno al día y en La Copa.',
        en: 'Build a bridge of beams over the gap: if it holds, the train crosses; if not, down it goes. Now in One a Day and The Cup too.',
        pt: 'Monte uma ponte de vigas sobre o abismo: se aguentar, o trem passa; se não, ela cai. Já está no Um por dia e na Copa.',
        de: 'Bau eine Brücke aus Balken über die Schlucht: Hält sie, fährt der Zug hinüber, sonst stürzt sie ein. Jetzt auch im Spiel des Tages und im Pokal.',
      },
    }],
  },
  // 🥂 An invitation to support the site, with a laugh: Leonardo DiCaprio raising his glass in
  // The Great Gatsby. The clip is GIPHY's, served from GIPHY (not copied into the site); its button
  // opens the support card (support.js, D-449), so it stays off while support is in the lab
  'brindis-apoyo': {
    emoji: '🥂',
    kicker: { es: 'Salud', en: 'Cheers', pt: 'Saúde', de: 'Prost' },
    title: { es: '¡Un brindis por ti!', en: 'A toast to you!', pt: 'Um brinde a você!', de: 'Ein Toast auf dich!' },
    hero: true,
    items: [{
      video: 'https://media.giphy.com/media/rY93u9tQbybks/giphy.mp4',
      img: 'https://media.giphy.com/media/rY93u9tQbybks/480w_s.jpg',
      ratio: '12 / 5',
      title: { es: 'Gracias por jugar', en: 'Thanks for playing', pt: 'Obrigado por jogar', de: 'Danke fürs Spielen' },
      text: {
        es: 'Por cada partida, cada risa y cada revancha. Juegos de Salón es gratis y lo seguirá siendo. Si quieres devolver el brindis, puedes apoyarlo desde US$1.',
        en: 'To every game, every laugh and every rematch. Party Games is free and always will be. If you would like to return the toast, you can support it from US$1.',
        pt: 'A cada partida, cada risada e cada revanche. O Jogos de Salão é grátis e sempre vai ser. Se quiser retribuir o brinde, pode apoiá-lo a partir de US$ 1.',
        de: 'Auf jede Partie, jedes Lachen und jede Revanche. Salonspiele ist kostenlos und bleibt es. Wenn du den Toast erwidern willst, kannst du es ab 1 US$ unterstützen.',
      },
      href: '?support=open',
      cta: { es: '💙 Apoyar Juegos de Salón', en: '💙 Support Party Games', pt: '💙 Apoiar o Jogos de Salão', de: '💙 Salonspiele unterstützen' },
    }],
  },
};

/** The words the window itself uses. */
const UI = {
  play: { es: 'Jugar', en: 'Play', pt: 'Jogar', de: 'Spielen' },
  dismiss: { es: 'Cerrar', en: 'Close', pt: 'Fechar', de: 'Schließen' },
  later: { es: 'Ahora no', en: 'Not now', pt: 'Agora não', de: 'Jetzt nicht' },
};

const pick = (obj, lang) => (obj && typeof obj === 'object' ? obj[lang] ?? obj.es : obj);
/** The language a campaign is shown in: the player's, or English if the campaign does not have it. */
export const campaignLang = (c, lang) => (!c?.langs || c.langs.includes(lang) ? lang : 'en');

/**
 * The campaigns the home page shows, in order: the forced id (`?splash=`) alone, always; otherwise
 * each active one that exists, has started, has not expired and this phone has not closed, in the order they
 * were turned on. `seen` is the list of ids this phone closed.
 */
export function queue({ active = ACTIVE, campaigns = CAMPAIGNS, seen = [], forced = null, today = new Date(), automated = false } = {}) {
  if (forced) return campaigns[forced] ? [forced] : [];
  if (automated) return [];
  const live = a => {
    if (!a?.id || !campaigns[a.id] || seen.includes(a.id)) return false;
    const start = a.from ? Date.parse(`${a.from}T00:00:00`) : NaN;
    if (Number.isFinite(start) && today.getTime() < start) return false;
    const end = a.until ? Date.parse(`${a.until}T23:59:59`) : NaN;
    return !(Number.isFinite(end) && today.getTime() > end);
  };
  return [...new Set((active || []).filter(live).map(a => a.id))];
}

const storage = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
/** The ids this phone closed. It used to keep only the last one, as a bare id: that reads as a list of one. */
export function seenIds(raw = (() => { try { return storage()?.getItem(SEEN_KEY) ?? null; } catch (_) { return null; } })()) {
  if (!raw) return [];
  try { const list = JSON.parse(raw); if (Array.isArray(list)) return list.filter(x => typeof x === 'string'); } catch (_) {}
  return [raw];
}
const markSeen = id => { try { const list = seenIds(); if (!list.includes(id)) storage()?.setItem(SEEN_KEY, JSON.stringify([...list, id].slice(-20))); } catch (_) {} };

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
      still: i.still ? new URL(i.still, ROOT).href : null,
      ratio: i.ratio ?? null,
      video: i.video ? new URL(i.video, ROOT).href : null,
      cta: pick(i.cta, lang) ?? null,
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
  lang = campaignLang(c, lang);
  loadStyle();
  const items = await resolve(c.items || [], lang);

  const layer = node('div', 'splash-capa');
  const backdrop = node('div', 'splash-fondo');
  const card = node('section', c.hero ? 'splash splash--hero' : 'splash');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'splash-titulo');
  card.lang = lang;

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
  const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  for (const it of items) {
    // The whole item is the way in: tapping the clip, the name or Play opens the game
    const teaser = !it.name && !it.text && !it.href;
    const a = node(it.href ? 'a' : 'div', teaser ? 'splash-item splash-teaser' : 'splash-item');
    if (it.ratio) a.style.setProperty('--ratio', it.ratio);
    if (it.href) a.href = it.href;
    if (it.video) {
      const v = node('video', 'splash-media');
      // With reduced motion, the poster: the board already solved, still (`still` when the clip has one:
      // then `img` is the clip's first frame, so nothing flashes before it plays)
      Object.assign(v, { src: it.video, muted: true, loop: true, autoplay: !still, playsInline: true, preload: still ? 'none' : 'auto' });
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      const poster = still && it.still ? it.still : it.img;
      if (poster) v.poster = poster;
      a.append(v);
    } else if (it.img) {
      const img = node('img', 'splash-media');
      img.src = still && it.still ? it.still : it.img; img.alt = ''; img.decoding = 'async';
      a.append(img);
    }
    if (teaser) { list.append(a); continue; }
    const body = node('div', 'splash-item-cuerpo');
    body.append(node('h3', null, `${it.emoji} ${it.name}`.trim()));
    if (it.text) body.append(node('p', null, it.text));
    if (it.href) body.append(node('span', 'btn btn--yellow splash-jugar', it.cta ?? `▶ ${pick(UI.play, lang)}`));
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
  // Focus goes to the window, not to "Ahora no": a focused button shows a ring the owner did not want
  card.tabIndex = -1;
  card.focus({ preventScroll: true });

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
 * What the home page calls for a preview (home-windows.js, D-431): the one in `?splash=`; with no
 * preview, the first active campaign this phone has not closed (one per visit). Never under the end-to-end scripts (`?test`, or a
 * browser driven by automation). Returns the ids it will show.
 */
export async function startSplash({ lang = 'es', search = globalThis.location?.search ?? '' } = {}) {
  const forced = param('splash', search);
  const automated = tiene('test', search) || globalThis.navigator?.webdriver === true;
  const show = ids => {
    if (!ids.length) return null;
    // After the home page has drawn its list, so the window lands on a page that is already there.
    // Only the first: one window per visit, the rest wait for the next one (D-431)
    setTimeout(() => showSplash(ids[0], { lang, record: !forced }), 350);
    return ids.slice(0, 1);
  };
  // A campaign that is not on previews only with a lab key (D-395). lab: #seccion-portada
  const active = automated ? [] : await loadActive();
  if (forced && !active.some(a => a.id === forced)) return import('./lab-access.js').then(({ labAccess }) => labAccess()).then(yes => show(yes ? queue({ forced }) : []));
  return show(queue({ active, seen: seenIds(), forced, automated }));
}
