/**
 * Idioma compartido por toda la app.
 * El idioma se elige con un toggle en el menú (y en la intro de cada juego)
 * y se guarda en localStorage. Por defecto: español.
 */
import { el } from './ui.js';

const KEY = 'juegos-de-salon:lang';
export const LANGS = ['es', 'en'];

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
    appSub: 'Elige un juego, ingresa a los jugadores y deja que el celular guíe la partida.',
    players: 'jugadores', minutes: 'min',
    footer: 'Toma con responsabilidad y con agua a mano. Si manejas, no tomas. 🚕',
    footerMessages: [
      'Toma con responsabilidad y con agua a mano. Si manejas, no tomas. 🚕',
      'Un vaso de agua entre trago y trago: tu yo de mañana te lo va a agradecer. 💧',
      'Comer antes de tomar no es de fome, es de sabio. 🍕',
      '“La vida es demasiado corta para beber vino malo.” — Goethe 🍷',
      'El mejor jugador del carrete es el que pidió el auto de vuelta a tiempo. 🚗',
      'Perder en Toque y Fama con estilo también cuenta. 🎯',
      'Si el vaso dice “fondo”, tu cuerpo dice “sorbo”. Escúchalo. 🫗',
      '“Todo con moderación, incluso la moderación.” — Oscar Wilde 🎩',
      'El alcohol no mejora tu baile. Los amigos que graban, tampoco. 📹',
      'Un rey no borra la memoria; el cuarto sí. Tómalo con calma. 👑',
      'Alterna: un trago, un agua. Doble de fiesta, mitad de resaca. 🔁',
      'Las mejores historias del carrete son las que puedes contar al día siguiente. 📖',
      'Cuidar al amigo que ya tomó de más es la regla número cero. 🤝',
      'Toque: cifra correcta en otro lugar. Fama: en su lugar. Resaca: en todos lados. 🔢',
      '“Beber sin sed y amar en todo tiempo es lo que nos distingue de los animales.” — Beaumarchais 🦊',
      'El agua es gratis, la resaca no. 💸',
      'Si no te acuerdas de la última carta, es momento de un agua. 🃏',
      'Las reglas son sagradas, pero el que maneja es intocable: cero copete. 🔑',
      '“He sacado más del alcohol de lo que el alcohol ha sacado de mí.” — Churchill 🥃',
      'Avísale a quien te espera en casa cómo vas. También es parte del juego. 📱',
    ],
    code: 'código en GitHub', menu: 'Menú', soon: 'Próximamente',
  },
  en: {
    appTitle: 'Party Games',
    appSub: 'Pick a game, add the players and let the phone run the game.',
    players: 'players', minutes: 'min',
    footer: 'Drink responsibly and keep water nearby. If you drive, you don\'t drink. 🚕',
    footerMessages: [
      'Drink responsibly and keep water nearby. If you drive, you don\'t drink. 🚕',
      'A glass of water between drinks: tomorrow-you will thank you. 💧',
      'Eating before drinking isn\'t boring, it\'s wise. 🍕',
      '“Life is too short to drink bad wine.” — Goethe 🍷',
      'The best player of the night is the one who booked the ride home on time. 🚗',
      'Losing at Bulls and Cows with style still counts. 🎯',
      'When the glass says “chug”, your body says “sip”. Listen to it. 🫗',
      '“Everything in moderation, including moderation.” — Oscar Wilde 🎩',
      'Alcohol doesn\'t improve your dancing. Neither do the friends filming it. 📹',
      'One king won\'t erase your memory; the fourth one might. Take it easy. 👑',
      'Alternate: one drink, one water. Twice the party, half the hangover. 🔁',
      'The best party stories are the ones you can tell the next day. 📖',
      'Looking after the friend who had one too many is rule number zero. 🤝',
      'Cow: right digit, wrong spot. Bull: right spot. Hangover: everywhere. 🔢',
      '“Drinking when we are not thirsty and making love at all seasons: that is all there is to distinguish us from other animals.” — Beaumarchais 🦊',
      'Water is free. Hangovers aren\'t. 💸',
      'If you can\'t remember the last card, it\'s time for a water. 🃏',
      'The rules are sacred, but the driver is untouchable: zero drinks. 🔑',
      '“I have taken more out of alcohol than alcohol has taken out of me.” — Churchill 🥃',
      'Let whoever is waiting at home know how you\'re doing. That\'s part of the game too. 📱',
    ],
    code: 'code on GitHub', menu: 'Menu', soon: 'Coming soon',
  },
};

/** Devuelve `obj[lang]` si es un objeto por idioma; si no, el valor tal cual. */
export function pickLang(obj, lang = getLang()) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && (lang in obj)) return obj[lang];
  return obj;
}

/**
 * Toggle ES / EN. `onChange(lang)` se llama tras guardar el idioma nuevo.
 * Por defecto recarga la página para que todo se re-renderice con el idioma elegido.
 */
export function langToggle(onChange = () => location.reload()) {
  const current = getLang();
  const wrap = el('div', { class: 'lang-toggle', role: 'group', 'aria-label': 'Idioma / Language' });
  const labels = { es: '🇨🇱 ES', en: '🇬🇧 EN' };
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
