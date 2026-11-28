/**
 * Drift: the tuning panel (docs/rally/core.md, section 12). Only with a lab key, never on the cover:
 * the 🔧 at the edge of the stage opens it over a paused run. Sliders for the car's values in TUNING,
 * the control scheme and the thumb's travel, the camera mode and how much road is in view, the frame time, and «Copiar valores» to paste them
 * back into a PR. It writes nothing but its own key on this phone (TUNING_KEY), and a run with
 * changed values is marked `tuned` (never ranked, once the game has a ranking).
 *
 * It is how a feel round with the owner takes minutes: change, close, drive, open again.
 */
import { el } from '../../assets/js/ui.js';
import { TUNING, DEFAULT_TUNING } from './engine.js';
import { TUNING_KEY } from './rules.js';
import { SCHEMES } from './input.js';
import { SETTING_NAMES } from './scenery.js';
import { STAGES, DEFAULT_TRACK, TRACKS } from './tracks.js';

/** The camera's defaults (starting values, path-1-top-down.md; the fixed map since the owner asked, 2026-11-27). */
export const DEFAULT_VIEW = Object.freeze({ mode: 'fixed', ahead: 40, scheme: 'wheel', reach: 75, setting: 'stage', stage: DEFAULT_TRACK, scene: '2d', scheme3d: 'stick', ghost: 'mine' });
/** The two views the cover offers: from above (scene.js) and from behind the car (scene3d.js). */
export const SCENES = ['2d', '3d'];
/**
 * Who the run races, picked on the cover (the owner, 2026-11-28, option C): the record on this phone
 * (the intermediate driver until there is one), the intermediate driver, or the expert.
 */
export const GHOSTS = ['mine', 'intermediate', 'expert'];

/**
 * Each view drives with its own values (path-2-3d.md allows a second TUNING set per scene, never a
 * second engine): the 3D one starts from the engine's with these changes (the owner, 2026-11-27).
 * Its controls are its own too: one finger by default in 3D (`view.scheme3d`), the wheel and pedal in 2D.
 */
const SCENE_TUNING = { '2d': {}, '3d': { accel: 18 } };
export const defaultsFor = scene => ({ ...DEFAULT_TUNING, ...(SCENE_TUNING[scene] || {}) });
/** The key of the view's control scheme: `scheme` from above, `scheme3d` from behind. */
export const schemeKey = view => (view.scene === '3d' ? 'scheme3d' : 'scheme');
/** The save's version: 2 since the fixed map became the default, so an older save takes it once. */
const VIEW_VERSION = 2;
/** What each view's panel changed, as saved: { '2d': {…}, '3d': {…} }. */
let changes = { '2d': {}, '3d': {} };

/** Puts the values of the view's scene into TUNING: its defaults, then what its panel changed. */
export function applyScene(view) {
  Object.assign(TUNING, defaultsFor(view.scene));
  for (const [k, v] of Object.entries(changes[view.scene] || {})) if (k in DEFAULT_TUNING && Number.isFinite(v)) TUNING[k] = v;
}

/**
 * The top speed's range: the scene's default sits at a quarter of the bar, so the panel can go up
 * to four times as fast (the owner, 2026-11-27).
 */
export const topRange = scene => { const d = defaultsFor(scene).topGravel, lo = 10; return [lo, Math.round(lo + 4 * (d - lo))]; };

/** What the panel offers, with each slider's range and step. */
const SLIDERS = [
  ['steerTime', 0.03, 0.5, 0.01], ['lockSlow', 15, 45, 1], ['lockFast', 3, 20, 0.5],
  ['topAsphalt', 15, 250, 0.5], ['accel', 3, 20, 0.25], ['brake', 6, 30, 0.5],
  ['gripGravel', 4, 20, 0.25], ['overSteer', 1, 4, 0.05], ['align', 0, 8, 0.1],
  ['handbrake', 0.15, 1, 0.05], ['gripOff', 2, 12, 0.25], ['topOff', 6, 30, 0.5], ['boostTop', 1, 2.5, 0.05], ['boostTime', 0.3, 3, 0.1],
  ['topReverse', 3, 15, 0.5],
];

