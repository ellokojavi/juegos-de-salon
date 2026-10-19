/**
 * The home page's experiments (D-361, D-363, the owner's request): what is being tried on the home page
 * before it reaches players. Each one is a URL parameter the home page reads, off by default. With
 * `?lab` the home page itself draws the experiments bar (`drawBar`): one switch per entry, the language
 * and the way back to the lab. To add one: an entry here and the parameter read in public/index.html;
 * when it ships, the entry goes away and the home page does it for everyone.
 */
export const EXPERIMENTS = {
  popular: { emoji: '🔥', name: 'Populares', what: 'Los tres juegos con más partidas terminadas llevan la etiqueta 🔥 Popular.' },
  picks: { emoji: '✨', name: 'Filtros', what: 'Arriba de los tipos, dos fichas más: ✨ Nuevos y 🔥 Populares, con ⭐ Favoritos a su lado.' },
  brand: { emoji: '🎲', name: 'Título', what: 'Al bajar, el menú flotante lleva arriba el nombre Juegos de Salón; un toque vuelve arriba.' },
};

/** The home page's address in the lab: never counted (`test`), with the bar (`lab`), a language and the experiments on. */
export function homeUrl(on, lang, base = '/') {
  const q = ['test', 'lab', `lang=${lang}`, ...Object.keys(EXPERIMENTS).filter(k => on.has(k))];
  return `${base}?${q.join('&')}`;
}

/**
 * Draws the bar on the page it runs in (the home page with `?lab`). A switch or the language reloads
 * the page with the new address, so what is seen is always what that address shows a player.
 */
export function drawBar(doc = document, loc = location) {
  const q = new URLSearchParams(loc.search);
  const on = new Set(Object.keys(EXPERIMENTS).filter(k => q.has(k)));
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
  for (const [k, x] of Object.entries(EXPERIMENTS)) {
    const b = doc.createElement('button');
    b.type = 'button'; b.dataset.exp = k; b.title = x.what; b.textContent = `${x.emoji} ${x.name}`;
    b.setAttribute('aria-pressed', on.has(k) ? 'true' : 'false');
    b.addEventListener('click', () => { if (on.has(k)) on.delete(k); else on.add(k); ir(); });
    barra.append(b);
  }
  const idioma = doc.createElement('select');
  idioma.id = 'idioma'; idioma.setAttribute('aria-label', 'Idioma');
  for (const l of ['es', 'en', 'pt', 'de']) idioma.append(new Option(l.toUpperCase(), l, false, l === lang));
  idioma.addEventListener('change', ir);
  barra.append(idioma);
  doc.body.append(barra);
  return barra;
}
