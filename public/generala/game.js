/**
 * Generala — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7): cambia el transporte, no el juego.
 *  - local: de 2 a 6 en este celular, pasándoselo · solo: once turnos para un récord
 *  - online: sala de 2 a 6 celulares
 * Los dados no esconden nada: quien tiene el turno los tira en su celular y viajan en claro en el
 * mensaje `roll`, igual que en la mesa todos ven el cubilete (D-246). Ver docs/games/generala.md.
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import { botonInvitar } from '../assets/js/compartir.js';
import { gameById, MODO_UNO_AL_DIA } from '../assets/js/games.js';
import { getLang, langToggle, applyStatic, COMMON, withLang } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { showHandoff, passBlock } from '../assets/js/handoff.js';
import { failWith } from '../assets/js/transport/errors.js';
import { createChat } from '../assets/js/chat.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { trackStart, trackVisit, trackFinish } from '../assets/js/transport/stats.js';
import { finDePartida, bloqueVictorias, bloqueTabla, avisoPartida, mmss } from '../assets/js/ranking.js';
import { leerYo, rankingsVisibles } from '../assets/js/jugador.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import { crearRecord } from '../cup/games/solo.js';
import { modoHoy, introHoy, terminarHoy, ponerTarjeta } from '../assets/js/uno-al-dia-ui.js';
import { azarDel } from '../assets/js/uno-al-dia.js';
import {
  CATEGORIAS, NUMEROS, JUEGOS, TIROS, MIN_PLAYERS, MAX_PLAYERS,
  buildState, tirar, writeDice, writeKeep, puntajeDia,
} from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, LOCALES } from './rules.js';

// Cuenta la visita al abrir la página, aunque nadie llegue a jugar (D-208)
trackVisit();

const lang = getLang();
const L = LOCALES[lang];
const T = L.ui;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];
const NADA = [false, false, false, false, false];
const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);
/** El récord de jugar solo en este celular: el mejor `{ s, ms }`. */
const record = crearRecord(`juegos-de-salon:${GAME_ID}:record-solo`);
/** La tabla de jugar solo en los rankings (D-212): `generala_solo`. */
const TABLA_SOLO = `${GAME_ID}_solo`;
/** Uno al día (D-230): con `?hoy`, jugar solo con los dados del día. */
const HOY = modoHoy(GAME_ID);

let S = null;   // sesión: modo, transporte, roles de este celular, quién tiene el aparato, lo elegido
let M = null;   // partida: config, nombres y la lista de jugadas
let chat = null; // chat de sala: solo en varios celulares (canon C-15)

const nameOf = r => M.names[r] || r;
const catName = c => L.cat[c];

/* ------------------------------------------------------------------ */
/* Dados dibujados                                                     */
/* ------------------------------------------------------------------ */
/** Dónde va cada punto de la cara, en la grilla de 3×3. */
const PIPS = {
  1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};

function dieEl(value, { small = false, rueda = false } = {}) {
  if (!value) return el('span', { class: 'die vacio' + (small ? ' die--sm' : ''), 'aria-hidden': 'true' });
  const clases = ['die', small ? 'die--sm' : '', rueda ? 'rueda' : ''];
  return el('span', { class: clases.filter(Boolean).join(' '), 'aria-label': String(value) },
    ...PIPS[value].map(pos => el('i', { style: `grid-area:${Math.ceil(pos / 3)}/${((pos - 1) % 3) + 1}` })));
}
const diceRow = dados => el('div', { class: 'dice-row' }, ...dados.map(d => dieEl(d, { small: true })));

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
function newMatch(config) {
  // En la sala los jugadores no se saben hasta que el anfitrión parte: llegan de a uno
  return { config, players: config.players || null, names: {}, plays: [], seen: new Set(), presence: {}, rematch: {} };
}

const JUGADAS = ['roll', 'score'];

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return;
  if (msg.id) M.seen.add(msg.id);
  switch (msg.t) {
    case 'hello': M.names[msg.from] = msg.name; return;
    case 'start':
      // Solo el anfitrión, y una sola vez: el orden de la mesa es el de llegada a la sala
      if (M.players || msg.from !== 'A') return;
      if ((msg.order || []).filter(r => M.names[r]).length >= MIN_PLAYERS) M.players = msg.order.filter(r => M.names[r]);
      return;
    case 'rematch': M.rematch[msg.from] = msg.code; return;
    // El chat no es parte del estado de la partida: se dibuja y se olvida (canon C-15)
    case 'chat': if (chat) chat.add(msg, { live: !!S?.live }); return 'chat';
    default: if (JUGADAS.includes(msg.t)) M.plays.push(msg);
  }
}

const view = () => (M.players
  ? { ...buildState({ players: M.players, config: M.config, plays: M.plays }), lobby: false }
  : { lobby: true, done: false, players: [], st: {}, history: [] });

