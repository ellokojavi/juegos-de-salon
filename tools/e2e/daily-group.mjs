// Uno al día (D-230) with the group games, end to end: El Ahorcado, Batalla Naval and Dudo with
// `?today`. For each one the clock is fixed on a day it is due, and it checks that it opens the
// one-player mode directly (without choosing a mode), that the intro carries the Uno al día line,
// that what is shared comes from the day's seed (the word, the phone's fleet, the dice), that at
// the end the 0 to 100 score of its formula is recorded and that the card goes above the game's
// buttons. Also, that a link to another game leads to today's, that the second attempt is
// practice and that /today/ names the game.
import { output as output } from './output.mjs';
import { launch, sleep } from './cdp.mjs';
import { COMMON } from '../../public/assets/js/i18n.js';
import { juegoDel as gameOf, sumarDias as addDays, LANZAMIENTO as LAUNCH, KEY, puntajeAhorcado as hangmanScore, puntajeNaval as battleshipScore, puntajeDudo as liarsDiceScore } from '../../public/assets/js/uno-al-dia.js';

const SITE = process.env.SITE || process.env.SITIO || 'http://localhost:8765';
const OUT = output();
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const U = COMMON.es.uad;

/** The first day each game is due: the script doesn't depend on dates written by hand. */
const dayOf = id => { for (let i = 0; i < 200; i++) { const f = addDays(LAUNCH, i); if (gameOf(f) === id) return f; } return null; };
const DAYS = { ahorcado: dayOf('ahorcado'), 'batalla-naval': dayOf('batalla-naval'), dudo: dayOf('dudo') };
ok(Object.values(DAYS).every(Boolean), `the three games come up in the deck (${JSON.stringify(DAYS)})`);

const b = await launch({ port: 9513, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true})()`);
const text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText || ''`);
const memory = () => ev(`JSON.parse(localStorage.getItem('${KEY}')||'{"dias":{}}')`);
const waitFor = async (cond, cap = 40) => { for (let i = 0; i < cap && !await ev(cond); i++) await sleep(250); return ev(cond); };
const screen = () => ev(`document.querySelector('.screen.active')?.id`);

// The clock of every page: noon of the day saved in `__reloj` (or today), and it runs from there
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(()=>{let f=null;try{f=localStorage.getItem('__reloj')}catch(_){}
  if(!f)return;const [y,m,d]=f.split('-').map(Number);const D=Date,dif=new D(y,m-1,d,12,0,0).getTime()-D.now();
  class F extends D{constructor(...a){a.length?super(...a):super(D.now()+dif)} static now(){return D.now()+dif}}
  window.Date=F;window.__compartido=[];navigator.share=async d=>{window.__compartido.push(d)};navigator.canShare=()=>true;})()` });

await b.go(`${SITE}/`, 600);
await ev(`(()=>{localStorage.clear();localStorage.setItem('juegos-de-salon:instalar:no','1');return 1})()`);
const clock = f => ev(`localStorage.setItem('__reloj','${f}'); 1`);

/** What the three intros share: no modes, the Uno al día line and a single button. */
async function intro(id, folder, extra) {
  await waitFor(`!!document.getElementById('btn-uad-jugar')`);
  ok(await ev(`location.pathname`) === `/${folder}/`, `${id}: opens /${folder}/?today`);
  ok(!await ev(`!!document.querySelector('#modes .mode')`), `${id}: doesn't ask to choose a mode`);
  const line = await text('#uad-intro');
  ok(line.includes(U.intro) && (!extra || line.includes(extra)), `${id}: the intro carries the Uno al día line ("${line}")`);
  ok((await text("#btn-uad-jugar")).trim().toLowerCase() === U.jugar.toLowerCase(), `${id}: a single button, "${U.jugar}"`);
}

