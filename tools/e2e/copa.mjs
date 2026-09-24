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
const TOMAS = { numero: '02-numero', conexiones: '03-conexiones', reinas: '04-reinas', letras: '05-letras', anio: '06-anio' };

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

/** Cierra el veredicto de Línea (el acierto se cierra solo; el error espera un toque). */
const cerrarVeredicto = async () => { await sleep(150); await ev(`(()=>{const h=document.getElementById('handoff');if(!h.hidden)h.click();return 1})()`); await sleep(380); };

const jugarLinea = async (nivel, { arrastrar = false } = {}) => {
  for (let k = 0; k < 12 && await ev(`!!document.querySelector('.hand .card')`); k++) {
    // Elige la primera carta de la mano y calcula su ranura correcta con los años de la línea
    const plan = await ev(`(()=>{
      const b = document.querySelector('.hand .card');
      const c = window.__jugando.p.mano.find(x => x.id === b.dataset.card);
      const anios = [...document.querySelectorAll('.line .event')].map(e => Number(e.dataset.year));
      let at = anios.filter(y => y < c.year).length;
      if (${nivel} === 0 || (${nivel} === 1 && ${k} % 3 === 2)) at = (at + 1) % (anios.length + 1);
      return JSON.stringify({ id: c.id, at });
    })()`).then(JSON.parse);
    if (arrastrar && k === 0) {
      // El arrastre de verdad, con eventos de puntero (D-85): de la mano a la ranura
      const [x0, y0, x1, y1] = await ev(`(()=>{const c=document.querySelector('.hand .card[data-card="${plan.id}"]').getBoundingClientRect();const s=document.querySelector('.line .slot[data-slot="${plan.at}"]').getBoundingClientRect();return [c.x+c.width/2,c.y+c.height/2,s.x+s.width/2,s.y+s.height/2]})()`);
      // Hacia abajo, como un dedo: un desliz más lateral que vertical es scroll de la mano (D-38)
      await b.arrastre(x0, y0, x0, y1 + 6);
      if (!await ev(`!!document.querySelector('.line .slot.on .ghost')`)) console.log('  diagnóstico arrastre', JSON.stringify([x0, y0, x1, y1]), await ev(`JSON.stringify({h: innerHeight, sy: scrollY, handoff: document.getElementById('handoff').hidden, sel: document.querySelector('.hand .card.sel')?.dataset.card})`));
      ok(await ev(`!!document.querySelector('.line .slot.on .ghost') && !document.getElementById('btn-colocar').disabled`), 'Línea Relámpago: arrastrar la carta a la línea la deja elegida, sin colocarla');
    } else {
      await ev(`document.querySelector('.hand .card[data-card="${plan.id}"]').click(); 1`); await sleep(40);
      await ev(`document.querySelector('.line .slot[data-slot="${plan.at}"]').click(); 1`); await sleep(40);
    }
    await click('#btn-colocar'); await cerrarVeredicto();
  }
};

const teclaTyF = async texto => { for (const k of texto) { await ev(`(()=>{const t=[...document.querySelectorAll('.keypad button[data-d]')].find(x=>x.dataset.d===${JSON.stringify(k)});t&&t.click();return 1})()`); await sleep(25); } await click('.keypad .ok'); await sleep(120); };

const jugarNumero = async nivel => {
  const secreto = await ev('window.__jugando.p.secreto');
  const cifras = secreto.length;
  const malos = ['0123456789'.split('').filter(d => !secreto.includes(d)).slice(0, cifras).join(''), secreto.split('').reverse().join('')];
  for (const intento of [...malos.slice(0, nivel === 2 ? 0 : nivel === 1 ? 1 : 2), secreto]) {
    if (!await ev(`!!document.querySelector('.keypad .ok')`)) break;
    await teclaTyF(intento);
  }
};

const jugarLetras = async nivel => {
  const secreto = await ev('window.__jugando.p.secreto');
  const otras = 'QWERTYUIOPASDFGHJKLÑZXCVBNM'.split('').filter(l => !secreto.includes(l));
  const malos = [otras.slice(0, 5).join(''), secreto.slice(1) + secreto[0]];
  for (const intento of [...malos.slice(0, nivel === 2 ? 0 : nivel === 1 ? 1 : 2), secreto]) {
    if (!await ev(`!!document.querySelector('.keypad .ok')`)) break;
    await teclaTyF(intento);
  }
};