/** El jugador de este celular: su rol en la sala, el único que juega solo, o quien tiene el aparato. */
const yo = v => (S.mode === 'online' ? S.role : S.mode === 'solo' ? 'A' : S.uiRole ?? v.current);

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, code = null, role = null }) {
  // Cambiar de sala (la revancha abre una nueva) es irse de la anterior para siempre
  if (S?.transport) S.transport.dispose();
  S = {
    mode, transport, roles, code, role,
    // `Infinity` hasta saber por dónde va la partida: quien entra a una sala a mitad de camino no
    // tiene por qué ver lo anotado antes de que llegara.
    uiRole: null, sel: null, keep: NADA.slice(), keepKey: '', animKey: '', shownHist: Infinity,
    shownServida: false, shownWin: false, inicio: Date.now(),
  };
  M = newMatch(config);
  setupChat(mode);
  const sesion = S;
  setTimeout(() => { if (S === sesion) S.live = true; }, 1500);
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { if (apply(m) === 'chat') return; onChange(); });
  transport.onPresence(p => { M.presence = p; if (view().lobby) renderLobby(); });
}

let chain = Promise.resolve();
function onChange() { chain = chain.then(() => { saveSession(); render(); }).catch(e => console.error(e)); }

/* ---------- Persistencia (canon C-6) ---------- */
function saveSession() {
  if (!S || !M) return;
  const done = M.players ? view().done : false;
  if (S.mode === 'online') {
    // De la sala se guarda cómo volver a entrar: el estado vive en Firebase
    store.save({ mode: 'online', code: S.code, role: S.role, name: M.names[S.role], config: M.config, done });
  } else {
    // Lo guardado a medio tiro también: quien recarga encuentra los mismos dados guardados
    store.save({ mode: S.mode, config: M.config, names: M.names, messages: S.transport.messages || [], keep: S.keep, inicio: S.inicio, done });
  }
}

async function resume(saved) {
  if (saved.mode === 'online') return joinOnline(saved.code, saved.name, saved.role);
  const transport = createLocalTransport({ seed: saved.messages || [] });
  startSession({ mode: saved.mode, transport, roles: saved.config.players, config: saved.config, names: {} });
  M.names = saved.names || {};
  S.inicio = saved.inicio || Date.now();
  S.shownHist = (saved.messages || []).filter(m => m.t === 'score').length;
  // Al retomar en un celular nadie sabe quién lo tenía: se vuelve a la pantalla de pase (C-6)
  S.uiRole = saved.mode === 'solo' ? 'A' : null;
  if (Array.isArray(saved.keep)) { S.keep = saved.keep.slice(0, 5); S.keepKey = null; }
  keepAwake();
  onChange();
}

/* ------------------------------------------------------------------ */
/* Jugadas                                                             */
/* ------------------------------------------------------------------ */
/**
 * Tira los dados que no se guardaron. En Uno al día salen de la semilla del día, el turno y el
 * tiro, consumidos en orden de posición: quien guarda lo mismo que otro recibe lo mismo (D-230).
 */
function tirarDados(v) {
  const keep = v.tiro === 0 ? NADA.slice() : S.keep.slice();
  const azar = S.hoy ? azarDel(S.hoy.semilla, `generala:${v.turno}:${v.tiro}`) : Math.random;
  const dados = tirar(v.dados, keep, azar);
  S.sel = null;
  SFX.dice(); vibrate(20);
  S.transport.send({ t: 'roll', from: v.current, d: writeDice(dados), k: writeKeep(keep) });
}

function anotar(v) {
  if (!S.sel || !(S.sel in v.opciones)) return;
  const c = S.sel;
  S.sel = null;
  v.opciones[c] > 0 ? SFX.letterHit() : SFX.letterMiss();
  vibrate(25);
  S.transport.send({ t: 'score', from: v.current, c });
}

/** "Ana anotó 30 en Full" o "Tachaste Generala", según quién lo hizo y quién lo lee. */
function textoAnotacion(h, v) {
  const mio = S.mode === 'solo' || (S.mode === 'online' && h.by === S.role);
  const vars = { name: nameOf(h.by), pts: h.pts, cat: catName(h.c) };
  if (mio) return fmt(h.pts ? T.youScored : T.youCrossed, vars);
  return fmt(h.pts ? T.lastScored : T.lastCrossed, vars);
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }

function render() {
  if (!M) return;
  const v = view();
  if (v.lobby) return renderLobby();
  if (S.shownHist === Infinity) S.shownHist = v.history.length;   // lo de antes ya pasó
  // Si hay una transición en pantalla, manda ella
  if (!$('#handoff').hidden) return;

  // 1. La generala servida: se celebra antes del final
  if (v.servida && !S.shownServida) return showServida(v);
  if (v.done) return renderResult(v);

  // 2. En un celular, lo que acaba de anotar uno y el pase al siguiente (C-9)
  if (S.mode === 'local' && v.history.length > S.shownHist) return showPass(v, v.history.at(-1));
  S.shownHist = v.history.length;
  if (S.mode === 'local' && S.uiRole !== v.current) return showPass(v, null);

  showScreen('screen-play');
  if (chat) chat.show();
  renderPlay(v);
}