/** What the endings share: the card above the game's buttons, and what was recorded. */
async function final(id, date, expected) {
  ok(await waitFor(`!!document.getElementById('uad-tarjeta')`, 60), `${id}: at the end, the Uno al día card`);
  ok(await ev(`document.getElementById('uad-tarjeta').previousElementSibling?.classList.contains('result-hero')`), `${id}: it goes right under the result's hero (C-19)`);
  ok(!await ev(`document.querySelectorAll('#result-actions .btn').length`), `${id}: no buttons of the game's own (#226, C-19): the card carries them`);
  ok(await ev(`!!document.querySelector('#uad-tarjeta #btn-fin-hoy') && !document.querySelector('#btn-fin-menu')`), `${id}: the card offers back to One a Day, and the menu is the header's (C-19)`);
  const m = await memory();
  const d = m.dias[date];
  ok(d?.j === id && d.n === 1, `${id}: it stays recorded on the phone (${JSON.stringify(d)})`);
  ok(d?.s === expected && d.s >= 0 && d.s <= 100, `${id}: the score is its formula's, from 0 to 100 (${d?.s}, expected ${expected})`);
  const t = await text('#uad-tarjeta');
  ok(/Racha: 1 día/.test(t) && !/Hoy: \d+ puntos/.test(t), `${id}: the card says the streak, without repeating the score (C-19) (${t.replace(/\n/g, ' / ')})`);
  await b.shot(`${id}-result`);
}

/* ---------- A link to another game leads to today's ---------- */
await clock(DAYS.dudo);
await b.go(`${SITE}/hangman/?today`, 1500);
ok(await waitFor(`location.pathname === '/liars-dice/'`), `${DAYS.dudo} is Dudo's day: /hangman/?today goes to /liars-dice/?today`);
await b.go(`${SITE}/queens/?today`, 1500);
ok(await waitFor(`location.pathname === '/liars-dice/'`), "and a solo game also goes to today's");

/* ---------- El Ahorcado ---------- */
{
  const f = DAYS.ahorcado;
  await clock(f);
  await b.go(`${SITE}/hangman/?today`, 1500);
  await intro('ahorcado', 'hangman');
  await b.shot('ahorcado-intro');
  const play = async mistakes => {
    await click('#btn-uad-jugar');
    await waitFor(`window.__ahorcado.view()?.phase === 'play'`);
    const word = await ev(`window.__ahorcado.view().words.A`);
    const cfg = await ev(`JSON.stringify(window.__ahorcado.match().config)`).then(JSON.parse);
    // First the mistakes (letters that aren't in it), then the missing ones, one at a time
    const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    const letters = [...new Set(plain(word).replace(/[^A-ZÑ]/g, ''))];
    const absent = [...'QWXZKJYVHF'].filter(l => !letters.includes(l)).slice(0, mistakes);
    for (const l of [...absent, ...letters]) {
      await ev(`(()=>{const S=window.__ahorcado.session(),M=window.__ahorcado.match();S.transport.send({t:'guess',from:'A',letter:'${l}',n:M.plays.filter(p=>p.from==='A').length,ms:500});return 1})()`);
      await sleep(80);
    }
    await waitFor(`document.querySelector('.screen.active')?.id === 'screen-result'`, 60);
    return { word, cfg };
  };
  const { word, cfg } = await play(2);
  ok(cfg.source === 'deck' && cfg.players?.length === 1, `ahorcado: with the phone's deck and 1 player (${cfg.source}, ${cfg.players})`);
  await final('ahorcado', f, hangmanScore({ vidas: cfg.lives - 2, total: cfg.lives }));
  // The second attempt: the same word (it comes from the day's seed) and it is practice
  await b.go(`${SITE}/hangman/?today`, 1500);
  await waitFor(`!!document.getElementById('btn-uad-jugar')`);
  ok(/práctica/.test(await text('#uad-intro')), "ahorcado: a second attempt's intro warns it is practice");
  const again = await play(0);
  ok(again.word === word, `ahorcado: the day's word is the same on coming back (${word})`);
  ok(await waitFor(`/práctica/.test(document.getElementById('uad-tarjeta')?.innerText||'')`), 'ahorcado: the second attempt says it was practice');
  const m = await memory();
  ok(m.dias[f].n === 2 && m.dias[f].s === hangmanScore({ vidas: cfg.lives - 2, total: cfg.lives }), "ahorcado: and the day's result stays the first one's");
}

