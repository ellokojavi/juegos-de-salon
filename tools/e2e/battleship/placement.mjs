import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
// With several sessions at once, each serves its copy on its own port (D-135)
const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 9461, dir: `${OUT}/p`, out: OUT });
const tapCell = name => b.evaluate(`(()=>{const r=parseInt('${name}'.slice(1))-1,c='ABCDEFGHIJ'.indexOf('${name}'[0]);const x=document.querySelector('#place-grid .cell[data-r="'+r+'"][data-c="'+c+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
const state = () => b.evaluate(`(()=>{const d=__bn.session().draft.A;const sel=[...document.querySelectorAll('#place-grid .cell.sel')].map(x=>'ABCDEFGHIJ'[x.dataset.c]+(+x.dataset.r+1));const rot=document.querySelector('#place-grid .rot');const rc=rot?rot.parentElement:null;return JSON.stringify({sel:d.sel,dir:d.dir,layout:d.layout,selCells:sel,rotAt:rc?'ABCDEFGHIJ'[rc.dataset.c]+(+rc.dataset.r+1):null,count:document.getElementById('place-count').textContent})})()`).then(JSON.parse);
await b.go(`${SITE}/battleship/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITE}/battleship/`);
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await b.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(400);
await tapCell('A1'); await tapCell('A3'); // carrier A1-E1 h, battleship A3-D3 h
let st = await state(); console.log('after placing 2:', JSON.stringify({ count: st.count, sel: st.sel, rotAt: st.rotAt }));
await tapCell('C1'); st = await state(); console.log('tap the carrier →', JSON.stringify({ sel: st.sel, selCells: st.selCells, rotAt: st.rotAt })); await b.shot('sel-ship');
await b.evaluate(`document.querySelector('#place-grid .rot').click(); 1`); st = await state(); console.log('rotate with ↻ →', JSON.stringify({ layout: st.layout.carrier, selCells: st.selCells, rotAt: st.rotAt }));
await b.shot('rotated');
await tapCell('F6'); st = await state(); console.log('tap F6 with the ship selected → it moves:', JSON.stringify({ layout: st.layout.carrier, selCells: st.selCells, rotAt: st.rotAt }));
await b.evaluate(`document.querySelector('#place-grid .rot').click(); 1`); st = await state(); console.log('rotate at F6 (valid) →', JSON.stringify({ layout: st.layout.carrier, selCells: st.selCells, rotAt: st.rotAt })); await b.shot('rotated-valid');
await tapCell('B3'); st = await state(); console.log('tap the battleship → selection changes:', JSON.stringify({ sel: st.sel, selCells: st.selCells, rotAt: st.rotAt }));
await tapCell('B3'); st = await state(); console.log('tap it again → deselects:', JSON.stringify({ sel: st.sel, selCells: st.selCells, rotAt: st.rotAt }));
await tapCell('J10'); st = await state(); console.log('tap an empty cell with no selection → places the next free one (cruiser) if it fits:', st.count);
// Dragging (D-90): from the chip to the board, and from the board with ANOTHER ship selected.
// The gesture goes through pointer events, which is how it arrives from a real finger or mouse.
await b.evaluate(`window.__drag = async (from, to) => {
  const ev = (t, el, x, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }));
  const a = from.getBoundingClientRect(), z = to.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = z.left + z.width / 2, y1 = z.top + z.height / 2;
  ev('pointerdown', from, x0, y0);
  for (let i = 1; i <= 6; i++) { const x = x0 + (x1 - x0) * i / 6, y = y0 + (y1 - y0) * i / 6; ev('pointermove', document.elementFromPoint(x, y) || from, x, y); await new Promise(r => setTimeout(r, 20)); }
  ev('pointerup', document.elementFromPoint(x1, y1) || to, x1, y1);
  await new Promise(r => setTimeout(r, 150));
};
window.__cell = (r, c) => document.querySelector('#place-grid .cell[data-r="' + r + '"][data-c="' + c + '"]');
window.__chip = id => document.querySelector('.ship-chip[data-ship="' + id + '"]'); 1`);
await b.evaluate(`__drag(__chip('destroyer'), __cell(7, 1))`); await sleep(400);
st = await state(); console.log('drag the destroyer chip to the board →', JSON.stringify({ sel: st.sel, layout: st.layout.destroyer, rotAt: st.rotAt }));
await tapCell('A3'); st = await state(); console.log('select the battleship →', JSON.stringify({ sel: st.sel }));
await b.evaluate(`__drag(__cell(7, 1), __cell(0, 7))`); await sleep(400);
st = await state(); console.log('drag the destroyer with the battleship chosen → it moves AND stays chosen:', JSON.stringify({ sel: st.sel, layout: st.layout.destroyer, rotAt: st.rotAt }));
await b.shot('drag-selects');
// During the drag there is no ↻: you can't rotate with the ship in the air.
await b.evaluate(`window.__midway = async () => {
  const ev = (t, el, x, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }));
  const from = __cell(0, 7), to = __cell(4, 7);
  const a = from.getBoundingClientRect(), z = to.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = z.left + z.width / 2, y1 = z.top + z.height / 2;
  ev('pointerdown', from, x0, y0);
  ev('pointermove', document.elementFromPoint(x1, y1) || to, x1, y1);
  await new Promise(r => setTimeout(r, 60));
  const during = !!document.querySelector('#place-grid .rot');
  ev('pointerup', document.elementFromPoint(x1, y1) || to, x1, y1);
  await new Promise(r => setTimeout(r, 150));
  return JSON.stringify({ during, after: !!document.querySelector('#place-grid .rot') });
}; 1`);
const rot = await b.evaluate('__midway()');
console.log('the ↻ while dragging and after dropping →', rot);
// Real input (D-90): the same tap, but made by Chrome and not by `.click()`.
// This is what the test missed when the pointer was captured on finger-down.
const center = sel => b.evaluate(`(()=>{const e=document.querySelector('${sel}');if(!e)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)})})()`).then(v => (v ? JSON.parse(v) : null));
await b.evaluate(`(()=>{const d=__bn.session().draft.A; d.sel=null; document.querySelector('#place-actions .btn').click(); return 1})()`); await sleep(300);
const pShip = await center('#place-grid .cell.ship');
await b.tap(pShip.x, pShip.y);
st = await state(); console.log('real tap on a ship →', JSON.stringify({ sel: st.sel, selCells: st.selCells.length, rotAt: st.rotAt }));
const pChip = await center('.ship-chip:not(.done)');
const pEmpty = await center('#place-grid .cell[data-r="0"][data-c="0"]');
await b.drag(pChip.x, pChip.y, pEmpty.x, pEmpty.y);
st = await state(); console.log('real drag of a chip to the board →', JSON.stringify({ sel: st.sel, layout: st.layout[st.sel], rotAt: st.rotAt }));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
