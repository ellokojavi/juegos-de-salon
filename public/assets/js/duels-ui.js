/**
 * The duels' screens (lab flag rivals, duels.js): a duel as a card and as a row, the profile's
 * section and the new-duel sheet (also from a player's sheet in a ranking, player-peek.js, with the rival
 * and the game chosen). The styles are in `assets/css/duels.css`, which `cargarCss()` adds once.
 */
import { el } from './ui.js';
import { gameIcon } from './game-icon.js';
import { getLang } from './i18n.js';
import { SUELTOS, DUEL_VERSIONS } from './games.js';
import { jugador, leerYo } from './jugador.js';
import { estado, record, nemesis, archirrival, rivalidades, estadisticas, sugeridos, linkRonda, roundGame, roundLevel, FORMATOS, esPuntos, formatoDe, DURACION } from './duels.js';
import { TEXTS } from './duels-texts.js';
import { slotRoll } from './slot-roll.js';

const lang = getLang();
export const T = TEXTS[lang] || TEXTS.es;
export const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const RAIZ = new URL('../../', import.meta.url).href;

/** The games a duel can be played in: the ones with their own page that take a seed. */
export const DUEL_GAMES = SUELTOS.filter(g => !g.labs && g.available !== false && !g.oculto && !g.bodega);
export const duelGame = id => DUEL_GAMES.find(g => g.id === id) || null;
const nombreJuego = g => g.name?.[lang] || g.name?.es || g.id;
/** A game's levels (its variants, D-331: Sudoku 🟢 easy / 🔴 hard…), or null: a duel locks one per round (the owner, 2026-11-25). */
export const levelsOf = id => DUEL_VERSIONS[id] || null;
/** A level's name, explicit: «🔴 Difícil». */
export const nombreNivel = v => T.levels?.[v] || v;
/** A level as its dot and its word, the word hidden by CSS when the row has no room for it: «🔴 Difícil» → «🔴». */
const nivelCorto = v => {
  const [, dot, word] = nombreNivel(v).match(/^([\p{Extended_Pictographic}\uFE0F\u200D]+)\s+(.+)$/u) || [null, '', nombreNivel(v)];
  return el('span', { class: 'dl-nota dl-ronda-nivel', title: nombreNivel(v) }, dot, el('span', { class: 'dl-nivel-txt' }, ` ${word}`));
};

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
/** A format's name: «Mejor de 7», «Más puntos», «Más puntos en 6 rondas». */
export const nombreFormato = f => (T[f] || (esPuntos(f) ? fmt(T.ptsN, { n: FORMATOS[f] }) : FORMATOS[f] ? fmt(T.bestOfN, { n: FORMATOS[f] }) : ''));
export const titulo = d => {
  const g = duelGame(d.g), v = !d.gr && roundLevel(d, 0);
  return `${d.gr ? T.customTitle : g ? `${g.emoji} ${nombreJuego(g)}` : d.g}${v ? ` ${nombreNivel(v)}` : ''} · ${nombreFormato(d.f)}`;
};

/** A duel as a card (the profile's row). */
export function duelCard(d, me, { alTocar = () => {} } = {}) {
  const e = estado(d, me);
  const turno = e.turno >= 0;
  return el('div', { class: `panel dl-card${turno ? ' turno' : ''}`, 'data-duel': d.id },
    el('a', { class: 'dl-card-g', href: hrefDuelo(d), onClick: alTocar }, `${titulo(d)} ›`),
    el('div', { class: 'dl-vs' }, el('span', {}, leerYo()?.n || ''), el('b', { class: 'dl-marcador' }, marcador(e)), el('span', {}, e.rivalN)),
    el('div', { class: 'dl-puntos' }, puntos(e)),
    turno
      ? el('a', { class: 'btn btn--yellow btn--sm', href: hrefRonda(d, e.turno), onClick: alTocar }, T.yourTurn)
      : el('p', { class: 'dl-espera' }, e.termino ? T[e.gano === 1 ? 'won' : e.gano === -1 ? 'lost' : 'draw'] : fmt(T.waitingFor, { n: e.rivalN })));
}

/** A duel as a row (the all-duels page); a finished one carries ⚔️ Rematch (same rival, game and format). */
export function fila(d, me, { alTocar = () => {}, lista = null } = {}) {
  const e = estado(d, me);
  const fin = e.termino ? (e.gano === 1 ? 'w' : e.gano === -1 ? 'l' : 't') : null;
  const h = Math.max(1, Math.ceil((e.vence - Date.now()) / 3600000));
  return el('div', { class: 'dl-row', 'data-duel': d.id },
    el('a', { class: 'dl-row-txt dl-row-link', href: hrefDuelo(d), onClick: alTocar },
      el('b', {}, `${e.rivalN} ›`),
      el('small', {}, titulo(d) + (e.termino ? '' : ` · ${fmt(T.hoursLeft, { h })}`)),
      el('div', { class: 'dl-row-sc' }, el('span', { class: 'dl-puntos' }, puntos(e)), marcador(e))),
    fin ? el('div', { class: 'dl-fin-col' }, el('span', { class: `dl-fin ${fin}` }, T[{ w: 'won', l: 'lost', t: 'draw' }[fin]]),
      lista ? el('button', { type: 'button', class: 'chip-btn dl-revancha', 'data-rematch': d.id, onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: e.rival, n: e.rivalN }, juego: duelGame(d.g) ? d.g : null, formato: d.f, alTocar }); } }, T.rematch) : null)
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

