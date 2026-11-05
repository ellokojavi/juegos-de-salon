/**
 * A flag published for everyone moves its card to La Bodega on its own (D-534): when /labs/ opens it
 * reads `flags/` (public to read, kept on the device, `assets/js/flags.js`) and, before La Bodega
 * folds its cards, every card under ✨ Mejoras en prueba whose flag is *all* goes to ✨ Mejoras
 * lanzadas: folded like the cards written there, dated by the day the flag went live, «🚀 Lanzado.»
 * first and without the lab-only «Para verlo» sentence (D-510). No PR: the cleanup PR that removes
 * the gate moves its HTML for good, since without the flag there is nothing to read.
 */
import { loadFlags, stateOf } from '../assets/js/flags.js';
import { FLAGS } from '../assets/js/flag-list.js';

const pad = n => String(n).padStart(2, '0');
/** The local day of a moment, as `data-launched` writes it. */
export const ymd = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

/** Which of these card ids are live for everyone in `flags`: [{ id, launched }], in the order given. Pure, for the test. */
export function launched(ids, flags, { known = FLAGS, today = Date.now() } = {}) {
  return ids.map(id => [id, id.replace(/^seccion-/, '')]).filter(([, f]) => known[f] && stateOf(flags, f) === 'all')
    .map(([id, f]) => ({ id, launched: ymd(Number(flags?.[f]?.at) || today) }));
}

/** The first paragraph without its lab-only «Para verlo: <code>…</code>.» sentence (D-510). */
export const sinParaVerlo = html => html.replace(/\s*Para verlo:\s*<code>[\s\S]*?<\/code>\.?\s*$/, '');

/** Folds a card the way La Bodega's are written: its h2 in the summary, the rest in .detalle, dated. */
export function fold(card, day) {
  card.dataset.launched = day;
  if (card.querySelector(':scope > details')) return card;
  const doc = card.ownerDocument;
  const h2 = card.querySelector(':scope > h2');
  const rest = [...card.childNodes].filter(n => n !== h2);
  const summary = doc.createElement('summary');
  const arrow = doc.createElement('span');
  arrow.className = 'flecha'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '›';
  summary.append(...(h2 ? [h2] : []), arrow);
  const body = doc.createElement('div');
  body.className = 'detalle';
  body.append(...rest);
  const p = body.querySelector('p');
  if (p) { p.innerHTML = sinParaVerlo(p.innerHTML); p.prepend('🚀 Lanzado. '); }
  // its demo link no longer needs the lab key
  for (const a of body.querySelectorAll('a[href*="&lab"]')) a.setAttribute('href', a.getAttribute('href').replace(/&lab(?=&|$)/, ''));
  const details = doc.createElement('details');
  details.append(summary, body);
  card.append(details);
  card.classList.add('plegada');
  return card;
}

/** Moves the launched cards of ✨ Mejoras en prueba into ✨ Mejoras lanzadas; returns their ids. `flags` for the tests. */
export async function move(root = document, flags = null, { known = FLAGS } = {}) {
  const box = root.getElementById('bodega-mejoras');
  const group = root.getElementById('mejoras');
  if (!box || !group) return [];
  const fl = flags || await loadFlags();
  const ids = [...group.querySelectorAll(':scope > .seccion')].map(c => c.id);
  const out = [];
  for (const { id, launched: day } of launched(ids, fl, { known })) {
    const card = root.getElementById(id);
    if (!card) continue;
    box.append(fold(card, day));
    out.push(id);
  }
  return out;
}
