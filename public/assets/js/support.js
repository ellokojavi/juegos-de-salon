/**
 * "☕ Buy me a coffee": voluntary support through a Stripe Payment Link, for every player (D-448, D-449).
 *
 * Where it shows, from the quietest to the most visible, and never during a game or as a popup (U-38):
 *
 * - the home page footer, under "💬 Suggestions and comments" (`supportFooterLink`);
 *   each of these two places can be switched off from the panel's 🧩 Site features (D-477, controls.js);
 * - the end of a finished game, after everything else, with its own rule kept on the device
 *   (`supportAtEnd`, `dueSupport`):
 *     · not before the device has finished 5 games;
 *     · at most once every 7 days;
 *     · not on an ending that already shows the inbox link: one quiet link per ending (U-1);
 *     · after opening the support card, it rests 30 days; after paying, it never asks again.
 *
 * Both links open the same card over the page they are on, a sheet from the bottom like the home
 * page's share sheet (`openSupportSheet`, D-449): what the money is for, one button to Stripe, and
 * "Not now". Stripe sends the donor back to the home page with `?support=thanks`, which opens the
 * thank-you as the same sheet (`supportFromUrl`); `?support=open` opens the card (the lab's link).
 *
 * Every step is counted in the day's stats as `support/<event>` (shown, open, pay, thanks): only
 * counts, never who. Until PAYMENT_LINK is set, the button simulates a payment.
 */
import { el } from './ui.js';
import { getLang } from './i18n.js';
import { param, tiene } from './parametros.js';
import { cachedControls, currentControls, featureOn } from './controls.js';

/**
 * A friendly clip on the card: Keanu Reeves saying thank you (GIPHY's, from Sky TV), served from
 * GIPHY and not copied into the site, for its rights. Under the title, square and centered, its size following the screen's height (on the smallest phones it gives way), so the card still fits a
 * 320×568 phone without scrolling (D-449); with reduced motion, its still.
 */
export const CLIP = { video: 'https://media.giphy.com/media/fWfowxJtHySJ0SGCgN/giphy.mp4', still: 'https://media.giphy.com/media/fWfowxJtHySJ0SGCgN/480w_s.jpg' };

function clip(doc) {
  const still = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const v = doc.createElement('video');
  Object.assign(v, { src: CLIP.video, poster: CLIP.still, muted: true, loop: true, autoplay: !still, playsInline: true, preload: still ? 'none' : 'auto' });
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
  v.className = 'hoja-apoyo-clip';
  v.style.cssText = 'display:block;height:clamp(0px, calc(100svh - 560px), 200px);aspect-ratio:1;object-fit:cover;border-radius:14px;margin:0 auto';
  return v;
}

/** The Stripe Payment Link ("customers choose what to pay"). Empty: the lab simulates the payment. The live link (real payments); the sandbox one was buy.stripe.com/test_dRm7sL17f2bI4sY19jds400. */
export const PAYMENT_LINK = 'https://buy.stripe.com/eVq6oJah54J12Gv9NSgUM00';

