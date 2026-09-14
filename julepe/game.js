/**
 * Julepe — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7): cambia el transporte, no el juego.
 *  - local: de 2 a 6 en este celular, pasándoselo · cpu: mesa de tres contra el aparato
 *  - online: sala de 2 a 6 celulares
 *
 * El reparto es el mensaje `reparte`. En un celular las manos van en claro —están todas en el
 * mismo aparato, no hay a quién escondérselas— y en la sala va **una por jugador, cerrada** con
 * la llave que publicó cada uno (assets/js/sobre.js, D-81). Al cerrar la mano cada celular
 * destapa lo que le tocó y todos verifican que nadie jugó una carta que no tenía (C-10).
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti, shareLink, canShare } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic, COMMON, withLang } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { showHandoff, passBlock } from '../assets/js/handoff.js';
import { failWith } from '../assets/js/transport/errors.js';
import { createChat } from '../assets/js/chat.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { trackStart } from '../assets/js/transport/stats.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import { haySobres, nuevasLlaves, cierra, abre } from '../assets/js/sobre.js';
import {
  MANO, RESERVA, PREMIO, MIN_PLAYERS, MAX_PLAYERS,
  buildState, reparte, escribirCartas, leerCartas, enMano, enReserva,
  palo, rango, puedeJugar,
  botDeclara, botCambia, botJuega, botRegala,
} from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, LARGOS, RIVALES, RIVALES_POR_DEFECTO, LOCALES } from './rules.js';

const lang = getLang();
const L = LOCALES[lang];
const T = L.ui;
const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];
/** Lo que se demora el celular en jugar. Menos se siente instantáneo y no se alcanza a leer. */
const CPU_MS = 950;
const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);

let S = null;    // sesión: modo, transporte, roles de este celular, quién tiene el aparato
let M = null;    // partida: config, nombres y la lista de jugadas
let chat = null; // chat de sala: solo en varios celulares (canon C-15)

const nameOf = r => M.names[r] || r;
const esRojo = c => palo(c) === '♥' || palo(c) === '♦';
/** "el as de picas", para que el botón diga sobre qué actúa (C-8). */
const cardName = c => fmt(T.cardOf, { rank: L.rankNames[rango(c)] || rango(c), suit: L.paloNames[palo(c)] });
const tragos = n => fmt(n === 1 ? T.potOne : T.potSips, { n });

/* ------------------------------------------------------------------ */
/* Cartas dibujadas                                                    */
/* ------------------------------------------------------------------ */
function cardEl(c, { size = '', cls = '', onClick = null } = {}) {
  const clases = ['pcard', size, esRojo(c) ? 'red' : '', cls, onClick ? 'pick' : ''].filter(Boolean).join(' ');
  const attrs = { class: clases, 'aria-label': cardName(c) };
  if (onClick) { attrs.onClick = onClick; attrs.type = 'button'; }
  return el(onClick ? 'button' : 'span', attrs, el('span', { class: 'r' }, rango(c)), el('span', { class: 's' }, palo(c)));
}

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
function newMatch(config) {
  // En la sala los jugadores no se saben hasta que el anfitrión parte: llegan de a uno
  return { config, players: config.players || null, names: {}, llaves: {}, plays: [], seen: new Set(), presence: {}, rematch: {} };
}

const JUGADAS = ['reparte', 'va', 'paso', 'cambia', 'juega', 'regala', 'revela'];

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return;
  if (msg.id) M.seen.add(msg.id);
  switch (msg.t) {
    case 'hello':
      M.names[msg.from] = msg.name;
      if (msg.pub) M.llaves[msg.from] = msg.pub;   // su sobre se cierra con esta llave (D-81)
      return;
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
  ? { ...buildState({ players: M.players, config: M.config, plays: M.plays, yo: S.role, privadas: S.privadas }), lobby: false }
  : { lobby: true, phase: 'lobby', done: false, players: [], st: {}, historia: [], cartas: {}, baza: [], bazas: [], va: [], decl: {} });

/** El reparto de esa mano, tal como llegó (para abrir el sobre propio y para el destape). */
const repartoDe = (v, n) => M.plays.find(p => p.t === 'reparte' && Number(p.n) === n) || null;

/** Las ocho cartas que le tocaron a alguien en esa mano, si este celular puede saberlas. */
function manoRepartida(h, role) {
  const msg = repartoDe(null, h.n);
  const claro = leerCartas(msg?.m?.[role]);
  if (claro) return claro;
  const dicha = h.reveladas?.[role];
  if (dicha) return dicha;
  return S.privadas[h.n] && role === S.role ? leerCartas(S.privadas[h.n]) : null;
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, code = null, role = null, privadas = {}, llave = null }) {
  // Cambiar de sala (la revancha abre una nueva) es irse de la anterior para siempre
  if (S?.transport) S.transport.dispose();
  S = {
    mode, transport, roles, code, role, privadas, llave,
    // `Infinity` hasta saber por dónde va la partida: quien entra a una sala a mitad de camino
    // no tiene por qué ver el cierre de una mano que se jugó antes de que llegara.
    uiRole: null, sel: null, drop: [], reparto: null, shownHand: Infinity,
    repartidas: new Set(), abiertas: new Set(), destapadas: new Set(), botTimer: null, shownWin: false,
  };
  M = newMatch(config);
  setupChat(mode);
  const sesion = S;
  setTimeout(() => { if (S === sesion) S.live = true; }, 1500);
  Object.entries(names).forEach(([r, name]) => {
    if (name) transport.send({ t: 'hello', from: r, name, ...(llave && r === role ? { pub: llave.publica } : {}) });
  });
  transport.onMessage(m => { if (apply(m) === 'chat') return; onChange(); });
  transport.onPresence(p => { M.presence = p; if (view().lobby) renderLobby(); });
}

