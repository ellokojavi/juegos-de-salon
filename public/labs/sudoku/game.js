/**
 * Sudoku: state machine and drawing (C-2), the only file that touches the DOM. The rules and the
 * generator are in engine.js, the texts in rules.js. Screens: intro (the two levels) → play (the
 * board, the pad, the clock and the score) → result. The game is saved after every move to resume it (C-6),
 * with the time played. Lab only (D-395). `?seed=` fixes the puzzle (tests, a shared board).
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { botonCompartir, cabecera } from '../../assets/js/compartir.js';
import { mmss } from '../../assets/js/time-format.js';
import { GAME_ID, LEVELS, LEVEL_EMOJI, LOCALES } from './rules.js';
import * as E from './engine.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/sudoku.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const SEED = new URLSearchParams(location.search).get('seed');
const levelName = level => T.levels[level] || level;

let state = null;
let selected = -1;      // the cell the pad writes to
let notesMode = false;
let since = 0;          // when the clock last started (ms), 0 while stopped
let ticker = 0;
let flash = 0;
let giveUpArmed = false, giveUpTimer = 0;
function disarmGiveUp() {
  giveUpArmed = false; clearTimeout(giveUpTimer);
  const b = $('#btn-give-up');
  b.classList.remove('armado'); b.textContent = T.giveUp;
}          // a notice in the hint line, for a moment

function say(text) {
  clearTimeout(flash);
  $('#hint').textContent = text;
  flash = setTimeout(() => { flash = 0; if (state && !E.isOver(state)) drawBoard(); }, 1800);
}

const elapsed = () => (state ? state.elapsed + (since ? Date.now() - since : 0) : 0);
const save = () => store.save({ mode: 'solo', state: { ...state, elapsed: elapsed() }, done: !!state && E.isOver(state) });

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (id === 'screen-play') startClock(); else stopClock();
}

/* ---------------- The clock: it runs only while the board is showing ---------------- */
function startClock() {
  if (!state || E.isOver(state) || since) return;
  since = Date.now();
  clearInterval(ticker);
  ticker = setInterval(drawClock, 1000);
  drawClock();
}
function stopClock() {
  if (since && state) state = { ...state, elapsed: elapsed() };
  since = 0;
  clearInterval(ticker);
}
function drawClock() {
  if (!state) return;
  $('#level-line').textContent = fmt(T.levelLine, { level: `${LEVEL_EMOJI[state.level]} ${levelName(state.level)}`, time: mmss(elapsed()) });
  $('#score-line').textContent = fmt(T.scoreLine, { score: E.score(state) });
}
document.addEventListener('visibilitychange', () => {
  if (!state || !$('#screen-play').classList.contains('active')) return;
  if (document.hidden) { stopClock(); save(); } else startClock();
});
addEventListener('pagehide', () => { if (state && !E.isOver(state)) save(); });

/* ---------------- Intro ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !saved.state || !Array.isArray(saved.state.cells)) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('p', { class: 'muted' }, fmt(T.levelLine, { level: `${LEVEL_EMOJI[saved.state.level]} ${levelName(saved.state.level)}`, time: mmss(saved.state.elapsed) })),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { SFX.tap(); state = saved.state; selected = -1; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

/**
 * The level is a lever, the same one as Pintaminas' hard mode (the owner's request): down and green is
 * easy, up and red is hard. ¡A jugar! starts a board of the level it shows.
 */
