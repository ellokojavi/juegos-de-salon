/**
 * La clave — prototipo de laboratorio (D-270). Un código de 4 cifras repartido entre una base fija y
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
import { generar, girar, voltear, choques, CIFRAS_CODIGO } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'clave';
const lang = getLang();
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEXTOS = {
  es: {
    nombre: 'La clave', laboratorio: '‹ Laboratorio',
    lema: 'Unas cartas transparentes esconden un código. Ninguna lo dice sola.',
    como: ['Descubre el código de 4 cifras y escríbelo.', 'Toca una carta para ponerla sobre la base. ↻ la gira y ⇋ la voltea.', 'Con todas puestas y derechas, los trazos forman las cifras sin pisarse: un trazo en rojo está encima de otro.'],
    empezar: '🔐 Empezar', girar: '↻ Girar', voltear: '⇋ Voltear', ok: 'OK',
    quitar: '✕ Quitar', choque: '⚠️ Hay {n} trazos encima de otros: así no es.', choqueUno: '⚠️ Hay un trazo encima de otro: así no es.', elige: 'Toca una carta de abajo para ponerla.', elegida: 'Carta {n}', mal: 'Ese no es el código. 🔒',
    abierto: '¡Abierto!', resumen: 'En {tiempo}, con {e} intentos fallidos.', resumenSin: 'En {tiempo}, sin intentos fallidos.', resumenUno: 'En {tiempo}, con 1 intento fallido.',
    otra: '🔁 Otra clave', comentarAbrir: '💬 Dejar un comentario',
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendió, si fue fácil o difícil, y qué otras figuras te gustaría combinar.', ph: 'Por ejemplo: no me di cuenta de que se podía voltear; me gustaría con tres figuras.', nombre: 'Tu nombre (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', contexto: 'Lo que se envía junto', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  },
  en: {
    nombre: 'The Code', laboratorio: '‹ Lab',
    lema: 'Some see-through cards hide a code. None shows it alone.',
    como: ['Find the 4-digit code and type it in.', 'Tap a card to put it on the base. ↻ turns it and ⇋ flips it.', 'With all of them on and the right way round, the strokes form the digits without overlapping: a red stroke is on top of another.'],
    empezar: '🔐 Start', girar: '↻ Turn', voltear: '⇋ Flip', ok: 'OK',
    quitar: '✕ Remove', choque: '⚠️ {n} strokes are on top of others: that’s not it.', choqueUno: '⚠️ A stroke is on top of another: that’s not it.', elige: 'Tap a card below to put it on.', elegida: 'Card {n}', mal: 'That’s not the code. 🔒',
    abierto: 'Unlocked!', resumen: 'In {tiempo}, with {e} wrong tries.', resumenSin: 'In {tiempo}, with no wrong tries.', resumenUno: 'In {tiempo}, with 1 wrong try.',
    otra: '🔁 Another code', comentarAbrir: '💬 Leave a comment',
    comentario: { titulo: 'What did you think?', lead: 'Tell us if it made sense, if it was easy or hard, and what other shapes you’d like to combine.', ph: 'For example: I didn’t realize I could flip it; I’d like it with three shapes.', nombre: 'Your name (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'No internet right now: your comment is saved on your phone and will be sent later.', error: 'Couldn’t send it. Try again in a bit.', contexto: 'What gets sent with it', cancelar: 'Cancel', cerrar: 'Close' },
  },
  pt: {
    nombre: 'A senha', laboratorio: '‹ Laboratório',
    lema: 'Cartas transparentes escondem uma senha. Nenhuma mostra sozinha.',
    como: ['Descubra a senha de 4 dígitos e digite.', 'Toque numa carta para colocá-la sobre a base. ↻ gira e ⇋ vira.', 'Com todas colocadas e do jeito certo, os traços formam os dígitos sem se sobrepor: um traço vermelho está em cima de outro.'],
    empezar: '🔐 Começar', girar: '↻ Girar', voltear: '⇋ Virar', ok: 'OK',
    quitar: '✕ Tirar', choque: '⚠️ Há {n} traços em cima de outros: assim não é.', choqueUno: '⚠️ Há um traço em cima de outro: assim não é.', elige: 'Toque numa carta abaixo para colocá-la.', elegida: 'Carta {n}', mal: 'Essa não é a senha. 🔒',
    abierto: 'Aberto!', resumen: 'Em {tiempo}, com {e} tentativas erradas.', resumenSin: 'Em {tiempo}, sem tentativas erradas.', resumenUno: 'Em {tiempo}, com 1 tentativa errada.',
    otra: '🔁 Outra senha', comentarAbrir: '💬 Deixar um comentário',
    comentario: { titulo: 'O que você achou?', lead: 'Conte se deu para entender, se foi fácil ou difícil, e que outras figuras você gostaria de combinar.', ph: 'Por exemplo: não percebi que dava para virar; queria com três figuras.', nombre: 'Seu nome (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Sem internet agora: seu comentário ficou no celular e será enviado depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.', contexto: 'O que vai junto', cancelar: 'Cancelar', cerrar: 'Fechar' },
  },
  de: {
    nombre: 'Der Code', laboratorio: '‹ Labor',
    lema: 'Durchsichtige Karten verstecken einen Code. Keine zeigt ihn allein.',
    como: ['Finde den 4-stelligen Code und tippe ihn ein.', 'Tippe auf eine Karte, um sie auf die Basis zu legen. ↻ dreht sie, ⇋ spiegelt sie.', 'Liegen alle richtig herum, ergeben die Striche die Ziffern, ohne sich zu überlagern: Ein roter Strich liegt auf einem anderen.'],
    empezar: '🔐 Los geht’s', girar: '↻ Drehen', voltear: '⇋ Spiegeln', ok: 'OK',
    quitar: '✕ Entfernen', choque: '⚠️ {n} Striche liegen übereinander: So ist es nicht.', choqueUno: '⚠️ Ein Strich liegt auf einem anderen: So ist es nicht.', elige: 'Tippe unten auf eine Karte, um sie aufzulegen.', elegida: 'Karte {n}', mal: 'Das ist nicht der Code. 🔒',
    abierto: 'Offen!', resumen: 'In {tiempo}, mit {e} Fehlversuchen.', resumenSin: 'In {tiempo}, ohne Fehlversuch.', resumenUno: 'In {tiempo}, mit 1 Fehlversuch.',
    otra: '🔁 Neuer Code', comentarAbrir: '💬 Kommentar schreiben',
    comentario: { titulo: 'Wie fandest du es?', lead: 'Erzähl uns, ob es verständlich war, ob es leicht oder schwer war und welche Formen du gern kombinieren würdest.', ph: 'Zum Beispiel: Ich habe nicht gemerkt, dass man spiegeln kann; ich hätte gern drei Formen.', nombre: 'Dein Name (optional)', enviar: 'Kommentar senden', enviando: 'Wird gesendet …', vacio: 'Schreib erst etwas rein.', gracias: 'Danke! 🙌 Dein Kommentar ist angekommen.', guardado: 'Gerade kein Netz: Dein Kommentar ist auf dem Handy gespeichert und wird später automatisch gesendet.', error: 'Das hat nicht geklappt. Versuch es gleich nochmal.', contexto: 'Das wird mitgeschickt', cancelar: 'Abbrechen', cerrar: 'Schließen' },
  },
};
const T = TEXTOS[lang] || TEXTOS.es;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/* ------------------------------------------------------------------ */
/* Las cartas                                                          */
/* ------------------------------------------------------------------ */
// Base y cartas miden 300 × 140, con cuatro cifras de 50 × 90 simétricas al centro: así girar o
// voltear una carta deja cada trazo donde cae el de otra cifra (o el de la misma).
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const X0 = [20, 90, 160, 230], Y0 = 25;
const TRAZO = {
  a: [6, 0, 44, 0], b: [50, 6, 50, 42], c: [50, 48, 50, 84], d: [6, 90, 44, 90], e: [0, 48, 0, 84], f: [0, 6, 0, 42], g: [6, 45, 44, 45],
};
/** Un color por carta, para seguirle la pista a sus trazos. */
const COLORES = ['#ff6fa8', '#6ff3e8', '#ffd23f', '#9dff3a', '#ff9a4a', '#b18cff', '#5ab8ff', '#ff8f8f'];
const lineas = (segs, color) => segs.map(({ i, s }) => {
  const [x1, y1, x2, y2] = TRAZO[s];
  return svgEl('line', { x1: X0[i] + x1, y1: Y0 + y1, x2: X0[i] + x2, y2: Y0 + y2, class: 'seg', stroke: color });
});
const lamina = clase => svgEl('svg', { viewBox: '-8 -8 316 156', class: clase, 'aria-hidden': 'true' });

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

