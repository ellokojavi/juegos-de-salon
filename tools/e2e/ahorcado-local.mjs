import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9345, dir: `${OUT}/p`, out: OUT });
const click = sel => b.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const clickText = (sel, re) => b.evaluate(`(()=>{const x=[...document.querySelectorAll('${sel}')].find(e=>new RegExp('${re}','i').test(e.textContent));if(!x)return 'no';x.click();return 'ok'})()`);
const v = () => b.evaluate(`(()=>{const s=window.__ahorcado.view();if(!s||s.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:s.phase,current:s.current,done:s.done,
    st:Object.fromEntries(Object.entries(s.st).map(([r,x])=>[r,{pattern:x.pattern,lives:x.lives,used:x.used.length,bought:x.bought,solved:x.solved,hanged:x.hanged,score:x.score}]))})})()`).then(JSON.parse);
// Destapa la pantalla tapada (C-9) o cierra el overlay de pase/veredicto que esté arriba
const tap = async (ms = 420) => {
  await b.evaluate(`(()=>{const c=document.getElementById('cover');if(!c.hidden){c.querySelector('button').click();return 'cover'}
    const h=document.getElementById('handoff');if(!h.hidden){const x=h.querySelector('button');if(x){x.click();return 'btn'}h.click();return 'tap'}return 'nada'})()`);
  await sleep(ms);
};
const overlay = () => b.evaluate(`(()=>{const c=document.getElementById('cover'),h=document.getElementById('handoff');
  return !c.hidden?'cover:'+c.innerText.replace(/\\n/g,' '):!h.hidden?'handoff:'+h.innerText.replace(/\\n/g,' '):''})()`);
