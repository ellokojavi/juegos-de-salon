// La puerta del laboratorio (D-281): sin la llave se va al menú, con ella se abre y queda guardada,
// y el link pierde la llave. Además, cada página de /labs/ (y las puentes que llevan ahí) carga la
// puerta antes que nada y pide no indexarse: una página nueva del laboratorio que la olvide falla aquí.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(AQUI, '../..');
const fuente = readFileSync(join(AQUI, 'labs-puerta.js'), 'utf8');

// Las llaves de verdad no están en el repo: la prueba pone huellas propias, una por persona (D-284)
const LLAVE = 'llave-de-prueba', OTRA = 'llave-de-otra';
const huella = k => createHash('sha256').update(k).digest('hex');
const conHuellas = (...llaves) => fuente.replace(/var HUELLAS = \{[\s\S]*?\};/, `var HUELLAS = { ${llaves.map((k, i) => `'p${i}': '${huella(k)}',`).join(' ')} };`);
let codigo = conHuellas(LLAVE, OTRA);
assert.notEqual(codigo, fuente, 'la puerta declara sus HUELLAS');

// Firebase (D-345): labsLlaves/<huella> = etiqueta. `red = false` simula estar sin conexión
let FIREBASE = {}, red = true;
const fetchFalso = async url => {
  if (!red) throw new Error('sin red');
  const h = String(url).match(/labsLlaves\/([0-9a-f]{64})\.json$/)?.[1];
  return { ok: true, json: async () => (h && FIREBASE[h]) ?? null };
};

async function visitar(url, guardada = null) {
  const u = new URL(url);
  const almacen = new Map(guardada ? [['juegos-de-salon:labs-llave', guardada]] : []);
  const r = { a: null, link: u.pathname + u.search + u.hash };
  const html = { style: { visibility: '' } };
  const ctx = {
    document: { documentElement: html },
    location: { search: u.search, pathname: u.pathname, hash: u.hash, hostname: u.hostname, replace: a => { r.a = a; } },
    history: { state: null, replaceState: (_, __, l) => { r.link = l; } },
    localStorage: { getItem: k => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v), removeItem: k => almacen.delete(k) },
    URLSearchParams, TextEncoder, crypto: globalThis.crypto, fetch: fetchFalso,
  };
  ctx.window = ctx;
  vm.runInNewContext(codigo, ctx);
  await new Promise(res => setTimeout(res, 20));
  return { ...r, visible: html.style.visibility !== 'hidden', guardada: almacen.get('juegos-de-salon:labs-llave') ?? null, quien: almacen.get('juegos-de-salon:labs-quien') ?? null };
}

const SITIO = 'https://juegosdesalon.cl';
let r = await visitar(`${SITIO}/labs/`);
assert.equal(r.a, '/', 'sin llave, al menú');
assert.equal(r.visible, false, 'y sin mostrar nada');

r = await visitar(`${SITIO}/labs/?key=otra`);
assert.equal(r.a, '/', 'con una llave equivocada, al menú');
assert.equal(r.guardada, null, 'y no la guarda');

r = await visitar(`${SITIO}/labs/case/?seed=KQRST&key=${LLAVE}#x`);
assert.equal(r.a, null, 'con la llave se queda');
assert.equal(r.visible, true, 'y se ve');
assert.equal(r.guardada, LLAVE, 'la llave queda en el celular');
assert.equal(r.link, '/labs/case/?seed=KQRST#x', 'y sale del link, con lo demás intacto');

r = await visitar(`${SITIO}/labs/code/`, LLAVE);
assert.ok(r.a === null && r.visible, 'con la llave guardada se entra sin ella en el link');

r = await visitar(`${SITIO}/labs/`, 'vieja');
assert.ok(r.a === '/' && r.guardada === null, 'una llave guardada que ya no sirve se borra');

