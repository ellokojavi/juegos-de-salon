// A player of a running Cup loses everything their browser kept (Safari evicting storage, a new
// phone, a fresh profile) and comes back with their name and PIN: they sit as the same player and
// keep every score they already had (#893). Test store (?test), no network: the store's key in
// localStorage stands in for Firebase, so it is the only thing kept; everything else is wiped.
//
// Usage: python3 -m http.server 8765 -d public (in another terminal) and node tools/e2e/cup/rejoin.mjs [folder]
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const BASE = `${SITE}/cup/`;
const STORE = 'juegos-de-salon:copa:prueba';
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

const b = await launch({ port: 9518, dir: `${OUT}/p`, out: OUT });
const ev = x => b.evaluate(x);
const click = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)return false;e.click();return true})()`);
const screen = () => ev('__copa.estado.pantalla');
// Javi's results per day, as the store (the server's side) holds them
const scores = code => ev(`JSON.stringify(Object.entries(JSON.parse(localStorage.getItem('${STORE}'))['${code}'].results || {})
  .filter(([, r]) => r.javi02).map(([d, r]) => [d, r.javi02.s]))`);
const javiRow = () => ev(`[...document.querySelectorAll('[data-pid="javi02"]')].filter(e => !e.closest('[hidden]') && !e.closest('#entrar-body')).map(e => (e.textContent || "").trim()).filter(Boolean).join(' | ')`);

try {
  // Javi, seated in the demo cup with days already played; his PIN is set to 4321
  await b.go(`${BASE}?test&demo=player`, 1500);
  await ev('window.confirm=()=>true; 1');
  const code = await ev('__copa.estado.code');
  ok(await ev('__copa.estado.yo') === 'javi02', 'Javi is seated in the cup');
  await ev(`(async()=>{const { hashPin } = await import('./engine.js');
    const db=JSON.parse(localStorage.getItem('${STORE}'));
    db['${code}']._keys.javi02 = await hashPin('${code}', 'javi02', '4321');
    localStorage.setItem('${STORE}', JSON.stringify(db)); return 1})()`);
  const before = await scores(code);
  ok(JSON.parse(before).length >= 1, `Javi has scores before (${before})`);
  const rowBefore = await javiRow();

  // A fresh browser: everything the phone kept goes, except the store (the server's side);
  // the seat goes too, since a new anonymous session does not hold it
  await ev(`(()=>{const db=JSON.parse(localStorage.getItem('${STORE}'));
    db['${code}']._seats.javi02 = {};
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('${STORE}', JSON.stringify(db)); return 1})()`);
  ok(await ev('localStorage.length') === 1 && await ev('sessionStorage.length') === 0, 'only the store is left in the browser');

  // Opens the cup's link
  await b.go(`${BASE}?${code}&test`, 1500);
  await ev('window.confirm=()=>true; 1');
  ok(await screen() === 'entrar', `with nothing kept, the link asks who you are (${await screen()})`);
  ok(!(await ev('__copa.estado.yo')), 'and this browser is nobody yet');
  ok(await click('#tab-inscrito'), 'the "already in" tab can be opened');
  await sleep(200);
  ok(await click('.chip-btn[data-pid="javi02"]'), 'Javi\'s name can be picked');
  await sleep(300);
  await b.shot('rejoin-pin');
  await ev(`document.querySelector('#entrar-body input.pin').value='4321'; 1`);
  ok(await click('#btn-sentarse'), 'signs in with name and PIN');
  await sleep(800);
  ok(await screen() === 'tablero', 'back to the board');
  ok(await ev('__copa.estado.yo') === 'javi02', 'seated again as Javi, the same player');
  ok(await ev(`Object.values(__copa.estado.copa.players).filter(p => p.name === 'Javi').length`) === 1, 'no second Javi was created');
  const after = await scores(code);
  ok(after === before, `Javi keeps every score (${after})`);
  const rowAfter = await javiRow();
  ok(rowAfter === rowBefore, `the board shows the same for Javi (${JSON.stringify(rowBefore)} → ${JSON.stringify(rowAfter)})`);
  await b.shot('rejoin-board');
} finally {
  await b.close();
}