let chain = Promise.resolve();
function onChange() { chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e)); }

/** Lo que hace solo este celular: repartir lo suyo, abrir su sobre y jugar los turnos del aparato. */
async function act() {
  saveSession();
  if (!M?.players) return;
  const v = view();
  if (S.shownHand === Infinity) S.shownHand = v.historia.length;   // lo de antes ya pasó
  if (v.done) return;

  // 1. Repartir. Le toca al dador, y este celular reparte si el dador es uno de sus roles.
  if (v.phase === 'reparte' && S.roles.includes(v.dador) && !S.repartidas.has(v.manoN)) {
    S.repartidas.add(v.manoN);
    await repartir(v);
    return;
  }

  // 2. Abrir el sobre propio: en la sala, la mano llega cerrada y solo este celular puede leerla.
  if (S.mode === 'online' && !S.privadas[v.manoN] && !S.abiertas.has(v.manoN)) {
    const msg = repartoDe(v, v.manoN);
    const sobre = msg?.s?.[S.role];
    if (sobre && S.llave) {
      S.abiertas.add(v.manoN);
      const cs = await abre(S.llave.privada, sobre);
      if (cs && leerCartas(cs)?.length === MANO + RESERVA) { S.privadas[v.manoN] = cs; saveSession(); onChange(); }
      return;
    }
  }

  // 3. Destapar las cartas propias para que la mesa pueda verificarlas (C-10).
  // Se manda **apenas se jugó la última baza**, no al cerrar la mano: ahí ya no queda nada
  // escondido que importe, y el sello alcanza a llegar antes de que se dibuje el cierre. Si se
  // esperara al cierre, la pantalla diría "faltan cartas por destapar" siempre.
  if (S.mode === 'online') {
    const destapar = n => {
      if (S.destapadas.has(n) || !S.privadas[n]) return;
      S.destapadas.add(n);
      S.transport.send({ t: 'revela', from: S.role, n, cs: S.privadas[n] });
    };
    if (v.phase === 'regala' || v.bazas.length >= MANO) destapar(v.manoN);
    v.historia.forEach(h => destapar(h.n));
  }

  // 4. El turno del aparato. Cada bot mira solo sus propias cartas.
  //
  // La jugada **se decide cuando se manda**, no cuando se programa la espera: entre una cosa y
  // la otra la mesa puede haber cambiado de fase (el último cambio de cartas abre las bazas), y
  // una jugada calculada para la fase anterior ya no sirve. Guardar un solo temporizador —en vez
  // de contar mensajes— es lo que evita el empate a dos: si la jugada vieja se descartaba y no
  // llegaba ningún mensaje nuevo, nadie volvía a despertar al aparato y la mesa quedaba esperando
  // un turno que no iba a pasar nunca.
  const bots = S.mode === 'cpu' ? M.players.filter(r => r !== 'A') : [];
  if (bots.includes(v.turno) && !S.botTimer) {
    const sesion = S;
    S.botTimer = setTimeout(() => {
      if (S !== sesion) return;                    // la partida cambió mientras esperaba
      S.botTimer = null;
      const ahora = view();
      if (ahora.done || !bots.includes(ahora.turno)) return onChange();
      const jugada = jugadaDelBot(ahora, ahora.turno);
      if (jugada) S.transport.send(jugada);
    }, CPU_MS);
  }
}

/** Baraja y manda la mano. En la sala va cerrada para cada uno; en un celular, en claro. */
async function repartir(v) {
  const { manos, triunfo } = reparte(M.players);
  const msg = { t: 'reparte', from: v.dador, n: v.manoN, triunfo };
  const cerrados = S.mode === 'online' && haySobres() && M.players.every(r => M.llaves[r]);
  if (cerrados) {
    msg.s = {};
    for (const r of M.players) msg.s[r] = await cierra(M.llaves[r], escribirCartas(manos[r]));
  } else {
    // Sin llaves o sin contexto seguro no se puede cerrar nada: se reparte a la vista y la
    // pantalla lo dice al cerrar la mano, en vez de fingir un secreto que no existe (C-14).
    msg.m = Object.fromEntries(M.players.map(r => [r, escribirCartas(manos[r])]));
  }
  if (S.mode === 'online') { S.privadas[v.manoN] = escribirCartas(manos[S.role]); saveSession(); }
  SFX.flip();
  S.transport.send(msg);
}

/** La jugada que le toca al aparato, con lo que el aparato sabe: sus cartas y lo que está a la vista. */
function jugadaDelBot(v, rol) {
  const mano = v.cartas[rol];
  if (!mano) return null;
  if (v.phase === 'declara') {
    const va = botDeclara({ mano, triunfo: v.triunfo, rivales: M.players.length - 1, plato: v.plato });
    return { t: va ? 'va' : 'paso', from: rol };
  }
  if (v.phase === 'cambia') {
    const suelta = botCambia({ mano, triunfo: v.triunfo });
    return { t: 'cambia', from: rol, i: suelta.map(c => mano.indexOf(c)).join(',') };
  }
  if (v.phase === 'baza') {
    return { t: 'juega', from: rol, c: botJuega({ mano, baza: v.baza, triunfo: v.triunfo }) };
  }
  if (v.phase === 'regala') {
    const cuenta = Object.fromEntries(M.players.map(r => [r, v.st[r].tragos]));
    return { t: 'regala', from: rol, a: botRegala({ yo: rol, bazas: v.ganadas[rol], tragos: cuenta, players: M.players }).join(',') };
  }
  return null;
}

