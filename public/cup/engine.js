/**
 * La Copa — motor del torneo (sin DOM). Testeable con node.
 *
 * Un torneo de 3 o 7 días entre amigos: cada día un juego idéntico para todos, que se
 * juega una vez y reparte puntos por posición (ver docs/games/cup.md).
 *
 * Todo lo de acá son funciones puras sobre los datos de la copa tal como vienen del
 * almacén (`meta`, `players`, `started`, `results`, `wild`) y una hora `now`. El almacén no
 * sabe de reglas; la pantalla no sabe sumar.
 */

// Small pieces other games use too, in modules of their own so a page that needs only them does not
// load La Copa (D-377): the cup code and a random one, and the active-time clock
import { cryptoRand } from './code.js';
export { LETRAS, CODIGO, esCodigo, codigoAlAzar } from './code.js';
export { reloj, pausaDeLectura, mmss } from './clock.js';

/**
 * El calendario de siempre de cada modalidad. El último siempre es la final, que vale doble.
 * Desde D-163 el admin arma el suyo al crear la copa (ver POZO); este queda para las demos.
 */
export const CALENDARIOS = {
  3: ['linea', 'agentes', 'final'],
  7: ['linea', 'numero', 'agentes', 'reinas', 'letras', 'anio', 'final'],
};
export const MODALIDADES = Object.keys(CALENDARIOS).map(Number);

/**
 * Los juegos que el admin puede poner en los días antes de la final (D-163). Agentes took Conexiones'
 * place in D-421: the cups created before still play Conexiones, which stays registered in JUEGOS.
 */
export const POZO = ['linea', 'numero', 'agentes', 'reinas', 'letras', 'anio', 'zip', 'tango', 'donde', 'desenredo', 'rutas', 'loteo', 'pintaminas'];

/**
 * The variants a game can be played in (D-331), the first one being the default. In a cup the admin
 * picks one per day and everyone plays it; standalone, the player picks it in the waiting room. A day
 * is written `id` (the default) or `id:variant` in `meta.cal`, so the cups from before read the same.
 */
export const VARIANTES = { pintaminas: ['easy', 'hard'], loteo: ['numbers', 'utilities'] };
/** A calendar entry split into its game and its variant: `'loteo:utilities'` → `{ id: 'loteo', variante: 'utilities' }`. */
export function diaDeCal(x) {
  if (String(x || '').includes(TRIO_SEP)) return { id: TRIO, variante: null };
  const [id, v] = String(x || '').split(':');
  const vs = VARIANTES[id];
  return { id, variante: vs ? (vs.includes(v) ? v : vs[0]) : null };
}
/** The calendar entry for a game and a variant: the default one is written without it. */
export const entradaCal = (id, variante = null) => (VARIANTES[id] && variante && variante !== VARIANTES[id][0] ? `${id}:${variante}` : id);

/**
 * The 3-day cup is played without the Grand Final since D-438 (the owner's request): three games of
 * the pool. The 3-day cups from before, made for testing (D-100), end with the final and keep it.
 */
export const SIN_FINAL = [3];
/** Whether a cup ends with the Grand Final: its calendar says so (no calendar, as the 7-day cup always does). */
export const tieneFinal = meta => (String(meta?.cal || 'final').split(',').at(-1) === 'final');

/**
 * The weekend cup (D-439, the owner's request): three days of three games each, the three played one
 * after the other as a single day, like the Grand Final's rounds but each game whole. A day is written
 * `linea+tango+donde` in `meta.cal` and its game is `trio`; it is offered until `FINDE_HASTA`.
 */
export const TRIO = 'trio';
export const TRIO_SEP = '+';
export const TRIO_JUEGOS = 3;
/**
 * After it no one can create a weekend cup (cups already made play on). It was the end of Sunday
 * 2026-10-25, Pacific time; the owner closed it once their cup was created, Friday 2026-10-23 at
 * night (a one-off cup for friends): 22:00 Pacific. The test store still offers it with `&weekend=on`.
 */
export const FINDE_HASTA = Date.parse('2026-10-24T05:00:00Z');
export const findeAbierto = now => now < FINDE_HASTA;
/** The games of a day of three, as calendar entries (`['linea', 'loteo:utilities', 'donde']`), or null. */
export const rondasDelDia = (meta, d) => {
  const x = String(meta?.cal || '').split(',')[d - 1] || '';
  return x.includes(TRIO_SEP) ? x.split(TRIO_SEP) : null;
};
/** A random weekend: nine different games of the pool, three a day, balanced like a week (D-425). */
export function findeAlAzar({ rand = cryptoRand, familia = null } = {}) {
  const w = semanaAlAzar(3 * TRIO_JUEGOS, { rand, familia, final: false });
  return [0, 1, 2].map(i => w.slice(i * TRIO_JUEGOS, (i + 1) * TRIO_JUEGOS).join(TRIO_SEP));
}

