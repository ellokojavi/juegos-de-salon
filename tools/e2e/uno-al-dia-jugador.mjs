// Uno al día con jugador (D-230), de punta a punta y con el almacén de prueba (el sitio local no
// escribe en Firebase): Sara juega el de hoy, entra con nombre y PIN y su día sube a la historia y a
// los rankings (del día, de la semana y de rachas); invita a un amigo y el texto lleva su link; Pedro,
// en "otro celular", abre la invitación, ve "🔥 Sara te desafía", juega el mismo desafío, ve el duelo
// y le da a Sara un comodín, que ella ve al volver. El reloj se fija en el 6 de octubre de 2026, el
// día n.° 1, cuando toca Desenredo.
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, sleep } from './cdp.mjs';
import { juegoDel, numDia } from '../../public/assets/js/uno-al-dia.js';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || mkdtempSync(join(tmpdir(), 'uno-al-dia-jugador-'));
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const HOY = '2026-10-06', N = numDia(HOY), DB = 'juegos-de-salon:prueba:records-db';
if (juegoDel(HOY) !== 'desenredo') { console.log(`✗ el ${HOY} ya no toca Desenredo: cambia la fecha del guion`); process.exit(1); }

const b = await launch({ port: 9521, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const texto = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const esperar = async (cond, tope = 40) => { for (let i = 0; i < tope && !await ev(cond); i++) await sleep(250); return ev(cond); };
const db = () => ev(`JSON.parse(localStorage.getItem('${DB}')||'{}')`);

await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const D=Date,dif=new D(2026,9,6,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;})()` });

/** Juega el de hoy hasta el resultado (el reloj de Desenredo, acortado, se acaba). */
const jugar = async (extra = '') => {
  await b.go(`${SITIO}/untangle/?hoy&prueba&zipSeg=3${extra}`, 1200);
  await esperar(`!!document.getElementById('btn-empezar')`);
  await click('#btn-empezar');
  await esperar(`!!document.getElementById('btn-fin')`, 80);
  await click('#btn-fin');
  return esperar(`!!document.getElementById('uad-tarjeta')`, 20);
};
/** Cambia de "celular": se guarda todo lo del que estaba y queda solo la base de prueba compartida. */
const celulares = {};
const cambiarA = async (quien, de) => {
  if (de) celulares[de] = await ev(`JSON.stringify(Object.fromEntries(Object.entries(localStorage)))`);
  await ev(`(()=>{const db=localStorage.getItem('${DB}');localStorage.clear();if(db)localStorage.setItem('${DB}',db);
    localStorage.setItem('juegos-de-salon:instalar:no','1');
    const g=${JSON.stringify(celulares[quien] || null)};if(g){const o=JSON.parse(g);for(const [k,v] of Object.entries(o)) if(k!=='${DB}') localStorage.setItem(k,v)}return 1})()`);
};

/* ---------- Sara juega y entra ---------- */
await b.go(`${SITIO}/`, 600);
await ev(`localStorage.clear(); 1`);
await cambiarA('sara');
ok(await jugar(), 'Sara juega el de hoy');
ok(await esperar(`!!document.getElementById('uad-entrar')`), 'sin jugador, la tarjeta le ofrece guardar la racha con nombre y PIN');
ok(/Guarda tu racha/.test(await texto('#uad-entrar')), `"${(await texto('#uad-entrar')).split('\n')[0]}"`);
await ev(`(async()=>{const J=await (await import('/assets/js/jugador.js')).jugador();await J.crear('Sara','1111');return 1})()`);
const sara = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:jugador')).jid`);
ok(await esperar(`!!JSON.parse(localStorage.getItem('${DB}')||'{}').unoAlDia?.['${sara}']?.['${N}']`), 'al entrar, el de hoy sube a la historia');
let d = await db();
ok(d.records?.['uno-al-dia']?.[`d${N}`]?.[sara]?.s === d.unoAlDia[sara][N].s, 'y al ranking del día, con el puntaje de la historia');
ok(d.records?.['uno-al-dia-racha']?.siempre?.[sara]?.s === 1, 'y a la tabla de rachas');
ok(await esperar(`/^🧊 Si tu amigo termina/.test(document.getElementById('uad-inv-linea')?.textContent||'') && /Sara/.test(document.querySelector('#uad-tarjeta .rk-lista')?.innerText||'')`), 'y bajo el resultado, invitar ya no le pide entrar y el ranking la muestra');
await b.shot('sara-resultado');