/** Your nemesis, the rival you lose to most, with ⚔️ Rematch (the profile), or null. */
export function panelNemesis(lista, me, { alTocar = () => {} } = {}) {
  const nem = nemesis(lista, me);
  if (!nem) return null;
  return el('div', { class: 'panel dl-nemesis', id: 'dl-nemesis' },
    el('b', {}, `${T.nemesis} · ${nem.n} ${nem.g}–${nem.p}`),
    el('button', { type: 'button', class: 'btn btn--cyan btn--sm', onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: nem.jid, n: nem.n }, alTocar }); } }, T.rematch));
}

/** The stats of /duels/: a grid of tiles (record, win rate, streaks, rounds, rivals, favourite game), or null with none finished. */
export function panelEstadisticas(lista, me) {
  const s = estadisticas(lista, me);
  if (!s.jugados) return null;
  const g = s.juego && duelGame(s.juego);
  const tile = (icono, v, txt) => el('div', { class: 'dl-stat' }, el('i', { 'aria-hidden': 'true' }, icono), el('b', {}, String(v)), el('span', {}, txt));
  // The record as the arcade card's hero: wins and losses in their colours, the win rate as a bar (the owner, 2026-11-26)
  const total = s.g + s.p + (s.e || 0);
  const record = el('div', { class: 'dl-stat dl-stat--record' },
    el('div', { class: 'dl-record' },
      el('b', { class: 'w' }, String(s.g)), el('span', { class: 'dl-record-sep' }, '–'), el('b', { class: 'l' }, String(s.p)),
      s.e ? [el('span', { class: 'dl-record-sep' }, '–'), el('b', { class: 't' }, String(s.e))] : null),
    el('span', {}, T.statRecord),
    el('div', { class: 'dl-record-barra', 'aria-hidden': 'true' },
      el('i', { class: 'w', style: `width:${total ? (100 * s.g) / total : 0}%` }),
      s.e ? el('i', { class: 't', style: `width:${(100 * s.e) / total}%` }) : null,
      el('i', { class: 'l', style: `width:${total ? (100 * s.p) / total : 0}%` })),
    el('small', {}, `${s.pct == null ? '–' : `${s.pct}%`} ${T.statPct}`));
  return el('section', { class: 'panel', id: 'dl-stats' },
    el('p', { class: 'lead' }, T.statsTitle),
    el('div', { class: 'dl-stats' },
      record,
      // Four tiles, two by two, each with its icon on top (the owner, 2026-11-26): the duel game is the fourth
      tile('🔥', s.racha, T.statStreak),
      tile('🏆', s.mejorRacha, T.statBest),
      tile('👥', s.rivales, T.statRivals),
      g ? el('div', { class: 'dl-stat dl-stat--juego' }, el('i', { 'aria-hidden': 'true' }, gameIcon(g)), el('b', {}, nombreJuego(g)), el('span', {}, T.statGameTile))
        : tile('🎮', '–', T.statGameTile)));
}

/**
 * The rivalries of /duels/: the arch rival (most duels) and the nemesis (loses to most) as two
 * cards, then every rival head to head, each with ⚔️ Rematch.
 */
export function panelRivalidades(lista, me, { alTocar = () => {} } = {}) {
  const todos = rivalidades(lista, me);
  if (!todos.length) return null;
  const arch = archirrival(lista, me), nem = nemesis(lista, me);
  const revancha = (x, grande = false) => el('button', { type: 'button', class: grande ? 'btn btn--cyan btn--sm' : 'chip-btn dl-revancha', 'data-rival': x.jid, onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: x.jid, n: x.n }, alTocar }); } }, T.rematch);
  const destacado = (x, etiqueta, cls, nota) => el('div', { class: `panel dl-destacado ${cls}`, id: `dl-${cls}` },
    el('p', { class: 'dl-label' }, etiqueta),
    el('div', { class: 'dl-vs' }, el('span', {}, leerYo()?.n || ''), el('b', { class: 'dl-marcador' }, `${x.g}–${x.p}`), el('span', {}, x.n)),
    el('p', { class: 'dl-nota center' }, nota), revancha(x, true));
  const tarjetas = [
    arch ? destacado(arch, nem?.jid === arch.jid ? `${T.archTitle} · 💀 ${T.nemesis}` : T.archTitle, 'arch', fmt(T.archNote, { t: arch.total })) : null,
    nem && nem.jid !== arch?.jid ? destacado(nem, `💀 ${T.nemesis}`, 'nemesis', fmt(T.nemesisNote, { p: nem.p })) : null,
  ].filter(Boolean);
  const etiqueta = x => (x.jid === arch?.jid && x.jid === nem?.jid ? `🔥 ${T.archTag} · 💀 ${T.nemesisTag}` : x.jid === arch?.jid ? `🔥 ${T.archTag}` : x.jid === nem?.jid ? `💀 ${T.nemesisTag}` : '');
  // Each rival's record by game, the same bars as «📈 Your progress» (the owner, 2026-11-25); the
  // rematch is a ⚔️ at the end of each game's bar: that rival, that game, the last format you played it in.
  const fin = lista.map(d => ({ d, e: estado(d, me) })).filter(q => q.e.termino).sort((a, b) => a.d.at - b.d.at);
  return el('div', { class: 'stack' },
    tarjetas.length ? el('div', { class: 'dl-destacados' }, tarjetas) : null,
    el('section', { class: 'panel', id: 'dl-rivalidades' },
      el('p', { class: 'lead' }, T.rivalsTitle),
      todos.slice(0, 12).map(x => {
        const tono = x.g > x.p ? 'w' : x.g < x.p ? 'l' : 't';
        const suyos = fin.filter(q => q.e.rival === x.jid);
        const filas = barrasPorJuego(suyos, (k, z) => {
          const jg = duelGame(k);
          return el('button', { type: 'button', class: 'dl-pj-ir', 'data-rival': x.jid, 'aria-label': fmt(T.rematchWith, { n: x.n, g: jg ? nombreJuego(jg) : T.customTitle }),
            onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: x.jid, n: x.n }, juego: jg ? k : null, formato: z.f, alTocar }); } }, '⚔️');
        });
        return el('div', { class: 'dl-rv', 'data-rival': x.jid },
          el('div', { class: 'dl-head' },
            el('div', { class: 'dl-row-txt' },
              el('b', {}, x.n),
              el('small', {}, [fmt(T.rivalLine, { t: x.total }), etiqueta(x)].filter(Boolean).join(' · '))),
            el('b', { class: `dl-h2h ${tono}` }, `${x.g}–${x.p}${x.e ? `–${x.e}` : ''}`)),
          el('div', { class: 'dl-pjs' }, filas));
      })));
}

