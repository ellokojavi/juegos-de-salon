/**
 * Drift (Derrape): the page (C-2), the only file of the game that touches the DOM besides the scene.
 * Screens: cover → 3, 2, 1 → the stage → the result. Phase 1.1 of docs/rally/path-1-top-down.md: a
 * grey-box drive in the lab (D-395), to tune how the car feels with the owner.
 *
 * The loop: real elapsed time goes into an accumulator, clamped per frame; the engine runs whole fixed
 * steps (engine.js `run`); the scene draws once with what is left, to interpolate. The clock the
 * player reads is the engine's `g.t`, counted in steps, so a slow phone plays in slow motion and never
 * gets a different time.
 *
 * Memory (C-6, core section 10): the run is saved when it starts and at every gate. The page hidden
 * mid-run pauses it («En pausa · Toca para seguir», then a short 3, 2, 1). A reload offers to
 * continue: the car comes back stopped at the last gate with the clock as it was, plus the reset
 * penalty, so reloading never undoes a bad corner.
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
import { cuentaRegresiva, CUENTA_SALE_MS } from '../../assets/js/cuenta-regresiva.js';
import { labAccess } from '../../assets/js/lab-access.js';
import { GAME_ID, LOCALES } from './rules.js';
import { TRACKS, DEFAULT_TRACK } from './tracks.js';
import * as E from './engine.js';
import { escena } from './scene.js';
import { controls } from './input.js';
import { loadTuning, openTuning, isTuned } from './tuning.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/drift.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const TEST = new URLSearchParams(location.search).has('test');
const stage = () => TRACKS[TEST ? 'test' : DEFAULT_TRACK];
const view = loadTuning();

/** The run on screen: the engine's state and the loop's own. */
const S = { g: null, track: null, acc: 0, last: 0, live: false, paused: false, auto: false, frameMs: 0, raf: 0, tuned: false };
let sc = null, input = null;

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('jugando', id === 'screen-play');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

const save = (done = false) => store.save({ mode: 'solo', track: S.track.id, snap: E.snapshot(S.g), done });

/* ---------------- Cover ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !saved.snap || !TRACKS[saved.track]) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', id: 'btn-resume', onClick: () => { SFX.tap(); resume(saved); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

/* ---------------- A run ---------------- */
function begin(g, track) {
  S.track = TRACKS[track.id] ? track : stage();
  S.g = g;
  S.acc = 0; S.live = false; S.paused = false; S.tuned = isTuned(view);
  showScreen('screen-play');
  if (!sc) sc = escena($('#canvas'));
  sc.resize();
  input?.dispose();
  input = controls($('#stage'), { onFirst: () => $('#hint').classList.add('fuera') });
  $('#hint').classList.toggle('fuera', !!S.g.t);
  $('#pause').hidden = true;
  paintHud();
  cancelAnimationFrame(S.raf);
  S.last = performance.now();
  S.raf = requestAnimationFrame(frame);
  countdown();
}

function startRun() {
  // One tap, one run (C-14): a second tap while the stage is already up does nothing
  if ($('#screen-play').classList.contains('active')) return;
  const track = E.buildTrack(stage());
  begin(E.newGame({ track }), stage());
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); // usage signal (C-7, D-210)
}

function resume(saved) {
  if ($('#screen-play').classList.contains('active')) return;
  const def = TRACKS[saved.track];
  const g = E.restore(saved.snap, E.buildTrack(def));
  // Back stopped where it was saved; a run already under way pays the reset, so reloading undoes nothing
  Object.assign(g.car, { vx: 0, vy: 0, steer: 0, slip: 0, speed: 0, px: g.car.x, py: g.car.y, ph: g.car.h });
  if (g.t > 0) g.penalty += E.TUNING.resetPenalty;
  begin(g, def);
  save();
}

/** The shared 3, 2, 1; control comes back when it says «¡A correr!». */
function countdown() {
  S.live = false;
  cuentaRegresiva({ titulo: T.title, ya: T.go }).then(() => {
    if (S.g.mode === 'done') return;
    S.live = true;
    S.last = performance.now();
    // The clock of a resumed run goes on at the first step, as it stopped
    if (S.g.t > 0 && S.g.mode === 'ready') S.g.mode = 'play';
  });
}

function frame(now) {
  const g = S.g;
  if (!$('#screen-play').classList.contains('active')) return;
  const dt = (now - S.last) / 1000;
  S.last = now;
  const t0 = performance.now();
  if (S.live && !S.paused) {
    S.acc = E.run(g, S.auto ? E.autopilot : () => input.read(), dt, S.acc);
    if (g.events.length) g.events.splice(0).forEach(play);
  }
  sc.draw(g, S.live ? S.acc / E.STEP : 0, view);
  paintHud();
  S.frameMs = S.frameMs * 0.9 + (performance.now() - t0) * 0.1;
  S.raf = requestAnimationFrame(frame);
}

