/**
 * 🔤 Toque y Fama: Palabra — pantalla. La misma de 🔢 (ui-numero.js): teclado compartido con
 * notas, tablero y pistas de Toque y Fama. Lo único propio es que cada letra del intento se
 * pinta con el color de su pista (amarilla la fama, celeste el toque), como en Wordle.
 *
 * Las jugadas son `{ i: intentos, n: letras tachadas }`.
 */
import * as motor from './letras.js';
import { teclado } from '../../assets/js/teclado.js';
import { TYF, tablero, leerJugadas } from './ui-numero.js';

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX, vibrate } = ctx;
  const J = leerJugadas(ctx.jugadas);
  const notas = new Set(J.n);
  const guardar = () => ctx.guardar({ i: J.i, n: [...notas] });

  const letrasPintadas = f => el('span', { class: 'val letras' },
    ...[...f.v].map((l, i) => el('span', { class: 'letra ' + (f.marcas[i] === 'f' ? 'f' : f.marcas[i] === 't' ? 't' : '') }, l)));

  const dibujar = () => {
    const e = motor.estado(p, J.i);
    raiz.innerHTML = '';
    const caja = el('div', { class: 'stack numero-juego letras-juego' });
    // El cierre va arriba; en la final (ctx.cierreAbajo), debajo del tablero
    const cierre = e.fin ? [el('div', { class: 'aviso ' + (e.resuelto ? 'bien' : 'mal') }, e.resuelto ? `🎉 ${T.solvedWord}` : fmt(T.notSolvedWord, { v: p.secreto })),
      el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)] : [];
    if (e.fin) {
      if (!ctx.cierreAbajo) caja.append(...cierre);
    } else {
      const quedan = p.max - e.usados;
      caja.append(el('p', { class: 'muted center', style: 'margin:0' }, quedan === 1 ? T.tryLeft1 : fmt(T.triesLeft, { n: quedan })),
        // Lo que ya suma (D-108): cada letra en su lugar cuenta una vez
        e.encontradas ? el('p', { class: 'center ok', id: 'letras-encontradas', style: 'margin:0' }, fmt(e.encontradas === 1 ? T.famasFoundOne : T.famasFound, { n: e.encontradas, largo: p.largo, pts: motor.PUNTOS_FAMA * e.encontradas })) : null,
        teclado({
          largo: p.largo, teclas: motor.ALFABETO, columnas: 10, acciones: 'abajo', submitLabel: TYF.guess, notes: notas, onNotesChange: guardar,
          valido: motor.valido, puede: motor.puede,
          onSubmit: v => {
            J.i.push(v); guardar();
            const u = motor.estado(p, J.i).filas.at(-1);
            if (u.famas === p.largo) { SFX.win(); vibrate([30, 50, 30]); } else SFX.reveal();
            dibujar();
          },
        }),
        el('p', { class: 'block-hint' }, T.blockHintLetters));
    }
    caja.append(tablero(el, { filas: e.filas, largo: p.largo, titulo: T.yourGuesses, valor: letrasPintadas }));
    if (ctx.cierreAbajo) caja.append(...cierre);
    raiz.append(caja);
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
