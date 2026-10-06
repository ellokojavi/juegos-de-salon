// Los favoritos de la portada (D-238): la ⭐ de cada tarjeta marca sin abrir el juego, la ficha
// "⭐ Favoritos" aparece con el primero y deja ver solo esos, se recuerdan al recargar, el dado
// y Favoritos va en la fila de tipos donde cabe y en su línea donde no, en los cuatro idiomas.
// Uso: node tools/e2e/favoritos.mjs /tmp/favoritos
import { launch, sleep } from './cdp.mjs';
const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || '/tmp/favoritos';
let mal = 0;
const ver = (ok, que) => { console.log(`${ok ? '✓' : '✗'} ${que}`); if (!ok) mal++; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const leer = () => b.evaluate(`JSON.stringify({
  ficha: !document.querySelector('.ficha-fav').hidden,
  on: document.querySelector('.ficha-fav').getAttribute('aria-pressed'),
  filtro: __portada.filtro.tipo, visibles: __portada.visibles, favoritos: __portada.favoritos,
  cuenta: document.getElementById('filtros-cuenta').hidden ? '' : document.getElementById('filtros-cuenta').textContent,
  url: location.search,
})`).then(JSON.parse);
// La ⭐ se toca con el dedo de verdad: si quedara dentro del link, el toque abriría el juego
const tocarEstrella = async id => {
  const r = await b.evaluate(`(() => { const e = document.querySelector('.fav[data-id="${id}"]'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }); })()`).then(JSON.parse);
  await b.toque(r.x, r.y); await sleep(300);
  return r;
};

await b.go(`${SITIO}/`, 1500);
await b.evaluate(`localStorage.removeItem('juegos-de-salon:favoritos'); 1`);
await b.go(`${SITIO}/`, 1500);
let e = await leer();
ver(!e.ficha && !e.favoritos.length, 'sin favoritos, la ficha ⭐ Favoritos no está');
const n = await b.evaluate(`document.querySelectorAll('.fav').length`);
const copa = await b.evaluate(`!!document.querySelector('.game-card.torneo').closest('.game-slot')`);
ver(n >= 10 && !copa, `cada juego lleva su ⭐ (${n}) y La Copa no`);

const r = await tocarEstrella('ahorcado');
ver(r.w >= 44 && r.h >= 44, `la ⭐ mide 44 px de toque (${r.w}×${r.h})`);
e = await leer();
ver(e.url === '' && e.favoritos.join() === 'ahorcado', 'tocar la ⭐ marca el juego y no lo abre');
ver(e.ficha, 'con el primer favorito aparece la ficha ⭐ Favoritos');
ver(await b.evaluate(`document.querySelector('.fav[data-id="ahorcado"]').getAttribute('aria-pressed')`) === 'true', 'la ⭐ marcada dice aria-pressed="true"');
await tocarEstrella('dudo');

await b.evaluate(`document.querySelector('.ficha-fav').click(); 1`); await sleep(400);
e = await leer();
ver(e.filtro === 'favorites' && e.visibles.join() === 'ahorcado,dudo', `con ⭐ Favoritos se ven solo los dos (${e.visibles.join()})`);
ver(/2/.test(e.cuenta) && e.url === '?type=favorites', `la cuenta dice cuántos y el filtro va en la URL (${e.cuenta} · ${e.url})`);

// Al desmarcar estando en Favoritos, la tarjeta sigue a la vista: se puede volver a marcar
await tocarEstrella('dudo');
e = await leer();
ver(e.visibles.includes('dudo') && e.favoritos.join() === 'ahorcado', 'desmarcar en Favoritos no la saca de la vista');
await tocarEstrella('dudo');

// Se recuerdan al recargar, y el link con ?type=favorites vuelve filtrado
await b.go(`${SITIO}/?type=favorites`, 1500);
e = await leer();
ver(e.favoritos.join() === 'ahorcado,dudo' && e.filtro === 'favorites' && e.visibles.join() === 'ahorcado,dudo', 'al recargar siguen marcados y filtrados');

// Desmarcar el último estando en Favoritos: se ven todos y la ficha se va
await tocarEstrella('ahorcado'); await tocarEstrella('dudo');
e = await leer();
ver(!e.ficha && !e.filtro && e.visibles.length > 10 && e.url === '', 'sin favoritos que mostrar, se ven todos y se va la ficha');

// Un link ?type=favorites en un celular sin favoritos: todos, sin ruido
await b.go(`${SITIO}/?type=favorites`, 1500);
e = await leer();
ver(!e.filtro && e.visibles.length > 10 && e.cuenta === '', '?type=favorites sin favoritos muestra todos');
b.close();

// Dónde va ⭐ Favoritos (D-241), en cada idioma: a 390 px y en un computador (la portada no pasa
// del ancho de un celular), primera en la fila de tipos; a 320 px, donde quepa (el inglés cabe en
// la fila; los otros tres, en su línea). Siempre los tipos van en una fila y nada se sale.
const ANCHOS = [[320, 'donde quepa'], [390, 'fila'], [900, 'fila']];
const a320 = [];
for (const [ancho, espera] of ANCHOS) for (const lang of ['es', 'en', 'pt', 'de']) {
  const c = await launch({ dir: `${OUT}/p${ancho}${lang}`, out: OUT, width: ancho, height: 700 });
  await c.go(`${SITIO}/?lang=${lang}`, 1500);
  await c.evaluate(`localStorage.setItem('juegos-de-salon:favoritos', '["ahorcado","tango"]'); 1`);
  await c.go(`${SITIO}/?lang=${lang}&type=favorites`, 1500);
  const f = await c.evaluate(`JSON.stringify((() => { const tipos = document.querySelector('.filtros .tipos');
    const bs = [...tipos.querySelectorAll('button')].filter(x => !x.hidden);
    const fav = document.querySelector('.ficha-fav'), rf = fav.getBoundingClientRect(), fila = tipos.getBoundingClientRect();
    const tops = new Set(bs.map(x => Math.round(x.getBoundingClientRect().top)));
    const enFila = fav.parentNode === tipos, nombre = getComputedStyle(fav.lastChild).display !== 'none';
    return { forma: enFila ? (nombre ? 'fila con nombre' : 'fila') : 'linea', primera: !enFila || bs[0] === fav,
      arriba: enFila || rf.bottom <= fila.top, toque: rf.height >= 44 && rf.width >= 44,
      filas: tops.size, sale: bs.some(x => x.getBoundingClientRect().right > fila.right + 1), ancho: document.documentElement.scrollWidth,
      // Si algo se sale de la pantalla, cuál (contra el ancho pedido y no innerWidth: en un celular
      // emulado, la pantalla se ensancha con lo que se sale). Los brillos del fondo no cuentan
      fuera: [...document.querySelectorAll('body *')].filter(x => x.getBoundingClientRect().right > ${ancho} + 0.5 && !x.closest('[hidden], .bg-sparkles'))
        .map(x => (x.id ? '#' + x.id : x.className ? '.' + String(x.className).split(' ')[0] : x.tagName) + ' «' + x.textContent.trim().slice(0, 24) + '» en ' + (x.parentElement.className || x.parentElement.tagName) + ':' + Math.round(x.getBoundingClientRect().right)
          + ' fuente ' + getComputedStyle(x).fontFamily.slice(0, 30)).slice(0, 6) };
  })())`).then(JSON.parse);
  const forma = espera === 'fila' ? f.forma.startsWith('fila') : true;
  if (ancho === 320) a320.push(f.forma);
  ver(forma && f.primera && f.arriba && f.toque && f.filas === 1 && !f.sale && f.ancho <= ancho,
    `${lang} a ${ancho} px: ⭐ Favoritos en ${espera}, los tipos en una fila y nada se sale (${JSON.stringify(f)})`);
  await c.evaluate(`scrollTo(0, 0); 1`);
  await c.shot(`portada-${ancho}-${lang}`);
  ver(!c.errors.length, `${lang} a ${ancho} px: sin errores en la consola ${JSON.stringify(c.errors)}`);
  c.close();
}
ver(a320.includes('linea'), `a 320 px, donde no cabe en la fila, va en su línea (${a320.join(', ')})`);
if (mal) process.exit(1);