/* ---------- Persistencia (canon C-6) ---------- */
function saveSession() {
  if (!S || !M) return;
  const done = M.players ? view().done : false;
  if (S.mode === 'online') {
    // De la sala se guarda cómo volver a entrar, la llave privada y las manos ya abiertas: sin
    // eso, un celular que recarga a mitad de mano no podría volver a leer sus propias cartas.
    store.save({ mode: 'online', code: S.code, role: S.role, name: M.names[S.role], config: M.config, private: { privadas: S.privadas, llave: S.llave }, done });
  } else {
    store.save({ mode: S.mode, config: M.config, names: M.names, messages: S.transport.messages || [], done });
  }
}

async function resume(saved) {
  if (saved.mode === 'online') {
    const priv = saved.private || {};
    return joinOnline(saved.code, saved.name, saved.role, priv.privadas || {}, priv.llave || null);
  }
  const transport = createLocalTransport({ seed: saved.messages || [] });
  startSession({ mode: saved.mode, transport, roles: saved.config.players, config: saved.config, names: {} });
  M.names = saved.names || {};
  // Al retomar en un celular nadie sabe quién lo tenía: se vuelve a la pantalla de pase (C-6)
  S.uiRole = saved.mode === 'cpu' ? 'A' : null;
  keepAwake();
  onChange();
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }

/** El rol que está mirando esta pantalla. En un celular, el que lo tiene en la mano. */
const quienMira = () => (S.mode === 'online' ? S.role : S.mode === 'cpu' ? 'A' : S.uiRole);

function render() {
  if (!M) return;
  const v = view();
  if (v.lobby) return renderLobby();
  // Si hay una transición en pantalla, manda ella (el mismo cuidado que en Dudo: se pregunta
  // por el overlay y no por una marca aparte, que se quedaba pegada si dos se pisaban).
  const transicion = !$('#handoff').hidden;

  // 1. Una mano que se cerró y todavía no se mostró: el julepe manda sobre todo lo demás
  if (v.historia.length > S.shownHand) { if (!transicion) showHandEnd(v); return; }
  if (transicion) return;

  if (v.done) return renderResult(v);
  showScreen('screen-play');

  // 2. En un celular, el que tiene que jugar todavía no tiene el aparato en la mano
  const JUEGAN = ['declara', 'cambia', 'baza', 'regala'];
  if (S.mode === 'local' && JUEGAN.includes(v.phase) && v.turno && S.uiRole !== v.turno) return showPass(v, v.turno);
  if (chat) chat.show();

  renderPlay(v);
}

function renderPlay(v) {
  const yo = quienMira();
  const miTurno = !!yo && v.turno === yo;

  // El plato, la mano y el triunfo
  const top = $('#table-top');
  top.innerHTML = '';
  top.append(
    el('div', { class: 'pot' + (v.plato >= 12 ? ' grande' : '') },
      el('span', { class: 'n' }, v.plato), el('span', { class: 'l' }, T.potLabel)),
    el('div', { class: 'table-mid' },
      el('div', { class: 'hand-n' }, fmt(T.handOf, { n: v.manoN + 1, total: v.totalManos })),
      el('div', { class: 'dealer' }, fmt(T.dealerIs, { name: nameOf(v.dador) }))),
    el('div', { class: 'trump' }, el('span', { class: 'l' }, T.trumpLabel),
      v.muestra ? cardEl(v.muestra, { size: 'pcard--sm' }) : el('span', { class: 'pcard pcard--sm back' }, el('span', { class: 's' }, '?'))),
  );

  // Los asientos: quién va, cuántas bazas lleva y cuánto ha tomado
  const seats = $('#seats');
  seats.innerHTML = '';
  for (const p of M.players) {
    const d = v.decl[p];
    const etiqueta = d === 'va' ? T.declWent : d === 'paso' ? T.declPassed : d === 'obligado' ? T.declForced
      : v.phase === 'declara' && v.turno === p ? T.declThinking : '·';
    const bazas = v.ganadas[p] || 0;
    seats.append(el('div', { class: ['seat', v.turno === p ? 'turn' : '', d === 'paso' ? 'fuera' : '', d ? d : ''].filter(Boolean).join(' ') },
      el('span', { class: 'n' }, nameOf(p)),
      el('span', { class: 'd' }, etiqueta),
      bazas ? el('span', { class: 'b' }, fmt(bazas === 1 ? T.tricksOfOne : T.tricksOf, { n: bazas })) : null,
      el('span', { class: 'tragos' }, tragos(v.st[p].tragos)),
    ));
  }

  $('#status-who').textContent = miTurno ? T.yourTurn : v.turno ? fmt(T.turnOf, { name: nameOf(v.turno) }) : T.dealing;
  $('#status-sub').textContent = v.phase === 'declara' ? T.declareTitle
    : v.phase === 'cambia' ? T.changeTitle
    : v.phase === 'baza' ? fmt(T.trickOf, { n: Math.min(MANO, v.bazas.length + 1) })
    : v.phase === 'regala' ? (miTurno ? fmt(T.giveTitle, { n: (v.ganadas[yo] || 0) * PREMIO }) : fmt(T.giveWait, { name: nameOf(v.turno) }))
    : T.dealing;

  renderTrick(v);
  renderMine(v, yo, miTurno);
  renderActions(v, yo, miTurno);
}

