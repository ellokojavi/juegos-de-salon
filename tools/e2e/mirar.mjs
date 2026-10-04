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
import { EN_LABS, LABS_KEY } from '../../public/assets/js/i18n.js';
import { gameById } from '../../public/assets/js/games.js';
import { CAMINOS } from './caminos.mjs';

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
const base = flag('base', process.env.SITIO || 'http://localhost:8765');

if (!juego) {
  console.error('Falta el juego. Ej: node tools/e2e/mirar.mjs ahorcado juego --ancho 320');
  process.exit(1);
}

const camino = CAMINOS[juego]?.[pantalla];
// Se pide por el id ('ahorcado') y se abre su carpeta ('/hangman/'): no son lo mismo (D-192).
// Lo que no es un juego (el panel) es su propia carpeta.
const ruta = gameById(juego)?.path || `${juego}/`;
if (!camino) {
  const hay = Object.keys(CAMINOS[juego] || {});
  console.error(hay.length ? `No conozco "${pantalla}". Hay: ${hay.join(', ')}` : `No conozco el juego "${juego}". Hay: ${Object.keys(CAMINOS).join(', ')}`);
  process.exit(1);
}

// `--cdp` o PUERTO_CDP cambian el puerto de Chrome: dos sesiones mirando a la vez no se pisan (D-135)
const b = await launch({ port: Number(flag('cdp', process.env.PUERTO_CDP || '9451')), dir: `${salida}/perfil`, out: salida, width: ancho, height: alto });
await b.go(`${base}/${ruta}`, 1500);
// El idioma se guarda como texto pelado: getLang() compara contra ['es','en','pt'] y un
// JSON.stringify le dejaba las comillas dentro, así que --idioma no hacía nada.
// Un idioma del laboratorio (D-191) se ofrece solo con su marca puesta, como al entrar por /labs/de/
const labs = EN_LABS.includes(idioma) ? `localStorage.setItem('${LABS_KEY}', '${idioma}');` : '';
await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${idioma}'); ${labs} 1`);
await b.go(`${base}/${ruta}`, 1500);
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

// Por si un día una entrada lleva una barra: la captura queda plana
const nombre = `${juego.replace(/\//g, "-")}-${pantalla}-${ancho}`;
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
