/**
 * Hoja de hechos de la app: lo que el README afirma, leído del código real.
 *
 *   node tools/hechos.mjs            imprime el JSON
 *
 * No inventa nada ni describe: solo junta los datos que el README cuenta
 * (juegos, modos, temáticas, idiomas, módulos, tests, documentos, capturas)
 * importando los módulos de verdad. De acá
 * salen los bloques generados del README y la comparación que hace
 * `tools/readme.py revisar` para avisar que un cambio dejó el texto viejo.
 *
 * Regla de qué entra acá: un dato que, si cambia, obliga a mirar el README.
 * Los textos de ayuda y las bajadas quedan fuera a propósito: cambian seguido
 * y no se citan en el README, y un soplón que grita por todo no lo mira nadie.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = r => readFileSync(join(RAIZ, r), 'utf8');
const hay = r => { try { statSync(join(RAIZ, r)); return true; } catch { return false; } };

const IGNORA = new Set(['.git', '.claude', 'node_modules', 'arte-original']);
function archivos(dir = '', filtro = () => true) {
  const out = [];
  // Un juego recién agregado todavía no tiene carpeta de capturas: eso es cero capturas,
  // no una falla de la herramienta.
  if (!hay(dir)) return out;
  for (const nombre of readdirSync(join(RAIZ, dir))) {
    if (nombre.startsWith('.') || IGNORA.has(nombre)) continue;
    const rel = dir ? `${dir}/${nombre}` : nombre;
    if (statSync(join(RAIZ, rel)).isDirectory()) out.push(...archivos(rel, filtro));
    else if (filtro(rel)) out.push(rel);
  }
  return out.sort();
}

// ------------------------------------------------------------------ juegos

const { GAMES } = await import(join(RAIZ, 'assets/js/games.js'));
const { DECKS } = await import(join(RAIZ, 'linea-de-tiempo/decks/index.js'));
const { LANGS, COMMON } = await import(join(RAIZ, 'assets/js/i18n.js'));
const { FRASES } = await import(join(RAIZ, 'assets/js/frases.js'));

/** El estado publicado del juego, según la cabecera de su especificación. */
function estado(id) {
  const ruta = `docs/juegos/${id}.md`;
  if (!hay(ruta)) return null;
  const cabecera = leer(ruta).split('\n').slice(0, 6).join(' ');
  const m = cabecera.match(/\(v(\d+\.\d+)[^)]*\)/) || cabecera.match(/\*\*Versión:\*\*\s*(\d+\.\d+)/);
  return m ? `v${m[1]}` : null;
}

/** Los modos de juego: las claves modeX que tienen su modeXHint al lado. */
function modos(L) {
  return Object.keys(L).filter(k => /^mode[A-Z]/.test(k) && L[k + 'Hint'] !== undefined)
    .map(k => ({ clave: k, es: L[k] }));
}

/** Las variantes de un juego: claves modeX sin ayuda propia (el reparto de Línea de Tiempo). */
function variantes(L) {
  return Object.keys(L).filter(k => /^mode[A-Z]/.test(k) && !k.endsWith('Hint') && L[k + 'Hint'] === undefined)
    .map(k => ({ clave: k, es: L[k] }));
}

const juegos = [];
for (const g of GAMES) {
  const { LOCALES } = await import(join(RAIZ, g.id, 'rules.js'));
  const html = leer(`${g.id}/index.html`);
  juegos.push({
    id: g.id,
    emoji: g.emoji,
    nombre: g.name,
    jugadores: g.players.replace('–', ' a '),
    duracion: g.duration,
    disponible: g.available,
    estado: estado(g.id),
    modos: modos(LOCALES.es),
    variantes: variantes(LOCALES.es),
    pantallas: [...html.matchAll(/id="screen-([a-z-]+)"/g)].map(m => m[1]),
    chat: /id="chat"/.test(html),
    archivos: archivos(g.id, r => !r.endsWith('.test.mjs')),
  });
}

// ------------------------------------------------------------- lo compartido

const anios = cartas => [Math.min(...cartas.map(c => c.year)), Math.max(...cartas.map(c => c.year))];
const tematicas = DECKS.map(d => ({
  id: d.id, emoji: d.emoji, nombre: d.name, pista: d.hint, cartas: d.cards.length, desde: anios(d.cards)[0], hasta: anios(d.cards)[1],
}));

const modulos = archivos('', r => r.endsWith('.js') && !r.startsWith('tools/') && !r.endsWith('.test.mjs'));
const versionados = [...leer('tools/set-version.py').matchAll(/'([\w./-]+\.js)'/g)].map(m => m[1]);
const tests = archivos('', r => r.endsWith('.test.mjs'));
const e2e = archivos('tools/e2e', r => r.endsWith('.mjs') && !r.endsWith('cdp.mjs')).map(r => r.replace('tools/e2e/', ''));

// El título es el H1 del documento, sin el emoji con que termina.
const titulo = ruta => (leer(ruta).match(/^#\s+(.+)$/m) || [, ruta])[1]
  .replace(/[\p{Extended_Pictographic}\uFE0F\s]+$/u, '').trim();
const documentos = [
  ...archivos('docs', r => r.endsWith('.md')),
  'firebase/README.md', 'tools/e2e/README.md', 'CHANGELOG.md',
].filter(hay).map(ruta => ({ ruta, titulo: titulo(ruta) }));

const capturas = Object.fromEntries(GAMES.map(g => [g.id, archivos(`docs/screenshots/${g.id}`, r => r.endsWith('.png')).length]));

console.log(JSON.stringify({
  version: (leer('index.html').match(/v(\d+\.\d+\.\d+) ·/) || [, null])[1],
  app: Object.fromEntries(LANGS.map(l => [l, COMMON[l].appTitle])),
  idiomas: LANGS,
  frases: Object.fromEntries(LANGS.map(l => [l, FRASES[l].length])),
  clavesComunes: Object.keys(COMMON.es).length,
  juegos,
  tematicas,
  modulos,
  sinVersionar: modulos.filter(m => !versionados.includes(m)),
  tests,
  e2e,
  documentos,
  capturas,
}, null, 2));
