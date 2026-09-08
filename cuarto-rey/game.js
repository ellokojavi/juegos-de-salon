/**
 * Cuarto Rey — lógica del juego.
 * Pantallas: intro → setup → play → end.
 * El estado completo se guarda en localStorage para poder retomar la partida.
 */
import { $, $$, el, pick, shuffle, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import {
  SUITS, RANKS, RANK_NAMES, MIN_PLAYERS, MAX_PLAYERS, SORBOS,
  CARD_RULES, KING_MESSAGES, MINIGAMES, PENITENCIAS, CATEGORIAS, NUNCA_NUNCA,
} from './rules.js';

const STORAGE_PLAYERS = 'juegos-de-salon:players';
const STORAGE_GAME = 'juegos-de-salon:cuarto-rey:game';
const GENDERS = { m: '♂', f: '♀', x: '⚧' };
const GENDER_LABEL = { m: 'Hombre', f: 'Mujer', x: 'Otro (toma con J y con Q)' };

let state = null;      // partida en curso
let draft = [];        // jugadores en edición (pantalla setup)
let timerHandle = null;

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */
function save() {
  try { localStorage.setItem(STORAGE_GAME, JSON.stringify(state)); } catch (_) { /* modo privado */ }
}
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_GAME) || 'null'); } catch (_) { return null; }
}
function clearSaved() {
  try { localStorage.removeItem(STORAGE_GAME); } catch (_) { /* nada */ }
}
function loadPlayers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_PLAYERS) || 'null'); } catch (_) { return null; }
}
function savePlayers(players) {
  try { localStorage.setItem(STORAGE_PLAYERS, JSON.stringify(players)); } catch (_) { /* nada */ }
}

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */
function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ------------------------------------------------------------------ */
/* Intro                                                               */
/* ------------------------------------------------------------------ */
function renderRulesList() {
  const list = $('#rules-list');
  list.innerHTML = '';
  for (const rank of RANKS) {
    const r = CARD_RULES[rank];
    list.append(el('li', {},
      el('div', { class: 'mini-card' + (rank === 'K' ? ' k' : '') }, rank),
      el('div', {}, el('b', {}, r.title), el('small', {}, r.text)),
    ));
  }
}

function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = loadSaved();
  if (!saved || saved.finished || !saved.players?.length) return;
  const who = saved.players[saved.turn]?.name || '?';
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, '⏯ Hay una partida a medias'),
    el('p', { class: 'muted' }, `Le tocaba a ${who}. Quedan ${saved.deck.length} cartas y han salido ${saved.kings} reyes.`),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { state = saved; enterPlay(); } }, 'Continuar'),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { clearSaved(); renderResumeSlot(); } }, 'Borrar'),
    ),
  ));
}

/* ------------------------------------------------------------------ */
/* Setup de jugadores                                                  */
/* ------------------------------------------------------------------ */
function enterSetup() {
  const remembered = loadPlayers();
  draft = (remembered && remembered.length >= MIN_PLAYERS)
    ? remembered.map(p => ({ ...p }))
    : Array.from({ length: MIN_PLAYERS }, () => ({ name: '', gender: 'm' }));
  renderPlayersForm();
  showScreen('screen-setup');
}

function renderPlayersForm() {
  const form = $('#players-form');
  form.innerHTML = '';
  draft.forEach((p, i) => {
    const input = el('input', {
      type: 'text', placeholder: `Jugador ${i + 1}`, value: p.name, maxlength: 14, autocomplete: 'off', enterkeyhint: 'next',
      onInput: e => { p.name = e.target.value; },
      onKeydown: e => { if (e.key === 'Enter') { const next = $$('#players-form input')[i + 1]; next ? next.focus() : e.target.blur(); } },
    });
    const gender = el('div', { class: 'gender' },
      ...Object.entries(GENDERS).map(([g, sym]) => el('button', {
        type: 'button', 'data-g': g, class: p.gender === g ? 'on' : '', title: GENDER_LABEL[g], 'aria-label': GENDER_LABEL[g],
        onClick: e => { p.gender = g; $$('button', e.currentTarget.parentElement).forEach(b => b.classList.toggle('on', b.dataset.g === g)); vibrate(10); },
      }, sym)),
    );
    const del = el('button', { class: 'del', type: 'button', 'aria-label': 'Quitar jugador', disabled: draft.length <= MIN_PLAYERS,
      onClick: () => { draft.splice(i, 1); renderPlayersForm(); } }, '✕');
    form.append(el('div', { class: 'player-row', style: `animation-delay:${i * 40}ms` }, el('div', { class: 'num' }, i + 1), input, gender, del));
  });
  $('#btn-add-player').disabled = draft.length >= MAX_PLAYERS;
  $('#btn-add-player').textContent = draft.length >= MAX_PLAYERS ? `Máximo ${MAX_PLAYERS} jugadores` : '+ Agregar jugador';
}

