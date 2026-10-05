// La app instalable (D-220): el manifest con sus íconos PNG, el service worker en la raíz, y cada
// página de la app con el ícono del iPhone y el registro del service worker después de sus hojas
// de estilo (el import map que pone publicar.yml va antes de la primera; un módulo antes de él lo
// dejaría sin efecto).
// Uso: node public/assets/js/instalable.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registrar } from './instalable.js';
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
    const registro = html.indexOf(`<script type="module">import '${prefijo}assets/js/instalable.js';</script>`);
    assert.ok(registro > 0, `${nombre}: falta importar instalable.js con la ruta ${prefijo}`);
    const ultimaHoja = html.lastIndexOf('<link rel="stylesheet"', registro);
    assert.ok(ultimaHoja < registro && html.indexOf('<link rel="stylesheet"') < registro, `${nombre}: instalable.js va después de las hojas de estilo`);
  }
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
