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
import { semana, SIEMPRE, tablaId, VARIANTE_COPA, VARIANTE_VICTORIAS, esVictorias, medallero, ultimasCopas, limpiarNombre, esPin, claveNombre } from './records.js';

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
 * "Juegas como Javi · Salir". Se redibuja solo al entrar o salir, en esta y en las demás piezas.
 */
export function bloqueJugador({ abierto = false, alTocar = () => {} } = {}) {
  const caja = el('div', { class: 'rk-jugador' });
  let mensaje = '';
  const dibujar = () => {
    const T = R(), yo = leerYo();
    caja.replaceChildren();
    if (yo) {
      caja.append(el('div', { class: 'panel rk-yo' },
        el('span', {}, '🏅 ', ...partirNombre(fmt(T.playingAs, { name: '\u0000' }), yo.n)),
        el('button', { type: 'button', class: 'rk-link', id: 'rk-salir', onClick: async () => { alTocar(); mensaje = ''; (await jugador()).salir(); } }, T.logout)),
      ...(mensaje ? [el('p', { class: 'rk-ok', role: 'status' }, mensaje)] : []));
      return;
    }
    const nombre = el('input', { id: 'rk-nombre', maxlength: '20', autocomplete: 'nickname', placeholder: T.namePh, 'aria-label': T.nameLabel });
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
    const det = el('details', { class: 'panel rk-invita', ...(abierto || mensaje ? { open: true } : {}) },
      el('summary', {}, T.joinTitle),
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
};

function fila(f, yo, victorias = false) {
  const T = R();
  const mia = yo && f.jid === yo;
  return el('div', { class: 'rk-fila' + (mia ? ' yo' : ''), 'data-jid': f.jid },
    el('span', { class: 'rk-puesto' }, f.puesto == null ? '·' : MEDALLA[f.puesto - 1] || `${f.puesto}`),
    // El "(tú)" va fuera del recorte: un nombre largo se corta, pero se sigue viendo cuál es el propio
    el('span', { class: 'rk-nombre' }, el('span', { class: 'rk-n' }, f.n || '?'), mia ? el('small', {}, `(${T.you})`) : null),
    el('span', { class: 'rk-puntos' }, `${f.s}`),
    // En una tabla de victorias no hay tiempo: el trofeo dice qué se cuenta
    el('small', { class: 'rk-tiempo' }, victorias ? '🏆' : mmss(f.ms)));
}

/**
 * Un ranking con sus pestañas. `juego` es la tabla (el id del juego, o 'todoterreno').
 * `pestanas` elige cuáles se muestran y en qué orden; la primera es la que se ve al abrir.
 * Devuelve el nodo, con `.recargar()` para después de anotar una partida.
 */
export function bloqueRanking({ juego, titulo = null, hint = null, pestanas = ['semana', 'siempre', 'amigos'], alTocar = () => {} }) {
  const T = R();
  let actual = pestanas[0];
  const lista = el('div', { class: 'rk-lista', 'aria-live': 'polite' });
  const seg = pestanas.length > 1 ? el('div', { class: 'rk-seg', role: 'tablist' }, pestanas.map(p => el('button', {
    type: 'button', role: 'tab', 'data-p': p, class: p === actual ? 'on' : '', 'aria-selected': String(p === actual),
    onClick: () => { alTocar(); actual = p; marcar(); cargar(); },
  }, PESTANAS[p].rotulo(T)))) : null;
  const marcar = () => seg?.querySelectorAll('button').forEach(b => { const on = b.dataset.p === actual; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  let turno = 0;
  async function cargar() {
    const mio = ++turno;
    lista.replaceChildren(el('p', { class: 'muted rk-centro' }, T.loading));
    try {
      const J = await jugador();
      const v = await PESTANAS[actual].leer(J, juego);
      if (mio !== turno) return;
      const yo = leerYo()?.jid;
      lista.replaceChildren();
      if (!v.top.length) { lista.append(el('p', { class: 'muted rk-centro' }, v.amigos ? T.emptyFriends : T.empty)); return; }
      lista.append(...v.top.map(f => fila(f, yo, esVictorias(juego))));
      if (v.vecinos?.length) lista.append(el('div', { class: 'rk-sep', 'aria-hidden': 'true' }, '⋯'), ...v.vecinos.map(f => fila(f, yo, esVictorias(juego))));
      if (v.amigos && v.top.length < 2) lista.append(el('p', { class: 'muted rk-centro' }, T.emptyFriends));
    } catch (e) {
      if (mio === turno) lista.replaceChildren(el('p', { class: 'rk-error' }, T.error));
    }
  }
  const caja = el('div', { class: 'panel rk-ranking', 'data-tabla': juego },
    el('p', { class: 'lead rk-titulo' }, titulo || T.title),
    hint ? el('p', { class: 'muted rk-hint' }, hint) : null,
    seg, lista);
  caja.recargar = cargar;
  cargar();
  jugador().then(J => J.escuchar(() => cargar())).catch(() => {});
  return caja;
}

/* ------------------------------------------------------------------ */
/* Al terminar una partida                                             */
/* ------------------------------------------------------------------ */

/**
 * Anota la partida (si hay jugador) y devuelve un nodo que dice cómo le fue contra su récord.
 * Sin jugador, invita a entrar. Nunca lanza: si algo falla, el nodo lo dice y nada más.
 */
export function avisoPartida({ juego, variante = '', s, ms, alAnotar = () => {} }) {
  const T = R();
  const caja = el('div', { class: 'rk-resultado', 'aria-live': 'polite' });
  if (!leerYo()) {
    caja.append(el('p', { class: 'muted center' }, T.joinAfter));
    return caja;
  }
  (async () => {
    try {
      const J = await jugador();
      const r = await J.anotar({ juego, variante, s, ms });
      if (!r) return;
      // Un 0 (rendirse) no se celebra: "¡Récord nuevo!" bajo un 0/100 contradice la pantalla
      const celebra = Number(s) > 0;
      if (celebra && r.siempre.nuevo) caja.append(el('p', { class: 'rk-record pop' }, T.newRecord));
      else if (celebra && r.semana.nuevo) caja.append(el('p', { class: 'rk-record pop' }, T.newWeek));
      else if (r.siempre.antes) caja.append(el('p', { class: 'muted center' }, fmt(T.best, { s: r.siempre.antes.s, t: mmss(r.siempre.antes.ms) })));
      alAnotar(r);
    } catch (e) {
      caja.append(el('p', { class: 'rk-error' }, e?.code === 'pin' ? T.loggedOut : T.notSaved));
    }
  })();
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
    enlace ? el('a', { class: 'rk-link rk-ver', href: `${URL_RECORDS}#copa` }, T.seeAll) : null);
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
        el('span', { class: 'rk-nombre' }, f.n),
        el('span', { class: 'rk-medallas' }, `🥇${f.oro} 🥈${f.plata} 🥉${f.bronce}`))));
      const ult = ultimasCopas(podios, ultimas);
      if (ult.length) lista.append(el('p', { class: 'lead rk-sub' }, T.lastCups),
        ...ult.map(c => el('p', { class: 'muted rk-copa' }, `🏆 ${fmt(T.cupChampion, { copa: c.name, names: c.campeones.join(' · ') || '?' })}`)));
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
  if (!rankingsVisibles()) return caja;
  caja.append(bloqueRanking({ juego: tabla, titulo, hint, alTocar }), ...(entrar ? [bloqueJugador({ alTocar })] : []));
  return caja;
}

/**
 * Al terminar una partida de un juego de grupo (una vez, no al volver a dibujar el final). El de
 * este celular es su rol en sala, el humano contra el celular o, en un solo celular, el jugador que
 * se llama como el jugador abierto. Un empate no es victoria. Nunca lanza ni se espera.
 */
export function finDePartida({ juego, modo, rol = null, ganadores = [], nombres = {} }) {
  try {
    const yo = leerYo();
    if (!yo || modo === 'solo' || !rankingsVisibles()) return;
    const mio = rol || Object.keys(nombres).find(r => claveNombre(nombres[r]) === claveNombre(yo.n));
    if (!mio) return;
    const gano = ganadores.length === 1 && ganadores[0] === mio;
    jugador().then(J => J.anotarVictoria({ juego, gano })).catch(() => {});
  } catch (_) { /* los rankings nunca frenan una partida */ }
}
