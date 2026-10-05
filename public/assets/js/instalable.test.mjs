// La app instalable (D-221): el manifest con sus íconos PNG, el service worker en la raíz, y cada
// página de la app con el ícono del iPhone y el registro del service worker después de sus hojas
// de estilo (el import map que pone publicar.yml va antes de la primera; un módulo antes de él lo
// dejaría sin efecto).
// Uso: node public/assets/js/instalable.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registrar, nombrar, manifestDe } from './instalable.js';
import { COMMON, IDIOMAS } from './i18n.js';
import { ICONOS } from '../../../tools/release/iconos.mjs';
import { GAMES, SUELTOS } from './games.js';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let n = 0;
const caso = async (nombre, fn) => { await fn(); n++; };

/** Ancho y alto de un PNG, de su cabecera IHDR. */
const medida = archivo => { const b = readFileSync(archivo); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

const paginas = (dir = PUBLIC) => readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? paginas(p) : f === 'index.html' ? [p] : [];
});

await caso('el manifest trae los PNG que Android pide para instalar, con su medida real', () => {
  const m = JSON.parse(readFileSync(join(PUBLIC, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.scope, './');
  const png = m.icons.filter(i => i.type === 'image/png');
  for (const lado of [192, 512]) assert.ok(png.some(i => i.sizes === `${lado}x${lado}` && !i.purpose), `falta el ícono de ${lado}`);
  assert.ok(png.some(i => i.purpose === 'maskable'), 'falta el ícono maskable');
  for (const i of m.icons) {
    const archivo = join(PUBLIC, i.src);
    assert.ok(existsSync(archivo), `${i.src} no existe`);
    if (i.type === 'image/png') assert.equal(medida(archivo).join('x'), i.sizes, `${i.src} no mide ${i.sizes}`);
  }
});

await caso('los íconos de tools/release/iconos.mjs están todos, con su medida', () => {
  for (const i of ICONOS) assert.deepEqual(medida(join(PUBLIC, 'assets/icons', i.archivo)), [i.lado, i.lado], i.archivo);
});

await caso('el service worker vive en la raíz y no toca la red (sin evento fetch)', () => {
  const sw = readFileSync(join(PUBLIC, 'sw.js'), 'utf8');
  assert.ok(!/addEventListener\(\s*['"]fetch/.test(sw), 'sw.js no debe manejar fetch: dejaría celulares con versiones viejas');
});

await caso('cada juego del registro tiene su página con manifest (un juego nuevo no queda afuera)', () => {
  for (const g of [...GAMES, ...SUELTOS]) {
    const html = readFileSync(join(PUBLIC, g.path, 'index.html'), 'utf8');
    assert.match(html, /<link rel="manifest"/, `${g.path}index.html no lleva el manifest`);
  }
});

await caso('cada página con manifest lleva el ícono del iPhone y registra el service worker', () => {
  const conManifest = paginas().filter(p => /<link rel="manifest"/.test(readFileSync(p, 'utf8')));
  assert.ok(conManifest.length >= 19, `solo ${conManifest.length} páginas con manifest`);
  for (const p of conManifest) {
    const html = readFileSync(p, 'utf8');
    const nombre = relative(PUBLIC, p);
    const prefijo = '../'.repeat(nombre.split('/').length - 1) || './';
    assert.ok(html.includes(`<link rel="apple-touch-icon" href="${prefijo === './' ? '' : prefijo}assets/icons/apple-touch-icon.png">`), `${nombre}: falta el apple-touch-icon`);
    assert.ok(html.includes('<meta name="apple-mobile-web-app-title" content="Juegos de Salón">'), `${nombre}: falta el nombre de la app para el iPhone`);
    // El manifest del idioma se elige mientras se lee la página, justo después del link (D-222)
    const tras = html.slice(html.indexOf('<link rel="manifest"'), html.indexOf('<link rel="manifest"') + 900);
    const idiomas = /test\(l\)/.test(tras) && /\/\^\(([a-z|]+)\)\$\//.exec(tras)?.[1];
    assert.equal(idiomas, IDIOMAS.filter(l => l !== 'es').join('|'), `${nombre}: falta el script que elige el manifest del idioma, o no trae todos los idiomas`);
    const registro = html.indexOf(`<script type="module">import '${prefijo}assets/js/instalable.js';</script>`);
    assert.ok(registro > 0, `${nombre}: falta importar instalable.js con la ruta ${prefijo}`);
    const ultimaHoja = html.lastIndexOf('<link rel="stylesheet"', registro);
    assert.ok(ultimaHoja < registro && html.indexOf('<link rel="stylesheet"') < registro, `${nombre}: instalable.js va después de las hojas de estilo`);
  }
});

await caso('un manifest por idioma, con el nombre de la app en ese idioma y todo lo demás igual (D-222)', () => {
  const es = JSON.parse(readFileSync(join(PUBLIC, 'manifest.webmanifest'), 'utf8'));
  for (const lang of IDIOMAS) {
    const m = JSON.parse(readFileSync(join(PUBLIC, manifestDe(lang)), 'utf8'));
    assert.equal(m.name, COMMON[lang].appTitle, `${manifestDe(lang)}: name`);
    assert.equal(m.short_name, COMMON[lang].appTitle, `${manifestDe(lang)}: short_name`);
    assert.equal(m.description, COMMON[lang].appSub, `${manifestDe(lang)}: description`);
    assert.equal(m.lang, lang);
    const resto = x => JSON.stringify({ ...x, name: 0, short_name: 0, description: 0, lang: 0 });
    assert.equal(resto(m), resto(es), `${manifestDe(lang)} difiere del español en algo más que el idioma (el id tiene que ser el mismo: es una sola app)`);
  }
});

/** Un documento mínimo: el link del manifest, y el meta del iPhone si la página lo trae. */
function documento({ conMeta = true } = {}) {
  const link = { href: 'https://juegosdesalon.cl/manifest.webmanifest' };
  let meta = conMeta ? { name: 'apple-mobile-web-app-title', content: 'Juegos de Salón' } : null;
  return {
    head: { appendChild: el => { meta = el; } },
    createElement: () => ({}),
    querySelector: sel => (sel.includes('manifest') ? link : meta),
    get link() { return link; }, get meta() { return meta; },
  };
}

await caso('nombrar: cambia el manifest y el nombre del iPhone al idioma elegido', () => {
  const raiz = new URL('https://juegosdesalon.cl/');
  const d = documento();
  assert.equal(nombrar({ doc: d, lang: 'pt', raiz }), 'Jogos de Salão');
  assert.equal(d.link.href, 'https://juegosdesalon.cl/manifest.pt.webmanifest');
  assert.equal(d.meta.content, 'Jogos de Salão');
  const sinMeta = documento({ conMeta: false });
  nombrar({ doc: sinMeta, lang: 'de', raiz });
  assert.equal(sinMeta.meta.content, 'Salonspiele');
  assert.equal(sinMeta.meta.name, 'apple-mobile-web-app-title');
  const es = documento();
  nombrar({ doc: es, lang: 'es', raiz });
  assert.equal(es.link.href, 'https://juegosdesalon.cl/manifest.webmanifest');
  assert.equal(nombrar({ doc: { querySelector: () => null }, lang: 'en', raiz }), null);
});

await caso('registrar: usa sw.js de la raíz con alcance en la raíz', async () => {
  const llamadas = [];
  const nav = { serviceWorker: { register: async (url, op) => { llamadas.push([url, op.scope]); return 'ok'; } } };
  assert.equal(await registrar({ nav, raiz: new URL('https://juegosdesalon.cl/') }), 'ok');
  assert.deepEqual(llamadas, [['/sw.js', '/']]);
});

await caso('registrar: sin service workers o con error, la página sigue', async () => {
  assert.equal(await registrar({ nav: {} }), null);
  const nav = { serviceWorker: { register: async () => { throw new Error('SecurityError'); } } };
  assert.equal(await registrar({ nav, raiz: new URL('https://juegosdesalon.cl/') }), null);
});

console.log(`instalable: ${n} casos en verde`);
