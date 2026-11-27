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

/** The camera's defaults (starting values, path-1-top-down.md). */
export const DEFAULT_VIEW = Object.freeze({ mode: 'follow', ahead: 70, scheme: 'wheel', reach: 60 });

/** What the panel offers, with each slider's range and step. */
const SLIDERS = [
  ['steerTime', 0.03, 0.5, 0.01], ['lockSlow', 15, 45, 1], ['lockFast', 3, 20, 0.5],
  ['topGravel', 15, 45, 0.5], ['accel', 3, 14, 0.25], ['brake', 6, 24, 0.5],
  ['gripGravel', 4, 20, 0.25], ['overSteer', 1, 4, 0.05], ['align', 0, 8, 0.1],
  ['handbrake', 0.15, 1, 0.05], ['gripOff', 2, 12, 0.25], ['topOff', 6, 25, 0.5],
];

/** The saved values, put into TUNING and returned with the view; an unreadable save is ignored. */
export function loadTuning() {
  let saved = {};
  try { saved = JSON.parse(globalThis.localStorage?.getItem(TUNING_KEY) || '{}') || {}; } catch (_) { saved = {}; }
  for (const [k, v] of Object.entries(saved.tuning || {})) if (k in DEFAULT_TUNING && Number.isFinite(v)) TUNING[k] = v;
  const view = { ...DEFAULT_VIEW, ...(saved.view || {}) };
  if (view.mode !== 'fixed') view.mode = 'follow';
  if (!Number.isFinite(view.ahead)) view.ahead = DEFAULT_VIEW.ahead;
  if (!SCHEMES.includes(view.scheme)) view.scheme = DEFAULT_VIEW.scheme;
  if (!Number.isFinite(view.reach)) view.reach = DEFAULT_VIEW.reach;
  return view;
}

/** Whether any value differs from the shipped one. */
export const isTuned = view => Object.keys(DEFAULT_TUNING).some(k => TUNING[k] !== DEFAULT_TUNING[k])
  || Object.keys(DEFAULT_VIEW).some(k => view[k] !== DEFAULT_VIEW[k]);

function save(view) {
  const changed = Object.fromEntries(Object.keys(DEFAULT_TUNING).filter(k => TUNING[k] !== DEFAULT_TUNING[k]).map(k => [k, TUNING[k]]));
  try { globalThis.localStorage?.setItem(TUNING_KEY, JSON.stringify({ tuning: changed, view })); } catch (_) { /* private mode: lasts this visit */ }
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
    el('button', { type: 'button', class: view.scheme === m ? 'on' : '', 'aria-pressed': String(view.scheme === m), onClick: () => { view.scheme = m; save(view); paintSchemes(); } }, label)));
  paintSchemes();

  const slider = (label, get, set, min, max, stepBy) => {
    const out = el('output', { class: 'dr-tune-value' }, String(get()));
    const input = el('input', { type: 'range', min, max, step: stepBy, value: get(), 'aria-label': label });
    input.addEventListener('input', () => { set(Number(input.value)); out.textContent = input.value; save(view); });
    rows.push({ input, out, get });
    return el('label', { class: 'dr-tune-row' }, el('span', { class: 'dr-tune-name' }, label, out), input);
  };
  const ahead = slider(T.tuneAhead, () => view.ahead, v => { view.ahead = v; }, 40, 120, 5);
  const reach = slider(T.tuneReach, () => view.reach, v => { view.reach = v; }, 25, 140, 5);
  const cars = SLIDERS.map(([k, min, max, s]) => slider(k, () => TUNING[k], v => { TUNING[k] = v; }, min, max, s));

  const frame = el('p', { class: 'muted dr-tune-frame' });
  const tick = setInterval(() => { frame.textContent = T.tuneFrame.replace('{ms}', frameMs().toFixed(1)); }, 250);
  const copy = el('button', { type: 'button', class: 'btn btn--cyan btn--sm', onClick: async () => {
    const text = JSON.stringify({ tuning: { ...TUNING }, view }, null, 2);
    try { await navigator.clipboard.writeText(text); copy.textContent = T.tuneCopied; } catch (_) { copy.textContent = text.length + ' …'; }
  } }, T.tuneCopy);
  const defaults = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: () => {
    Object.assign(TUNING, DEFAULT_TUNING); Object.assign(view, DEFAULT_VIEW); save(view);
    rows.forEach(r => { r.input.value = r.get(); r.out.textContent = String(r.get()); });
    paintCamera(); paintSchemes();
  } }, T.tuneDefaults);

  const close = () => { clearInterval(tick); layer.remove(); removeEventListener('keydown', onKey); onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  const sheet = el('div', { class: 'hoja dr-tune', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'tuning-title' },
    el('div', { class: 'hoja-cabeza' }, el('h3', { id: 'tuning-title' }, T.tuneTitle),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': T.tuneClose, id: 'btn-tune-close', onClick: close }, '✕')),
    frame,
    el('p', { class: 'dr-tune-name' }, T.tuneControls), schemes, reach,
    el('p', { class: 'dr-tune-name' }, T.tuneCamera), camera, ahead,
    ...cars,
    el('div', { class: 'btn-row' }, copy, defaults));
  const layer = el('div', { class: 'hoja-capa', id: 'tuning-layer' }, el('div', { class: 'hoja-fondo', onClick: close }), sheet);
  document.body.append(layer);
}
