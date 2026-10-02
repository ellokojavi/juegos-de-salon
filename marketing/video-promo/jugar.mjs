// Juega de verdad cada juego del video y saca una captura por jugada, con dónde fue el toque.
//   node jugar.mjs [juego…]   → plays/<juego>-<n>.png y plays/plays.json (sin nombres: todos)
// Necesita el sitio servido (SITIO, por defecto http://localhost:8765). Ver README.md.
import { abrir, SITIO } from './navegador.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(dir, 'plays'); fs.mkdirSync(OUT, { recursive: true });
const B = SITIO;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Pasos: string = JS silencioso; { tap: 'expr que devuelve el elemento' } = toque visible + captura;
// { drag: [expr, dx, dy] } = arrastre visible + captura; { wait: ms }; { snap: true } = captura sin toque.
const DONDE = (process.env.DONDE || '217,546').split(',').map(Number);
const BOTON = t => `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(t)})`;
const TANGO = [1,1,2,1,2,2,2,1,2,1,1,2,2,2,1,2,1,1,1,1,2,1,2,2,2,2,1,2,1,1,1,2,1,2,2,1];
const TAN = i => `document.querySelector('.tan[data-i="${i}"]')`;
const REJ = i => `document.querySelector('.rej[data-i="${i}"]')`;
const PLAYS = {
  linea: { url: '/linea-de-tiempo/', steps: [
    `[...document.querySelectorAll('.mode')].find(m=>/solo/i.test(m.textContent)).click()`,
    `document.getElementById('btn-solo-empezar').click()`, { wait: 1500 }, { snap: true },
    { tap: `document.querySelectorAll('#solo-juego .hand .card')[1]` },
    { tap: `[...document.querySelectorAll('#solo-juego .line .slot')].at(-1)` },
    { tap: `document.getElementById('btn-colocar')`, after: 900 },
  ] },
  toque: { url: '/toque-y-fama/', steps: [
    `document.querySelectorAll('.mode')[2].click()`, `document.getElementById('btn-solo-empezar').click()`, { wait: 800 },
    `(()=>{const k=d=>[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent===d).click();for(const d of '0123')k(d);document.querySelector('.screen.active .keypad .ok').click()})()`,
    { wait: 600 }, { snap: true },
    ...'4517'.split('').map(d => ({ tap: `[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent==='${d}')`, after: 150 })),
    { tap: `document.querySelector('.screen.active .keypad .ok')`, after: 700 },
  ] },
  ahorcado: { url: '/ahorcado/', steps: [
    `document.querySelectorAll('.mode')[2].click()`,
    `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    `document.querySelector('#setup-actions .btn').click()`, { wait: 1200 },
    // una letra antes de empezar a filmar, y después dos que están
    `((()=>{const w=__ahorcado.view().words.A.toUpperCase();const l=[...new Set(w.replace(/[^A-ZÑ]/g,''))][0];return [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===l)})()).click()`, { wait: 300 }, `[...document.querySelectorAll('.btn')].find(b=>/Probar la/i.test(b.textContent)).click()`, { wait: 900 }, { snap: true },
    { tap: `(()=>{const w=__ahorcado.view().words.A.toUpperCase();const l=[...new Set(w.replace(/[^A-ZÑ]/g,''))][1];return [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===l)})()`, after: 250 },
    { tap: `[...document.querySelectorAll('.btn')].find(b=>/Probar la/i.test(b.textContent))`, after: 700 },
    { tap: `(()=>{const w=__ahorcado.view().words.A.toUpperCase();const l=[...new Set(w.replace(/[^A-ZÑ]/g,''))][2];return [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===l)})()`, after: 250 },
    { tap: `[...document.querySelectorAll('.btn')].find(b=>/Probar la/i.test(b.textContent))`, after: 700 },
  ] },
  dudo: { url: '/dudo/', steps: [
    `document.querySelectorAll('.mode')[2].click()`,
    `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    `document.querySelector('#setup-actions .btn--yellow').click()`, { wait: 1200 }, { snap: true },
    { tap: `document.querySelectorAll('.pinta')[4]`, after: 400 },
    { tap: `[...document.querySelectorAll('#actions button')].find(b=>b.textContent.trim()==='+')`, after: 300 },
    { tap: `document.querySelector('#actions .btn--yellow')`, after: 2600 },
    { tap: `[...document.querySelectorAll('#actions .btn')].find(b=>/Dudo/i.test(b.textContent))`, after: 1500 },
  ] },
  naval: { url: '/batalla-naval/', steps: [
    `document.querySelectorAll('.mode')[2].click()`,
    `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    `document.querySelector('#setup-actions .btn--yellow').click()`, { wait: 500 },
    `[...document.querySelectorAll('#place-actions .btn')].find(b=>/azar/.test(b.textContent)).click()`,
    `document.querySelector('#place-sail .btn').click()`, { wait: 600 },
    `(()=>{const S=window.__bn.session();clearTimeout(S.cpuTimer);S.cpuTimer='frenado';})()`,
    'FALLA_B', { wait: 900 }, { snap: true },
    { tap: 'BARCO_B', after: 300 },
    { tap: 'FUEGO', after: 1100 },
    { tap: 'BARCO_B2', after: 300 },
    { tap: 'FUEGO', after: 1100 },
  ] },
  rey: { url: '/cuarto-rey/', seed: 17, steps: [
    `document.getElementById('btn-go-setup').click()`,
    `[...document.querySelectorAll('#players-form input')].forEach((i,k)=>{i.value=['Javi','Cata','Pancho','Fran'][k];i.dispatchEvent(new Event('input',{bubbles:true}))})`,
    `document.getElementById('btn-start').click()`, { wait: 900 }, { snap: true },
    { tap: `document.getElementById('card')`, after: 1400 },
    { tap: `[...document.querySelectorAll('#result .btn')].at(-1)`, after: 500, luego: `(()=>{const h=document.getElementById('handoff');if(!h.hidden&&/Sigan/i.test(h.innerText))h.click()})()` },
  ] },
  reinas: { url: '/minijuegos/reinas/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 },
    // cinco reinas ya puestas (solución de WNDRN: 7,0,5,2,4,1,6,3); en cámara: X por la fila 6 y las tres últimas
    ...[7, 0, 5, 2, 4].map((c, r) => `document.querySelector('.rej[data-i="${r * 8 + c}"]').click()`), { wait: 600 }, { snap: true },
    { drag: [REJ(5 * 8 + 7), REJ(5 * 8 + 2)], mids: 6, after: 300 },
    { tap: REJ(5 * 8 + 1), after: 350 },
    { tap: REJ(6 * 8 + 6), after: 350 },
    { tap: REJ(7 * 8 + 3), after: 1200 },
  ] },
  tango: { url: '/minijuegos/tango/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 },
    // todo resuelto menos tres casillas (solución de WNDRN); en cámara: sol, sol y luna (dos toques)
    `(()=>{const S=${JSON.stringify(TANGO)};for(let i=0;i<36;i++){if([30,34,35].includes(i))continue;const b=document.querySelector('.tan[data-i="'+i+'"]');if(!b||b.disabled)continue;for(let k=0;k<S[i];k++)document.querySelector('.tan[data-i="'+i+'"]').click();}})()`,
    { wait: 800 }, { snap: true },
    { tap: TAN(35), after: 300 },
    { tap: TAN(30), after: 300 },
    { tap: TAN(34), after: 250 },
    { tap: TAN(34), after: 1200 },
  ] },
  zip: { url: '/minijuegos/zip/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 }, { snap: true },
    // el nivel 1 de un solo trazo, del 1 al 5 pasando por todas
    { trazo: [6, 7, 3, 2, 1, 0, 4, 5, 9, 8, 12, 13, 14, 10, 11, 15], after: 60 },
  ] },
  conexiones: { url: '/minijuegos/conexiones/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 }, { snap: true },
    ...['PICASSO', 'DALÍ', 'MIRÓ', 'VELÁZQUEZ'].map(w => ({ tap: BOTON(w), after: 200 })),
    { tap: `document.getElementById('btn-confirmar')`, after: 1200 },
  ] },
  anio: { url: '/minijuegos/anio/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 }, { snap: true },
    ...'1985'.split('').map(d => ({ tap: BOTON(d), after: 180 })),
    { tap: `[...document.querySelectorAll('button')].find(b=>/^OK$/i.test(b.textContent.trim()))`, after: 1200 },
  ] },
  letras: { url: '/minijuegos/letras/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 },
    // El "null" suelto bajo los intentos es un error de la app (ui-letras.js); no va en el video
    `(()=>{const f=()=>document.querySelectorAll('.letras-juego, .stack').forEach(n=>[...n.childNodes].forEach(c=>{if(c.nodeType===3&&c.textContent==='null')c.remove()}));f();new MutationObserver(f).observe(document.body,{childList:true,subtree:true})})()`,
    `(()=>{for(const c of 'MONTE')[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===c).click();[...document.querySelectorAll('button')].find(b=>/Probar/i.test(b.textContent)).click()})()`,
    { wait: 900 }, { snap: true },
    ...'CLAVO'.split('').map(c => ({ tap: BOTON(c), after: 160 })),
    { tap: `[...document.querySelectorAll('button')].find(b=>/Probar/i.test(b.textContent))`, after: 1000 },
  ] },
  donde: { url: '/minijuegos/donde/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 5000 }, { snap: true },
    { drag: [`document.querySelector('canvas')`, 120, -20], mids: 14, after: 400 },
    { tap: `document.querySelector('canvas')`, at: DONDE, after: 600 },
    { tap: `[...document.querySelectorAll('.btn')].find(b=>/Confirmar/i.test(b.textContent))`, after: 1500 },
  ] },
};

const FALLA_B = `(()=>{const S=window.__bn.session(),L=S.layouts['A'].layout,
  T={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2},o=new Set();
  for(const [id,p] of Object.entries(L)) for(let i=0;i<T[id];i++) o.add((p.dir==='h'?p.r:p.r+i)+','+(p.dir==='h'?p.c+i:p.c));
  for(let r=0;r<10;r++) for(let c=0;c<10;c++) if(!o.has(r+','+c)) return S.transport.send({t:'shot',from:'B',cell:'ABCDEFGHIJ'[c]+(r+1)});})()`;
const barco = k => `(()=>{const S=window.__bn.session(),p=S.layouts['B'].layout.battleship;
  return [...document.querySelectorAll('#enemy-grid .cell')].find(x=>+x.dataset.r===p.r+(p.dir==='h'?0:${k})&&+x.dataset.c===p.c+(p.dir==='h'?${k}:0))})()`;
const ESPECIALES = { BARCO_B: barco(1), BARCO_B2: barco(2), FUEGO: `[...document.querySelectorAll('.btn')].find(b=>/Fuego/i.test(b.textContent))` };

const browser = await abrir();
const json = fs.existsSync(path.join(OUT, 'plays.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'plays.json'))) : {};
const pedidos = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PLAYS);
for (const id of pedidos) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  // Azar fijo, también el de crypto: así cada corrida reparte las mismas cartas y palabras
  await page.addInitScript(seed => {
    let x = seed; const r = () => { x = (x * 1664525 + 1013904223) >>> 0; return x; };
    Math.random = () => r() / 4294967296;
    crypto.getRandomValues = a => { for (let i = 0; i < a.length; i++) a[i] = r() % (2 ** (8 * a.BYTES_PER_ELEMENT)); return a; };
    crypto.randomUUID = () => '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ (r() & (15 >> (c / 4)))).toString(16));
  }, PLAYS[id].seed || 12345);
  page.on('pageerror', e => console.log(id, 'ERROR', e.message));
  await page.goto(B + '/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); });
  await page.goto(B + PLAYS[id].url); await sleep(1500);
  const frames = [];
  const snap = async tap => { const f = `${id}-${frames.length}.png`; await page.screenshot({ path: path.join(OUT, f) }); frames.push({ img: f, tap }); };
  for (let s of PLAYS[id].steps) {
    if (s === 'FALLA_B') s = FALLA_B;
    if (typeof s === 'string') { await page.evaluate(s).catch(e => console.log(id, 'paso', e.message)); await sleep(350); continue; }
    if (s.wait) { await sleep(s.wait); continue; }
    if (s.snap) { await snap(null); continue; }
    if (s.trazo) {
      // Un trazo por varias casillas: el dedo pasa por el centro de cada una, con una captura por casilla
      const pts = [];
      for (const i of s.trazo) { const bb = await (await page.$(`.zc[data-i="${i}"]`)).boundingBox(); pts.push([bb.x + bb.width / 2, bb.y + bb.height / 2]); }
      const [x0, y0] = pts[0];
      await page.mouse.move(x0, y0); await page.mouse.down(); await sleep(80);
      for (let k = 1; k < pts.length; k++) {
        await page.mouse.move(pts[k][0], pts[k][1], { steps: 4 }); await sleep(70);
        if (k < pts.length - 1) await snap(null);
      }
      await page.mouse.up();
      await sleep(s.after ?? 500);
      await snap({ x: x0, y: y0, path: pts.map(([x, y]) => [x - x0, y - y0]), mids: pts.length - 2 });
      continue;
    }
    const expr = ESPECIALES[s.tap] || s.tap || s.drag[0];
    const h = await page.evaluateHandle(expr);
    const el = h.asElement();
    if (!el) { console.log(id, 'no encontré', expr.slice(0, 80)); continue; }
    await el.evaluate(e => e.scrollIntoView({ block: 'nearest' }));
    const bb = await el.boundingBox();
    const [x, y] = s.at || [bb.x + bb.width / 2, bb.y + bb.height / 2];
    if (s.drag) {
      let [, dx, dy] = s.drag;
      if (typeof dx === 'string') { const b2 = await (await page.evaluateHandle(dx)).asElement().boundingBox(); dx = b2.x + b2.width / 2 - x; dy = b2.y + b2.height / 2 - y; }
      const n = s.mids || 10;
      await page.mouse.move(x, y); await page.mouse.down();
      for (let k = 1; k <= n; k++) {
        await page.mouse.move(x + dx * k / n, y + dy * k / n, { steps: 3 }); await sleep(s.mids ? 80 : 20);
        if (s.mids && k < n) await snap(null);
      }
      await page.mouse.up();
      await sleep(s.after ?? 500); await snap({ x, y, dx, dy, mids: s.mids ? n - 1 : 0 });
    } else {
      await page.mouse.click(x, y);
      await sleep(s.after ?? 500);
      if (s.luego) { await page.evaluate(s.luego); await sleep(700); }
      await snap({ x, y });
    }
  }
  json[id] = frames;
  console.log(id, frames.length, 'capturas', frames.map(f => f.tap ? `${Math.round(f.tap.x)},${Math.round(f.tap.y)}` : '·').join(' '));
  await page.close();
}
fs.writeFileSync(path.join(OUT, 'plays.json'), JSON.stringify(json, null, 1));
await browser.close();
