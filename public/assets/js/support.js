/**
 * "☕ Buy us a coffee": voluntary support through a Stripe Payment Link (in the lab, D-395).
 * lab: #seccion-apoyo
 *
 * Where it shows, from the quietest to the most visible, and never during a game or as a popup (U-38):
 *
 * - the home page footer, always, under "💬 Suggestions and comments" (`supportFooterLink`);
 * - the end of a finished game, after everything else, with its own rule kept on the device
 *   (`supportAtEnd`, `dueSupport`):
 *     · not before the device has finished 5 games;
 *     · at most once every 7 days;
 *     · not on an ending that already shows the inbox link: one quiet link per ending (U-1);
 *     · after opening the support page, it rests 30 days; after paying, it never asks again.
 * - the support page, /labs/support/ (moves to /support/ when it leaves the lab), which says what
 *   the money is for and opens Stripe. Stripe sends the donor back to `?thanks`.
 *
 * Every step is counted in the day's stats as `support/<event>` (shown, open, pay, thanks): only
 * counts, never who. Until PAYMENT_LINK is set, the page's button simulates a payment (lab only).
 */
import { el } from './ui.js';
import { getLang } from './i18n.js';
import { labAccess } from './lab-access.js';

/** The Stripe Payment Link ("customers choose what to pay"). Empty: the lab simulates the payment. */
export const PAYMENT_LINK = '';

const KEY = 'juegos-de-salon:support';
export const MIN_GAMES = 5;
export const EVERY_DAYS = 7;
export const REST_AFTER_OPEN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const TEXTS = {
  es: {
    link: '☕ Invítanos un café',
    end: 'Juegos de Salón es gratis y sin anuncios. Si te gusta, puedes apoyarlo.',
    title: 'Invítanos un café',
    lead: 'Juegos de Salón es gratis, sin anuncios y sin cuenta, y lo va a seguir siendo. Tu aporte ayuda a mantener el sitio y a crear juegos nuevos.',
    points: ['☕ Tú eliges cuánto aportar.', '🔒 El pago es con Stripe: con tarjeta, Apple Pay o Google Pay. Nosotros no vemos los datos de tu tarjeta.', '🎲 Es voluntario: los juegos siguen siendo gratis para todos, apoyes o no.'],
    pay: '☕ Invitar un café',
    payNote: 'Se abre la página de pago de Stripe.',
    labNote: '🧪 Todavía no hay link de pago: el botón simula un pago para ver el agradecimiento.',
    thanksTitle: '¡Gracias!',
    thanks: 'Tu café llegó. Nos ayuda a seguir haciendo juegos. No te lo vamos a volver a pedir al final de las partidas.',
    back: '🎲 Volver a los juegos',
  },
  en: {
    link: '☕ Buy us a coffee',
    end: 'Juegos de Salón is free and has no ads. If you enjoy it, you can support it.',
    title: 'Buy us a coffee',
    lead: "Juegos de Salón is free, with no ads and no account, and it will stay that way. Your support helps keep the site running and build new games.",
    points: ['☕ You choose how much to give.', '🔒 Payment goes through Stripe: card, Apple Pay or Google Pay. We never see your card details.', "🎲 It's voluntary: the games stay free for everyone, whether you chip in or not."],
    pay: '☕ Buy a coffee',
    payNote: "Opens Stripe's payment page.",
    labNote: '🧪 No payment link yet: the button simulates a payment to show the thank-you.',
    thanksTitle: 'Thank you!',
    thanks: "Your coffee arrived. It helps us keep making games. We won't ask again at the end of your games.",
    back: '🎲 Back to the games',
  },
  pt: {
    link: '☕ Pague um café pra gente',
    end: 'O Juegos de Salón é grátis e sem anúncios. Se você gosta, pode apoiar.',
    title: 'Pague um café pra gente',
    lead: 'O Juegos de Salón é grátis, sem anúncios e sem conta, e vai continuar assim. Seu apoio ajuda a manter o site e a criar jogos novos.',
    points: ['☕ Você escolhe quanto quer dar.', '🔒 O pagamento é pelo Stripe: cartão, Apple Pay ou Google Pay. Nós não vemos os dados do seu cartão.', '🎲 É voluntário: os jogos continuam grátis para todos, apoiando ou não.'],
    pay: '☕ Pagar um café',
    payNote: 'Abre a página de pagamento do Stripe.',
    labNote: '🧪 Ainda não há link de pagamento: o botão simula um pagamento para mostrar o agradecimento.',
    thanksTitle: 'Obrigado!',
    thanks: 'Seu café chegou. Ele nos ajuda a continuar fazendo jogos. Não vamos pedir de novo no fim das suas partidas.',
    back: '🎲 Voltar aos jogos',
  },
  de: {
    link: '☕ Spendier uns einen Kaffee',
    end: 'Juegos de Salón ist kostenlos und werbefrei. Wenn es dir gefällt, kannst du es unterstützen.',
    title: 'Spendier uns einen Kaffee',
    lead: 'Juegos de Salón ist kostenlos, werbefrei und ohne Konto, und das bleibt so. Deine Unterstützung hilft, die Seite am Laufen zu halten und neue Spiele zu bauen.',
    points: ['☕ Du entscheidest, wie viel du gibst.', '🔒 Bezahlt wird über Stripe: mit Karte, Apple Pay oder Google Pay. Deine Kartendaten sehen wir nie.', '🎲 Es ist freiwillig: Die Spiele bleiben für alle kostenlos, ob du etwas gibst oder nicht.'],
    pay: '☕ Kaffee spendieren',
    payNote: 'Öffnet die Bezahlseite von Stripe.',
    labNote: '🧪 Noch kein Zahlungslink: Der Knopf spielt eine Zahlung nur durch, um das Dankeschön zu zeigen.',
    thanksTitle: 'Danke!',
    thanks: 'Dein Kaffee ist angekommen. Damit können wir weiter Spiele machen. Am Ende deiner Spiele fragen wir nicht mehr danach.',
    back: '🎲 Zu den Spielen',
  },
};
export const texts = (lang = getLang()) => TEXTS[lang] || TEXTS.es;

