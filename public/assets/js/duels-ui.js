/**
 * The duels' screens (lab flag rivals, duels.js): a duel as a card and as a row, the profile's
 * section, the new-duel sheet (also the ⚔️ of a ranking's row, with the rival and the game chosen)
 * and the ⚔️ itself. The styles are in `assets/css/duels.css`, which `cargarCss()` adds once.
 */
import { el } from './ui.js';
import { gameIcon } from './game-icon.js';
import { getLang } from './i18n.js';
import { SUELTOS } from './games.js';
import { jugador, leerYo } from './jugador.js';
import { estado, record, nemesis, sugeridos, linkRonda, roundGame, FORMATOS } from './duels.js';
import { TEXTS } from './duels-texts.js';

const lang = getLang();
export const T = TEXTS[lang] || TEXTS.es;
export const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const RAIZ = new URL('../../', import.meta.url).href;

/** The games a duel can be played in: the ones with their own page that take a seed. */
export const DUEL_GAMES = SUELTOS.filter(g => !g.labs && g.available !== false && !g.oculto && !g.bodega);
export const duelGame = id => DUEL_GAMES.find(g => g.id === id) || null;
const nombreJuego = g => g.name?.[lang] || g.name?.es || g.id;

export function cargarCss() {
  if (document.querySelector('link[data-duels]')) return;
  document.head.append(el('link', { rel: 'stylesheet', href: `${RAIZ}assets/css/duels.css`, 'data-duels': '' }));
}

/** Where round i of duel d is played. */
export function hrefRonda(d, i) {
  const g = duelGame(roundGame(d, i));
  return g ? linkRonda(d, i, RAIZ, g.path) : `${RAIZ}duels/`;
}
export const hrefDuelos = () => `${RAIZ}duels/`;

const puntos = e => e.rondas.map(r => el('span', { class: `dl-punto${r ? ` ${r}` : ''}`, 'aria-hidden': 'true' }));
const marcador = e => `${e.puntos[0]}–${e.puntos[1]}`;
export const titulo = d => { const g = duelGame(d.g); return `${d.gr ? T.customTitle : g ? `${g.emoji} ${nombreJuego(g)}` : d.g} · ${T[d.f] || ''}`; };

/** A duel as a card (the profile's row). */
export function duelCard(d, me, { alTocar = () => {} } = {}) {
  const e = estado(d, me);
  const turno = e.turno >= 0;
  return el('div', { class: `panel dl-card${turno ? ' turno' : ''}`, 'data-duel': d.id },
    el('p', { class: 'dl-card-g' }, titulo(d)),
    el('div', { class: 'dl-vs' }, el('span', {}, leerYo()?.n || ''), el('b', { class: 'dl-marcador' }, marcador(e)), el('span', {}, e.rivalN)),
    el('div', { class: 'dl-puntos' }, puntos(e)),
    turno
      ? el('a', { class: 'btn btn--yellow btn--sm', href: hrefRonda(d, e.turno), onClick: alTocar }, T.yourTurn)
      : el('p', { class: 'dl-espera' }, e.termino ? T[e.gano === 1 ? 'won' : e.gano === -1 ? 'lost' : 'draw'] : fmt(T.waitingFor, { n: e.rivalN })));
}

/** A duel as a row (the all-duels page). */
export function fila(d, me, { alTocar = () => {} } = {}) {
  const e = estado(d, me);
  const fin = e.termino ? (e.gano === 1 ? 'w' : e.gano === -1 ? 'l' : 't') : null;
  const h = Math.max(1, Math.ceil((e.vence - Date.now()) / 3600000));
  return el('div', { class: 'dl-row', 'data-duel': d.id },
    el('div', { class: 'dl-row-txt' },
      el('b', {}, e.rivalN),
      el('small', {}, titulo(d) + (e.termino ? '' : ` · ${fmt(T.hoursLeft, { h })}`)),
      el('div', { class: 'dl-row-sc' }, el('span', { class: 'dl-puntos' }, puntos(e)), marcador(e))),
    fin ? el('span', { class: `dl-fin ${fin}` }, T[{ w: 'won', l: 'lost', t: 'draw' }[fin]])
      : e.turno >= 0 ? el('a', { class: 'btn btn--yellow btn--sm', href: hrefRonda(d, e.turno), onClick: alTocar }, T.play)
        : el('span', { class: 'dl-espera' }, fmt(T.waitingFor, { n: e.rivalN })));
}

