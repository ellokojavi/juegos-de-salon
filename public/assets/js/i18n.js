/**
 * Idioma compartido por toda la app.
 * El idioma se elige con un toggle en el menú (y en la intro de cada juego)
 * y se guarda en localStorage. Por defecto: español. Idiomas: es, en, pt (D-47) y de (D-197).
 */
import { el } from './ui.js';

const KEY = 'juegos-de-salon:lang';

/** Todos los idiomas que tienen diccionario. Las pruebas de paridad los recorren todos (C-3). */
export const IDIOMAS = ['es', 'en', 'pt', 'de'];

/**
 * Los idiomas que están en el laboratorio (D-191): tienen sus textos, pero solo se ofrecen en el
 * dispositivo que entró por `/labs/<idioma>/` o por un link con `?lang=<idioma>`. Ahí quedan
 * marcados en `LABS_KEY`; en todos los demás la app sigue con los idiomas publicados.
 *
 * Hoy no hay ninguno: el alemán salió del laboratorio (D-197). El mecanismo queda para el
 * próximo idioma, que entra por aquí igual que entró el alemán.
 */
export const EN_LABS = [];
export const LABS_KEY = 'juegos-de-salon:labs-idioma';

function idiomaDeLabs() {
  try {
    const pedido = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    if (EN_LABS.includes(pedido)) localStorage.setItem(LABS_KEY, pedido);
    const v = localStorage.getItem(LABS_KEY);
    return EN_LABS.includes(v) ? v : '';
  } catch (_) { return ''; }
}
/** El idioma del laboratorio activo en este dispositivo, o '' si no hay. */
export const LABS_IDIOMA = idiomaDeLabs();

/** Los idiomas que se ofrecen aquí: los de siempre y, en el laboratorio, el suyo. */
export const LANGS = IDIOMAS.filter(l => !EN_LABS.includes(l) || l === LABS_IDIOMA);

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
 * invitación de una sala, `/liars-dice/?sala=WFBN&lang=pt`. Quien comparte elige el idioma con el que
 * va a llegar el que recibe, que es lo mismo que hace el toggle pero para otra persona: sigue
 * sin detectarse nada del navegador (D-47, D-74).
 *
 * Se aplica al cargar cualquier página, se guarda como cualquier elección, y el parámetro se
 * saca de la barra de direcciones: lo que circula es la URL de siempre y el `?sala=` queda
 * intacto.
 */
/**
 * La búsqueda sin el `lang=`, tal como venía. No se rearma con URLSearchParams: eso le pega un
 * "=" a cada parámetro suelto y `/cup/?pirata&lang=pt` quedaba en `?pirata=`, que La Copa ya no
 * reconoce como el link de la copa (D-170).
 */
export const sinLang = search => {
  const resto = String(search || '').replace(/^\?/, '').split('&').filter(p => p && !/^lang=/i.test(p));
  return resto.length ? `?${resto.join('&')}` : '';
};

function idiomaDeLaUrl() {
  try {
    const pedido = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    if (!LANGS.includes(pedido)) return;
    setLang(pedido);
    history.replaceState(null, '', location.pathname + sinLang(location.search) + location.hash);
  } catch (_) { /* una URL rara no puede dejar la app sin idioma */ }
}
idiomaDeLaUrl();

// En el laboratorio, cada página suma sus pestañas 🧪 y 🐞 y no deja que la navegación se salga
if (LABS_IDIOMA && typeof document !== 'undefined') {
  import('./labs-idioma.js').then(m => m.iniciarLabs(LABS_IDIOMA)).catch(() => {});
}

/** La app en la web. Las puertas por idioma son /pt/, /en/ y /de/ (D-74, D-197). */
export const SITIO = 'https://juegosdesalon.cl/';

/**
 * La portada para compartir, en el idioma de quien comparte: la de siempre, `/pt/`, `/en/` o `/de/`.
 * Es la misma idea que `withLang` —quien manda el link elige con qué idioma llega— pero con
 * las puertas, que son las que traen su propia tarjeta social en ese idioma (D-74).
 */
