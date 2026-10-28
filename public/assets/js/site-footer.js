/**
 * The site's footer, the same violet sunset as the home page's, for the screens outside a game:
 * Rankings, Uno al día, La Copa's entrance and each game's cover. Never while playing and never on a
 * result screen, which keeps its one quiet link (U-38). With `phrase`, the rotating funny line on
 * top (Rankings and Uno al día); without it (the covers), only the options and the version.
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
export async function siteFooter({ phrase = false, screen = 'pagina', lang = getLang(), doc = document } = {}) {
  const T = COMMON[lang] || COMMON.es;
  const inbox = el('button', { type: 'button', class: 'buzon-link footer-buzon', onClick: () => import('./buzon.js').then(m => m.abrirBuzon({ pantalla: screen })) }, T.buzon.abrir);
  const links = el('div', { class: 'footer-links' }, inbox);
  try {
    const { supportFooterLink } = await import('./support.js');
    const coffee = await supportFooterLink(lang);
    if (coffee) { coffee.removeAttribute('id'); links.append(coffee); links.classList.add('tiles'); }
  } catch (_) { /* the inbox alone */ }
  if (links.classList.contains('tiles')) { circle(inbox, 'op-buzon'); circle(links.lastChild, 'op-apoyo'); }
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
  return el('footer', { class: 'atardecer pie-sitio' }, msg, links, version);
}

/** Appends the footer at the end of `parent`; never throws. */
export async function mountFooter(parent, opts = {}) {
  try {
    if (!parent) return null;
    parent.querySelector(':scope > .pie-sitio')?.remove();
    const f = await siteFooter(opts);
    parent.append(f);
    return f;
  } catch (_) { return null; }
}
