/**
 * 📍 ¿Dónde queda? — pantalla. Un globo sin nombres (`globo.js`) que se gira sin fin
 * arrastrando y se acerca pellizcando, con doble toque (o con la rueda y los botones + y −). Tocar
 * pone el alfiler; tocar otra vez lo mueve: el alfiler no se arrastra, porque arrastrar ya gira
 * el globo. Confirmar es el botón (C-8). Las jugadas son `[lat, lon]` de cada alfiler confirmado.
 *
 * La portada del minijuego (`portada`) es el mismo globo, chico y girando solo.
 */
import * as motor from './donde.js';
import * as globo from './globo.js';
import { UMBRAL } from '../../assets/js/arrastre.js';

/** `append` que descarta los hijos nulos, como `el()` (sin esto, un null se escribe como texto). */
const poner = (nodo, ...hijos) => nodo.append(...hijos.flat().filter(x => x !== null && x !== undefined && x !== false));

/** Dos toques más juntos que esto, en tiempo y en distancia, son un doble toque: acercan. */
const DOBLE_MS = 320;
const DOBLE_PX = 30;
/** Cuánto se puede acercar, en veces el globo entero: en un celular, cerca de 1 km por píxel. */
const ZOOM_MAX = 40;
/** Al mostrar la respuesta, se acerca a lo más esto: dos puntos muy juntos no llenan la pantalla. */
const ZOOM_RESPUESTA = 16;
/** Hacia dónde mira el globo al empezar cada ciudad: el Atlántico, con América, Europa y África. */
const CENTRO_INICIAL = [10, -40];
const RAD = Math.PI / 180;
const envolver = lon => ((((lon + 180) % 360) + 360) % 360) - 180;

/**
 * El globo del juego: girar, acercar y tocar. `alTocar([lat, lon])` recibe el lugar tocado.
 * El canvas lleva `.globo` con `aPantalla(lat, lon)` y `girarA(lat, lon)`: la respuesta los usa,
 * y también las pruebas de punta a punta, que tocan donde queda cada ciudad.
 */
