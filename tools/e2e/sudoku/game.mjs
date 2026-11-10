// Sudoku (lab): picks each level, plays a digit that repeats (it turns red and costs 10 points), a note
// and an undo, fills the board through the hook and checks the result and its score; then the conformance checks run it in every language
// (tools/e2e/conformance.mjs).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };
const S = '__sudoku';

await b.go(SITE + '/labs/sudoku/?seed=e2e'); await b.evaluate('localStorage.clear(); 1'); await b.go(SITE + '/labs/sudoku/?seed=e2e');
ok(await b.evaluate("document.getElementById('btn-level').getAttribute('aria-checked')") === 'false', 'the lever starts down, on easy');
ok(await b.evaluate("document.querySelectorAll('#demo .sd-dcell').length") === 81, 'the cover shows the demo board');
await sleep(1200);
ok(await b.evaluate("!!document.getElementById('demo-caption').textContent"), 'the demo says why a digit goes');
ok(await b.evaluate("!!document.getElementById('best-line').textContent"), 'the cover shows the best score line');

for (const level of ['easy', 'hard']) {
  if (level === 'hard') {
    await b.evaluate("document.getElementById('btn-level').click(); 1"); await sleep(400);
    ok(await b.evaluate("document.getElementById('btn-level').classList.contains('on')"), 'the lever goes up to hard (red)');
    ok(await b.evaluate("document.body.classList.contains('sd-hard')"), 'hard turns the cover over');
    await b.shot('cover-hard');
  }
  await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(400);
  ok(await b.active() === 'screen-play', `${level}: the board opens`);
  ok(await b.evaluate(`window.${S}.state().level`) === level, `${level}: at that level`);
  ok(await b.evaluate("document.querySelectorAll('#board .cell').length") === 81, `${level}: 81 cells`);
  if (level === 'easy') {
    // A digit that repeats in its row turns red; undo takes it back
    const r = JSON.parse(await b.evaluate(`(() => { const s = window.${S}.state();
      const i = s.cells.findIndex(d => !d); const row = Math.floor(i / 9);
      const d = s.cells.slice(row * 9, row * 9 + 9).find(Boolean);
      document.querySelector('#board .cell[data-i="' + i + '"]').click();
      document.getElementById('key-' + d).click();
      const red = document.querySelector('#board .cell[data-i="' + i + '"]').classList.contains('bad');
      document.getElementById('btn-undo').click();
      const back = window.${S}.state().cells[i] === 0;
      const score = document.getElementById('score-line').textContent;
      document.getElementById('btn-notes').click(); document.getElementById('key-5').click(); document.getElementById('btn-notes').click();
      const note = !!document.querySelector('#board .cell[data-i="' + i + '"] .notes');
      return JSON.stringify({ red, back, note, score }); })()`));
    ok(r.red, 'a repeated digit turns red');
    ok(r.back, 'undo takes it back');
    ok(r.note, 'a note is written in the cell');
    ok(/90/.test(r.score), `the wrong digit cost 10 points (${r.score})`);
    await b.shot('play-easy');
  }
  await b.evaluate(`window.${S}.solveAllBut(1); 1`); await sleep(200);
  await b.evaluate(`(() => { const s = window.${S}.state(); const i = s.cells.findIndex(d => !d);
    document.querySelector('#board .cell[data-i="' + i + '"]').click(); document.getElementById('key-' + s.solution[i]).click(); })(); 1`);
  await sleep(400);
  ok(await b.active() === 'screen-result', `${level}: the last digit reaches the result`);
  ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), `${level}: the result goes back to the lab (C-19)`);
  const sc = await b.evaluate("document.getElementById('result-score').textContent");
  ok(new RegExp(level === 'easy' ? '90' : '100').test(sc), `${level}: the result shows the score (${sc})`);
  if (level === 'easy') await b.shot('result');
  ok(await b.evaluate("!!document.getElementById('result-ranking')"), `${level}: the result has the ranking slot`);
  await b.evaluate("document.getElementById('btn-levels').click(); 1"); await sleep(400);
}
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
