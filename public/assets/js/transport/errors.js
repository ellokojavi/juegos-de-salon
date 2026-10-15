/**
 * Errores del transporte remoto: cómo se nombran y cómo se le cuentan al jugador (C-14).
 *
 * El transporte lanza `Error` con un código corto en el mensaje (`not-found`, `full`, ...).
 * Cada juego tiene sus textos en `LOCALES` (C-3), con las mismas claves en los tres, así que
 * la traducción de código a texto vive acá una sola vez y no copiada en cada `game.js`.
 *
 * Códigos y de dónde salen:
 *   not-found   el código de sala no existe                     join
 *   other-game  ese código es de otro juego                     join
 *   expired     la sala venció: media hora quieta o seis desde que nació                        join
 *   full        ya están todos los roles tomados                join
 *   offline     no se pudo llegar a Firebase                    create, join
 *   busy        se llegó, pero la operación se colgó            create, join
 *   no-code     ocho códigos seguidos ocupados                  create
 *   too-many    este celular creó demasiadas salas seguidas     create
 *
 * `offline`, `busy` y `no-code` comparten texto a propósito. Los tres significan "ahora no
 * se puede abrir la sala" y ninguno se puede distinguir con certeza desde el navegador: el
 * tope de conexiones simultáneas del plan gratuito se ve igual que quedarse sin señal. El
 * texto lo dice como es, sin inventar una causa, y ofrece la salida que la app ya tiene
 * (jugar en un celular, C-5).
 *
 * Todo lo de afuera entra por parámetro para poder probar esto con node sin Firebase.
 * `tryRoom` touches only the button and error element it is given, so a fake one is enough.
 */

/** Espera de conexión antes de tocar la sala, y tope para la operación completa. */
export const CONNECT_MS = 8000;
export const OP_MS = 12000;
/**
 * Tope para irse de una sala (`dispose`). Es mucho más corto que `OP_MS` porque acá no se
 * está esperando nada: la persona ya tocó "cancelar" y quiere estar en otra pantalla. Si no
 * alcanza, la sala queda marcada y la barre la papelera; nadie se entera.
 */
export const LEAVE_MS = 4000;

const KEYS = {
  'not-found': 'errNotFound',
  'other-game': 'errOtherGame',
  expired: 'errExpired',
  full: 'errFull',
  offline: 'errOffline',
  busy: 'errOffline',
  'no-code': 'errOffline',
  'too-many': 'errTooMany',
};

/** Clave de LOCALES para un error del transporte, o null si no es uno de los nuestros. */
export function transportErrorKey(e) {
  const code = e && e.message ? e.message : e;
  return KEYS[code] || null;
}

/**
 * Texto ya traducido para mostrarle al jugador. `T` son los LOCALES del juego.
 * Un error que no es del transporte (un bug, una falla rara del SDK) cae en `errNet`, que
 * es el texto genérico que los tres juegos ya tenían.
 */
export function errText(e, T) {
  const key = transportErrorKey(e);
  return (key && T[key]) || T.errNet;
}

/**
 * Le muestra el error al jugador con el `fail` del juego (el que sacude y suena, C-8b).
 * Un error previsto no ensucia la consola: dejar rastro solo de lo inesperado es lo que hace
 * que "consola sin errores" siga siendo un criterio de aceptación útil (C-12).
 */
export function failWith(e, T, fail) {
  if (!transportErrorKey(e)) console.error(e);
  fail(errText(e, T));
}

/**
 * One attempt to create or join a room, from the button the player tapped (U-37).
 *
 * The wait can last up to CONNECT_MS + OP_MS, so the button says what is happening (`busy`) and
 * the previous error goes away: an old "couldn't open the room" left on screen while the app is
 * already retrying reads as a frozen app. If the attempt fails because the room can't be reached
 * (`errOffline`), `local` (the game's own way into one-phone mode) is offered as a button under
 * the error, the way out the text already names. The same button is how to retry, so there is no
 * separate "retry" link; reloading would also lose the name and the settings.
 *
 * `opts`: { busy, err, fail, T, local, localLabel }. `err` is the game's error element.
 */