/** The support page, seen from wherever this module is loaded (also in a PR preview's subfolder). */
export const pageUrl = (extra = '') => new URL(`../../labs/support/${extra}`, import.meta.url).href;

const read = store => { try { return JSON.parse(store?.getItem(KEY) || '{}') || {}; } catch (_) { return {}; } };
const write = (store, s) => { try { store?.setItem(KEY, JSON.stringify(s)); } catch (_) { /* no storage: nothing is remembered */ } };

/**
 * Counts one finished game and says whether its ending asks for support (and if so, remembers when).
 * `busy`: the ending already shows another quiet link (the inbox), so this one waits. Pure apart
 * from the store, for the tests.
 */
export function dueSupport(store = globalThis.localStorage, now = Date.now(), { busy = false } = {}) {
  const s = read(store);
  s.games = (s.games || 0) + 1;
  const due = !busy && !s.paid && s.games > MIN_GAMES
    && !(s.shown && now - s.shown < EVERY_DAYS * DAY_MS)
    && !(s.opened && now - s.opened < REST_AFTER_OPEN_DAYS * DAY_MS);
  if (due) s.shown = now;
  write(store, s);
  return due;
}

/** The player opened the support page: the end of the games rests for a month. */
export const supportOpened = (store = globalThis.localStorage, now = Date.now()) => write(store, { ...read(store), opened: now });
/** The player paid: the end of the games never asks again (the footer link stays). */
export const supportPaid = (store = globalThis.localStorage, now = Date.now()) => write(store, { ...read(store), paid: now });

export const EVENTS = ['shown', 'open', 'pay', 'thanks'];
/** One step of the funnel, counted in the day's stats (`support/<event>`). Never throws. */
export async function trackSupport(event) {
  try {
    if (!EVENTS.includes(event)) return;
    const [{ stats, dayPath }, { dayOf }] = await Promise.all([import('./transport/stats.js'), import('./transport/cleanup.js')]);
    const s = stats();
    await s.api.patch(dayPath(s.fp.env, dayOf(Date.now())), { [`support/${event}`]: { '.sv': { increment: 1 } } });
  } catch (_) { /* best effort */ }
}

const link = (cls, id, T) => el('a', { class: cls, id, href: pageUrl() }, T.link);

/** The home page footer's link, or null without a lab key. */
export async function supportFooterLink(lang = getLang()) {
  if (!(await labAccess())) return null;
  return link('buzon-link footer-buzon', 'btn-apoyo-portada', texts(lang));
}

let last = -Infinity;
/**
 * At the very end of `screen` (the result), after the inbox's place: a sentence and the link, when
 * the rule above says so. One ending is counted once, like the inbox (`ponerBuzon`).
 */
export async function supportAtEnd(screen, { store = globalThis.localStorage, now = Date.now() } = {}) {
  try {
    if (!screen || now - last < 3000) return null;
    last = now;
    if (!(await labAccess())) return null;
    screen.querySelector('#apoyo-pie')?.remove();
    if (!dueSupport(store, now, { busy: !!screen.querySelector('#buzon-pie') })) return null;
    const T = texts();
    const box = el('div', { class: 'buzon-pie apoyo-pie', id: 'apoyo-pie' },
      el('p', { class: 'muted', style: 'margin:0;font-size:0.85rem' }, T.end),
      link('buzon-link apoyo-link', 'btn-apoyo', T));
    screen.append(box);
    trackSupport('shown');
    return box;
  } catch (_) { return null; /* support never gets in the way of an ending */ }
}
