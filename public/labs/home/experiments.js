/**
 * The home page's experiments (D-361, D-363, the owner's request): what is being tried on the home page
 * before it reaches players. Each one is a URL parameter the home page reads, off by default. With
 * `?lab` the home page itself draws the experiments bar (`drawBar`): one checkbox per entry (none, one or several on at once,
 * the newest first and on when the lab opens it, D-399), the language
 * and the way back to the lab. To add one: an entry here and the parameter read in public/index.html (an entry with
 * `param` and `value` is turned on as `?param=value`, like the splash campaigns);
 * when it ships, the entry goes away and the home page does it for everyone.
 */
import { CAMPAIGNS } from '../../assets/js/splash.js';
import { TEMPLATES } from '../../assets/js/season.js';

export const EXPERIMENTS = {
  // Shipped to everyone: 🔥 Populares (`popular`), ✨ Filtros (`picks`) and 🎲 Título (`brand`) in D-369,
  // 🔎 Buscar (`search`) in D-403.
  // `built`: the day it was last built or changed; the bar opens with the newest on (D-399)
  // The promotional splash (D-351): one box per campaign, shown with `?splash=<id>` (one at a time,
  // so ticking one unticks the others). With it, the window opens over the home page on every load.
  // The seasonal templates (D-457): one box per template, shown on any day with `?season=<id>`
  ...Object.fromEntries(Object.entries(TEMPLATES).map(([id, x]) => [`season:${id}`,
    { built: x.built, emoji: x.icon?.emoji || '📅', name: `Temporada ${id}`, what: 'Los toques de una fecha en la portada y Rankings.', param: 'season', value: id }])),
  ...Object.fromEntries(Object.entries(CAMPAIGNS).map(([id, c]) => [`splash:${id}`,
    { built: c.built || '2026-10-18', emoji: c.emoji || '🎉', name: Object.keys(CAMPAIGNS).length > 1 ? `Splash ${id}` : 'Splash', what: 'La ventana de novedades sobre la portada.', param: 'splash', value: id }])),
};

/**
 * The experiment built last (D-399, the owner's request): `/labs/home/` opens the home page with it
 * on, and the others are ticked on top of it from the bar. Between two of the same day, the first listed.
 */
export function latest(experiments = EXPERIMENTS) {
  return Object.entries(experiments).reduce((best, [k, x]) => (!best || (x.built || '') > (experiments[best].built || '') ? k : best), null);
}

const paramOf = k => EXPERIMENTS[k].param || k;
/** The experiments an address has on. */
export function experimentsOn(search) {
  const q = new URLSearchParams(search);
  return new Set(Object.keys(EXPERIMENTS).filter(k => { const x = EXPERIMENTS[k]; return x.value ? q.get(paramOf(k)) === x.value : q.has(k); }));
}

/** The home page's address in the lab: never counted (`test`), with the bar (`lab`), a language and the experiments on. */
export function homeUrl(on, lang, base = '/') {
  const q = ['test', 'lab', `lang=${lang}`, ...Object.keys(EXPERIMENTS).filter(k => on.has(k)).map(k => EXPERIMENTS[k].value ? `${paramOf(k)}=${encodeURIComponent(EXPERIMENTS[k].value)}` : k)];
  return `${base}?${q.join('&')}`;
}

/**
 * Draws the bar on the page it runs in (the home page with `?lab`): ‹ Lab, a checkbox per experiment
 * (none, one or several at once) and the language. A box or the language reloads the page with the
 * new address, so what is seen is always what that address shows a player.
 */
export function drawBar(doc = document, loc = location) {
  const q = new URLSearchParams(loc.search);
  const on = experimentsOn(loc.search);
  const lang = ['es', 'en', 'pt', 'de'].includes(q.get('lang')) ? q.get('lang') : (doc.documentElement.lang || 'es').slice(0, 2);
  const ir = () => loc.replace(homeUrl(on, idioma.value, loc.pathname));
  const css = doc.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL('../experiments.css', import.meta.url).href;
  doc.head.append(css);
  const barra = doc.createElement('div');
  barra.className = 'demo-barra'; barra.id = 'barra';
  const volver = doc.createElement('a');
  volver.href = new URL('../', import.meta.url).href; volver.textContent = '‹ Lab';
  barra.append(volver);
  // The newest first, so the one the lab opened with leads the bar
  for (const [k, x] of Object.entries(EXPERIMENTS).sort(([, a], [, b]) => (b.built || '').localeCompare(a.built || ''))) {
    const caja = doc.createElement('label');
    caja.className = 'demo-exp'; caja.title = x.what;
    const box = doc.createElement('input');
    box.type = 'checkbox'; box.dataset.exp = k; box.checked = on.has(k);
    box.addEventListener('change', () => {
      if (box.checked) {
        // Experiments that share a parameter (the splash campaigns) go one at a time
        for (const o of [...on]) if (paramOf(o) === paramOf(k)) on.delete(o);
        on.add(k);
      } else on.delete(k);
      ir();
    });
    caja.append(box, doc.createTextNode(` ${x.emoji} ${x.name}`));
    barra.append(caja);
  }
  const idioma = doc.createElement('select');
  idioma.id = 'idioma'; idioma.setAttribute('aria-label', 'Idioma');
  for (const l of ['es', 'en', 'pt', 'de']) idioma.append(new Option(l.toUpperCase(), l, false, l === lang));
  idioma.addEventListener('change', ir);
  barra.append(idioma);
  doc.body.append(barra);
  return barra;
}
