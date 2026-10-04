// Corre las pruebas de punta a punta que no tocan el Firebase de producción (D-193).
//
// Uso:
//   node tools/e2e/ci.mjs                 # todas, una tras otra, con el resumen al final
//   node tools/e2e/ci.mjs --lista         # los guiones que corren, en JSON (para la matriz de GitHub)
//   node tools/e2e/ci.mjs --lista --cambios <archivo>   # [] si el PR solo trae documentación (D-205)
//   node tools/e2e/ci.mjs cup/torneo.mjs  # solo esos (la ruta desde tools/e2e/)
//   node tools/e2e/ci.mjs cup/torneo.mjs:copa   # solo una parte de un guion largo (ver PARTES)
//
// Necesita el sitio servido en http://localhost:8765 (los guiones lo tienen fijo) y Chrome en
// CHROME. Un guion falla si sale con error, si imprime una línea con ✗ o ❌, o si no termina en
// TOPE_MS. Muchos guiones solo imprimen lo que ven, para que lo lea una persona: en CI igual
// pillan lo que se rompe del todo (un botón que ya no está hace caer el guion).
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, statSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUELTOS } from '../../public/assets/js/games.js';
import { soloDocumentos } from './cambios.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = process.env.SALIDA_E2E || '/tmp/e2e';
const TOPE_MS = 15 * 60 * 1000;

// No son pruebas: miran o arman hojas de capturas
const HERRAMIENTAS = new Set(['cdp.mjs', 'ci.mjs', 'mirar.mjs', 'contacto.mjs', 'caminos.mjs', 'idiomas-comun.mjs', 'cambios.mjs']);
// Abren salas o se unen a ellas en el Firebase de producción: siguen a mano
const CON_FIREBASE = /(^|\/)(online|chat)\.mjs$/;
const TAMBIEN_FIREBASE = new Set([
  'versionado.mjs',                // abre una sala para ver que firebase.js carga versionado
  'compartir-sala.mjs',            // abre una sala de Línea de Tiempo
  'enlace-invitacion.mjs',         // entra a ?sala= en los cuatro juegos con sala
  'idioma-por-url.mjs',            // abre /liars-dice/?sala=WFBN
  'timeline/veredicto.mjs',        // dos celulares en una sala
  'timeline/pozo.mjs',             // la segunda mitad juega en una sala
]);

// Prueban algo que ya no existe: quedan fuera hasta que alguien los reescriba
const OBSOLETOS = new Set([
  'timeline/error.mjs',            // jugaba contra el celular, un modo que Línea de Tiempo ya no tiene (D-142)
]);

// Los guiones largos se reparten en partes, cada una en su propio job de GitHub: el más lento
// marca cuánto tarda el check entero. Cada parte llega al guion como `--parte <nombre>`. Aquí,
// sin parte, se corren enteros.
const PARTES = {
  'cup/torneo.mjs': ['copa', 'laboratorio', 'demos'],
  'cup-games/idiomas.mjs': SUELTOS.map(m => m.slug),
};

/** Los guiones, con su ruta desde tools/e2e/: los de cada juego van en su carpeta (D-192). */
const todos = (dir = '') => readdirSync(join(AQUI, dir)).flatMap(f => {
  const rel = dir ? `${dir}/${f}` : f;
  return statSync(join(AQUI, rel)).isDirectory() ? todos(rel) : [rel];
});

export const guiones = () => todos()
  .filter(f => f.endsWith('.mjs') && !f.endsWith('.test.mjs'))
  .filter(f => !HERRAMIENTAS.has(f) && !CON_FIREBASE.test(f) && !TAMBIEN_FIREBASE.has(f) && !OBSOLETOS.has(f))
  .sort();

/** Lo que corre GitHub: cada guion, o cada parte de los que tienen (`cup/torneo.mjs:copa`). */
export const trabajos = () => guiones().flatMap(g => PARTES[g] ? PARTES[g].map(p => `${g}:${p}`) : [g]);

/** Corre un guion o una parte suya (`guion:parte`); resuelve con { ok, motivo, ms, salida }. */
function correr(guion) {
  const [archivo, parte] = guion.split(':');
  const dir = join(SALIDA, archivo.replace(/\.mjs$/, ''), parte || '');
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  return new Promise(ok => {
    const p = spawn(process.execPath, [join(AQUI, archivo), dir, ...(parte ? ['--parte', parte] : [])], { stdio: ['ignore', 'pipe', 'pipe'] });
    let salida = '';
    const anotar = d => { salida += d; process.stdout.write(d); };
    p.stdout.on('data', anotar);
    p.stderr.on('data', anotar);
    const reloj = setTimeout(() => p.kill('SIGKILL'), TOPE_MS);
    p.on('close', (codigo, senal) => {
      clearTimeout(reloj);
      const malas = salida.split('\n').filter(l => /✗|❌/.test(l));
      const motivo = senal ? `no terminó en ${TOPE_MS / 60000} min`
        : codigo ? `salió con ${codigo}`
        : malas.length ? `${malas.length} chequeo(s) en rojo` : '';
      ok({ guion, ok: !motivo, motivo, malas, ms: Date.now() - t0 });
    });
  });
}

const args = process.argv.slice(2);
if (args.includes('--lista')) {
  // Los archivos que trae el PR, uno por línea: si nada llega al navegador, no hay qué correr
  const cambios = args.includes('--cambios') ? readFileSync(args[args.indexOf('--cambios') + 1], 'utf8').split('\n') : null;
  if (cambios && soloDocumentos(cambios)) {
    console.error('el PR solo trae documentación: sin pruebas de punta a punta (D-205)');
    console.log('[]');
  } else console.log(JSON.stringify(trabajos()));
} else {
  const elegidos = args.length ? args : guiones();
  const resultados = [];
  for (const g of elegidos) {
    console.log(`\n▶ ${g}`);
    resultados.push(await correr(g));
  }
  const filas = resultados.map(r => `| ${r.ok ? '✅' : '❌'} | \`${r.guion}\` | ${Math.round(r.ms / 1000)} s | ${r.motivo || ''} |`);
  const resumen = ['| | Guion | Tiempo | |', '|---|---|---|---|', ...filas,
    ...resultados.filter(r => r.malas.length).flatMap(r => ['', `**${r.guion}**`, '```', ...r.malas.slice(0, 30), '```'])].join('\n');
  console.log('\n' + resumen);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumen + '\n');
  process.exitCode = resultados.every(r => r.ok) ? 0 : 1;
}
