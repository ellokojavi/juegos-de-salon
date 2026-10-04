/**
 * Julepe — motor puro (sin DOM). Testeable con node.
 *
 * Juego de bazas de la familia del Tute, adaptado a tragos. Cada mano:
 * se pone el plato, se reparten cinco cartas, se declara si uno **va** o **se pasa**,
 * los que van cambian hasta tres cartas, se juegan cinco bazas y se audita: quien fue y
 * no hizo dos bazas se toma el plato entero (eso es el **julepe**), y quien las hizo
 * reparte dos tragos por baza a quien quiera.
 *
 * Todo el estado se deriva de la lista de mensajes (C-7): `buildState(...)` es la única
 * verdad, y retomar una partida es volver a leer los mensajes (C-6).
 *
 * Las cartas son lo único que no puede salir de una semilla compartida, por lo mismo que
 * los dados del Dudo (D-70): el código es público, así que una semilla que todos conocen
 * deja a cualquiera calcular la mano del rival. En un celular el reparto viaja en claro
 * —no hay a quién esconderle nada— y en la sala viaja **cerrado para cada jugador**
 * (ver `assets/js/sobre.js` y D-81). El motor no se entera de la diferencia: recibe las
 * manos que este aparato conoce y juega con eso.
 */

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const MANO = 5;            // cartas en la mano
export const RESERVA = 3;         // cartas tapadas para el cambio (ver "la reserva", D-82)
export const MIN_BAZAS = 2;       // menos que esto, y es julepe
export const ENTRADA = 2;         // tragos que pone cada uno cuando el plato está vacío
export const PREMIO = 2;          // tragos que reparte quien se salva, por cada baza
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const MANOS = 8;           // manos por partida, salvo que la config diga otra cosa

/* ------------------------------------------------------------------ */
/* Cartas                                                              */
/* ------------------------------------------------------------------ */

/**
 * Una carta es un texto: "A♠", "10♦". Va como texto por lo mismo que las posiciones del
 * Ahorcado (D-60): una lista es un tipo más que puede llegar distinto desde la red.
 */
export const palo = c => String(c).slice(-1);
export const rango = c => String(c).slice(0, -1);

/** Cuánto pesa una carta dentro de su palo: A > K > Q > J > 10 > … > 2. */
export const valor = c => RANKS.indexOf(rango(c));

export const esCarta = c => SUITS.includes(palo(c)) && RANKS.includes(rango(c));

/** "A♠,10♦" → ['A♠','10♦']. Devuelve null si viene cualquier cosa. */
export function leerCartas(raw) {
  if (Array.isArray(raw)) raw = raw.join(',');
  if (typeof raw !== 'string') return null;
  if (!raw.trim()) return [];                       // cambiar cero cartas es una jugada válida
  const out = raw.split(',').map(s => s.trim());
  return out.every(esCarta) && new Set(out).size === out.length ? out : null;
}

export const escribirCartas = cs => cs.join(',');

/**
 * Los puestos que alguien cambia: "0,3" son la primera y la cuarta carta de su mano.
 *
 * Van por puesto y no por nombre porque el mensaje lo lee toda la sala: decir "cambio el 10♠
 * y la J♠" es contarle a la mesa dos cartas que tenía, que es justo lo que en la mesa real
 * nadie ve. El puesto no dice nada, y alcanza para rehacer la jugada al retomar (C-6).
 */
export function leerPuestos(raw) {
  if (Array.isArray(raw)) raw = raw.join(',');
  if (typeof raw !== 'string') return null;
  if (!raw.trim()) return [];
  const ix = raw.split(',').map(Number);
  const ok = ix.length <= RESERVA && new Set(ix).size === ix.length
    && ix.every(n => Number.isInteger(n) && n >= 0 && n < MANO);
  return ok ? ix : null;
}

/** El mazo inglés completo, sin comodines: 52 cartas. */
export const mazo = () => SUITS.flatMap(s => RANKS.map(r => r + s));

