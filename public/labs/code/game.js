/**
 * La clave — prototipo de laboratorio (D-270). Un código de 5 cifras repartido entre una base fija y
 * 4 cartas transparentes, cada una girada o volteada al azar. Se toca una carta para ponerla
 * sobre la base, y con ↻ y ⇋ se orienta; con todas puestas y derechas, los trazos forman el código,
 * que se escribe en el teclado. Nada avisa que una carta quedó bien: se sabe leyendo. El motor está
 * en engine.js; el teclado es el compartido (teclado.js).
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { getLang, langToggle, COMMON, SITIO, withLang } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { teclado, CIFRAS } from '../../assets/js/teclado.js';
import { generar, girar, voltear, choques, mover, CIFRAS_CODIGO } from './engine.js';
import * as palabra from './engine-palabra.js';
import { alfabeto } from '../../cup/games/word/engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'clave';
const lang = getLang();
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEXTOS = {
  es: {
    nombre: 'La clave', laboratorio: '‹ Laboratorio',
    lema: 'Unas cartas transparentes esconden una clave. Ninguna la dice sola.',
    como: ['Descubre la clave y escríbela: una palabra de 5 letras o un código de 5 cifras.', 'Toca una carta para ponerla sobre la base. ↻ la gira y ⇋ la voltea; en Palabra, cada carta tiene dos caras distintas.', 'Con todas puestas y derechas, los trazos forman la clave sin pisarse.'],
    comoSeJuega: '¿Cómo se juega?', palabra: '🔤 Palabra', cifras: '🔢 Cifras', caraDe: 'Cara {c} de 2',
    empezar: '🔐 Empezar', girar: '↻ Girar', voltear: '⇋ Voltear', ok: 'OK',
    quitar: '✕ Quitar', elige: 'Toca una carta de abajo para ponerla.', elegida: 'Carta {n}', mal: 'Ese no es el código. 🔒', malPalabra: 'Esa no es la palabra. 🔒',
    abierto: '¡Abierto!', resumen: 'En {tiempo}, con {e} intentos fallidos.', resumenSin: 'En {tiempo}, sin intentos fallidos.', resumenUno: 'En {tiempo}, con 1 intento fallido.',
    otra: '🔁 Otra clave', comentarAbrir: '💬 Dejar un comentario',
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendió, si fue fácil o difícil y qué le cambiarías.', ph: 'Por ejemplo: no me di cuenta de que se podía voltear una carta.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  },
  en: {
    nombre: 'The Code', laboratorio: '‹ Lab',
    lema: 'Some see-through cards hide a code. None shows it alone.',
    como: ['Find the 5-digit code and type it in.', 'Tap a card to put it on the base. ↻ turns it and ⇋ flips it.', 'With all of them on and the right way round, the strokes form the digits without overlapping.'],
    empezar: '🔐 Start', girar: '↻ Turn', voltear: '⇋ Flip', ok: 'OK',
    comoSeJuega: 'How to play', quitar: '✕ Remove', elige: 'Tap a card below to put it on.', elegida: 'Card {n}', mal: 'That’s not the code. 🔒',
    abierto: 'Unlocked!', resumen: 'In {tiempo}, with {e} wrong tries.', resumenSin: 'In {tiempo}, with no wrong tries.', resumenUno: 'In {tiempo}, with 1 wrong try.',
    otra: '🔁 Another code', comentarAbrir: '💬 Leave a comment',
    comentario: { titulo: 'What did you think?', lead: 'Tell us if it made sense, if it was easy or hard, and what you’d change.', ph: 'For example: I didn’t realize I could flip a card.', nombre: 'Name or nickname (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'No internet right now: your comment is saved on your phone and will be sent later.', error: 'Couldn’t send it. Try again in a bit.', cancelar: 'Cancel', cerrar: 'Close' },
  },
  pt: {
    nombre: 'A senha', laboratorio: '‹ Laboratório',
    lema: 'Cartas transparentes escondem uma senha. Nenhuma mostra sozinha.',
    como: ['Descubra a senha de 5 dígitos e digite.', 'Toque numa carta para colocá-la sobre a base. ↻ gira e ⇋ vira.', 'Com todas colocadas e do jeito certo, os traços formam os dígitos sem se sobrepor.'],
    empezar: '🔐 Começar', girar: '↻ Girar', voltear: '⇋ Virar', ok: 'OK',
    comoSeJuega: 'Como se joga', quitar: '✕ Tirar', elige: 'Toque numa carta abaixo para colocá-la.', elegida: 'Carta {n}', mal: 'Essa não é a senha. 🔒',
    abierto: 'Aberto!', resumen: 'Em {tiempo}, com {e} tentativas erradas.', resumenSin: 'Em {tiempo}, sem tentativas erradas.', resumenUno: 'Em {tiempo}, com 1 tentativa errada.',
    otra: '🔁 Outra senha', comentarAbrir: '💬 Deixar um comentário',
    comentario: { titulo: 'O que você achou?', lead: 'Conte se deu para entender, se foi fácil ou difícil e o que você mudaria.', ph: 'Por exemplo: não percebi que dava para virar uma carta.', nombre: 'Nome ou apelido (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Sem internet agora: seu comentário ficou no celular e será enviado depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.', cancelar: 'Cancelar', cerrar: 'Fechar' },
  },
  de: {
    nombre: 'Der Code', laboratorio: '‹ Labor',
    lema: 'Durchsichtige Karten verstecken einen Code. Keine zeigt ihn allein.',
    como: ['Finde den 5-stelligen Code und tippe ihn ein.', 'Tippe auf eine Karte, um sie auf die Basis zu legen. ↻ dreht sie, ⇋ spiegelt sie.', 'Liegen alle richtig herum, ergeben die Striche die Ziffern, ohne sich zu überlagern.'],
    empezar: '🔐 Los geht’s', girar: '↻ Drehen', voltear: '⇋ Spiegeln', ok: 'OK',
    comoSeJuega: 'So wird gespielt', quitar: '✕ Entfernen', elige: 'Tippe unten auf eine Karte, um sie aufzulegen.', elegida: 'Karte {n}', mal: 'Das ist nicht der Code. 🔒',
    abierto: 'Offen!', resumen: 'In {tiempo}, mit {e} Fehlversuchen.', resumenSin: 'In {tiempo}, ohne Fehlversuch.', resumenUno: 'In {tiempo}, mit 1 Fehlversuch.',
    otra: '🔁 Neuer Code', comentarAbrir: '💬 Kommentar schreiben',
    comentario: { titulo: 'Wie fandest du es?', lead: 'Erzähl uns, ob es verständlich war, ob es leicht oder schwer war und was du ändern würdest.', ph: 'Zum Beispiel: Ich habe nicht gemerkt, dass man eine Karte spiegeln kann.', nombre: 'Name oder Spitzname (opt.)', enviar: 'Kommentar senden', enviando: 'Wird gesendet …', vacio: 'Schreib erst etwas rein.', gracias: 'Danke! 🙌 Dein Kommentar ist angekommen.', guardado: 'Gerade kein Netz: Dein Kommentar ist auf dem Handy gespeichert und wird später automatisch gesendet.', error: 'Das hat nicht geklappt. Versuch es gleich nochmal.', cancelar: 'Abbrechen', cerrar: 'Schließen' },
  },
};
const T = TEXTOS[lang] || TEXTOS.es;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/* ------------------------------------------------------------------ */
/* Las cartas                                                          */
/* ------------------------------------------------------------------ */
// Base y cartas miden 300 × 140, con cinco cifras de 44 × 90 simétricas al centro: así girar o
// voltear una carta deja cada trazo donde cae el de otra cifra (o el de la misma).
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const ANCHO = 44, HUECO = 12;
const X0 = Array.from({ length: CIFRAS_CODIGO }, (_, i) => (300 - (CIFRAS_CODIGO * ANCHO + (CIFRAS_CODIGO - 1) * HUECO)) / 2 + i * (ANCHO + HUECO)), Y0 = 25;
const TRAZO = {
  a: [6, 0, ANCHO - 6, 0], b: [ANCHO, 6, ANCHO, 42], c: [ANCHO, 48, ANCHO, 84], d: [6, 90, ANCHO - 6, 90],
  e: [0, 48, 0, 84], f: [0, 6, 0, 42], g: [6, 45, ANCHO - 6, 45],
};
/** Un color por carta, para seguirle la pista a sus trazos. */
const COLORES = ['#ff6fa8', '#6ff3e8', '#ffd23f', '#9dff3a', '#ff9a4a', '#b18cff', '#5ab8ff', '#ff8f8f'];
/** Las letras de catorce segmentos, en celdas del mismo tamaño que las cifras (D-270). */
const TRAZO14 = {
  T: [6, 0, 38, 0], TR: [44, 6, 44, 42], BR: [44, 48, 44, 84], B: [6, 90, 38, 90], BL: [0, 48, 0, 84], TL: [0, 6, 0, 42],
  ML: [6, 45, 19, 45], MR: [25, 45, 38, 45], VT: [22, 8, 22, 39], VB: [22, 51, 22, 82],
  DTL: [7, 9, 18, 38], DTR: [37, 9, 26, 38], DBL: [18, 52, 7, 81], DBR: [26, 52, 37, 81],
};
const lineas = (segs, color, geo = TRAZO) => segs.map(({ i, s }) => {
  const [x1, y1, x2, y2] = geo[s];
  return svgEl('line', { x1: X0[i] + x1, y1: Y0 + y1, x2: X0[i] + x2, y2: Y0 + y2, class: 'seg', stroke: color });
});
const lamina = clase => svgEl('svg', { viewBox: '-8 -8 316 156', class: clase, 'aria-hidden': 'true' });

