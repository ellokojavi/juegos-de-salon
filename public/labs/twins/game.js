/**
 * Twins: screens and drawing (C-2), the only file that touches the DOM. The rules are in engine.js, the
 * texts in rules.js. Screens: intro → play (today's board, or the one of `?seed=`) → result (0 to 100 by
 * time, minus the hints). The game is saved after every merge to resume it (C-6); each day's result is kept
 * on the phone, so today's board, once solved, opens on its result. Lab only (D-395).
 *
 * A merge: drag a number onto an equal one beside it, or tap one and then its twin. The time runs only while
 * the board is on screen and the page is visible.
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { finDePartida } from '../../assets/js/ranking.js';
import { botonCompartir, taglineLine } from '../../assets/js/compartir.js';
import { result } from '../../assets/js/share-templates.js';
import { param } from '../../assets/js/parametros.js';
import { GAME_ID, LOCALES } from './rules.js';
import * as E from './engine.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/twins.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const DAYS_KEY = `juegos-de-salon:${GAME_ID}:days`;
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const today = () => E.localDate();
/** `?seed=`: any board by its seed, played outside the day (it keeps no day's result). */
const SEED = (param('seed') || '').trim().slice(0, 40) || null;

let state = null;
/** The hint's merge, shown until the next move: { from, to }. */
let shown = null;
/** The number tapped first, waiting for its twin. */
let picked = null;
const save = () => store.save({ mode: 'solo', state, done: !!state && state.done });
/** A saved game that belongs here: the `?seed=` board, or today's. */
const mine = g => !!g?.board && (SEED ? g.seed === SEED : !g.seed && g.date === today());

/** Each day's result on this phone: { 'YYYY-MM-DD': { score, state } }. */
function readDays() { try { return JSON.parse(localStorage.getItem(DAYS_KEY) || '{}') || {}; } catch (_) { return {}; } }
function writeDay(date, game) {
  const days = readDays();
  days[date] = { score: E.score(game), state: game };
  try { localStorage.setItem(DAYS_KEY, JSON.stringify(days)); } catch (_) { /* no storage: nothing kept */ }
}
const doneToday = () => (SEED ? null : readDays()[today()] || null);
const label = g => (g.seed ? fmt(T.seedLabel, { seed: g.seed }) : fmt(T.boardLabel, { n: E.numberOf(g.date) }));

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (id === 'screen-play') clockRun(); else clockStop();
}

/* ---------------- The time: only while the board is on screen and the page is visible ---------------- */
let since = null;
let ticker = null;
function bank() { if (state && since !== null) { state.ms += Date.now() - since; since = Date.now(); } }
function clockRun() {
  if (!state || state.done) return;
  if (since === null) since = Date.now();
  clearInterval(ticker);
  ticker = setInterval(paintClock, 500);
  paintClock();
}
function clockStop() { bank(); since = null; clearInterval(ticker); ticker = null; }
const elapsed = () => (state?.ms || 0) + (since === null ? 0 : Date.now() - since);
function paintClock() { $('#clock').textContent = '⏱ ' + E.clock(elapsed()); }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clockStop(); if (state && !state.done) save(); }
  else if ($('#screen-play').classList.contains('active')) clockRun();
});

/* ---------------- Intro ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !mine(saved.state)) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-resume', onClick: () => { SFX.tap(); state = saved.state; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderModes() {
  const done = doneToday();
  const note = SEED ? fmt(T.seedLabel, { seed: SEED })
    : done ? fmt(T.modeTodayDone, { score: done.score }) : fmt(T.modeTodayHint, { n: E.numberOf(today()) });
  $('#modes').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-play', 'data-mode': 'solo', onClick: () => { SFX.tap(); start(); } },
      SEED ? T.modeSeed : done ? T.modeTodayAgain : T.modeToday),
    el('p', { class: 'muted center today-note', id: 'today-note' }, note));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function start() {
  const kept = doneToday();
  if (kept?.state?.board) { state = kept.state; return renderResult(); }
  const saved = store.load();
  if (saved && !saved.done && mine(saved.state)) { state = saved.state; return renderPlay(); }
  state = SEED ? E.newGame(E.generate(SEED), { seed: SEED }) : E.newGame(E.boardOf(today()), { date: today() });
  shown = null; picked = null;
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); // usage signal (C-7, D-210)
  renderPlay();
}

/* ---------------- Play ---------------- */
/** The cells as the board draws them: a number is a button, a gap is an empty cell. */
function renderBoard() {
  const { cols } = state.board;
  const board = $('#board');
  board.style.setProperty('--cols', String(cols));
  board.replaceChildren(...state.cells.map((v, i) => v
    ? el('button', {
      type: 'button', 'data-c': String(Math.floor(Math.log2(v)) % 6), class: 'tile' + (v >= 100 ? ' tile--long' : '') + (picked === i ? ' tile--picked' : '') + (shown?.from === i ? ' tile--from' : '') + (shown?.to === i ? ' tile--to' : ''),
      'data-i': String(i), 'data-v': String(v), 'aria-label': String(v),
    }, String(v))
    : el('span', { class: 'gap', 'data-i': String(i) })));
}

function renderPlay() {
  if (state.done) return renderResult();
  $('#board-label').textContent = label(state);
  const n = E.count(state.cells);
  $('#left').textContent = n === 1 ? T.leftOne : fmt(T.left, { n });
  $('#btn-undo').disabled = !state.history.length;
  $('#btn-hint').textContent = fmt(T.hintBtn, { cost: E.HINT_COST });
  renderBoard();
  if (E.stuck(state)) say(T.stuck, 'warn');
  showScreen('screen-play');
}

function say(text, kind = '') {
  const n = $('#notice');
  n.className = 'notice' + (kind ? ' notice--' + kind : '');
  n.textContent = text;
  n.hidden = !text;
}

