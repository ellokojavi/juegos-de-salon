/**
 * Las piezas de pantalla de los rankings (D-212): entrar con nombre y PIN, una tabla con sus
 * pestañas (semana, siempre, amigos, en copa), el aviso de récord al terminar y el medallero de
 * La Copa. Las usan la antesala y el resultado de cada juego, la portada de La Copa y /records/.
 * Los estilos van en assets/css/ranking.css; los textos, en `COMMON[lang].rk` (C-3).
 *
 * Nada de esto frena el juego: si la red falla, el bloque lo dice y el resto de la pantalla sigue.
 */
import { el } from './ui.js';
import { COMMON, getLang } from './i18n.js';
import { jugador, leerYo, rankingsVisibles } from './jugador.js';
import { semana, SIEMPRE, tablaId, VARIANTE_COPA, VARIANTE_VICTORIAS, esVictorias, medallero, ultimasCopas, limpiarNombre, esPin, claveNombre, bandera, PARTIDAS, UAD_RACHA, UAD_PUNTOS, periodoDia, periodoMes } from './records.js';
import { sumarDias } from './uno-al-dia.js';
import { fechaLocal, numDia, semanaDe } from './uno-al-dia.js';
import { ponerBuzon } from './buzon.js';

/**
 * The inbox link at the end of the result screen, once it is drawn, after its buttons (D-345, U-38),
 * and after it the "☕ Buy me a coffee" link when its rule says so (support.js, lab only, D-395).
 */
const buzonAlFinal = (juego, donde) => {
  if (typeof document === 'undefined') return;
  setTimeout(() => {
    try { ponerBuzon(donde(), { juego }); } catch (_) { /* never in the way */ }
    import('./support.js').then(m => m.supportAtEnd(donde())).catch(() => {});
  }, 0);
};

