// La Copa de punta a punta (LIG-27): una Copa de 7 días con tres jugadores en un solo Chrome,
// con el almacén de prueba (`?prueba`) y el reloj adelantado día por día. Cada "celular" es
// la misma pestaña con el sessionStorage limpio: la cuenta de prueba vive ahí.
//
// Uso: python3 -m http.server 8765 (en otra terminal) y node tools/e2e/cup/torneo.mjs <carpeta-salida>
// Con --tres juega la Copa de 3 días (la de probar, D-100), que es más corta.
// De acá salen las capturas del README (docs/capturas.json): las tomas con nombre fijo.
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';
import { POZO } from '../../../public/cup/engine.js';

const OUT = process.argv[2] || '/tmp/copa';
const SIETE = !process.argv.includes('--tres');
mkdirSync(OUT, { recursive: true });
// PUERTO_CDP: otro puerto de control para no chocar con el Chrome de otra sesión que prueba en paralelo (D-135)
const b = await launch({ port: Number(process.env.PUERTO_CDP) || 9377, dir: `${OUT}/perfil`, out: OUT });
// SITIO permite probar otra copia del repo servida en otro puerto (la ronda de usabilidad, D-132)
const SITIO = process.env.SITIO || 'http://localhost:8765';
const BASE = `${SITIO}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const click = sel => ev(`(()=>{const x=document.querySelector(${JSON.stringify(sel)});if(!x)return 'no';if(x.disabled)return 'disabled';x.click();return 'ok'})()`);
const pantalla = () => ev('__copa.estado.pantalla');
const DIA = 24 * 60 * 60 * 1000;

// En headless no hay diálogo de compartir: se atrapa lo que se habría mandado (como un celular,
// que también comparte archivos) y la barra del modo de prueba no sale en las capturas.
const preparar = () => ev(`(()=>{window.confirm=()=>true;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;
  const st=document.createElement('style');st.textContent='.prueba-barra{display:none!important}';document.head.append(st);return 1})()`);

/** La imagen del último compartido, a la carpeta de salida, para mirarla. */
async function guardarImagen(nombre) {
  const u = await ev(`(async()=>{const f=window.__compartido.at(-1)?.files?.[0];if(!f)return null;const r=new FileReader();return new Promise(ok=>{r.onload=()=>ok(r.result);r.readAsDataURL(f)})})()`);
  if (u) (await import('node:fs')).writeFileSync(`${OUT}/${nombre}.png`, Buffer.from(u.split(',')[1], 'base64'));
}

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

/* ---------- Cómo juega cada uno cada juego. `nivel` de 0 (mal) a 2 (perfecto). ---------- */

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

/** Gira el globo de ¿Dónde queda? hasta tener el lugar de frente y dice dónde queda en la pantalla. */
const puntoDelMapa = async (lat, lon) => {
  await ev(`document.querySelector('.mapa-globo').globo.girarA(${lat}, ${lon}); 1`);
  return ev(`JSON.stringify(document.querySelector('.mapa-globo').globo.aPantalla(${lat}, ${lon}))`).then(JSON.parse);
};

const jugarDonde = async nivel => {
  const ciudades = await ev('JSON.stringify(window.__jugando.p.ciudades)').then(JSON.parse);
  for (const c of ciudades) {
    // nivel 2: justo en la ciudad; 1: unos 3° al lado; 0: al otro lado del mundo
    const lat = nivel === 2 ? c.lat : nivel === 1 ? c.lat + 3 : -c.lat;
    const lon = nivel === 0 ? (c.lon > 0 ? c.lon - 170 : c.lon + 170) : c.lon;
    await b.toque(...await puntoDelMapa(lat, lon));
    await sleep(450); // más que un doble toque: el siguiente toque no acerca
    await click('#btn-confirmar'); await sleep(150);
    if (await ev(`!!document.getElementById('btn-siguiente')`)) { await click('#btn-siguiente'); await sleep(120); }
    // La pista de girar es solo de la primera ciudad (#88)
    if (await ev(`!!document.querySelector('.mapa-globo') && !document.getElementById('btn-fin')`)) ok(!await ev(`document.getElementById('globo-pista')`), '¿Dónde queda?: la pista no vuelve en las ciudades siguientes');
  }
};

const tocarCasilla = sel => i => click(`${sel}[data-i="${i}"]`);

const jugarReinas = async nivel => {
  const p = await ev('JSON.stringify(window.__jugando.p)').then(JSON.parse);
  const t = tocarCasilla('.rej');
  // Cada error: la reina de la fila 0 y una pegada en diagonal en la fila 1 (un toque pone la reina,
  // otro la cambia por X y otro la deja vacía: D-167)
  const pegada = 1 * p.n + (p.sol[0] === 0 ? 1 : p.sol[0] - 1);
  for (let e = 0; e < (nivel === 2 ? 0 : nivel === 1 ? 1 : 2); e++) {
    await t(p.sol[0]); await t(pegada);   // choque
    await t(pegada); await t(pegada); await t(p.sol[0]); await t(p.sol[0]);   // se sacan las dos
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
    // El sol de paso a la luna no acusa nada: el choque se marca recién al tocar otra casilla,
    // igual que lo cuenta el puntaje, y nunca por tiempo (#135)
    // Una casilla donde el sol choca, con un sol puesto antes si hace falta (el tablero es al azar)
    const [previo, paso] = await ev(`(async()=>{const m=await import('/cup/games/tango/engine.js');const p=window.__jugando.p;
      const L=[${libres}], choca=(pre,i)=>p.sol[i]===m.LUNA&&m.estado(p,[...pre,i]).mal.size>m.estado(p,pre).mal.size;
      for (const i of L) if (choca([],i)) return [-1,i];
      for (const a of L) if (!m.estado(p,[a]).mal.size) for (const i of L) if (i!==a&&choca([a],i)) return [a,i];
      return [-1,-1]})()`);
    ok(paso >= 0, 'Tango: hay una casilla donde probar el sol de paso');
    if (paso >= 0) {
      const choques = () => ev(`document.querySelectorAll('.tan.choque').length`);
      const cuenta = () => ev(`document.querySelector('.tango-juego p.muted')?.textContent || ''`);
      if (previo >= 0) await t(previo);
      await t(paso);
      ok(await choques() === 0, 'Tango: el sol que choca no se marca en el acto');
      await sleep(900);
      ok(await choques() === 0 && !/[1-9]/.test(await cuenta()), 'Tango: el sol que choca no se marca ni se cuenta con el tiempo (#135)');
      await t(paso); await sleep(300);
      ok(await valor(paso) === p.sol[paso] && await choques() === 0, 'Tango: sol y luna seguidos no dejan choque ni aviso');
      await t(paso); await t(paso);
      const otra = libres.find(i => i !== paso && i !== previo);
      await t(otra);
      ok(await choques() > 0 && /1/.test(await cuenta()), 'Tango: el sol que se deja se marca y se cuenta al tocar otra casilla');
    }
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
    const sol = await ev(`(async()=>{const m=await import('/cup/games/zip/engine.js');return JSON.stringify(m.nivel('${codigo}', ${dia}, ${k}).sol)})()`).then(JSON.parse);
    for (const i of sol) await click(`.zc[data-i="${i}"]`);
    await sleep(700);
  }
  for (let w = 0; w < 40 && !await ev(`!!document.getElementById('btn-fin')`); w++) await sleep(500);
};

/**
 * Desenredo (D-179): cada nudo se lleva a donde está en la solución con el mouse de verdad (CDP),
 * y en dos niveles se arrastran todos. Después se espera que el reloj corto se acabe.
 */
const jugarDesenredo = async () => {
  const { codigo, dia } = await ev('JSON.stringify(window.__jugando.p)').then(JSON.parse);
  for (let k = 0; k < 2; k++) {
    const sol = await ev(`(async()=>{const m=await import('/cup/games/untangle/engine.js');return JSON.stringify(m.nivel('${codigo}', ${dia}, ${k}).sol)})()`).then(JSON.parse);
    for (let v = 0; v < sol.length; v++) {
      const [x0, y0, x1, y1] = await ev(`(()=>{const t=document.querySelector('.des-tablero'),r=t.getBoundingClientRect(),s=r.width/1000,c=t.querySelector('circle[data-v="${v}"]');
        return JSON.stringify([r.left+c.cx.baseVal.value*s, r.top+c.cy.baseVal.value*s, r.left+${sol[v][0]}*s, r.top+${sol[v][1]}*s])})()`).then(JSON.parse);
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
      for (let i = 1; i <= 4; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (x1 - x0) * i / 4, y: y0 + (y1 - y0) * i / 4, button: 'left', buttons: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', clickCount: 1, buttons: 0 });
    }
    await sleep(900);
  }
  for (let w = 0; w < 60 && !await ev(`!!document.getElementById('btn-fin')`); w++) await sleep(500);
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
    if (r === 'anio' && await ev('!!__copa.estado.copa && !__copa.estado.juego?.practica')) {
      await sleep(300);
      ok(await ev(`(()=>{const d=__copa.estado.juego.d, x=__copa.estado.copa.results?.[d]?.[__copa.estado.yo];return !!x && __copa.estado.pantalla === 'jugar'})()`), 'la final: al terminar la última ronda el resultado ya está en la copa (D-150)');
    }
    await click('#btn-fin'); await sleep(250);
  }
};

const JUGAR = { donde: jugarDonde, linea: jugarLinea, numero: jugarNumero, anio: jugarAnio, reinas: jugarReinas, letras: jugarLetras, zip: jugarZip, desenredo: jugarDesenredo, tango: jugarTango, conexiones: jugarConexiones, final: jugarFinal };

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
    ok(/más corta/.test(await ev(`document.getElementById('nota-ensayo')?.textContent || ''`)), 'la antesala avisa que la prueba es más corta y no cuenta');
    await click('#btn-ensayo'); await esperarCuenta({ revisar: true });
    ok(!!await ev(`document.querySelector('#reglas #nota-ensayo')`), 'las reglas plegadas de la prueba repiten el aviso');
    await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__jugando={p:JUEGOS.linea.ensayo(__copa.estado.code, 1)};return 1})()`);
    const real = await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');return JUEGOS.linea.generar(__copa.estado.code, 1).tema})()`);
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
  await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__jugando={p:JUEGOS[${JSON.stringify(id)}].generar(__copa.estado.code, ${d})};return 1})()`);
  await JUGAR[id](nivel, { arrastrar: capturar && id === 'linea' });
  if (capturar) { await revisarPantalla(`juego-${id}`); if (TOMAS[id]) await b.shot(TOMAS[id]); }
  // El resultado sale apenas termina el tablero, antes de tocar "Ver resultado" (D-150)
  if (id !== 'final') {
    await sleep(300);
    ok(await ev(`!!__copa.estado.copa.results?.[${d}]?.[__copa.estado.yo] && __copa.estado.pantalla === 'jugar'`), `día ${d} (${id}): el resultado queda en la copa antes de tocar "Ver resultado"`);
  }
  await click('#btn-fin'); await sleep(700);
  if (id === 'final') ok(await ev(`(()=>{const x=[...document.querySelectorAll('#resultado-body .md-x2')];return x.length>0 && x.every(c=>c.classList.contains('chip--final') && !c.classList.contains('chip--gold'))})()`), 'la final: en los resultados todos llevan el ×2 de la final, en cian y no en el dorado del comodín (D-151)');
  if (capturar) ok(await ev(`(document.querySelector('#explicacion')?.innerText || '').includes('Total:')`), `resultado del día ${d}: explica cómo se calculó el puntaje`);
  return id;
}

/* ---------- La copa ---------- */

await b.go(`${BASE}?prueba`, 1200);
await ev('localStorage.clear(); sessionStorage.clear(); 1');
await b.go(`${BASE}?prueba`, 1200);
await preparar();
await revisarPantalla('portada');
await click('#btn-crear'); await sleep(900); // con varias sesiones probando a la vez, la máquina anda lenta
await ev(`(()=>{const i=[...document.querySelectorAll('#crear-body input:not(.fecha):not(#crear-link)')];i[0].value='Copa de la oficina';i[1].value='Cata';i[2].value='1111';i[3].value='1111';return 1})()`);
ok(await ev(`document.getElementById('crear-juegos').hidden`), 'los juegos se eligen después de la duración: antes no se ven');
await ev(`(()=>{const o=[...document.querySelectorAll('#crear-body .opcion')];o[${SIETE ? 1 : 0}].click();o[3].click();return 1})()`); // parte mañana
// Elegir los juegos (D-163): una propuesta al azar en la mano y la línea de Línea de Tiempo
{
  const n = SIETE ? 7 : 3;
  const cal = () => ev(`[...document.querySelectorAll('#cal-elegir .event[data-dia]')].map(b=>b.dataset.juego)`);
  const fuera = () => ev(`[...document.querySelectorAll('#cal-fuera .card')].map(b=>b.dataset.juego)`);
  const tocarDia = i => ev(`(document.querySelectorAll('#cal-elegir .event[data-dia]')[${i}].click(), 1)`);
  const tocarFuera = id => ev(`(document.querySelector('#cal-fuera [data-juego="${id}"]').click(), 1)`);
  const tocarRanura = k => ev(`(document.querySelector('#cal-elegir .slot[data-slot="${k}"]').click(), 1)`);
  const centro = sel => ev(`(()=>{const r=document.querySelector('${sel}').getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2),Math.round(r.y)]})()`);
  // Lleva la semana a `meta` tocando: un día se mueve a una ranura, uno de fuera reemplaza a un día
  const armar = async (meta, revisar) => {
    for (let i = 0; i < meta.length; i++) {
      const ahora = await cal();
      if (ahora[i] === meta[i]) continue;
      const j = ahora.indexOf(meta[i]);
      if (j >= 0) { await tocarDia(j); await tocarRanura(i); } else { await tocarFuera(meta[i]); await tocarDia(i); }
      const despues = await cal();
      if (revisar) ok(despues[i] === meta[i] && (j < 0 ? (await fuera()).includes(ahora[i]) : despues[i + 1] === ahora[i]),
        j >= 0 ? `tocando: un día se mueve a otro lugar de la semana (${meta[i]} al día ${i + 1})` : `tocando: un juego de fuera reemplaza a un día (${ahora[i]} → ${meta[i]})`);
    }
  };
  const propuesta = await cal();
  ok(!await ev(`document.getElementById('crear-juegos').hidden`) && propuesta.length === n - 1 && new Set(propuesta).size === n - 1
    && /La Gran Final/.test(await ev(`document.querySelector('#cal-elegir .event.fija').textContent`)), `al elegir la duración aparece una propuesta al azar de ${n - 1} juegos, con la final al último (${propuesta.join(', ')})`);
  // Del pozo de verdad: un juego nuevo no rompe la cuenta (C-16)
  ok((await fuera()).length === POZO.length - (n - 1), 'los que no entraron quedan fuera, en la mano');
  const altoAyuda = () => ev(`Math.round(document.querySelector('#crear-juegos .cal-estado').getBoundingClientRect().height)`);
  const alto0 = await altoAyuda();
  await tocarDia(0);
  ok(await altoAyuda() === alto0, `la ayuda que cambia al elegir no cambia de alto (${alto0} px): lo de abajo no se corre bajo el dedo`);
  ok(await ev(`document.querySelectorAll('#cal-elegir .event.sel').length`) === 1 && await ev(`document.querySelectorAll('#cal-elegir .slot').length`) === n - 2,
    'tocar un día lo deja elegido y abre las ranuras donde se puede mover');
  await ev(`(document.querySelector('#crear-body .panel').click(), 1)`);
  ok(await ev(`document.querySelectorAll('#cal-elegir .event.sel, #cal-elegir .slot').length`) === 0 && JSON.stringify(await cal()) === JSON.stringify(propuesta), 'un toque fuera de la lista lo suelta sin cambiar nada (C-8)');
  await ev(`(document.getElementById('crear-juegos').scrollIntoView({block:'start'}), scrollBy(0,-12), 1)`); await sleep(150);
  await b.shot('10-semana');
  await ev(`(document.getElementById('cal-elegir').scrollIntoView({block:'center'}), 1)`); await sleep(100);
  // Arrastrar (D-85): el último día hasta el primer lugar, con el puntero del mouse
  {
    const antes = await cal();
    const [x0, y0] = await centro(`#cal-elegir .event[data-dia="${n - 2}"]`);
    const [, , top0] = await centro('#cal-elegir .event[data-dia="0"]');
    await b.arrastre(x0, y0, x0, top0 + 4, 8);
    const despues = await cal();
    ok(despues[0] === antes[n - 2] && JSON.stringify(despues.slice(1)) === JSON.stringify(antes.slice(0, -1)), `arrastrar un día lo mueve a otro lugar de la semana (${antes[n - 2]} al día 1)`);
  }
  const dedo = (type, p) => b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p[0], y: p[1], id: 1 }] });
  const conDedo = async (desde, hasta, enElAire = null) => {
    await dedo('touchStart', desde); await dedo('touchMove', [desde[0], desde[1] + (hasta[1] < desde[1] ? -20 : 20)]); await sleep(16);
    for (let k = 1; k <= 10; k++) { await dedo('touchMove', [desde[0], Math.round(desde[1] + (hasta[1] - desde[1]) * k / 10)]); await sleep(16); }
    if (enElAire) { await sleep(120); await enElAire(); }
    await dedo('touchEnd', hasta); await sleep(250);
  };
  // En un celular, un día se arrastra desde su agarre ⠿ (el resto de la fila deja desplazar la página)
  {
    const antes = await cal();
    const desde = await centro('#cal-elegir .event[data-dia="0"] .agarre');
    const [, , topUlt] = await centro('#cal-elegir .fija');
    await conDedo(desde, [desde[0], topUlt - 6]);
    const despues = await cal();
    ok(despues[n - 2] === antes[0] && JSON.stringify(despues.slice(0, -1)) === JSON.stringify(antes.slice(1)), `con el dedo, un día se arrastra desde su agarre (${antes[0]} al día ${n - 1})`);
  }
  // Y con el dedo: un juego de la mano hasta el día 1, que queda fuera
  {
    const antes = await cal(), id = (await fuera())[0];
    await ev(`(document.getElementById('cal-fuera').scrollIntoView({block:'center'}), 1)`); await sleep(100);
    const desde = await centro(`#cal-fuera [data-juego="${id}"]`), hasta = await centro('#cal-elegir .event[data-dia="0"]');
    await conDedo(desde, hasta, async () => {
      const aire = JSON.parse(await ev(`JSON.stringify({ayuda: [...document.querySelectorAll('.cal-estado [data-ayuda]:not(.oculta)')].map(x=>x.textContent).join(), izq: document.querySelector('.vilo-carta').getBoundingClientRect().left, der: document.querySelector('.vilo-carta').getBoundingClientRect().right, w: innerWidth})`));
      ok(/^Suéltalo sobre el día/.test(aire.ayuda), `con el juego en el aire, la ayuda dice que se suelta, no que se toca («${aire.ayuda}»)`);
      ok(aire.izq >= 0 && aire.der <= aire.w, `la carta en vilo no se sale de la pantalla aunque el dedo esté en la orilla (${Math.round(aire.izq)}–${Math.round(aire.der)} de ${aire.w})`);
    });
    const despues = await cal();
    ok(despues[0] === id && (await fuera()).includes(antes[0]), `arrastrar un juego de fuera sobre un día lo reemplaza (${antes[0]} → ${id})`);
  }
  // Se arma el calendario de siempre, así el resto del guion sabe qué toca cada día. Primero uno
  // al revés, para pasar seguro por los dos caminos de toques
  const meta = SIETE ? ['linea', 'numero', 'conexiones', 'reinas', 'letras', 'anio'] : ['linea', 'conexiones'];
  await armar(SIETE ? ['zip', 'anio', 'letras', 'reinas', 'conexiones', 'numero'] : ['tango', 'conexiones'], true);
  await armar(meta, true);
  await click('#btn-azar'); await sleep(100);
  const otra = await cal();
  ok(otra.length === n - 1 && new Set(otra).size === n - 1, `🎲 propone otro orden (${otra.join(', ')})`);
  await armar(meta, false);
  ok(JSON.stringify(await cal()) === JSON.stringify(meta), `el calendario queda como se armó (${meta.join(', ')})`);
}
// El link propio (D-121): se ve cómo queda y si está libre
await ev(`(()=>{const i=document.getElementById('crear-link');i.value='Oficina';i.dispatchEvent(new Event('input'));return 1})()`); await sleep(700);
ok(/juegosdesalon\.cl\/cup\/\?oficina está libre/.test(await ev(`document.getElementById('link-estado').textContent`)), 'el link propio muestra cómo queda y que está libre');
// El público (D-187): tres opciones; en español parte en Chile, y se puede cambiar y volver
{
  const alcance = () => ev(`document.querySelector('#crear-alcance .opcion.on')?.textContent || ''`);
  ok(await ev(`document.querySelectorAll('#crear-alcance .opcion').length`) === 3, 'crear: el público tiene tres opciones (global, Chile y Brasil)');
  ok(/Chile/.test(await alcance()), 'crear: en español, la copa parte para Chile');
  await ev(`[...document.querySelectorAll('#crear-alcance .opcion')][0].click(); 1`);
  ok(/Global/.test(await alcance()), 'crear: se puede elegir una copa global');
  await ev(`(document.getElementById('crear-alcance').scrollIntoView({block:'center'}), 1)`); await sleep(150);
  await b.shot('crear-publico');
  await ev(`[...document.querySelectorAll('#crear-alcance .opcion')][1].click(); 1`);
}
await revisarPantalla('crear');
await click('#btn-crear-go'); await sleep(900);
ok(/\?oficina&prueba$/.test(await ev('location.search')), 'la copa creada queda en ?oficina');
const CODE = await ev('__copa.estado.code');
ok(/^[A-HJ-NP-Z]{5}$/.test(CODE), `copa creada con código ${CODE}`);
ok(await ev('__copa.estado.copa.meta.aud') === 'cl', 'la copa guarda su público (Chile)');
ok(await ev('__copa.estado.copa.meta.cal') === (SIETE ? 'linea,numero,conexiones,reinas,letras,anio,final' : 'linea,conexiones,final'), 'la copa guarda los juegos en el orden elegido');
// Recién creada, el admin parte en Administrar, con la guía de la primera vez (D-110)
ok(await pantalla() === 'admin' && !!await ev(`document.getElementById('admin-bienvenida')`), 'al crearla, el admin ve Administrar con la guía para invitar');
ok(/Mensajes para los jugadores/.test(await ev(`document.getElementById('admin-body').innerText`)), 'los mensajes son para los jugadores');
await revisarPantalla('admin-nueva');
await b.shot('admin-nueva');
await click('#msg-invitar'); await sleep(300);
ok((await ev('window.__compartido.length')) === 1, 'desde ahí se comparte la invitación');
console.log('  invitación:', await ev('window.__compartido[0]?.text'));
{
  const inv = await ev('window.__compartido[0]?.text || ""');
  ok(/¡Estás invitado!/.test(inv) && /👥 Ya se inscribió Cata\./.test(inv) && !/Línea Relámpago|Conexiones|Reinas/.test(inv), 'la invitación es promocional, dice quién ya está y no revela los juegos (D-127)');
}
ok(/\n\n🔗 https?:\/\/\S+\?oficina/.test(await ev('window.__compartido[0]?.text || ""')), 'la invitación termina con el link ?oficina en su propia línea');
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
await ev('sessionStorage.clear(); 1');
await b.go(`${BASE}?${CODE}&prueba`, 1200); await preparar();
ok(/\?oficina&prueba$/.test(await ev('location.search')), 'entrando por el código, la barra muestra el link propio');
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
    await click('#btn-tarjeta'); await sleep(800);
    if (d === 1 && j === 0) {
      console.log('  tarjeta:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));
      // El juego, quién y el puntaje van en la imagen: el texto es la cabecera y el link (D-171)
      ok(/^🏆 \*La Copa: .+\* · Día 1 de 7\n\n🔗 \S+$/.test(await ev('window.__compartido.at(-1)?.text')), 'el texto del resultado no repite lo que dice la imagen');
      // Con su imagen y la cabecera de la copa, la misma del texto (D-165)
      ok(/^🏆 \*La Copa: .+\* · Día 1 de 7\n\n/.test(await ev('window.__compartido.at(-1)?.text')), 'el resultado abre con la cabecera de la copa y el día de cuántos');
      const f = await ev(`(()=>{const f=window.__compartido.at(-1)?.files?.[0];return f?{name:f.name,type:f.type,size:f.size}:null})()`);
      ok(f && f.type === 'image/png' && f.size > 20000 && f.name === 'copa-oficina-dia-1-cata.png', `el resultado se comparte con su imagen (${f?.name})`);
      await guardarImagen('resultado-imagen');
    }
    await click('#btn-volver'); await sleep(300);
    // Resultados ocultos: quien jugó primero no ve cuánto sacaron los que todavía no juegan (LIG-13)
  }
  if (d === 1) {
    await sentarse(CODE, 'Cata', '1111');
    ok(await ev(`!!document.querySelector('#btn-admin')`), 'la admin ve el botón de administrar');
    await click('#btn-admin'); await sleep(300);
    await click('#msg-hoy'); await sleep(100);
    console.log('  recordatorio:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));
    ok(/Falta por jugar hoy: Pancho\./.test(await ev('window.__compartido.at(-1)?.text')), 'el recordatorio dice quién falta');
    ok(/\n\n⏳ Hoy toca Línea Relámpago\.\n/.test(await ev('window.__compartido.at(-1)?.text')), 'el recordatorio abre la línea con el emoji del juego, no a mitad de frase (dilema #114)');
    await click('#msg-tabla'); await sleep(1200);
    console.log('  tabla parcial:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));
    // La tabla del admin es la misma del tablero: imagen y texto, con la misma cabecera (D-165)
    ok(/^📊 \*La Copa: .+\* · Tabla de posiciones( \(provisoria\))? · día 1 de 7\n\n/.test(await ev('window.__compartido.at(-1)?.text || ""')) && await ev('window.__compartido.at(-1)?.files?.[0]?.type') === 'image/png', 'la tabla parcial del admin va con su imagen y la cabecera de la tabla');
    // La tabla no se escribe: la dice la imagen (D-171)
    ok(!/ pts$/m.test(await ev('window.__compartido.at(-1)?.text || ""')), 'el texto de la tabla parcial no repite la tabla');
    await guardarImagen('tabla-parcial-imagen');
    await revisarPantalla('admin');
    await b.shot('09-admin');
    // En el tablero, el gráfico también marca a Pancho con "(-1J)" y lo explica (D-126)
    await sentarse(CODE, 'Cata', '1111');
    ok(/Pancho \(-1J\)/.test(await ev(`document.querySelector('.grafico-chips')?.textContent || ''`)) && !!await ev(`document.getElementById('nota-juegos')`), 'el gráfico marca (-1J) a quien lleva menos juegos, con su leyenda');
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
ok(await ev(`!!document.querySelector('svg.grafico .g-jugador.mia polyline')`), 'el gráfico dibuja la línea propia');
ok(await ev(`new Set([...document.querySelectorAll('svg.grafico .g-jugador')].map(g=>g.style.getPropertyValue('--c'))).size`) === 3, 'el gráfico muestra a los tres jugadores, cada uno con su color (D-125)');
await ev(`document.querySelectorAll('.g-chip')[1].click(); 1`); await sleep(200);
ok(await ev(`document.querySelector('svg.grafico').classList.contains('con-destacado') && document.querySelectorAll('svg.grafico .g-jugador.destacado').length === 1`), 'tocar un nombre destaca su línea');
await b.shot('grafico-colores');
// La tabla parcial como imagen (D-126): se comparte como archivo PNG
await ev(`navigator.canShare = () => true; 1`);
await click('#btn-imagen'); await sleep(1500);
const img = await ev(`(async()=>{const d=window.__compartido.at(-1);const f=d?.files?.[0];if(!f)return null;const r=new FileReader();const u=await new Promise(ok=>{r.onload=()=>ok(r.result);r.readAsDataURL(f)});return {name:f.name,type:f.type,size:f.size,u}})()`);
ok(img && img.type === 'image/png' && img.size > 20000 && img.name === 'copa-oficina-tabla-final.png', `la tabla se comparte como imagen (${img?.name})`);
ok(/^🏁 \*La Copa: .+\* · Tabla final\n\n/.test(await ev('window.__compartido.at(-1)?.text || ""')), 'terminada, la imagen de la tabla va con el resumen final');
if (img) (await import('node:fs')).writeFileSync(`${OUT}/tabla-imagen.png`, Buffer.from(img.u.split(',')[1], 'base64'));
await ev(`document.querySelectorAll('.g-chip')[1].click(); 1`);
await ev(`document.querySelector('svg.grafico').scrollIntoView(); 1`);
await b.shot('07-grafico');
await click('#btn-admin'); await sleep(300);
await click('#msg-final'); await sleep(1200);
console.log('  resumen final:', JSON.stringify(await ev('window.__compartido.at(-1)?.text')));
// El podio ("🥇 Cata · 30 pts") y el campeón van en la imagen; las medallas ("🥇 Más días ganados") no
ok(!/ pts$|^🏆 /m.test(await ev('window.__compartido.at(-1)?.text || ""')), 'el resumen final no repite el podio de la imagen (D-171)');
ok(await ev('window.__compartido.at(-1)?.files?.[0]?.name') === 'copa-oficina-tabla-final.png', 'el resumen final del admin va con la imagen de la tabla final');


/* ---------- El laboratorio (D-101): la página, la práctica de cada juego y los reportes ---------- */

await b.go(`${SITIO}/`, 1500);
const tarjeta = await ev(`(()=>{const c=[...document.querySelectorAll('.game-card')].find(x=>x.textContent.includes('La Copa'));return JSON.stringify({soon:c.classList.contains('soon'),href:c.getAttribute('href'),rotulo:c.querySelector('.proximamente')?.textContent})})()`).then(JSON.parse);
ok(!tarjeta.soon && tarjeta.href === 'cup/' && !tarjeta.rotulo, 'en el menú La Copa está activa y abre /cup/ (D-175)');
await b.go(BASE, 1500);
ok(await ev(`document.getElementById('btn-menu').href`) === `${SITIO}/`, 'La Copa sin ?labs vuelve al menú, no al laboratorio (D-175)');
await b.go(`${BASE}?labs`, 1500);
ok(await ev(`document.getElementById('btn-menu').href`) === `${SITIO}/labs/`, 'La Copa con ?labs vuelve al laboratorio');
await b.go(`${SITIO}/labs/`, 1500);
// El pozo más la final, y el más nuevo entre ellos
ok(await ev(`document.querySelectorAll('#minis .mini-juego').length`) === POZO.length + 1 && await ev(`!!document.querySelector('#minis [data-id="desenredo"]')`), `el laboratorio ofrece los ${POZO.length + 1} juegos (con Desenredo)`);
await b.shot('10-labs');
// Los juegos con página propia se practican ahí, para que el link traiga su tarjeta (D-164)
ok(await ev(`document.querySelector('#minis [data-id="donde"]').getAttribute('href')`) === '../where/?labs'
  && await ev(`document.querySelector('#minis [data-id="linea"]').getAttribute('href')`) === '../cup/?practica=linea&labs', 'laboratorio: ¿Dónde queda? abre su página; Línea Relámpago sigue en /cup/');
ok(await ev(`document.querySelector('#minis [data-id="zip"] span').classList.contains('emoji-claro')`), 'laboratorio: el 〰️ de Zip lleva contorno claro');
await b.go(`${BASE}?practica=tango&prueba&labs&semilla=KQRST`, 1500); await preparar();
ok(await ev(`location.pathname + location.search`) === '/tango/?labs&prueba&semilla=KQRST', 'laboratorio: el link viejo va a la página del juego con su semilla');
ok(!!await ev(`document.getElementById('btn-ensayo')`) && await ev(`document.getElementById('btn-menu').href`) === `${SITIO}/labs/`, 'laboratorio: en la página del juego sigue la sesión de prueba y se vuelve al laboratorio');
// Arrastrar desde una casilla vacía pinta X en las vacías (D-166) y desde una X las borra (D-168),
// con mouse y con el dedo, sin
// estorbar al toque (reina) ni al toque largo (X)
await b.go(`${BASE}?practica=reinas&prueba&labs`, 1200); await preparar();
await click('#btn-empezar'); await sleep(300); await esperarCuenta();
{
  const N = await ev(`Math.round(Math.sqrt(document.querySelectorAll('.rej').length))`);
  const centro = i => ev(`(()=>{const r=document.querySelector('.rej[data-i="${i}"]').getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]})()`);
  const clases = () => ev(`[...document.querySelectorAll('.rej')].map(x=>x.classList.contains('reina')?'R':x.classList.contains('marca')?'X':'.').join('')`);
  const [x0, y0] = await centro(0), [x1, y1] = await centro(N - 1);
  await b.arrastre(x0, y0, x1, y1, 3);
  let t = await clases();
  ok(t.slice(0, N) === 'X'.repeat(N) && !t.slice(N).includes('X') && !t.includes('R'), 'Reinas: arrastrar a lo largo de una fila la llena de X, sin saltarse casillas');
  const [xr, yr] = await centro(N); await b.toque(xr, yr);
  t = await clases();
  ok(t[N] === 'R' && t.slice(N + 1, 2 * N) === '.'.repeat(N - 1), 'Reinas: el toque sigue poniendo la reina');
  // El ciclo del toque: reina → X → vacía → reina (D-167)
  const ciclo = [];
  for (let k = 0; k < 3; k++) { await b.toque(xr, yr); ciclo.push((await clases())[N]); }
  ok(ciclo.join('') === 'X.R', 'Reinas: tocar otra vez la reina la cambia por X, después vacía y de nuevo reina');
  const [xr2, yr2] = await centro(N + 3); await b.arrastre(xr, yr, xr2, yr2, 3);
  t = await clases();
  ok(t[N] === 'R' && t.slice(N + 1, 2 * N) === '.'.repeat(N - 1), 'Reinas: arrastrar desde una reina no pinta ni la saca');
  // Con el dedo, por una columna: el tablero no desplaza la página
  const col = 3, desde = await centro(2 * N + col), hasta = await centro((N - 1) * N + col);
  const dedo = (type, [x, y] = [0, 0]) => b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await dedo('touchStart', desde);
  for (let k = 1; k <= 4; k++) { await dedo('touchMove', [desde[0], Math.round(desde[1] + (hasta[1] - desde[1]) * k / 4)]); await sleep(30); }
  await dedo('touchEnd'); await sleep(250);
  t = await clases();
  ok([...Array(N - 2).keys()].every(k => t[(k + 2) * N + col] === 'X') && t[N + col] === '.', 'Reinas: con el dedo, arrastrar por una columna la llena de X');
  // Arrastrar desde una X las borra (D-168): las últimas cuatro de la fila 0
  const [xb0, yb0] = await centro(N - 1), [xb1, yb1] = await centro(N - 4);
  await b.arrastre(xb0, yb0, xb1, yb1, 3);
  t = await clases();
  ok(t.slice(0, N - 4) === 'X'.repeat(N - 4) && t.slice(N - 4, N) === '....' && t[2 * N + col] === 'X', 'Reinas: arrastrar desde una X borra las X por donde pasa');
  // y pasa por encima de la reina sin sacarla: de la X de la casilla 1 a la reina de la fila 1
  const [xc0, yc0] = await centro(1);
  await b.arrastre(xc0, yc0, xr, yr, 3);
  t = await clases();
  ok(t[0] === 'X' && t[1] === '.' && t[N] === 'R', 'Reinas: el arrastre que borra no saca reinas');
  // Toque largo en una vacía: X, y el click de soltar no pone reina
  const [xl, yl] = await centro(N + 6);
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: xl, y: yl, button: 'left', clickCount: 1, buttons: 1 }); await sleep(600);
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xl, y: yl, button: 'left', clickCount: 1, buttons: 0 }); await sleep(200);
  ok((await clases())[N + 6] === 'X', 'Reinas: el toque largo sigue poniendo la X');
  // Borrar todo pide un segundo toque y deja el tablero en blanco (D-169)
  await click('#btn-borrar'); await sleep(150);
  ok(/[RX]/.test(await clases()) && await ev(`document.getElementById('btn-borrar').classList.contains('armado')`), 'Reinas: el primer toque de Borrar todo solo lo arma');
  await click('#btn-borrar'); await sleep(200);
  ok(!/[RX]/.test(await clases()) && await ev(`document.getElementById('btn-borrar').disabled`), 'Reinas: el segundo toque deja el tablero en blanco y el botón se apaga');
  await b.toque(xr, yr);
  ok((await clases())[N] === 'R', 'Reinas: después de borrar todo se sigue jugando');
}
// Rendirse en Reinas: dos toques, la solución a la vista y 0 puntos (D-110)
await b.go(`${BASE}?practica=reinas&prueba&labs`, 1200); await preparar();
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
// Desde la portada (D-142) la práctica es el juego suelto: sin prueba ni semilla, y vuelve al menú.
// Vive en /<slug>/ (D-149, D-162, D-199): un link viejo a /cup/?practica= sin &labs se va para allá.
await b.go(`${BASE}?practica=conexiones&prueba`, 1500); await preparar();
ok(await ev(`location.pathname + location.search`) === '/connections/?prueba', 'juego suelto: el link viejo de la copa lleva a /connections/');
ok(!await ev(`document.getElementById('btn-ensayo')`) && await ev(`document.getElementById('btn-menu').href`) === `${SITIO}/`
  && await ev(`[...document.querySelectorAll('#jugar-body a')].some(a => a.href === '${SITIO}/')`), 'juego suelto: sin prueba y de vuelta al menú');
