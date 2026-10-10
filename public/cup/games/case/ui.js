/**
 * 🔍 El caso — pantalla en La Copa (D-257). La misma experiencia del prototipo del laboratorio
 * (D-256): las cartas se dan vuelta al empezar, la elegida se acerca, al marcar cae un sello y
 * tocar una pista ilumina a las personas de las que habla.
 *
 * Las jugadas son los intentos de marcar que cuentan: `{ i, v }` (acierto o error). Un intento de
 * antes de tiempo no se guarda: no cuenta y no dice si estaba bien.
 *
 * `portada()` es la portada animada de la antesala: cartas de espaldas que se dan vuelta solas
 * mientras una lupa las recorre.
 */
import * as motor from './engine.js';

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));

/** El dibujo de las reglas: tres cartas (inocente, criminal, sin saber) y una pista. */
export function ejemplo({ el, T }) {
  const L = T.casoTexto;
  const carta = (emo, nom, clase) => el('span', { class: `cs-mini ${clase}` }, el('span', {}, emo), el('b', {}, nom));
  return el('div', { class: 'rej-ejemplo cs-ejemplo' },
    el('figure', {}, el('div', { class: 'cs-mini-fila', 'aria-hidden': 'true' },
      carta('😇', 'Ana', 'inocente'), carta('🔪', 'Beto', 'criminal'), carta('🎨', 'Cata', '')),
    el('figcaption', {}, T.casoExUno)),
    el('figure', {}, el('div', { class: 'cs-globo', 'aria-hidden': 'true' },
      `«${fmt(L.frases.cero, { g: fmt(L.grupo.fila, { n: 1 }) })}»`),
    el('figcaption', {}, `✅ ${T.casoExDos}`)));
}

/**
 * La portada de la antesala: doce cartas de espaldas que se dan vuelta de a una, mostrando a un
 * inocente o a un criminal, mientras una lupa pasa por encima. Quieta con movimiento reducido.
 */
export function portada() {
  const caja = document.createElement('div');
  caja.className = 'cs-portada' + (QUIETO() ? ' quieta' : '');
  caja.setAttribute('aria-hidden', 'true');
  const caras = ['😇', '🔪', '😇', '😇', '🔪', '😇', '🔪', '😇', '😇', '🔪', '😇', '😇'];
  caras.forEach((cara, k) => {
    const c = document.createElement('span');
    c.className = `cs-p-carta ${cara === '🔪' ? 'criminal' : 'inocente'}`;
    c.style.setProperty('--d', `${(k * 7) % 12 * 0.45}s`);
    c.innerHTML = `<span class="cs-p-giro"><span class="cs-p-cara frente">${cara}</span><span class="cs-p-cara dorso">?</span></span>`;
    caja.append(c);
  });
  const lupa = document.createElement('span');
  lupa.className = 'cs-p-lupa';
  lupa.textContent = '🔍';
  caja.append(lupa);
  return caja;
}

