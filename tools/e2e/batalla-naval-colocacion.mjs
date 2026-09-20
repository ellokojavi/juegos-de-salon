import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9461, dir: `${OUT}/p`, out: OUT });
const tapCell = name => b.evaluate(`(()=>{const r=parseInt('${name}'.slice(1))-1,c='ABCDEFGHIJ'.indexOf('${name}'[0]);const x=document.querySelector('#place-grid .cell[data-r="'+r+'"][data-c="'+c+'"]');if(!x)return 'no';x.click();return 'ok'})()`);
const state = () => b.evaluate(`(()=>{const d=__bn.session().draft.A;const sel=[...document.querySelectorAll('#place-grid .cell.sel')].map(x=>'ABCDEFGHIJ'[x.dataset.c]+(+x.dataset.r+1));const rot=document.querySelector('#place-grid .rot');const rc=rot?rot.parentElement:null;return JSON.stringify({sel:d.sel,dir:d.dir,layout:d.layout,selCells:sel,rotAt:rc?'ABCDEFGHIJ'[rc.dataset.c]+(+rc.dataset.r+1):null,count:document.getElementById('place-count').textContent})})()`).then(JSON.parse);
await b.go('http://localhost:8765/batalla-naval/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/batalla-naval/');
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
await b.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(400);
await tapCell('A1'); await tapCell('A3'); // portaaviones A1-E1 h, acorazado A3-D3 h
let st = await state(); console.log('tras colocar 2:', JSON.stringify({ count: st.count, sel: st.sel, rotAt: st.rotAt }));
await tapCell('C1'); st = await state(); console.log('toco el portaaviones →', JSON.stringify({ sel: st.sel, selCells: st.selCells, rotAt: st.rotAt })); await b.shot('sel-ship');
await b.evaluate(`document.querySelector('#place-grid .rot').click(); 1`); st = await state(); console.log('giro con ↻ →', JSON.stringify({ layout: st.layout.carrier, selCells: st.selCells, rotAt: st.rotAt }));
await b.shot('rotated');
await tapCell('F6'); st = await state(); console.log('toco F6 con el barco seleccionado → se mueve:', JSON.stringify({ layout: st.layout.carrier, selCells: st.selCells, rotAt: st.rotAt }));
await b.evaluate(`document.querySelector('#place-grid .rot').click(); 1`); st = await state(); console.log('giro en F6 (válido) →', JSON.stringify({ layout: st.layout.carrier, selCells: st.selCells, rotAt: st.rotAt })); await b.shot('rotated-valid');
await tapCell('B3'); st = await state(); console.log('toco el acorazado → cambia la selección:', JSON.stringify({ sel: st.sel, selCells: st.selCells, rotAt: st.rotAt }));
await tapCell('B3'); st = await state(); console.log('lo toco de nuevo → deselecciona:', JSON.stringify({ sel: st.sel, selCells: st.selCells, rotAt: st.rotAt }));
await tapCell('J10'); st = await state(); console.log('toco casilla vacía sin selección → coloca el siguiente libre (crucero) si cabe:', st.count);
// Arrastrar (D-90): desde la ficha al tablero, y desde el tablero con OTRO barco seleccionado.
// El gesto va por eventos de puntero, que es como llega de un dedo o de un mouse de verdad.
await b.evaluate(`window.__arrastra = async (desde, hasta) => {
  const ev = (t, el, x, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }));
  const a = desde.getBoundingClientRect(), z = hasta.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = z.left + z.width / 2, y1 = z.top + z.height / 2;
  ev('pointerdown', desde, x0, y0);
  for (let i = 1; i <= 6; i++) { const x = x0 + (x1 - x0) * i / 6, y = y0 + (y1 - y0) * i / 6; ev('pointermove', document.elementFromPoint(x, y) || desde, x, y); await new Promise(r => setTimeout(r, 20)); }
  ev('pointerup', document.elementFromPoint(x1, y1) || hasta, x1, y1);
  await new Promise(r => setTimeout(r, 150));
};
window.__celda = (r, c) => document.querySelector('#place-grid .cell[data-r="' + r + '"][data-c="' + c + '"]');
window.__ficha = id => document.querySelector('.ship-chip[data-ship="' + id + '"]'); 1`);
await b.evaluate(`__arrastra(__ficha('destroyer'), __celda(7, 1))`); await sleep(400);
st = await state(); console.log('arrastro la ficha del destructor al tablero →', JSON.stringify({ sel: st.sel, layout: st.layout.destroyer, rotAt: st.rotAt }));
await tapCell('A3'); st = await state(); console.log('selecciono el acorazado →', JSON.stringify({ sel: st.sel }));
await b.evaluate(`__arrastra(__celda(7, 1), __celda(0, 7))`); await sleep(400);
st = await state(); console.log('arrastro el destructor con el acorazado elegido → se mueve Y queda elegido:', JSON.stringify({ sel: st.sel, layout: st.layout.destroyer, rotAt: st.rotAt }));
await b.shot('arrastre-elige');
// Durante el arrastre no hay ↻: girar no se puede con el barco en el aire.
await b.evaluate(`window.__mitad = async () => {
  const ev = (t, el, x, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }));
  const desde = __celda(0, 7), hasta = __celda(4, 7);
  const a = desde.getBoundingClientRect(), z = hasta.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = z.left + z.width / 2, y1 = z.top + z.height / 2;
  ev('pointerdown', desde, x0, y0);
  ev('pointermove', document.elementFromPoint(x1, y1) || hasta, x1, y1);
  await new Promise(r => setTimeout(r, 60));
  const durante = !!document.querySelector('#place-grid .rot');
  ev('pointerup', document.elementFromPoint(x1, y1) || hasta, x1, y1);
  await new Promise(r => setTimeout(r, 150));
  return JSON.stringify({ durante, despues: !!document.querySelector('#place-grid .rot') });
}; 1`);
const rot = await b.evaluate('__mitad()');
console.log('el ↻ mientras se arrastra y después de soltar →', rot);
// Entrada de verdad (D-90): el mismo toque, pero fabricado por Chrome y no por `.click()`.
// Esto es lo que se le escapó a la prueba cuando el puntero se tomaba al apoyar el dedo.
const centro = sel => b.evaluate(`(()=>{const e=document.querySelector('${sel}');if(!e)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)})})()`).then(v => (v ? JSON.parse(v) : null));
await b.evaluate(`(()=>{const d=__bn.session().draft.A; d.sel=null; document.querySelector('#place-actions .btn').click(); return 1})()`); await sleep(300);
const pBarco = await centro('#place-grid .cell.ship');
await b.toque(pBarco.x, pBarco.y);
st = await state(); console.log('toque de verdad sobre un barco →', JSON.stringify({ sel: st.sel, selCells: st.selCells.length, rotAt: st.rotAt }));
const pFicha = await centro('.ship-chip:not(.done)');
const pVacia = await centro('#place-grid .cell[data-r="0"][data-c="0"]');
await b.arrastre(pFicha.x, pFicha.y, pVacia.x, pVacia.y);
st = await state(); console.log('arrastre de verdad de una ficha al tablero →', JSON.stringify({ sel: st.sel, layout: st.layout[st.sel], rotAt: st.rotAt }));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
