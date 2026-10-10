// El caso (prototipo del laboratorio, D-256) de punta a punta: el laboratorio lo ofrece, marcar
// antes de tiempo no se acepta y cuenta como error (D-261), un error se cuenta, la ayuda (D-263), el caso se resuelve
// entero sin adivinar y al recargar sigue donde estaba (C-6). Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/caso-lab';
const b = await launch({ port: 9392, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };

await b.go(`${SITIO}/labs/`);
ok(await ev(`!!document.querySelector('#btn-caso[href="../case/?labs"]')`), 'el laboratorio ofrece El caso con la experiencia completa (portada, prueba, 3, 2, 1)');
ok(await ev(`!!document.querySelector('#btn-caso-dia[href="case/"]')`), 'y el caso del día del prototipo');
await b.go(`${SITIO}/labs/case/?c=PRUEBA`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITIO}/labs/case/?c=PRUEBA`);
ok(await ev(`document.getElementById('caso-nombre').textContent`) === 'Caso PRUEBA', 'con ?c= es ese caso');
ok(await ev(`document.querySelectorAll('.persona').length`) === 20, 'veinte sospechosos');
ok(await ev(`document.querySelectorAll('#pistas .pista').length`) === 1, 'se parte con una pista');
await b.shot('01-inicio');

// "¿Cómo se juega?" abre las reglas y baja hasta ellas, sin el salto del ancla
await ev(`document.getElementById('ir-reglas').click(); 1`); await sleep(900);
ok(await ev(`document.getElementById('reglas').open && !location.hash && scrollY > 0`), '"¿Cómo se juega?" abre las reglas y baja hasta ellas');
await ev(`document.getElementById('reglas').open = false; scrollTo(0, 0); 1`); await sleep(200);

// Tocar la pista ilumina en la grilla a las personas de las que habla, y la sacada de las otras
await ev(`document.querySelector('#pistas .pista .texto').click(); 1`); await sleep(300);
const foco = await ev(`JSON.stringify({ foco: document.querySelectorAll('.persona.foco').length, habla: document.querySelectorAll('.persona.habla').length, enfoque: document.getElementById('grilla').classList.contains('enfoque') })`).then(JSON.parse);
ok(foco.enfoque && foco.foco >= 1 && foco.habla === 1, `tocar la pista ilumina a quiénes nombra (${foco.foco}) y a quien la dice`);
await b.shot('01b-pista-iluminada');
await ev(`document.querySelector('.marcador').click(); 1`); await sleep(200);
ok(await ev(`!document.getElementById('grilla').classList.contains('enfoque')`), 'un toque fuera la apaga');

// Alguien que todavía no se puede saber: no se acepta y cuenta como error (D-261)
let esperados = 0;
const nose = await ev(`(async()=>{const {deducibles}=await import('/labs/case/engine.js');const e=__caso.estado();const d=deducibles(e.pistas,e.x);return [...Array(20).keys()].find(i=>e.x[i]===-1&&!(i in d))})()`);
if (nose !== undefined && nose !== null) {
  await ev(`document.querySelector('.persona[data-i="${nose}"]').click(); 1`); await sleep(150);
  await ev(`document.getElementById('btn-criminal').click(); 1`); await sleep(200);
  ok(/todavía no se puede saber/i.test(await ev(`document.querySelector('.accion .msg').textContent`)), 'antes de tiempo: "todavía no se puede saber"');
  esperados = 1;
  ok(await ev(`__caso.partida().errores.length`) === 1, 'y cuenta como error (D-261)');
}

// Un error a propósito: el contrario de lo que se deduce
const [i0, v0] = await ev(`(async()=>{const {deducibles}=await import('/labs/case/engine.js');const e=__caso.estado();const d=deducibles(e.pistas,e.x);const k=Object.keys(d)[0];return [Number(k),d[k]]})()`);
await ev(`document.querySelector('.persona[data-i="${i0}"]').click(); 1`); await sleep(150);
await ev(`document.getElementById('${v0 ? 'btn-inocente' : 'btn-criminal'}').click(); 1`); await sleep(200);
ok(await ev(`__caso.partida().errores.length`) === esperados + 1, 'marcar mal cuenta un error');
esperados++;
await b.shot('02-error');
await ev(`document.getElementById('${v0 ? 'btn-criminal' : 'btn-inocente'}').click(); 1`); await sleep(200);
ok(await ev(`__caso.partida().marcas.length`) === 1, 'y después se puede marcar bien');

// Recargar a mitad: sigue donde estaba
await b.go(`${SITIO}/labs/case/?c=PRUEBA`);
ok(await ev(`document.querySelectorAll('.persona.marcada').length`) === 2, 'al recargar sigue donde estaba (C-6)');

// La ayuda (D-263): pide un segundo toque, dice a quién mirar y qué pistas juntar, y la de ahora se vuelve a ver gratis
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(150);
ok(/Toca de nuevo/.test(await ev(`document.getElementById('btn-ayuda').textContent`)) && await ev(`(__caso.partida().ayudas || []).length`) === 0, 'la ayuda pide un segundo toque antes de anotarse');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(300);
const guiada = await ev(`JSON.stringify({ msg: document.querySelector('.accion .msg')?.textContent, elegida: document.querySelector('.persona.elegida')?.dataset.i, ayudas: __caso.partida().ayudas, guia: document.querySelectorAll('#pistas .pista.guia').length })`).then(JSON.parse);
ok(/^Mira a /.test(guiada.msg) && guiada.ayudas.length === 1 && String(guiada.ayudas[0]) === guiada.elegida, `la ayuda elige a quien mirar y lo dice: ${guiada.msg}`);
ok(guiada.guia >= 1 || /varias pistas/.test(guiada.msg), `y destaca las pistas que hay que juntar (${guiada.guia})`);
await b.shot('02b-ayuda');
await ev(`document.querySelector('.marcador').click(); 1`); await sleep(150);
ok(/Ver la ayuda/.test(await ev(`document.getElementById('btn-ayuda').textContent`)), 'cerrada, se vuelve a ver sin pagar otra vez');
await ev(`document.getElementById('btn-ayuda').click(); 1`); await sleep(200);
ok(await ev(`__caso.partida().ayudas.length`) === 1, 'y no se anota de nuevo');
await ev(`document.querySelector('.marcador').click(); 1`); await sleep(150);

// Resolverlo entero, siempre con lo que se puede deducir
for (let g = 0; g < 40 && !(await ev(`__caso.estado().terminado`)); g++) {
  const d = await ev(`(async()=>{const {deducibles}=await import('/labs/case/engine.js');const e=__caso.estado();return JSON.stringify(deducibles(e.pistas,e.x))})()`).then(JSON.parse);
  if (!Object.keys(d).length) break;
  for (const [i, v] of Object.entries(d)) {
    await ev(`document.querySelector('.persona[data-i="${i}"]').click(); 1`); await sleep(40);
    await ev(`document.getElementById('${v ? 'btn-criminal' : 'btn-inocente'}').click(); 1`); await sleep(60);
  }
}
await sleep(600);
ok(await ev(`!document.getElementById('fin').hidden`), 'el caso se resuelve sin adivinar');
ok(new RegExp(`${esperados === 1 ? 'con 1 error' : `con ${esperados} errores`} y 1 ayuda`, 'i').test(await ev(`document.querySelector('#fin .resumen').textContent`)), `el final dice los errores: ${await ev(`document.querySelector('#fin .resumen').textContent`)}`);
await sleep(3000);
await ev(`document.getElementById('fin').scrollIntoView(); 1`); await sleep(300);
await b.shot('03-final');
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ el caso (labs)');
