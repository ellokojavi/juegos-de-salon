// El Ahorcado con tres celulares contra Firebase real: cadena, todos adivinando a la vez,
// reconexión a mitad y revancha.
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const hosts = ['http://localhost:8765', 'http://127.0.0.1:8765', 'http://[::1]:8765'];
const A = await launch({ port: 9346, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9347, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const C = await launch({ port: 9348, dir: `${OUT}/pC`, out: OUT, width: 375, height: 812 });
const devs = { A, B, C };
const NOMBRE = { A: 'Javi', B: 'Cata', C: 'Nico' };
/** Sin esto, un CDP que no contesta deja el guion mudo y colgado para siempre. */
const conTiempo = (promesa, que, ms = 20000) => Promise.race([
  promesa,
  new Promise((_, no) => setTimeout(() => no(new Error(`se colgó: ${que}`)), ms)),
]);
const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (d, sel, re) => d.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const v = d => d.evaluate(`(()=>{const s=window.__ahorcado.view();if(!s)return JSON.stringify({nada:true});if(s.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:s.phase,done:s.done,current:s.current,
    st:Object.fromEntries(Object.entries(s.st).map(([r,x])=>[r,{pattern:x.pattern,lives:x.lives,used:x.used.length,solved:x.solved,hanged:x.hanged,score:x.score}]))})})()`).then(JSON.parse);
const overlay = d => d.evaluate(`(()=>{const c=document.getElementById('cover'),h=document.getElementById('handoff');
  return !c.hidden?'cover':!h.hidden?'handoff:'+h.innerText.replace(/\\n/g,' ').slice(0,80):''})()`);
const tap = async (d, ms = 400) => {
  await d.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'nada';const x=h.querySelector('button');if(x){x.click();return 'btn'}h.click();return 'tap'})()`);
  await sleep(ms);
};
const writeWord = async (d, word, hint) => {
  const r = await d.evaluate(`(()=>{const ins=[...document.querySelectorAll('#word-form input')];if(ins.length<2)return 'no-form';
    ins[0].value='${word}';ins[0].dispatchEvent(new Event('input',{bubbles:true}));
    ins[1].value='${hint}';ins[1].dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`);
  if (r !== 'ok') return r;
  await click(d, '#word-actions .btn'); await sleep(1500);
  return 'ok';
};
/** Prueba una letra en el celular de quien la está adivinando. Acá no hay turnos: juega cuando quiere. */
const playLetter = async (d, role, acierta = true) => {
  const pick = await d.evaluate(`(()=>{const s=window.__ahorcado.view();const st=s.st['${role}'];
    if(!st||st.done||st.pending)return 'no-juega';
    const libres=[...document.querySelectorAll('#keyboard button')].filter(k=>!k.disabled).map(k=>k.textContent);
    if(!libres.length)return 'sin-teclas';
    // Este celular no conoce su propia palabra (C-10): juega como una persona, por frecuencia
    const FREC='EAOSRNILTCDUMPBGVYQHFZJXKWÑ';
    const elegida=${acierta}?(FREC.split('').find(l=>libres.includes(l))||libres[0]):(libres[libres.length-1]);
    const k=[...document.querySelectorAll('#keyboard button')].find(x=>x.textContent===elegida);
    if(!k)return 'sin-tecla';k.click();return elegida})()`);
  if (pick.length > 1) return pick;
  await sleep(150);
  const c = await d.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];const x=bs[bs.length-1];
    if(!x||x.disabled)return 'no-confirm';x.click();return 'ok'})()`);
  if (c !== 'ok') return c;
  await sleep(1000);
  return pick;
};

for (const [i, k] of [[0, 'A'], [1, 'B'], [2, 'C']]) { await devs[k].go(hosts[i] + '/ahorcado/', 1800); await devs[k].evaluate(`localStorage.clear(); 1`); }
// A crea la sala con cadena
await A.go(hosts[0] + '/ahorcado/', 1500);
await A.evaluate(`document.querySelectorAll('.mode')[1].click(); 1`); await sleep(500);
await setName(A, NOMBRE.A);
await clickText(A, '#setup-form .seg--src button', 'Cadena|Chain|Corrente'); await sleep(150);
await clickText(A, '#setup-actions .btn', 'Crear|Create'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| pantalla A:', await A.active());
await A.shot('01-lobby-A');
// B y C entran por el enlace
for (const [i, k] of [[1, 'B'], [2, 'C']]) {
  const d = devs[k];
  await d.go(`${hosts[i]}/ahorcado/?sala=${code}`, 2200);
  await setName(d, NOMBRE[k]);
  await clickText(d, '#setup-actions .btn', 'Unirse|Join'); await sleep(4500);
  console.log(`${k} entró → pantalla:`, await d.active(), '| rol:', await d.evaluate(`window.__ahorcado.session().role`));
}
await sleep(2500);
console.log('en la sala:', await A.evaluate(`[...document.querySelectorAll('.lobby-players .p')].map(x=>x.textContent).join(', ')`));
console.log('C no tiene botón de empezar:', await C.evaluate(`!!document.querySelector('#lobby-box .waiting')`));
await A.shot('02-lobby');
// A empieza
await clickText(A, '#lobby-box .btn', 'Empezar|Start'); await sleep(4500);
for (const k of ['A', 'B', 'C']) console.log(`${k} tras empezar:`, await devs[k].active(), '| escribe para:', await devs[k].evaluate(`document.getElementById('word-title').textContent`));
await A.shot('03-word');
// Cada uno le escribe al siguiente, todos a la vez: acá nadie tapa la pantalla (D-53)
const PALABRAS = { A: ['CORDILLERA', 'La pared del este'], B: ['EMPANADA', 'Se pide de pino o de queso'], C: ['TERREMOTO', 'Tiembla o se toma'] };
await Promise.all(['A', 'B', 'C'].map(k => writeWord(devs[k], ...PALABRAS[k])));
await sleep(4000);
for (const k of ['A', 'B', 'C']) console.log(`${k} ya juega:`, await devs[k].active(), '|', JSON.stringify((await v(devs[k])).phase));
await A.shot('04-play');
{
  // El cartel también en varios celulares, donde nada bloquea a propósito (D-56, D-63).
  // A es quien abre la sala, así que el primer turno es suyo.
  const l = await A.evaluate(`(()=>{const k=[...document.querySelectorAll('#keyboard button')].find(x=>!x.disabled);if(!k)return 'no';k.click();return k.textContent})()`);
  await sleep(150);
  await A.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];bs[bs.length-1].click();return 1})()`);
  await sleep(300);
  console.log('cartel en la sala:', await A.evaluate(`(()=>{const f=document.querySelector('.flash');if(!f)return 'ninguno';window.__flash=f;return f.className+' · '+f.innerText.replace(/\\n/g,' ')})()`), '| letra:', l);
  await sleep(1100);
  console.log('ese cartel se fue solo:', await A.evaluate(`!!window.__flash && !document.contains(window.__flash)`));
}
console.log('la tira de rivales no muestra letras (D-55):', await A.evaluate(`[...document.querySelectorAll('#rivals .r')].map(x=>x.innerText.replace(/\\n/g,' ')).join(' | ')`));

// Por turnos: juega solo a quien le toca, y los demás miran con el teclado bloqueado (D-66)
let guard = 0, recargado = false;
while (guard++ < 60) {
  const s = await conTiempo(v(A), 'estado de A');
  if (s.done) break;
  const turno = s.current;
  if (!turno) { console.log('sin turno asignado:', JSON.stringify(s)); break; }
  // Los que no son, no pueden jugar
  if (guard === 1) {
    for (const k of ['A', 'B', 'C']) {
      // Mientras le toca a otro no hay teclado ni barra: no hay nada que tocar (D-66)
      const v = await devs[k].evaluate(`JSON.stringify({teclado:!document.getElementById('keyboard').hidden,
        barra:document.getElementById('confirm').children.length>0, titulo:document.getElementById('status-who').textContent})`).then(JSON.parse);
      console.log(`  ${k}${k === turno ? ' (le toca)' : ''}: teclado ${v.teclado ? 'sí' : 'no'} · barra ${v.barra ? 'sí' : 'no'} · "${v.titulo}"`);
    }
  }
  const d = devs[turno];
  if (await conTiempo(overlay(d), `overlay de ${turno}`)) { await tap(d, 300); continue; }
  const r = await conTiempo(playLetter(d, turno, true), `jugada de ${turno}`, 30000);
  console.log(`vuelta ${guard} → juega ${turno}: ${r} |`, ['A', 'B', 'C'].map(k => `${k} ${s.st[k].pattern} ${s.st[k].lives}❤`).join(' · '));
  for (const k of ['A', 'B', 'C']) if (await overlay(devs[k])) await tap(devs[k], 200);
  if (guard === 3 && !recargado) {
    recargado = true;
    await A.shot('05-mid-A');
    // C se cae y vuelve a mitad de partida
    await C.go(`${hosts[2]}/ahorcado/?sala=${code}`, 6000);
    console.log('C tras recargar:', await C.active(), '| rol:', await C.evaluate(`window.__ahorcado.session()?.role`), '|', JSON.stringify((await v(C)).st?.C));
    await C.shot('05-reconnect-C');
  }
}
for (const k of ['A', 'B', 'C']) { for (let i = 0; i < 4; i++) await tap(devs[k], 400); }
await sleep(1500);
console.log('final visto por A:', JSON.stringify(await v(A)));
console.log('final visto por C:', JSON.stringify(await v(C)));
for (const k of ['A', 'B', 'C']) console.log(`${k} pantalla:`, await devs[k].active());
await sleep(2600); await A.shot('06-result');
console.log('resultado:', await A.evaluate(`document.getElementById('result-title').textContent+' | '+document.getElementById('result-ranking').innerText.replace(/\\n/g,' · ')`));
console.log('palabras verificadas (C-10):', await A.evaluate(`document.getElementById('result-words').innerText.replace(/\\n/g,' · ')`));
// Revancha: la propone C y los demás la siguen
await click(C, '#result-actions .btn'); await sleep(9000);
for (const k of ['A', 'B', 'C']) console.log(`${k} tras revancha → pantalla:`, await devs[k].active(), '| sala:', await devs[k].evaluate(`window.__ahorcado.session()?.code`), '| en sala:', await devs[k].evaluate(`document.querySelectorAll('.lobby-players .p').length`));
for (const k of ['A', 'B', 'C']) console.log(`errors ${k}:`, JSON.stringify(devs[k].errors), JSON.stringify(devs[k].logs));
A.close(); B.close(); C.close();
