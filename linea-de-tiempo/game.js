/**
 * Línea de Tiempo — lógica de juego.
 * Reductor de mensajes único para todos los modos (canon C-7):
 *  - local: 2 a 6 jugadores en este celular · cpu: el rol B es la IA · online: fase 2
 * El estado se deriva de la semilla del mazo más las jugadas, así que no hacen falta respuestas.
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { showHandoff, passBlock } from '../assets/js/handoff.js';
import { createLocalTransport } from '../assets/js/transport/local.js';
import { createSessionStore, createNameStore } from '../assets/js/session.js';
import { buildState, correctSlot, botMove, randomSeed, yearLabel } from './engine.js';
import { DECKS, getDeck } from './decks/index.js';
import { GAME_ID, DEFAULT_CONFIG, HAND_SIZES, DIFFICULTIES, MIN_PLAYERS, MAX_PLAYERS, LOCALES } from './rules.js';

const lang = getLang();
const T = LOCALES[lang];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const ROLES = ['A', 'B', 'C', 'D', 'E', 'F'];
const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);

let S = null;   // sesión: modo, transporte, roles locales, selección de la interfaz
let M = null;   // partida: config, nombres y jugadas

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */
function newMatch(config) { return { config, names: {}, moves: [], rematch: {}, seen: new Set() }; }

function apply(msg) {
  if (msg.id && M.seen.has(msg.id)) return; if (msg.id) M.seen.add(msg.id);
  switch (msg.t) {
    case 'hello': M.names[msg.from] = msg.name; break;
    case 'place': {
      const v = view();
      if (v.done || v.current !== msg.from) return;              // fuera de turno
      if (!v.hands[msg.from]?.includes(msg.card)) return;         // carta que no tiene
      // Ojo: `at` es campo reservado del transporte (marca de tiempo), la ranura viaja como `slot`
      if (!(msg.slot >= 0 && msg.slot <= v.line.length)) return;  // ranura inválida
      M.moves.push({ from: msg.from, card: msg.card, at: msg.slot });
      break;
    }
    case 'rematch': if (!M.rematch[msg.from]) M.rematch[msg.from] = msg.code || true; break;
  }
}

/** Vista derivada: manos, línea, turno, ganador. */
function view() {
  const cards = getDeck(M.config.theme).cards;
  const st = buildState({ cards, seed: M.config.seed, players: M.config.players, handSize: M.config.handSize, moves: M.moves });
  return { ...st, cards };
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */
function startSession({ mode, transport, roles, config, names, bot = null }) {
  if (S?.transport) S.transport.leave();
  S = { mode, transport, roles, bot, uiRole: null, selCard: null, selSlot: null, lastShown: -1, cpuTimer: null };
  M = newMatch(config);
  Object.entries(names).forEach(([r, name]) => { if (name) transport.send({ t: 'hello', from: r, name }); });
  transport.onMessage(m => { apply(m); onChange(); });
}

let chain = Promise.resolve();
function onChange() { chain = chain.then(async () => { await act(); render(); }).catch(e => console.error(e)); }

async function act() {
  const v = view();
  if (S.bot && !v.done && v.current === S.bot.role && !S.cpuTimer) {
    S.cpuTimer = setTimeout(() => {
      S.cpuTimer = null;
      const s = view();
      if (s.done || s.current !== S.bot.role) return;
      const mv = botMove({ line: s.line, hand: s.hands[S.bot.role], byId: s.byId, difficulty: M.config.difficulty });
      S.transport.send({ t: 'place', from: S.bot.role, card: mv.card, slot: mv.at });
    }, 1400);
  }
  saveSession();
}

/* ---------- Persistencia (canon C-6) ---------- */
function saveSession() {
  if (!S || !M) return;
  store.save({ mode: S.mode, config: M.config, messages: S.transport.messages || [], done: view().done });
}
function loadSession() { return store.load(); }
function clearSession() { store.clear(); }

function restoreLocal(saved) {
  const transport = createLocalTransport({ seed: saved.messages || [] });
  const bot = saved.mode === 'cpu' ? { role: 'B' } : null;
  startSession({ mode: saved.mode, transport, roles: saved.config.players, config: saved.config, names: {}, bot });
  S.lastShown = M.moves.length - 1;
  S.uiRole = null; // fuerza la pantalla de pase al retomar
  keepAwake();
  onChange();
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'instant' }); }

