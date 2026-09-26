/**
 * Idioma compartido por toda la app.
 * El idioma se elige con un toggle en el menú (y en la intro de cada juego)
 * y se guarda en localStorage. Por defecto: español. Idiomas: es, en, pt (D-47).
 */
import { el } from './ui.js';

const KEY = 'juegos-de-salon:lang';
export const LANGS = ['es', 'en', 'pt'];

export function getLang() {
  try { const v = localStorage.getItem(KEY); if (LANGS.includes(v)) return v; } catch (_) { /* nada */ }
  return 'es';
}

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  try { localStorage.setItem(KEY, lang); } catch (_) { /* nada */ }
  document.documentElement.lang = lang;
}

/**
 * El idioma también puede venir en el link: `juegosdesalon.cl/?lang=pt`, o pegado a la
 * invitación de una sala, `/dudo/?sala=WFBN&lang=pt`. Quien comparte elige el idioma con el que
 * va a llegar el que recibe, que es lo mismo que hace el toggle pero para otra persona: sigue
 * sin detectarse nada del navegador (D-47, D-74).
 *
 * Se aplica al cargar cualquier página, se guarda como cualquier elección, y el parámetro se
 * saca de la barra de direcciones: lo que circula es la URL de siempre y el `?sala=` queda
 * intacto.
 */
function idiomaDeLaUrl() {
  try {
    const url = new URL(location.href);
    const pedido = (url.searchParams.get('lang') || '').toLowerCase();
    if (!LANGS.includes(pedido)) return;
    setLang(pedido);
    url.searchParams.delete('lang');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch (_) { /* una URL rara no puede dejar la app sin idioma */ }
}
idiomaDeLaUrl();

/** La app en la web. Las puertas por idioma son /pt/ y /en/ (D-74). */
export const SITIO = 'https://juegosdesalon.cl/';

/**
 * La portada para compartir, en el idioma de quien comparte: la de siempre, `/pt/` o `/en/`.
 * Es la misma idea que `withLang` —quien manda el link elige con qué idioma llega— pero con
 * las puertas, que son las que traen su propia tarjeta social en ese idioma (D-74).
 */
export const homeUrl = (lang = getLang()) => SITIO + (lang === 'es' ? '' : `${lang}/`);

/**
 * Un link para compartir, con el idioma pegado si no es el de siempre. Así el que recibe la
 * invitación abre la app en el mismo idioma en que se la mandaron, sin tocar el toggle.
 */
export function withLang(url, lang = getLang()) {
  if (lang === 'es' || !LANGS.includes(lang)) return url;
  return url + (url.includes('?') ? '&' : '?') + `lang=${lang}`;
}

/** Textos comunes (menú y elementos compartidos). */
export const COMMON = {
  es: {
    appTitle: 'Juegos de Salón',
    appSub: 'Juegos tradicionales llevados a tu celular para pasar el tiempo solo o con amigos.',
    players: 'jugadores', minutes: 'min',
    footer: 'Toma con responsabilidad y con agua a mano. Si manejas, no tomas. 🚕',
    player: 'jugador',
    // Los filtros de la portada (D-141)
    filters: 'Filtrar juegos', filterAll: 'Todos', filterSolo: 'Solo', filterGroup: 'Con amigos',
    shown: 'Se ven {n} de {total} juegos.', clearFilters: 'Quitar filtros',
    noMatch: 'No hay juegos con esos filtros. Prueba quitando alguno.',
    onlySpanish: 'En español',
    code: 'código en GitHub', menu: 'Menú', soon: 'Próximamente', or: 'o',
    share: 'Compartir Juegos de Salón',
    shareText: 'Juegos tradicionales para jugar con amigos desde el celular. Gratis, sin instalar y sin cuenta.',
    // La invitación a una sala: quién invita, a qué y adónde. Es el texto que más se lee de
    // toda la app, porque llega por WhatsApp a gente que todavía no la conoce.
    invite: '{name} te invita a jugar {game} en juegosdesalon.cl - Sala: {code}',
  },
  en: {
    appTitle: 'Party Games',
    appSub: 'Traditional games brought to your phone, to pass the time alone or with friends.',
    players: 'players', minutes: 'min',
    footer: 'Drink responsibly and keep water nearby. If you drive, you don\'t drink. 🚕',
    player: 'player',
    filters: 'Filter games', filterAll: 'All', filterSolo: 'Solo', filterGroup: 'With friends',
    shown: 'Showing {n} of {total} games.', clearFilters: 'Clear filters',
    noMatch: 'No games match those filters. Try removing one.',
    onlySpanish: 'In Spanish',
    code: 'code on GitHub', menu: 'Menu', soon: 'Coming soon', or: 'or',
    share: 'Share Party Games',
    shareText: 'Traditional games to play with friends from your phone. Free, no install, no account.',
    invite: '{name} invites you to play {game} at juegosdesalon.cl - Room: {code}',
  },
  pt: {
    appTitle: 'Jogos de Salão',
    appSub: 'Jogos tradicionais trazidos pro seu celular, pra passar o tempo sozinho ou com amigos.',
    players: 'jogadores', minutes: 'min',
    footer: 'Beba com responsabilidade e com água por perto. Se for dirigir, não beba. 🚕',
    player: 'jogador',
    filters: 'Filtrar jogos', filterAll: 'Todos', filterSolo: 'Sozinho', filterGroup: 'Com amigos',
    shown: 'Mostrando {n} de {total} jogos.', clearFilters: 'Limpar filtros',
    noMatch: 'Nenhum jogo com esses filtros. Tente tirar algum.',
    onlySpanish: 'Em espanhol',
    code: 'código no GitHub', menu: 'Menu', soon: 'Em breve', or: 'ou',
    share: 'Compartilhar Jogos de Salão',
    shareText: 'Jogos tradicionais para jogar com amigos pelo celular. De graça, sem instalar e sem conta.',
    invite: '{name} te convida pra jogar {game} em juegosdesalon.cl - Sala: {code}',
  },
};

/** Devuelve `obj[lang]` si es un objeto por idioma; si no, el valor tal cual. */
export function pickLang(obj, lang = getLang()) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && (lang in obj)) return obj[lang];
  return obj;
}

/**
 * Toggle ES / EN / PT. `onChange(lang)` se llama tras guardar el idioma nuevo.
 * Por defecto recarga la página para que todo se re-renderice con el idioma elegido.
 */
export function langToggle(onChange = () => location.reload()) {
  const current = getLang();
  const wrap = el('div', { class: 'lang-toggle', role: 'group', 'aria-label': 'Idioma / Language / Idioma' });
  const labels = { es: '🇨🇱 ES', en: '🇬🇧 EN', pt: '🇧🇷 PT' };
  for (const lang of LANGS) {
    wrap.append(el('button', {
      type: 'button', class: lang === current ? 'on' : '', 'aria-pressed': lang === current ? 'true' : 'false',
      onClick: () => { if (lang === getLang()) return; setLang(lang); onChange(lang); },
    }, labels[lang]));
  }
  return wrap;
}

/** Aplica traducciones a elementos con data-i18n (texto) o data-i18n-html (HTML). */
export function applyStatic(dict) {
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const v = dict[node.dataset.i18n]; if (v !== undefined) node.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(node => {
    const v = dict[node.dataset.i18nHtml]; if (v !== undefined) node.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    const v = dict[node.dataset.i18nPlaceholder]; if (v !== undefined) node.placeholder = v;
  });
}