const R = () => (COMMON[getLang()] || COMMON.es).rk;
const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
/** "3:07"; con horas, "1:02:10". */
export function mmss(ms) {
  const s = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
/** Dónde está /records/, desde cualquier página. */
export const URL_RECORDS = new URL('../../records/', import.meta.url).href;

const MEDALLA = ['🥇', '🥈', '🥉'];
const errorDe = e => (e?.code === 'pin' ? R().loggedOut : R().errNet);

/* ------------------------------------------------------------------ */
/* Entrar                                                              */
/* ------------------------------------------------------------------ */

/**
 * El bloque del jugador. Sin jugador: una invitación plegada con nombre y PIN. Con jugador:
 * "Juegas como Javi", que al tocarlo despliega cambiar el PIN y Salir. Se redibuja solo al entrar o salir, en esta y en las demás piezas.
 *
 * `destacado`: la invitación va arriba, antes de jugar, como una tarjeta con borde y un botón
 * "Entrar" a la vista (D-249): plegada sigue siendo una sola fila, para no bajar Empezar (C-8).
 * `leyenda`: una línea bajo el título de la tarjeta (en Uno al día, que guarda la racha). `compacto`:
 * one line, the legend alone as the title (inside the One a Day card, C-19).
 */
export function bloqueJugador({ abierto = false, destacado = false, compacto = false, leyenda = '', alTocar = () => {}, nombre: sugerido = '' } = {}) {
  const caja = el('div', { class: 'rk-jugador' });
  let mensaje = '';
  const dibujar = () => {
    const T = R(), yo = leerYo();
    caja.replaceChildren();
    if (yo) {
      // Lo de la cuenta (cambiar el PIN, salir) se despliega al tocar el nombre: no es un récord
      const pin = el('input', { id: 'rk-pin-nuevo', class: 'rk-pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', autocomplete: 'off', 'aria-label': T.newPin });
      const aviso = el('p', { class: 'rk-error', role: 'alert' });
      const cambiar = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'rk-cambiar-pin' }, T.changePin);
      cambiar.addEventListener('click', async () => {
        alTocar(); aviso.className = 'rk-error'; aviso.textContent = '';
        if (!esPin(pin.value)) { aviso.textContent = T.errPin; return; }
        cambiar.disabled = true;
        try { await (await jugador()).cambiarPin(pin.value); pin.value = ''; aviso.className = 'rk-ok'; aviso.textContent = T.pinChanged; }
        catch (e) { aviso.textContent = errorDe(e); }
        cambiar.disabled = false;
      });
      pin.addEventListener('keydown', e => { if (e.key === 'Enter') cambiar.click(); });
      caja.append(el('details', { class: 'panel rk-yo' },
        el('summary', {}, el('span', {}, '🏅 ', ...partirNombre(fmt(T.playingAs, { name: '\u0000' }), conBandera(yo.co, yo.n)))),
        el('div', { class: 'rk-cuenta' },
          el('p', { class: 'muted rk-hint' }, fmt(T.pinHint, { name: yo.n })),
          el('label', { class: 'rk-campo' }, el('span', {}, T.newPin), pin),
          cambiar, aviso,
          el('button', { type: 'button', class: 'rk-link', id: 'rk-salir', onClick: async () => { alTocar(); mensaje = ''; (await jugador()).salir(); } }, T.logout))),
      ...(mensaje ? [el('p', { class: 'rk-ok', role: 'status' }, mensaje)] : []));
      return;
    }
    // `nombre`: el que escribió para jugar, ya puesto (al terminar una partida sin haber entrado)
    const nombre = el('input', { id: 'rk-nombre', maxlength: '20', autocomplete: 'nickname', placeholder: T.namePh, 'aria-label': T.nameLabel, value: limpiarNombre(sugerido || '') || '' });
    const pin = el('input', { id: 'rk-pin', class: 'rk-pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', autocomplete: 'off', 'aria-label': T.pinLabel });
    const err = el('p', { class: 'rk-error', role: 'alert' }, mensaje);
    const b = el('button', { type: 'button', class: 'btn btn--cyan btn--sm rk-entrar', id: 'rk-entrar' }, T.join);
    const extra = el('div', {});
    const ocupado = si => { b.disabled = si; b.textContent = si ? T.joining : T.join; };
    const crear = async () => {
      ocupado(true);
      try {
        const J = await jugador();
        const yo = await J.crear(nombre.value, pin.value);
        mensaje = fmt(T.created, { name: yo.n });
        dibujar();
      } catch (e) { err.textContent = errorDe(e); ocupado(false); }
    };
    b.addEventListener('click', async () => {
      alTocar();
      extra.replaceChildren();
      err.textContent = '';
      if (!limpiarNombre(nombre.value)) { err.textContent = T.errName; return; }
      if (!esPin(pin.value)) { err.textContent = T.errPin; return; }
      ocupado(true);
      try {
        const J = await jugador();
        const r = await J.entrar(nombre.value, pin.value);
        if (r.estado === 'dentro') { mensaje = fmt(T.welcome, { name: leerYo()?.n || limpiarNombre(nombre.value) }); dibujar(); return; }
        ocupado(false);
        // Puntajes de La Copa de antes de los rankings, a ese nombre y sin dueño: ¿son suyos?
        if (r.heredado) {
          const reclamar = async () => {
            alTocar(); ocupado(true);
            try { const yo = await (await jugador()).reclamar(r.heredado, pin.value); mensaje = fmt(T.legacyClaimed, { name: yo.n }); dibujar(); }
            catch (e) { err.textContent = errorDe(e); ocupado(false); }
          };
          extra.append(el('p', { class: 'rk-aviso' }, fmt(T.legacyFound, { name: r.nombreHeredado })),
            el('div', { class: 'rk-botones' },
              el('button', { type: 'button', class: 'btn btn--yellow btn--sm', id: 'rk-reclamar', onClick: reclamar }, T.legacyMine),
              el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'rk-no-soy', onClick: () => { alTocar(); extra.replaceChildren(); r.otros ? pedirOtro(r.otros) : crear(); } }, T.legacyNotMe)));
          return;
        }
        // Nadie usa ese nombre: se crea de una. Si alguien lo usa con otro PIN, se pregunta.
        if (!r.otros) { await crear(); return; }
        pedirOtro(r.otros);
      } catch (e) { err.textContent = errorDe(e); ocupado(false); }
    });
    const pedirOtro = otros => {
        extra.append(el('p', { class: 'rk-aviso' }, fmt(T.sameName, { n: otros })),
          el('div', { class: 'rk-botones' },
            el('button', { type: 'button', class: 'btn btn--yellow btn--sm', id: 'rk-crear', onClick: () => { alTocar(); crear(); } }, T.create),
            el('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: () => { alTocar(); extra.replaceChildren(); pin.value = ''; pin.focus(); } }, T.retry)));
    };
    pin.addEventListener('keydown', e => { if (e.key === 'Enter') b.click(); });
    const det = el('details', { class: destacado ? `panel rk-invita rk-invita--destacada${compacto ? ' rk-invita--compacta' : ''}` : 'panel rk-invita', ...(abierto || mensaje ? { open: true } : {}) },
      destacado
        ? el('summary', {}, el('span', { class: 'rk-invita-txt' }, compacto && leyenda ? el('b', {}, leyenda) : [el('b', {}, T.joinCard), leyenda ? el('small', {}, leyenda) : null]),
          el('span', { class: 'btn btn--cyan btn--sm rk-invita-btn', 'aria-hidden': 'true' }, T.join))
        : el('summary', {}, T.joinTitle),
      el('p', { class: 'muted rk-hint' }, T.joinHint),
      el('label', { class: 'rk-campo' }, el('span', {}, T.nameLabel), nombre),
      el('label', { class: 'rk-campo' }, el('span', {}, T.pinLabel), pin),
      el('small', { class: 'muted' }, T.pinWarn),
      err, b, extra);
    caja.append(det);
  };
  dibujar();
  jugador().then(J => J.escuchar(dibujar)).catch(() => {});
  return caja;
}

/**
 * La bandera del país junto al nombre (D-219), en todas las tablas: "🇨🇱 Javi". Va pegada al
 * nombre con un espacio que no parte línea: si el renglón se corta, la bandera no queda sola (U-12).
 */
export const conBandera = (co, n) => [bandera(co), n].filter(Boolean).join('\u00a0');

/** "Juegas como {name}" con el nombre en negrita, sin armar la frase a pedazos (C-3). */
function partirNombre(frase, nombre) {
  const [antes, despues = ''] = frase.split('\u0000');
  return [antes, el('b', {}, nombre), despues];
}

/* ------------------------------------------------------------------ */
/* Una tabla                                                           */
/* ------------------------------------------------------------------ */

const PESTANAS = {
  semana: { rotulo: T => T.week, leer: (J, juego) => J.tabla(juego, semana(Date.now())) },
  siempre: { rotulo: T => T.always, leer: (J, juego) => J.tabla(juego, SIEMPRE) },
  amigos: { rotulo: T => T.friends, leer: async (J, juego) => ({ top: await J.tablaAmigos(juego, SIEMPRE), amigos: true }) },
  copa: { rotulo: T => T.cup, leer: (J, juego) => J.tabla(tablaId(juego, VARIANTE_COPA), SIEMPRE) },
  // Uno al día (D-230): el desafío de hoy, la suma de la semana (de la fecha del jugador), la mejor
  // racha y los amigos en la semana
  hoy: { rotulo: T => T.today, leer: (J, juego) => J.tabla(juego, periodoDia(numDia(fechaLocal()))) },
  semanaDia: { rotulo: T => T.week, leer: (J, juego) => J.tabla(juego, semanaDe(fechaLocal())) },
  rachas: { rotulo: T => T.streaks, tabla: UAD_RACHA, leer: J => J.tabla(UAD_RACHA, SIEMPRE) },
  amigosSemana: { rotulo: T => T.friends, vacio: T => T.emptyFriendsToday, leer: async (J, juego) => ({ top: await J.tablaAmigos(juego, semanaDe(fechaLocal())), amigos: true }) },
  // Uno al día points (lab, D-412): the month's season, everyone and friends; last month's winner
  // carries the 🏆 badge next to their name
  mes: { rotulo: T => T.month, tabla: UAD_PUNTOS, leer: (J, juego, o) => J.tabla(UAD_PUNTOS, periodoMes(fechaLocal()), o) },
  amigosMes: { rotulo: T => T.friends, tabla: UAD_PUNTOS, vacio: T => T.emptyFriendsToday, leer: async J => ({ top: await J.tablaAmigos(UAD_PUNTOS, periodoMes(fechaLocal())), amigos: true }) },
};

/** The month before today's, as a period (`s2026-09`). */
export const mesAnterior = (fecha = fechaLocal()) => periodoMes(sumarDias(`${fecha.slice(0, 7)}-01`, -1));

/** Last month's Uno al día points champion (D-412): their jid, or null. */
export async function campeonDelMes(J, { reciente = 0 } = {}) {
  try { return (await J.tabla(UAD_PUNTOS, mesAnterior(), { top: 1, reciente })).top[0]?.jid ?? null; } catch (_) { return null; }
}

/** The list a tab showed last on this phone, for the instant before the server answers (D-436). */
function leerVisto(k) { try { const v = JSON.parse(localStorage.getItem(k)); return v?.d === fechaLocal() ? v : null; } catch (_) { return null; } }
function guardarVisto(k, v) { try { localStorage.setItem(k, JSON.stringify({ ...v, d: fechaLocal() })); } catch (_) { /* no storage */ } }

function fila(f, yo, victorias = false, campeon = null) {
  const T = R();
  const mia = yo && f.jid === yo;
  return el('div', { class: 'rk-fila' + (mia ? ' yo' : ''), 'data-jid': f.jid },
    el('span', { class: 'rk-puesto' }, f.puesto == null ? '·' : MEDALLA[f.puesto - 1] || `${f.puesto}`),
    // El "(tú)" va fuera del recorte: un nombre largo se corta, pero se sigue viendo cuál es el propio
    el('span', { class: 'rk-nombre' }, el('span', { class: 'rk-n' }, conBandera(f.co, f.n || '?')),
      campeon && f.jid === campeon ? el('span', { class: 'rk-campeon', title: T.champion, 'aria-label': T.champion }, '🏆') : null, mia ? el('small', {}, `(${T.you})`) : null),
    el('span', { class: 'rk-puntos' }, `${f.s}`),
    // En una tabla de victorias no hay tiempo: el trofeo dice qué se cuenta
    el('small', { class: 'rk-tiempo' }, victorias === 'partidas' ? '🎲' : victorias === 'racha' ? '🔥' : victorias === 'puntos' ? `🔥${f.r || 0}` : victorias ? '🏆' : mmss(f.ms)));
}

/**
 * Un ranking con sus pestañas. `juego` es la tabla (el id del juego, o 'todoterreno').
 * `pestanas` elige cuáles se muestran y en qué orden; la primera es la que se ve al abrir.
 * Devuelve el nodo, con `.recargar()` para después de anotar una partida.
 * `rapido` (lab, D-436): the table and last month's champion are read at once, a reload keeps the
 * list on screen until the new one arrives, a read the page just made is reused, the list drawn last
 * time on this phone shows while the first one loads, and the page (not the block) reloads it when
 * the player signs in or out.
 */
export function bloqueRanking({ juego, titulo = null, hint = null, pestanas = ['semana', 'siempre', 'amigos'], alTocar = () => {}, rapido = false }) {
  const T = R();
  let actual = pestanas[0];
  const lista = el('div', { class: 'rk-lista', 'aria-live': 'polite' });
  const seg = pestanas.length > 1 ? el('div', { class: 'rk-seg', role: 'tablist' }, pestanas.map(p => el('button', {
    type: 'button', role: 'tab', 'data-p': p, class: p === actual ? 'on' : '', 'aria-selected': String(p === actual),
    onClick: () => { alTocar(); actual = p; caja.datos = null; pintado = false; marcar(); cargar(); },
  }, PESTANAS[p].rotulo(T)))) : null;
  const marcar = () => seg?.querySelectorAll('button').forEach(b => { const on = b.dataset.p === actual; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  let turno = 0;
  // A list (or its empty line) is on screen for this tab, so a fast reload keeps it until the new one
  let pintado = false;
  const guardada = () => `juegos-de-salon:rk-visto:${juego}:${actual}`;
  async function cargar() {
    const mio = ++turno;
    const visto = rapido && !pintado && leerVisto(guardada());
    if (visto) pintar(visto);
    else if (!rapido || !pintado) { lista.replaceChildren(el('p', { class: 'muted rk-centro' }, T.loading)); caja.datos = null; }
    try {
      const J = await jugador();
      const conPuntos = (PESTANAS[actual].tabla || juego) === UAD_PUNTOS;
      const o = rapido ? { reciente: 5000 } : undefined;
      let v, campeon = null;
      if (rapido) [v, campeon] = await Promise.all([PESTANAS[actual].leer(J, juego, o), conPuntos ? campeonDelMes(J, o) : null]);
      else {
        v = await PESTANAS[actual].leer(J, juego);
        campeon = conPuntos ? await campeonDelMes(J) : null;
      }
      if (mio !== turno) return;
      if (rapido && !v.amigos) guardarVisto(guardada(), { top: v.top, vecinos: v.vecinos || [], campeon });
      pintar({ ...v, campeon });
    } catch (e) {
      if (mio === turno && !(rapido && pintado)) lista.replaceChildren(el('p', { class: 'rk-error' }, T.error));
    }
  }
  function pintar(v) {
    const campeon = v.campeon ?? null;
    const yo = leerYo()?.jid;
    caja.datos = null;
    pintado = true;
    lista.replaceChildren();
    const sinAmigos = PESTANAS[actual].vacio?.(T) || T.emptyFriends;
    if (!v.top.length) { lista.append(el('p', { class: 'muted rk-centro' }, v.amigos ? sinAmigos : T.empty)); return; }
    const t = PESTANAS[actual].tabla || juego;
    const tipo = t === PARTIDAS ? 'partidas' : t === UAD_RACHA ? 'racha' : t === UAD_PUNTOS ? 'puntos' : esVictorias(t);
    lista.append(...v.top.map(f => fila(f, yo, tipo, campeon)));
    // What is shown, for whoever draws it elsewhere (sharing the ranking as a picture)
    caja.datos = { pestana: actual, rotulo: PESTANAS[actual].rotulo(T), top: v.top, vecinos: v.vecinos || [], yo, tipo, campeon };
    if (v.vecinos?.length) lista.append(el('div', { class: 'rk-sep', 'aria-hidden': 'true' }, '⋯'), ...v.vecinos.map(f => fila(f, yo, tipo, campeon)));
    if (v.amigos && v.top.length < 2) lista.append(el('p', { class: 'muted rk-centro' }, sinAmigos));
  }
  const caja = el('div', { class: 'panel rk-ranking', 'data-tabla': juego },
    el('p', { class: 'lead rk-titulo' }, titulo || T.title),
    hint ? el('p', { class: 'muted rk-hint' }, hint) : null,
    seg, lista);
  caja.recargar = cargar;
  cargar();
  if (!rapido) jugador().then(J => J.escuchar(() => cargar())).catch(() => {});
  return caja;
}

/* ------------------------------------------------------------------ */
/* Al terminar una partida                                             */
/* ------------------------------------------------------------------ */

/**
 * Sin jugador abierto, al terminar una partida (D-274): "¿Quieres que esta partida cuente?" y el
 * mismo formulario de nombre y PIN de siempre, con el nombre que escribió para jugar ya puesto. Al
 * entrar (o crear su jugador), `alEntrar()` anota la partida recién jugada y lo dice en la misma caja.
 */
/** El nombre que este celular escribió para jugar alguno de los juegos (`juegos-de-salon:<juego>:name`), o ''. */
function nombreLocal() {
  try {
    for (let k = 0; k < localStorage.length; k++) {
      const clave = localStorage.key(k);
      if (/^juegos-de-salon:[^:]+:name$/.test(clave || '') && localStorage.getItem(clave)) return localStorage.getItem(clave);
    }
  } catch (_) { /* sin almacenamiento */ }
  return '';
}

function ofrecerContar(caja, { nombre = '', alTocar = () => {}, alEntrar }) {
  const T = R();
  nombre = nombre || nombreLocal();
  caja.classList.add('rk-contar');
  // One line with its Sign in button, the same card as everywhere (C-19): tapping it opens the form with the
  // name already in, so the PIN is still all it takes (D-274)
  caja.replaceChildren(bloqueJugador({ destacado: true, compacto: true, leyenda: T.countThis, nombre, alTocar }));
  let hecho = false;
  jugador().then(J => {
    const off = J.escuchar(() => {
      if (hecho || !leerYo()) return;
      if (!caja.isConnected) { off?.(); return; }
      hecho = true; off?.();
      caja.classList.remove('rk-contar');
      caja.replaceChildren();
      alEntrar();
    });
  }).catch(() => {});
}

/**
 * Anota la partida (si hay jugador) y devuelve un nodo que dice cómo le fue contra su récord.
 * Sin jugador, le ofrece entrar ahí mismo para que esta partida cuente (D-274). Nunca lanza: si
 * algo falla, el nodo lo dice y nada más.
 */
export function avisoPartida({ juego, variante = '', s, ms, alAnotar = () => {}, nombre = '', alTocar = () => {} }) {
  const T = R();
  const caja = el('div', { class: 'rk-resultado', 'aria-live': 'polite' });
  buzonAlFinal(juego, () => caja.closest('.screen') || document.querySelector('.screen.active'));
  const anotar = async () => {
    try {
      const J = await jugador();
      const r = await J.anotar({ juego, variante, s, ms });
      if (!r) return;
      // Un 0 (rendirse) no se celebra: "¡Récord nuevo!" bajo un 0/100 contradice la pantalla
      const celebra = Number(s) > 0;
      if (celebra && r.siempre.nuevo) caja.append(el('p', { class: 'rk-record pop' }, T.newRecord));
      else if (celebra && r.semana.nuevo) caja.append(el('p', { class: 'rk-record pop' }, T.newWeek));
      else if (r.siempre.antes) caja.append(el('p', { class: 'muted center' }, fmt(T.best, { s: r.siempre.antes.s, t: mmss(r.siempre.antes.ms) })));
      else caja.append(el('p', { class: 'rk-ok center' }, T.countedGame));
      alAnotar(r);
    } catch (e) {
      caja.append(el('p', { class: 'rk-error' }, e?.code === 'pin' ? T.loggedOut : T.notSaved));
    }
  };
  if (!rankingsVisibles()) return caja;
  if (!leerYo()) ofrecerContar(caja, { nombre, alTocar, alEntrar: anotar });
  else anotar();
  return caja;
}

/* ------------------------------------------------------------------ */
/* Campeones de La Copa                                                */
/* ------------------------------------------------------------------ */

/** El medallero de las copas terminadas y las últimas que se jugaron. */
export function bloqueCampeones({ max = 5, enlace = true, ultimas = 3 } = {}) {
  const T = R();
  const lista = el('div', { class: 'rk-lista' }, el('p', { class: 'muted rk-centro' }, T.loading));
  const caja = el('div', { class: 'panel rk-campeones' },
    el('p', { class: 'lead rk-titulo' }, `🏅 ${T.champions}`),
    el('p', { class: 'muted rk-hint' }, T.championsHint),
    lista,
    enlace ? el('a', { class: 'rk-link rk-ver', href: `${URL_RECORDS}#copas` }, T.seeAll) : null);
  (async () => {
    try {
      const J = await jugador();
      const podios = await J.podios();
      const filas = medallero(podios).slice(0, max);
      const yo = leerYo()?.jid;
      lista.replaceChildren();
      if (!filas.length) { lista.append(el('p', { class: 'muted rk-centro' }, T.noChampions)); return; }
      lista.append(...filas.map(f => el('div', { class: 'rk-fila' + (yo && f.jid === yo ? ' yo' : '') },
        el('span', { class: 'rk-puesto' }, `${f.puesto}`),
        el('span', { class: 'rk-nombre' }, el('span', { class: 'rk-n' }, conBandera(f.co, f.n))),
        el('span', { class: 'rk-medallas' }, `🥇${f.oro} 🥈${f.plata} 🥉${f.bronce}`))));
      const ult = ultimasCopas(podios, ultimas);
      if (ult.length) lista.append(el('p', { class: 'lead rk-sub' }, T.lastCups),
        ...ult.map(c => el('p', { class: 'muted rk-copa' }, `🏆 ${fmt(T.cupChampion, { copa: c.name, names: c.campeones.map(x => conBandera(x.co, x.n)).join(' · ') || '?' })}`)));
    } catch (_) {
      lista.replaceChildren(el('p', { class: 'rk-error' }, T.error));
    }
  })();
  return caja;
}

/* ------------------------------------------------------------------ */
/* Victorias de los juegos de grupo                                    */
/* ------------------------------------------------------------------ */

/**
 * Lo de la intro de un juego de grupo: entrar y el ranking de victorias de ese juego. Mientras los
 * rankings estén en el laboratorio, nada (un fragmento vacío).
 */
export function bloqueVictorias({ juego, nombre, alTocar = () => {} }) {
  const T = R();
  return bloqueTabla({ tabla: tablaId(juego, VARIANTE_VICTORIAS), titulo: fmt(T.winsOf, { game: nombre }), hint: T.winsHint, alTocar });
}

/**
 * Un ranking y, debajo, entrar con nombre y PIN: lo de la antesala de un modo de un jugador
 * (Toque y Fama solo, Línea Relámpago) o de un juego de grupo. Vacío mientras los rankings estén
 * en el laboratorio y este celular no los haya activado.
 */
export function bloqueTabla({ tabla, titulo, hint = null, alTocar = () => {}, entrar = true }) {
  const caja = document.createDocumentFragment();
  // `recargar()`: para después de anotar la partida, que se guarda mientras la tabla ya se está leyendo
  caja.recargar = () => {};
  if (!rankingsVisibles()) return caja;
  const rk = bloqueRanking({ juego: tabla, titulo, hint, alTocar });
  caja.recargar = () => rk.recargar();
  caja.append(rk, ...(entrar ? [bloqueJugador({ alTocar })] : []));
  return caja;
}

/**
 * Al terminar una partida de un juego de grupo (una vez, no al volver a dibujar el final). El de
 * este celular es su rol en sala, el humano contra el celular o, en un solo celular, el jugador que
 * se llama como el jugador abierto. Un empate no es victoria. Nunca lanza ni se espera.
 *
 * Sin jugador abierto (D-274), pone en la pantalla final —después de `#result-actions`, que tienen
 * todos los juegos de grupo— "¿Quieres que esta partida cuente?" con nombre y PIN: al entrar, se
 * anota esta partida (y la victoria, si fue suya). Lo devuelve también, por si el juego lo pone en
 * otro lado.
 */
export function finDePartida({ juego, modo, rol = null, ganadores = [], nombres = {}, alTocar = () => {} }) {
  buzonAlFinal(juego, () => document.querySelector('#screen-result'));
  try {
    if (modo === 'solo' || !rankingsVisibles()) return null;
    const mioDe = yo => rol || Object.keys(nombres).find(r => claveNombre(nombres[r]) === claveNombre(yo.n));
    const anotar = (caja = null) => {
      const yo = leerYo();
      const mio = yo && mioDe(yo);
      if (!mio) { caja?.append(el('p', { class: 'muted center' }, R().notInGame)); return; }
      const gano = ganadores.length === 1 && ganadores[0] === mio;
      jugador().then(J => J.anotarVictoria({ juego, gano }))
        .then(() => caja?.append(el('p', { class: 'rk-ok center' }, gano ? R().countedWin : R().countedGame)))
        .catch(e => caja?.append(el('p', { class: 'rk-error' }, e?.code === 'pin' ? R().loggedOut : R().notSaved)));
    };
    if (leerYo()) { anotar(); return null; }
    // El nombre que escribió para jugar: el de su rol (en sala o contra el celular)
    const caja = el('div', { class: 'rk-resultado rk-fin-partida', 'aria-live': 'polite' });
    ofrecerContar(caja, { nombre: rol ? nombres[rol] || '' : '', alTocar, alEntrar: () => anotar(caja) });
    const acciones = globalThis.document?.querySelector('#screen-result #result-actions');
    // Después de los botones, para que sigan a la vista sin desplazar (C-8)
    if (acciones) { acciones.parentElement.querySelector('.rk-fin-partida')?.remove(); acciones.after(caja); }
    return caja;
  } catch (_) { return null; /* los rankings nunca frenan una partida */ }
}
