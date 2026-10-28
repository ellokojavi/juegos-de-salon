/**
 * 🚀 Publicar para todos (D-480): the owner sends a lab feature to production from its card.
 * Only the owner sees it: signed in with the panel's Google account (the session is shared by the
 * whole site), and only if reading `labsPublish/` works, which the rules allow to the owner alone.
 * A lab key holder sees the same page as before.
 *
 * Confirming writes `labsPublish/<card id>`; the Mac mini's `lab-publish-watch` job picks it up
 * within 5 minutes and a headless session opens the PR (tools/jobs/prompts/lab-publish.md). Each
 * card shows its request's state live, with the PR, its checks and its preview once it exists.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getDatabase, ref, onValue, set, remove } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { $, $$, el } from '../assets/js/ui.js';

const REPO = 'https://github.com/ellokojavi/juegos-de-salon';
const PREVIEWS = 'https://ellokojavi.github.io/juegos-de-salon-previews';
/** Same as tools/agents/lab-publish.mjs branchOf. */
export const branchOf = id => `publish-${id.replace(/^seccion-/, '')}`;

/** The cards that can still go live: what is being tried, not La Bodega. */
const cards = () => $$('#activos > .seccion, #mejoras > .seccion');
const titleOf = card => $('h2', card)?.textContent.trim() || card.id;
const when = ms => new Date(ms).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const link = (href, text) => el('a', { href, target: '_blank', rel: 'noopener' }, text);

const WAIT = 'No es inmediato: tarda entre 30 y 60 minutos (un juego, algo más). El Mac mini revisa los pedidos cada 5 minutos, '
  + 'Claude hace el cambio y abre el PR, y se fusiona solo cuando pasan las pruebas. Si el Mac mini está apagado, empieza cuando se encienda.';

/** What a card shows for its request. Pure but for the DOM nodes: one line per fact, the links last. */
export function statusOf(id, e) {
  const branch = e.branch || branchOf(id);
  const search = `${REPO}/pulls?q=is%3Apr+head%3A${branch}`;
  const pr = e.pr && [link(`${REPO}/pull/${e.pr}`, `🔀 Ver el PR #${e.pr}`), link(`${REPO}/pull/${e.pr}/checks`, '🧪 Estado de las pruebas'), link(`${PREVIEWS}/${branch}/`, '🔍 Vista previa')];
  switch (e.state) {
    case 'requested': return { tone: 'wait', lines: [`⏳ Pedido el ${when(e.at)}: esperando que el Mac mini lo tome.`, WAIT, `El PR saldrá de la rama ${branch}.`], links: [link(search, '🔎 Buscar su PR en GitHub')], cancel: true };
    case 'working': return { tone: 'wait', lines: [`🛠️ Claude está trabajando en esto desde ${when(e.started || e.at)}: quita la puerta del laboratorio, mueve la tarjeta a La Bodega y pasa las revisiones.`, 'Cuando abra el PR, aparece acá con el link a sus pruebas.'], links: [link(search, '🔎 Buscar su PR en GitHub')] };
    case 'pr': return { tone: 'wait', lines: [`🔀 El PR #${e.pr} está abierto con auto-merge: se fusiona solo cuando pasen las pruebas, y unos minutos después queda publicado para todos.`], links: pr };
    case 'merged': return { tone: 'ok', lines: [`✅ Fusionado el ${when(e.done || e.at)}. El sitio se publica solo en unos minutos; con esa versión, esta tarjeta pasa a La Bodega.`], links: pr || [] };
    case 'failed': return { tone: 'bad', lines: [`❌ No se pudo publicar: ${e.msg || 'sin detalle.'}`], links: pr || [], retry: true };
    default: return null;
  }
}

let db, requests = {};

export function ask(card, existing) {
  const note = el('textarea', { rows: 3, maxlength: 500, placeholder: 'Nota opcional para Claude (por ejemplo: solo en español por ahora)', class: 'publicar-nota' }, existing?.note || '');
  const close = () => capa.remove();
  const go = async () => {
    btn.disabled = true;
    try {
      await set(ref(db, `labsPublish/${card.id}`), { state: 'requested', at: Date.now(), title: titleOf(card).slice(0, 120), ...(note.value.trim() ? { note: note.value.trim().slice(0, 500) } : {}) });
      close();
      $('.publicar-estado', card)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) { btn.disabled = false; msg.textContent = `No se pudo guardar el pedido (${err?.code || err?.message || 'error'}).`; }
  };
  const msg = el('p', { class: 'muted', role: 'alert' });
  const btn = el('button', { class: 'btn btn--yellow', onClick: go }, '🚀 Sí, publicar');
  const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'publicar-titulo' },
    el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
    el('h2', { id: 'publicar-titulo' }, '🚀 ¿Publicar para todos?'),
    el('p', {}, el('b', {}, titleOf(card)), ' deja el laboratorio y lo ven todos los jugadores. Su tarjeta pasa a La Bodega.'),
    el('p', { class: 'hoja-caja' }, WAIT),
    el('p', { class: 'muted' }, 'Lo sigues en esta tarjeta: el PR, sus pruebas y su vista previa, o por qué no se pudo (y entonces no publica nada).'),
    note, msg,
    el('div', { class: 'btn-row' }, btn, el('button', { class: 'btn btn--ghost', onClick: close }, 'Cancelar')),
  );
  const capa = el('div', { class: 'hoja-capa' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
  document.body.append(capa);
  btn.focus();
}

/** Draws the cards for these requests: the page's own listener, and tools/e2e/labs/publish.mjs. */
export function render(r = requests) {
  requests = r;
  for (const card of cards()) {
    $('.publicar', card)?.remove();
    const e = requests[card.id];
    const s = e && statusOf(card.id, e);
    const box = el('div', { class: 'publicar' });
    if (!s) box.append(el('button', { class: 'btn btn--ghost', onClick: () => ask(card) }, '🚀 Publicar para todos'));
    else box.append(el('div', { class: `publicar-estado publicar-estado--${s.tone}`, role: 'status' },
      ...s.lines.map(l => el('p', {}, l)),
      s.links.length ? el('p', { class: 'publicar-links' }, ...s.links) : null,
      s.cancel ? el('button', { class: 'btn btn--ghost', onClick: () => remove(ref(db, `labsPublish/${card.id}`)) }, 'Cancelar el pedido') : null,
      s.retry ? el('button', { class: 'btn btn--ghost', onClick: () => ask(card, e) }, '🚀 Volver a pedir') : null,
    ));
    card.append(box);
  }
}

export function start() {
  const app = initializeApp(firebaseConfig, 'labs-publish');
  const auth = getAuth(app);
  db = getDatabase(app);
  let stop = null;
  const owner = $('#publicar-dueno');
  onAuthStateChanged(auth, user => {
    stop?.(); stop = null; requests = {}; $$('.publicar').forEach(n => n.remove());
    if (owner) owner.hidden = !!user;
    if (!user) return;
    // a read the rules refuse means this is not the owner: nothing is shown
    stop = onValue(ref(db, 'labsPublish'), snap => { requests = snap.val() || {}; render(); }, () => {});
  });
  owner?.querySelector('button')?.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    signInWithPopup(auth, provider).catch(() => {});
  });
}
