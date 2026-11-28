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
import { TRACKS, STAGES, circuitFor } from './tracks.js';
import * as E from './engine.js';
import { escena } from './scene.js';
import { escena3d } from './scene3d.js';
import { scenery, solids, settingOf } from './scenery.js';
import { controls } from './input.js';
import { minimap } from './minimap.js';
import { pacerGhost, medalsOf, medalFor } from './pacer.js';
import { recorder, load as loadGhost, keep as keepGhost, better, poseAt, gapAt, lapProgress } from './ghost.js';
import { loadTuning, openTuning, isTuned, save as saveView, SCENES, GHOSTS, applyScene, schemeKey } from './tuning.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/drift.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const GAP = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'always' });
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const TEST = new URLSearchParams(location.search).has('test');
const view = loadTuning();
/** The circuit a run plays: the test stage with `?test`, else the lab panel's pick, by default this week's. */
const stage = () => TRACKS[TEST ? 'test' : STAGES.includes(view.stage) ? view.stage : circuitFor(Date.now())];

/** The run on screen: the engine's state and the loop's own. */
const S = { g: null, track: null, acc: 0, last: 0, live: false, paused: false, auto: false, frameMs: 0, raf: 0, tuned: false };
let sc = null, input = null;
/** The ghost: this run's recorder (none for a resumed run, which lost its start) and the record it races. */
const G = { rec: recorder(), ghost: null, own: null, recording: false, newRecord: false };
/**
 * The pace driver's ghost (pacer.js): until a circuit has a record on this phone, the run races the
 * intermediate driver's lap of it (the owner, 2026-11-27). Driven once per circuit, view and controls.
 */
const pacers = new Map();
function pacerFor(track, level = 'intermediate') {
  const scheme = view[schemeKey(view)] === 'stick' ? 'stick' : 'wheel', key = `${track.id}:${level}:${view.scene}:${scheme}:${view.reach}`;
  if (!pacers.has(key)) pacers.set(key, pacerGhost(track, { view: view.scene === '3d' ? '3d' : '2d', reach: view.reach || 75, scheme, level }));
  return pacers.get(key);
}
/** The medals of a circuit in the chosen view (option B): the expert's and the intermediate's laps. */
const medalsFor = track => medalsOf(pacerFor(track, 'expert'), pacerFor(track, 'intermediate'));

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
  // The ghost of this circuit's record on this phone; a run is recorded only from its start
  G.own = TEST ? null : loadGhost(g.track.id, g.track.length);
  // Who it races (the cover's pick, option C): the record (the intermediate until there is one), or a driver
  G.ghost = TEST ? null : view.ghost === 'mine' ? G.own || pacerFor(g.track) : pacerFor(g.track, view.ghost) || G.own;
  G.rec.reset(); G.recording = !g.t; G.newRecord = false;
  showScreen('screen-play');
  sc = sceneFor(view.scene);
  sc.resize();
  setControls();
  $('#hint').classList.toggle('fuera', !!S.g.t);
  $('#pause').hidden = true;
  paintHud();
  cancelAnimationFrame(S.raf);
  S.last = performance.now();
  S.raf = requestAnimationFrame(frame);
  countdown();
}

/**
 * The scene the cover's choice asks for: from above (scene.js) or from behind the car (scene3d.js).
 * A canvas keeps the kind of context it was first given, so a change of view starts on a fresh one;
 * a phone without WebGL plays from above.
 */
function sceneFor(want) {
  if (sc && (sc.kind || '2d') === want) return sc;
  const fresh = () => { const c = $('#canvas'), n = c.cloneNode(false); c.replaceWith(n); return n; };
  if (sc) { sc.dispose(); fresh(); }
  let made = want === '3d' ? escena3d($('#canvas')) : null;
  if (!made) { if (want === '3d') fresh(); made = escena($('#canvas')); }
  return made;
}

/** The rules, with step 2 in the words of the chosen view's controls (one finger is 3D's default). */
function renderHow() {
  $('#how').replaceChildren(...L.como.map((s, i) => el('li', {}, i === 1 && view[schemeKey(view)] === 'stick' ? T.howStick : s)));
}

