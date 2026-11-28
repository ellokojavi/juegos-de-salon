/**
 * Drift: the small map in the corner of the race (the owner, 2026-11-27: «un pequeño mapa … simple,
 * minimalista … cuánto va quedando para terminar el circuito»). The circuit's outline seen from above,
 * north up: what is still to drive is a faint line, what is driven is yellow, the finish a white tick
 * and the car a dot. The same in 2D and 3D; it only reads the run, it never changes it.
 *
 *   minimap(canvas) → { draw(g, ghost) }   draws the run `g` (its track, its progress, its gate) and the ghost's pose, if any
 *   doneShare(g) → 0…1               the share of the lap behind the car
 */
const SIZE = 76, PAD = 7, STEP = 3;

/** The share of the lap already driven: the car's progress along the main road over its length. */
export function doneShare(g) {
  const { length } = g.track;
  if (g.mode === 'done') return 1;
  let f = Math.max(0, Math.min(1, g.progress / length));
  // On a loop the start is also the finish: before the first gate, a car near the line has not gone round
  if (g.gate === 0 && f > 0.5) f = 0;
  return f;
}

export function minimap(canvas) {
  const x = canvas.getContext('2d');
  let track = null, pts = [], dpr = 1;
  const css = name => getComputedStyle(canvas).getPropertyValue(name).trim();
  const ink = { done: css('--yellow') || '#ffd23f', left: 'rgba(255, 255, 255, 0.35)', car: '#ff2e88', ring: '#ffffff', ghost: 'rgba(255, 255, 255, 0.75)' };

  /** Fits the main road into the square, keeping its shape; world y is up, the screen's down. */
  function fit(t) {
    track = t;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of t.pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const k = (SIZE - 2 * PAD) / Math.max(x1 - x0, y1 - y0, 1);
    const ox = (SIZE - (x1 - x0) * k) / 2, oy = (SIZE - (y1 - y0) * k) / 2;
    const at = p => ({ x: ox + (p.x - x0) * k, y: SIZE - oy - (p.y - y0) * k, s: p.s });
    pts = t.pts.filter((_, i) => i % STEP === 0 || i === t.pts.length - 1).map(at);
    fit.at = at;
  }

  function line(from, to, colour, width) {
    if (to <= from) return;
    x.strokeStyle = colour; x.lineWidth = width; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath();
    for (let i = from; i <= to && i < pts.length; i++) (i === from ? x.moveTo(pts[i].x, pts[i].y) : x.lineTo(pts[i].x, pts[i].y));
    x.stroke();
  }

  return {
    draw(g, ghost = null) {
      const want = Math.min(3, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(SIZE * want)) { dpr = want; canvas.width = canvas.height = Math.round(SIZE * dpr); }
      if (g.track !== track) fit(g.track);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, SIZE, SIZE);
      const s = doneShare(g) * track.length;
      let i = 0;
      while (i + 1 < pts.length && pts[i + 1].s <= s) i++;
      line(0, pts.length - 1, ink.left, 2.5);
      line(0, i, ink.done, 3);
      // The finish: a short white bar across the road at its start
      const a = pts[0], b = pts[Math.min(2, pts.length - 1)], h = Math.atan2(b.y - a.y, b.x - a.x);
      x.strokeStyle = ink.ring; x.lineWidth = 2; x.lineCap = 'butt';
      x.beginPath(); x.moveTo(a.x - Math.sin(h) * 5, a.y + Math.cos(h) * 5); x.lineTo(a.x + Math.sin(h) * 5, a.y - Math.cos(h) * 5); x.stroke();
      // The ghost (ghost.js): a pale dot, under the car's
      if (ghost) { const q = fit.at(ghost); x.fillStyle = ink.ghost; x.beginPath(); x.arc(q.x, q.y, 3, 0, Math.PI * 2); x.fill(); }
      // The car, where it really is (off the road or on a fork too)
      const c = fit.at({ x: g.car.x, y: g.car.y });
      x.fillStyle = ink.ring; x.beginPath(); x.arc(c.x, c.y, 4.5, 0, Math.PI * 2); x.fill();
      x.fillStyle = ink.car; x.beginPath(); x.arc(c.x, c.y, 3, 0, Math.PI * 2); x.fill();
    },
  };
}