/* ---------- /today/ con jugador: ranking e invitar ---------- */
await b.go(`${SITIO}/today/`, 1800);
ok(await esperar(`!!document.querySelector('.rk-ranking[data-tabla="uno-al-dia"]')`), '/today/ trae el ranking de Uno al día');
ok(await esperar(`/Sara/.test(document.querySelector('.rk-ranking[data-tabla="uno-al-dia"] .rk-lista')?.innerText||'')`), 'con Sara en "Hoy"');
const pestanas = await ev(`[...document.querySelectorAll('.rk-ranking[data-tabla="uno-al-dia"] .rk-seg button')].map(b=>b.textContent).join(' · ')`);
ok(pestanas === 'Hoy · Semana · Rachas · Amigos', `pestañas: ${pestanas}`);
await ev(`document.querySelector('.rk-ranking[data-tabla="uno-al-dia"] [data-p="rachas"]').click(); 1`);
ok(await esperar(`/🔥/.test(document.querySelector('.rk-ranking[data-tabla="uno-al-dia"] .rk-lista')?.innerText||'')`), 'Rachas muestra la racha con 🔥');
ok(/comodín/.test(await texto('#uad-invitar')), `invitar dice qué se gana (${(await texto('#uad-invitar')).replace(/\n/g, ' / ')})`);
ok(/salva tu racha el día que no juegas/.test(await texto('#uad-comodines-texto')) && /Tienes 0 de 2/.test(await texto('#uad-comodines-texto')), 'y los comodines dicen para qué sirven y cuántos tiene');
await click('#btn-uad-invitar');
await esperar(`window.__compartido.length > 0`, 20);
const inv = await ev(`window.__compartido[0]?.text || ''`);
ok(inv.includes(`today/?inv=${sara}`), `el mensaje lleva su link (${inv.replace(/\n/g, ' / ')})`);
ok(/Te desafío/.test(inv) && /¿Te atreves\?/.test(inv) && /primer Uno al día/.test(inv), 'en primera persona, con su dato');
ok(!/comodín/.test(inv), 'y sin decir nada del comodín');
await b.shot('sara-today');
// En otro idioma el link ya trae `?lang=`: el invitador tiene que ir como un parámetro más
await ev(`localStorage.setItem('juegos-de-salon:lang','de'); 1`);
await b.go(`${SITIO}/today/`, 1800);
await esperar(`!!document.getElementById('btn-uad-invitar')`);
await click('#btn-uad-invitar');
await esperar(`window.__compartido.length > 0`, 20);
const linkDe = (await ev(`window.__compartido[0]?.text || ''`)).match(/🔗 (\S+)/)?.[1] || '';
ok(new URL(linkDe || 'about:blank').searchParams.get('inv') === sara && new URL(linkDe || 'about:blank').searchParams.get('lang') === 'de', `en alemán, el link lleva idioma e invitador (${linkDe})`);
await ev(`localStorage.setItem('juegos-de-salon:lang','es'); 1`);

/* ---------- Pedro abre la invitación en otro celular ---------- */
await cambiarA('pedro', 'sara');
await b.go(`${SITIO}/today/?inv=${sara}`, 2000);
ok(await esperar(`!!document.getElementById('uad-desafio')`), 'Pedro ve la tarjeta del desafío antes del dado');
const des = await texto('#uad-desafio');
ok(/🔥 Sara te desafía/.test(des) && /Sara ya jugó su primer Uno al día\. ¿Te atreves\?/.test(des), `en tercera persona (${des.replace(/\n/g, ' / ')})`);
await b.shot('pedro-desafio');
ok(await jugar(), 'Pedro juega el mismo desafío');
ok(await esperar(`!!document.getElementById('uad-duelo')`), 'y ve el duelo');
ok(/^Tú \d+ · Sara \d+\. Mañana hay otro\.$/.test(await texto('#uad-duelo')), `"${await texto('#uad-duelo')}"`);
ok(await esperar(`Object.keys(JSON.parse(localStorage.getItem('${DB}')||'{}').invitados?.['${sara}']||{}).length === 1`), 'su primer Uno al día le da un comodín a Sara');
await b.shot('pedro-resultado');
await jugar();
d = await db();
ok(Object.keys(d.invitados[sara]).length === 1, 'jugar de nuevo no suma otro');

/* ---------- Sara vuelve ---------- */
await cambiarA('sara', 'pedro');
await b.go(`${SITIO}/today/`, 2200);
ok(await esperar(`/aceptó tu desafío: ganaste un comodín/.test(document.querySelector('[data-aviso="aceptado"]')?.innerText||'')`), `Sara ve que aceptaron su desafío (${await texto('[data-aviso="aceptado"]')})`);
ok(/🧊 1/.test(await texto('#uad-comodines')), 'y tiene un comodín');
await b.go(`${SITIO}/today/`, 2200);
ok(!await ev(`!!document.querySelector('[data-aviso="aceptado"]')`), 'el aviso sale una sola vez');
await b.shot('sara-comodin');

await b.close?.();
console.log(`Capturas en ${OUT}`);