const jugarAnio = async nivel => {
  const hitos = await ev('JSON.stringify(window.__jugando.p.hitos)').then(JSON.parse);
  for (const h of hitos) {
    const y = h.year + (nivel === 2 ? 0 : nivel === 1 ? 3 : 25);
    if (y < 0) await click('#btn-ac');
    await teclaTyF(String(Math.abs(y)));
    if (await ev(`!!document.getElementById('btn-siguiente')`)) { await click('#btn-siguiente'); await sleep(80); }
  }
};

const tocarCasilla = sel => i => click(`${sel}[data-i="${i}"]`);

const jugarReinas = async nivel => {
  const p = await ev('JSON.stringify(window.__jugando.p)').then(JSON.parse);
  const t = tocarCasilla('.rej');
  // Cada error: la reina de la fila 0 y una pegada en diagonal en la fila 1 (un toque pone, otro saca: D-103)
  const pegada = 1 * p.n + (p.sol[0] === 0 ? 1 : p.sol[0] - 1);
  for (let e = 0; e < (nivel === 2 ? 0 : nivel === 1 ? 1 : 2); e++) {
    await t(p.sol[0]); await t(pegada);   // choque
    await t(pegada); await t(p.sol[0]);   // se sacan las dos
  }
  for (let r = 0; r < p.n; r++) await t(r * p.n + p.sol[r]);
  await sleep(150);
};

const jugarTango = async nivel => {
  const p = await ev('JSON.stringify(window.__jugando.p)').then(JSON.parse);
  const t = tocarCasilla('.tan');
  const valor = i => ev(`Number(document.querySelector('.tan[data-i="${i}"]').dataset.v)`);
  const libres = p.sol.map((v, i) => i).filter(i => p.dadas[i] === undefined);
  if (nivel < 2) {
    // Borrar todo (dos toques) y una pista (dos toques), las ayudas de D-103
    await t(libres[0]);
    await click('#btn-borrar'); await sleep(60); await click('#btn-borrar'); await sleep(100);
    await click('#btn-pista'); await sleep(60); await click('#btn-pista'); await sleep(100);
  }
  for (const i of libres) {
    if (await ev(`document.querySelector('.tan[data-i="${i}"]').disabled`)) continue;
    for (let k = 0; k < 3 && await valor(i) !== p.sol[i]; k++) await t(i);
  }
  await sleep(150);
};

/** Zip por niveles: resuelve los dos primeros y espera a que se acabe el reloj (acortado con &zipSeg). */
const jugarZip = async () => {
  const { codigo, dia } = await ev('JSON.stringify(window.__jugando.p)').then(JSON.parse);
  for (let k = 0; k < 2; k++) {
    const sol = await ev(`(async()=>{const m=await import('/copa/juegos/zip.js');return JSON.stringify(m.nivel('${codigo}', ${dia}, ${k}).sol)})()`).then(JSON.parse);
    for (const i of sol) await click(`.zc[data-i="${i}"]`);
    await sleep(700);
  }
  for (let w = 0; w < 40 && !await ev(`!!document.getElementById('btn-fin')`); w++) await sleep(500);
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
  const rondas = { linea: jugarLinea, numero: jugarNumero, reinas: jugarReinas, letras: jugarLetras, anio: jugarAnio };
  for (const r of ['linea', 'numero', 'reinas', 'letras', 'anio']) {
    await click('#btn-ronda'); await sleep(200);
    await ev(`window.__jugandoFinal = window.__jugando; window.__jugando = { p: window.__jugandoFinal.p.${r} }; 1`);
    await rondas[r](nivel);
    await ev('window.__jugando = window.__jugandoFinal; 1');
    await click('#btn-fin'); await sleep(250);
  }
};

const JUGAR = { linea: jugarLinea, numero: jugarNumero, anio: jugarAnio, reinas: jugarReinas, letras: jugarLetras, zip: jugarZip, tango: jugarTango, conexiones: jugarConexiones, final: jugarFinal };

