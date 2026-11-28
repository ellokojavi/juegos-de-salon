/**
 * All of a player's duels (lab flag rivals, assets/js/duels.js): ⚔️ New duel, then the open ones in
 * two tabs (my turn, waiting) and the finished ones under them. A player with no duel yet gets the
 * new-duel sheet open on arrival. Without a player, the sign-in card.
 * `?d=<duel>` is a challenge's invite (the owner, 2026-11-23: always to one rival, not an open seat):
 * «Javi challenges you», the duel so far and ⚔️ Accept and play, for the rival it was sent to.
 */
import { el } from '../assets/js/ui.js';
import { SFX } from '../assets/js/sound.js';
import { jugador, leerYo } from '../assets/js/jugador.js';
import { bloqueJugador } from '../assets/js/ranking.js';
import { estado, record, esDid, rondas } from '../assets/js/duels.js';
import { T, fmt, fila, ordenar, abrirNuevo, titulo, hrefRonda, hrefDuelos, shareInvite, duelView, listTimeline, panelProgress, panelRecientes, panelEstadisticas, panelRivalidades } from '../assets/js/duels-ui.js';

export { T };
const tap = () => SFX.tap();

/** A challenge's invite: what the person who opens its link sees, by who they are. */
async function drawInvite(root, { sub, h1, did, J }) {
  const D = await J.duelos();
  const d = await D.leer(did).catch(() => null);
  const todos = el('a', { class: 'btn btn--ghost btn--sm', id: 'dl-todos', href: hrefDuelos(), onClick: tap }, T.backDuels);
  if (!d) { root.replaceChildren(el('p', { class: 'notice' }, T.notFound), todos); return; }
  const yo = leerYo();
  h1.textContent = fmt(T.challengesYou, { n: d.an });
  sub.textContent = titulo(d);
  const deA = estado(d, d.a);
  const versus = el('div', { class: 'panel dl-invita' }, el('div', { class: 'dl-versus' },
    el('div', {}, el('b', {}, d.an), el('div', { class: 'dl-espera' }, fmt(T.playedOf, { n: d.an, k: deA.mias.filter(Boolean).length, t: rondas(d) }))),
    el('span', { class: 'display display--md' }, 'VS'),
    el('div', {}, el('b', {}, d.bn), el('div', { class: 'dl-espera' }, '?'))));
  if (!yo) {
    root.replaceChildren(versus, bloqueJugador({ abierto: true, destacado: true, titulo: T.signInToPlay, alTocar: tap }));
    return;
  }
  // One of its two players: the duel's own page, its card and round by round (the owner, 2026-11-25)
  const deB = yo.jid === d.b && (Object.keys(d.e?.[d.b] || {}).length > 0 || estado(d, d.b).termino);
  if (yo.jid === d.a || deB) {
    h1.textContent = T.pageTitle;
    sub.textContent = ''; // the card's chip says the game and format
    const lista = await D.mios().catch(() => []);
    const e = estado(d, yo.jid);
    const invitar = yo.jid === d.a && !e.termino && !Object.keys(d.e?.[d.b] || {}).length
      ? el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'dl-invitar', onClick: () => { tap(); shareInvite(d, invitar); } }, fmt(T.shareInvite, { n: d.bn })) : null;
    root.replaceChildren(...[...duelView(d, yo.jid, { lista, alTocar: tap }), invitar, todos].filter(Boolean));
    return;
  }
  if (yo.jid !== d.b) { root.replaceChildren(versus, el('p', { class: 'notice' }, fmt(T.forOther, { n: d.bn })), todos); return; }
  const e = estado(d, yo.jid);
  if (e.termino) { root.replaceChildren(el('p', { class: 'notice' }, T.duelOver), el('section', { class: 'panel' }, fila(d, yo.jid, { alTocar: tap })), todos); return; }
  if (e.turno < 0) { root.replaceChildren(el('p', { class: 'notice' }, fmt(T.waitingFor, { n: d.an })), el('section', { class: 'panel' }, fila(d, yo.jid, { alTocar: tap })), todos); return; }
  root.replaceChildren(versus,
    el('a', { class: 'btn btn--yellow', id: 'dl-aceptar', href: hrefRonda(d, e.turno), onClick: tap }, fmt(T.acceptPlay, { i: e.turno + 1 })),
    el('p', { class: 'dl-nota center' }, fmt(T.acceptNote, { n: d.an })), todos);
}