/** La tira de arriba: el total de cada uno, y el del turno encendido. Jugando solo no hace falta. */
function renderMarcador(v) {
  const box = $('#marcador');
  box.innerHTML = '';
  if (S.mode === 'solo') return;
  for (const r of v.players) {
    box.append(el('div', { class: 'p' + (v.current === r ? ' turn' : '') },
      el('span', { class: 'n' }, nameOf(r)),
      el('span', { class: 't' }, v.st[r].total)));
  }
}

function renderPlay(v) {
  const mio = v.current === yo(v);
  // Lo guardado se reinicia en cada turno y se toma de la jugada en cada tiro (lo que se guardó sigue guardado)
  const key = `${v.history.length}:${v.tiro}`;
  if (S.keepKey !== key) {
    if (S.keepKey !== null) S.keep = v.tiro > 0 && v.tiro < TIROS ? v.keep.slice() : NADA.slice();
    S.keepKey = key;
  }
  renderMarcador(v);

  $('#status-who').textContent = S.mode === 'solo' ? fmt(T.vuelta, { n: v.vuelta })
    : mio ? T.yourTurn : `${T.turnOf} ${nameOf(v.current)}`;
  const partes = [];
  if (S.mode !== 'solo') partes.push(fmt(T.vuelta, { n: v.vuelta }));
  if (v.tiro > 0) partes.push(fmt(T.throwN, { n: v.tiro }));
  // Antes de tirar, lo último que pasó en la mesa: en la sala es lo único que avisa lo de otro
  $('#status-sub').textContent = v.tiro === 0 && v.last && S.mode !== 'local' ? textoAnotacion(v.last, v) : partes.join(' · ');

  renderMesa(v, mio);
  renderActions(v, mio);
  renderPlanilla(v, mio);
}

function renderMesa(v, mio) {
  const box = $('#mesa');
  box.innerHTML = '';
  const tocable = mio && v.tiro > 0 && v.tiro < TIROS;
  // Ruedan solo los dados que se acaban de tirar, y una vez
  const animar = v.tiro > 0 && S.animKey !== `${v.history.length}:${v.tiro}`;
  S.animKey = `${v.history.length}:${v.tiro}`;
  const dados = el('div', { class: 'dados' });
  for (let i = 0; i < 5; i++) {
    const guardado = tocable ? S.keep[i] : false;
    dados.append(el('button', {
      class: 'dado-btn' + (guardado ? ' kept' : ''), disabled: !tocable,
      'aria-pressed': String(guardado), 'aria-label': v.dados ? `${v.dados[i]}${guardado ? ` · ${T.kept}` : ''}` : '—',
      onClick: () => { S.keep[i] = !S.keep[i]; SFX.tap(); vibrate(10); saveSession(); renderPlay(view()); },
    }, dieEl(v.dados?.[i], { rueda: animar && !v.keep[i] }), el('span', { class: 'tag' }, T.kept)));
  }
  box.append(dados);
  const hint = !mio ? (v.tiro === 0 ? fmt(T.rolling, { name: nameOf(v.current) }) : '')
    : v.tiro === 0 ? '' : v.tiro < TIROS ? T.keepHint : T.noMoreThrows;
  box.append(el('div', { class: 'hint' }, hint));
}

function renderActions(v, mio) {
  const box = $('#actions');
  box.innerHTML = '';
  if (!mio) return;
  if (v.tiro < TIROS) {
    const sueltos = v.tiro === 0 ? 5 : S.keep.filter(k => !k).length;
    box.append(el('button', {
      class: 'btn ' + (v.tiro === 0 ? 'btn--yellow' : 'btn--ghost'), id: 'btn-tirar', disabled: sueltos === 0,
      onClick: () => tirarDados(view()),
    }, v.tiro === 0 ? T.rollFirst : sueltos === 0 ? T.allKept : sueltos === 1 ? T.rollOne : fmt(T.rollN, { n: sueltos })));
  }
  if (v.tiro > 0) {
    // Nada viene elegido: el botón dice dónde anota y cuánto (C-8)
    const sel = S.sel && S.sel in v.opciones ? S.sel : null;
    const pts = sel ? v.opciones[sel] : 0;
    box.append(el('button', {
      class: 'btn btn--cyan', id: 'btn-anotar', disabled: !sel, onClick: () => anotar(view()),
    }, !sel ? T.pickBox : pts > 0 ? fmt(T.scoreDo, { pts, cat: catName(sel) }) : fmt(T.crossDo, { cat: catName(sel) })));
  }
}

function renderPlanilla(v, mio) {
  const box = $('#planilla');
  box.innerHTML = '';
  // La planilla de quien juega: en la sala se ve cómo llena la suya el que tiene el turno
  const r = v.current;
  const { tarjeta, total } = v.st[r];
  box.append(el('div', { class: 'titulo' },
    el('span', {}, mio ? T.yourCard : fmt(T.cardOf, { name: nameOf(r) })),
    el('span', {}, `${T.total} `, el('b', {}, total))));
  const casilla = c => {
    if (c in tarjeta) {
      const pts = tarjeta[c];
      return el('div', { class: 'casilla usada' + (pts ? '' : ' tachada') },
        el('span', { class: 'nom' }, catName(c)), el('span', { class: 'val' }, pts || '✕'));
    }
    const vale = v.opciones[c];
    const elegible = mio && v.tiro > 0;
    return el('button', {
      class: 'casilla libre' + (vale > 0 ? ' vale' : '') + (S.sel === c ? ' on' : ''), disabled: !elegible,
      'data-cat': c, 'aria-pressed': String(S.sel === c),
      onClick: e => { e.stopPropagation(); S.sel = S.sel === c ? null : c; SFX.tap(); vibrate(10); renderPlay(view()); },
    }, el('span', { class: 'nom' }, catName(c)), el('span', { class: 'val' }, vale === undefined ? '·' : vale));
  };
  box.append(el('div', { class: 'casillas' },
    el('div', { class: 'col' }, ...NUMEROS.map(casilla)),
    el('div', { class: 'col' }, ...JUEGOS.map(casilla))));
}

