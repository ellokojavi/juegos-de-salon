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
 */
import {
  claveNombre, limpiarNombre, esPin, esJid, nuevoJid, hashPinJugador, tablaId, normalizar, esMejor, semana,
  SIEMPRE, TODOTERRENO, todoterreno, vistaTabla, ordenar,
} from './records.js';

/** Lo que entiende Firebase (y el almacén de prueba) como "la hora del servidor" y "sumar uno". */
export const HORA = { '.sv': 'timestamp' };
export const MAS_UNO = { '.sv': { increment: 1 } };

const KEY = 'juegos-de-salon:jugador';
const MEJORES = 'juegos-de-salon:jugador:mejores';
const AMIGOS = 'juegos-de-salon:jugador:amigos';

const falla = code => Object.assign(new Error(code), { code });

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
export function crearJugador({ almacen, storage = globalThis.localStorage, now = () => Date.now(), juegos = [] } = {}) {
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

  const quedar = (jid, n) => {
    escribir(KEY, { jid, n });
    avisar();
    // Lo que ya tenía en el servidor, para que el Todoterreno sume desde ahí (D-212)
    sincronizar().catch(() => {});
    return { jid, n };
  };

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
    for (const jid of candidatos) {
      const h = await hashPinJugador(jid, pin);
      try {
        await almacen.update({ [`jugadorSeats/${jid}/${uid}`]: h });
        return { jid, candidatos };
      } catch (e) {
        if (e.code !== 'permiso') throw e;
      }
    }
    return { jid: null, candidatos };
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
      const { jid, candidatos } = await buscar(n, pin);
      if (!jid) return { estado: 'nuevo', otros: candidatos.length };
      quedar(jid, (await almacen.get(`jugadores/${jid}/n`)) || n);
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
        [`jugadores/${jid}`]: { n, at: HORA },
        [`jugadorNombres/${claveNombre(n)}/${jid}`]: true,
        [`jugadorKeys/${jid}`]: h,
        [`jugadorSeats/${jid}/${uid}`]: h,
      });
      return quedar(jid, n);
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
      const t = tablaId(juego, variante);
      const sem = semana(now());
      const out = {};
      const cambios = {};
      for (const [nombre, p] of [['siempre', SIEMPRE], ['semana', sem]]) {
        const antes = await almacen.get(`records/${t}/${p}/${yo.jid}`);
        anotarMejor(t, p, antes);
        const nuevo = esMejor(r, antes);
        out[nombre] = { nuevo, antes: antes ? { s: antes.s, ms: antes.ms } : null, periodo: p };
        if (nuevo) cambios[`records/${t}/${p}/${yo.jid}`] = { ...r, at: HORA, n: yo.n };
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
            if (esMejor(tt, antes)) await almacen.update({ [`records/${TODOTERRENO}/${p}/${yo.jid}`]: { ...tt, at: HORA, n: yo.n } });
          } catch (_) { /* el Todoterreno es un adorno: el récord del juego ya quedó */ }
        }
      }
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

    sincronizar,
  };
  return api;
}

/* ------------------------------------------------------------------ */
/* El de la página                                                     */
/* ------------------------------------------------------------------ */

let unico = null;
/**
 * El jugador de la página, con el almacén que corresponde: Firebase en el sitio publicado; en
 * localhost y con `?prueba`, el de prueba, para que los guiones no escriban en los rankings de
 * verdad. `?records=firebase` fuerza Firebase para mirarlo a mano.
 */
export async function jugador() {
  if (unico) return unico;
  const q = new URLSearchParams(location.search);
  const local = q.get('records') !== 'firebase' && (q.has('prueba') || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname));
  const almacen = local
    ? (await import('./jugador-local.js')).crearAlmacenLocal()
    : (await import('./jugador-firebase.js')).crearAlmacenFirebase();
  const { SUELTOS } = await import('./games.js');
  unico = crearJugador({ almacen, juegos: SUELTOS.filter(g => !g.labs).map(g => g.id) });
  return unico;
}