/** La baza en juego; si acaba de cerrarse, la que quedó sobre la mesa y quién se la llevó. */
function renderTrick(v) {
  const box = $('#trick');
  box.innerHTML = '';
  // Antes de la primera baza no hay nada que mostrar acá: lo que hay que leer —el porqué de
  // la decisión— va junto a los botones, y repetirlo arriba solo alarga la pantalla.
  if (v.phase !== 'baza' && v.phase !== 'regala') return;
  const cerrada = !v.baza.length && v.bazas.length ? v.bazas[v.bazas.length - 1] : null;
  const cartas = v.baza.length ? v.baza : cerrada?.cartas || [];
  if (!cartas.length) { box.append(el('p', { class: 'trick-empty' }, fmt(T.opensTrick, { name: nameOf(v.turno) }))); return; }
  box.append(el('div', { class: 'trick-cards' }, ...cartas.map(j => el('div', { class: 'trick-one' },
    cardEl(j.c, { cls: cerrada && cerrada.gana === j.p ? 'win' : '' }),
    el('span', { class: 'who' }, nameOf(j.p)),
  ))));
  const yo = quienMira();
  if (cerrada) {
    box.append(el('p', { class: 'trick-empty' }, cerrada.gana === yo ? T.trickWonYou : fmt(T.trickWon, { name: nameOf(cerrada.gana) })));
  }
}

/** Mis cartas. Las que no se pueden tirar se ven apagadas, con el porqué debajo (C-8b). */
function renderMine(v, yo, miTurno) {
  const box = $('#mine');
  box.innerHTML = '';
  const mano = yo ? v.cartas[yo] : null;
  // Sin cartas no hay nada que mostrar: en el reparto porque todavía no llegan, y al repartir
  // los tragos porque ya se jugaron todas. Un recuadro vacío solo ocupa la pantalla.
  if (!mano || !mano.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const puede = miTurno && v.phase === 'baza' ? puedeJugar(v, yo) : mano;
  const eligiendo = miTurno && (v.phase === 'baza' || v.phase === 'cambia');
  box.append(el('div', { class: 'mine-label' }, T.yourCards));
  box.append(el('div', { class: 'cards-row' }, ...mano.map((c, i) => {
    const bloqueada = v.phase === 'baza' && !puede.includes(c);
    const cls = [bloqueada ? 'off' : '', S.sel === c ? 'sel' : '', S.drop.includes(i) ? 'drop' : ''].filter(Boolean).join(' ');
    const tocar = !eligiendo || bloqueada ? null : () => {
      SFX.tap(); vibrate(10);
      if (v.phase === 'cambia') {
        S.drop = S.drop.includes(i) ? S.drop.filter(k => k !== i) : S.drop.length < RESERVA ? [...S.drop, i] : S.drop;
      } else {
        S.sel = S.sel === c ? null : c;    // un toque en la elegida la suelta (C-8)
      }
      renderPlay(view());
    };
    return cardEl(c, { cls, onClick: tocar });
  })));
  if (v.phase === 'baza' && miTurno && puede.length < mano.length) {
    // Cuál de las tres obligaciones está apagando cartas, en el orden en que mandan: sin
    // ninguna del palo de salida es fallar; con menos permitidas que las que tiene de ese palo
    // es montar; si no, asistir.
    const salida = v.baza.length ? palo(v.baza[0].c) : null;
    const delPalo = mano.filter(c => palo(c) === salida);
    const why = !delPalo.length ? T.whyTrump : puede.length < delPalo.length ? T.whyTop : T.whyFollow;
    box.append(el('p', { class: 'why' }, fmt(T.lockedWhy, { why })));
  }
  if (v.decl[yo] === 'paso') box.append(el('p', { class: 'why' }, T.declPassed));
}

function renderActions(v, yo, miTurno) {
  const box = $('#actions');
  box.innerHTML = '';
  if (!yo) return;
  if (!miTurno) {
    box.append(el('p', { class: 'muted center' }, v.turno ? fmt(T.waitingFor, { name: nameOf(v.turno) }) : T.dealing));
    return;
  }
  const manda = msg => {
    S.sel = null; S.drop = []; S.reparto = null;
    if (S.mode === 'local') S.uiRole = null;      // el celular vuelve a la mesa (C-9)
    S.transport.send({ ...msg, from: yo });
  };

  if (v.phase === 'declara') {
    box.append(
      el('p', { class: 'pick-label' }, T.declareHint),
      el('button', { class: 'btn btn--yellow', onClick: () => { SFX.dice(); vibrate(20); manda({ t: 'va' }); } }, T.goDo),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { SFX.tap(); manda({ t: 'paso' }); } }, T.passDo),
    );
    return;
  }

  if (v.phase === 'cambia') {
    const n = S.drop.length;
    box.append(
      el('p', { class: 'pick-label' }, T.changeHint),
      el('button', {
        class: 'btn btn--yellow',
        onClick: () => { SFX.flip(); vibrate(15); manda({ t: 'cambia', i: S.drop.join(',') }); },
      }, n === 0 ? T.changeKeep : n === 1 ? T.changeOne : fmt(T.changeDo, { n })),
    );
    return;
  }

  if (v.phase === 'baza') {
    // Sin carta elegida, el botón ya dice "elige una carta": repetirlo arriba no agrega nada.
    if (S.sel) box.append(el('p', { class: 'pick-label' }, cardName(S.sel)));
    box.append(el('button', {
      class: 'btn btn--yellow', disabled: !S.sel,
      onClick: () => { const c = S.sel; SFX.reveal(); vibrate(20); manda({ t: 'juega', c }); },
    }, S.sel ? fmt(T.playDo, { card: `${rango(S.sel)}${palo(S.sel)}` }) : T.pickCard));
    return;
  }

  if (v.phase === 'regala') {
    const cuantas = v.ganadas[yo] || 0;
    if (!S.reparto) S.reparto = {};
    const puestos = Object.values(S.reparto).reduce((a, b) => a + b, 0);
    const quedan = cuantas - puestos;
    box.append(el('p', { class: 'pick-label' }, fmt(T.giveTitle, { n: cuantas * PREMIO })));
    for (const p of M.players.filter(r => r !== yo)) {
      const n = S.reparto[p] || 0;
      box.append(el('div', { class: 'give-row' },
        el('span', { class: 'n' }, nameOf(p)),
        el('span', { class: 'give-pm' },
          el('button', { type: 'button', 'aria-label': '−', disabled: !n, onClick: () => { S.reparto[p] = n - 1; SFX.tap(); renderPlay(view()); } }, '−'),
          el('span', { class: 'c' }, n * PREMIO),
          el('button', { type: 'button', 'aria-label': '+', disabled: quedan <= 0, onClick: () => { S.reparto[p] = n + 1; SFX.tap(); vibrate(10); renderPlay(view()); } }, '+'),
        ),
      ));
    }
    const lista = Object.entries(S.reparto).flatMap(([p, n]) => Array(n).fill(p));
    box.append(
      el('p', { class: 'pick-label' }, quedan > 0 ? fmt(quedan === 1 ? T.giveLeftOne : T.giveLeft, { n: quedan * PREMIO }) : T.giveDone),
      el('button', {
        class: 'btn btn--yellow', disabled: quedan !== 0,
        onClick: () => { SFX.cheers(); vibrate(25); manda({ t: 'regala', a: lista.join(',') }); },
      }, T.giveDo),
    );
  }
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