/** The saved values, put into TUNING and returned with the view; an unreadable save is ignored. */
export function loadTuning() {
  let saved = {};
  try { saved = JSON.parse(globalThis.localStorage?.getItem(TUNING_KEY) || '{}') || {}; } catch (_) { saved = {}; }
  // Before there were two views the changes were one set: it stays the 2D one and seeds the 3D one (but its acceleration)
  const old = saved.tuning || {};
  changes = { '2d': { ...old }, '3d': saved.tuning3d || Object.fromEntries(Object.entries(old).filter(([k]) => !(k in SCENE_TUNING['3d']))) };
  const view = { ...DEFAULT_VIEW, ...(saved.view || {}) };
  // A save from before the fixed map was the default held the old default, not a choice: it takes the new one
  if (!(saved.v >= VIEW_VERSION)) view.mode = DEFAULT_VIEW.mode;
  if (view.mode !== 'follow') view.mode = 'fixed';
  // 70 m was the default until the owner asked for more zoom (2026-11-26): an old save holding it takes the new one
  if (!Number.isFinite(view.ahead) || view.ahead === 70) view.ahead = DEFAULT_VIEW.ahead;
  if (!SCHEMES.includes(view.scheme)) view.scheme = DEFAULT_VIEW.scheme;
  if (!SCHEMES.includes(view.scheme3d)) view.scheme3d = DEFAULT_VIEW.scheme3d;
  if (!Number.isFinite(view.reach)) view.reach = DEFAULT_VIEW.reach;
  if (view.setting !== 'stage' && !SETTING_NAMES.includes(view.setting)) view.setting = DEFAULT_VIEW.setting;
  if (view.stage !== 'week' && !STAGES.includes(view.stage)) view.stage = DEFAULT_VIEW.stage;
  if (!SCENES.includes(view.scene)) view.scene = DEFAULT_VIEW.scene;
  if (!GHOSTS.includes(view.ghost)) view.ghost = DEFAULT_VIEW.ghost;
  applyScene(view);
  return view;
}

/** Whether any value differs from the shipped one. */
export const isTuned = view => { const d = defaultsFor(view.scene); return Object.keys(d).some(k => TUNING[k] !== d[k])
  || Object.keys(DEFAULT_VIEW).some(k => k !== 'scene' && k !== 'ghost' && view[k] !== DEFAULT_VIEW[k]); };

/** Keeps the panel's values and the view on this phone (the cover's 2D/3D choice too). */
export function save(view) {
  const d = defaultsFor(view.scene);
  changes[view.scene] = Object.fromEntries(Object.keys(d).filter(k => TUNING[k] !== d[k]).map(k => [k, TUNING[k]]));
  try { globalThis.localStorage?.setItem(TUNING_KEY, JSON.stringify({ v: VIEW_VERSION, tuning: changes['2d'], tuning3d: changes['3d'], view })); } catch (_) { /* private mode: lasts this visit */ }
}

/**
 * Opens the panel. `view` is changed in place; `frameMs()` reads the last frame time; `onClose` runs
 * when it closes.
 */