/* ---------- Chat de la sala (C-15) ---------- */
function setupChat(mode) {
  if (chat) { chat.destroy(); chat = null; }
  const mount = $('#chat');
  if (!mount) return;
  mount.hidden = true;
  if (mode !== 'online') return;
  chat = createChat({
    mount, T,
    nameOf: r => M.names[r] || '…',
    isMine: r => r === S.role,
    onSend: text => S.transport.send({ t: 'chat', from: S.role, text }),
  });
}

/* ---------- Lo anotado y el pase del celular (C-9) ---------- */
function showPass(v, h) {
  S.shownHist = v.history.length;
  const siguiente = v.current;
  const pase = passBlock({ label: T.hoPass, name: nameOf(siguiente), button: T.hoReady, small: !!h });
  // Primero lo que acaba de pasar y, debajo, a quién le toca: solo el botón avanza
  const stage = h
    ? el('div', { class: 'stage pop' },
      el('div', { class: 'anoto' }, textoAnotacion(h, v)),
      diceRow(h.dados),
      pase)
    : pase;
  if (h) stage.setAdvance = fn => pase.setAdvance(fn);
  showHandoff([stage], () => { S.uiRole = siguiente; SFX.pass(); render(); }, { tapAdvances: false });
}

function showServida(v) {
  S.shownServida = true;
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'servida' }, T.servidaTitle),
    diceRow(v.servida.dados),
    el('div', { class: 'anoto' }, fmt(T.servidaWins, { name: nameOf(v.servida.by) })),
    el('div', { class: 'hint', style: 'margin-top:10px' }, T.goOn));
  SFX.win(); vibrate([60, 60, 120]);
  showHandoff([stage], () => render());
}

/* ---------- Final ---------- */
function tablaPlanillas(v) {
  const fila = (etiqueta, celdas, clase = '') => el('tr', { class: clase }, el('td', {}, etiqueta), ...celdas.map(c => el('td', {}, c)));
  return el('table', { class: 'tabla' },
    el('thead', {}, el('tr', {}, el('th', {}, ''), ...v.players.map(r => el('th', {}, nameOf(r))))),
    el('tbody', {},
      ...CATEGORIAS.map(c => fila(catName(c), v.players.map(r => {
        const pts = v.st[r].tarjeta[c];
        return pts === undefined ? '·' : pts === 0 ? '✕' : pts;
      }))),
      fila(T.total, v.players.map(r => v.st[r].total), 'suma')));
}

function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  showScreen('screen-result');
  if (S.mode === 'solo') return renderResultSolo(v, already);
  const ganadores = v.winners;
  // Quién ganó, para la lista de salas del panel del dueño (D-79). Una vez, y solo con un ganador.
  if (!already && S.mode === 'online' && ganadores.length === 1) {
    S.transport?.noteWinner?.({ role: ganadores[0], name: nameOf(ganadores[0]) });
  }
  // Los rankings (D-212, D-215): la partida del jugador de este celular y, si ganó, su victoria
  if (!already) finDePartida({ juego: GAME_ID, modo: S.mode, rol: S.mode === 'online' ? S.role : null, ganadores, nombres: M.names });
  // Sin red, cómo terminó, para el panel (D-210)
  if (!already && S.mode !== 'online') {
    trackFinish({ ganador: ganadores.length === 1 ? nameOf(ganadores[0]) : null, empate: ganadores.length > 1, detalle: v.players.map(r => `${nameOf(r)} ${v.st[r].total}`).join(' · ') });
  }
  $('#result-trophy').textContent = '🏆';
  $('#result-title').textContent = ganadores.length > 1
    ? fmt(T.tie, { names: ganadores.map(nameOf).join(' · ') })
    : S.mode === 'online' && ganadores[0] === S.role ? T.winnerYou : fmt(T.winner, { name: nameOf(ganadores[0]) });
  $('#result-sub').textContent = v.servida ? T.servidaTitle : fmt(T.points, { n: v.st[ganadores[0]].total });

  // Los ganadores arriba (con la generala servida pueden tener menos puntos) y el resto por total
  const valor = r => (ganadores.includes(r) ? Infinity : v.st[r].total);
  const orden = v.players.slice().sort((a, b) => valor(b) - valor(a));
  $('#result-podio').replaceChildren(...orden.map(r => el('div', { class: 'fila' + (ganadores.includes(r) ? ' gana' : '') },
    el('span', { class: 'pos' }, 1 + orden.findIndex(x => valor(x) === valor(r))),
    el('span', {}, nameOf(r)),
    el('span', { class: 'pts' }, v.st[r].total))));
  $('#result-tabla').replaceChildren(tablaPlanillas(v));
  $('#result-cards summary').textContent = T.cardsTitle;

  const acciones = $('#result-actions');
  acciones.innerHTML = '';
  acciones.append(
    el('button', {
      class: 'btn btn--yellow', id: 'btn-otra',
      onClick: e => {
        if (S.mode !== 'online') return startMatch(S.mode, M.names, M.config);
        // La revancha abre una sala nueva: mientras se arma, el botón queda esperando
        e.currentTarget.disabled = true;
        rematchOnline().catch(err => { console.error(err); e.currentTarget.disabled = false; });
      },
    }, S.mode === 'online' ? T.rematch : T.endAgain),
    el('div', { class: 'btn-row' },
      S.mode === 'online'
        ? el('button', { class: 'btn btn--ghost btn--sm', onClick: e => leaveRoom(e.currentTarget) }, T.changeMode)
        : el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderModes(); showScreen('screen-intro'); } }, T.changePlayers),
      el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.backMenu),
    ),
  );
  if (!S.shownWin) { S.shownWin = true; SFX.win(); confetti({ count: 220, duration: 3500 }); }
}