/* ---------- Pase del celular (C-9) ---------- */
/** Lo que acaba de pasar, para que nadie reciba el celular sin saber en qué quedó la mesa. */
function ultimoHecho(v) {
  if (v.phase === 'declara') {
    const antes = v.orden.slice(0, v.orden.indexOf(v.turno)).reverse().find(p => v.decl[p]);
    if (!antes) return null;
    return el('div', { class: 'who-line' }, `${nameOf(antes)}: ${v.decl[antes] === 'va' ? T.declWent : T.declPassed}`);
  }
  if (v.phase === 'cambia') {
    const antes = v.va.slice(0, v.va.indexOf(v.turno)).reverse().find(p => v.cambios[p] !== undefined);
    if (!antes) return null;
    const n = v.cambios[antes];
    return el('div', { class: 'who-line' }, fmt(n === 0 ? T.changedNone : n === 1 ? T.changedOne : T.changedSome, { name: nameOf(antes), n }));
  }
  if (v.phase === 'baza') {
    const cerrada = !v.baza.length && v.bazas.length ? v.bazas[v.bazas.length - 1] : null;
    const cartas = v.baza.length ? v.baza : cerrada?.cartas || [];
    if (!cartas.length) return null;
    return el('div', { class: 'stage', style: 'gap:8px' },
      el('div', { class: 'trick-cards' }, ...cartas.map(j => el('div', { class: 'trick-one' },
        cardEl(j.c, { size: 'pcard--sm', cls: cerrada && cerrada.gana === j.p ? 'win' : '' }),
        el('span', { class: 'who' }, nameOf(j.p))))),
      cerrada ? el('div', { class: 'who-line' }, fmt(T.trickWon, { name: nameOf(cerrada.gana) })) : null,
    );
  }
  if (v.phase === 'regala') {
    const antes = v.deben.slice(0, v.deben.indexOf(v.turno)).reverse().find(p => v.regalos[p]);
    if (!antes) return null;
    const cuenta = {};
    v.regalos[antes].forEach(p => { cuenta[p] = (cuenta[p] || 0) + PREMIO; });
    return el('div', { class: 'who-line' }, Object.entries(cuenta)
      .map(([p, n]) => fmt(T.gaveLine, { name: nameOf(antes), n, to: nameOf(p) })).join(' · '));
  }
  return null;
}

function showPass(v, role) {
  const hecho = ultimoHecho(v);
  const pb = passBlock({ label: T.hoPass, name: nameOf(role), button: T.hoReady, small: !!hecho });
  const stage = el('div', { class: 'stage pop' }, hecho, pb);
  stage.setAdvance = fn => pb.setAdvance(fn);
  showHandoff([stage], () => { S.uiRole = role; S.sel = null; S.drop = []; SFX.pass(); render(); }, { tapAdvances: false });
}

