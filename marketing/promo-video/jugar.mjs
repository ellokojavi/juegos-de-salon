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
const DONDE = (process.env.DONDE || '').split(',').map(Number);
const BOTON = t => `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(t)})`;
const TANGO = [1,1,2,1,2,2,2,1,2,1,1,2,2,2,1,2,1,1,1,1,2,1,2,2,2,2,1,2,1,1,1,2,1,2,2,1];
const TAN = i => `document.querySelector('.tan[data-i="${i}"]')`;
const REJ = i => `document.querySelector('.rej[data-i="${i}"]')`;
// Uno al día (D-230): el reloj en un día de Reinas, con diez días seguidos jugados antes (la racha)
const HOY_FECHA = [2026, 9, 29, 12];
const HOY_RACHA = (() => { const d = {}, js = ['letras', 'ahorcado', 'linea', 'conexiones', 'batalla-naval', 'anio', 'numero', 'reinas', 'desenredo', 'linea'];
  for (let n = 1; n <= 10; n++) { const f = new Date(Date.UTC(2026, 9, 29 - n)).toISOString().slice(0, 10); d[f] = { j: js[n - 1], s: 60 + n * 3, ms: 90000, at: 1, n: 1 }; }
  return JSON.stringify({ dias: d }); })();
const REINA = k => `(()=>{const r=window.__sol;return document.querySelector('.rej[data-i="'+(${k}*8+r[${k}])+'"]')})()`;
const PLAYS = {
  hoy: { url: '/', reloj: HOY_FECHA, memoria: { 'juegos-de-salon:uno-al-dia': HOY_RACHA }, steps: [
    { wait: 600 }, { snap: true },
    // El dado, a todo el cuadro: la página corre a un cuarto de velocidad y cada captura anota su
    // momento (`tras`), así promo.html lo pasa a la velocidad de verdad
    { tap: `document.getElementById('btn-uno-al-dia')`, lento: 0.25, tras: 3300, after: 300 },
    `new Promise(r=>{const f=()=>/queens/.test(location.pathname)?r():setTimeout(f,200);f()})`, { wait: 1500 },
    `document.getElementById('btn-empezar').click()`, { wait: 4500 },
    // la solución del día, del mismo motor; seis reinas fuera de cámara y las dos últimas en cámara
    `import('/cup/games/queens/engine.js').then(m=>{const j=__copa.estado.juego;window.__sol=m.generar(j.semilla,j.d).sol})`, { wait: 300 },
    `(()=>{for(let k=0;k<6;k++)document.querySelector('.rej[data-i="'+(k*8+window.__sol[k])+'"]').click()})()`, { wait: 600 }, { snap: true },
    { tap: REINA(6), after: 400 },
    { tap: REINA(7), after: 1400 },
    { tap: `document.getElementById('btn-fin')`, after: 1500 },
  ] },
  linea: { url: '/timeline/', steps: [
    `[...document.querySelectorAll('.mode')].find(m=>/solo/i.test(m.textContent)).click()`,
    `document.getElementById('btn-solo-empezar').click()`, { wait: 1500 }, { snap: true },
    { tap: `document.querySelectorAll('#solo-juego .hand .card')[1]` },
    { tap: `[...document.querySelectorAll('#solo-juego .line .slot')].at(-1)` },
    { tap: `document.getElementById('btn-colocar')`, after: 900 },
  ] },
  toque: { url: '/bulls-and-cows/', steps: [
    `document.querySelectorAll('.mode')[2].click()`, `document.getElementById('btn-solo-empezar').click()`, { wait: 800 },
    `(()=>{const k=d=>[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent===d).click();for(const d of '0123')k(d);document.querySelector('.screen.active .keypad .ok').click()})()`,
    { wait: 600 }, { snap: true },
    ...'4517'.split('').map(d => ({ tap: `[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent==='${d}')`, after: 150 })),
    { tap: `document.querySelector('.screen.active .keypad .ok')`, after: 700 },
  ] },
  ahorcado: { url: '/hangman/', steps: [
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
  dudo: { url: '/liars-dice/', steps: [
    `document.querySelectorAll('.mode')[2].click()`,
    `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
    `document.querySelector('#setup-actions .btn--yellow').click()`, { wait: 1200 }, { snap: true },
    { tap: `document.querySelectorAll('.pinta')[4]`, after: 400 },
    { tap: `[...document.querySelectorAll('#actions button')].find(b=>b.textContent.trim()==='+')`, after: 300 },
    { tap: `document.querySelector('#actions .btn--yellow')`, after: 2600 },
    { tap: `[...document.querySelectorAll('#actions .btn')].find(b=>/Dudo/i.test(b.textContent))`, after: 1500 },
  ] },
  naval: { url: '/battleship/', steps: [
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
  rey: { url: '/fourth-king/', seed: 17, steps: [
    `document.getElementById('btn-go-setup').click()`,
    `[...document.querySelectorAll('#players-form input')].forEach((i,k)=>{i.value=['Javi','Cata','Pancho','Fran'][k];i.dispatchEvent(new Event('input',{bubbles:true}))})`,
    `document.getElementById('btn-start').click()`, { wait: 900 }, { snap: true },
    { tap: `document.getElementById('card')`, after: 1400 },
    { tap: `[...document.querySelectorAll('#result .btn')].at(-1)`, after: 500, luego: `(()=>{const h=document.getElementById('handoff');if(!h.hidden&&/Sigan/i.test(h.innerText))h.click()})()` },
  ] },
  reinas: { url: '/queens/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 },
    // cinco reinas ya puestas (solución de WNDRN: 7,0,5,2,4,1,6,3); en cámara: X por la fila 6 y las tres últimas
    ...[7, 0, 5, 2, 4].map((c, r) => `document.querySelector('.rej[data-i="${r * 8 + c}"]').click()`), { wait: 600 }, { snap: true },
    { drag: [REJ(5 * 8 + 7), REJ(5 * 8 + 2)], mids: 6, after: 300 },
    { tap: REJ(5 * 8 + 1), after: 350 },
    { tap: REJ(6 * 8 + 6), after: 350 },
    { tap: REJ(7 * 8 + 3), after: 1200 },
  ] },
  tango: { url: '/tango/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 },
    // todo resuelto menos tres casillas (solución de WNDRN); en cámara: sol, sol y luna (dos toques)
    `(()=>{const S=${JSON.stringify(TANGO)};for(let i=0;i<36;i++){if([30,34,35].includes(i))continue;const b=document.querySelector('.tan[data-i="'+i+'"]');if(!b||b.disabled)continue;for(let k=0;k<S[i];k++)document.querySelector('.tan[data-i="'+i+'"]').click();}})()`,
    { wait: 800 }, { snap: true },
    { tap: TAN(35), after: 300 },
    { tap: TAN(30), after: 300 },
    { tap: TAN(34), after: 250 },
    { tap: TAN(34), after: 1200 },
  ] },
  zip: { url: '/zip/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 }, { snap: true },
    // el nivel 1 de un solo trazo, del 1 al 5 pasando por todas
    { trazo: [6, 7, 3, 2, 1, 0, 4, 5, 9, 8, 12, 13, 14, 10, 11, 15], after: 60 },
  ] },
  conexiones: { url: '/connections/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 }, { snap: true },
    ...['PICASSO', 'DALÍ', 'MIRÓ', 'VELÁZQUEZ'].map(w => ({ tap: BOTON(w), after: 200 })),
    { tap: `document.getElementById('btn-confirmar')`, after: 1200 },
  ] },
  anio: { url: '/year/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 }, { snap: true },
    ...'1985'.split('').map(d => ({ tap: BOTON(d), after: 180 })),
    { tap: `[...document.querySelectorAll('button')].find(b=>/^OK$/i.test(b.textContent.trim()))`, after: 1200 },
  ] },
  letras: { url: '/word/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 },
    // El "null" suelto bajo los intentos es un error de la app (ui-letras.js); no va en el video
    `(()=>{const f=()=>document.querySelectorAll('.letras-juego, .stack').forEach(n=>[...n.childNodes].forEach(c=>{if(c.nodeType===3&&c.textContent==='null')c.remove()}));f();new MutationObserver(f).observe(document.body,{childList:true,subtree:true})})()`,
    `(()=>{for(const c of 'MONTE')[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===c).click();[...document.querySelectorAll('button')].find(b=>/Probar/i.test(b.textContent)).click()})()`,
    { wait: 900 }, { snap: true },
    ...'CLAVO'.split('').map(c => ({ tap: BOTON(c), after: 160 })),
    { tap: `[...document.querySelectorAll('button')].find(b=>/Probar/i.test(b.textContent))`, after: 1000 },
  ] },
  desenredo: { url: '/untangle/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 4500 }, { snap: true },
    { drag: [`document.querySelector('.des-nudos circle[data-v="0"]')`, 90, 70], mids: 6, after: 300 },
    { drag: [`document.querySelector('.des-nudos circle[data-v="3"]')`, -80, 60], mids: 6, after: 600 },
  ] },
  donde: { url: '/where/?semilla=WNDRN', steps: [
    `document.getElementById('btn-empezar').click()`, { wait: 5000 }, { snap: true },
    // Santiago donde el globo lo dibuja (DONDE=x,y lo fija a mano)
    { globo: [-30, -66], pasos: 16, after: 300 },
    { tap: `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='+')`, lento: 0.3, tras: 700, after: 200 },
    { tap: `document.querySelector('canvas.mapa-globo')`, aqui: process.env.DONDE ? null : `document.querySelector('canvas.mapa-globo').globo.aPantalla(-33.45,-70.67)`, at: process.env.DONDE ? DONDE : null, after: 600 },
    { tap: `[...document.querySelectorAll('.btn')].find(b=>/Confirmar/i.test(b.textContent))`, lento: 0.3, tras: 1500, after: 300 },
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
  await page.addInitScript(() => {
    const rn = performance.now.bind(performance), rst = window.setTimeout.bind(window), rraf = window.requestAnimationFrame.bind(window);
    let f = 1, base = rn(), virt = base;
    const now = () => virt + (rn() - base) * f;
    performance.now = now;
    window.setTimeout = (fn, ms = 0, ...a) => rst(fn, ms / f, ...a);
    window.requestAnimationFrame = cb => rraf(() => cb(now()));
    window.__vel = n => { virt = now(); base = rn(); f = n; };
  });
  if (PLAYS[id].reloj) await page.addInitScript(f => { const D = Date, dif = new D(...f).getTime() - D.now();
    class F extends D { constructor(...a) { a.length ? super(...a) : super(D.now() + dif); } static now() { return D.now() + dif; } } window.Date = F; }, PLAYS[id].reloj);
  await page.goto(B + '/');
  await page.evaluate(m => { localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); localStorage.setItem('juegos-de-salon:instalar:no', '1');
    for (const k in m) localStorage.setItem(k, m[k]); }, PLAYS[id].memoria || {});
  await page.goto(B + PLAYS[id].url); await sleep(1500);
  const frames = [];
  const snap = async tap => { const f = `${id}-${frames.length}.png`; await page.screenshot({ path: path.join(OUT, f) }); frames.push({ img: f, tap }); };
  for (let s of PLAYS[id].steps) {
    if (s === 'FALLA_B') s = FALLA_B;
    if (typeof s === 'string') { await page.evaluate(s).catch(e => console.log(id, 'paso', e.message)); await sleep(350); continue; }
    if (s.wait) { await sleep(s.wait); continue; }
    if (s.snap) { await snap(null); continue; }
    if (s.globo) {
      // Un arrastre que gira el globo: el mouse de Playwright no lo gira en las capturas, así que el
      // globo va a mano (girarA) paso a paso y el dedo dibuja el mismo recorrido
      const c = await page.$('canvas.mapa-globo'), bb = await c.boundingBox();
      const x0 = bb.x + bb.width / 2, y0 = bb.y + bb.height * 0.55, R = Math.min(bb.width, bb.height) / 2;
      const [la0, lo0] = await page.evaluate(() => document.querySelector('canvas.mapa-globo').globo.vista().centro);
      const [la1, lo1] = s.globo, n = s.pasos || 12, RAD = Math.PI / 180;
      const dx = (lo0 - lo1) * RAD * R, dy = (la1 - la0) * RAD * R;
      for (let k = 1; k <= n; k++) {
        const e = 1 - (1 - k / n) ** 2;
        await page.evaluate(([a, b]) => document.querySelector('canvas.mapa-globo').globo.girarA(a, b), [la0 + (la1 - la0) * e, lo0 + (lo1 - lo0) * e]);
        await sleep(160);
        if (k < n) await snap(null);
      }
      await sleep(s.after ?? 400);
      await snap({ x: x0, y: y0, dx, dy, mids: n - 1 });
      continue;
    }
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
    const [x, y] = s.at || (s.aqui && await page.evaluate(s.aqui)) || [bb.x + bb.width / 2, bb.y + bb.height / 2];
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
      const reloj = () => page.evaluate(() => performance.now());
      let cdp = null;
      if (s.lento) {
        cdp = await page.context().newCDPSession(page);
        await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: s.lento });
        await page.evaluate(f => window.__vel(f), s.lento);
      }
      const t0 = s.tras ? await reloj() : 0;
      await page.mouse.click(x, y);
      if (s.tras) {
        // Lo que pasa después del toque, cuadro a cuadro: `tras` es cuándo, en segundos de la página
        await snap({ x, y });
        for (;;) {
          const a = await reloj() - t0;
          if (a > s.tras) break;
          const f = `${id}-${frames.length}.png`;
          await page.screenshot({ path: path.join(OUT, f) });
          frames.push({ img: f, tap: null, tras: +((a + (await reloj() - t0)) / 2000).toFixed(3) });
        }
        if (cdp) { await page.evaluate(() => window.__vel(1)).catch(() => {}); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 }).catch(() => {}); }
        await sleep(s.after ?? 500);
        continue;
      }
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
