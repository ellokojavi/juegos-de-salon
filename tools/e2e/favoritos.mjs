// Los favoritos de la portada (D-238): la ⭐ de cada tarjeta marca sin abrir el juego, la ficha
// "⭐ Favoritos" aparece con el primero y deja ver solo esos, se recuerdan al recargar, el dado
// y las fichas caben a 320 px en los cuatro idiomas: Favoritos en su línea y los tipos en otra.
// Uso: node tools/e2e/favoritos.mjs /tmp/favoritos
import { launch, sleep } from './cdp.mjs';
const SITIO = process.env.SITIO || 'http://localhost:8765';
const OUT = process.argv[2] || '/tmp/favoritos';
let mal = 0;
const ver = (ok, que) => { console.log(`${ok ? '✓' : '✗'} ${que}`); if (!ok) mal++; };
const b = await launch({ dir: `${OUT}/p`, out: OUT });
const leer = () => b.evaluate(`JSON.stringify({
  ficha: !document.querySelector('.filtros .favs').hidden,
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

// A 320 px, con Favoritos, los cuatro tipos siguen en una fila y nada se sale, en cada idioma
for (const lang of ['es', 'en', 'pt', 'de']) {
  const c = await launch({ dir: `${OUT}/p320${lang}`, out: OUT, width: 320, height: 700 });
  await c.go(`${SITIO}/?lang=${lang}`, 1500);
  await c.evaluate(`localStorage.setItem('juegos-de-salon:favoritos', '["ahorcado","tango"]'); 1`);
  await c.go(`${SITIO}/?lang=${lang}&type=favorites`, 1500);
  const f = await c.evaluate(`JSON.stringify((() => { const bs = [...document.querySelectorAll('.filtros .tipos button')];
    const fav = document.querySelector('.ficha-fav').getBoundingClientRect();
    const tops = new Set(bs.map(x => Math.round(x.getBoundingClientRect().top)));
    const fila = document.querySelector('.filtros .tipos').getBoundingClientRect();
    return { n: bs.length, filas: tops.size, sale: bs.some(x => x.getBoundingClientRect().right > fila.right + 1), favArriba: fav.bottom <= fila.top && fav.height >= 44, ancho: document.documentElement.scrollWidth };
  })())`).then(JSON.parse);
  ver(f.n === 4 && f.filas === 1 && !f.sale && f.favArriba && f.ancho <= 320, `${lang} a 320 px: ⭐ Favoritos arriba y los ${f.n} tipos en una fila, sin salirse (${JSON.stringify(f)})`);
  await c.evaluate(`scrollTo(0, 0); 1`);
  await c.shot(`portada-320-${lang}`);
  ver(!c.errors.length, `${lang}: sin errores en la consola ${JSON.stringify(c.errors)}`);
  c.close();
}
if (mal) process.exit(1);
