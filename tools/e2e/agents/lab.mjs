// Agentes del laboratorio (D-286) de punta a punta, en /labs/agents/: el laboratorio lo ofrece en
// Proyectos activos, la portada dice de dónde viene (Codenames, con su link) y juega sola una pista,
// sin semilla es el tablero de hoy; con semilla se juega entero: un agente suma, uno de otra pista suma sin cortar,
// el asesino y los neutrales cortan la pista (sello Cortada), completarla pasa a la siguiente (sello Completa), y el final muestra el puntaje que dice el
// motor con su sello, el tablero destapado, compartir y el comentario al final. Imprime ✗ si algo falla.
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
ok(await ev(`/clasificado/i.test(document.querySelector('.sello--titulo')?.textContent || '')`), 'el título lleva el sello de Clasificado');
// La portada juega sola: la lupa encuentra a los agentes de la pista y al final se destapa el asesino
ok(await esperar(`document.querySelectorAll('.demo-cartas .dc.agente').length === 3 && !!document.querySelector('.demo-cartas .dc.asesino')`, 9000), 'la portada juega sola una pista: 3 agentes y el asesino');
await b.shot('01-portada');

// Con semilla: se juega entero, comparando con el motor
await b.go(`${SITIO}/labs/agents/?seed=${SEMILLA}&test`, 1200);
await esperar(`!!document.getElementById('btn-empezar')`);
ok(!await ev(`document.getElementById('vista').textContent.includes('null')`), 'con semilla, la portada no escribe "null"');
await ev(`document.getElementById('btn-empezar').click(); 1`);
// Antes del tablero, el 3, 2, 1 de La Copa (D-105)
ok(await esperar(`/3|2|1/.test(document.querySelector('#cuenta .cuenta-num')?.textContent || '')`, 2000), 'Empezar abre la cuenta 3, 2, 1');
ok(await esperar(`document.querySelectorAll('#tablero .carta').length === 15 && !document.getElementById('cuenta')`, 8000), 'y después el tablero de 15 cartas');
const t = await ev(`JSON.stringify(window.__agentes.P.t)`).then(JSON.parse);
const de = (p, tipo = 'agente') => t.cartas.map((c, i) => ({ ...c, i })).filter(c => c.tipo === tipo && (p == null || c.p === p)).map(c => c.i);
const tocar = async i => { await ev(`document.querySelector('#tablero .carta[data-i="${i}"]').click(); 1`); await sleep(250); };
const pista = () => ev(`document.querySelector('#pista .palabra')?.textContent || ''`);
// Una pista nueva entra descifrándose: se espera a que la palabra quede escrita
const llega = n => esperar(`(document.querySelector('#pista .palabra')?.textContent || '').startsWith(${JSON.stringify(t.pistas[n].pista)} + ' ·')`, 4000);
const sello = () => ev(`document.querySelector('#pista .sello--pista')?.textContent || ''`);
ok(await llega(0), `la primera pista es ${t.pistas[0].pista}`);
await b.shot('02-tablero');

// Las marcas: un toque largo marca 📌, otro 🚫 y otro la quita; el toque que sigue al largo no destapa,
// y una 🚫 no se destapa por error
const largo = async i => {
  await ev(`(()=>{const b=document.querySelector('#tablero .carta[data-i="${i}"]');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return 1})()`);
  await sleep(600);
  await ev(`(()=>{const b=document.querySelector('#tablero .carta[data-i="${i}"]');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));b.click();return 1})()`);
  await sleep(100);
};
const clase = i => ev(`document.querySelector('#tablero .carta[data-i="${i}"]').className`);
ok(await ev(`!!document.getElementById('ayuda-marcas') && !document.getElementById('ayuda-marcas').hidden`), 'el tablero dice cómo marcar');
const m = de(null, 'neutral')[1];
await largo(m);
ok(/marca-sospecha/.test(await clase(m)) && !/neutral/.test(await clase(m)), 'un toque largo marca 📌 sin destapar');
ok(await ev(`document.getElementById('ayuda-marcas').hidden`), 'y la ayuda se va');
await largo(m);
ok(/marca-descarte/.test(await clase(m)), 'otro la pasa a 🚫');
await ev(`document.querySelector('#tablero .carta[data-i="${m}"]').click(); 1`); await sleep(150);
ok(!/neutral/.test(await clase(m)) && /descartaste/.test(await ev(`document.querySelector('.aviso-ag').textContent`)), 'una 🚫 no se destapa al tocarla');
await largo(m);
ok(!/marca-/.test(await clase(m)), 'y otro toque largo la deja sin marca');
await largo(m); await largo(m);   // queda 🚫 hasta el final: así ningún toque del guion la destapa

