// ¿Lo que se va a publicar ya pasó la punta a punta? (D-308) Lo corre publish.yml antes de decidir
// si la repite. Del 2 al 12 de octubre, en 79 de 96 PR fusionados, el árbol que llegó a main era
// idéntico, archivo por archivo, al que la punta a punta ya había probado en el PR: repetirla en
// main costaba ~8 minutos de publicación sin probar nada nuevo.
//
// Cada corrida de e2e.yml que pasa con guiones deja una marca: un artefacto `e2e-arbol-<árbol>`, con
// el SHA del árbol que probó (en un PR, el merge de prueba con main que arma GitHub). Aquí:
//   1. si el árbol del commit que se publica tiene su marca, de una corrida de este mismo repo
//      (no de un fork, que corre su propia versión del workflow), ya está probado;
//   2. si no, pero el commit solo cambia lo que no llega al navegador (tools/e2e/changes.mjs) y el
//      árbol de su padre tiene marca, también: hereda la del padre, y deja la suya;
//   3. si no, o si algo falla al preguntar, no está probado y la punta a punta corre entera.
//
//   node tools/e2e/already-tested.mjs        # escribe probado, heredado y arbol en $GITHUB_OUTPUT
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sinNavegador } from './changes.mjs';

export const MARCA = arbol => `e2e-arbol-${arbol}`;

/** ¿Alguno de estos artefactos es una marca válida? De este repo y sin vencer. */
export const marcaValida = artefactos => artefactos.find(a => !a.expired && a.workflow_run
  && a.workflow_run.head_repository_id === a.workflow_run.repository_id) || null;

/**
 * La decisión: `{ probado, heredado, motivo }`.
 * @param {object} o
 * @param {object|null} o.marca        la marca del árbol que se publica
 * @param {object|null} o.marcaPadre   la del árbol del commit padre
 * @param {string[]|null} o.cambios    lo que cambió desde el padre (null si no hay padre)
 */
export function decidir({ marca, marcaPadre, cambios }) {
  if (marca) return { probado: true, heredado: false, motivo: `este mismo árbol pasó la punta a punta en la corrida ${marca.workflow_run.id}` };
  if (cambios && sinNavegador(cambios) && marcaPadre) return { probado: true, heredado: true, motivo: `solo cambia lo que no llega al navegador, y su padre pasó en la corrida ${marcaPadre.workflow_run.id}` };
  return { probado: false, heredado: false, motivo: 'ningún árbol igual pasó la punta a punta: se corre entera' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sh = (...a) => execFileSync(a[0], a.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const repo = process.env.GITHUB_REPOSITORY || 'ellokojavi/juegos-de-salon';
  const salida = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };
  let arbol = '', r;
  try {
    arbol = sh('git', 'rev-parse', 'HEAD^{tree}');
    const marcaDe = a => marcaValida(JSON.parse(sh('gh', 'api', `repos/${repo}/actions/artifacts?name=${MARCA(a)}&per_page=20`)).artifacts || []);
    let cambios = null, marcaPadre = null;
    const marca = marcaDe(arbol);
    if (!marca) {
      try {
        cambios = sh('git', 'diff', '--name-only', 'HEAD^1', 'HEAD').split('\n').filter(Boolean);
        if (sinNavegador(cambios)) marcaPadre = marcaDe(sh('git', 'rev-parse', 'HEAD^1^{tree}'));
      } catch (_) { cambios = null; } // sin padre a mano (una copia de un solo commit)
    }
    r = decidir({ marca, marcaPadre, cambios });
  } catch (e) {
    r = { probado: false, heredado: false, motivo: `no se pudo preguntar (${String(e.message).split('\n')[0]}): se corre entera` };
  }
  console.log(`${r.probado ? '✓' : '·'} ${r.motivo}`);
  salida('probado', r.probado); salida('heredado', r.heredado); salida('arbol', arbol);
}
