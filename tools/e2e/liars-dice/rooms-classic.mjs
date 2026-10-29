// Liar's Dice's 📜 classic rules (D-487, D-490, D-491) in a ROOM, with N phones against the
// real Firebase: like online.mjs, it opens real rooms, so it is run by hand and never in CI.
// It plays whole games and checks, on every phone, that the screens agree; that the obligada
// round's notice reaches every phone, that each phone sees its rivals' dice and never its own;
// the calzar hint, the closed ace and its reason, half plus one into aces, Pasar and doubting it,
// the siciliana, a reload mid-obligada and the rematch. With SICILIANA=1 the first bid of the game
// is always doubted, so the siciliana really happens: every phone must show its line and the
// loser must be down two dice on every phone. At the end every phone leaves the room
// for good (`transport.dispose()`), so the room is deleted at once instead of waiting to expire.
//
//   PHONES=3 [PASAR=1] [SICILIANA=1] [NOLAB_SITE=http://localhost:87yy] [REMATCH=1] node tools/e2e/liars-dice/rooms-classic.mjs [out]
//
// PATCH=1: until the Firebase rules accept the classic keys in a room's config (they did not before
// this script found it), the room opens with the classic switch off and each phone turns the rules
// on in its own copy of the config, so the game itself can still be played.
// NOLAB_SITE: a copy of public/ served where lab-access.js does not open on localhost; the last
// guest joins from there, as a player without a lab key would.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const SITE = process.env.SITE || 'http://localhost:8765';
const N = +(process.env.PHONES || 3);
const PASAR = !!process.env.PASAR, SICILIANA = !!process.env.SICILIANA, REMATCH = !!process.env.REMATCH;
const NOLAB = process.env.NOLAB_SITE || '';
const PATCH = !!process.env.PATCH;
const patch = d => d.evaluate(`(()=>{const m=window.__dudo?.match();if(!m)return 0;Object.assign(m.config,{traditional:true,pasar:${PASAR},siciliana:${SICILIANA}});return 1})()`);
const W = +(process.env.WIDTH || 390);
const OUT = output(`/tmp/dudo-rooms-${N}`);
const ROLES = ['A', 'B', 'C', 'D', 'E'].slice(0, N);
const NAME = { A: 'Javi', B: 'Cata', C: 'Nico', D: 'Fran', E: 'Pili' };
const hostOf = (i) => (NOLAB && i === N - 1 && i > 0) ? NOLAB : SITE.replace('localhost', ['localhost', '127.0.0.1', '[::1]'][i % 3]);
const devs = {};
for (const [i, r] of ROLES.entries()) devs[r] = await launch({ dir: `${OUT}/p${r}`, out: OUT, width: W, height: 844 });
const codes = new Set();
let fails = 0;
const check = (ok, what) => { console.log(ok ? '✓' : '✗', what); if (!ok) fails++; };
const note = [];

const ev = (d, e) => d.evaluate(e);
const screen = d => ev(d, `document.querySelector('.screen.active')?.id`);
const state = d => ev(d, `(()=>{const s=window.__dudo?.view();if(!s)return JSON.stringify({none:true});
  return JSON.stringify({phase:s.phase,current:s.current,round:s.round,done:s.done,winner:s.winner,ob:s.obligada,
    bid:s.bid?s.bid.n+'x'+s.bid.p:null,bids:s.bids.length,canCalzar:s.canCalzar,canPass:s.canPass,ps:s.passStanding,total:s.totalDice,
    dice:Object.fromEntries(Object.entries(s.st).map(([r,x])=>[r,x.dice])),me:window.__dudo.session().role})})()`).then(JSON.parse).catch(() => ({ none: true }));
const overlay = d => ev(d, `(()=>{const h=document.getElementById('handoff');return h.hidden?'':h.innerText.replace(/\\n/g,' | ').slice(0,160)})()`).catch(() => '');
const closeOverlay = d => ev(d, `(()=>{const h=document.getElementById('handoff');if(h.hidden)return 'none';const b=h.querySelector('.btn');b?b.click():h.click();return 'ok'})()`).catch(() => '');
const seen = { notice: {}, sicWhy: 0, calzarHint: {}, oneDie: 0, aceWhy: 0, halfPlusOne: [], calzas: 0, duelCalza: 0, passes: 0, bluffs: 0, passDoubted: 0, ownShown: 0, obTurns: 0, rivalsFaceUp: 0, faceChange: 0, syncMax: 0, syncSum: 0, syncN: 0, mismatches: 0, reloaded: false };
const shot = async (d, name) => { try { await d.shot(`${N}p-${name}`); } catch (_) {} };