/* ---------- Se cierra la mano: el julepe ---------- */
function showHandEnd(v) {
  const h = v.historia[S.shownHand];
  S.shownHand++;
  const yo = quienMira();
  const nombres = ps => ps.map(nameOf).join(', ');
  const stage = el('div', { class: 'stage pop' });

  if (h.vacia) {
    stage.append(
      el('div', { class: 'safe' }, T.allPassedTitle),
      el('div', { class: 'who-line' }, fmt(T.allPassedText, { name: nameOf(v.dador) })),
      el('div', { class: 'sips' }, h.plato),
      el('div', { class: 'hint' }, T.potKept),
    );
    SFX.tap();
  } else {
    const julepes = h.julepes;
    if (julepes.length) {
      stage.append(
        el('div', { class: 'julepe' }, T.julepeTitle),
        el('div', { class: 'who-line' }, julepes.includes(yo) ? T.julepeYou
          : julepes.length > 1 ? fmt(T.julepeBoth, { names: nombres(julepes) })
          : fmt(T.julepeOther, { name: nameOf(julepes[0]) })),
        el('div', { class: 'sips' }, fmt(T.drinksNow, { n: h.plato })),
      );
      SFX.drink(); vibrate([60, 60, 120]);
    } else {
      stage.append(el('div', { class: 'safe' }, T.savedTitle), el('div', { class: 'who-line' }, T.savedText));
      SFX.cheers(); vibrate(30);
    }

    // Cuántas bazas hizo cada uno de los que fueron
    stage.append(el('div', { class: 'hand-table' }, ...h.va.map(p => {
      const n = h.ganadas[p] || 0;
      return el('div', { class: 'hand-row ' + (julepes.includes(p) ? 'perdio' : 'salvado') },
        el('span', { class: 'n' }, nameOf(p) + (h.decl[p] === 'obligado' ? ` (${T.declForced})` : '')),
        el('span', { class: 'v' }, fmt(n === 0 ? T.tricksNone : n === 1 ? T.tricksOfOne : T.tricksOf, { n })));
    })));

    const proximo = julepes.length ? h.plato * julepes.length : 0;
    if (proximo) stage.append(el('div', { class: 'hint' }, fmt(T.potNext, { n: proximo })));
    [sello(h), destape(h)].forEach(n => { if (n) stage.append(n); });
  }

  stage.append(el('div', { class: 'hint', style: 'margin-top:6px' }, T.goOn));
  showHandoff([stage], () => {
    if (S.mode === 'local') S.uiRole = null;   // la mano nueva empieza con el celular en la mesa
    onChange();
  });
}

/** ¿Jugó cada uno con las cartas que le tocaron? Solo tiene sentido en la sala (C-10). */
function sello(h) {
  if (S.mode !== 'online') return null;
  const msg = repartoDe(null, h.n);
  if (msg && msg.m) return el('div', { class: 'sello mal' }, T.sealOpen);
  const ver = h.verificacion;
  if (ver.culpables.length) return el('div', { class: 'sello mal' }, fmt(T.sealBad, { name: ver.culpables.map(nameOf).join(', ') }));
  if (!ver.hubo || ver.faltan.length) return el('div', { class: 'sello' }, T.sealWait);
  return el('div', { class: 'sello' }, T.sealVerified);
}

/** Lo que tenía cada uno, que es lo primero que se pregunta la mesa cuando cae un julepe. */
function destape(h) {
  const filas = [];
  for (const p of M.players) {
    const cs = manoRepartida(h, p);
    if (!cs) continue;
    const ix = h.puestos?.[p] || [];
    const final = [...enMano(cs).filter((_, k) => !ix.includes(k)), ...enReserva(cs).slice(0, ix.length)];
    filas.push(el('div', { class: 'fila' },
      el('span', { class: 'n' }, nameOf(p)),
      el('div', { class: 'cards-row' }, ...final.map(c => cardEl(c, { size: 'pcard--xs' })))));
  }
  if (!filas.length) return null;
  const det = el('details', { class: 'panel', style: 'width:100%;padding:10px 14px' },
    el('summary', {}, T.showHand), el('div', { class: 'destape' }, ...filas));
  det.addEventListener('click', e => e.stopPropagation());   // abrirlo no puede cerrar el overlay
  return det;
}

