/**
 * Cuarto Rey — lógica del juego.
 * Pantallas: intro → setup → play → end.
 * El estado completo se guarda en localStorage para poder retomar la partida.
 * Todos los textos salen de LOCALES[lang] (rules.js); el idioma se elige en el menú o en la intro.
 */
import { $, $$, el, pick, shuffle, vibrate, sparkles, keepAwake, confetti } from '../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../assets/js/sound.js';
import { createSessionStore } from '../assets/js/session.js';
import { trackStart } from '../assets/js/transport/stats.js';
import { SUITS, RANKS, MIN_PLAYERS, MAX_PLAYERS, SORBOS, CARD_RULES, LOCALES } from './rules.js';

const STORAGE_PLAYERS = 'juegos-de-salon:players';
const store = createSessionStore('cuarto-rey', { legacyKeys: ['juegos-de-salon:cuarto-rey:game'] });
const GENDERS = { m: '♂', f: '♀', x: '⚧' };

const lang = getLang();
const L = LOCALES[lang];
const T = L.ui;
/** Reemplaza {llaves} en un texto: fmt('Hola {name}', { name: 'Javi' }). */
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

let state = null;      // partida en curso
let draft = [];        // jugadores en edición (pantalla setup)
let timerHandle = null;

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */
function save() {
  store.save({ mode: 'local', state });
}
function loadSaved() {
  const data = store.load();
  if (!data) return null;
  return data.state || (data.players ? data : null); // formato antiguo: el estado iba en la raíz
}
function clearSaved() {
  store.clear();
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
    const r = L.cards[rank];
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
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, fmt(T.resumeText, { name: who, cards: saved.deck.length, kings: saved.kings })),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { state = saved; enterPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { clearSaved(); renderResumeSlot(); } }, T.delete),
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
      type: 'text', placeholder: fmt(T.playerPlaceholder, { n: i + 1 }), value: p.name, maxlength: 14, autocomplete: 'off', enterkeyhint: 'next',
      onInput: e => { p.name = e.target.value; },
      onKeydown: e => { if (e.key === 'Enter') { const next = $$('#players-form input')[i + 1]; next ? next.focus() : e.target.blur(); } },
    });
    const gender = el('div', { class: 'gender' },
      ...Object.entries(GENDERS).map(([g, sym]) => el('button', {
        type: 'button', 'data-g': g, class: p.gender === g ? 'on' : '', title: T.genders[g], 'aria-label': T.genders[g],
        onClick: e => { p.gender = g; $$('button', e.currentTarget.parentElement).forEach(b => b.classList.toggle('on', b.dataset.g === g)); vibrate(10); },
      }, sym)),
    );
    const del = el('button', { class: 'del', type: 'button', 'aria-label': T.removePlayer, disabled: draft.length <= MIN_PLAYERS,
      onClick: () => { draft.splice(i, 1); renderPlayersForm(); } }, '✕');
    form.append(el('div', { class: 'player-row', style: `animation-delay:${i * 40}ms` }, el('div', { class: 'num' }, i + 1), input, gender, del));
  });
  $('#btn-add-player').disabled = draft.length >= MAX_PLAYERS;
  $('#btn-add-player').textContent = draft.length >= MAX_PLAYERS ? fmt(T.maxPlayers, { n: MAX_PLAYERS }) : T.addPlayer;
}

