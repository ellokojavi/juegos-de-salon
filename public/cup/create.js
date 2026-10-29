/**
 * La Copa — the create-a-Cup screen, loaded the first time it opens (#860).
 * Everything else it needs from game.js comes in `c`, the screen's context.
 */
import { $, con, conEmoji, el, vibrate } from '../assets/js/ui.js';
import { COPA_MAX, ESTILOS_SEMANA, MAX_DIAS_INICIO, POZO, SIN_FINAL, TRIO_SEP, VARIANTES, aliasLimpio, calendario, calendarioAlAzar, codigoAlAzar, diaDeCal, entradaCal, esAlias, esPin, fechaEn, findeAbierto, findeAlAzar, fuera, hashPin, limpiarNombre, nuevaMeta, pidAlAzar, semanaAlAzar, sumarDias, zonaDeIdioma } from './engine.js';
import { JUEGOS_COPA as JUEGOS_COPA_ES } from './rules.js';
import { LANGS } from '../assets/js/i18n.js';
import { SFX } from '../assets/js/sound.js';
import { crearArrastre } from '../assets/js/arrastre.js';
import { esNuevo, gameById } from '../assets/js/games.js';
import { flag } from '../assets/js/flags.js';
import { leerYo } from '../assets/js/jugador.js';
import { param, tiene } from '../assets/js/parametros.js';

let c;
let G, JUEGOS_COPA, LABS, LANG, LOCALE, PRUEBA, RESERVADAS, T, TRES, abrirCopa, abrirStore, admin, avisoError, campo, campoFecha, campoPin, camposPin, cuenta, entrarComoJugador, errorDe, fechaLarga, fmt, memorial, miPais, mostrar, opciones, opcionesVariante, pinAlAzar, poner, portada, sinPinDeCopa, zonaTexto;

/** Draws it; `ctx` is game.js's context (its `let`s are read live). */
export function crearCopa(ctx, ...args) {
  c = ctx;
  ({ G, JUEGOS_COPA, LABS, LANG, LOCALE, PRUEBA, RESERVADAS, T, TRES, abrirCopa, abrirStore, admin, avisoError, campo, campoFecha, campoPin, camposPin, cuenta, entrarComoJugador, errorDe, fechaLarga, fmt, memorial, miPais, mostrar, opciones, opcionesVariante, pinAlAzar, poner, portada, sinPinDeCopa, zonaTexto } = ctx);
  return pantallaCrearCopa(...args);
}

/**
 * Los juegos de la copa y su orden (D-163), con la mano y la línea de Línea de Tiempo (D-102):
 * arriba los que quedan fuera, abajo la semana. Un día se arrastra a otro lugar de la semana, y un
 * juego de fuera se arrastra hasta el día que reemplaza; tocando se llega a lo mismo (el juego y
 * después dónde va). Parte con una propuesta al azar, para quien no quiere pensarlo. La final no
 * se toca: siempre el último día.
 */