/** The pills of a player's record. */
export function pildoras(lista, me) {
  const r = record(lista, me);
  // With duels open but none decided yet there is no record to show; with none at all, say so
  if (r.g + r.p === 0) return lista.length ? [] : [el('span', { class: 'dl-pill' }, T.pillNone)];
  return [el('span', { class: 'dl-pill' }, fmt(T.pillRecord, { g: r.g, p: r.p, pct: r.pct })), r.racha > 1 ? el('span', { class: 'dl-pill' }, fmt(T.pillStreak, { n: r.racha })) : null].filter(Boolean);
}

/** Open duels first (mine to play, then waiting), newest first within each. */
export function ordenar(lista, me) {
  const peso = d => { const e = estado(d, me); return e.turno >= 0 ? 0 : !e.termino ? 1 : 2; };
  return [...lista].sort((a, b) => peso(a) - peso(b) || b.at - a.at);
}

/** Your nemesis, the rival you lose to most, with ⚔️ Rematch (the profile and /duels/), or null. */
export function panelNemesis(lista, me, { alTocar = () => {} } = {}) {
  const nem = nemesis(lista, me);
  if (!nem) return null;
  return el('div', { class: 'panel dl-nemesis', id: 'dl-nemesis' },
    el('b', {}, `${T.nemesis} · ${nem.n} ${nem.g}–${nem.p}`),
    el('button', { type: 'button', class: 'btn btn--cyan btn--sm', onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: nem.jid, n: nem.n }, alTocar }); } }, T.rematch));
}

/** The invite link a challenger sends: the duel's own page, where the rival accepts (duels-page.js). */
export const inviteHref = d => `${RAIZ}duels/?d=${d.id}`;

/** Sends the invite to that one rival (the system's share menu; the link copied where there is none). */
export async function shareInvite(d, btn) {
  const { compartir } = await import('./compartir.js');
  const g = duelGame(d.g);
  const texto = fmt(T.inviteText, { a: d.an, juego: d.gr ? T.customTitle.replace(/^\S+\s/, '') : (g ? nombreJuego(g) : d.g), formato: T[d.f] });
  const r = await compartir({ titulo: T.inviteTitle, texto, url: inviteHref(d), que: 'duelo' });
  if (r === 'copied' && btn) { const antes = btn.textContent; btn.textContent = T.copied; setTimeout(() => { btn.textContent = antes; }, 2000); }
}

/**
 * The new-duel sheet (the owner, 2026-11-23: a quick duel and a custom one, step by step, always to
 * one rival). From a ranking's ⚔️ (`rival` and `juego`) it opens centred as a quick duel with both
 * chosen; from the profile it first asks ⚡ Quick or 🛠️ Custom. Quick: the rival, one game, best of
 * 3 or 5. Custom: 1 who, 2 how to win, 3 each round's game. Once sent, the challenger sends the
 * invite to that rival and can play round 1.
 */
