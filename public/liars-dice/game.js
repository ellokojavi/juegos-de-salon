/**
 * Dudo — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7): cambia el transporte, no el juego.
 *  - local: de 2 a 6 en este celular, pasándoselo · cpu: duelo contra el aparato
 *  - online: sala de 2 a 6 celulares
 * Los dados de cada ronda viajan como mensaje `roll`. En un celular van en claro —no hay a quién
 * escondérselos—; en la sala va el hash y se destapan al dudar, y ahí se verifican (C-10, D-70).
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import { botonInvitar } from '../assets/js/compartir.js';
import { gameById, MODO_UNO_AL_DIA } from '../assets/js/games.js';
import { getLang, langToggle, applyStatic, COMMON, withLang } from '../assets/js/i18n.js';
import { param } from '../assets/js/parametros.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { showHandoff, passBlock } from '../assets/js/handoff.js';
import { crearDado } from '../assets/js/dado3d.js';
import { clearRoomError, tryRematch, tryRoom } from '../assets/js/transport/errors.js';
import { createChat } from '../assets/js/chat.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { trackStart, trackVisit, trackFinish } from '../assets/js/transport/stats.js';
import { finDePartida, bloqueVictorias } from '../assets/js/ranking.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import { modoHoy, introHoy, terminarHoy, ponerTarjeta, empezarHoy } from '../assets/js/uno-al-dia-ui.js';
import { azarDel, puntajeDudo } from '../assets/js/uno-al-dia.js';
import {
  PINTAS, MIN_PLAYERS, MAX_PLAYERS, MIN_CALZAR, buildState, botMove, minBid, bidOk,
  readDice, rollDice, writeDice, countPinta, sha256, randomSalt, verifyOpen,
} from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, CHILENO, LOCALES, TURN_SECS } from './rules.js';

// Cuenta la visita al abrir la página, aunque nadie llegue a jugar (D-208)
trackVisit();

const lang = getLang();
const L = LOCALES[lang];
const T = L.ui;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];
/** Cuánto se demora el celular en cantar su apuesta: menos se siente instantáneo y no se lee. */
const CPU_MS = 1100;
const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);
/** Uno al día (D-230): con `?today`, contra el celular y con los dados del día. */
const HOY = modoHoy(GAME_ID);

/**
 * Los dados de un jugador en una ronda de Uno al día: salen de la semilla del día, la ronda y el
 * rol, así todos parten con los mismos. Solo contra el celular, que es local: en una sala la
 * semilla adelantaría los dados del rival (D-70, C-10), y ahí se sigue tirando con `rollDice`.
 */
function dadosDelDia(semilla, ronda, rol, n) {
  const r = azarDel(semilla, `dudo:${ronda}:${rol}`);
  return Array.from({ length: n }, () => 1 + Math.floor(r() * 6));
}

let S = null;   // sesión: modo, transporte, roles de este celular, quién tiene el aparato
let M = null;   // partida: config, nombres y la lista de jugadas
let chat = null; // chat de sala: solo en varios celulares (canon C-15)

/* ------------------------------------------------------------------ */
/* Nombres de las apuestas                                             */
/* ------------------------------------------------------------------ */
/**
 * Cómo se dice la pinta. En español la mesa las llama por su nombre —tontos, trenes, cuadras,
 * quintas y sextas— y eso viene encendido; apagado, y en los otros dos idiomas, van por número.
 */
const nombresChilenos = () => lang === 'es' && M?.config?.chileno !== false;
const pintaName = (n, p) => {
  if (nombresChilenos()) return n === 1 ? CHILENO.one[p] : CHILENO.many[p];
  return n === 1 ? L.pintaOne[p] : L.pintaMany[p];
};
const nameOf = r => M.names[r] || r;

/* ------------------------------------------------------------------ */
/* Dados dibujados                                                     */
/* ------------------------------------------------------------------ */
/** Dónde va cada punto de la cara, en la grilla de 3×3. */
const PIPS = {
  1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};

function dieEl(value, { small = false, on = false, off = false } = {}) {
  const clases = ['die', value === 1 ? 'ace' : '', small ? 'die--sm' : '', on ? 'on' : '', off ? 'off' : ''];
  return el('span', { class: clases.filter(Boolean).join(' '), 'aria-label': String(value) },
    ...PIPS[value].map(pos => el('i', { style: `grid-area:${Math.ceil(pos / 3)}/${((pos - 1) % 3) + 1}` })));
}

/** Los dados de una apuesta: la cara sola, para meterla dentro de una frase. */
const bidEl = (n, p) => el('span', { class: 'bid-chip' }, el('b', {}, n), dieEl(p, { small: true }));

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
function newMatch(config) {
  // En la sala los jugadores no se saben hasta que el anfitrión parte: llegan de a uno
  return { config, players: config.players || null, names: {}, plays: [], seen: new Set(), presence: {}, rematch: {}, verify: null };
}

const JUGADAS = ['roll', 'bid', 'dudo', 'calza', 'open', 'timeout'];

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
  : { lobby: true, phase: 'lobby', done: false, players: [], st: {}, alive: [], waiting: [], rolls: {}, history: [], last: null });

/**
 * Los dados que este aparato puede mostrar de un rol. En la sala los propios no salen del
 * mensaje —ahí viaja el hash— sino de lo que este celular guardó al tirarlos.
 */
const diceOf = (v, role) => {
  if (S.mode === 'online' && role === S.role) return S.secrets[v.round]?.dice || null;
  return readDice(v.rolls[role]?.d) || null;
};

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, code = null, role = null, secrets = {} }) {
  // Cambiar de sala (la revancha abre una nueva) es irse de la anterior para siempre
  if (S?.transport) S.transport.dispose();
  S = {
    mode, transport, roles, code, role, secrets,
    // `Infinity` hasta saber por dónde va la partida: quien entra a una sala a mitad de camino
    // no tiene por qué ver el destape de una ronda que se jugó antes de que llegara.
    uiRole: null, sel: null, shownRound: Infinity, botAt: -1, rolled: new Set(), abriendo: new Set(),
    // Shake to roll: the dice each role already shook out, round by round (`round:role`)
    shaken: new Set(), turn: null,
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
function onChange() { chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e)); }