/** ¿Es un calendario que se puede jugar? Juegos del pozo sin repetir, y la final al último (o, en la de 3 días, sin final, D-438, o de a tres por día, D-439). */
export function calendarioValido(cal, dias) {
  if (!Array.isArray(cal) || cal.length !== dias) return false;
  const conFinal = cal[dias - 1] === 'final';
  if (!conFinal && !SIN_FINAL.includes(dias)) return false;
  const tres = cal.filter(x => String(x).includes(TRIO_SEP));
  if (tres.length && (conFinal || tres.length !== dias || tres.some(x => String(x).split(TRIO_SEP).length !== TRIO_JUEGOS))) return false;
  const dia = (conFinal ? cal.slice(0, -1) : cal).flatMap(x => String(x).split(TRIO_SEP));
  const ids = dia.map(x => String(x).split(':')[0]);
  const variantesOk = dia.every(x => { const [id, v] = String(x).split(':'); return v === undefined || (VARIANTES[id] || []).includes(v); });
  return variantesOk && ids.every(id => POZO.includes(id)) && new Set(ids).size === ids.length;
}

/**
 * Una propuesta al azar para quien no quiere pensarlo (D-163): juegos distintos del pozo y la
 * final. Si se le pasa `familia` (la habilidad de cada juego), evita dos días seguidos de la
 * misma, para que la semana no sea tres de lógica al hilo.
 */
export function calendarioAlAzar(dias, { rand = cryptoRand, familia = null } = {}) {
  const barajar = xs => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let cal = null;
  for (let k = 0; k < 50; k++) {
    cal = barajar(POZO).slice(0, dias - 1);
    if (!familia || cal.every((id, i) => i === 0 || familia(id) !== familia(cal[i - 1]))) break;
  }
  return [...cal, 'final'];
}

/**
 * The week styles of the 🎲 (D-425): each one is a rule for the die, not a fixed list. Puzzles and
 * Knowledge name the games they draw from; Balanced and New draw from the whole pool, at most two games of one skill.
 */
export const ESTILOS_SEMANA = {
  equilibrada: null,
  puzzles: ['reinas', 'zip', 'tango', 'loteo', 'desenredo', 'rutas', 'pintaminas'],
  saber: ['linea', 'anio', 'donde', 'agentes', 'numero', 'letras'],
  nuevo: null,
};

/**
 * A random week for the new create screen (D-425). `familia` is each game's skill: never two days
 * in a row of the same one, and in Balanced and New at most two of one skill. `nuevos` are the
 * games with the home page's New label, all of which New puts in. Without a week that meets every
 * rule, the last one drawn.
 */
export function semanaAlAzar(dias, { rand = cryptoRand, familia = null, estilo = 'equilibrada', nuevos = [], final = true } = {}) {
  const barajar = xs => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const tope = estilo === 'equilibrada' || estilo === 'nuevo';
  const fam = id => (familia ? familia(id) : id);
  const seguidas = w => w.every((id, i) => i === 0 || fam(id) !== fam(w[i - 1]));
  const hastaDos = w => { const c = {}; return w.every(id => (c[fam(id)] = (c[fam(id)] || 0) + 1) <= 2); };
  let semana = null;
  for (let k = 0; k < 400; k++) {
    const propios = ESTILOS_SEMANA[estilo] || POZO;
    let orden = [...barajar(propios), ...barajar(POZO.filter(id => !propios.includes(id)))];
    if (estilo === 'nuevo') { const ns = barajar(nuevos.filter(id => POZO.includes(id))); orden = [...ns, ...orden.filter(id => !ns.includes(id))]; }
    // Which games go in is decided first, then their order
    semana = barajar(orden.slice(0, final ? dias - 1 : dias));
    if (seguidas(semana) && (!tope || hastaDos(semana))) break;
  }
  return final ? [...semana, 'final'] : semana;
}

/** Puntos del día según la posición. Del décimo para abajo, uno por haber jugado. */
export const PUNTOS = [10, 8, 6, 5, 4, 3, 2, 1, 1, 1];
/** Una copa se juega entre 2 y 10 (D-118): con el admin solo, no parte ni avanza de día. */
export const MIN_JUGADORES = 2;
export const MAX_JUGADORES = 10;
export const NOMBRE_MAX = 20;
/** El nombre de una copa (D-119): antes se recortaba al largo de un nombre de jugador (20). */
export const COPA_MAX = 40;
export const DIA_MS = 24 * 60 * 60 * 1000;
// La hora de las copas nuevas (D-113): la del Pacífico, donde está el dueño. Cada copa guarda la
// suya en `meta.tz`, así que las ya creadas siguen con la hora de Chile.
export const ZONA = 'America/Los_Angeles';
/**
 * Una copa en alemán cambia de día a medianoche de Europa central (D-194): con la del Pacífico,
 * el día nuevo partía a las 9:00 en Berlín. Berlín vale también para Viena y Zúrich.
 */
export const ZONAS_POR_IDIOMA = { de: 'Europe/Berlin' };
export const zonaDeIdioma = lang => ZONAS_POR_IDIOMA[lang] || ZONA;

/** Identificador de jugador dentro de la copa: 6 letras minúsculas o cifras. */
export const PID = /^[a-z0-9]{6}$/;

export function pidAlAzar(rand = cryptoRand) {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += abc[Math.floor(rand() * abc.length)];
  return out;
}

