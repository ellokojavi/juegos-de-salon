#!/usr/bin/env node
/**
 * Las decisiones de un toque (D-273): el agente de procesos abre un issue con casillas "Sí" y
 * "No", y cuando el dueño marca una, `.github/workflows/aprobar.yml` corre esto y hace lo que esa
 * casilla dice, sin un modelo de por medio.
 *
 *   node tools/agents/aprobar.mjs                     # en GitHub Actions: lee $GITHUB_EVENT_PATH
 *   node tools/agents/aprobar.mjs --simular <evento.json>   # dice qué haría, sin hacer nada
 *
 * El issue lleva cada opción en una línea `- [ ] Sí <!-- op:1:si -->` y, al final, las acciones
 * de cada opción en un bloque `<!-- acciones {...} -->` (lo escribe `procesos.mjs decidir`).
 * Solo se obedece si:
 *   - quien marcó la casilla es el dueño (DUENO), y el issue es suyo y tiene la etiqueta `procesos`;
 *   - el bloque de acciones no cambió en la misma edición (una casilla marcada no puede traer
 *     acciones nuevas);
 *   - la decisión no se había tomado antes (`<!-- hecho:1 -->`);
 *   - cada acción es de la lista cerrada ACCIONES.
 * Al terminar, anota el resultado en la línea de la decisión y comenta el issue. Esas ediciones
 * las hace el token del workflow, que no despierta a otro workflow.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DUENO = 'ellokojavi';
export const ETIQUETA = 'procesos';
/** Los workflows que una casilla puede volver a correr en main. */
export const WORKFLOWS = ['e2e.yml', 'publicar.yml'];

/* ------------------------------------------------------------------ */
/* Lo puro (lo prueba tools/agents/aprobar.test.mjs)                  */
/* ------------------------------------------------------------------ */

