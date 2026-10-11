// Las decisiones de un toque (D-273): qué casilla cuenta, quién puede marcarla y qué acciones se aceptan.
import assert from 'node:assert/strict';
import { planear, pregunta, casillas, recienMarcadas, leerAcciones, invalida, anotarHecho, hechas, DUENO } from './aprobar.mjs';
import { cuerpoDecisiones } from './procesos.mjs';

const decisiones = {
  titulo: 'Procesos: 2026-10-11',
  resumen: 'Dos cosas para decidir.',
  decisiones: [
    { pregunta: 'Fusionar la documentación del 11', contexto: 'PR #300, en verde.', si: [{ tipo: 'fusionar', pr: 300 }], no: [{ tipo: 'cerrar-pr', pr: 300, motivo: 'no' }] },
    { pregunta: 'Cerrar el #276', si: [{ tipo: 'cerrar-issue', issue: 276 }] },
  ],
};
const cuerpo = cuerpoDecisiones(decisiones);
const marcar = (c, op) => c.replace(new RegExp(`- \\[ \\](.*?<!-- op:${op} -->)`), '- [x]$1');
const evento = (antes, despues, extra = {}) => ({
  action: 'edited', sender: { login: DUENO },
  issue: { number: 9, state: 'open', user: { login: DUENO }, labels: [{ name: 'procesos' }], body: despues },
  changes: { body: { from: antes } }, ...extra,
});

// El cuerpo que arma procesos.mjs se lee de vuelta
assert.deepEqual(casillas(cuerpo), { '1:si': false, '1:no': false, '2:si': false, '2:no': false });
assert.deepEqual(leerAcciones(cuerpo)['1:si'], [{ tipo: 'fusionar', pr: 300 }]);
assert.deepEqual(leerAcciones(cuerpo)['2:no'], [{ tipo: 'nada' }], 'un No sin acciones solo se anota');
assert.match(cuerpo, /Fusionar la documentación del 11/);

// Cada casilla dice qué hace, y el comentario nombra la pregunta
assert.match(cuerpo, /^- \[ \] Sí: fusiona #300 <!-- op:1:si -->$/m);
assert.match(cuerpo, /^- \[ \] No: cierra #300 <!-- op:1:no -->$/m);
assert.equal(pregunta(cuerpo, 2), 'Cerrar el #276');
assert.equal(pregunta(cuerpo, 7), 'Decisión 7');

// Marcar una casilla: un plan con sus acciones
const sí1 = marcar(cuerpo, '1:si');
assert.deepEqual(recienMarcadas(cuerpo, sí1), ['1:si']);
assert.deepEqual(planear(evento(cuerpo, sí1)).planes, [{ decision: '1', opcion: 'si', acciones: [{ tipo: 'fusionar', pr: 300 }] }]);

// Solo el dueño, en un issue suyo, con la etiqueta y abierto
assert.match(planear({ ...evento(cuerpo, sí1), sender: { login: 'otro' } }).ignorar, /otro/);
assert.match(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, user: { login: 'otro' } } })).ignorar, /es de otro/);
assert.equal(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, user: { login: 'github-actions[bot]' } } })).planes.length, 1, 'el bot abre los issues de decisiones');
assert.match(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, labels: [] } })).ignorar, /etiqueta/);
assert.match(planear(evento(cuerpo, sí1, { issue: { ...evento(cuerpo, sí1).issue, state: 'closed' } })).ignorar, /cerrado/);
assert.match(planear({ ...evento(cuerpo, sí1), action: 'opened' }).ignorar, /edición/);

// Una casilla no puede traer acciones nuevas en la misma edición
const tramposo = sí1.replace('"pr":300', '"pr":301');
assert.match(planear(evento(cuerpo, tramposo)).ignorar, /acciones cambió/);

// Desmarcar o editar texto no hace nada
assert.match(planear(evento(sí1, cuerpo)).ignorar, /ninguna casilla nueva/);
assert.match(planear(evento(cuerpo, cuerpo + '\nnota')).ignorar, /ninguna casilla nueva/);

// Una decisión tomada no se vuelve a tomar; Sí y No a la vez: vale el primero
const hecho = anotarHecho(sí1, '1', 'si', '✅ #300 fusionado');
assert.ok(hechas(hecho).has('1'));
assert.match(hecho, /<!-- op:1:si --> — ✅ #300 fusionado <!-- hecho:1 -->/);
const p = planear(evento(hecho, marcar(hecho, '1:no')));
assert.equal(p.planes.length, 0);
assert.match(p.avisos[0], /^Fusionar la documentación del 11: ya estaba respondida/);
const ambos = planear(evento(cuerpo, marcar(sí1, '1:no')));
assert.equal(ambos.planes.length, 1);
assert.equal(ambos.avisos.length, 1);

// Un intento fallido no toma la decisión, y el reintento reemplaza su resultado
const fallido = anotarHecho(sí1, '1', 'si', '❌ los checks no pasaron', false);
assert.equal(hechas(fallido).size, 0);
assert.match(anotarHecho(fallido, '1', 'si', '✅ ok'), /<!-- op:1:si --> — ✅ ok <!-- hecho:1 -->$/m);
assert.doesNotMatch(anotarHecho(fallido, '1', 'si', '✅ ok'), /❌/);

// Dos decisiones en la misma edición
assert.equal(planear(evento(cuerpo, marcar(sí1, '2:si'))).planes.length, 2);

// La lista cerrada de acciones
assert.equal(invalida({ tipo: 'fusionar', pr: 3 }), null);
assert.equal(invalida({ tipo: 'correr', workflow: 'e2e.yml' }), null);
assert.match(invalida({ tipo: 'correr', workflow: 'otro.yml' }), /solo/);
assert.match(invalida({ tipo: 'borrar-rama', rama: 'main' }), /desconocida/);
assert.match(invalida({ tipo: 'fusionar', pr: '3' }), /sin número/);
assert.throws(() => cuerpoDecisiones({ titulo: 'x', decisiones: [{ pregunta: 'y', si: [{ tipo: 'shell', cmd: 'rm' }] }] }), /desconocida/);

console.log('aprobar: ok');