/** La cuenta de 3 a 1 antes de cada juego (D-105): espera a que aparezca "¡A jugar!". */
async function esperarCuenta({ revisar = false } = {}) {
  if (revisar) {
    await sleep(150);
    ok(await ev(`document.querySelector('#cuenta .cuenta-num')?.textContent`) === '3' && await ev(`document.querySelector('#jugar-body').children.length`) === 0,
      'al empezar aparece la cuenta desde 3, con el tablero todavía oculto');
    await b.shot('cuenta');
  }
  for (let i = 0; i < 80 && !(await ev(`!document.getElementById('cuenta') || document.getElementById('cuenta').classList.contains('ya')`)); i++) await sleep(100);
  if (revisar) {
    ok(await ev(`document.getElementById('cuenta')?.textContent.includes('¡A jugar!') && !!document.querySelector('#jugar-body').children.length`), 'después de la cuenta dice ¡A jugar! y aparece el tablero');
    ok(/0:0[01]/.test(await ev(`document.querySelector('#jugar-head .cron')?.textContent || ''`)), 'el reloj parte en cero después de la cuenta');
  }
  await sleep(950);
}

async function jugarDia(d, nivel, { capturar = false, comodin = false } = {}) {
  await click(`[data-dia="${d}"]`); await sleep(300);
  if (comodin) { await click('#btn-comodin'); await sleep(300); }
  if (capturar) await revisarPantalla(`antes-${d}`);
  if (capturar && d === 1) {
    // La sesión de prueba (D-103): otro contenido, no cuenta, y vuelve a Empezar
    await click('#btn-ensayo'); await esperarCuenta({ revisar: true });
    await ev(`(async()=>{const {JUEGOS}=await import('/copa/juegos/index.js');window.__jugando={p:JUEGOS.linea.ensayo(__copa.estado.code, 1)};return 1})()`);
    const real = await ev(`(async()=>{const {JUEGOS}=await import('/copa/juegos/index.js');return JUEGOS.linea.generar(__copa.estado.code, 1).tema})()`);
    ok(await ev('window.__jugando.p.tema') !== real && await ev(`document.querySelectorAll('.hand .card').length`) === 4, 'la sesión de prueba trae otro contenido y es más corta');
    await revisarPantalla('ensayo');
    await jugarLinea(2);
    await click('#btn-fin'); await sleep(300);
    ok(await pantalla() === 'resultado' && !(await ev('__copa.estado.copa.started?.[1]?.[__copa.estado.yo]')), 'la prueba termina sin empezar el día ni guardar nada');
    await b.shot('ensayo-fin');
    await click('#btn-volver-ensayo'); await sleep(300);
  }
  await click('#btn-empezar'); await sleep(400); await esperarCuenta();
  if (!await ev('!!__copa.estado.juego')) {
    console.log('  diagnóstico día', d, await ev(`JSON.stringify({p:__copa.estado.pantalla, err:document.querySelector('.screen.active .form-error')?.textContent, btn:!!document.getElementById('btn-empezar'), texto:document.querySelector('.screen.active').innerText.slice(0,300)})`));
    await b.shot(`fallo-dia${d}`);
  }
  const id = await ev('__copa.estado.juego.id');
  await ev(`(async()=>{const {JUEGOS}=await import('/copa/juegos/index.js');window.__jugando={p:JUEGOS[${JSON.stringify(id)}].generar(__copa.estado.code, ${d})};return 1})()`);
  await JUGAR[id](nivel, { arrastrar: capturar && id === 'linea' });
  if (capturar) { await revisarPantalla(`juego-${id}`); if (TOMAS[id]) await b.shot(TOMAS[id]); }
  await click('#btn-fin'); await sleep(700);
  if (capturar) ok(await ev(`(document.querySelector('#explicacion')?.innerText || '').includes('Total:')`), `resultado del día ${d}: explica cómo se calculó el puntaje`);
  return id;
}

/* ---------- La copa ---------- */

