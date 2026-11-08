/**
 * La Copa's store with no signal (D-544): the same interface as store-firebase.js, drawn from the
 * copy of each cup this phone kept while online (`cuenta.copia`) and the outbox (`assets/js/cup-outbox.js`).
 *
 * It plays a pending day and keeps its result; everything else (create, join, the wildcard, the
 * admin) answers `offline`, which the screens already say as "no connection". A day whose window
 * already closed by the phone's clock (with the server's offset kept in the copy) is refused as
 * `ventana`, like the rules would.
 */
import { abierto, conCierre } from './engine.js';
import { anotarInicio, anotarResultado, conCola } from '../assets/js/cup-outbox.js';

const falla = code => Object.assign(new Error(code), { code });

export function createOfflineStore({ cuenta, storage = globalThis.localStorage, clock = () => Date.now() } = {}) {
  const oyentes = new Map();   // code → [cb]
  const copia = code => cuenta.copia.leer(code);
  const offset = code => Number(copia(code)?.offset) || 0;
  let ultimo = null;
  const ver = code => { const c = copia(code); return c?.L ? conCola(c.L, code, storage) : null; };
  const avisar = code => { const L = ver(code); for (const cb of oyentes.get(code) || []) cb(L); };
  const ventana = (code, d) => {
    const L = conCierre(copia(code)?.L);
    if (!L?.meta) throw falla('sin-copia');
    if (!abierto(L.meta, d, clock() + offset(code))) throw falla('ventana');
    return L.meta.win[d].b;
  };
  return {
    tipo: 'offline',
    uid: null,
    listo: async () => null,
    now: () => clock() + (ultimo ? offset(ultimo) : 0),
    async existe(code) { return !!copia(code); },
    escuchar(code, cb, onError = () => {}) {
      ultimo = code;
      const L = ver(code);
      if (!L) { setTimeout(() => onError(falla('sin-copia')), 0); return () => {}; }
      oyentes.set(code, [...(oyentes.get(code) || []), cb]);
      setTimeout(() => cb(ver(code)), 0);
      return () => oyentes.set(code, (oyentes.get(code) || []).filter(f => f !== cb));
    },
    async leer(code) { const L = ver(code); if (!L) throw falla('offline'); return L; },
    async empezar(code, d, pid) {
      const b = ventana(code, d);
      anotarInicio({ code, d, pid, b, at: clock() + offset(code) }, storage);
      avisar(code);
    },
    async resultado(code, d, pid, r) {
      const b = ventana(code, d);
      if (copia(code)?.L?.results?.[d]?.[pid]) throw falla('ya-jugado');
      anotarResultado({ code, d, pid, b, at: clock() + offset(code), res: r }, storage);
      avisar(code);
    },
    yaEsta: async () => false,
    porQue: async e => e,
    reportar: async () => { throw falla('offline'); },
    ...Object.fromEntries(['crear', 'alias', 'inscribir', 'intentar', 'sentarse', 'sentarseComoJugador', 'comodin', 'sacar',
      'devolver', 'eliminar', 'cerrarInscripcion', 'reprogramar', 'terminarCopa', 'renombrarCopa', 'ponerPais', 'enlazar',
      'renombrar', 'guardarAvisos', 'quitarAvisos', 'cambiarPin'].map(k => [k, async () => { throw falla('offline'); }])),
  };
}
