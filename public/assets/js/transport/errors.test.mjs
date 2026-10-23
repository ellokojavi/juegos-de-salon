// Ejecutar: node public/assets/js/transport/errors.test.mjs
import assert from 'node:assert/strict';
import { clearRoomError, errText, failWith, transportErrorKey, tryRematch, tryRoom, waitConnected, withTimeout } from './errors.js';

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

// --- tryRoom: the button while it waits, and the way out when the room can't be reached (U-37) ---

/** Just enough DOM: a button, and an error element with a parent to insert after it. */
function fakeDom() {
  const parent = { kids: [] };
  const node = (tag) => {
    const n = {
      tag, textContent: '', disabled: false, attrs: {}, listeners: {}, classes: new Set(),
      ownerDocument: doc,
      get className() { return [...this.classes].join(' '); },
      set className(v) { this.classes = new Set(v.split(' ').filter(Boolean)); },
      get classList() { return { contains: c => n.classes.has(c) }; },
      setAttribute(k, v) { this.attrs[k] = v; },
      removeAttribute(k) { delete this.attrs[k]; },
      addEventListener(t, f) { this.listeners[t] = f; },
      after(x) { parent.kids.splice(parent.kids.indexOf(this) + 1, 0, x); },
      remove() { parent.kids.splice(parent.kids.indexOf(this), 1); },
      get nextElementSibling() { return parent.kids[parent.kids.indexOf(this) + 1] || null; },
    };
    return n;
  };
  const doc = { createElement: node };
  const err = node('div');
  const btn = node('button');
  btn.textContent = 'Crear sala';
  parent.kids.push(err, btn);
  return { parent, err, btn };
}

{
  const { parent, err, btn } = fakeDom();
  err.textContent = 'el error de antes';
  let seen = null;
  let local = 0;
  const opts = { busy: 'Abriendo sala…', err, fail: m => { err.textContent = m; }, T, local: () => { local++; }, localLabel: '📱 Un celular' };
  await tryRoom(btn, async () => {
    seen = { text: btn.textContent, disabled: btn.disabled, busy: btn.attrs['aria-busy'], err: err.textContent };
    throw new Error('offline');
  }, opts);
  assert.deepEqual(seen, { text: 'Abriendo sala…', disabled: true, busy: 'true', err: '' }, 'while waiting: says so, and the old error is gone');
  assert.equal(btn.textContent, 'Crear sala', 'the button comes back as it was: it is the retry');
  assert.equal(btn.disabled, false);
  assert.equal(btn.attrs['aria-busy'], undefined);
  assert.equal(err.textContent, 'ahora no se puede');
  const way = err.nextElementSibling;
  assert.ok(way && way.classList.contains('room-local'), 'offline: the one-phone button goes under the error');
  assert.equal(way.textContent, '📱 Un celular');
  way.listeners.click();
  assert.equal(local, 1, 'and it takes the game into one-phone mode');

  // A second failure does not stack a second button.
  await tryRoom(btn, async () => { throw new Error('busy'); }, opts);
  assert.equal(parent.kids.filter(k => k.classList.contains('room-local')).length, 1);

  // An error that one phone would not fix (the room is full) offers no way out, and clears the old one.
  await tryRoom(btn, async () => { throw new Error('full'); }, opts);
  assert.equal(err.textContent, 'llena');
  assert.equal(parent.kids.filter(k => k.classList.contains('room-local')).length, 0);

  // Success leaves nothing behind.
  err.textContent = 'algo';
  await tryRoom(btn, async () => {}, opts);
  assert.equal(err.textContent, '');
  assert.equal(btn.disabled, false);

  // clearRoomError on its own: the screen is redrawn.
  await tryRoom(btn, async () => { throw new Error('offline'); }, opts);
  clearRoomError(err);
  assert.equal(err.textContent, '');
  assert.equal(err.nextElementSibling, btn);
}

// --- tryRematch: a rematch that can't open its room says so, and the button comes back (D-322) ---

{
  const unhandled = [];
  const onUnhandled = e => unhandled.push(e);
  process.on('unhandledRejection', onUnhandled);
  const { parent, btn } = fakeDom();
  btn.textContent = 'Revancha';
  let switching = true;
  const reset = () => { switching = false; };

  // Fails while it runs: disabled during the wait, then back, with the room text under it
  let during = null;
  await tryRematch(btn, async () => { during = btn.disabled; throw new Error('offline'); }, { T, reset });
  assert.equal(during, true, 'disabled while the new room opens');
  assert.equal(btn.disabled, false, 'the button comes back: tapping again is the retry');
  assert.equal(switching, false, 'the game no longer believes it is switching rooms');
  const msg = btn.nextElementSibling;
  assert.ok(msg && msg.classList.contains('rematch-error'));
  assert.equal(msg.textContent, T.errOffline);
  assert.equal(msg.attrs.role, 'alert');

  // Tapping again clears the old message; a different error replaces it, never two lines
  await tryRematch(btn, async () => { throw new Error('full'); }, { T, reset });
  assert.equal(parent.kids.filter(k => k.classes.has('rematch-error')).length, 1);
  assert.equal(btn.nextElementSibling.textContent, T.errFull);

  // Works: the message goes, and the button stays disabled until the game moves on
  await tryRematch(btn, async () => {}, { T, reset });
  assert.equal(parent.kids.filter(k => k.classes.has('rematch-error')).length, 0);
  assert.equal(btn.disabled, true);

  // An unexpected error gets the generic text and goes to the console; a throwing reset doesn't hide it
  const errores = [];
  const ce = console.error; console.error = x => errores.push(x);
  btn.disabled = false;
  await tryRematch(btn, async () => { throw new TypeError('bug'); }, { T, reset: () => { throw new Error('reset'); } });
  console.error = ce;
  assert.equal(btn.nextElementSibling.textContent, T.errNet);
  assert.equal(errores.length, 1);
  assert.equal(btn.disabled, false);

  await new Promise(r => setTimeout(r, 10));
  process.off('unhandledRejection', onUnhandled);
  assert.deepEqual(unhandled, [], 'a failed rematch never leaves an unhandled rejection');

  // While it waits, the button says what it is doing, and gets its label back after (U-37)
  btn.disabled = false;
  let shown = null, busyAttr = null;
  await tryRematch(btn, async () => { shown = btn.textContent; busyAttr = btn.attrs['aria-busy']; throw new Error('offline'); }, { T, busy: 'Abriendo sala…' });
  assert.equal(shown, 'Abriendo sala…');
  assert.equal(busyAttr, 'true');
  assert.equal(btn.textContent, 'Revancha');
  assert.equal(btn.attrs['aria-busy'], undefined);
}

/* Every room game wires its rematch button through tryRematch (D-322) */
{
  const { readFileSync } = await import('node:fs');
  for (const g of ['battleship', 'bulls-and-cows', 'hangman', 'timeline', 'generala', 'labs/julep', 'liars-dice']) {
    const src = readFileSync(new URL(`../../../${g}/game.js`, import.meta.url), 'utf8');
    assert.match(src, /tryRematch\(e\.currentTarget, (rematch|rematchOnline), \{ T, busy: COMMON\[lang\]\.opening/, `${g}: the rematch button goes through tryRematch, saying it is opening the room (U-37)`);
    assert.doesNotMatch(src, /onClick: rematch\b|rematchOnline\(\)\.catch/, `${g}: no rematch outside tryRematch`);
  }
}

console.log('errors: todo en verde');