await b.go(`${BASE}?prueba`, 1200);
await ev('localStorage.clear(); sessionStorage.clear(); 1');
await b.go(`${BASE}?prueba`, 1200);
await preparar();
await revisarPantalla('portada');
await click('#btn-crear'); await sleep(300);
await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa de la oficina';i[1].value='Cata';i[2].value='1111';i[3].value='1111';return 1})()`);
await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o[${SIETE ? 1 : 0}].click();o[3].click();return 1})()`); // parte mañana
// El link propio (D-121): se ve cómo queda y si está libre
await ev(`(()=>{const i=document.getElementById('crear-link');i.value='Oficina';i.dispatchEvent(new Event('input'));return 1})()`); await sleep(700);
ok(/juegosdesalon\.cl\/copa\/\?oficina está libre/.test(await ev(`document.getElementById('link-estado').textContent`)), 'el link propio muestra cómo queda y que está libre');
await revisarPantalla('crear');
await click('#btn-crear-go'); await sleep(900);
ok(/\?oficina&prueba$/.test(await ev('location.search')), 'la copa creada queda en ?oficina');
const CODE = await ev('__copa.estado.code');
ok(/^[A-HJ-NP-Z]{5}$/.test(CODE), `copa creada con código ${CODE}`);
// Recién creada, el admin parte en Administrar, con la guía de la primera vez (D-110)
ok(await pantalla() === 'admin' && !!await ev(`document.getElementById('admin-bienvenida')`), 'al crearla, el admin ve Administrar con la guía para invitar');
ok(/Mensajes para los competidores/.test(await ev(`document.getElementById('admin-body').innerText`)), 'los mensajes son para los competidores');
await revisarPantalla('admin-nueva');
await b.shot('admin-nueva');
await click('#msg-invitar'); await sleep(300);
ok((await ev('window.__compartido.length')) === 1, 'desde ahí se comparte la invitación');
console.log('  invitación:', await ev('window.__compartido[0]?.text'));
ok(/\?oficina/.test(await ev('window.__compartido[0]?.url || ""')), 'la invitación comparte el link ?oficina');
// Cerrar la inscripción deja fuera a los nuevos; reabrirla, no
await click('#btn-cerrar-inscripcion'); await sleep(300);
ok(!!await ev(`document.getElementById('btn-reabrir')`), 'el admin cierra la inscripción');
await comoJugador(CODE);
ok(!await ev(`document.getElementById('tab-nuevo')`) && /cerró la inscripción/.test(await ev(`document.getElementById('entrar-body').innerText`)), 'con la inscripción cerrada, un nuevo no puede entrar y se le dice por qué');
await sentarse(CODE, 'Cata', '1111');
await click('#btn-admin'); await sleep(300);
await click('#btn-reabrir'); await sleep(300);
ok(!!await ev(`document.getElementById('btn-cerrar-inscripcion')`), 'el admin reabre la inscripción');
// Mover el inicio: parte mañana; se mueve a hoy y de vuelta a mañana
const inicio0 = await ev('__copa.estado.copa.meta.start');
await click('#btn-inicio-hoy'); await sleep(300);
const inicio1 = await ev('__copa.estado.copa.meta.start');
ok(inicio1 !== inicio0, `el admin mueve el inicio a hoy (${inicio0} → ${inicio1})`);
await click('#btn-inicio-manana'); await sleep(300);
ok(await ev('__copa.estado.copa.meta.start') === inicio0, 'y lo devuelve a mañana');
// Otra fecha, con el calendario (D-115)
await click('#btn-inicio-otra'); await sleep(200);
const otraFecha = await ev(`(()=>{const i=document.querySelector('#admin-inicio input.fecha');const d=new Date(i.min+'T12:00:00');d.setDate(d.getDate()+10);i.value=d.toISOString().slice(0,10);return i.value})()`);
await click('#btn-inicio-otra-ok'); await sleep(300);
ok(await ev('__copa.estado.copa.meta.start') === otraFecha, `el admin elige otra fecha en el calendario (${otraFecha})`);
await click('#btn-inicio-manana'); await sleep(300);
ok(await ev('__copa.estado.copa.meta.start') === inicio0, 'y la devuelve a mañana');
await ev(`window.__compartido=[]; 1`);

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
// Abrir por el link propio lleva a la misma copa
await ev('sessionStorage.clear(); 1');
await b.go(`${BASE}?oficina&prueba`, 1200); await preparar();
ok(await ev('__copa.estado.code') === CODE, 'el link ?oficina abre la copa');
// Inscribirse con un nombre y PIN que ya existen cuenta como entrar (D-120)
await comoJugador(CODE);
ok(/7 días · Parte el .* · 3 jugadores inscritos/.test(await ev(`document.querySelector('#entrar-body .lead').textContent`)) || /3 días · Parte el .* · 3 jugadores inscritos/.test(await ev(`document.querySelector('#entrar-body .lead').textContent`)), 'la invitación dice días, cuándo parte y cuántos se inscribieron');
await click('#tab-nuevo'); await sleep(100);
await ev(`(()=>{const i=[...document.querySelectorAll('#entrar-body input')];i[0].value='javi';i[1].value='2222';i[2].value='2222';return 1})()`);
await click('#btn-inscribir'); await sleep(500);
ok(await pantalla() === 'tablero' && await ev('__copa.estado.copa.players[__copa.estado.yo].name') === 'Javi', 'inscribirse con el nombre y el PIN de alguien ya inscrito lo hace entrar');

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


/* ---------- El laboratorio (D-101): la página, la práctica de cada minijuego y los reportes ---------- */

await b.go('http://localhost:8765/', 1500);
const tarjeta = await ev(`(()=>{const c=[...document.querySelectorAll('.game-card')].find(x=>x.textContent.includes('La Copa'));return JSON.stringify({soon:c.classList.contains('soon'),href:c.getAttribute('href'),rotulo:c.querySelector('.proximamente')?.textContent})})()`).then(JSON.parse);
ok(tarjeta.soon && !tarjeta.href && tarjeta.rotulo === 'Próximamente', 'en el menú La Copa se ve con Próximamente y no se abre');
await b.go('http://localhost:8765/labs/', 1500);
ok(await ev(`document.querySelectorAll('#minis .mini-juego').length`) === 9, 'el laboratorio ofrece los nueve minijuegos (con Zip y Tango)');
await b.shot('10-labs');
// Rendirse en Reinas: dos toques, la solución a la vista y 0 puntos (D-110)
await b.go(`${BASE}?practica=reinas&prueba`, 1200); await preparar();
await click('#btn-empezar'); await sleep(300); await esperarCuenta();
// Con la confirmación negada no pasa nada; aceptada, se rinde
await ev('window.confirm = () => false; 1');
await click('#btn-rendirse'); await sleep(150);
ok(!await ev(`document.getElementById('btn-fin')`), 'Reinas: rendirse pide confirmación y, si no se confirma, se sigue jugando');
await ev('window.confirm = () => true; 1');
await click('#btn-rendirse'); await sleep(300);
ok(await ev(`document.querySelectorAll('.rej.reina').length`) > 0 && !!await ev(`document.getElementById('btn-fin')`), 'Reinas: al rendirse se ve la solución');
await click('#btn-fin'); await sleep(500);
ok(/^0/.test(await ev(`document.querySelector('.score-big')?.textContent || ''`)), 'Reinas: rendirse vale 0 puntos');
for (const id of ['linea', 'numero', 'conexiones', 'reinas', 'letras', 'zip', 'tango', 'anio', 'final']) {
  // Zip con semilla fija: el chequeo del aviso busca un trazo que llegue al final sin cubrir todo
await b.go(`${BASE}?practica=${id}&prueba${id === 'zip' ? '&zipSeg=12&semilla=KQRST' : ''}`, 1200); await preparar();
  ok(await ev(`!!document.getElementById('btn-ensayo')`) , `práctica de ${id}: la antesala ofrece la prueba como en la copa`);
  if (id === 'linea') {
    // La prueba desde el laboratorio: la misma que antes de un día (D-109), y vuelve a la antesala
    await click('#btn-ensayo'); await esperarCuenta();
    await ev(`(async()=>{const {JUEGOS}=await import('/copa/juegos/index.js');window.__jugando={p:JUEGOS.linea.ensayo(__copa.estado.juego.semilla, 1)};return 1})()`);
    await jugarLinea(2); await click('#btn-fin'); await sleep(300);
    ok(!!await ev(`document.getElementById('btn-volver-ensayo')`), 'la prueba del laboratorio termina con la vuelta a la antesala');
    await click('#btn-volver-ensayo'); await sleep(300);
  }
  await click('#btn-empezar'); await sleep(300); await esperarCuenta();
  await ev(`(async()=>{const {JUEGOS}=await import('/copa/juegos/index.js');window.__jugando={p:JUEGOS['${id}'].generar(__copa.estado.juego.semilla, 1)};return 1})()`);
  if (id === 'zip') {
    // Llegar al último número sin cubrir todo: el aviso va bajo la grilla y no la mueve, y la cabeza no tapa el número
    const z = await ev(`(async()=>{const z=await import('/copa/juegos/zip.js');const p=z.nivel(__copa.estado.juego.semilla,1,0);const N=p.n*p.n;
      const ini=+Object.keys(p.numeros).find(k=>p.numeros[k]===1);let f=null,k=0;
      const dfs=t=>{if(f||k++>200000)return;if(z.estado(p,t).faltan){f=t.slice();return}for(let i=0;i<N;i++)if(z.puedeIr(p,t,i)){t.push(i);dfs(t);t.pop()}};dfs([ini]);
      const g=document.querySelector('.zip-grid');const top0=g.getBoundingClientRect().top;
      for(const i of f)g.querySelector('.zc[data-i="'+i+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));
      const h=g.querySelector('.zc.cabeza');const r={quieta:g.getBoundingClientRect().top===top0,aviso:!!document.querySelector('.zip-aviso .aviso.mal'),num:h.innerText.trim()!=='',tapa:getComputedStyle(h,'::after').content!=='none'};
      g.querySelector('.zc[data-i="'+ini+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));return JSON.stringify(r)})()`).then(JSON.parse);
    ok(z.aviso && z.quieta, 'Zip: el aviso de casillas faltantes aparece bajo la grilla sin moverla');
    ok(z.num && !z.tapa, 'Zip: la cabeza del trazo sobre un número deja ver el número');
  }
  if (id === 'reinas') {
    // El toque largo pone una X, con el puntero de verdad (D-103)
    const [x, y] = await ev(`(()=>{const r=document.querySelector('.rej[data-i="0"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
    await sleep(650);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
    await sleep(300);
    ok(await ev(`document.querySelector('.rej[data-i="0"]').classList.contains('marca')`), 'Reinas: el toque largo marca la X y no pone reina');
    await b.toque(x, y); await b.toque(x, y);   // un toque rápido de verdad pone la reina y otro la saca: queda vacía
    ok(await ev(`!document.querySelector('.rej[data-i="0"]').classList.contains('reina')`), 'Reinas: después del toque largo, los toques rápidos no se pierden');
  }
  if (id === 'tango') await b.shot('tango-tablero');
  await JUGAR[id](id === 'tango' ? 1 : 2);
  if (id === 'zip') {
    ok(await ev(`document.querySelector('.zip-grid').classList.contains('solucion') && !!document.getElementById('zip-solucion')`), 'Zip: al acabarse el tiempo se ve la solución del nivel que quedó a medias');
    const cron0 = await ev(`document.querySelector('#jugar-head .cron').textContent`);
    await sleep(2200);
    ok(await ev(`document.querySelector('#jugar-head .cron').textContent`) === cron0 && !await ev(`document.querySelector('.zip-reloj')`), `Zip: al acabarse el tiempo el reloj queda quieto en ${cron0} y la cuenta regresiva desaparece`);
    await b.shot('zip-solucion');
  }
  if (id === 'conexiones') ok(await ev(`document.querySelectorAll('.grupo').length === 4 && !document.querySelector('.grupo').classList.contains('pop')`), 'Conexiones: los grupos ya resueltos no se vuelven a animar');
  await click('#btn-fin'); await sleep(500);
  const r = await ev(`JSON.stringify({p:__copa.estado.pantalla, s:document.querySelector('.score-big')?.textContent})`).then(JSON.parse);
  ok(r.p === 'resultado', `práctica de ${id}: se juega completa (${r.s})`);
  ok((await ev(`document.querySelector('#explicacion')?.innerText || ''`)).length > 40, `práctica de ${id}: explica cómo se calculó el puntaje`);
  if (['reinas', 'zip', 'tango', 'letras'].includes(id)) await b.shot(`practica-${id}`);
  if (id === 'reinas') { await revisarPantalla('practica-resultado'); await b.shot('11-practica'); }
}
// Un reporte desde la práctica
await click('#btn-reporte'); await sleep(300);
await ev(`document.querySelector('.reporte-texto').value='El barco no se veía bien'; document.querySelector('#reporte-nombre').value='Tester'; 1`);
await revisarPantalla('reporte');
await b.shot('12-reporte');
await click('#btn-enviar-reporte'); await sleep(400);
const reportes = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba:reportes')||'[]')`);
ok(reportes.length === 1 && reportes[0].texto === 'El barco no se veía bien' && /"juego":"final"/.test(reportes[0].contexto), 'el reporte se guarda con su contexto');
ok(reportes[0].nombre === 'Tester', 'el reporte lleva el nombre escrito');
await click('#btn-reporte-volver'); await sleep(300);
await click('#btn-reporte'); await sleep(300);
ok(await ev(`document.querySelector('#reporte-nombre').value`) === 'Tester', 'el nombre queda guardado en el dispositivo para el próximo reporte');
await ev(`document.querySelector('.reporte-texto').value='Segundo comentario'; 1`);
await click('#btn-enviar-reporte'); await sleep(400);
ok(await ev(`!!document.getElementById('btn-reporte-volver')`), 'después de enviar se agradece y se puede volver');

/* ---------- Las demos del laboratorio (D-110) ---------- */
await b.go('http://localhost:8765/labs/', 1200);
ok(await ev(`document.querySelectorAll('[data-demo]').length`) === 8, 'el laboratorio ofrece las ocho demos de la copa');
const DEMOS = { nueva: 'admin', invitado: 'entrar', espera: 'tablero', 'sin-jugar': 'admin', jugador: 'tablero', admin: 'admin', final: 'tablero', podio: 'tablero' };
for (const [demo, pant] of Object.entries(DEMOS)) {
  await b.go(`${BASE}?prueba&demo=${demo}`, 1500); await preparar();
  ok(await pantalla() === pant, `demo ${demo}: abre en ${pant}`);
  await revisarPantalla(`demo-${demo}`);
  await b.shot(`demo-${demo}`);
}
await b.go(`${BASE}?prueba&demo=sin-jugar`, 1500); await preparar();
ok(/nadie ha jugado/.test(await ev(`document.getElementById('admin-inicio')?.innerText || ''`)), 'demo sin-jugar: el admin ve que partió sin nadie y puede moverla');
await b.go(`${BASE}?prueba&demo=jugador`, 1500); await preparar();
ok(!!await ev(`document.querySelector('[data-dia="4"]')`), 'demo jugador: el día 4 se puede jugar');
// Eliminar la copa (D-117): dos confirmaciones, la segunda escribiendo el nombre
await b.go(`${BASE}?prueba&demo=admin`, 1500); await preparar();
const codeBorrar = await ev('__copa.estado.code');
await revisarPantalla('admin-eliminar');
await ev(`window.prompt = () => 'otro nombre'; 1`);
await click('#btn-eliminar'); await sleep(300);
ok(/no coincide/.test(await ev(`document.querySelector('#admin-eliminar .form-error').textContent`)) && !!await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba'))['${codeBorrar}']`), 'eliminar: con otro nombre no se borra nada');
await ev(`window.prompt = () => 'copa de la oficina'; 1`);
await click('#btn-eliminar'); await sleep(500);
ok(!!await ev(`document.getElementById('copa-eliminada')`) && !await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:copa:prueba'))['${codeBorrar}']`), 'eliminar: escribiendo el nombre se borra y el admin ve que se eliminó');
await b.shot('copa-eliminada');

// Cada mensaje solo cuando tiene sentido (D-116)
await b.go(`${BASE}?prueba&demo=admin`, 1500); await preparar();
ok(!await ev(`document.getElementById('msg-invitar')`) && !!await ev(`document.getElementById('msg-tabla')`) && !await ev(`document.getElementById('msg-final')`), 'día 4: sin invitación ni resumen final, con la tabla parcial');
await b.go(`${BASE}?prueba&demo=nueva`, 1500); await preparar();
ok(!!await ev(`document.getElementById('lab-falta-gente')`) && !await ev(`document.getElementById('btn-pasar-dia')`), 'con el admin solo no se puede pasar de día (D-118)');
ok(!!await ev(`document.getElementById('msg-invitar')`) && !await ev(`document.getElementById('msg-tabla')`), 'antes de partir: con invitación y sin tabla');
// Copa de prueba: el admin la pasa al día siguiente (D-115)
await b.go(`${BASE}?prueba&demo=admin`, 1500); await preparar();
const inicioLab = await ev('__copa.estado.copa.meta.start');
await click('#btn-pasar-dia'); await sleep(400);
ok(await ev('__copa.estado.copa.meta.start') !== inicioLab && /día 6/i.test(await ev(`document.getElementById('btn-pasar-dia')?.textContent || ''`)), 'copa de prueba: el admin la pasa al día 5 y el botón ofrece el 6');
await revisarPantalla('admin-lab');
await b.shot('admin-lab');

console.log('errores:', JSON.stringify(b.errors), JSON.stringify(b.logs));
ok(!b.errors.length && !b.logs.length, 'consola sin errores');
b.close();
