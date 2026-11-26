// Gemelos (lab): plays today's board to the end with real drags and taps: a merge that cannot be made, a
// drag onto a twin, a tap-then-tap merge, ↩ undo, a dead end and the 💡 hint that undoes it, a reload in the
// middle (C-6), then the solver's way to one number and the result (C-19). Then `?seed=` opens another board.
// Each screen is shot (b.shot measures margins and overlaps) at 390 px, and again at 320 px.
// The conformance checks run it in every language (tools/e2e/conformance.mjs).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT, clock: true });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };
const st = () => b.evaluate('JSON.stringify(window.__twins.state())').then(JSON.parse);
/** The centre of cell `i` on the board, in page pixels. */
const at = i => b.evaluate(`(() => { const r = document.querySelector('#board [data-i="${i}"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
const dragCell = async (from, to) => { const [x0, y0] = await at(from); const [x1, y1] = await at(to); await b.drag(x0, y0, x1, y1, 8); await sleep(150); };
const tapCell = async i => { const [x, y] = await at(i); await b.tap(x, y); await sleep(120); };
const isWide = async () => b.evaluate("document.documentElement.scrollWidth <= innerWidth");

for (const width of [390, 320]) {
  const tag = width === 320 ? '-320' : '';
  await b.resize(width, width === 320 ? 640 : 844);
  await b.go(SITE + '/labs/twins/'); await b.evaluate('localStorage.clear(); 1'); await b.go(SITE + '/labs/twins/');
  ok(/Sumbreak/.test(await b.evaluate("document.querySelector('.credito a')?.textContent || ''"))
    && await b.evaluate("document.querySelector('.credito a').href") === 'https://www.linkedin.com/games/sumbreak', `${width}: the cover credits Sumbreak, with its link`);
  await b.shot('cover' + tag);
  await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(300);
  ok(await b.active() === 'screen-play', `${width}: today's board opens`);
  ok(/n\.º 1\b/.test(await b.evaluate("document.getElementById('board-label').textContent")), `${width}: board number 1 on its launch day`);
  ok(await isWide(), `${width}: the board fits the screen`);
  const s0 = await st();
  const n0 = s0.cells.filter(Boolean).length;
  ok(await b.evaluate("document.querySelectorAll('#board .tile').length") === n0 && await b.evaluate("document.querySelectorAll('#board [data-i]').length") === 25, `${width}: ${n0} numbers on a 5 × 5 grid`);

  if (width === 390) {
    // A number dropped on a different one goes back: nothing changes
    const cells = s0.cells;
    const nb = i => [i - 5, i + 5, i % 5 ? i - 1 : -1, i % 5 < 4 ? i + 1 : -1].filter(j => j >= 0 && j < 25);
    const bad = cells.flatMap((v, i) => (v ? nb(i).filter(j => cells[j] && cells[j] !== v).map(j => [i, j]) : []))[0];
    if (bad) { await dragCell(...bad); ok((await st()).history.length === 0, 'a number dropped on a different one goes back'); }
    // A real drag onto a twin: the sum lands where it was dropped
    const [a, c] = (await b.evaluate('JSON.stringify(window.__twins.solve())').then(JSON.parse))[0];
    await dragCell(a, c);
    let s = await st();
    ok(s.cells[c] === cells[a] * 2 && !s.cells[a], `a drag merges ${cells[a]} + ${cells[a]} = ${cells[a] * 2} on the cell it was dropped on`);
    // Tap, then tap its twin
    const [a2, c2] = (await b.evaluate('JSON.stringify(window.__twins.solve())').then(JSON.parse))[0];
    await tapCell(a2);
    ok(await b.evaluate(`document.querySelector('#board [data-i="${a2}"]').classList.contains('tile--picked')`), 'a tap picks a number');
    await tapCell(c2);
    s = await st();
    ok(s.history.length === 2 && s.cells[c2] === s.history[1][a2] * 2, 'and a tap on its twin merges them');
    await b.shot('play');
    // ↩ Undo is free
    await b.evaluate("document.getElementById('btn-undo').click(); 1"); await sleep(150);
    s = await st();
    ok(s.history.length === 1 && s.hints === 0, '↩ undoes the last merge, for free');
    // Into a dead end: merge whatever is left until no move remains, from a board that cannot be solved
    const trap = await b.evaluate(`(() => { const s = window.__twins.state(); return JSON.stringify(s); })()`).then(JSON.parse);
    const stuckBy = await b.evaluate(`(async () => {
      const E = await import('/labs/twins/engine.js');
      const s = window.__twins.state();
      const t = E.moves(s.cells).find(([x, y]) => !E.solvable(E.merge(s.cells, x, y)));
      if (!t) return 0;
      window.__twins.merge(...t);
      let k = 1;
      for (let m; (m = E.moves(window.__twins.state().cells)).length; k++) window.__twins.merge(...m[0]);
      return k;
    })()`);
    ok(stuckBy > 0, 'a merge that leads to a dead end exists');
    ok(/jugada/.test(await b.evaluate("document.getElementById('notice').textContent")), 'with no merge left the board says so');
    await b.shot('stuck');
    // The 💡 hint: it undoes back to a solvable board and shows the merge
    ok(/10/.test(await b.evaluate("document.getElementById('btn-hint').textContent")), 'the hint says what it costs');
    await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(200);
    s = await st();
    ok(s.hints === 1 && s.history.length === trap.history.length, 'the hint undid the merges into the dead end');
    ok(/deshice/.test(await b.evaluate("document.getElementById('notice').textContent")), 'and says so');
    ok(await b.evaluate("!!document.querySelector('#board .tile--from') && !!document.querySelector('#board .tile--to')"), 'the number to drag pulses and its twin is ringed');
    await b.shot('hint');
    // Resume (C-6): a reload in the middle comes back to the same board
    await b.go(SITE + '/labs/twins/');
    ok(await b.evaluate("!!document.getElementById('btn-resume')"), 'a board half played offers to continue');
    await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(300);
    ok((await st()).hints === 1 && (await st()).history.length === trap.history.length, 'and comes back with its merges and its hint');
    // The hinted merge by a drag
    const h = await b.evaluate('JSON.stringify(window.__twins.solve()[0])').then(JSON.parse);
    await dragCell(...h);
  }

  // The rest, the solver's way
  const way = await b.evaluate('JSON.stringify(window.__twins.solve())').then(JSON.parse);
  for (const [x, y] of way.slice(0, -1)) await b.evaluate(`window.__twins.merge(${x}, ${y}); 1`);
  ok(/Queda 1|Quedan 2/.test(await b.evaluate("document.getElementById('left').textContent")), `${width}: the count of numbers left goes down`);
  await dragCell(...way.at(-1));
  ok(await b.active() === 'screen-result', `${width}: one number left: the result`);
  const end = await st();
  ok(end.done && end.cells.filter(Boolean).length === 1, `${width}: one number on the board`);
  const title = await b.evaluate("document.getElementById('result-title').textContent");
  ok(/^\d+ de 100$/.test(title), `${width}: the score out of 100 (${title})`);
  if (width === 390) {
    ok(Number(title.split(' ')[0]) <= 90, 'the hint took 10 off');
    ok(/1 pista: −10/.test(await b.evaluate("document.getElementById('result-line').textContent")), 'and the result says why');
  }
  ok(!/Sumbreak|LinkedIn/.test(await b.evaluate("document.getElementById('screen-result').textContent")), `${width}: no credit on the result (only on the cover)`);
  ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), `${width}: the result goes back to the lab (C-19)`);
  ok(await b.evaluate("!!document.getElementById('btn-share')"), `${width}: a share button`);
  await b.shot('result' + tag);

  // Today is done: the cover says so, and the day opens on its result
  await b.go(SITE + '/labs/twins/');
  ok(/de 100/.test(await b.evaluate("document.getElementById('today-note').textContent")), `${width}: the cover shows today's score`);
  await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(300);
  ok(await b.active() === 'screen-result', `${width}: and today opens on its result`);
}

// ?seed=: another board, the same for whoever opens the link, outside the day
await b.go(SITE + '/labs/twins/?seed=abc');
await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(300);
const seeded = await st();
ok(seeded.seed === 'abc' && !seeded.date && await b.active() === 'screen-play', '?seed= opens its own board, not the finished day');
ok(/abc/.test(await b.evaluate("document.getElementById('board-label').textContent")), 'and names it by its seed');
const again = await b.evaluate(`import('/labs/twins/engine.js').then(E => JSON.stringify(E.generate('abc').cells))`);
ok(JSON.stringify(seeded.board.cells) === again, 'the same seed, the same board');

ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