function eventRow(cardId, byId, fresh = false) {
  const c = byId[cardId];
  return el('div', { class: 'event' + (fresh ? ' fresh' : '') },
    el('span', { class: 'y' }, yearLabel(c.year, lang)),
    el('span', { class: 'em' }, c.emoji),
    el('span', { class: 't' }, c[lang]),
  );
}

function render() {
  if (!M) return;
  const v = view();
  if (v.done) return renderResult(v);
  renderPlay(v);
}

function renderPlay(v) {
  showScreen('screen-play');
  const isLocalTurn = S.roles.includes(v.current) && !(S.bot && S.bot.role === v.current);

  // Modo un celular: mostrar el resultado de la jugada anterior y pasar el celular
  if (S.mode === 'local' && v.history.length > S.lastShown + 1) {
    const last = v.history[v.history.length - 1];
    S.lastShown = v.history.length - 1;
    const turnPasses = v.current !== last.from;
    const stage = verdictStage(last, v, turnPasses ? M.names[v.current] : null);
    showHandoff([stage], () => { S.uiRole = v.current; S.selCard = null; S.selSlot = null; render(); }, { tapAdvances: !turnPasses });
    return;
  }
  if (S.mode === 'local' && S.uiRole !== v.current) {
    const stage = passBlock({ label: T.hoPass, name: M.names[v.current], button: T.hoReady });
    showHandoff([stage], () => { S.uiRole = v.current; S.selCard = null; S.selSlot = null; render(); }, { tapAdvances: false });
    return;
  }
  if (S.mode === 'cpu' && v.history.length > S.lastShown + 1) {
    const last = v.history[v.history.length - 1];
    S.lastShown = v.history.length - 1;
    playVerdictSound(last.ok);
  }

  // Rol que mira la pantalla
  const me = S.mode === 'cpu' ? 'A' : v.current;
  $('#status-who').textContent = isLocalTurn ? fmt(T.turnYou, { name: M.names[v.current] }) : (S.bot && v.current === S.bot.role ? T.cpuThinking : fmt(T.turnOther, { name: M.names[v.current] }));
  $('#status-sub').textContent = isLocalTurn ? (S.selCard ? T.pickSlot : T.pickCard) : '';

  // Marcador
  const score = $('#score'); score.innerHTML = '';
  for (const p of M.config.players) {
    score.append(el('span', { class: 'p' + (p === v.current ? ' turn' : '') }, M.names[p], el('span', { class: 'n' }, v.hands[p].length)));
  }

  // Mano
  const hand = v.hands[me] || [];
  if (S.selCard && !hand.includes(S.selCard)) S.selCard = null;
  if (!S.selCard && hand.length && isLocalTurn) S.selCard = hand[0];
  $('#hand-title').textContent = S.mode === 'cpu' ? T.yourHand : fmt(T.handOf, { name: M.names[me] });
  $('#pool-left').textContent = fmt(T.poolLeft, { n: v.poolLeft });
  const handBox = $('#hand'); handBox.innerHTML = '';
  for (const id of hand) {
    const c = v.byId[id];
    handBox.append(el('button', { class: 'card' + (S.selCard === id ? ' sel' : ''), disabled: !isLocalTurn, onClick: () => { S.selCard = id; S.selSlot = null; SFX.tap(); vibrate(8); renderPlay(view()); } },
      el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c[lang])));
  }

  // Carta que se lleva: queda fija arriba mientras se recorre la línea
  const carry = $('#carry');
  if (isLocalTurn && S.selCard) {
    const c = v.byId[S.selCard];
    // Tocar la barra devuelve a la mano para cambiar de carta sin buscarla desplazando
    carry.hidden = false; carry.innerHTML = '';
    carry.append(
      el('span', { class: 'em' }, c.emoji),
      el('span', { class: 'txt' }, el('span', { class: 'lbl' }, T.carrying), el('span', { class: 't' }, c[lang])),
      el('span', { class: 'change' }, T.changeCard, ' ↑'),
    );
    carry.onclick = () => { SFX.tap(); $('#hand').scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    handBox.classList.add('dim');
  } else { carry.hidden = true; carry.innerHTML = ''; handBox.classList.remove('dim'); }

  // Línea de tiempo con ranuras
  const line = $('#line'); line.innerHTML = '';
  const sel = S.selCard ? v.byId[S.selCard] : null;
  const slot = i => el('div', { class: 'slot' + (S.selSlot === i ? ' on' : ''), onClick: () => {
    if (!isLocalTurn || !S.selCard) return;
    S.selSlot = S.selSlot === i ? null : i; SFX.tap(); vibrate(8); renderPlay(view());
  } },
    S.selSlot === i && sel
      ? el('span', { class: 'ghost' }, el('span', { class: 'y' }, '?'), el('span', { class: 'em' }, sel.emoji), el('span', { class: 't' }, sel[lang]))
      : el('span', {}, i === 0 ? T.slotFirst : i === v.line.length ? T.slotLast : T.slotBetween));
  if (isLocalTurn) line.append(slot(0));
  v.line.forEach((id, i) => {
    const fresh = v.history.length && v.history[v.history.length - 1].ok && v.history[v.history.length - 1].card === id;
    line.append(eventRow(id, v.byId, fresh));
    if (isLocalTurn) line.append(slot(i + 1));
  });

  // Confirmar
  const row = $('#place-row'); row.innerHTML = '';
  if (isLocalTurn) {
    row.append(el('button', { class: 'btn btn--yellow', disabled: S.selSlot === null || !S.selCard, onClick: () => {
      SFX.flip();
      S.transport.send({ t: 'place', from: v.current, card: S.selCard, slot: S.selSlot });
      S.selCard = null; S.selSlot = null;
    } }, T.place));
  }
  const fresh = line.querySelector('.event.fresh'); if (fresh) fresh.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function playVerdictSound(ok) { if (ok) { SFX.reveal(); vibrate([30, 30]); } else { SFX.error(); vibrate([60, 40, 60]); } }

/** Pantalla entre turnos: veredicto de la jugada y, si cambia el turno, el pase del celular. */
function verdictStage(last, v, nextName) {
  const c = v.byId[last.card];
  playVerdictSound(last.ok);
  const stage = el('div', { class: 'stage pop' },
    el('div', { class: 'verdict' },
      el('div', { class: 'big ' + (last.ok ? 'ok' : 'no') }, last.ok ? T.correct : T.wrong),
      el('div', { class: 'card-big' }, el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c[lang]), el('span', { class: 'y' }, yearLabel(c.year, lang))),
      el('div', { class: 'note' }, last.ok ? `${M.names[last.from]} 👏` : T.drewNew),
    ),
  );
  if (nextName) {
    stage.append(el('div', { class: 'pass-divider', style: 'width:60%;height:1px;background:var(--glass-border);margin:10px auto 2px' }));
    const pb = passBlock({ label: T.hoPass, name: nextName, button: T.hoReady, small: true });
    stage.append(pb);
    stage.setAdvance = fn => pb.setAdvance(() => { SFX.pass(); fn(); });
  } else stage.append(el('div', { class: 'hint', style: 'margin-top:14px' }, T.hoContinue + ' ›'));
  return stage;
}