/** Lo que hace solo este celular: tirar los dados de sus roles y jugar el turno del aparato. */
async function act() {
  saveSession();
  if (!M?.players) return;
  const v = view();
  if (S.shownRound === Infinity) S.shownRound = (v.last?.n ?? -1) + 1;   // lo de antes ya pasó
  if (v.done) return;

  // 1. Lo primero, la ronda que acaba de resolverse: que nadie haya cambiado sus dados (C-10).
  // Va antes de tirar los de la ronda siguiente, porque el destape se dibuja apenas se cuenta y
  // el sello tiene que estar listo para esa misma pantalla.
  if (S.mode === 'online' && v.last && M.verify?.n !== v.last.n) await verificarRonda(v.last);

  // 2. Los dados de la ronda. Cada rol de este celular tira los suyos.
  if (v.phase === 'roll') {
    // Cada `send` avisa por microtarea y vuelve a entrar acá antes de que se aplique el resto,
    // así que sin la marca el mismo rol tiraba sus dados varias veces (el motor los descarta,
    // pero quedaban mensajes de más en la partida guardada).
    const mios = v.waiting.filter(r => S.roles.includes(r) && !S.rolled.has(`${v.round}:${r}`));
    for (const r of mios) {
      S.rolled.add(`${v.round}:${r}`);
      const dados = S.hoy ? dadosDelDia(S.hoy.semilla, v.round, r, v.st[r].dice) : rollDice(v.st[r].dice);
      if (S.mode === 'online') {
        // Los dados no viajan: se compromete el hash y se guardan acá hasta el destape (C-10)
        const salt = randomSalt();
        S.secrets[v.round] = { dice: dados, salt };
        saveSession();
        S.transport.send({ t: 'roll', from: r, h: await sha256(writeDice(dados) + salt) });
      } else {
        S.transport.send({ t: 'roll', from: r, d: writeDice(dados) });
      }
    }
    if (mios.length) return;
  }

  // 3. Al dudar, cada celular destapa los suyos. Es lo único que hace viajar los dados.
  if (v.phase === 'open' && S.mode === 'online' && v.waiting.includes(S.role) && !S.abriendo.has(v.round)) {
    const mio = S.secrets[v.round];
    if (mio) {
      S.abriendo.add(v.round);
      S.transport.send({ t: 'open', from: S.role, d: writeDice(mio.dice), salt: mio.salt });
    }
    return;
  }

  // 2. El turno del celular (contra el celular). Solo mira sus propios dados.
  if (v.phase === 'bid' && S.mode === 'cpu' && v.current === 'B' && S.botAt !== M.plays.length) {
    S.botAt = M.plays.length;
    const mine = diceOf(v, 'B');
    if (!mine) return;
    // Los dados que le quedan al rival: sin eso no sabe a quién apretar (ver docs/games/liars-dice.md)
    const jugada = botMove({
      myDice: mine, bid: v.bid, totalDice: v.totalDice, canCalzar: v.canCalzar,
      rivales: v.alive.filter(r => r !== 'B').map(r => v.st[r].dice),
    });
    setTimeout(() => {
      if (!S || S.mode !== 'cpu') return;
      const ahora = view();
      if (ahora.current !== 'B' || ahora.phase !== 'bid') return;
      S.transport.send({ ...jugada, from: 'B' });
    }, CPU_MS);
  }
}

/**
 * Los dados que destapó cada uno, ¿son los que había comprometido al abrir la ronda? Se guarda
 * el resultado de la última ronda y la pantalla lo dice: "verificados ✅" o el nombre del que
 * no calza (C-10).
 */
async function verificarRonda(last) {
  const rolls = M.plays.filter(p => p.t === 'roll');
  const opens = M.plays.filter(p => p.t === 'open');
  const fallan = [];
  for (const role of Object.keys(last.dice)) {
    // El hash y el destape de esta ronda: se cuentan por ronda, en orden
    const h = rolls.filter(p => p.from === role)[last.n]?.h;
    const abrió = opens.filter(p => p.from === role)[last.n];
    if (!h || !abrió) continue;
    const { ok } = await verifyOpen({ dice: readDice(abrió.d) || [], salt: abrió.salt, commit: h });
    if (!ok) fallan.push(role);
  }
  M.verify = { n: last.n, fallan };
}

/* ---------- Persistencia (canon C-6) ---------- */
function saveSession() {
  if (!S || !M) return;
  const done = M.players ? view().done : false;
  if (S.mode === 'online') {
    // De la sala se guarda cómo volver a entrar y los dados propios: sin ellos, un celular que
    // recarga a mitad de ronda no podría destapar y la mesa se quedaría esperándolo.
    store.save({ mode: 'online', code: S.code, role: S.role, name: M.names[S.role], config: M.config, private: S.secrets, done });
  } else {
    store.save({ mode: S.mode, config: M.config, names: M.names, messages: S.transport.messages || [], done });
  }
}

