/**
 * 🕵️ Agentes: the screen, for a La Copa day, its trial session, Uno al día and the standalone page
 * /agents/ (D-421; it came from the lab, D-286). Inspired by Codenames (Vlaada Chvátil, Czech Games
 * Edition): a one-player version where the game gives the clues and you guess.
 *
 * The moves are the whole game: `{ jugadas: [{ i } | { pasar: true }], marcas: { i: 'sospecha'|'descarte' } }`,
 * and the state is rebuilt from the day's board and them (C-7), so a cup day resumes where it was.
 * When the last clue closes, the cards nobody touched turn over one by one, the end's stamp falls,
 * and "See result" opens the cup's result screen; the cup clock stops right there (D-130).
 */
import { el, confetti } from '../../../assets/js/ui.js';
import { LONG_PRESS_MS } from '../../../assets/js/teclado.js';   // the long press of Toque y Fama's notes
import { estado, puntaje, base, tarjeta, RESTA_NEUTRAL, RESTA_ASESINO } from './engine.js';
import TEXTOS from './texts.js';

const CODENAMES = 'https://czechgames.com/en/codenames/';
const quieto = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const espera = ms => new Promise(r => setTimeout(r, ms));
/** The stamp under the name speaks the page's language: `titulo` gets no texts. */
const sello = () => (TEXTOS[document.documentElement.lang] || TEXTOS.es).ui.agStamp;

/** The name in the waiting room, with the Classified stamp over its corner (the 🕵️ is already above it). */
export function titulo({ el: h = el, J }) {
  return h('div', { class: 'ag-titulo-sello' },
    h('h2', { class: 'ag-titulo' }, h('span', { class: 'display display--lg rainbow' }, J.nombre)),
    h('span', { class: 'ag-sello ag-sello--rojo ag-sello--titulo' }, sello()));
}

/** The word appears decoding itself: random letters that settle from left to right. */
function descifrar(nodo, palabra, ms = 650) {
  if (quieto()) { nodo.textContent = palabra; return Promise.resolve(); }
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const t0 = performance.now();
  return new Promise(listo => {
    const paso = ahora => {
      const fijas = Math.floor(palabra.length * Math.min(1, (ahora - t0) / ms));
      nodo.textContent = [...palabra].map((c, i) => (i < fijas || c === ' ' ? c : ABC[Math.floor(Math.random() * ABC.length)])).join('');
      if (fijas < palabra.length) requestAnimationFrame(paso); else listo();
    };
    requestAnimationFrame(paso);
  });
}

/**
 * The how-to drawing plays by itself: a clue arrives, the magnifier finds its 3 agents and at the end
 * the assassin, which looks like the clue, turns over. Then another clue. With reduced motion, the
 * first one stays, solved. Under it, the credit to Codenames with its link (the owner's request).
 */
export function ejemplo({ el: h = el, T }) {
  const DEMO = T.agDemo;
  const palabra = h('span', { class: 'dp-palabra' }, DEMO[0].pista);
  const cartas = DEMO[0].cartas.map(w => h('span', { class: 'ag-dc' }, w));
  const lupa = h('span', { class: 'ag-demo-lupa' }, '🔍');
  const demo = h('div', { class: 'ag-demo', 'aria-hidden': 'true' },
    h('div', { class: 'ag-demo-pista' }, palabra, ' · ', h('b', {}, '3')),
    h('div', { class: 'ag-demo-cartas' }, ...cartas, lupa));
  const [a, b] = String(T.agCredit).split('{juego}');
  const caja = h('div', { class: 'ag-ejemplo' }, demo,
    h('p', { class: 'ag-credito', id: 'ag-credito' }, a, h('a', { href: CODENAMES, target: '_blank', rel: 'noopener', id: 'link-codenames' }, 'Codenames'), b || ''));
  const asesino = (d, i) => { cartas[i].classList.add('asesino'); cartas[i].textContent = `💀 ${d.cartas[i]}`; };
  if (quieto()) {
    DEMO[0].agentes.forEach(i => cartas[i].classList.add('agente'));
    asesino(DEMO[0], DEMO[0].asesino);
    return caja;
  }
  // It goes on while it is on screen: a redrawn waiting room (another language) leaves it behind
  const sigue = () => caja.isConnected;
  const ronda = async d => {
    cartas.forEach((c, i) => { c.className = 'ag-dc'; c.textContent = d.cartas[i]; });
    lupa.classList.remove('ve');
    await descifrar(palabra, d.pista);
    for (const i of d.agentes) {
      if (!sigue()) return;
      lupa.style.left = `${cartas[i].offsetLeft + cartas[i].offsetWidth / 2}px`;
      lupa.style.top = `${cartas[i].offsetTop + cartas[i].offsetHeight / 2}px`;
      lupa.classList.add('ve');
      await espera(650);
      cartas[i].classList.add('agente', 'volteo');
      await espera(350);
    }
    lupa.classList.remove('ve');
    await espera(500);
    if (!sigue()) return;
    asesino(d, d.asesino);
    cartas[d.asesino].classList.add('volteo');
    await espera(2200);
  };
  (async () => {
    await espera(300);
    for (let k = 0; sigue(); k++) { await ronda(DEMO[k % DEMO.length]); await espera(200); }
  })();
  return caja;
}