export const homeUrl = (lang = getLang()) => SITIO + (lang === 'es' ? '' : EN_LABS.includes(lang) ? `labs/${lang}/` : `${lang}/`);

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
    // Los filtros de la portada (D-142)
    filters: 'Filtrar juegos',
    shown: 'Se ven {n} de {total} juegos.', clearFilters: 'Ver todos',
    onlySpanish: 'En español',
    code: 'código en GitHub', menu: 'Menú', soon: 'Próximamente', or: 'o',
    share: 'Compartir Juegos de Salón',
    shareText: 'Juegos tradicionales para jugar con amigos desde el celular. Gratis, sin instalar y sin cuenta.',
    // La invitación a una sala: quién invita, a qué y adónde. Es el texto que más se lee de
    // toda la app, porque llega por WhatsApp a gente que todavía no la conoce.
    // Con la cabecera de todo lo que se comparte (D-165): "🃏 *Julepe* · Sala WFBN"
    invite: '{emoji} *{game}* · Sala {code}\n\n👋 {name} te invita a jugar en juegosdesalon.cl.',
    // El resultado de jugar solo un juego (D-165): el texto y la imagen dicen lo mismo
    shareResult: '📤 Compartir mi resultado',
    shareSoloContext: 'Jugando solo',
    shareSoloCta: '🤔 ¿Me ganas? Se juega gratis desde el celular:',
    shareSoloImage: '🤔 ¿Me ganas?',
    shareCopied: '¡Copiado! Pégalo en el chat.',
    shareDownloaded: 'La imagen se descargó y el texto quedó copiado.',
  },
  en: {
    appTitle: 'Party Games',
    appSub: 'Traditional games brought to your phone, to pass the time alone or with friends.',
    players: 'players', minutes: 'min',
    footer: 'Drink responsibly and keep water nearby. If you drive, you don\'t drink. 🚕',
    player: 'player',
    filters: 'Filter games',
    shown: 'Showing {n} of {total} games.', clearFilters: 'Show all',
    onlySpanish: 'In Spanish',
    code: 'code on GitHub', menu: 'Menu', soon: 'Coming soon', or: 'or',
    share: 'Share Party Games',
    shareText: 'Traditional games to play with friends from your phone. Free, no install, no account.',
    invite: '{emoji} *{game}* · Room {code}\n\n👋 {name} invites you to play at juegosdesalon.cl.',
    shareResult: '📤 Share my result',
    shareSoloContext: 'Playing solo',
    shareSoloCta: '🤔 Can you beat me? It\'s free to play on your phone:',
    shareSoloImage: '🤔 Can you beat me?',
    shareCopied: 'Copied! Paste it in the chat.',
    shareDownloaded: 'The image was downloaded and the text was copied.',
  },
  pt: {
    appTitle: 'Jogos de Salão',
    appSub: 'Jogos tradicionais trazidos pro seu celular, pra passar o tempo sozinho ou com amigos.',
    players: 'jogadores', minutes: 'min',
    footer: 'Beba com responsabilidade e com água por perto. Se for dirigir, não beba. 🚕',
    player: 'jogador',
    filters: 'Filtrar jogos',
    shown: 'Mostrando {n} de {total} jogos.', clearFilters: 'Ver todos',
    onlySpanish: 'Em espanhol',
    code: 'código no GitHub', menu: 'Menu', soon: 'Em breve', or: 'ou',
    share: 'Compartilhar Jogos de Salão',
    shareText: 'Jogos tradicionais para jogar com amigos pelo celular. De graça, sem instalar e sem conta.',
    invite: '{emoji} *{game}* · Sala {code}\n\n👋 {name} te convida pra jogar em juegosdesalon.cl.',
    shareResult: '📤 Compartilhar resultado',
    shareSoloContext: 'Jogando sozinho',
    shareSoloCta: '🤔 Consegue me vencer? É grátis e se joga pelo celular:',
    shareSoloImage: '🤔 Consegue me vencer?',
    shareCopied: 'Copiado! Cole no chat.',
    shareDownloaded: 'A imagem foi baixada e o texto foi copiado.',
  },
  de: {
    appTitle: 'Salonspiele',
    appSub: 'Klassische Spiele auf deinem Handy, für allein oder mit Freunden.',
    players: 'Spieler', minutes: 'Min.',
    footer: 'Trink verantwortungsvoll und hab Wasser dabei. Wer fährt, trinkt nicht. 🚕',
    player: 'Spieler',
    filters: 'Spiele filtern',
    shown: 'Du siehst {n} von {total} Spielen.', clearFilters: 'Alle zeigen',
    onlySpanish: 'Auf Spanisch',
    code: 'Code auf GitHub', menu: 'Menü', soon: 'Demnächst', or: 'oder',
    share: 'Salonspiele teilen',
    shareText: 'Klassische Spiele mit Freunden, direkt auf dem Handy. Gratis, ohne Installation und ohne Konto.',
    invite: '{emoji} *{game}* · Raum {code}\n\n👋 {name} lädt dich zum Spielen auf juegosdesalon.cl ein.',
    shareResult: '📤 Ergebnis teilen',
    shareSoloContext: 'Allein gespielt',
    shareSoloCta: '🤔 Schlägst du mich? Gratis auf dem Handy spielen:',
    shareSoloImage: '🤔 Schlägst du mich?',
    shareCopied: 'Kopiert! Füg es im Chat ein.',
    shareDownloaded: 'Das Bild wurde gespeichert und der Text kopiert.',
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
  const wrap = el('div', { class: 'lang-toggle', role: 'group', 'aria-label': 'Idioma / Language / Idioma / Sprache' });
  // La bandera va aparte: con cuatro idiomas en un celular angosto se esconde (base.css)
  const flags = { es: '🇨🇱', en: '🇬🇧', pt: '🇧🇷', de: '🇩🇪' };
  for (const lang of LANGS) {
    wrap.append(el('button', {
      type: 'button', class: lang === current ? 'on' : '', 'aria-pressed': lang === current ? 'true' : 'false',
      onClick: () => { if (lang === getLang()) return; setLang(lang); onChange(lang); },
    }, el('span', { class: 'flag' }, flags[lang] + ' '), lang.toUpperCase()));
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
