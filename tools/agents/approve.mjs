#!/usr/bin/env node
/**
 * One-tap decisions (D-273): the processes agent opens an issue with "Yes" and "No" checkboxes,
 * and when the owner checks one, `.github/workflows/approve.yml` runs this and does what that
 * checkbox says, with no model in between.
 *
 *   node tools/agents/approve.mjs                     # in GitHub Actions: reads $GITHUB_EVENT_PATH
 *   node tools/agents/approve.mjs --simular <event.json>   # says what it would do, does nothing
 *
 * The issue carries each option on a line `- [ ] Yes <!-- op:1:si -->` and, at the end, the
 * actions of each option in a `<!-- acciones {...} -->` block (written by `processes.mjs decidir`).
 * The markers (`op:n:si`, `op:n:no`, `hecho:n`, `acciones`) and the action types stay in Spanish:
 * parsing depends only on them, so issues opened before D-316 (in Spanish) still work.
 * It only obeys if:
 *   - whoever checked the box is the owner (DUENO), the issue has the `procesos` label and was
 *     opened by the workflows bot (`decide.yml`, so GitHub emails the owner) or by the owner;
 *   - the actions block did not change in the same edit (a checked box cannot bring new actions);
 *   - the decision had not been made before (`<!-- hecho:1 -->`);
 *   - each action is in the closed list (`invalida`).
 * When done, it writes the result on the decision's line and comments on the issue. Those edits
 * are made with the workflow token, which does not wake another workflow.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DUENO = 'ellokojavi';
/** Who may open a decisions issue: the bot (so GitHub notifies the owner) or the owner. */
export const AUTORES = [DUENO, 'github-actions[bot]', 'app/github-actions'];
export const ETIQUETA = 'procesos';
/** The workflows a checkbox may re-run on main. */
export const WORKFLOWS = ['e2e.yml', 'publish.yml'];

/* ------------------------------------------------------------------ */
/* Pure logic (tested by tools/agents/approve.test.mjs)               */
/* ------------------------------------------------------------------ */