/**
 * The record by game as bars (won in lime, lost in pink), most played first; `fin` is the finished
 * duels as { d, e }, oldest first. `extra(k, z)` adds an element at the end of each row.
 */
function barrasPorJuego(fin, extra = null) {
  const por = {};
  for (const { d, e } of fin) { const k = d.gr ? 'custom' : d.g; const z = (por[k] ||= { g: 0, p: 0, f: null }); if (e.gano === 1) z.g++; else if (e.gano === -1) z.p++; z.f = d.f; }
  return Object.entries(por).sort((a, b) => b[1].g + b[1].p - (a[1].g + a[1].p)).map(([k, z]) => {
    const jg = duelGame(k), tot = Math.max(1, z.g + z.p);
    return el('div', { class: `dl-pj${extra ? ' con-ir' : ''}` },
      el('span', { class: 'dl-pj-g' }, jg ? [el('span', { 'aria-hidden': 'true' }, gameIcon(jg)), ` ${nombreJuego(jg)}`] : T.customTitle),
      el('div', { class: 'dl-pj-barra', title: fmt(T.gameLine, z) }, el('span', { class: 'w', style: `width:${(100 * z.g) / tot}%` }), el('span', { class: 'l', style: `width:${(100 * z.p) / tot}%` })),
      el('small', {}, `${z.g}–${z.p}`),
      extra ? extra(k, z) : null);
  });
}

/** The invite link a challenger sends: the duel's own page, where the rival accepts (duels-page.js). */
export const inviteHref = d => `${RAIZ}duels/?d=${d.id}`;

/** Sends the invite to that one rival (the system's share menu; the link copied where there is none). */
export async function shareInvite(d, btn) {
  const [{ compartir, taglineLine }, { invite }] = await Promise.all([import('./compartir.js'), import('./share-templates.js')]);
  const g = duelGame(d.g);
  const v = !d.gr && roundLevel(d, 0);
  const juego = d.gr ? T.customTitle.replace(/^\S+\s/, '') : `${g ? nombreJuego(g) : d.g}${v ? ` ${nombreNivel(v)}` : ''}`;
  // Its template (share-templates.js): "⚔️ *Sudoku* · al mejor de 3", what the game is about (lab flag
  // share-tagline; a custom duel mixes games, so it has none) and who challenges
  const texto = invite({ head: { emoji: '⚔️', title: juego, context: nombreFormato(d.f) },
    tagline: d.gr ? '' : taglineLine(g?.tagline, lang), lines: [fmt(T.inviteText, { a: d.an, juego, formato: nombreFormato(d.f) })] });
  const r = await compartir({ titulo: T.inviteTitle, texto, url: inviteHref(d), que: 'duelo' });
  if (r === 'copied' && btn) { const antes = btn.textContent; btn.textContent = T.copied; setTimeout(() => { btn.textContent = antes; }, 2000); }
}

/**
 * The new-duel sheet (the owner, 2026-11-23: a quick duel and a custom one, step by step, always to
 * one rival). It always opens on the quick duel (from a player's sheet in a ranking, centred, with `rival` and `juego`
 * chosen): the rival, best of 3 or 5 or most points, one game; under its button, 🛠️ a custom duel
 * (the owner, 2026-11-24): 1 who, 2 how to win (best of 3, 5, 7 or 9, or most points), 3 each round's game. Once sent, the challenger sends the
 * invite to that rival and can play round 1.
 */
