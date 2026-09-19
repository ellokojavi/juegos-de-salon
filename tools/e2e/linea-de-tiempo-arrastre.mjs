/**
 * Arrastrar la carta a la línea (D-85): el gesto de verdad, con eventos de puntero.
 *
 * Los demás guiones eligen con `el.click()`, que nunca pasa por `pointerdown` y por lo tanto
 * no ejercita nada de esto. Aquí se prueba lo que el jugador hace con el dedo:
 *   1. arrastrar desde la mano hasta una ranura deja la carta elegida, **sin colocarla**
 *   2. retomar la carta ya puesta y llevarla a otra ranura
 *   3. soltarla fuera de la línea la devuelve a la mano
 *   4. un desliz lateral en la mano es scroll, y no elige nada (D-38)
 */
import { launch, sleep } from './cdp.mjs';

const out = process.argv[2] || '/tmp/ldt-arrastre';
const b = await launch({ port: 9231, dir: `${out}/p`, out, width: 375, height: 812 });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const sel = () => b.evaluate(`(()=>{const s=window.__ldt.session();return JSON.stringify({card:s.selCard,slot:s.selSlot})})()`).then(JSON.parse);
const jugadas = () => b.evaluate(`window.__ldt.match().moves.length`);
const centro = s => b.evaluate(`(()=>{const x=document.querySelector('${s}');if(!x)return null;const r=x.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)})})()`).then(v => (v ? JSON.parse(v) : null));

/**
 * Un arrastre con un dedo de verdad, en varios pasos.
 * Tiene que ser `dispatchTouchEvent`: `dispatchMouseEvent` no genera eventos de puntero en
 * este Chrome, así que el gesto entero pasaría de largo sin que nada falle a la vista.
 */
const dedo = (type, p) => b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p.x, y: p.y, id: 1 }] });
async function arrastrar(desde, hasta, { pasos = 10, tiron = true, soltar = true } = {}) {
  await dedo('touchStart', desde);
  // Primero se tira la carta hacia abajo y recién después se lleva al destino, que es como
  // se hace con el dedo. Un tirón en diagonal desde la mano es desliz lateral, y el módulo
  // lo deja pasar como scroll de la tira a propósito (D-38): el guion tiene que imitar el gesto.
  if (tiron) { await dedo('touchMove', { x: desde.x, y: desde.y + (hasta.y < desde.y ? -20 : 20) }); await sleep(16); }
  for (let i = 1; i <= pasos; i++) {
    await dedo('touchMove', { x: Math.round(desde.x + (hasta.x - desde.x) * i / pasos), y: Math.round(desde.y + (hasta.y - desde.y) * i / pasos) });
    await sleep(16);
  }
  if (soltar) { await dedo('touchEnd', hasta); await sleep(250); }
}

await b.go('http://localhost:8765/linea-de-tiempo/'); await b.evaluate(`localStorage.clear(); 1`);
await b.go('http://localhost:8765/linea-de-tiempo/');

// Un solo jugador, mano propia: la pantalla de juego sin pases de por medio
await b.evaluate(`[...document.querySelectorAll('.mode')].find(m=>/solo/i.test(m.textContent)).click(); 1`); await sleep(300);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await clickText('.theme-card', 'Historia'); await sleep(100);
await b.evaluate(`(()=>{const x=[...document.querySelectorAll('#setup-form .seg button')].find(e=>/Mano propia|Own hand/.test(e.textContent));if(x)x.click();return 1})()`); await sleep(150);
await clickText('#setup-form .seg button', 'Corta'); await sleep(100);
await click('#setup-actions .btn'); await sleep(900);
console.log('pantalla:', await b.evaluate(`document.querySelector('.screen.active').id`));