/** El bloque de acciones del issue: `{ "1:si": [ {tipo, …} ], … }`, o null si no está o no se lee. */
export function leerAcciones(cuerpo = '') {
  const m = cuerpo.match(/<!-- acciones (\{[\s\S]*?\}) -->/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/** Las casillas del issue: `{ "1:si": true, "1:no": false, … }`. */
export function casillas(cuerpo = '') {
  const res = {};
  for (const m of cuerpo.matchAll(/^\s*[-*] \[( |x|X)\] .*?<!-- op:(\d+:[a-z]+) -->/gm)) res[m[2]] = m[1] !== ' ';
  return res;
}

/** Las decisiones ya cumplidas (`<!-- hecho:1 -->`). */
export const hechas = (cuerpo = '') => new Set([...cuerpo.matchAll(/<!-- hecho:(\d+) -->/g)].map(m => m[1]));

/** El texto de la pregunta n (`### n. …`), para que el comentario se entienda sin abrir el issue. */
export function pregunta(cuerpo = '', n) {
  return cuerpo.match(new RegExp(`^###\\s+${n}\\.\\s+(.+)$`, 'm'))?.[1].trim() || `Decisión ${n}`;
}

/** Las opciones que pasaron de vacías a marcadas entre dos versiones del cuerpo. */
export function recienMarcadas(antes, despues) {
  const a = casillas(antes), d = casillas(despues);
  return Object.keys(d).filter(k => d[k] && !a[k]);
}

/** Por qué una acción no es de la lista cerrada, o null si lo es. */
export function invalida(acc) {
  const n = x => Number.isInteger(x) && x > 0;
  if (!acc || typeof acc !== 'object') return 'no es una acción';
  switch (acc.tipo) {
    case 'fusionar': case 'cerrar-pr': return n(acc.pr) ? null : `${acc.tipo} sin número de PR`;
    case 'cerrar-issue': return n(acc.issue) ? null : 'cerrar-issue sin número de issue';
    case 'comentar': return n(acc.en) && typeof acc.texto === 'string' && acc.texto.trim() ? null : 'comentar sin dónde o sin texto';
    case 'correr': return WORKFLOWS.includes(acc.workflow) ? null : `correr: solo ${WORKFLOWS.join(' o ')}`;
    case 'encolar': return typeof acc.tarea === 'string' && acc.tarea.trim() ? null : 'encolar sin tarea';
    case 'nada': return null;
    default: return `acción desconocida: ${acc.tipo}`;
  }
}

/**
 * Qué hacer con un evento `issues.edited`: `{ ignorar: motivo }` o `{ planes: [{ decision, opcion,
 * acciones }], avisos: [] }`. No toca nada: lo que decide se puede probar con eventos inventados.
 */
export function planear(evento, dueno = DUENO) {
  const { action, issue, sender, changes } = evento || {};
  if (action !== 'edited') return { ignorar: 'no es una edición' };
  if (!issue?.labels?.some(l => l.name === ETIQUETA)) return { ignorar: `el issue no tiene la etiqueta ${ETIQUETA}` };
  if (issue.state !== 'open') return { ignorar: 'el issue está cerrado' };
  if (sender?.login !== dueno) return { ignorar: `lo editó ${sender?.login}, no ${dueno}` };
  if (issue.user?.login !== dueno) return { ignorar: `el issue es de ${issue.user?.login}, no de ${dueno}` };
  const antes = changes?.body?.from;
  if (typeof antes !== 'string') return { ignorar: 'la edición no cambió el cuerpo' };
  const acciones = leerAcciones(issue.body);
  if (!acciones) return { ignorar: 'el issue no tiene bloque de acciones' };
  if (JSON.stringify(leerAcciones(antes)) !== JSON.stringify(acciones)) return { ignorar: 'el bloque de acciones cambió en la misma edición' };

  const yaHechas = hechas(antes), planes = [], avisos = [], tomadas = new Set();
  for (const op of recienMarcadas(antes, issue.body)) {
    const [decision, opcion] = op.split(':');
    if (yaHechas.has(decision) || tomadas.has(decision)) { avisos.push(`${pregunta(antes, decision)}: ya estaba respondida, así que el ${opcion === 'si' ? 'Sí' : 'No'} nuevo no se hizo.`); continue; }
    const lista = acciones[op];
    if (!Array.isArray(lista)) { avisos.push(`${pregunta(antes, decision)}: el ${opcion === 'si' ? 'Sí' : 'No'} no tiene acciones.`); continue; }
    const malas = lista.map(invalida).filter(Boolean);
    if (malas.length) { avisos.push(`${pregunta(antes, decision)}: el ${opcion === 'si' ? 'Sí' : 'No'} no se hizo (${malas.join('; ')}).`); continue; }
    tomadas.add(decision);
    planes.push({ decision, opcion, acciones: lista });
  }
  if (!planes.length && !avisos.length) return { ignorar: 'no se marcó ninguna casilla nueva' };
  return { planes, avisos };
}

/**
 * El cuerpo con el resultado al final de la línea de la opción (en lugar del de un intento
 * anterior). Si salió bien, la decisión queda tomada (`<!-- hecho:n -->`); si falló, no: desmarcar
 * y volver a marcar la casilla la reintenta.
 */
export function anotarHecho(cuerpo, decision, opcion, resultado, tomada = true) {
  const re = new RegExp(`^(\\s*[-*] \\[[xX ]\\] .*?<!-- op:${decision}:${opcion} -->).*$`, 'm');
  return cuerpo.replace(re, (_, linea) => `${linea} — ${resultado}${tomada ? ` <!-- hecho:${decision} -->` : ''}`);
}

/* ------------------------------------------------------------------ */
/* Lo que toca GitHub                                                  */
/* ------------------------------------------------------------------ */

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 45 * 60 * 1000 });

/**
 * Una acción, con el token del workflow. Un merge hecho con ese token no despierta a publicar.yml
 * ni a e2e.yml (GitHub no encadena workflows con él), así que `fusionar` los corre a mano después.
 */