/* ---------- Final ---------- */
function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  showScreen('screen-result');
  // Quién ganó, para la bitácora de salas del panel del dueño (D-79). Solo en sala y una vez.
  if (!already && S.mode === 'online') {
    S.transport?.noteWinner?.({ role: v.ganadores[0], name: v.ganadores.map(nameOf).join(', ') });
  }
  const yo = quienMira();
  const gane = yo && v.ganadores.includes(yo);
  $('#result-trophy').textContent = gane ? '🏆' : '🍹';
  $('#result-title').textContent = v.ganadores.length > 1 ? fmt(T.winnerTie, { names: v.ganadores.map(nameOf).join(', ') })
    : gane ? T.winnerYou
    : yo ? fmt(T.loserYou, { name: nameOf(v.ganadores[0]) })
    : fmt(T.winner, { name: nameOf(v.ganadores[0]) });
  $('#result-sub').textContent = fmt(T.endStats, { manos: v.historia.length });

  // La tabla de la noche: quién tomó menos
  const board = $('#result-board');
  board.innerHTML = '';
  const orden = [...M.players].sort((a, b) => v.st[a].tragos - v.st[b].tragos);
  board.append(el('p', { class: 'lead', style: 'margin:0 0 8px' }, T.endSips),
    el('div', { class: 'board' }, ...orden.map((p, i) => el('div', { class: 'board-row' + (v.ganadores.includes(p) ? ' top' : '') },
      el('span', { class: 'p' }, i + 1),
      // Los julepes van dentro de la celda del nombre: como cuarta columna rompían la fila
      el('span', { class: 'n' }, nameOf(p),
        v.st[p].julepes ? el('small', { class: 'j' }, ` · ${fmt(T.julepesOf, { n: v.st[p].julepes })}`) : null),
      el('span', { class: 's' }, v.st[p].tragos),
    ))));

  const lista = $('#history-list');
  lista.innerHTML = '';
  v.historia.forEach(h => {
    const detalle = h.vacia ? T.histVoid
      : h.julepes.length ? fmt(T.histJulepe, { names: h.julepes.map(nameOf).join(', ') })
      : fmt(T.histSaved, { names: h.salvados.map(nameOf).join(', ') });
    lista.append(el('li', {},
      el('span', { class: 'r' }, h.n + 1),
      el('span', { class: 'q' }, `${fmt(T.histPot, { n: h.plato })} · ${h.muestra || ''}`),
      el('span', { class: h.julepes?.length ? 'down' : 'up' }, detalle),
    ));
  });

  const acciones = $('#result-actions');
  acciones.innerHTML = '';
  acciones.append(
    el('button', {
      class: 'btn btn--yellow',
      onClick: e => {
        if (S.mode !== 'online') return startMatch(S.mode, M.names, M.config);
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

function shareButton(url) {
  const btn = el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%;max-width:320px' }, canShare() ? T.shareLink : T.copyLink);
  btn.addEventListener('click', async () => {
    SFX.tap();
    const texto = fmt(COMMON[lang].invite, { name: M.names[S.role] || '', game: T.title, code: S.code });
    const r = await shareLink({ title: T.title, text: texto, url });
    if (r === 'copied') { btn.textContent = T.copied; setTimeout(() => { btn.textContent = canShare() ? T.shareLink : T.copyLink; }, 2000); }
  });
  return btn;
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

async function startOnline(transport, code, role, name, config, privadas = {}, llave = null) {
  // La llave del sobre se arma antes de saludar: el `hello` lleva la pública, y con esa el
  // dador cierra la mano de esta persona (D-81).
  const mia = llave || (haySobres() ? await nuevasLlaves() : null);
  startSession({ mode: 'online', transport, roles: [role], config, names: { [role]: name }, code, role, privadas, llave: mia });
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

async function joinOnline(code, name, previousRole = null, privadas = {}, llave = null) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const { role, config } = await t.join(code, { name, previousRole });
  await startOnline(t, code, role, name, config || DEFAULT_CONFIG, privadas, llave);
}

/** La revancha crea una sala nueva (C-7). El primero que la propone manda; el resto lo sigue. */
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
function startMatch(mode, names, config) {
  store.clear();
  const players = config.players;
  const transport = createLocalTransport();
  startSession({ mode, transport, roles: players.slice(), config, names });
  S.uiRole = mode === 'cpu' ? 'A' : null;
  S.shownHand = 0;
  S.shownWin = false;
  keepAwake();
  trackStart({ game: GAME_ID, mode, players: mode === 'cpu' ? 1 : players.length });   // señal de uso (D-44)
  onChange();
}

/* ------------------------------------------------------------------ */
/* Intro y configuración                                               */
/* ------------------------------------------------------------------ */
const MODES = [
  { id: 'local', title: () => T.modeLocal, sub: () => T.modeLocalHint },
  { id: 'online', title: () => T.modeOnline, sub: () => T.modeOnlineHint },
  { id: 'cpu', title: () => T.modeCpu, sub: () => T.modeCpuHint },
];

function renderModes() {
  const box = $('#modes');
  box.innerHTML = '';
  MODES.forEach(m => {
    box.append(el('button', { class: 'mode', onClick: () => { SFX.tap(); renderSetup(m.id); } },
      el('div', { class: 'mode-main' }, el('b', {}, m.title()), el('small', {}, m.sub())),
      el('span', { class: 'go' }, '›')));
  });
}

function renderRules() {
  const list = $('#rules-list');
  list.innerHTML = '';
  T.rules.forEach(r => list.append(el('li', { html: r })));
}

/**
 * Una hilera de números para elegir (cuántas manos, cuántos rivales). Es lo único que se
 * configura en este juego: el resto son las reglas.
 */
function selectorNumero({ opciones, elegido, label, hint, texto, onPick }) {
  const fila = el('div', { class: 'largos' });
  const pintar = () => {
    fila.innerHTML = '';
    // En el botón va solo la cifra: "5 rivales" repetido cinco veces no cabe en un celular
    // angosto, y la pregunta ya está escrita arriba. La frase entera queda de etiqueta para
    // quien navegue a ciegas.
    opciones.forEach(n => fila.append(el('button', {
      type: 'button', class: n === elegido ? 'on' : '', 'aria-label': texto(n),
      onClick: () => { elegido = n; onPick(n); SFX.tap(); pintar(); },
    }, String(n))));
  };
  pintar();
  return el('div', { class: 'toggle-row', style: 'display:block' },
    el('div', { class: 'txt' }, el('b', {}, label), el('small', {}, hint)), fila);
}

const selectorManos = (elegido, onPick) => selectorNumero({
  opciones: LARGOS, elegido, label: T.handsLabel, hint: T.handsHint,
  texto: n => fmt(T.handsOption, { n }), onPick,
});

/** El nombre de cada rival del aparato: con uno solo es "Celular"; con más, van numerados. */
const nombreBot = (i, total) => (total === 1 ? T.cpuName : fmt(T.cpuNameN, { n: i }));

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
    detalle = fmt(T.resumeText, { n: previa.manoN + 1, plato: previa.plato });
  }
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, detalle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: async () => { try { await resume(saved); } catch (_) { store.clear(); renderResumeSlot(); } } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderSetup(mode, codigoInvitado = '') {
  if (mode === 'online') return renderSetupOnline(codigoInvitado);
  const form = $('#setup-form');
  const recordado = nameStore.get();
  const draft = mode === 'cpu' ? [recordado || ''] : [recordado || '', '', ''];
  let manos = DEFAULT_CONFIG.manos;
  let rivales = RIVALES_POR_DEFECTO;

  const dibujar = () => {
    form.innerHTML = '';
    draft.forEach((name, i) => {
      form.append(el('div', { class: 'player-row' },
        el('div', { class: 'num' }, i + 1),
        el('input', {
          type: 'text', value: name, maxlength: 14, autocomplete: 'off', enterkeyhint: 'next',
          placeholder: mode === 'cpu' ? T.yourName : fmt(T.playerPlaceholder, { n: i + 1 }),
          onInput: e => { draft[i] = e.target.value; },
        }),
        mode === 'local' && draft.length > MIN_PLAYERS
          ? el('button', { class: 'del', 'aria-label': T.removePlayer, onClick: () => { draft.splice(i, 1); dibujar(); } }, '✕')
          : null,
      ));
    });
    if (mode === 'cpu') {
      for (let i = 1; i <= rivales; i++) {
        form.append(el('div', { class: 'player-row cpu' },
          el('div', { class: 'num' }, '🤖'), el('span', { class: 'cpu-name' }, nombreBot(i, rivales))));
      }
      form.append(selectorNumero({
        opciones: RIVALES, elegido: rivales, label: T.rivalsLabel, hint: T.rivalsHint,
        texto: n => (n === 1 ? T.rivalsOne : fmt(T.rivalsOption, { n })),
        // Se vuelve a dibujar entero: la lista de rivales de arriba crece con este número
        onPick: v => { rivales = v; dibujar(); },
      }));
    }
    form.append(selectorManos(manos, v => { manos = v; }));
  };
  dibujar();

  const acciones = $('#setup-actions');
  acciones.innerHTML = '';
  if (mode === 'local') {
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
    class: 'btn btn--yellow', onClick: () => {
      const nombres = draft.map(n => n.trim());
      const err = $('#setup-error');
      const problema = mode === 'cpu'
        ? (!nombres[0] ? T.errNames : null)
        : nombres.length < MIN_PLAYERS ? fmt(T.errMin, { n: MIN_PLAYERS })
        : nombres.some(n => !n) ? T.errNames
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
      const players = ROLES.slice(0, mode === 'cpu' ? 1 + rivales : nombres.length);
      const names = mode === 'cpu'
        ? { A: nombres[0], ...Object.fromEntries(players.slice(1).map((r, i) => [r, nombreBot(i + 1, rivales)])) }
        : Object.fromEntries(players.map((r, i) => [r, nombres[i]]));
      startMatch(mode, names, { ...DEFAULT_CONFIG, manos, players });
    },
  }, T.start));
  acciones.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => showScreen('screen-intro') }, T.menu));
  $('#setup-error').textContent = '';
  showScreen('screen-setup');
}