/* 1 · De la mano a una ranura: elige, no coloca -------------------------------- */
const carta = await centro('#hand .card');
const ranura = await centro('#line .slot');
const antes = await jugadas();
console.log('  (carta', JSON.stringify(carta), '→ ranura', JSON.stringify(ranura), ')');
// A mitad del gesto, con la carta en el aire: es la única toma que muestra lo que se arrastra
await arrastrar(carta, ranura, { soltar: false });
console.log('con la carta en el aire:',
  await b.evaluate(`JSON.stringify({vilo: !!document.querySelector('.vilo.on'), texto: document.querySelector('.vilo-carta .t')?.textContent, ancho: Math.round(document.querySelector('.vilo-carta')?.getBoundingClientRect().width), tapado: document.body.classList.contains('arrastrando'), destino: !!document.querySelector('#line .slot.on')})`));
await b.shot('arrastre-0-en-vilo');
await dedo('touchEnd', ranura); await sleep(250);
const trasSoltar = await sel();
console.log('tras arrastrar a la ranura:', JSON.stringify(trasSoltar), '· jugadas:', await jugadas(), `(antes ${antes})`);
console.log('  ' + (trasSoltar.card && trasSoltar.slot !== null ? '✅' : '❌') + ' soltar deja la carta y el lugar elegidos');
console.log('  ' + ((await jugadas()) === antes ? '✅' : '❌') + ' soltar NO coloca: eso lo hace el botón (C-8)');
console.log('  ' + (await b.evaluate(`!!document.querySelector('#line .slot.on .ghost')`) ? '✅' : '❌') + ' la ranura quedó abierta con la carta dentro');
console.log('  ' + (await b.evaluate(`!document.querySelector('#place-row .btn').disabled`) ? '✅' : '❌') + ' el botón de confirmar quedó habilitado');
await b.shot('arrastre-1-elegida');

/* 2 · Retomar la carta puesta y llevarla a otra ranura ------------------------- */
const fantasma = await centro('#line .slot.on .ghost');
const otra = await b.evaluate(`(()=>{const s=[...document.querySelectorAll('#line .slot')];const i=s.findIndex(x=>x.classList.contains('on'));const o=s[i===s.length-1?i-1:i+1];if(!o)return null;const r=o.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),i:+o.dataset.slot})})()`).then(v => (v ? JSON.parse(v) : null));
await arrastrar(fantasma, otra);
const trasMover = await sel();
console.log('tras retomarla y moverla:', JSON.stringify(trasMover), '· esperado slot', otra.i);
console.log('  ' + (trasMover.slot !== null && trasMover.card ? '✅' : '❌') + ' la carta puesta se puede retomar y cambiar de lugar');

/* 3 · Soltarla fuera de la línea la devuelve a la mano ------------------------- */
const fantasma2 = await centro('#line .slot.on .ghost');
await arrastrar(fantasma2, { x: fantasma2.x, y: 30 }, { pasos: 4 });
const trasBotar = await sel();
console.log('tras soltarla fuera:', JSON.stringify(trasBotar));
console.log('  ' + (trasBotar.card === null && trasBotar.slot === null ? '✅' : '❌') + ' soltada fuera de la línea vuelve a la mano sin elegir');

/* 4 · Un desliz lateral en la mano es scroll, no elección (D-38) --------------- */
await b.evaluate(`window.scrollTo(0,0); 1`); await sleep(150);
const carta2 = await centro('#hand .card');
await arrastrar(carta2, { x: carta2.x - 90, y: carta2.y }, { pasos: 6, tiron: false });
const trasDesliz = await sel();
console.log('tras deslizar la mano a lo ancho:', JSON.stringify(trasDesliz));
console.log('  ' + (trasDesliz.card === null ? '✅' : '❌') + ' el desliz lateral no elige carta (D-38)');

/* 5 · Y el botón sigue siendo el que coloca ----------------------------------- */
const carta3 = await centro('#hand .card');
const ranura3 = await centro('#line .slot');
await arrastrar(carta3, ranura3);
const antesDeColocar = await jugadas();
await click('#place-row .btn'); await sleep(700);
console.log('tras confirmar:', 'jugadas', await jugadas(), `(antes ${antesDeColocar})`);
console.log('  ' + ((await jugadas()) === antesDeColocar + 1 ? '✅' : '❌') + ' el botón sí coloca');
await b.shot('arrastre-2-colocada');

console.log('errors:', b.errors, b.logs);
process.exit(0);