export function openTuning({ T, view, frameMs, onClose = () => {} }) {
  document.querySelector('#tuning-layer')?.remove();
  const rows = [];
  const camera = el('div', { class: 'seg', role: 'group', 'aria-label': T.tuneCamera });
  const paintCamera = () => camera.replaceChildren(...[['follow', T.camFollow], ['fixed', T.camFixed]].map(([m, label]) =>
    el('button', { type: 'button', class: view.mode === m ? 'on' : '', 'aria-pressed': String(view.mode === m), onClick: () => { view.mode = m; save(view); paintCamera(); } }, label)));
  paintCamera();
  // The controls: a new scheme takes effect when the panel closes (the run's controls are rebuilt)
  const schemes = el('div', { class: 'seg dr-tune-schemes', role: 'group', 'aria-label': T.tuneControls });
  const paintSchemes = () => schemes.replaceChildren(...[['wheel', T.schemeWheel], ['stick', T.schemeStick], ['auto', T.schemeAuto]].map(([m, label]) =>
    el('button', { type: 'button', class: view[schemeKey(view)] === m ? 'on' : '', 'aria-pressed': String(view[schemeKey(view)] === m), onClick: () => { view[schemeKey(view)] = m; save(view); paintSchemes(); } }, label)));
  paintSchemes();
  // The stage: a new one starts a new run on it when the panel closes (the owner's track ideas, 2026-11-27)
  // The circuit: this week's (the default, the one everyone drives), or any of the pool to try it
  const stages = el('div', { class: 'chips', role: 'group', 'aria-label': T.tuneStage });
  const EMOJI = { meadow: '🌿', forest: '🔥', plain: '🌙' };
  const label = id => id === 'week' ? T.stageWeek : `${TRACKS[id].weather === 'wet' ? '🌧️' : EMOJI[TRACKS[id].setting]} ${Number(id.slice(1))}`;
  const paintStages = () => stages.replaceChildren(...['week', ...STAGES].map(m =>
    el('button', { type: 'button', class: 'chip-btn' + (view.stage === m ? ' on' : ''), 'aria-pressed': String(view.stage === m), onClick: () => { view.stage = m; save(view); paintStages(); } }, label(m))));
  paintStages();
  // The setting: the stage's own, or any of the three to look at it (the scene redraws at once)
  const settings = el('div', { class: 'seg dr-tune-schemes', role: 'group', 'aria-label': T.tuneSetting });
  const paintSettings = () => settings.replaceChildren(...[['stage', T.settingStage], ['meadow', T.settingMeadow], ['forest', T.settingForest], ['plain', T.settingPlain]].map(([m, label]) =>
    el('button', { type: 'button', class: view.setting === m ? 'on' : '', 'aria-pressed': String(view.setting === m), onClick: () => { view.setting = m; save(view); paintSettings(); } }, label)));
  paintSettings();

  const slider = (label, get, set, min, max, stepBy) => {
    const out = el('output', { class: 'dr-tune-value' }, String(get()));
    const input = el('input', { type: 'range', min, max, step: stepBy, value: get(), 'aria-label': label });
    input.addEventListener('input', () => {
      set(Number(input.value)); save(view);
      // One control can move another (the top speed moves the asphalt's): every row shows its value again
      rows.forEach(r => { r.input.value = r.get(); r.out.textContent = String(r.get()); });
    });
    rows.push({ input, out, get });
    return el('label', { class: 'dr-tune-row' }, el('span', { class: 'dr-tune-name' }, label, out), input);
  };
  const ahead = slider(T.tuneAhead, () => view.ahead, v => { view.ahead = v; }, 25, 120, 5);
  const reach = slider(T.tuneReach, () => view.reach, v => { view.reach = v; }, 25, 140, 5);
  // The top speed: gravel's, with asphalt's kept in the same proportion as the defaults'
  const top = slider(T.tuneTop, () => TUNING.topGravel, v => { const d = defaultsFor(view.scene); TUNING.topGravel = v; TUNING.topAsphalt = Math.round(v * d.topAsphalt / d.topGravel * 2) / 2; }, ...topRange(view.scene), 1);
  const cars = SLIDERS.map(([k, min, max, s]) => slider(k, () => TUNING[k], v => { TUNING[k] = v; }, min, max, s));

  const frame = el('p', { class: 'muted dr-tune-frame' });
  const tick = setInterval(() => { frame.textContent = T.tuneFrame.replace('{ms}', frameMs().toFixed(1)); }, 250);
  const copy = el('button', { type: 'button', class: 'btn btn--cyan btn--sm', onClick: async () => {
    const text = JSON.stringify({ tuning: { ...TUNING }, view }, null, 2);
    try { await navigator.clipboard.writeText(text); copy.textContent = T.tuneCopied; } catch (_) { copy.textContent = text.length + ' …'; }
  } }, T.tuneCopy);
  const defaults = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: () => {
    Object.assign(TUNING, defaultsFor(view.scene)); Object.assign(view, DEFAULT_VIEW, { scene: view.scene }); save(view);
    rows.forEach(r => { r.input.value = r.get(); r.out.textContent = String(r.get()); });
    paintCamera(); paintSchemes(); paintSettings();
  } }, T.tuneDefaults);

  const close = () => { clearInterval(tick); layer.remove(); removeEventListener('keydown', onKey); onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  const sheet = el('div', { class: 'hoja dr-tune', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tuning-title' },
    el('div', { class: 'hoja-cabeza' }, el('h3', { id: 'tuning-title' }, T.tuneTitle),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': T.tuneClose, id: 'btn-tune-close', onClick: close }, '✕')),
    frame,
    el('p', { class: 'dr-tune-name' }, T.tuneStage), stages,
    el('p', { class: 'dr-tune-name' }, T.tuneControls), schemes, reach,
    el('p', { class: 'dr-tune-name' }, T.tuneCamera), camera, ahead,
    el('p', { class: 'dr-tune-name' }, T.tuneSetting), settings,
    top, ...cars,
    el('div', { class: 'btn-row' }, copy, defaults));
  const layer = el('div', { class: 'hoja-capa', id: 'tuning-layer' }, el('div', { class: 'hoja-fondo', onClick: close }), sheet);
  document.body.append(layer);
}
