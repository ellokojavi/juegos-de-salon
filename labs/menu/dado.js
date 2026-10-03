/**
 * Juego al azar (en el laboratorio): un botón del menú que tira un dado y abre lo que salió.
 *
 * El dado es un cubo con un juego en cada cara. Se lanza sobre la misma portada, rueda, rebota y
 * cae con la cara del elegido hacia adelante; abajo aparece su nombre y se abre el juego. Tocar
 * en cualquier parte mientras rueda lo abre de inmediato. La Copa no entra: es una semana con
 * amigos, no una partida para sacar al azar.
 *
 * Con "reducir movimiento" el dado no rueda: aparece quieto en la cara elegida.
 */
import { el, con } from '../../assets/js/ui.js';
import { pickLang } from '../../assets/js/i18n.js';
import { SFX } from '../../assets/js/sound.js';

export const TEXTOS = {
  es: { boton: 'Juego al azar', tocó: '¡Te tocó!', aria: 'Abrir un juego al azar' },
  en: { boton: 'Random game', tocó: 'You got…', aria: 'Open a random game' },
  pt: { boton: 'Jogo aleatório', tocó: 'Você tirou…', aria: 'Abrir um jogo aleatório' },
};

// Dónde va cada cara del cubo. La 0 mira hacia adelante: ahí va el elegido
const CARAS = ['rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];

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

  const cubo = el('div', { class: 'azar-cubo' }, ...caras.map((g, i) =>
    el('div', { class: 'azar-cara', style: `transform:${CARAS[i]} translateZ(var(--medio))` },
      el('span', { class: con('', g.emoji) }, g.emoji))));
  const sombra = el('div', { class: 'azar-sombra' });
  const nombre = el('div', { class: 'azar-nombre', 'aria-live': 'assertive' });
  const capa = el('div', { class: 'azar-capa', role: 'dialog', 'aria-modal': 'true', 'aria-label': T.boton, tabindex: '-1' },
    el('div', { class: 'azar-escena' }, sombra, cubo), nombre);
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

  if (quieto) { cubo.style.transform = 'rotateX(-12deg) rotateY(12deg)'; revelar(); return; }

  // Rueda: entra desde abajo girando, rebota dos veces y se asienta con la cara 0 adelante.
  // Las vueltas son múltiplos de 360 para terminar exactamente en la cara elegida.
  const vx = 360 * (3 + azar(2)), vy = 360 * (2 + azar(2)) * (Math.random() < 0.5 ? -1 : 1);
  // Termina un poco ladeado para que se vea que es un cubo
  const fin = `rotateX(${vx - 12}deg) rotateY(${vy + 12}deg)`;
  const DUR = 1500;
  SFX.dice();
  setTimeout(() => SFX.dice(), 520);
  setTimeout(() => SFX.dice(), 900);
  cubo.animate([
    { transform: `translateY(60vh) rotateX(0deg) rotateY(0deg) scale(0.6)`, offset: 0, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
    { transform: `translateY(-90px) rotateX(${vx * 0.55}deg) rotateY(${vy * 0.55}deg) scale(1.05)`, offset: 0.35, easing: 'cubic-bezier(0.5, 0, 1, 1)' },
    { transform: `translateY(0) rotateX(${vx * 0.8}deg) rotateY(${vy * 0.8}deg) scale(1)`, offset: 0.6, easing: 'cubic-bezier(0, 0, 0.4, 1)' },
    { transform: `translateY(-34px) rotateX(${vx * 0.93}deg) rotateY(${vy * 0.93}deg)`, offset: 0.76, easing: 'cubic-bezier(0.6, 0, 1, 1)' },
    { transform: `translateY(0) rotateX(${vx + 6}deg) rotateY(${vy - 6}deg)`, offset: 0.9, easing: 'ease-out' },
    { transform: `translateY(0) ${fin}`, offset: 1 },
  ], { duration: DUR, fill: 'forwards' });
  sombra.animate([
    { transform: 'scale(0.3)', opacity: 0 },
    { transform: 'scale(0.55)', opacity: 0.3, offset: 0.35 },
    { transform: 'scale(1)', opacity: 0.6, offset: 0.6 },
    { transform: 'scale(0.75)', opacity: 0.4, offset: 0.76 },
    { transform: 'scale(1)', opacity: 0.6, offset: 0.9 },
    { transform: 'scale(1)', opacity: 0.6 },
  ], { duration: DUR, fill: 'forwards' });
  cubo.style.transform = fin;
  setTimeout(revelar, DUR);
}