async function resume(saved) {
  if (saved.mode === 'online') return joinOnline(saved.code, saved.name, saved.role, saved.private || {});
  const transport = createLocalTransport({ seed: saved.messages || [] });
  startSession({ mode: saved.mode, transport, roles: saved.mode === 'cpu' ? ['A', 'B'] : saved.config.players, config: saved.config, names: {} });
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
function closeOverlay() { const b = $('#handoff'); b.hidden = true; b.innerHTML = ''; b.className = 'handoff'; }

function render() {
  if (!M) return;
  agite.onJolt = null;   // the cloth that is drawn now says again what a jolt moves
  vaso?.caja.remove();   // and puts the shaking cloth back, if it is still the table's
  const v = view();
  if (v.lobby) return renderLobby();
  // Si hay una transición en pantalla, manda ella. Se pregunta por el overlay y no por una
  // marca aparte: la marca se quedaba en true si el destape y el pase se pisaban, y ahí la
  // partida se veía congelada con el turno de otro y sin botones.
  const transicion = !$('#handoff').hidden;

  // 1. Una ronda que se resolvió y todavía no se mostró: se destapa la mesa
  if (v.last && v.last.n >= S.shownRound) { if (!transicion) showReveal(v); return; }
  if (transicion) return;

  if (v.done) return renderResult(v);
  showScreen('screen-play');

  // 2. En un celular, el que tiene que jugar todavía no tiene el aparato en la mano
  if (S.mode === 'local' && v.phase === 'bid' && v.current && S.uiRole !== v.current) return showPass(v.current);
  if (chat) chat.show();

  renderPlay(v);
}

/** La tira de arriba: cuántos dados le quedan a cada uno. Nunca cuáles. */
function renderRivals(v) {
  const box = $('#rivals');
  box.innerHTML = '';
  for (const r of M.players) {
    const s = v.st[r];
    box.append(el('div', { class: 'rival' + (v.current === r ? ' turn' : '') + (s.out ? ' out' : '') },
      el('span', { class: 'n' }, nameOf(r)),
      el('span', { class: 'd' }, s.out ? '—' : '🎲'.repeat(s.dice)),
    ));
  }
}

function renderPlay(v) {
  const yo = S.mode === 'online' ? S.role : S.mode === 'cpu' ? 'A' : S.uiRole;
  renderRivals(v);
  const miTurno = v.current === yo;
  $('#status-who').textContent = encabezado(v, miTurno);
  const esperando = v.waiting.filter(r => r !== yo);
  $('#status-sub').textContent = v.phase === 'open' && esperando.length
    ? fmt(T.waitDice, { name: esperando.map(nameOf).join(', ') })
    : v.phase === 'roll' ? T.waitRoll
    : `${fmt(T.round, { n: v.round + 1 })} · ${fmt(T.tableDice, { n: v.totalDice })}`;

  // Mis dados
  const mine = $('#mine');
  mine.innerHTML = '';
  const dados = diceOf(v, yo) || [];
  const tapados = cubiertos(v, yo, dados);
  // While the dice are still to roll, the hand's panel is the shaking cloth (D-447)
  mine.classList.toggle('agitando', tapados);
  if (tapados) mine.append(cacho(v, yo));
  else {
    agite.onJolt = null;
    soltarVaso();
    mine.append(el('div', { class: 'mine-label' }, T.yourDice));
    const giros = S.giros?.[`${v.round}:${yo}`];
    const fila = el('div', { class: 'dice-row' }, ...dados.map((d, i) => {
      const dado = dieEl(d);
      if (giros?.[i]) dado.style.rotate = `${giros[i]}deg`;   // as it landed on the cloth
      return dado;
    }));
    mine.append(fila);
    if (dados.includes(1)) mine.append(el('div', { class: 'wild-note' }, '⚀ ', T.aceWild));
    const llegada = S.llegada;
    if (llegada?.clave === `${v.round}:${yo}`) { S.llegada = null; llegar(mine, fila, llegada); }
  }
  relojDelTurno(v, yo, miTurno);

  // La apuesta que está en pie
  const board = $('#bid-board');
  board.innerHTML = '';
  if (v.bid) {
    board.append(el('div', { class: 'standing' },
      el('span', { class: 'lbl' }, v.bid.by === yo ? T.standingYou : fmt(T.standing, { name: nameOf(v.bid.by) })),
      bidEl(v.bid.n, v.bid.p),
      el('span', { class: 'word' }, pintaName(v.bid.n, v.bid.p)),
    ));
  } else {
    // The invitation to bid is for the one who opens; the rest of the room is told who does
    const abre = v.current || v.opener;
    board.append(el('div', { class: 'standing opens' }, abre === yo ? T.opens : fmt(T.opensOther, { name: nameOf(abre) })));
  }

  renderActions(v, yo, miTurno, tapados);
}

/**
 * Whose turn it is. While the dice are being rolled or revealed nobody has the turn
 * (`current` is null, and the header said "Le toca a null"): rolling, the one who opens the
 * round is next; revealing, the header says who called it.
 */
function encabezado(v, miTurno) {
  if (miTurno) return T.yourTurn;
  if (v.phase === 'open' && v.end && v.bid) {
    return fmt(v.end.type === 'dudo' ? T.saidDudo : T.saidCalza, { name: nameOf(v.end.by), n: v.bid.n, pinta: pintaName(v.bid.n, v.bid.p) });
  }
  return `${T.turnOf} ${nameOf(v.current || v.opener)}`;
}

function renderActions(v, yo, miTurno, tapados = false) {
  const box = $('#actions');
  box.innerHTML = '';
  // With the dice still to roll there is nothing to bid on yet
  if (miTurno && tapados) { box.append(el('p', { class: 'muted center' }, T.shakeFirst)); return; }
  if (!miTurno) {
    // Revealing, the line under the board would repeat the header: it stays empty
    if (v.phase !== 'open') box.append(el('p', { class: 'muted center' }, `${T.turnOf} ${nameOf(v.current || v.opener)}…`));
    return;
  }

  // Elegir la pinta: nada viene marcado, y el botón dice qué va a hacer (C-8)
  const sel = S.sel;
  box.append(el('p', { class: 'pick-label' }, sel ? T.pickAmount : T.pickPinta));
  box.append(el('div', { class: 'pintas' }, ...PINTAS.map(p => {
    const posible = minBid(v.bid, p) <= v.totalDice;
    return el('button', {
      class: 'pinta' + (sel?.p === p ? ' on' : ''), disabled: !posible,
      'aria-label': pintaName(2, p),
      onClick: () => { S.sel = { p, n: minBid(v.bid, p) }; SFX.tap(); vibrate(10); renderPlay(view()); },
    }, dieEl(p, { small: true }));
  })));

  if (sel) {
    const min = minBid(v.bid, sel.p);
    const max = v.totalDice;
    const paso = delta => {
      S.sel = { ...sel, n: Math.min(max, Math.max(min, sel.n + delta)) };
      SFX.tap(); renderPlay(view());
    };
    box.append(el('div', { class: 'amount' },
      el('button', { class: 'step', disabled: sel.n <= min, 'aria-label': '−', onClick: () => paso(-1) }, '−'),
      el('span', { class: 'amount-n' }, sel.n),
      el('button', { class: 'step', disabled: sel.n >= max, 'aria-label': '+', onClick: () => paso(1) }, '+'),
    ));
  }

  const acciones = el('div', { class: 'stack' });
  acciones.append(el('button', {
    class: 'btn btn--yellow', disabled: !sel,
    onClick: () => {
      if (!S.sel || !bidOk(v.bid, S.sel, v.totalDice)) return;
      const { n, p } = S.sel;
      S.sel = null;
      SFX.dice(); vibrate(20);
      S.transport.send({ t: 'bid', from: v.current, n, p });
    },
  }, sel ? fmt(T.bidDo, { n: sel.n, pinta: pintaName(sel.n, sel.p) }) : T.bidNothing));

  if (v.bid) {
    const fila = el('div', { class: 'btn-row' });
    fila.append(el('button', {
      class: 'btn btn--sm', title: fmt(T.dudoHint, { n: v.bid.n, pinta: pintaName(v.bid.n, v.bid.p) }),
      onClick: () => { S.sel = null; SFX.reveal(); vibrate([30, 40, 30]); S.transport.send({ t: 'dudo', from: v.current }); },
    }, T.dudoDo));
    if (v.canCalzar) {
      fila.append(el('button', {
        class: 'btn btn--cyan btn--sm', title: fmt(T.calzaHint, { n: v.bid.n }),
        onClick: () => { S.sel = null; SFX.reveal(); vibrate([30, 40, 30]); S.transport.send({ t: 'calza', from: v.current }); },
      }, T.calzaDo));
    }
    acciones.append(fila);
  }
  box.append(acciones);
}

/* ---------- Shake to roll (D-447) ---------- */
/**
 * With `shake` on, each round's dice show face down and roll only when the player shakes the
 * phone, like the cup at a real table. The dice are already rolled (and, in a room, committed with
 * their hash, C-10): what the shake does is show them, so the round never waits on a sensor. A phone with no motion sensor (a computer) gets a button instead, and so does one
 * whose owner said no to the motion permission (iPhone).
 */
/** A jolt is this much acceleration beyond gravity, in m/s²: walking with the phone stays under it. */
const SACUDON = 13;
/** At least this many jolts before the dice may settle: one bump on the table does not roll them. */
const SACUDONES = 3;
/**
 * The dice keep rolling while the phone shakes, and settle only once it has been still this long
 * (the owner's request): a shake sends a jolt every 150–300 ms, so this is the hand stopping.
 */
const QUIETO_MS = 350;
/** With no reading from the sensor this long after listening, the phone has none: the button shows. */
const SIN_SENSOR_MS = 1200;
const PIDE_PERMISO = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function';
/**
 * `sensor`: null while it is not known, true with a reading, false with none in time. `permiso`:
 * null until asked. The page listens first and asks only when nothing arrives: Android answers
 * with no question, and an iPhone stays silent until the tap that grants it.
 */
const agite = {
  listening: false, waiting: false, sensor: typeof DeviceMotionEvent === 'undefined' ? false : null,
  permiso: null, lastJolt: 0, onJolt: null,
};

function onMotion(e) {
  const a = e.acceleration, g = e.accelerationIncludingGravity;
  let fuerza;
  if (a && a.x != null) fuerza = Math.hypot(a.x, a.y || 0, a.z || 0);
  else if (g && g.x != null) fuerza = Math.abs(Math.hypot(g.x, g.y || 0, g.z || 0) - 9.81);
  else return;   // an event with no reading: a computer that says it has a sensor
  // The first reading: if the cup was offering the button, it now listens instead
  if (agite.sensor !== true) { agite.sensor = true; if ($('#mine .agite-caja')) render(); }
  if (!agite.onJolt) return;
  const ahora = performance.now();
  if (fuerza < SACUDON || ahora - agite.lastJolt < 110) return;
  agite.lastJolt = ahora;
  agite.onJolt();
}

function escucharAgite() {
  if (typeof DeviceMotionEvent === 'undefined') return;
  if (!agite.listening) { agite.listening = true; window.addEventListener('devicemotion', onMotion); }
  if (agite.sensor !== null || agite.waiting) return;
  agite.waiting = true;
  setTimeout(() => {
    agite.waiting = false;
    if (agite.sensor === null) { agite.sensor = false; if ($('#mine .agite-caja')) render(); }
  }, SIN_SENSOR_MS);
}

/** Are this role's dice still to roll? */
function cubiertos(v, role, dados) {
  return !!M.config.shake && !!dados.length && !S.shaken.has(`${v.round}:${role}`) && v.phase !== 'open';
}

/**
 * The dice still to roll, with what rolls them: shaking, or the button where there is no sensor.
 * They are rolled on a green cloth that takes the hand's place, with bigger dice than the hand's
 * (the owner's request): face down until the first jolt, then real cubes with pips that roll as the home
 * page's 🎲 does (dado3d.js, D-188, D-374), spun by each jolt, harder the harder the shake, and
 * slowing down between jolts (never to a stop), while the phone rattles with them. They keep
 * rolling as long as the phone shakes, and only once the hand stops (and it shook enough) each
 * settles on the face it really has, and the cloth turns into the hand's panel with the dice lined up as always. The
 * faces seen while rolling mean nothing: the dice were rolled before (C-10). With no WebGL, or with
 * reduced motion, flat dice swap faces instead.
 */
const CAEN_MS = 900;      // flat dice: how long they keep swapping faces after the last jolt
/** How fast a spin drains away, in ms: the same friction while shaking and while coming to rest. */
const FRICCION_MS = 450;
const VUELO_MS = 480;     // the cloth turning into the hand
const CARA_MS = 70;       // flat dice: a new face this often
const PISO_GIRO = 0.07;   // degrees per ms: the slowest a die not yet settled turns (no rattle under 0.15)
/** The faces in dado3d.js's order (front, right, back, left, top, bottom): opposite ones add up to 7. */
const CARAS_3D = [1, 3, 6, 4, 2, 5];
/**
 * Every square pose (both angles a multiple of 90°) that shows each face in front, as
 * [ax, ay, giro] for `dibujar` (rotX(ax) after rotY(ay), as in dado3d.js). A die comes to rest on
 * the one of its face nearest to where its own spin was taking it. `giro` is how far that face is
 * turned on the table, in degrees clockwise: the flat die in the hand keeps it, so landing never
 * flips a 2, a 3 or a 6.
 */
const POSES = (() => {
  // Each face's normal and the way up on its drawing, in dado3d.js's order
  const caras = [[[0, 0, 1], [0, 1, 0]], [[1, 0, 0], [0, 1, 0]], [[0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 1, 0]], [[0, 1, 0], [0, 0, -1]], [[0, -1, 0], [0, 0, 1]]];
  const out = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const ax of [0, 90, 180, 270]) for (const ay of [0, 90, 180, 270]) {
    const cx = Math.round(Math.cos(ax * Math.PI / 180)), sx = Math.round(Math.sin(ax * Math.PI / 180));
    const cy = Math.round(Math.cos(ay * Math.PI / 180)), sy = Math.round(Math.sin(ay * Math.PI / 180));
    const girar = ([x, y, z]) => {
      const [x1, y1, z1] = [x * cy + z * sy, y, -x * sy + z * cy];
      return [x1, y1 * cx - z1 * sx, y1 * sx + z1 * cx];
    };
    // Which face ends up looking at the camera (+z), and where its "up" points on screen
    const i = caras.findIndex(([n]) => girar(n)[2] === 1);
    const [ux, uy] = girar(caras[i][1]);
    out[CARAS_3D[i]].push([ax, ay, (Math.round(Math.atan2(ux, uy) * 180 / Math.PI) + 360) % 360]);
  }
  return out;
})();
const SIN_3D = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The cloth of the round being rolled, with its dice. It lives across renders: a message that
 * redraws the table must not reset a roll, so each render puts the same one back in #mine.
 */