function crearGlobo({ T, alTocar }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'mapa-globo';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', T.mapLabel);
  const v = { centro: CENTRO_INICIAL.slice(), z: 1 };
  const marcas = {};
  let w = 0, h = 0, pedido = false;

  const radioBase = () => Math.max(40, Math.min(w, h) / 2 - 10);
  const V = () => globo.vista({ centro: v.centro, r: radioBase() * v.z, cx: w / 2, cy: h / 2 });
  const pintar = () => {
    pedido = false;
    if (!canvas.isConnected) return;
    [w, h] = globo.ajustar(canvas);
    if (w && h) globo.dibujar(canvas.getContext('2d'), w, h, V(), { marcas });
  };
  const redibujar = () => { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } };

  const local = (px, py) => { const r = canvas.getBoundingClientRect(); return [px - r.left, py - r.top]; };
  /** El lugar del globo bajo un punto de la pantalla, o null si ahí hay espacio. */
  const bajo = (px, py) => {
    const [x, y] = local(px, py), R = radioBase() * v.z;
    return motor.tocado((x - w / 2) / R, (h / 2 - y) / R, v.centro);
  };
  const girar = (dx, dy) => {
    const R = radioBase() * v.z;
    v.centro = [Math.max(-89, Math.min(89, v.centro[0] + (dy / R) / RAD)), envolver(v.centro[1] - (dx / R) / RAD)];
    redibujar();
  };
  function zoom(f, px, py) {
    const g = px === undefined ? null : bajo(px, py);
    v.z = Math.min(ZOOM_MAX, Math.max(1, v.z * f));
    // Lo que estaba bajo el dedo sigue bajo el dedo: se corrige el centro un par de veces
    for (let k = 0; g && k < 3; k++) {
      const g2 = bajo(px, py);
      if (!g2) break;
      v.centro = [Math.max(-89, Math.min(89, v.centro[0] + g[0] - g2[0])), envolver(v.centro[1] + envolver(g[1] - g2[1]))];
    }
    redibujar();
  }

  // Un dedo que se mueve gira el globo; dos, lo acercan; un toque quieto es el alfiler
  const dedos = new Map();
  let movido = false, varios = false, previa = null, ultimo = null;
  const pinza = () => {
    const [a, b] = [...dedos.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  canvas.addEventListener('pointerdown', e => {
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    if (dedos.size === 1) { movido = false; varios = false; } else { varios = true; previa = pinza(); }
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    const d = dedos.get(e.pointerId);
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX; d.y = e.clientY;
    if (dedos.size >= 2) {
      const ahora = pinza();
      if (previa && previa.d > 0) { girar(ahora.x - previa.x, ahora.y - previa.y); zoom(ahora.d / previa.d, ahora.x, ahora.y); }
      previa = ahora;
      return;
    }
    if (!movido && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < UMBRAL) return;
    movido = true;
    girar(dx, dy);
  });
  const soltar = e => {
    if (!dedos.has(e.pointerId)) return;
    const unico = dedos.size === 1 && !movido && !varios;
    dedos.delete(e.pointerId);
    previa = dedos.size >= 2 ? pinza() : null;
    if (!unico || e.type !== 'pointerup') return;
    // El primer toque ya puso el alfiler ahí mismo; el segundo solo acerca, en torno al dedo
    const t = e.timeStamp;
    if (ultimo && t - ultimo.t < DOBLE_MS && Math.hypot(e.clientX - ultimo.x, e.clientY - ultimo.y) < DOBLE_PX) {
      ultimo = null;
      zoom(2, e.clientX, e.clientY);
      return;
    }
    ultimo = { t, x: e.clientX, y: e.clientY };
    const g = bajo(e.clientX, e.clientY);
    if (g) alTocar(g);
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY); }, { passive: false });
  new ResizeObserver(redibujar).observe(canvas);

  canvas.globo = {
    aPantalla(lat, lon) {
      const p = globo.enPantalla(V(), lat, lon);
      if (!p) return null;
      const r = canvas.getBoundingClientRect();
      return [r.left + p[0], r.top + p[1]];
    },
    girarA(lat, lon) { v.centro = [lat, lon]; pintar(); },
    vista: () => ({ centro: v.centro.slice(), z: v.z }),
  };
  return {
    canvas,
    zoom: f => { const r = canvas.getBoundingClientRect(); zoom(f, r.left + r.width / 2, r.top + r.height / 2); },
    alfiler(q) { marcas.alfiler = q; canvas.dataset.alfiler = q ? '1' : ''; redibujar(); },
    /** La respuesta: el alfiler, la ciudad y el arco entre los dos, con los dos a la vista. */
    respuesta(p, q) {
      Object.assign(marcas, { alfiler: p, ciudad: q, linea: true });
      v.centro = motor.medio(p, q);
      const th = motor.distancia(p, q) / 6371;
      // Un lugar a θ/2 del centro se ve a R·sen(θ/2) del centro: que quede dentro de la caja
      v.z = Math.max(1, Math.min(ZOOM_RESPUESTA, (0.34 * Math.min(w || 300, h || 300)) / (radioBase() * Math.sin(Math.min(th / 2, Math.PI / 2)) || 1)));
      redibujar();
    },
    pintar,
  };
}

/**
 * La portada: el globo chico girando solo, con el alfiler en Brasil y la estrella en Valparaíso,
 * como el afiche de "Próximamente". Con movimiento reducido (C-8) queda quieto.
 */