r = await visitar(`${SITIO}/labs/?key=${OTRA}`);
assert.ok(r.a === null && r.visible && r.guardada === OTRA, 'cada persona entra con su propia llave');
assert.equal(r.quien, 'p1', 'y queda su etiqueta, para su feedback (D-306)');

// Sacar a una persona: su llave guardada ya no abre, y la de las demás sigue abriendo
codigo = conHuellas(LLAVE);
r = await visitar(`${SITIO}/labs/`, OTRA);
assert.ok(r.a === '/' && r.guardada === null && r.quien === null, 'una llave quitada ya no abre, aunque estuviera guardada');
r = await visitar(`${SITIO}/labs/`, LLAVE);
assert.ok(r.a === null && r.visible, 'y las demás siguen entrando');

// Las llaves de Firebase: entra con su etiqueta, se quita al instante, y sin red una ya guardada sigue entrando
const NUBE = 'llave-en-firebase';
FIREBASE = { [huella(NUBE)]: 'nube' };
r = await visitar(`${SITIO}/labs/?key=${NUBE}`);
assert.ok(r.a === null && r.visible && r.guardada === NUBE && r.quien === 'nube', 'una llave de Firebase abre y guarda su etiqueta');
red = false;
r = await visitar(`${SITIO}/labs/`, NUBE);
assert.ok(r.a === null && r.visible, 'sin red, una llave ya guardada sigue entrando');
r = await visitar(`${SITIO}/labs/?key=otra-nueva`);
assert.equal(r.a, '/', 'sin red, una llave nueva no entra');
red = true;
FIREBASE = {};
r = await visitar(`${SITIO}/labs/`, NUBE);
assert.ok(r.a === '/' && r.guardada === null, 'quitada de Firebase, ya no abre');

for (const local of ['http://localhost:8765/labs/', 'http://127.0.0.1:8765/labs/', 'https://mac-mini.tail1234.ts.net/labs/']) {
  r = await visitar(local);
  assert.ok(r.a === null && r.visible, `en ${new URL(local).hostname} se abre sola (los guiones, D-67)`);
}

// Cada página del laboratorio carga la puerta primero y no se indexa
const paginas = [];
const recorrer = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) recorrer(p); else if (f === 'index.html') paginas.push(p); } };
recorrer(join(PUBLIC, 'labs'));
assert.ok(paginas.length >= 3, 'el laboratorio tiene sus páginas');
for (const p of paginas) {
  const html = readFileSync(p, 'utf8');
  const rel = p.slice(PUBLIC.length);
  // A game that left the lab (D-332) leaves a bridge to its public page: that one has no door
  if (/Bridge page \(D-192\): this route moved to \/(?!labs\/)/.test(html)) continue;
  const puerta = html.search(/<script src="(\.\.\/)+assets\/js\/labs-puerta\.js"><\/script>/);
  assert.ok(puerta > 0, `${rel} carga la puerta`);
  const primerScript = html.search(/<script[\s>]/);
  const vigia = html.indexOf('vigia.js');
  assert.ok(puerta === primerScript || (vigia > 0 && puerta < vigia), `${rel} carga la puerta antes que sus otros scripts`);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/, `${rel} no se indexa`);
}

// Las puentes que llevan al laboratorio (/case/…) tampoco se indexan
const puentes = [];
const buscar = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'labs') buscar(p); } else if (f === 'index.html') puentes.push(p); } };
buscar(PUBLIC);
const aLabs = puentes.filter(p => /(?:Bridge page|Página puente)[^>]*(?:moved to|se mudó a) \/labs\//.test(readFileSync(p, 'utf8')));
assert.ok(aLabs.length >= 1, 'hay puentes al laboratorio');
for (const p of aLabs) assert.match(readFileSync(p, 'utf8'), /<meta name="robots" content="noindex, nofollow">/, `${p.slice(PUBLIC.length)} no se indexa`);

console.log(`✓ la puerta del laboratorio · ${paginas.length} páginas y ${aLabs.length} puentes`);
