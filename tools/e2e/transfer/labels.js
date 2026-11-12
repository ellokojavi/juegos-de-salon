// Every station name on every trip's map: inside the map, and clear of the other names, of the other
// stations' dots and of every line (the owner, 2026-11-12: names must never overlap). Run in the page by
// game.mjs; returns the clashes as "trip station × what".
(() => {
  const out = [];
  // The five trips, the maps a player sees (the other levels in each city's pool are not played)
  const maps = [0, 1, 2, 3, 4].map(i => [i, undefined]);
  for (const [i, city] of maps) {
    if (!__transfer.drawLevel(i, city)) continue;
    const svg = document.querySelector('#map svg');
    const box = n => { const b = n.getBBox(); return { x0: b.x - 2, y0: b.y - 1, x1: b.x + b.width + 2, y1: b.y + b.height + 1 }; };
    const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    // Every line is drawn (a bad bend once left Buenos Aires' Line E out)
    for (const p of svg.querySelectorAll('.tr-track')) if (/NaN/.test(p.getAttribute('d')) || p.getTotalLength() < 10) out.push(`${city || 'trip'} ${i + 1} line ${p.getAttribute('class').split('--')[1]} not drawn`);
    const arrow = svg.querySelector('.tr-arrow');
    const names = [...svg.querySelectorAll('.tr-name')].map(t => ({ id: t.parentNode.dataset.station, b: box(t) }))
      // The line directions count as names: nothing may cover them either
      .concat([...svg.querySelectorAll('.tr-dir__name')].map((t, k) => ({ id: 'dir' + k + ':' + t.textContent, dir: true, b: box(t) })));
    const dots = [...svg.querySelectorAll('.tr-stop circle')].map(c => ({ id: c.parentNode.dataset.station, b: box(c) }));
    const W = svg.viewBox.baseVal;
    for (const n of names) {
      if (n.b.x0 < W.x || n.b.y0 < W.y || n.b.x1 > W.x + W.width || n.b.y1 > W.y + W.height) out.push(`${city || 'trip'} ${i + 1} ${n.id}: off the map`);
      // Two names keep a clear gap (8 px), so they never read as one
      for (const m of names) if (m.id > n.id && hit({ x0: n.b.x0 - 4, y0: n.b.y0 - 2, x1: n.b.x1 + 4, y1: n.b.y1 + 2 }, { x0: m.b.x0 - 4, y0: m.b.y0 - 2, x1: m.b.x1 + 4, y1: m.b.y1 + 2 })) out.push(`${city || 'trip'} ${i + 1} ${n.id} × ${m.id}`);
      for (const d of dots) if (d.id !== n.id && hit(n.b, d.b)) out.push(`${city || 'trip'} ${i + 1} ${n.id} × dot ${d.id}`);
      // The start's arrow never covers a name
      if (arrow) { const r = arrow.getBoundingClientRect(), t = svg.getScreenCTM().inverse(), p0 = new DOMPoint(r.left, r.top).matrixTransform(t), p1 = new DOMPoint(r.right, r.bottom).matrixTransform(t); if (hit(n.b, { x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y })) out.push(`${city || 'trip'} ${i + 1} ${n.id} × the arrow`); }
      // The train's ring (r 15) sits on the station: its own name stays clear of it (a direction has no dot)
      const own = dots.find(d => d.id === n.id);
      if (own) {
        const cx = (own.b.x0 + own.b.x1) / 2, cy = (own.b.y0 + own.b.y1) / 2;
        const nx = Math.max(n.b.x0, Math.min(cx, n.b.x1)), ny = Math.max(n.b.y0, Math.min(cy, n.b.y1));
        if (Math.hypot(nx - cx, ny - cy) < 16) out.push(`${city || 'trip'} ${i + 1} ${n.id} × the train`);
      }
      // …and every direction's dotted stub
      for (const p of svg.querySelectorAll('.tr-track, .tr-dir__stub')) {
        const L = p.getTotalLength();
        for (let s = 0; s < L; s += 2) { const q = p.getPointAtLength(s); if (q.x > n.b.x0 + 1 && q.x < n.b.x1 - 1 && q.y > n.b.y0 + 1 && q.y < n.b.y1 - 1) { out.push(`${city || 'trip'} ${i + 1} ${n.id} × line ${p.getAttribute('class').split('--')[1] || 'direction ' + p.parentNode.getAttribute('class')}`); break; } }
      }
    }
  }
  return out;
})()
