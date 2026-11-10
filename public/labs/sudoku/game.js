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
import { bloqueTabla, avisoPartida } from '../../assets/js/ranking.js';
import { rankingsVisibles } from '../../assets/js/jugador.js';
import { tablaId } from '../../assets/js/records.js';
import { onScreen } from '../../assets/js/on-screen.js';
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
let flash = 0;          // a notice in the hint line, for a moment

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
  setTheme();
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
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { SFX.tap(); state = saved.state; chosen = state.level; selected = -1; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

/* ---------------- The cover's demo: a board that solves itself ---------------- */
/**
 * A real solved board with six holes, each the only one in its row, column and box. In turn, each hole
 * lights its row, its column and its box, saying the rule, and then the digit that fits pops in. When the
 * six are in, a pause and it starts again. It sleeps off screen (onScreen, #883) and stands still, solved,
 * with reduced motion.
 */
const DEMO_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'.split('').map(Number);
const DEMO_HOLES = [0, 16, 31, 42, 64, 62]; // rows 0 1 3 4 7 6, columns 0 7 4 6 1 8, six different boxes
const QUIET = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const STEP_MS = 950;
const PHASES = ['row', 'col', 'box', 'fill'];
let demoStarted = false;
function startDemo() {
  if (demoStarted) return;
  demoStarted = true;
  const box = $('#demo'), caption = $('#demo-caption');
  const cells = DEMO_SOLUTION.map((d, i) => el('span', { class: 'sd-dcell', 'data-r': Math.floor(i / 9), 'data-c': i % 9 }, DEMO_HOLES.includes(i) ? '' : String(d)));
  box.replaceChildren(...cells);
  if (QUIET()) {
    DEMO_HOLES.forEach(i => { cells[i].textContent = String(DEMO_SOLUTION[i]); cells[i].classList.add('filled'); });
    caption.textContent = T.demo.row;
    return;
  }
  let t0 = 0;
  const total = (DEMO_HOLES.length * PHASES.length + 3) * STEP_MS;
  let last = -1;
  const frame = now => {
    if (!box.isConnected) return;
    if (!t0) t0 = now;
    const step = Math.floor(((now - t0) % total) / STEP_MS);
    if (step !== last) { last = step; paint(step); }
    next();
  };
  const next = onScreen(box, frame);
  function paint(step) {
    const k = Math.floor(step / PHASES.length), phase = PHASES[step % PHASES.length];
    cells.forEach(c => c.classList.remove('lit', 'target'));
    if (step === 0) DEMO_HOLES.forEach(i => { cells[i].textContent = ''; cells[i].classList.remove('filled', 'pop'); });
    if (k >= DEMO_HOLES.length) { caption.textContent = '🎉 ' + T.solved; box.classList.add('done'); return; }
    box.classList.remove('done');
    const i = DEMO_HOLES[k], r = Math.floor(i / 9), c = i % 9;
    const inUnit = j => {
      const jr = Math.floor(j / 9), jc = j % 9;
      if (phase === 'row') return jr === r;
      if (phase === 'col') return jc === c;
      if (phase === 'box') return Math.floor(jr / 3) === Math.floor(r / 3) && Math.floor(jc / 3) === Math.floor(c / 3);
      return false;
    };
    cells.forEach((cell, j) => cell.classList.toggle('lit', inUnit(j)));
    cells[i].classList.add('target');
    if (phase === 'fill') {
      cells[i].textContent = String(DEMO_SOLUTION[i]);
      cells[i].classList.add('filled', 'pop');
      caption.textContent = fmt(T.demo.fill, { d: DEMO_SOLUTION[i] });
    } else caption.textContent = T.demo[phase];
  }
  next();
}

/* ---------------- The best score per level, on this phone ---------------- */
const BEST_KEY = 'juegos-de-salon:sudoku:best';
function readBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; } catch (_) { return {}; } }
function saveBest(level, s, ms) {
  const all = readBest(), old = all[level];
  if (old && (old.s > s || (old.s === s && old.ms <= ms))) return false;
  all[level] = { s, ms };
  try { localStorage.setItem(BEST_KEY, JSON.stringify(all)); } catch (_) { /* no storage */ }
  return true;
}
function drawBest() {
  const b = readBest()[chosen], level = `${LEVEL_EMOJI[chosen]} ${levelName(chosen).toLowerCase()}`;
  $('#best-line').textContent = b ? fmt(T.best, { level, score: b.s, time: mmss(b.ms) }) : fmt(T.noBest, { level });
}

/* ---------------- The ranking: one table per level (sudoku_easy, sudoku_hard) ---------------- */
const table = level => tablaId(GAME_ID, level);
const rankingTitle = level => fmt(T.rankingOf, { level: `${LEVEL_EMOJI[level]} ${levelName(level).toLowerCase()}` });
function drawRanking() { $('#ranking').replaceChildren(bloqueTabla({ tabla: table(chosen), titulo: rankingTitle(chosen), alTocar: () => SFX.tap() })); }

/* ---------------- The level lever: Pintaminas' electric switch ---------------- */
/**
 * Down with a green knob is easy, up with a red knob is hard (the owner's request, the same lever as
 * Pintaminas' hard mode). Flipping it sends an electric wave around the plate and turns the whole cover
 * over: easy is the usual night, hard is a charged red-violet panel, with a flash over the view, sparks
 * and a glow that flickers like a bad contact. ¡A jugar! starts a board of the level it shows.
 */
