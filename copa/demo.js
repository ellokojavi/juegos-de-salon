/**
 * Demos del laboratorio (D-110): una copa de ejemplo, ya en marcha, para mirar y tocar cada
 * vista de La Copa —del jugador y del admin— como en producción, sin armar una copa ni esperar
 * días. Solo en el modo de prueba (`?prueba&demo=<escena>`): siembra la copa en el almacén local,
 * con una copa nueva cada vez, y deja la sesión del jugador que corresponde a la escena.
 */
import { nuevaMeta, fechaEn, sumarDias, codigoAlAzar, ZONA, CALENDARIOS } from './engine.js';

const KEY = 'juegos-de-salon:copa:prueba';

const JUGADORES = [
  { pid: 'cata01', name: 'Cata' },
  { pid: 'javi02', name: 'Javi' },
  { pid: 'panc03', name: 'Pancho' },
  { pid: 'vale04', name: 'Vale' },
  { pid: 'nico05', name: 'Nico' },
];

/** Puntajes creíbles por minijuego: `k` de 0 a 1 dice qué tan bien le fue. */
const PUNTAJE = {
  linea: k => { const s = Math.round((100 * Math.round(9 * k)) / 9); return { s, r: `${s}/100` }; },
  numero: k => { const s = 100 - 10 * Math.round(9 * (1 - k)); return { s, r: `${s}/100` }; },
  conexiones: k => { const s = Math.max(0, Math.round(20 * k) * 5); return { s, r: `${s}/100` }; },
  reinas: k => { const s = Math.max(10, Math.round(100 * k)); return { s, r: `${s}/100` }; },
  letras: k => { const s = Math.round(100 * k); return { s, r: `${s}/100` }; },
  zip: k => { const s = 10 * Math.round(8 * k); return { s, r: `${s}/100` }; },
  tango: k => { const s = Math.max(10, Math.round(100 * k)); return { s, r: `${s}/100` }; },
  anio: k => { const s = Math.round(100 * k); return { s, r: `${s}/100` }; },
  final: k => { const s = Math.round(100 * k); return { s, r: `${s}/100` }; },
};

/** Un azar fijo por jugador y día, para que la demo se vea igual cada vez. */
const azar = (pid, d) => { let h = 7; for (const c of `${pid}:${d}`) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 1000) / 1000; };

/**
 * Las escenas. `inicio` es cuántos días atrás partió (negativo: parte en el futuro); `jugaron`,
 * cuántos días completos hay jugados; `yo`, quién mira (null: alguien que abre la invitación).
 */
export const ESCENAS = {
  nueva: { inicio: -1, jugadores: 1, jugaron: 0, yo: 'cata01', pantalla: 'admin', recien: true },
  invitado: { inicio: -1, jugadores: 3, jugaron: 0, yo: null, pantalla: 'entrar' },
  espera: { inicio: -1, jugadores: 4, jugaron: 0, yo: 'javi02', pantalla: 'tablero' },
  'sin-jugar': { inicio: 1, jugadores: 4, jugaron: 0, yo: 'cata01', pantalla: 'admin' },
  jugador: { inicio: 3, jugadores: 5, jugaron: 3, yo: 'javi02', pantalla: 'tablero' },
  admin: { inicio: 3, jugadores: 5, jugaron: 3, yo: 'cata01', pantalla: 'admin' },
  final: { inicio: 6, jugadores: 5, jugaron: 6, yo: 'javi02', pantalla: 'tablero' },
  podio: { inicio: 7, jugadores: 5, jugaron: 7, yo: 'javi02', pantalla: 'tablero' },
};

/**
 * Siembra la escena en el almacén local y devuelve `{ code, pid, pantalla, recien }`. `uid` es el
 * "celular" de esta pestaña: la sesión de quien mira queda sentada en él.
 */
export function sembrar(nombre, { now, uid }) {
  const e = ESCENAS[nombre];
  if (!e) return null;
  const hoy = fechaEn(now, ZONA);
  const inicio = sumarDias(hoy, -e.inicio);
  const meta = nuevaMeta({ nombre: 'Copa de la oficina', dias: 7, inicio, tz: ZONA, admin: 'cata01', creada: now - (e.inicio + 1) * 86400000, lab: true });
  const cal = CALENDARIOS[7];
  const jug = JUGADORES.slice(0, e.jugadores);
  const L = { meta, players: {}, started: {}, results: {}, wild: {}, _keys: {}, _seats: {} };
  jug.forEach((j, i) => {
    L.players[j.pid] = { name: j.name, at: meta.createdAt + i * 60000 };
    L._keys[j.pid] = 'demo';
    L._seats[j.pid] = j.pid === e.yo ? { [uid]: true } : { [`otro-${j.pid}`]: true };
  });
  // Los días ya jugados: todos, menos quien mira el día de hoy (para que pueda jugarlo)
  for (let d = 1; e.jugaron > 0 && d <= Math.min(e.jugaron + 1, 7); d++) {
    for (const j of jug) {
      const hoyEsEste = d === e.jugaron + 1;
      if (hoyEsEste && (j.pid === e.yo || azar(j.pid, d) < 0.5)) continue;
      const k = 0.35 + 0.6 * azar(j.pid, d);
      const r = PUNTAJE[cal[d - 1]](k);
      const at = Math.min(now - 3600000, meta.win[d].a + 3600000 * (8 + 10 * azar(j.pid, -d)));
      (L.started[d] ||= {})[j.pid] = at - 120000;
      (L.results[d] ||= {})[j.pid] = { s: r.s, ms: Math.round(40000 + 200000 * azar(j.pid, d + 9)), t: '', r: r.r, at };
    }
  }
  if (e.jugaron >= 3) L.wild.panc03 = '2';
  try {
    const db = JSON.parse(localStorage.getItem(KEY) || '{}');
    let code = codigoAlAzar();
    while (db[code]) code = codigoAlAzar();
    db[code] = L;
    localStorage.setItem(KEY, JSON.stringify(db));
    return { code, pid: e.yo, pantalla: e.pantalla, recien: !!e.recien, nombre: e.yo ? L.players[e.yo].name : null, meta };
  } catch (_) { return null; }
}