function hacer(acc, repo) {
  const R = ['-R', repo];
  switch (acc.tipo) {
    case 'fusionar': {
      const pr = JSON.parse(gh('pr', 'view', String(acc.pr), ...R, '--json', 'state,baseRefName'));
      if (pr.state === 'MERGED') return `#${acc.pr} ya estaba fusionado`;
      if (pr.state !== 'OPEN') return `#${acc.pr} está cerrado: no se fusionó`;
      if (pr.baseRefName !== 'main') throw new Error(`#${acc.pr} apunta a ${pr.baseRefName}, no a main`);
      // Espera los checks obligatorios (pruebas y punta-a-punta, D-216); si uno falla, no fusiona.
      try { gh('pr', 'checks', String(acc.pr), ...R, '--required', '--watch', '--fail-fast', '--interval', '30'); }
      catch (e) { throw new Error(`los checks de #${acc.pr} no pasaron`); }
      gh('pr', 'merge', String(acc.pr), ...R, '--merge', '--delete-branch');
      for (const w of WORKFLOWS) gh('workflow', 'run', w, ...R, '--ref', 'main');
      return `#${acc.pr} fusionado; se está publicando el sitio`;
    }
    case 'cerrar-pr':
      gh('pr', 'close', String(acc.pr), ...R, ...(acc.motivo ? ['--comment', acc.motivo] : []));
      return `#${acc.pr} cerrado`;
    case 'cerrar-issue':
      gh('issue', 'close', String(acc.issue), ...R, ...(acc.motivo ? ['--comment', acc.motivo] : []));
      return `#${acc.issue} cerrado`;
    case 'comentar':
      gh('issue', 'comment', String(acc.en), ...R, '--body', acc.texto);
      return `comentado en #${acc.en}`;
    case 'correr':
      gh('workflow', 'run', acc.workflow, ...R, '--ref', 'main');
      return acc.workflow === 'publicar.yml' ? 'se está publicando el sitio' : 'corriendo las pruebas de punta a punta';
    case 'encolar':
      return `en cola para la próxima ronda: ${acc.tarea}`;
    case 'nada':
      return 'anotado';
  }
}

function principal() {
  const i = process.argv.indexOf('--simular');
  const simular = i > 0;
  const ruta = simular ? process.argv[i + 1] : process.env.GITHUB_EVENT_PATH;
  if (!ruta) { console.error('Uso: node tools/agents/aprobar.mjs [--simular <evento.json>]'); process.exit(2); }
  const evento = JSON.parse(readFileSync(ruta, 'utf8'));
  const plan = planear(evento);
  if (plan.ignorar) { console.log(`Nada que hacer: ${plan.ignorar}.`); return; }
  if (simular) { console.log(JSON.stringify(plan, null, 2)); return; }

  const repo = process.env.GITHUB_REPOSITORY, n = String(evento.issue.number);
  const lineas = [...plan.avisos.map(a => `⚠️ ${a}`)];
  let fallo = false;
  for (const { decision, opcion, acciones } of plan.planes) {
    const hechos = [];
    let resultado, bien = true;
    try {
      for (const acc of acciones) hechos.push(hacer(acc, repo));
      resultado = `✅ ${hechos.join('; ')}`;
    } catch (e) {
      fallo = true; bien = false;
      resultado = `❌ ${[...hechos, String(e.message || e).split('\n')[0]].join('; ')}`;
    }
    lineas.push(`**${pregunta(evento.issue.body, decision)}** ${opcion === 'si' ? 'Sí' : 'No'}. ${resultado}`);
    // Se relee el cuerpo antes de anotar: otra casilla pudo marcarse mientras esto corría.
    const cuerpo = JSON.parse(gh('issue', 'view', n, '-R', repo, '--json', 'body')).body;
    gh('issue', 'edit', n, '-R', repo, '--body', anotarHecho(cuerpo, decision, opcion, resultado.split(';')[0], bien));
  }
  if (fallo) lineas.push('', 'Para reintentar lo que falló, desmarca la casilla y vuelve a marcarla.');
  gh('issue', 'comment', n, '-R', repo, '--body', lineas.join('\n'));
  console.log(lineas.join('\n'));
  if (fallo) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) principal();
