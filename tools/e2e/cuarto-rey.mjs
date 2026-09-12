// Cuarto Rey de punta a punta: mazo completo hasta el cuarto rey, botón de sonido
// y el idioma inglés. Las tomas llevan el nombre de las capturas del README
// (docs/capturas.json), así `python3 tools/readme.py capturas cuarto-rey` las rehace.
import { launch, sleep } from './cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9341, dir: `${OUT}/p`, out: OUT });
const ev = e => b.evaluate(e);
const SITIO = 'http://localhost:8765';
const sacadas = new Set();
const toma = async nombre => { if (!sacadas.has(nombre)) { sacadas.add(nombre); await b.shot(nombre); } };

const jugar = async (nombres, tomaMesa) => {
  await ev(`document.getElementById('btn-go-setup').click(); 1`); await sleep(300);
  await toma('03-jugadores');
  await ev(`(()=>{const n=${JSON.stringify(nombres)};[...document.querySelectorAll('#players-form input')].forEach((inp,i)=>{inp.value=n[i];inp.dispatchEvent(new Event('input',{bubbles:true}));});return 1})()`);
  await ev(`document.getElementById('btn-start').click(); 1`); await sleep(500);
  await toma(tomaMesa);
};

await b.go(`${SITIO}/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITIO}/`);
console.log('menu sound btn:', await ev(`document.querySelector('.sound-toggle')?.textContent`));
await ev(`document.querySelector('.sound-toggle').click(); 1`);
console.log('after toggle:', await ev(`document.querySelector('.sound-toggle').textContent + ' muted=' + localStorage.getItem('juegos-de-salon:muted')`));
await ev(`document.querySelector('.sound-toggle').click(); 1`);

await b.go(`${SITIO}/cuarto-rey/`);
console.log('game sound btn:', await ev(`document.querySelector('.sound-toggle')?.textContent`), 'audio ctx ok:', await ev(`typeof AudioContext`));
await toma('02-intro');
await jugar(['Javi', 'Cata', 'Pancho', 'Fran'], '04-mesa');

for (let i = 0; i < 60; i++) {
  const active = await ev(`document.querySelector('.screen.active').id`);
  if (active !== 'screen-play') break;
  await ev(`document.getElementById('card').click(); 1`); await sleep(1300);
  const kind = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:session')).state.current?.card?.rank`);
  // El cuarto rey es el único que se anuncia en grande, con confeti y sin botón de "siguiente"
  if (await ev(`!!document.querySelector('#result .display--lg')`)) await toma('09-cuarto-rey');
  else if (await ev(`!!document.querySelector('#result .helper')`)) await toma('06-minijuego');
  else if (['A', '2', '3', '10', 'J', 'Q'].includes(kind)) await toma('05-carta');
  if (kind === '4') { await ev(`[...document.querySelectorAll('#result .helper button')][0].click(); 1`); await sleep(1500); }
  if (kind === '5' || kind === '7') { await ev(`[...document.querySelectorAll('#result button')].find(b=>/Otra/.test(b.textContent)).click(); 1`); }
  const ok = await ev(`(()=>{const res=document.getElementById('result');const btns=[...res.querySelectorAll('button')];let b=btns.find(x=>/siguiente|Cumplida|Nadie perdió|Ver el resultado/i.test(x.textContent));if(!b&&'${kind}'==='8'){const pk=res.querySelectorAll('.picker button');pk[0].click();pk[1].click();b=btns.find(x=>/Regalados/.test(x.textContent));}if(!b)return 'NO BUTTON';b.click();return 'ok'})()`);
  if (ok !== 'ok') { console.log('FAIL at', kind, ok); break; }
  await sleep(200);
  if ((await ev(`document.getElementById('handoff').hidden`)) === false) {
    // El pase tiene dos tiempos: primero "¡Salud!" con quiénes toman, después "pásale el celular a X"
    if (await ev(`!!document.querySelector('#handoff .cheers')`)) await toma('07-salud');
    await ev(`document.getElementById('handoff').click(); 1`); await sleep(150);
    await toma('08-pasale');
    await ev(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(350);
  }
}
await sleep(600);
const final = await ev(`document.querySelector('.screen.active').id`);
if (final === 'screen-end') await toma('10-final');
console.log('final screen:', final, '| capturas:', [...sacadas].sort().join(' '));

// ---- inglés: el toggle del menú manda en todas las pantallas (C-3) ----
await b.go(`${SITIO}/`); await ev(`localStorage.removeItem('juegos-de-salon:cuarto-rey:session'); 1`);
await ev(`[...document.querySelectorAll('.lang-toggle button')].find(x=>/EN/.test(x.textContent)).click(); 1`); await sleep(1200);
console.log('menú en inglés:', await ev(`document.querySelector('.game-card')?.innerText.replace(/\\n/g,' | ')`));
await toma('11-menu-en');
await b.go(`${SITIO}/cuarto-rey/`);
await jugar(['Javi', 'Cata', 'Pancho', 'Fran'], '12-mesa-en');
console.log('mesa en inglés:', await ev(`[...document.querySelectorAll('#screen-play .deck-count, #screen-play .tap')].map(x=>x.textContent.trim()).join(' | ')`));

console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs));
b.close();
