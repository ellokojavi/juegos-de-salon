// La Copa de punta a punta (LIG-27): una Copa de 7 días con tres jugadores en un solo Chrome,
// con el almacén de prueba (`?prueba`) y el reloj adelantado día por día. Cada "celular" es
// la misma pestaña con el sessionStorage limpio: la cuenta de prueba vive ahí.
//
// Uso: python3 -m http.server 8765 (en otra terminal) y node tools/e2e/copa.mjs <carpeta-salida>
// Con --tres juega la Copa de 3 días (la de probar, D-100), que es más corta.
// De acá salen las capturas del README (docs/capturas.json): las tomas con nombre fijo.
import { launch, sleep } from './cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] || '/tmp/copa';
const SIETE = !process.argv.includes('--tres');
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: 9377, dir: `${OUT}/perfil`, out: OUT });
const BASE = 'http://localhost:8765/copa/';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const click = sel => ev(`(()=>{const x=document.querySelector(${JSON.stringify(sel)});if(!x)return 'no';if(x.disabled)return 'disabled';x.click();return 'ok'})()`);
const pantalla = () => ev('__copa.estado.pantalla');
const DIA = 24 * 60 * 60 * 1000;

// En headless no hay diálogo de compartir: se atrapa lo que se habría mandado
// y la barra del modo de prueba no sale en las capturas.
const preparar = () => ev(`(()=>{window.confirm=()=>true;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};
  const st=document.createElement('style');st.textContent='.prueba-barra{display:none!important}';document.head.append(st);return 1})()`);

/** Las tomas del README, con nombre fijo para que docs/capturas.json las encuentre. */
const TOMAS = { numero: '02-numero', conexiones: '03-conexiones', solitario: '04-solitario', dudo: '05-dudo', anio: '06-anio' };

/** C-8: sin scroll horizontal y sin botones bajo 44 px en la pantalla activa. */
async function revisarPantalla(nombre) {
  await b.quieto();
  const r = await ev(`(()=>{
    const ancho = document.documentElement.scrollWidth > innerWidth + 1;
    const chicos = [...document.querySelectorAll('.screen.active button, .screen.active a.btn')]
      .filter(x => { const q = x.getBoundingClientRect(); return q.width && q.height && q.height < 43.5 && !x.closest('.sol-grid'); })
      .map(x => x.textContent.trim().slice(0, 20));
    const culpables = ancho ? [...document.querySelectorAll('body *')].filter(x => x.getBoundingClientRect().right > innerWidth + 1).slice(-3).map(x => x.tagName + '.' + x.className) : [];
    return JSON.stringify({ ancho, chicos, culpables });
  })()`).then(JSON.parse);
  ok(!r.ancho, `${nombre}: sin scroll horizontal ${r.culpables.length ? JSON.stringify(r.culpables) : ''}`);
  ok(!r.chicos.length, `${nombre}: botones de 44 px o más ${r.chicos.length ? JSON.stringify(r.chicos) : ''}`);
  await b.shot(nombre);
}

async function comoJugador(code) {
  await ev('sessionStorage.clear(); 1');
  await b.go(`${BASE}?${code}&prueba`, 1200);
  await preparar();
}