/** What the engine said, heard and felt. */
function play(e) {
  if (e.type === 'gate') {
    SFX.reveal(); vibrate(15);
    if (S.g.mode !== 'done') save();
  } else if (e.type === 'miss') { SFX.error(); vibrate(60); save(); }
  else if (e.type === 'reset') SFX.tap();
  else if (e.type === 'finish') finish();
}

function paintHud() {
  const g = S.g;
  $('#clock').textContent = E.clock(g.t);
  const pen = $('#penalty');
  pen.hidden = !g.penalty;
  if (g.penalty) pen.textContent = fmt(T.penalty, { s: Math.round(g.penalty / 1000) });
  const total = g.track.gates.length;
  $('#gate').textContent = fmt(T.gateOf, { n: Math.min(g.gate + 1, total), total });
  $('#btn-reset').classList.toggle('dr-offer', E.needsReset(g));
}

/* ---------------- Pause (C-6) ---------------- */
function pause() {
  if (!S.g || S.g.mode === 'done' || S.paused || !$('#screen-play').classList.contains('active')) return;
  S.paused = true;
  input?.release();
  $('#pause').hidden = false;
}
function unpause() {
  if (!S.paused) return;
  S.paused = false;
  $('#pause').hidden = true;
  countdown();
}

/* ---------------- Result (C-19) ---------------- */
function finish() {
  const g = S.g;
  const time = E.clock(E.total(g));
  save(true);
  trackFinish({ ganador: null, detalle: time });
  SFX.win(); vibrate([20, 40, 60]);
  setTimeout(() => renderResult(), 900);
}

function renderResult() {
  const g = S.g;
  const time = E.clock(E.total(g));
  $('#result-time').textContent = time;
  $('#result-detail').textContent = g.penalty ? fmt(T.withPenalty, { clock: E.clock(g.t), s: Math.round(g.penalty / 1000) }) : T.clean;
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); startRun(); } }, T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: result({ head: { emoji: manifest.emoji, title: T.title, context: T.shareContext }, tagline: taglineLine(manifest.tagline, lang), lines: [fmt(T.shareLine, { time })] }) }),
    }));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  // Whether this game records scores is the owner's decision 8 (docs/rally/PROGRESS.md, before phase
  // 1.5): until then a run is a game played alone, which the rankings do not count
  finDePartida({ juego: GAME_ID, modo: 'solo', alTocar: () => SFX.tap() });
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
  $('#how').replaceChildren(...L.como.map(s => el('li', {}, s)));
  // Instrucciones and Entrar as dialogs behind the lab flag cover-dialogs (C-8)
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
  $('#btn-play').addEventListener('click', () => { SFX.tap(); startRun(); });
  $('#btn-reset').setAttribute('aria-label', T.resetLabel);
  $('#btn-reset').addEventListener('click', () => { if (S.live && !S.paused) E.reset(S.g); });
  $('#pause').addEventListener('pointerdown', ev => { ev.stopPropagation(); unpause(); });
  // The tuning panel, only with a lab key (core section 12): it pauses the run while open
  const tune = $('#btn-tune');
  tune.setAttribute('aria-label', T.tuneOpen);
  labAccess().then(ok => { tune.hidden = !ok; }).catch(() => {});
  tune.addEventListener('click', () => {
    const was = S.paused;
    S.paused = true; input?.release();
    openTuning({ T, view, frameMs: () => S.frameMs, onClose: () => {
      S.tuned = S.tuned || isTuned(view);
      S.last = performance.now();
      if (!was) { S.paused = false; if (S.live) countdown(); }
    } });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('pagehide', pause);
  addEventListener('resize', () => sc?.resize());
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14): the run, the autopilot, pause and reset
window.__drift = {
  S,
  get g() { return S.g; },
  autopilot(on = true) { S.auto = !!on; },
  pause, unpause,
  reset: () => S.g && E.reset(S.g),
  /** Drives the rest of the run with the autopilot at once, to reach the result fast (look.mjs). */
  drive() {
    const g = S.g;
    if (g.mode === 'ready') g.mode = 'play';
    for (let i = 0; i < 120 * 600 && g.mode !== 'done'; i++) E.step(g, E.autopilot(g));
    g.events.splice(0).forEach(play);
  },
  countdownMs: 3000 + CUENTA_SALE_MS,
};
init();
