// Quien llega por un enlace de sala solo puede entrar a esa sala: nada de crear otra.
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:8765';
const b = await launch({ port: 9484, dir: `${OUT}/p`, out: OUT, width: 375, height: 812 });
const JUEGOS = ['toque-y-fama', 'batalla-naval', 'linea-de-tiempo'];
const CODE = 'ZQTE';

const pantalla = () => b.evaluate(`(()=>{
  const acc = [...document.querySelectorAll('#setup-actions .btn')].map(x=>x.textContent.trim());
  const code = document.querySelector('#setup-actions input.code');
  return JSON.stringify({
    pantalla: document.querySelector('.screen.active')?.id,
    titulo: document.querySelector('#screen-setup h2')?.textContent,
    botones: acc,
    crear: acc.some(t=>/crear|create/i.test(t)),
    invitacion: document.querySelector('#setup-actions .lead')?.textContent || '',
    codigo: code ? code.value : null,
    soloLectura: code ? code.readOnly : null,
  })})()`).then(JSON.parse);

for (const juego of JUEGOS) {
  await b.go(`${BASE}/${juego}/`, 1200); await b.evaluate(`localStorage.clear(); 1`);
  // con enlace: solo unirse
  await b.go(`${BASE}/${juego}/?sala=${CODE}`, 1800);
  const invitado = await pantalla();
  console.log(`${juego} con enlace →`, JSON.stringify(invitado));
  if (invitado.crear) console.log('  ⚠️ todavía ofrece crear sala');
  await b.shot(`invitacion-${juego}`);
  // sin enlace: el modo de varios celulares sigue ofreciendo crear
  await b.go(`${BASE}/${juego}/`, 1500);
  const modo = juego === 'linea-de-tiempo' ? 1 : 1;
  await b.evaluate(`document.querySelectorAll('.mode')[${modo}].click(); 1`); await sleep(500);
  const normal = await pantalla();
  console.log(`${juego} sin enlace →`, JSON.stringify({ crear: normal.crear, botones: normal.botones, soloLectura: normal.soloLectura }));
}
console.log('errors:', JSON.stringify(b.errors), JSON.stringify(b.logs));
b.close();
