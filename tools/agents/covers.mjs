/**
 * La portada al día (U-36): qué juegos toca un PR y qué dice su portada, para releerla.
 *
 *   node tools/agents/covers.mjs revisar [base]     (base: origin/main)
 *
 * Por cada juego del laboratorio que el PR cambia (public/labs/<carpeta>/), muestra el lema, los pasos
 * de «Cómo se juega» y su tarjeta en el laboratorio, y avisa ⚠️ si el juego cambió pero su portada no:
 * es lo que pasó con Pintaminas, que sumó colores, ayuda y rendirse con los pasos del primer día.
 * Para los juegos del menú y de La Copa nombra los archivos, para releer su intro a mano. No decide
 * nada: el agente de usabilidad relee y corrige en el mismo PR.
 *
 * Y dice la etapa del PR, que decide cuánta revisión de usabilidad lleva (D-304): 🧪 solo del
 * laboratorio (corta: esto y las pantallas que cambiaron, a 320 px), 🎓 un juego que sale del
 * laboratorio (pasada completa al juego entero), o del sitio (como siempre).
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

/**
 * Los pasos con sus `${…}` resueltos contra las constantes del juego (las de su engine.js), y su
 * largo junto, como lo cuenta la prueba de U-18 para los juegos de La Copa: el laboratorio no la tiene.
 */
export function pasosResueltos(pasos, constantes) {
  const nombres = Object.keys(constantes), valores = Object.values(constantes);
  const resueltos = pasos.map(p => p.replace(/\$\{([^}]+)\}/g, (_, expr) => String(new Function(...nombres, `return (${expr})`)(...valores))));
  return { resueltos, largo: resueltos.map(p => p.replace(/^\S+ /, '')).join(' ').length };
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

/**
 * Los juegos que un PR saca del laboratorio (D-304): los que pierden `labs: true` en games.js o en
 * cup/rules.js (como Desenredo, D-190), y las carpetas que se mudan de public/labs/<x>/ a otra parte
 * (D-267). `diff` es el de esos dos archivos; `nombres`, el de `git diff --name-status -M`.
 */
export function salidasDeLabs(diff, nombres) {
  const salen = new Set();
  const lineas = diff.split('\n');
  lineas.forEach((l, i) => {
    if (!/^-.*\blabs: true\b/.test(l) || lineas.some(x => x === '+' + l.slice(1))) return; // movida, no quitada
    const enLinea = l.match(/^-\s*'?([\w-]+)'?: \{.*labs: true/);
    if (enLinea) return salen.add(enLinea[1]);
    for (let j = i - 1; j >= 0 && !lineas[j].startsWith('@@'); j--) {
      const m = lineas[j].match(/^[ -]\s*(?:slug|id): '([^']+)'/);
      if (m) return salen.add(m[1]);
    }
    salen.add('(un juego)');
  });
  for (const l of nombres.split('\n')) {
    const [estado, antes, despues] = l.split('\t');
    const m = /^R/.test(estado || '') && antes.match(/^public\/labs\/([a-z-]+)\//);
    if (m && !despues.startsWith('public/labs/')) salen.add(m[1]);
  }
  return [...salen];
}

/** La etapa de un PR (D-304): 'sale', 'laboratorio', 'sitio' o 'sin-app'. */
export function etapa(archivos, salidas) {
  if (salidas.length) return 'sale';
  const app = archivos.filter(f => f.startsWith('public/'));
  if (!app.length) return 'sin-app';
  return app.every(f => f.startsWith('public/labs/')) ? 'laboratorio' : 'sitio';
}

export const ETAPAS = {
  sale: s => `🎓 ${s.join(', ')} sale del laboratorio: pasada completa de usabilidad al juego entero —todas sus pantallas, los cuatro idiomas, 320 px, su portada y su lugar en la portada general— y documentación con README y tarjeta social (D-304)`,
  laboratorio: () => '🧪 PR solo del laboratorio: usabilidad corta —esta revisión de portadas y las pantallas que cambiaron, a 320 px— y documentación (D-304)',
  sitio: () => 'PR del sitio: usabilidad y documentación, como siempre (D-132, D-204)',
  'sin-app': () => 'El PR no toca public/: usabilidad no tiene pantallas que mirar',
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, base = 'origin/main'] = process.argv.slice(2);
  if (cmd !== 'revisar') { console.error('Uso: node tools/agents/covers.mjs revisar [base]'); process.exit(1); }
  const archivos = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean);
  const salidas = salidasDeLabs(git('diff', `${base}...HEAD`, '--', 'public/assets/js/games.js', 'public/cup/rules.js'), git('diff', '--name-status', '-M', `${base}...HEAD`));
  console.log(`Etapa: ${ETAPAS[etapa(archivos, salidas)](salidas)}`);
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
    const motor = join(RAIZ, `public/labs/${slug}/engine.js`);
    const { resueltos, largo } = pasosResueltos(pasos, existsSync(motor) ? { ...(await import(motor)) } : {});
    resueltos.forEach((p, k) => console.log(`   ${k + 1}. ${p}`));
    console.log(`   ${largo <= 280 && pasos.length <= 3 ? '✓' : '⚠️ '} ${pasos.length} pasos, ${largo} caracteres (U-18: hasta 3 y 280)`);
    const tarjeta = (indice.match(new RegExp(`href="${slug}/"`)) && indice.split(`href="${slug}/"`)[0].split('<section').pop().replace(/^[^>]*>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) || '';
    if (tarjeta) console.log(`   tarjeta del laboratorio: ${tarjeta.replace(/\s*<a class.*$/, '').slice(0, 400)}`);
    if (codigo.some(f => /(engine|game)\.js$/.test(f)) && !tocoPortada) console.log('   ⚠️  el juego cambió y su portada no: relee que el lema, los pasos y la tarjeta digan cómo se juega hoy (U-36)');
    else console.log('   ✓ la portada cambió en este PR: relee que esté completa y diga cómo se juega hoy');
  }
  for (const id of otros) console.log(`\n🕹️  ${id} (menú o La Copa): relee su intro y sus reglas (las de la copa en public/cup/rules.js) contra lo que cambió (U-36)`);
}