function elegirJuegos() {
  // `sel`: lo elegido, { zona: 'dia' | 'fuera', id }. `destino`: dónde va ('s<k>' la ranura k,
  // al tocar; 'm<k>' el lugar k de la semana, al arrastrar un día; 'r<i>' el día i que se reemplaza)
  let cal = [], sel = null, destino = null, arrastrando = false;
  // The variant of each game that has them (D-331): it goes with the game, not with the day, so moving a day keeps it
  const variantes = {};
  // La familia se compara en español: la misma semana al azar cualquiera sea el idioma
  const familia = id => JUEGOS_COPA_ES[id].habilidad;
  // La ayuda larga no cambia; lo que cambia con lo elegido es una línea de alto fijo: si la
  // página se moviera al elegir, el día de destino se correría bajo el dedo que arrastra. Los tres
  // textos van apilados en la misma celda y solo se ve uno: el alto es el del más largo a cualquier
  // ancho (a 320 px uno ocupa tres líneas y los otros dos, una o dos)
  // Tocando se dice "toca"; con el juego en el aire, "suéltalo"
  const AYUDAS = { nada: T.gamesPick, dia: T.gamesPickedDay, fuera: T.gamesPickedOut, 'arr-dia': T.gamesDragDay, 'arr-fuera': T.gamesDragOut };
  const estado = el('p', { class: 'cal-estado', 'aria-live': 'polite' },
    Object.entries(AYUDAS).map(([k, txt]) => el('span', { 'data-ayuda': k }, txt)));
  const mano = el('div', { class: 'hand', id: 'cal-fuera' });
  const linea = el('div', { class: 'line cal-linea', id: 'cal-elegir' });
  const dias = () => cal.slice(0, -1);
  const fueraDe = () => POZO.filter(id => !cal.includes(id));
  // Una ranura junto al día que se mueve lo dejaría donde está: no se ofrece
  const ranuraSirve = k => !arrastrando && sel?.zona === 'dia' && k !== dias().indexOf(sel.id) && k !== dias().indexOf(sel.id) + 1;
  /** La semana con el día elegido en el lugar k. */
  const movido = k => { const d = dias(); d.splice(d.indexOf(sel.id), 1); d.splice(k, 0, sel.id); return d; };
  // Arrastrando un día, los demás se corren para hacerle lugar: la lista no cambia de alto bajo el dedo
  const moviendo = () => arrastrando && sel?.zona === 'dia';
  const vista = () => (moviendo() && destino ? movido(Number(destino.slice(1))) : dias());

  const aplicar = clave => {
    const n = Number(clave.slice(1));
    if (clave[0] === 'r' && sel.zona === 'fuera') cal[n] = sel.id;
    if (clave[0] === 'm' && sel.zona === 'dia') cal = [...movido(n), 'final'];
    if (clave[0] === 's' && sel.zona === 'dia') {
      const d = dias(), i = d.indexOf(sel.id);
      d.splice(i, 1); d.splice(n > i ? n - 1 : n, 0, sel.id);
      cal = [...d, 'final'];
    }
  };
  const tocarFuera = id => {
    if (sel?.zona === 'dia') { cal[cal.indexOf(sel.id)] = id; sel = null; } else sel = sel?.id === id ? null : { zona: 'fuera', id };
    SFX.tap(); pintar();
  };
  const tocarDia = i => {
    if (sel?.zona === 'fuera') { cal[i] = sel.id; sel = null; } else sel = sel?.id === cal[i] ? null : { zona: 'dia', id: cal[i] };
    SFX.tap(); pintar();
  };
  const tocarRanura = k => { aplicar(`s${k}`); sel = null; SFX.tap(); pintar(); };

  const nombreJ = (id, sub = JUEGOS_COPA[id].habilidad) => el('span', { class: 't' }, JUEGOS_COPA[id].nombre, el('small', {}, sub));
  const ranura = k => el('div', { class: 'slot', 'data-slot': k, 'data-clave': `s${k}`, onClick: () => tocarRanura(k) }, el('span', {}, T.gamesSlot));

  function marcar() {
    linea.querySelectorAll('[data-clave]').forEach(x => x.classList.toggle('on', x.dataset.clave === destino));
  }
  function pintar() {
    mano.innerHTML = ''; linea.innerHTML = '';
    poner(mano, fueraDe().map(id => el('button', {
      type: 'button', class: `card${sel?.id === id ? (arrastrando ? ' hueco' : ' sel') : ''}`, 'data-juego': id, 'aria-pressed': String(sel?.id === id), onClick: () => tocarFuera(id),
    }, el('span', { class: con('em', JUEGOS_COPA[id].emoji) }, JUEGOS_COPA[id].emoji), el('span', { class: 't' }, JUEGOS_COPA[id].nombre))));
    mano.classList.toggle('dim', sel?.zona === 'fuera');
    linea.classList.toggle('blanco', sel?.zona === 'fuera');
    vista().forEach((id, i) => {
      if (ranuraSirve(i)) linea.append(ranura(i));
      linea.append(el('button', {
        type: 'button', class: `event${sel?.id === id ? (arrastrando ? ' hueco' : ' sel') : ''}`, 'data-dia': i, 'data-juego': id, 'data-clave': `${moviendo() ? 'm' : 'r'}${i}`,
        'aria-pressed': String(sel?.id === id), onClick: () => tocarDia(i),
      }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: i + 1 })), el('span', { class: con('em', JUEGOS_COPA[id].emoji) }, JUEGOS_COPA[id].emoji), nombreJ(id),
      el('span', { class: 'agarre', 'aria-hidden': 'true' }, '⠿')));
    });
    if (ranuraSirve(dias().length)) linea.append(ranura(dias().length));
    linea.append(el('div', { class: 'event fija' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: cal.length })),
      el('span', { class: 'em' }, JUEGOS_COPA.final.emoji), nombreJ('final', T.gamesFinal)));
    marcar();
    pintarVariantes();
    const ayuda = !sel ? 'nada' : arrastrando ? `arr-${sel.zona}` : sel.zona;
    estado.querySelectorAll('[data-ayuda]').forEach(x => x.classList.toggle('oculta', x.dataset.ayuda !== ayuda));
  }
  const sortear = n => { cal = calendarioAlAzar(n, { familia }); sel = null; pintar(); };

  // Below the week, one row per game of the week that has variants (D-331): the admin picks which
  // one everybody plays that day. Not inside the day's card, which is a button that is dragged.
  const cajaVariantes = el('div', { class: 'cal-variantes', id: 'cal-variantes' });
  function pintarVariantes() {
    const conV = dias().map((id, i) => ({ id, i })).filter(x => VARIANTES[x.id]);
    cajaVariantes.replaceChildren();
    cajaVariantes.hidden = !conV.length;
    if (!conV.length) return;
    cajaVariantes.append(el('div', { class: 'field' }, el('label', {}, T.gamesVariants), el('small', { class: 'muted' }, T.gamesVariantsHint)));
    for (const { id, i } of conV) {
      const J = JUEGOS_COPA[id];
      const o = opciones(opcionesVariante(J, VARIANTES[id]),
        v => { variantes[id] = v; }, { inicial: variantes[id] || VARIANTES[id][0] });
      o.nodo.classList.add('dos', 'variantes');
      o.nodo.dataset.variantes = id;
      cajaVariantes.append(el('div', { class: 'cal-variante' },
        el('p', { class: 'cal-variante-t' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: i + 1 })), ' ', conEmoji(J.emoji, J.nombre)), o.nodo));
    }
  }

  const nodo = el('div', { class: 'panel', id: 'crear-juegos', hidden: true },
    el('div', { class: 'field' }, el('label', {}, T.fGames), el('small', { class: 'muted' }, T.gamesHint)), estado,
    el('div', { class: 'hand-title' }, el('b', {}, T.gamesOut)), mano,
    el('div', { class: 'line-wrap' }, linea),
    cajaVariantes,
    el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-azar', onClick: () => { SFX.tap(); sortear(cal.length); } }, T.gamesShuffle));

  // Arrastrar es elegir y soltar (D-85): el mismo estado al que se llega tocando. Nada se
  // confirma hasta Crear la copa.
  crearArrastre({
    fuentes: [
      { contenedor: mano, item: '.card', eje: 'vertical', nombre: 'fuera' },
      { contenedor: linea, item: '.event[data-dia]', eje: 'libre', nombre: 'dia' },
    ],
    activo: () => nodo.isConnected && !nodo.hidden,
    vibrar: vibrate,
    avatar: item => el('div', { class: 'vilo-carta' }, el('span', { class: con('em', JUEGOS_COPA[item.dataset.juego].emoji) }, JUEGOS_COPA[item.dataset.juego].emoji), el('span', { class: 't' }, JUEGOS_COPA[item.dataset.juego].nombre)),
    alAlzar: (item, zona) => {
      sel = { zona, id: item.dataset.juego }; destino = null; arrastrando = true; pintar();
    },
    medir: () => [...linea.querySelectorAll('.event[data-dia]')].map(x => {
      const r = x.getBoundingClientRect();
      return { clave: x.dataset.clave, y: r.top + r.height / 2 + window.scrollY };
    }),
    sobre: clave => { destino = clave; if (moviendo()) pintar(); else marcar(); },
    soltar: (clave, { cancelado }) => {
      if (!cancelado && clave) { aplicar(clave); SFX.tap(); }
      sel = null; destino = null; arrastrando = false; pintar();
    },
  });
  // Un toque fuera de la lista suelta lo elegido (C-8). Con la ruta del evento, no con
  // `contains`: el botón tocado ya se redibujó y quedó fuera del árbol.
  document.addEventListener('click', ev => { if (sel && nodo.isConnected && !ev.composedPath().includes(nodo)) { sel = null; pintar(); } });
  return { nodo, sortear, get cal() { return cal.map(id => entradaCal(id, variantes[id])); } };
}