export async function abrirNuevo({ rival = null, juego = null, lista = null, alTocar = () => {} } = {}) {
  cargarCss();
  const yo = leerYo();
  const centrado = !!rival && !!juego;
  let modo = centrado ? 'quick' : 'menu', paso = 1, editando = -1;
  let elegido = rival, formato = 'bo3', g = juego && duelGame(juego) ? juego : DUEL_GAMES[0]?.id;
  let gr = [];
  const ponerRondas = () => { const n = FORMATOS[formato]; gr = Array.from({ length: n }, (_, k) => gr[k] || g); };
  const titulo = el(centrado ? 'h2' : 'h3', { id: 'dl-titulo', class: centrado ? 'display display--md' : '' });
  const cerrarBtn = el('button', { type: 'button', class: 'icon-btn', 'aria-label': '✕' }, '✕');
  const cuerpo = el('div', { class: 'stack dl-sheet', 'aria-busy': 'true' });
  const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dl-titulo' },
    centrado ? null : el('div', { class: 'hoja-asa' }), el('div', { class: 'hoja-cabeza' }, titulo, cerrarBtn), cuerpo);
  const capa = el('div', { class: `hoja-capa${centrado ? ' portada-ventana' : ''}`, id: 'dl-hoja' }, el('div', { class: 'hoja-fondo' }), panel);
  const cerrar = () => { capa.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') cerrar(); };
  // Only a tap on the dimmed page closes it: a tap inside may redraw what it hit
  capa.addEventListener('click', e => { if (e.target === capa || e.target.classList.contains('hoja-fondo')) cerrar(); });
  cerrarBtn.addEventListener('click', () => { alTocar(); cerrar(); });
  document.addEventListener('keydown', onKey);
  titulo.textContent = centrado ? `⚔️ ${T.challenge}` : `⚔️ ${T.newDuel}`;
  // Grey shapes where the content will be, so the sheet opens at once at about its final size
  // instead of growing as the network answers (the owner, 2026-11-23: it was jumpy)
  const esqueleto = n => el('div', { class: 'dl-chips dl-esqueleto', 'aria-hidden': 'true' }, Array.from({ length: n }, () => el('span', { class: 'dl-hueso' })));
  if (!yo) cuerpo.replaceChildren(esqueleto(3), el('div', { class: 'dl-hueso dl-hueso--btn', 'aria-hidden': 'true' }));
  document.body.append(capa);

  const pJ = jugador();
  if (!yo) {
    const J = await pJ;
    const { bloqueJugador } = await import('./ranking.js');
    cuerpo.removeAttribute('aria-busy');
    cuerpo.replaceChildren(bloqueJugador({ abierto: true, destacado: true, titulo: T.signInCard, alTocar }));
    J.escuchar(() => { if (leerYo() && capa.isConnected) { cerrar(); abrirNuevo({ rival, juego, lista, alTocar }); } });
    return capa;
  }
  const pDuelos = pJ.then(J => J.duelos());
  // Who to suggest: the rivals already played, the cup friends this phone knows and the players of
  // the player's own cups (the owner, 2026-11-23: pre-populated with the people you have played with).
  // Loaded while the sheet is already drawn; only the rival chips wait for it.
  let candidatos = rival ? [rival] : null;
  const cargarCandidatos = async () => {
    const J = await pJ, D = await pDuelos;
    const misDuelos = lista || await D.mios().catch(() => []);
    const amigos = { ...J.amigos() };
    try {
      const copas = (await J.copas()).slice(0, 6);
      for (const ps of await Promise.all(copas.map(c => D.deCopa(c.code).catch(() => [])))) for (const x of ps) amigos[x.jid] ||= x.n;
    } catch (_) { /* no signal: what this phone knows */ }
    let cs = sugeridos(misDuelos, yo.jid, amigos);
    // Then the players active lately, so there is always someone to pick (the owner, 2026-11-23:
    // signed in with no duels and no cups, nobody was suggested)
    if (cs.length < 10) for (const x of await D.activos(10).catch(() => [])) if (!cs.some(c => c.jid === x.jid)) cs.push(x);
    if (rival && !cs.some(c => c.jid === rival.jid)) cs = [rival, ...cs];
    return cs;
  };
  const elegir = c => { elegido = c; if (!candidatos) candidatos = []; if (!candidatos.some(x => x.jid === c.jid)) candidatos = [c, ...candidatos]; };
  const error = el('p', { class: 'rk-error', 'aria-live': 'polite' });
  const tap = f => () => { alTocar(); f(); pintar(); };
  const label = t => el('p', { class: 'dl-label' }, t);
  const chips = (opciones, actual, poner) => el('div', { class: 'dl-chips' }, opciones.map(([v, txt]) => el('button', {
    type: 'button', class: `chip-btn${v === actual ? ' on' : ''}`, 'data-v': v, onClick: tap(() => poner(v)),
  }, txt)));
  // `primero`: that game's tile goes first, so the one chosen from a ranking is in view
  const tiles = (actual, poner, primero = null) => el('div', { class: 'dl-juegos' }, (primero && duelGame(primero) ? [duelGame(primero), ...DUEL_GAMES.filter(x => x.id !== primero)] : DUEL_GAMES).map(x => el('button', {
    type: 'button', class: `dl-juego${x.id === actual ? ' on' : ''}`, 'data-g': x.id, onClick: tap(() => poner(x.id)),
  }, el('span', { class: 'dl-ic', 'aria-hidden': 'true' }, gameIcon(x)), el('span', {}, nombreJuego(x)))));
  // The search field is made once and kept: typing never redraws the sheet, so the keyboard stays put
  // and nothing takes the focus on its own (the owner, 2026-11-23: the keyboard kept popping up)
  const inp = el('input', { type: 'search', id: 'dl-nombre', maxlength: '20', autocomplete: 'off', enterkeyhint: 'search', 'aria-label': T.searchLabel, placeholder: `🔍 ${T.searchLabel}` });
  const res = el('div', { class: 'dl-chips', id: 'dl-resultados', 'aria-live': 'polite' });
  let espera = null, consulta = 0;
  inp.addEventListener('input', () => {
    clearTimeout(espera);
    const q = inp.value.trim();
    if (q.length < 2) { res.replaceChildren(); return; }
    espera = setTimeout(async () => {
      const mia = ++consulta;
      const D = await pDuelos;
      const r = await D.buscar(q).catch(() => []);
      if (mia !== consulta) return;
      res.replaceChildren(...(r.length ? r.map(c => el('button', { type: 'button', class: 'chip-btn', 'data-jid': c.jid, onClick: tap(() => { elegir(c); inp.value = ''; res.replaceChildren(); }) }, c.n))
        : [el('p', { class: 'dl-nota' }, T.noOne)]));
    }, 300);
  });
  const rivales = () => el('div', { class: 'stack' },
    label(T.rival),
    !candidatos ? esqueleto(5) : el('div', { class: 'dl-chips', id: 'dl-rivales' },
      candidatos.slice(0, 10).map(c => el('button', { type: 'button', class: `chip-btn${elegido?.jid === c.jid ? ' on' : ''}`, 'data-jid': c.jid, onClick: tap(() => { elegido = c; }) }, c.n))),
    el('div', { class: 'field dl-campo' }, inp), res);
  const versus = () => el('div', { class: 'dl-versus' }, el('div', {}, el('b', {}, yo.n)), el('span', { class: 'display display--md' }, 'VS'), el('div', {}, el('b', {}, elegido.n)));
  const enviarBtn = () => el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-enviar', disabled: !elegido, onClick: enviar }, elegido ? fmt(T.send, { n: elegido.n }) : T.pickRival);

  const vistas = {
    menu: () => [
      el('button', { type: 'button', class: 'opcion dl-modo', id: 'dl-rapido', onClick: tap(() => { modo = 'quick'; }) }, el('b', {}, T.quickTitle), el('span', { class: 'dl-nota' }, T.quickSub)),
      el('button', { type: 'button', class: 'opcion dl-modo', id: 'dl-medida', onClick: tap(() => { modo = 'custom'; paso = 1; }) }, el('b', {}, T.customTitle), el('span', { class: 'dl-nota' }, T.customSub))],
    quick: () => [
      centrado ? versus() : rivales(),
      // How many rounds first, then the game (the owner, 2026-11-24), with most points too
      el('div', { class: 'stack' }, label(T.format), chips([['bo3', T.bo3], ['bo5', T.bo5], ['pts', T.pts]], formato, v => { formato = v; })),
      // From a ranking the game comes chosen, and can be changed (the owner, 2026-11-23)
      el('div', { class: 'stack' }, label(T.game), tiles(g, v => { g = v; }, centrado ? juego : null)),
      el('p', { class: 'dl-nota' }, T.how), error, enviarBtn()],
    custom: () => {
      const cabeza = el('div', { class: 'dl-pasos' }, el('span', { class: 'dl-nota' }, fmt(T.stepOf, { n: paso })),
        el('span', { class: 'dl-puntos' }, [1, 2, 3].map(k => el('span', { class: `dl-punto${k <= paso ? ' w' : ''}`, 'aria-hidden': 'true' }))));
      if (paso === 1) return [cabeza, label(T.stepWho), rivales(),
        el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-siguiente', disabled: !elegido, onClick: tap(() => { paso = 2; }) }, elegido ? T.next : T.pickRival)];
      if (paso === 2) return [cabeza, label(T.stepHow),
        ...['bo3', 'bo5', 'pts'].map(f => el('button', { type: 'button', class: `opcion dl-modo${f === formato ? ' on' : ''}`, 'data-f': f, onClick: tap(() => { formato = f; }) },
          el('b', {}, T[f]), el('span', { class: 'dl-nota' }, T[`${f}How`]))),
        el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-siguiente', onClick: tap(() => { ponerRondas(); editando = -1; paso = 3; }) }, T.next)];
      ponerRondas();
      return [cabeza,
        el('div', { class: 'dl-head' }, label(T.stepGames), el('button', { type: 'button', class: 'chip-btn', id: 'dl-mezclar', onClick: tap(() => {
          const pool = [...DUEL_GAMES].sort(() => Math.random() - 0.5); gr = gr.map((_, k) => pool[k % pool.length].id); editando = -1;
        }) }, T.mix)),
        ...gr.map((id, k) => {
          const x = duelGame(id);
          const fila = el('button', { type: 'button', class: `dl-ronda${editando === k ? ' on' : ''}`, 'data-ronda': k, onClick: tap(() => { editando = editando === k ? -1 : k; }) },
            el('span', { class: 'dl-nota' }, fmt(T.roundN, { i: k + 1 })), el('span', { class: 'dl-ic', 'aria-hidden': 'true' }, x ? gameIcon(x) : ''), el('b', {}, x ? nombreJuego(x) : id), el('span', { class: 'dl-nota' }, '›'));
          return editando === k ? el('div', { class: 'stack' }, fila, tiles(id, v => { gr[k] = v; editando = -1; })) : fila;
        }),
        el('p', { class: 'dl-nota' }, T.how), error, enviarBtn()];
    },
  };
  function pintar() {
    cuerpo.removeAttribute('aria-busy');
    titulo.textContent = centrado ? `⚔️ ${T.challenge}` : modo === 'quick' ? T.quickTitle : modo === 'custom' ? T.customTitle : `⚔️ ${T.newDuel}`;
    cuerpo.replaceChildren(...vistas[modo]().filter(Boolean));
  }
  async function enviar() {
    if (!elegido) return;
    alTocar();
    error.textContent = '';
    try {
      const custom = modo === 'custom';
      const D = await pDuelos;
      const d = await D.retar({ b: elegido.jid, bn: elegido.n, g: custom ? gr[0] : g, f: formato, gr: custom ? gr : null });
      const invitar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-invitar', onClick: () => { alTocar(); shareInvite(d, invitar); } }, fmt(T.shareInvite, { n: elegido.n }));
      cuerpo.replaceChildren(
        el('p', { class: 'notice' }, fmt(T.sent, { n: elegido.n })), invitar,
        el('a', { class: 'btn btn--cyan', id: 'dl-jugar', href: hrefRonda(d, 0), onClick: alTocar }, fmt(T.playRound, { i: 1 })));
    } catch (_) { error.textContent = T.errSend; }
  }
  pintar();
  const conRivales = () => capa.isConnected && ((modo === 'quick' && !centrado) || (modo === 'custom' && paso === 1));
  if (!centrado) cargarCandidatos().catch(() => []).then(cs => { candidatos = cs; if (conRivales()) pintar(); });
  return capa;
}

/**
 * The ⚔️ on every other player's row of a ranking whose table is a duel game: added to the rows
 * as they are drawn (a MutationObserver on `root`), it opens the challenge for that player and game.
 */
export function retosEnRankings(root, { alTocar = () => {} } = {}) {
  cargarCss();
  const poner = () => {
    const yo = leerYo()?.jid;
    root.querySelectorAll('.rk-ranking[data-tabla]').forEach(caja => {
      const id = String(caja.dataset.tabla).split('_')[0];
      if (!duelGame(id)) return;
      caja.querySelectorAll('.rk-fila[data-jid]:not(.dl-con)').forEach(f => {
        if (!f.dataset.jid) return;
        // Your own row: an empty cell where the ⚔️ would be, so the columns stay aligned
        if (f.dataset.jid === yo || f.classList.contains('yo')) { f.classList.add('dl-con'); f.append(el('span', { class: 'dl-retar-vacio', 'aria-hidden': 'true' })); return; }
        const n = f.querySelector('.rk-n')?.textContent?.replace(/^\p{RI}{2}\s*/u, '').trim() || '?';
        f.classList.add('dl-con');
        f.append(el('button', {
          type: 'button', class: 'dl-retar', 'aria-label': fmt(T.challengeRow, { n }),
          onClick: e => { e.stopPropagation(); alTocar(); abrirNuevo({ rival: { jid: f.dataset.jid, n }, juego: id, alTocar }); },
        }, '⚔️'));
      });
    });
  };
  poner();
  new MutationObserver(poner).observe(root, { childList: true, subtree: true });
}

/**
 * The /duels/ page's list of other people's recent duels (the owner, 2026-11-23: the page feels
 * populated even before you have a duel of your own): «Ana 2–1 Beto», the game and how it stands.
 */
export function panelRecientes(lista) {
  if (!lista.length) return null;
  return el('section', { class: 'panel', id: 'dl-recientes' },
    el('p', { class: 'lead' }, T.recentTitle),
    lista.map(d => {
      const e = estado(d, d.a);
      const fin = e.termino ? (e.gano === 1 ? fmt(T.recentWon, { n: d.an }) : e.gano === -1 ? fmt(T.recentWon, { n: d.bn }) : T.recentDraw) : T.recentLive;
      return el('div', { class: 'dl-row', 'data-duel': d.id },
        el('div', { class: 'dl-row-txt' },
          el('b', {}, `${d.an} ${e.puntos[0]}–${e.puntos[1]} ${d.bn}`),
          el('small', {}, titulo(d))),
        el('span', { class: `dl-fin${e.termino ? '' : ' t'}` }, fin));
    }));
}
