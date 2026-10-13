// Corre las pruebas de punta a punta que no tocan el Firebase de producción (D-193).
//
// Uso:
//   node tools/e2e/ci.mjs                 # todas, una tras otra, con el resumen al final
//   node tools/e2e/ci.mjs --lista         # los guiones que corren, en JSON (para la matriz de GitHub)
//   node tools/e2e/ci.mjs --lista --cambios <archivo>   # [] si el PR no toca nada del navegador (D-205, D-299)
//   node tools/e2e/ci.mjs --grupos [--cambios <archivo>] # lo mismo, en grupos parejos para la matriz (D-307)
//   node tools/e2e/ci.mjs cup/torneo.mjs  # solo esos (la ruta desde tools/e2e/)
//   node tools/e2e/ci.mjs cup/torneo.mjs:copa   # solo una parte de un guion largo (ver PARTES)
//
// Necesita el sitio servido en http://localhost:8765 (los guiones lo tienen fijo) y Chrome en
// CHROME. Un guion falla si sale con error, si imprime una línea con ✗ o ❌, o si no termina en
// TOPE_MS. Muchos guiones solo imprimen lo que ven, para que lo lea una persona: en CI igual
// pillan lo que se rompe del todo (un botón que ya no está hace caer el guion).
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, statSync, mkdirSync, appendFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUELTOS } from '../../public/assets/js/games.js';
import { sinNavegador } from './cambios.mjs';
import { agrupar, leerDuraciones, AVISO } from './grupos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = process.env.SALIDA_E2E || '/tmp/e2e';
const TOPE_MS = 15 * 60 * 1000;

