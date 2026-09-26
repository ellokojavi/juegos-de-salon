/**
 * ⏳ Línea Relámpago — pantalla. Es la del modo solo de Línea de Tiempo (D-102): la mano que se
 * desplaza a lo ancho, la línea con sus ranuras, el arrastre compartido (arrastrar es elegir,
 * nunca colocar: D-85), el botón que dice qué carta coloca y el veredicto de cada jugada, con
 * el error que se queda hasta tocarlo y dice dónde iba la carta (C-8b). Los estilos son los de
 * assets/css/linea.css y los textos, los de Línea de Tiempo.
 *
 * Las jugadas son `{ c: id de la carta, at: ranura }`, en orden.
 */
import * as motor from './linea.js';
import { anioLabel as anioDeLaCopa } from './anio.js';
import { yearLabel } from '../../linea-de-tiempo/engine.js';
import { crearArrastre } from '../../assets/js/arrastre.js';
import { showHandoff } from '../../assets/js/handoff.js';
import { LOCALES as LT_LOCALES } from '../../linea-de-tiempo/rules.js';

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  // La copa va en español; el modo solo de Línea de Tiempo, en el idioma de quien juega
  const LT = LT_LOCALES[ctx.lang] || LT_LOCALES.es;
  const anioLabel = y => (ctx.lang && ctx.lang !== 'es' ? yearLabel(y, ctx.lang) : anioDeLaCopa(y));
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.filter(j => j && typeof j === 'object') : [];
  const sel = { carta: null, ranura: null };
  let arrastre = null;
  let previa = null;

  raiz.innerHTML = '';
  const estadoTxt = el('div', { class: 'sub' });
  const tituloMano = el('div', { class: 'hand-title' });
  const mano = el('div', { class: 'hand' });
  const linea = el('div', { class: 'line' });
  const fila = el('div', { class: 'place-row' });
  const cierre = el('div', { class: 'stack' });
  // En la final (cuatro cartas, la línea es corta) el cierre va debajo de la línea, después de
  // verla entera; en el día, arriba, para que se vea sin desplazar (C-8)
  const abajo = !!ctx.cierreAbajo;
  raiz.append(el('div', { class: 'lt-juego' },
    el('div', { class: 'status' }, el('div', { class: 'sub' }, `${p.temaEmoji} ${p.temaNombre}`), estadoTxt),
    abajo ? null : cierre, tituloMano, mano, el('div', { class: 'line-wrap' }, linea), fila, abajo ? cierre : null));

  const e = () => motor.estado(p, jugadas);
  const porId = id => p.mano.find(c => c.id === id) || (p.base.id === id ? p.base : null);

  /* ---------- Dibujo ---------- */

  const contenidoRanura = i => {
    const c = sel.carta ? porId(sel.carta) : null;
    return sel.ranura === i && c
      ? el('span', { class: 'ghost', 'data-card': c.id }, el('span', { class: 'y' }, '?'), el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c.texto))
      : el('span', {}, i === 0 ? LT.slotFirst : i === e().linea.length ? LT.slotLast : LT.slotBetween);
  };

  const marcarRanuras = () => {
    for (const d of linea.querySelectorAll('.slot')) {
      const i = +d.dataset.slot;
      d.classList.toggle('on', sel.ranura === i);
      d.replaceChildren(contenidoRanura(i));
    }
    linea.querySelectorAll('.event.vecino').forEach(x => x.classList.remove('vecino'));
  };

  const marcarMano = () => {
    mano.querySelectorAll('.card').forEach(b => b.classList.toggle('sel', b.dataset.card === sel.carta));
    mano.classList.toggle('dim', !!sel.carta);
  };

  const pintarConfirmar = () => {
    fila.innerHTML = '';
    if (e().fin) return;
    const c = sel.carta ? porId(sel.carta) : null;
    fila.append(el('button', { class: 'btn btn--yellow', id: 'btn-colocar', disabled: sel.ranura === null || !c, onClick: colocar },
      LT.place, c && sel.ranura !== null ? el('small', {}, `${c.emoji} ${c.texto}`) : null));
  };

  const marcarEstado = () => {
    const x = e();
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (x.fin) ctx.pararReloj?.(x);
    // Antes de la primera jugada no hay cuenta que dar: "vas 0 de 0" no dice nada
    estadoTxt.textContent = x.fin ? '' : (sel.carta ? LT.pickSlot : LT.pickCard) + (x.marcas.length ? ` · ${fmt(T.lineaLleva, { ok: x.aciertos, n: x.marcas.length })}` : '');
  };

  const repintar = () => { marcarMano(); marcarRanuras(); pintarConfirmar(); marcarEstado(); };

  const elegirRanura = i => { sel.ranura = sel.ranura === i ? null : i; SFX.tap(); vibrate(8); repintar(); };
  /** Toques de verdad eligen al apretar; el teclado y los guiones llegan como `click` con detail 0 (igual que Línea de Tiempo). */
  const conTeclado = accion => ev => { if (ev.detail !== 0) return; accion(); SFX.tap(); repintar(); };

  const dibujar = () => {
    if (arrastre && arrastre.activa()) return;
    const x = e();
    // La mano
    tituloMano.replaceChildren(el('b', {}, LT.yourHand), el('small', {}, fmt(T.lineaQuedan, { n: x.mano.length })));
    tituloMano.hidden = x.fin;
    mano.innerHTML = '';
    for (const c of x.mano) {
      mano.append(el('button', { class: 'card' + (sel.carta === c.id ? ' sel' : ''), 'data-card': c.id, onClick: conTeclado(() => { sel.carta = c.id; sel.ranura = null; }) },
        el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c.texto)));
    }
    mano.hidden = x.fin;
    // La línea, con sus ranuras mientras quede mano
    linea.innerHTML = '';
    const ranura = i => el('div', { class: 'slot' + (sel.ranura === i ? ' on' : ''), 'data-slot': i,
      onPointerdown: ev => { if (!sel.carta || ev.target.closest('.ghost')) return; elegirRanura(i); },
      onClick: conTeclado(() => { if (sel.carta) sel.ranura = sel.ranura === i ? null : i; }) }, contenidoRanura(i));
    if (!x.fin) linea.append(ranura(0));
    x.linea.forEach((c, i) => {
      linea.append(el('div', { class: 'event' + (c.ok === false ? ' fallo' : ''), 'data-ev': i, 'data-year': c.year },
        el('span', { class: 'y' }, anioLabel(c.year)), el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c.texto)));
      if (!x.fin) linea.append(ranura(i + 1));
    });
    // El cierre: el veredicto y el botón para seguir
    cierre.innerHTML = '';
    if (x.fin) {
      cierre.append(el('div', { class: 'aviso bien' }, fmt(T.lineaFin, { ok: x.aciertos, n: x.marcas.length })),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(x); } }, ctx.textoFin || T.seeResults));
    }
    marcarMano(); pintarConfirmar(); marcarEstado();
  };

  /* ---------- Colocar y el veredicto (el de Línea de Tiempo) ---------- */

  const donde = (antes, despues) => {
    const lbl = c => `<b>${anioLabel(c.year)}</b> · ${c.texto}`;
    if (antes && despues) return fmt(LT.between, { a: lbl(antes), b: lbl(despues) });
    if (despues) return fmt(LT.beforeOf, { b: lbl(despues) });
    return fmt(LT.afterOf, { a: lbl(antes) });
  };

  function colocar() {
    const antes = e().linea;
    const c = porId(sel.carta);
    const at = sel.ranura;
    const puesta = [antes[at - 1] || null, antes[at] || null];
    jugadas.push({ c: c.id, at });
    ctx.guardar(jugadas);
    sel.carta = null; sel.ranura = null;
    SFX.flip();
    const ult = e().historia[e().historia.length - 1];
    if (ult.ok) { SFX.reveal(); vibrate([30, 30]); } else { SFX.timeUp(); vibrate([120, 60, 120, 60, 200]); }
    const stage = el('div', { class: 'stage pop' },
      el('div', { class: 'verdict' },
        el('div', { class: 'big ' + (ult.ok ? 'ok' : 'no') }, ult.ok ? LT.correct : LT.wrong),
        el('div', { class: 'card-big' }, el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c.texto), el('span', { class: 'y' }, anioLabel(c.year))),
        ult.ok ? null : el('div', { class: 'why', html: `${fmt(LT.whyWrong, { year: `<b>${anioLabel(c.year)}</b>`, where: donde(...ult.entre) })}<br>${fmt(LT.wherePlaced, { where: donde(...puesta) })}` })),
      el('div', { class: 'hint', style: 'margin-top:14px' }, (ult.ok ? LT.hoContinue : LT.tapContinue) + ' ›'));
    const siguiente = showHandoff([stage], () => dibujar());
    // El error se queda hasta tocarlo; el acierto se cierra solo (C-8b)
    setTimeout(() => document.getElementById('handoff').classList.toggle('bad', !ult.ok), 0);
    // Solo cierra su propio aviso: si ya hay otro (un error jugando rápido), se queda (C-8b)
    if (ult.ok) setTimeout(() => { if (stage.isConnected && !document.getElementById('handoff').hidden) siguiente(); }, 1400);
  }

  /* ---------- Arrastrar (D-85) ---------- */

  arrastre = crearArrastre({
    fuentes: [
      { contenedor: mano, item: '.card', eje: 'vertical', nombre: 'mano' },
      { contenedor: linea, item: '.ghost', eje: 'libre', nombre: 'linea' },
    ],
    activo: () => !e().fin && document.getElementById('handoff').hidden && raiz.isConnected,
    vibrar: vibrate,
    avatar: item => {
      const c = porId(item.dataset.card);
      return el('div', { class: 'vilo-carta' }, el('span', { class: 'em' }, c.emoji), el('span', { class: 't' }, c.texto), el('span', { class: 'y' }, '?'));
    },
    medir: () => [...linea.querySelectorAll('.slot')].map(s => {
      const r = s.getBoundingClientRect();
      return { clave: +s.dataset.slot, y: r.top + r.height / 2 + window.scrollY };
    }),
    sobre: clave => {
      if (sel.ranura === clave) return;
      sel.ranura = clave; repintar();
      if (clave === null) return;
      for (const i of [clave - 1, clave]) linea.querySelector(`.event[data-ev="${i}"]`)?.classList.add('vecino');
    },
    apretar: (item, nombre) => {
      if (nombre !== 'mano') return;
      previa = { ...sel };
      sel.carta = item.dataset.card; sel.ranura = null;
      SFX.tap(); vibrate(8); repintar();
    },
    alAlzar: (item, nombre) => {
      if (nombre === 'linea') { previa = { ...sel }; sel.ranura = null; repintar(); }
      mano.querySelector(`.card[data-card="${item.dataset.card}"]`)?.classList.add('hueco');
    },
    abandonar: () => { if (previa) { Object.assign(sel, previa); repintar(); } },
    toque: (item, nombre) => { if (nombre === 'linea') { sel.ranura = null; SFX.tap(); vibrate(8); repintar(); } },
    soltar: (clave, { nombre, cancelado }) => {
      if (cancelado) { if (previa) Object.assign(sel, previa); }
      else if (clave === null) { sel.ranura = null; if (nombre === 'linea') sel.carta = null; }
      else { sel.ranura = clave; SFX.tap(); vibrate(12); }
      previa = null;
      mano.querySelectorAll('.card.hueco').forEach(b => b.classList.remove('hueco'));
      repintar();
    },
  });

  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