/* ---------- Batalla Naval ---------- */
{
  const f = DAYS['batalla-naval'];
  await clock(f);
  await b.go(`${SITE}/battleship/?today`, 1500);
  await intro('batalla-naval', 'battleship', U.mismaFlota);
  await click('#btn-uad-jugar');
  await waitFor(`document.querySelector('.screen.active')?.id === 'screen-place'`);
  ok(await ev(`window.__bn.session().mode`) === 'cpu', 'batalla-naval: against the phone');
  await ev(`[...document.querySelectorAll('#place-actions .btn')].find(b=>/azar/i.test(b.textContent)).click(); 1`);
  await sleep(300);
  await ev(`document.querySelector('#place-sail .btn').click(); 1`);
  await waitFor(`window.__bn.view()?.phase === 'play'`);
  // The phone's fleet is the one from the day's seed
  const same = await ev(`(async()=>{const u=await import('/assets/js/uno-al-dia.js'),e=await import('/battleship/engine.js');
    const L=e.randomLayout(10,u.azarDel(u.semillaDel('${f}'),'flota'));return e.layoutKey(L)===e.layoutKey(window.__bn.session().layouts.B.layout)})()`);
  ok(same, "batalla-naval: the phone's fleet comes from the day's seed");
  // It is sunk entirely: one shot at each ship cell, on the player's turn
  const cells = await ev(`(()=>{const L=__bn.session().layouts.B.layout,T={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2},o=[];
    for(const [id,p] of Object.entries(L))for(let i=0;i<T[id];i++)o.push('ABCDEFGHIJ'[p.dir==='h'?p.c+i:p.c]+((p.dir==='h'?p.r:p.r+i)+1));return JSON.stringify(o)})()`).then(JSON.parse);
  const water = await ev(`(()=>{const L=__bn.session().layouts.B.layout,T={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2},o=new Set();
    for(const [id,p] of Object.entries(L))for(let i=0;i<T[id];i++)o.add('ABCDEFGHIJ'[p.dir==='h'?p.c+i:p.c]+((p.dir==='h'?p.r:p.r+i)+1));
    for(let r=1;r<=10;r++)for(const c of 'ABCDEFGHIJ')if(!o.has(c+r))return c+r})()`);
  const queue = [water, ...cells];   // a miss first, so the score isn't the maximum
  for (let i = 0; i < 400 && queue.length && (await screen()) !== 'screen-result'; i++) {
    const turn = await ev(`(()=>{const v=__bn.view();return v.phase==='play'&&v.shooter==='A'&&!v.pending})()`);
    if (turn) { await ev(`__bn.session().transport.send({t:'shot',from:'A',cell:'${queue.shift()}'}); 1`); }
    // Each shot's banners close with a tap
    await ev(`(()=>{const h=document.getElementById('handoff');if(!h.hidden){const b=h.querySelector('.btn');b?b.click():h.click()}return 1})()`);
    await sleep(150);
  }
  const mine = await ev(`JSON.stringify(__bn.match().shots.filter(s=>s.from==='A'&&s.result!==null).map(s=>s.result))`).then(JSON.parse);
  const won = await ev(`__bn.view().winner`) === 'A';
  ok(won, `batalla-naval: the player sinks it with ${mine.length} shots`);
  await final('batalla-naval', f, battleshipScore({ gano: won, disparos: mine.length, aciertos: mine.filter(r => r !== 'agua').length }));
}