async function inscribir(code, nombre, pin) {
  await comoJugador(code);
  ok(await pantalla() === 'entrar', `${nombre} llega a la invitación`);
  await click('#tab-nuevo'); await sleep(150);
  await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value=${JSON.stringify(nombre)};i[1].value='${pin}';i[2].value='${pin}';return 1})()`);
  if (nombre === 'Javi') await b.shot('00-invitacion');
  await click('#btn-inscribir'); await sleep(500);
  ok(await pantalla() === 'tablero', `${nombre} queda inscrito y ve el tablero`);
}

async function sentarse(code, nombre, pin) {
  await comoJugador(code);
  if (await pantalla() === 'tablero') return;
  await click('#tab-inscrito'); await sleep(150);
  await ev(`[...document.querySelectorAll('.chip-btn')].find(x=>x.textContent===${JSON.stringify(nombre)}).click(); 1`);
  await ev(`document.querySelector('#entrar-body input.pin').value='${pin}'; 1`);
  await click('#btn-sentarse'); await sleep(500);
}

/* ---------- Cómo juega cada uno cada minijuego. `nivel` de 0 (mal) a 2 (perfecto). ---------- */

const jugarLinea = async nivel => {
  for (let i = 0; i < 7 && await ev(`!!document.getElementById('btn-colocar')`); i++) {
    await ev(`(()=>{
      const actual = window.__jugando.p.mano[${i}];
      const anios = [...document.querySelectorAll('.linea .carta')].map(c => Number(c.dataset.year));
      let at = anios.filter(y => y < actual.year).length;
      if (${nivel} === 0 || (${nivel} === 1 && ${i} % 3 === 2)) at = (at + 1) % (anios.length + 1);
      document.querySelector('.hueco[data-at="' + at + '"]').click();
      return 1;
    })()`);
    await sleep(60); await click('#btn-colocar'); await sleep(120);
  }
};

const teclear = async texto => { for (const k of texto) { await ev(`(()=>{const t=[...document.querySelectorAll('.tecla')].find(x=>x.dataset.k===${JSON.stringify(k)});t&&t.click();return 1})()`); await sleep(30); } };

const jugarNumero = async nivel => {
  const secreto = await ev('window.__jugando.p.secreto');
  const cifras = secreto.length;
  const malos = ['0123456789'.split('').filter(d => !secreto.includes(d)).slice(0, cifras).join(''), secreto.split('').reverse().join('')];
  for (const intento of [...malos.slice(0, nivel === 2 ? 0 : nivel === 1 ? 1 : 2), secreto]) {
    if (!await ev(`!!document.getElementById('btn-probar')`)) break;
    await teclear(intento); await click('#btn-probar'); await sleep(120);
  }
};

const jugarAnio = async nivel => {
  const hitos = await ev('JSON.stringify(window.__jugando.p.hitos)').then(JSON.parse);
  for (const h of hitos) {
    const y = h.year + (nivel === 2 ? 0 : nivel === 1 ? 3 : 25);
    if (y < 0) await ev(`document.querySelector('.tecla.ac').click(); 1`);
    await teclear(String(Math.abs(y)));
    await click('#btn-anio'); await sleep(80);
    if (await ev(`!!document.getElementById('btn-siguiente')`)) { await click('#btn-siguiente'); await sleep(80); }
  }
};

const jugarDudo = async nivel => {
  const n = await ev('window.__jugando.p.manos.length');
  for (let i = 0; i < n; i++) {
    const mejor = await ev(`(async()=>{const m=await import('/copa/juegos/dudo.js');return m.creible(window.__jugando.p.manos[${i}])>=0.5?'creo':'dudo'})()`);
    const e = nivel === 2 || (nivel === 1 && i % 2) ? mejor : (mejor === 'creo' ? 'dudo' : 'creo');
    await click(`.opcion[data-e="${e}"]`); await sleep(40); await click('#btn-decidir'); await sleep(80);
    if (await ev(`!!document.getElementById('btn-siguiente')`)) { await click('#btn-siguiente'); await sleep(60); }
  }
};

const jugarSolitario = async nivel => {
  if (nivel === 0) { await click('#btn-rendirse'); await sleep(150); return; }
  const barcos = await ev(`(async()=>{const m=await import('/copa/juegos/solitario.js');const p=window.__jugando.p;const sol=m.solucion(p);return JSON.stringify([...sol.keys()].filter(i=>sol[i]&&!p.pistas.some(q=>q.r*p.n+q.c===i)))})()`).then(JSON.parse);
  // nivel 1: primero se equivoca una vez (una casilla corrida), después lo arregla
  if (nivel === 1) {
    const vacia = await ev(`(()=>{const x=[...document.querySelectorAll('.sc')].find(c=>!c.disabled&&!${JSON.stringify(barcos)}.includes(Number(c.dataset.i)));return x?Number(x.dataset.i):-1})()`);
    for (const i of [...barcos.slice(1), vacia]) { await click(`.sc[data-i="${i}"]`); await click(`.sc[data-i="${i}"]`); }
    await click('#btn-revisar'); await sleep(100);
    await click(`.sc[data-i="${vacia}"]`); // barco → vacío
    await click(`.sc[data-i="${barcos[0]}"]`); await click(`.sc[data-i="${barcos[0]}"]`);
  } else for (const i of barcos) { await click(`.sc[data-i="${i}"]`); await click(`.sc[data-i="${i}"]`); }
  await click('#btn-revisar'); await sleep(150);
};

const jugarConexiones = async nivel => {
  const grupos = await ev('JSON.stringify(window.__jugando.p.grupos.map(g=>g.palabras))').then(JSON.parse);
  const probar = async palabras => {
    await click('#btn-limpiar');
    for (const w of palabras) await ev(`[...document.querySelectorAll('.palabra')].find(x=>x.textContent===${JSON.stringify(w)})?.click(); 1`);
    await click('#btn-confirmar'); await sleep(120);
  };
  if (nivel < 2) await probar([grupos[3][0], grupos[3][1], grupos[3][2], grupos[2][0]]); // "¡A una!"
  if (nivel === 0) { await probar([grupos[2][1], grupos[3][3], grupos[1][0], grupos[0][0]]); }
  for (const g of grupos) if (await ev(`!!document.getElementById('btn-confirmar')`)) await probar(g);
};

const jugarFinal = async nivel => {
  const rondas = { linea: jugarLinea, numero: jugarNumero, solitario: jugarSolitario, dudo: jugarDudo, anio: jugarAnio };
  for (const r of ['linea', 'numero', 'solitario', 'dudo', 'anio']) {
    await click('#btn-ronda'); await sleep(200);
    const p = await ev(`JSON.stringify(window.__jugando.p)`).then(JSON.parse);
    await ev(`window.__jugandoFinal = window.__jugando; window.__jugando = { p: window.__jugandoFinal.p.${r} }; 1`);
    await rondas[r](nivel);
    await ev('window.__jugando = window.__jugandoFinal; 1');
    await click('#btn-fin'); await sleep(200);
    void p;
  }
};

const JUGAR = { linea: jugarLinea, numero: jugarNumero, anio: jugarAnio, dudo: jugarDudo, solitario: jugarSolitario, conexiones: jugarConexiones, final: jugarFinal };

async function jugarDia(d, nivel, { capturar = false, comodin = false } = {}) {
  await click(`[data-dia="${d}"]`); await sleep(300);
  if (comodin) { await click('#btn-comodin'); await sleep(300); }
  if (capturar) await revisarPantalla(`antes-${d}`);
  await click('#btn-empezar'); await sleep(400);
  const id = await ev('__copa.estado.juego.id');
  await ev(`(async()=>{const {JUEGOS}=await import('/copa/juegos/index.js');window.__jugando={p:JUEGOS[${JSON.stringify(id)}].generar(__copa.estado.code, ${d})};return 1})()`);
  await JUGAR[id](nivel);
  if (capturar) { await revisarPantalla(`juego-${id}`); if (TOMAS[id]) await b.shot(TOMAS[id]); }
  await click('#btn-fin'); await sleep(700);
  return id;
}

/* ---------- La copa ---------- */

await b.go(`${BASE}?prueba`, 1200);
await ev('localStorage.clear(); sessionStorage.clear(); 1');
await b.go(`${BASE}?prueba`, 1200);
await preparar();
await revisarPantalla('portada');
await click('#btn-crear'); await sleep(300);
await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input')];i[0].value='Copa de la oficina';i[1].value='Cata';i[2].value='1111';i[3].value='1111';return 1})()`);
await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o[${SIETE ? 1 : 0}].click();o[3].click();return 1})()`); // parte mañana
await revisarPantalla('crear');
await click('#btn-crear-go'); await sleep(900);
const CODE = await ev('__copa.estado.code');
ok(/^[A-HJ-NP-Z]{5}$/.test(CODE), `copa creada con código ${CODE}`);
ok((await ev('window.__compartido.length')) === 1, 'al crearla se ofrece compartir la invitación');
console.log('  invitación:', await ev('window.__compartido[0]?.text'));
await revisarPantalla('espera');

await inscribir(CODE, 'Javi', '2222');
await inscribir(CODE, 'Pancho', '3333');
// Un nombre repetido no entra
await comoJugador(CODE);
await click('#tab-nuevo'); await sleep(100);
await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value='javi ';i[1].value='4444';i[2].value='4444';return 1})()`);
await click('#btn-inscribir'); await sleep(300);
ok(/Ya hay alguien/.test(await ev(`document.querySelector('#entrar-body .form-error').textContent`)), 'un nombre repetido se rechaza');
await revisarPantalla('invitacion');
// PIN equivocado
await click('#tab-inscrito'); await sleep(100);
await ev(`[...document.querySelectorAll('.chip-btn')].find(x=>x.textContent==='Javi').click(); document.querySelector('#entrar-body input.pin').value='9999'; 1`);
await click('#btn-sentarse'); await sleep(300);
ok(/no es el de Javi/.test(await ev(`document.querySelector('#entrar-body .form-error').textContent`)), 'un PIN equivocado se rechaza');