// No son pruebas: miran o arman hojas de capturas
const HERRAMIENTAS = new Set(['cdp.mjs', 'ci.mjs', 'mirar.mjs', 'aire-comun.mjs', 'contacto.mjs', 'caminos.mjs', 'idiomas-comun.mjs', 'cambios.mjs', 'grupos.mjs', 'ya-probado.mjs']);
// Abren salas o se unen a ellas en el Firebase de producción: siguen a mano
const CON_FIREBASE = /(^|\/)(online|chat)\.mjs$/;
const TAMBIEN_FIREBASE = new Set([
  'versionado.mjs',                // abre una sala para ver que firebase.js carga versionado
  'compartir-sala.mjs',            // abre una sala de Línea de Tiempo
  'enlace-invitacion.mjs',         // entra a ?room= en los cuatro juegos con sala
  'idioma-por-url.mjs',            // abre /liars-dice/?room=WFBN
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

/**
 * Lo que corre GitHub: cada guion, o cada parte de los que tienen (`cup/torneo.mjs:copa`). Los más
 * largos primero (el tamaño del guion sirve de aproximación): GitHub corre unos veinte jobs a la
 * vez y arranca la matriz en orden, así que un largo al final de la lista espera en la cola y
 * alarga todo el check.
 */
export const trabajos = () => guiones()
  .sort((a, b) => statSync(join(AQUI, b)).size - statSync(join(AQUI, a)).size)
  .flatMap(g => PARTES[g] ? PARTES[g].map(p => `${g}:${p}`) : [g]);

// Si a ci.mjs lo cortan, se lo pasa a sus guiones, que cierran su Chrome antes de salir
const vivos = new Set();
for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, () => { for (const p of vivos) p.kill(s); process.exit(128 + { SIGINT: 2, SIGTERM: 15, SIGHUP: 1 }[s]); });

/** La carpeta de capturas de un guion o de una parte suya. */
const carpeta = guion => { const [archivo, parte] = guion.split(':'); return join(SALIDA, archivo.replace(/\.mjs$/, ''), parte || ''); };

/** Corre un guion o una parte suya (`guion:parte`); resuelve con { ok, motivo, ms, salida }. */
function correr(guion, sufijo = '') {
  const [archivo, parte] = guion.split(':');
  const dir = join(carpeta(guion), sufijo);
  mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  return new Promise(ok => {
    const p = spawn(process.execPath, [join(AQUI, archivo), dir, ...(parte ? ['--parte', parte] : [])], { stdio: ['ignore', 'pipe', 'pipe'] });
    let salida = '';
    const anotar = d => { salida += d; process.stdout.write(d); };
    p.stdout.on('data', anotar);
    p.stderr.on('data', anotar);
    // Primero SIGTERM, para que el guion alcance a cerrar su Chrome (cdp.mjs); si no sale, SIGKILL
    let vencido = false, rematar;
    const reloj = setTimeout(() => { vencido = true; p.kill('SIGTERM'); rematar = setTimeout(() => p.kill('SIGKILL'), 5000); }, TOPE_MS);
    vivos.add(p);
    p.on('close', (codigo, senal) => {
      clearTimeout(reloj); clearTimeout(rematar); vivos.delete(p);
      const malas = salida.split('\n').filter(l => /✗|❌/.test(l));
      const motivo = vencido || senal ? `no terminó en ${TOPE_MS / 60000} min`
        : codigo ? `salió con ${codigo}`
        : malas.length ? `${malas.length} chequeo(s) en rojo` : '';
      ok({ guion, ok: !motivo, motivo, malas, ms: Date.now() - t0 });
    });
  });
}

/** Lo que corre GitHub, en grupos (D-307); [] si el PR no toca nada del navegador. */
export function grupos(cambios = null) {
  if (cambios && sinNavegador(cambios)) return [];
  return agrupar(trabajos(), leerDuraciones());
}

/**
 * Corre los elegidos uno tras otro. Con `reintentos` (CI_REINTENTOS en GitHub, D-299), un guion que
 * falla se repite en el acto: si pasa, queda en verde como intermitente, con un aviso que lo nombra.
 */
async function correrTodos(elegidos, reintentos) {
  const resultados = [];
  for (const g of elegidos) {
    console.log(`\n▶ ${g}`);
    let r = await correr(g);
    if (!r.ok && reintentos > 0) {
      console.log(`::warning title=Intermitente::${g} falló al primer intento (${r.motivo}); se repite una vez (D-299)`);
      console.log(`\n▶ ${g} (segundo intento)`);
      const otra = await correr(g, 'segundo-intento');
      if (otra.ok) console.log(`::warning title=Intermitente::${g} pasó al segundo intento: falla a veces (capturas del primero en el artefacto)`);
      r = { ...otra, intermitente: otra.ok, primero: r };
    }
    if (!r.ok) console.log(`::error title=Falló ${g}::${r.motivo}${r.malas[0] ? ': ' + r.malas[0].slice(0, 200) : ''}`);
    resultados.push(r);
  }
  return resultados;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const cambiosDe = () => args.includes('--cambios') ? readFileSync(args[args.indexOf('--cambios') + 1], 'utf8').split('\n') : null;
  if (args.includes('--grupos')) {
    const gs = grupos(cambiosDe());
    if (!gs.length) console.error('el PR no toca nada que llegue al navegador: sin pruebas de punta a punta (D-205, D-299)');
    console.log(JSON.stringify(gs.map(g => ({ nombre: g.nombre, guiones: g.guiones.join(' ') }))));
  } else if (args.includes('--lista')) {
    // Los archivos que trae el PR, uno por línea: si nada llega al navegador, no hay qué correr
    const cambios = args.includes('--cambios') ? readFileSync(args[args.indexOf('--cambios') + 1], 'utf8').split('\n') : null;
    if (cambios && sinNavegador(cambios)) {
      console.error('el PR no toca nada que llegue al navegador: sin pruebas de punta a punta (D-205, D-299)');
      console.log('[]');
    } else console.log(JSON.stringify(trabajos()));
  } else {
    const elegidos = args.length ? args : guiones();
    const resultados = await correrTodos(elegidos, Number(process.env.CI_REINTENTOS || 0));
    const filas = resultados.map(r => `| ${r.ok ? (r.intermitente ? '⚠️' : '✅') : '❌'} | \`${r.guion}\` | ${Math.round(r.ms / 1000)} s | ${r.intermitente ? `pasó al segundo intento (el primero: ${r.primero.motivo})` : r.motivo || ''} |`);
    const resumen = ['| | Guion | Tiempo | |', '|---|---|---|---|', ...filas,
      ...resultados.filter(r => r.malas.length).flatMap(r => ['', `**${r.guion}**`, '```', ...r.malas.slice(0, 30), '```'])].join('\n');
    console.log('\n' + resumen);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumen + '\n');
    if (process.env.GITHUB_ACTIONS) {
      // Lo que tardó cada guion, para que `grupos.mjs medir` rearme los grupos con datos (D-307)
      const durs = Object.fromEntries(resultados.filter(r => r.ok && !r.intermitente).map(r => [r.guion, Math.round(r.ms / 1000)]));
      console.log(`::notice title=${AVISO}::${JSON.stringify(durs)}`);
      // Las capturas que sirven son las de lo que falló o pasó al segundo intento: el resto no sube
      for (const r of resultados) if (r.ok && !r.intermitente) rmSync(carpeta(r.guion), { recursive: true, force: true });
    }
    process.exitCode = resultados.every(r => r.ok) ? 0 : 1;
  }
}
