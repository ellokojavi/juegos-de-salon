// Uno al día (D-230) con los juegos de grupo, de punta a punta: El Ahorcado, Batalla Naval y Dudo
// con `?today`. Para cada uno se fija el reloj en un día en que le toca, y se comprueba que abra
// directo el modo para uno (sin elegir modo), que la intro lleve la línea de Uno al día, que lo
// común salga de la semilla del día (la palabra, la flota del celular, los dados), que al terminar
// se anote el puntaje de 0 a 100 de su fórmula y que la tarjeta vaya arriba de los botones del
// juego. También, que un link de otro juego lleve al de hoy, que el segundo intento sea práctica y
// que /today/ nombre el juego.
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from './cdp.mjs';
import { COMMON } from '../../public/assets/js/i18n.js';
import { juegoDel, sumarDias, LANZAMIENTO, KEY, puntajeAhorcado, puntajeNaval, puntajeDudo } from '../../public/assets/js/uno-al-dia.js';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), 'uno-al-dia-grupo-'));
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const U = COMMON.es.uad;

/** El primer día en que toca cada juego: el guion no depende de fechas escritas a mano. */
const diaDe = id => { for (let i = 0; i < 200; i++) { const f = sumarDias(LANZAMIENTO, i); if (juegoDel(f) === id) return f; } return null; };
const DIAS = { ahorcado: diaDe('ahorcado'), 'batalla-naval': diaDe('batalla-naval'), dudo: diaDe('dudo') };
ok(Object.values(DIAS).every(Boolean), `los tres juegos salen en el mazo (${JSON.stringify(DIAS)})`);