const JUGADORES = [['Cata', '1111'], ['Javi', '2222'], ['Pancho', '3333']];
const dias = SIETE ? 7 : 3;
// Niveles por día para que la tabla se mueva: [Cata, Javi, Pancho]
const NIVELES = [[2, 1, 0], [0, 2, 1], [1, 0, 2], [2, 1, 0], [1, 2, 0], [1, 0, 2], [1, 0, 2]];
await ev(`__copa.store.adelantar(${DIA}); 1`);

for (let d = 1; d <= dias; d++) {
  for (let j = 0; j < JUGADORES.length; j++) {
    const [nombre, pin] = JUGADORES[j];
    // Pancho se atrasa el día 1 y lo juega en su día de gracia
    if (d === 1 && nombre === 'Pancho') continue;
    await sentarse(CODE, nombre, pin);
    if (d === 2 && nombre === 'Pancho') {
      ok(await ev(`!!document.querySelector('.md-fila.gracia [data-dia="1"]')`), 'Pancho ve el día 1 en su día de gracia, habilitado');
      await revisarPantalla('tablero-gracia');
      await jugarDia(1, 1); await click('#btn-volver'); await sleep(300);
    }
    const capturar = j === 0 || (d === 1 && j === 1);
    if (j === 0) await revisarPantalla(`tablero-dia${d}`);
    if (j === 0 && d === 4) await b.shot('01-tablero');
    const id = await jugarDia(d, NIVELES[d - 1][j], { capturar, comodin: d === 2 && nombre === 'Javi' });
    if (capturar) await revisarPantalla(`resultado-${id}`);
    ok(await pantalla() === 'resultado', `${nombre} terminó el día ${d} (${id})`);
    await click('#btn-tarjeta'); await sleep(100);
    if (d === 1 && j === 0) console.log('  tarjeta:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));
    await click('#btn-volver'); await sleep(300);
    // Resultados ocultos: quien jugó primero no ve cuánto sacaron los que todavía no juegan (LIG-13)
  }
  if (d === 1) {
    await sentarse(CODE, 'Cata', '1111');
    ok(await ev(`!!document.querySelector('#btn-admin')`), 'la admin ve el botón de administrar');
    await click('#btn-admin'); await sleep(300);
    await click('#msg-hoy'); await sleep(100);
    console.log('  recordatorio:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));
    ok(/Faltan por jugar hoy: Pancho/.test(await ev('window.__compartido.at(-1)?.text')), 'el recordatorio dice quién falta');
    await click('#msg-tabla'); await sleep(100);
    console.log('  tabla parcial:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));
    await revisarPantalla('admin');
    await b.shot('09-admin');
  }
  await ev(`__copa.store.adelantar(${DIA}); 1`);
}

// Una hora después de la medianoche del último día: la copa terminó
await sentarse(CODE, 'Cata', '1111');
await b.go(`${BASE}?${CODE}&prueba`, 1200); await preparar();
ok(await ev(`!!document.querySelector('.podio')`), 'al terminar se ve el podio');
await sleep(3000); // que termine el confeti
await revisarPantalla('podio');
await b.shot('08-podio');
const tabla = await ev(`[...document.querySelectorAll('#tablero-body .tabla .fila')].map(f=>f.innerText.replace(/\\s+/g,' ')).join(' | ')`);
console.log('  tabla final:', tabla);
ok(await ev(`!!document.querySelector('svg.grafico polyline.mia')`), 'el gráfico dibuja la línea propia');
await ev(`document.querySelector('svg.grafico').scrollIntoView(); 1`);
await b.shot('07-grafico');
await click('#btn-admin'); await sleep(300);
await click('#msg-final'); await sleep(100);
console.log('  resumen final:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));

console.log('errores:', JSON.stringify(b.errors), JSON.stringify(b.logs));
ok(!b.errors.length && !b.logs.length, 'consola sin errores');
b.close();
