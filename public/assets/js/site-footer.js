/**
 * The site's footer, the same violet sunset as the home page's, for the screens outside a game:
 * Rankings, Uno al día, La Copa's entrance and each game's cover. Never while playing and never on a
 * result screen, which keeps its one quiet link (U-38). With `phrase`, the rotating funny line on
 * top (Rankings and Uno al día); without it (the covers), only the options and the version.
 * `options` are the screen's own buttons (an emoji, a space, the label), shown as tiles with the
 * others; `inbox: false` leaves the general inbox out when a screen brings its own report (La Copa).
 *
 * The home page keeps its own footer markup; both share the classes in base.css.
 */
import { el } from './ui.js';
import { getLang, COMMON } from './i18n.js';
import { versionOf, releaseOf } from './transport/stats.js';

const SOURCE = 'https://github.com/ellokojavi/juegos-de-salon';

/** Each option's leading emoji becomes its color circle, the label under it (the home page's way). */
const circle = (b, kind) => {
  const [ic, ...label] = b.textContent.split(' ');
  b.classList.add(kind);
  b.replaceChildren(el('span', { class: 'ic', 'aria-hidden': 'true' }, ic), ' ', el('span', {}, label.join(' ')));
  return b;
};

/** The footer element; `screen` names where the inbox was opened from, for its reports. */
export async function siteFooter({ phrase = false, screen = 'pagina', options = [], inbox: withInbox = true, lang = getLang(), doc = document } = {}) {
  const T = COMMON[lang] || COMMON.es;
  const inbox = el('button', { type: 'button', class: 'buzon-link footer-buzon', onClick: () => import('./buzon.js').then(m => m.abrirBuzon({ pantalla: screen })) }, T.buzon.abrir);
  const links = el('div', { class: 'footer-links' }, withInbox ? inbox : null, ...options);
  let coffee = null;
  try {
    const { supportFooterLink } = await import('./support.js');
    coffee = await supportFooterLink(lang);
    if (coffee) { coffee.removeAttribute('id'); links.append(coffee); }
  } catch (_) { /* the inbox alone */ }
  if (links.childElementCount > 1) {
    links.classList.add('tiles');
    if (withInbox) circle(inbox, 'op-buzon');
    options.forEach(o => circle(o, 'op-propia'));
    if (coffee) circle(coffee, 'op-apoyo');
  }
  const v = versionOf(releaseOf(doc));
  const version = el('p', { class: 'muted' }, v === '0' ? '' : `v${v} · `, el('a', { href: SOURCE, style: 'color:inherit' }, T.code || 'GitHub'), ' · ', el('a', { href: new URL('../../privacy/', import.meta.url).href, style: 'color:inherit' }, T.privacy || 'Privacy'));
  let msg = null;
  if (phrase) {
    const { FRASES } = await import('./frases.js');
    const all = (FRASES[lang] || FRASES.es || []).slice().sort(() => Math.random() - 0.5);
    msg = el('p', { class: 'footer-msg', 'aria-live': 'polite' }, all[0] || '');
    let i = 0;
    // Stops once the footer leaves the page (Uno al día redraws its page and the footer with it)
    const t = all.length > 1 ? setInterval(() => {
      if (!msg.isConnected) return clearInterval(t);
      if (doc.hidden) return;
      msg.classList.add('out');
      setTimeout(() => { i = (i + 1) % all.length; msg.textContent = all[i]; msg.classList.remove('out'); }, 500);
    }, 10000) : null;
  }
  // The thin line that closes the page's content, as on the home page (under its filters and its list)
  const line = el('hr', { class: 'pie-linea', 'aria-hidden': 'true' });
  return el('footer', { class: 'atardecer pie-sitio' }, line, msg, links, version);
}

/** Appends the footer at the end of `parent`; never throws. */
export async function mountFooter(parent, opts = {}) {
  try {
    if (!parent) return null;
    parent.querySelector(':scope > .pie-sitio')?.remove();
    const f = await siteFooter(opts);
    // Two mounts in a row (a screen redrawn while the first was building) leave one footer, not two
    parent.querySelector(':scope > .pie-sitio')?.remove();
    parent.append(f);
    return f;
  } catch (_) { return null; }
}

/**
 * The footer into `slot` (a lab game's `#pie` on its cover), once it is built; a screen that changes
 * `slot` meanwhile (the game starts) wins, and the footer is dropped.
 */
export function footerInto(slot, opts) {
  const mark = el('span', { hidden: true });
  slot.replaceChildren(mark);
  siteFooter(opts).then(f => { if (mark.isConnected) mark.replaceWith(f); }).catch(() => {});
}
