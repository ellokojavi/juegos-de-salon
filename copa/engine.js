/**
 * La Copa — motor del torneo (sin DOM). Testeable con node.
 *
 * Un torneo de 3 o 7 días entre amigos: cada día un minijuego idéntico para todos, que se
 * juega una vez y reparte puntos por posición (ver docs/juegos/copa.md).
 *
 * Todo lo de acá son funciones puras sobre los datos de la copa tal como vienen del
 * almacén (`meta`, `players`, `started`, `results`, `wild`) y una hora `now`. El almacén no
 * sabe de reglas; la pantalla no sabe sumar.
 */

/** Los minijuegos de cada modalidad, en orden. El último siempre es la final, que vale doble. */
export const CALENDARIOS = {
  3: ['linea', 'conexiones', 'final'],
  7: ['linea', 'numero', 'conexiones', 'reinas', 'letras', 'anio', 'final'],
};
export const MODALIDADES = Object.keys(CALENDARIOS).map(Number);

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

/** Código de copa: 5 letras sin las ambiguas (I, O). 24⁵ ≈ 7,9 millones. */
export const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const CODIGO = /^[A-HJ-NP-Z]{5}$/;
export const esCodigo = c => typeof c === 'string' && CODIGO.test(c);

/** Identificador de jugador dentro de la copa: 6 letras minúsculas o cifras. */
export const PID = /^[a-z0-9]{6}$/;

export function codigoAlAzar(rand = cryptoRand) {
  let out = '';
  for (let i = 0; i < 5; i++) out += LETRAS[Math.floor(rand() * LETRAS.length)];
  return out;
}

export function pidAlAzar(rand = cryptoRand) {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += abc[Math.floor(rand() * abc.length)];
  return out;
}

function cryptoRand() {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0] / 4294967296;
}

/* ------------------------------------------------------------------ */
/* Nombres y PIN                                                       */
/* ------------------------------------------------------------------ */

/** El nombre tal como se guarda: sin espacios de más y con tope de largo. */
export const limpiarNombre = (s, max = NOMBRE_MAX) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);

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
export function nuevaMeta({ nombre, dias, inicio, tz = ZONA, admin, creada, lab = false }) {
  if (!CALENDARIOS[dias]) throw new Error('modalidad');
  return {
    v: 1, name: limpiarNombre(nombre, COPA_MAX), days: dias, start: inicio, tz, admin,
    cal: CALENDARIOS[dias].join(','), win: ventanas(inicio, dias, tz), createdAt: creada,
    end: medianoche(sumarDias(inicio, dias), tz),
    // Las reglas de la base no suman ni convierten números a texto: lo que necesitan comparar
    // va ya calculado. `joinUntil` = cuándo empieza la final; `final` = el día de la final, como texto.
    joinUntil: medianoche(sumarDias(inicio, dias - 1), tz), final: String(dias),
    // Una copa del laboratorio (D-115): su admin puede pasarla al día siguiente para probar
    ...(lab ? { lab: true } : {}),
  };
}

/** Los minijuegos que salieron (D-102) se juegan como sus reemplazos, para no romper copas viejas. */
const REEMPLAZOS = { solitario: 'reinas', dudo: 'letras' };
export const calendario = meta => String(meta.cal || '').split(',').map(id => REEMPLAZOS[id] || id);
export const juegoDelDia = (meta, d) => calendario(meta)[d - 1] || null;
export const esFinal = (meta, d) => d === meta.days;

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

/** Nadie ha empezado ningún día: el inicio todavía se puede mover. */
export const sinEmpezar = L => !Object.values(L?.started || {}).some(d => d && Object.keys(d).length);

/* ------------------------------------------------------------------ */
/* Estado de cada día para un jugador                                  */
/* ------------------------------------------------------------------ */

/**
 * 'futuro' · 'hoy' · 'gracia' (el de ayer, último día para jugarlo) · 'en-curso' (tocó
 * Empezar y no terminó) · 'jugado' · 'perdido' (cerró sin resultado).
 */