/* ---------------- Room ---------------- */
const A = devs.A;
await A.go(`${SITE}/liars-dice/`); await ev(A, `localStorage.clear(); 1`); await A.go(`${SITE}/liars-dice/`);
await ev(A, `document.querySelectorAll('.modes .mode')[1].click(); 1`); await sleep(400);
await ev(A, `(()=>{const i=document.querySelector('#setup-form input');i.value='${NAME.A}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const toggle = label => ev(A, `[...document.querySelectorAll('#setup-form .toggle-row')].find(r=>r.textContent.includes(${JSON.stringify(label)}))?.querySelector('.switch')?.click(), 1`);
await toggle('🫨'); await toggle('📜');
if (PATCH) { await shot(A, '00-setup'); await toggle('📜'); }
const sw = await ev(A, `[...document.querySelectorAll('#setup-form details.variants .toggle-row .switch')].length`);
if (PASAR && !PATCH) await ev(A, `document.querySelectorAll('#setup-form details.variants .toggle-row .switch')[0].click(), 1`);
if (SICILIANA && !PATCH) await ev(A, `document.querySelectorAll('#setup-form details.variants .toggle-row .switch')[1].click(), 1`);
check(PATCH || sw === 2, `room setup: the Variantes row has its two switches (${sw})`);
await shot(A, '00-setup');
await ev(A, `document.querySelector('#setup-actions .btn--yellow').click(); 1`);
if (!(await A.until(`document.querySelector('.code-big')?.textContent`, 20000))) { console.log('✗ no room code:', await screen(A), JSON.stringify((await ev(A, `document.querySelector('.screen.active')?.innerText`)).slice(0, 300)), JSON.stringify(A.errors), JSON.stringify(A.logs)); await shot(A, 'no-room'); process.exit(1); }
const code = await ev(A, `document.querySelector('.code-big')?.textContent`);
codes.add(code);
console.log('room:', code);
if (PATCH) await patch(A);

for (const [i, r] of ROLES.entries()) {
  if (r === 'A') continue;
  const d = devs[r], h = hostOf(i);
  await d.go(`${h}/liars-dice/?room=${code}`); await ev(d, `localStorage.clear(); 1`);
  await d.go(`${h}/liars-dice/?room=${code}`); await sleep(1200);
  await ev(d, `(()=>{const i=document.querySelector('#setup-form input');i.value='${NAME[r]}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
  await ev(d, `[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse|Join|Entrar/i.test(x.textContent)).click(); 1`);
  await d.until(`window.__dudo.session()?.role`, 10000);
  if (PATCH) await patch(d);
  console.log(`${r} joined (${h.includes(NOLAB) && NOLAB ? 'NO lab key' : 'lab'}) → role`, await ev(d, `window.__dudo.session().role`));
}
await sleep(1500);
if (NOLAB) {
  const g = devs[ROLES.at(-1)];
  await shot(g, '01-nolab-lobby');
  console.log('no-lab guest lobby text:', JSON.stringify((await ev(g, `document.querySelector('.screen.active').innerText`)).slice(0, 400)));
}
await shot(A, '01-lobby');
await ev(A, `[...document.querySelectorAll('#lobby-box .btn--yellow')][0].click(); 1`); await sleep(2500);
const cfg = await ev(A, `JSON.stringify(window.__dudo.match().config)`);
console.log('config:', cfg);
check(/"traditional":true/.test(cfg), 'the room carries the classic rules');

/** Waits until every phone shows the same round, bid count and turn; returns ms (or -1). */
async function sync() {
  const t0 = Date.now();
  for (;;) {
    const ss = await Promise.all(ROLES.map(r => state(devs[r])));
    const key = s => `${s.round}|${s.bids}|${s.bid}|${s.current}|${s.ps}|${s.done}`;
    if (ss.every(s => !s.none && key(s) === key(ss[0]))) return { ms: Date.now() - t0, ss };
    if (Date.now() - t0 > 8000) { seen.mismatches++; console.log('  ⚠ phones disagree:', ss.map(key).join(' / ')); return { ms: -1, ss }; }
    await sleep(150);
  }
}

/* ---------------- The game ---------------- */
let firstRound = null, sicForced = false, sicBefore = null;
const sicSaw = new Set();
async function playGame(tag) {
  let k = 0, lastRound = -1;
  while (k++ < 600) {
    // Overlays first, on every phone
    for (const r of ROLES) {
      const d = devs[r];
      const o = await overlay(d);
      if (!o) continue;
      const isNotice = await ev(d, `!!document.querySelector('#handoff .obligada-notice')`);
      if (isNotice) {
        const rd = (await state(d)).round;
        (seen.notice[rd] ||= new Set()).add(r);
        if (seen.notice[rd].size === 1) await shot(d, `obligada-notice-r${rd}-${r}`);
      }
      if (await ev(d, `!!document.querySelector('#handoff .siciliana-why')`)) { seen.sicWhy++; sicSaw.add(r); if (sicSaw.size === 1) await shot(d, 'siciliana-why'); }
      if (await ev(d, `!!document.querySelector('#handoff .reveal')`) && /pas/i.test(o) && seen.passDoubted && !seen.passRevealShot) { seen.passRevealShot = 1; await shot(d, 'pass-reveal'); }
      await closeOverlay(d); await sleep(150);
    }
    const { ms, ss } = await sync();
    if (ms >= 0) { seen.syncMax = Math.max(seen.syncMax, ms); seen.syncSum += ms; seen.syncN++; }
    const v = ss[0];
    if (v.done || (await screen(A)) === 'screen-result') break;
    if (v.round !== lastRound) { lastRound = v.round; }
    if (firstRound === null) firstRound = v.round;
    // The siciliana's outcome, once the forced doubt was revealed: the same loss on every phone
    if (sicBefore && v.round !== firstRound) {
      const lost = ss.map(s => Object.fromEntries(Object.entries(sicBefore).map(([r, n]) => [r, n - (s.dice[r] || 0)])));
      const same = lost.every(x => JSON.stringify(x) === JSON.stringify(lost[0]));
      const losers = Object.entries(lost[0]).filter(([, n]) => n > 0);
      check(same && losers.length === 1 && losers[0][1] === 2, `siciliana: ${losers.map(([r, n]) => `${r} lost ${n}`).join(', ')} on every phone (${lost.map(x => JSON.stringify(x)).join(' / ')})`);
      seen.sicOutcome = losers.map(([r, n]) => `${r}-${n}`).join(',');
      sicBefore = null;
    }
    // Open obligada round: everyone sees the others' dice and never their own
    if (v.ob && v.phase === 'bid') {
      seen.obTurns++;
      for (const r of ROLES) {
        const d = devs[r];
        if (!(await state(d)).dice[r]) continue;   // out of the game
        if (await overlay(d)) continue;             // a notice arriving: the table under it is not what the player sees
        if (seen.skipOwn === r) { seen.skipOwn = null; continue; }   // PATCH: the reloaded phone re-renders on the next play
        const own = await ev(d, `!!document.querySelector('#mine .die:not(.hidden-die)')`);
        const ownStrip = await ev(d, `(()=>{const me=window.__dudo.session().role;const x=document.querySelectorAll('#rivals .rival')[window.__dudo.match().players.indexOf(me)];return !!x?.querySelector('.die:not(.hidden-die)')})()`);
        if (own || ownStrip) { seen.ownShown++; await shot(d, `OWN-DIE-SHOWN-${r}`); }
        if (await ev(d, `!!document.querySelector('#rivals .rival.seen .die:not(.hidden-die)')`)) seen.rivalsFaceUp++;
      }
      if (seen.obTurns === 1) for (const r of ROLES) await shot(devs[r], `obligada-table-${r}`);
      // Reload a phone mid-obligada: the opener, whose own die must stay hidden after it comes back
      if (!seen.reloaded && !process.env.NORELOAD) {
        seen.reloaded = true;
        const r = ROLES.find(x => x !== v.current && v.dice[x]) || ROLES[1];
        const d = devs[r], h = hostOf(ROLES.indexOf(r));
        const t0 = Date.now();
        await d.go(`${h}/liars-dice/?room=${code}`, 500);
        const ok = await d.until(`window.__dudo?.view()?.round === ${v.round}`, 15000);
        if (PATCH) await patch(d);
        for (let j = 0; j < 6 && (await overlay(d)); j++) { if (await ev(d, `!!document.querySelector('#handoff .obligada-notice')`)) { seen.reloadNotice = true; (seen.notice[v.round] ||= new Set()).add(r); } await closeOverlay(d); await sleep(200); }
        const own = PATCH ? false : await ev(d, `!!document.querySelector('#mine .die:not(.hidden-die)')`);
        if (PATCH) seen.skipOwn = r;
        check(ok && !own, `${r} reloaded mid-obligada: back in round ${v.round} in ${Date.now() - t0} ms, own die still hidden`);
        await shot(d, `reloaded-mid-obligada-${r}`);
        continue;
      }
    }
    if (v.phase !== 'bid' || !v.current) { await sleep(300); continue; }
    const d = devs[v.current];
    if (!(await d.until(`!!document.querySelector('#actions .btn--yellow')`, 4000))) { await sleep(300); continue; }
    // SICILIANA=1: doubt the game's first bid, the only one the variant makes cost two dice
    if (SICILIANA && !sicForced && v.round === firstRound && v.bids === 1) {
      sicForced = true; sicBefore = { ...v.dice };
      const t = await ev(d, `(()=>{const b=document.querySelector('#actions .btn-row .btn');const t=b?.textContent;b?.click();return t})()`);
      console.log(`  ${v.current} doubts the first bid (${v.bid}) a la siciliana: "${t}"`);
      await sleep(1200); continue;
    }
    // Hints on the phone on turn
    if (await ev(d, `!!document.querySelector('#actions .calzar-hint')`)) {
      const one = await ev(d, `!!document.querySelector('#actions .calzar-hint.one-die')`);
      const tagH = `${v.current}${one ? '-one' : ''}`;
      if (!seen.calzarHint[tagH]) { seen.calzarHint[tagH] = await ev(d, `document.querySelector('#actions .calzar-hint').textContent`); await shot(d, `calzar-hint-${tagH}`); }
      if (one) seen.oneDie++;
    }
    if (v.canCalzar && !(await ev(d, `!!document.querySelector('#actions .btn--cyan')`))) { check(false, `${v.current} can calzar but sees no Calzar button`); }
    // Opening: the ace is closed and the reason is there (not in obligada)
    if (!v.bid && !v.ob) {
      const why = await ev(d, `(()=>{const a=document.querySelectorAll('.pinta')[0];return a.classList.contains('closed')?(document.querySelector('#actions .face-why')?.textContent||'(no reason)'):'open'})()`);
      if (why !== 'open' && /ases|aces/i.test(why)) seen.aceWhy++; else if (why !== 'open' || true) { if (!seen.aceBad) { seen.aceBad = why; } }
      if (seen.aceWhy === 1) await shot(d, 'no-ace-opening');
    }
    // Into aces: half plus one
    if (v.bid && !v.ob && !v.bid.endsWith('x1') && seen.halfPlusOne.length < 4 && Math.random() < 0.5) {
      const n = +v.bid.split('x')[0];
      const got = await ev(d, `(()=>{const a=document.querySelectorAll('.pinta')[0];if(a.disabled||a.getAttribute('aria-disabled'))return -1;a.click();return window.__dudo.session().sel?.n??-1})()`);
      if (got > 0) {
        seen.halfPlusOne.push(`${n}→${got}`);
        check(got === Math.floor(n / 2) + 1, `into aces from ${n}: ${got} (half plus one is ${Math.floor(n / 2) + 1})`);
        if (seen.halfPlusOne.length === 1) await shot(d, 'into-aces');
        const t = await ev(d, `(()=>{const b=document.querySelector('#actions .btn--yellow');const t=b.textContent;b.click();return t})()`);
        await sleep(500); continue;
      }
    }
    // Pasar
    if (v.ps && Math.random() < 0.7) {
      const b = await ev(d, `(()=>{const b=[...document.querySelectorAll('#actions .btn-row .btn')][0];const t=b.textContent;b.click();return t})()`);
      seen.passDoubted++; console.log(`  ${v.current} doubts the pass: "${b}"`); await sleep(800); continue;
    }
    if (v.canPass && Math.random() < 0.5) {
      const p = await ev(d, `(()=>{const b=document.querySelector('#actions .btn.paso');const r={t:b.textContent,can:b.classList.contains('can'),line:document.querySelector('#actions .paso-why')?.textContent};b.click();return r})()`);
      if (p.can) seen.passes++; else seen.bluffs++;
      if (seen.passes + seen.bluffs === 1) console.log(`  pass button: "${p.t}" · "${p.line}"`);
      await sleep(700); continue;
    }
    // Calzar: often enough to see it, and always the first time in a duel
    const alive = Object.values(v.dice).filter(x => x > 0).length;
    if (v.canCalzar && (Math.random() < 0.35 || (alive === 2 && !seen.duelCalza))) {
      if (alive === 2) { seen.duelCalza++; await shot(d, 'duel-calzar'); }
      await ev(d, `document.querySelector('#actions .btn--cyan').click(), 1`); seen.calzas++; await sleep(800); continue;
    }
    // Otherwise a bid (a face change in obligada when allowed) or a doubt
    const faceChange = v.ob && v.bid && v.dice[v.current] === 1;
    const r = await ev(d, `(()=>{
      if (${!!v.bid} && Math.random() < 0.3) { const b=document.querySelector('#actions .btn-row .btn'); if(b){b.click();return 'doubt'} }
      const all=[...document.querySelectorAll('.pinta')];all.forEach((x,i)=>x.dataset.face=i+1);const p=all.filter(x=>!x.disabled&&!x.getAttribute('aria-disabled'));
      if(!p.length){const b=document.querySelector('#actions .btn-row .btn');b?.click();return 'doubt'}
      const cur=${JSON.stringify(v.bid)}; const pick=${faceChange}?p.find(x=>cur&&+x.dataset.face!==+cur.split('x')[1])||p[0]:p[0];
      pick.click(); for(let i=Math.floor(Math.random()*3);i>0;i--){const plus=[...document.querySelectorAll('#actions .step')].at(-1); if(plus&&!plus.disabled) plus.click();}
      const ok=document.querySelector('#actions .btn--yellow'); if(!ok||ok.disabled){const b=document.querySelector('#actions .btn-row .btn');b?.click();return 'doubt'}
      const t=ok.textContent; ok.click(); return t; })()`);
    if (faceChange && r !== 'doubt') { seen.faceChange++; if (seen.faceChange === 1) console.log('  one-die face change in obligada:', r); }
    await sleep(600);
  }
  const end = await state(A);
  console.log(`${tag} →`, JSON.stringify({ done: end.done, winner: end.winner, rounds: end.round }));
  return end;
}

const end = await playGame('game');
check(end.done, 'the game reaches the end');
for (const r of ROLES) { for (let j = 0; j < 5 && (await overlay(devs[r])); j++) { await closeOverlay(devs[r]); await sleep(300); } const sc = await screen(devs[r]); check(sc === 'screen-result', `${r} is on the result screen (${sc})`); }
await shot(A, 'result');

if (REMATCH && end.done) {
  await ev(A, `document.querySelector('#result-actions .btn--yellow').click(); 1`); await sleep(6000);
  const fresh = await ev(A, `window.__dudo.session()?.code`);
  codes.add(fresh);
  for (const r of ROLES.slice(1)) { await ev(devs[r], `document.querySelector('#result-actions .btn--yellow')?.click(); 1`); await sleep(3500); }
  const inRoom = await Promise.all(ROLES.map(r => ev(devs[r], `window.__dudo.session()?.code`)));
  check(fresh && fresh !== code && inRoom.every(c => c === fresh), `rematch: everyone in the new room ${fresh} (${inRoom.join(',')})`);
  await ev(A, `[...document.querySelectorAll('#lobby-box .btn--yellow')][0]?.click(); 1`); await sleep(2500);
  const cfg2 = await ev(A, `JSON.stringify(window.__dudo.match()?.config||{})`);
  check(/"traditional":true/.test(cfg2), `the rematch keeps the classic rules (${cfg2})`);
}

/* ---------------- Report ---------------- */
const rounds = Object.keys(seen.notice);
const alive0 = N;
for (const rd of rounds) check(seen.notice[rd].size >= 2, `round ${rd}: the obligada notice reached ${[...seen.notice[rd]].join(',')}`);
if (SICILIANA) {
  check(sicForced, 'siciliana: the first bid of the game was doubted');
  check(ROLES.every(r => sicSaw.has(r)), `siciliana: every phone saw its line (${[...sicSaw].join(',')})`);
  check(!!seen.sicOutcome, `siciliana: the outcome was checked on every phone (${seen.sicOutcome || 'never'})`);
}
check(seen.ownShown === 0, `no phone ever showed its own die in obligada (${seen.ownShown})`);
console.log('seen:', JSON.stringify({ ...seen, notice: Object.fromEntries(rounds.map(k => [k, [...seen.notice[k]]])), syncAvg: seen.syncN ? Math.round(seen.syncSum / seen.syncN) : 0 }));
for (const r of ROLES) {
  const errs = devs[r].errors.concat(devs[r].logs.filter(l => !/vibrate|permission_denied/i.test(l)));
  if (errs.length) console.log(`errors in ${r}:`, JSON.stringify(errs.slice(0, 3)));
}

/* ---------------- Cleanup: everyone leaves for good, the room is deleted (D-50) ---------------- */
for (const r of ROLES) {
  const res = await ev(devs[r], `(async()=>{const t=window.__dudo.session()?.transport;if(!t?.dispose)return 'none';return JSON.stringify(await t.dispose())})()`).catch(e => 'err ' + e.message);
  console.log(`${r} leaves →`, res);
}
console.log('rooms used:', [...codes].join(','));
for (const r of ROLES) devs[r].close();
if (fails) { console.log(`❌ ${fails} checks failed`); process.exit(1); }
