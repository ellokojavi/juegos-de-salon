/**
 * Drift: the controls (docs/rally/core.md, section 6). Turns touch and keys into the four numbers the
 * engine takes, { steer, throttle, brake, handbrake }, and knows nothing of the engine's state.
 *
 * Every touch control is relative to where the thumb lands, so nothing has to be aimed at without
 * looking, and every one is analogue, so a corner can be taken with a little steering or a lot, and
 * braking and turning can happen at once. Three schemes, chosen in the lab's tuning panel:
 *
 *   wheel  «Volante y pedal» (the default since the owner's first drive, 2026-11-26): the left thumb
 *          lands anywhere on the left half and slides sideways to steer, as far as `reach` px for full
 *          lock; the right thumb on the right half is the pedal: held, it accelerates; slid down from
 *          where it landed it eases off and then brakes. Lifting a thumb centres the wheel or lets the
 *          car roll.
 *   stick  «Un dedo»: one thumb anywhere is a stick: sideways steers, up accelerates, down brakes.
 *   auto   «Acelera solo», the 1.1 scheme: the car accelerates by itself, hold a half to turn, both
 *          to brake. Kept for comparison only.
 *
 * What each thumb does is drawn just above it, where the thumb does not cover it (the `.dr-touch`
 * gauges the module adds to the stage), so the player sees the wheel and the pedal they are holding.
 * The keyboard is always on: ←/→ or A/D steer, ↑/W accelerates, ↓/S brakes, space is the handbrake.
 */

export const SCHEMES = ['wheel', 'stick', 'auto'];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
/**
 * The steering's curve (the owner, 2026-11-27: «Calibra los controles…»): a thumb's offset x in
 * [−1, 1] steers x × (SOFT + (1 − SOFT) x²), so the first part of its travel turns half as much as
 * before and full travel is still full lock. A steady thumb places the car finely; a shaky one wanders
 * less (tools/generators/drift-humans.mjs: with the straight line, a novice's tremor ran them off the road).
 */
export const SOFT = 0.5;
export const curve = x => x * (SOFT + (1 - SOFT) * x * x);

/** The gap between the thumb and the near edge of its gauge, px (about 1.5 cm: clear of the thumb's pad). */
const LIFT = 56;

/**
 * @param {HTMLElement} stage   the element touched (it carries `touch-action: none` in the CSS)
 * @param {object} [o]
 * @param {string} [o.scheme]   'wheel' | 'stick' | 'auto'
 * @param {number} [o.reach]    px of thumb travel for full steering (and for the stick's full pedal)
 * @param {() => void} [o.onFirst]   called on the first input of a run (the hint leaves)
 */
