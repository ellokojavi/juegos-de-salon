/**
 * La portada al día (U-36): qué juegos toca un PR y qué dice su portada, para releerla.
 *
 *   node tools/agents/portadas.mjs revisar [base]     (base: origin/main)
 *
 * Por cada juego del laboratorio que el PR cambia (public/labs/<carpeta>/), muestra el lema, los pasos
 * de «Cómo se juega» y su tarjeta en el laboratorio, y avisa ⚠️ si el juego cambió pero su portada no:
 * es lo que pasó con Pintaminas, que sumó colores, ayuda y rendirse con los pasos del primer día.
 * Para los juegos del menú y de La Copa nombra los archivos, para releer su intro a mano. No decide
 * nada: el agente de usabilidad relee y corrige en el mismo PR.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const git = (...a) => execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8' });

/** El lema y los pasos de «Cómo se juega» de un game.js del laboratorio (el objeto de textos `T`). */
export function portadaDe(fuente) {
  const lema = (fuente.match(/^\s*lema: (['`])(.*?)\1/m) || [])[2] || null;
  const i = fuente.indexOf('como: [');
  const bloque = i < 0 ? '' : fuente.slice(i, fuente.indexOf('\n  ],', i));
  const pasos = [...bloque.matchAll(/\['([^']+)', ([`'])(.*?)\2\]/g)].map(m => `${m[1]} ${m[3]}`);
  return { lema, pasos };
}

/** Los juegos que tocan los archivos cambiados: los del laboratorio por su carpeta, y el resto aparte. */
export function juegosTocados(archivos) {
  const labs = new Set(), otros = new Set();
  for (const f of archivos) {
    const l = f.match(/^public\/labs\/([a-z-]+)\//);
    if (l) { labs.add(l[1]); continue; }
    const c = f.match(/^public\/cup\/games\/([a-z-]+)\//) || f.match(/^public\/([a-z-]+)\/(game|engine|ui|rules)[^/]*\.js$/);
    if (c) otros.add(c[1]);
  }
  return { labs: [...labs], otros: [...otros] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, base = 'origin/main'] = process.argv.slice(2);
  if (cmd !== 'revisar') { console.error('Uso: node tools/agents/portadas.mjs revisar [base]'); process.exit(1); }
  const archivos = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
  const { labs, otros } = juegosTocados(archivos);
  if (!labs.length && !otros.length) { console.log('✓ el PR no toca ningún juego: no hay portadas que releer'); process.exit(0); }
  const indice = existsSync(join(RAIZ, 'public/labs/index.html')) ? readFileSync(join(RAIZ, 'public/labs/index.html'), 'utf8') : '';
  for (const slug of labs) {
    const archivo = `public/labs/${slug}/game.js`;
    if (!existsSync(join(RAIZ, archivo))) continue;
    const { lema, pasos } = portadaDe(readFileSync(join(RAIZ, archivo), 'utf8'));
    const diff = git('diff', `${base}...HEAD`, '--', archivo);
    const tocoPortada = /^[+-]\s*(lema:|\['[^']+', [`'])/m.test(diff);
    const codigo = archivos.filter(f => f.startsWith(`public/labs/${slug}/`) && !f.endsWith('.css'));
    console.log(`\n🕹️  ${slug} — cambiaron: ${codigo.join(', ') || '(solo estilos)'}`);
    console.log(`   lema: ${lema ?? '(sin lema)'}`);
    pasos.forEach((p, k) => console.log(`   ${k + 1}. ${p}`));
    const tarjeta = (indice.match(new RegExp(`href="${slug}/"`)) && indice.split(`href="${slug}/"`)[0].split('<section').pop().replace(/^[^>]*>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) || '';
    if (tarjeta) console.log(`   tarjeta del laboratorio: ${tarjeta.replace(/\s*<a class.*$/, '').slice(0, 400)}`);
    if (codigo.some(f => /(engine|game)\.js$/.test(f)) && !tocoPortada) console.log('   ⚠️  el juego cambió y su portada no: relee que el lema, los pasos y la tarjeta digan cómo se juega hoy (U-36)');
    else console.log('   ✓ la portada cambió en este PR: relee que esté completa (U-18: ≤3 pasos, ≤280 caracteres)');
  }
  for (const id of otros) console.log(`\n🕹️  ${id} (menú o La Copa): relee su intro y sus reglas (las de la copa en public/cup/rules.js) contra lo que cambió (U-36)`);
}
