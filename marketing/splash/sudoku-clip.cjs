// The Sudoku splash clip (sudoku-ya, the owner's request 2026-11-11): the real board shows how a digit
// is found, not guessed. For each of two digits: the copies already on the board light up, their rows
// and columns sweep across the whole grid, the view zooms into the 3×3 box those lines cross, where
// they leave a single free cell; the digit goes there, and the view zooms back out. Played on the game
// itself (?seed=SPLASH, its window.__sudoku hook) with Playwright, one screenshot per frame.
//
//   python3 -m http.server 8791 -d public &
//   node marketing/splash/sudoku-clip.cjs /tmp/sudoku-frames
//   ffmpeg -framerate 30 -i /tmp/sudoku-frames/f%04d.png -vf "scale=480:-2,format=yuv420p" \
//     -c:v libx264 -crf 26 -preset slow -movflags +faststart -an public/assets/splash/sudoku.mp4
//
// The frame is exactly the grid, without its own border or any ground around it, and a zoom never shows
// past the grid's edge; the splash card gives the even margin around the clip (DESIGN.md §3 rule 7).
// The poster (sudoku-start.jpg) is the first frame and the still (sudoku.jpg) the last.
const { chromium } = require('playwright');
const OUT = process.argv[2];
const SITE = process.env.SITE || 'http://localhost:8791';

