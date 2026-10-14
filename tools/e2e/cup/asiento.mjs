// Un celular que dejó de estar sentado como su jugador (perdió su sesión anónima, o el admin le
// dio un PIN nuevo), con el día abierto: al tocar Empezar no puede decirle que el día se cerró.
// Le pide el PIN con su nombre ya elegido, y con eso juega. Almacén de prueba (?test), sin red.
//
// Uso: python3 -m http.server 8765 -d public (en otra terminal) y node tools/e2e/cup/asiento.mjs [carpeta]
import { salida } from '../salida.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = salida();
const BASE = `${SITIO}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

const b = await launch({ port: 9517, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)return false;e.click();return true})()`);
const pantalla = () => ev('__copa.estado.pantalla');

try {
  // Javi, sentado en la copa de la demo, con el día 4 abierto
  await b.go(`${BASE}?test&demo=player`, 1500);
  await ev('window.confirm=()=>true; 1');
  const code = await ev('__copa.estado.code');
  // El celular pierde su asiento: el PIN de Javi pasa a ser 4321 y ningún celular queda sentado
  await ev(`(async()=>{const { hashPin } = await import('./engine.js');
    const k='juegos-de-salon:copa:prueba', db=JSON.parse(localStorage.getItem(k));
    db['${code}']._keys.javi02 = await hashPin('${code}', 'javi02', '4321');
    db['${code}']._seats.javi02 = {};
    localStorage.setItem(k, JSON.stringify(db)); return 1})()`);
  // Llega por el aviso del día, como en el celular: directo a "Cómo se juega"
  await b.go(`${BASE}?${code}&test&day=4`, 1500);
  await ev('window.confirm=()=>true; 1');
  ok(await pantalla() === 'jugar', 'el aviso abre el día 4');
  ok(await click('#btn-empezar'), 'Empezar se puede tocar');
  await sleep(600);
  ok(await pantalla() === 'entrar', 'sin asiento, Empezar lleva a entrar de nuevo');
  ok(!/se terminó|ya se term/i.test(await ev('document.body.innerText')), 'no dice que el tiempo del día se terminó');
  ok(/Javi/.test(await ev(`document.getElementById('sentarse-de-nuevo')?.innerText || ''`)), 'explica por qué le piden el PIN, con su nombre');
  ok(await ev(`document.querySelector('.chip-btn.on')?.dataset.pid`) === 'javi02', 'su nombre ya está elegido');
  await b.shot('sentarse-de-nuevo');
  await ev(`document.querySelector('#entrar-body input.pin').value='4321'; 1`);
  ok(await click('#btn-sentarse'), 'entra con su PIN');
  await sleep(600);
  ok(await pantalla() === 'tablero', 'vuelve al tablero');
  ok(await ev('__copa.estado.yo') === 'javi02', 'sentado otra vez como Javi');
  ok(await click('[data-dia="4"]'), 'el día 4 se puede jugar');
  await sleep(300);
  ok(await click('#btn-empezar'), 'toca Empezar de nuevo');
  await sleep(800);
  ok(!!(await ev(`__copa.estado.copa.started?.[4]?.javi02`)), 'esta vez el día empieza');
} finally {
  await b.close();
}