function challenge(lista, yo) {
  import('../assets/js/duel-challenge.js').then(m => m.maybeChallenge(lista, yo, d => ({ T, info: titulo(d), href: hrefRonda(d, 0) }))).catch(() => {});
}

export async function drawDuels(root, { sub }) {
  const J = await jugador();
  // A challenge's link: its invite, drawn again when the visitor signs in
  const did = new URLSearchParams(location.search).get('d');
  if (esDid(did)) {
    const h1 = document.getElementById('dl-h1');
    const once = () => drawInvite(root, { sub, h1, did, J }).catch(() => {});
    J.escuchar(() => once());
    await once();
    return;
  }
  let turn = 0, abierta = false; // the new-duel sheet opens on its own once, for a first-timer
  const draw = async () => {
    const mine = ++turn;
    const yo = leerYo();
    // Everyone's recent duels, so the page is never empty: under your own duels when you have them
    const recientesP = J.duelos().then(D => D.recientes(12)).catch(() => []);
    const recientes = async () => panelRecientes((await recientesP).filter(d => !yo || (d.a !== yo.jid && d.b !== yo.jid)).slice(0, 8));
    if (!yo) {
      // Signed out: say plainly that duels need a name and PIN, then the sign-in card (the owner, 2026-11-23)
      sub.textContent = '';
      root.replaceChildren(bloqueJugador({ abierto: true, destacado: true, titulo: T.signInCard, alTocar: tap }));
      const r = await recientes();
      if (mine === turn && r) root.append(r);
      return;
    }
    const nuevo = el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-nuevo', onClick: () => { tap(); abrirNuevo({ lista, alTocar: tap }); } }, `⚔️ ${T.newDuel}`);
    let lista = [], leida = false;
    // While the duels load, the button and grey shapes where they will be (no blank, no pop-in)
    root.replaceChildren(nuevo, el('div', { class: 'dl-hueso dl-hueso--panel', 'aria-hidden': 'true' }), el('div', { class: 'dl-hueso dl-hueso--panel', 'aria-hidden': 'true' }));
    try { lista = await (await J.duelos()).mios(); leida = true; } catch (_) { /* offline: nothing to show */ }
    const otros = await recientes();
    if (mine !== turn) return;
    // ⚔️ Once per new duel someone else started: the «you've been challenged» screen (duel-challenge.js)
    if (leida) challenge(lista, yo);
    const r = record(lista, yo.jid);
    sub.textContent = r.g + r.p ? `${fmt(T.pageSub, { g: r.g, p: r.p })} · ${r.pct}%` : '';
    if (!lista.length) {
      root.replaceChildren(...[nuevo, el('p', { class: 'muted center' }, T.empty), otros].filter(Boolean));
      // A first-timer (no duel, no record) came to start one: open the sheet once, not on every redraw
      if (leida && !abierta && !document.getElementById('dl-hoja')) { abierta = true; abrirNuevo({ lista, alTocar: tap }); }
      return;
    }
    const orden = ordenar(lista, yo.jid);
    const es = d => estado(d, yo.jid);
    // One list, no tabs (the owner, 2026-11-23: few duels each): your turn first, with ▶ Play; then «Waiting for …»
    const abiertos = orden.filter(d => !es(d).termino);
    const hechos = orden.filter(d => es(d).termino);
    // Open duels as tickets, then your numbers and progress, your rivals, and the history on a line by date (the owner, 2026-11-25)
    const [actuales, historia] = listTimeline(abiertos, hechos, yo.jid, { alTocar: tap, lista });
    root.replaceChildren(...[nuevo,
      actuales,
      panelEstadisticas(lista, yo.jid),
      panelProgress(lista, yo.jid),
      panelRivalidades(lista, yo.jid, { alTocar: tap }),
      historia,
      otros].filter(Boolean));
  };
  J.escuchar(() => draw());
  await draw();
}
