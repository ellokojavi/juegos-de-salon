/**
 * 🔢 Toque y Fama: adivina el número — pantalla. Es la de Toque y Fama (D-102): el teclado
 * compartido con notas (toque largo para tachar una cifra), el tablero de intentos y las
 * pistas de famas y toques, con sus textos. Los estilos son los de assets/css/teclado.css.
 *
 * Las jugadas son `{ i: intentos, n: cifras tachadas }`. Una lista suelta (copas guardadas
 * antes de las notas) se lee como los intentos.
 */
import * as motor from './numero.js';
import { teclado, CIFRAS } from '../../assets/js/teclado.js';
import { LOCALES as TYF_LOCALES } from '../../toque-y-fama/rules.js';

export const TYF = TYF_LOCALES.es;
/** Los textos de Toque y Fama en el idioma de quien juega: la copa va en español, pero el modo solo de Toque y Fama no. */
const tyf = lang => TYF_LOCALES[lang] || TYF;

export const leerJugadas = j => (Array.isArray(j) ? { i: j.slice(), n: [] } : { i: (j?.i || []).slice(), n: (j?.n || []).slice() });

/**
 * Las pistas como en el tablero de Toque y Fama. El tablero de la copa ocupa todo el ancho y
 * suele escribirlas completas ("2 famas", "1 toque", "nada"); abreviadas son "2F 1T" o "0".
 */
export function pistas(el, g, largo, grande = false, completa = grande, TYF = tyf()) {
  const wrap = el('div', { class: grande ? 'reply-clue' : 'clue' });
  const F = n => (completa ? `${n} ${n === 1 ? TYF.fama : TYF.famas}` : `${n}${TYF.famaShort}`);
  const Tq = n => (completa ? `${n} ${n === 1 ? TYF.toque : TYF.toques}` : `${n}${TYF.toqueShort}`);
  if (g.famas === largo) wrap.append(el('span', { class: 'f' }, `🎯 ${F(g.famas)}`));
  else {
    if (g.famas) wrap.append(el('span', { class: 'f' }, F(g.famas)));
    if (g.toques) wrap.append(el('span', { class: 't' }, Tq(g.toques)));
    if (!g.famas && !g.toques) wrap.append(el('span', { class: 'z' }, completa ? TYF.none : '0'));
  }
  return wrap;
}

/**
 * El tablero de intentos de Toque y Fama, de un solo jugador. `valor` dibuja el intento.
 * Las pistas van completas; Letras las abrevia porque sus letras de colores no dejan espacio.
 */
export function tablero(el, { filas, largo, titulo, valor = f => f.v, completa = true, lang }) {
  const TYF = tyf(lang);
  const tries = n => (n === 1 ? TYF.tryOne : TYF.tryMany);
  const lista = el('ol', {}, ...filas.map(f => el('li', { class: f.famas === largo ? 'hit' : '' }, valor(f), pistas(el, f, largo, false, completa, TYF))));
  return el('div', { class: 'board turn board--solo' },
    el('h3', {}, titulo),
    el('div', { class: 'count' }, filas.length ? `${filas.length} ${tries(filas.length)}` : TYF.noGuesses),
    filas.length ? lista : el('div', { class: 'empty' }, '—'));
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate, lang } = ctx;
  const TYF = tyf(lang);
  const max = ctx.max || motor.MAX_INTENTOS;
  const J = leerJugadas(ctx.jugadas);
  const notas = new Set(J.n);
  const guardar = () => ctx.guardar({ i: J.i, n: [...notas] });

  const dibujar = () => {
    const e = motor.estado(p, J.i, max);
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.();
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack numero-juego' });
    // El cierre va arriba; en la final (ctx.cierreAbajo), debajo del tablero
    const cierre = e.fin ? [el('div', { class: 'aviso ' + (e.resuelto ? 'bien' : 'mal') }, e.resuelto ? `🎉 ${T.solved}` : fmt(T.notSolved, { v: p.secreto })),
      el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)] : [];
    if (e.fin) {
      if (!ctx.cierreAbajo) caja.append(...cierre);
    } else {
      const quedan = max - e.usados;
      caja.append(el('p', { class: 'muted center', style: 'margin:0' }, quedan === 1 ? T.tryLeft1 : fmt(T.triesLeft, { n: quedan })),
        teclado({
          largo: p.cifras, teclas: CIFRAS, submitLabel: TYF.guess, notes: notas, onNotesChange: guardar,
          valido: v => motor.valido(v, p.cifras),
          puede: (v, d) => !v.includes(d) && v.length < p.cifras,
          onSubmit: v => {
            J.i.push(v); guardar();
            const u = motor.estado(p, J.i, max).filas.at(-1);
            if (u.famas === p.cifras) { SFX.win(); vibrate([30, 50, 30]); } else SFX.reveal();
            dibujar();
          },
        }),
        el('p', { class: 'block-hint' }, T.blockHintDigits)); // "tachar", como en Palabra y en las reglas (U-5)
    }
    caja.append(tablero(el, { filas: e.filas, largo: p.cifras, titulo: T.yourGuesses, lang, valor: f => el('span', { class: 'val' }, f.v) }));
    if (ctx.cierreAbajo) caja.append(...cierre);
    raiz.append(caja);
  };
  dibujar();
}

export const resultado = (e, max = motor.MAX_INTENTOS) => ({ s: motor.puntaje(e, max), t: motor.tarjeta(e), resumen: `${motor.puntaje(e, max)}/100` });