function renderResultSolo(v, already) {
  const total = v.st.A.total;
  const ms = Date.now() - S.inicio;
  if (!already) {
    S.ms = ms;
    trackFinish({ detalle: `${total} puntos · ${mmss(ms)}` });   // cómo salió, para el panel (D-210)
    S.recordAntes = record.get();
    S.recordNuevo = total > 0 ? record.anotar('', { s: total, ms }).nuevo : false;
  }
  $('#result-trophy').textContent = S.recordNuevo ? '🏅' : '🎲';
  $('#result-title').textContent = fmt(T.soloEnd, { n: total });
  $('#result-sub').textContent = fmt(T.soloTime, { t: mmss(S.ms) });
  // Con jugador, el aviso de los rankings reemplaza al récord del celular (D-212); va una vez
  const podio = $('#result-podio');
  if (!already) {
    const tablaFin = bloqueTabla({ tabla: TABLA_SOLO, titulo: fmt(COMMON[lang].rk.titleOf, { game: T.title }), alTocar: () => SFX.tap(), entrar: false });
    S.tablaFin = tablaFin;
    podio.replaceChildren(
      rankingsVisibles() && leerYo()
        ? avisoPartida({ juego: GAME_ID, variante: 'solo', s: total, ms: S.ms, alAnotar: () => tablaFin.recargar() })
        : S.recordNuevo ? el('p', { class: 'lead center' }, T.newRecord)
        : S.recordAntes ? el('p', { class: 'muted center', style: 'font-weight:900' }, fmt(T.prevRecord, { s: S.recordAntes.s })) : '');
  }
  $('#result-tabla').replaceChildren(tablaPlanillas(v));
  // Jugando solo hay una planilla, la tuya (U-6)
  $('#result-cards summary').textContent = `📋 ${T.yourCard}`;

  const acciones = $('#result-actions');
  acciones.innerHTML = '';
  // Uno al día: la tarjeta va arriba de los botones; el primer intento cuenta y los demás son práctica
  if (S.hoy) ponerTarjeta(terminarHoy(S.hoy, { s: puntajeDia(total), ms: S.ms, lang, alTocar: () => SFX.tap() }), acciones);
  acciones.append(
    // En Uno al día no hay otra partida: la tarjeta ya ofrece jugar otro o repetir el de hoy (#226)
    S.hoy ? null : el('button', { class: 'btn btn--yellow', id: 'btn-otra', onClick: () => startMatch('solo', M.names, M.config) }, T.endAgain),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); location.href = location.pathname; } }, T.changeMode),
      el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.backMenu)),
  );
  if (!already && S.tablaFin) acciones.after(S.tablaFin);
  if (!S.shownWin) { S.shownWin = true; SFX.win(); if (S.recordNuevo) confetti({ count: 220, duration: 3500 }); }
}