/** The issue's actions block: `{ "1:si": [ {tipo, …} ], … }`, or null if missing or unreadable. */
export function leerAcciones(cuerpo = '') {
  const m = cuerpo.match(/<!-- acciones (\{[\s\S]*?\}) -->/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

/** The issue's checkboxes: `{ "1:si": true, "1:no": false, … }`. */
export function casillas(cuerpo = '') {
  const res = {};
  for (const m of cuerpo.matchAll(/^\s*[-*] \[( |x|X)\] .*?<!-- op:(\d+:[a-z]+) -->/gm)) res[m[2]] = m[1] !== ' ';
  return res;
}

/** The decisions already carried out (`<!-- hecho:1 -->`). */
export const hechas = (cuerpo = '') => new Set([...cuerpo.matchAll(/<!-- hecho:(\d+) -->/g)].map(m => m[1]));

/** The text of question n (`### n. …`), so the comment makes sense without opening the issue. */
export function pregunta(cuerpo = '', n) {
  return cuerpo.match(new RegExp(`^###\\s+${n}\\.\\s+(.+)$`, 'm'))?.[1].trim() || `Decision ${n}`;
}

/** The options that went from empty to checked between two versions of the body. */
export function recienMarcadas(antes, despues) {
  const a = casillas(antes), d = casillas(despues);
  return Object.keys(d).filter(k => d[k] && !a[k]);
}

/** Why an action is not in the closed list, or null if it is. */
export function invalida(acc) {
  const n = x => Number.isInteger(x) && x > 0;
  if (!acc || typeof acc !== 'object') return 'not an action';
  switch (acc.tipo) {
    case 'fusionar': case 'cerrar-pr': return n(acc.pr) ? null : `${acc.tipo} without a PR number`;
    case 'cerrar-issue': return n(acc.issue) ? null : 'cerrar-issue without an issue number';
    case 'comentar': return n(acc.en) && typeof acc.texto === 'string' && acc.texto.trim() ? null : 'comentar without a target or text';
    case 'correr': return WORKFLOWS.includes(acc.workflow) ? null : `correr: only ${WORKFLOWS.join(' or ')}`;
    case 'encolar': return typeof acc.tarea === 'string' && acc.tarea.trim() ? null : 'encolar without a task';
    case 'nada': return null;
    default: return `unknown action: ${acc.tipo}`;
  }
}

/**
 * The checked boxes that still have no result next to them: those of a run GitHub cancelled.
 * With three boxes checked almost at once, GitHub keeps one run in progress and one pending, and
 * cancels the ones in between: without this, those decisions were lost.
 */
export function marcadasSinResultado(cuerpo = '') {
  const res = [];
  for (const m of cuerpo.matchAll(/^\s*[-*] \[[xX]\] .*?<!-- op:(\d+:[a-z]+) -->(.*)$/gm)) if (!m[2].trim()) res.push(m[1]);
  return res;
}

/**
 * What to do with an `issues.edited` event: `{ ignorar: reason }` or `{ planes: [{ decision, opcion,
 * acciones }], avisos: [] }`. It touches nothing: its choices can be tested with made-up events.
 * `actual` is the body as it is when running (it may be newer than the event's): the decisions
 * already made and the boxes left without a result come from it.
 */
export function planear(evento, dueno = DUENO, actual = evento?.issue?.body) {
  const { action, issue, sender, changes } = evento || {};
  if (action !== 'edited') return { ignorar: 'not an edit' };
  if (!issue?.labels?.some(l => l.name === ETIQUETA)) return { ignorar: `the issue does not have the ${ETIQUETA} label` };
  if (issue.state !== 'open') return { ignorar: 'the issue is closed' };
  if (sender?.login !== dueno) return { ignorar: `edited by ${sender?.login}, not ${dueno}` };
  if (![dueno, ...AUTORES.slice(1)].includes(issue.user?.login)) return { ignorar: `the issue was opened by ${issue.user?.login}: only those opened by the bot or ${dueno} count` };
  const antes = changes?.body?.from;
  if (typeof antes !== 'string') return { ignorar: 'the edit did not change the body' };
  const acciones = leerAcciones(issue.body);
  if (!acciones) return { ignorar: 'the issue has no actions block' };
  if (JSON.stringify(leerAcciones(antes)) !== JSON.stringify(acciones)) return { ignorar: 'the actions block changed in the same edit' };

  const yaHechas = new Set([...hechas(antes), ...hechas(actual)]), planes = [], avisos = [], tomadas = new Set();
  const ops = [...new Set([...recienMarcadas(antes, issue.body), ...marcadasSinResultado(actual)])];
  for (const op of ops) {
    const [decision, opcion] = op.split(':');
    if (yaHechas.has(decision) || tomadas.has(decision)) { avisos.push(`${pregunta(antes, decision)}: already answered, so the new ${opcion === 'si' ? 'Yes' : 'No'} was not carried out.`); continue; }
    const lista = acciones[op];
    if (!Array.isArray(lista)) { avisos.push(`${pregunta(antes, decision)}: the ${opcion === 'si' ? 'Yes' : 'No'} has no actions.`); continue; }
    const malas = lista.map(invalida).filter(Boolean);
    if (malas.length) { avisos.push(`${pregunta(antes, decision)}: the ${opcion === 'si' ? 'Yes' : 'No'} was not carried out (${malas.join('; ')}).`); continue; }
    tomadas.add(decision);
    planes.push({ decision, opcion, acciones: lista });
  }
  if (!planes.length && !avisos.length) return { ignorar: 'no new checkbox was checked' };
  return { planes, avisos };
}

/**
 * The body with the result at the end of the option's line (replacing that of an earlier
 * attempt). If it succeeded, the decision is made (`<!-- hecho:n -->`); if it failed, it is not:
 * unchecking and checking the box again retries it.
 */
export function anotarHecho(cuerpo, decision, opcion, resultado, tomada = true) {
  const re = new RegExp(`^(\\s*[-*] \\[[xX ]\\] .*?<!-- op:${decision}:${opcion} -->).*$`, 'm');
  return cuerpo.replace(re, (_, linea) => `${linea} — ${resultado}${tomada ? ` <!-- hecho:${decision} -->` : ''}`);
}

/* ------------------------------------------------------------------ */
/* What touches GitHub                                                */
/* ------------------------------------------------------------------ */

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 45 * 60 * 1000 });

/**
 * One action, with the workflow token. A merge made with that token does not wake publish.yml
 * (GitHub does not chain workflows with it), so `fusionar` runs it by hand afterwards; publish.yml
 * already runs the end-to-end tests before publishing (D-302).
 */
