// Dudo de punta a punta, sin red: duelo contra el celular y partida de tres en un celular.
// Comprueba que la apuesta suba de verdad, que el destape cuente bien, que el celular nunca
// haga una jugada ilegal y que la partida se pueda retomar (C-6). Las tomas llevan el nombre
// de las capturas del README (docs/capturas.json).
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9385, dir: `${OUT}/p`, out: OUT });
const ev = e => b.evaluate(e);
const SITIO = 'http://localhost:8765';
const sacadas = new Set();
const toma = async nombre => { if (!sacadas.has(nombre)) { sacadas.add(nombre); await b.shot(nombre); } };
const pantalla = () => ev(`document.querySelector('.screen.active').id`);
const overlay = () => ev(`document.getElementById('handoff').hidden === false`);
const guardado = () => ev(`JSON.parse(localStorage.getItem('juegos-de-salon:dudo:session') || 'null')`);

/** Una jugada del jugador humano: apuesta lo mínimo con la pinta que le pidan, o duda. */
const apostar = async pinta => ev(`(()=>{
  const p = [...document.querySelectorAll('.pinta')].filter(x => !x.disabled);
  if (!p.length) return 'sin pintas';
  (p[${pinta}] || p[0]).click();
  const ok = document.querySelector('#actions .btn--yellow');
  if (!ok || ok.disabled) return 'sin boton';
  const texto = ok.textContent;
  ok.click();
  return texto;
})()`);
const dudar = () => ev(`(()=>{const b=[...document.querySelectorAll('#actions .btn')].find(x=>/Dudo/i.test(x.textContent));if(!b)return 'no';b.click();return 'ok'})()`);
const seguir = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'no';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`);

await b.go(`${SITIO}/`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITIO}/dudo/`);
await toma('01-intro');
console.log('modos:', await ev(`[...document.querySelectorAll('.mode')].map(m=>m.innerText.split('\\n')[0]+(m.disabled?' (deshabilitado)':'')).join(' | ')`));

/* ---------------- Contra el celular ---------------- */
await ev(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(400);
await ev(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(600);
await toma('03-mesa');
console.log('mis dados:', await ev(`document.querySelectorAll('#mine .die').length`), '· mesa:', await ev(`document.getElementById('status-sub').textContent`));

// La apuesta: se elige la pinta y aparece el selector de cantidad (C-8: nada preseleccionado)
console.log('antes de elegir pinta, el botón está', await ev(`document.querySelector('#actions .btn--yellow').disabled ? 'deshabilitado' : '⚠️ HABILITADO'`));
await ev(`document.querySelectorAll('.pinta')[4].click(); 1`); await sleep(300);
await toma('04-apuesta');
// Con los nombres chilenos encendidos (por defecto) la pinta 5 se dice "quintas" (D-71)
console.log('apuesta propuesta:', await ev(`document.querySelector('#actions .btn--yellow').textContent`));
console.log('interruptores en un duelo:', await ev(`[...document.querySelectorAll('#setup-form .toggle-row b')].map(b=>b.textContent).join(', ') || 'ninguno'`) || '(ya se salió de la configuración)');

let vueltas = 0, destapes = 0, calzoOfrecido = 0;
while ((await pantalla()) !== 'screen-result' && vueltas++ < 120) {
  if (await overlay()) {
    if (!sacadas.has('05-destape') && await ev(`!!document.querySelector('#handoff .count')`)) await toma('05-destape');
    if (await ev(`!!document.querySelector('#handoff .count')`)) destapes++;
    await seguir(); await sleep(350); continue;
  }
  if ((await ev(`!!document.querySelector('#actions .btn')`)) === false) { await sleep(300); continue; }
  // En un duelo no se puede calzar (D-71): el botón no debería aparecer nunca
  if (await ev(`[...document.querySelectorAll('#actions .btn')].some(b=>/Calzo|Spot|Cravo/i.test(b.textContent))`)) calzoOfrecido++;
  // Se duda una de cada tres veces, para que la partida avance y se vean los dos desenlaces
  const r = vueltas % 3 === 0 ? await dudar() : await apostar(0);
  if (r === 'no' || r === 'sin pintas' || r === 'sin boton') { await dudar(); }
  await sleep(320);
}
console.log('contra el celular →', await pantalla(), '·', await ev(`document.getElementById('result-title').textContent`),
  '·', await ev(`document.getElementById('result-sub').textContent`), '· destapes:', destapes);
console.log('calzar ofrecido en el duelo:', calzoOfrecido === 0 ? 'nunca (bien)' : `⚠️ ${calzoOfrecido} veces`);
await ev(`document.getElementById('result-history').open = true; 1`); await sleep(300);
await sleep(4200); // el confeti dura 4 s y taparía el título y el historial de la captura (D-76)
await toma('06-resultado');
console.log('historial:', await ev(`document.querySelectorAll('#history-list li').length`), 'rondas anotadas');

/* ---------------- Tres jugadores en un celular ---------------- */
await b.go(`${SITIO}/dudo/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITIO}/dudo/`);
await ev(`document.querySelectorAll('.mode')[0].click(); 1`); await sleep(300);
await ev(`document.querySelector('#setup-actions .btn--ghost').click(); 1`); await sleep(200);
await toma('02-configuracion');
console.log('con tres jugadores hay:', await ev(`[...document.querySelectorAll('#setup-form .toggle-row b')].map(b=>b.textContent).join(' + ')`));
await ev(`(()=>{const n=['Javi','Cata','Nico'];[...document.querySelectorAll('#setup-form input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await ev(`document.querySelector('#setup-actions .btn--yellow').click(); 1`); await sleep(500);
console.log('en un celular arranca con el pase:', await ev(`document.getElementById('handoff').innerText.replace(/\\n/g,' ')`));
await toma('07-pase');

// Retomar a mitad de partida (C-6)
await seguir(); await sleep(400);
await apostar(0); await sleep(400);
const antes = await guardado();
await b.go(`${SITIO}/dudo/`);
console.log('retomar → panel:', await ev(`!!document.querySelector('#resume-slot .btn--cyan')`),
  '· mensajes guardados:', (antes?.messages || []).length);
await ev(`document.querySelector('#resume-slot .btn--cyan').click(); 1`); await sleep(700);
console.log('retomado →', await pantalla(), '·', await ev(`document.getElementById('handoff').innerText.split('\\n').pop()`));

let v2 = 0;
while ((await pantalla()) !== 'screen-result' && v2++ < 300) {
  if (await overlay()) { await seguir(); await sleep(200); continue; }
  if ((await ev(`!!document.querySelector('#actions .btn')`)) === false) { await sleep(250); continue; }
  const r = v2 % 2 === 0 ? await dudar() : await apostar(0);
  if (r === 'no' || r === 'sin pintas' || r === 'sin boton') await dudar();
  await sleep(200);
}
console.log('tres en un celular →', await pantalla(), '·', await ev(`document.getElementById('result-title').textContent`),
  '·', await ev(`document.getElementById('result-sub').textContent`));
console.log('la partida terminada ya no se ofrece:', await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:dudo:session')).done`));

console.log('capturas:', [...sacadas].sort().join(' '));
console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
b.close();