/* ------------------------------------------------------------------ */
/* La onda espacial: cada carta flota y brilla a su manera              */
/* ------------------------------------------------------------------ */
const azar = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
/** El ritmo, la altura y el vaivén con que flota una carta, y cada cuánto la cruza el brillo. */
const flotar = () => `--dur:${azar(3.2, 6.8)}s;--desde:-${azar(0, 6)}s;--alto:${azar(2, 5.5)}px;--giro:${azar(0.3, 1.4)}deg;--brillo:${azar(4.5, 11)}s;--brillo-desde:-${azar(0, 10)}s`;
/** Al terminar cada pasada del brillo, la siguiente llega a otro ritmo: así nunca se repite igual. */
function brillosAlAzar(raiz) {
  raiz.addEventListener('animationiteration', e => {
    if (e.animationName !== 'cl-tornasol' || !e.target.classList?.contains('carta')) return;
    e.target.style.setProperty('--brillo', `${azar(4.5, 11)}s`);
  });
}

/* ------------------------------------------------------------------ */
/* La partida                                                          */
/* ------------------------------------------------------------------ */
const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const P = { clave: null, n: 4, g: [], puestas: [], elegida: null, errores: 0, desde: 0, giros: 0, vueltas: 0 };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, cartas: P.n, codigo: P.clave?.codigo, errores: P.errores, giros: P.giros, vueltas: P.vueltas,
  idioma: lang, url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

