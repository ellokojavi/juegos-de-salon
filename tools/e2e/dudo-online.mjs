// Dudo con tres celulares contra Firebase real: sala, apuestas por turnos, destape verificado
// (C-10), reconexión a mitad de partida y revancha.
//
// Cada "celular" es un Chrome con su propio perfil y su propio origen, para que no compartan
// localStorage (ver el README de esta carpeta).
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const hosts = ['http://localhost:8765', 'http://127.0.0.1:8765', 'http://[::1]:8765'];
const A = await launch({ port: 9386, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9387, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const C = await launch({ port: 9388, dir: `${OUT}/pC`, out: OUT, width: 375, height: 812 });
const devs = { A, B, C };
const NOMBRE = { A: 'Javi', B: 'Cata', C: 'Nico' };

const click = (d, sel) => d.evaluate(`(()=>{const x=document.querySelector('${sel}');if(!x)return 'no';x.click();return 'ok'})()`);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const pantalla = d => d.evaluate(`document.querySelector('.screen.active')?.id`);
const estado = d => d.evaluate(`(()=>{const s=window.__dudo?.view();if(!s)return JSON.stringify({nada:true});
  if(s.lobby)return JSON.stringify({lobby:true});
  return JSON.stringify({phase:s.phase,current:s.current,round:s.round,done:s.done,winner:s.winner,
    bid:s.bid?s.bid.n+'×'+s.bid.p:null,waiting:s.waiting,
    dados:Object.fromEntries(Object.entries(s.st).map(([r,x])=>[r,x.dice]))})})()`).then(JSON.parse);
const overlay = d => d.evaluate(`(()=>{const h=document.getElementById('handoff');return h.hidden?'':h.innerText.replace(/\\n/g,' | ').slice(0,120)})()`);
const cerrarOverlay = async d => { await d.evaluate(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'nada';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`); await sleep(400); };

/** La jugada de quien tiene el turno: apuesta lo mínimo con la primera pinta disponible, o duda. */
const jugar = async (d, dudar = false) => d.evaluate(`(()=>{
  if (${dudar}) { const b=[...document.querySelectorAll('#actions .btn')].find(x=>/Dudo/i.test(x.textContent)); if(!b)return 'sin dudo'; b.click(); return 'dudo'; }
  const p=[...document.querySelectorAll('.pinta')].filter(x=>!x.disabled); if(!p.length)return 'sin pintas';
  p[0].click();
  const ok=document.querySelector('#actions .btn--yellow'); if(!ok||ok.disabled)return 'sin boton';
  const t=ok.textContent; ok.click(); return t;
})()`);

/* ---------------- Sala ---------------- */
await A.go(`${hosts[0]}/dudo/`); await A.evaluate(`localStorage.clear(); 1`); await A.go(`${hosts[0]}/dudo/`);
await click(A, '.modes .mode:nth-child(2)'); await sleep(400);
await setName(A, NOMBRE.A);
await click(A, '#setup-actions .btn--yellow'); await sleep(5000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
console.log('sala:', code, '| pantalla de A:', await pantalla(A));

for (const [rol, dev] of [['B', B], ['C', C]]) {
  const host = hosts[rol === 'B' ? 1 : 2];
  // Entra por el enlace de invitación, que es como llega de verdad (RP-18)
  await dev.go(`${host}/dudo/?sala=${code}`); await dev.evaluate(`localStorage.clear(); 1`);
  await dev.go(`${host}/dudo/?sala=${code}`); await sleep(1200);
  await setName(dev, NOMBRE[rol]);
  await dev.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join|Entrar/i.test(x.textContent)).click(); 1`);
  await sleep(4500);
  console.log(`${rol} entró →`, await pantalla(dev), '· rol:', await dev.evaluate(`window.__dudo.session().role`));
}
await sleep(1200);
console.log('en la sala:', await A.evaluate(`document.querySelectorAll('#lobby-box .lobby-players .p').length`), 'jugadores');
await A.shot('online-01-sala');

// Solo el anfitrión parte la partida
await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn--yellow')][0].click(); 1`); await sleep(2500);
console.log('partió →', JSON.stringify(await estado(A)));

/* ---------------- Una partida ---------------- */
let vueltas = 0, destapes = 0, verificados = 0, reconectado = false;
while (vueltas++ < 80) {
  const s = await estado(A);
  if (s.done) break;
  // El destape se mira en los tres y se cierra en los tres
  for (const [rol, dev] of Object.entries(devs)) {
    const o = await overlay(dev);
    if (o) {
      if (rol === 'A' && !destapes) { await dev.shot('online-02-destape'); console.log('destape:', o); }
      if (/✅/.test(o)) verificados++;
      if (rol === 'A') destapes++;
      await cerrarOverlay(dev);
    }
  }
  const v = await estado(A);
  if (v.done) break;
  // A mitad de partida, un celular recarga: tiene que volver a su sala con los dados que tenía
  if (!reconectado && v.round >= 3 && v.phase === 'bid') {
    reconectado = true;
    await B.go(`${hosts[1]}/dudo/?sala=${code}`); await sleep(4500);
    const vuelto = await estado(B);
    console.log('B recargó a mitad →', await pantalla(B), '· ronda', vuelto.round, '· sus dados:',
      await B.evaluate(`(()=>{const s=window.__dudo.session();const v=window.__dudo.view();return (s.secrets[v.round]?.dice||[]).join(',')||'(los tira de nuevo)'})()`));
  }
  if (v.phase !== 'bid' || !v.current) { await sleep(500); continue; }
  const turno = devs[v.current];
  const r = await jugar(turno, vueltas % 3 === 0);
  if (/sin /.test(r)) await jugar(turno, true);
  await sleep(900);
}
const fin = await estado(A);
console.log('partida →', JSON.stringify({ done: fin.done, winner: fin.winner, rondas: fin.round, destapes, verificados }));

/* ---------------- Hasta el final ---------------- */
let g2 = 0;
while (g2++ < 160) {
  for (const dev of Object.values(devs)) { if (await overlay(dev)) await cerrarOverlay(dev); }
  const v = await estado(A);
  if (v.done) break;
  if (v.phase !== 'bid' || !v.current) { await sleep(400); continue; }
  const r = await jugar(devs[v.current], g2 % 2 === 0);
  if (/sin /.test(r)) await jugar(devs[v.current], true);
  await sleep(700);
}
const s3 = await estado(A);
console.log('final →', JSON.stringify({ done: s3.done, winner: s3.winner, pantalla: await pantalla(A) }));
if (s3.done) await A.shot('online-03-resultado');

/* ---------------- Revancha: sala nueva y todos adentro ---------------- */
if (s3.done) {
  await A.evaluate(`document.querySelector('#result-actions .btn--yellow').click(); 1`); await sleep(6000);
  const nuevo = await A.evaluate(`window.__dudo.session()?.code`);
  console.log('revancha → sala nueva:', nuevo, '· distinta de la primera:', nuevo !== code, '· pantalla:', await pantalla(A));
  await sleep(3000);
  for (const [rol, dev] of [['B', B], ['C', C]]) {
    await dev.evaluate(`document.querySelector('#result-actions .btn--yellow')?.click(); 1`); await sleep(4000);
    console.log(`${rol} en la revancha →`, await pantalla(dev), '· sala:', await dev.evaluate(`window.__dudo.session()?.code`));
  }
}

for (const [rol, dev] of Object.entries(devs)) {
  const errs = dev.errors.concat(dev.logs.filter(l => !/vibrate|permission_denied/i.test(l)));
  console.log(`errores en ${rol}:`, JSON.stringify(errs.slice(0, 2)));
}
A.close(); B.close(); C.close();