/** Fisher-Yates con el azar que le pasen (el del navegador, o uno de prueba). */
export function barajar(cartas, rand = Math.random) {
  const d = [...cartas];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/**
 * Reparte una mano completa.
 *
 * A cada jugador le tocan **ocho** cartas: las cinco de la mano y tres tapadas de reserva.
 * Cambiar cartas saca de esa reserva propia y no del mazo de la mesa (D-82). Así el cambio
 * también es secreto: si el resto del mazo fuera público, los tres naipes que pide el rival
 * se sabrían de antemano, que es peor que ver su mano. Con seis jugadores se usan 49 de las
 * 52 cartas (6 × 8 + la que marca el triunfo), así que siempre alcanza.
 */
export function reparte(players, rand = Math.random) {
  const d = barajar(mazo(), rand);
  const manos = {};
  let i = 0;
  for (const p of players) { manos[p] = d.slice(i, i + MANO + RESERVA); i += MANO + RESERVA; }
  return { manos, triunfo: d[i] };
}

/** De las ocho cartas repartidas, las cinco que se juegan. */
export const enMano = cs => cs.slice(0, MANO);
/** …y las tres tapadas que esperan por si cambia. */
export const enReserva = cs => cs.slice(MANO);

/* ------------------------------------------------------------------ */
/* La baza                                                             */
/* ------------------------------------------------------------------ */

/**
 * Las cartas que ese jugador **puede** tirar. El motor no reta: devuelve la lista y la
 * pantalla apaga el resto, que es la forma de que nadie descubra una regla equivocándose.
 *
 * Las tres obligaciones, en orden:
 *  1. **asistir**: si tiene del palo de salida, juega de ese palo;
 *  2. **montar**: y si alguna de esas le gana a la más alta del palo de salida que hay en
 *     la mesa, tiene que jugar una que gane (cualquiera, no necesariamente la mayor);
 *  3. **fallar**: si no tiene del palo de salida pero tiene triunfos, juega un triunfo.
 * Si no puede cumplir ninguna, tira lo que quiera.
 */
export function legales(mano, baza = [], triunfo = null) {
  if (!baza.length) return [...mano];
  const salida = palo(baza[0].c);
  const delPalo = mano.filter(c => palo(c) === salida);
  if (delPalo.length) {
    const alta = Math.max(...baza.filter(j => palo(j.c) === salida).map(j => valor(j.c)));
    const montan = delPalo.filter(c => valor(c) > alta);
    return montan.length ? montan : delPalo;
  }
  const triunfos = mano.filter(c => palo(c) === triunfo);
  return triunfos.length ? triunfos : [...mano];
}

/** Quién se lleva la baza: el triunfo más alto, y si no hubo, la más alta del palo de salida. */
export function ganador(baza, triunfo) {
  const salida = palo(baza[0].c);
  const peso = j => (palo(j.c) === triunfo ? 100 : palo(j.c) === salida ? 50 : 0) + valor(j.c);
  return baza.reduce((a, b) => (peso(b) > peso(a) ? b : a)).p;
}

/* ------------------------------------------------------------------ */
/* El celular que juega                                                */
/* ------------------------------------------------------------------ */

/**
 * Cuántas bazas espera ganar con esa mano, de 0 a 5.
 *
 * No hay nada que calcular exacto acá: lo que decide una mano de Julepe es cuántos triunfos
 * hay y qué tan altos son, más los ases y reyes de los otros palos (que ganan hasta que
 * alguien falle). Se le pone número a eso y se suma.
 *
 *  - un triunfo vale desde 0,30 (el 2) hasta 0,90 (el as): aunque sea bajo, corta;
 *  - fuera del triunfo solo mandan el as (0,65) y el rey (0,45); de la jota para abajo
 *    no se gana una baza salvo milagro;
 *  - cuantos más rivales, más manos hay que ganarle a cada carta: se descuenta un 8% por
 *    cada rival de más.
 */
export function fuerza(mano, triunfo, rivales = 1) {
  const castigo = 1 - Math.min(0.4, 0.08 * Math.max(0, rivales - 1));
  return mano.reduce((acc, c) => {
    if (palo(c) === triunfo) return acc + 0.30 + 0.05 * valor(c);
    const r = rango(c);
    const p = r === 'A' ? 0.65 : r === 'K' ? 0.45 : r === 'Q' ? 0.22 : r === 'J' ? 0.10 : 0.03;
    return acc + p * castigo;
  }, 0);
}

/**
 * Lo atrevido que es el celular para entrar. En 1 juega como la mesa: entra con mano de dos
 * bazas y se pasa con menos. Subirlo lo hace entrar con cualquier cosa; bajarlo, mirar la
 * noche desde afuera.
 */
export const AUDACIA = 1;

/**
 * ¿Va o se pasa? (Estado 2)
 *
 * Mide la mano, le suma lo que espera mejorar con el cambio —hasta tres cartas malas se
 * van, y algo vuelve— y compara contra un umbral que se mueve con la mesa:
 *
 *  - **el plato pesa**: entrar cuando hay veinte tragos en el plato no es lo mismo que
 *    cuando hay ocho. El premio por ir bien es fijo (dos tragos por baza); el castigo por
 *    ir mal crece solo. Mientras más grande el plato, más mano hay que tener.
 *  - **la mesa pesa**: con más gente jugando, las mismas cinco cartas ganan menos bazas.
 *
 * Y queda un poco de ruido: dos bots con la misma mano no siempre hacen lo mismo, porque un
 * celular predecible en un juego de faroles es un jugador resuelto.
 */
export function botDeclara({ mano, triunfo, rivales = 1, plato = 0, audacia = AUDACIA, rand = Math.random }) {
  const malas = mano.filter(c => palo(c) !== triunfo && valor(c) < RANKS.indexOf('Q')).length;
  const esperadas = fuerza(mano, triunfo, rivales) + 0.12 * Math.min(RESERVA, malas);
  const umbral = 1.9 + 0.08 * Math.max(0, rivales - 1) + Math.min(0.6, plato / 30) - (audacia - 1) * 0.5;
  return esperadas + (rand() - 0.5) * 0.3 >= umbral;
}

/**
 * Qué cartas cambia (Estado 3). Guarda los triunfos y las cartas altas; suelta las bajas,
 * y antes las de los palos donde tiene poco, que son las que menos probable es que lleguen
 * a mandar.
 */
export function botCambia({ mano, triunfo, max = RESERVA }) {
  const largo = {};
  for (const c of mano) largo[palo(c)] = (largo[palo(c)] || 0) + 1;
  const guardar = c => {
    if (palo(c) === triunfo) return 100 + valor(c);
    const r = rango(c);
    return valor(c) + (r === 'A' ? 40 : r === 'K' ? 25 : 0) + largo[palo(c)];
  };
  return [...mano]
    .sort((a, b) => guardar(a) - guardar(b))
    .filter(c => guardar(c) < 30)      // un triunfo, un as o un rey no se sueltan nunca
    .slice(0, max);
}

/**
 * Qué carta tira (Estado 4). Respeta las obligaciones —le llegan ya filtradas en `legales`—
 * y dentro de lo que puede: si alcanza a ganar la baza, la gana con lo más barato que tenga;
 * si la baza ya está perdida, se saca de encima la peor carta.
 *
 * Abriendo es donde se juega la mano: con dos triunfos o más sale de triunfo para arrastrar
 * los del resto (cada triunfo que se lleva puesto es una baza que después nadie le corta);
 * si no, tira un as de otro palo, que gana mientras nadie falle; y si no tiene con qué, tira
 * lo más bajo y espera.
 */
export function botJuega({ mano, baza = [], triunfo, rand = Math.random }) {
  const puede = legales(mano, baza, triunfo);
  const barata = cs => [...cs].sort((a, b) =>
    (palo(a) === triunfo ? 100 : 0) + valor(a) - ((palo(b) === triunfo ? 100 : 0) + valor(b)))[0];

  if (!baza.length) {
    const triunfos = puede.filter(c => palo(c) === triunfo);
    if (triunfos.length >= 2) return triunfos.sort((a, b) => valor(b) - valor(a))[0];
    const ases = puede.filter(c => rango(c) === 'A' && palo(c) !== triunfo);
    if (ases.length) return ases[Math.floor(rand() * ases.length) % ases.length];
    if (triunfos.length === 1 && puede.length === 1) return triunfos[0];
    return barata(puede.filter(c => palo(c) !== triunfo).length
      ? puede.filter(c => palo(c) !== triunfo) : puede);
  }

  const gano = puede.filter(c => ganador([...baza, { p: '·', c }], triunfo) === '·');
  return gano.length ? barata(gano) : barata(puede);
}

/**
 * A quién le reparte los tragos que ganó. Todos a la misma persona y a la que va mejor: en
 * una mesa que bebe, repartir de a uno no se nota, y quien va seco es justo el que puede
 * seguir jugando. Empate, al azar, para que no sea siempre el mismo.
 */
export function botRegala({ yo, bazas, tragos = {}, players, rand = Math.random }) {
  const otros = players.filter(p => p !== yo);
  if (!otros.length) return [];
  const min = Math.min(...otros.map(p => tragos[p] || 0));
  const candidatos = otros.filter(p => (tragos[p] || 0) === min);
  const elegido = candidatos[Math.min(candidatos.length - 1, Math.floor(rand() * candidatos.length))];
  return Array(bazas).fill(elegido);
}

/* ------------------------------------------------------------------ */
/* Estado derivado                                                     */
/* ------------------------------------------------------------------ */

/**
 * ¿Jugó cada uno con las cartas que le tocaron? (C-10)
 *
 * Al cerrar la mano, cada celular destapa las ocho cartas que recibió. Con eso —y con los
 * puestos que cambió, que son públicos— se rehace su mano exacta y se compara contra lo que
 * tiró. Se revisa también que la misma carta no aparezca en dos manos.
 *
 * Es la vuelta que le da este juego al canon: acá el secreto no lo elige el jugador, se lo
 * reparten, así que lo que hay que probar no es "no lo cambiaste" sino "no jugaste una carta
 * que no tenías".
 */
export function verifica(h) {
  const reveladas = h.reveladas || {};
  const roles = Object.keys(reveladas);
  const jugadas = {};
  for (const b of h.bazas || []) for (const j of b.cartas) (jugadas[j.p] = jugadas[j.p] || []).push(j.c);

  const vistas = new Map();
  const culpables = new Set();
  for (const p of roles) {
    for (const c of reveladas[p]) {
      if (vistas.has(c) && vistas.get(c) !== p) { culpables.add(p); culpables.add(vistas.get(c)); }
      vistas.set(c, p);
    }
    if (h.muestra && reveladas[p].includes(h.muestra)) culpables.add(p);
    const ix = h.puestos?.[p] || [];
    const suya = [...enMano(reveladas[p]).filter((_, k) => !ix.includes(k)), ...enReserva(reveladas[p]).slice(0, ix.length)];
    if ((jugadas[p] || []).some(c => !suya.includes(c))) culpables.add(p);
  }
  const faltan = (h.va || []).filter(p => !roles.includes(p));
  return { ok: !culpables.size, culpables: [...culpables], faltan, hubo: roles.length > 0 };
}

/**
 * Arma el estado completo de la partida a partir de los mensajes.
 *
 *  players    roles en orden de mesa (A, B, …), que es el orden de juego hacia la derecha
 *  config     { manos }
 *  plays      mensajes en orden: reparte | va | paso | cambia | juega | regala
 *  yo         el rol de este aparato, si lo hay
 *  privadas   { [nº de mano]: 'A♠,3♥,…' } las ocho cartas propias de esa mano, para la sala,
 *             donde el reparto llega cerrado y solo este celular puede abrir el suyo
 *
 * Los mensajes que no corresponden —fuera de turno, una carta que no está en la mano, un
 * cambio de cuatro cartas— se descartan en silencio, como manda C-7.
 *
 * El motor **no necesita ver todas las manos**: valida lo que puede ver y acepta lo demás.
 * En un celular las ve todas; en la sala ve la suya, y de los rivales sabe lo que ya
 * jugaron. Las cuentas que importan —bazas, plato, tragos— son públicas igual.
 */
export function buildState({ players = [], config = {}, plays = [], yo = null, privadas = {} } = {}) {
  const totalManos = config.manos || MANOS;
  const st = {};
  players.forEach(p => { st[p] = { tragos: 0, julepes: 0, bazas: 0, fue: 0, repartidos: 0 }; });

  const idx = p => players.indexOf(p);
  const sigue = p => players[(idx(p) + 1) % players.length];
  /** La mesa en orden de juego empezando por `desde`. */
  const desde = p => players.map((_, k) => players[(idx(p) + k) % players.length]);

  let plato = 0;
  let dador = players[0] || null;
  let fin = false;
  const historia = [];

  /** Empieza una mano: se pone el plato si quedó vacío (Estado 1). */
  const nueva = () => {
    const entrada = plato === 0 ? ENTRADA : 0;
    if (entrada) plato = entrada * players.length;
    return {
      n: historia.length, dador, entrada, plato, triunfo: null, muestra: null,
      orden: desde(sigue(dador)),          // declara y sale el de la derecha del dador
      fase: 'reparte', turno: dador,
      cartas: {}, reserva: {}, cambios: {}, puestos: {}, decl: {}, va: [],
      baza: [], bazas: [], ganadas: {}, lider: null, jugadas: new Set(),
      resultado: null, deben: [], regalos: {},
    };
  };
  let mano = nueva();

  const guardarMano = (p, cs) => {
    if (!cs || cs.length !== MANO + RESERVA) return;
    mano.cartas[p] = enMano(cs);
    mano.reserva[p] = enReserva(cs);
  };

  /** Cierra la declaración: nadie, uno solo (y ahí hay obligado) o varios. */
  const cerrarDeclaracion = () => {
    mano.va = mano.orden.filter(p => mano.decl[p] === 'va');
    if (!mano.va.length) {                                   // todos se pasaron: mano nula
      mano.resultado = { vacia: true, plato: mano.plato, julepes: [], salvados: [] };
      cerrarMano();
      return;
    }
    if (mano.va.length === 1) {
      // Solo uno no es partida: **el dador se queda obligado** y juega quiera o no. Es la
      // regla de la mesa de toda la vida y la que le pone filo al juego: repartir también
      // arriesga. Si el solitario es el propio dador, se queda el de su derecha (D-83).
      const solo = mano.va[0];
      const obligado = dador !== solo ? dador : mano.orden.find(p => p !== solo);
      if (obligado) { mano.decl[obligado] = 'obligado'; mano.va = mano.orden.filter(p => mano.decl[p]); }
    }
    mano.va = mano.orden.filter(p => mano.decl[p] === 'va' || mano.decl[p] === 'obligado');
    mano.fase = 'cambia';
    mano.turno = mano.va[0];
  };

  const sigueVa = p => mano.va[(mano.va.indexOf(p) + 1) % mano.va.length];

  /** Se jugaron las cinco bazas: quién se salva y quién se toma el plato (Estado 4 → 5). */
  const auditar = () => {
    const julepes = [], salvados = [];
    for (const p of mano.va) {
      const b = mano.ganadas[p] || 0;
      st[p].fue++;
      st[p].bazas += b;
      (b >= MIN_BAZAS ? salvados : julepes).push(p);
    }
    julepes.forEach(p => { st[p].tragos += mano.plato; st[p].julepes++; });
    mano.resultado = { vacia: false, plato: mano.plato, julepes, salvados, ganadas: { ...mano.ganadas } };
    mano.deben = salvados.filter(p => (mano.ganadas[p] || 0) > 0);
    mano.fase = mano.deben.length ? 'regala' : 'cierre';
    mano.turno = mano.deben[0] || null;
    if (!mano.deben.length) cerrarMano();
  };

  const cerrarMano = () => {
    const r = mano.resultado;
    historia.push({
      n: mano.n, dador: mano.dador, triunfo: mano.triunfo, muestra: mano.muestra,
      entrada: mano.entrada, decl: { ...mano.decl }, va: [...mano.va], puestos: { ...mano.puestos },
      bazas: mano.bazas, ganadas: { ...mano.ganadas }, regalos: { ...mano.regalos }, ...r,
    });
    // El plato de la próxima mano: lo que se bebieron los julepes vuelve a juntarse (uno por
    // cada uno, así que con dos se dobla); si nadie cayó, queda vacío y se vuelve a poner.
    plato = r.vacia ? mano.plato : r.plato * r.julepes.length;
    dador = sigue(mano.dador);
    if (historia.length >= totalManos) { fin = true; mano.fase = 'cierre'; mano.turno = null; return; }
    mano = nueva();
  };

  const revelado = {};   // { nº de mano: { rol: ['A♠', …] } }

  for (const play of plays) {
    if (fin) break;
    if (!play || !players.includes(play.from)) continue;

    // El destape llega cuando la mano ya terminó y no empuja nada: se guarda y se verifica al
    // final. No es una fase, así que no puede dejar a la mesa esperando a un celular que se fue.
    if (play.t === 'revela') {
      const cs = leerCartas(play.cs);
      const n = Number(play.n);
      if (cs && cs.length === MANO + RESERVA && Number.isInteger(n)) {
        (revelado[n] = revelado[n] || {})[play.from] = cs;
      }
      continue;
    }

    if (mano.fase === 'reparte') {
      if (play.t !== 'reparte' || play.from !== mano.dador || !esCarta(play.triunfo)) continue;
      mano.muestra = play.triunfo;
      mano.triunfo = palo(play.triunfo);
      for (const p of players) guardarMano(p, leerCartas(play.m?.[p]));   // un celular: en claro
      if (yo) guardarMano(yo, leerCartas(privadas[mano.n]));              // la sala: solo la mía
      mano.fase = 'declara';
      mano.turno = mano.orden[0];
      continue;
    }

    if (mano.fase === 'declara') {
      if (play.from !== mano.turno || (play.t !== 'va' && play.t !== 'paso')) continue;
      mano.decl[play.from] = play.t;
      const i = mano.orden.indexOf(play.from);
      if (i < mano.orden.length - 1) mano.turno = mano.orden[i + 1];
      else cerrarDeclaracion();
      continue;
    }

    if (mano.fase === 'cambia') {
      if (play.from !== mano.turno || play.t !== 'cambia') continue;
      const ix = leerPuestos(play.i);
      if (!ix) continue;
      const mias = mano.cartas[play.from];
      if (mias) {
        mano.cartas[play.from] = [...mias.filter((_, k) => !ix.includes(k)), ...mano.reserva[play.from].slice(0, ix.length)];
        mano.reserva[play.from] = mano.reserva[play.from].slice(ix.length);
      }
      mano.cambios[play.from] = ix.length;
      mano.puestos[play.from] = ix;
      const i = mano.va.indexOf(play.from);
      if (i < mano.va.length - 1) { mano.turno = mano.va[i + 1]; continue; }
      mano.fase = 'baza';
      mano.lider = mano.va[0];
      mano.turno = mano.va[0];
      continue;
    }

    if (mano.fase === 'baza') {
      if (play.from !== mano.turno || play.t !== 'juega' || !esCarta(play.c)) continue;
      const mias = mano.cartas[play.from];
      if (mias) {
        if (!legales(mias, mano.baza, mano.triunfo).includes(play.c)) continue;
        mano.cartas[play.from] = mias.filter(c => c !== play.c);
      } else if (mano.jugadas.has(play.c)) continue;   // sin ver la mano, al menos que no repita
      mano.jugadas.add(play.c);
      mano.baza.push({ p: play.from, c: play.c });
      if (mano.baza.length < mano.va.length) { mano.turno = sigueVa(play.from); continue; }
      const g = ganador(mano.baza, mano.triunfo);
      mano.ganadas[g] = (mano.ganadas[g] || 0) + 1;
      mano.bazas.push({ cartas: mano.baza, gana: g });
      mano.baza = [];
      mano.lider = g;
      mano.turno = g;
      if (mano.bazas.length >= MANO) auditar();
      continue;
    }

    if (mano.fase === 'regala') {
      if (play.from !== mano.turno || play.t !== 'regala') continue;
      const cuantas = mano.ganadas[play.from] || 0;
      const a = String(play.a || '').split(',').filter(Boolean);
      if (a.length !== cuantas || !a.every(p => players.includes(p) && p !== play.from)) continue;
      a.forEach(p => { st[p].tragos += PREMIO; });
      st[play.from].repartidos += cuantas * PREMIO;
      mano.regalos[play.from] = a;
      const i = mano.deben.indexOf(play.from);
      if (i < mano.deben.length - 1) { mano.turno = mano.deben[i + 1]; continue; }
      cerrarMano();
    }
  }

  for (const h of historia) {
    h.reveladas = revelado[h.n] || {};
    h.verificacion = verifica(h);
  }

  const done = fin;
  const menos = players.length ? Math.min(...players.map(p => st[p].tragos)) : 0;
  return {
    phase: done ? 'done' : mano.fase,
    players, st, done,
    plato: mano.plato, proximoPlato: plato, entrada: mano.entrada,
    manoN: mano.n, totalManos, dador: mano.dador, triunfo: mano.triunfo, muestra: mano.muestra,
    orden: mano.orden, decl: mano.decl, va: mano.va, turno: done ? null : mano.turno,
    cartas: mano.cartas, reserva: mano.reserva, cambios: mano.cambios,
    baza: mano.baza, bazas: mano.bazas, ganadas: mano.ganadas, lider: mano.lider,
    deben: mano.deben, regalos: mano.regalos, resultado: mano.resultado,
    ultima: historia[historia.length - 1] || null, historia,
    // Gana quien terminó más seco. Puede haber empate: son todos los que quedaron abajo.
    ganadores: done ? players.filter(p => st[p].tragos === menos) : [],
  };
}

/** Las cartas que este jugador puede tirar ahora mismo, para que la pantalla apague el resto. */
export function puedeJugar(state, p) {
  if (state.phase !== 'baza' || state.turno !== p || !state.cartas[p]) return [];
  return legales(state.cartas[p], state.baza, state.triunfo);
}