function validateDraft() {
  const players = draft.map(p => ({ name: p.name.trim(), gender: p.gender }));
  if (players.length < MIN_PLAYERS) return { error: `Se necesitan al menos ${MIN_PLAYERS} jugadores.` };
  if (players.some(p => !p.name)) return { error: 'Todos los jugadores necesitan un nombre.' };
  const lower = players.map(p => p.name.toLowerCase());
  if (new Set(lower).size !== lower.length) return { error: 'Hay nombres repetidos. Pónganse apodos.' };
  return { players };
}

/* ------------------------------------------------------------------ */
/* Partida                                                             */
/* ------------------------------------------------------------------ */
function buildDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit: suit.symbol, color: suit.color });
  return shuffle(deck);
}

function startGame(players) {
  savePlayers(players);
  state = {
    players, deck: buildDeck(), turn: 0, kings: 0, drawn: 0,
    sorbos: players.map(() => 0), fondos: players.map(() => 0),
    current: null, finished: false, victim: null, startedAt: Date.now(),
  };
  save();
  enterPlay();
}

function enterPlay() {
  keepAwake();
  showScreen('screen-play');
  renderTable();
}

const n = () => state.players.length;
const currentPlayer = () => state.players[state.turn];

function renderSeats() {
  const seats = $('#seats');
  seats.innerHTML = '';
  state.players.forEach((p, i) => {
    seats.append(el('span', { class: 'seat' + (i === state.turn ? ' current' : '') }, p.name, ' ', el('span', { class: 's' }, GENDERS[p.gender])));
  });
}

function renderCrowns() {
  $$('#crowns span').forEach((c, i) => c.classList.toggle('lit', i < state.kings));
}

function renderTable() {
  renderCrowns();
  $('#deck-count').textContent = state.deck.length;
  $('#turn-name').textContent = currentPlayer().name;
  $('#turn-name').classList.remove('pop'); void $('#turn-name').offsetWidth; $('#turn-name').classList.add('pop');
  renderSeats();
  const card = $('#card');
  const result = $('#result');
  result.hidden = true; result.innerHTML = '';
  if (state.current) {
    // Partida retomada a mitad de una carta: mostrarla ya volteada.
    renderCardFront(state.current.card);
    card.classList.remove('idle'); card.classList.add('flipped');
    renderResult();
  } else {
    card.classList.remove('flipped', 'reveal'); card.classList.add('idle');
  }
}

function renderCardFront(c) {
  const front = $('#card-front');
  front.className = 'face front ' + c.color;
  const faceEmoji = { J: '🤴', Q: '👸', K: '👑' }[c.rank];
  front.innerHTML = '';
  front.append(
    el('div', { class: 'corner' }, el('span', {}, c.rank), el('span', {}, c.suit)),
    el('div', { class: 'pip' }, faceEmoji ? el('span', { class: 'face-emoji' }, faceEmoji) : c.suit),
    el('div', { class: 'corner br' }, el('span', {}, c.rank), el('span', {}, c.suit)),
  );
}

function drawCard() {
  if (!state || state.current || state.finished) return;
  if (!state.deck.length) return finishGame(null);
  const card = state.deck.pop();
  state.drawn++;
  state.current = { card, applied: false, data: {} };
  applyImmediateRule();
  save();
  vibrate([20, 40, 30]);
  renderCardFront(card);
  const cardEl = $('#card');
  cardEl.classList.remove('idle'); cardEl.classList.add('flipped', 'reveal');
  $('#deck-count').textContent = state.deck.length;
  setTimeout(renderResult, 650);
}