/**
 * La portada: las cartas, encima de la base, prueban combinaciones a toda velocidad —giran, se
 * voltean, cambian de cara— y se van fijando una a una en la buena hasta que se lee la clave
 * (CLAVE en español; un código en los otros idiomas), en trazos de display, que brillan un rato. Se
 * desarma y vuelve a empezar, mientras la portada esté a la vista. El título ya dice el nombre: aquí
 * no se escribe como texto.
 */
function ilustracion() {
  const enPalabra = lang === 'es';
  const geo = enPalabra ? TRAZO14 : TRAZO;
  const svg = lamina('demo');
  const caja = el('div', { class: 'demo', 'aria-hidden': 'true' }, svg);
  // Los estados de una carta y lo que se ve en cada uno
  const ESTADOS = enPalabra ? palabra.ESTADOS : ['I', 'R', 'H', 'V'];
  let clave, capas, buenos, baseCapa;
  const ver = (k, e) => (enPalabra ? palabra.visibles(clave.cartas[k], e) : clave.cartas[k].trazos.map(x => mover(e, x)));
  const poner = (k, e) => capas[k].replaceChildren(...lineas(ver(k, e), COLORES[k], geo));
  const CIFRAS_DEMO = enPalabra ? palabra.LETRAS_PALABRA : CIFRAS_CODIGO;
  /** La base: en su lugar, o tantos trazos como tiene repartidos al azar por las cinco casillas. */
  const ponerBase = enSuLugar => baseCapa.replaceChildren(...lineas(enSuLugar ? clave.base
    : clave.base.map(() => ({ i: Math.floor(Math.random() * CIFRAS_DEMO), s: al(Object.keys(geo)) })), '#fff', geo));
  const armar = () => {
    clave = enPalabra ? palabra.generar(Math.random, { palabra: 'CLAVE' }) : generar();
    buenos = clave.cartas.map(c => (enPalabra ? c.bien : c.o));
    // Los trazos blancos de la base también se mueven en la animación (en el juego están quietos)
    baseCapa = svgEl('g', { class: 'capa-demo base-demo' });
    svg.replaceChildren(svgEl('rect', { x: 0, y: 0, width: 300, height: 140, rx: 12, class: 'borde' }), baseCapa);
    capas = clave.cartas.map((c, k) => { const g = svgEl('g', { class: 'capa-demo', 'data-k': k }); svg.append(g); return g; });
  };
  const al = arr => arr[Math.floor(Math.random() * arr.length)];
  const otro = (k, actual) => al(ESTADOS.filter(e => String(e) !== String(actual)));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const vivo = () => caja.isConnected;
  armar();
  if (QUIETO) { ponerBase(true); buenos.forEach((e, k) => poner(k, e)); caja.classList.add('lista'); return caja; }
  (async () => {
    await espera(60);
    while (vivo()) {
      caja.classList.remove('lista');
      const actual = clave.cartas.map(() => al(ESTADOS));
      actual.forEach((e, k) => poner(k, e));
      ponerBase(false);
      baseCapa.classList.remove('fija');
      const fijas = new Set();
      // Prueba combinaciones: cada carta que no se fijó cambia de estado cada tanto, la base reparte
      // sus trazos al azar, y todas se van fijando en un orden al azar (la base también)
      const orden = [0, 1, 2, 3, 'base'].sort(() => Math.random() - 0.5);
      const salta = g => { g.classList.remove('salta'); void g.getBoundingClientRect(); g.classList.add('salta'); };
      let paso = 0;
      while (fijas.size < orden.length && vivo()) {
        for (let k = 0; k < capas.length; k++) {
          if (fijas.has(k) || Math.random() < 0.25) continue;
          actual[k] = otro(k, actual[k]);
          poner(k, actual[k]);
          salta(capas[k]);
        }
        if (!fijas.has('base') && Math.random() < 0.75) { ponerBase(false); salta(baseCapa); }
        paso++;
        // Después de un rato, una capa encuentra su lugar cada pocos pasos
        if (paso > 12 && paso % 5 === 0) {
          const k = orden[fijas.size];
          fijas.add(k);
          if (k === 'base') { ponerBase(true); baseCapa.classList.remove('salta'); baseCapa.classList.add('fija'); }
          else { poner(k, buenos[k]); capas[k].classList.remove('salta'); capas[k].classList.add('fija'); }
        }
        await espera(95);
      }
      if (!vivo()) return;
      caja.classList.add('lista');      // todas en su lugar: la clave brilla en sus trazos
      await espera(2600);
      [...capas, baseCapa].forEach(g => g.classList.remove('fija'));
    }
  })();
  return caja;
}

