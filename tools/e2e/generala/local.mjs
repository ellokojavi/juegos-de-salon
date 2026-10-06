// Generala de punta a punta, sin red: jugar solo entero, tres en un celular con recarga a mitad de
// partida (C-6) y la generala servida. Comprueba que nada venga elegido (C-8), que los dados
// guardados no cambien al tirar, que el puntaje anotado sea el que la planilla mostraba y que la
// partida terminada no se ofrezca para retomar. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9389, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const pantalla = () => ev(`document.querySelector('.screen.active').id`);
const vista = () => ev(`JSON.stringify((({current,tiro,dados,keep,done,winners,vuelta,servida,history})=>({current,tiro,dados,keep,done,winners,vuelta,servida,n:history.length}))(__generala.view()))`).then(JSON.parse);
const nombres = async ns => ev(`(()=>{const n=${JSON.stringify(ns)};[...document.querySelectorAll('#setup-form input')].forEach((i,k)=>{i.value=n[k];i.dispatchEvent(new Event('input',{bubbles:true}))});return 1})()`);
const pase = () => ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return false;h.querySelector('.btn').click();return true})()`);

/**
 * Un turno de quien tiene el celular: tira, guarda los dados de la cara que más se repite, vuelve
 * a tirar y anota donde la planilla promete más (o la primera libre). Devuelve lo que la planilla
 * prometía y lo que quedó anotado.
 */
async function turno() {
  await ev(`document.getElementById('btn-tirar').click(); 1`); await sleep(120);
  const antes = await vista();
  const cara = [1, 2, 3, 4, 5, 6].sort((x, y) => antes.dados.filter(d => d === y).length - antes.dados.filter(d => d === x).length)[0];
  await ev(`(()=>{const d=document.querySelectorAll('.dado-btn');${JSON.stringify(antes.dados)}.forEach((v,i)=>{if(v===${cara})d[i].click()});return 1})()`);
  const guardados = await ev(`JSON.stringify(__generala.session().keep)`).then(JSON.parse);
  if (guardados.some(k => !k)) { await ev(`document.getElementById('btn-tirar').click(); 1`); await sleep(120); }
  const despues = await vista();
  const cambiaron = guardados.some((g, i) => g && despues.dados[i] !== antes.dados[i]);
  // La casilla que más vale según la planilla
  const elegida = await ev(`(()=>{const c=[...document.querySelectorAll('.casilla.libre')];c.sort((a,b)=>Number(b.querySelector('.val').textContent)-Number(a.querySelector('.val').textContent));c[0].click();return JSON.stringify({cat:c[0].dataset.cat,val:Number(c[0].querySelector('.val').textContent)})})()`).then(JSON.parse);
  const boton = await ev(`document.getElementById('btn-anotar').textContent`);
  await ev(`document.getElementById('btn-anotar').click(); 1`); await sleep(150);
  return { cambiaron, elegida, boton };
}

await b.go(`${SITIO}/`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITIO}/generala/`);
await b.shot('01-intro');
console.log('modos:', await ev(`[...document.querySelectorAll('.mode')].map(m=>m.innerText.split('\\n')[0]).join(' | ')`));

/* ---------------- Jugar solo ---------------- */
await ev(`document.querySelector('[data-mode=solo]').click(); 1`); await sleep(300);
ok(!(await ev(`!!document.querySelector('#setup-form .switch')`)), 'jugando solo no se ofrece "la generala servida gana"');
await nombres(['Javi']);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(400);
ok(await pantalla() === 'screen-play', 'jugando solo se llega a la mesa sin pase');
ok(await ev(`!document.getElementById('btn-anotar')`), 'antes de tirar no hay nada que anotar');
await ev(`document.getElementById('btn-tirar').click(); 1`); await sleep(200);
ok(await ev(`document.getElementById('btn-anotar').disabled`), 'después de tirar, "Anotar" espera que se elija una casilla (C-8)');
ok(await ev(`!document.querySelector('.casilla.on')`), 'ninguna casilla viene elegida (C-8)');
await ev(`document.querySelector('.casilla.libre').click(); 1`); await sleep(100);
ok(/\d|✕|0/.test(await ev(`document.getElementById('btn-anotar').textContent`)) && !(await ev(`document.getElementById('btn-anotar').disabled`)), `el botón dice dónde anota: "${await ev(`document.getElementById('btn-anotar').textContent`)}"`);
await ev(`document.body.click(); 1`); await sleep(100);
ok(await ev(`!document.querySelector('.casilla.on')`), 'un toque fuera suelta la casilla (C-8)');
await ev(`document.querySelectorAll('.dado-btn')[1].click(); 1`); await sleep(100);
await b.shot('02-mesa');

