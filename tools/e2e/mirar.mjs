/**
 * Mirar una pantalla concreta, rápido, sin jugar una partida entera.
 *
 *   node tools/e2e/mirar.mjs <juego> <pantalla> [--ancho 390] [--alto 844] [--idioma es] [--salida /tmp/mirar]
 *
 * Ejemplos:
 *   node tools/e2e/mirar.mjs ahorcado juego --ancho 320
 *   node tools/e2e/mirar.mjs ahorcado resultado
 *   node tools/e2e/mirar.mjs linea-de-tiempo intro --idioma pt
 *
 * Saca la captura y, además, revisa lo que el canon pide mirar en cada pantalla (C-8):
 * que no haya scroll horizontal y que ningún botón quede por debajo de 44 px.
 *
 * Nació de escribir ocho guiones descartables en /tmp para revisar una barra de botones.
 * Para probar que el juego funciona están los guiones de partida; esto es para mirar.
 */
import { launch, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const flag = (n, def) => { const i = args.indexOf('--' + n); return i < 0 ? def : args[i + 1]; };
const [juego, pantalla = 'intro'] = pos;
const ancho = Number(flag('ancho', 390));
const alto = Number(flag('alto', 844));
const idioma = flag('idioma', 'es');
const salida = flag('salida', '/tmp/mirar');
const base = flag('base', 'http://localhost:8765');

if (!juego) {
  console.error('Falta el juego. Ej: node tools/e2e/mirar.mjs ahorcado juego --ancho 320');
  process.exit(1);
}

/**
 * Cómo llegar a cada pantalla. Cada paso es un trocito de JS que se corre en la página;
 * si un juego necesita otra cosa, se suma acá y no en un guion nuevo.
 */
const CAMINOS = {
  ahorcado: {
    intro: [],
    configuracion: [`document.querySelectorAll('.mode')[0].click()`],
    escribir: [
      `document.querySelectorAll('.mode')[0].click()`,
      `[...document.querySelectorAll('#setup-form .player-row input')].forEach((i,k)=>{i.value=['Javi','Cata'][k];i.dispatchEvent(new Event('input',{bubbles:true}))})`,
      `document.querySelector('#setup-actions .btn').click()`,
      `document.querySelector('#cover button')?.click()`,
    ],
    juego: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn').click()`,
    ],
    'juego-chat': [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn').click()`,
      // La sala trae chat; acá se enciende a mano para mirar cómo convive con la barra
      `(()=>{document.body.classList.add('chat-on');const m=document.getElementById('chat');m.className='chat';m.hidden=false;m.innerHTML='<button class="chat-fab">💬</button>'})()`,
    ],
    resultado: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn').click()`,
      // Se juega sola hasta el final: acá interesa la pantalla, no la partida. Cada jugada lleva
      // su número, que es lo que el reductor usa para descartar repetidas.
      `(()=>{const s=window.__ahorcado.view();const w=(s.words.A||'').toUpperCase();
        let n=0; for (const l of new Set(w.split(''))) if (l!==' ')
          window.__ahorcado.session().transport.send({t:'guess',from:'A',letter:l,n:n++,ms:100});})()`,
      `(()=>{for(let i=0;i<4;i++){const h=document.getElementById('handoff');if(h.hidden)break;const b=h.querySelector('button');b?b.click():h.click()}})()`,
    ],
  },
};

const camino = CAMINOS[juego]?.[pantalla];
if (!camino) {
  const hay = Object.keys(CAMINOS[juego] || {});
  console.error(hay.length ? `No conozco "${pantalla}". Hay: ${hay.join(', ')}` : `No conozco el juego "${juego}". Hay: ${Object.keys(CAMINOS).join(', ')}`);
  process.exit(1);
}

const b = await launch({ port: 9451, dir: `${salida}/perfil`, out: salida, width: ancho, height: alto });
await b.go(`${base}/${juego}/`, 1500);
await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', JSON.stringify('${idioma}')); 1`);
await b.go(`${base}/${juego}/`, 1500);
for (const paso of camino) { await b.evaluate(`(()=>{ ${paso} ; return 1})()`); await sleep(700); }
await sleep(400);

const revision = await b.evaluate(`(()=>{
  const chicos = [...document.querySelectorAll('.screen.active button, .confirm button')]
    .filter(x => x.offsetParent !== null && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent || x.className).trim().slice(0, 18));
  return JSON.stringify({
    pantalla: document.querySelector('.screen.active')?.id,
    scrollHorizontal: document.documentElement.scrollWidth > innerWidth,
    botonesChicos: [...new Set(chicos)],
    alto: document.documentElement.scrollHeight,
  });
})()`).then(JSON.parse);

const nombre = `${juego}-${pantalla}-${ancho}`;
await b.shot(nombre);
console.log(`${salida}/${nombre}.png · ${ancho}×${alto} · ${idioma}`);
console.log(`  pantalla: ${revision.pantalla}`);
console.log(`  scroll horizontal (C-8): ${revision.scrollHorizontal ? '⚠️  SÍ' : 'no'}`);
console.log(`  botones bajo 44 px (C-8): ${revision.botonesChicos.length ? '⚠️  ' + revision.botonesChicos.join(', ') : 'ninguno'}`);
if (b.errors.length) console.log('  errores de consola:', JSON.stringify(b.errors.slice(0, 2)));
b.close();