/** Reglas cuyo efecto es automático (nadie decide nada): se aplican al sacar la carta. */
function applyImmediateRule() {
  const { card } = state.current;
  const rule = CARD_RULES[card.rank];
  if (rule.kind === 'drink') {
    const targets = resolveTargets(rule.targets);
    targets.forEach(i => { state.sorbos[i] += SORBOS; });
    state.current.data.targets = targets;
  } else if (rule.kind === 'king') {
    state.kings++;
    state.current.data.kingNumber = state.kings;
    if (state.kings === 4) {
      state.fondos[state.turn]++;
      state.victim = state.turn;
    }
  } else if (rule.kind === 'penitencia') {
    state.current.data.penitencia = pick(PENITENCIAS);
  } else if (rule.kind === 'minigame' && rule.game === 'cultura') {
    state.current.data.category = pick(CATEGORIAS);
  }
  state.current.applied = true;
}

function resolveTargets(kind) {
  const t = state.turn, total = n();
  switch (kind) {
    case 'all': return state.players.map((_, i) => i);
    case 'right': return [(t + 1) % total];
    case 'left': return [(t - 1 + total) % total];
    case 'self': return [t];
    case 'men': { const r = state.players.map((p, i) => (p.gender === 'm' || p.gender === 'x') ? i : -1).filter(i => i >= 0); return r.length ? r : [t]; }
    case 'women': { const r = state.players.map((p, i) => (p.gender === 'f' || p.gender === 'x') ? i : -1).filter(i => i >= 0); return r.length ? r : [t]; }
    default: return [t];
  }
}