/* ------------------------------------------------------------------ */
/* Sala (varios celulares)                                             */
/* ------------------------------------------------------------------ */
function renderLobby() {
  if (S.mode !== 'online' || !M) return;
  showScreen('screen-lobby');
  if (chat) chat.show();
  const box = $('#lobby-box'); box.innerHTML = '';
  // Con el idioma pegado: quien reciba la invitación abre la app como quien la mandó (D-74)
  const url = withLang(`${location.origin}${location.pathname}?sala=${S.code}`);
  const entraron = ROLES.filter(r => M.names[r]);
  box.append(
    el('div', { class: 'muted', style: 'font-weight:800' }, T.lobbyCode),
    el('div', { class: 'code-big' }, S.code),
    el('div', { class: 'qr', id: 'qr' }),
    el('p', { class: 'muted', style: 'font-size:0.9rem' }, T.lobbyShare),
    shareButton(url),
    el('p', { class: 'lead', style: 'margin:12px 0 4px' }, `${T.lobbyPlayers} (${entraron.length}/${MAX_PLAYERS})`),
    el('div', { class: 'lobby-players' }, ...entraron.map(r => el('span', {
      class: 'p' + (r === S.role ? ' me' : '') + (M.presence[r]?.online === false ? ' off' : ''),
    }, M.names[r]))),
    S.role === 'A'
      ? el('button', {
        class: 'btn btn--yellow', disabled: entraron.length < MIN_PLAYERS,
        onClick: () => { SFX.pass(); S.transport.send({ t: 'start', from: 'A', order: entraron }); },
      }, entraron.length < MIN_PLAYERS ? T.lobbyNeedMore : T.lobbyStart)
      : el('p', { class: 'waiting' }, fmt(T.lobbyWaitHost, { name: M.names.A || '…' })),
    el('button', { class: 'btn btn--ghost btn--sm', style: 'margin-top:10px', onClick: e => leaveRoom(e.currentTarget) },
      S.role === 'A' ? T.lobbyCancel : T.lobbyLeave),
  );
  renderQr(url);
}

/** "🎲 *Generala* · Sala WFBN" y quién invita (D-165): de qué se trata lo cuenta la tarjeta del link. */
function textoInvitacion() {
  return fmt(COMMON[lang].invite, { emoji: gameById(GAME_ID)?.emoji || '🎲', name: M.names[S.role] || '', game: T.title, code: S.code });
}

function shareButton(url) {
  return botonInvitar({ T, titulo: T.title, url, texto: textoInvitacion, alTocar: () => SFX.tap() });
}

async function renderQr(url) {
  try {
    if (!window.qrcode) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; sc.onload = res; sc.onerror = rej; document.head.append(sc); });
    const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    const box = $('#qr'); if (box) box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (_) { const box = $('#qr'); if (box) box.remove(); }
}

async function leaveRoom(btn) {
  SFX.tap();
  if (btn) btn.disabled = true;
  store.clear();
  await S.transport.dispose();
  location.href = location.pathname;
}

async function startOnline(transport, code, role, name, config) {
  startSession({ mode: 'online', transport, roles: [role], config, names: { [role]: name }, code, role });
  history.replaceState(null, '', `${location.pathname}?sala=${code}`);
  keepAwake();
  saveSession();
  render();
}

async function createOnline(name, config) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const code = await t.create({ config, name });
  await startOnline(t, code, 'A', name, config);
}

async function joinOnline(code, name, previousRole = null) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const { role, config } = await t.join(code, { name, previousRole });
  await startOnline(t, code, role, name, config || DEFAULT_CONFIG);
}

/** La revancha abre una sala nueva (C-7). El primero que la propone manda; el resto lo sigue. */
async function rematchOnline() {
  if (M.rematch[S.role]) return;
  const propuesta = ROLES.filter(r => M.names[r] && r !== S.role).map(r => M.rematch[r]).find(c => typeof c === 'string');
  const nombre = M.names[S.role];
  if (propuesta) return joinOnline(propuesta, nombre);
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const config = { ...M.config, players: null };
  const code = await t.create({ config, name: nombre });
  S.transport.send({ t: 'rematch', from: S.role, code });
  M.rematch[S.role] = code;
  setTimeout(() => startOnline(t, code, 'A', nombre, config), 600);
}

/* ------------------------------------------------------------------ */
/* Arranque de una partida                                             */
/* ------------------------------------------------------------------ */
function startMatch(mode, names, config, hoy = null) {
  store.clear();
  const players = config.players;
  startSession({ mode, transport: createLocalTransport(), roles: players.slice(), config, names });
  // Otra partida es una partida cualquiera: no lleva `hoy`
  S.hoy = hoy;
  document.getElementById('uad-tarjeta')?.remove();   // la de la partida anterior, si la hubo
  if (hoy && !hoy.anotado) hoy.inicio = Date.now();
  S.uiRole = mode === 'solo' ? 'A' : null;
  S.shownHist = 0;
  keepAwake();
  trackStart({ game: GAME_ID, mode: hoy ? MODO_UNO_AL_DIA : mode, players: players.length, nombres: players.map(r => names?.[r]) }); // señal de uso (D-44, D-210)
  onChange();
}

/* ------------------------------------------------------------------ */
/* Intro y configuración                                               */
/* ------------------------------------------------------------------ */
/** Un interruptor con su explicación, como el del resto de la app. */
function interruptor(encendido, label, hint, onChange) {
  const sw = el('button', {
    type: 'button', class: 'switch' + (encendido ? ' on' : ''), 'aria-label': label, 'aria-pressed': String(encendido),
    onClick: () => {
      const v = !sw.classList.contains('on');
      sw.classList.toggle('on', v); sw.setAttribute('aria-pressed', String(v));
      SFX.tap(); onChange(v);
    },
  });
  return el('div', { class: 'toggle-row' }, el('div', { class: 'txt' }, el('b', {}, label), el('small', {}, hint)), sw);
}

const MODES = [
  { id: 'local', title: () => T.modeLocal, sub: () => T.modeLocalHint },
  { id: 'online', title: () => T.modeOnline, sub: () => T.modeOnlineHint },
  { id: 'solo', title: () => T.modeSolo, sub: () => T.modeSoloHint },
];