/** A red flash over the whole screen: the assassin, or a mission that failed. */
function destello() {
  if (quieto()) return;
  const x = el('div', { class: 'ag-destello', 'aria-hidden': 'true' });
  document.body.append(x);
  setTimeout(() => x.remove(), 800);
}

/** The end's face: accomplished (70 or more), half done, or failed (the assassin, or under 35). */
const caraDe = e => { const s = puntaje(e); return s >= 70 ? 'victoria' : e.asesino ? 'asesino' : s < 35 ? 'fracaso' : 'medias'; };

export function montar(raiz, ctx) {
  const { p: t, T, fmt, SFX, vibrate } = ctx;
  // The save: the moves and the marks. A plain list is the moves alone
  const previa = Array.isArray(ctx.jugadas) ? { jugadas: ctx.jugadas } : ctx.jugadas || {};
  const P = { jugadas: (previa.jugadas || []).filter(j => j && (j.pasar || t.cartas[j.i])), marcas: new Map(Object.entries(previa.marcas || {}).map(([i, m]) => [Number(i), m])), marcadas: previa.marcadas || 0 };
  const guardar = () => ctx.guardar({ jugadas: P.jugadas.slice(), marcas: Object.fromEntries(P.marcas), marcadas: P.marcadas });
  /** The state the cup keeps: plain data (no Set), with the card and the trap already worked out. */
  const final = () => {
    const e = estado(t, P.jugadas), as = t.cartas.findIndex(c => c.tipo === 'asesino');
    return {
      encontrados: e.encontrados, total: e.total, neutrales: e.neutrales, asesino: e.asesino, marcadas: P.marcadas,
      tarjeta: tarjeta(t, e), trampa: as >= 0 && t.pistas[t.cartas[as].tienta] ? { w: t.cartas[as].w, p: t.pistas[t.cartas[as].tienta].pista } : null,
    };
  };
  // The hook for the end-to-end tests: the board, the state and the moves
  window.__agentes = { t, P, estado: () => estado(t, P.jugadas) };

  const aviso = el('p', { class: 'ag-aviso', 'aria-live': 'polite' }, '');
  const caja = el('div', { class: 'ag-pista', id: 'ag-pista' });
  const botones = el('div', { class: 'ag-botones' });
  const ayuda = el('p', { class: 'muted ag-ayuda', id: 'ag-ayuda' }, T.agMarksHelp);
  ayuda.hidden = P.marcadas > 0;
  const decir = (clase, texto) => { aviso.className = `ag-aviso ${clase}`; aviso.textContent = texto; };
  // A long press marks the card without turning it over: nothing → 📌 → 🚫 → nothing. The tap that follows does not turn it over
  const cartas = t.cartas.map((c, i) => {
    let reloj = null, largo = false;
    // While it is held, a border fills: a mark is coming, not a reveal
    const corta = () => { if (reloj) { clearTimeout(reloj); reloj = null; } cartas[i]?.classList.remove('apretando'); };
    return el('button', {
      type: 'button', class: 'ag-carta', 'data-i': i, style: `--n:${c.w.length};--largo:${LONG_PRESS_MS}ms`,
      onClick: () => { if (largo) { largo = false; return; } tocar(i); },
      onPointerdown: () => {
        largo = false;
        if (!cartas[i].disabled) cartas[i].classList.add('apretando');
        reloj = setTimeout(() => { reloj = null; largo = true; cartas[i].classList.remove('apretando'); marcar(i); }, LONG_PRESS_MS);
      },
      onPointerup: corta, onPointerleave: corta, onPointercancel: corta,
      onContextmenu: ev => ev.preventDefault(),
    }, c.w);
  });
  const tablero = el('div', { class: 'ag-tablero', id: 'ag-tablero', 'data-tablero': 'agentes' }, ...cartas);
  const marcar = i => {
    if (estado(t, P.jugadas).tocadas.has(i) || cartas[i].disabled) return;
    const m = P.marcas.get(i);
    if (!m) P.marcas.set(i, 'sospecha'); else if (m === 'sospecha') P.marcas.set(i, 'descarte'); else P.marcas.delete(i);
    P.marcadas++;
    vibrate([30, 40, 30]); SFX.dice();
    decir('marca', { sospecha: T.agMarkSuspect, descarte: T.agMarkDiscard }[P.marcas.get(i)] || T.agMarkNone);
    ayuda.hidden = true;
    guardar();
    dibujar();
  };

  let antes = -1, confirmando = false, revelando = false;
  const dibujar = () => {
    const e = estado(t, P.jugadas);
    cartas.forEach((b, i) => {
      const c = t.cartas[i], tocada = e.tocadas.has(i);
      b.disabled = tocada || e.fin;
      const m = !tocada && P.marcas.get(i);
      // Each agent takes its clue's color; those of clues already closed dim: they no longer count
      const grupo = tocada && c.tipo === 'agente' ? ` g${c.p}${e.fin || c.p >= e.actual ? '' : ' cerrada'}` : '';
      b.className = 'ag-carta' + (tocada ? ` ${c.tipo}` : '') + grupo + (m ? ` marca-${m}` : '');
      if (tocada && c.tipo === 'asesino') b.textContent = `💀 ${c.w}`;
      b.setAttribute('aria-label', c.w + (m === 'sospecha' ? ` ${T.agSuspectLabel}` : m === 'descarte' ? ` ${T.agDiscardLabel}` : ''));
    });
    if (e.fin) return revelar(e);
    // A new clue arrives turning and its word decodes. The notice of how the last one ended stays
    // until the next tap: the stamp lasts a second and cannot be read
    const nueva = e.actual !== antes;
    if (nueva) { caja.className = `ag-pista g${e.actual}`; void caja.offsetWidth; caja.classList.add('entra'); antes = e.actual; }
    const p = t.pistas[e.actual];
    const palabra = el('span', { class: 'ag-pp' }, p.pista);
    caja.replaceChildren(
      el('p', { class: 'ag-de' }, fmt(T.agClue, { n: e.actual + 1, t: t.pistas.length })),
      el('p', { class: 'ag-palabra' }, palabra, ' · ', el('b', {}, String(p.n))),
      el('p', { class: 'ag-falta' }, e.faltan === 1 ? T.agMissingOne : fmt(T.agMissing, { n: e.faltan })));
    const ultima = e.actual === t.pistas.length - 1;
    confirmando = false;
    // Finishing leaves agents unfound and cannot be undone: the first tap says how many are left (U-15)
    const boton = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-pasar', onClick: () => {
      SFX.tap();
      if (ultima && !confirmando) {
        confirmando = true;
        const quedan = e.total - estado(t, P.jugadas).encontrados;
        decir('', quedan === 1 ? T.agLeftOne : fmt(T.agLeft, { n: quedan }));
        boton.textContent = T.agFinishSure;
        return;
      }
      P.jugadas.push({ pasar: true }); guardar(); decir('', ''); cerrarPista('pasada');
    } }, ultima ? T.agFinish : T.agPass);
    botones.replaceChildren(boton);
    if (nueva) descifrar(palabra, p.pista);
  };
  // When a clue closes a stamp falls on it (Complete, Cut or Skipped), it turns away and the next one comes
  const cerrarPista = motivo => {
    cartas.forEach(b => { b.disabled = true; });
    botones.querySelector('button')?.setAttribute('disabled', '');
    caja.append(el('span', { class: `ag-sello ag-sello--pista ag-sello--${motivo === 'completa' ? 'verde' : motivo === 'cortada' ? 'rojo' : 'amarillo'}` },
      { completa: T.agSealDone, cortada: T.agSealCut, pasada: T.agSealPassed }[motivo]));
    if (motivo === 'completa') SFX.reveal(); else if (motivo === 'pasada') SFX.pass();
    setTimeout(() => {
      if (!raiz.isConnected) return;
      if (estado(t, P.jugadas).fin) return dibujar();
      caja.classList.remove('entra'); caja.classList.add('sale');
      setTimeout(dibujar, quieto() ? 0 : 280);
    }, 800);
  };
  // At the end the clock stops (D-130), the cards nobody touched turn over one by one, and then the end
  const revelar = e => {
    if (revelando) return;
    revelando = true;
    ctx.pararReloj?.(final());
    botones.replaceChildren();
    const quedan = cartas.map((b, i) => i).filter(i => !e.tocadas.has(i));
    quedan.forEach((i, k) => setTimeout(() => {
      const c = t.cartas[i];
      cartas[i].className = `ag-carta ${c.tipo}${c.tipo === 'agente' ? ` g${c.p}` : ''} sin-tocar${quieto() ? '' : ' volteo'}`;
      if (c.tipo === 'asesino') cartas[i].textContent = `💀 ${c.w}`;
    }, quieto() ? 0 : 120 * k));
    if (quedan.length) SFX.flip();
    setTimeout(() => { if (raiz.isConnected) fin(e); }, (quieto() ? 0 : 120 * quedan.length) + 900);
  };
  /** The end: its stamp, the trap explained, the whole board with each card's clue, and "See result". */
  const fin = e => {
    const cara = caraDe(e), mal = cara === 'asesino' || cara === 'fracaso';
    if (mal) { SFX.hang(); destello(); } else SFX.win();
    if (!quieto() && cara === 'victoria') confetti({ count: 180, duration: 2600 });
    const f = final();
    // Under every card what it was: an agent, its clue; the assassin and the neutrals, the clue they looked like
    t.cartas.forEach((c, i) => {
      const de = c.tipo === 'agente' ? t.pistas[c.p].pista : t.pistas[c.tienta] ? fmt(T.agTempts, { p: t.pistas[c.tienta].pista }) : null;
      if (de) cartas[i].append(el('span', { class: 'ag-de-pista' }, de));
    });
    caja.remove(); aviso.remove(); ayuda.remove();
    raiz.firstChild.prepend(el('div', { class: 'ag-fin' },
      el('h2', { class: `ag-sello-fin ag-sello-fin--${mal ? 'mal' : cara}`, id: 'ag-sello-fin' }, { victoria: T.agEndWin, medias: T.agEndHalf, fracaso: T.agEndFail, asesino: T.agEndAssassin }[cara]),
      f.trampa ? el('p', { class: `ag-trampa${e.asesino ? ' ag-trampa--mal' : ''}`, id: 'ag-trampa' }, fmt(e.asesino ? T.agTrapHit : T.agTrapDodged, f.trampa)) : null));
    botones.replaceChildren(el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(final()); } }, ctx.textoFin || T.seeResults));
  };
  const tocar = i => {
    const e0 = estado(t, P.jugadas);
    if (e0.fin || e0.tocadas.has(i)) return;
    // A ruled-out card is not turned over by mistake: it shakes, like a crossed-out key
    if (P.marcas.get(i) === 'descarte') {
      cartas[i].classList.remove('shake'); void cartas[i].offsetWidth; cartas[i].classList.add('shake');
      vibrate([20, 30, 20]); decir('', T.agDiscarded); return;
    }
    const c = t.cartas[i];
    P.jugadas.push({ i });
    P.marcas.delete(i);
    guardar();
    const e1 = estado(t, P.jugadas);
    const cambia = e1.fin || e1.actual !== e0.actual;
    if (cambia) cartas[i].className = `ag-carta ${c.tipo}${c.tipo === 'agente' ? ` g${c.p}` : ''}`; else dibujar();
    cartas[i].classList.add('volteo', c.tipo === 'agente' ? 'acierto' : 'falla');
    if (c.tipo === 'agente') { SFX.letterHit(); vibrate(20); decir(`g${c.p}`, c.p === e0.actual ? T.agGood : T.agOther); }
    else if (c.tipo === 'neutral') { SFX.letterMiss(); vibrate([30, 30]); decir('mal', T.agNeutral); }
    else {
      SFX.error(); vibrate([60, 40, 60]); decir('mal', T.agAssassin);
      cartas[i].textContent = `💀 ${c.w}`;
      destello();
      if (!quieto()) { tablero.classList.add('tiembla'); setTimeout(() => tablero.classList.remove('tiembla'), 500); }
    }
    // If the clue was cut or completed, the stamp shows a moment before the next one
    if (cambia) cerrarPista(c.tipo === 'agente' ? 'completa' : 'cortada');
  };

  raiz.replaceChildren(el('div', { class: 'stack ag-juego' }, caja, aviso, tablero, ayuda, botones));
  dibujar();
}

export function resultado(e) {
  const s = e ? puntaje(e) : 0;
  return { s, t: e?.tarjeta || '', resumen: `${s}/100` };
}

/** How the score was reached (D-106): the agents found, then what the neutrals and the assassin took off. */
export function desglose(e, { T, fmt }) {
  if (!e) return null;
  const lineas = [fmt(T.agBdFound, { n: e.encontrados, t: e.total, pts: base(e) })];
  if (e.neutrales) lineas.push(fmt(e.neutrales === 1 ? T.agBdNeutralOne : T.agBdNeutrals, { n: e.neutrales, pts: RESTA_NEUTRAL * e.neutrales }));
  if (e.asesino) lineas.push(fmt(T.agBdAssassin, { pts: RESTA_ASESINO }));
  return lineas;
}