export async function abrirNuevo({ rival = null, juego = null, formato: f0 = null, lista = null, alTocar = () => {} } = {}) {
  cargarCss();
  const yo = leerYo();
  const centrado = !!rival && !!juego;
  // Always the quick duel first; the custom one is a link under its button (the owner, 2026-11-24)
  let modo = 'quick', paso = 1, editando = -1;
  let elegido = rival, formato = FORMATOS[f0] ? f0 : 'bo3', g = juego && duelGame(juego) ? juego : DUEL_GAMES[0]?.id;
  let gr = [], rodar = false, pararRueda = () => {};
  // The level of the quick duel's game and of each custom round: never chosen for the player, it must be picked
  // explicitly when the game has levels, and is locked for both once sent (the owner, 2026-11-25)
  let nivel = null, lvs = [];
  const ponerRondas = () => { const n = FORMATOS[formato]; lvs = Array.from({ length: n }, (_, k) => (gr[k] ? lvs[k] ?? null : nivel)); gr = Array.from({ length: n }, (_, k) => gr[k] || g); };
  const ponerJuego = v => { if (v !== g) nivel = null; g = v; };
  const faltaNivel = () => (modo === 'custom' ? gr.some((id, k) => levelsOf(id) && !lvs[k]) : !!levelsOf(g) && !nivel);
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
    J.escuchar(() => { if (leerYo() && capa.isConnected) { cerrar(); abrirNuevo({ rival, juego, formato: f0, lista, alTocar }); } });
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
  const enviarBtn = () => el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-enviar', disabled: !elegido || faltaNivel(), onClick: enviar }, !elegido ? T.pickRival : faltaNivel() ? T.pickLevel : fmt(T.send, { n: elegido.n }));
  // The levels of a game that has them, right under its game: none is picked until the player picks one
  const niveles = (id, actual, poner) => (levelsOf(id) ? el('div', { class: 'stack', id: 'dl-niveles' }, label(T.level),
    el('div', { class: 'dl-chips', role: 'group', 'aria-label': T.level }, levelsOf(id).map(v => el('button', {
      type: 'button', class: `chip-btn${v === actual ? ' on' : ''}`, 'data-nivel': v, 'aria-pressed': String(v === actual), onClick: tap(() => poner(v)),
    }, nombreNivel(v)))),
    el('p', { class: 'dl-nota' }, T.levelNote)) : null);

  const volverRapido = () => el('button', { type: 'button', class: 'link-btn', id: 'dl-rapido', onClick: tap(() => { modo = 'quick'; editando = -1; if (!['bo3', 'bo5', 'pts'].includes(formato)) formato = 'bo3'; }) }, T.quickLink);
  const vistas = {
    quick: () => [
      centrado ? versus() : rivales(),
      // How many rounds first, then the game (the owner, 2026-11-24), with most points too
      el('div', { class: 'stack' }, label(T.format), chips([['bo3', T.bo3], ['bo5', T.bo5], ['pts', T.pts]], formato, v => { formato = v; })),
      // From a ranking the game comes chosen, and can be changed (the owner, 2026-11-23)
      el('div', { class: 'stack' }, label(T.game), tiles(g, ponerJuego, centrado ? juego : null)),
      niveles(g, nivel, v => { nivel = v; }),
      el('p', { class: 'dl-nota' }, T.how), error, enviarBtn(),
      el('button', { type: 'button', class: 'link-btn', id: 'dl-medida', onClick: tap(() => { modo = 'custom'; paso = 1; if (!FORMATOS[formato]) formato = 'bo3'; }) }, T.customLink)],
    custom: () => {
      const cabeza = el('div', { class: 'dl-pasos' }, el('span', { class: 'dl-nota' }, fmt(T.stepOf, { n: paso })),
        el('span', { class: 'dl-puntos' }, [1, 2, 3].map(k => el('span', { class: `dl-punto${k <= paso ? ' w' : ''}`, 'aria-hidden': 'true' }))));
      if (paso === 1) return [cabeza, label(T.stepWho), rivales(),
        el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-siguiente', disabled: !elegido, onClick: tap(() => { paso = 2; }) }, elegido ? T.next : T.pickRival), volverRapido()];
      // First how to win, then how many rounds (the owner, 2026-11-24): most rounds won takes an odd
      // number, 3 to 9, so there is always a winner; most points any number, 2 to 9
      const puntosModo = esPuntos(formato), n = FORMATOS[formato];
      const ponerModo = m => { const k = m === 'pts' ? n : (n % 2 ? Math.max(3, n) : n + 1); formato = formatoDe(m, Math.min(9, k)); };
      const modoBtn = (m, titulo, sub) => el('button', { type: 'button', class: `opcion dl-modo${(m === 'pts') === puntosModo ? ' on' : ''}`, 'data-modo': m, 'aria-pressed': String((m === 'pts') === puntosModo), onClick: tap(() => ponerModo(m)) },
        el('b', {}, titulo), el('span', { class: 'dl-nota' }, sub));
      const cuantas = puntosModo ? [2, 3, 4, 5, 6, 7, 8, 9] : [3, 5, 7, 9];
      if (paso === 2) return [cabeza, label(T.stepHow),
        modoBtn('bo', T.winsTitle, T.winsSub), modoBtn('pts', T.ptsTitle, T.ptsSub),
        el('div', { class: 'stack', id: 'dl-rondas' }, label(T.roundsLabel),
          el('div', { class: 'dl-chips', role: 'group', 'aria-label': T.roundsLabel }, cuantas.map(k => el('button', {
            type: 'button', class: `chip-btn${k === n ? ' on' : ''}`, 'data-n': k, 'aria-pressed': String(k === n), onClick: tap(() => { formato = formatoDe(puntosModo ? 'pts' : 'bo', k); }),
          }, String(k)))),
          el('p', { class: 'dl-nota' }, puntosModo ? fmt(T.ptsHowN, { n }) : fmt(T.winsHowN, { k: Math.floor(n / 2) + 1, n }))),
        el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-siguiente', onClick: tap(() => { ponerRondas(); editando = -1; paso = 3; }) }, T.next)];
      ponerRondas();
      return [cabeza,
        el('div', { class: 'dl-head' }, label(T.stepGames), el('button', { type: 'button', class: 'chip-btn', id: 'dl-mezclar', onClick: tap(() => {
          const pool = [...DUEL_GAMES].sort(() => Math.random() - 0.5); gr = gr.map((_, k) => pool[k % pool.length].id); editando = -1; rodar = true;
          // Mixed rounds get a level too, shown on their row like any other
          lvs = gr.map(id => { const vs = levelsOf(id); return vs ? vs[Math.floor(Math.random() * vs.length)] : null; });
        }) }, T.mix)),
        ...gr.map((id, k) => {
          const x = duelGame(id);
          const fila = el('button', { type: 'button', class: `dl-ronda${editando === k ? ' on' : ''}`, 'data-ronda': k, onClick: tap(() => { editando = editando === k ? -1 : k; }) },
            el('span', { class: 'dl-nota' }, fmt(T.roundN, { i: k + 1 })), el('span', { class: 'dl-ic slot-reel', 'aria-hidden': 'true' }, x ? gameIcon(x) : ''), el('span', { class: `dl-ronda-txt${levelsOf(id) && !lvs[k] ? ' falta' : ''}` }, el('b', { class: 'slot-reel' }, x ? nombreJuego(x) : id),
              // The level after the game, on the same line; with no room, only its dot (the owner, 2026-11-25)
              levelsOf(id) ? (lvs[k] ? nivelCorto(lvs[k]) : el('span', { class: 'dl-nota dl-ronda-nivel falta' }, T.pickLevel)) : null),
            el('span', { class: 'dl-nota' }, '›'));
          // Picking a game with levels keeps the round open on its levels; any other closes it
          return editando === k ? el('div', { class: 'stack' }, fila, tiles(id, v => { if (v !== gr[k]) lvs[k] = null; gr[k] = v; if (!levelsOf(v)) editando = -1; }),
            niveles(id, lvs[k], v => { lvs[k] = v; editando = -1; })) : fila;
        }),
        el('p', { class: 'dl-nota' }, T.how), error, enviarBtn(), volverRapido()];
    },
  };
  /**
   * Redraws the sheet. When what it holds grows or shrinks (a step, the rounds' chips, a round opened),
   * the sheet eases from its old height to the new one instead of jumping, and a new step fades in
   * (the owner, 2026-11-24: smoother size changes). With reduced motion it just redraws.
   */
  let vista = null, alto = null, dondeAntes = null;
  function pintar() {
    // The first paint is not eased: the sheet opens at its full size (the owner, 2026-11-28: it grew as it opened)
    const suave = vista !== null && !matchMedia('(prefers-reduced-motion: reduce)').matches && panel.isConnected;
    const h0 = suave ? panel.getBoundingClientRect().height : 0;
    cuerpo.removeAttribute('aria-busy');
    titulo.textContent = centrado ? `⚔️ ${T.challenge}` : modo === 'custom' ? T.customTitle : `⚔️ ${T.newDuel}`;
    // Redrawing keeps where the player was: each games carousel and the sheet itself stay scrolled as they were
    // (the owner, 2026-11-28: tapping a game sent the carousel back to its start)
    const donde = `${modo}${paso}${editando}`, mismo = donde === dondeAntes;
    const antes = mismo ? [...cuerpo.querySelectorAll('.dl-juegos')].map(x => x.scrollLeft) : [], arriba = panel.scrollTop;
    dondeAntes = donde;
    cuerpo.replaceChildren(...vistas[modo]().filter(Boolean));
    cuerpo.querySelectorAll('.dl-juegos').forEach((x, k) => { if (antes[k]) x.scrollLeft = antes[k]; });
    panel.scrollTop = arriba;
    pararRueda();
    if (rodar) { rodar = false; rodarRondas(); }
    const clave = `${modo}${paso}`, nueva = vista !== null && clave !== vista;
    vista = clave;
    if (!suave) return;
    alto?.cancel(); // an easing still running pins the old height: drop it before measuring the new one
    const h1 = panel.getBoundingClientRect().height;
    if (Math.abs(h1 - h0) > 1) {
      alto = panel.animate([{ height: `${h0}px`, overflow: 'hidden' }, { height: `${h1}px`, overflow: 'hidden' }], { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    }
    if (nueva) cuerpo.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  }
  /**
   * 🎲 Mix rolls the rounds like La Copa's week (D-425, slot-roll.js): the real draw is already painted,
   * each row runs through random duel games and stops on its own, top to bottom.
   */
  function rodarRondas() {
    const reales = new Map();
    pararRueda = slotRoll([...cuerpo.querySelectorAll('.dl-ronda')], DUEL_GAMES.map(x => x.id), (f, id) => {
      const ic = f.querySelector('.dl-ic'), b = f.querySelector('b');
      if (!reales.has(f)) reales.set(f, [[...ic.childNodes], b.textContent]);
      const x = id === null ? null : duelGame(id);
      if (!x) { const [n, t] = reales.get(f); ic.replaceChildren(...n); b.textContent = t; return; }
      ic.replaceChildren(gameIcon(x)); b.textContent = nombreJuego(x);
    });
  }
  async function enviar() {
    if (!elegido || faltaNivel()) return;
    alTocar();
    error.textContent = '';
    try {
      const custom = modo === 'custom';
      const D = await pDuelos;
      const lv = custom ? gr.map((id, k) => (levelsOf(id) ? lvs[k] : null)) : Array.from({ length: FORMATOS[formato] }, () => (levelsOf(g) ? nivel : null));
      const d = await D.retar({ b: elegido.jid, bn: elegido.n, g: custom ? gr[0] : g, f: formato, gr: custom ? gr : null, lv });
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

/**
 * A duel's own page (/duels/?d=…, for its two players; the owner, 2026-11-25): the duel as a big
 * card (both faces, the score, how it stands and the clock), then every round as a step on a track:
 * decided, played by one, your turn, still to play, or not needed. A rival's score stays hidden until
 * you play that round, so nobody plays knowing the number to beat.
 */
export function duelView(d, me, { lista = [], alTocar = () => {} } = {}) {
  const e = estado(d, me);
  const yoN = (d.a === me ? d.an : d.bn) || T.you;
  const fin = e.termino ? (e.gano === 1 ? 'w' : e.gano === -1 ? 'l' : 't') : null;
  const cara = (n, cls) => el('div', { class: `dl-cara dl-cara--xl ${cls}` }, (n || '?').trim().charAt(0).toUpperCase());
  const lado = (n, cls, corona) => el('div', { class: `dl-lado ${cls}` }, cara(n, cls), corona ? el('span', { class: 'dl-corona', 'aria-hidden': 'true' }, '👑') : null, el('b', {}, n));
  const quedan = Math.max(0, e.vence - Date.now());
  const estadoTxt = fin ? T[{ w: 'won', l: 'lost', t: 'draw' }[fin]]
    : e.turno >= 0 ? T.yourTurn : fmt(T.waitingFor, { n: e.rivalN });
  const hero = el('section', { class: `panel dl-hero${fin ? ` fin-${fin}` : e.turno >= 0 ? ' turno' : ''}`, id: 'dl-hero' },
    el('div', { class: 'dl-hero-top' },
      el('span', { class: 'dl-chip' }, titulo(d)),
      d.id?.startsWith('demo') ? el('span', { class: 'dl-chip dl-chip--demo' }, T.demoTag) : null),
    el('div', { class: 'dl-hero-vs' },
      lado(yoN, `yo${halos(e.puntos)[0]}`, fin === 'w'),
      el('div', { class: 'dl-hero-sc' }, el('b', { class: 'dl-marcador dl-marcador--xl' }, `${e.puntos[0]}–${e.puntos[1]}`), el('div', { class: 'dl-puntos' }, puntos(e))),
      lado(e.rivalN, `el${halos(e.puntos)[1]}`, fin === 'l')),
    // Your turn: the button to play it right on the card, and whether the rival already did (the owner, 2026-11-25)
    e.turno >= 0 ? el('div', { class: 'dl-hero-jugar' },
      el('a', { class: 'btn btn--yellow', id: 'dl-jugar', href: hrefRonda(d, e.turno), onClick: alTocar }, fmt(T.roundGo, { i: e.turno + 1 })),
      e.suyas[e.turno] ? el('small', {}, `🙈 ${fmt(T.roundTheyPlayed, { n: e.rivalN })} · ${T.roundHidden}`) : null)
      : el('p', { class: `dl-hero-estado${fin ? ` ${fin}` : ''}` }, estadoTxt),
    e.termino ? null : el('div', { class: 'dl-reloj' },
      el('div', { class: 'dl-reloj-barra', 'aria-hidden': 'true' }, el('span', { style: `width:${Math.round((100 * quedan) / DURACION)}%` })),
      el('small', {}, fmt(T.hoursLeft, { h: Math.max(1, Math.ceil(quedan / 3600000)) }))));

  const pasos = Array.from({ length: e.n }, (_, i) => {
    const g = duelGame(roundGame(d, i));
    const m = e.mias[i], s = e.suyas[i], r = e.rondas[i];
    let tipo, cuerpo;
    const num = (x, oculto) => el('b', { class: 'dl-paso-n' }, oculto ? '🙈' : x ? String(x.s) : '–');
    if (r) {
      tipo = `hecho ${r}`;
      cuerpo = el('div', { class: 'dl-paso-sc' }, num(m), el('span', { class: 'dl-paso-guion' }, '–'), num(s));
    } else if (e.termino) {
      tipo = 'nada';
      cuerpo = el('small', {}, T.roundNotNeeded);
    } else if (i === e.turno) {
      tipo = 'ahora';
      cuerpo = el('a', { class: 'dl-paso-ir', href: hrefRonda(d, i), onClick: alTocar, 'data-round': i }, s ? `🙈 ${T.yourTurn}` : T.yourTurn);
    } else if (m) {
      tipo = 'medio';
      cuerpo = el('div', { class: 'dl-paso-sc' }, num(m), el('span', { class: 'dl-paso-guion' }, '–'), el('b', { class: 'dl-paso-n espera' }, '⏳'));
    } else {
      tipo = 'futuro';
      cuerpo = el('small', {}, s ? fmt(T.roundTheyPlayed, { n: e.rivalN }) : `🔒 ${T.roundAhead}`);
    }
    return el('li', { class: `dl-paso ${tipo}`, 'data-round': i },
      el('span', { class: 'dl-paso-bola', 'aria-hidden': 'true' }, r === 'w' ? '✓' : r === 'l' ? '✗' : r === 't' ? '=' : String(i + 1)),
      el('div', { class: 'dl-paso-txt' },
        el('span', { class: 'dl-paso-r' }, fmt(T.roundN, { i: i + 1 })),
        el('span', { class: 'dl-paso-g' }, g ? [el('span', { 'aria-hidden': 'true' }, gameIcon(g)), ` ${nombreJuego(g)}`, roundLevel(d, i) ? ` ${nombreNivel(roundLevel(d, i))}` : ''] : roundGame(d, i))),
      cuerpo);
  });
  const track = el('section', { class: 'panel', id: 'dl-rondas' },
    el('p', { class: 'lead' }, T.roundsTitle), el('ol', { class: 'dl-track' }, pasos));

  // Head to head with this rival, over the finished duels, and their tag
  const h2h = rivalidades(lista, me).find(x => x.jid === e.rival);
  const arch = archirrival(lista, me), nem = nemesis(lista, me);
  const tags = [arch?.jid === e.rival ? `🔥 ${T.archTag}` : null, nem?.jid === e.rival ? `💀 ${T.nemesisTag}` : null].filter(Boolean);
  const pie = h2h || tags.length || e.termino ? el('div', { class: 'dl-hero-pie' },
    h2h ? el('span', { class: 'dl-pill' }, fmt(T.h2hLine, { g: h2h.g, p: h2h.p })) : null,
    tags.map(x => el('span', { class: 'dl-pill dl-pill--tag' }, x)),
    e.termino ? el('button', { type: 'button', class: 'btn btn--cyan btn--sm', id: 'dl-revancha', onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: e.rival, n: e.rivalN }, juego: duelGame(d.g) ? d.g : null, formato: d.f, alTocar }); } }, T.rematch) : null) : null;
  if (pie) hero.append(pie);
  return [hero, track];
}
export const hrefDuelo = d => `${RAIZ}duels/?d=${d.id}`;

const resultado = e => (e.termino ? (e.gano === 1 ? 'w' : e.gano === -1 ? 'l' : 't') : null);
const inicial = n => (n || '?').trim().charAt(0).toUpperCase();
/** Each face's halo by the score (the owner, 2026-11-25): lit for who leads, both dimmed when level. */
const halos = p => (p[0] === p[1] ? [' parejo', ' parejo'] : p[0] > p[1] ? [' gana', ' pierde'] : [' pierde', ' gana']);

/**
 * The /duels/ list (the owner picked it, 2026-11-25): the open duels as tickets, the finished ones on a
 * line by date, won or lost on its dot. A tap on one opens its details: the rounds, the head to head,
 * See the duel and ⚔️ Rematch.
 */
export function listTimeline(abiertos, hechos, me, { alTocar = () => {}, lista = [] } = {}) {
  const ticket = d => {
    const e = estado(d, me), turno = e.turno >= 0;
    const yoN = d.a === me ? d.an : d.bn;
    return el('a', { class: `dl-ticket${turno ? ' turno' : ''}`, href: hrefDuelo(d), onClick: alTocar, 'data-duel': d.id },
      el('span', { class: 'dl-ticket-lado' }, el('span', { class: `dl-cara yo${halos(e.puntos)[0]}` }, inicial(yoN)), el('b', {}, yoN || T.you)),
      el('div', { class: 'dl-ticket-mid' },
        el('small', {}, titulo(d)),
        el('b', { class: 'dl-marcador' }, `${e.puntos[0]}–${e.puntos[1]}`),
        el('div', { class: 'dl-puntos' }, puntos(e)),
        el('small', { class: turno ? 'dl-ticket-turno' : '' }, turno ? T.yourTurn : fmt(T.waitingFor, { n: e.rivalN }))),
      el('span', { class: 'dl-ticket-lado' }, el('span', { class: `dl-cara el${halos(e.puntos)[1]}` }, inicial(e.rivalN)), el('b', {}, e.rivalN)));
  };
  const fecha = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });
  const h2h = rivalidades(lista, me);
  const hito = d => {
    const e = estado(d, me), r = resultado(e);
    const x = h2h.find(y => y.jid === e.rival);
    const rondasTxt = Array.from({ length: e.n }, (_, i) => (e.rondas[i] ? el('span', { class: `dl-mini ${e.rondas[i]}` },
      el('span', { 'aria-hidden': 'true' }, juegoIcono(d, i)), ` ${e.mias[i]?.s ?? 0}–${e.suyas[i]?.s ?? 0}`) : null)).filter(Boolean);
    return el('li', { class: `dl-hito ${r}`, 'data-duel': d.id },
      el('details', {},
        el('summary', { onClick: alTocar },
          el('span', { class: 'dl-hito-f' }, fecha.format(new Date(d.at))),
          el('b', {}, `${e.rivalN} `, el('span', { class: 'dl-hito-sc' }, `${e.puntos[0]}–${e.puntos[1]}`)),
          el('small', {}, titulo(d)),
          el('span', { class: `dl-fin ${r}` }, T[{ w: 'won', l: 'lost', t: 'draw' }[r]])),
        el('div', { class: 'dl-hito-mas' },
          el('div', { class: 'dl-minis' }, rondasTxt),
          x ? el('small', {}, fmt(T.h2hLine, { g: x.g, p: x.p })) : null,
          el('div', { class: 'dl-hito-btns' },
            el('a', { class: 'chip-btn', href: hrefDuelo(d), onClick: alTocar }, T.seeDuel),
            el('button', { type: 'button', class: 'chip-btn dl-revancha', 'data-rematch': d.id, onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: e.rival, n: e.rivalN }, juego: duelGame(d.g) ? d.g : null, formato: d.f, alTocar }); } }, T.rematch)))));
  };
  return [
    abiertos.length ? el('section', { class: 'dl-seccion stack', id: 'dl-mios' }, el('p', { class: 'lead' }, T.mineTitle), abiertos.map(ticket)) : null,
    hechos.length ? el('section', { class: 'panel', id: 'dl-terminados' }, el('p', { class: 'lead' }, T.tabDone), el('ol', { class: 'dl-linea' }, hechos.map(hito))) : null,
  ];
}