/** Cómo se juega, con un dibujo por paso: tocar, girar y voltear, leer y escribir. */
const pasos = () => el('ol', { class: 'pasos' }, ...T.como.map((x, k) => el('li', {}, el('span', { class: 'paso-ico', 'aria-hidden': 'true' }, ['🎯', '👆', '✨'][k] || '•'), el('span', {}, x))));
const tituloJuego = (grande = false) => el(grande ? 'h1' : 'h2', { class: `titulo-clave${grande ? ' grande' : ''}` },
  el('span', { class: 'candado', 'aria-hidden': 'true' }, '🔐'), el('span', { class: `display ${grande ? 'display--lg' : 'display--md'} rainbow` }, T.nombre));
/** "¿Cómo se juega?" plegado al final del juego, para volver a mirarlo sin salir. */
const reglasPlegadas = () => el('details', { class: 'panel reglas-clave' }, el('summary', {}, `🔐 ${T.comoSeJuega}`), pasos());

function portada() {
  vista.replaceChildren(
    el('div', { class: 'portada' },
      tituloJuego(true),
      ilustracion(),
      el('p', { class: 'lead' }, T.lema),
      el('div', { style: 'display:flex;justify-content:center' }, langToggle())),
    el('div', { class: 'panel' }, el('p', { class: 'lead', style: 'margin:0 0 6px' }, T.comoSeJuega), pasos()),
    // La de palabra, por ahora solo en español (sus palabras son las de Toque y Fama: Palabra)
    lang === 'es' ? el('div', { class: 'modos' },
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar-palabra', onClick: () => { SFX.tap(); empezarPalabra(); } }, T.palabra),
      el('button', { type: 'button', class: 'btn btn--cyan', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.cifras))
      : el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar));
  pieComentario('portada');
}

