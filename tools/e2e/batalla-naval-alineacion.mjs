import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
// mide, para cada grilla, el desfase vertical entre cada etiqueta de fila y su fila de casillas
const measure = `(sel)=>{const out=[];for(const g of document.querySelectorAll(sel+' .grid')){const lbls=[...g.querySelectorAll('.lbl')].slice(11);let maxDelta=0;for(let r=0;r<10;r++){const l=lbls[r].getBoundingClientRect();const c=g.querySelector('.cell[data-r="'+r+'"][data-c="0"]').getBoundingClientRect();const d=Math.abs((l.top+l.bottom)/2-(c.top+c.bottom)/2);maxDelta=Math.max(maxDelta,d);}out.push({maxDeltaPx:Math.round(maxDelta*10)/10, cell:Math.round(g.querySelector('.cell').getBoundingClientRect().height)});}return JSON.stringify(out)}`;
for (const [w, h, tag] of [[375, 812, 'iphone'], [320, 568, 'se'], [430, 932, 'promax']]) {
  const b = await launch({ port: 9460, dir: `${OUT}/p-${tag}`, out: OUT, width: w, height: h });
  await b.go('http://localhost:8765/batalla-naval/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/batalla-naval/');
  await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(300);
  await b.evaluate(`(()=>{document.querySelector('#setup-form input').value='Javi';return 1})()`);
  await b.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(400);
  console.log(`${tag} ${w}px · colocación:`, await b.evaluate(`(${measure})('#place-grid')`));
  await b.evaluate(`[...document.querySelectorAll('#place-actions .btn')].find(x=>/azar/.test(x.textContent)).click(); 1`); await sleep(150);
  if (tag === 'iphone') await b.shot('place');
  await b.evaluate(`document.querySelector('#place-sail .btn').click(); 1`); await sleep(2500);
  console.log(`${tag} · batalla (enemigo y propia):`, await b.evaluate(`(${measure})('#enemy-grid')`), await b.evaluate(`(${measure})('#mine-wrap')`));
  // llegar al resultado rápido: disparar a la flota del bot conocida
  const cells = await b.evaluate(`(()=>{const L=__bn.session().layouts.B.layout;const S={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2};const o=[];for(const [id,p] of Object.entries(L)){for(let i=0;i<S[id];i++){o.push('ABCDEFGHIJ'[p.dir==='h'?p.c+i:p.c]+((p.dir==='h'?p.r:p.r+i)+1))}}return JSON.stringify(o)})()`).then(JSON.parse);
  for (const c of cells) { const r=parseInt(c.slice(1))-1, col='ABCDEFGHIJ'.indexOf(c[0]); await b.evaluate(`document.querySelector('#enemy-grid .cell[data-r="${r}"][data-c="${col}"]').click(); document.getElementById('fire-btn')?.click(); 1`); await sleep(250); }
  await sleep(1500);
  console.log(`${tag} · resultado (dos flotas):`, await b.evaluate(`(${measure})('#result-fleets')`), '| pantalla:', await b.active());
  if (tag === 'iphone') await b.shot('result');
  console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
  b.close(); await sleep(500);
}