function renderModes() {
  const box = $('#modes');
  box.innerHTML = '';
  MODES.forEach(m => {
    box.append(el('button', { class: 'mode', 'data-mode': m.id, onClick: () => { SFX.tap(); renderSetup(m.id); } },
      el('div', { class: 'mode-main' }, el('b', {}, m.title()), el('small', {}, m.sub())),
      el('span', { class: 'go' }, '›')));
  });
}

function renderRules() {
  const list = $('#rules-list');
  list.innerHTML = '';
  T.rules.forEach(r => list.append(el('li', { html: r })));
}

function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done) return;
  // De la sala solo se guarda el código: el estado vive en Firebase y se lee al volver a entrar
  const enSala = saved.mode === 'online' && saved.code;
  if (!enSala && !saved.config?.players) return;
  let detalle = '';
  if (enSala) detalle = fmt(T.invited, { code: saved.code });
  else {
    const previa = buildState({ players: saved.config.players, config: saved.config, plays: (saved.messages || []).filter(m => JUGADAS.includes(m.t)) });
    detalle = saved.mode === 'solo' ? fmt(T.vuelta, { n: previa.vuelta })
      : fmt(T.resumeText, { round: previa.vuelta, name: saved.names?.[previa.current] || '' });
  }
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, detalle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-continuar', onClick: async () => { try { await resume(saved); } catch (_) { store.clear(); renderResumeSlot(); } } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderSetup(mode, codigoInvitado = '') {
  if (mode === 'online') return renderSetupOnline(codigoInvitado);
  const solo = mode === 'solo';
  $('#screen-setup h2').textContent = solo ? T.soloSetup : T.whoPlays;
  $('.setup-hint').textContent = solo ? T.soloHint : T.setupHint;
  const form = $('#setup-form');
  const recordado = nameStore.get();
  const draft = solo ? [recordado || ''] : [recordado || '', ''];
  let servidaGana = DEFAULT_CONFIG.servidaGana;

  const dibujar = () => {
    form.innerHTML = '';
    draft.forEach((name, i) => {
      form.append(el('div', { class: 'player-row' },
        el('div', { class: 'num' }, solo ? '👤' : i + 1),
        el('input', {
          type: 'text', value: name, maxlength: 14, autocomplete: 'off', enterkeyhint: 'next',
          placeholder: solo ? T.yourName : fmt(T.playerPlaceholder, { n: i + 1 }),
          onInput: e => { draft[i] = e.target.value; },
        }),
        !solo && draft.length > MIN_PLAYERS
          ? el('button', { class: 'del', 'aria-label': T.removePlayer, onClick: () => { draft.splice(i, 1); dibujar(); } }, '✕')
          : null,
      ));
    });
    // La generala servida solo gana contra alguien: jugando solo no se ofrece
    if (!solo) form.append(interruptor(servidaGana, T.servidaLabel, T.servidaHint, v => { servidaGana = v; }));
  };
  dibujar();

  const acciones = $('#setup-actions');
  acciones.innerHTML = '';
  if (!solo) {
    acciones.append(el('button', {
      class: 'btn btn--ghost', onClick: e => {
        if (draft.length >= MAX_PLAYERS) return;
        draft.push(''); dibujar();
        e.currentTarget.disabled = draft.length >= MAX_PLAYERS;
        setTimeout(() => $$('#setup-form input').at(-1)?.focus(), 50);
      },
    }, T.addPlayer));
  }
  acciones.append(el('button', {
    class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => {
      const nombres = draft.map(n => n.trim());
      const err = $('#setup-error');
      const problema = nombres.some(n => !n) ? T.errNames
        : !solo && nombres.length < MIN_PLAYERS ? fmt(T.errMin, { n: MIN_PLAYERS })
        : new Set(nombres.map(n => n.toLowerCase())).size !== nombres.length ? T.errDup
        : null;
      if (problema) {
        err.textContent = problema;
        err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake');
        vibrate([30, 30, 30]); SFX.error();
        return;
      }
      err.textContent = '';
      nameStore.set(nombres[0]);
      const players = ROLES.slice(0, nombres.length);
      const names = Object.fromEntries(players.map((r, i) => [r, nombres[i]]));
      startMatch(mode, names, { ...DEFAULT_CONFIG, servidaGana, players });
    },
  }, T.start));
  acciones.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => showScreen('screen-intro') }, T.menu));
  // Jugando solo, el ranking va debajo de empezar, como en Toque y Fama (D-212)
  if (solo) acciones.append(bloqueTabla({ tabla: TABLA_SOLO, titulo: fmt(COMMON[lang].rk.titleOf, { game: T.title }), alTocar: () => SFX.tap() }));
  $('#setup-error').textContent = '';
  showScreen('screen-setup');
}

/**
 * Crear una sala o entrar con un código. Quien llega por un enlace no ve "crear": solo puede
 * entrar a esa sala (RP-18), así que el código llega escrito y no se toca.
 */