let mal = 0, cambio = 0;
for (let t = 0; t < 11; t++) {
  const antes = await ev(`__generala.view().st.A.total`);
  const r = await turno();
  const despues = await ev(`__generala.view()?.st.A.total`);
  if (despues - antes !== r.elegida.val) mal++;
  if (r.cambiaron) cambio++;
}
ok(mal === 0, 'cada anotación sumó lo que la planilla prometía');
ok(cambio === 0, 'los dados guardados no cambian al volver a tirar');
await sleep(500);
ok(await pantalla() === 'screen-result', 'después de 11 turnos, el final');
console.log('solo →', await ev(`document.getElementById('result-title').textContent`), '·', await ev(`document.getElementById('result-sub').textContent`));
ok(!!(await ev(`localStorage.getItem('juegos-de-salon:generala:record-solo')`)), 'queda el récord del celular');
ok(await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:generala:session')).done`) === true, 'la partida terminada no se ofrece para retomar');
await sleep(3800);   // el confeti taparía la captura (D-76)
await b.shot('03-final-solo');

/* ---------------- Tres en un celular, con recarga ---------------- */
await b.go(`${SITIO}/generala/`);
await ev(`document.querySelector('[data-mode=local]').click(); 1`); await sleep(300);
await ev(`document.querySelector('#setup-actions .btn--ghost').click(); 1`); await sleep(150);
ok(await ev(`document.querySelector('#setup-form .switch').classList.contains('on')`), 'la generala servida gana viene encendida, a la vista');
await nombres(['Javi', 'Cata', 'Nico']);
await b.shot('04-configuracion');
// Sin la servida: la partida tiene que llegar a las 11 vueltas
await ev(`document.querySelector('#setup-form .switch').click(); 1`);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(500);
ok(await ev(`!document.getElementById('handoff').hidden`), 'en un celular arranca con el pase (C-9)');
let pases = 0, resultadoAntesDelPase = 0, recargado = false;
for (let g = 0; g < 200 && (await pantalla()) !== 'screen-result'; g++) {
  if (await ev(`!document.getElementById('handoff').hidden`)) {
    if (await ev(`!!document.querySelector('#handoff .anoto')`)) resultadoAntesDelPase++;
    if (pases === 2) await b.shot('05-pase');
    await pase(); pases++; await sleep(450); continue;
  }
  if (!recargado && (await vista()).vuelta === 4) {
    // Retomar a mitad de partida (C-6): nadie sabe quién tenía el celular
    recargado = true;
    await b.go(`${SITIO}/generala/`);
    ok(await ev(`!!document.getElementById('btn-continuar')`), `al recargar se ofrece seguir: "${await ev(`document.querySelector('#resume-slot .muted').textContent`)}"`);
    await ev(`document.getElementById('btn-continuar').click(); 1`); await sleep(600);
    ok(await ev(`!document.getElementById('handoff').hidden`), 'al retomar vuelve la pantalla de pase');
    continue;
  }
  await turno();
}
ok(recargado, 'se recargó a mitad de partida');
ok(resultadoAntesDelPase >= 30, `cada pase muestra antes lo anotado (${resultadoAntesDelPase})`);
const fin = await vista();
ok(fin.done && fin.n === 33, `tres jugadores, 33 anotaciones (${fin.n})`);
console.log('tres en un celular →', await ev(`document.getElementById('result-title').textContent`), '·', await ev(`[...document.querySelectorAll('#result-podio .fila')].map(f=>f.innerText.replace(/\\n/g,' ')).join(' / ')`));
await ev(`document.getElementById('result-cards').open = true; 1`);
await sleep(3800);
await b.shot('06-final');

/* ---------------- La generala servida ---------------- */
await ev(`document.getElementById('btn-otra').click(); 1`); await sleep(500);
await pase(); await sleep(450);
// La servida viene encendida en "Otra partida" solo si estaba: esta mesa la apagó
ok((await vista()).current === 'A', 'otra partida con la misma mesa');
await b.go(`${SITIO}/generala/`);
await ev(`document.querySelector('[data-mode=local]').click(); 1`); await sleep(300);
await nombres(['Javi', 'Cata']);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(500);
await pase(); await sleep(450);
await turno(); await sleep(300);
await pase(); await sleep(450);
await ev(`__generala.session().transport.send({t:'roll',from:'B',d:'33333',k:'00000'}); 1`); await sleep(500);
ok(await ev(`!!document.querySelector('#handoff .servida')`), 'la generala servida se celebra');
await b.shot('07-servida');
await ev(`document.getElementById('handoff').click(); 1`); await sleep(700);
ok(await pantalla() === 'screen-result', 'y la partida termina');
ok(/Cata/.test(await ev(`document.getElementById('result-title').textContent`)), `gana quien la sacó: ${await ev(`document.getElementById('result-title').textContent`)}`);
ok(await ev(`document.querySelector('#result-podio .fila').classList.contains('gana')`), 'quien ganó va primero aunque tenga menos puntos');

console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs.filter(l => !/vibrate/i.test(l))));
ok(!b.errors.length, 'sin errores en la página');
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ generala local');