export function portada() {
  const canvas = document.createElement('canvas');
  canvas.className = 'globo-portada';
  canvas.setAttribute('aria-hidden', 'true');
  const marcas = { alfiler: [-12, -50], ciudad: [-33.05, -71.62], linea: true };
  const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  let ultimo = 0;
  const cuadro = ahora => {
    if (!canvas.isConnected && ahora - t0 > 1000) return;
    // 30 cuadros por segundo alcanzan para 8° por segundo, y el celular lo agradece
    if (ahora - ultimo >= 33) {
      ultimo = ahora;
      const [w, h] = globo.ajustar(canvas);
      if (w) {
        const lon = quieto ? -60 : -60 + ((ahora - t0) / 1000) * 8;
        globo.dibujar(canvas.getContext('2d'), w, h, globo.vista({ centro: [-12, envolver(lon)], r: Math.min(w, h) / 2 - 8, cx: w / 2, cy: h / 2 }), { marcas, liviano: true, escala: 0.7 });
      }
    }
    if (!quieto) requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  return canvas;
}

export function montar(raiz, ctx) {
  const { p, T, fmt, el, SFX } = ctx;
  let jugadas = Array.isArray(ctx.jugadas) ? ctx.jugadas.slice() : [];
  let revelado = null;

  const caja = mapa => el('div', { class: 'mapa-caja' }, mapa.canvas,
    el('div', { class: 'mapa-zoom' },
      el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-acercar', 'aria-label': T.zoomIn, onClick: () => mapa.zoom(2) }, '+'),
      el('button', { type: 'button', class: 'btn btn--ghost', id: 'btn-alejar', 'aria-label': T.zoomOut, onClick: () => mapa.zoom(0.5) }, '−')));

  const titulo = (i, c) => [
    el('p', { class: 'muted center', style: 'margin:0' }, fmt(T.cityOf, { i: i + 1, n: p.ciudades.length })),
    el('div', { class: 'carta actual donde-ciudad' }, el('span', { class: 'carta-emoji' }, '📍'), el('b', {}, motor.nombre(c))),
  ];

  const dibujar = () => {
    const e = motor.estado(p, jugadas);
    // Terminado el tablero, el tiempo se detiene aquí y no al tocar el botón (D-130)
    if (e.fin) ctx.pararReloj?.(e);
    raiz.innerHTML = '';
    const pantalla = el('div', { class: 'stack donde-juego' });
    if (revelado !== null) {
      const f = e.filas[revelado];
      const mapa = crearGlobo({ T, alTocar: () => {} });
      poner(pantalla, titulo(revelado, f.ciudad), caja(mapa),
        el('div', { class: 'aviso ' + (f.pts >= 50 ? 'bien' : 'mal'), id: 'donde-aviso' }, `${motor.marca(f.km)} ${fmt(f.pts === 1 ? T.pinWasOne : T.pinWas, { km: motor.km(f.km), pts: f.pts })}`),
        e.fin
          ? el('button', { class: 'btn btn--yellow', id: 'btn-fin', onClick: () => { SFX.tap(); ctx.terminar(e); } }, ctx.textoFin || T.seeResults)
          : el('button', { class: 'btn btn--yellow', id: 'btn-siguiente', onClick: () => { SFX.tap(); revelado = null; dibujar(); } }, T.next));
      poner(raiz, pantalla);
      mapa.pintar();
      mapa.respuesta(f.r, [f.ciudad.lat, f.ciudad.lon]);
      return;
    }
    if (e.fin) { revelado = e.filas.length - 1; dibujar(); return; }
    const c = e.actual;
    let pin = null;
    const confirmar = el('button', { class: 'btn btn--yellow', id: 'btn-confirmar', disabled: true, onClick: () => {
      if (!pin) return;
      jugadas.push(motor.jugada(pin[0], pin[1]));
      ctx.guardar(jugadas);
      revelado = jugadas.length - 1;
      const pts = motor.estado(p, jugadas).filas[revelado].pts;
      if (pts >= 80) SFX.reveal(); else if (pts >= 20) SFX.tap(); else SFX.error();
      dibujar();
    } }, `📍 ${T.confirm}`);
    const mapa = crearGlobo({ T, alTocar: q => {
      SFX.tap();
      pin = q;
      mapa.alfiler(q);
      confirmar.disabled = false;
    } });
    poner(pantalla, titulo(e.filas.length, c), caja(mapa), confirmar);
    poner(raiz, pantalla);
    mapa.pintar();
  };
  dibujar();
}

export const resultado = e => ({ s: motor.puntaje(e), t: motor.tarjeta(e), resumen: `${motor.puntaje(e)}/100` });