function hacer(acc, repo) {
  const R = ['-R', repo];
  switch (acc.tipo) {
    case 'fusionar': {
      const pr = JSON.parse(gh('pr', 'view', String(acc.pr), ...R, '--json', 'state,baseRefName'));
      if (pr.state === 'MERGED') return `#${acc.pr} was already merged`;
      if (pr.state !== 'OPEN') throw new Error(`#${acc.pr} is closed: not merged`);
      if (pr.baseRefName !== 'main') throw new Error(`#${acc.pr} targets ${pr.baseRefName}, not main`);
      // Waits for the required checks (pruebas and punta-a-punta, D-216); if one fails, it does not merge.
      try { gh('pr', 'checks', String(acc.pr), ...R, '--required', '--watch', '--fail-fast', '--interval', '30'); }
      catch (e) { throw new Error(`the checks of #${acc.pr} did not pass`); }
      // No --delete-branch: GitHub deletes the branch (the repo has it enabled) and so retargets
      // the PRs stacked on it to main. Deleted by hand, GitHub closes them (it happened to #303).
      // A conflict with main is reported as such: it used to say "Command failed" without the cause (#331).
      const estado = JSON.parse(gh('pr', 'view', String(acc.pr), ...R, '--json', 'mergeable')).mergeable;
      if (estado === 'CONFLICTING') throw new Error(`#${acc.pr} conflicts with main: it needs updating`);
      gh('pr', 'merge', String(acc.pr), ...R, '--merge');
      // publish.yml runs the tests and the end-to-end suite before publishing (D-302): that is enough
      gh('workflow', 'run', 'publish.yml', ...R, '--ref', 'main');
      return `#${acc.pr} merged; the site is being published`;
    }
    case 'cerrar-pr':
      gh('pr', 'close', String(acc.pr), ...R, ...(acc.motivo ? ['--comment', acc.motivo] : []));
      return `#${acc.pr} closed`;
    case 'cerrar-issue':
      gh('issue', 'close', String(acc.issue), ...R, ...(acc.motivo ? ['--comment', acc.motivo] : []));
      return `#${acc.issue} closed`;
    case 'comentar':
      gh('issue', 'comment', String(acc.en), ...R, '--body', acc.texto);
      return `commented on #${acc.en}`;
    case 'correr':
      gh('workflow', 'run', acc.workflow, ...R, '--ref', 'main');
      return acc.workflow === 'publish.yml' ? 'the site is being published' : 'running the end-to-end tests';
    case 'encolar':
      return `queued for the next round: ${acc.tarea}`;
    case 'nada':
      return 'noted';
  }
}

function principal() {
  const i = process.argv.indexOf('--simular');
  const simular = i > 0;
  const ruta = simular ? process.argv[i + 1] : process.env.GITHUB_EVENT_PATH;
  if (!ruta) { console.error('Usage: node tools/agents/approve.mjs [--simular <event.json>]'); process.exit(2); }
  const evento = JSON.parse(readFileSync(ruta, 'utf8'));
  // The current body: an earlier run may have written results after this event
  const actual = simular ? evento.issue.body : JSON.parse(gh('issue', 'view', String(evento.issue.number), '-R', process.env.GITHUB_REPOSITORY, '--json', 'body')).body;
  const plan = planear(evento, DUENO, actual);
  if (plan.ignorar) { console.log(`Nothing to do: ${plan.ignorar}.`); return; }
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
      // The reason is in what gh wrote to stderr, not in "Command failed: …"
      const porque = String(e.stderr || '').trim().split('\n').filter(Boolean).pop() || String(e.message || e).split('\n')[0];
      resultado = `❌ ${[...hechos, porque].join('; ')}`;
    }
    lineas.push(`**${pregunta(evento.issue.body, decision)}** ${opcion === 'si' ? 'Yes' : 'No'}. ${resultado}`);
    // Re-read the body before writing: another box may have been checked while this ran.
    const cuerpo = JSON.parse(gh('issue', 'view', n, '-R', repo, '--json', 'body')).body;
    gh('issue', 'edit', n, '-R', repo, '--body', anotarHecho(cuerpo, decision, opcion, resultado.split(';')[0], bien));
  }
  if (fallo) lineas.push('', 'To retry what failed, uncheck the box and check it again.');
  gh('issue', 'comment', n, '-R', repo, '--body', lineas.join('\n'));
  console.log(lineas.join('\n'));
  if (fallo) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) principal();
