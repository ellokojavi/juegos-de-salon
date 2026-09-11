// Ejecutar: node assets/js/transport/ratelimit.test.mjs
import assert from 'node:assert/strict';
import { LIMITS, allow, checkQuota, load, note, noteCreated, prune } from './ratelimit.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const AHORA = 1_700_000_000_000;

/** N salas abiertas en la última hora, repartidas hacia atrás desde `hasta`. */
const seguidas = (n, hasta = AHORA, paso = 60_000) =>
  Array.from({ length: n }, (_, i) => hasta - i * paso);

// --- prune ------------------------------------------------------------------

assert.deepEqual(prune([AHORA - DAY - 1, AHORA - 1000], AHORA), [AHORA - 1000], 'lo de ayer se olvida');
assert.deepEqual(prune([AHORA + HOUR], AHORA), [], 'un reloj adelantado no cuenta');
assert.deepEqual(prune(['x', null, AHORA], AHORA), [AHORA], 'la basura se descarta');

// --- allow ------------------------------------------------------------------

assert.ok(allow([], AHORA), 'sin historial se puede');
assert.ok(allow(seguidas(LIMITS.hour - 1), AHORA), 'justo debajo del tope por hora');
assert.ok(!allow(seguidas(LIMITS.hour), AHORA), 'en el tope por hora se corta');

// El tope por hora es una ventana móvil, no un contador que se reinicia.
assert.ok(allow(seguidas(LIMITS.hour, AHORA - HOUR - 1000), AHORA), 'pasada la hora se puede de nuevo');

// El tope diario ataja al que va lento pero sin parar: bajo el tope por hora, sobre el del día.
const todoElDia = Array.from({ length: LIMITS.day }, (_, i) => AHORA - i * (DAY / LIMITS.day) - 1);
assert.ok(!allow(todoElDia, AHORA), 'en el tope diario se corta aunque la última hora esté tranquila');
assert.ok(allow(todoElDia.slice(1), AHORA), 'una menos y pasa');

// El uso legítimo más intenso no se topa: la revancha abre sala nueva (C-7), así que una
// tarde de partidas cortas son muchas salas seguidas y ninguna es abuso.
assert.ok(allow(seguidas(8, AHORA, 7 * 60 * 1000), AHORA), 'ocho revanchas en una hora pasan');

// --- note -------------------------------------------------------------------

assert.deepEqual(note([], AHORA), [AHORA]);
assert.deepEqual(note([AHORA - DAY - 1], AHORA), [AHORA], 'apuntar también poda');

// --- la capa con localStorage -----------------------------------------------

/** localStorage de mentira, con interruptor para simular el modo privado. */
function fakeStorage({ roto = false } = {}) {
  const data = new Map();
  return {
    getItem: k => { if (roto) throw new Error('SecurityError'); return data.has(k) ? data.get(k) : null; },
    setItem: (k, v) => { if (roto) throw new Error('QuotaExceeded'); data.set(k, v); },
    removeItem: k => data.delete(k),
  };
}

globalThis.localStorage = fakeStorage();
assert.deepEqual(load(), [], 'sin nada guardado, historial vacío');
checkQuota(AHORA); // no debe fallar
// En orden creciente: cada apunte poda lo posterior a su propio `now`, así que apuntar
// hacia atrás en el tiempo se borraría a sí mismo (que es justo lo que queremos de un reloj
// que se va para adelante, pero no lo que pasa jugando).
for (let i = LIMITS.hour; i > 0; i--) noteCreated(AHORA - i * 1000);
assert.throws(() => checkQuota(AHORA), /too-many/, 'pasado el tope, falla con too-many');

// Modo privado: falla abierto. Bloquear a un jugador legítimo es peor que dejar pasar a un abusivo.
globalThis.localStorage = fakeStorage({ roto: true });
assert.deepEqual(load(), [], 'si no se puede leer, historial vacío');
checkQuota(AHORA); // no debe fallar
noteCreated(AHORA); // tampoco debe reventar al no poder guardar

// Basura guardada por otra versión: no revienta ni bloquea.
globalThis.localStorage = fakeStorage();
globalThis.localStorage.setItem('juegos-de-salon:rooms-created', '{"no":"un arreglo"}');
assert.deepEqual(load(), []);
checkQuota(AHORA);

console.log('ratelimit: todo en verde');