// Escribe la palabra y la pista de la cadena que está pendiente
const writeWord = async (word, hint) => {
  const r = await b.evaluate(`(()=>{const ins=[...document.querySelectorAll('#word-form input')];if(ins.length<2)return 'no-form';
    ins[0].value='${word}';ins[0].dispatchEvent(new Event('input',{bubbles:true}));
    ins[1].value='${hint}';ins[1].dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`);
  if (r !== 'ok') return r;
  await click('#word-actions .btn'); await sleep(500);
  return 'ok';
};
/** Prueba una letra: elige del teclado la que más sirve (o una que falle a propósito) y confirma. */
const playLetter = async (acierta = true) => {
  const pick = await b.evaluate(`(()=>{const s=window.__ahorcado.view();
    // Jugando solo no hay turno: el tablero es siempre el del único jugador (D-65)
    const me=s.current||s.players[0];if(!me)return 'no-turno';
    // Las del mazo vienen en minúscula y con tilde; el teclado es mayúscula sin tilde (D-57)
    const w=(s.words[me]||'').toUpperCase().replace(/Ñ/g,'\\u0001').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\u0001/g,'Ñ');
    if(!w)return 'sin-palabra';
    const libres=[...document.querySelectorAll('#keyboard button')].filter(k=>!k.disabled).map(k=>k.textContent);
    if(!libres.length)return 'sin-teclas';
    const dentro=libres.filter(l=>w.includes(l)), fuera=libres.filter(l=>!w.includes(l));
    const elegida=${acierta} ? (dentro[0]||fuera[0]) : (fuera[0]||dentro[0]);
    const k=[...document.querySelectorAll('#keyboard button')].find(x=>x.textContent===elegida);
    k.click();return elegida})()`);
  if (pick.length > 1) return pick;
  await sleep(120);
  const c = await b.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];const x=bs[bs.length-1];
    if(!x||x.disabled)return 'no-confirm';x.click();return 'ok'})()`);
  if (c !== 'ok') return c;
  await sleep(650);
  return pick;
};
/** Compra una letra (D-58): abre la confirmación y acepta. */
const buyLetter = async () => {
  const r = await clickText('#confirm .btn', '💡|Comprar|Buy|Comprar');
  if (r !== 'ok') return 'sin-boton';
  await sleep(300);
  await clickText('#handoff .btn', 'S(í|i)|Yes|Sim|Comprar|Buy');
  await sleep(650);
  return 'ok';
};

// El veredicto de cada palabra se queda hasta que lo toquen (C-8b, D-56): hay que cerrarlos
// todos para llegar al resultado.
const hastaResultado = async () => {
  for (let i = 0; i < 8; i++) {
    if (await b.active() === 'screen-result' && !(await overlay())) return 'ok';
    await tap(450);
  }
  return await b.active();
};

await b.go('http://localhost:8765/ahorcado/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/ahorcado/');
console.log('modos:', await b.evaluate(`[...document.querySelectorAll('.mode')].map(m=>m.textContent.replace(/\\s+/g,' ').trim()+(m.disabled?' (off)':'')).join(' | ')`));
await b.shot('01-intro');

/* ---------------- UN CELULAR · cadena de 3 jugadores ---------------- */
await click('.mode'); await sleep(350);
await clickText('#setup-form .btn--ghost', 'Agregar|Add'); await sleep(120);
await b.evaluate(`(()=>{const n=['Javi','Cata','Nico'];[...document.querySelectorAll('#setup-form .player-row input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
await clickText('#setup-form .seg--src button', 'Cadena|Chain|Corrente'); await sleep(120);
await clickText('#setup-form .seg:not(.seg--src) button', '· 6'); await sleep(120);
console.log('cadena y 6 errores:', await b.evaluate(`[...document.querySelectorAll('#setup-form .seg button.on')].map(x=>x.textContent.replace(/\\s+/g,' ').trim()).join(' | ')`));
await b.shot('02-setup');
await click('#setup-actions .btn'); await sleep(700);

// Cada uno le escribe al siguiente, con la pantalla tapada de por medio (C-9, D-53)
console.log('tapada antes de escribir:', await overlay());
await b.shot('03-cover');
const CADENA = [['MURCIELAGO', 'Vuela de noche'], ['ALCACHOFA', 'Se come hoja por hoja'], ['TRAMPOLIN', 'Salta antes del agua']];
for (const [w, h] of CADENA) {
  await tap();
  if (w === CADENA[0][0]) {
    await b.shot('04-word');
    // Sugerencias de la temática: tocar una llena los dos campos y se puede editar después (D-62)
    console.log('sugerencias:', await b.evaluate(`[...document.querySelectorAll('.suggest .sug')].map(x=>x.innerText.replace(/\\n/g,' ')).join(' · ')`));
    await click('.suggest .sug'); await sleep(250);
    console.log('al tocar una:', await b.evaluate(`(()=>{const i=[...document.querySelectorAll('#word-form input')];return JSON.stringify({palabra:i[0].value,pista:i[1].value,marcada:!!document.querySelector('.suggest .sug.on')})})()`));
    await b.evaluate(`(()=>{const i=document.querySelectorAll('#word-form input')[0];i.value='X';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
    await sleep(150);
    console.log('al editarla se desmarca:', await b.evaluate(`!document.querySelector('.suggest .sug.on')`));
  }
  console.log('palabra escrita:', w, '→', await writeWord(w, h));
}
await sleep(500);
let s = await v();
console.log('formas declaradas:', JSON.stringify(Object.fromEntries(Object.entries(s.st).map(([r, x]) => [r, x.pattern]))));
// Lo que viaja es la forma, la pista y el hash; la palabra vive aparte, en este celular (C-10)
console.log('la palabra no viaja:', await b.evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('juegos-de-salon:ahorcado:session'));
  const w=(d.messages||[]).filter(m=>m.t==='word');
  return 'mensajes word='+w.length+' | claves='+[...new Set(w.flatMap(m=>Object.keys(m)))].join(',')
    +' | secretos guardados aparte para='+Object.keys(d.private||{}).join(',')})()`));

// Entrar al primer turno
console.log('pase al primer turno:', await overlay());
await tap();
await b.shot('05-play');
console.log('tablero inicial:', JSON.stringify(await v()));

// Una letra que no está: se marca sin bloquear, y viene pegada al pase (C-9, D-56, D-59)
console.log('letra errada:', await playLetter(false));
// En un celular el cartel no va: el veredicto y el pase ya ocupan su propia pantalla (D-63)
console.log('sin cartel en un celular:', await b.evaluate(`!document.querySelector('.flash')`));
console.log('veredicto + pase juntos:', await overlay());
await b.shot('06-letter-verdict');
await tap();
console.log('turno alternado:', (await v()).current);

// Comprar una letra (D-58)
const antes = await v();
console.log('compra:', await buyLetter());
await tap(300);
const desp = await v();
const quien = Object.keys(antes.st).find(r => desp.st[r].bought > antes.st[r].bought);
console.log('compró:', quien, '| vidas', antes.st[quien]?.lives, '→', desp.st[quien]?.lives, '| patrón', desp.st[quien]?.pattern);

// Memoria de partida a mitad (C-6, AH-11)
await b.go('http://localhost:8765/ahorcado/', 1300);
console.log('tras recargar → continuar:', await b.evaluate(`!!document.querySelector('#resume-slot .btn')`));
await click('#resume-slot .btn'); await sleep(1000);
await tap();
console.log('retomado:', JSON.stringify(await v()));

// Unas cuantas jugadas para que el tablero tenga algo que mostrar: letras gastadas, el dibujo
// empezado y la tira con las vidas ya desparejas (D-55)
let guard = 0;
for (let i = 0; i < 7; i++) {
  const r = await playLetter(i % 4 !== 3);
  if (r.length > 1) { console.log('corte a mitad:', r); break; }
  await tap(300); await tap(200);
}
s = await v();
console.log('a mitad:', JSON.stringify(s));
await b.shot('07-play-medio');

// Terminar la partida acertando siempre
while (guard++ < 90) {
  s = await v();
  if (s.done) break;
  const r = await playLetter(true);
  if (r.length > 1) { console.log('corte:', r, JSON.stringify(s)); break; }
  await tap(300); await tap(200);
}
s = await v();
console.log('fin un celular:', JSON.stringify(s));
console.log('hasta el resultado:', await hastaResultado(), '| pantalla:', await b.active());
await sleep(2600); await b.shot('08-result');   // el confeti tapa el ranking: que caiga
console.log('resultado:', await b.evaluate(`document.getElementById('result-title').textContent+' | '+document.getElementById('result-sub').textContent+' | '+document.getElementById('result-ranking').innerText.replace(/\\n/g,' · ')`));
console.log('palabras reveladas:', await b.evaluate(`document.getElementById('result-words').innerText.replace(/\\n/g,' · ')`));

/* ---------------- JUGAR SOLO ---------------- */
await b.go('http://localhost:8765/ahorcado/'); await b.evaluate(`localStorage.clear(); 1`); await b.go('http://localhost:8765/ahorcado/');
await b.evaluate(`document.querySelectorAll('.mode')[2].click(); 1`); await sleep(350);
// La palabra sale del mazo, así que no hay de dónde elegirla ni a quién escribírsela (D-65)
console.log('jugando solo · temática:', await b.evaluate(`!!document.querySelector('.themes')`),
  '| sin selector de palabra:', await b.evaluate(`!document.querySelector('.seg--src')`),
  '| un solo nombre:', await b.evaluate(`document.querySelectorAll('#setup-form input').length === 1`));
await clickText('.theme-card', 'Animales'); await sleep(120);
await b.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await click('#setup-actions .btn'); await sleep(900);
console.log('empieza derecho a jugar:', await b.active(), '| sin tira de rivales:', await b.evaluate(`document.getElementById('rivals').children.length === 0`));
console.log('pista del mazo:', await b.evaluate(`document.getElementById('hint').innerText.replace(/\\n/g,' ')`));
await b.shot('09-solo');
{
  // El cartel de la letra también acá, que es el otro modo donde nada abre pantalla (D-63)
  const l = await b.evaluate(`(()=>{const s=window.__ahorcado.view();const w=(s.words.A||'').toUpperCase();
    const k=[...document.querySelectorAll('#keyboard button')].find(x=>!x.disabled&&w.includes(x.textContent));
    if(!k)return 'no';k.click();return k.textContent})()`);
  await sleep(150);
  await b.evaluate(`(()=>{const bs=[...document.querySelectorAll('#confirm .btn')];bs[bs.length-1].click();return 1})()`);
  await sleep(260);
  console.log('cartel tras confirmar:', await b.evaluate(`(()=>{const f=document.querySelector('.flash');return f?f.className+' · '+f.innerText.replace(/\\n/g,' '):'ninguno'})()`), '| letra:', l);
}
guard = 0;
while (guard++ < 40) {
  s = await v();
  if (s.done) break;
  const r = await playLetter(true);
  if (r.length > 1) { console.log('corte jugando solo:', r); break; }
  await tap(300);
}
s = await v();
console.log('fin jugando solo:', JSON.stringify(s));
// Un solo aviso: la pantalla final. El veredicto de ronda diría lo mismo y sobra (D-65)
console.log('sin veredicto de ronda:', await b.evaluate(`document.getElementById('handoff').hidden`));
console.log('hasta el resultado:', await hastaResultado(), '| pantalla:', await b.active());
console.log('sin ranking de uno solo:', await b.evaluate(`document.getElementById('ranking-panel').hidden`));
await sleep(2600); await b.shot('10-solo-result');
console.log('resultado:', await b.evaluate(`document.getElementById('result-title').textContent+' | '+document.getElementById('result-sub').textContent`));
console.log('la palabra:', await b.evaluate(`document.getElementById('result-words').innerText.replace(/\\n/g,' · ')`));
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