function empezar() {
  const clave = generar();
  const n = clave.cartas.length;
  Object.assign(P, { modo: 'cifras', clave, n, g: clave.cartas.map(() => 'I'), puestas: clave.cartas.map(() => false), elegida: null, errores: 0, desde: Date.now(), giros: 0, vueltas: 0 });
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  jugar();
}

function jugar() {
  const { clave } = P;
  // La base: su borde y sus trazos, blancos; encima, una capa por carta
  const base = lamina('base');
  base.append(svgEl('rect', { x: 0, y: 0, width: 300, height: 140, rx: 12, class: 'borde' }), ...lineas(clave.base, '#fff'));
  // Lo que se ve de cada carta, girado y volteado de verdad (la animación lo muestra)
  const vistaDe = clave.cartas.map(() => ({ rot: 0, sx: 1 }));
  const capas = clave.cartas.map((c, k) => {
    const capa = svgEl('g', { class: 'capa', 'data-k': k, style: `--k:${k};--latido:${azar(2.4, 4.6)}s;--latido-desde:-${azar(0, 4)}s` });
    capa.append(...lineas(c.trazos, COLORES[k]));
    base.append(capa);
    return capa;
  });
  // Encima de todo, los trazos que quedaron uno sobre otro: así no vale (cada trazo va en una sola carta)
  const capaChoques = svgEl('g', { class: 'choques', id: 'choques' });
  const defs = svgEl('defs');
  base.prepend(defs);
  base.append(capaChoques);
  /** Un rayado diagonal fino con los colores de esas capas, una vez por combinación. */
  const rayado = capas => {
    const colores = capas.map(c => (c === 'base' ? '#ffffff' : COLORES[c]));
    const id = `rayas-${capas.join('-')}`;
    if (!defs.querySelector(`#${id}`)) {
      const ancho = 5, pat = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: ancho * colores.length, height: ancho * colores.length, patternTransform: 'rotate(45)' });
      colores.forEach((c, k) => pat.append(svgEl('rect', { x: k * ancho, y: 0, width: ancho, height: ancho * colores.length, fill: c })));
      defs.append(pat);
    }
    return id;
  };
  const miniaturas = clave.cartas.map((c, k) => {
    const mini = lamina('mini');
    mini.append(svgEl('rect', { x: 0, y: 0, width: 300, height: 140, rx: 12, class: 'borde' }));
    const capa = svgEl('g', { class: 'capa' });
    capa.append(...lineas(c.trazos, COLORES[k]));
    mini.append(capa);
    return el('button', { type: 'button', class: 'carta', 'data-k': k, style: `--color:${COLORES[k]};--k:${k};${flotar()}`, 'aria-label': fmt(T.elegida, { n: k + 1 }), onClick: () => tocar(k) },
      mini, el('span', { class: 'num' }, String(k + 1)));
  });
  const titulo = el('p', { class: 'aviso-clave', id: 'aviso', 'aria-live': 'polite' }, T.elige);
  const accion = (texto, id, cambio) => el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id, disabled: true, onClick: () => {
    if (P.elegida === null) return;
    SFX.tap(); cambio(P.elegida); dibujar();
  } }, texto);
  const controles = el('div', { class: 'controles' },
    accion(T.girar, 'btn-girar', k => { P.g[k] = girar(P.g[k]); vistaDe[k].rot += 180; P.giros++; }),
    accion(T.voltear, 'btn-voltear', k => { P.g[k] = voltear(P.g[k]); vistaDe[k].sx *= -1; P.vueltas++; }),
    accion(T.quitar, 'btn-quitar', k => { P.puestas[k] = false; P.elegida = null; }));

  const tocar = k => {
    SFX.tap(); vibrate(8);
    P.puestas[k] = true;
    P.elegida = k;
    dibujar();
  };
  const dibujar = () => {
    clave.cartas.forEach((c, k) => {
      const t = `rotate(${vistaDe[k].rot}deg) scaleX(${vistaDe[k].sx})`;
      capas[k].style.transform = t;
      capas[k].classList.toggle('puesta', P.puestas[k]);
      capas[k].classList.toggle('elegida', P.elegida === k);
      miniaturas[k].querySelector('.capa').style.transform = t;
      miniaturas[k].classList.toggle('puesta', P.puestas[k]);
      miniaturas[k].classList.toggle('elegida', P.elegida === k);
      miniaturas[k].setAttribute('aria-pressed', String(P.elegida === k));
    });
    for (const b of controles.querySelectorAll('button')) b.disabled = P.elegida === null;
    // Un trazo pisado se ve rayado con los colores de las capas que chocan: así no es, y se nota
    // sin decirlo (cada trazo del código va en una sola capa)
    const ch = choques(clave, P.g, P.puestas);
    capaChoques.replaceChildren(...ch.flatMap(x => {
      const [fondo] = lineas([x], '#150726'), [rayas] = lineas([x], `url(#${rayado(x.capas)})`);
      fondo.setAttribute('class', 'seg choque-fondo');
      rayas.setAttribute('class', 'seg choque');
      return [fondo, rayas];
    }));
    P.choques = ch.length;
    if (!titulo.classList.contains('mal')) titulo.textContent = P.elegida === null ? T.elige : fmt(T.elegida, { n: P.elegida + 1 });
  };

  const pad = teclado({
    largo: CIFRAS_CODIGO, teclas: CIFRAS, submitLabel: T.ok,
    valido: v => v.length === CIFRAS_CODIGO, puede: v => v.length < CIFRAS_CODIGO,
    onSubmit: v => {
      if (v === clave.codigo) { resultado(); return; }
      P.errores++;
      SFX.letterMiss(); vibrate([40, 40, 40]);
      titulo.className = 'aviso-clave'; void titulo.offsetWidth;
      titulo.className = 'aviso-clave mal'; titulo.textContent = T.mal;
      setTimeout(() => { if (!titulo.isConnected) return; titulo.className = 'aviso-clave'; dibujar(); }, 2500);
    },
  });
  const bandeja = el('div', { class: `bandeja n${clave.cartas.length}`, id: 'bandeja' }, ...miniaturas);
  brillosAlAzar(bandeja);
  vista.replaceChildren(
    tituloJuego(),
    el('div', { class: 'tablero', 'data-tablero': 'codigo' }, el('div', { class: 'marco', id: 'marco' }, base)),
    titulo, controles,
    bandeja,
    pad, reglasPlegadas());
  dibujar();
  pieComentario('juego');
}

