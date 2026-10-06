// Cuarto Rey de punta a punta: mazo completo hasta el cuarto rey, botón de sonido
// y el idioma inglés. Las tomas llevan el nombre de las capturas del README
// (docs/capturas.json), así `python3 tools/release/readme.py capturas cuarto-rey` las rehace.
import { launch, sleep } from '../cdp.mjs';
const OUT = process.argv[2];
const b = await launch({ port: 9341, dir: `${OUT}/p`, out: OUT });
const ev = e => b.evaluate(e);
const SITIO = process.env.SITIO || 'http://localhost:8765';
const sacadas = new Set();
const toma = async nombre => { if (!sacadas.has(nombre)) { sacadas.add(nombre); await b.shot(nombre); } };

const jugar = async (nombres, tomaMesa) => {
  await ev(`document.getElementById('btn-go-setup').click(); 1`); await sleep(300);
  await toma('03-jugadores');
  // La mesa recordada puede traer más filas que nombres (la mudanza de abajo deja cinco): se
  // quitan las que sobran antes de llenar, para que ninguna entre vacía o como "undefined".
  await ev(`(()=>{const n=${nombres.length};const filas=()=>document.querySelectorAll('#players-form .player-row');while(filas().length>n){const d=[...filas()].at(-1).querySelector('.del');if(d.disabled)break;d.click();}while(filas().length<n&&!document.getElementById('btn-add-player').disabled)document.getElementById('btn-add-player').click();return 1})()`);
  await ev(`(()=>{const n=${JSON.stringify(nombres)};[...document.querySelectorAll('#players-form input')].forEach((inp,i)=>{inp.value=n[i];inp.dispatchEvent(new Event('input',{bubbles:true}));});return 1})()`);
  await ev(`document.getElementById('btn-start').click(); 1`); await sleep(500);
  const mesa = await ev(`JSON.stringify(__cuartoRey.state().players.map(p=>p.name))`);
  console.log(mesa === JSON.stringify(nombres) ? `✓ la mesa son los ${nombres.length} nombres del guion` : `✗ la mesa no son los nombres del guion: ${mesa}`);
  await toma(tomaMesa);
};

await b.go(`${SITIO}/`); await ev(`localStorage.clear(); 1`); await b.go(`${SITIO}/`);
console.log('menu sound btn:', await ev(`document.querySelector('.sound-toggle')?.textContent`));
await ev(`document.querySelector('.sound-toggle').click(); 1`);
console.log('after toggle:', await ev(`document.querySelector('.sound-toggle').textContent + ' muted=' + localStorage.getItem('juegos-de-salon:muted')`));
await ev(`document.querySelector('.sound-toggle').click(); 1`);

await b.go(`${SITIO}/fourth-king/`);
console.log('game sound btn:', await ev(`document.querySelector('.sound-toggle')?.textContent`), 'audio ctx ok:', await ev(`typeof AudioContext`));
await toma('02-intro');
await jugar(['Javi', 'Cata', 'Pancho', 'Fran'], '04-mesa');

