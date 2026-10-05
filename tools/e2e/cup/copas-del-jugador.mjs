// "Tus copas" sigue al jugador, no al celular (D-220): con el almacén de prueba (`?prueba`),
// un celular entra con su jugador y abre una copa en que está sentado; otro celular, que nunca la
// vio, entra con el mismo jugador y la encuentra en la portada, con su nombre ya elegido.
//
// Uso: python3 -m http.server 8765 -d public (en otra terminal) y node tools/e2e/cup/copas-del-jugador.mjs <carpeta-salida>
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] || '/tmp/copas-del-jugador';
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9393, dir: `${OUT}/perfil`, out: OUT });
const SITIO = process.env.SITIO || 'http://localhost:8765';
const BASE = `${SITIO}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const CODE = 'PQRST';

try {
  await b.go(`${BASE}?prueba`, 1200);
  await ev(`localStorage.clear(); sessionStorage.clear(); 1`);
  await b.go(`${BASE}?prueba`, 1200);

  // Celular 1: el jugador Jiri y una copa en que está sentado como "Jiri"
  await ev(`(async()=>{
    const { jugador } = await import('/assets/js/jugador.js');
    const J = await jugador();
    await J.crear('Jiri', '1234');
    const E = await import('/cup/engine.js');
    const { createLocalStore } = await import('/cup/store-local.js');
    const st = createLocalStore();
    const hoy = E.fechaEn(Date.now());
    const meta = E.nuevaMeta({ nombre: 'Piratotes 1983', dias: 3, inicio: hoy, admin: 'jiri01', creada: Date.now() });
    await st.crear('${CODE}', meta, { pid: 'jiri01', name: 'Jiri', at: Date.now(), pinHash: await E.hashPin('${CODE}', 'jiri01', '4321') });
    sessionStorage.setItem('juegos-de-salon:copa:prueba:sesion:${CODE}', JSON.stringify({ pid: 'jiri01' }));
    return 1;
  })()`);
  await b.go(`${BASE}?${CODE}&prueba`, 1500);
  ok(await ev(`__copa.estado.pantalla`) === 'tablero', 'celular 1: entra a la copa como Jiri');
  await sleep(500);
  const anotada = await ev(`(async()=>{ const { jugador } = await import('/assets/js/jugador.js'); return JSON.stringify(await (await jugador()).copas()); })()`).then(JSON.parse);
  ok(anotada.length === 1 && anotada[0].code === CODE && anotada[0].p === 'jiri01', 'la copa queda en la lista del jugador');

  // Celular 2: otro celular (sin la cuenta de la copa ni el jugador), el mismo almacén de prueba
  await ev(`(()=>{ sessionStorage.clear(); for (const k of ['juegos-de-salon:jugador', 'juegos-de-salon:prueba:records-uid']) localStorage.removeItem(k); return 1 })()`);
  await b.go(`${BASE}?prueba`, 1200);
  ok(await ev(`document.getElementById('tus-copas').hidden`), 'celular 2, sin jugador: "Tus copas" no aparece');
  const entro = await ev(`(async()=>{ const { jugador } = await import('/assets/js/jugador.js'); return (await (await jugador()).entrar('Jiri', '1234')).estado; })()`);
  ok(entro === 'dentro', 'celular 2: entra con el mismo jugador');
  await b.go(`${BASE}?prueba`, 1500);
  await b.quieto();
  const lista = await ev(`(()=>{ const x = document.getElementById('tus-copas'); return x.hidden ? '' : x.innerText })()`);
  ok(/Piratotes 1983/.test(lista) && lista.includes(CODE), `"Tus copas" trae la copa del jugador: ${JSON.stringify(lista)}`);
  await b.shot('portada-tus-copas');

  // Al tocarla, su nombre ya está elegido: falta el PIN de la copa
  await ev(`document.querySelector('#tus-copas a.mia').click(); 1`);
  await sleep(1500);
  ok(await ev(`__copa.estado.pantalla`) === 'entrar', 'la copa pide entrar en este celular');
  ok(await ev(`!!document.querySelector('#tab-inscrito.on') && document.querySelector('.chip-btn.on')?.dataset.pid === 'jiri01'`), 'con "Ya estoy inscrito" y Jiri elegido');
  ok(await ev(`!document.getElementById('btn-sentarse').disabled`), 'el botón de entrar ya está listo');
  await b.shot('entrar-elegido');
  await ev(`(()=>{ const i = document.querySelector('#entrar-body input.pin'); i.value = '4321'; document.getElementById('btn-sentarse').click(); return 1 })()`);
  await sleep(1200);
  ok(await ev(`__copa.estado.pantalla`) === 'tablero', 'con el PIN de la copa queda sentado');
} finally {
  b.close();
}
