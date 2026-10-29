/**
 * El Camaleón — state machine and drawing (C-2). The rules are in engine.js, the texts in rules.js.
 * Screens: intro → setup → topic → card (the phone goes around) → table (clues, vote, guess,
 * result) → topic … → end. The whole game is saved to resume it (C-6). Lab only (#898).
 */
import { $, $$, el, vibrate, sparkles, keepAwake, confetti } from '../../assets/js/ui.js';
import { getLang, langToggle, applyStatic } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore, createNameStore } from '../../assets/js/session.js';
import { showHandoff, passBlock } from '../../assets/js/handoff.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { ponerBuzon } from '../../assets/js/buzon.js';
import { GAME_ID, MIN_PLAYERS, MAX_PLAYERS, TOPIC_IDS, TOPIC_EMOJI, LOCALES } from './rules.js';
import * as E from './engine.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const nameStore = createNameStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
const listNames = names => (names.length > 1 ? names.slice(0, -1).join(', ') + T.and + names.at(-1) : names[0] || '');

let state = null;
let draft = [];

const save = () => store.save({ mode: 'local', state });
const name = seat => state.players[seat]?.name || '?';
const words = () => L.topics[state.r.topic].words;
const topicTitle = t => `${TOPIC_EMOJI[t]} ${L.topics[t].name}`;

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ------------------------------------------------------------------ */
/* Intro and setup                                                     */
/* ------------------------------------------------------------------ */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = E.fromSaved(store.load());
  if (!saved || saved.winners || !saved.r) return;
  slot.append(el('div', { class: 'panel pop', id: 'resume' },
    el('p', { class: 'lead', style: 'margin-bottom:4px' }, T.resumeTitle),
    el('p', { class: 'muted' }, fmt(T.resumeText, { round: saved.round, names: listNames(saved.players.map(p => p.name)) })),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-resume', onClick: () => { state = saved; resume(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function enterSetup() {
  const remembered = nameStore.list() || [];
  draft = remembered.length >= MIN_PLAYERS ? remembered.map(p => p?.name || p).slice(0, MAX_PLAYERS) : Array(4).fill('');
  renderPlayersForm();
  $('#form-error').textContent = '';
  showScreen('screen-setup');
}

function renderPlayersForm() {
  const form = $('#players-form');
  form.innerHTML = '';
  draft.forEach((v, i) => {
    const input = el('input', {
      type: 'text', placeholder: fmt(T.playerPlaceholder, { n: i + 1 }), value: v, maxlength: 14, autocomplete: 'off', enterkeyhint: 'next',
      onInput: e => { draft[i] = e.target.value; },
      onKeydown: e => { if (e.key === 'Enter') { const next = $$('#players-form input')[i + 1]; next ? next.focus() : e.target.blur(); } },
    });
    form.append(el('div', { class: 'player-row' },
      el('span', { class: 'num' }, String(i + 1)), input,
      el('button', { class: 'del', type: 'button', 'aria-label': T.removePlayer, disabled: draft.length <= MIN_PLAYERS,
        onClick: () => { draft.splice(i, 1); renderPlayersForm(); } }, '✕'),
    ));
  });
  $('#btn-add-player').hidden = draft.length >= MAX_PLAYERS;
}

function startGame(names) {
  nameStore.setList(names.map(n => ({ name: n })));
  state = E.newGame(names);
  trackStart({ game: GAME_ID, mode: 'local', players: names.length, nombres: names }); // usage signal (D-210)
  keepAwake();
  save();
  enterTopic();
}

/* ------------------------------------------------------------------ */
/* Topic                                                               */
/* ------------------------------------------------------------------ */
function enterTopic() {
  $('#topic-round').textContent = fmt(T.roundLabel, { n: state.round + 1 });
  const box = $('#topics');
  box.innerHTML = '';
  box.append(el('button', { class: 'btn btn--yellow', id: 'btn-topic-random', onClick: () => pickTopic(E.randomTopic(state.lastTopic)) }, T.topicRandom));
  for (const t of TOPIC_IDS) box.append(el('button', { class: 'btn btn--ghost topic', 'data-topic': t, onClick: () => pickTopic(t) }, topicTitle(t)));
  showScreen('screen-topic');
}

function pickTopic(topic) {
  E.startRound(state, topic);
  save();
  passCard();
}

/* ------------------------------------------------------------------ */
/* The cards: the phone goes around, the secret stays covered (C-9)   */
/* ------------------------------------------------------------------ */
function passCard() {
  showScreen('screen-card');
  $('#card-face').hidden = true;
  const pb = passBlock({ label: T.passTo, name: name(E.cardHolder(state)), button: T.seeCard });
  showHandoff([pb], showCard, { tapAdvances: false });
  SFX.pass();
}

function showCard() {
  const seat = E.cardHolder(state);
  const secret = E.cardFor(state, seat);
  $('#card-topic').textContent = topicTitle(state.r.topic);
  const box = $('#card-secret');
  box.innerHTML = '';
  if (secret === null) {
    box.append(el('div', { class: 'big-lizard' }, '🦎'), el('div', { class: 'secret-word chameleon' }, T.youAreChameleon), el('p', { class: 'muted' }, T.chameleonHint));
  } else {
    box.append(el('p', { class: 'muted', style: 'margin:0' }, T.yourWord), el('div', { class: 'secret-word' }, words()[secret]));
  }
  $('#card-face').hidden = false;
  SFX.reveal(); vibrate(20);
}

function hideCard() {
  $('#card-face').hidden = true;
  E.cardSeen(state);
  save();
  if (state.r.phase === 'cards') passCard();
  else enterTable();
}

/* ------------------------------------------------------------------ */
/* The table                                                           */
/* ------------------------------------------------------------------ */
function renderGrid() {
  const r = state.r;
  const grid = $('#grid');
  grid.innerHTML = '';
  grid.classList.toggle('pick', r.phase === 'guess');
  words().forEach((w, i) => {
    const cls = ['cell'];
    if (r.phase === 'result' && i === r.secret) cls.push('secret');
    if (r.phase === 'result' && i === r.guess && r.guess !== r.secret) cls.push('miss');
    grid.append(r.phase === 'guess'
      ? el('button', { class: cls.join(' '), type: 'button', lang, 'data-i': i, onClick: () => doGuess(i) }, w)
      : el('div', { class: cls.join(' '), lang, 'data-i': i }, w));
  });
}

function enterTable() {
  const r = state.r;
  $('#table-round').textContent = fmt(T.roundLabel, { n: state.round });
  $('#table-topic').textContent = topicTitle(r.topic);
  renderGrid();
  const step = $('#step');
  step.innerHTML = '';
  step.dataset.phase = r.phase;
  if (r.phase === 'clues') {
    step.append(el('p', { class: 'lead' }, T.cluesTitle), el('p', { class: 'muted' }, fmt(T.cluesText, { name: name(r.starter) })),
      el('button', { class: 'btn btn--yellow', id: 'btn-vote', onClick: () => { E.toVote(state); save(); enterTable(); } }, T.goVote));
  } else if (r.phase === 'vote') {
    step.append(el('p', { class: 'lead' }, T.voteTitle), el('p', { class: 'muted' }, fmt(T.voteText, { name: name(r.starter) })),
      el('div', { class: 'suspects' }, state.players.map((p, i) => el('button', { class: 'btn btn--ghost btn--sm', 'data-seat': i, onClick: () => doAccuse(i) }, p.name))));
  } else if (r.phase === 'guess') {
    step.append(el('p', { class: 'lead' }, fmt(T.caughtTitle, { name: name(r.chameleon) })), el('p', { class: 'muted' }, fmt(T.guessText, { name: name(r.chameleon) })));
  } else {
    step.append(...resultBlock(), scoreList(),
      el('button', { class: 'btn btn--yellow', id: 'btn-next', onClick: enterTopic }, T.nextRound));
  }
  showScreen('screen-table');
}

function resultBlock() {
  const r = state.r;
  const title = { escaped: T.resultEscaped, guessed: T.resultGuessed, caught: T.resultCaught }[r.outcome];
  const line = { escaped: T.resultWhoEscaped, guessed: T.resultWhoGuessed, caught: T.resultWhoCaught }[r.outcome];
  return [
    el('p', { class: 'lead result-title' }, title),
    el('p', { class: 'muted', id: 'result-line' }, fmt(line, { name: name(r.chameleon), accused: name(r.accused), guess: r.guess === null ? '' : words()[r.guess] })),
    el('p', { class: 'secret-was' }, `${T.secretWas}: `, el('b', {}, words()[r.secret])),
  ];
}

function scoreList(id = 'scores') {
  return el('ol', { class: 'ranking', id }, E.standings(state).map(p => el('li', {},
    el('span', {}, p.name), el('span', { class: 'pts' }, p.score === 1 ? T.point : fmt(T.points, { n: p.score })))));
}

function doAccuse(seat) {
  E.accuse(state, seat);
  save();
  if (state.r.phase === 'guess') { SFX.siren(); vibrate([40, 40, 40]); enterTable(); } else afterRound();
}

function doGuess(i) {
  E.guess(state, i);
  save();
  afterRound();
}

function afterRound() {
  if (state.r.outcome === 'caught') SFX.win(); else SFX.reveal();
  if (state.winners) return finishGame();
  enterTable();
}

/* ------------------------------------------------------------------ */
/* End                                                                 */
/* ------------------------------------------------------------------ */
function finishGame() {
  const w = state.winners.map(name);
  trackFinish({ ganador: w.length === 1 ? w[0] : null, empate: w.length > 1, detalle: `${state.round} rondas` });
  $('#end-title').textContent = w.length === 1 ? fmt(T.winnerTitle, { name: w[0] }) : fmt(T.winnerTie, { names: listNames(w) });
  $('#end-ranking').replaceWith(scoreList('end-ranking'));
  showScreen('screen-end');
  ponerBuzon($('#screen-end'), { juego: GAME_ID }); // the quiet inbox link after the buttons (D-345)
  SFX.win();
  confetti({ count: 200, duration: 3000 });
}

function resume() {
  const r = state.r;
  if (state.winners) return finishGame();
  if (!r) return enterTopic();
  if (r.phase === 'cards') return passCard();
  enterTable();
}

/* ------------------------------------------------------------------ */
/* Start                                                               */
/* ------------------------------------------------------------------ */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(langToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  document.addEventListener('click', e => { if (e.target.closest('.btn, .cell, .lang-toggle button')) SFX.tap(); });
  sparkles(12);
  renderResumeSlot();
  $('#end-exits').append(salidasFin('suelto', { lang, raiz: '../../' }));
  $('#btn-go-setup').addEventListener('click', enterSetup);
  $('#btn-add-player').addEventListener('click', () => {
    if (draft.length >= MAX_PLAYERS) return;
    draft.push(''); renderPlayersForm(); setTimeout(() => $$('#players-form input').at(-1)?.focus(), 50);
  });
  $('#btn-start').addEventListener('click', () => {
    const { error, names } = E.validateNames(draft);
    const err = $('#form-error');
    if (error) {
      err.textContent = error === 'repeated' ? T.errorRepeated : T.errorFew;
      err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake'); vibrate([30, 30, 30]); SFX.error();
      return;
    }
    store.clear();
    startGame(names);
  });
  $('#btn-hide-card').addEventListener('click', hideCard);
  $('#btn-again').addEventListener('click', () => { store.clear(); startGame(state.players.map(p => p.name)); });
  $('#btn-change-players').addEventListener('click', () => { store.clear(); enterSetup(); });
}

init();

// Read-only hook for the automated tests (C-14): copies, not the live state.
window.__camaleon = {
  state: () => (state ? structuredClone(state) : null),
  screen: () => document.querySelector('.screen.active')?.id || null,
  saved: () => store.load(),
};