/**
 * Crear una sala o entrar con un código. Quien llega por un enlace no ve "crear": solo puede
 * entrar a esa sala, así que el código llega escrito y no se toca (C-7).
 */
function renderSetupOnline(codigoInvitado = '') {
  showScreen('screen-setup');
  const invitado = !!codigoInvitado;
  $('#screen-setup h2').textContent = invitado ? T.invitedTitle : T.setupOnline;
  $('.setup-hint').textContent = invitado ? T.invitedHint : T.setupHint;
  const form = $('#setup-form'); form.innerHTML = '';
  const err = $('#setup-error'); err.textContent = '';
  let nombre = nameStore.get() || '';
  let manos = DEFAULT_CONFIG.manos;

  form.append(el('div', { class: 'player-row' },
    el('div', { class: 'num' }, '👤'),
    el('input', {
      type: 'text', value: nombre, maxlength: 14, placeholder: T.yourNameLabel, autocomplete: 'off',
      onInput: e => { nombre = e.target.value; },
    }),
  ));
  // Los ajustes los pone quien crea la sala: al que entra le llegan con la partida
  if (!invitado) form.append(selectorManos(manos, v => { manos = v; }));

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
      try { await createOnline(n, { ...DEFAULT_CONFIG, manos, players: null }); }
      catch (e) { failWith(e, T, fallar); }
      crear.disabled = false;
    } }, T.create);
    acciones.append(crear, el('div', { class: 'or' }, '— o —'),
      el('div', { class: 'panel' },
        el('p', { class: 'lead', style: 'margin-bottom:8px' }, T.joinTitle),
        el('div', { class: 'field' }, codigo), entrar));
  }
  acciones.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { showScreen('screen-intro'); } }, T.menu));
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(langToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  document.addEventListener('click', e => { if (e.target.closest('.btn, .mode, .largos button, .lang-toggle button')) SFX.tap(); });
  sparkles(12);
  renderRules();
  renderModes();
  renderResumeSlot();
  const sala = new URLSearchParams(location.search).get('sala');
  if (!sala || !/^[A-Z]{4}$/i.test(sala)) return;
  const code = sala.toUpperCase();
  const guardada = store.load();
  // Recargar a mitad de partida vuelve a la misma sala sin volver a presentarse; llegar por un
  // enlace ajeno es otra cosa: ahí se pide el nombre y no se ofrece crear otra sala (C-7, C-6).
  if (guardada && guardada.mode === 'online' && guardada.code === code && !guardada.done) {
    const priv = guardada.private || {};
    joinOnline(code, guardada.name, guardada.role, priv.privadas || {}, priv.llave || null)
      // Si la reconexión falla —se cayó la señal justo ahí— **no se borra la partida**: con ella
      // se vuelve al mismo rol y a las mismas cartas al siguiente intento. Borrarla dejaría al
      // jugador entrando como uno nuevo, con otro rol y sin su mano (C-6).
      .catch(() => renderSetupOnline(code));
  } else renderSetupOnline(code);
}

init();

// Ventana al estado para las pruebas de punta a punta (tools/e2e/)
window.__julepe = { view: () => (M ? view() : null), match: () => M, session: () => S };
