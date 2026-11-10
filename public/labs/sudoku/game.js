/**
 * Sudoku: state machine and drawing (C-2), the only file that touches the DOM. The rules and the
 * generator are in engine.js, the texts in rules.js. Screens: intro (the three levels) → play (the
 * board, the pad and the clock) → result. The game is saved after every move to resume it (C-6),
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
  if (state) $('#level-line').textContent = fmt(T.levelLine, { level: `${LEVEL_EMOJI[state.level]} ${levelName(state.level)}`, time: mmss(elapsed()) });
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

function renderModes() {
  $('#modes').replaceChildren(...LEVELS.map(level => el('button', {
    class: 'mode', 'data-mode': 'solo', 'data-level': level, id: `btn-level-${level}`,
    onClick: () => { SFX.tap(); start(level); },
  }, el('span', {}, el('b', {}, `${LEVEL_EMOJI[level]} ${levelName(level)}`), el('small', {}, T.levelHints[level])), el('span', { class: 'go' }, '›'))));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function start(level) {
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
  const bad = E.conflicts(state);
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
  $('#hint').textContent = sel < 0 ? T.pickCell : '';
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
  if (E.conflicts(state).has(selected)) vibrate(60);
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
  if (E.isOver(state)) {
    stopClock();
    save();
    trackFinish({ nivel: state.level, segundos: Math.round(state.elapsed / 1000) });
    return renderResult();
  }
  save();
  drawBoard();
}

// A keyboard on a computer: digits, arrows, Backspace; N toggles the notes
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
  $('#result-title').textContent = T.solved;
  $('#result-line').textContent = fmt(T.solvedLine, { level: `${LEVEL_EMOJI[state.level]} ${level}`, time });
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); start(state.level); } }, fmt(T.again, { level: level.toLowerCase() })),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({
        titulo: T.title, url: location.origin + location.pathname,
        texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: T.shareContext }), fmt(T.shareText, { level: level.toLowerCase(), time })].join('\n\n'),
      }),
    }),
    el('button', { class: 'btn btn--ghost', id: 'btn-levels', onClick: () => { SFX.tap(); renderResumeSlot(); showScreen('screen-intro'); } }, T.otherLevel));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  confetti();
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
  $('#btn-erase').addEventListener('click', eraseCell);
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
