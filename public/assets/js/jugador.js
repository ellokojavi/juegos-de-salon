/**
 * El jugador de este celular y sus récords (D-212). Entrar es opcional: sin jugador todo se
 * juega igual que siempre y nada sale del celular; con jugador, el mejor puntaje de cada juego
 * va a los rankings y se cuentan sus partidas.
 *
 * El almacén es la base de datos, con la misma forma que Firebase: `jugador-firebase.js` en el
 * sitio y `jugador-local.js` en las pruebas (hace cumplir lo mismo que las reglas).
 *
 *   jugadores/<jid>                 { n: nombre, at, juegos: { <juego>: { n: partidas, at } } }
 *   jugadorNombres/<clave>/<jid>    true: quiénes usan ese nombre. Se lee para entrar.
 *   jugadorKeys/<jid>               sha256 del PIN. Nadie lo puede leer.
 *   jugadorSeats/<jid>/<uid>        el celular `uid` escribe por `jid`; las reglas lo aceptan solo
 *                                   si trae el mismo hash que jugadorKeys (como en La Copa, D-96).
 *   records/<tabla>/<periodo>/<jid> { s, ms, k, at, n }: el mejor, y solo si mejora.
 *   torneoPodios/<código>           el podio de una copa terminada, para el medallero.
 *   jugadorCopas/<jid>/<código>     { p, at }: las copas en que está, como el jugador `p` de cada
 *                                   una (D-220). Solo la leen sus celulares.
 */
import { envOf, countryOf } from './transport/stats.js';
import {
  claveNombre, limpiarNombre, esPin, esJid, nuevoJid, hashPinJugador, tablaId, normalizar, esMejor, semana,
  SIEMPRE, TODOTERRENO, todoterreno, vistaTabla, ordenar, VARIANTE_VICTORIAS, claveOrden, PARTIDAS, esPais,
} from './records.js';

/** Lo que entiende Firebase (y el almacén de prueba) como "la hora del servidor" y "sumar uno". */
export const HORA = { '.sv': 'timestamp' };
export const MAS_UNO = { '.sv': { increment: 1 } };

const KEY = 'juegos-de-salon:jugador';
const MEJORES = 'juegos-de-salon:jugador:mejores';
const AMIGOS = 'juegos-de-salon:jugador:amigos';

const falla = code => Object.assign(new Error(code), { code });

/**
 * Los rankings partieron en el laboratorio (D-212) y se abrieron a todos (D-217). La puerta queda
 * por si algo de los rankings vuelve a probarse antes de abrirse: con `RANKINGS_EN_LABS = true`,
 * se ven solo en los celulares que los activaron (`activarRankings`) y siempre en pruebas.
 */
export const RANKINGS_EN_LABS = false;
export const LABS_RANKINGS_KEY = 'juegos-de-salon:labs-rankings';
export function rankingsVisibles(storage = globalThis.localStorage) {
  if (!RANKINGS_EN_LABS) return true;
  try { return envOf(globalThis.location || {}) === 'dev' || storage.getItem(LABS_RANKINGS_KEY) === '1'; } catch (_) { return false; }
}
export function activarRankings(si, storage = globalThis.localStorage) {
  try { if (si) storage.setItem(LABS_RANKINGS_KEY, '1'); else storage.removeItem(LABS_RANKINGS_KEY); } catch (_) { /* sin memoria */ }
}

/** El jugador guardado en este celular, sin esperar a nada: para dibujar de una. */
export function leerYo(storage = globalThis.localStorage) {
  try { const y = JSON.parse(storage.getItem(KEY)); return y && esJid(y.jid) ? y : null; } catch (_) { return null; }
}

/** Cuántas filas se leen de una tabla: las 10 que se muestran y las de alrededor de quien mira. */
export const LEER = 100;

/**
 * `juegos`: los que suman al Todoterreno (los sueltos de la portada). `storage` y `now` se
 * pueden cambiar en las pruebas.
 */