let vaso = null;

function soltarVaso() {
  if (!vaso) return;
  clearTimeout(vaso.quieto);
  if (vaso.tres) { cancelAnimationFrame(vaso.tres.raf); vaso.tres.dados.forEach(d => d.dado.soltar()); }
  vaso.caja.remove();
  vaso = null;
}

function vasoDe(clave, cuantos) {
  if (vaso?.clave === clave) return vaso;
  soltarVaso();
  const mesa = el('div', { class: 'agite-mesa', 'aria-hidden': 'true' },
    ...Array.from({ length: cuantos }, () => el('span', { class: 'die die--lg blank' })));
  const pie = el('div', { class: 'agite-pie' });
  vaso = { clave, caja: el('div', { class: 'agite-caja' }, mesa, pie), mesa, pie, tres: null, sin3d: SIN_3D };
  return vaso;
}

/** The 3D dice in the box, spinning: the first jolt (or the button) puts them in. Null without WebGL. */
function tresDe(vs) {
  if (vs.tres || vs.sin3d) return vs.tres;
  const blancos = [...vs.mesa.children];
  const dados = blancos.map(() => {
    const lienzo = el('canvas', { class: 'dado3d-lienzo' });
    return { caja: el('span', { class: 'dado3d' }, lienzo), lienzo, ax: Math.random() * 360, ay: Math.random() * 360, wx: 0, wy: 0, fase: Math.random() * 6 };
  });
  // The canvases need their size before the cube is set up: the box is on the page by now
  vs.mesa.replaceChildren(...dados.map(d => d.caja));
  for (const d of dados) {
    d.dado = crearDado(d.lienzo, CARAS_3D);
    if (!d.dado) {
      dados.forEach(x => x.dado?.soltar());
      vs.mesa.replaceChildren(...blancos);
      vs.sin3d = true;
      return null;
    }
  }
  const t = vs.tres = { dados, raf: 0, prev: performance.now(), zumbido: 0, cae: null };
  const paso = ahora => {
    if (vaso !== vs) return;
    const dt = Math.min(50, ahora - t.prev);
    t.prev = ahora;
    let fuerza = 0;
    for (const d of dados) {
      if (t.cae) {
        // Coming to rest: each angle goes on from the speed it had and slows down until it stops,
        // with no turn of its own: it is the same roll running out (ease-out, velocity matched)
        let w = 0;
        for (const e of [0, 1]) {
          const k = Math.min(1, (ahora - t.cae.t0) / d.dur[e]);
          const recorrido = d.hasta[e] - d.desde[e];
          (e ? (d.ay = d.desde[1] + recorrido * (1 - (1 - k) ** 3)) : (d.ax = d.desde[0] + recorrido * (1 - (1 - k) ** 3)));
          w = Math.max(w, Math.abs(3 * (1 - k) ** 2 * recorrido / d.dur[e]));
        }
        fuerza = Math.max(fuerza, w);
        d.caja.style.transform = `translate(${(Math.sin(ahora / 37 + d.fase) * w * 7).toFixed(1)}px, ${(-Math.abs(Math.cos(ahora / 53 + d.fase)) * w * 10).toFixed(1)}px)`;
      } else {
        // Spinning: each jolt adds speed, and it drains away between jolts, but never to a stop:
        // a die standing still would look settled, and they settle only when the hand stops
        const freno = Math.exp(-dt / FRICCION_MS);
        d.wx *= freno; d.wy *= freno;
        const giro = Math.hypot(d.wx, d.wy);
        if (giro < PISO_GIRO) {
          if (giro > 0) { d.wx *= PISO_GIRO / giro; d.wy *= PISO_GIRO / giro; } else { d.wx = d.wy = PISO_GIRO / Math.SQRT2; }
        }
        d.ax += d.wx * dt; d.ay += d.wy * dt;
        const w = Math.hypot(d.wx, d.wy);
        fuerza = Math.max(fuerza, w);
        d.caja.style.transform = `translate(${(Math.sin(ahora / 37 + d.fase) * w * 7).toFixed(1)}px, ${(-Math.abs(Math.cos(ahora / 53 + d.fase)) * w * 10).toFixed(1)}px)`;
      }
      d.dado.dibujar(d.ax, d.ay);
    }
    // The phone rattles while the dice roll, harder the faster they spin
    if (fuerza > 0.15 && ahora - t.zumbido > 90) { t.zumbido = ahora; vibrate(Math.round(Math.min(30, 8 + fuerza * 14))); }
    if (t.cae && ahora - t.cae.t0 >= t.cae.dur) return t.cae.listo();
    t.raf = requestAnimationFrame(paso);
  };
  t.raf = requestAnimationFrame(paso);
  return t;
}

