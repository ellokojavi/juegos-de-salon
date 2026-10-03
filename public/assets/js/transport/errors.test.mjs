// Ejecutar: node assets/js/transport/errors.test.mjs
import assert from 'node:assert/strict';
import { errText, failWith, transportErrorKey, waitConnected, withTimeout } from './errors.js';

/** LOCALES de mentira, con las mismas claves que usan los tres juegos. */
const T = {
  errNet: 'generico',
  errNotFound: 'no existe',
  errOtherGame: 'otro juego',
  errExpired: 'vencida',
  errFull: 'llena',
  errOffline: 'ahora no se puede',
  errTooMany: 'muchas salas',
};

// --- el mapa de códigos -----------------------------------------------------

assert.equal(transportErrorKey(new Error('not-found')), 'errNotFound');
assert.equal(transportErrorKey(new Error('other-game')), 'errOtherGame');
assert.equal(transportErrorKey(new Error('expired')), 'errExpired');
assert.equal(transportErrorKey(new Error('full')), 'errFull');
assert.equal(transportErrorKey(new Error('too-many')), 'errTooMany');
assert.equal(transportErrorKey(new Error('cualquier cosa')), null, 'un error ajeno no es del transporte');
assert.equal(transportErrorKey(undefined), null, 'sin error tampoco revienta');

// Los tres "ahora no se puede" comparten texto: desde el navegador no se distinguen.
for (const code of ['offline', 'busy', 'no-code']) {
  assert.equal(transportErrorKey(new Error(code)), 'errOffline', code);
}

// --- el texto que ve el jugador ---------------------------------------------

assert.equal(errText(new Error('expired'), T), 'vencida');
assert.equal(errText(new Error('offline'), T), 'ahora no se puede');
assert.equal(errText(new Error('vaya uno a saber'), T), 'generico', 'lo desconocido cae en errNet');
// Un juego al que le falte la clave nueva no se queda mudo.
assert.equal(errText(new Error('offline'), { errNet: 'generico' }), 'generico');

// --- failWith: qué llega a la pantalla y qué a la consola --------------------

{
  const visto = [];
  const gritos = [];
  const real = console.error;
  console.error = (...a) => gritos.push(a);
  try {
    failWith(new Error('offline'), T, m => visto.push(m));
    assert.deepEqual(visto, ['ahora no se puede']);
    assert.equal(gritos.length, 0, 'un error previsto no ensucia la consola (C-12)');

    failWith(new Error('vaya uno a saber'), T, m => visto.push(m));
    assert.deepEqual(visto[1], 'generico');
    assert.equal(gritos.length, 1, 'lo inesperado sí queda registrado para depurar');
  } finally { console.error = real; }
}

// --- withTimeout ------------------------------------------------------------

assert.equal(await withTimeout(Promise.resolve('listo'), 50), 'listo', 'lo rápido pasa igual');

await assert.rejects(
  withTimeout(new Promise(r => setTimeout(() => r('tarde'), 200)), 20),
  /busy/, 'lo lento falla con busy',
);

// El error propio de la promesa manda: no lo pisa el tope.
await assert.rejects(withTimeout(Promise.reject(new Error('not-found')), 50), /not-found/);

// El reloj se suelta cuando la promesa gana: si no, node se quedaría vivo esperándolo.
const antes = process.getActiveResourcesInfo?.().filter(r => r === 'Timeout').length ?? 0;
await withTimeout(Promise.resolve(1), 60000);
const despues = process.getActiveResourcesInfo?.().filter(r => r === 'Timeout').length ?? 0;
assert.equal(despues, antes, 'no queda un setTimeout colgando');

// --- waitConnected ----------------------------------------------------------

// Caso normal: se conecta un rato después.
{
  let suelto = false;
  const watch = cb => { setTimeout(() => cb(true), 10); return () => { suelto = true; }; };
  await waitConnected(watch, 500);
  assert.ok(suelto, 'se desuscribe al conectar');
}

// Firebase avisa "conectado" de inmediato, antes de devolver la desuscripción.
{
  let suelto = false;
  const watch = cb => { cb(true); return () => { suelto = true; }; };
  await waitConnected(watch, 500);
  assert.ok(suelto, 'se desuscribe aunque el aviso llegue sincrónicamente');
}

// Falso primero, conectado después: no se rinde al primer aviso.
{
  const watch = cb => { cb(false); setTimeout(() => cb(true), 10); return () => {}; };
  await waitConnected(watch, 500);
}

// Nunca conecta: falla con offline y suelta la suscripción.
{
  let suelto = false;
  const watch = cb => { cb(false); return () => { suelto = true; }; };
  await assert.rejects(waitConnected(watch, 30), /offline/);
  assert.ok(suelto, 'se desuscribe al rendirse');
}

// Un aviso tardío después del plazo no resuelve una promesa ya rechazada.
{
  let cb = null;
  const watch = f => { cb = f; return () => {}; };
  await assert.rejects(waitConnected(watch, 20), /offline/);
  cb(true); // no debe reventar ni cambiar nada
}

console.log('errors: todo en verde');
