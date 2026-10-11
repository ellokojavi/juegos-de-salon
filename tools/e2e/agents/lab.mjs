// Agentes del laboratorio (D-286) de punta a punta, en /labs/agents/: el laboratorio lo ofrece en
// Proyectos activos, la portada dice de dónde viene (Codenames, con su link), sin semilla es el
// tablero de hoy; con semilla se juega entero: un agente suma, uno de otra pista suma sin cortar,
// el asesino y los neutrales cortan la pista, completarla pasa a la siguiente, y el final muestra el puntaje que dice el
// motor, el tablero destapado, compartir y el comentario al final. Imprime ✗ si algo falla.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2] || '/tmp/agentes-lab';
const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const esperar = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };
const SEMILLA = 'e2e1';

// El laboratorio lo ofrece en Proyectos activos, con el crédito a Codenames
await b.go(`${SITIO}/labs/`);
ok(await ev(`document.querySelector('#activos #seccion-agentes #btn-agentes')?.getAttribute('href')`) === 'agents/', 'el laboratorio ofrece Agentes en Proyectos activos');
ok(await ev(`/codenames/i.test(document.querySelector('#seccion-agentes a[href*="czechgames"]')?.textContent || '')`), 'y dice que está inspirado en Codenames, con su link');

// Sin semilla: la portada del tablero de hoy, con el crédito
await b.go(`${SITIO}/labs/agents/?test`, 1200);
ok(await esperar(`!!document.getElementById('btn-empezar')`), 'la portada tiene Empezar');
ok(await ev(`document.getElementById('link-codenames')?.href`) === 'https://czechgames.com/en/codenames/' && /Inspirado en Codenames/.test(await ev(`document.querySelector('.credito')?.textContent`)), 'la portada dice "Inspirado en Codenames", con el link a la página oficial');
ok(/mismo para todos/.test(await ev(`document.body.textContent`)), 'sin semilla es el tablero de hoy, el mismo para todos');
ok(await ev(`!!document.getElementById('btn-comentario')`), 'y termina con el link al comentario');
await b.shot('01-portada');

// Con semilla: se juega entero, comparando con el motor
await b.go(`${SITIO}/labs/agents/?seed=${SEMILLA}&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
await ev(`document.getElementById('btn-empezar').click(); 1`);
ok(await esperar(`document.querySelectorAll('#tablero .carta').length === 12`), 'Empezar abre el tablero de 12 cartas');
const t = await ev(`JSON.stringify(window.__agentes.P.t)`).then(JSON.parse);
const de = (p, tipo = 'agente') => t.cartas.map((c, i) => ({ ...c, i })).filter(c => c.tipo === tipo && (p == null || c.p === p)).map(c => c.i);
const tocar = async i => { await ev(`document.querySelector('#tablero .carta[data-i="${i}"]').click(); 1`); await sleep(1100); };
const pista = () => ev(`document.querySelector('#pista .palabra')?.textContent || ''`);
ok((await pista()).startsWith(t.pistas[0].pista), `la primera pista es ${t.pistas[0].pista}`);
await b.shot('02-tablero');

// Pista 1: un agente propio, uno de la pista 3 (suma sin cortar) y luego el asesino (corta)
await tocar(de(0)[0]);
ok(/de los tuyos/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)), 'un agente de la pista suma');
await tocar(de(2)[0]);
ok(/otra pista/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)) && (await pista()).startsWith(t.pistas[0].pista), 'uno de otra pista suma y no corta la pista');
await tocar(de(null, 'asesino')[0]);
ok(/asesino/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)) && (await pista()).startsWith(t.pistas[1].pista), 'el asesino corta la pista');
// Pista 2: sus tres agentes la completan y pasa sola
for (const i of de(1)) await tocar(i);
ok((await pista()).startsWith(t.pistas[2].pista), 'completar la pista pasa a la siguiente');
// Pista 3: uno, el botón dice Terminar, y un neutral corta la última pista: se acaba
await tocar(de(2)[1]);
ok(/Terminar/.test(await ev(`document.getElementById('btn-pasar')?.textContent || ''`)), 'en la última pista el botón dice Terminar');
await tocar(de(null, 'neutral')[0]);
ok(await esperar(`!!document.getElementById('puntaje')`), 'un neutral corta la última pista y lleva al resultado');

// El resultado: lo que dice el motor (6 agentes, 1 neutral, el asesino)
const esp = Math.max(0, Math.round(100 * 6 / 9) - 15 - 40);
ok(await ev(`document.getElementById('puntaje').textContent`) === `${esp}/100`, `el puntaje es el del motor (${esp}/100)`);
ok(await ev(`document.querySelectorAll('#tablero-fin .carta').length`) === 12, 'muestra el tablero entero destapado');
ok(await ev(`!!document.getElementById('btn-compartir-resultado')`), 'se puede compartir el resultado');
const otro = await ev(`document.getElementById('btn-otro')?.getAttribute('href') || ''`);
ok(/seed=/.test(otro) && !otro.includes(SEMILLA), `"Otro tablero" abre uno nuevo (${otro})`);
ok(await ev(`!!document.getElementById('btn-de-hoy')`), 'y como no era el de hoy, ofrece el de hoy');
ok(await ev(`!!document.querySelector('#link-codenames')`), 'el crédito a Codenames también está al final');
ok(await ev(`(()=>{const k=[...document.querySelector('.resultado').children].filter(x=>x.offsetParent!==null);return k.at(-1)?.classList.contains('comentario')})()`), 'el comentario es lo último del resultado (D-268)');
ok(await ev(`document.documentElement.scrollWidth <= innerWidth`), 'sin scroll de lado a 375 px');
await b.shot('03-final');
ok(!b.errors.length, `sin errores en la página ${JSON.stringify(b.errors)}`);
b.close();
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ agentes (labs)');
