// Generala con dos celulares contra Firebase real: sala, turnos con los dados de quien juega a la
// vista del otro, reconexión a mitad de partida, partida entera y revancha. No corre en CI: abre
// salas en el Firebase de producción (tools/e2e/ci.mjs). Imprime ✗ si algo falla.
//
// Cada "celular" es un Chrome con su propio perfil y su propio origen, para que no compartan
// localStorage (ver el README de esta carpeta).
import { launch, sleep } from '../cdp.mjs';
// Con varias sesiones a la vez, cada una sirve su copia en su puerto (D-135)
const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2];
const hosts = ['localhost', '127.0.0.1'].map(h => SITIO.replace('localhost', h));
const A = await launch({ port: 9390, dir: `${OUT}/pA`, out: OUT, width: 375, height: 812 });
const B = await launch({ port: 9391, dir: `${OUT}/pB`, out: OUT, width: 375, height: 812 });
const devs = { A, B };
let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
const pantalla = d => d.evaluate(`document.querySelector('.screen.active')?.id`);
const vista = d => d.evaluate(`JSON.stringify((v=>v&&({current:v.current,tiro:v.tiro,dados:v.dados,done:v.done,winners:v.winners,n:v.history.length,totales:Object.fromEntries(Object.entries(v.st).map(([r,x])=>[r,x.total]))}))(__generala.view()))`).then(JSON.parse);
const setName = (d, n) => d.evaluate(`(()=>{const i=document.querySelector('#setup-form input');i.value='${n}';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
const esperar = async (fn, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(250); } return false; };

/* ---------------- Sala ---------------- */
await A.go(`${hosts[0]}/generala/`); await A.evaluate(`localStorage.clear(); 1`); await A.go(`${hosts[0]}/generala/`);
await A.evaluate(`document.querySelector('[data-mode=online]').click(); 1`); await sleep(400);
ok(await A.evaluate(`!!document.querySelector('#setup-form .switch')`), 'quien crea la sala elige si la generala servida gana');
// Sin la servida, para que la partida llegue entera a las 11 vueltas
await A.evaluate(`document.querySelector('#setup-form .switch').click(); 1`);
await setName(A, 'Javi');
await A.evaluate(`document.querySelector('#setup-actions .btn--yellow').click(); 1`);
await esperar(() => A.evaluate(`!!document.querySelector('.code-big')`), 12000);
const code = await A.evaluate(`document.querySelector('.code-big')?.textContent`);
ok(/^[A-Z]{4}$/.test(code || ''), `sala ${code}`);

// B entra por el enlace de invitación, que es como llega de verdad (RP-18)
await B.go(`${hosts[1]}/generala/?sala=${code}`); await B.evaluate(`localStorage.clear(); 1`);
await B.go(`${hosts[1]}/generala/?sala=${code}`); await sleep(1000);
ok(!(await B.evaluate(`!!document.querySelector('#setup-form .switch')`)), 'quien llega por el enlace no ve los ajustes');
await setName(B, 'Cata');
await B.evaluate(`[...document.querySelectorAll('#setup-actions .btn')].find(x=>/Unirse/i.test(x.textContent)).click(); 1`);
await esperar(async () => (await pantalla(B)) === 'screen-lobby', 12000);
await esperar(() => A.evaluate(`document.querySelectorAll('#lobby-box .lobby-players .p').length === 2`));
await A.shot('online-01-sala');
await A.evaluate(`document.querySelector('#lobby-box .btn--yellow').click(); 1`);
ok(await esperar(async () => (await pantalla(A)) === 'screen-play' && (await pantalla(B)) === 'screen-play'), 'los dos llegan a la mesa');

/* ---------------- Turnos ---------------- */
const rolDe = { A: 'A', B: 'B' };
let vioDados = 0, tiroAjeno = 0, recargado = false, g = 0;
while (g++ < 60) {
  const v = await vista(A);
  if (!v || v.done) break;
  const d = devs[v.current];
  const otro = v.current === 'A' ? B : A;
  if (await otro.evaluate(`!!document.getElementById('btn-tirar')`)) tiroAjeno++;
  await d.evaluate(`document.getElementById('btn-tirar').click(); 1`);
  // El otro ve los dados de quien juega
  if (await esperar(async () => JSON.stringify((await vista(otro))?.dados) === JSON.stringify((await vista(d)).dados) && (await vista(otro)).tiro === 1, 6000)) vioDados++;
  if (g === 3) await otro.shot('online-02-mirando');
  await d.evaluate(`document.querySelector('.casilla.libre').click(); 1`); await sleep(100);
  await d.evaluate(`document.getElementById('btn-anotar').click(); 1`);
  const n = v.n + 1;
  await esperar(async () => (await vista(A))?.n === n && (await vista(B))?.n === n, 8000);
  if (!recargado && n === 8) {
    // B recarga a mitad de partida y vuelve solo a la misma sala (C-6)
    recargado = true;
    await B.go(`${hosts[1]}/generala/?sala=${code}`);
    ok(await esperar(async () => (await pantalla(B)) === 'screen-play' && (await vista(B))?.n === 8, 12000), 'B recarga y vuelve a la misma partida, en el mismo punto');
    ok(await B.evaluate(`__generala.session().role`) === rolDe.B, 'con el mismo rol');
  }
}
ok(tiroAjeno === 0, `quien no tiene el turno no ve el botón de tirar (${tiroAjeno} veces lo vio)`);
ok(vioDados >= 20, `el otro celular ve los dados de quien juega (${vioDados} de 22)`);
ok(await esperar(async () => (await pantalla(A)) === 'screen-result' && (await pantalla(B)) === 'screen-result', 8000), 'los dos llegan al final');
const fin = await vista(A);
ok(fin.n === 22, `22 anotaciones (${fin.n})`);
console.log('final A →', await A.evaluate(`document.getElementById('result-title').textContent`), '· B →', await B.evaluate(`document.getElementById('result-title').textContent`), '·', JSON.stringify(fin.totales));
await sleep(3800);
await A.shot('online-03-final');

/* ---------------- Revancha ---------------- */
await A.evaluate(`document.getElementById('btn-otra').click(); 1`);
await esperar(async () => (await pantalla(A)) === 'screen-lobby', 12000);
await B.evaluate(`document.getElementById('btn-otra').click(); 1`);
ok(await esperar(async () => (await pantalla(B)) === 'screen-lobby' && await B.evaluate(`document.querySelector('.code-big')?.textContent`) === await A.evaluate(`document.querySelector('.code-big')?.textContent`), 12000), 'la revancha abre otra sala y los dos entran');
// Se cierra la sala de la revancha: irse a propósito la borra (D-50)
await B.evaluate(`[...document.querySelectorAll('#lobby-box .btn--ghost')].pop().click(); 1`); await sleep(1500);
await A.evaluate(`[...document.querySelectorAll('#lobby-box .btn--ghost')].pop().click(); 1`); await sleep(1500);

for (const [n, d] of Object.entries(devs)) {
  ok(!d.errors.length, `${n}: sin errores en la página ${JSON.stringify(d.errors)}`);
  console.log(`${n} console:`, JSON.stringify(d.logs.filter(l => !/vibrate/i.test(l))));
  d.close();
}
if (fallas) { console.log(`✗ ${fallas} fallas`); process.exit(1); }
console.log('✓ generala online');