/* ------------------------------------------------------------------ */
/* Panel de resultado                                                  */
/* ------------------------------------------------------------------ */
function renderResult() {
  const { card, data } = state.current;
  const rule = CARD_RULES[card.rank];
  const box = $('#result');
  box.innerHTML = '';
  box.hidden = false;
  box.classList.remove('slide-up'); void box.offsetWidth; box.classList.add('slide-up');

  const kicker = el('div', { class: 'kicker' }, `${currentPlayer().name} sacó ${RANK_NAMES[card.rank]} de ${SUITS.find(s => s.symbol === card.suit).name}`);
  box.append(kicker);

  switch (rule.kind) {
    case 'drink': renderDrink(box, rule, data); break;
    case 'gift': renderGift(box, rule); break;
    case 'penitencia': renderPenitencia(box, rule, data); break;
    case 'minigame': renderMinigame(box, rule, data); break;
    case 'king': renderKing(box, data); break;
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function nextButton(label = '¡Listo, siguiente!') {
  return el('div', { class: 'actions' }, el('button', { class: 'btn', onClick: nextTurn }, label));
}

function drinkerChips(indexes) {
  return el('div', { class: 'drinkers' }, ...indexes.map((i, k) => el('span', { class: 'chip chip--hot', style: `animation-delay:${k * 70}ms` }, '🍺 ', state.players[i].name)));
}

function renderDrink(box, rule, data) {
  const targets = data.targets || resolveTargets(rule.targets);
  const fallback = (rule.targets === 'men' || rule.targets === 'women') && targets.length === 1 && targets[0] === state.turn
    && !state.players.some(p => p.gender === (rule.targets === 'men' ? 'm' : 'f') || p.gender === 'x');
  box.append(
    el('h2', { class: 'display display--md title' }, rule.title),
    el('p', { class: 'text' }, fallback ? `No hay ${rule.targets === 'men' ? 'hombres' : 'mujeres'} en la mesa… así que tomas tú.` : rule.text),
    drinkerChips(targets),
    nextButton(),
  );
}

function renderGift(box, rule) {
  const counts = state.players.map(() => 0);
  const total = () => counts.reduce((a, b) => a + b, 0);
  const status = el('p', { class: 'text' }, `Te quedan ${SORBOS} sorbos por regalar.`);
  const done = el('button', { class: 'btn', disabled: true, onClick: () => {
    counts.forEach((c, i) => { state.sorbos[i] += c; });
    nextTurn();
  } }, '¡Regalados!');
  const picker = el('div', { class: 'picker' });
  const buttons = state.players.map((p, i) => {
    const count = el('span', { class: 'count' }, '');
    const b = el('button', { type: 'button', onClick: () => {
      if (total() >= SORBOS) { counts[i] = 0; } else { counts[i]++; }
      buttons.forEach((bb, j) => { bb.classList.toggle('on', counts[j] > 0); bb.querySelector('.count').textContent = counts[j] ? '🍺'.repeat(counts[j]) : ''; });
      const left = SORBOS - total();
      status.textContent = left ? `Te quedan ${left} sorbo${left > 1 ? 's' : ''} por regalar.` : '¡Listo! Confirma abajo.';
      done.disabled = left > 0;
      vibrate(10);
    } }, p.name, count);
    return b;
  });
  picker.append(...buttons);
  box.append(
    el('h2', { class: 'display display--md title' }, rule.title),
    el('p', { class: 'text' }, rule.text),
    status, picker,
    el('div', { class: 'actions' }, done),
  );
}

function renderPenitencia(box, rule, data) {
  const text = el('div', { class: 'penitencia-text pop' }, data.penitencia);
  box.append(
    el('h2', { class: 'display display--md title' }, `Penitencia pa' ${currentPlayer().name}`),
    text,
    el('button', { class: 'btn btn--ghost btn--sm', style: 'width:100%', onClick: () => {
      let p; do { p = pick(PENITENCIAS); } while (p === data.penitencia && PENITENCIAS.length > 1);
      data.penitencia = p; save();
      text.textContent = p; text.classList.remove('pop'); void text.offsetWidth; text.classList.add('pop');
    } }, '🎲 Otra penitencia'),
    el('div', { class: 'actions stack' },
      el('button', { class: 'btn btn--cyan', onClick: nextTurn }, '✅ ¡Cumplida!'),
      el('button', { class: 'btn btn--ghost', onClick: () => { state.sorbos[state.turn] += SORBOS; nextTurn(); } }, `😳 Se arrugó: toma ${SORBOS} sorbos`),
    ),
  );
}

function renderMinigame(box, rule, data) {
  const mg = MINIGAMES[rule.game];
  box.append(
    el('h2', { class: 'display display--md title' }, `${mg.emoji} ${mg.name}`),
    el('p', { class: 'text' }, mg.intro),
    el('ul', { class: 'mini-rules' }, ...mg.rules.map(r => el('li', {}, r))),
  );
  if (mg.helper === 'timer') box.append(timerHelper());
  if (mg.helper === 'category') box.append(categoryHelper(data));
  if (mg.helper === 'nunca') box.append(nuncaHelper());
  if (mg.helper === 'none') box.append(el('div', { class: 'helper' }, el('div', { class: 'big' }, '🐷 Cuando quieras…'), el('div', { class: 'muted' }, 'Sigan jugando. Cuando pase, marquen al perdedor aquí o en cualquier momento.')));

  // Selección de perdedor
  const picker = el('div', { class: 'picker' });
  const loserBtns = state.players.map((p, i) => el('button', { type: 'button', onClick: () => {
    stopTimer();
    state.sorbos[i] += SORBOS;
    nextTurn();
  } }, `😵 ${p.name}`));
  picker.append(...loserBtns);
  box.append(
    el('div', { class: 'actions' },
      el('p', { class: 'text', style: 'margin-bottom:4px' }, `¿Quién perdió? Toma ${SORBOS} sorbos.`),
      picker,
      el('button', { class: 'btn btn--ghost', style: 'margin-top:10px', onClick: () => { stopTimer(); nextTurn(); } }, 'Nadie perdió / seguir'),
    ),
  );
}

function timerHelper(seconds = 5) {
  const display = el('div', { class: 'timer' }, `${seconds}`);
  const label = el('div', { class: 'muted' }, 'Cuenta de 5 segundos para quien se traba');
  let remaining = seconds;
  const start = el('button', { class: 'btn btn--cyan btn--sm', style: 'margin-top:8px', onClick: () => {
    stopTimer();
    remaining = seconds; display.textContent = remaining; display.classList.remove('alarm');
    timerHandle = setInterval(() => {
      remaining--;
      display.textContent = remaining > 0 ? remaining : '¡TIEMPO!';
      if (remaining <= 0) { stopTimer(); display.classList.add('alarm'); vibrate([80, 60, 80, 60, 200]); }
    }, 1000);
  } }, '⏱ Iniciar 5 s');
  return el('div', { class: 'helper' }, display, label, start);
}

function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }

function categoryHelper(data) {
  const cat = el('div', { class: 'big pop' }, data.category);
  return el('div', { class: 'helper' },
    el('div', { class: 'muted' }, 'Categoría sugerida'),
    cat,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => {
      let c; do { c = pick(CATEGORIAS); } while (c === data.category);
      data.category = c; save(); cat.textContent = c; cat.classList.remove('pop'); void cat.offsetWidth; cat.classList.add('pop');
    } }, '🎲 Otra categoría'),
  );
}

