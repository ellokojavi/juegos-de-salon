// El agente de procesos (D-273): qué PR cuentan como "esperando", la cola de lo aprobado y los patrones.
import assert from 'node:assert/strict';
import { esperas, enCola, anotarPatron, cuerpoDecisiones, ARREGLO, porDespachar } from './procesos.mjs';
import { anotarHecho } from './aprobar.mjs';

const ahora = Date.parse('2026-10-11T12:00:00Z');
const pr = x => ({ createdAt: '2026-10-11T10:00:00Z', baseRefName: 'main', mergeable: 'MERGEABLE', autoMergeRequest: null, statusCheckRollup: [], ...x });

assert.deepEqual(esperas(pr({}), ahora), [], 'un PR de hoy no espera todavía');
assert.match(esperas(pr({ createdAt: '2026-10-08T10:00:00Z' }), ahora)[0], /sin auto-merge hace 3 días/);
assert.deepEqual(esperas(pr({ createdAt: '2026-10-08T10:00:00Z', autoMergeRequest: {} }), ahora), []);
assert.match(esperas(pr({ baseRefName: 'docs-2026-10-11' }), ahora)[0], /apilado/);
assert.match(esperas(pr({ mergeable: 'CONFLICTING' }), ahora)[0], /conflicto/);
assert.match(esperas(pr({ statusCheckRollup: [{ name: 'pruebas', conclusion: 'FAILURE' }] }), ahora)[0], /en rojo: pruebas/);
assert.deepEqual(esperas(pr({ isDraft: true, mergeable: 'CONFLICTING' }), ahora), [], 'un borrador no espera a nadie');

// What was approved with "encolar" stays queued only if it was checked and carried out
const cuerpo = cuerpoDecisiones({ decisiones: [
  { pregunta: 'Test para el mensaje de compartir', si: [{ tipo: 'encolar', tarea: 'escribir mensajes.test.mjs' }] },
  { pregunta: 'Otra', si: [{ tipo: 'encolar', tarea: 'no aprobada' }] },
] });
assert.deepEqual(enCola([{ number: 5, body: cuerpo }]), []);
const aprobado = anotarHecho(cuerpo.replace(/- \[ \](.*?<!-- op:1:si -->)/, '- [x]$1'), '1', 'si', '✅');
assert.deepEqual(enCola([{ number: 5, body: aprobado }]), [{ id: '#5:1', tarea: 'escribir mensajes.test.mjs' }]);

// Each checkbox says what it does; one that does nothing, just Yes or No
assert.match(cuerpo, /^- \[ \] Yes: queued for the next round <!-- op:1:si -->$/m);
assert.match(cuerpo, /^- \[ \] No <!-- op:1:no -->$/m);

// Un patrón cuenta una vez por commit
const m = { patrones: [] };
assert.equal(anotarPatron(m, 'mensaje-compartir', 'el mensaje no nombraba Uno al día', { fecha: 'a', commit: 'abc' }), 1);
assert.equal(anotarPatron(m, 'mensaje-compartir', 'otra vez', { fecha: 'b', commit: 'abc' }), 1);
assert.equal(anotarPatron(m, 'mensaje-compartir', 'otra vez', { fecha: 'b', commit: 'def' }), 2);

// Los asuntos que delatan algo atrasado
assert.ok(ARREGLO.test('Marketing: el video quedó atrás de ¿Dónde queda?'));
assert.ok(ARREGLO.test('Ronda de usabilidad: marketing al día con D-203'));
assert.ok(!ARREGLO.test('Zip: diez niveles nuevos'));
assert.ok(!ARREGLO.test('Uno al día con jugador: historia en Firebase'));

// A quién despachar (D-276)
assert.deepEqual(porDespachar({ commitsDoc: 0, commitsPublic: 0, diasUsabilidad: 2 }), [], 'sin cambios no se lanza a nadie');
assert.deepEqual(porDespachar({ commitsDoc: 3, commitsPublic: 0, diasUsabilidad: 2 }).map(d => d.agente), ['documentacion']);
assert.deepEqual(porDespachar({ commitsDoc: 0, commitsPublic: 2, diasUsabilidad: 1 }).map(d => d.agente), ['usabilidad']);
assert.match(porDespachar({ commitsDoc: 0, commitsPublic: null, diasUsabilidad: null })[0].motivo, /nunca/);
assert.match(porDespachar({ commitsDoc: 0, commitsPublic: 0, diasUsabilidad: 7 })[0].motivo, /semana/);

console.log('procesos: ok');