/**
 * The new create screen (D-425), behind its flag (D-498). lab: #seccion-copa-crear
 * In the test c.store (`?test`) the scripts see the screen of before unless the URL says `&lab`.
 */
const formularioNuevo = () => (PRUEBA && !tiene('lab') ? Promise.resolve(false) : flag('copa-crear'));
/** Two cup games are a lighter version of a home page game: their tagline is that game's. */
const DE_PORTADA = { linea: 'linea-de-tiempo', numero: 'toque-y-fama' };
const juegoPortada = id => gameById(DE_PORTADA[id] || id);
const lemaDe = id => juegoPortada(id)?.tagline?.[LANG] || juegoPortada(id)?.tagline?.es || '';
/** A cup's day ('2026-10-23') in words, "jueves 23 de octubre". */
const fechaDia = f => fechaLarga(Date.parse(`${f}T12:00:00Z`), 'UTC');
/** Its day of the week, short and without the dot: "jue", "Thu", "qui", "Do". */
const diaCorto = f => new Intl.DateTimeFormat(LOCALE[LANG] || LOCALE.es, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`)).replace('.', '');

/**
 * The week of the new create screen (D-425): in view from the start, drawn by the 🎲 in one of the
 * week styles; the die draws the whole week again, with a short slot-machine roll on the cards (the
 * owner's review took the 🔒 locks out: a game
 * can still be changed or moved by hand). Tapping a game opens a sheet with the whole pool, each with its tagline: picking
 * one that is already in the week swaps the two days, and the sheet also moves the day and picks
 * its version. A day is still dragged by its ⠿ grip, as a shortcut (D-85: dragging is choosing).
 */
function armarSemana() {
  let dias = 7, cal = [], estilo = 'equilibrada', ultimo = 'equilibrada', sel = null, destino = null, arrastrando = false, capa = null;
  const variantes = {};
  // The skill is compared in Spanish: the same rules whatever the screen's language
  const familia = id => JUEGOS_COPA_ES[id].habilidad;
  const nuevos = POZO.filter(id => esNuevo(juegoPortada(id)));
  const estilos = Object.keys(ESTILOS_SEMANA).filter(e => e !== 'nuevo' || nuevos.length);
  // The 3-day cup has no final (D-438): its three days are all games of the pool
  const conFinal = () => !SIN_FINAL.includes(dias);
  const semana = () => (conFinal() ? cal.slice(0, -1) : [...cal]);
  const movido = k => { const d = semana(); d.splice(d.indexOf(sel), 1); d.splice(k, 0, sel); return d; };
  const vista = () => (arrastrando && destino ? movido(Number(destino.slice(1))) : semana());
  const nombreVariante = id => VARIANTES[id] && (JUEGOS_COPA[id].variantes?.[variantes[id] || VARIANTES[id][0]]?.nombre || '').replace(/^[\p{Extended_Pictographic}️‍]+\s*/u, '');

  const tirar = ({ animar = true } = {}) => {
    estilo = ultimo;
    cal = semanaAlAzar(dias, { familia, estilo, nuevos, final: conFinal() });
    pintar();
    if (animar) { aLaVista(); barajar(); }
  };
  /**
   * On a small phone the week starts below the 🎲 (the owner's request, D-425): if any day is out of
   * view, the page scrolls so the 🎲 sits at the top and the roll is seen.
   */
  function aLaVista() {
    const r = lista.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= innerHeight) return;
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: dado.getBoundingClientRect().top + scrollY - 12, behavior: suave ? 'smooth' : 'auto' });
  }
  /**
   * The roll, as a slot machine (the owner's request, D-425): each card runs through random games of
   * the pool and stops on its own, top to bottom, in under a second. The week is already drawn and
   * painted underneath (each card's `data-juego` is the real one), so a tap meanwhile acts on it.
   */
  let rueda = null;
  function barajar() {
    clearInterval(rueda);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cartas = [...lista.querySelectorAll('.semana-dia')].map(f => {
      const em = f.querySelector('.em'), b = f.querySelector('.semana-juego b'), small = f.querySelector('.semana-juego small');
      return { f, em, b, small, real: [em.textContent, em.className, b.textContent, small.textContent], quieta: false };
    });
    // Each card keeps the height of the game it lands on: a longer name passing by does not wrap
    // and push the rows below (it is cut on one line while it spins, C-8)
    cartas.forEach(c => { c.f.style.height = `${c.f.offsetHeight}px`; });
    const t0 = performance.now();
    const paso = () => {
      const t = performance.now() - t0;
      let giran = 0;
      cartas.forEach((c, i) => {
        if (c.quieta) return;
        if (t >= 300 + i * 90) {
          [c.em.textContent, c.em.className, c.b.textContent, c.small.textContent] = c.real;
          c.f.classList.remove('baraja'); c.f.style.height = ''; c.f.classList.add('cae'); c.quieta = true;
          return;
        }
        giran++;
        const G = JUEGOS_COPA[POZO[Math.floor(Math.random() * POZO.length)]];
        c.em.textContent = G.emoji; c.em.className = con('em', G.emoji); c.b.textContent = G.nombre; c.small.textContent = G.habilidad;
        c.f.classList.add('baraja');
      });
      if (!giran) clearInterval(rueda);
    };
    paso();
    rueda = setInterval(paso, 70);
  }
  /** A change by hand: the week no longer matches a style, and the die goes back to the last one. */
  const aMano = w => { cal = conFinal() ? [...w, 'final'] : [...w]; estilo = null; };

  const dado = el('button', { type: 'button', class: 'btn-dado', id: 'btn-dado', onClick: () => { SFX.tap(); vibrate(15); tirar(); } }, T.weekDice);
  const chips = el('div', { class: 'semana-estilos', id: 'semana-estilos', role: 'group', 'aria-label': T.weekStylesLabel });
  const lista = el('div', { class: 'semana-dias', id: 'semana-dias' });
  const finalFila = el('div', { class: 'semana-dia semana-final' });
  const mezcla = el('div', { class: 'semana-mezcla', id: 'semana-mezcla', 'aria-label': T.weekMix });

  function fila(id, i) {
    const J = JUEGOS_COPA[id];
    const sub = [J.habilidad, nombreVariante(id)].filter(Boolean).join(' · ');
    return el('div', { class: `semana-dia${arrastrando && sel === id ? ' hueco' : ''}${destino === `m${i}` ? ' on' : ''}`, 'data-dia': i, 'data-juego': id, 'data-clave': `m${i}` },
      el('span', { class: 'cab' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: i + 1 })), el('span', { class: con('em', J.emoji) }, J.emoji)),
      el('button', { type: 'button', class: 'semana-juego', onClick: () => { SFX.tap(); hoja(i); } }, el('b', {}, J.nombre), el('small', {}, sub)),
      el('span', { class: 'agarre', 'aria-hidden': 'true' }, '⠿'));
  }
  function pintar() {
    chips.replaceChildren(...estilos.map(e => el('button', {
      type: 'button', class: 'estilo' + (estilo === e ? ' on' : ''), 'data-estilo': e, 'aria-pressed': String(estilo === e),
      onClick: () => { SFX.tap(); ultimo = e; tirar(); },
    }, T.weekStyles[e])));
    lista.replaceChildren(...vista().map(fila));
    finalFila.hidden = !conFinal();
    finalFila.replaceChildren(el('span', { class: 'cab' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: cal.length })), el('span', { class: 'em' }, JUEGOS_COPA.final.emoji)),
      el('span', { class: 'semana-juego' }, el('b', {}, JUEGOS_COPA.final.nombre), el('small', {}, fmt(T.weekFinal, { n: cal.length - 1 }))));
    const cuenta = {};
    for (const id of semana()) (cuenta[familia(id)] ||= { n: 0, nombre: JUEGOS_COPA[id].habilidad }).n++;
    // More than two of one skill is marked, unless the style asked for it (Puzzles, Trivia and words)
    const tema = estilo && ESTILOS_SEMANA[estilo];
    mezcla.replaceChildren(...Object.values(cuenta).sort((a, b) => b.n - a.n).map(x => el('span', { class: x.n > 2 && !tema ? 'muchas' : '' }, `${x.n} ${x.nombre}`)));
  }

  const cerrarHoja = () => { capa?.remove(); capa = null; document.removeEventListener('keydown', alEscape); };
  const alEscape = ev => { if (ev.key === 'Escape') cerrarHoja(); };
  function hoja(i) {
    cerrarHoja();
    const w = semana(), actual = w[i], J = JUEGOS_COPA[actual];
    const listo = () => { cerrarHoja(); pintar(); };
    const mover = (d, texto) => {
      const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'data-mover': d, onClick: () => { SFX.tap(); const x = semana(); [x[i], x[i + d]] = [x[i + d], x[i]]; aMano(x); listo(); } }, texto);
      b.disabled = i + d < 0 || i + d >= w.length;
      return b;
    };
    const version = VARIANTES[actual] ? (() => {
      const o = opciones(opcionesVariante(J, VARIANTES[actual]), v => { variantes[actual] = v; pintar(); }, { inicial: variantes[actual] || VARIANTES[actual][0] });
      o.nodo.classList.add('dos', 'variantes');
      return el('div', { class: 'field' }, el('label', {}, T.weekVariant), o.nodo);
    })() : null;
    const juegos = POZO.map(id => {
      const k = w.indexOf(id), G = JUEGOS_COPA[id];
      const etiqueta = id === actual ? T.weekThisDay : k >= 0 ? fmt(T.weekOtherDay, { d: k + 1 }) : nuevos.includes(id) ? T.weekNew : '';
      return el('button', {
        type: 'button', class: 'hoja-juego' + (id === actual ? ' actual' : ''), 'data-juego': id, 'aria-pressed': String(id === actual),
        onClick: () => {
          SFX.tap();
          if (id !== actual) { const x = semana(); if (k >= 0) x[k] = actual; x[i] = id; aMano(x); }
          listo();
        },
      }, el('span', { class: con('em', G.emoji) }, G.emoji), el('span', { class: 't' }, el('b', {}, G.nombre), el('small', {}, lemaDe(id))),
      etiqueta ? el('span', { class: 'etiqueta' + (k < 0 && id !== actual ? ' nueva' : '') }, etiqueta) : null);
    });
    const cerrar = el('button', { type: 'button', class: 'btn btn--yellow btn--sm hoja-listo', id: 'hoja-listo', onClick: () => { SFX.tap(); cerrarHoja(); } }, T.weekClose);
    capa = el('div', { class: 'hoja-capa', id: 'semana-hoja' },
      el('div', { class: 'hoja-fondo', onClick: () => cerrarHoja() }),
      el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-label': fmt(T.gamesDay, { d: i + 1 }) },
        el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
        el('div', { class: 'hoja-cabeza' }, el('h3', {}, fmt(T.gamesDay, { d: i + 1 }), ' · ', ...conEmoji(J.emoji, J.nombre)), cerrar),
        el('div', { class: 'hoja-mover' }, mover(-1, T.weekEarlier), mover(1, T.weekLater)),
        version,
        el('div', { class: 'field' }, el('label', {}, T.weekSwap)),
        el('div', { class: 'hoja-juegos' }, juegos)));
    document.body.append(capa);
    document.addEventListener('keydown', alEscape);
    cerrar.focus({ preventScroll: true });
  }

  const titulo = el('b', { class: 'semana-titulo' }, T.weekTitle);
  const nodo = el('div', { class: 'panel', id: 'crear-semana' },
    el('div', { class: 'semana-cabeza' }, titulo, dado),
    chips, lista, finalFila, mezcla, el('small', { class: 'muted semana-ayuda' }, T.weekHint));

  // Dragging a day is choosing where it goes (D-85), the same as the sheet's arrows
  crearArrastre({
    fuentes: [{ contenedor: lista, item: '.semana-dia', eje: 'libre', nombre: 'dia' }],
    activo: () => nodo.isConnected && !capa,
    vibrar: vibrate,
    avatar: item => el('div', { class: 'vilo-carta' }, el('span', { class: con('em', JUEGOS_COPA[item.dataset.juego].emoji) }, JUEGOS_COPA[item.dataset.juego].emoji), el('span', { class: 't' }, JUEGOS_COPA[item.dataset.juego].nombre)),
    alAlzar: item => { sel = item.dataset.juego; destino = null; arrastrando = true; pintar(); },
    medir: () => [...lista.querySelectorAll('.semana-dia')].map(x => {
      const r = x.getBoundingClientRect();
      return { clave: x.dataset.clave, y: r.top + r.height / 2 + window.scrollY };
    }),
    sobre: clave => { destino = clave; pintar(); },
    soltar: (clave, { cancelado }) => {
      if (!cancelado && clave && clave !== `m${semana().indexOf(sel)}`) { aMano(movido(Number(clave.slice(1)))); SFX.tap(); }
      sel = null; destino = null; arrastrando = false; pintar();
    },
  });
  tirar({ animar: false });
  return {
    nodo,
    get cal() { return cal.map(id => entradaCal(id, variantes[id])); },
    /** The 3-day cup (D-437): another length, another week with no final (D-438), and the title says "The 3 days". */
    dias(n) { dias = n; titulo.textContent = n === 7 ? T.weekTitle : fmt(T.weekTitleDays, { n }); tirar({ animar: false }); },
  };
}

/**
 * The weekend cup's three days (D-439): three games a day, drawn at random from the pool with no
 * game twice, and 🎲 draws them again. Each day is played as one, like the Grand Final's rounds.
 */
function armarFinde() {
  const familia = id => JUEGOS_COPA_ES[id].habilidad;
  let cal = findeAlAzar({ familia });
  const lista = el('div', { class: 'semana-dias', id: 'finde-dias' });
  const pintar = () => lista.replaceChildren(...cal.map((x, i) => {
    const ids = x.split(TRIO_SEP).map(y => diaDeCal(y).id);
    return el('div', { class: 'semana-dia finde-dia', 'data-dia': i, 'data-juegos': ids.join(',') },
      el('span', { class: 'cab' }, el('span', { class: 'y' }, fmt(T.gamesDay, { d: i + 1 })), el('span', { class: 'em' }, JUEGOS_COPA.trio.emoji)),
      el('span', { class: 'semana-juego' }, ...ids.map(id => el('small', { class: 'finde-juego' }, `${JUEGOS_COPA[id].emoji} ${JUEGOS_COPA[id].nombre}`))));
  }));
  const dado = el('button', { type: 'button', class: 'btn-dado', id: 'btn-dado-finde', onClick: () => { SFX.tap(); vibrate(15); cal = findeAlAzar({ familia }); pintar(); } }, T.weekDice);
  const nodo = el('div', { class: 'panel', id: 'crear-finde', hidden: true },
    el('div', { class: 'semana-cabeza' }, el('b', { class: 'semana-titulo' }, fmt(T.weekTitleDays, { n: 3 })), dado),
    lista, el('small', { class: 'muted semana-ayuda' }, JUEGOS_COPA.trio.puntaje));
  pintar();
  return { nodo, get cal() { return [...cal]; } };
}

async function pantallaCrearCopa({ nombreInicial = '' } = {}) {
  const nuevo = await formularioNuevo();
  mostrar('crear');
  const body = $('#crear-body');
  body.innerHTML = '';
  const err = el('div', { class: 'form-error', role: 'alert' });
  const nombre = campo(T.fCopa, { placeholder: T.fCopaPh, maxlength: String(COPA_MAX) }, { contador: true });
  // From an archived cup's memorial (D-476): the same name, ready to change
  if (nombreInicial) { nombre.input.value = String(nombreInicial).slice(0, COPA_MAX); nombre.input.dispatchEvent(new Event('input')); }
  // On the screen of before, the 3-day cup is offered only with ?three or in the test c.store (D-100).
  // The new screen (D-425, a lab key) offers it always, next to the start (D-437), and starts at seven days.
  const juegos = nuevo ? armarSemana() : elegirJuegos();
  // The weekend cup (D-439), offered on both screens while `FINDE_HASTA` allows (closed since the owner's one-off cup): it takes the plain
  // 3-day cup's place on the new screen while it is offered
  // Only in Spanish for now (the owner's request): offered on a Spanish screen, and its words in Spanish
  // Closed once the owner's cup was made; the test c.store still offers it with `&weekend=on`
  const finde = LANG === 'es' && (findeAbierto(Date.now()) || (PRUEBA && param('weekend') === 'on')) ? armarFinde() : null;
  const diasDe = v => (v === 'finde' ? 3 : v);
  const modo = opciones([
    finde ? { valor: 'finde', titulo: T.modeWeekend, sub: T.modeWeekendSub } : null,
    (nuevo && !finde) || TRES ? { valor: 3, titulo: T.mode3, sub: T.mode3Sub } : null,
    { valor: 7, titulo: T.mode7, sub: T.mode7Sub },
  ].filter(Boolean), v => {
    if (finde) finde.nodo.hidden = v !== 'finde';
    // The weekend cup's words are always Spanish: its language field is not asked
    campoIdioma.hidden = v === 'finde';
    juegos.nodo.hidden = v === 'finde';
    if (v === 'finde') { fechas(); return; }
    if (nuevo) { juegos.dias(v); fechas(); return; }
    juegos.sortear(v);
  }, { inicial: nuevo ? 7 : null });
  // El idioma de las palabras de Conexiones y de Palabra (D-170): parte en el de quien la crea
  const mayuscula = x => x[0].toUpperCase() + x.slice(1);
  // La hora de la copa sigue al idioma de sus palabras (D-194): en alemán, la de Europa central
  const notaZona = el('small', { class: 'muted', id: 'crear-zona' }, fmt(T.startZone, { zona: zonaTexto(zonaDeIdioma(LANG)) }));
  const idioma = opciones(LANGS.map(l => ({ valor: l, titulo: mayuscula(T.langNames[l]) })),
    l => { notaZona.textContent = fmt(T.startZone, { zona: zonaTexto(zonaDeIdioma(l)) }); resumir(); fechas(); }, { inicial: LANG });
  // El público (D-187): global, Chile o Brasil. Parte en el del idioma de quien la crea
  const PUBLICOS = { global: T.audGlobal, cl: T.audCl, br: T.audBr };
  const alcance = opciones(Object.entries(PUBLICOS).map(([valor, titulo]) => ({ valor, titulo })), () => resumir(),
    { inicial: { es: 'cl', pt: 'br' }[LANG] || 'global' });
  alcance.nodo.classList.add('tres');
  // Hoy, mañana u otra fecha de un calendario, hasta 30 días desde hoy (D-115)
  const hoyCrear = fechaEn(Date.now(), zonaDeIdioma(idioma.valor));
  const otraFecha = campoFecha(hoyCrear);
  // On the new screen (D-425, the owner's review) Today is Now, and each says its day of the week: "Ahora (jue)"
  const conDia = (titulo, n) => (nuevo ? `${titulo} (${diaCorto(sumarDias(hoyCrear, n))})` : titulo);
  const inicio = opciones([{ valor: 0, titulo: conDia(nuevo ? T.startNow : T.startToday, 0) }, { valor: 1, titulo: conDia(T.startTomorrow, 1) }, { valor: 'otra', titulo: T.startOther }],
    v => { otraFecha.nodo.hidden = v !== 'otra'; if (v === 'otra') otraFecha.input.focus(); fechas(); });
  inicio.nodo.classList.add('tres');
  otraFecha.input.addEventListener('change', () => fechas());
  const yo = campo(T.fYou, { placeholder: T.fYouPh, maxlength: '20', value: cuenta.nombre.get() || leerYo()?.n || '' }, { contador: true });
  // The new screen asks for the PIN once, with 👁 to see it (D-425)
  const pin1 = campoPin(T.fPin), pin2 = nuevo ? null : campoPin(T.fPin2);
  if (nuevo) {
    const ojo = el('button', { type: 'button', class: 'ver-pin', id: 'ver-pin', 'aria-label': T.pinShow, 'aria-pressed': 'false' }, '👁');
    ojo.addEventListener('click', () => {
      const ver = pin1.input.type === 'password';
      pin1.input.type = ver ? 'text' : 'password';
      ojo.setAttribute('aria-pressed', String(ver)); ojo.setAttribute('aria-label', ver ? T.pinHide : T.pinShow);
    });
    const filaPin = el('div', { class: 'pin-fila' });
    pin1.input.replaceWith(filaPin);
    filaPin.append(pin1.input, ojo);
  }
  const boton = el('button', { class: 'btn btn--yellow', id: 'btn-crear-go' }, T.createGo);
  // Under the button, when the cup starts and ends, in words (D-425)
  const lineaFechas = el('small', { class: 'muted crear-fechas', id: 'crear-fechas', 'aria-live': 'polite' });
  function fechas() {
    if (!nuevo) return;
    const hoy = fechaEn(Date.now(), zonaDeIdioma(idioma.valor));
    const desde = inicio.valor === 'otra' ? (otraFecha.valida() ? otraFecha.input.value : null) : inicio.valor === null ? null : sumarDias(hoy, inicio.valor);
    lineaFechas.textContent = desde ? fmt(T.startsLine, { inicio: fechaDia(desde), fin: fechaDia(sumarDias(desde, diasDe(modo.valor) - 1)) }) : '';
  }
  // "More options", folded, says in one line what is chosen inside
  const resumen = el('small', { class: 'muted', id: 'crear-resumen' });
  function resumir() {
    const a = link.input.value.trim() ? `?${aliasLimpio(link.input.value)}` : T.moreNoLink;
    resumen.textContent = [mayuscula(T.langNames[idioma.valor]), PUBLICOS[alcance.valor], a].join(' · ');
  }
  // El link propio, opcional (D-121): se ve cómo queda y si está libre mientras se escribe
  const link = campo(T.fLink, { placeholder: T.fLinkPh, maxlength: '20', id: 'crear-link', autocapitalize: 'none', spellcheck: 'false' });
  const linkEstado = el('small', { class: 'muted link-estado', id: 'link-estado', 'aria-live': 'polite' }, T.fLinkHint);
  link.nodo.append(linkEstado);
  let linkTimer = null, linkLibre = null;
  const revisarLink = async () => {
    const a = aliasLimpio(link.input.value);
    linkLibre = null;
    if (!link.input.value.trim()) { linkEstado.textContent = T.fLinkHint; linkEstado.className = 'muted link-estado'; return; }
    const url = `juegosdesalon.cl/cup/?${a}`;
    if (!esAlias(a) || RESERVADAS.includes(a)) { linkEstado.textContent = fmt(T.fLinkBad, { url }); linkEstado.className = 'link-estado mal'; return; }
    linkEstado.textContent = fmt(T.fLinkChecking, { url }); linkEstado.className = 'muted link-estado';
    try {
      const st = await abrirStore(); await st.listo();
      const x = await st.alias(a);
      if (aliasLimpio(link.input.value) !== a) return;
      linkLibre = !(x && x.hasta > st.now());
      linkEstado.textContent = fmt(linkLibre ? T.fLinkFree : T.fLinkTaken, { url });
      linkEstado.className = 'link-estado ' + (linkLibre ? 'ok' : 'mal');
    } catch (_) { linkEstado.textContent = fmt(T.fLinkChecking, { url }); }
  };
  link.input.addEventListener('input', () => { clearTimeout(linkTimer); linkTimer = setTimeout(revisarLink, 350); resumir(); });

  boton.addEventListener('click', async () => {
    SFX.tap();
    const n = limpiarNombre(nombre.input.value, COPA_MAX), quien = limpiarNombre(yo.input.value);
    if (!n) return avisoError(err, T.errCopa);
    if (!modo.valor) return avisoError(err, nuevo || TRES || finde ? T.errMode : T.errMode7);
    if (inicio.valor === null) return avisoError(err, T.errStart);
    if (inicio.valor === 'otra' && !otraFecha.valida()) return avisoError(err, fmt(T.errStartDate, { n: MAX_DIAS_INICIO }));
    if (!quien) return avisoError(err, T.errNombre);
    const pinCrear = sinPinDeCopa() ? pinAlAzar() : pin1.input.value;
    if (!sinPinDeCopa()) {
      if (!esPin(pin1.input.value)) return avisoError(err, T.errPin);
      if (pin2 && pin1.input.value !== pin2.input.value) return avisoError(err, T.errPin2);
    }
    const alias = link.input.value.trim() ? aliasLimpio(link.input.value) : null;
    if (alias && (!esAlias(alias) || RESERVADAS.includes(alias))) { if (mas) mas.open = true; return avisoError(err, fmt(T.fLinkBad, { url: `juegosdesalon.cl/cup/?${alias}` })); }
    boton.disabled = true; boton.textContent = T.creating; err.textContent = '';
    try {
      const st = await abrirStore();
      await st.listo();
      let code = null;
      for (let i = 0; i < 8 && !code; i++) { const c = codigoAlAzar(); if (!(await st.existe(c))) code = c; }
      if (!code) throw Object.assign(new Error('busy'), { code: 'busy' });
      const pid = pidAlAzar();
      const now = st.now();
      if (alias) { const x = await st.alias(alias); if (x && x.hasta > now) throw Object.assign(new Error('alias'), { code: 'alias' }); }
      const zona = zonaDeIdioma(idioma.valor);
      const fechaInicio = inicio.valor === 'otra' ? otraFecha.input.value : sumarDias(fechaEn(now, zona), inicio.valor);
      // Las copas del laboratorio (y las de prueba) llevan la marca que deja pasar de día (D-115)
      const meta = nuevaMeta({ nombre: n, dias: diasDe(modo.valor), inicio: fechaInicio, tz: zona, admin: pid, creada: now, lab: LABS || PRUEBA, alias, cal: modo.valor === 'finde' ? finde.cal : juegos.cal, lang: modo.valor === 'finde' ? 'es' : idioma.valor, aud: alcance.valor });
      await st.crear(code, meta, { pid, name: quien, at: now, pinHash: await hashPin(code, pid, pinCrear), co: miPais() });
      cuenta.nombre.set(quien);
      cuenta.recordar(code, pid, { nombre: quien, copa: n, fin: meta.end });
      entrarComoJugador(quien, pinCrear);
      history.replaceState(null, '', `${location.pathname}?${alias || code}${PRUEBA ? '&test' : ''}`);
      await abrirCopa(code, { recienCreada: true });
    } catch (e) {
      avisoError(err, errorDe(e));
      boton.disabled = false; boton.textContent = T.createGo;
    }
  });

  const volver = el('button', { class: 'btn btn--ghost btn--sm', onClick: () => portada() }, '‹ ' + T.menu.replace('‹ ', ''));
  const campoIdioma = el('div', { class: 'field' }, el('label', {}, T.fLang), idioma.nodo, el('small', { class: 'muted' }, T.fLangHint));
  const campoAlcance = el('div', { class: 'field', id: 'crear-alcance' }, el('label', {}, T.fScope), alcance.nodo, el('small', { class: 'muted' }, T.fScopeHint));
  const mas = nuevo ? el('details', { class: 'panel mas-opciones', id: 'crear-mas' },
    el('summary', {}, el('span', { class: 'mas-t' }, T.moreOptions, resumen)),
    campoIdioma, campoAlcance, link.nodo) : null;
  resumir();
  if (nuevo) return poner(body,
    el('div', { class: 'panel' }, nombre.nodo,
      el('div', { class: 'field', id: 'crear-modo' }, el('label', {}, T.fMode), modo.nodo),
      el('div', { class: 'field' }, el('label', {}, T.fStart), inicio.nodo, otraFecha.nodo, notaZona)),
    juegos.nodo, finde?.nodo,
    el('div', { class: 'panel' }, yo.nodo, ...camposPin(pin1, pin2)),
    mas, err, boton, lineaFechas, volver);
  poner(body, 
    el('div', { class: 'panel' }, nombre.nodo,
      el('div', { class: 'field' }, el('label', {}, T.fMode), modo.nodo),
      el('div', { class: 'field' }, el('label', {}, T.fStart), inicio.nodo, otraFecha.nodo, notaZona)),
    juegos.nodo, finde?.nodo,
    el('div', { class: 'panel' }, campoIdioma, campoAlcance),
    el('div', { class: 'panel' }, link.nodo),
    el('div', { class: 'panel' }, yo.nodo, ...camposPin(pin1, pin2)),
    err, boton, volver,
  );
}