/* ------------------------------------------------------------------ */
/* Palabra: letras de catorce segmentos y cartas de dos caras (D-270)  */
/* ------------------------------------------------------------------ */
function empezarPalabra() {
  const clave = palabra.generar();
  Object.assign(P, { modo: 'palabra', clave, n: clave.cartas.length, e: clave.cartas.map(() => [0, false]), puestas: clave.cartas.map(() => false), elegida: null, errores: 0, desde: Date.now(), giros: 0, vueltas: 0 });
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  jugarPalabra();
}

function jugarPalabra() {
  const { clave } = P;
  const base = lamina('base');
  base.append(svgEl('rect', { x: 0, y: 0, width: 300, height: 140, rx: 12, class: 'borde' }), ...lineas(clave.base, '#fff', TRAZO14));
  const defs = svgEl('defs');
  base.prepend(defs);
  // Cada carta: lo que se ve de su cara de ahora; girar la anima de verdad y voltear la cierra y la abre
  const vistaDe = clave.cartas.map(() => ({ rot: 0 }));
  const pintar = (g, k) => g.replaceChildren(...lineas(clave.cartas[k].caras[P.e[k][0]], COLORES[k], TRAZO14));
  const capas = clave.cartas.map((c, k) => {
    const capa = svgEl('g', { class: 'capa', 'data-k': k, style: `--k:${k};--latido:${azar(2.4, 4.6)}s;--latido-desde:-${azar(0, 4)}s` });
    pintar(capa, k);
    base.append(capa);
    return capa;
  });
  const capaChoques = svgEl('g', { class: 'choques', id: 'choques' });
  base.append(capaChoques);
  const rayado = capas => {
    const colores = capas.map(c => (c === 'base' ? '#ffffff' : COLORES[c]));
    const id = `rayas-${capas.join('-')}`;
    if (!defs.querySelector(`#${id}`)) {
      const ancho = 5, pat = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: ancho * colores.length, height: ancho * colores.length, patternTransform: 'rotate(45)' });
      colores.forEach((c, k) => pat.append(svgEl('rect', { x: k * ancho, y: 0, width: ancho, height: ancho * colores.length, fill: c })));
      defs.append(pat);
    }
    return id;
  };
  const miniaturas = clave.cartas.map((c, k) => {
    const mini = lamina('mini');
    mini.append(svgEl('rect', { x: 0, y: 0, width: 300, height: 140, rx: 12, class: 'borde' }));
    const capa = svgEl('g', { class: 'capa' });
    pintar(capa, k);
    mini.append(capa);
    const caras = el('span', { class: 'caras', 'aria-hidden': 'true' }, el('i'), el('i'));
    return el('button', { type: 'button', class: 'carta', 'data-k': k, style: `--color:${COLORES[k]};--k:${k};${flotar()}`, 'aria-label': fmt(T.elegida, { n: k + 1 }), onClick: () => tocar(k) },
      mini, el('span', { class: 'num' }, String(k + 1)), caras);
  });
  const titulo = el('p', { class: 'aviso-clave', id: 'aviso', 'aria-live': 'polite' }, T.elige);
  const accion = (texto, id, cambio) => el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id, disabled: true, onClick: () => {
    if (P.elegida === null) return;
    SFX.tap(); cambio(P.elegida); dibujar();
  } }, texto);
  const voltearCarta = k => {
    P.e[k] = [1 - P.e[k][0], P.e[k][1]]; P.vueltas++;
    // Se cierra de lado, cambia de cara y se abre: la otra cara trae otros trazos
    for (const g of [capas[k], miniaturas[k].querySelector('.capa')]) {
      g.classList.add('volteando');
      setTimeout(() => { pintar(g, k); g.classList.remove('volteando'); }, QUIETO ? 0 : 160);
    }
    setTimeout(dibujar, QUIETO ? 0 : 170);
  };
  const controles = el('div', { class: 'controles' },
    accion(T.girar, 'btn-girar', k => { P.e[k] = [P.e[k][0], !P.e[k][1]]; vistaDe[k].rot += 180; P.giros++; }),
    accion(T.voltear, 'btn-voltear', k => voltearCarta(k)),
    accion(T.quitar, 'btn-quitar', k => { P.puestas[k] = false; P.elegida = null; }));
  const tocar = k => { SFX.tap(); vibrate(8); P.puestas[k] = true; P.elegida = k; dibujar(); };
  const dibujar = () => {
    clave.cartas.forEach((c, k) => {
      const t = `rotate(${vistaDe[k].rot}deg)`;
      capas[k].style.setProperty('--giro-capa', t);
      capas[k].style.transform = t;
      capas[k].classList.toggle('puesta', P.puestas[k]);
      capas[k].classList.toggle('elegida', P.elegida === k);
      miniaturas[k].querySelector('.capa').style.transform = t;
      miniaturas[k].querySelector('.capa').style.setProperty('--giro-capa', t);
      miniaturas[k].classList.toggle('puesta', P.puestas[k]);
      miniaturas[k].classList.toggle('elegida', P.elegida === k);
      miniaturas[k].setAttribute('aria-pressed', String(P.elegida === k));
      miniaturas[k].querySelectorAll('.caras i').forEach((x, f) => x.classList.toggle('on', P.e[k][0] === f));
    });
    for (const b of controles.querySelectorAll('button')) b.disabled = P.elegida === null;
    const ch = palabra.choques(clave, P.e, P.puestas);
    capaChoques.replaceChildren(...ch.flatMap(x => {
      const [fondo] = lineas([x], '#150726', TRAZO14), [rayas] = lineas([x], `url(#${rayado(x.capas)})`, TRAZO14);
      fondo.setAttribute('class', 'seg choque-fondo');
      rayas.setAttribute('class', 'seg choque');
      return [fondo, rayas];
    }));
    P.choques = ch.length;
    if (!titulo.classList.contains('mal')) titulo.textContent = P.elegida === null ? T.elige : `${fmt(T.elegida, { n: P.elegida + 1 })} · ${fmt(T.caraDe, { c: P.e[P.elegida][0] + 1 })}`;
  };
  const pad = teclado({
    largo: palabra.LETRAS_PALABRA, teclas: alfabeto('en'), columnas: 10, acciones: 'abajo', submitLabel: T.ok,
    valido: v => v.length === palabra.LETRAS_PALABRA, puede: v => v.length < palabra.LETRAS_PALABRA,
    onSubmit: v => {
      if (v === clave.palabra) { resultado(); return; }
      P.errores++;
      SFX.letterMiss(); vibrate([40, 40, 40]);
      titulo.className = 'aviso-clave'; void titulo.offsetWidth;
      titulo.className = 'aviso-clave mal'; titulo.textContent = T.malPalabra;
      setTimeout(() => { if (!titulo.isConnected) return; titulo.className = 'aviso-clave'; dibujar(); }, 2500);
    },
  });
  const bandeja = el('div', { class: 'bandeja', id: 'bandeja' }, ...miniaturas);
  brillosAlAzar(bandeja);
  vista.replaceChildren(
    tituloJuego(),
    el('div', { class: 'tablero palabra', 'data-tablero': 'codigo' }, el('div', { class: 'marco', id: 'marco' }, base)),
    titulo, controles, bandeja, pad, reglasPlegadas());
  dibujar();
  pieComentario('juego-palabra');
}