const KEY = 'juegos-de-salon:support';
export const MIN_GAMES = 5;
export const EVERY_DAYS = 7;
export const REST_AFTER_OPEN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const TEXTS = {
  es: {
    link: '☕ Invítame a un café',
    end: 'Juegos de Salón es gratis y sin anuncios. Si te gusta, puedes apoyarlo.',
    title: 'Invítame a un café',
    lead: 'Juegos de Salón es gratis y sin anuncios, y va a seguir así. Tu aporte me ayuda a mantenerlo y a crear juegos nuevos.',
    points: ['Tú eliges cuánto. Pagas con Stripe (tarjeta, Apple Pay o Google Pay) y yo no veo los datos de tu tarjeta.'],
    pay: '☕ Invitar un café',
    payNote: 'Se abre la página de pago de Stripe.',
    labNote: '🧪 Todavía no hay link de pago: el botón simula un pago para ver el agradecimiento.',
    thanksTitle: '¡Gracias por tu café!',
    thanks: 'Seguiremos haciendo juegos para que disfrutes solo y con amigos. ¡Ahora, a jugar!',
    close: 'Ahora no',
    back: '🎲 Volver a los juegos',
  },
  en: {
    link: '☕ Buy me a coffee',
    end: 'Party Games is free and has no ads. If you enjoy it, you can support it.',
    title: 'Buy me a coffee',
    lead: 'Party Games is free and has no ads, and it will stay that way. Your support helps me keep it running and build new games.',
    points: ['You choose how much. You pay through Stripe (card, Apple Pay or Google Pay), and I never see your card details.'],
    pay: '☕ Buy a coffee',
    payNote: "Opens Stripe's payment page.",
    labNote: '🧪 No payment link yet: the button simulates a payment to show the thank-you.',
    thanksTitle: 'Thanks for the coffee!',
    thanks: 'We will keep making games for you to enjoy on your own or with friends. Now, go play!',
    close: 'Not now',
    back: '🎲 Back to the games',
  },
  pt: {
    link: '☕ Me pague um café',
    end: 'O Jogos de Salão é grátis e sem anúncios. Se você gosta, pode apoiar.',
    title: 'Me pague um café',
    lead: 'O Jogos de Salão é grátis e sem anúncios, e vai continuar assim. Seu apoio me ajuda a mantê-lo e a criar jogos novos.',
    points: ['Você escolhe quanto. O pagamento é pelo Stripe (cartão, Apple Pay ou Google Pay) e eu não vejo os dados do seu cartão.'],
    pay: '☕ Pagar um café',
    payNote: 'Abre a página de pagamento do Stripe.',
    labNote: '🧪 Ainda não há link de pagamento: o botão simula um pagamento para mostrar o agradecimento.',
    thanksTitle: 'Obrigado pelo café!',
    thanks: 'Vamos continuar fazendo jogos para você curtir sozinho e com amigos. Agora, a jogar!',
    close: 'Agora não',
    back: '🎲 Voltar aos jogos',
  },
  de: {
    link: '☕ Spendier mir einen Kaffee',
    end: 'Salonspiele ist kostenlos und werbefrei. Wenn es dir gefällt, kannst du es unterstützen.',
    title: 'Spendier mir einen Kaffee',
    lead: 'Salonspiele ist kostenlos und werbefrei, und das bleibt so. Deine Unterstützung hilft mir, es am Laufen zu halten und neue Spiele zu bauen.',
    points: ['Du entscheidest, wie viel. Bezahlt wird über Stripe (Karte, Apple Pay oder Google Pay), deine Kartendaten sehe ich nie.'],
    pay: '☕ Kaffee spendieren',
    payNote: 'Öffnet die Bezahlseite von Stripe.',
    labNote: '🧪 Noch kein Zahlungslink: Der Knopf spielt eine Zahlung nur durch, um das Dankeschön zu zeigen.',
    thanksTitle: 'Danke für den Kaffee!',
    thanks: 'Wir machen weiter Spiele, die du allein und mit Freunden genießen kannst. Und jetzt: los, spielen!',
    close: 'Jetzt nicht',
    back: '🎲 Zu den Spielen',
  },
};
export const texts = (lang = getLang()) => TEXTS[lang] || TEXTS.es;


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

/** The player opened the support card: the end of the games rests for a month. */
export const supportOpened = (store = globalThis.localStorage, now = Date.now()) => write(store, { ...read(store), opened: now });
/** The player paid: the end of the games never asks again (the footer link stays). */
export const supportPaid = (store = globalThis.localStorage, now = Date.now()) => write(store, { ...read(store), paid: now });

export const EVENTS = ['shown', 'open', 'pay', 'thanks'];
/** One step of the funnel, counted in the day's stats (`support/<event>`). Never throws. */
export async function trackSupport(event) {
  try {
    if (!EVENTS.includes(event)) return;
    const [{ stats, dayPath, noteSeen }, { dayOf }] = await Promise.all([import('./transport/stats.js'), import('./transport/cleanup.js')]);
    const s = stats();
    await s.api.patch(dayPath(s.fp.env, dayOf(Date.now())), { [`support/${event}`]: { '.sv': { increment: 1 } } });
    if (event === 'open') noteSeen('support', s);
  } catch (_) { /* best effort */ }
}