let pasePrueba = false;
for (let i = 0; i < 60; i++) {
  const active = await ev(`document.querySelector('.screen.active').id`);
  if (active !== 'screen-play') break;
  await ev(`document.getElementById('card').click(); 1`); await sleep(1300);
  const kind = await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:session')).state.current?.card?.rank`);
  // El cuarto rey es el único que se anuncia en grande, con confeti y sin botón de "siguiente"
  // El confeti recién lanzado tapa la carta, los nombres y la instrucción: se espera a que
  // termine (3,5 s), porque en Chrome headless cae más lento y a medio camino tapa las letras.
  // La pantalla espera al toque del jugador, así que no se pasa sola.
  if (await ev(`!!document.querySelector('#result .display--lg')`)) { await sleep(3000); await toma('09-cuarto-rey'); }
  else if (await ev(`!!document.querySelector('#result .helper')`)) await toma('06-minijuego');
  else if (['A', '2', '3', '10', 'J', 'Q'].includes(kind)) await toma('05-carta');
  if (kind === '4') { await ev(`[...document.querySelectorAll('#result .helper button')][0].click(); 1`); await sleep(1500); }
  if (kind === '5' || kind === '7') { await ev(`[...document.querySelectorAll('#result button')].find(b=>/Otra/.test(b.textContent)).click(); 1`); }
  const ok = await ev(`(()=>{const res=document.getElementById('result');const btns=[...res.querySelectorAll('button')];let b=btns.find(x=>/siguiente|Cumplida|Nadie perdió|Ver el resultado/i.test(x.textContent));if(!b&&'${kind}'==='8'){const pk=res.querySelectorAll('.picker button');pk[0].click();pk[1].click();b=btns.find(x=>/Regalados/.test(x.textContent));}if(!b)return 'NO BUTTON';b.click();return 'ok'})()`);
  if (ok !== 'ok') { console.log('FAIL at', kind, ok); break; }
  await sleep(200);
  if ((await ev(`document.getElementById('handoff').hidden`)) === false) {
    // El pase es una sola pantalla (C-9): arriba "¡Salud!" con quiénes toman, debajo "pásale el
    // celular a X" con su botón. Solo el botón avanza: ni un toque fuera de él ni el tiempo (D-213).
    // Solo sirve el "¡Salud!" con gente tomando: el mismo bloque .cheers también dice
    // "¡Cumplida!" sin fichas, y esa toma no ilustra el pie de la captura ("¡Salud!").
    if (await ev(`document.querySelectorAll('#handoff .drinkers .chip').length > 1`)) await toma('07-salud');
    await toma('08-pasale');
    if (!pasePrueba) {
      pasePrueba = true;
      await ev(`document.getElementById('handoff').click(); 1`); await sleep(3200);
      const sigue = await ev(`!document.getElementById('handoff').hidden && !!document.querySelector('#handoff .next-name')`);
      console.log(sigue ? '✓ el pase sigue en pantalla tras un toque fuera del botón y 3 s' : '✗ el pase se cerró sin tocar el botón (C-9)');
    }
    await ev(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(450);
  }
}
await sleep(600);
const final = await ev(`document.querySelector('.screen.active').id`);
if (final === 'screen-end') {
  const cr = await ev(`JSON.stringify({ fin: __cuartoRey.state().finished, reyes: __cuartoRey.state().kings, pantalla: __cuartoRey.screen() })`);
  console.log('gancho __cuartoRey:', cr);
  if (!/"fin":true/.test(cr) || !/"reyes":4/.test(cr)) console.log('✗ el gancho no ve la partida terminada en el cuarto rey');
  await sleep(4200); // el confeti dura 4 s y taparía el ranking y la lista entera
  await toma('10-final');
  // El historial (CR-18) va plegado: se abre para la captura y para contar si anotó todas las cartas.
  await ev(`(()=>{const d=document.getElementById('end-history');d.open=true;d.scrollIntoView({block:'start'});return 1})()`); await sleep(400);
  console.log('historial:',
    await ev(`document.querySelectorAll('#history-list li').length`), 'de',
    await ev(`JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:session')).state.drawn`), 'cartas | primera:',
    await ev(`document.querySelector('#history-list li')?.innerText.replace(/\\n/g, ' · ')`), '| última:',
    await ev(`[...document.querySelectorAll('#history-list li')].at(-1)?.innerText.replace(/\\n/g, ' · ')`));
  await toma('13-historial');
}
console.log('final screen:', final, '| capturas:', [...sacadas].sort().join(' '));

// ---- la mesa recordada se muda de juegos-de-salon:players a createNameStore (C-6) ----
await b.go(`${SITIO}/fourth-king/`);
await ev(`localStorage.clear(); localStorage.setItem('juegos-de-salon:players', JSON.stringify([{name:'Ana',gender:'f'},{name:'Beto',gender:'m'},{name:'Cami',gender:'x'},{name:'Dani',gender:'f'},{name:'Eli',gender:'m'}])); 1`);
await b.go(`${SITIO}/fourth-king/`);
await ev(`document.getElementById('btn-go-setup').click(); 1`); await sleep(300);
const mudada = await ev(`JSON.stringify({ filas: [...document.querySelectorAll('#players-form input')].map(i=>i.value), generos: [...document.querySelectorAll('#players-form .gender .on')].map(x=>x.dataset.g).join(''), nueva: JSON.parse(localStorage.getItem('juegos-de-salon:cuarto-rey:names')||'[]').length, vieja: localStorage.getItem('juegos-de-salon:players') })`);
console.log('mesa mudada:', mudada);
console.log(mudada === JSON.stringify({ filas: ['Ana', 'Beto', 'Cami', 'Dani', 'Eli'], generos: 'fmxfm', nueva: 5, vieja: null })
  ? '✓ la mesa vieja se mudó a juegos-de-salon:cuarto-rey:names' : '✗ la mesa vieja no se mudó entera');

// ---- inglés: el toggle del menú manda en todas las pantallas (C-3) ----
await b.go(`${SITIO}/`); await ev(`localStorage.removeItem('juegos-de-salon:cuarto-rey:session'); 1`);
await ev(`[...document.querySelectorAll('.lang-toggle button')].find(x=>/EN/.test(x.textContent)).click(); 1`); await sleep(1200);
console.log('menú en inglés:', await ev(`document.querySelector('.game-card')?.innerText.replace(/\\n/g,' | ')`));
await toma('11-menu-en');
await b.go(`${SITIO}/fourth-king/`);
await jugar(['Javi', 'Cata', 'Pancho', 'Fran'], '12-mesa-en');
console.log('mesa en inglés:', await ev(`[...document.querySelectorAll('#screen-play .deck-count, #screen-play .tap')].map(x=>x.textContent.trim()).join(' | ')`));

console.log('errors:', JSON.stringify(b.errors), 'console errors:', JSON.stringify(b.logs));
b.close();
