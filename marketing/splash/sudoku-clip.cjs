// The Sudoku splash clip (sudoku-ya, the owner's request 2026-11-11): the real board, half solved,
// zooms into one 3×3 box, fills its empty cells one by one, and zooms back out. Played on the game
// itself (?seed=SPLASH, its window.__sudoku hook) with Playwright, one screenshot per frame.
//
//   python3 -m http.server 8791 -d public &
//   node marketing/splash/sudoku-clip.cjs /tmp/sudoku-frames
//   ffmpeg -framerate 30 -i /tmp/sudoku-frames/f%04d.png -vf "crop=iw-12:ih-12:6:6,scale=480:480,format=yuv420p" \
//     -c:v libx264 -crf 26 -preset slow -movflags +faststart -an public/assets/splash/sudoku.mp4
//
// The poster (sudoku-start.jpg) is the first frame and the still (sudoku.jpg) the last.
// The crop drops the board's own white rounded border: the splash's media frame is the border (no double edge).
const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 420, height: 800 }, deviceScaleFactor: 1.4 });
  await p.goto('http://localhost:8791/labs/sudoku/?seed=SPLASH');
  await p.waitForTimeout(800);
  await p.evaluate(() => window.__sudoku.start?.('easy'));
  await p.waitForTimeout(4500);
  await p.evaluate(() => window.__sudoku.solveAllBut(30));
  // the box with most empty cells
  const plan = await p.evaluate(() => {
    const st = window.__sudoku.state(); let best = null;
    for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
      const cells = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const i = (br*3+r)*9 + bc*3+c; if (!st.cells[i]) cells.push([i, st.solution[i]]); }
      if (!best || cells.length > best.cells.length) best = { br, bc, cells };
    }
    const bd = document.getElementById('board'); bd.style.position = 'relative'; bd.style.zIndex = 50; bd.style.transition = 'none';
    return best;
  });
  const r = await p.$eval('#board', e => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, width: x.width, height: x.height }; });
  let n = 0;
  const shot = async () => p.screenshot({ path: `${OUT}/f${String(n++).padStart(4, '0')}.png`, clip: r });
  const ox = (plan.bc * 3 + 1.5) / 9 * 100, oy = (plan.br * 3 + 1.5) / 9 * 100;
  const S = 2.85;
  const ease = t => t < .5 ? 2*t*t : 1 - (-2*t+2)**2/2;
  const zoom = async s => { const u = (s - 1) / (S - 1); return p.evaluate(([s, u, ox, oy]) => { const bd = document.getElementById('board'); bd.style.transformOrigin = '0 0'; const tx = u * (50 - ox * s), ty = u * (50 - oy * s); bd.style.transform = `translate(${tx}%, ${ty}%) scale(${s})`; }, [s, u, ox, oy]); };
  const hold = async k => { for (let i = 0; i < k; i++) await shot(); };
  await zoom(1); await hold(24);
  for (let i = 1; i <= 30; i++) { await zoom(1 + (S - 1) * ease(i / 30)); await shot(); }
  await hold(8);
  for (const [i, d] of plan.cells) {
    await p.evaluate(([i, d]) => window.__sudoku.play(i, d), [i, d]);
    for (let k = 0; k < 14; k++) { await p.waitForTimeout(25); await shot(); }
  }
  await hold(12);
  for (let i = 1; i <= 30; i++) { await zoom(S - (S - 1) * ease(i / 30)); await shot(); }
  await hold(30);
  console.log(n, JSON.stringify(plan));
  await b.close();
})();
