/**
 * Mirar una pantalla concreta, rápido, sin jugar una partida entera.
 *
 *   node tools/e2e/mirar.mjs <juego> <pantalla> [--ancho 390] [--alto 844] [--idioma es] [--salida /tmp/mirar]
 *
 * Ejemplos:
 *   node tools/e2e/mirar.mjs ahorcado juego --ancho 320
 *   node tools/e2e/mirar.mjs dudo apuesta --muescas      (celular con muesca: 47 arriba, 34 abajo)
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
/**
 * `--muescas` simula un celular con muesca (47 px arriba, 34 abajo). Importa porque en Chrome
 * headless esos márgenes valen 0, así que un error de alto que solo aparece con muescas pasa
 * por delante de todas las pruebas sin que nadie lo vea (D-75).
 */
const muescas = args.includes('--muescas');
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
  dudo: {
    intro: [],
    configuracion: [`document.querySelectorAll('.mode')[0].click()`],
    // Contra el celular se llega a la mesa sin pantalla de pase de por medio
    juego: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
    ],
    // Con la pinta elegida aparece el selector de cantidad, que es la parte apretada de la barra
    apuesta: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelectorAll('.pinta')[4].click()`,
    ],
    // Se destapa la mesa: se apuesta un disparate y se duda de la respuesta del celular
    destape: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelectorAll('.pinta')[5].click()`,
      `document.querySelector('#actions .btn--yellow').click()`,
      `1`,   // el celular se demora en cantar su apuesta: un paso de espera
      `[...document.querySelectorAll('#actions .btn')].find(b=>/Dudo|Liar|Duvido/i.test(b.textContent))?.click()`,
    ],
  },
  'cuarto-rey': {
    intro: [],
    jugadores: [`document.getElementById('btn-go-setup').click()`],
    // Con seis filas se ve si la lista crece pareja y si la barra de abajo sigue alcanzando
    'jugadores-6': [
      `document.getElementById('btn-go-setup').click()`,
      `document.getElementById('btn-add-player').click()`,
      `document.getElementById('btn-add-player').click()`,
    ],
    mesa: [
      `document.getElementById('btn-go-setup').click()`,
      `[...document.querySelectorAll('#players-form input')].forEach((i,k)=>{i.value=['Javi','Cata','Pancho','Fran'][k];i.dispatchEvent(new Event('input',{bubbles:true}))})`,
      `document.getElementById('btn-start').click()`,
    ],
  },
  julepe: {
    intro: [],
    configuracion: [`document.querySelectorAll('.mode')[0].click()`],
    // Contra el celular se llega a la mesa sin pantalla de pase de por medio
    declaracion: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
    ],
    // El cambio: con una carta marcada, que es cuando la mano se ve más cargada. Los pasos `1`
    // son esperas: los rivales del aparato declaran y cambian antes, y se demoran a propósito.
    cambio: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelector('#actions .btn--yellow')?.click()`,
      `1`, `1`, `1`,
      `document.querySelectorAll('#mine .pcard')[0]?.click()`,
    ],
    // La baza: hasta la primera carta, donde aparecen las apagadas y el porqué de abajo
    baza: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelector('#actions .btn--yellow')?.click()`,
      `1`, `1`, `1`,
      `document.querySelector('#actions .btn--yellow')?.click()`,
      `1`, `1`, `1`,
      `document.querySelector('#mine .pcard:not(.off)')?.click()`,
    ],
  },
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
  /**
   * El panel del dueño no es un juego, pero se mira igual: `window.__panel.seed` lo dibuja
   * con datos sembrados, sin entrar con Google ni tocar la base (C-14). Los datos traen a
   * propósito un juego (`juego-nuevo`), un modo (`equipos`) y un idioma (`fr`) que no están
   * en el registro: así se ve de una que el panel los muestra igual (C-16).
   */
  panel: {
    datos: [`(()=>{const DIA=86400000,ahora=Date.now(),hoy=Math.floor(ahora/DIA);
      const rooms={ABCD:{createdAt:ahora-4*60000,game:'dudo',players:{A:{name:'Javi',online:true},B:{name:'Cata',online:true}},messages:{m1:{t:'hello',at:ahora-4*60000},m2:{t:'bid',at:ahora-60000}}},EFGH:{createdAt:ahora-2*3600000,game:'juego-nuevo',players:{A:{name:'Fausto',online:false}}}};
      // Salas jugadas de varios días, con país y ganador, para ver la bitácora y su paginado (D-79).
      // Van a propósito: un empate, una sala sin registro de ganador (de antes de que se anotara),
      // una donde nunca entró nadie más y nombres de varios países.
      const gente=[['Javi','CL'],['Cata','CL'],['Pancho','CL'],['Fran','AR'],['Ana','BR'],['Leo','ES'],['Nico','MX'],['Sofi','PE']];
      const juegos=['dudo','ahorcado','linea-de-tiempo','toque-y-fama','batalla-naval'];
      const dias={};
      for(let k=0;k<26;k++){
        const d=hoy-(k%7), code=String.fromCharCode(65+k%26)+'BCD'.slice(0,3);
        const a=gente[k%gente.length], b=gente[(k+3)%gente.length];
        const r={game:juegos[k%juegos.length],at:(d*DIA)+((10+k%12)*3600000),v:'0.33.6',players:{A:a[0],B:b[0]},co:{A:a[1],B:b[1]}};
        if(k%7===3) r.end={winner:'tie',at:r.at};
        else if(k%5!==1) r.end={winner:k%2?'A':'B',name:k%2?a[0]:b[0],at:r.at};
        if(k%9===4){ delete r.players.B; delete r.co.B; delete r.end; }
        (dias[d]=dias[d]||{rooms:{}}).rooms[code]=r;
      }
      const days={...dias};
      days[hoy]={...(days[hoy]||{}),rooms:{...((days[hoy]||{}).rooms||{}),ABCD:{game:'dudo',at:ahora-4*60000,players:{A:'Javi',B:'Cata'},co:{A:'CL',B:'CL'},end:{winner:'A',name:'Javi',at:ahora}},EFGH:{game:'juego-nuevo',at:ahora-2*3600000,players:{A:'Fausto'},co:{A:'UY'}}},local:{dudo:{local:{4:6},cpu:{1:3}},'juego-nuevo':{equipos:{6:5}},ahorcado:{local:{3:4}}},origin:{America__Santiago:12,Europe__Madrid:2},lang:{'es-CL':12,'pt-BR':2},applang:{es:11,pt:2,fr:1},hour:{14:4,21:9}};
      days[hoy-1]={...(days[hoy-1]||{}),local:{'linea-de-tiempo':{solo:{1:7}}},origin:{America__Santiago:5},lang:{'es-CL':5},applang:{es:5},hour:{20:5}};
      window.__panel.seed({rooms,days});})();1`],

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
// El idioma se guarda como texto pelado: getLang() compara contra ['es','en','pt'] y un
// JSON.stringify le dejaba las comillas dentro, así que --idioma no hacía nada.
await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${idioma}'); 1`);
await b.go(`${base}/${juego}/`, 1500);
// Muescas de verdad: Chrome fija los insets del sistema y la página los lee con
// env(safe-area-inset-*), igual que en un celular. Sobreescribir las variables CSS —como se
// hacía antes— no es lo mismo: pinta los márgenes pero no cambia el viewport (D-77).
if (muescas) await b.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: 34, left: 0, right: 0 } });
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
    // Lo que queda fuera de la pantalla sin que nada lo anuncie: la página más alta que el
    // celular, y los botones que caen por debajo del borde de abajo (D-75)
    sobra: document.documentElement.scrollHeight - innerHeight,
    // El alto con el que la app se arma no puede ser el del instante (dvh): tiene que ser el
    // chico (svh), el que queda con toda la interfaz del navegador a la vista. En un celular
    // los dos valores se separan —dvh 1016, svh 960— y lo que se apoya abajo cae fuera (D-77).
    // En Chrome headless valen lo mismo, así que acá se revisa la regla, no la medida.
    midePorElAltoChico: [...document.styleSheets].some(hoja => {
      try { return [...hoja.cssRules].some(r => (r.selectorText || '').includes('.app') && (r.style?.minHeight || '').includes('svh')); }
      catch { return false; }
    }),
    fueraAbajo: [...new Set([...document.querySelectorAll('.screen.active .btn, .confirm .btn')]
      .filter(x => x.offsetParent !== null && x.getBoundingClientRect().bottom > innerHeight)
      .map(x => (x.textContent || x.className).trim().slice(0, 18)))],
  });
})()`).then(JSON.parse);

const nombre = `${juego}-${pantalla}-${ancho}`;
await b.shot(nombre);
console.log(`${salida}/${nombre}.png · ${ancho}×${alto} · ${idioma}`);
console.log(`  pantalla: ${revision.pantalla}`);
console.log(`  scroll horizontal (C-8): ${revision.scrollHorizontal ? '⚠️  SÍ' : 'no'}`);
console.log(`  botones bajo 44 px (C-8): ${revision.botonesChicos.length ? '⚠️  ' + revision.botonesChicos.join(', ') : 'ninguno'}`);
console.log(`  la página se pasa del alto: ${revision.sobra > 0 ? `⚠️  ${revision.sobra} px` : 'no'}${muescas ? ' (con muescas)' : ''}`);
console.log(`  botones fuera de pantalla: ${revision.fueraAbajo.length ? '⚠️  ' + revision.fueraAbajo.join(', ') : 'ninguno'}`);
console.log(`  se arma con el alto chico (svh): ${revision.midePorElAltoChico ? 'sí' : '⚠️  NO (usa dvh: lo que se apoya abajo se va fuera en un celular)'}`);
if (b.errors.length) console.log('  errores de consola:', JSON.stringify(b.errors.slice(0, 2)));
b.close();