const juegoIcono = (d, i) => { const g = duelGame(roundGame(d, i)); return g ? gameIcon(g) : '🎲'; };

/**
 * «📈 Your progress» on /duels/ (the owner, 2026-11-25): the win rate after each finished duel as one
 * line (a dot per duel, its result in the tooltip), the latest ten as W/L pills, and the record by game.
 */
export function panelProgress(lista, me) {
  const fin = lista.map(d => ({ d, e: estado(d, me) })).filter(x => x.e.termino).sort((a, b) => a.d.at - b.d.at);
  if (fin.length < 2) return null;
  let g = 0, p = 0;
  const puntos = fin.map(({ d, e }) => { if (e.gano === 1) g++; else if (e.gano === -1) p++; return { pct: g + p ? (100 * g) / (g + p) : 50, d, e }; });
  const W = 320, H = 110, PX = 8, PY = 10;
  const x = i => PX + (i * (W - 2 * PX)) / (puntos.length - 1);
  const y = v => PY + ((100 - v) * (H - 2 * PY)) / 100;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, a = {}, ...hijos) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) n.setAttribute(k, v); n.append(...hijos); return n; };
  const linea = puntos.map((q, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(q.pct).toFixed(1)}`).join(' ');
  const ultimo = Math.round(puntos.at(-1).pct);
  const grafico = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'dl-prog-svg', role: 'img', 'aria-label': `${T.progressNote}: ${ultimo}%` },
    ...[0, 50, 100].map(v => svg('line', { x1: PX, x2: W - PX, y1: y(v), y2: y(v), class: v === 50 ? 'dl-prog-mitad' : 'dl-prog-grid' })),
    svg('path', { d: `${linea} L${x(puntos.length - 1)},${H - PY} L${x(0)},${H - PY} Z`, class: 'dl-prog-area' }),
    svg('path', { d: linea, class: 'dl-prog-linea' }),
    ...puntos.map((q, i) => svg('circle', { cx: x(i), cy: y(q.pct), r: i === puntos.length - 1 ? 5 : 3.5, class: `dl-prog-punto ${resultado(q.e)}` },
      svg('title', {}, `${q.e.rivalN} ${q.e.puntos[0]}–${q.e.puntos[1]} · ${Math.round(q.pct)}%`))));
  const forma = fin.slice(-10).map(({ e }) => { const r = resultado(e); return el('span', { class: `dl-forma ${r}`, title: e.rivalN }, r === 'w' ? '✓' : r === 'l' ? '✗' : '='); });
  const filas = barrasPorJuego(fin);
  return el('section', { class: 'panel', id: 'dl-progreso' },
    el('div', { class: 'dl-head' }, el('p', { class: 'lead' }, T.progressTitle), el('b', { class: 'dl-prog-pct' }, `${ultimo}%`)),
    el('p', { class: 'dl-nota' }, T.progressNote),
    grafico,
    el('p', { class: 'dl-label' }, T.formTitle),
    el('div', { class: 'dl-formas' }, forma),
    el('p', { class: 'dl-label' }, T.byGameTitle),
    el('div', { class: 'dl-pjs' }, filas));
}