function validateDraft() {
  const players = draft.map(p => ({ name: p.name.trim(), gender: p.gender }));
  if (players.length < MIN_PLAYERS) return { error: fmt(T.errMin, { n: MIN_PLAYERS }) };
  if (players.some(p => !p.name)) return { error: T.errNames };
  const lower = players.map(p => p.name.toLowerCase());
  if (new Set(lower).size !== lower.length) return { error: T.errDup };
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
  trackStart({ game: 'cuarto-rey', mode: 'local', players: players.length }); // señal de uso para el panel (D-44)
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
    // Partida retomada a mitad de una carta: mostrarla ya volteada y chica.
    renderCardFront(state.current.card);
    card.classList.remove('idle', 'enter'); card.classList.add('flipped', 'small');
    renderResult();
  } else {
    card.classList.remove('flipped', 'reveal', 'small'); card.classList.add('idle');
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
  cardEl.classList.remove('idle', 'enter'); cardEl.classList.add('flipped', 'reveal');
  SFX.flip();
  setTimeout(SFX.reveal, 700);
  $('#deck-count').textContent = state.deck.length;
  // Secuencia: volteo (0.75 s) → la carta se encoge (0.5 s) → aparecen las instrucciones.
  setTimeout(() => cardEl.classList.add('small'), 800);
  setTimeout(renderResult, 1150);
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
    state.current.data.penitencia = pick(L.penitencias);
  } else if (rule.kind === 'minigame' && rule.game === 'cultura') {
    state.current.data.category = pick(L.categorias);
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
  const texts = L.cards[card.rank];
  const box = $('#result');
  box.innerHTML = '';
  box.hidden = false;
  box.classList.remove('slide-up'); void box.offsetWidth; box.classList.add('slide-up');

  box.append(el('div', { class: 'kicker' }, fmt(T.drew, { name: currentPlayer().name, rank: L.rankNames[card.rank], suit: L.suitNames[card.suit] })));

  if (rule.kind === 'drink') SFX.cheers();
  switch (rule.kind) {
    case 'drink': renderDrink(box, rule, texts, data); break;
    case 'gift': renderGift(box, texts); break;
    case 'penitencia': renderPenitencia(box, data); break;
    case 'minigame': renderMinigame(box, rule, data); break;
    case 'king': renderKing(box, data); break;
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function nextButton(summary, label = T.next) {
  return el('div', { class: 'actions' }, el('button', { class: 'btn', onClick: () => nextTurn(summary) }, label));
}

function drinkerChips(indexes) {
  return el('div', { class: 'drinkers' }, ...indexes.map((i, k) => el('span', { class: 'chip chip--hot', style: `animation-delay:${k * 70}ms` }, '🍺 ', state.players[i].name)));
}

function renderDrink(box, rule, texts, data) {
  const targets = data.targets || resolveTargets(rule.targets);
  const genderKey = rule.targets === 'men' ? 'm' : rule.targets === 'women' ? 'f' : null;
  const fallback = genderKey && targets.length === 1 && targets[0] === state.turn
    && !state.players.some(p => p.gender === genderKey || p.gender === 'x');
  box.append(
    el('h2', { class: 'display display--md title' }, texts.title),
    el('p', { class: 'text' }, fallback ? (genderKey === 'm' ? T.noMen : T.noWomen) : texts.text),
    drinkerChips(targets),
    nextButton({ drinkers: targets, title: T.hoCheers }),
  );
}

function renderGift(box, texts) {
  const counts = state.players.map(() => 0);
  const total = () => counts.reduce((a, b) => a + b, 0);
  const status = el('p', { class: 'text' }, fmt(T.giftLeft, { n: SORBOS }));
  const done = el('button', { class: 'btn', disabled: true, onClick: () => {
    counts.forEach((c, i) => { state.sorbos[i] += c; });
    nextTurn({ drinkers: counts.map((c, i) => c ? i : -1).filter(i => i >= 0), title: T.hoGift });
  } }, T.gifted);
  const picker = el('div', { class: 'picker' });
  const buttons = state.players.map((p, i) => {
    const count = el('span', { class: 'count' }, '');
    return el('button', { type: 'button', onClick: () => {
      if (total() >= SORBOS) { counts[i] = 0; } else { counts[i]++; }
      buttons.forEach((bb, j) => { bb.classList.toggle('on', counts[j] > 0); bb.querySelector('.count').textContent = counts[j] ? '🍺'.repeat(counts[j]) : ''; });
      const left = SORBOS - total();
      status.textContent = left === 0 ? T.giftDone : left === 1 ? T.giftLeftOne : fmt(T.giftLeft, { n: left });
      done.disabled = left > 0;
      vibrate(10);
    } }, p.name, count);
  });
  picker.append(...buttons);
  box.append(
    el('h2', { class: 'display display--md title' }, texts.title),
    el('p', { class: 'text' }, texts.text),
    status, picker,
    el('div', { class: 'actions' }, done),
  );
}

function renderPenitencia(box, data) {
  const text = el('div', { class: 'penitencia-text pop' }, data.penitencia);
  box.append(
    el('h2', { class: 'display display--md title' }, fmt(T.penitenciaFor, { name: currentPlayer().name })),
    text,
    el('button', { class: 'btn btn--ghost btn--sm', style: 'width:100%', onClick: () => {
      let p; do { p = pick(L.penitencias); } while (p === data.penitencia && L.penitencias.length > 1);
      data.penitencia = p; save(); SFX.dice();
      text.textContent = p; text.classList.remove('pop'); void text.offsetWidth; text.classList.add('pop');
    } }, T.otherPenitencia),
    el('div', { class: 'actions stack' },
      el('button', { class: 'btn btn--cyan', onClick: () => nextTurn({ drinkers: [], title: T.hoDone, emoji: '👏' }) }, T.done),
      el('button', { class: 'btn btn--ghost', onClick: () => { state.sorbos[state.turn] += SORBOS; nextTurn({ drinkers: [state.turn], title: T.hoChickened }); } }, fmt(T.chickened, { n: SORBOS })),
    ),
  );
}

function renderMinigame(box, rule, data) {
  const mg = L.minigames[rule.game];
  box.append(
    el('h2', { class: 'display display--md title' }, `${mg.emoji} ${mg.name}`),
    el('p', { class: 'text' }, mg.intro),
    el('ul', { class: 'mini-rules' }, ...mg.rules.map(r => el('li', {}, r))),
  );
  if (mg.helper === 'timer') box.append(timerHelper());
  if (mg.helper === 'category') box.append(categoryHelper(data));
  if (mg.helper === 'nunca') box.append(nuncaHelper());
  if (mg.helper === 'none') box.append(el('div', { class: 'helper' }, el('div', { class: 'big' }, T.chanchoBig), el('div', { class: 'muted' }, T.chanchoHint)));

  const picker = el('div', { class: 'picker' });
  picker.append(...state.players.map((p, i) => el('button', { type: 'button', onClick: () => {
    stopTimer();
    state.sorbos[i] += SORBOS;
    nextTurn({ drinkers: [i], title: T.hoLost });
  } }, `😵 ${p.name}`)));
  box.append(
    el('div', { class: 'actions' },
      el('p', { class: 'text', style: 'margin-bottom:4px' }, fmt(T.whoLost, { n: SORBOS })),
      picker,
      el('button', { class: 'btn btn--ghost', style: 'margin-top:10px', onClick: () => { stopTimer(); nextTurn({ drinkers: [], title: T.hoGoOn, emoji: '😎' }); } }, T.nobodyLost),
    ),
  );
}

function timerHelper(seconds = 5) {
  const display = el('div', { class: 'timer' }, `${seconds}`);
  const label = el('div', { class: 'muted' }, T.timerHint);
  let remaining = seconds;
  const start = el('button', { class: 'btn btn--cyan btn--sm', style: 'margin-top:8px', onClick: () => {
    stopTimer();
    remaining = seconds; display.textContent = remaining; display.classList.remove('alarm');
    timerHandle = setInterval(() => {
      remaining--;
      display.textContent = remaining > 0 ? remaining : T.timeUp;
      if (remaining <= 0) { stopTimer(); display.classList.add('alarm'); vibrate([80, 60, 80, 60, 200]); SFX.timeUp(); }
      else SFX.tick();
    }, 1000);
  } }, T.timerStart);
  return el('div', { class: 'helper' }, display, label, start);
}

function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }

function categoryHelper(data) {
  const cat = el('div', { class: 'big pop' }, data.category);
  return el('div', { class: 'helper' },
    el('div', { class: 'muted' }, T.suggestedCategory),
    cat,
    el('button', { class: 'btn btn--ghost btn--sm', onClick: () => {
      let c; do { c = pick(L.categorias); } while (c === data.category);
      data.category = c; save(); SFX.dice(); cat.textContent = c; cat.classList.remove('pop'); void cat.offsetWidth; cat.classList.add('pop');
    } }, T.otherCategory),
  );
}

function nuncaHelper() {
  const quote = el('div', { class: 'quote', hidden: true });
  const btn = el('button', { class: 'btn btn--ghost btn--sm', onClick: () => {
    quote.hidden = false; quote.textContent = pick(L.nuncaNunca); btn.textContent = T.otherIdea; SFX.dice();
    quote.classList.remove('pop'); void quote.offsetWidth; quote.classList.add('pop');
  } }, T.noIdeas);
  return el('div', { class: 'helper' }, el('div', { class: 'muted' }, fmt(T.nuncaStarts, { name: currentPlayer().name })), quote, btn);
}

function renderKing(box, data) {
  const k = data.kingNumber;
  const msg = L.kings[k - 1];
  renderCrowns();
  vibrate(k === 4 ? [100, 50, 100, 50, 300] : [40, 30, 40]);
  if (k === 4) {
    SFX.fourthKing();
    confetti({ count: 220, duration: 3500 });
    box.append(
      el('h2', { class: 'display display--lg title gold' }, msg.title),
      el('p', { class: 'text' }, msg.text),
      drinkerChips([state.turn]),
      el('div', { class: 'actions' }, el('button', { class: 'btn btn--yellow', onClick: () => finishGame(state.turn) }, T.seeResult)),
    );
  } else {
    SFX.king();
    box.append(
      el('h2', { class: 'display display--md title gold' }, msg.title),
      el('p', { class: 'text' }, msg.text),
      el('div', { class: 'chips', style: 'justify-content:center' }, el('span', { class: 'chip chip--gold' }, fmt(T.kingsCount, { k }))),
      nextButton({ drinkers: [], title: fmt(T.hoKings, { k }), emoji: '👑' }),
    );
  }
}

/**
 * Cierra la carta actual y muestra la transición entre turnos:
 *  1) "¡Salud!" con quiénes toman (avanza solo o al tocar),
 *  2) "Pásale el celular a X" con botón para que el siguiente jugador confirme.
 * El estado avanza de inmediato (por si se cierra el navegador); la mesa se redibuja detrás del overlay.
 */
function nextTurn(summary = { drinkers: [], title: T.hoReady }) {
  stopTimer();
  state.current = null;
  state.turn = (state.turn + 1) % n();
  save();
  renderTable();
  showHandoff(summary);
}

function showHandoff({ drinkers = [], title = T.hoCheers, emoji } = {}) {
  const box = $('#handoff');
  box.hidden = false; box.className = 'handoff'; box.innerHTML = '';
  let timer = null;

  const stageDrink = el('div', { class: 'stage pop' },
    emoji ? el('div', { class: 'cheers' }, el('span', {}, emoji)) : el('div', { class: 'cheers' }, el('span', { class: 'l' }, '🍺'), el('span', { class: 'r' }, '🍺')),
    el('div', { class: 'title gold' }, title),
    drinkers.length ? drinkerChips(drinkers) : null,
    drinkers.length ? el('div', { class: 'hint' }, fmt(drinkers.length > 1 ? T.hoDrinkMany : T.hoDrinkOne, { n: SORBOS })) : null,
    el('div', { class: 'hint', style: 'margin-top:10px' }, T.hoTap),
  );

  const stagePass = el('div', { class: 'stage pop' },
    el('div', { class: 'phone' }, '📱'),
    el('div', { class: 'hint', style: 'font-size:1.05rem' }, T.hoPass),
    el('div', { class: 'next-name' }, currentPlayer().name),
    el('button', { class: 'btn btn--cyan', onClick: e => { e.stopPropagation(); closeHandoff(); } }, T.hoGiveCard),
  );

  const goPass = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (box.contains(stagePass)) return;
    box.innerHTML = ''; box.append(stagePass); vibrate(15); SFX.pass();
  };
  const closeHandoff = () => {
    box.classList.add('leaving');
    const card = $('#card');
    card.classList.remove('enter'); void card.offsetWidth; card.classList.add('enter');
    SFX.flip();
    setTimeout(() => { box.hidden = true; box.innerHTML = ''; }, 300);
  };

  box.append(stageDrink);
  box.onclick = goPass;
  vibrate(drinkers.length ? [30, 40, 30] : 20);
  if (drinkers.length) SFX.drink();
  timer = setTimeout(goPass, drinkers.length ? 2600 : 1800);
}

