/**
 * El 3, 2, 1, ¡A jugar! antes de jugar (D-105), compartido (D-102): salió de cup/game.js para que
 * los juegos del laboratorio usen el mismo. Una capa encima de todo con el nombre del juego y la
 * cifra que late; se resuelve con el "¡A jugar!", para que el tablero se arme debajo mientras la
 * capa se va, y devuelve cuánto falta para que se vaya: el reloj parte recién ahí. La cuenta no es
 * tiempo de juego. Los estilos (.cuenta) están en assets/css/base.css.
 */
import { el, vibrate } from './ui.js';
import { SFX } from './sound.js';

/** Lo que tarda en irse el "¡A jugar!" después de aparecer: el tablero ya está debajo. */
export const CUENTA_SALE_MS = 900;

/**
 * @param {object} o
 * @param {Node|string} o.titulo   el juego, arriba de la cifra
 * @param {string} o.ya            el cierre ("¡A jugar!", en el idioma de quien juega)
 * @returns {Promise<number>}      se cumple con el "¡A jugar!": los ms que tarda en irse la capa
 */
export function cuentaRegresiva({ titulo, ya }) {
  return new Promise(listo => {
    const num = el('span', { class: 'cuenta-num' });
    const capa = el('div', { class: 'cuenta', id: 'cuenta', role: 'status', 'aria-live': 'assertive' },
      el('p', { class: 'cuenta-juego' }, titulo), num);
    document.body.append(capa);
    let n = 3;
    const paso = () => {
      if (!capa.isConnected) return;
      num.classList.remove('late'); void num.offsetWidth; num.classList.add('late');
      if (n > 0) { num.textContent = String(n); SFX.tick(); vibrate(10); n--; setTimeout(paso, 1000); return; }
      num.textContent = ya;
      capa.classList.add('ya');
      SFX.turn(); vibrate([20, 40, 20]);
      listo(CUENTA_SALE_MS);
      setTimeout(() => capa.remove(), CUENTA_SALE_MS);
    };
    paso();
  });
}
