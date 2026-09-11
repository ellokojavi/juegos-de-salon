/**
 * Idioma compartido por toda la app.
 * El idioma se elige con un toggle en el menú (y en la intro de cada juego)
 * y se guarda en localStorage. Por defecto: español. Idiomas: es, en, pt (D-46).
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

/** Textos comunes (menú y elementos compartidos). */
export const COMMON = {
  es: {
    appTitle: 'Juegos de Salón',
    appSub: 'Elige un juego, juega solo o con amigos y deja que el celular guíe la partida.',
    players: 'jugadores', minutes: 'min',
    footer: 'Toma con responsabilidad y con agua a mano. Si manejas, no tomas. 🚕',
    code: 'código en GitHub', menu: 'Menú', soon: 'Próximamente',
  },
  en: {
    appTitle: 'Party Games',
    appSub: 'Pick a game, play alone or with friends and let the phone run the game.',
    players: 'players', minutes: 'min',
    footer: 'Drink responsibly and keep water nearby. If you drive, you don\'t drink. 🚕',
    code: 'code on GitHub', menu: 'Menu', soon: 'Coming soon',
  },
  pt: {
    appTitle: 'Jogos de Salão',
    appSub: 'Escolha um jogo, jogue sozinho ou com amigos e deixe o celular conduzir a partida.',
    players: 'jogadores', minutes: 'min',
    footer: 'Beba com responsabilidade e com água por perto. Se for dirigir, não beba. 🚕',
    code: 'código no GitHub', menu: 'Menu', soon: 'Em breve',
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
