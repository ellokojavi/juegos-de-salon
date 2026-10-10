/**
 * ¿El material de marketing muestra la app de hoy? (U-34)
 *
 *   node tools/agents/marketing.mjs revisar            qué asset de marketing/registro.json quedó atrás
 *   node tools/agents/marketing.mjs anotar <id> --al-dia
 *   node tools/agents/marketing.mjs anotar <id> --pendiente "falta Desenredo" [--pendiente "…"]
 *
 * `revisar` compara lo que cada asset declara (versión de la app que muestra, juegos que salen)
 * contra la portada de hoy (public/assets/js/games.js) y la versión publicada en index.html, y lista los
 * commits que tocaron los juegos que muestra desde la fecha del asset. No decide: el agente de
 * usabilidad mira y anota con `anotar` en el campo `revision` del registro. Rehacer el asset es
 * otra tarea (el skill de cada asset; el video, `promo-video`), y la decide el dueño.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GAMES, SUELTOS, PORTADA } from '../../public/assets/js/games.js';
import { versionHoy } from '../release/version.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REGISTRO = join(RAIZ, 'marketing', 'registro.json');

/** Lo que un asset tiene atrasado respecto de la app de hoy. Puro: se prueba sin disco. */
export function atrasos(asset, { portada, version, nombre = id => id }) {
  const muestra = new Set([...(asset.juegos || []), ...(asset.grilla_mas || [])]);
  const hoy = new Set(portada);
  const avisos = [];
  // `seleccion`: el asset muestra a propósito solo algunos juegos (el video desde la v6), así que
  // uno nuevo de la portada no lo deja atrás
  const faltan = asset.seleccion ? [] : portada.filter(id => !muestra.has(id) && id !== 'copa');
  if (faltan.length) avisos.push(`juegos de la portada que no salen: ${faltan.map(nombre).join(', ')}`);
  // `laboratorio`: juegos que todavía no están en la portada a propósito (el teaser de El caso, D-265)
  const sobran = [...muestra].filter(id => !hoy.has(id) && !(asset.laboratorio || []).includes(id));
  if (sobran.length) avisos.push(`salen juegos que ya no están en la portada: ${sobran.map(nombre).join(', ')}`);
  if (asset.app && version && menor(asset.app, version)) avisos.push(`muestra la app ${asset.app}; hoy es ${version}`);
  return avisos;
}

// "0.82.x" < "0.88.0": compara mayor y menor, que es donde cambian las pantallas.
function menor(a, b) {
  const [a1, a2] = a.split('.').map(Number), [b1, b2] = b.split('.').map(Number);
  return a1 < b1 || (a1 === b1 && a2 < b2);
}

function commitsDesde(fecha, carpetas) {
  try {
    return execFileSync('git', ['log', '--oneline', '--no-merges', `--since=${fecha}`, '--', ...carpetas,
      // Hasta D-205 set-version.py estampaba todas las páginas: eso no cambia lo que se ve.
      ':(exclude,glob)**/index.html'],
      { cwd: RAIZ, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch { return []; }
}

// Las carpetas van en inglés y no son el id (D-192): un juego vive en public/<path>; un juego
// suelto, en public/<slug>/, y su motor y su pantalla en public/cup/games/<slug>/.
const carpetas = id => {
  const g = GAMES.find(x => x.id === id);
  if (g) return [`public/${g.path}`];
  const m = SUELTOS.find(x => x.id === id);
  return m ? [`public/${m.path}`, `public/cup/games/${m.slug}/`] : [];
};

function revisar() {
  const registro = JSON.parse(readFileSync(REGISTRO, 'utf8'));
  const portada = PORTADA.filter(g => g.available).map(g => g.id);
  const nombres = Object.fromEntries(PORTADA.map(g => [g.id, `${g.emoji} ${g.name.es}`]));
  const version = versionHoy();
  for (const a of registro.assets) {
    console.log(`\n${a.titulo} (${a.id}) · v${a.version} · ${a.fecha} · ${a.estado || ''}`);
    const avisos = atrasos(a, { portada, version, nombre: id => nombres[id] || id });
    for (const t of avisos) console.log(`  ⚠️  ${t}`);
    const commits = commitsDesde(a.fecha, (a.juegos || []).flatMap(carpetas));
    if (commits.length) {
      console.log(`  🔎 ${commits.length} commits tocaron los juegos que muestra desde ${a.fecha} (¿cambió algo que se ve?):`);
      for (const c of commits.slice(0, 15)) console.log(`     ${c}`);
      if (commits.length > 15) console.log(`     … y ${commits.length - 15} más`);
    }
    if (!avisos.length && !commits.length) console.log('  ✅ nada nuevo desde su fecha');
    if (a.revision) console.log(`  📝 última revisión ${a.revision.fecha}: ${a.revision.al_dia ? 'al día' : a.revision.pendiente.join(' · ')}`);
  }
}

function anotar(id, args) {
  const registro = JSON.parse(readFileSync(REGISTRO, 'utf8'));
  const a = registro.assets.find(x => x.id === id);
  if (!a) throw new Error(`no hay un asset "${id}" en marketing/registro.json`);
  const pendiente = [];
  for (let i = 0; i < args.length; i++) if (args[i] === '--pendiente') pendiente.push(args[++i]);
  if (!args.includes('--al-dia') && !pendiente.length) throw new Error('falta --al-dia o --pendiente "…"');
  a.revision = { fecha: new Date().toISOString().slice(0, 10), app: versionHoy(), al_dia: !pendiente.length, pendiente };
  writeFileSync(REGISTRO, JSON.stringify(registro, null, 2) + '\n');
  console.log(`${id}: ${a.revision.al_dia ? 'al día' : `pendiente: ${pendiente.join(' · ')}`}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [orden, ...resto] = process.argv.slice(2);
  try {
    if (orden === 'revisar') revisar();
    else if (orden === 'anotar') anotar(resto[0], resto.slice(1));
    else { console.log('uso: node tools/agents/marketing.mjs revisar | anotar <id> (--al-dia | --pendiente "…")'); process.exit(1); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