export function montar(raiz, ctx) {
  const { p, T, el, SFX, vibrate } = ctx;
  const L = T.casoTexto;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let elegida = null;   // la persona tocada
  let foco = null;      // la pista tocada: ilumina a las personas de las que habla
  let mensaje = null;   // { tipo, texto, de? } de la última marca
  let nueva = null;     // la pista que acaba de aparecer, para que entre animada

  const nombre = i => p.nombres[i];
  const oficioDe = i => motor.oficio(p.oficioDe[i]);
  const valor = i => (p.v[i] ? T.casoCriminal : T.casoInocente);
  const frase = i => motor.texto(p, i, L);
  const dice = i => fmt(T.casoDice, { x: nombre(i), v: valor(i), p: frase(i) });

  // La grilla se arma una vez: después solo cambian sus clases, así las animaciones no se cortan
  raiz.innerHTML = '';
  const caja = el('div', { class: 'stack cs-juego' });
  const grilla = el('div', { class: 'cs-grilla', role: 'group', 'aria-label': T.casoSospechosos });
  const accion = el('div', { class: 'cs-accion', 'aria-live': 'polite' });
  const pie = el('div', { class: 'cs-pie' });
  const pistas = el('section', { class: 'cs-pistas' });
  caja.append(grilla, accion, pie, pistas);
  raiz.append(caja);

  grilla.append(el('span', {}), ...motor.LETRAS_COL.map(l => el('span', { class: 'etq' }, l)));
  const cartas = [];
  for (let f = 0; f < motor.FILAS; f++) {
    grilla.append(el('span', { class: 'etq' }, f + 1));
    for (let c = 0; c < motor.COLS; c++) {
      const i = f * motor.COLS + c;
      const of = oficioDe(i);
      const emo = el('span', { class: 'emo' }, of.emoji);
      const carta = el('button', { type: 'button', class: 'cs-persona', 'data-i': i, onClick: ev => { ev.stopPropagation(); tocar(i); } },
        el('span', { class: 'giro' },
          el('span', { class: 'cara frente' }, emo, el('span', { class: 'nom' }, nombre(i)), el('span', { class: 'ofi' }, L.oficios[of.id].uno),
            el('span', { class: 'dice', 'aria-hidden': 'true' }, '💬')),
          el('span', { class: 'cara dorso', 'aria-hidden': 'true' }, '🔍')));
      carta.emo = emo;
      cartas[i] = carta;
      grilla.append(carta);
    }
  }

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    // Terminado el caso, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.(e);
    const pf = foco !== null ? p.pistas[foco] : null;
    const enFoco = new Set(pf ? [...pf.a, ...(pf.b || [])] : []);
    grilla.classList.toggle('enfoque', !!pf);
    cartas.forEach((carta, i) => {
      const sabe = e.x[i] !== -1, t = carta.classList;
      t.toggle('inocente', sabe && !e.x[i]);
      t.toggle('criminal', sabe && !!e.x[i]);
      t.toggle('marcada', sabe);
      t.toggle('elegida', elegida === i);
      t.toggle('equivoco', e.conError.has(i));
      t.toggle('foco', enFoco.has(i));
      t.toggle('habla', foco === i);
      carta.disabled = e.fin;
      carta.emo.textContent = sabe ? (e.x[i] ? '🔪' : '😇') : oficioDe(i).emoji;
      carta.setAttribute('aria-label', `${nombre(i)}, ${L.oficios[oficioDe(i).id].uno}, ${motor.coord(i)}${sabe ? `, ${valor(i)}` : ''}`);
      carta.setAttribute('aria-pressed', String(elegida === i));
    });
    dibujarAccion(e);
    pie.replaceChildren(...(e.errores ? [el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.casoErrores, { e: e.errores }))] : []));
    dibujarPistas(e);
  };

  /** Un mensaje con pista se toca para iluminar a quiénes nombra. */
  const msg = m => el('button', {
    type: 'button', class: `cs-msg ${m.tipo}${m.de !== undefined && foco === m.de ? ' activa' : ''}`,
    onClick: ev => { ev.stopPropagation(); if (m.de !== undefined) enfocar(m.de); },
  }, el('span', {}, m.texto), m.de !== undefined ? el('span', { class: 'ver' }, foco === m.de ? T.casoOcultar : T.casoVer) : null);

  const dibujarAccion = e => {
    accion.replaceChildren();
    if (e.fin) {
      accion.append(el('div', { class: 'aviso bien' }, `🎉 ${T.casoOk}`),
        el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults));
      return;
    }
    if (elegida !== null && e.x[elegida] === -1) {
      // Lo que pasó al intentar marcarla (un error, o que todavía no se puede saber) queda arriba (C-8b)
      if (mensaje) accion.append(msg(mensaje));
      // El botón dice sobre quién actúa (C-8): "😇 Ana es inocente"
      accion.append(el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn cs-inocente', id: 'btn-inocente', onClick: ev => { ev.stopPropagation(); intentar(0); } }, fmt(T.casoEsInocente, { x: nombre(elegida) })),
        el('button', { type: 'button', class: 'btn cs-criminal', id: 'btn-criminal', onClick: ev => { ev.stopPropagation(); intentar(1); } }, fmt(T.casoEsCriminal, { x: nombre(elegida) }))));
    } else if (mensaje) {
      accion.append(msg(mensaje));
    } else {
      // Al empezar (y al volver), la última pista sabida queda a la vista junto a la grilla
      const ultima = e.marcas.length ? e.marcas.at(-1) : p.inicio;
      accion.append(msg({ tipo: 'dato', texto: dice(ultima), de: ultima }), el('p', { class: 'cs-sub' }, T.casoToca));
    }
  };

  const dibujarPistas = e => {
    // La más nueva arriba, destacada; las demás en el orden en que se fueron sabiendo, al revés
    const orden = [p.inicio, ...e.marcas].reverse();
    const tachadas = ctx.tachadas || (ctx.tachadas = new Set());
    pistas.replaceChildren(
      el('h3', {}, `💬 ${fmt(T.casoPistas, { n: orden.length })}`),
      el('p', { class: 'ayuda' }, T.casoAyuda),
      ...orden.map((i, k) => el('div', {
        class: 'cs-pista' + (k === 0 ? ' ultima' : '') + (nueva === i ? ' entra' : '') + (tachadas.has(i) ? ' tachada' : '') + (foco === i ? ' activa' : ''),
        'data-de': i,
      },
      el('button', { type: 'button', class: 'texto', onClick: ev => { ev.stopPropagation(); enfocar(i); } },
        k === 0 ? el('span', { class: 'nueva-tag' }, T.casoUltima) : null,
        el('span', { class: 'de' }, `${nombre(i)}:`), ' ', el('span', {}, frase(i))),
      el('button', {
        type: 'button', class: 'tachar', 'aria-label': tachadas.has(i) ? T.casoDestachar : T.casoTachar, 'aria-pressed': String(tachadas.has(i)),
        onClick: ev => { ev.stopPropagation(); tachadas.has(i) ? tachadas.delete(i) : tachadas.add(i); SFX.tap(); dibujarPistas(motor.estado(p, jugadas)); },
      }, '✓'))));
    nueva = null;
  };

  /** Un sello que cae sobre la carta: 😇 o 🔪 si acertó, ❌ si no, ❔ si todavía no se podía saber. */
  const sellar = (i, emoji, clase) => {
    const carta = cartas[i];
    carta.classList.remove('acierto', 'fallo', 'duda');
    void carta.offsetWidth;
    carta.classList.add(clase);
    if (QUIETO()) return;
    const sello = el('span', { class: 'sello', 'aria-hidden': 'true' }, emoji);
    carta.append(sello);
    setTimeout(() => { sello.remove(); carta.classList.remove(clase); }, 900);
  };

  const enfocar = i => {
    foco = foco === i ? null : i;
    SFX.tap(); vibrate(8);
    dibujar();
  };

  const tocar = i => {
    const e = motor.estado(p, jugadas);
    if (e.fin) return;
    if (e.x[i] !== -1) {
      // Alguien ya marcado: su pista bajo la grilla, iluminando a quiénes nombra
      elegida = null; foco = i;
      mensaje = { tipo: 'dato', texto: dice(i), de: i };
      SFX.tap(); dibujar();
      return;
    }
    elegida = elegida === i ? null : i;
    mensaje = null;
    SFX.tap(); vibrate(10);
    dibujar();
  };

  const intentar = v => {
    const i = elegida;
    if (i === null) return;
    const r = motor.intento(p, jugadas, i, v);
    const vars = { x: nombre(i), v: v ? T.casoCriminal : T.casoInocente };
    if (r === 'falta') {
      mensaje = { tipo: 'falta', texto: fmt(T.casoFalta, vars) };
      SFX.error(); vibrate([20, 30, 20]);
      dibujar(); sellar(i, '❔', 'duda');
      return;
    }
    jugadas.push({ i, v });
    ctx.guardar(jugadas);
    if (r === 'error') {
      mensaje = { tipo: 'error', texto: fmt(T.casoError, vars) };
      SFX.letterMiss(); vibrate([40, 40, 40]);
      dibujar(); sellar(i, '❌', 'fallo');
      return;
    }
    elegida = null; foco = null; nueva = i;
    mensaje = { tipo: 'ok', texto: fmt(T.casoBien, { ...vars, p: frase(i) }), de: i };
    const e = motor.estado(p, jugadas);
    if (e.fin) { SFX.win(); vibrate([30, 50, 30]); } else { SFX.letterHit(); vibrate(25); }
    dibujar(); sellar(i, v ? '🔪' : '😇', 'acierto');
  };

  // Un toque fuera suelta a la persona elegida y apaga la pista iluminada (C-8)
  raiz.addEventListener('click', ev => {
    if ((elegida !== null || foco !== null) && !ev.target.closest('.cs-persona, .cs-accion, .cs-pista')) { elegida = null; foco = null; dibujar(); }
  });

  dibujar();
  // "Girar para descubrir": la primera vez, las cartas parten de espaldas y se dan vuelta en ola
  if (!jugadas.length && !QUIETO()) {
    cartas.forEach(c => c.classList.add('tapada'));
    void grilla.offsetWidth;
    cartas.forEach((c, i) => setTimeout(() => { c.classList.remove('tapada'); if (i % 4 === 0) SFX.tap(); },
      120 + (motor.fila(i) + motor.col(i)) * 60));
  }
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