const cardsLabel = n => (n === 0 ? T.noCards : n === 1 ? T.cardHeld : fmt(T.cardsHeld, { n }));

function renderResult(v) {
  const already = $('#screen-result').classList.contains('active');
  if (!already) showScreen('screen-result');
  const winners = v.winner || [];
  const meRole = S.mode === 'cpu' ? 'A' : null;
  const many = winners.length > 1;
  $('#result-title').textContent = many ? T.winTitleMany : fmt(T.winTitle, { name: M.names[winners[0]] });
  const okOf = p => v.history.filter(h => h.from === p && h.ok).length;
  const totalOf = p => v.history.filter(h => h.from === p).length;
  $('#result-sub').textContent = (meRole ? (winners.includes(meRole) ? T.youWin : T.youLose) + ' · ' : '') + fmt(T.stats, { ok: okOf(winners[0]), total: totalOf(winners[0]) });
  $('#result-trophy').textContent = meRole && !winners.includes(meRole) ? '😵' : (many ? '🤝' : '🏆');

  const rank = $('#result-ranking'); rank.innerHTML = '';
  const order = M.config.players.slice().sort((a, b) => v.hands[a].length - v.hands[b].length || okOf(b) - okOf(a));
  order.forEach((p, i) => {
    rank.append(el('li', { class: winners.includes(p) ? 'top' : '' },
      el('span', { class: 'pos' }, ['🥇', '🥈', '🥉'][i] || `${i + 1}.`),
      el('span', {}, M.names[p]),
      el('span', { class: 'info' }, `${cardsLabel(v.hands[p].length)} · ${fmt(T.stats, { ok: okOf(p), total: totalOf(p) })}`),
    ));
  });
  const rline = $('#result-line'); rline.innerHTML = '';
  v.line.forEach(id => rline.append(eventRow(id, v.byId)));
  if (!already) { $('#result-replay').open = false; if (!meRole || winners.includes(meRole)) { confetti({ count: 220, duration: 3500 }); SFX.win(); } else SFX.timeUp(); }

  const box = $('#result-actions'); box.innerHTML = '';
  box.append(
    el('button', { class: 'btn btn--yellow', onClick: rematch }, T.rematch),
    el('button', { class: 'btn btn--ghost', onClick: () => { clearSession(); S.transport.leave(); location.href = location.pathname; } }, T.changeMode),
    el('a', { class: 'btn btn--ghost', href: '../' }, T.backMenu),
  );
}