let chosen = 'easy';
function renderModes() {
  const hard = chosen === 'hard';
  const title = el('b', {}, T.switch[+hard].title), sub = el('span', { class: 'muted' }, T.switch[+hard].sub);
  const lever = el('button', {
    type: 'button', class: 'sd-lever' + (hard ? ' on' : ''), id: 'btn-level', role: 'switch',
    'aria-checked': String(hard), 'aria-label': T.switch[1].title,
    onClick: () => {
      chosen = chosen === 'hard' ? 'easy' : 'hard';
      const on = chosen === 'hard';
      SFX.tap(); vibrate(on ? [15, 30, 15] : 10);
      lever.classList.toggle('on', on);
      lever.setAttribute('aria-checked', String(on));
      title.textContent = T.switch[+on].title; sub.textContent = T.switch[+on].sub;
    },
  },
  el('span', { class: 'sd-plate', 'aria-hidden': 'true' },
    el('span', { class: 'sd-track', html: '<svg viewBox="0 0 70 60"><path class="sd-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'sd-arm' }, el('span', { class: 'sd-knob' })), el('span', { class: 'sd-axle' })),
  el('span', { class: 'sd-label' }, title, sub));
  $('#modes').replaceChildren(lever,
    el('button', { class: 'btn btn--yellow', id: 'btn-play', 'data-mode': 'solo', onClick: () => { SFX.tap(); start(chosen); } }, T.play));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function start(level) {
  chosen = level;
  state = E.newGame(level, SEED ? `${SEED}:${level}` : Date.now());
  selected = -1; notesMode = false;
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1, nivel: level }); // usage signal (C-7, D-210)
  renderPlay();
}

/* ---------------- Play ---------------- */
function buildBoard() {
  $('#board').replaceChildren(...[...Array(81)].map((_, i) => el('button', {
    type: 'button', class: 'cell', 'data-i': i,
    'data-r': Math.floor(i / 9), 'data-c': i % 9,
    onClick: () => select(i),
  })));
  $('#pad').replaceChildren(...[...Array(9)].map((_, k) => el('button', {
    type: 'button', class: 'key', 'data-d': k + 1, id: `key-${k + 1}`, onClick: () => press(k + 1),
  }, el('b', {}, String(k + 1)), el('small', {}))));
}

function drawBoard() {
  const bad = new Set([...E.conflicts(state), ...E.wrong(state)]);
  const sel = selected >= 0 ? selected : -1;
  const selDigit = sel >= 0 ? state.cells[sel] : 0;
  const n = E.counts(state);
  $$('#board .cell').forEach(cell => {
    const i = +cell.dataset.i, d = state.cells[i];
    const peer = sel >= 0 && (E.PEERS[sel].includes(i));
    cell.className = 'cell'
      + (E.isGiven(state, i) ? ' given' : d ? ' mine' : '')
      + (i === sel ? ' sel' : peer ? ' peer' : '')
      + (selDigit && d === selDigit && i !== sel ? ' same' : '')
      + (bad.has(i) ? ' bad' : '');
    if (d) cell.replaceChildren(String(d));
    else if (state.notes[i]) cell.replaceChildren(el('span', { class: 'notes' }, ...[...Array(9)].map((_, k) => el('i', {}, E.hasNote(state, i, k + 1) ? String(k + 1) : ''))));
    else cell.replaceChildren();
  });
  $$('#pad .key').forEach(key => {
    const d = +key.dataset.d, left = 9 - n[d];
    key.classList.toggle('full', left <= 0);
    key.querySelector('small').textContent = left > 0 ? String(left) : '✓';
  });
  const notesBtn = $('#btn-notes');
  notesBtn.classList.toggle('on', notesMode);
  notesBtn.setAttribute('aria-pressed', String(notesMode));
  $('#btn-undo').disabled = !state.history.length;
  if (!flash) $('#hint').textContent = sel < 0 ? T.pickCell : '';
  drawClock();
}

function renderPlay() {
  if (E.isOver(state)) return renderResult();
  if (!$('#board').children.length) buildBoard();
  drawBoard();
  showScreen('screen-play');
  drawClock();
}

function select(i) {
  selected = i;
  SFX.tap();
  drawBoard();
}

function press(d) {
  if (selected < 0 || E.isGiven(state, selected)) { vibrate(30); return; }
  const before = state;
  state = notesMode && !state.cells[selected] ? E.toggleNote(state, selected, d) : E.setDigit(state, selected, d);
  if (state === before) return;
  SFX.tap();
  const missed = state.mistakes > (before.mistakes || 0);
  if (missed) { vibrate(80); say(T.mistake); }
  afterMove();
}

function eraseCell() {
  if (selected < 0) return;
  const before = state;
  state = E.erase(state, selected);
  if (state !== before) { SFX.tap(); afterMove(); }
}

function undoMove() {
  const before = state;
  state = E.undo(state);
  if (state !== before) { SFX.tap(); afterMove(); }
}

function afterMove() {
  if (giveUpArmed) disarmGiveUp();
  if (E.isOver(state)) {
    stopClock();
    save();
    trackFinish({ nivel: state.level, segundos: Math.round(state.elapsed / 1000), puntaje: E.score(state), errores: state.mistakes || 0, rendido: !!state.gaveUp });
    return renderResult();
  }
  save();
  drawBoard();
}

// A keyboard on a computer: digits, arrows, Backspace erases; N toggles the notes. On a phone, the
// same digit again empties a cell (there is no erase button: the owner swapped it for Give up)
document.addEventListener('keydown', e => {
  if (!state || !$('#screen-play').classList.contains('active') || e.metaKey || e.ctrlKey || e.altKey) return;
  const move = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
  if (move) { e.preventDefault(); select(selected < 0 ? 40 : (selected + move + 81) % 81); }
  else if (/^[1-9]$/.test(e.key)) press(+e.key);
  else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') eraseCell();
  else if (e.key.toLowerCase() === 'n') { notesMode = !notesMode; drawBoard(); }
});

/* ---------------- Result (C-19) ---------------- */
function renderResult() {
  const time = mmss(state.elapsed);
  const level = levelName(state.level);
  const gaveUp = !!state.gaveUp;
  $('#result-title').textContent = gaveUp ? T.gaveUp : T.solved;
  $('.result-hero .trophy').textContent = gaveUp ? '🏳️' : '🧠';
  const points = E.score(state), n = state.mistakes || 0;
  $('#result-score').textContent = fmt(T.scoreResult, { score: points });
  $('#result-line').textContent = fmt(T.solvedLine, { level: `${LEVEL_EMOJI[state.level]} ${level}`, time });
  // Giving up: the title and the 0 already say it (U-8), so no detail line under them
  $('#result-detail').textContent = gaveUp ? '' : n ? fmt(T.scoreDetailMistakes, { n }) : T.scoreDetail;
  $('#result-detail').hidden = gaveUp;
  // On giving up, the solution, under the exits (C-19): the givens in white, the rest in cyan
  const solution = $('#result-board');
  solution.hidden = !gaveUp;
  $('#solution-title').hidden = !gaveUp;
  $('#solution-title').textContent = gaveUp ? T.solutionTitle : '';
  solution.replaceChildren(...(gaveUp ? state.solution.map((d, i) => el('span', { class: 'cell' + (E.isGiven(state, i) ? ' given' : ''), 'data-r': Math.floor(i / 9), 'data-c': i % 9 }, String(d))) : []));
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); start(state.level); } }, fmt(T.again, { level: level.toLowerCase() })),
    // Sharing tells a solved board: giving up has nothing to share
    ...(gaveUp ? [] : [botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({
        titulo: T.title, url: location.origin + location.pathname,
        texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: T.shareContext }), fmt(T.shareText, { level: level.toLowerCase(), time, score: points })].join('\n\n'),
      }),
    })]),
    el('button', { class: 'btn btn--ghost', id: 'btn-levels', onClick: () => { SFX.tap(); renderModes(); renderResumeSlot(); showScreen('screen-intro'); } }, T.otherLevel));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  if (!gaveUp) confetti();
  showScreen('screen-result');
}

/* ---------------- Start ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  $('#btn-notes').addEventListener('click', () => { SFX.tap(); notesMode = !notesMode; drawBoard(); });
  // Giving up asks twice (U-15): the first tap arms it for 3 s, as in Pintaminas and Dominorama
  const giveUpBtn = $('#btn-give-up');
  giveUpBtn.addEventListener('click', () => {
    if (!state || E.isOver(state)) return;
    if (!giveUpArmed) {
      giveUpArmed = true; SFX.tap(); vibrate(15);
      giveUpBtn.textContent = T.giveUpSure; giveUpBtn.classList.add('armado');
      giveUpTimer = setTimeout(disarmGiveUp, 3000);
      return;
    }
    disarmGiveUp();
    state = E.giveUp(state);
    afterMove();
  });
  $('#btn-undo').addEventListener('click', undoMove);
  renderModes();
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14): the state, and a way to fill the board
window.__sudoku = {
  state: () => state,
  start,
  play: (i, d) => { selected = i; notesMode = false; press(d); },
  solveAllBut: (left = 1) => {
    const empty = state.cells.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
    for (const i of empty.slice(0, Math.max(0, empty.length - left))) state = E.setDigit(state, i, state.solution[i]);
    save(); drawBoard();
  },
};
init();
