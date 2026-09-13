/**
 * Dudo — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7): cambia el transporte, no el juego.
 *  - local: de 2 a 6 jugadores en este celular, pasándoselo · cpu: duelo contra el aparato.
 * Los dados de cada ronda viajan como mensaje `roll`; en la sala irán comprometidos con hash y se
 * destapan al dudar (C-10), que es el mismo camino que ya recorre el motor.
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { showHandoff, passBlock } from '../assets/js/handoff.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { trackStart } from '../assets/js/transport/stats.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import {
  PINTAS, MIN_PLAYERS, MAX_PLAYERS, buildState, botMove, minBid, bidOk,
  readDice, rollDice, writeDice, countPinta,
} from './engine.js';
import { GAME_ID, DEFAULT_CONFIG, LOCALES } from './rules.js';

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

/* ------------------------------------------------------------------ */
/* Nombres de las apuestas                                             */
/* ------------------------------------------------------------------ */
const pintaName = (n, p) => (n === 1 ? L.pintaOne[p] : L.pintaMany[p]);
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
  return { config, players: config.players, names: {}, plays: [], seen: new Set() };
}

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return;
  if (msg.id) M.seen.add(msg.id);
  if (msg.t === 'hello') { M.names[msg.from] = msg.name; return; }
  if (['roll', 'bid', 'dudo', 'calza', 'open'].includes(msg.t)) M.plays.push(msg);
}

const view = () => buildState({ players: M.players, config: M.config, plays: M.plays });
/** Los dados que este aparato puede mostrar de un rol: los suyos, o todos al destapar. */
const diceOf = (v, role) => readDice(v.rolls[role]?.d) || null;

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names }) {
  if (S?.transport) S.transport.dispose();
  S = { mode, transport, roles, uiRole: null, sel: null, shownRound: 0, botAt: -1, rolled: new Set() };
  M = newMatch(config);
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { apply(m); onChange(); });
}

let chain = Promise.resolve();
function onChange() { chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e)); }

/** Lo que hace solo este celular: tirar los dados de sus roles y jugar el turno del aparato. */
async function act() {
  saveSession();
  if (!M?.players) return;
  const v = view();
  if (v.done) return;

  // 1. Los dados de la ronda. Cada rol de este celular tira los suyos.
  if (v.phase === 'roll') {
    // Cada `send` avisa por microtarea y vuelve a entrar acá antes de que se aplique el resto,
    // así que sin la marca el mismo rol tiraba sus dados varias veces (el motor los descarta,
    // pero quedaban mensajes de más en la partida guardada).
    v.waiting.filter(r => S.roles.includes(r) && !S.rolled.has(`${v.round}:${r}`)).forEach(r => {
      S.rolled.add(`${v.round}:${r}`);
      S.transport.send({ t: 'roll', from: r, d: writeDice(rollDice(v.st[r].dice)) });
    });
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

/* ---------- Persistencia (canon C-6) ---------- */
function saveSession() {
  if (!S || !M?.players) return;
  store.save({ mode: S.mode, config: M.config, names: M.names, messages: S.transport.messages || [], done: view().done });
}

function resume(saved) {
  const transport = createLocalTransport({ seed: saved.messages || [] });
  startSession({ mode: saved.mode, transport, roles: saved.mode === 'cpu' ? ['A', 'B'] : saved.config.players, config: saved.config, names: {} });
  M.names = saved.names || {};
  // Al retomar en un celular nadie sabe quién lo tenía: se vuelve a la pantalla de pase (C-6)
  S.uiRole = saved.mode === 'cpu' ? 'A' : null;
  S.shownRound = Infinity;      // lo que ya pasó no se vuelve a destapar
  keepAwake();
  onChange();
  setTimeout(() => { if (S) { S.shownRound = (view().last?.n ?? -1) + 1; } }, 0);
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }
function closeOverlay() { const b = $('#handoff'); b.hidden = true; b.innerHTML = ''; b.className = 'handoff'; }

function render() {
  if (!M?.players) return;
  const v = view();
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
  const yo = S.mode === 'cpu' ? 'A' : S.uiRole;
  renderRivals(v);
  const miTurno = v.current === yo;
  $('#status-who').textContent = miTurno ? T.yourTurn : `${T.turnOf} ${nameOf(v.current)}`;
  $('#status-sub').textContent = `${fmt(T.round, { n: v.round + 1 })} · ${fmt(T.tableDice, { n: v.totalDice })}`;

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
    el('button', { class: 'btn btn--yellow', onClick: () => startMatch(S.mode, M.names, M.config) }, T.endAgain),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderModes(); showScreen('screen-intro'); } }, T.changePlayers),
      el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.backMenu),
    ),
  );
  if (!S.shownWin) { S.shownWin = true; SFX.win(); confetti({ count: 220, duration: 3500 }); }
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
  S.shownWin = false;
  keepAwake();
  trackStart({ game: GAME_ID, mode, players: mode === 'cpu' ? 1 : players.length }); // señal de uso (D-44)
  onChange();
}

/* ------------------------------------------------------------------ */
/* Intro y configuración                                               */
/* ------------------------------------------------------------------ */
const MODES = [
  { id: 'local', title: () => T.m1, sub: () => T.m1sub, ready: true },
  { id: 'online', title: () => T.m2, sub: () => T.m2sub, ready: false },
  { id: 'cpu', title: () => T.m3, sub: () => T.m3sub, ready: true },
];

function renderModes() {
  const box = $('#modes');
  box.innerHTML = '';
  MODES.forEach(m => {
    box.append(el('button', {
      class: 'mode' + (m.ready ? '' : ' mode--soon'), disabled: !m.ready,
      onClick: () => m.ready && renderSetup(m.id),
    },
    el('div', { class: 'mode-main' }, el('b', {}, m.title()), el('small', {}, m.sub())),
    m.ready ? el('span', { class: 'go' }, '›') : el('span', { class: 'soon' }, T.soon)));
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
  if (!saved || saved.done || !saved.config?.players) return;
  const previa = buildState({ players: saved.config.players, config: saved.config, plays: (saved.messages || []).filter(m => ['roll', 'bid', 'dudo', 'calza', 'open'].includes(m.t)) });
  const quien = saved.names?.[previa.current || previa.opener] || '';
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, fmt(T.resumeText, { round: previa.round + 1, name: quien })),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => resume(saved) }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderSetup(mode) {
  const form = $('#setup-form');
  const recordado = nameStore.get();
  let draft = mode === 'cpu'
    ? [recordado || '']
    : [recordado || '', ''];
  let calzar = DEFAULT_CONFIG.calzar;

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
    const sw = el('button', {
      type: 'button', class: 'switch' + (calzar ? ' on' : ''), 'aria-label': T.calzarLabel, 'aria-pressed': String(calzar),
      onClick: () => { calzar = !calzar; sw.classList.toggle('on', calzar); sw.setAttribute('aria-pressed', String(calzar)); SFX.tap(); },
    });
    form.append(el('div', { class: 'toggle-row' },
      el('div', { class: 'txt' }, el('b', {}, T.calzarLabel), el('small', {}, T.calzarHint)), sw));
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
      startMatch(mode, names, { ...DEFAULT_CONFIG, calzar, players });
    },
  }, T.start));
  acciones.append(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => showScreen('screen-intro') }, T.menu));
  $('#setup-error').textContent = '';
  showScreen('screen-setup');
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
}

init();