export function crearJugador({ almacen, storage = globalThis.localStorage, now = () => Date.now(), juegos = [], pais = () => '' } = {}) {
  const leer = (k, def) => { try { return JSON.parse(storage.getItem(k)) ?? def; } catch (_) { return def; } };
  const escribir = (k, v) => { try { if (v === null) storage.removeItem(k); else storage.setItem(k, JSON.stringify(v)); } catch (_) { /* sin memoria */ } };
  const oyentes = new Set();
  const avisar = () => { for (const f of oyentes) try { f(api.yo()); } catch (_) { /* nada */ } };

  /** Mis mejores, por tabla y período, tal como los vio este celular. */
  const mejores = () => leer(MEJORES, {});
  const anotarMejor = (t, p, r) => {
    if (!r) return;
    const m = mejores();
    const antes = m[t]?.[p];
    if (!antes || esMejor(r, antes)) { (m[t] ||= {})[p] = { s: r.s, ms: r.ms }; escribir(MEJORES, m); }
  };
  /** Las semanas viejas no sirven para nada: se borran del celular. */
  const podarMejores = () => {
    const sem = semana(now()), m = mejores();
    for (const t of Object.keys(m)) for (const p of Object.keys(m[t])) if (p !== SIEMPRE && p !== sem) delete m[t][p];
    escribir(MEJORES, m);
  };

  /**
   * Este celular queda como `jid`. El país del jugador va junto a su nombre en todas las tablas
   * (D-219): si el jugador no lo tiene, se le pone el de este celular, una vez.
   */
  const quedar = async (jid, n) => {
    let co = await almacen.get(`jugadores/${jid}/co`).catch(() => null);
    if (!esPais(co)) {
      const mio = pais();
      if (esPais(mio)) { try { await almacen.update({ [`jugadores/${jid}/co`]: mio }); co = mio; } catch (_) { co = null; } }
    }
    escribir(KEY, { jid, n, ...(esPais(co) ? { co } : {}) });
    avisar();
    // Lo que ya tenía en el servidor, para que el Todoterreno sume desde ahí (D-212)
    sincronizar().catch(() => {});
    return { jid, n, ...(esPais(co) ? { co } : {}) };
  };
  /** Lo que lleva cada fila de una tabla, además del puntaje: el nombre y el país. */
  const quien = yo => ({ n: yo.n, ...(esPais(yo.co) ? { co: yo.co } : {}) });

  /** Una partida más en la tabla de partidas (D-219), de la semana y de siempre. Mejor esfuerzo. */
  async function sumarPartida(yo) {
    try {
      const cambios = {};
      for (const p of [SIEMPRE, semana(now())]) {
        const v = ((await almacen.get(`records/${PARTIDAS}/${p}/${yo.jid}`))?.s || 0) + 1;
        cambios[`records/${PARTIDAS}/${p}/${yo.jid}`] = { s: v, ms: 0, k: claveOrden(v, 0), at: HORA, ...quien(yo) };
      }
      await almacen.update(cambios);
    } catch (_) { /* la tabla de partidas es un adorno: la partida ya quedó contada */ }
  }

  async function sincronizar() {
    const yo = api.yo();
    if (!yo) return;
    escribir(MEJORES, {});
    const periodos = [SIEMPRE, semana(now())];
    await Promise.all(juegos.flatMap(j => periodos.map(async p => anotarMejor(j, p, await almacen.get(`records/${j}/${p}/${yo.jid}`)))));
  }

  /** Probar el PIN contra los jugadores que usan ese nombre: el que lo acepta, es. */
  async function buscar(nombre, pin) {
    const clave = claveNombre(nombre);
    const candidatos = Object.keys((await almacen.get(`jugadorNombres/${clave}`)) || {}).filter(esJid);
    const uid = await almacen.listo();
    let heredado = null;
    for (const jid of candidatos) {
      const h = await hashPinJugador(jid, pin);
      try {
        await almacen.update({ [`jugadorSeats/${jid}/${uid}`]: h });
        return { jid, candidatos };
      } catch (e) {
        if (e.code !== 'permiso') throw e;
        // Un jugador de antes de los rankings (sin PIN): sus puntajes esperan a su dueño
        if (!heredado && await almacen.get(`jugadores/${jid}/legado`)) heredado = jid;
      }
    }
    return { jid: null, candidatos, heredado };
  }

  const api = {
    /** El jugador de este celular, `{ jid, n }`, o null. */
    yo: () => leerYo(storage),
    /** Avisa cuando se entra o se sale (para redibujar). Devuelve cómo dejar de escuchar. */
    escuchar(f) { oyentes.add(f); return () => oyentes.delete(f); },

    /**
     * Entrar con nombre y PIN. `{ estado: 'dentro', jid }` si algún jugador con ese nombre tiene
     * ese PIN; si no, `{ estado: 'nuevo', otros }`: cuántos usan ese nombre con otro PIN. Con eso
     * la pantalla pregunta si es otra persona antes de crear un jugador nuevo.
     */
    async entrar(nombre, pin) {
      const n = limpiarNombre(nombre);
      if (!n) throw falla('nombre');
      if (!esPin(pin)) throw falla('pin-forma');
      const { jid, candidatos, heredado } = await buscar(n, pin);
      // `heredado`: hay puntajes de La Copa a ese nombre, de antes de los rankings, sin dueño
      if (!jid) {
        const de = heredado ? { heredado, nombreHeredado: (await almacen.get(`jugadores/${heredado}/n`)) || n } : {};
        return { estado: 'nuevo', otros: candidatos.length - (heredado ? 1 : 0), ...de };
      }
      await quedar(jid, (await almacen.get(`jugadores/${jid}/n`)) || n);
      return { estado: 'dentro', jid };
    },

    /** Un jugador nuevo. Si ya hay uno con ese nombre y ese PIN, entra a ese (no se duplica). */
    async crear(nombre, pin) {
      const n = limpiarNombre(nombre);
      if (!n) throw falla('nombre');
      if (!esPin(pin)) throw falla('pin-forma');
      const ya = await buscar(n, pin);
      if (ya.jid) return quedar(ya.jid, (await almacen.get(`jugadores/${ya.jid}/n`)) || n);
      const uid = await almacen.listo();
      const jid = nuevoJid();
      const h = await hashPinJugador(jid, pin);
      await almacen.update({
        [`jugadores/${jid}`]: { n, at: HORA, ...(esPais(pais()) ? { co: pais() } : {}) },
        [`jugadorNombres/${claveNombre(n)}/${jid}`]: true,
        [`jugadorKeys/${jid}`]: h,
        [`jugadorSeats/${jid}/${uid}`]: h,
      });
      return quedar(jid, n);
    },

    /**
     * Tomar un jugador heredado (los de La Copa de antes de los rankings, que no tienen PIN): el
     * primero que entra con ese nombre y dice "son míos" le pone su PIN y se queda con sus puntajes.
     */
    async reclamar(jid, pin) {
      if (!esJid(jid)) throw falla('jid');
      if (!esPin(pin)) throw falla('pin-forma');
      const uid = await almacen.listo();
      const h = await hashPinJugador(jid, pin);
      await almacen.update({ [`jugadorKeys/${jid}`]: h, [`jugadorSeats/${jid}/${uid}`]: h, [`jugadores/${jid}/legado`]: null });
      return quedar(jid, (await almacen.get(`jugadores/${jid}/n`)) || '?');
    },

    /** Salir en este celular. Los récords quedan; se vuelve a entrar con el mismo nombre y PIN. */
    salir() {
      const yo = api.yo();
      escribir(KEY, null); escribir(MEJORES, null);
      avisar();
      if (yo) almacen.listo().then(uid => almacen.update({ [`jugadorSeats/${yo.jid}/${uid}`]: null })).catch(() => {});
    },

    /** Cambiar el PIN: los demás celulares donde estaba quedan afuera. */
    async cambiarPin(pin) {
      const yo = api.yo();
      if (!yo) throw falla('sin-jugador');
      if (!esPin(pin)) throw falla('pin-forma');
      const uid = await almacen.listo();
      const h = await hashPinJugador(yo.jid, pin);
      await almacen.update({ [`jugadorKeys/${yo.jid}`]: h, [`jugadorSeats/${yo.jid}`]: { [uid]: h } });
    },

    async perfil(jid = api.yo()?.jid) {
      return jid ? almacen.get(`jugadores/${jid}`) : null;
    },

    /**
     * Anotar una partida terminada. Se cuenta siempre; el puntaje entra a la tabla de siempre y
     * a la de la semana si las mejora, y al Todoterreno si es un juego suelto. Sin jugador, no
     * hace nada y devuelve null. Si el PIN cambió en otro celular, este queda afuera ('pin').
     * Un 0 (rendirse) cuenta como partida jugada, pero no entra a las tablas (dilema #185).
     */
    async anotar({ juego, variante = '', s, ms }) {
      const yo = api.yo();
      const r = normalizar({ s, ms });
      if (!yo || !r) return null;
      podarMejores();
      try {
        await almacen.update({ [`jugadores/${yo.jid}/juegos/${juego}/n`]: MAS_UNO, [`jugadores/${yo.jid}/juegos/${juego}/at`]: HORA });
      } catch (e) {
        if (e.code === 'permiso') { escribir(KEY, null); avisar(); throw falla('pin'); }
        throw e;
      }
      await sumarPartida(yo);
      const t = tablaId(juego, variante);
      const sem = semana(now());
      const out = {};
      const cambios = {};
      for (const [nombre, p] of [['siempre', SIEMPRE], ['semana', sem]]) {
        const antes = await almacen.get(`records/${t}/${p}/${yo.jid}`);
        anotarMejor(t, p, antes);
        const nuevo = r.s > 0 && esMejor(r, antes);
        out[nombre] = { nuevo, antes: antes ? { s: antes.s, ms: antes.ms } : null, periodo: p };
        if (nuevo) cambios[`records/${t}/${p}/${yo.jid}`] = { ...r, at: HORA, ...quien(yo) };
      }
      if (Object.keys(cambios).length) {
        await almacen.update(cambios);
        for (const [nombre, p] of [['siempre', SIEMPRE], ['semana', sem]]) if (out[nombre].nuevo) anotarMejor(t, p, r);
      }
      // El Todoterreno va aparte: si este celular no sabe todos sus mejores, su suma puede quedar
      // corta y las reglas la rechazan sin llevarse el récord del juego.
      if (!variante && juegos.includes(juego) && Object.keys(cambios).length) {
        for (const p of [SIEMPRE, sem]) {
          const suma = todoterreno(Object.fromEntries(juegos.map(j => [j, mejores()[j]?.[p]])), juegos);
          const tt = suma && normalizar(suma);
          if (!tt) continue;
          try {
            const antes = await almacen.get(`records/${TODOTERRENO}/${p}/${yo.jid}`);
            if (esMejor(tt, antes)) await almacen.update({ [`records/${TODOTERRENO}/${p}/${yo.jid}`]: { ...tt, at: HORA, ...quien(yo) } });
          } catch (_) { /* el Todoterreno es un adorno: el récord del juego ya quedó */ }
        }
      }
      return out;
    },

    /**
     * Una partida de un juego de grupo terminada (D-212): se cuenta, y si la ganó, suma una
     * victoria en la tabla de la semana y en la de siempre. Sin jugador, null.
     */
    async anotarVictoria({ juego, gano }) {
      const yo = api.yo();
      if (!yo) return null;
      try {
        await almacen.update({ [`jugadores/${yo.jid}/juegos/${juego}/n`]: MAS_UNO, [`jugadores/${yo.jid}/juegos/${juego}/at`]: HORA });
      } catch (e) {
        if (e.code === 'permiso') { escribir(KEY, null); avisar(); throw falla('pin'); }
        throw e;
      }
      await sumarPartida(yo);
      if (!gano) return { gano: false };
      const t = tablaId(juego, VARIANTE_VICTORIAS);
      const out = { gano: true };
      const cambios = {};
      for (const [nombre, p] of [['siempre', SIEMPRE], ['semana', semana(now())]]) {
        const v = ((await almacen.get(`records/${t}/${p}/${yo.jid}`))?.s || 0) + 1;
        out[nombre] = v;
        cambios[`records/${t}/${p}/${yo.jid}`] = { s: v, ms: 0, k: claveOrden(v, 0), at: HORA, ...quien(yo) };
      }
      await almacen.update(cambios);
      return out;
    },

    /**
     * Una tabla tal como se muestra: `{ top, yo, vecinos, fuera }` (ver `vistaTabla`). Lee de una
     * vez las primeras 100; si quien mira está más abajo, lee aparte a sus vecinos.
     */
    async tabla(t, periodo = semana(now()), { top = 10 } = {}) {
      const yo = api.yo();
      const leidas = await almacen.top(t, periodo, LEER);
      let vecinosLeidos = null;
      if (yo && leidas.length >= LEER && !leidas.some(f => f.jid === yo.jid)) {
        const mio = await almacen.get(`records/${t}/${periodo}/${yo.jid}`);
        if (mio) vecinosLeidos = { ...(await almacen.vecinos(t, periodo, mio.k, 2)), yo: { jid: yo.jid, ...mio } };
      }
      return vistaTabla(leidas, yo?.jid, { top, vecinosLeidos });
    },

    /** Los amigos: los que este celular conoció en sus copas. */
    amigos() { return leer(AMIGOS, {}); },
    conocer(mapa) {
      const yo = api.yo(), a = api.amigos();
      let cambio = false;
      for (const [jid, n] of Object.entries(mapa || {})) if (esJid(jid) && jid !== yo?.jid && a[jid] !== n) { a[jid] = n; cambio = true; }
      if (cambio) escribir(AMIGOS, a);
    },
    /** La tabla entre amigos: yo y los que conocí, con lo que tengan en esa tabla. */
    async tablaAmigos(t, periodo = semana(now())) {
      const yo = api.yo();
      const ids = [...new Set([yo?.jid, ...Object.keys(api.amigos())].filter(esJid))];
      const filas = (await Promise.all(ids.map(async jid => {
        const r = await almacen.get(`records/${t}/${periodo}/${jid}`);
        return r ? { jid, ...r } : null;
      }))).filter(Boolean);
      return ordenar(filas);
    },

    /** Los podios de las copas terminadas: `{ código: { name, end, de, p } }`. */
    podios: (n = 200) => almacen.podios(n),
    /** Guardar el podio de una copa terminada, una sola vez. Lo hace cualquiera que la abra. */
    async guardarPodio(code, podio) {
      if (await almacen.get(`torneoPodios/${code}/end`)) return false;
      await almacen.update({ [`torneoPodios/${code}`]: { ...podio, at: HORA } });
      return true;
    },

    /**
     * Las copas de este jugador, de cualquier celular (D-220): `[{ code, p, at }]`, la más reciente
     * primero. Sin jugador, ninguna.
     */
    async copas() {
      const yo = api.yo();
      if (!yo) return [];
      const m = (await almacen.get(`jugadorCopas/${yo.jid}`)) || {};
      return Object.entries(m).filter(([, x]) => x?.p).map(([code, x]) => ({ code, p: x.p, at: x.at || 0 })).sort((a, b) => b.at - a.at);
    },
    /** Anotar que este jugador está en la copa `code` como `pid` (la copa ya lo tiene enlazado). */
    async anotarCopa(code, pid) {
      const yo = api.yo();
      if (!yo) return;
      await almacen.update({ [`jugadorCopas/${yo.jid}/${code}`]: { p: pid, at: HORA } });
    },
    /** Sacar de la lista una copa que ya no existe (la borró su admin). */
    async olvidarCopa(code) {
      const yo = api.yo();
      if (yo) await almacen.update({ [`jugadorCopas/${yo.jid}/${code}`]: null });
    },

    sincronizar,

    /** Quien entró antes de que se guardara el país (D-219) lo completa solo, una vez, sin esperar. */
    async completarPais() {
      const yo = api.yo();
      if (!yo || esPais(yo.co)) return;
      await quedar(yo.jid, yo.n);
    },
  };
  return api;
}

/* ------------------------------------------------------------------ */
/* El de la página                                                     */
/* ------------------------------------------------------------------ */

let unico = null;
/**
 * El jugador de la página, con el almacén que corresponde: Firebase en el sitio publicado; en
 * pruebas (localhost, la red de la casa y Tailscale: `envOf`, D-138) y con `?prueba`, el de prueba, para que los guiones no escriban en los rankings de
 * verdad. `?records=firebase` fuerza Firebase para mirarlo a mano.
 */
export async function jugador() {
  if (unico) return unico;
  const q = new URLSearchParams(location.search);
  const local = q.get('records') !== 'firebase' && (q.has('prueba') || envOf(location) === 'dev');
  const almacen = local
    ? (await import('./jugador-local.js')).crearAlmacenLocal()
    : (await import('./jugador-firebase.js')).crearAlmacenFirebase();
  const { SUELTOS } = await import('./games.js');
  const pais = () => { try { return countryOf({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, lang: navigator.language }); } catch (_) { return ''; } };
  unico = crearJugador({ almacen, juegos: SUELTOS.filter(g => !g.labs).map(g => g.id), pais });
  unico.completarPais().catch(() => {});
  return unico;
}
