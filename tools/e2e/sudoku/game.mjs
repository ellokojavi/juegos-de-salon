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
  ok(await b.evaluate("!!document.getElementById('cuenta')"), `${level}: the 3, 2, 1 shows before playing`);
  await sleep(4000);
  ok(!await b.evaluate("!!document.getElementById('cuenta')"), `${level}: the countdown goes away`);
  ok(await b.active() === 'screen-play', `${level}: the board opens`);
  ok(await b.evaluate(`window.${S}.state().level`) === level, `${level}: at that level`);
  const cellsN = level === 'easy' ? 36 : 81;
  ok(await b.evaluate("document.querySelectorAll('#board .cell').length") === cellsN, `${level}: ${cellsN} cells (easy is the 6×6 mini sudoku)`);
  ok(await b.evaluate("document.querySelectorAll('#pad .key').length") === Math.sqrt(cellsN), `${level}: the pad has 1 to ${Math.sqrt(cellsN)}`);
  if (level === 'easy') {
    // A digit that repeats in its row turns red; undo takes it back
    const r = JSON.parse(await b.evaluate(`(() => { const s = window.${S}.state();
      const i = s.cells.findIndex(d => !d); const n = Math.sqrt(s.cells.length), row = Math.floor(i / n);
      const d = s.cells.slice(row * n, row * n + n).find(Boolean);
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
// Giving up asks twice (U-15): the first tap arms it, the second ends with 0 and the solution
await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(400);
ok(!(await b.evaluate("!!document.getElementById('btn-erase')")), 'there is no erase button');
// A hint asks twice, fills the selected cell with its digit and says why; a right digit celebrates (the owner, 2026-11-11)
for (let t = 0; t < 30 && await b.evaluate("!!document.getElementById('cuenta')"); t++) await sleep(200);
const hcell = await b.evaluate(`(() => { const s = window.${S}.state(); const i = s.cells.findIndex(d => !d); document.querySelector('#board .cell[data-i="' + i + '"]').click(); return i; })()`);
await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(150);
ok(await b.evaluate("document.getElementById('btn-hint').classList.contains('armado')") && await b.evaluate(`window.${S}.state().cells[${hcell}]`) === 0, 'the first tap on Hint only arms it, saying its price');
await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(150);
const hr = JSON.parse(await b.evaluate(`JSON.stringify({ s: window.${S}.state(), cls: document.querySelector('#board .cell[data-i="${hcell}"]').className, why: document.getElementById('hint').textContent, score: document.getElementById('score-line').textContent })`));
ok(hr.s.cells[hcell] === hr.s.solution[hcell] && /hinted/.test(hr.cls), `the hint fills that cell with its digit, marked (${hr.cls})`);
ok(/💡/.test(hr.why) && /15/.test(hr.why), `it says why, and its price (${hr.why})`);
ok(/85/.test(hr.score), `a hint costs 15 points (${hr.score})`);
ok(/pop-hint/.test(hr.cls), 'the hinted cell pops');
await b.shot('hint');
const rc = await b.evaluate(`(() => { const s = window.${S}.state(); const i = s.cells.findIndex(d => !d); document.querySelector('#board .cell[data-i="' + i + '"]').click(); document.getElementById('key-' + s.solution[i]).click(); return document.querySelector('#board .cell[data-i="' + i + '"]').className; })()`);
ok(/pop-ok/.test(rc), `a right digit pops (${rc})`);
await b.evaluate("document.getElementById('btn-give-up').click(); 1"); await sleep(200);
ok(await b.active() === 'screen-play' && await b.evaluate("document.getElementById('btn-give-up').classList.contains('armado')"), 'the first tap on Give up only arms it');
await b.evaluate("document.getElementById('btn-give-up').click(); 1"); await sleep(400);
ok(await b.active() === 'screen-result', 'the second tap gives up');
ok(/\b0\b/.test(await b.evaluate("document.getElementById('result-score').textContent")), 'giving up scores 0');
ok(await b.evaluate("!document.getElementById('result-board').hidden && document.querySelectorAll('#result-board .cell').length === 81"), 'the result shows the solution');
await b.shot('gave-up');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