// Su página trae su propia tarjeta social: un link compartido muestra el juego, no La Copa (D-162)
ok(/\/assets\/og\/conexiones\.jpg/.test(await ev(`document.querySelector('meta[property="og:image"]')?.content || ''`)), 'juego suelto: su página trae su propia tarjeta social');
ok(!/copa/i.test(await ev(`location.href + ' ' + document.title`)), 'juego suelto: ni el link ni el título dicen copa');
ok(!await ev(`document.body.innerText.includes('empatas')`), 'juego suelto: no habla de empates, no hay con quién (dilema #72)');
// El 🐞 del resultado abre el formulario y vuelve al resultado (la página suelta necesita su pantalla)
// Los links de antes (/minigames/?reinas, /minigames/queens/) se van a la página propia
await b.go(`${SITIO}/minigames/?reinas&prueba`, 1500); await preparar();
ok(await ev(`location.pathname + location.search`) === '/queens/?prueba', 'juego suelto: /minigames/?reinas lleva a /queens/');
await b.go(`${SITIO}/minigames/queens/?prueba`, 1500); await preparar();
ok(await ev(`location.pathname + location.search`) === '/queens/?prueba', 'juego suelto: /minigames/queens/ lleva a /queens/');
await click('#btn-empezar'); await sleep(300); await esperarCuenta();
await click('#btn-rendirse'); await sleep(300); await click('#btn-fin'); await sleep(800);
await click('#btn-reporte'); await sleep(300);
ok(await ev(`document.querySelector('.screen.active')?.id`) === 'screen-reporte' && !!await ev(`document.getElementById('btn-enviar-reporte')`), 'juego suelto: el 🐞 del resultado abre el formulario');
await ev(`[...document.querySelectorAll('#reporte-body .btn--ghost')].at(-1).click()`); await sleep(300);
ok(await ev(`document.querySelector('.screen.active')?.id`) === 'screen-resultado', 'juego suelto: cancelar el reporte vuelve al resultado');
for (const id of ['linea', 'numero', 'conexiones', 'reinas', 'letras', 'zip', 'desenredo', 'tango', 'anio', 'donde', 'final']) {
  // Zip con semilla fija: el chequeo del aviso busca un trazo que llegue al final sin cubrir todo.
  // Desenredo con reloj corto también: dos niveles resueltos y el tiempo se acaba en el tercero
await b.go(`${BASE}?practica=${id}&prueba&labs${id === 'zip' ? '&zipSeg=12&semilla=KQRST' : id === 'desenredo' ? '&zipSeg=25&semilla=KQRST' : ''}`, 1200); await preparar();
  ok(await ev(`!!document.getElementById('btn-ensayo')`) , `práctica de ${id}: la antesala ofrece la prueba como en la copa`);
  if (id === 'donde') {
    // La portada es el globo girando solo (y los demás juegos siguen con su emoji)
    const cuadro = () => ev(`document.querySelector('.intro-hero .globo-portada canvas:last-child')?.toDataURL().length + ':' + document.querySelector('.intro-hero .globo-portada canvas:last-child')?.toDataURL().slice(-200)`);
    const c1 = await cuadro(); await sleep(700); const c2 = await cuadro();
    ok(!c1.startsWith('undefined') && c1 !== c2, '¿Dónde queda?: la portada es un globo que gira');
    await b.shot('donde-portada');
    ok(await ev(`document.getElementById('btn-menu').getBoundingClientRect().height`) < 50, 'práctica: "‹ Laboratorio" va en una sola línea junto a un título largo (U-12)');
  }
  if (id === 'linea') {
    // La prueba desde el laboratorio: la misma que antes de un día (D-109), y vuelve a la antesala
    await click('#btn-ensayo'); await esperarCuenta();
    await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__jugando={p:JUEGOS.linea.ensayo(__copa.estado.juego.semilla, 1)};return 1})()`);
    await jugarLinea(2); await click('#btn-fin'); await sleep(300);
    ok(!!await ev(`document.getElementById('btn-volver-ensayo')`), 'la prueba del laboratorio termina con la vuelta a la antesala');
    await click('#btn-volver-ensayo'); await sleep(300);
  }
  await click('#btn-empezar'); await sleep(300); await esperarCuenta();
  // Las reglas plegadas debajo del tablero (D-133)
  {
    const r = await ev(`(()=>{const d=document.getElementById('reglas');if(!d)return null;const b=document.getElementById('jugar-body').getBoundingClientRect();return JSON.stringify({abierto:d.open,debajo:d.getBoundingClientRect().top>=b.bottom-1,titulo:d.querySelector('summary').textContent})})()`).then(x => x && JSON.parse(x));
    ok(r && !r.abierto && r.debajo && r.titulo.includes(await ev(`__copa.estado.juego ? document.querySelector('.jugar-titulo')?.textContent.split(' ').slice(1).join(' ') : ''`)), `${id}: las reglas están plegadas debajo del tablero (${r?.titulo})`);
    if (id === 'conexiones') {
      await ev(`document.querySelector('#reglas summary').click(); document.getElementById('reglas').scrollIntoView(); 1`); await sleep(300);
      await b.shot('reglas-abiertas');
      await ev(`document.querySelector('#reglas summary').click(); window.scrollTo(0,0); 1`);
    }
  }
  await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');window.__jugando={p:JUEGOS['${id}'].generar(__copa.estado.juego.semilla, 1)};return 1})()`);
  if (id === 'zip') {
    // Llegar al último número sin cubrir todo: el aviso va bajo la grilla y no la mueve, y la cabeza no tapa el número
    const z = await ev(`(async()=>{const z=await import('/cup/games/zip/engine.js');const p=z.nivel(__copa.estado.juego.semilla,1,0);const N=p.n*p.n;
      const ini=+Object.keys(p.numeros).find(k=>p.numeros[k]===1);let f=null,k=0;
      const dfs=t=>{if(f||k++>200000)return;if(z.estado(p,t).faltan){f=t.slice();return}for(let i=0;i<N;i++)if(z.puedeIr(p,t,i)){t.push(i);dfs(t);t.pop()}};dfs([ini]);
      const g=document.querySelector('.zip-grid');const top0=g.getBoundingClientRect().top;
      for(const i of f)g.querySelector('.zc[data-i="'+i+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));
      const h=g.querySelector('.zc.cabeza');const r={quieta:g.getBoundingClientRect().top===top0,aviso:!!document.querySelector('.zip-aviso .aviso.mal'),num:h.innerText.trim()!=='',tapa:getComputedStyle(h,'::after').content!=='none'};
      return JSON.stringify(r)})()`).then(JSON.parse);
    ok(z.aviso && z.quieta, 'Zip: el aviso de casillas faltantes aparece bajo la grilla sin moverla');
    ok(z.num && !z.tapa, 'Zip: la cabeza del trazo sobre un número deja ver el número');
    // Borrar todo, como en Tango: el primer toque pide confirmación y el segundo deja solo el 1
    const bz = await ev(`(async()=>{const g=document.querySelector('.zip-grid'),b=document.getElementById('btn-borrar'),w=ms=>new Promise(r=>setTimeout(r,ms));
      const antes=g.querySelectorAll('.zc.on').length;b.click();await w(50);
      const cab=g.querySelector('.zc.cabeza');cab.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0}));await w(50);const suelta=!b.classList.contains('armado');
      b.click();await w(50);const armado=b.classList.contains('armado')&&g.querySelectorAll('.zc.on').length===antes;
      b.click();await w(50);const on=[...g.querySelectorAll('.zc.on')];
      return JSON.stringify({antes,suelta,armado,quedan:on.length,uno:on[0]?.innerText.trim(),apagado:b.disabled})})()`).then(JSON.parse);
    ok(bz.antes > 1 && bz.armado, 'Zip: el primer toque de Borrar todo pide confirmación y no borra');
    ok(bz.suelta, 'Zip: tocar la grilla con Borrar todo armado lo desarma, como en Tango');
    ok(bz.quedan === 1 && bz.uno === '1' && bz.apagado, 'Zip: el segundo toque deja solo el 1 y el botón se apaga');
  }
  if (id === 'reinas') {
    // El toque largo pone una X, con el puntero de verdad (D-103)
    const [x, y] = await ev(`(()=>{const r=document.querySelector('.rej[data-i="0"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 });
    await sleep(650);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 });
    await sleep(300);
    ok(await ev(`document.querySelector('.rej[data-i="0"]').classList.contains('marca')`), 'Reinas: el toque largo marca la X y no pone reina');
    await b.toque(x, y); await b.toque(x, y);   // toques rápidos de verdad: la X pasa a vacía y después a reina (D-167)
    ok(await ev(`document.querySelector('.rej[data-i="0"]').classList.contains('reina')`), 'Reinas: después del toque largo, los toques rápidos no se pierden');
    await b.toque(x, y);
    ok(await ev(`document.querySelector('.rej[data-i="0"]').classList.contains('marca')`), 'Reinas: otro toque cambia la reina por una X');
    await b.toque(x, y);
    ok(await ev(`document.querySelector('.rej[data-i="0"]').textContent === ''`), 'Reinas: y otro deja la casilla vacía');
  }
  if (id === 'desenredo') {
    // Arrastrar un nudo con el mouse de verdad lo mueve, y el contador de cruces se ve
    const antes = await ev(`(()=>{const c=document.querySelector('.des-tablero circle[data-v="0"]');return JSON.stringify([c.cx.baseVal.value,c.cy.baseVal.value])})()`).then(JSON.parse);
    const [x0, y0] = await ev(`(()=>{const c=document.querySelector('.des-tablero circle[data-v="0"]').getBoundingClientRect();return JSON.stringify([c.x+c.width/2,c.y+c.height/2])})()`).then(JSON.parse);
    // Se toma un poco al lado del nudo: el área que se toca es más grande que el dibujo (C-8)
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0 + 14, y: y0, button: 'left', clickCount: 1, buttons: 1 });
    for (let i = 1; i <= 3; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + 14, y: y0 + 15 * i, button: 'left', buttons: 1 });
    // A medio arrastre el nudo tomado se ve: con la clase .vilo lo escondía el CSS del arrastre compartido
    ok(await ev(`(()=>{const c=document.querySelector('.des-tablero circle.tomado');return !!c&&c.getBoundingClientRect().width>20})()`), 'Desenredo: el nudo que se arrastra se ve mientras se mueve');
    ok(await ev(`document.querySelectorAll('.des-tablero .des-hilo path.hebra').length`) > 0, 'Desenredo: los hilos se dibujan como cuerda (D-182)');
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 + 14, y: y0 + 45, button: 'left', clickCount: 1, buttons: 0 });
    const despues = await ev(`(()=>{const c=document.querySelector('.des-tablero circle[data-v="0"]');return JSON.stringify([c.cx.baseVal.value,c.cy.baseVal.value])})()`).then(JSON.parse);
    ok(despues[1] > antes[1] + 50 && Math.abs(despues[0] - antes[0]) < 2, `Desenredo: arrastrar desde al lado del nudo lo mueve (${antes} → ${despues})`);
    ok(/cruce/.test(await ev(`document.querySelector('.des-estado').textContent`)), 'Desenredo: bajo el tablero se cuentan los cruces');
    await revisarPantalla('desenredo-tablero');
  }
  if (id === 'tango') await b.shot('tango-tablero');
  if (id === 'donde') {
    // Arrastrar gira el globo sin poner el alfiler; el doble toque solo acerca al doble
    const vista = () => ev(`JSON.stringify(document.querySelector('.mapa-globo').globo.vista())`).then(JSON.parse);
    const antes = await vista();
    ok(antes.z === 1 && await ev(`(()=>{const c=document.querySelector('.mapa-globo').getBoundingClientRect();return c.width>200&&c.height>150})()`), '¿Dónde queda?: el globo parte entero a la vista');
    ok(await ev(`document.getElementById('btn-confirmar').disabled`), '¿Dónde queda?: sin alfiler, Confirmar está apagado (C-8)');
    ok(await ev(`document.getElementById('globo-pista')?.textContent`) === '↔ Arrastra para girar', '¿Dónde queda?: la primera ciudad dice que el globo se gira (#88)');
    const [x0, y0] = await ev(`(()=>{const c=document.querySelector('.mapa-globo').getBoundingClientRect();return JSON.stringify([c.left+c.width/2,c.top+c.height/2])})()`).then(JSON.parse);
    await b.toque(x0, y0); await sleep(60); await b.toque(x0, y0); await sleep(500);
    const acercado = await vista();
    ok(acercado.z === 2 && await ev(`!document.querySelector('.mapa-globo').dataset.alfiler && document.getElementById('btn-confirmar').disabled`), `¿Dónde queda?: el doble toque acerca al doble (×${acercado.z}) sin poner el alfiler`);
    // Un toque solo sí lo pone, pasado el momento en que podía ser un doble toque
    await b.toque(x0, y0); await sleep(500);
    ok(await ev(`document.querySelector('.mapa-globo').dataset.alfiler === '1' && !document.getElementById('btn-confirmar').disabled`), '¿Dónde queda?: un toque solo pone el alfiler');
    // Un arrastre largo da la vuelta: la longitud sigue sin tope (el globo gira sin fin)
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
    for (let i = 1; i <= 6; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 - 12 * i, y: y0, button: 'left', buttons: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 - 72, y: y0, button: 'left', clickCount: 1, buttons: 0 });
    await sleep(200);
    const girado = await vista();
    ok(!await ev(`document.getElementById('globo-pista')`), '¿Dónde queda?: la pista se va con el primer arrastre');
    ok(girado.centro[1] > acercado.centro[1] && girado.z === 2 && await ev(`document.querySelector('.mapa-globo').dataset.alfiler`) === '1', `¿Dónde queda?: arrastrar gira el globo (${acercado.centro[1].toFixed(1)}° → ${girado.centro[1].toFixed(1)}°) y no mueve el alfiler`);
    await ev(`document.querySelector('.mapa-globo').globo.girarA(0, 175); 1`);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
    for (let i = 1; i <= 6; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 - 12 * i, y: y0, button: 'left', buttons: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 - 72, y: y0, button: 'left', clickCount: 1, buttons: 0 });
    await sleep(200);
    const lon = (await vista()).centro[1];
    ok(lon < -170, `¿Dónde queda?: pasados los 180° el globo sigue girando (${lon.toFixed(1)}°)`);
    // Acercado, se bajan las teselas nítidas de lo que se ve, y solo esas (D-160)
    if (await ev(`!!document.createElement('canvas').getContext('webgl')`)) {
      await ev(`document.querySelector('.mapa-globo').globo.girarA(-33, -70); for (let i = 0; i < 4; i++) document.getElementById('btn-acercar').click(); 1`);
      await sleep(1500);
      const teselas = await ev(`JSON.stringify(performance.getEntriesByType('resource').filter(e => e.name.includes('earth-2004-09/')).map(e => e.name.split('/').pop()))`).then(JSON.parse);
      ok(teselas.includes('5-4.jpg') && teselas.length <= 9, `¿Dónde queda?: acercado sobre Chile se bajan sus teselas (${teselas.join(', ')})`);
      for (let i = 0; i < 4; i++) await click('#btn-alejar');
    }
    await b.shot('donde-mapa');
  }
  await JUGAR[id](id === 'tango' ? 1 : 2);
  if (id === 'zip') {
    ok(await ev(`document.querySelector('.zip-grid').classList.contains('solucion') && !!document.getElementById('zip-solucion')`), 'Zip: al acabarse el tiempo se ve la solución del nivel que quedó a medias');
    const cron0 = await ev(`document.querySelector('#jugar-head .cron').textContent`);
    await sleep(2200);
    ok(await ev(`document.querySelector('#jugar-head .cron').textContent`) === cron0 && !await ev(`document.querySelector('.zip-reloj')`), `Zip: al acabarse el tiempo el reloj queda quieto en ${cron0} y la cuenta regresiva desaparece`);
    await b.shot('zip-solucion');
  }
  if (id === 'desenredo') {
    ok(await ev(`document.querySelector('.des-tablero').classList.contains('solucion') && !!document.getElementById('des-solucion')`), 'Desenredo: al acabarse el tiempo se ve una solución del nivel que quedó a medias');
    ok(/Resolviste 2 niveles/.test(await ev(`document.querySelector('.zip-aviso').textContent`)), 'Desenredo: el aviso del final dice cuántos niveles se resolvieron');
    ok(!/null|false|undefined/.test(await ev(`document.querySelector('.zip-aviso').textContent`)), 'Desenredo: el aviso del final no arrastra texto de más');
    await sleep(900); await b.shot('desenredo-solucion');
  }
  if (id === 'conexiones') ok(await ev(`document.querySelectorAll('.grupo').length === 4 && !document.querySelector('.grupo').classList.contains('pop')`), 'Conexiones: los grupos ya resueltos no se vuelven a animar');
  if (['conexiones', 'reinas', 'linea', 'letras'].includes(id)) {
    // El reloj se detiene al terminar el tablero, no al tocar "Ver resultado" (D-130)
    const t0 = await ev(`document.querySelector('#jugar-head .cron').textContent`);
    await sleep(2300);
    ok(await ev(`document.querySelector('#jugar-head .cron').textContent`) === t0, `${id}: al terminar el tablero el reloj queda quieto en ${t0}`);
  }
  await click('#btn-fin'); await sleep(500);
  const r = await ev(`JSON.stringify({p:__copa.estado.pantalla, s:document.querySelector('.score-big')?.textContent})`).then(JSON.parse);
  ok(r.p === 'resultado', `práctica de ${id}: se juega completa (${r.s})`);
  ok((await ev(`document.querySelector('#explicacion')?.innerText || ''`)).length > 40, `práctica de ${id}: explica cómo se calculó el puntaje`);
  if (id === 'donde') ok(r.s === '100/100', `¿Dónde queda?: el alfiler justo en cada ciudad son 100 puntos (${r.s})`);
  if (['reinas', 'zip', 'desenredo', 'tango', 'letras', 'donde'].includes(id)) await b.shot(`practica-${id}`);
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
await b.go(`${SITIO}/labs/`, 1200);
ok(await ev(`document.querySelectorAll('[data-demo]').length`) === 10, 'el laboratorio ofrece las diez demos de la copa');
const DEMOS = { nueva: 'admin', invitado: 'entrar', espera: 'tablero', 'sin-jugar': 'admin', jugador: 'tablero', admin: 'admin', final: 'tablero', 'final-admin': 'admin', podio: 'tablero', llena: 'tablero' };
for (const [demo, pant] of Object.entries(DEMOS)) {
  await b.go(`${BASE}?prueba&demo=${demo}`, 1500); await preparar();
  ok(await pantalla() === pant, `demo ${demo}: abre en ${pant}`);
  await revisarPantalla(`demo-${demo}`);
  await b.shot(`demo-${demo}`);
}
await b.go(`${BASE}?prueba&demo=sin-jugar`, 1500); await preparar();
ok(/nadie ha jugado/i.test(await ev(`document.getElementById('admin-inicio')?.innerText || ''`)), 'demo sin-jugar: el admin ve que partió sin nadie y puede moverla');
await b.go(`${BASE}?prueba&demo=jugador`, 1500); await preparar();
ok(!!await ev(`document.querySelector('[data-dia="4"]')`), 'demo jugador: el día 4 se puede jugar');
ok(await ev(`[...document.querySelectorAll('.tabla .fila')].every(f=>f.querySelectorAll('.pd').length===7) && !!document.querySelector('.tabla .pd.pendiente') && !!document.querySelector('.tabla .pd.abierto') && !!document.querySelector('.tabla-leyenda')`), 'la tabla muestra los 7 días de cada jugador, con estados y leyenda (D-131)');
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
ok(!!await ev(`document.getElementById('msg-invitar')`) && !!await ev(`document.getElementById('msg-tabla')`) && !await ev(`document.getElementById('msg-final')`), 'día 4: con invitación (D-176) y la tabla parcial, sin resumen final');
await ev(`window.__msgs = []; navigator.share = d => { window.__msgs.push(d.text); return Promise.resolve(); }; 1`);
await click('#msg-invitar'); await sleep(400);
ok(/día \d+ de \d+/.test(await ev(`(window.__msgs || []).join(' ')`) || '') && !/Parte el/.test(await ev(`(window.__msgs || []).join(' ')`) || ''), 'la invitación ya partida dice en qué día va (D-176)');
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

// Terminar la copa antes (D-161): el día de la final, con gente sin jugar; después, exportar
await b.go(`${BASE}?prueba&demo=final-admin`, 1500); await preparar();
const avisoFin = await ev(`document.getElementById('admin-terminar')?.innerText || ''`);
ok(/Falta que juegue(n)? el día 7: .*Cata/.test(avisoFin) && !/no se juegan/.test(avisoFin), 'terminar antes: el admin ve quién no ha jugado la final');
ok(!await ev(`document.getElementById('admin-exportar')`), 'mientras se juega no hay exportar');
await revisarPantalla('admin-terminar');
await ev(`document.getElementById('admin-terminar').scrollIntoView(); 1`);
await b.shot('admin-terminar');
await ev('window.confirm = () => false; 1');
await click('#btn-terminar'); await sleep(300);
ok(!await ev('__copa.estado.copa.fin'), 'terminar antes: sin confirmar no pasa nada');
await ev('window.confirm = () => true; 1');
await click('#btn-terminar'); await sleep(500);
ok(!!await ev('__copa.estado.copa.fin') && !await ev(`document.getElementById('admin-terminar')`) && !!await ev(`document.getElementById('admin-exportar')`) && !!await ev(`document.getElementById('msg-final')`), 'terminar antes: la copa termina y aparecen el resumen final y exportar');
await ev(`window.__descargas = []; URL.createObjectURL = x => { window.__descargas.push(x); return 'blob:prueba'; }; 1`);
await click('#btn-exportar-planilla'); await sleep(300);
const csv = await ev(`window.__descargas[0]?.text()`);
const bom = await ev(`window.__descargas[0]?.arrayBuffer().then(x => [...new Uint8Array(x).slice(0, 3)].join(','))`);
ok(bom === '239,187,191', 'exportar: la planilla lleva BOM, para que Excel lea los acentos');
ok(/^🏆 Copa de la oficina\r\nEl administrador la terminó antes/.test(csv || '') && /Tabla final/.test(csv) && /Posiciones día a día/.test(csv) && /Día 7 · La Gran Final/.test(csv), 'exportar: la planilla trae la tabla final, los lugares día a día y la final');
await revisarPantalla('admin-exportar');
await b.shot('admin-exportar');
await click('#btn-exportar-imagen'); await sleep(1500);
ok((await ev(`window.__compartido.length`)) + (await ev(`window.__descargas.length`)) >= 2, 'exportar: la imagen de la tabla final se comparte o se descarga');
await ev(`[...document.querySelectorAll('#admin-body > button')].find(x => /Volver a la copa/.test(x.textContent))?.click(); 1`); await sleep(400);
ok(await pantalla() === 'tablero' && !!await ev(`document.querySelector('.podio')`) && /terminó la copa antes/.test(await ev(`document.querySelector('.copa-head').innerText`)), 'terminar antes: el tablero muestra el podio y que el admin la cerró');
await b.shot('tablero-terminada-antes');

// Una copa para Brasil (D-187): la invitación lo dice, y su Línea puede traer la temática Brasil pero nunca la de Chile
{
  const code = await ev(`(async()=>{const E=await import('/cup/engine.js');const st=__copa.store;await st.listo();const now=st.now();
    let c=null;for(const x of ['WQXYZ','WQXYA','WQXYB']){if(!(await st.existe(x))){c=x;break}}
    const meta=E.nuevaMeta({nombre:'Copa do Brasil',dias:7,inicio:E.sumarDias(E.fechaEn(now,E.ZONA),1),tz:E.ZONA,admin:'zzz111',creada:now,lab:true,aud:'br'});
    await st.crear(c,meta,{pid:'zzz111',name:'Ana',at:now,pinHash:'x'});return c})()`);
  await ev('sessionStorage.clear(); 1');
  await b.go(`${BASE}?${code}&prueba`, 1500);
  ok(await ev(`document.getElementById('aviso-aud')?.dataset.aud`) === 'br' && /Brasil/.test(await ev(`document.getElementById('aviso-aud').textContent`)), 'copa para Brasil: la invitación lo dice');
  ok(await ev(`(async()=>{const {JUEGOS}=await import('/cup/games/index.js');return [1,2,3,4,5,6,7].every(d=>JUEGOS.linea.generar('${code}',d,{aud:'br'}).tema!=='chile')})()`), 'copa para Brasil: Línea Relámpago no usa la temática Chile');
  await b.shot('invitacion-brasil');
}

console.log('errores:', JSON.stringify(b.errors), JSON.stringify(b.logs));
ok(!b.errors.length && !b.logs.length, 'consola sin errores');
b.close();