/** Drops `from` on `to`: the merge, or nothing if it cannot be made. */
function mergeAt(from, to) {
  if (!E.canMerge(state.cells, from, to, state.board.cols)) return false;
  bank();
  state = E.play(state, from, to);
  shown = null; picked = null;
  say('');
  SFX.reveal(); vibrate(20);
  save();
  if (state.done) return finish();
  renderPlay();
  const t = $(`#board .tile[data-i="${to}"]`);
  t?.classList.add('tile--merged');
  return true;
}

/** A tap: picks a number, or merges the picked one onto it if they are twins side by side. */
function tapAt(i) {
  if (picked !== null && picked !== i && mergeAt(picked, i)) return;
  SFX.tap();
  picked = picked === i ? null : i;
  renderBoard();
}

function undo() {
  if (!state.history.length) return;
  SFX.tap();
  state = E.undo(state);
  shown = null; picked = null;
  say('');
  save();
  renderPlay();
}

function askHint() {
  SFX.reveal();
  bank();
  const h = E.hint(state);
  state = h.state;
  shown = h.move;
  picked = null;
  save();
  renderPlay();
  say(!h.undone ? T.hintSay : h.undone === 1 ? T.hintUndidOne : fmt(T.hintUndid, { n: h.undone }), h.undone ? 'warn' : '');
}

/* ---------------- The drag: a number follows the finger and drops on its twin ---------------- */
const UMBRAL = 8;
let drag = null;
function cellAt(x, y) {
  const hit = document.elementFromPoint(x, y)?.closest?.('#board [data-i]');
  return hit ? Number(hit.dataset.i) : null;
}
function onDown(ev) {
  const tile = ev.target.closest?.('.tile');
  if (!tile || !state || state.done || drag) return;
  ev.preventDefault();
  drag = { id: ev.pointerId, from: Number(tile.dataset.i), x: ev.clientX, y: ev.clientY, moved: false, tile, over: null };
}
function onMove(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < UMBRAL) return;
  drag.moved = true;
  drag.tile.classList.add('tile--lifted');
  drag.tile.style.transform = `translate(${dx}px, ${dy}px)`;
  const over = cellAt(ev.clientX, ev.clientY);
  const ok = over !== null && E.canMerge(state.cells, drag.from, over, state.board.cols) ? over : null;
  if (ok !== drag.over) {
    $$('#board .tile--target').forEach(t => t.classList.remove('tile--target'));
    if (ok !== null) $(`#board .tile[data-i="${ok}"]`)?.classList.add('tile--target');
    drag.over = ok;
  }
}
function onUp(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  if (!d.moved) return tapAt(d.from);
  const to = ev.type === 'pointerup' ? cellAt(ev.clientX, ev.clientY) : null;
  if (to === null || !mergeAt(d.from, to)) {
    // Not on a twin: the number goes back to its cell (undo-free, nothing changed)
    if (to !== null && to !== d.from && state.cells[to]) { SFX.error(); vibrate(30); }
    renderBoard();
  }
}

/* ---------------- Result (C-19) ---------------- */
function finish() {
  clockStop();
  state.ms = Math.round(state.ms);
  save();
  if (state.date && !state.seed) writeDay(state.date, state);
  trackFinish({ ganador: 'yo' });
  SFX.win(); vibrate([30, 40, 30]);
  renderResult();
}

function shareText() {
  const pts = E.score(state);
  const line = [`⏱ ${E.clock(state.ms)}`, state.hints ? '💡'.repeat(Math.min(state.hints, 5)) + (state.hints > 5 ? ` ×${state.hints}` : '') : ''].filter(Boolean).join(' · ');
  return result({
    tagline: taglineLine(manifest.tagline, lang),
    head: { emoji: manifest.emoji, title: T.title, context: state.seed ? fmt(T.seedLabel, { seed: state.seed }) : fmt(T.shareContext, { n: E.numberOf(state.date) }) },
    lines: [line, `${pts}/100`],
  });
}

function renderResult() {
  const pts = E.score(state);
  $('#result-trophy').textContent = pts >= 90 ? '🏆' : pts >= 50 ? '⭐' : '🔢';
  $('#result-title').textContent = fmt(T.scoreTitle, { score: pts });
  const hints = !state.hints ? '' : fmt(state.hints === 1 ? T.hintsOne : T.hintsMany, { n: state.hints, cost: state.hints * E.HINT_COST });
  $('#result-line').textContent = [fmt(T.solvedIn, { time: E.clock(state.ms) }), hints].filter(Boolean).join(' ');
  $('#result-next').textContent = state.seed ? '' : T.nextBoard;
  $('#result-next').hidden = !!state.seed;
  $('#result-actions').replaceChildren(botonCompartir({
    rotulo: T.shareRotulo, id: 'btn-share', clase: 'btn btn--yellow', alTocar: () => SFX.tap(),
    avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
    armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: shareText() }),
  }));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  // A solo game: no win to count in the rankings yet (whether it keeps a score is the owner's call, D-212)
  finDePartida({ juego: GAME_ID, modo: 'solo', alTocar: () => SFX.tap() });
  if (pts >= 50) confetti();
  renderModes();
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
  // Instrucciones and Entrar as dialogs behind the lab flag cover-dialogs (C-8)
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
  const board = $('#board');
  board.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  $('#btn-undo').addEventListener('click', undo);
  $('#btn-hint').addEventListener('click', askHint);
  renderModes();
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14): the game, a way to the end from here, and a merge
window.__twins = {
  state: () => state,
  solve: () => (state ? E.solve(state.cells, state.board.cols, state.board.rows) : null),
  merge: (from, to) => mergeAt(from, to),
  hinted: () => shown,
};
init();
