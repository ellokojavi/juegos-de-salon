/**
 * Dudo — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7): cambia el transporte, no el juego.
 *  - local: de 2 a 6 en este celular, pasándoselo · cpu: duelo contra el aparato
 *  - online: sala de 2 a 6 celulares
 * Los dados de cada ronda viajan como mensaje `roll`. En un celular van en claro —no hay a quién
 * escondérselos—; en la sala va el hash y se destapan al dudar, y ahí se verifican (C-10, D-70).
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
import {
  PINTAS, MIN_PLAYERS, MAX_PLAYERS, MIN_CALZAR, buildState, botMove, minBid, bidOk,
  readDice, rollDice, writeDice, countPinta, sha256, randomSalt, verifyOpen,
} from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, CHILENO, LOCALES } from './rules.js';

const lang = getLang();
const L = LOCALES[lang];
const T = L.ui;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];
/** Cuánto se demora el celular en cantar su apuesta: menos se siente instantáneo y no se lee. */
const CPU_MS = 1100;
const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);

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

const JUGADAS = ['roll', 'bid', 'dudo', 'calza', 'open'];

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
      const dados = rollDice(v.st[r].dice);
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
    const jugada = botMove({ myDice: mine, bid: v.bid, totalDice: v.totalDice, canCalzar: v.canCalzar });
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
  $('#status-who').textContent = miTurno ? T.yourTurn : `${T.turnOf} ${nameOf(v.current)}`;
  const esperando = v.waiting.filter(r => r !== yo);
  $('#status-sub').textContent = v.phase === 'open' && esperando.length
    ? fmt(T.waitDice, { name: esperando.map(nameOf).join(', ') })
    : v.phase === 'roll' ? T.waitRoll
    : `${fmt(T.round, { n: v.round + 1 })} · ${fmt(T.tableDice, { n: v.totalDice })}`;

  // Mis dados
  const mine = $('#mine');
  mine.innerHTML = '';
  const dados = diceOf(v, yo) || [];
  mine.append(el('div', { class: 'mine-label' }, T.yourDice));
  mine.append(el('div', { class: 'dice-row' }, ...dados.map(d => dieEl(d))));
  if (dados.includes(1)) mine.append(el('div', { class: 'wild-note' }, '⚀ ', T.aceWild));

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
    board.append(el('div', { class: 'standing opens' }, T.opens));
  }

  renderActions(v, yo, miTurno);
}

function renderActions(v, yo, miTurno) {
  const box = $('#actions');
  box.innerHTML = '';
  if (!miTurno) {
    box.append(el('p', { class: 'muted center' }, `${T.turnOf} ${nameOf(v.current)}…`));
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
  showScreen('screen-result');
  const gane = S.mode === 'cpu' && v.winner === 'A';
  $('#result-trophy').textContent = S.mode === 'cpu' && !gane ? '🎲' : '🏆';
  $('#result-title').textContent = S.mode === 'cpu'
    ? (gane ? T.winnerYou : T.loserYou)
    : fmt(T.winner, { name: nameOf(v.winner) });
  $('#result-sub').textContent = v.history.length === 1 ? T.endStatsOne : fmt(T.endStats, { rounds: v.history.length });

  const lista = $('#history-list');
  lista.innerHTML = '';
  v.history.forEach(h => {
    const pinta = pintaName(h.bid.n, h.bid.p);
    const texto = fmt(h.type === 'dudo' ? T.histDudo : T.histCalza,
      { who: nameOf(h.by), n: h.bid.n, pinta, count: h.count });
    lista.append(el('li', {},
      el('span', { class: 'r' }, h.n + 1),
      el('span', { class: 'q' }, texto),
      el('span', { class: h.gainer ? 'up' : 'down' },
        h.gainer ? fmt(T.histGained, { name: nameOf(h.gainer) }) : fmt(T.histLost, { name: nameOf(h.loser) })),
    ));
  });

  const acciones = $('#result-actions');
  acciones.innerHTML = '';
  acciones.append(
    el('button', {
      class: 'btn btn--yellow',
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

/**
 * "Javi te invita a jugar Dudo en juegosdesalon.cl - Sala: WFBN". Nombra a quien toca compartir,
 * que es quien invita; de qué se trata el juego lo cuenta la tarjeta que el chat arma con el
 * link (D-72, D-73).
 */
function textoInvitacion() {
  return fmt(COMMON[lang].invite, { name: M.names[S.role] || '', game: T.title, code: S.code });
}

function shareButton(url) {
  const btn = el('button', { class: 'btn btn--cyan btn--sm', style: 'width:100%;max-width:320px' }, canShare() ? T.shareLink : T.copyLink);
  btn.addEventListener('click', async () => {
    SFX.tap();
    const r = await shareLink({ title: T.title, text: textoInvitacion(), url });
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

async function startOnline(transport, code, role, name, config, secrets = {}) {
  startSession({ mode: 'online', transport, roles: [role], config, names: { [role]: name }, code, role, secrets });
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
function startMatch(mode, names, config) {
  store.clear();
  const players = config.players;
  const transport = createLocalTransport();
  startSession({ mode, transport, roles: players.slice(), config, names });
  S.uiRole = mode === 'cpu' ? 'A' : null;
  S.shownRound = 0;
  S.shownWin = false;
  keepAwake();
  trackStart({ game: GAME_ID, mode, players: mode === 'cpu' ? 1 : players.length }); // señal de uso (D-44)
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
      startMatch(mode, names, { ...DEFAULT_CONFIG, calzar, chileno, players });
    },
  }, T.start));
  acciones.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => showScreen('screen-intro') }, T.menu));
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
  let calzar = DEFAULT_CONFIG.calzar, chileno = DEFAULT_CONFIG.chileno;

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
  }

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
      try { await createOnline(n, { ...DEFAULT_CONFIG, calzar, chileno, players: null }); }
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
  document.addEventListener('click', e => { if (e.target.closest('.btn, .mode, .pinta, .step, .lang-toggle button')) SFX.tap(); });
  sparkles(12);
  renderRules();
  renderModes();
  renderResumeSlot();
  const sala = new URLSearchParams(location.search).get('sala');
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