/* ---------- Dudo ---------- */
{
  const f = DAYS.dudo;
  await clock(f);
  await b.go(`${SITE}/liars-dice/?today`, 1500);
  await intro('dudo', 'liars-dice', U.mismosDados);
  await b.shot('dudo-intro');
  await click('#btn-uad-jugar');
  await waitFor(`window.__dudo.view()?.phase === 'bid'`);
  const s = await ev(`JSON.stringify({mode:__dudo.session().mode,players:__dudo.match().players})`).then(JSON.parse);
  ok(s.mode === 'cpu' && s.players.length === 2, `dudo: against the phone, one rival (${s.mode}, ${s.players})`);
  // The first round's dice come from the day's seed, the round and the role
  const dice = await ev(`(async()=>{const u=await import('/assets/js/uno-al-dia.js');const v=__dudo.view();
    const roll=role=>{const r=u.azarDel(u.semillaDel('${f}'),'dudo:0:'+role);return Array.from({length:5},()=>1+Math.floor(r()*6)).join(',')};
    return JSON.stringify({A:v.rolls.A.d.join(','),B:v.rolls.B.d.join(','),eA:roll('A'),eB:roll('B')})})()`).then(JSON.parse);
  ok(dice.A === dice.eA && dice.B === dice.eB, `dudo: the first round's dice come from the day's seed (${dice.A} · ${dice.B})`);
  for (let i = 0; i < 300 && (await screen()) !== 'screen-result'; i++) {
    const h = await ev(`(()=>{const h=document.getElementById('handoff');if(h.hidden)return 0;const b=h.querySelector('.btn');b?b.click():h.click();return 1})()`);
    if (!h) {
      // A low bid and, if there is one standing already, dudo: the game moves along by itself
      await ev(`(()=>{const v=__dudo.view();if(v.phase!=='bid'||v.current!=='A')return 0;const S=__dudo.session();
        S.transport.send(v.bid?{t:'dudo',from:'A'}:{t:'bid',from:'A',n:1,p:2});return 1})()`);
    }
    await sleep(250);
  }
  const v = await ev(`JSON.stringify((()=>{const v=__dudo.view();return {winner:v.winner,dice:v.st.A.dice,rounds:v.history.length}})())`).then(JSON.parse);
  const won = v.winner === 'A';
  ok(v.winner, `dudo: the game ends (the player ${won ? 'wins' : 'loses'} in ${v.rounds} rounds)`);
  await final('dudo', f, liarsDiceScore({ gano: won, dados: v.dice, rondas: won ? v.rounds : v.rounds - 1 }));
  // /today/ names the group game
  await b.go(`${SITE}/today/`, 1500);
  await waitFor(`!!document.getElementById('uad-hoy')`);
  ok(/Dudo/.test(await text('#uad-hoy')), `/today/: today you played Dudo (${(await text('#uad-hoy')).replace(/\n/g, ' / ')})`);
  ok(!/undefined|NaN|\{\w+\}/.test(await ev('document.body.innerText')), '/today/: no half-built texts');
}

/* ---------- The die names the group ones ---------- */
{
  await clock(DAYS.ahorcado);
  await ev(`localStorage.removeItem('${KEY}'); 1`);
  await b.go(`${SITE}/`, 1500);
  await waitFor(`!!document.getElementById('btn-uad-abrir')`);
  await click('#btn-uad-abrir, button#btn-uno-al-dia');
  // The card opens Uno al día (D-414); its Jugar rolls the die
  await waitFor(`!!document.getElementById('btn-uad-jugar')`, 12);
  await click('#btn-uad-jugar');
  ok(await waitFor(`/Hoy te toca/.test(document.querySelector('.azar-nombre')?.innerText||'')`, 16) && /El Ahorcado/.test(await text('.azar-nombre')), `the die lands on El Ahorcado (${(await text('.azar-nombre')).replace(/\n/g, ' ')})`);
  ok(await waitFor(`location.pathname === '/hangman/' && location.search === '?today'`, 20), 'and opens /hangman/?today');
}

const errors = b.errors || [];
if (errors.length) ok(false, `page errors: ${errors.join(' | ')}`);
await b.close?.();
console.log(`Screenshots in ${OUT}`);
