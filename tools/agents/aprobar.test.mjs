// One-tap decisions (D-273): which checkbox counts, who may check it and which actions are accepted.
import assert from 'node:assert/strict';
import { planear, marcadasSinResultado, pregunta, casillas, recienMarcadas, leerAcciones, invalida, anotarHecho, hechas, DUENO } from './aprobar.mjs';
import { cuerpoDecisiones } from './procesos.mjs';

const decisiones = {
  titulo: 'Procesos: 2026-10-11',
  resumen: 'Two things to decide.',
  decisiones: [
    { pregunta: 'Merge the docs of the 11th', contexto: 'PR #300, green.', si: [{ tipo: 'fusionar', pr: 300 }], no: [{ tipo: 'cerrar-pr', pr: 300, motivo: 'no' }] },
    { pregunta: 'Close #276', si: [{ tipo: 'cerrar-issue', issue: 276 }] },
  ],
};
const cuerpo = cuerpoDecisiones(decisiones);
const marcar = (c, op) => c.replace(new RegExp(`- \\[ \\](.*?<!-- op:${op} -->)`), '- [x]$1');
const evento = (antes, despues, extra = {}) => ({
  action: 'edited', sender: { login: DUENO },
  issue: { number: 9, state: 'open', user: { login: DUENO }, labels: [{ name: 'procesos' }], body: despues },
  changes: { body: { from: antes } }, ...extra,
});

// The body procesos.mjs builds can be read back
assert.deepEqual(casillas(cuerpo), { '1:si': false, '1:no': false, '2:si': false, '2:no': false });
assert.deepEqual(leerAcciones(cuerpo)['1:si'], [{ tipo: 'fusionar', pr: 300 }]);
assert.deepEqual(leerAcciones(cuerpo)['2:no'], [{ tipo: 'nada' }], 'a No without actions is only noted');
assert.match(cuerpo, /Merge the docs of the 11th/);
assert.match(cuerpo, /Check \*\*Yes\*\* or \*\*No\*\* on each one/);

// Each checkbox says what it does, and the comment names the question
assert.match(cuerpo, /^- \[ \] Yes: merges #300 <!-- op:1:si -->$/m);
assert.match(cuerpo, /^- \[ \] No: closes #300 <!-- op:1:no -->$/m);
assert.equal(pregunta(cuerpo, 2), 'Close #276');
assert.equal(pregunta(cuerpo, 7), 'Decision 7');

// Checking a box: a plan with its actions
const sí1 = marcar(cuerpo, '1:si');
assert.deepEqual(recienMarcadas(cuerpo, sí1), ['1:si']);
assert.deepEqual(planear(evento(cuerpo, sí1)).planes, [{ decision: '1', opcion: 'si', acciones: [{ tipo: 'fusionar', pr: 300 }] }]);

// Only the owner, on their own issue, with the label and open
assert.match(planear({ ...evento(cuerpo, sí1), sender: { login: 'otro' } }).ignorar, /otro/);
assert.match(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, user: { login: 'otro' } } })).ignorar, /opened by otro/);
assert.equal(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, user: { login: 'github-actions[bot]' } } })).planes.length, 1, 'the bot opens the decisions issues');
assert.match(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, labels: [] } })).ignorar, /label/);
assert.match(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, state: 'closed' } })).ignorar, /closed/);
assert.match(planear({ ...evento(cuerpo, sí1), action: 'opened' }).ignorar, /not an edit/);

// A checkbox cannot bring new actions in the same edit
const tramposo = sí1.replace('"pr":300', '"pr":301');
assert.match(planear(evento(cuerpo, tramposo)).ignorar, /actions block changed/);

// Unchecking or editing text does nothing
assert.match(planear(evento(sí1, cuerpo)).ignorar, /no new checkbox/);
assert.match(planear(evento(cuerpo, cuerpo + '\nnota')).ignorar, /no new checkbox/);

// A decision made is not made again; Yes and No at once: the first one counts
const hecho = anotarHecho(sí1, '1', 'si', '✅ #300 merged');
assert.ok(hechas(hecho).has('1'));
assert.match(hecho, /<!-- op:1:si --> — ✅ #300 merged <!-- hecho:1 -->/);
const p = planear(evento(hecho, marcar(hecho, '1:no')));
assert.equal(p.planes.length, 0);
assert.match(p.avisos[0], /^Merge the docs of the 11th: already answered/);
const ambos = planear(evento(cuerpo, marcar(sí1, '1:no')));
assert.equal(ambos.planes.length, 1);
assert.equal(ambos.avisos.length, 1);

// A failed attempt does not make the decision, and the retry replaces its result
const fallido = anotarHecho(sí1, '1', 'si', '❌ the checks did not pass', false);
assert.equal(hechas(fallido).size, 0);
assert.match(anotarHecho(fallido, '1', 'si', '✅ ok'), /<!-- op:1:si --> — ✅ ok <!-- hecho:1 -->$/m);
assert.doesNotMatch(anotarHecho(fallido, '1', 'si', '✅ ok'), /❌/);

// Two decisions in the same edit
assert.equal(planear(evento(cuerpo, marcar(sí1, '2:si'))).planes.length, 2);

// The closed list of actions
assert.equal(invalida({ tipo: 'fusionar', pr: 3 }), null);
assert.equal(invalida({ tipo: 'correr', workflow: 'e2e.yml' }), null);
assert.match(invalida({ tipo: 'correr', workflow: 'otro.yml' }), /only/);
assert.match(invalida({ tipo: 'borrar-rama', rama: 'main' }), /unknown/);
assert.match(invalida({ tipo: 'fusionar', pr: '3' }), /without a PR number/);
assert.throws(() => cuerpoDecisiones({ titulo: 'x', decisiones: [{ pregunta: 'y', si: [{ tipo: 'shell', cmd: 'rm' }] }] }), /unknown/);

// A cancelled run does not lose its decision: the next one does the checked boxes without a result
const tres = marcar(marcar(sí1, '2:si'), '2:si');
const conUna = anotarHecho(tres, '1', 'si', '✅ #300 merged');
assert.deepEqual(marcadasSinResultado(conUna), ['2:si']);
const tarde = planear(evento(sí1, marcar(sí1, '2:si')), DUENO, conUna);
assert.deepEqual(tarde.planes.map(p => `${p.decision}:${p.opcion}`), ['2:si'], 'another run already did 1; 2 gets done');
assert.deepEqual(marcadasSinResultado(anotarHecho(conUna, '2', 'si', '❌ failed', false)), [], 'a failed one is not retried by itself');

// Issues opened before D-316 (in Spanish) still parse: only the markers matter
const viejo = ['### 1. Fusionar el #300', '- [ ] Sí: fusiona #300 <!-- op:1:si -->', '- [ ] No <!-- op:1:no -->', '',
  `<!-- acciones ${JSON.stringify({ '1:si': [{ tipo: 'fusionar', pr: 300 }], '1:no': [{ tipo: 'nada' }] })} -->`].join('\n');
assert.equal(pregunta(viejo, 1), 'Fusionar el #300');
assert.deepEqual(planear(evento(viejo, marcar(viejo, '1:si'))).planes, [{ decision: '1', opcion: 'si', acciones: [{ tipo: 'fusionar', pr: 300 }] }]);
assert.ok(hechas(anotarHecho(marcar(viejo, '1:si'), '1', 'si', '✅ #300 fusionado')).has('1'));

console.log('aprobar: ok');