const b = await launch({ port: 9513, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const texto = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const memoria = () => ev(`JSON.parse(localStorage.getItem('${KEY}')||'{"dias":{}}')`);
const esperar = async (cond, tope = 40) => { for (let i = 0; i < tope && !await ev(cond); i++) await sleep(250); return ev(cond); };
const pantalla = () => ev(`document.querySelector('.screen.active')?.id`);

// El reloj de todas las páginas: el mediodía del día guardado en `__reloj` (o hoy), y corre desde ahí
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{let f=null;try{f=localStorage.getItem('__reloj')}catch(_){}
  if(!f)return;const [y,m,d]=f.split('-').map(Number);const D=Date,dif=new D(y,m-1,d,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;})()` });

await b.go(`${SITIO}/`, 600);
await ev(`(()=>{localStorage.clear();localStorage.setItem('juegos-de-salon:instalar:no','1');return 1})()`);
const reloj = f => ev(`localStorage.setItem('__reloj','${f}'); 1`);

/** Lo común de la intro de los tres: sin modos, la línea de Uno al día y un solo botón. */
async function intro(id, carpeta, extra) {
  await esperar(`!!document.getElementById('btn-uad-jugar')`);
  ok(await ev(`location.pathname`) === `/${carpeta}/`, `${id}: abre /${carpeta}/?today`);
  ok(!await ev(`!!document.querySelector('#modes .mode')`), `${id}: no pide elegir modo`);
  const linea = await texto('#uad-intro');
  ok(linea.includes(U.intro) && (!extra || linea.includes(extra)), `${id}: la intro lleva la línea de Uno al día ("${linea}")`);
  ok((await texto("#btn-uad-jugar")).trim().toLowerCase() === U.jugar.toLowerCase(), `${id}: un solo botón, "${U.jugar}"`);
}

/** Lo común del final: la tarjeta arriba de los botones del juego, y lo anotado. */
async function final(id, fecha, esperado) {
  ok(await esperar(`!!document.getElementById('uad-tarjeta')`, 60), `${id}: al terminar, la tarjeta de Uno al día`);
  ok(await ev(`document.getElementById('uad-tarjeta').nextElementSibling?.id === 'result-actions'`), `${id}: va justo arriba de los botones del juego`);
  ok(!await ev(`[...document.querySelectorAll('#result-actions .btn--yellow')].length`), `${id}: sin botón de revancha (#226): la tarjeta ya ofrece jugar otro o repetir el de hoy`);
  ok(await ev(`document.querySelectorAll('#result-actions .btn').length > 0`), `${id}: y los botones del juego siguen ahí`);
  const m = await memoria();
  const d = m.dias[fecha];
  ok(d?.j === id && d.n === 1, `${id}: queda anotado en el celular (${JSON.stringify(d)})`);
  ok(d?.s === esperado && d.s >= 0 && d.s <= 100, `${id}: el puntaje es el de su fórmula, de 0 a 100 (${d?.s}, esperado ${esperado})`);
  const t = await texto('#uad-tarjeta');
  ok(/Racha: 1 día/.test(t) && new RegExp(`Hoy: ${esperado} puntos`).test(t), `${id}: la tarjeta dice la racha y el puntaje (${t.replace(/\n/g, ' / ')})`);
  await b.shot(`${id}-resultado`);
}

/* ---------- Un link de otro juego lleva al de hoy ---------- */
await reloj(DIAS.dudo);
await b.go(`${SITIO}/hangman/?today`, 1500);
ok(await esperar(`location.pathname === '/liars-dice/'`), `el ${DIAS.dudo} toca Dudo: /hangman/?today se va a /liars-dice/?today`);
await b.go(`${SITIO}/queens/?today`, 1500);
ok(await esperar(`location.pathname === '/liars-dice/'`), 'y un solitario también se va al de hoy');

/* ---------- El Ahorcado ---------- */
{
  const f = DIAS.ahorcado;
  await reloj(f);
  await b.go(`${SITIO}/hangman/?today`, 1500);
  await intro('ahorcado', 'hangman');
  await b.shot('ahorcado-intro');
  const jugar = async errores => {
    await click('#btn-uad-jugar');
    await esperar(`window.__ahorcado.view()?.phase === 'play'`);
    const palabra = await ev(`window.__ahorcado.view().words.A`);
    const cfg = await ev(`JSON.stringify(window.__ahorcado.match().config)`).then(JSON.parse);
    // Primero los errores (letras que no están), después las que faltan, de a una
    const sin = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    const letras = [...new Set(sin(palabra).replace(/[^A-ZÑ]/g, ''))];
    const fuera = [...'QWXZKJYVHF'].filter(l => !letras.includes(l)).slice(0, errores);
    for (const l of [...fuera, ...letras]) {
      await ev(`(()=>{const S=window.__ahorcado.session(),M=window.__ahorcado.match();S.transport.send({t:'guess',from:'A',letter:'${l}',n:M.plays.filter(p=>p.from==='A').length,ms:500});return 1})()`);
      await sleep(80);
    }
    await esperar(`document.querySelector('.screen.active')?.id === 'screen-result'`, 60);
    return { palabra, cfg };
  };
  const { palabra, cfg } = await jugar(2);
  ok(cfg.source === 'deck' && cfg.players?.length === 1, `ahorcado: con el mazo del celular y 1 jugador (${cfg.source}, ${cfg.players})`);
  await final('ahorcado', f, puntajeAhorcado({ vidas: cfg.lives - 2, total: cfg.lives }));
  // El segundo intento: la misma palabra (sale de la semilla del día) y es práctica
  await b.go(`${SITIO}/hangman/?today`, 1500);
  await esperar(`!!document.getElementById('btn-uad-jugar')`);
  ok(/práctica/.test(await texto('#uad-intro')), 'ahorcado: la intro de un segundo intento avisa que es práctica');
  const otra = await jugar(0);
  ok(otra.palabra === palabra, `ahorcado: la palabra del día es la misma al volver (${palabra})`);
  ok(await esperar(`/práctica/.test(document.getElementById('uad-tarjeta')?.innerText||'')`), 'ahorcado: el segundo intento dice que fue práctica');
  const m = await memoria();
  ok(m.dias[f].n === 2 && m.dias[f].s === puntajeAhorcado({ vidas: cfg.lives - 2, total: cfg.lives }), 'ahorcado: y el resultado del día queda el del primero');
}

/* ---------- Batalla Naval ---------- */
{
  const f = DIAS['batalla-naval'];
  await reloj(f);
  await b.go(`${SITIO}/battleship/?today`, 1500);
  await intro('batalla-naval', 'battleship', U.mismaFlota);
  await click('#btn-uad-jugar');
  await esperar(`document.querySelector('.screen.active')?.id === 'screen-place'`);
  ok(await ev(`window.__bn.session().mode`) === 'cpu', 'batalla-naval: contra el celular');
  await ev(`[...document.querySelectorAll('#place-actions .btn')].find(b=>/azar/i.test(b.textContent)).click(); 1`);
  await sleep(300);
  await ev(`document.querySelector('#place-sail .btn').click(); 1`);
  await esperar(`window.__bn.view()?.phase === 'play'`);
  // La flota del celular es la de la semilla del día
  const igual = await ev(`(async()=>{const u=await import('/assets/js/uno-al-dia.js'),e=await import('/battleship/engine.js');
    const L=e.randomLayout(10,u.azarDel(u.semillaDel('${f}'),'flota'));return e.layoutKey(L)===e.layoutKey(window.__bn.session().layouts.B.layout)})()`);
  ok(igual, 'batalla-naval: la flota del celular sale de la semilla del día');
  // Se hunde entera: un disparo a cada casilla de barco, cuando es el turno del jugador
  const celdas = await ev(`(()=>{const L=__bn.session().layouts.B.layout,T={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2},o=[];
    for(const [id,p] of Object.entries(L))for(let i=0;i<T[id];i++)o.push('ABCDEFGHIJ'[p.dir==='h'?p.c+i:p.c]+((p.dir==='h'?p.r:p.r+i)+1));return JSON.stringify(o)})()`).then(JSON.parse);
  const agua = await ev(`(()=>{const L=__bn.session().layouts.B.layout,T={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2},o=new Set();
    for(const [id,p] of Object.entries(L))for(let i=0;i<T[id];i++)o.add('ABCDEFGHIJ'[p.dir==='h'?p.c+i:p.c]+((p.dir==='h'?p.r:p.r+i)+1));
    for(let r=1;r<=10;r++)for(const c of 'ABCDEFGHIJ')if(!o.has(c+r))return c+r})()`);
  const cola = [agua, ...celdas];   // un agua primero, para que el puntaje no sea el máximo
  for (let i = 0; i < 400 && cola.length && (await pantalla()) !== 'screen-result'; i++) {
    const turno = await ev(`(()=>{const v=__bn.view();return v.phase==='play'&&v.shooter==='A'&&!v.pending})()`);
    if (turno) { await ev(`__bn.session().transport.send({t:'shot',from:'A',cell:'${cola.shift()}'}); 1`); }
    // Los carteles de cada disparo se cierran tocando
    await ev(`(()=>{const h=document.getElementById('handoff');if(!h.hidden){const b=h.querySelector('.btn');b?b.click():h.click()}return 1})()`);
    await sleep(150);
  }
  const mios = await ev(`JSON.stringify(__bn.match().shots.filter(s=>s.from==='A'&&s.result!==null).map(s=>s.result))`).then(JSON.parse);
  const gano = await ev(`__bn.view().winner`) === 'A';
  ok(gano, `batalla-naval: el jugador la hunde con ${mios.length} disparos`);
  await final('batalla-naval', f, puntajeNaval({ gano, disparos: mios.length, aciertos: mios.filter(r => r !== 'agua').length }));
}

/* ---------- Dudo ---------- */
{
  const f = DIAS.dudo;
  await reloj(f);
  await b.go(`${SITIO}/liars-dice/?today`, 1500);
  await intro('dudo', 'liars-dice', U.mismosDados);
  await b.shot('dudo-intro');
  await click('#btn-uad-jugar');
  await esperar(`window.__dudo.view()?.phase === 'bid'`);
  const s = await ev(`JSON.stringify({mode:__dudo.session().mode,players:__dudo.match().players})`).then(JSON.parse);
  ok(s.mode === 'cpu' && s.players.length === 2, `dudo: contra el celular, un rival (${s.mode}, ${s.players})`);
  // Los dados de la primera ronda salen de la semilla del día, la ronda y el rol
  const dados = await ev(`(async()=>{const u=await import('/assets/js/uno-al-dia.js');const v=__dudo.view();
    const tira=rol=>{const r=u.azarDel(u.semillaDel('${f}'),'dudo:0:'+rol);return Array.from({length:5},()=>1+Math.floor(r()*6)).join(',')};
    return JSON.stringify({A:v.rolls.A.d.join(','),B:v.rolls.B.d.join(','),eA:tira('A'),eB:tira('B')})})()`).then(JSON.parse);
  ok(dados.A === dados.eA && dados.B === dados.eB, `dudo: los dados de la primera ronda salen de la semilla del día (${dados.A} · ${dados.B})`);
  for (let i = 0; i < 300 && (await pantalla()) !== 'screen-result'; i++) {
    const h = await ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 0;const b=h.querySelector('.btn');b?b.click():h.click();return 1})()`);
    if (!h) {
      // Una apuesta baja y, si ya hay una en pie, dudo: la partida avanza sola
      await ev(`(()=>{const v=__dudo.view();if(v.phase!=='bid'||v.current!=='A')return 0;const S=__dudo.session();
        S.transport.send(v.bid?{t:'dudo',from:'A'}:{t:'bid',from:'A',n:1,p:2});return 1})()`);
    }
    await sleep(250);
  }
  const v = await ev(`JSON.stringify((()=>{const v=__dudo.view();return {winner:v.winner,dice:v.st.A.dice,rondas:v.history.length}})())`).then(JSON.parse);
  const gano = v.winner === 'A';
  ok(v.winner, `dudo: la partida termina (${gano ? 'gana' : 'pierde'} el jugador en ${v.rondas} rondas)`);
  await final('dudo', f, puntajeDudo({ gano, dados: v.dice, rondas: gano ? v.rondas : v.rondas - 1 }));
  // /today/ nombra el juego de grupo
  await b.go(`${SITIO}/today/`, 1500);
  await esperar(`!!document.getElementById('uad-hoy')`);
  ok(/Dudo/.test(await texto('#uad-hoy')), `/today/: hoy jugaste Dudo (${(await texto('#uad-hoy')).replace(/\n/g, ' / ')})`);
  ok(!/undefined|NaN|\{\w+\}/.test(await ev('document.body.innerText')), '/today/: sin textos a medio armar');
}

/* ---------- El dado nombra a los de grupo ---------- */
{
  await reloj(DIAS.ahorcado);
  await ev(`localStorage.removeItem('${KEY}'); 1`);
  await b.go(`${SITIO}/`, 1500);
  await esperar(`!!document.getElementById('btn-uno-al-dia')`);
  await click('#btn-uno-al-dia');
  ok(await esperar(`/Hoy te toca/.test(document.querySelector('.azar-nombre')?.innerText||'')`, 16) && /El Ahorcado/.test(await texto('.azar-nombre')), `el dado cae en El Ahorcado (${(await texto('.azar-nombre')).replace(/\n/g, ' ')})`);
  ok(await esperar(`location.pathname === '/hangman/' && location.search === '?today'`, 20), 'y abre /hangman/?today');
}

const errores = b.errors || [];
if (errores.length) ok(false, `errores en la página: ${errores.join(' | ')}`);
await b.close?.();
console.log(`Capturas en ${OUT}`);
