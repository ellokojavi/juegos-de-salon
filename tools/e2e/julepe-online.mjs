// Julepe con tres celulares contra Firebase real: sala, reparto cerrado (D-81), turnos por la
// red, sello de cartas verificadas al cerrar la mano (C-10), reconexión y chat.
//
// Cada "celular" es un Chrome con su propio perfil y su propio origen, para que no compartan
// localStorage (ver el README de esta carpeta).
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const hosts = ['http://localhost:8765', 'http://127.0.0.1:8765', 'http://[::1]:8765'];
const A = await launch({ port: 9390, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9391, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const C = await launch({ port: 9392, dir: `${OUT}/pC`, out: OUT, width: 375, height: 812 });
const devs = { A, B, C };
const NOMBRE = { A: 'Javi', B: 'Cata', C: 'Nico' };

const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const pantalla = d => d.evaluate(`document.querySelector('.screen.active')?.id`);
const rolDe = d => d.evaluate(`window.__julepe.session()?.role`);
const vista = d => d.evaluate(`(()=>{const v=window.__julepe?.view();if(!v)return JSON.stringify({nada:true});
  if(v.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:v.phase,turno:v.turno,mano:v.manoN,plato:v.plato,triunfo:v.triunfo,done:v.done,
    conozco:Object.keys(v.cartas),mias:v.cartas[window.__julepe.session().role]||null,
    decl:v.decl,bazas:v.bazas.length,ganadores:v.ganadores})})()`).then(JSON.parse);
const overlay = d => d.evaluate(`(()=>{const h=document.getElementById('handoff');return h.hidden?'':h.innerText.replace(/\\n/g,' | ').slice(0,160)})()`);
const cerrarOverlay = async d => { await d.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'nada';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`); await sleep(400); };

/** El turno de ese celular, sea cual sea la fase. Va siempre, para que la mesa se mueva. */
const jugar = d => d.evaluate(`(()=>{
  const v = window.__julepe.view(); if (!v) return 'sin partida';
  const btn = () => document.querySelector('#actions .btn--yellow');
  if (v.phase === 'declara') { const b = btn(); if (!b) return 'no'; b.click(); return 'voy'; }
  if (v.phase === 'cambia') { const c = document.querySelector('#mine .pcard'); if (c) c.click(); const b = btn(); if (!b) return 'no'; b.click(); return 'cambia'; }
  if (v.phase === 'baza') {
    const c = document.querySelector('#mine .pcard:not(.off)'); if (!c) return 'sin carta';
    c.click(); const b = btn(); if (!b || b.disabled) return 'sin boton';
    const t = b.textContent.trim(); b.click(); return t;
  }
  if (v.phase === 'regala') {
    for (let i = 0; i < 12; i++) {
      const b = btn(); if (b && !b.disabled) { b.click(); return 'regala'; }
      const mas = [...document.querySelectorAll('.give-pm button')].filter(x => x.textContent === '+' && !x.disabled)[0];
      if (!mas) return 'sin mas';
      mas.click();
    }
  }
  return 'nada';
})()`);

/* ---------------- Sala ---------------- */
await A.go(`${hosts[0]}/julepe/`); await A.evaluate(`localStorage.clear(); 1`); await A.go(`${hosts[0]}/julepe/`);
await click(A, '.modes .mode:nth-child(2)'); await sleep(400);
await setName(A, NOMBRE.A);
await click(A, '#setup-actions .btn--yellow'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| pantalla de A:', await pantalla(A));

for (const [rol, dev] of [['B', B], ['C', C]]) {
  const host = hosts[rol === 'B' ? 1 : 2];
  // Entra por el enlace de invitación, que es como llega de verdad
  await dev.go(`${host}/julepe/?sala=${code}`); await dev.evaluate(`localStorage.clear(); 1`);
  await dev.go(`${host}/julepe/?sala=${code}`); await sleep(1200);
  await setName(dev, NOMBRE[rol]);
  await dev.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join|Entrar/i.test(x.textContent)).click(); 1`);
  await sleep(4500);
  console.log(`${rol} entró →`, await pantalla(dev), '· rol:', await rolDe(dev));
}
await sleep(1200);
console.log('en la sala:', await A.evaluate(`document.querySelectorAll('#lobby-box .lobby-players .p').length`), 'jugadores');
await A.shot('online-01-sala');

await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn--yellow')][0].click(); 1`); await sleep(3000);
console.log('partió →', JSON.stringify(await vista(A)));

/* ---------------- El reparto llega cerrado (D-81) ---------------- */
{
  const mensaje = await A.evaluate(`(()=>{const p=window.__julepe.match().plays.find(x=>x.t==='reparte');
    return p ? JSON.stringify({cerrado:!!p.s,claro:!!p.m,sobres:Object.keys(p.s||{}),largo:(p.s?Object.values(p.s)[0].length:0)}) : 'null'})()`);
  console.log('mensaje de reparto:', mensaje);
  for (const rol of ['A', 'B', 'C']) {
    const v = await vista(devs[rol]);
    console.log(`  ${rol} conoce las cartas de:`, v.conozco.join(',') || '(ninguna)', '· las suyas:', (v.mias || []).join(' '));
  }
}
await B.shot('online-02-mesa');

/* ---------------- Una partida completa por la red ---------------- */
let vueltas = 0, sellos = new Set(), reconectado = false;
while (vueltas++ < 500) {
  const fin = await Promise.all(['A', 'B', 'C'].map(r => pantalla(devs[r])));
  if (fin.every(p => p === 'screen-result')) break;
  for (const rol of ['A', 'B', 'C']) {
    const d = devs[rol];
    const texto = await overlay(d);
    if (texto) {
      const s = await d.evaluate(`document.querySelector('#handoff .sello')?.textContent || ''`);
      if (s) sellos.add(s);
      if (!reconectado && /JULEPE|salvaron/.test(texto) && rol === 'A') await d.shot('online-03-julepe');
      await cerrarOverlay(d);
      continue;
    }
    const v = await vista(d);
    if (v.nada || v.lobby || v.done) continue;
    if (v.turno !== rol) continue;
    const r = await jugar(d);
    if (r === 'sin carta' || r === 'sin boton' || r === 'sin mas') { console.log('⚠️ turno pegado en', rol, r, v.phase); vueltas = 999; break; }
    await sleep(260);
  }
  // A mitad de la segunda mano, B recarga: tiene que volver a su sala y a sus cartas (C-6)
  const vb = await vista(B);
  if (!reconectado && vb.mano === 1 && vb.phase === 'baza') {
    reconectado = true;
    await B.go(`${hosts[1]}/julepe/?sala=${code}`); await sleep(9000);   // entrar a la sala tiene tope de 12 s
    const ahora = await vista(B);
    console.log('B recargó →', await pantalla(B), '· mano', ahora.mano, '· sus cartas:', (ahora.mias || []).join(' ') || '⚠️ perdió su mano');
    // Si no volvió a la mesa, lo primero que hay que saber es si la partida quedó guardada
    if ((await pantalla(B)) !== 'screen-play') {
      console.log('  lo que B tenía guardado:', await B.evaluate(`(()=>{const r=localStorage.getItem('juegos-de-salon:julepe:session');
        if(!r)return 'nada';const d=JSON.parse(r);return JSON.stringify({mode:d.mode,code:d.code,role:d.role,done:d.done,manos:Object.keys(d.private?.privadas||{}),llave:!!d.private?.llave})})()`));
    }
  }
  await sleep(200);
}

for (const rol of ['A', 'B', 'C']) {
  const v = await vista(devs[rol]);
  console.log(`${rol} →`, await pantalla(devs[rol]), '· manos:', v.mano, '· ganan:', (v.ganadores || []).join(','));
}
console.log('sellos vistos:', [...sellos].join(' / ') || '⚠️ ninguno');
await A.shot('online-04-resultado');

/* ---------------- Chat de la sala (C-15) ---------------- */
await A.evaluate(`document.querySelector('.chat-fab')?.click(); 1`); await sleep(300);
console.log('A envía:', await A.evaluate(`(()=>{const i=document.querySelector('.chat-form input');if(!i)return 'no-input';
  i.value='¡otra y el plato me lo tomo yo!';i.dispatchEvent(new Event('input',{bubbles:true}));
  document.querySelector('.chat-send').click();
  return document.querySelector('.chat-form input').value==='' ? 'enviado' : 'bloqueado'})()`));
await sleep(1800);
console.log('chat en B:', await B.evaluate(`JSON.stringify({burbuja:!!document.querySelector('.chat-fab'),
  noLeidos:document.querySelector('.chat-badge')?.textContent||'0',
  mensajes:[...document.querySelectorAll('.chat-msg')].map(x=>x.textContent)})`));

const errores = [A, B, C].flatMap((d, i) => d.errors.map(e => `${'ABC'[i]}: ${e}`));
console.log('errores de consola:', errores.length ? errores.join(' | ') : 'ninguno');
await A.close(); await B.close(); await C.close();
console.log('julepe (sala): listo');
