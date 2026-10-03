/**
 * Juego al azar (en el laboratorio): un botón del menú que tira un dado y abre lo que salió.
 *
 * El dado es un cubo con un juego en cada cara. Se lanza sobre la misma portada, rueda, rebota y
 * cae con la cara del elegido hacia adelante; abajo aparece su nombre y se abre el juego. Tocar
 * en cualquier parte mientras rueda lo abre de inmediato. La Copa no entra: es una semana con
 * amigos, no una partida para sacar al azar.
 *
 * Con "reducir movimiento" el dado no rueda: aparece quieto en la cara elegida. Sin WebGL
 * aparece el emoji del elegido, grande, en vez del dado.
 */
import { el } from '../../assets/js/ui.js';
import { crearDado } from './dado3d.js';
import { pickLang } from '../../assets/js/i18n.js';
import { SFX } from '../../assets/js/sound.js';

export const TEXTOS = {
  es: { boton: 'Juego al azar', tocó: '¡Te tocó!', aria: 'Abrir un juego al azar' },
  en: { boton: 'Random game', tocó: 'You got…', aria: 'Open a random game' },
  pt: { boton: 'Jogo aleatório', tocó: 'Você tirou…', aria: 'Abrir um jogo aleatório' },
};

const azar = n => Math.floor(Math.random() * n);
const barajar = xs => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = azar(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * El botón. `candidatos()` devuelve los juegos que pueden salir en este momento (los que se ven
 * con el filtro puesto); `base` es lo que se antepone a `g.path` para abrirlo.
 */
export function botonAzar({ candidatos, lang, base = '' }) {
  const T = TEXTOS[lang] || TEXTOS.es;
  return el('button', {
    type: 'button', class: 'btn-azar', 'aria-label': T.aria,
    onClick: () => { const pool = candidatos().filter(g => !g.torneo && g.available); if (pool.length) tirar(pool, { lang, base, T }); },
  }, el('span', { class: 'btn-azar-dado', 'aria-hidden': 'true' }, '🎲'), el('span', {}, T.boton));
}

function tirar(pool, { lang, base, T }) {
  if (document.querySelector('.azar-capa')) return;
  const elegido = pool[azar(pool.length)];
  // Las otras cinco caras: juegos distintos del elegido, repetidos solo si no alcanzan
  const otros = barajar(pool.filter(g => g !== elegido));
  const caras = [elegido, ...Array.from({ length: 5 }, (_, i) => otros.length ? otros[i % otros.length] : elegido)];
  const destino = base + elegido.path;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // El dado se dibuja en WebGL (dado3d.js); la cara 0, la de adelante, es la del elegido
  const lienzo = el('canvas', { class: 'azar-lienzo', 'aria-hidden': 'true' });
  // El salto y el giro van en dos capas: cada uno con su propia curva, sin tirones entre tramos
  const salto = el('div', { class: 'azar-salto' }, lienzo);
  const sombra = el('div', { class: 'azar-sombra' });
  const nombre = el('div', { class: 'azar-nombre', 'aria-live': 'assertive' });
  const capa = el('div', { class: 'azar-capa', role: 'dialog', 'aria-modal': 'true', 'aria-label': T.boton, tabindex: '-1' },
    el('div', { class: 'azar-escena' }, sombra, salto), nombre);
  document.body.append(capa);
  document.body.classList.add('azar-abierto');
  // El foco entra al diálogo: con teclado, Enter o espacio también lo abren de inmediato
  capa.focus({ preventScroll: true });

  let ido = false;
  const ir = () => { if (ido) return; ido = true; location.href = destino; };
  capa.addEventListener('click', ir);
  capa.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } });
  // Volver con "atrás" desde el juego restaura la página tal como quedó (bfcache): sin esto, el
  // dado seguía encima del menú y ya no se podía tocar nada
  addEventListener('pageshow', e => { if (e.persisted) { capa.remove(); document.body.classList.remove('azar-abierto'); } }, { once: true });

  const revelar = () => {
    SFX.reveal();
    capa.classList.add('listo');
    nombre.replaceChildren(el('small', {}, T.tocó), el('b', {}, pickLang(elegido.name, lang)));
    setTimeout(ir, quieto ? 1100 : 1300);
  };

  // Termina un poco ladeado, mostrando el canto de arriba y el de la derecha, para que se vea que es un cubo
  const FX = 18, FY = -20;
  const dado = crearDado(lienzo, caras.map(g => g.emoji));
  if (!dado) {
    lienzo.replaceWith(el('div', { class: 'azar-sin-3d' }, elegido.emoji));
    revelar();
    return;
  }
  if (quieto) { dado.dibujar(FX, FY); revelar(); return; }

  // Rueda: entra desde abajo y rebota tres veces, cada vez más bajo. El giro es uno solo que
  // frena parejo de principio a fin, así no cambia de velocidad de golpe en cada bote.
  // Las vueltas son enteras para terminar exactamente en la cara elegida.
  const vx = 360 * 2, vy = 360 * (1 + azar(2)) * (Math.random() < 0.5 ? -1 : 1);
  const DUR = 2300;
  // Los botes: [momento (0–1), altura en px]. Subir frena (ease-out) y bajar acelera (ease-in)
  const BOTES = [[0.3, -120], [0.52, 0], [0.66, -42], [0.77, 0], [0.84, -12], [0.9, 0]];
  const sube = 'cubic-bezier(0.2, 0.6, 0.4, 1)';
  const baja = 'cubic-bezier(0.6, 0, 0.8, 0.4)';
  salto.animate([
    { transform: 'translateY(55vh) scale(0.7)', offset: 0, easing: sube },
    ...BOTES.map(([offset, y]) => ({ transform: `translateY(${y}px) scale(1)`, offset, easing: y ? baja : sube })),
    { transform: 'translateY(0) scale(1)', offset: 1 },
  ], { duration: DUR, fill: 'forwards' });
  sombra.animate([
    { transform: 'scale(0.3)', opacity: 0, offset: 0, easing: sube },
    ...BOTES.map(([offset, y]) => ({ transform: `scale(${1 + y / 240})`, opacity: 0.6 + y / 300, offset, easing: y ? baja : sube })),
    { transform: 'scale(1)', opacity: 0.6, offset: 1 },
  ], { duration: DUR, fill: 'forwards' });
  // El giro lo dibuja WebGL cuadro a cuadro: arranca rápido y frena parejo hasta quedar quieto
  const GIRO = DUR * 0.97, t0 = performance.now();
  const frena = t => 1 - (1 - t) ** 3.2;
  const girar = ahora => {
    if (!capa.isConnected) return;
    const t = Math.min(1, (ahora - t0) / GIRO), e = frena(t);
    // Le faltan vx y vy grados por girar, que se van acabando: al final queda en (FX, FY)
    dado.dibujar(FX + vx * (1 - e), FY + vy * (1 - e));
    if (t < 1) requestAnimationFrame(girar);
  };
  requestAnimationFrame(girar);
  // El ruido de los dados en cada bote, más suave a medida que se asienta
  for (const [offset, y] of BOTES) if (!y) setTimeout(() => SFX.dice(), DUR * offset);
  setTimeout(revelar, DUR + 100);
}
