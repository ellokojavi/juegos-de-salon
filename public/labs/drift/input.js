/**
 * Drift: the controls (docs/rally/core.md, section 6). Turns touch and keys into the four numbers the
 * engine takes, { steer, throttle, brake, handbrake }, and knows nothing of the engine's state.
 *
 * Scheme A, two halves with auto-throttle: the car accelerates by itself; holding the left half of
 * the stage steers left, the right half right, both halves brake. Each pointer is tracked by its id,
 * and a finger that slides across the middle switches sides. Losing focus releases everything.
 * The keyboard is always on: arrows or WASD, ↓ or S brakes, space is the handbrake.
 */

/**
 * @param {HTMLElement} stage   the element touched (it carries `touch-action: none` in the CSS)
 * @param {object} [o]
 * @param {() => void} [o.onFirst]   called on the first input of a run (the hint leaves)
 * @returns {{ read: () => object, release: () => void, dispose: () => void, active: () => boolean }}
 */
export function controls(stage, { onFirst = () => {} } = {}) {
  const pointers = new Map();   // id → 'left' | 'right'
  const keys = new Set();
  const off = new AbortController();
  const opt = { signal: off.signal };
  let touched = false;
  const first = () => { if (!touched) { touched = true; onFirst(); } };

  const sideOf = ev => {
    const r = stage.getBoundingClientRect();
    return ev.clientX < r.left + r.width / 2 ? 'left' : 'right';
  };
  stage.addEventListener('pointerdown', ev => {
    if (ev.button > 0 || ev.target.closest?.('button, a')) return;
    ev.preventDefault();
    try { stage.setPointerCapture(ev.pointerId); } catch (_) { /* an old browser: the move events still come */ }
    pointers.set(ev.pointerId, sideOf(ev));
    first();
  }, opt);
  stage.addEventListener('pointermove', ev => { if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, sideOf(ev)); }, opt);
  const lift = ev => pointers.delete(ev.pointerId);
  stage.addEventListener('pointerup', lift, opt);
  stage.addEventListener('pointercancel', lift, opt);
  stage.addEventListener('lostpointercapture', lift, opt);
  // A long press must not open the phone's menu over the stage
  stage.addEventListener('contextmenu', ev => ev.preventDefault(), opt);

  const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space']);
  addEventListener('keydown', ev => {
    if (!KEYS.has(ev.code) || ev.target.closest?.('input, textarea, select')) return;
    if (ev.code === 'Space' && ev.target.closest?.('button, a')) return;
    ev.preventDefault();
    keys.add(ev.code);
    first();
  }, opt);
  addEventListener('keyup', ev => keys.delete(ev.code), opt);
  const release = () => { pointers.clear(); keys.clear(); };
  addEventListener('blur', release, opt);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); }, opt);

  return {
    read() {
      const sides = new Set(pointers.values());
      const L = sides.has('left') || keys.has('ArrowLeft') || keys.has('KeyA');
      const R = sides.has('right') || keys.has('ArrowRight') || keys.has('KeyD');
      const both = sides.size === 2;
      const brake = both || keys.has('ArrowDown') || keys.has('KeyS');
      return {
        steer: both ? 0 : (R ? 1 : 0) - (L ? 1 : 0),
        throttle: brake ? 0 : 1,
        brake: brake ? 1 : 0,
        handbrake: keys.has('Space'),
      };
    },
    /** Whether any finger or key is down. */
    active: () => pointers.size > 0 || keys.size > 0,
    release,
    dispose() { release(); off.abort(); },
  };
}
