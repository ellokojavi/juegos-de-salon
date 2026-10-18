/**
 * The home page's experiments (D-361, the owner's request): what is being tried on the home page
 * before it reaches players. Each one is a URL parameter the home page reads, off by default; the
 * lab demo (/labs/home/) draws one switch per entry. To add one: an entry here, the parameter read in
 * public/index.html, and when it ships, the entry goes away and the home page does it for everyone.
 */
export const EXPERIMENTS = {
  popular: { emoji: '🔥', name: 'Populares', what: 'Los tres juegos con más partidas terminadas llevan la etiqueta 🔥 Popular.' },
};

/** The home page's address with the experiments that are on, in a language, never counted (`test`). */
export function homeUrl(on, lang, base = '../../') {
  const q = ['test', `lang=${lang}`, ...Object.keys(EXPERIMENTS).filter(k => on.has(k))];
  return `${base}?${q.join('&')}`;
}
