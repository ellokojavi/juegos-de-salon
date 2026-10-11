/**
 * Almacén de prueba de La Copa: la misma interfaz que el de Firebase (store-firebase.js), pero
 * en localStorage y con un reloj que se puede adelantar (LIG-27).
 *
 * Sirve para jugar una copa entera en un solo computador —varias pestañas son varios
 * jugadores— y para las pruebas de punta a punta, sin tocar la base de verdad. Se activa con
 * `?test` en la URL (`?prueba` antes de D-266). Imita las reglas del servidor que importan para jugar: escribir una
 * sola vez, la ventana de cada día, el PIN y el comodín antes de empezar.
 */
import { aliasHasta, MAX_JUGADORES, faltaGente, claveNombre, esCodigo, abierto, puedeComodin, inscripcionAbierta, sinEmpezar, terminada, conCierre, puedeCerrar } from './engine.js';

const KEY = 'juegos-de-salon:copa:prueba';
const RELOJ = 'juegos-de-salon:copa:prueba:reloj';
const ALIASES = 'juegos-de-salon:copa:prueba:alias';
const leerAlias = () => { try { return JSON.parse(localStorage.getItem(ALIASES) || '{}'); } catch (_) { return {}; } };
const guardarAlias = a => { try { localStorage.setItem(ALIASES, JSON.stringify(a)); } catch (_) { /* nada */ } };

const falla = code => Object.assign(new Error(code), { code });

function leerTodo() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { return {}; }
}
function guardarTodo(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) { /* nada */ }
}