/** A jolt: every die spins faster, each its own way. */
function empujar(t) {
  for (const d of t.dados) {
    d.wx += (0.35 + Math.random() * 0.5) * (Math.random() < 0.5 ? -1 : 1);
    d.wy += (0.35 + Math.random() * 0.5) * (Math.random() < 0.5 ? -1 : 1);
  }
}

/**
 * The hand stopped: each die runs out its own spin and stops where it lies. Where its spin was
 * taking it (with the same friction) decides the pose: of the poses that show its face, the
 * nearest one ahead, so it never turns back or speeds up; it just brakes a little more or a
 * little less. The faces were rolled before, fair and with the browser's chance (C-10): which pose
 * it lands in is only how it looks.
 */
function aterrizar(t, dados, listo) {
  const MIN_MS = 300, MAX_MS = 1500;
  const ahead = (pose, desde, natural, w) => {
    const dir = w < 0 ? -1 : 1;
    let c = pose + 360 * Math.round((natural - pose) / 360);
    if ((c - desde) * dir < 0) c += 360 * dir;
    return c;
  };
  let dur = 0;
  t.dados.forEach((d, i) => {
    const natural = [d.ax + d.wx * FRICCION_MS, d.ay + d.wy * FRICCION_MS];
    let mejor = null;
    for (const [px, py, giro] of POSES[dados[i]]) {
      const hasta = [ahead(px, d.ax, natural[0], d.wx), ahead(py, d.ay, natural[1], d.wy)];
      const lejos = Math.abs(hasta[0] - natural[0]) + Math.abs(hasta[1] - natural[1]);
      if (!mejor || lejos < mejor.lejos) mejor = { hasta, lejos, giro };
    }
    d.desde = [d.ax, d.ay];
    d.hasta = mejor.hasta;
    d.giro = mejor.giro;
    // An ease-out starts at three times its average speed: the time that keeps the die's speed
    d.dur = [0, 1].map(e => {
      const w = Math.abs(e ? d.wy : d.wx), recorrido = Math.abs(d.hasta[e] - d.desde[e]);
      return Math.min(MAX_MS, Math.max(MIN_MS, w > 0.01 ? 3 * recorrido / w : MAX_MS));
    });
    dur = Math.max(dur, ...d.dur);
  });
  t.cae = { t0: performance.now(), listo, dur };
}

/**
 * Landed: the cloth turns into the hand's panel. The panel starts as tall and green as the cloth
 * was, with each die where it landed and as big, and then shrinks to its usual size and colour
 * while the dice slide into their row, the way they always sit.
 */
function llegar(mine, fila, { desde, alto }) {
  const final = mine.getBoundingClientRect().height;
  mine.classList.add('llega');
  mine.style.height = `${alto}px`;
  const dados = [...fila.children];
  dados.forEach((d, i) => {
    const a = desde[i];
    if (!a) return;
    const b = d.getBoundingClientRect();
    d.style.transform = `translate(${(a.left + a.width / 2 - b.left - b.width / 2).toFixed(1)}px, ${(a.top + a.height / 2 - b.top - b.height / 2).toFixed(1)}px) scale(${(a.width / b.width).toFixed(3)})`;
  });
  void mine.offsetWidth;
  mine.classList.add('llega-anda');
  mine.classList.remove('llega');
  mine.style.height = `${final}px`;
  dados.forEach(d => { d.style.transform = ''; });
  setTimeout(() => { mine.classList.remove('llega-anda'); mine.style.height = ''; }, VUELO_MS);
}

/** Flat dice, where there is no 3D: a new face on each every few frames, for `ms` more. */
let rueda = { hasta: 0, timer: null };
function rodar(ms) {
  rueda.hasta = Math.max(rueda.hasta, performance.now() + ms);
  if (rueda.timer) return;
  const paso = () => {
    const mesa = vaso?.mesa;
    const sigue = performance.now() < rueda.hasta;
    if (mesa) {
      mesa.classList.toggle('rodando', sigue);
      if (sigue) {
        mesa.querySelectorAll('.die').forEach(d => {
          const nuevo = dieEl(1 + Math.floor(Math.random() * 6));
          nuevo.classList.add('die--lg');
          nuevo.style.cssText = `--x:${(Math.random() * 16 - 8).toFixed(0)}px;--y:${(Math.random() * -14).toFixed(0)}px;--r:${(Math.random() * 360 - 180).toFixed(0)}deg`;
          d.replaceWith(nuevo);
        });
        vibrate(12);
      }
    }
    rueda.timer = sigue ? setTimeout(paso, CARA_MS) : null;
  };
  paso();
}

