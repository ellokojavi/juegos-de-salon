/**
 * El modo solo de un juego con su minijuego de La Copa (D-141). Toque y Fama juega 🔢 Adivina el
 * número y Línea de Tiempo juega ⏳ Línea Relámpago: la misma pantalla, las mismas reglas y el
 * mismo puntaje de 0 a 100 que en la copa, pero en el idioma de quien juega y dentro del juego,
 * con su memoria de partida (C-6).
 *
 * Esto es lo que comparten los dos: montar la pantalla, llevar el reloj de tiempo activo (solo
 * corre con la pantalla visible, D-95) y guardar cada jugada. La intro, el resultado y los
 * textos son de cada juego.
 */
import { reloj, mmss } from '../engine.js';

export { mmss };

/**
 * Monta el minijuego `mod` (su `montar` y su `resultado`) en `raiz`.
 *
 * - `jugadas` y `ms`: lo guardado, para retomar; sin ellos parte de cero.
 * - `guardar({ jugadas, ms })`: después de cada jugada y al pausar el reloj.
 * - `alTerminar({ s, t, resumen, ms, estado })`: cuando el jugador toca "Ver resultado".
 * - `cron(texto)`: opcional, se llama cada segundo con el tiempo ("1:07").
 *
 * Devuelve `soltar()`, que detiene el reloj y los oyentes (al salir de la pantalla).
 */
export function jugarSolo(raiz, { mod, p, lang, T, fmt, el, SFX, vibrate, jugadas, ms = 0, guardar, alTerminar, cron }) {
  let rel = reloj.nuevo(Date.now());
  rel.ms = ms;
  let detenido = false;
  let actuales = jugadas;
  const leer = () => Math.round(reloj.leer(rel, Date.now()));
  const escribir = () => guardar({ jugadas: actuales, ms: leer() });
  const tic = cron ? setInterval(() => cron(mmss(leer())), 1000) : null;
  cron?.(mmss(leer()));
  const visibilidad = () => {
    if (detenido) return;
    rel = document.hidden ? reloj.pausar(rel, Date.now()) : reloj.seguir(rel, Date.now());
    if (document.hidden && actuales !== undefined) escribir();
  };
  document.addEventListener('visibilitychange', visibilidad);
  const soltar = () => { clearInterval(tic); document.removeEventListener('visibilitychange', visibilidad); };
  mod.montar(raiz, {
    p, jugadas, lang, T, fmt, el, SFX, vibrate,
    guardar(j) { actuales = j; escribir(); },
    tiempo: leer,
    pararReloj() {
      if (!detenido) { rel = reloj.pausar(rel, Date.now()); detenido = true; }
      clearInterval(tic); cron?.(mmss(leer()));
      if (actuales !== undefined) escribir();
    },
    terminar(estado) {
      soltar();
      const r = mod.resultado(estado);
      alTerminar({ ...r, ms: r.ms ?? leer(), estado });
    },
  });
  return soltar;
}

/**
 * El mejor puntaje, por clave (en Línea de Tiempo, por temática). Mejor es más puntos y, a
 * igualdad, menos tiempo, como en la copa. Si `localStorage` falla, no hay récord y se juega igual.
 */
export function crearRecord(clave) {
  const leerTodo = () => { try { return JSON.parse(localStorage.getItem(clave) || '{}'); } catch (_) { return {}; } };
  return {
    get: (k = '') => leerTodo()[k] || null,
    /** Anota `{ s, ms }` si es mejor que el anterior. Devuelve `{ nuevo, antes }`. */
    anotar(k = '', r) {
      const todo = leerTodo();
      const antes = todo[k] || null;
      const nuevo = !antes || r.s > antes.s || (r.s === antes.s && r.ms < antes.ms);
      if (nuevo) { try { todo[k] = { s: r.s, ms: r.ms }; localStorage.setItem(clave, JSON.stringify(todo)); } catch (_) { /* sin memoria */ } }
      return { nuevo, antes };
    },
  };
}
