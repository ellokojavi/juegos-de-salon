/**
 * Tope de salas que un celular puede abrir (canon C-7, D-41).
 *
 * El plan gratuito de Firebase tiene techo de conexiones y de descarga mensual, y la app es
 * estática: no hay servidor que modere nada. Esto es lo que se puede hacer desde el navegador.
 *
 * **Lo que NO hace:** frenar a alguien decidido. Quien quiera abusar le pega a la REST API con
 * `curl` y jamás carga este archivo. Lo que sí ataja es el caso realista: una pestaña en bucle,
 * un script ingenuo, un botón apretado mil veces, un error nuestro que cree salas sin parar.
 * Cerrar de verdad esa puerta pide autenticación anónima y reglas con `auth != null`, que es
 * otro modelo de seguridad y otra decisión.
 *
 * **Los números.** La revancha abre una sala nueva (C-7), y una partida dura minutos: quien
 * juega en serie puede abrir muchas salas seguidas siendo perfectamente legítimo. Por eso el
 * tope está sobre el uso más intenso que se pueda imaginar jugando, no sobre el promedio. Un
 * bucle descontrolado abre miles por hora: la distancia es enorme y no hace falta afinar.
 *
 * **Falla abierto.** Si `localStorage` no se puede leer (modo privado, cuota llena), se deja
 * crear. Dejar pasar a un abusivo es barato; dejar a un jugador legítimo sin poder jugar, no.
 * Es la misma postura que C-6 toma con la memoria de partida.
 */
export const LIMITS = { hour: 20, day: 80 };

const HOUR = 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const KEY = 'juegos-de-salon:rooms-created';

/** Deja solo lo del último día: el historial no crece para siempre. */
export function prune(history, now) {
  return history.filter(t => typeof t === 'number' && t > now - DAY && t <= now);
}

/** ¿Puede este celular abrir otra sala? */
export function allow(history, now) {
  const reciente = prune(history, now);
  return reciente.filter(t => t > now - HOUR).length < LIMITS.hour && reciente.length < LIMITS.day;
}

/** Historial con una sala más apuntada (y sin lo viejo). */
export function note(history, now) {
  return [...prune(history, now), now];
}

/** Lee el historial. Cualquier problema es historial vacío: se deja crear. */
export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (_) { return []; }
}

function save(history) {
  try { localStorage.setItem(KEY, JSON.stringify(history)); } catch (_) { /* sin memoria, sin tope */ }
}

/** Falla con `too-many` si este celular ya abrió demasiadas salas. */
export function checkQuota(now = Date.now()) {
  if (!allow(load(), now)) throw new Error('too-many');
}

/** Se llama cuando la sala quedó creada de verdad, no cuando se intentó. */
export function noteCreated(now = Date.now()) {
  save(note(load(), now));
}