export async function tryRoom(btn, run, { busy, err, fail, T, local = null, localLabel = '' }) {
  clearRoomError(err);
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = busy;
  btn.setAttribute('aria-busy', 'true');
  try {
    await run();
  } catch (e) {
    failWith(e, T, fail);
    if (local && transportErrorKey(e) === 'errOffline') {
      const b = err.ownerDocument.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--ghost room-local';
      b.textContent = localLabel;
      b.addEventListener('click', local);
      err.after(b);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = label;
    btn.removeAttribute('aria-busy');
  }
}

/** Clears the error and the one-phone button that `tryRoom` may have left under it. */
export function clearRoomError(err) {
  err.textContent = '';
  const next = err.nextElementSibling;
  if (next && next.classList.contains('room-local')) next.remove();
}

/**
 * The rematch button of a room game (D-322).
 *
 * A rematch opens a new room (or joins the one the other player opened), so it can fail like
 * creating or joining one: no signal, too many rooms, a room that filled up. The button used to
 * run that from an async click handler with nothing to catch it, so the failure became an
 * unhandled rejection, the game kept believing it was switching rooms and the button did nothing
 * visible. Three games did catch it, but in a handler that read `e.currentTarget` after the
 * await, when it is already null, so the catch itself threw.
 *
 * `run` does the game's rematch. The button is disabled while it runs and stays so when it works
 * (the game moves to the new room, or redraws the result with "waiting for…"); if it fails, `reset` undoes
 * what the game marked (the "switching" flag), the button comes back, and the error goes in a line
 * under it, with the same texts as joining a room (`errText`). Tapping again is the retry.
 * The button is taken before any await, so a re-render can't lose it. While it waits (up to
 * CONNECT_MS + OP_MS) it says so with `busy` ("Abriendo sala…"), like `tryRoom` (U-37): a dim
 * "Revancha" for twenty seconds reads as a frozen app.
 */
export async function tryRematch(btn, run, { T, busy = '', reset = () => {} }) {
  btn.disabled = true;
  const label = btn.textContent;
  if (busy) { btn.textContent = busy; btn.setAttribute('aria-busy', 'true'); }
  const old = btn.nextElementSibling;
  if (old && old.classList.contains('rematch-error')) old.remove();
  const done = () => { if (busy) { btn.textContent = label; btn.removeAttribute('aria-busy'); } };
  try {
    await run();
    done();
  } catch (e) {
    done();
    try { reset(); } catch (_) { /* the message still has to show */ }
    if (!transportErrorKey(e)) console.error(e);
    const p = btn.ownerDocument.createElement('p');
    p.className = 'form-error rematch-error';
    p.setAttribute('role', 'alert');
    p.textContent = errText(e, T);
    btn.after(p);
    btn.disabled = false;
  }
}

/** La promesa, pero con tope: si no termina a tiempo, falla con `code`. */
export function withTimeout(p, ms = OP_MS, code = 'busy') {
  let timer = null;
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(code)), ms); });
  return Promise.race([p, limit]).finally(() => clearTimeout(timer));
}

/**
 * Espera a estar conectado a la base antes de operar. Falla con `offline` si no llega.
 *
 * `watch(cb)` avisa cada vez que cambia el estado de conexión y devuelve cómo desuscribirse;
 * puede llamar a `cb` de inmediato, antes de devolver nada, y por eso se revisa `done`
 * después de suscribirse: si ya resolvió, hay que soltar igual la suscripción.
 */
export function waitConnected(watch, ms = CONNECT_MS) {
  return new Promise((resolve, reject) => {
    let done = false;
    let off = null;
    const release = () => { try { if (off) off(); } catch (_) { /* nada */ } };
    const timer = setTimeout(() => {
      if (done) return;
      done = true; release(); reject(new Error('offline'));
    }, ms);
    off = watch(connected => {
      if (!connected || done) return;
      done = true; clearTimeout(timer); release(); resolve();
    });
    if (done) release();
  });
}
