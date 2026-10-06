/**
 * El paso del dado de Juego al azar al juego (D-188, D-237): sin corte y sin pantalla vacía.
 *
 * Al irse, el menú deja en `sessionStorage` la escena del dado (una foto del lienzo, el emoji y
 * el nombre) y el navegador lo sigue mostrando hasta que la página del juego pinta. Esa página
 * abre con la misma escena encima (`.azar-capa.velo` en base.css), así el cambio no se ve, y la
 * desvanece recién cuando el juego terminó de dibujar su pantalla.
 *
 * Lo importa instalable.js, que cargan todas las páginas en el <head>, antes de que el juego
 * dibuje nada.
 */
export const LLEGA = 'azar-llega';

/** Lo más que la escena espera al juego: si algo se traba, igual se va. */
const ESPERA_MAX = 4000;

function leer() {
  try {
    const crudo = sessionStorage.getItem(LLEGA);
    if (!crudo) return null;
    sessionStorage.removeItem(LLEGA);
    return JSON.parse(crudo);
  } catch { return null; }
}

function crear(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto) n.textContent = texto;
  return n;
}

/** La misma escena con que se fue el menú: el dado quieto y, si ya había caído, su nombre. */
function montar({ img, emoji, chico, nombre }) {
  const salto = crear('div', 'azar-salto');
  if (img) { const foto = crear('img', 'azar-lienzo'); foto.src = img; foto.alt = ''; salto.append(foto); }
  else salto.append(crear('div', 'azar-sin-3d', emoji));
  const escena = crear('div', 'azar-escena');
  escena.append(crear('div', 'azar-sombra'), salto);
  const rotulo = crear('div', 'azar-nombre');
  if (nombre) rotulo.append(crear('small', '', chico), crear('b', '', nombre));
  const capa = crear('div', 'azar-capa velo');
  capa.setAttribute('aria-hidden', 'true');
  capa.append(escena, rotulo);
  document.body.append(capa);
  return capa;
}

/** ¿El juego ya dibujó su pantalla? La de "cargando" (#screen-espera) no cuenta. */
const dibujado = () => !!document.querySelector('.screen.active:not(#screen-espera)');

function irse(capa) {
  const t0 = performance.now();
  const mirar = () => {
    if (!dibujado() && performance.now() - t0 < ESPERA_MAX) return requestAnimationFrame(mirar);
    // Un cuadro más, para que lo recién dibujado alcance a pintarse antes de destaparlo
    requestAnimationFrame(() => requestAnimationFrame(() => {
      capa.addEventListener('transitionend', e => { if (e.target === capa) capa.remove(); });
      capa.classList.add('saliendo');
      setTimeout(() => capa.remove(), 1500); // por si el navegador no avisa el fin
    }));
  };
  mirar();
}

if (typeof document !== 'undefined') {
  const escena = leer();
  if (escena && document.body) irse(montar(escena));
}