/** What #mine shows while the dice are still to roll: the cloth, with the big dice and what rolls them. */
function cacho(v, role) {
  const clave = `${v.round}:${role}`;
  const dados = diceOf(v, role) || [];
  const vs = vasoDe(clave, dados.length);

  // `boton`: thrown with the button, with no shake before it to set them spinning
  const tirar = (boton = false) => {
    if (S.shaken.has(clave) || S.rolling === clave) return;
    S.rolling = clave;
    agite.onJolt = null;
    clearTimeout(vs.quieto);
    vs.pie.replaceChildren();   // rolling, there is nothing left to tap
    SFX.dice();
    // Landed: where each die and the cloth are now, so the hand's panel can grow out of them
    const fin = () => {
      const piezas = vs.tres ? vs.tres.dados.map(d => d.caja) : [...vs.mesa.children];
      S.llegada = { clave, desde: piezas.map(p => p.getBoundingClientRect()), alto: $('#mine').getBoundingClientRect().height };
      // How each one lies on the table: the hand keeps it for the whole round
      if (vs.tres) S.giros = { ...S.giros, [clave]: vs.tres.dados.map(d => d.giro || 0) };
      soltarVaso();
      S.rolling = null;
      S.shaken.add(clave);
      render();
    };
    const cayo = () => { vibrate(25); setTimeout(fin, 450); };
    const t = tresDe(vs);
    if (t) {
      // The button has no jolt before it: it throws them itself. Shaken, they go on as they were
      if (boton) { empujar(t); empujar(t); }
      aterrizar(t, dados, cayo);
    } else {
      rodar(CAEN_MS);
      setTimeout(cayo, CAEN_MS + 80);
    }
  };
  if (S.rolling === clave) return vs.caja;   // already rolling: they land on their own

  if (agite.sensor === false && PIDE_PERMISO && agite.permiso === null) {
    // Silent, and the phone can ask (an iPhone): only a tap may ask, and then it listens again
    vs.pie.replaceChildren(el('p', { class: 'cacho-txt' }, T.shakeNow), el('button', {
      class: 'btn btn--cyan btn--sm', id: 'btn-permiso', onClick: async () => {
        try { agite.permiso = await DeviceMotionEvent.requestPermission(); } catch (_) { agite.permiso = 'denied'; }
        if (agite.permiso === 'granted') { agite.sensor = null; escucharAgite(); }
        render();
      },
    }, T.shakeAllow));
  } else if (agite.sensor === false) {
    vs.pie.replaceChildren(el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-tirar', onClick: () => tirar(true) }, T.shakeTap));
  } else {
    vs.pie.replaceChildren(el('p', { class: 'cacho-txt' }, T.shakeNow));
    escucharAgite();
    // Every jolt keeps them rolling; once there were enough, the hand going still settles them
    agite.onJolt = () => {
      SFX.dice(); vibrate(20);
      const t = tresDe(vs);
      if (t) empujar(t); else rodar(QUIETO_MS + 100);
      vs.golpes = (vs.golpes || 0) + 1;
      clearTimeout(vs.quieto);
      if (vs.golpes >= SACUDONES) vs.quieto = setTimeout(tirar, QUIETO_MS);
    };
  }
  return vs.caja;
}

/* ---------- The turn's clock (D-447) ---------- */
/**
 * With `turnSecs` on, whoever has the turn has that long to bid, doubt or call it exactly; out of
 * time, their own phone sends `timeout` and they lose a die. The clock runs only while the table
 * is on screen (U-20): it waits under a reveal, a pass screen or a hidden page. The cup counts:
 * shaking is part of the turn.
 */
function relojDelTurno(v, yo, miTurno) {
  const box = $('#turn-clock');
  const corre = M.config.turnSecs > 0 && miTurno && v.phase === 'bid';
  if (!corre) { S.turn = null; box.hidden = true; return; }
  const clave = `${v.round}:${v.bids.length}:${yo}`;
  if (S.turn?.key !== clave) {
    S.turn = { key: clave, role: yo, round: v.round, total: M.config.turnSecs * 1000, used: 0, prev: performance.now(), sent: false, beep: null };
  }
  box.hidden = false;
  pintarReloj();
  if (!tick) tick = setInterval(tictac, 200);
}

function pintarReloj() {
  const t = S.turn, box = $('#turn-clock');
  if (!t) return;
  const queda = Math.max(0, t.total - t.used);
  const seg = Math.ceil(queda / 1000);
  box.classList.toggle('apurado', seg <= 5);
  box.replaceChildren(
    el('i', { style: `width:${(100 * queda / t.total).toFixed(1)}%` }),
    el('span', {}, fmt(T.secs, { n: seg })),
  );
}

let tick = null;
function tictac() {
  const t = S?.turn;
  const ahora = performance.now();
  if (!t || t.sent) return;
  const dt = ahora - t.prev;
  t.prev = ahora;
  if (document.hidden || !$('#handoff').hidden) return;   // paused (U-20)
  t.used += dt;
  const seg = Math.ceil((t.total - t.used) / 1000);
  if (seg <= 5 && seg > 0 && t.beep !== seg) { t.beep = seg; SFX.tick(); vibrate(10); }
  pintarReloj();
  if (t.used < t.total) return;
  t.sent = true;
  const v = view();
  if (v.phase !== 'bid' || v.current !== t.role || v.round !== t.round) return;
  S.sel = null;
  agite.onJolt = null;
  SFX.timeUp(); vibrate([60, 60, 120]);
  S.transport.send({ t: 'timeout', from: t.role, r: t.round });
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
function showPass(role) {
  showHandoff([passBlock({ label: T.hoPass, name: nameOf(role), button: T.hoReady })],
    () => { S.uiRole = role; SFX.pass(); render(); }, { tapAdvances: false });
}

/* ---------- Se destapa la mesa ---------- */
function showReveal(v) {
  const last = v.last;
  S.shownRound = last.n + 1;
  if (last.type === 'timeout') return showTimeUp(last);
  const pinta = pintaName(last.bid.n, last.bid.p);

  const mesa = el('div', { class: 'reveal-table' });
  for (const r of M.players) {
    const dados = last.dice[r];
    if (!dados) continue;
    mesa.append(el('div', { class: 'reveal-row' },
      el('span', { class: 'n' }, nameOf(r)),
      el('span', { class: 'dice-row' }, ...dados.map(d => dieEl(d, {
        small: true, on: countPinta([d], last.bid.p) > 0, off: countPinta([d], last.bid.p) === 0,
      }))),
    ));
  }

  const quien = last.type === 'dudo'
    ? fmt(T.saidDudo, { name: nameOf(last.by), n: last.bid.n, pinta })
    : fmt(T.saidCalza, { name: nameOf(last.by), n: last.bid.n, pinta });
  const desenlace = last.gainer ? fmt(T.gainsDie, { name: nameOf(last.gainer) })
    : last.fuera ? fmt(T.isOut, { name: nameOf(last.fuera) })
    : fmt(T.losesDie, { name: nameOf(last.loser) });

  const stage = el('div', { class: 'stage pop reveal' },
    el('div', { class: 'hint' }, quien),
    mesa,
    // El plural va con lo que había, no con lo que se apostó: dudar de "2 ases" y que hubiera
    // uno decía "había 1 ases"
    el('div', { class: 'count' }, fmt(last.count === 1 ? T.revealCountOne : T.revealCount,
      { n: last.count, pinta: pintaName(last.count, last.bid.p) })),
    last.type === 'calza' ? el('div', { class: 'exact ' + (last.exact ? 'yes' : 'no') }, last.exact ? T.exactYes : T.exactNo) : null,
    el('div', { class: 'outcome' }, desenlace),
    selloVerificado(last),
    el('div', { class: 'hint', style: 'margin-top:10px' }, T.goOn),
  );

  last.loser ? SFX.letterMiss() : SFX.letterHit();
  vibrate(last.fuera ? [60, 60, 120] : 30);
  showHandoff([stage], () => {
    // Quien perdió el dado abre la ronda siguiente y todavía no tiene el celular en la mano
    if (S.mode === 'local') S.uiRole = null;
    onChange();
  });
}

/** Someone ran out of time: no reveal, the dice stay covered, and they lose a die. */
function showTimeUp(last) {
  const stage = el('div', { class: 'stage pop reveal' },
    el('div', { class: 'count' }, '⏱️'),
    el('div', { class: 'hint' }, fmt(T.timeUp, { name: nameOf(last.by) })),
    el('div', { class: 'outcome' }, last.fuera ? fmt(T.isOut, { name: nameOf(last.fuera) }) : fmt(T.losesDie, { name: nameOf(last.loser) })),
    el('div', { class: 'hint', style: 'margin-top:10px' }, T.goOn),
  );
  SFX.letterMiss();
  vibrate(last.fuera ? [60, 60, 120] : 30);
  showHandoff([stage], () => {
    if (S.mode === 'local') S.uiRole = null;
    onChange();
  });
}

/**
 * En la sala, después de contar se dice si los dados que se destaparon son los que cada uno
 * había comprometido (C-10). En un celular no hay nada que verificar y no se muestra.
 */
function selloVerificado(last) {
  if (S.mode !== 'online' || M.verify?.n !== last.n) return null;
  const fallan = M.verify.fallan;
  return el('div', { class: 'sello' + (fallan.length ? ' mal' : '') },
    fallan.length ? fmt(T.notVerified, { name: fallan.map(nameOf).join(', ') }) : T.verified);
}

/* ---------- Final ---------- */
function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  showScreen('screen-result');
  // Quién ganó, para la lista de salas del panel del dueño (D-79). Solo en sala, y una sola
  // vez: al volver a dibujar la misma pantalla no se repite. Mejor esfuerzo, como todo lo
  // que va al panel: si no sale, la partida no se entera.
  if (!already && S.mode === 'online') {
    S.transport?.noteWinner?.({ role: v.winner, name: nameOf(v.winner) });
  }
  // Los rankings (D-212): la partida del jugador de este celular y, si ganó, su victoria. Una vez.
  if (!already) finDePartida({ juego: GAME_ID, modo: S.mode, rol: S.mode === 'online' ? S.role : S.mode === 'cpu' ? 'A' : null, ganadores: [v.winner], nombres: M.names });
  // Sin red, cómo terminó, para el panel (D-210)
  if (!already && S.mode !== 'online') trackFinish({ ganador: nameOf(v.winner), detalle: `${v.history.length} rondas` });
  const gane = S.mode === 'cpu' && v.winner === 'A';
  $('#result-trophy').textContent = S.mode === 'cpu' && !gane ? '🎲' : '🏆';
  $('#result-title').textContent = S.mode === 'cpu'
    ? (gane ? T.winnerYou : T.loserYou)
    : fmt(T.winner, { name: nameOf(v.winner) });
  $('#result-sub').textContent = v.history.length === 1 ? T.endStatsOne : fmt(T.endStats, { rounds: v.history.length });

  const lista = $('#history-list');
  lista.innerHTML = '';
  v.history.forEach(h => {
    const texto = h.type === 'timeout' ? fmt(T.histTimeout, { who: nameOf(h.by) })
      : fmt(h.type === 'dudo' ? T.histDudo : T.histCalza, { who: nameOf(h.by), n: h.bid.n, pinta: pintaName(h.bid.n, h.bid.p), count: h.count });
    lista.append(el('li', {},
      el('span', { class: 'r' }, h.n + 1),
      el('span', { class: 'q' }, texto),
      el('span', { class: h.gainer ? 'up' : 'down' },
        h.gainer ? fmt(T.histGained, { name: nameOf(h.gainer) }) : fmt(T.histLost, { name: nameOf(h.loser) })),
    ));
  });

  const acciones = $('#result-actions');
  acciones.innerHTML = '';
  // One a Day: the card goes under the hero and carries the screen's actions and exits (C-19).
  // Perdiendo, cuentan las rondas que aguantó: todas menos la que lo dejó sin dados.
  if (S.hoy) {
    const gano = v.winner === 'A';
    const s = puntajeDudo({ gano, dados: v.st.A.dice, rondas: gano ? v.history.length : v.history.length - 1 });
    ponerTarjeta(terminarHoy(S.hoy, { s, ms: Date.now() - S.hoy.inicio, lang, alTocar: () => SFX.tap() }));
  } else acciones.append(
    el('button', {
      class: 'btn btn--yellow',
      onClick: e => {
        if (S.mode !== 'online') return startMatch(S.mode, M.names, M.config);
        // La revancha abre una sala nueva: mientras se arma, el botón queda esperando
        tryRematch(e.currentTarget, rematchOnline, { T, busy: COMMON[lang].opening });
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
  const url = withLang(`${location.origin}${location.pathname}?room=${S.code}`);
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

/**
 * "🎲 *Dudo* · Sala WFBN" y "👋 Javi te invita a jugar en juegosdesalon.cl." (D-165). Nombra a quien toca compartir,
 * que es quien invita; de qué se trata el juego lo cuenta la tarjeta que el chat arma con el
 * link (D-72, D-173).
 */
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

async function startOnline(transport, code, role, name, config, secrets = {}) {
  startSession({ mode: 'online', transport, roles: [role], config, names: { [role]: name }, code, role, secrets });
  history.replaceState(null, '', `${location.pathname}?room=${code}`);
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

async function joinOnline(code, name, previousRole = null, secrets = {}) {
  const { createFirebaseTransport } = await import('../assets/js/transport/firebase.js');
  const t = createFirebaseTransport({ game: GAME_ID, maxPlayers: MAX_PLAYERS });
  const { role, config } = await t.join(code, { name, previousRole });
  await startOnline(t, code, role, name, config || DEFAULT_CONFIG, secrets);
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
  const transport = createLocalTransport();
  startSession({ mode, transport, roles: players.slice(), config, names });
  // La revancha es una partida cualquiera: no lleva `hoy`
  S.hoy = hoy;
  document.getElementById('uad-tarjeta')?.remove();   // la de la partida anterior, si la hubo
  if (hoy && !hoy.anotado) hoy.inicio = Date.now();
  S.uiRole = mode === 'cpu' ? 'A' : null;
  S.shownRound = 0;
  S.shownWin = false;
  keepAwake();
  if (hoy) empezarHoy(hoy);   // the first attempt counts from here (D-433, lab)
  trackStart({ game: GAME_ID, mode: hoy ? MODO_UNO_AL_DIA : mode, players: mode === 'cpu' ? 1 : players.length, nombres: mode === 'cpu' ? [names?.A] : players.map(r => names?.[r]) }); // señal de uso (D-44, D-210)
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

/**
 * The two switches of D-447: shaking to roll, on by default (it is how the dice come out; a phone
 * with no sensor gets a button), and the turn's clock, off (it changes the rules: out of time
 * costs a die, so each table chooses it).
 */
function ajustesDelCacho() {
  let shake = true, reloj = false;
  return {
    switches: () => [
      interruptor(shake, T.shakeLabel, T.shakeHint, v => { shake = v; }),
      interruptor(reloj, fmt(T.timerLabel, { n: TURN_SECS }), T.timerHint, v => { reloj = v; }),
    ],
    config: () => ({ shake, turnSecs: reloj ? TURN_SECS : 0 }),
  };
}

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
    detalle = fmt(T.resumeText, { round: previa.round + 1, name: saved.names?.[previa.current || previa.opener] || '' });
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
  let draft = mode === 'cpu'
    ? [recordado || '']
    : [recordado || '', ''];
  let calzar = DEFAULT_CONFIG.calzar;
  let chileno = DEFAULT_CONFIG.chileno;
  const ajustes = ajustesDelCacho();

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
      form.append(el('div', { class: 'player-row cpu' },
        el('div', { class: 'num' }, '🤖'), el('span', { class: 'cpu-name' }, T.cpuName)));
    }
    // Calzar solo existe de tres para arriba (D-71), así que el interruptor aparece cuando la
    // mesa da para eso. Contra el celular son dos y no se ofrece nunca.
    if (draft.length >= MIN_CALZAR && mode !== 'cpu') {
      form.append(interruptor(calzar, T.calzarLabel, T.calzarHint, v => { calzar = v; }));
    }
    // Los nombres de la mesa chilena son de un solo idioma: en inglés y portugués no hay qué elegir
    if (lang === 'es') {
      form.append(interruptor(chileno, CHILENO.label, CHILENO.hint, v => { chileno = v; }));
    }
    form.append(...ajustes.switches());
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
      const players = (mode === 'cpu' ? ['A', 'B'] : ROLES.slice(0, nombres.length));
      const names = mode === 'cpu'
        ? { A: nombres[0], B: T.cpuName }
        : Object.fromEntries(players.map((r, i) => [r, nombres[i]]));
      startMatch(mode, names, { ...DEFAULT_CONFIG, calzar, chileno, ...ajustes.config(), players });
    },
  }, T.start));
  acciones.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => showScreen('screen-intro') }, T.menu));
  clearRoomError($('#setup-error'));
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
  const err = $('#setup-error'); clearRoomError(err);
  let nombre = nameStore.get() || '';
  let calzar = DEFAULT_CONFIG.calzar, chileno = DEFAULT_CONFIG.chileno;
  const ajustes = ajustesDelCacho();

  form.append(el('div', { class: 'player-row' },
    el('div', { class: 'num' }, '👤'),
    el('input', {
      type: 'text', value: nombre, maxlength: 14, placeholder: T.yourNameLabel, autocomplete: 'off',
      onInput: e => { nombre = e.target.value; },
    }),
  ));
  // Los ajustes los pone quien crea la sala: al que entra le llegan con la partida
  if (!invitado) {
    form.append(interruptor(calzar, T.calzarLabel, T.calzarHint, v => { calzar = v; }));
    if (lang === 'es') form.append(interruptor(chileno, CHILENO.label, CHILENO.hint, v => { chileno = v; }));
    form.append(...ajustes.switches());
  }

  const fallar = msg => {
    clearRoomError(err); err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake');
    SFX.error(); vibrate([30, 30, 30]);
  };
  const C = COMMON[lang];
  const roomOpts = { err, fail: fallar, T, local: () => { SFX.tap(); renderSetup('local'); }, localLabel: C.playOnePhone };
  const acciones = $('#setup-actions'); acciones.innerHTML = '';
  const codigo = el('input', {
    type: 'text', class: 'code', maxlength: 4, placeholder: T.codePlaceholder, value: codigoInvitado,
    autocapitalize: 'characters', autocomplete: 'off', readOnly: invitado,
  });
  const entrar = el('button', { class: 'btn btn--cyan', onClick: async () => {
    const n = nombre.trim(), c = codigo.value.trim().toUpperCase();
    if (!n) return fallar(T.errName);
    if (!/^[A-Z]{4}$/.test(c)) return fallar(T.errCode);
    nameStore.set(n); SFX.tap();
    await tryRoom(entrar, () => joinOnline(c, n), { busy: C.joining, ...roomOpts });
  } }, T.join);

  if (invitado) {
    acciones.append(el('div', { class: 'panel' },
      el('p', { class: 'lead', style: 'margin-bottom:8px' }, fmt(T.invited, { code: codigoInvitado })),
      el('div', { class: 'field' }, codigo), entrar));
  } else {
    const crear = el('button', { class: 'btn btn--yellow', onClick: async () => {
      const n = nombre.trim();
      if (!n) return fallar(T.errName);
      nameStore.set(n); SFX.tap();
      await tryRoom(crear, () => createOnline(n, { ...DEFAULT_CONFIG, calzar, chileno, ...ajustes.config(), players: null }), { busy: C.opening, ...roomOpts });
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
 * Uno al día (D-230): la intro con su línea y un solo botón, que abre directo el duelo contra el
 * celular (un rival) con los ajustes de siempre y el nombre que se recuerda. Lo común son los
 * dados; el celular apuesta como siempre.
 */
function introDeHoy() {
  $('#modes').replaceChildren(
    introHoy(HOY, { lang, extra: COMMON[lang].uad.mismosDados }),
    el('button', { class: 'btn btn--yellow', id: 'btn-uad-jugar', onClick: () => {
      SFX.tap();
      startMatch('cpu', { A: nameStore.get() || fmt(T.playerPlaceholder, { n: 1 }), B: T.cpuName }, { ...DEFAULT_CONFIG, players: ['A', 'B'] }, HOY);
    } }, COMMON[lang].uad.jugar));
}

function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(langToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  document.addEventListener('click', e => { if (e.target.closest('.btn, .mode, .pinta, .step, .lang-toggle button')) SFX.tap(); });
  sparkles(12);
  renderRules();
  if (HOY?.fuera) return;   // se va al juego de hoy
  if (HOY) return introDeHoy();
  renderModes();
  // Las victorias de este juego y entrar con nombre y PIN (D-212); en el laboratorio, solo donde se activaron
  $('#rk-slot')?.append(bloqueVictorias({ juego: GAME_ID, nombre: T.title, alTocar: () => SFX.tap() }));
  renderResumeSlot();
  const sala = param('room');
  if (!sala || !/^[A-Z]{4}$/i.test(sala)) return;
  const code = sala.toUpperCase();
  const guardada = store.load();
  // Recargar a mitad de partida vuelve a la misma sala sin volver a presentarse; llegar por un
  // enlace ajeno es otra cosa: ahí se pide el nombre y no se ofrece crear otra sala (RP-18, C-6).
  if (guardada && guardada.mode === 'online' && guardada.code === code && !guardada.done) {
    joinOnline(code, guardada.name, guardada.role, guardada.private || {})
      .catch(() => { store.clear(); renderSetupOnline(code); });
  } else renderSetupOnline(code);
}

init();

// Ventana al estado para las pruebas de punta a punta (tools/e2e/)
window.__dudo = { view: () => (M ? view() : null), match: () => M, session: () => S };