function rematch() { SFX.tap(); startLocalMode(S.mode, { ...M.names }, { ...M.config, seed: randomSeed() }); }

/* ------------------------------------------------------------------ */
/* Modos y arranque                                                    */
/* ------------------------------------------------------------------ */
function startLocalMode(mode, names, config) {
  clearSession();
  const transport = createLocalTransport();
  const bot = mode === 'cpu' ? { role: 'B' } : null;
  startSession({ mode, transport, roles: config.players, config, names, bot });
  keepAwake();
}

function renderModes() {
  const box = $('#modes'); box.innerHTML = '';
  const modes = [['local', T.modeLocal, T.modeLocalHint, true], ['online', T.modeOnline, T.modeOnlineHint, false], ['cpu', T.modeCpu, T.modeCpuHint, true]];
  for (const [m, label, hint, ok] of modes) box.append(el('button', { class: 'mode', disabled: !ok, onClick: () => { SFX.tap(); renderSetup(m); } }, el('span', {}, el('b', {}, label), el('small', {}, hint)), el('span', { class: 'go' }, ok ? '›' : '⏳')));
}

function renderResumeSlot() {
  const slot = $('#resume-slot'); slot.innerHTML = '';
  const saved = loadSession();
  if (!saved || saved.done) return;
  const deck = getDeck(saved.config?.theme);
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, `${deck.emoji} ${deck.name[lang]} · ${{ local: T.modeLocal, cpu: T.modeCpu }[saved.mode] || ''}`),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => restoreLocal(saved) }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { clearSession(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderSetup(mode) {
  showScreen('screen-setup');
  const config = { ...DEFAULT_CONFIG };
  const form = $('#setup-form'); form.innerHTML = '';
  const err = $('#setup-error'); err.textContent = '';
  let draft = mode === 'cpu' ? [nameStore.get()] : ['', ''];

  // Temática
  const themes = el('div', { class: 'themes' });
  const paintThemes = () => {
    themes.innerHTML = '';
    for (const d of DECKS) themes.append(el('button', { type: 'button', class: 'theme-card' + (config.theme === d.id ? ' on' : ''), onClick: () => { config.theme = d.id; SFX.tap(); paintThemes(); } },
      el('span', { class: 'em' }, d.emoji), el('b', {}, d.name[lang]), el('small', {}, d.hint[lang])));
  };
  paintThemes();
  form.append(el('div', { class: 'field' }, el('label', {}, T.theme), themes));

  // Jugadores
  const playersBox = el('div');
  const addBtn = el('button', { class: 'btn btn--ghost btn--sm', style: 'width:100%', onClick: () => { if (draft.length < MAX_PLAYERS) { draft.push(''); paintPlayers(); } } }, T.addPlayer);
  const paintPlayers = () => {
    playersBox.innerHTML = '';
    draft.forEach((name, i) => {
      const input = el('input', { type: 'text', maxlength: 14, placeholder: fmt(T.playerPlaceholder, { n: i + 1 }), value: name, autocomplete: 'off', onInput: e => { draft[i] = e.target.value; } });
      playersBox.append(el('div', { class: 'player-row' }, el('span', { class: 'num' }, i + 1), input,
        el('button', { class: 'del', type: 'button', 'aria-label': T.removePlayer, disabled: draft.length <= MIN_PLAYERS, onClick: () => { draft.splice(i, 1); paintPlayers(); } }, '✕')));
    });
    addBtn.disabled = draft.length >= MAX_PLAYERS;
    addBtn.textContent = draft.length >= MAX_PLAYERS ? fmt(T.maxPlayers, { n: MAX_PLAYERS }) : T.addPlayer;
  };
  if (mode === 'local') { paintPlayers(); form.append(el('div', { class: 'field' }, el('label', {}, T.players), playersBox, addBtn)); }
  else {
    const input = el('input', { type: 'text', maxlength: 14, placeholder: T.yourName, value: draft[0], autocomplete: 'off', onInput: e => { draft[0] = e.target.value; } });
    form.append(el('div', { class: 'field' }, el('label', {}, T.yourName), input));
  }

  // Cartas en mano
  const sizeLabels = { 3: T.short, 5: T.normal, 7: T.long };
  const seg = el('div', { class: 'seg' }, ...HAND_SIZES.map(n => el('button', { type: 'button', class: n === config.handSize ? 'on' : '', onClick: e => { config.handSize = n; $$('button', seg).forEach(b => b.classList.toggle('on', b === e.currentTarget)); SFX.tap(); } }, `${sizeLabels[n]} · ${n}`)));
  form.append(el('div', { class: 'field' }, el('label', {}, T.handSize), seg));

  // Dificultad (solo contra el celular)
  if (mode === 'cpu') {
    const labels = { facil: T.facil, normal: T.normal, dificil: T.dificil };
    const dseg = el('div', { class: 'seg' }, ...DIFFICULTIES.map(d => el('button', { type: 'button', class: d === config.difficulty ? 'on' : '', onClick: e => { config.difficulty = d; $$('button', dseg).forEach(b => b.classList.toggle('on', b === e.currentTarget)); SFX.tap(); } }, labels[d])));
    form.append(el('div', { class: 'field' }, el('label', {}, T.difficulty), dseg));
  }

  const fail = msg => { err.textContent = msg; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); SFX.error(); vibrate([30, 30, 30]); };
  const actions = $('#setup-actions'); actions.innerHTML = '';
  actions.append(el('button', { class: 'btn btn--yellow', onClick: () => {
    const list = draft.map(n => n.trim());
    if (mode === 'cpu') {
      if (!list[0]) return fail(T.errName);
      nameStore.set(list[0]);
      const players = ['A', 'B'];
      SFX.tap();
      startLocalMode('cpu', { A: list[0], B: T.cpuName }, { ...config, players, seed: randomSeed() });
    } else {
      if (list.some(n => !n) || new Set(list.map(n => n.toLowerCase())).size !== list.length) return fail(T.errNames);
      const players = ROLES.slice(0, list.length);
      const names = Object.fromEntries(players.map((p, i) => [p, list[i]]));
      SFX.tap();
      startLocalMode('local', names, { ...config, players, seed: randomSeed() });
    }
  } }, T.start));
}

function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(langToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  sparkles(12);
  renderModes();
  renderResumeSlot();
}
init();
// Gancho de depuración (solo lectura) para pruebas automatizadas (canon C-14).
window.__ldt = { view: () => (M ? view() : null), match: () => M, session: () => S };
void correctSlot;