function portada() {
  vista.replaceChildren(
    el('div', { class: 'portada' },
      el('span', { class: 'icono', 'aria-hidden': 'true' }, '🔐'),
      el('h1', { class: 'display display--lg rainbow', style: 'margin:0' }, T.nombre),
      el('p', { class: 'lead' }, T.lema),
      el('div', { style: 'display:flex;justify-content:center' }, langToggle())),
    el('div', { class: 'panel' }, el('ol', { class: 'rules-list', style: 'margin:0' }, ...T.como.map(x => el('li', {}, x)))),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar));
  pieComentario('portada');
}

function empezar() {
  const clave = generar();
  const n = clave.cartas.length;
  Object.assign(P, { clave, n, g: clave.cartas.map(() => 'I'), puestas: clave.cartas.map(() => false), elegida: null, errores: 0, desde: Date.now(), giros: 0, vueltas: 0 });
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
    const capa = svgEl('g', { class: 'capa', 'data-k': k });
    capa.append(...lineas(c.trazos, COLORES[k]));
    base.append(capa);
    return capa;
  });
  // Encima de todo, los trazos que quedaron uno sobre otro: así no vale (cada trazo va en una sola carta)
  const capaChoques = svgEl('g', { class: 'choques', id: 'choques' });
  base.append(capaChoques);
  const miniaturas = clave.cartas.map((c, k) => {
    const mini = lamina('mini');
    mini.append(svgEl('rect', { x: 0, y: 0, width: 300, height: 140, rx: 12, class: 'borde' }));
    const capa = svgEl('g', { class: 'capa' });
    capa.append(...lineas(c.trazos, COLORES[k]));
    mini.append(capa);
    return el('button', { type: 'button', class: 'carta', 'data-k': k, style: `--color:${COLORES[k]}`, 'aria-label': fmt(T.elegida, { n: k + 1 }), onClick: () => tocar(k) },
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
    // Los choques se marcan en rojo y se dicen: no hay forma de que la clave tenga uno
    const ch = choques(clave, P.g, P.puestas);
    // Debajo, una franja oscura que tapa los colores; encima, una fila de puntos rojos que laten
    capaChoques.replaceChildren(
      ...lineas(ch, 'currentColor').map(l => { l.setAttribute('class', 'seg choque-fondo'); return l; }),
      ...lineas(ch, 'currentColor').map(l => { l.setAttribute('class', 'seg choque'); return l; }));
    P.choques = ch.length;
    if (titulo.classList.contains('mal')) return;
    titulo.classList.toggle('aviso-choque', ch.length > 0);
    titulo.textContent = ch.length ? fmt(ch.length === 1 ? T.choqueUno : T.choque, { n: ch.length }) : P.elegida === null ? T.elige : fmt(T.elegida, { n: P.elegida + 1 });
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
  vista.replaceChildren(
    el('div', { class: 'tablero' }, el('div', { class: 'marco', id: 'marco' }, base)),
    titulo, controles,
    el('div', { class: `bandeja n${clave.cartas.length}`, id: 'bandeja' }, ...miniaturas),
    pad);
  dibujar();
  pieComentario('juego');
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
    el('div', { class: 'codigo', id: 'codigo' }, P.clave.codigo),
    el('p', { class: 'lead', id: 'resumen', style: 'margin:0' }, fmt(P.errores > 1 ? T.resumen : P.errores ? T.resumenUno : T.resumenSin, { tiempo: mmss(ms), e: P.errores })),
    botonResultadoSolo({ C: COMMON[lang] || COMMON.es, emoji: '🔐', juego: T.nombre, puntaje: '🔓', tiempo: mmss(ms), url: withLang(`${SITIO}labs/code/`, lang), alTocar: () => SFX.tap() }),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otra', onClick: () => { SFX.tap(); empezar(); } }, T.otra),
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
window.__clave = { P };