/** The cover's choice of view, 2D or 3D, kept on this phone with the panel's values. */
function renderScenePick() {
  const pick = $('#scene-pick');
  pick.setAttribute('aria-label', T.sceneLabel);
  const paint = () => pick.replaceChildren(...SCENES.map(k => el('button', {
    type: 'button', class: view.scene === k ? 'on' : '', 'aria-pressed': String(view.scene === k), 'data-scene': k,
    onClick: () => { SFX.tap(); view.scene = k; applyScene(view); saveView(view); paint(); renderHow(); },
  }, k === '3d' ? T.scene3d : T.scene2d)));
  paint();
}

/** The cover's choice of ghost: my record, the intermediate driver or the expert, kept on this phone. */
function renderGhostPick() {
  const pick = $('#ghost-pick');
  pick.setAttribute('aria-label', T.ghostLabel);
  const name = { mine: T.ghostMine, intermediate: T.ghostIntermediate, expert: T.ghostExpert };
  const paint = () => pick.replaceChildren(...GHOSTS.map(k => el('button', {
    type: 'button', class: view.ghost === k ? 'on' : '', 'aria-pressed': String(view.ghost === k), 'data-ghost': k,
    onClick: () => { SFX.tap(); view.ghost = k; saveView(view); paint(); },
  }, name[k])));
  paint();
}

/** What the car can hit on this stage: the trees and rocks of the setting the scene draws. */
function arm(track) {
  track.solids = solids(scenery(track, settingOf(track, view.setting)));
  return track;
}

function startRun() {
  // One tap, one run (C-14): a second tap while the stage is already up does nothing
  if ($('#screen-play').classList.contains('active')) return;
  newRun();
}

/** A fresh run on the stage the panel picks. */
function newRun() {
  const track = arm(E.buildTrack(stage()));
  begin(E.newGame({ track }), stage());
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); // usage signal (C-7, D-210)
}

function resume(saved) {
  if ($('#screen-play').classList.contains('active')) return;
  const def = TRACKS[saved.track];
  const g = E.restore(saved.snap, arm(E.buildTrack(def)));
  // Back stopped where it was saved; a run already under way pays the reset, so reloading undoes nothing
  Object.assign(g.car, { vx: 0, vy: 0, steer: 0, slip: 0, speed: 0, px: g.car.x, py: g.car.y, ph: g.car.h });
  if (g.t > 0) g.penalty += E.TUNING.resetPenalty;
  // Its clock goes on with the first throttle, as at the start (with the countdown, at its «¡A correr!»)
  if (g.mode === 'play') g.mode = 'ready';
  begin(g, def);
  save();
}

/** The controls of the scheme chosen in the tuning panel, and their first-run hint. */
function setControls() {
  input?.dispose();
  input = controls($('#stage'), { scheme: view[schemeKey(view)], reach: view.reach, onFirst: () => $('#hint').classList.add('fuera') });
  const hint = $('#hint');
  hint.dataset.scheme = input.scheme;
  hint.replaceChildren(...(input.scheme === 'wheel' ? [T.hintSteer, T.hintPedal] : [input.scheme === 'stick' ? T.hintStick : T.hint]).map(x => el('span', {}, x)));
}

/**
 * No countdown while the game is in the lab (the owner, 2026-11-27: three seconds lost on every
 * test): the stage is live at once and the clock waits for the first throttle, as it always did.
 * `COUNTDOWN = true` brings back the shared 3, 2, 1 (decided before a launch, PROGRESS.md "Later").
 */
const COUNTDOWN = false;

/** The shared 3, 2, 1; control comes back when it says «¡A correr!». Without it, control is at once. */
function countdown() {
  if (!COUNTDOWN) {
    if (S.g.mode !== 'done') { S.live = true; S.last = performance.now(); }
    return;
  }
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
    if (G.recording) G.rec.add(g);
    if (g.events.length) g.events.splice(0).forEach(play);
  }
  const ghost = G.ghost && g.mode !== 'done' ? poseAt(G.ghost, g.t) : null;
  sc.draw(g, S.live ? S.acc / E.STEP : 0, view, ghost);
  paintHud(ghost);
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
  else if (e.type === 'crash') crashed();
  else if (e.type === 'boost') { SFX.pass(); vibrate(30); }
  else if (e.type === 'token') caught(e);
  // A hop over a small bump makes no noise: only a real flight (off a ramp, over a crest) does
  else if (e.type === 'jump' && !e.crest) SFX.flip();
  else if (e.type === 'land' && e.t > 0.25) { SFX.dice(); vibrate(40); }
  else if (e.type === 'wrecked') wreck();
  else if (e.type === 'finish') finish();
}