function nuncaHelper() {
  const quote = el('div', { class: 'quote', hidden: true });
  const btn = el('button', { class: 'btn btn--ghost btn--sm', onClick: () => {
    quote.hidden = false; quote.textContent = pick(NUNCA_NUNCA); btn.textContent = '🎲 Otra idea';
    quote.classList.remove('pop'); void quote.offsetWidth; quote.classList.add('pop');
  } }, '💡 ¿Sin ideas?');
  return el('div', { class: 'helper' }, el('div', { class: 'muted' }, `${currentPlayer().name} parte: “Nunca nunca he…”`), quote, btn);
}

function renderKing(box, data) {
  const k = data.kingNumber;
  const msg = KING_MESSAGES[k - 1];
  renderCrowns();
  vibrate(k === 4 ? [100, 50, 100, 50, 300] : [40, 30, 40]);
  if (k === 4) {
    confetti({ count: 220, duration: 3500 });
    box.append(
      el('h2', { class: 'display display--lg title gold' }, msg.title),
      el('p', { class: 'text' }, msg.text),
      drinkerChips([state.turn]),
      el('div', { class: 'actions' }, el('button', { class: 'btn btn--yellow', onClick: () => finishGame(state.turn) }, '🏆 Ver el resultado')),
    );
  } else {
    box.append(
      el('h2', { class: 'display display--md title gold' }, msg.title),
      el('p', { class: 'text' }, msg.text),
      el('div', { class: 'chips', style: 'justify-content:center' }, el('span', { class: 'chip chip--gold' }, `👑 ${k} de 4`)),
      nextButton(),
    );
  }
}

function nextTurn() {
  stopTimer();
  state.current = null;
  state.turn = (state.turn + 1) % n();
  save();
  renderTable();
}

/* ------------------------------------------------------------------ */
/* Final                                                               */
/* ------------------------------------------------------------------ */
function finishGame(victimIndex) {
  stopTimer();
  state.finished = true;
  state.current = null;
  save();
  $('#end-victim').textContent = victimIndex === null ? 'Se acabó el mazo' : state.players[victimIndex].name;
  const ranking = $('#ranking');
  ranking.innerHTML = '';
  const order = state.players.map((p, i) => ({ ...p, i, sorbos: state.sorbos[i], fondos: state.fondos[i] }))
    .sort((a, b) => (b.sorbos + b.fondos * 10) - (a.sorbos + a.fondos * 10));
  order.forEach((p, pos) => {
    ranking.append(el('li', { class: pos === 0 ? 'top' : '' },
      el('span', { class: 'pos' }, ['🥇', '🥈', '🥉'][pos] || `${pos + 1}.`),
      el('span', {}, p.name, p.fondos ? ' 👑' : ''),
      el('span', { class: 'sorbos' }, `${p.sorbos} sorbos${p.fondos ? ' + fondo' : ''}`),
    ));
  });
  const mins = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
  $('#end-stats').textContent = `${state.drawn} cartas en ${mins} min. Los sorbos son una estimación: los mini-juegos y penitencias se cuentan cuando marcan al perdedor.`;
  showScreen('screen-end');
  confetti({ count: 260, duration: 4000 });
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */
function init() {
  sparkles(14);
  renderRulesList();
  renderResumeSlot();
  $('#btn-go-setup').addEventListener('click', enterSetup);
  $('#btn-add-player').addEventListener('click', () => { if (draft.length < MAX_PLAYERS) { draft.push({ name: '', gender: 'm' }); renderPlayersForm(); setTimeout(() => $$('#players-form input').at(-1)?.focus(), 50); } });
  $('#btn-start').addEventListener('click', () => {
    const { error, players } = validateDraft();
    const err = $('#form-error');
    if (error) { err.textContent = error; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); vibrate([30, 30, 30]); return; }
    err.textContent = '';
    clearSaved();
    startGame(players);
  });
  $('#card').addEventListener('click', drawCard);
  $('#btn-again').addEventListener('click', () => startGame(state.players));
  $('#btn-change-players').addEventListener('click', () => { clearSaved(); enterSetup(); });
}

init();