// Pista 1: un agente propio, uno de la pista 3 (suma sin cortar) y luego el asesino (corta)
await tocar(de(0)[0]);
ok(/de los tuyos/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)), 'un agente de la pista suma');
await tocar(de(2)[0]);
ok(/otra pista/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)) && (await pista()).startsWith(t.pistas[0].pista) && !await sello(), 'uno de otra pista suma y no corta la pista');
await tocar(de(null, 'asesino')[0]);
ok(/asesino/i.test(await ev(`document.querySelector('.aviso-ag').textContent`)) && await sello() === 'Cortada', 'el asesino corta la pista: le cae el sello de Cortada');
ok(await llega(1), 'y entra la siguiente');
// Pista 2: sus tres agentes la completan y pasa sola
for (const i of de(1)) await tocar(i);
ok(await sello() === 'Completa', 'completar la pista le pone el sello de Completa');
ok(await llega(2), 'y pasa a la siguiente');
// Pista 3: sus dos que faltan la completan (uno ya se encontró en la pista 1)
await tocar(de(2)[1]); await tocar(de(2)[2]);
ok(await llega(3), 'un agente encontrado antes cuenta para su pista: con los otros dos se completa');
// Pista 4, la última: uno, el botón dice Terminar, y un neutral corta la pista: se acaba
await tocar(de(3)[0]);
ok(/Terminar/.test(await ev(`document.getElementById('btn-pasar')?.textContent || ''`)), 'en la última pista el botón dice Terminar');
await tocar(de(null, 'neutral')[0]);
ok(await esperar(`document.querySelectorAll('#tablero .carta.sin-tocar').length > 0`, 3000), 'al terminar se destapan las cartas que nadie tocó');
ok(await esperar(`!!document.getElementById('puntaje')`), 'un neutral corta la última pista y lleva al resultado');

// El resultado: lo que dice el motor (8 de 12 agentes, 1 neutral, el asesino)
const esp = Math.max(0, Math.round(100 * 8 / 12) - 15 - 40);
ok(await esperar(`document.getElementById('puntaje').textContent === '${esp}/100'`, 4000), `el puntaje sube hasta el del motor (${esp}/100)`);
ok(/descubrió el asesino/i.test(await ev(`document.querySelector('.sello-fin')?.textContent || ''`)), 'con el asesino, el final es el sello rojo "Te descubrió el asesino"');
const trampa = await ev(`document.getElementById('trampa')?.textContent || ''`);
const asesino = t.cartas.find(c => c.tipo === 'asesino');
ok(trampa.includes(asesino.w) && trampa.includes(t.pistas[asesino.tienta].pista) && /Caíste/.test(trampa), `explica la trampa: ${trampa}`);
ok((await ev(`[...document.querySelectorAll('#tablero-fin .carta.asesino .de-pista')].map(x => x.textContent).join()`)).includes(t.pistas[asesino.tienta].pista), 'y bajo el asesino, la pista con que tentaba');
ok(await ev(`document.querySelectorAll('#tablero-fin .carta').length`) === 15, 'muestra el tablero entero destapado');
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