let chosen = 'easy';
let flicker = 0;
function setTheme() {
  // The cover follows the lever; the board and the result follow the game's level
  const hard = $('#screen-intro').classList.contains('active') ? chosen === 'hard' : state?.level === 'hard';
  document.body.classList.toggle('sd-hard', hard);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hard ? '#2a0612' : '#150726');
}
function lightning() {
  if (QUIET()) return;
  const x = el('div', { class: 'sd-flash', 'aria-hidden': 'true' });
  document.body.append(x);
  setTimeout(() => x.remove(), 600);
}
function wave(lever, hard) {
  const w = el('span', { class: 'sd-wave' + (hard ? ' hard' : ''), 'aria-hidden': 'true' });
  lever.querySelector('.sd-plate').append(w);
  setTimeout(() => w.remove(), 900);
  lever.classList.remove('zap'); void lever.offsetWidth; lever.classList.add('zap');
}
function startFlicker(lever) {
  const n = ++flicker;
  if (QUIET()) return;
  const step = () => {
    if (n !== flicker || !lever.isConnected || chosen !== 'hard') { lever.style.removeProperty('--glow'); return; }
    const r = Math.random();
    const glow = r < 0.12 ? 0.05 + Math.random() * 0.2 : r < 0.3 ? 1 : 0.45 + Math.random() * 0.45;
    lever.style.setProperty('--glow', glow.toFixed(2));
    setTimeout(step, r < 0.3 ? 40 + Math.random() * 90 : 120 + Math.random() * 900);
  };
  step();
}
function renderModes() {
  const hard = chosen === 'hard';
  const title = el('b', {}, T.switch[+hard].title), sub = el('span', { class: 'muted' }, T.switch[+hard].sub);
  const lever = el('button', {
    type: 'button', class: 'sd-lever' + (hard ? ' on' : ''), id: 'btn-level', role: 'switch',
    'aria-checked': String(hard), 'aria-label': T.switch[1].title,
    onClick: () => {
      chosen = chosen === 'hard' ? 'easy' : 'hard';
      const on = chosen === 'hard';
      if (on) { lightning(); SFX.error(); vibrate([15, 30, 15, 30, 40]); } else { SFX.tap(); vibrate(10); }
      lever.classList.toggle('on', on);
      lever.setAttribute('aria-checked', String(on));
      title.textContent = T.switch[+on].title; sub.textContent = T.switch[+on].sub;
      if (!QUIET()) wave(lever, on);
      if (on) startFlicker(lever); else flicker++;
      setTheme(); drawBest(); drawRanking();
    },
  },
  el('span', { class: 'sd-plate', 'aria-hidden': 'true' },
    el('span', { class: 'sd-track', html: '<svg viewBox="0 0 70 60"><path class="sd-groove" d="M10.99 16.52 A39 39 0 0 1 59.01 16.52" /></svg>' }),
    el('span', { class: 'sd-bolt b1' }, '⚡'), el('span', { class: 'sd-bolt b2' }, '⚡'), el('span', { class: 'sd-bolt b3' }, '⚡'),
    el('span', { class: 'sd-arm' }, el('span', { class: 'sd-knob' })), el('span', { class: 'sd-axle' })),
  el('span', { class: 'sd-label' }, title, sub));
  $('#modes').replaceChildren(lever,
    el('button', { class: 'btn btn--yellow', id: 'btn-play', 'data-mode': 'solo', onClick: () => { SFX.tap(); start(chosen); } }, T.play));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
  if (hard) startFlicker(lever);
  drawBest();
  drawRanking();
  startDemo();
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
  if (E.isOver(state)) {
    stopClock();
    save();
    trackFinish({ nivel: state.level, segundos: Math.round(state.elapsed / 1000), puntaje: E.score(state), errores: state.mistakes || 0 });
    saveBest(state.level, E.score(state), state.elapsed);
    return renderResult({ fresh: true });
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
function renderResult({ fresh = false } = {}) {
  const time = mmss(state.elapsed);
  const level = levelName(state.level);
  $('#result-title').textContent = T.solved;
  const points = E.score(state), n = state.mistakes || 0;
  $('#result-score').textContent = fmt(T.scoreResult, { score: points });
  $('#result-line').textContent = fmt(T.solvedLine, { level: `${LEVEL_EMOJI[state.level]} ${level}`, time });
  $('#result-detail').textContent = n ? fmt(T.scoreDetailMistakes, { n }) : T.scoreDetail;
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); start(state.level); } }, fmt(T.again, { level: level.toLowerCase() })),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({
        titulo: T.title, url: location.origin + location.pathname,
        texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: T.shareContext }), fmt(T.shareText, { level: level.toLowerCase(), time, score: points })].join('\n\n'),
      }),
    }),
    el('button', { class: 'btn btn--ghost', id: 'btn-levels', onClick: () => { SFX.tap(); renderModes(); renderResumeSlot(); showScreen('screen-intro'); } }, T.otherLevel));
  // The level's table; a game just finished is saved first (D-212, D-274), a resumed result only shows it
  const tableEnd = bloqueTabla({ tabla: table(state.level), titulo: rankingTitle(state.level), entrar: false });
  const notice = fresh && rankingsVisibles() && !SEED
    ? [avisoPartida({ juego: GAME_ID, variante: state.level, s: points, ms: state.elapsed, alAnotar: () => tableEnd.recargar(), alTocar: () => SFX.tap() })] : [];
  $('#result-ranking').replaceChildren(...notice, tableEnd);
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