// A digit found by lines alone: a box without d where the rows and columns holding d leave one empty cell
function findStep(cells, solution, skipBoxes) {
  const rowHas = (r, d) => [...Array(9)].some((_, c) => cells[r * 9 + c] === d);
  const colHas = (c, d) => [...Array(9)].some((_, r) => cells[r * 9 + c] === d);
  let best = null;
  for (let b = 0; b < 9; b++) {
    if (skipBoxes.includes(b)) continue;
    const br = Math.floor(b / 3), bc = b % 3;
    const box = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box.push((br * 3 + r) * 9 + bc * 3 + c);
    const empty = box.filter(i => !cells[i]);
    if (empty.length < 3) continue;
    for (let d = 1; d <= 9; d++) {
      if (box.some(i => cells[i] === d)) continue;
      const free = empty.filter(i => !rowHas(Math.floor(i / 9), d) && !colHas(i % 9, d));
      if (free.length !== 1 || solution[free[0]] !== d) continue;
      // the copies of d whose row or column crosses this box: the lines to draw
      const lines = [];
      for (let i = 0; i < 81; i++) if (cells[i] === d) {
        const r = Math.floor(i / 9), c = i % 9;
        if (Math.floor(r / 3) === br) lines.push({ from: i, kind: 'row' });
        if (Math.floor(c / 3) === bc) lines.push({ from: i, kind: 'col' });
      }
      // every blocked empty cell must be on a drawn line, so the picture explains the move
      const covered = empty.filter(i => i !== free[0]).every(i => lines.some(l => l.kind === 'row' ? Math.floor(l.from / 9) === Math.floor(i / 9) : l.from % 9 === i % 9));
      if (!covered) continue;
      const score = empty.length * 10 - lines.length;
      if (!best || score > best.score) best = { box: b, d, cell: free[0], lines, score };
    }
  }
  return best;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 420, height: 800 }, deviceScaleFactor: 1.4 });
  await p.goto(`${SITE}/labs/sudoku/?seed=SPLASH`);
  await p.waitForTimeout(800);
  await p.evaluate(() => window.__sudoku.start?.('easy'));
  await p.waitForTimeout(4500);
  await p.evaluate(() => {
    window.__sudoku.solveAllBut(34);
    const bd = document.getElementById('board');
    Object.assign(bd.style, { position: 'relative', zIndex: 50, transition: 'none', border: '0', borderRadius: '0' });
    // only the board on a plain ground, so the margin around it is even on every side and in every zoom
    const css = document.createElement('style');
    css.textContent = 'html, body { background: #1a0d33 !important; } body * { visibility: hidden; } #board, #board * { visibility: visible; }';
    document.head.append(css);
    const ring = document.createElement('div');
    ring.id = 'clip-ring';
    Object.assign(ring.style, { position: 'absolute', width: '33.333%', height: '33.333%', boxSizing: 'border-box', border: '1.5px solid #ffd23f', borderRadius: '3px', opacity: 0, pointerEvents: 'none', boxShadow: '0 0 0 2000px rgb(10 4 30 / 0.45)' });
    bd.append(ring);
    document.getElementById('hint')?.style.setProperty('visibility', 'hidden');
  });
  // the frame: exactly the board, with no ground around it (the owner: no dark band outside the grid)
  const PAD = 0;
  const r = await p.$eval('#board', (e, PAD) => { const x = e.getBoundingClientRect(); const m = x.width * PAD; return { x: x.x - m, y: x.y - m, width: x.width + 2 * m, height: x.height + 2 * m }; }, PAD);

  let n = 0;
  const shot = () => p.screenshot({ path: `${OUT}/f${String(n++).padStart(4, '0')}.png`, clip: r });
  const hold = async k => { for (let i = 0; i < k; i++) await shot(); };
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  // zoomed, the frame holds the box and one whole cell of the board on each side: (3 + 2) / 9 × S = 1 + 2 × PAD
  const S = (1 + 2 * PAD) * 9 / 5;
  const view = (u, box) => p.evaluate(([u, box, S]) => {
    const bd = document.getElementById('board');
    const ox = ((box % 3) * 3 + 1.5) / 9 * 100, oy = (Math.floor(box / 3) * 3 + 1.5) / 9 * 100;
    const s = 1 + (S - 1) * u;
    bd.style.transformOrigin = '0 0';
    // centered on the box, but never past the board's edge: the frame shows only the grid
    const clamp = t => Math.min(0, Math.max(-(s - 1) * 100, t));
    bd.style.transform = `translate(${clamp(u * (50 - ox * s))}%, ${clamp(u * (50 - oy * s))}%) scale(${s})`;
    const ring = document.getElementById('clip-ring');
    Object.assign(ring.style, { left: `${(box % 3) * 33.333}%`, top: `${Math.floor(box / 3) * 33.333}%`, opacity: u });
  }, [u, box, S]);
  // paint cells: a list of [index, css background]
  const paint = list => p.evaluate(list => {
    for (const [i, bg] of list) { const c = document.querySelector(`#board .cell[data-i="${i}"]`); if (c) c.style.background = bg; }
  }, list);
  const clear = () => p.evaluate(() => document.querySelectorAll('#board .cell').forEach(c => { c.style.background = ''; c.style.boxShadow = ''; }));
  const ringCells = (list, on) => p.evaluate(([list, on]) => list.forEach(i => {
    const c = document.querySelector(`#board .cell[data-i="${i}"]`); if (c) c.style.boxShadow = on ? 'inset 0 0 0 2px #2ee6d6' : '';
  }), [list, on]);

  const LINE = 'rgb(255 210 63 / 0.28)', SRC = 'rgb(46 230 214 / 0.35)', FREE = 'rgb(255 210 63 / 0.55)';
  await view(0, 4);
  await hold(20);
  const used = [];
  for (let step = 0; step < 2; step++) {
    const st = await p.evaluate(() => { const s = window.__sudoku.state(); return { cells: s.cells, solution: s.solution }; });
    const m = findStep(st.cells, st.solution, used);
    if (!m) break;
    used.push(m.box);
    const sources = [...new Set(m.lines.map(l => l.from))];
    // 1. the copies of the digit light up
    await paint(sources.map(i => [i, SRC])); await ringCells(sources, true);
    await hold(14);
    // 2. their rows and columns sweep across the whole grid, outward from each copy
    const painted = new Set(sources);
    for (let k = 1; k <= 8; k++) {
      const add = [];
      for (const l of m.lines) {
        const r0 = Math.floor(l.from / 9), c0 = l.from % 9;
        for (const s of [-k, k]) {
          const i = l.kind === 'row' ? (c0 + s >= 0 && c0 + s < 9 ? r0 * 9 + c0 + s : -1) : (r0 + s >= 0 && r0 + s < 9 ? (r0 + s) * 9 + c0 : -1);
          if (i >= 0 && !painted.has(i)) { painted.add(i); add.push([i, LINE]); }
        }
      }
      await paint(add); await hold(2);
    }
    await hold(12);
    // 3. zoom into the box: the lines leave one free cell
    for (let i = 1; i <= 24; i++) { await view(ease(i / 24), m.box); await shot(); }
    await paint([[m.cell, FREE]]);
    for (let k = 0; k < 3; k++) { await ringCells([m.cell], true); await hold(5); await ringCells([m.cell], false); await hold(4); }
    // 4. the digit goes there
    await p.evaluate(([i, d]) => window.__sudoku.play(i, d), [m.cell, m.d]);
    await p.evaluate(() => { const s = document.querySelector('#board .cell.sel'); if (s) s.classList.remove('sel'); });
    await paint([[m.cell, FREE]]);
    await hold(22);
    // 5. lines off, zoom back out
    await clear();
    await p.evaluate(() => document.querySelectorAll('#board .cell.same, #board .cell.peer, #board .cell.sel').forEach(c => c.classList.remove('same', 'peer', 'sel')));
    for (let i = 1; i <= 24; i++) { await view(1 - ease(i / 24), m.box); await shot(); }
    await hold(10);
  }
  await hold(14);
  console.log(n, 'frames; boxes', used.join(','));
  await b.close();
})();