/* ------------------------------------------------------------------ */
/* Nombres y PIN                                                       */
/* ------------------------------------------------------------------ */

/** El nombre tal como se guarda: sin espacios de más y con tope de largo. */
export const limpiarNombre = (s, max = NOMBRE_MAX) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * El link propio de una copa (D-121): `juegosdesalon.cl/cup/?pirata`. Minúsculas, números y
 * guiones, de 3 a 20; "Pirata", " pirata " y "PIRATA" son el mismo. No puede tener la forma de
 * un código (5 letras sin I ni O), para que un link nunca se confunda con otro.
 */
export const ALIAS = /^[a-z0-9](?:[a-z0-9-]{1,18})[a-z0-9]$/;
export const aliasLimpio = s => String(s || '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20).replace(/-+$/, '');
export const esAlias = a => typeof a === 'string' && ALIAS.test(a) && !/^[a-hj-np-z]{5}$/.test(a);
/** El alias queda tomado hasta 7 días después de que la copa termina; después se puede reusar. */
export const ALIAS_LIBRE_MS = 7 * 24 * 60 * 60 * 1000;
export const aliasHasta = meta => meta.end + ALIAS_LIBRE_MS;

/** Para comparar nombres: "Cata", "cata " y "CATA" son el mismo jugador. */
export const claveNombre = (s, max = NOMBRE_MAX) => limpiarNombre(s, max).toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');

export const esPin = p => typeof p === 'string' && /^\d{4}$/.test(p);

/** El PIN nunca se guarda: se guarda este hash, atado a la copa y al jugador. */
export async function hashPin(codigo, pid, pin) {
  const data = new TextEncoder().encode(`copa:${codigo}:${pid}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------------ */
/* Fechas y zona horaria                                               */
/* ------------------------------------------------------------------ */

/** Cuántos milisegundos adelanta la zona `tz` a UTC en el instante `ms`. */
export function desfase(ms, tz = ZONA) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  const comoUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return comoUtc - Math.floor(ms / 1000) * 1000;
}

/** La fecha 'AAAA-MM-DD' que se vive en `tz` en el instante `ms`. */
export function fechaEn(ms, tz = ZONA) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  return f.format(new Date(ms));
}

/** Suma días a una fecha 'AAAA-MM-DD' (sin horas: no le afecta el cambio de horario). */
export function sumarDias(fecha, n) {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * El primer instante de la fecha `fecha` en `tz`. Se prueba con el desfase de medio día antes
 * y medio día después y se queda con el más temprano que cae en esa fecha: alrededor de un
 * cambio de horario uno de los dos cae del otro lado, y en Chile el día en que se adelanta la
 * hora no tiene 00:00 (el reloj salta a la 01:00, que pasa a ser su primer instante).
 */
export function medianoche(fecha, tz = ZONA) {
  const [y, m, d] = fecha.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const candidatos = [desfase(utc - 14 * 3600000, tz), desfase(utc + 14 * 3600000, tz)].map(off => utc - off);
  const validos = candidatos.filter(ms => fechaEn(ms, tz) === fecha);
  return validos.length ? Math.min(...validos) : Math.max(...candidatos);
}

/**
 * Las ventanas de cada día. El día `d` se abre a la medianoche de su fecha y se cierra a la
 * medianoche de dos días después (su día de gracia). La final no tiene gracia, y nada cierra
 * después de la final: la copa termina entera a la medianoche que sigue al último día.
 */
export function ventanas(inicio, dias, tz = ZONA) {
  const fin = medianoche(sumarDias(inicio, dias), tz);
  const out = {};
  for (let d = 1; d <= dias; d++) {
    const a = medianoche(sumarDias(inicio, d - 1), tz);
    const b = d === dias ? fin : Math.min(fin, medianoche(sumarDias(inicio, d + 1), tz));
    out[d] = { a, b, h: medianoche(sumarDias(inicio, d), tz) };
  }
  return out;
}

/**
 * Lo que se guarda al crear una copa. `win` lleva las ventanas ya calculadas porque las
 * reglas de la base no saben de zonas horarias: comparan `now` contra estos números.
 */
export function nuevaMeta({ nombre, dias, inicio, tz = ZONA, admin, creada, lab = false, alias = null, cal = null, lang = 'es', aud = null }) {
  if (!CALENDARIOS[dias]) throw new Error('modalidad');
  if (cal && !calendarioValido(cal, dias)) throw new Error('calendario');
  return {
    v: 1, name: limpiarNombre(nombre, COPA_MAX), days: dias, start: inicio, tz, admin,
    cal: (cal || CALENDARIOS[dias]).join(','), win: ventanas(inicio, dias, tz), createdAt: creada,
    end: medianoche(sumarDias(inicio, dias), tz),
    // Las reglas de la base no suman ni convierten números a texto: lo que necesitan comparar
    // va ya calculado. `joinUntil` = cuándo empieza la final (sin final, el último día); `final` = el día
    // de la final, como texto, o '0' en una copa sin final (D-438), donde el comodín vale cualquier día
    joinUntil: medianoche(sumarDias(inicio, dias - 1), tz), final: !cal || cal.at(-1) === 'final' ? String(dias) : '0',
    // Una copa del laboratorio (D-115): su admin puede pasarla al día siguiente para probar
    ...(lab ? { lab: true } : {}),
    ...(alias ? { alias } : {}),
    // El idioma de las palabras (D-170). El español no se escribe: así eran las copas de antes
    ...(lang && lang !== 'es' ? { lang } : {}),
    // El público (D-187): global, cl o br. Sin él, como las copas de antes de D-186
    ...(['global', 'cl', 'br'].includes(aud) ? { aud } : {}),
  };
}

/** Los juegos que salieron (D-102) se juegan como sus reemplazos, para no romper copas viejas. */
const REEMPLAZOS = { solitario: 'reinas', dudo: 'letras' };
// The game of each day, without its variant (D-331): everything that names a day's game reads this
export const calendario = meta => String(meta.cal || '').split(',').map(x => { if (x.includes(TRIO_SEP)) return TRIO; const id = x.split(':')[0]; return REEMPLAZOS[id] || id; });
export const juegoDelDia = (meta, d) => calendario(meta)[d - 1] || null;
/** The variant a day is played in (D-331), or `null` if its game has none. */
export const varianteDelDia = (meta, d) => { const x = String(meta.cal || '').split(',')[d - 1]; return x ? diaDeCal(x).variante : null; };
export const esFinal = (meta, d) => d === meta.days && tieneFinal(meta);

/**
 * Finals that open from this moment on repeat the week's games (D-418); one that opened before keeps
 * the five fixed rounds it was started with, so nobody's final changes halfway (D-163).
 */
export const FINAL_FROM_WEEK = Date.parse('2026-10-22T19:00:00Z');
/** The five fixed rounds of the finals from before D-418, and of the final played outside a cup. */
export const FIXED_FINAL = ['linea', 'numero', 'reinas', 'letras', 'anio'];
/**
 * The rounds of a cup's final (D-418): the week's games in the order they were played, each with its
 * variant (`'loteo:utilities'`), as written in `meta.cal`. Without a cup, or for a final that opened
 * before `FINAL_FROM_WEEK`, the five fixed ones.
 */
export function finalRounds(meta) {
  const cal = String(meta?.cal || '').split(',').filter(Boolean);
  const week = cal.slice(0, -1).map(x => { const { id, variante } = diaDeCal(x); return entradaCal(REEMPLAZOS[id] || id, variante); });
  const opens = meta?.win?.[meta?.days]?.a;
  if (!week.length || (typeof opens === 'number' && opens < FINAL_FROM_WEEK)) return [...FIXED_FINAL];
  return week;
}

/** El número de día que se vive en `now`: 0 antes de empezar, `days + 1` después de terminar. */
export function diaActual(meta, now) {
  if (now < meta.win[1].a) return 0;
  if (now >= meta.end) return meta.days + 1;
  for (let d = meta.days; d >= 1; d--) if (now >= meta.win[d].a) return d;
  return 0;
}

export const abierto = (meta, d, now) => !!meta.win[d] && now >= meta.win[d].a && now < meta.win[d].b;
export const cerrado = (meta, d, now) => !!meta.win[d] && now >= meta.win[d].b;
export const terminada = (meta, now) => now >= meta.end;

/** ¿Todavía se puede entrar? Hasta que empieza la final (D-94). */
/** Se puede inscribir alguien nuevo: antes de la final y si el admin no cerró la inscripción (D-110). */
export const inscripcionAbierta = (meta, now, cerrada = false) => !cerrada && now < (meta.joinUntil ?? meta.win[meta.days].a);

/**
 * Mover el inicio de una copa que nadie ha empezado a jugar (D-110): la misma copa, con las
 * fechas recalculadas desde `inicio` ("AAAA-MM-DD"). Nombre, días, calendario y admin no cambian.
 */
export function moverInicio(meta, inicio) {
  const tz = meta.tz || ZONA;
  return {
    ...meta, start: inicio, win: ventanas(inicio, meta.days, tz),
    end: medianoche(sumarDias(inicio, meta.days), tz), joinUntil: medianoche(sumarDias(inicio, meta.days - 1), tz),
  };
}

/** Hasta cuántos días desde hoy se puede fijar el inicio de una copa (D-115). */
export const MAX_DIAS_INICIO = 30;

/**
 * Solo en las copas del laboratorio (D-115): pasar al día siguiente es correr el inicio un día
 * hacia atrás. Lo de hoy queda como ayer, en su día de gracia, y se abre el día siguiente.
 */
export const pasarDia = meta => moverInicio(meta, sumarDias(meta.start, -1));

/**
 * Terminar la copa antes de tiempo (D-161): el admin la cierra, por ejemplo cuando el último no
 * va a jugar la final. Se guarda solo la hora del cierre (`fin`, la del servidor) y de ahí sale la
 * copa como quedó: termina en `fin`, ningún día sigue abierto después, y los días que todavía no
 * se habían abierto quedan anulados (no suman ni aparecen en la tabla).
 */
export function cerrarEn(meta, fin) {
  if (!fin || fin >= meta.end) return meta;
  const win = {};
  for (const [d, w] of Object.entries(meta.win)) if (w) win[d] = { a: w.a, b: Math.min(w.b, fin), h: Math.min(w.h, fin) };
  return { ...meta, win, end: fin, joinUntil: Math.min(meta.joinUntil ?? fin, fin), fin };
}

/** La copa tal como se ve, con el cierre del admin aplicado si lo hubo (`L.fin`). */
export const conCierre = L => (L?.meta && L.fin ? { ...L, meta: cerrarEn(L.meta, L.fin) } : L);

/** El admin la cerró antes de tiempo. */
export const cerradaAntes = meta => !!meta?.fin;

/** Un día que no alcanzó a abrirse porque el admin cerró la copa antes. */
export const anulado = (meta, d) => !!meta.fin && !!meta.win[d] && meta.win[d].a >= meta.fin;

/** Un día que ya se abrió en `now` (y que no quedó anulado): el que entra en la tabla. */
const seAbrio = (meta, d, now) => now >= meta.win[d].a && !anulado(meta, d);

/** Se puede terminar la copa: ya partió y todavía no termina. */
export const puedeCerrar = (meta, now) => !meta.fin && now >= meta.win[1].a && now < meta.end;

/** Nadie ha empezado ningún día: el inicio todavía se puede mover. */
export const sinEmpezar = L => !Object.values(L?.started || {}).some(d => d && Object.keys(d).length);

/* ------------------------------------------------------------------ */
/* Estado de cada día para un jugador                                  */
/* ------------------------------------------------------------------ */

/**
 * 'futuro' · 'hoy' · 'gracia' (el de ayer, último día para jugarlo) · 'en-curso' (tocó
 * Empezar y no terminó) · 'jugado' · 'perdido' (cerró sin resultado) · 'anulado' (no alcanzó a
 * abrirse: el admin cerró la copa antes, D-161).
 */
export function estadoDia(L, d, pid, now) {
  const { meta } = L;
  if (L.results?.[d]?.[pid]) return 'jugado';
  if (anulado(meta, d)) return 'anulado';
  if (now < meta.win[d].a) return 'futuro';
  if (now >= meta.win[d].b) return 'perdido';
  if (L.started?.[d]?.[pid]) return 'en-curso';
  return now >= meta.win[d].h ? 'gracia' : 'hoy';
}

/** El comodín de ese jugador: el número de día, o 0 si no lo usó. */
export const comodinDe = (L, pid) => Number(L.wild?.[pid]) || 0;

/** ¿Puede activar el comodín en el día `d`? Solo antes de Empezar, nunca en la final, una vez. */
export function puedeComodin(L, d, pid, now) {
  const { meta } = L;
  if (comodinDe(L, pid) || esFinal(meta, d) || !abierto(meta, d, now)) return false;
  return !L.started?.[d]?.[pid] && !L.results?.[d]?.[pid];
}

/**
 * The wildcard that was never used is not lost (D-444): once the player can no longer use it on any
 * day before the final (each one played, started or closed), it lands on the last day before the
 * final that they played. Returns that day, or 0 while they can still choose, if they used it, if
 * they played no day, in a cup without a final or in one ended before its final. Nothing is written: it is read from the store.
 */
/**
 * The cups the unused wildcard reaches (D-444): every cup still running when it was published,
 * retroactively, and every one after. A cup that had already ended keeps its table and its saved
 * podium as they were.
 */
export const AUTO_WILD_FROM = Date.parse('2026-10-25T17:00:00Z');

export function comodinAuto(L, pid, now) {
  const { meta } = L;
  if (!(meta.end > AUTO_WILD_FROM)) return 0;
  // Only a cup that reaches its final: one the admin ended before it (D-161) keeps its unused wildcards unused
  if (now == null || comodinDe(L, pid) || !tieneFinal(meta) || anulado(meta, meta.days)) return 0;
  let ultimo = 0;
  for (let d = 1; d < meta.days; d++) {
    if (anulado(meta, d)) continue;
    if (L.results?.[d]?.[pid]) ultimo = d;
    else if (!L.started?.[d]?.[pid] && now < meta.win[d].b) return 0;
  }
  return ultimo;
}

/** The day the wildcard doubles, chosen or automatic, and whether it was automatic. */
export function comodinEfectivo(L, pid, now) {
  const w = comodinDe(L, pid);
  if (w) return { dia: w, auto: false };
  const a = comodinAuto(L, pid, now);
  return { dia: a, auto: !!a };
}

/**
 * Cuánto multiplica un día: la final ×2, el comodín ×2. No se acumulan (el comodín no vale en la final).
 * With `now`, an unused wildcard counts where it lands on its own (`comodinAuto`).
 */
export const multiplicador = (L, d, pid, now) => (esFinal(L.meta, d) || comodinEfectivo(L, pid, now).dia === d ? 2 : 1);

/* ------------------------------------------------------------------ */
/* Puntos y tabla                                                      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Out of the cup: two days in a row without playing (D-347)           */
/* ------------------------------------------------------------------ */

/** How many days in a row, each closed with its grace day, leave a player out of the cup. */
export const AUSENCIAS = 2;

/**
 * Does day `d` count against `pid` when missed? Only if it closed after the player signed up and
 * after the admin brought them back (`back`, D-347): a late signup or a reinstated player starts
 * clean. The days the admin's early close left unopened never count.
 */
const cuentaFalta = (L, d, p) => !anulado(L.meta, d) && L.meta.win[d].b > Math.max(Number(p.at) || 0, Number(p.back) || 0);

/** Missed: the day counts against them, closed (grace included) and they have no result in it. */
const falto = (L, d, pid, p, now) => cuentaFalta(L, d, p) && now >= L.meta.win[d].b && !L.results?.[d]?.[pid];

/**
 * Is `pid` out of the cup in `now`? Returns the days that left them out ({ desde, hasta }) or null.
 * Only pairs that close before the cup ends: the last two days close with it, and by then there is
 * nothing left to leave. The admin's own removal (`out`) is something else and is not this.
 */
export function fuera(L, pid, now) {
  const p = L.players?.[pid];
  if (!p || p.out) return null;
  const { meta } = L;
  for (let d = 1; d + AUSENCIAS - 1 < meta.days; d++) {
    const ultimo = d + AUSENCIAS - 1;
    if (meta.win[ultimo].b >= meta.end) break;
    let todos = true;
    for (let k = d; k <= ultimo; k++) if (!falto(L, k, pid, p, now)) { todos = false; break; }
    if (todos) return { desde: d, hasta: ultimo };
  }
  return null;
}

/**
 * The warning (D-347): `pid` already missed the day before and, if they don't play `d` before it
 * closes, they are out. Returns that day `d`, or 0. Never for the final days, which close with the cup.
 */
export function enRiesgo(L, pid, now) {
  const p = L.players?.[pid];
  if (!p || p.out || fuera(L, pid, now)) return 0;
  const { meta } = L;
  for (let d = AUSENCIAS; d < meta.days; d++) {
    if (meta.win[d].b >= meta.end || !abierto(meta, d, now) || L.results?.[d]?.[pid] || !cuentaFalta(L, d, p)) continue;
    let antes = true;
    for (let k = d - AUSENCIAS + 1; k < d; k++) if (!falto(L, k, pid, p, now)) { antes = false; break; }
    if (antes) return d;
  }
  return 0;
}

/**
 * Where a cup stands for `pid`, in one line for the "Tus copas" list on the cup's home page:
 * `{ tipo: 'empieza', en }` before day 1 opens (`en`: ms until it does) · `{ tipo: 'jugar', dias, enCurso, hoy }`
 * with the days they can still play (`hoy`: one of them closes today) · `{ tipo: 'al-dia', dia, en }`
 * with nothing to play, and the next day and ms until it opens (`dia` 0 when none is left) ·
 * `{ tipo: 'fuera' }` out of the cup (D-347) or taken out by the admin · null if over or `pid` is not in it.
 */
export function estadoEnLista(L, pid, now) {
  if (!L?.meta || !L.players?.[pid]) return null;
  L = conCierre(L);
  const { meta } = L;
  if (terminada(meta, now)) return null;
  if (L.players[pid].out || fuera(L, pid, now)) return { tipo: 'fuera' };
  if (now < meta.win[1].a) return { tipo: 'empieza', en: meta.win[1].a - now };
  const dias = [];
  let enCurso = false, hoy = false;
  for (let d = 1; d <= meta.days; d++) {
    const est = estadoDia(L, d, pid, now);
    if (est !== 'hoy' && est !== 'gracia' && est !== 'en-curso') continue;
    dias.push(d);
    if (est === 'en-curso') enCurso = true;
    // It closes tonight: yesterday's day in its grace day, or a day without one (the last, D-438)
    if (now >= meta.win[d].h || meta.win[d].b <= meta.win[d].h) hoy = true;
  }
  if (dias.length) return { tipo: 'jugar', dias, enCurso, hoy };
  for (let d = 1; d <= meta.days; d++) if (now < meta.win[d].a && !anulado(meta, d)) return { tipo: 'al-dia', dia: d, en: meta.win[d].a - now };
  return { tipo: 'al-dia', dia: 0, en: 0 };
}

/**
 * What `estadoEnLista` needs of a cup for `pid`, small enough to keep on the phone: the meta, the
 * early close, and only `pid`'s own player, starts and results. The list draws from it at once
 * and then reads the cup again.
 */
export function recorteLista(L, pid) {
  if (!L?.meta || !L.players?.[pid]) return null;
  const mio = x => Object.fromEntries(Object.entries(x || {}).filter(([, v]) => v?.[pid]).map(([d]) => [d, { [pid]: 1 }]));
  return { meta: L.meta, ...(L.fin ? { fin: L.fin } : {}), players: { [pid]: L.players[pid] }, started: mio(L.started), results: mio(L.results) };
}

/** Jugadores que cuentan: los inscritos que el admin no sacó. */
/** Todavía no hay con quién competir: falta al menos un jugador más. */
export const faltaGente = L => activos(L).length < MIN_JUGADORES;

export function activos(L) {
  return Object.entries(L.players || {})
    .filter(([, p]) => p && !p.out)
    .sort((a, b) => (a[1].at || 0) - (b[1].at || 0) || (a[0] < b[0] ? -1 : 1))
    .map(([pid, p]) => ({ pid, name: p.name, at: p.at }));
}

/**
 * Las posiciones de un día. Manda el puntaje del juego; a igual puntaje, el menor tiempo.
 * Si empatan en las dos cosas, comparten la mejor posición.
 */
export function posicionesDelDia(resultados = {}, pids) {
  const filas = pids.filter(pid => resultados[pid]).map(pid => ({ pid, s: Number(resultados[pid].s) || 0, ms: Number(resultados[pid].ms) || 0 }));
  filas.sort((a, b) => b.s - a.s || a.ms - b.ms);
  const out = {};
  filas.forEach((f, i) => {
    const prev = filas[i - 1];
    const pos = prev && prev.s === f.s && prev.ms === f.ms ? out[prev.pid].pos : i + 1;
    out[f.pid] = { pos, pts: PUNTOS[pos - 1] ?? 1 };
  });
  return out;
}

/**
 * ¿Puede `yo` ver los resultados del día `d`? Cuando ya lo jugó o cuando el día cerró. Antes
 * solo ve quiénes jugaron, no cuánto sacaron (la tabla tampoco lo delata).
 */
export const visibleDia = (L, d, yo, now) => cerrado(L.meta, d, now) || !!L.results?.[d]?.[yo] || terminada(L.meta, now);

/**
 * La tabla general tal como la ve `yo`. Cada fila: pid, nombre, total, días (pts, pos, x2,
 * oculto), días ganados, posición en la final, lugar y flecha contra la tabla sin el último
 * día que cambió algo.
 */
export function tabla(L, yo, now, { conFuera = true } = {}) {
  const jug = activos(L);
  const pids = jug.map(j => j.pid);
  const dias = [];
  for (let d = 1; d <= L.meta.days; d++) if (seAbrio(L.meta, d, now)) dias.push(d);
  const pos = Object.fromEntries(dias.map(d => [d, posicionesDelDia(L.results?.[d], pids)]));
  const vis = Object.fromEntries(dias.map(d => [d, visibleDia(L, d, yo, now)]));

  const armar = hasta => {
    const filas = jug.map(j => {
      let total = 0, ganados = 0;
      const porDia = {};
      for (const d of dias) {
        if (d > hasta) continue;
        const r = pos[d][j.pid];
        const x = multiplicador(L, d, j.pid, now);
        if (!vis[d]) { porDia[d] = { oculto: true, jugo: !!L.results?.[d]?.[j.pid] }; continue; }
        const pts = r ? r.pts * x : 0;
        total += pts;
        if (r?.pos === 1) ganados++;
        porDia[d] = { pts, pos: r?.pos || null, x, jugo: !!r };
      }
      const fin = L.meta.days;
      const finalPos = vis[fin] && fin <= hasta ? pos[fin]?.[j.pid]?.pos || 99 : 99;
      return { pid: j.pid, name: j.name, total, ganados, finalPos, dias: porDia, fuera: conFuera ? fuera(L, j.pid, now) : null };
    });
    // Who is out of the cup (D-347) keeps their points, below everyone still playing
    filas.sort((a, b) => !!a.fuera - !!b.fuera || b.total - a.total || b.ganados - a.ganados || a.finalPos - b.finalPos || a.name.localeCompare(b.name, 'es'));
    filas.forEach((f, i) => {
      const p = filas[i - 1];
      f.lugar = p && !!p.fuera === !!f.fuera && p.total === f.total && p.ganados === f.ganados && p.finalPos === f.finalPos ? p.lugar : i + 1;
    });
    return filas;
  };

  const ahora = armar(Infinity);
  const visibles = dias.filter(d => vis[d]);
  if (visibles.length >= 2) {
    const antes = armar(visibles[visibles.length - 2]);
    const lugarAntes = Object.fromEntries(antes.map(f => [f.pid, f.lugar]));
    for (const f of ahora) f.flecha = Math.sign(lugarAntes[f.pid] - f.lugar);
  } else for (const f of ahora) f.flecha = 0;
  return ahora;
}

/**
 * Por qué el 1.° quedó arriba del 2.° con los mismos puntos (dilema #79): 'dias' si ganó más días,
 * 'final' si ganaron los mismos y quedó mejor en la final. Null si no empatan en puntos, o si
 * empatan en todo y comparten el primer lugar (el orden alfabético no es un desempate). In a cup
 * without a final (D-438) the last day breaks the tie the same way: 'ultimo'.
 */
export function desempate(filas, meta = null) {
  const [a, b] = filas || [];
  if (!a || !b || a.total !== b.total || a.lugar === b.lugar) return null;
  return { pts: a.total, criterio: a.ganados !== b.ganados ? 'dias' : meta && !tieneFinal(meta) ? 'ultimo' : 'final' };
}

/**
 * Cómo fue cambiando la tabla, día por día, tal como la ve `yo`: el lugar de cada jugador
 * después de cada día que ya puede ver (los que jugó o los cerrados). Para el gráfico de
 * progreso del tablero. Devuelve { dias: [1, 2, …], filas: [{ pid, name, lugares: [..] }] }.
 */
export function evolucion(L, yo, now) {
  const dias = [];
  for (let d = 1; d <= L.meta.days; d++) if (seAbrio(L.meta, d, now) && visibleDia(L, d, yo, now)) dias.push(d);
  const lugares = {};
  for (const d of dias) {
    const hasta = Object.fromEntries(Object.entries(L.results || {}).filter(([k]) => Number(k) <= d && dias.includes(Number(k))));
    // Without the later results everyone would look absent: the history ranks by points only
    for (const f of tabla({ ...L, results: hasta }, yo, now, { conFuera: false })) (lugares[f.pid] ||= []).push(f.lugar);
  }
  return { dias, filas: activos(L).map(j => ({ pid: j.pid, name: j.name, lugares: lugares[j.pid] || [] })) };
}

/**
 * Cuántos juegos menos que el que más jugó tiene cada fila de la tabla (D-126), contando solo
 * los días que se ven: para marcar "(-1J)" en la tabla parcial que se comparte.
 */
export function menosJuegos(filas) {
  const jugados = f => Object.values(f.dias || {}).filter(x => !x.oculto && x.jugo).length;
  // Who is out of the cup (D-347) has nothing left to play: no "-2J", and they do not set the max (D-376)
  const max = Math.max(0, ...filas.filter(f => !f.fuera).map(jugados));
  return Object.fromEntries(filas.map(f => [f.pid, f.fuera ? 0 : Math.max(0, max - jugados(f))]));
}

/** Quiénes no han jugado un día que sigue abierto (para el mensaje del admin y el tablero). */
export function faltan(L, d, now) {
  if (!abierto(L.meta, d, now)) return [];
  // Who is out of the cup (D-347) is no longer waited for
  return activos(L).filter(j => !L.results?.[d]?.[j.pid] && !fuera(L, j.pid, now));
}

/**
 * ¿La tabla todavía puede cambiar? Sí mientras el último día que muestra sigue abierto y alguien
 * no lo ha jugado: sus puntos de ese día, y los lugares de los demás, aún no están. Un día que ya
 * cerró no la vuelve provisoria aunque alguien no lo haya jugado (se queda con su "(-1J)").
 */
export function provisoria(L, filas, now) {
  const u = ultimoDiaVisto(filas);
  return u > 0 && faltan(L, u, now).length > 0;
}

/**
 * El último día que muestra la tabla (0 si ninguno): el número de su título (dilema #67). Quien
 * todavía no juega hoy ve la tabla hasta ayer, y el título lo dice.
 */
export function ultimoDiaVisto(filas) {
  let u = 0;
  for (const f of filas) for (const [d, x] of Object.entries(f.dias || {})) if (!x.oculto) u = Math.max(u, Number(d));
  return u;
}

/**
 * Qué pasó con una fila de la tabla en el día `d`, para la imagen que se comparte (D-153):
 * 'pts' (jugó), 'comodin' (jugó con el comodín), 'no' (el día cerró sin que jugara) o 'falta'
 * (el día sigue abierto y no lo ha jugado). `pts` ya viene multiplicado; `final` marca la final.
 */
export function marcaDelDia(L, fila, d, now) {
  const x = fila.dias?.[d];
  const final = esFinal(L.meta, d);
  if (x?.jugo) {
    const w = comodinEfectivo(L, fila.pid, now);
    return { tipo: w.dia === d ? 'comodin' : 'pts', pts: x.pts, final, ...(w.dia === d && w.auto ? { auto: true } : {}) };
  }
  return { tipo: abierto(L.meta, d, now) ? 'falta' : 'no', pts: 0, final };
}

/**
 * Las medallas del cierre: campeón, más días ganados, la mejor remontada (más puestos subidos
 * desde la mitad de la copa) y "al descenso" (el último). Con menos de tres jugadores no hay
 * remontada ni farolito: con dos, el último es simplemente el segundo.
 */
export function medallas(L) {
  const now = L.meta.end;
  const filas = tabla(L, null, now);
  if (!filas.length) return {};
  const out = { campeon: filas.filter(f => f.lugar === 1) };
  const maxG = Math.max(...filas.map(f => f.ganados));
  if (maxG > 0) out.ganador = { filas: filas.filter(f => f.ganados === maxG), n: maxG };
  if (filas.length >= 3) {
    const mitad = Math.ceil(L.meta.days / 2);
    const T2 = { ...L, meta: { ...L.meta } };
    const corte = tabla({ ...T2, results: Object.fromEntries(Object.entries(L.results || {}).filter(([d]) => Number(d) <= mitad)) }, null, now);
    const antes = Object.fromEntries(corte.map(f => [f.pid, f.lugar]));
    const subidas = filas.map(f => ({ f, n: antes[f.pid] - f.lugar }));
    const maxS = Math.max(...subidas.map(s => s.n));
    if (maxS > 0) out.remontada = { filas: subidas.filter(s => s.n === maxS).map(s => s.f), n: maxS };
    const ultimo = Math.max(...filas.map(f => f.lugar));
    if (ultimo > 1) out.farolito = filas.filter(f => f.lugar === ultimo);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Tiempo activo                                                       */
/* ------------------------------------------------------------------ */

