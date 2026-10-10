// El caso del laboratorio (D-267) de punta a punta, en /labs/case/: el laboratorio lo ofrece y
// /case/ lleva ahí; sin semilla es el caso del día (el link queda limpio); se juega con la pantalla
// de La Copa (D-257), marcar antes de tiempo cuenta como error (D-261), al recargar sigue donde iba,
// se resuelve entero sin adivinar y el final ofrece compartir el mismo caso, otro caso, el de hoy y
// el comentario (D-265), con el envío interceptado. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/caso-lab';
const b = await launch({ port: 9392, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEMILLA = 'KQRST';
const CLAVE = `juegos-de-salon:diario:caso:${SEMILLA}`;
// Lo que se puede deducir ahora, con el motor y las jugadas que guardó la página
const deducibles = () => ev(`(async()=>{const m=await import('/cup/games/case/engine.js');const p=m.generar('${SEMILLA}',1);const j=(JSON.parse(localStorage.getItem('${CLAVE}')||'null')||{}).jugadas||[];const e=m.estado(p,j);return JSON.stringify({d:m.deducibles(e.pistas,e.x),fin:e.fin,errores:e.errores})})()`).then(JSON.parse);
const visible = sel => `(()=>{const x=document.querySelector('${sel}');return !!x&&x.offsetParent!==null})()`;
let enLaCuenta = null;
const empezar = async () => {
  await esperar(`!!document.getElementById('btn-empezar')`);
  await ev(`document.getElementById('btn-empezar').click(); 1`);
  // Durante la cuenta del 3, 2, 1 no está el link al comentario (D-268)
  if (await esperar(`!!document.getElementById('cuenta')`, 3000)) enLaCuenta = await ev(visible('#btn-comentario'));
  return esperar(`document.querySelectorAll('.cs-persona').length === 20 && !document.getElementById('cuenta')`, 12000);
};
const marcar = async (i, v) => {
  await ev(`document.querySelector('.cs-persona[data-i="${i}"]').click(); 1`); await sleep(80);
  await ev(`document.getElementById('${v ? 'btn-criminal' : 'btn-inocente'}').click(); 1`); await sleep(120);
};

// El laboratorio lo ofrece, y /case/ (el link de antes) lleva a /labs/case/
await b.go(`${SITIO}/labs/`);
ok(await ev(`document.getElementById('btn-caso')?.getAttribute('href')`) === 'case/', 'el laboratorio ofrece El caso en /labs/case/');
await b.go(`${SITIO}/case/`, 1500);
ok(await ev(`location.pathname`) === '/labs/case/', `/case/ lleva a /labs/case/ (${await ev('location.pathname')})`);

// Sin semilla: el caso del día, y el link queda limpio
await ev(`localStorage.clear(); 1`);
await b.go(`${SITIO}/labs/case/`, 1500);
ok(await esperar(`!!document.getElementById('diario-intro')`), 'sin semilla, la antesala dice que es el caso de hoy, el mismo para todos');
ok(await ev(`location.search`) === '', 'y el link queda sin semilla');
ok((await ev(`document.getElementById('btn-menu')?.href || ''`)).endsWith('/labs/'), 'el botón de arriba vuelve al laboratorio');
// El link al comentario, al final de la antesala, abre el formulario en una capa (D-268)
ok(await ev(visible('#btn-comentario')) && await ev(`(()=>{const b=document.getElementById('btn-comentario'),y=b.getBoundingClientRect().top+scrollY;return [...document.querySelectorAll('#screen-jugar button, #screen-jugar a')].every(x=>x===b||x.offsetParent===null||x.getBoundingClientRect().top+scrollY<=y)})()`), 'la antesala termina con el link al comentario');
await ev(`document.getElementById('btn-comentario').click(); 1`); await sleep(200);
ok(await ev(`!!document.querySelector('.labs-capa .comentario textarea')`), 'y abre el formulario');
await ev(`document.querySelector('.labs-capa').click(); 1`); await sleep(150);
ok(!await ev(`!!document.querySelector('.labs-capa')`), 'que se cierra tocando fuera');
await b.shot('01-antesala');

// Con semilla: el mismo caso para quien recibe el link
await b.go(`${SITIO}/labs/case/?seed=${SEMILLA}&test`, 1500);
ok(!await ev(`!!document.getElementById('diario-intro')`), 'con semilla no es el de hoy');
ok(await empezar(), 'Empezar abre el caso después de la cuenta');
ok(enLaCuenta === false, 'durante la cuenta no está el link al comentario');
ok(await ev(visible('#btn-comentario')), 'y en el juego vuelve, al final');
await b.shot('02-caso');

// Antes de tiempo: cuenta como error
let { d } = await deducibles();
const nose = await ev(`(async()=>{const m=await import('/cup/games/case/engine.js');const p=m.generar('${SEMILLA}',1);const e=m.estado(p,[]);const d=m.deducibles(e.pistas,e.x);return [...Array(20).keys()].find(i=>e.x[i]===-1&&!(i in d))})()`);
if (nose !== null && nose !== undefined) {
  await marcar(nose, 1);
  ok((await deducibles()).errores === 1, 'marcar antes de tiempo cuenta como error (D-261)');
}
const [i0, v0] = Object.entries(d)[0];
await marcar(i0, v0);
ok(await ev(`document.querySelectorAll('.cs-persona.marcada').length`) === 2, 'marcar bien suma a la persona');

// Recargar: sigue donde iba, sin la cuenta
await b.go(`${SITIO}/labs/case/?seed=${SEMILLA}&test`, 1500);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`); await sleep(600);
ok(await ev(`document.querySelectorAll('.cs-persona.marcada').length`) === 2 && !await ev(`!!document.getElementById('cuenta')`), 'al recargar sigue donde iba, sin la cuenta (D-267)');

// Resolverlo entero, siempre con lo que se puede deducir
for (let g = 0; g < 40; g++) {
  const s = await deducibles();
  if (s.fin || !Object.keys(s.d).length) break;
  for (const [i, v] of Object.entries(s.d)) await marcar(i, v);
}
ok(await esperar(`!!document.getElementById('btn-fin')`), 'el caso se resuelve sin adivinar');
await ev(`document.getElementById('btn-fin').click(); 1`);
ok(await esperar(`!!document.querySelector('.score-big')`), `el resultado: ${await ev(`document.querySelector('.score-big')?.textContent`)}`);

// El final: compartir el mismo caso, otro caso, el de hoy y el comentario
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'se puede compartir el resultado');
const otra = await ev(`document.getElementById('btn-otra')?.getAttribute('href') || ''`);
ok(/seed=[A-Z]{5}/.test(otra) && !otra.includes(SEMILLA) && /Otro caso/.test(await ev(`document.getElementById('btn-otra').textContent`)), `"Otro caso" abre uno nuevo (${otra})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'y como no era el de hoy, ofrece el caso de hoy');
ok(await ev(`!!document.querySelector('.comentario textarea')`), 'al final está el formulario de comentarios (D-265)');
ok(await ev(`(()=>{const k=[...document.getElementById('resultado-body').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario')})()`), 'y es lo último del resultado (D-268)');
await ev(`window.__enviados = []; window.fetch = async (u, o) => { window.__enviados.push({ u: String(u), o }); return { ok: true }; }; document.getElementById('btn-enviar-comentario').click(); 1`); await sleep(200);
ok(/Escribe algo/.test(await ev(`document.querySelector('.comentario .labs-error').textContent`)), 'vacío no se envía');
await ev(`document.querySelector('.comentario textarea').value = 'Me trabé con una pista'; document.getElementById('btn-enviar-comentario').click(); 1`); await sleep(400);
const enviado = await ev(`JSON.stringify(window.__enviados.map(x => ({ u: x.u, b: JSON.parse(x.o.body) })))`).then(JSON.parse);
ok(enviado.length === 1 && enviado[0].u.endsWith('/feedback.json') && /"juego":"caso"/.test(enviado[0].b.contexto) && enviado[0].b.contexto.includes(SEMILLA), `el comentario va a feedback/ con el caso (${enviado[0]?.b.contexto?.slice(0, 80)})`);
ok(/Gracias/.test(await ev(`document.querySelector('.comentario').textContent`)), 'y da las gracias en el mismo lugar');
await b.shot('03-final');
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ el caso (labs)');