export function estadoDia(L, d, pid, now) {
  const { meta } = L;
  if (L.results?.[d]?.[pid]) return 'jugado';
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

/** Cuánto multiplica un día: la final ×2, el comodín ×2. No se acumulan (el comodín no vale en la final). */
export const multiplicador = (L, d, pid) => (esFinal(L.meta, d) || comodinDe(L, pid) === d ? 2 : 1);

/* ------------------------------------------------------------------ */
/* Puntos y tabla                                                      */
/* ------------------------------------------------------------------ */

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
 * Las posiciones de un día. Manda el puntaje del minijuego; a igual puntaje, el menor tiempo.
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
export function tabla(L, yo, now) {
  const jug = activos(L);
  const pids = jug.map(j => j.pid);
  const dias = [];
  for (let d = 1; d <= L.meta.days; d++) if (now >= L.meta.win[d].a) dias.push(d);
  const pos = Object.fromEntries(dias.map(d => [d, posicionesDelDia(L.results?.[d], pids)]));
  const vis = Object.fromEntries(dias.map(d => [d, visibleDia(L, d, yo, now)]));

  const armar = hasta => {
    const filas = jug.map(j => {
      let total = 0, ganados = 0;
      const porDia = {};
      for (const d of dias) {
        if (d > hasta) continue;
        const r = pos[d][j.pid];
        const x = multiplicador(L, d, j.pid);
        if (!vis[d]) { porDia[d] = { oculto: true, jugo: !!L.results?.[d]?.[j.pid] }; continue; }
        const pts = r ? r.pts * x : 0;
        total += pts;
        if (r?.pos === 1) ganados++;
        porDia[d] = { pts, pos: r?.pos || null, x, jugo: !!r };
      }
      const fin = L.meta.days;
      const finalPos = vis[fin] && fin <= hasta ? pos[fin]?.[j.pid]?.pos || 99 : 99;
      return { pid: j.pid, name: j.name, total, ganados, finalPos, dias: porDia };
    });
    filas.sort((a, b) => b.total - a.total || b.ganados - a.ganados || a.finalPos - b.finalPos || a.name.localeCompare(b.name, 'es'));
    filas.forEach((f, i) => {
      const p = filas[i - 1];
      f.lugar = p && p.total === f.total && p.ganados === f.ganados && p.finalPos === f.finalPos ? p.lugar : i + 1;
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
 * Cómo fue cambiando la tabla, día por día, tal como la ve `yo`: el lugar de cada jugador
 * después de cada día que ya puede ver (los que jugó o los cerrados). Para el gráfico de
 * progreso del tablero. Devuelve { dias: [1, 2, …], filas: [{ pid, name, lugares: [..] }] }.
 */
export function evolucion(L, yo, now) {
  const dias = [];
  for (let d = 1; d <= L.meta.days; d++) if (now >= L.meta.win[d].a && visibleDia(L, d, yo, now)) dias.push(d);
  const lugares = {};
  for (const d of dias) {
    const hasta = Object.fromEntries(Object.entries(L.results || {}).filter(([k]) => Number(k) <= d && dias.includes(Number(k))));
    for (const f of tabla({ ...L, results: hasta }, yo, now)) (lugares[f.pid] ||= []).push(f.lugar);
  }
  return { dias, filas: activos(L).map(j => ({ pid: j.pid, name: j.name, lugares: lugares[j.pid] || [] })) };
}

/** Quiénes no han jugado un día que sigue abierto (para el mensaje del admin y el tablero). */
export function faltan(L, d, now) {
  if (!abierto(L.meta, d, now)) return [];
  return activos(L).filter(j => !L.results?.[d]?.[j.pid]);
}

/**
 * Las medallas del cierre: campeón, más días ganados, la mejor remontada (más puestos subidos
 * desde la mitad de la copa) y "a la liga de descenso" (el último). Con menos de tres jugadores no hay
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

/**
 * Cronómetro que solo corre con la pantalla visible (D-95). Se guarda como { ms, desde }:
 * `ms` acumulado y `desde` el instante en que volvió a correr (o null si está en pausa).
 */
export const reloj = {
  nuevo: now => ({ ms: 0, desde: now }),
  pausar: (r, now) => (r.desde == null ? r : { ms: r.ms + Math.max(0, now - r.desde), desde: null }),
  seguir: (r, now) => (r.desde == null ? { ms: r.ms, desde: now } : r),
  leer: (r, now) => r.ms + (r.desde == null ? 0 : Math.max(0, now - r.desde)),
};

/** "3:07" o "1:02:10". */
export function mmss(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