/** A crash: the bang, a buzz, and «−1 ❤️» rising from the car (the scene draws the impact itself). */
function crashed() {
  SFX.hit(); vibrate(90);
  const tag = el('div', { class: 'dr-hit', 'aria-hidden': 'true' }, '💥 −1 ❤️');
  $('#stage').append(tag);
  setTimeout(() => tag.remove(), 1200);
  if (S.g.mode !== 'done') save();
}

/** A token caught: a chime, a buzz, and «−10 s» rising in gold (the scene bursts the token itself). */
function caught(e) {
  SFX.win(); vibrate([20, 30, 20]);
  const tag = el('div', { class: 'dr-hit dr-hit--bonus', 'aria-hidden': 'true' }, fmt(T.tokenTag, { s: Math.round(e.ms / 1000) }));
  $('#stage').append(tag);
  setTimeout(() => tag.remove(), 1200);
  if (S.g.mode !== 'done') save();
}

let map = null;
function paintHud(ghost = null) {
  const g = S.g;
  (map ||= minimap($('#map'))).draw(g, ghost);
  $('#clock').textContent = E.clock(g.t);
  const pen = $('#penalty');
  // The penalties less the tokens caught: «+5 s» in yellow, «−10 s» in green
  const net = g.penalty - (g.bonus || 0);
  pen.hidden = !net;
  if (net) pen.textContent = fmt(net > 0 ? T.penalty : T.bonus, { s: Math.round(Math.abs(net) / 1000) });
  pen.classList.toggle('dr-penalty--bonus', net < 0);
  const total = g.track.gates.length;
  $('#gate').textContent = fmt(T.gateOf, { n: Math.min(g.gate + 1, total), total });
  // The gap to the ghost at this point of the lap: green ahead, plain behind
  const gap = G.ghost && g.mode === 'play' ? gapAt(G.ghost, lapProgress(g), g.t) : null, gl = $('#ghost-gap');
  gl.hidden = gap === null;
  if (gap !== null) {
    const d = Math.round(gap * 10) / 10 || 0;   // the tenth shown, and its colour, agree (no green «+0,0»)
    gl.textContent = fmt(T.ghostGap, { d: GAP.format(d) }); gl.classList.toggle('dr-ghost--ahead', d < 0);
  }
  $('#btn-reset').classList.toggle('dr-offer', E.needsReset(g));
  const lives = $('#lives');
  if (lives.dataset.n !== String(g.lives)) {
    lives.dataset.n = String(g.lives);
    lives.textContent = `❤️ ${g.lives}`;
    lives.setAttribute('aria-label', fmt(T.lives, { n: g.lives }));
    lives.classList.toggle('dr-lives--low', g.lives <= 3);
  }
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
/** The last life gone: the run ends with no time. */
function wreck() {
  save(true);
  trackFinish({ ganador: null, detalle: 'wrecked' });
  vibrate([60, 40, 140]);
  setTimeout(() => renderResult(), 1600);
}

function finish() {
  const g = S.g;
  const time = E.clock(E.total(g));
  // A clean run faster than the record becomes the ghost (not the autopilot's, nor the test stage's)
  const run = G.recording && !S.auto && !TEST ? G.rec.ghost(g) : null;
  // (the pace driver's ghost is never kept: a first clean run is the player's own record)
  if (better(run, G.own)) G.newRecord = keepGhost(run);
  save(true);
  trackFinish({ ganador: null, detalle: time });
  SFX.win(); vibrate([20, 40, 60]);
  setTimeout(() => renderResult(), 900);
}

function renderResult() {
  const g = S.g;
  const time = E.clock(E.total(g));
  const at = { n: Math.min(g.gate + 1, g.track.gates.length), total: g.track.gates.length };
  $('#result-trophy').textContent = g.wrecked ? '💥' : '🏁';
  $('#result-title').textContent = g.wrecked ? T.wreckedTitle : T.resultTitle;
  $('#result-time').textContent = time;
  $('#result-time').hidden = !!g.wrecked;
  const p = Math.round(g.penalty / 1000), b = Math.round((g.bonus || 0) / 1000), clock = E.clock(g.t);
  $('#result-detail').textContent = g.wrecked ? fmt(T.wreckedDetail, at)
    : p && b ? fmt(T.withBoth, { clock, p, b }) : b ? fmt(T.withBonus, { clock, b }) : p ? fmt(T.withPenalty, { clock, s: p }) : T.clean;
  // The record: a new one, or the one still standing
  const rec = $('#result-ghost');
  rec.hidden = g.wrecked || (!G.newRecord && !G.ghost);
  // Against a driver's ghost: by how much the run beat it or was beaten
  const vs = G.ghost?.sim ? E.total(g) - G.ghost.time : null, expert = G.ghost?.sim === 'expert';
  const pacer = vs === null ? '' : fmt(vs < 0 ? (expert ? T.expertBeat : T.pacerBeat) : (expert ? T.expertLost : T.pacerLost), { s: GAP.format(Math.abs(vs) / 1000).replace(/^[+−-]/, '') });
  // The medal it earned, and the time of the next one up (option B; none on the test stage)
  const medals = TEST || g.wrecked ? null : medalsFor(g.track), medal = medalFor(E.total(g), medals);
  const m = $('#result-medal');
  m.hidden = !medals;
  if (medals) m.textContent = medal === 'gold' ? T.medalGold
    : fmt({ silver: T.medalSilver, bronze: T.medalBronze }[medal] || T.medalNone, { clock: E.clock(medals[{ silver: 'gold', bronze: 'silver' }[medal] || 'bronze']) });
  rec.textContent = [pacer, G.newRecord ? T.ghostRecord : !G.ghost?.sim && G.ghost ? fmt(T.ghostBest, { clock: E.clock(G.ghost.time) }) : ''].filter(Boolean).join(' ');
  $('#result-actions').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-again', onClick: () => { SFX.tap(); startRun(); } }, T.again),
    botonCompartir({
      rotulo: T.shareRotulo, id: 'btn-share', alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: result({ head: { emoji: manifest.emoji, title: T.title, context: T.shareContext }, tagline: taglineLine(manifest.tagline, lang), lines: [g.wrecked ? fmt(T.shareWrecked, at) : fmt(T.shareLine, { time })] }) }),
    }));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  // Whether this game records scores is the owner's decision 8 (docs/rally/PROGRESS.md, before phase
  // 1.5): until then a run is a game played alone, which the rankings do not count
  finDePartida({ juego: GAME_ID, modo: 'solo', alTocar: () => SFX.tap() });
  if (!g.wrecked) confetti();
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
  renderHow();
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
      // Another stage picked in the panel: a new run on it
      if (S.g && S.track.id !== stage().id) { newRun(); return; }
      // Another setting grows other trees: the car hits what it sees
      if (S.g) arm(S.g.track);
      // The controls are rebuilt with the panel's scheme and thumb travel; a new scheme shows its hint again
      if (S.g && input) { const changed = input.scheme !== view[schemeKey(view)], gone = $('#hint').classList.contains('fuera'); setControls(); $('#hint').classList.toggle('fuera', gone && !changed); }
      S.last = performance.now();
      if (!was) { S.paused = false; if (S.live) countdown(); }
    } });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('pagehide', pause);
  addEventListener('resize', () => sc?.resize());
  renderScenePick();
  renderGhostPick();
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14): the run, the autopilot, pause and reset
window.__drift = {
  S,
  get g() { return S.g; },
  /** The values the car drives with now (each view has its own set). */
  get tuning() { return { ...E.TUNING }; },
  /** The view on screen: '2d' or '3d' (a phone without WebGL plays 2D whatever it chose). */
  get scene() { return sc ? sc.kind || '2d' : null; },
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
  countdownMs: COUNTDOWN ? 3000 + CUENTA_SALE_MS : 0,
};
init();