function renderSetupOnline(codigoInvitado = '') {
  showScreen('screen-setup');
  const invitado = !!codigoInvitado;
  $('#screen-setup h2').textContent = invitado ? T.invitedTitle : T.setupOnline;
  $('.setup-hint').textContent = invitado ? T.invitedHint : T.setupHint;
  const form = $('#setup-form'); form.innerHTML = '';
  const err = $('#setup-error'); err.textContent = '';
  let nombre = nameStore.get() || '';
  let servidaGana = DEFAULT_CONFIG.servidaGana;

  form.append(el('div', { class: 'player-row' },
    el('div', { class: 'num' }, '👤'),
    el('input', {
      type: 'text', value: nombre, maxlength: 14, placeholder: T.yourNameLabel, autocomplete: 'off',
      onInput: e => { nombre = e.target.value; },
    }),
  ));
  // Los ajustes los pone quien crea la sala: al que entra le llegan con la partida
  if (!invitado) form.append(interruptor(servidaGana, T.servidaLabel, T.servidaHint, v => { servidaGana = v; }));

  const fallar = msg => {
    err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake');
    SFX.error(); vibrate([30, 30, 30]);
  };
  const acciones = $('#setup-actions'); acciones.innerHTML = '';
  const codigo = el('input', {
    type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: codigoInvitado,
    autocapitalize: 'characters', autocomplete: 'off', readOnly: invitado,
  });
  const entrar = el('button', { class: 'btn btn--cyan', onClick: async () => {
    const n = nombre.trim(), c = codigo.value.trim().toUpperCase();
    if (!n) return fallar(T.errName);
    if (!/^[A-Z]{4}$/.test(c)) return fallar(T.errCode);
    nameStore.set(n); SFX.tap(); entrar.disabled = true;
    try { await joinOnline(c, n); } catch (e) { failWith(e, T, fallar); }
    entrar.disabled = false;
  } }, T.join);

  if (invitado) {
    acciones.append(el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, fmt(T.invited, { code: codigoInvitado })),
      el('div', { class: 'field' }, codigo), entrar));
  } else {
    const crear = el('button', { class: 'btn btn--yellow', onClick: async () => {
      const n = nombre.trim();
      if (!n) return fallar(T.errName);
      nameStore.set(n); SFX.tap(); crear.disabled = true;
      try { await createOnline(n, { ...DEFAULT_CONFIG, servidaGana, players: null }); }
      catch (e) { failWith(e, T, fallar); }
      crear.disabled = false;
    } }, T.create);
    acciones.append(crear, el('div', { class: 'or' }, `— ${COMMON[lang].or} —`),
      el('div', { class: 'panel' },
        el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.joinTitle),
        el('div', { class: 'field' }, codigo), entrar));
  }
  acciones.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { showScreen('screen-intro'); } }, T.menu));
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */
/**
 * Uno al día (D-230): la intro con su línea y un solo botón, que abre directo jugar solo con el
 * nombre que se recuerda. Lo común son los dados: salen de la semilla del día.
 */
function introDeHoy() {
  $('#modes').replaceChildren(
    introHoy(HOY, { lang, extra: T.hoyExtra }),
    el('button', { class: 'btn btn--yellow', id: 'btn-uad-jugar', onClick: () => {
      SFX.tap();
      startMatch('solo', { A: nameStore.get() || fmt(T.playerPlaceholder, { n: 1 }) }, { ...DEFAULT_CONFIG, players: ['A'] }, HOY);
    } }, COMMON[lang].uad.jugar));
}

function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(langToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  document.addEventListener('click', e => { if (e.target.closest('.btn, .mode, .lang-toggle button')) SFX.tap(); });
  // Un toque fuera de la casilla elegida la suelta (C-8)
  document.addEventListener('click', e => {
    if (!S?.sel || e.target.closest('.casilla, #btn-anotar')) return;
    S.sel = null;
    if (M?.players && !view().done) renderPlay(view());
  });
  sparkles(12);
  renderRules();
  if (HOY?.fuera) return;   // se va al juego de hoy
  if (HOY) return introDeHoy();
  renderModes();
  // Las victorias de este juego y entrar con nombre y PIN (D-212, D-215)
  $('#rk-slot')?.append(bloqueVictorias({ juego: GAME_ID, nombre: T.title, alTocar: () => SFX.tap() }));
  renderResumeSlot();
  const sala = new URLSearchParams(location.search).get('sala');
  if (!sala || !/^[A-Z]{4}$/i.test(sala)) return;
  const code = sala.toUpperCase();
  const guardada = store.load();
  // Recargar a mitad de partida vuelve a la misma sala sin volver a presentarse; llegar por un
  // enlace ajeno es otra cosa: ahí se pide el nombre y no se ofrece crear otra sala (RP-18, C-6).
  if (guardada && guardada.mode === 'online' && guardada.code === code && !guardada.done) {
    joinOnline(code, guardada.name, guardada.role).catch(() => { store.clear(); renderSetupOnline(code); });
  } else renderSetupOnline(code);
}

init();

// Ventana al estado para las pruebas de punta a punta (tools/e2e/)
window.__generala = { view: () => (M?.players ? view() : null), match: () => M, session: () => S };