function resultado() {
  const ms = Date.now() - P.desde;
  trackFinish({ detalle: `${P.errores} intentos fallidos · ${mmss(ms)}` });
  SFX.win();
  if (!QUIETO) confetti({ count: 180, duration: 2600 });
  pie.replaceChildren();
  vista.replaceChildren(el('div', { class: 'resultado' },
    el('div', { class: 'trofeo' }, '🔓'),
    el('h2', { class: 'display display--lg', style: 'margin:0' }, T.abierto),
    el('div', { class: 'codigo', id: 'codigo' }, P.modo === 'palabra' ? P.clave.palabra : P.clave.codigo),
    el('p', { class: 'lead', id: 'resumen', style: 'margin:0' }, fmt(P.errores > 1 ? T.resumen : P.errores ? T.resumenUno : T.resumenSin, { tiempo: mmss(ms), e: P.errores })),
    botonResultadoSolo({ C: COMMON[lang] || COMMON.es, emoji: '🔐', juego: T.nombre, puntaje: '🔓', tiempo: mmss(ms), url: withLang(`${SITIO}labs/code/`, lang), alTocar: () => SFX.tap() }),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otra', onClick: () => { SFX.tap(); if (P.modo === 'palabra') empezarPalabra(); else empezar(); } }, T.otra),
    el('a', { class: 'btn btn--ghost btn--sm', href: '../' }, T.laboratorio),
    // El comentario va abierto y al final de todo (D-265, D-268)
    formularioComentario({ T: T.comentario, contexto: contexto('resultado') })));
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */
document.documentElement.lang = lang;
document.getElementById('btn-volver').textContent = T.laboratorio;
document.getElementById('sound-slot').append(soundToggle());
initSound();
sparkles();
portada();
window.__clave = { P, palabra };
