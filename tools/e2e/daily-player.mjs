// Uno al día with a player (D-230), end to end and with the test store (the local site doesn't
// write to Firebase): Sara plays today's, signs in with name and PIN and her day goes up to the
// history and the rankings (the day's, the week's and streaks'); she invites a friend and the
// text carries her link; Pedro, on "another phone", opens the invitation, sees "🔥 Sara te
// desafía", plays the same challenge, sees the duel and gives Sara a wildcard, which she sees when
// she comes back. The clock is fixed on October 6, 2026, day no. 1, when Desenredo is due.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { juegoDel as gameOf, numDia as dayNumber } from '../../public/assets/js/uno-al-dia.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const TODAY = '2026-10-06', N = dayNumber(TODAY), DB = 'juegos-de-salon:prueba:records-db';
if (gameOf(TODAY) !== 'desenredo') { console.log(`✗ ${TODAY} no longer gets Desenredo: change the script's date`); process.exit(1); }

const b = await launch({ port: 9521, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const db = () => ev(`JSON.parse(localStorage.getItem('${DB}')||'{}')`);

await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{const D=Date,dif=new D(2026,9,6,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;})()` });

/** Plays today's up to the result (Desenredo's clock, shortened, runs out). */
const play = async (extra = '') => {
  await b.go(`${SITE}/untangle/?today&test&timer=3${extra}`, 1200);
  await waitFor(`!!document.getElementById('btn-empezar')`);
  await click('#btn-empezar');
  await waitFor(`!!document.getElementById('btn-fin')`, 80);
  await click('#btn-fin');
  return waitFor(`!!document.getElementById('uad-tarjeta')`, 20);
};
/** Switches "phone": everything of the current one is saved and only the shared test database stays. */
const phones = {};
const switchTo = async (who, from) => {
  if (from) phones[from] = await ev(`JSON.stringify(Object.fromEntries(Object.entries(localStorage)))`);
  await ev(`(()=>{const db=localStorage.getItem('${DB}');localStorage.clear();if(db)localStorage.setItem('${DB}',db);
    localStorage.setItem('juegos-de-salon:instalar:no','1');
    const g=${JSON.stringify(phones[who] || null)};if(g){const o=JSON.parse(g);for(const [k,v] of Object.entries(o)) if(k!=='${DB}') localStorage.setItem(k,v)}return 1})()`);
};

/* ---------- Sara plays and signs in ---------- */
await b.go(`${SITE}/`, 600);
await ev(`localStorage.clear(); 1`);
await switchTo('sara');
ok(await play(), "Sara plays today's");
ok(await waitFor(`!!document.getElementById('uad-entrar')`), 'without a player, the card offers to save the streak with name and PIN');
ok(/Guarda tu racha/.test(await text('#uad-entrar')), `"${(await text('#uad-entrar')).split('\n')[0]}"`);
await ev(`(async()=>{const J=await (await import('/assets/js/jugador.js')).jugador();await J.crear('Sara','1111');return 1})()`);
const sara = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:jugador')).jid`);
ok(await waitFor(`!!JSON.parse(localStorage.getItem('${DB}')||'{}').unoAlDia?.['${sara}']?.['${N}']`), "on signing in, today's goes up to the history");
let d = await db();
ok(d.records?.['uno-al-dia']?.[`d${N}`]?.[sara]?.s === d.unoAlDia[sara][N].s, "and to the day's ranking, with the history's score");
ok(d.records?.['uno-al-dia-racha']?.siempre?.[sara]?.s === 1, 'and to the streaks table');
ok(await waitFor(`/^🧊 Si tu amigo termina/.test(document.getElementById('uad-inv-linea')?.textContent||'') && /Sara/.test(document.querySelector('#uad-tarjeta .rk-lista')?.innerText||'')`), 'and under the result, inviting no longer asks to sign in and the ranking shows her');
// The month's points come first, the same table /records/ and /today/ show (D-412, D-414)
ok(await ev(`document.querySelector('#uad-tarjeta .rk-seg button')?.dataset.p`) === 'mes', "Uno al día's ranking opens on the month's points");
ok(await waitFor(`!!JSON.parse(localStorage.getItem('${DB}')||'{}').records?.['uno-al-dia-pts']`), 'and signing in adds today to the month points table');
await b.shot('sara-result');

/* ---------- /today/ with a player: ranking and invite ---------- */
await b.go(`${SITE}/today/`, 1800);
ok(await waitFor(`!!document.querySelector('.rk-ranking[data-tabla="uno-al-dia"]')`), "/today/ brings Uno al día's ranking");
ok(await waitFor(`/Sara/.test(document.querySelector('.rk-ranking[data-tabla="uno-al-dia"] .rk-lista')?.innerText||'')`), 'with Sara in "Mes"');
const tabs = await ev(`[...document.querySelectorAll('.rk-ranking[data-tabla="uno-al-dia"] .rk-seg button')].map(b=>b.textContent).join(' · ')`);
ok(tabs === 'Mes · Hoy · Rachas · Amigos', `tabs: ${tabs}`);
ok(await waitFor(`/#1 del mes/.test(document.getElementById('uad-puntos')?.innerText||'')`), `the season box says her place (${(await text('#uad-puntos')).replace(/\n/g, ' · ')})`);
await ev(`document.querySelector('.rk-ranking[data-tabla="uno-al-dia"] [data-p="rachas"]').click(); 1`);
ok(await waitFor(`/🔥/.test(document.querySelector('.rk-ranking[data-tabla="uno-al-dia"] .rk-lista')?.innerText||'')`), 'Rachas shows the streak with 🔥');
ok(/comodín/.test(await text('#uad-invitar')), `inviting says what you win (${(await text('#uad-invitar')).replace(/\n/g, ' / ')})`);
ok(/salva tu racha el día que no juegas/.test(await text('#uad-comodines-texto')) && /Comodines: 0 de 2/.test(await text('#uad-invitar')), 'and the wildcards say what they are for and how many she has');
await click('#btn-uad-invitar');
await waitFor(`window.__compartido.length > 0`, 20);
const inv = await ev(`window.__compartido[0]?.text || ''`);
ok(inv.includes(`today/?inv=${sara}`), `the message carries her link (${inv.replace(/\n/g, ' / ')})`);
ok(/Te desafío/.test(inv) && /¿Te atreves\?/.test(inv) && /primer Uno al día/.test(inv), 'in the first person, with her fact');
ok(!/comodín/.test(inv), 'and without saying anything about the wildcard');
await b.shot('sara-today');
// In another language the link already brings `?lang=`: the inviter has to go as one more parameter
await ev(`localStorage.setItem('juegos-de-salon:lang','de'); 1`);
await b.go(`${SITE}/today/`, 1800);
await waitFor(`!!document.getElementById('btn-uad-invitar')`);
await click('#btn-uad-invitar');
await waitFor(`window.__compartido.length > 0`, 20);
const linkDe = (await ev(`window.__compartido[0]?.text || ''`)).match(/🔗 (\S+)/)?.[1] || '';
ok(new URL(linkDe || 'about:blank').searchParams.get('inv') === sara && new URL(linkDe || 'about:blank').searchParams.get('lang') === 'de', `in German, the link carries language and inviter (${linkDe})`);
await ev(`localStorage.setItem('juegos-de-salon:lang','es'); 1`);

/* ---------- Pedro opens the invitation on another phone ---------- */
await switchTo('pedro', 'sara');
await b.go(`${SITE}/today/?inv=${sara}`, 2000);
ok(await waitFor(`!!document.getElementById('uad-desafio')`), "Pedro sees the challenge card before the die");
const challenge = await text('#uad-desafio');
ok(/🔥 Sara te desafía/.test(challenge) && /Sara ya jugó su primer Uno al día\. ¿Te atreves\?/.test(challenge), `in the third person (${challenge.replace(/\n/g, ' / ')})`);
await b.shot('pedro-challenge');
ok(await play(), 'Pedro plays the same challenge');
ok(await waitFor(`!!document.getElementById('uad-duelo')`), 'and sees the duel');
ok(/^Tú \d+ · Sara \d+\. Mañana hay otro\.$/.test(await text('#uad-duelo')), `"${await text('#uad-duelo')}"`);
ok(await waitFor(`Object.keys(JSON.parse(localStorage.getItem('${DB}')||'{}').invitados?.['${sara}']||{}).length === 1`), 'his first Uno al día gives Sara a wildcard');
await b.shot('pedro-result');
await play();
d = await db();
ok(Object.keys(d.invitados[sara]).length === 1, "playing again doesn't add another");

/* ---------- Sara comes back ---------- */
await switchTo('sara', 'pedro');
await b.go(`${SITE}/today/`, 2200);
ok(await waitFor(`/aceptó tu desafío: ganaste un comodín/.test(document.querySelector('[data-aviso="aceptado"]')?.innerText||'')`), `Sara sees her challenge was accepted (${await text('[data-aviso="aceptado"]')})`);
ok(/🧊 1/.test(await text('#uad-comodines')), 'and has a wildcard');
await b.go(`${SITE}/today/`, 2200);
ok(!await ev(`!!document.querySelector('[data-aviso="aceptado"]')`), 'the notice shows only once');
await b.shot('sara-wildcard');

/* ---------- Uno al día points (D-412, D-414): the same ranking in /records/ and on /today/ ---------- */
await b.go(`${SITE}/records/?test`, 1500);
ok(await waitFor(`/Sara/.test(document.querySelector('[data-tabla="uno-al-dia-pts"] .rk-lista')?.innerText||'')`), "/records/ shows Uno al día's month points, with Sara");
await b.go(`${SITE}/today/?test`, 1800);
ok(await waitFor(`/Sara/.test(document.querySelector('.rk-ranking[data-tabla="uno-al-dia"] .rk-lista')?.innerText||'') && /#1 del mes/.test(document.getElementById('uad-puntos')?.innerText||'')`), `/today/ shows the same ranking and her place (${(await text('#uad-puntos')).replace(/\n/g, ' · ')})`);
await b.shot('daily-points');
const dayCell = `document.querySelector('#uad-cal button.l1, #uad-cal button.l2, #uad-cal button.l3')`;
await ev(`${dayCell}?.click(); 1`);
ok(await waitFor(`document.getElementById('uad-dia')?.previousElementSibling?.previousElementSibling?.classList.contains('uad-cal') && /Sumó/.test(document.getElementById('uad-dia').innerText)`), `a tap on a calendar day shows its details right under the grid (${(await text('#uad-dia')).replace(/\n/g, ' · ')})`);
await b.shot('daily-points-day');
await ev(`${dayCell}?.click(); 1`);
ok(await waitFor(`!document.getElementById('uad-dia')`), 'a second tap on the same day closes it');

await b.close?.();
console.log(`Screenshots in ${OUT}`);