/* ------------------------------------------------------------------ */
/* Final                                                               */
/* ------------------------------------------------------------------ */
function finishGame(victimIndex) {
  stopTimer();
  state.finished = true;
  state.current = null;
  save();
  $('#end-victim').textContent = victimIndex === null ? T.deckOver : state.players[victimIndex].name;
  const ranking = $('#ranking');
  ranking.innerHTML = '';
  const order = state.players.map((p, i) => ({ ...p, i, sorbos: state.sorbos[i], fondos: state.fondos[i] }))
    .sort((a, b) => (b.sorbos + b.fondos * 10) - (a.sorbos + a.fondos * 10));
  order.forEach((p, pos) => {
    ranking.append(el('li', { class: pos === 0 ? 'top' : '' },
      el('span', { class: 'pos' }, ['🥇', '🥈', '🥉'][pos] || `${pos + 1}.`),
      el('span', {}, p.name, p.fondos ? ' 👑' : ''),
      el('span', { class: 'sorbos' }, fmt(T.sips, { n: p.sorbos }) + (p.fondos ? T.plusChug : '')),
    ));
  });
  const mins = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
  $('#end-stats').textContent = fmt(T.endStats, { cards: state.drawn, mins });
  showScreen('screen-end');
  SFX.win();
  confetti({ count: 260, duration: 4000 });
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
  // Click suave en todos los botones (excepto la carta, que tiene su propio sonido).
  document.addEventListener('click', e => { if (e.target.closest('.btn, .picker button, .gender button, .lang-toggle button')) SFX.tap(); });
  sparkles(14);
  renderRulesList();
  renderResumeSlot();
  $('#btn-go-setup').addEventListener('click', enterSetup);
  $('#btn-add-player').addEventListener('click', () => { if (draft.length < MAX_PLAYERS) { draft.push({ name: '', gender: 'm' }); renderPlayersForm(); setTimeout(() => $$('#players-form input').at(-1)?.focus(), 50); } });
  $('#btn-start').addEventListener('click', () => {
    const { error, players } = validateDraft();
    const err = $('#form-error');
    if (error) { err.textContent = error; err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); vibrate([30, 30, 30]); SFX.error(); return; }
    err.textContent = '';
    clearSaved();
    startGame(players);
  });
  $('#card').addEventListener('click', drawCard);
  $('#btn-again').addEventListener('click', () => startGame(state.players));
  $('#btn-change-players').addEventListener('click', () => { clearSaved(); enterSetup(); });
}

init();
