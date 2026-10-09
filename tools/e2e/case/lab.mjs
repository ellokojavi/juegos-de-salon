// El caso (prototipo del laboratorio, D-256) de punta a punta: el laboratorio lo ofrece, marcar
// antes de tiempo no se acepta ni cuenta como error, un error se cuenta, el caso se resuelve
// entero sin adivinar y al recargar sigue donde estaba (C-6). Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9392, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };

await b.go(`${SITIO}/labs/`);
ok(await ev(`!!document.querySelector('#btn-caso[href="case/"]')`), 'el laboratorio ofrece El caso');
await b.go(`${SITIO}/labs/case/?c=PRUEBA`);
await ev(`localStorage.clear(); 1`);
await b.go(`${SITIO}/labs/case/?c=PRUEBA`);
ok(await ev(`document.getElementById('caso-nombre').textContent`) === 'Caso PRUEBA', 'con ?c= es ese caso');
ok(await ev(`document.querySelectorAll('.persona').length`) === 20, 'veinte sospechosos');
ok(await ev(`document.querySelectorAll('.pista').length`) === 1, 'se parte con una pista');
await b.shot('01-inicio');

// Alguien que todavía no se puede saber: no se acepta y no es error
const nose = await ev(`(async()=>{const {deducibles}=await import('/labs/case/engine.js');const e=__caso.estado();const d=deducibles(e.pistas,e.x);return [...Array(20).keys()].find(i=>e.x[i]===-1&&!(i in d))})()`);
if (nose !== undefined && nose !== null) {
  await ev(`document.querySelector('.persona[data-i="${nose}"]').click(); 1`); await sleep(150);
  await ev(`document.getElementById('btn-criminal').click(); 1`); await sleep(200);
  ok(/todavía no se puede saber/.test(await ev(`document.querySelector('.accion .msg').textContent`)), 'antes de tiempo: "todavía no se puede saber"');
  ok(await ev(`__caso.partida().errores.length`) === 0, 'y no cuenta como error');
}

// Un error a propósito: el contrario de lo que se deduce
const [i0, v0] = await ev(`(async()=>{const {deducibles}=await import('/labs/case/engine.js');const e=__caso.estado();const d=deducibles(e.pistas,e.x);const k=Object.keys(d)[0];return [Number(k),d[k]]})()`);
await ev(`document.querySelector('.persona[data-i="${i0}"]').click(); 1`); await sleep(150);
await ev(`document.getElementById('${v0 ? 'btn-inocente' : 'btn-criminal'}').click(); 1`); await sleep(200);
ok(await ev(`__caso.partida().errores.length`) === 1, 'marcar mal cuenta un error');
await b.shot('02-error');
await ev(`document.getElementById('${v0 ? 'btn-criminal' : 'btn-inocente'}').click(); 1`); await sleep(200);
ok(await ev(`__caso.partida().marcas.length`) === 1, 'y después se puede marcar bien');

// Recargar a mitad: sigue donde estaba
await b.go(`${SITIO}/labs/case/?c=PRUEBA`);
ok(await ev(`document.querySelectorAll('.persona.marcada').length`) === 2, 'al recargar sigue donde estaba (C-6)');

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
ok(/con 1 error/i.test(await ev(`document.querySelector('#fin .resumen').textContent`)), `el final dice los errores: ${await ev(`document.querySelector('#fin .resumen').textContent`)}`);
await sleep(3000);
await ev(`document.getElementById('fin').scrollIntoView(); 1`); await sleep(300);
await b.shot('03-final');
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ el caso (labs)');