export function createLocalStore({ uid = null } = {}) {
  // Cada pestaña es un "celular": su uid vive en sessionStorage.
  let yo = uid;
  if (!yo) {
    try { yo = sessionStorage.getItem('copa:prueba:uid'); } catch (_) { /* nada */ }
    if (!yo) {
      yo = `u${Math.random().toString(36).slice(2, 10)}`;
      try { sessionStorage.setItem('copa:prueba:uid', yo); } catch (_) { /* nada */ }
    }
  }
  const oyentes = new Set();
  const avisar = () => { for (const f of oyentes) f(); };
  let canal = null;
  try { canal = new BroadcastChannel(KEY); canal.onmessage = avisar; } catch (_) { /* nada */ }
  addEventListener('storage', e => { if (e.key === KEY || e.key === RELOJ) avisar(); });

  const adelanto = () => { try { return Number(localStorage.getItem(RELOJ)) || 0; } catch (_) { return 0; } };
  const now = () => Date.now() + adelanto();

  const cambiar = fn => {
    const db = leerTodo();
    const out = fn(db);
    guardarTodo(db);
    avisar();
    try { canal?.postMessage(1); } catch (_) { /* nada */ }
    return out;
  };

  const copa = (db, code) => {
    const L = db[code];
    if (!L) throw falla('no-existe');
    return L;
  };
  // Las ventanas con el cierre del admin aplicado (D-161): como las reglas, que miran `fin`
  const vista = L => conCierre(L).meta;
  const sentado = (L, pid) => !!L._seats?.[pid]?.[yo];
  const esAdmin = L => sentado(L, L.meta.admin);
  const publica = L => {
    if (!L) return null;
    const { _keys, _seats, _avisos, ...resto } = L;
    return JSON.parse(JSON.stringify(resto));
  };

  return {
    tipo: 'prueba',
    get uid() { return yo; },
    async listo() { return yo; },
    now,
    /** Solo en pruebas: adelantar el reloj de todas las pestañas. */
    adelantar(ms) { try { localStorage.setItem(RELOJ, String(adelanto() + ms)); } catch (_) { /* nada */ } avisar(); },
    reiniciarReloj() { try { localStorage.removeItem(RELOJ); } catch (_) { /* nada */ } avisar(); },

    async existe(code) { return !!leerTodo()[code]; },

    async crear(code, meta, { pid, name, at, pinHash, co = '' }) {
      return cambiar(db => {
        if (!esCodigo(code)) throw falla('codigo');
        if (db[code]) throw falla('ocupado');
        // El link propio: tomado si apunta a otra copa y no venció (D-121)
        if (meta.alias) {
          const al = leerAlias();
          const x = al[meta.alias];
          if (x && x.hasta > now() && x.code !== code) throw falla('alias');
          al[meta.alias] = { code, hasta: aliasHasta(meta) };
          guardarAlias(al);
        }
        db[code] = {
          meta, players: { [pid]: { name, at, ...(co ? { co } : {}) } }, started: {}, results: {}, wild: {},
          _keys: { [pid]: pinHash }, _seats: { [pid]: { [yo]: true } },
        };
      });
    },

    async alias(a) { return leerAlias()[a] || null; },

    escuchar(code, cb) {
      const f = () => cb(publica(leerTodo()[code]));
      oyentes.add(f);
      f();
      return () => oyentes.delete(f);
    },

    async leer(code) { return publica(leerTodo()[code]); },

    async inscribir(code, { pid, name, at, pinHash, co = '' }) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!inscripcionAbierta(vista(L), now(), L.closed)) throw falla('cerrada');
        const activos = Object.values(L.players).filter(p => !p.out);
        if (activos.length >= MAX_JUGADORES) throw falla('llena');
        if (Object.values(L.players).some(p => claveNombre(p.name) === claveNombre(name))) throw falla('nombre-repetido');
        if (L.players[pid]) throw falla('ocupado');
        L.players[pid] = { name, at, ...(co ? { co } : {}) };
        L._keys[pid] = pinHash;
        L._seats[pid] = { [yo]: true };
      });
    },

    async sentarse(code, pid, pinHash) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!L._keys[pid] || L._keys[pid] !== pinHash) throw falla('pin');
        (L._seats[pid] ||= {})[yo] = true;
      });
    },

    async empezar(code, dia, pid) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!sentado(L, pid)) throw falla('permiso');
        if (faltaGente(L)) throw falla('faltan');
        if (!abierto(vista(L), dia, now())) throw falla('ventana');
        L.started[dia] ||= {};
        if (!L.started[dia][pid]) L.started[dia][pid] = now();
      });
    },

    async comodin(code, dia, pid) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!sentado(L, pid)) throw falla('permiso');
        if (!puedeComodin(conCierre(L), dia, pid, now())) throw falla('comodin');
        L.wild[pid] = String(dia);
      });
    },

    async resultado(code, dia, pid, r) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!sentado(L, pid)) throw falla('permiso');
        if (!abierto(vista(L), dia, now())) throw falla('ventana');
        L.results[dia] ||= {};
        if (L.results[dia][pid]) throw falla('ya-jugado');
        L.results[dia][pid] = { ...r, at: now() };
      });
    },

    async sacar(code, pid, out) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        if (pid === L.meta.admin) throw falla('permiso');
        if (!L.players[pid]) throw falla('no-existe');
        if (out) L.players[pid].out = true; else delete L.players[pid].out;
      });
    },

    /** Eliminar la copa entera (D-117): solo su admin. */
    async eliminar(code) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        if (L.meta.alias) { const al = leerAlias(); delete al[L.meta.alias]; guardarAlias(al); }
        delete db[code];
      });
    },

    /** Cerrar o reabrir la inscripción (D-110). */
    async cerrarInscripcion(code, cerrada) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        if (cerrada) L.closed = true; else delete L.closed;
      });
    },

    /** Mover el inicio mientras nadie haya jugado (D-110): `meta` viene de `moverInicio`. */
    async reprogramar(code, meta) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        // Una copa del laboratorio se puede correr siempre (pasar al día siguiente, D-115)
        if (L.fin) throw falla('terminada');
        if (!L.meta.lab && !sinEmpezar(L)) throw falla('empezada');
        // Pasar de día (lab) necesita con quién jugar; mover el inicio de una copa sin empezar, no
        if (L.meta.lab && !sinEmpezar(L) && faltaGente(L)) throw falla('faltan');
        if (!L.meta.lab && meta.win[1].b <= now()) throw falla('ventana');
        L.meta = { ...meta, createdAt: L.meta.createdAt };
        if (meta.alias) { const al = leerAlias(); al[meta.alias] = { code, hasta: aliasHasta(meta) }; guardarAlias(al); }
      });
    },

    /** Terminar la copa antes de tiempo (D-161): solo su admin, una vez, ya partida y sin terminar. */
    async terminarCopa(code) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        if (!puedeCerrar(vista(L), now())) throw falla('fin');
        L.fin = now();
      });
    },

    /** Cambiar el nombre de la copa (D-148): solo su admin y mientras no termine. */
    async renombrarCopa(code, name) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        if (terminada(vista(L), now())) throw falla('terminada');
        L.meta.name = name;
      });
    },

    /** El jugador de los rankings detrás de este jugador de la copa (D-212). */
    async enlazar(code, pid, jid) {
      return cambiar(db => {
        const p = copa(db, code).players[pid];
        if (p) p.j = jid;
      });
    },

    async ponerPais(code, pid, co) {
      return cambiar(db => {
        const p = copa(db, code).players[pid];
        if (p && !p.co) p.co = co;
      });
    },

    async renombrar(code, pid, name) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        if (Object.entries(L.players).some(([p, x]) => p !== pid && claveNombre(x.name) === claveNombre(name))) throw falla('nombre-repetido');
        L.players[pid].name = name;
      });
    },

    /** Los reportes de prueba quedan en este navegador (`juegos-de-salon:copa:prueba:reportes`). */
    async reportar(r) {
      try {
        const k = `${KEY}:reportes`;
        const lista = JSON.parse(localStorage.getItem(k) || '[]');
        lista.push({ ...r, at: now() });
        localStorage.setItem(k, JSON.stringify(lista));
      } catch (_) { /* nada */ }
    },

    /** Como en Firebase (D-223): solo quien está sentado como el jugador. Nadie más lo lee. */
    async guardarAvisos(code, pid, subId, sub, { dia = true, plazo = true } = {}) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!sentado(L, pid)) throw falla('permiso');
        if (!/^[0-9a-f]{32}$/.test(subId) || !/^https:\/\//.test(sub?.endpoint || '')) throw falla('permiso');
        L._avisos ||= {};
        L._avisos[pid] ||= {};
        L._avisos[pid][subId] = { dia: !!dia, plazo: !!plazo, at: now(), sub: { ...sub, uid: yo } };
      });
    },

    async quitarAvisos(code, pid, subId) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!sentado(L, pid)) throw falla('permiso');
        delete L._avisos?.[pid]?.[subId];
      });
    },

    /** Solo en pruebas: lo que vería quien manda los avisos. */
    async avisosDe(code) { return JSON.parse(JSON.stringify(leerTodo()[code]?._avisos || {})); },

    async cambiarPin(code, pid, pinHash) {
      return cambiar(db => {
        const L = copa(db, code);
        if (!esAdmin(L)) throw falla('permiso');
        L._keys[pid] = pinHash;
        if (pid !== L.meta.admin) L._seats[pid] = {};
      });
    },
  };
}