export function controls(stage, { scheme = 'wheel', reach = 75, onFirst = () => {} } = {}) {
  if (!SCHEMES.includes(scheme)) scheme = 'wheel';
  const touches = new Map();   // id → { role, x0, y0, x, y, ring, dot, gx, gy }
  const keys = new Set();
  const off = new AbortController();
  const opt = { signal: off.signal };
  let touched = false;
  const first = () => { if (!touched) { touched = true; onFirst(); } };

  /**
   * What each thumb is doing, drawn just above where it landed (LIFT px clear of it), where the thumb does not cover it
   * (the owner, 2026-11-26: «el dedo presionado tapa el control»), or below it when the thumb lands
   * near the top. The wheel is a bar with a knob that follows the thumb sideways; the pedal a bar,
   * green at the top (accelerating) and red below (braking), with a knob that goes down with the
   * thumb; the one finger a ring with its dot.
   */
  function mark(t) {
    const ring = document.createElement('div');
    ring.className = `dr-touch dr-touch--${t.role}`;
    const size = t.role === 'pedal' ? { width: '', height: `${reach}px` } : t.role === 'steer' ? { width: `${2 * reach}px`, height: '' } : { width: `${2 * reach}px`, height: `${2 * reach}px` };
    Object.assign(ring.style, size);
    const dot = document.createElement('div');
    dot.className = 'dr-touch-dot';
    ring.append(dot);
    stage.append(ring);
    t.ring = ring; t.dot = dot;
    const r = stage.getBoundingClientRect();
    // Where the gauge sits, in the stage's coordinates: above the thumb, kept inside the stage
    const half = t.role === 'pedal' ? 20 : reach + 8;
    const tall = t.role === 'steer' ? 20 : t.role === 'pedal' ? reach : 2 * reach;
    const x = clamp(t.x0 - r.left, half, Math.max(half, r.width - half));
    let y = t.y0 - r.top - LIFT - tall / 2;
    if (y - tall / 2 < 8) y = t.y0 - r.top + LIFT + tall / 2;
    t.gx = x; t.gy = clamp(y, tall / 2 + 8, Math.max(tall / 2 + 8, r.height - tall / 2 - 8));
    place(t);
  }
  function place(t) {
    if (!t.ring) return;
    t.ring.style.left = `${t.gx}px`;
    t.ring.style.top = `${t.gy}px`;
    let dx = 0, dy = 0;
    if (t.role === 'steer') dx = clamp(t.x - t.x0, -reach, reach);
    if (t.role === 'stick') { dx = clamp(t.x - t.x0, -reach, reach); dy = clamp(t.y - t.y0, -reach, reach); }
    // The pedal's knob starts at the top (held: full throttle) and goes down the bar to full brake
    if (t.role === 'pedal') dy = clamp(t.y - t.y0, 0, reach) - reach / 2;
    t.dot.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  const unmark = t => t.ring?.remove();

  function roleOf(ev) {
    if (scheme === 'stick') return [...touches.values()].some(t => t.role === 'stick') ? null : 'stick';
    const r = stage.getBoundingClientRect();
    const left = ev.clientX < r.left + r.width / 2;
    if (scheme === 'auto') return left ? 'left' : 'right';
    const role = left ? 'steer' : 'pedal';
    return [...touches.values()].some(t => t.role === role) ? null : role;
  }

  stage.addEventListener('pointerdown', ev => {
    if (ev.button > 0 || ev.target.closest?.('button, a')) return;
    ev.preventDefault();
    const role = roleOf(ev);
    if (!role) return;
    try { stage.setPointerCapture(ev.pointerId); } catch (_) { /* an old browser: the move events still come */ }
    const t = { role, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY };
    touches.set(ev.pointerId, t);
    if (scheme !== 'auto') mark(t);
    first();
  }, opt);
  stage.addEventListener('pointermove', ev => {
    const t = touches.get(ev.pointerId);
    if (!t) return;
    t.x = ev.clientX; t.y = ev.clientY;
    // In the 1.1 scheme a finger that slides across the middle switches sides
    if (scheme === 'auto') { const r = stage.getBoundingClientRect(); t.role = ev.clientX < r.left + r.width / 2 ? 'left' : 'right'; }
    place(t);
  }, opt);
  const lift = ev => { const t = touches.get(ev.pointerId); if (t) { unmark(t); touches.delete(ev.pointerId); } };
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
  const release = () => { touches.forEach(unmark); touches.clear(); keys.clear(); };
  addEventListener('blur', release, opt);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); }, opt);

  /** The touch part of the input, by scheme. */
  function fromTouch() {
    const all = [...touches.values()];
    if (scheme === 'auto') {
      const sides = new Set(all.map(t => t.role));
      const both = sides.size === 2;
      return { steer: both ? 0 : (sides.has('right') ? 1 : 0) - (sides.has('left') ? 1 : 0), throttle: both ? 0 : 1, brake: both ? 1 : 0 };
    }
    let steer = 0, throttle = 0, brake = 0;
    for (const t of all) {
      const dx = (t.x - t.x0) / reach, dy = (t.y - t.y0) / reach;
      if (t.role === 'steer' || t.role === 'stick') steer = curve(clamp(dx, -1, 1));
      if (t.role === 'pedal') {
        // Held: full throttle; slid down: the throttle eases off over the first third, then the brake comes in
        throttle = clamp(1 - dy * 3, 0, 1);
        brake = clamp((dy - 1 / 3) * 1.5, 0, 1);
      }
      if (t.role === 'stick') {
        // A little dead zone around where it landed, so a thumb held still does nothing
        const up = -dy - 0.12, down = dy - 0.12;
        throttle = clamp(up / 0.7, 0, 1);
        brake = clamp(down / 0.7, 0, 1);
      }
    }
    return { steer, throttle, brake };
  }

  return {
    scheme,
    read() {
      const t = fromTouch();
      const L = keys.has('ArrowLeft') || keys.has('KeyA'), R = keys.has('ArrowRight') || keys.has('KeyD');
      const gas = keys.has('ArrowUp') || keys.has('KeyW'), stop = keys.has('ArrowDown') || keys.has('KeyS');
      return {
        steer: clamp(t.steer + (R ? 1 : 0) - (L ? 1 : 0), -1, 1),
        throttle: stop ? 0 : Math.max(t.throttle, gas ? 1 : 0),
        brake: Math.max(t.brake, stop ? 1 : 0),
        handbrake: keys.has('Space'),
      };
    },
    /** Whether any finger or key is down. */
    active: () => touches.size > 0 || keys.size > 0,
    release,
    dispose() { release(); off.abort(); },
  };
}
