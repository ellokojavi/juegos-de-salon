import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
// SITIO y PUERTO_CDP: otro servidor y otro Chrome, para no chocar con otra sesión que prueba en paralelo (D-135)
const SITIO = process.env.SITIO || 'http://localhost:8765';
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9380, dir: `${OUT}/profile`, out: OUT });
await b.go(`${SITIO}/`); await b.evaluate(`localStorage.clear(); 1`); await b.go(`${SITIO}/`); await b.shot('00-menu');
await b.go(`${SITIO}/toque-y-fama/`); await b.shot('01-intro');
// ---- MODO LOCAL: Javi 1234, Cata 5678 ----
await b.evaluate(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(400); await b.shot('02-setup-local');
await b.evaluate(`(()=>{const i=document.querySelectorAll('#setup-form input');i[0].value='Javi';i[1].value='Cata';return 1})()`);
await b.evaluate(`document.querySelector('#setup-actions .btn').click(); 1`); await sleep(500); await b.shot('03-cover-secret-A');
await b.cover(); await b.shot('04-secret-A'); console.log('secret A:', await b.typeNum('1234')); await sleep(500);
await b.cover(); console.log('secret B:', await b.typeNum('5678')); await sleep(900);
await b.shot('06-handoff-start'); await b.handoff(); await b.shot('07-play-first');
let guard = 0, primera = true;
while ((await b.active()) === 'screen-play' && guard++ < 14) {
  const v = await b.view();
  if (!(await b.hasPad())) { const hh = await b.evaluate(`document.getElementById('handoff').hidden`); if (hh === false) await b.handoff(); else await sleep(300); continue; }
  const mine = await b.evaluate(`__tyf.match().guesses.filter(g=>g.from==='${v.expected}').length`);
  const guess = v.expected === 'A' ? (mine === 0 ? '5687' : '5678') : (mine === 0 ? '1243' : '1234');
  console.log('turn', v.expected, '→', guess, await b.typeNum(guess));
  await sleep(700); await b.shot(`08-reply-${guard}`);
  // La respuesta y el pase en una sola pantalla (C-9): con nombre fijo, porque es una captura del README.
  if (primera) { primera = false; await b.shot('08-respuesta-y-pase'); }
  await b.handoff();
}
await sleep(700); await b.shot('09-result-local');
console.log('local result:', await b.evaluate(`document.getElementById('result-title').textContent + ' | ' + document.getElementById('result-sub').textContent + ' | ' + document.getElementById('result-secrets').innerText.replace(/\\n/g,' ')`));
// Revancha local
await b.evaluate(`document.querySelector('#result-actions .btn').click(); 1`); await sleep(600);
console.log('rematch → screen:', await b.active(), 'phase:', (await b.view()).phase);
// ---- JUGAR SOLO (D-142): el minijuego 🔢 de La Copa, 10 intentos y de 0 a 100 puntos ----
const TYF = `${SITIO}/toque-y-fama/`;
const numeros = [];
for (const a of '0123456789') for (const c of '0123456789') for (const d of '0123456789') for (const e of '0123456789') { const n = a + c + d + e; if (new Set(n).size === 4) numeros.push(n); }
const secretoDe = () => b.evaluate(`(async()=>{const m=await import('../copa/juegos/numero.js');return m.generar(__tyf.guardada().codigo,1).secreto})()`);
const intentos = () => b.evaluate(`(__tyf.guardada()?.jugadas?.i||[]).length`);
const fin = async () => { await b.evaluate(`document.getElementById('btn-fin').click(); 1`); await sleep(4200); }; // después del confeti, que tapa el récord
const resumen = () => b.evaluate(`document.getElementById('solo-result').innerText.replace(/\\n+/g,' / ')`);
// Los botones finales, a la vista sin desplazar en un celular de 812 px (C-8)
const bajoLaLinea = () => b.evaluate(`[...document.querySelectorAll('#solo-actions .btn')].filter(x=>x.getBoundingClientRect().bottom+scrollY>812).map(x=>x.textContent)`);

// Una partida del solo viejo (con mensajes) no se ofrece para retomar
await b.go(TYF); await b.evaluate(`localStorage.setItem('juegos-de-salon:toque-y-fama:session', JSON.stringify({v:1,game:'toque-y-fama',at:Date.now(),mode:'solo',config:{digits:4,solo:true},messages:[{t:'hello',from:'A',name:'A'}],done:false})); 1`);
await b.go(TYF); console.log('solo viejo ofrecido para retomar:', await b.evaluate(`!!document.querySelector('#resume-slot .panel')`));

// 1) Cómo se juega, dos intentos fallidos, recarga a mitad, retomar y sacarlo al tercero: 80/100
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400); await b.shot('10-setup-solo');
await b.evaluate(`document.getElementById('btn-solo-empezar').click(); 1`); await sleep(600);
let secreto = await secretoDe();
const fallidos = numeros.filter(n => n !== secreto && [...n].some(d => secreto.includes(d))).slice(0, 2);
for (const g of fallidos) { await b.typeNum(g); await sleep(500); }
await sleep(1200); await b.shot('11-solo-play');
console.log('solo tablero:', await b.evaluate(`[...document.querySelectorAll('#solo-body .clue')].map(x=>x.innerText.replace(/\\n/g,' ')).join(' | ')`), '| reloj:', await b.evaluate(`document.getElementById('solo-cron').textContent`));
await b.go(TYF);
console.log('retomar ofrecido:', await b.evaluate(`document.querySelector('#resume-slot')?.innerText.replace(/\\n+/g,' / ')`));
await b.evaluate(`document.querySelector('#resume-slot .btn--cyan').click(); 1`); await sleep(1200);
console.log('retomado en', await b.active(), 'con', await intentos(), 'intentos y reloj', await b.evaluate(`document.getElementById('solo-cron').textContent`));
await b.typeNum(secreto); await sleep(600); await b.shot('11-solo-fin');
await fin(); await b.shot('12-solo-result');
console.log('solo resultado:', await resumen(), '| bajo 812 px:', JSON.stringify(await bajoLaLinea()), '| guardada done:', await b.evaluate(`__tyf.guardada().done`));

// 2) Jugar otra vez y no sacarlo: 0/100, y el récord anterior a la vista
await b.evaluate(`document.querySelector('#solo-actions .btn--yellow').click(); 1`); await sleep(600);
secreto = await secretoDe();
for (const g of numeros.filter(n => n !== secreto).slice(0, 10)) { await b.typeNum(g); await sleep(150); }
await sleep(500); await fin(); await b.shot('12-solo-result-2');
console.log('solo resultado 2:', await resumen(), '| bajo 812 px:', JSON.stringify(await bajoLaLinea()));
await b.evaluate(`[...document.querySelectorAll('#solo-actions .btn')][1].click(); 1`); await sleep(1500);
console.log('cambiar de modo →', await b.active());
console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs));
b.close();
