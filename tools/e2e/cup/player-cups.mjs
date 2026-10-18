// "Tus copas" follows the player, not the phone (D-220): with the test store (`?test`),
// one phone signs in with its player and opens a cup it is seated in; another phone, which never
// saw it, signs in with the same player and finds it on the home page, with its name already picked.
// At the end, finished cups: with their label and hidden until the switch is turned on (D-234).
// Last, D-358: a phone with no player sits in a cup with the usual name and PIN and enters as the
// player, and the podium saved without them gets their jid.
//
// Usage: python3 -m http.server 8765 -d public (in another terminal) and node tools/e2e/cup/player-cups.mjs <output-folder>
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { mkdirSync } from 'node:fs';

const OUT = output('/tmp/player-cups');
mkdirSync(OUT, { recursive: true });
const b = await launch({ port: Number(process.env.CDP_PORT) || 9393, dir: `${OUT}/profile`, out: OUT });
const SITE = process.env.SITE || 'http://localhost:8765';
const BASE = `${SITE}/cup/`;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };
const ev = expr => b.evaluate(expr);
const CODE = 'PQRST';

try {
  await b.go(`${BASE}?test`, 1200);
  await ev(`localStorage.clear(); sessionStorage.clear(); 1`);
  await b.go(`${BASE}?test`, 1200);

  // Phone 1: the player Jiri and a cup where they are seated as "Jiri"
  await ev(`(async()=>{
    const { jugador } = await import('/assets/js/jugador.js');
    const J = await jugador();
    await J.crear('Jiri', '1234');
    const E = await import('/cup/engine.js');
    const { createLocalStore } = await import('/cup/store-local.js');
    const st = createLocalStore();
    const today = E.fechaEn(Date.now());
    const meta = E.nuevaMeta({ nombre: 'Piratotes 1983', dias: 3, inicio: today, admin: 'jiri01', creada: Date.now() });
    await st.crear('${CODE}', meta, { pid: 'jiri01', name: 'Jiri', at: Date.now(), pinHash: await E.hashPin('${CODE}', 'jiri01', '4321') });
    sessionStorage.setItem('juegos-de-salon:copa:prueba:sesion:${CODE}', JSON.stringify({ pid: 'jiri01' }));
    return 1;
  })()`);
  await b.go(`${BASE}?${CODE}&test`, 1500);
  ok(await ev(`__copa.estado.pantalla`) === 'tablero', 'phone 1: enters the cup as Jiri');
  await sleep(500);
  const recorded = await ev(`(async()=>{ const { jugador } = await import('/assets/js/jugador.js'); return JSON.stringify(await (await jugador()).copas()); })()`).then(JSON.parse);
  ok(recorded.length === 1 && recorded[0].code === CODE && recorded[0].p === 'jiri01', 'the cup ends up in the player\'s list');

  // Phone 2: another phone (without the cup's account or the player), the same test store
  await ev(`(()=>{ sessionStorage.clear(); for (const k of ['juegos-de-salon:jugador', 'juegos-de-salon:prueba:records-uid']) localStorage.removeItem(k); return 1 })()`);
  await b.go(`${BASE}?test`, 1200);
  ok(await ev(`document.getElementById('tus-copas').hidden`), 'phone 2, without a player: "Tus copas" does not appear');
  const signedIn = await ev(`(async()=>{ const { jugador } = await import('/assets/js/jugador.js'); return (await (await jugador()).entrar('Jiri', '1234')).estado; })()`);
  ok(signedIn === 'dentro', 'phone 2: signs in with the same player');
  await b.go(`${BASE}?test`, 1500);
  await b.still();
  const list = await ev(`(()=>{ const x = document.getElementById('tus-copas'); return x.hidden ? '' : x.innerText })()`);
  ok(/Piratotes 1983/.test(list) && list.includes(CODE), `"Tus copas" brings the player's cup: ${JSON.stringify(list)}`);
  await b.shot('home-your-cups');

  // When tapped, their name is already picked: only the cup's PIN is missing
  await ev(`document.querySelector('#tus-copas a.mia').click(); 1`);
  await sleep(1500);
  ok(await ev(`__copa.estado.pantalla`) === 'entrar', 'the cup asks to sign in on this phone');
  ok(await ev(`!!document.querySelector('#tab-inscrito.on') && document.querySelector('.chip-btn.on')?.dataset.pid === 'jiri01'`), 'with "Ya estoy inscrito" and Jiri picked');
  ok(await ev(`!document.getElementById('btn-sentarse').disabled`), 'the sign-in button is already ready');
  await b.shot('sign-in-picked');
  await ev(`(()=>{ const i = document.querySelector('#entrar-body input.pin'); i.value = '4321'; document.getElementById('btn-sentarse').click(); return 1 })()`);
  await sleep(1200);
  ok(await ev(`__copa.estado.pantalla`) === 'tablero', 'with the cup\'s PIN they are seated');

  // Finished ones carry their label and hide behind a switch that starts off (D-234)
  await ev(`(()=>{ const D = 864e5, now = Date.now(); sessionStorage.setItem('juegos-de-salon:copa:prueba:mias', JSON.stringify([
    { code: '${CODE}', nombre: 'Jiri', copa: 'Piratotes 1983', fin: now + 3 * D },
    { code: 'VWXYZ', nombre: 'Jiri', copa: 'Copa vieja', fin: now - 2 * D }])); return 1 })()`);
  await b.go(`${BASE}?test`, 1200);
  const names = () => ev(`JSON.stringify([...document.querySelectorAll('#tus-copas a.mia')].map(a => [a.querySelector('b').firstChild.textContent, a.classList.contains('terminada')]))`).then(JSON.parse);
  ok(await ev(`document.getElementById('ver-terminadas')?.checked === false`), '"Mostrar copas terminadas" starts off');
  ok(JSON.stringify(await names()) === JSON.stringify([['Piratotes 1983', false]]), 'off, only the ongoing cup');
  await ev(`document.getElementById('ver-terminadas').click(); 1`);
  await sleep(200);
  ok(JSON.stringify(await names()) === JSON.stringify([['Piratotes 1983', false], ['Copa vieja', true]]), 'on, the finished one appears');
  ok(await ev(`document.querySelector('#tus-copas a.mia.terminada .etiqueta-fin')?.textContent`) === 'Terminó', 'with the label "Terminó"');
  await b.shot('home-finished');

  // D-358: no player on this phone, a cup PIN that is the usual player PIN → it enters as the player
  const C2 = 'KLMNP';
  const jiri = await ev(`(async()=>{
    const { jugador } = await import('/assets/js/jugador.js');
    const J = await jugador();
    const E = await import('/cup/engine.js');
    const { createLocalStore } = await import('/cup/store-local.js');
    const st = createLocalStore();
    const meta = E.nuevaMeta({ nombre: 'Jueves', dias: 3, inicio: E.fechaEn(Date.now()), admin: 'jiri02', creada: Date.now() });
    await st.crear('${C2}', meta, { pid: 'jiri02', name: 'Jiri', at: Date.now(), pinHash: await E.hashPin('${C2}', 'jiri02', '1234') });
    await J.guardarPodio('${C2}', { name: 'Jueves', end: 1, de: 2, dias: 3, por: 'jiri02', p: { jiri02: { n: 'Jiri', l: 1 } } });
    const jid = J.yo().jid;
    J.salir();
    sessionStorage.clear();
    return jid;
  })()`);
  await b.go(`${BASE}?${C2}&test`, 1500);
  ok(await ev(`__copa.estado.pantalla`) === 'entrar' && await ev(`!localStorage.getItem('juegos-de-salon:jugador')`), 'D-358: a phone with no player opens the cup');
  ok(await ev(`!!document.getElementById('consejo-jugador')`), 'the hint says the usual name and PIN carry the history');
  await ev(`document.getElementById('tab-inscrito').click(); document.querySelector('.chip-btn[data-pid="jiri02"]').click(); 1`);
  await ev(`(()=>{ const i = document.querySelector('#entrar-body input.pin'); i.value = '1234'; document.getElementById('btn-sentarse').click(); return 1 })()`);
  await sleep(2000);
  const after = await ev(`(async()=>{ const { jugador, leerYo } = await import('/assets/js/jugador.js'); const J = await jugador();
    return JSON.stringify({ yo: leerYo()?.jid, j: __copa.estado.copa.players.jiri02.j, podio: (await J.podios()).${C2}?.p?.jiri02?.j }); })()`).then(JSON.parse);
  ok(after.yo === jiri, `with the cup PIN equal to the player's, this phone enters as Jiri: ${JSON.stringify(after)}`);
  ok(after.j === jiri, 'the cup player is linked to the player');
  ok(after.podio === jiri, 'the podium saved without them now carries their jid');
  await b.shot('joined-as-player');
} finally {
  b.close();
}