let sheet = null;
/** Closes the card, gives the page back its scroll and the focus to what opened it. */
export function closeSupportSheet() {
  if (!sheet) return;
  const { layer, doc, body, y, before, onKey } = sheet;
  sheet = null;
  layer.remove();
  if (body === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', body);
  doc.defaultView?.scrollTo(0, y);
  doc.removeEventListener('keydown', onKey);
  before?.focus?.();
}

/**
 * The card, over the page, as the share sheet: pinned page behind, a tap outside, Escape or the
 * last button closes it. `thanks` draws the thank-you instead. Opening the card counts `open` and
 * rests the end-of-game invitation; the thank-you counts `thanks` and stops it. `record: false`
 * (`?test`, the lab's simulated payment) counts and remembers nothing.
 */
export function openSupportSheet({ lang = getLang(), thanks = false, record = true, doc = document } = {}) {
  closeSupportSheet();
  const T = texts(lang);
  const done = el('div', { class: 'btn-row' }, el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-apoyo-cerrar', onClick: closeSupportSheet }, thanks ? T.back : T.close));
  const body = thanks
    ? [el('h2', { id: 'hoja-apoyo-titulo' }, `💛 ${T.thanksTitle}`), el('p', {}, T.thanks), done]
    : [
      el('h2', { id: 'hoja-apoyo-titulo' }, `☕ ${T.title}`),
      // The clip under the title (the owner's request), its height following the screen's so a small phone keeps it all
      clip(doc),
      el('p', {}, T.lead),
      ...T.points.map(p => el('p', { class: 'muted', style: 'font-size:0.85rem' }, p)),
      PAYMENT_LINK
        ? el('a', { class: 'btn btn--yellow', id: 'btn-apoyo-pagar', href: PAYMENT_LINK, onClick: () => { if (record) trackSupport('pay'); } }, T.pay)
        : el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-apoyo-pagar', onClick: () => openSupportSheet({ lang, thanks: true, record: false, doc }) }, T.pay),
      el('p', { class: 'muted', style: 'font-size:0.85rem;text-align:center' }, PAYMENT_LINK ? T.payNote : T.labNote),
      done,
    ];
  const panel = el('div', { class: 'hoja hoja-apoyo', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hoja-apoyo-titulo', id: 'hoja-apoyo' },
    el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }), ...body);
  const layer = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: closeSupportSheet }), panel);
  const onKey = e => { if (e.key === 'Escape') closeSupportSheet(); };
  const y = doc.defaultView?.scrollY || 0;
  sheet = { layer, doc, body: doc.body.getAttribute('style'), y, before: doc.activeElement, onKey };
  doc.body.append(layer);
  Object.assign(doc.body.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  doc.addEventListener('keydown', onKey);
  panel.querySelector('.btn')?.focus();
  if (record) {
    if (thanks) { supportPaid(); trackSupport('thanks'); } else { supportOpened(); trackSupport('open'); }
  }
  return panel;
}

const link = (cls, id, T) => el('button', { type: 'button', class: cls, id, 'aria-haspopup': 'dialog', onClick: () => openSupportSheet({ record: !tiene('test') }) }, T.link);

/**
 * On the home page: `?support=thanks` (Stripe's way back) opens the thank-you, `?support=open` the
 * card. The parameter leaves the address, so a reload does not count again.
 */
export async function supportFromUrl({ lang = getLang(), search = globalThis.location?.search ?? '' } = {}) {
  const v = param('support', search);
  if (v === null) return false;
  try { const u = new URL(location.href); u.searchParams.delete('support'); history.replaceState(null, '', u); } catch (_) { /* the address stays */ }
  openSupportSheet({ lang, thanks: v === 'thanks', record: !tiene('test', search) });
  return true;
}


/** The footer's link, unless the panel's 🧩 Site features switched it off (D-477): the home page's fresh read, elsewhere the device's copy. */
export async function supportFooterLink(lang = getLang()) {
  if (!tiene('test') && !featureOn(await currentControls(), 'support', 'footer')) return null;
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
    // Switched off in the panel (D-477): the device's last copy of controls/, so an ending reads no Firebase
    if (!featureOn(cachedControls(store), 'support', 'endings')) return null;
    last = now;
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
