/**
 * La clave — prototipo de laboratorio (D-270). Dos figuras transparentes, cada una con la mitad de
 * los trazos de un código de 4 cifras. Hay que arrastrar la de abajo encima de la otra y girarla
 * (↻) o voltearla (⇋) hasta que los bordes calcen: ahí los trazos se juntan, se lee el código y se
 * escribe en el teclado. El motor está en engine.js; el teclado es el compartido (teclado.js).
 *
 * Arrastrar aquí es mover libre en dos dimensiones, no soltar en una fila de destinos como en
 * `arrastre.js`: por eso lleva su propio `arrastrable()`, como los Acertijos (D-269).
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { getLang, langToggle, COMMON, SITIO, withLang } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';
import { teclado, CIFRAS } from '../../assets/js/teclado.js';
import { generar, girar, voltear, calza, CIFRAS_CODIGO } from './engine.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'clave';
const lang = getLang();
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEXTOS = {
  es: {
    nombre: 'La clave', laboratorio: '‹ Laboratorio',
    lema: 'Dos figuras transparentes esconden un código. Ninguna lo dice sola.',
    como: ['Descubre el código de 4 cifras y escríbelo.', 'Arrastra la figura celeste sobre la rosada. ↻ la gira y ⇋ la voltea: los bordes tienen que calzar.', 'Cuando calcen, los trazos se juntan y aparecen las cifras.'],
    empezar: '🔐 Empezar', girar: '↻ Girar', voltear: '⇋ Voltear', ok: 'OK',
    calza: '¡Calzan! Ahora lee el código.', mal: 'Ese no es el código. 🔒',
    abierto: '¡Abierto!', resumen: 'En {tiempo}, con {e} intentos fallidos.', resumenSin: 'En {tiempo}, sin intentos fallidos.', resumenUno: 'En {tiempo}, con 1 intento fallido.',
    otra: '🔁 Otra clave', comentarAbrir: '💬 Dejar un comentario',
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos si se entendió, si fue fácil o difícil, y qué otras figuras te gustaría combinar.', ph: 'Por ejemplo: no me di cuenta de que se podía voltear; me gustaría con tres figuras.', nombre: 'Tu nombre (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', contexto: 'Lo que se envía junto', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  },
  en: {
    nombre: 'The Code', laboratorio: '‹ Lab',
    lema: 'Two see-through shapes hide a code. Neither one shows it alone.',
    como: ['Find the 4-digit code and type it in.', 'Drag the blue shape onto the pink one. ↻ turns it and ⇋ flips it: the edges have to match.', 'When they match, the strokes join and the digits appear.'],
    empezar: '🔐 Start', girar: '↻ Turn', voltear: '⇋ Flip', ok: 'OK',
    calza: 'They match! Now read the code.', mal: 'That’s not the code. 🔒',
    abierto: 'Unlocked!', resumen: 'In {tiempo}, with {e} wrong tries.', resumenSin: 'In {tiempo}, with no wrong tries.', resumenUno: 'In {tiempo}, with 1 wrong try.',
    otra: '🔁 Another code', comentarAbrir: '💬 Leave a comment',
    comentario: { titulo: 'What did you think?', lead: 'Tell us if it made sense, if it was easy or hard, and what other shapes you’d like to combine.', ph: 'For example: I didn’t realize I could flip it; I’d like it with three shapes.', nombre: 'Your name (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'No internet right now: your comment is saved on your phone and will be sent later.', error: 'Couldn’t send it. Try again in a bit.', contexto: 'What gets sent with it', cancelar: 'Cancel', cerrar: 'Close' },
  },
  pt: {
    nombre: 'A senha', laboratorio: '‹ Laboratório',
    lema: 'Duas figuras transparentes escondem uma senha. Nenhuma mostra sozinha.',
    como: ['Descubra a senha de 4 dígitos e digite.', 'Arraste a figura azul sobre a rosa. ↻ gira e ⇋ vira: as bordas têm que se encaixar.', 'Quando encaixarem, os traços se juntam e aparecem os dígitos.'],
    empezar: '🔐 Começar', girar: '↻ Girar', voltear: '⇋ Virar', ok: 'OK',
    calza: 'Encaixou! Agora leia a senha.', mal: 'Essa não é a senha. 🔒',
    abierto: 'Aberto!', resumen: 'Em {tiempo}, com {e} tentativas erradas.', resumenSin: 'Em {tiempo}, sem tentativas erradas.', resumenUno: 'Em {tiempo}, com 1 tentativa errada.',
    otra: '🔁 Outra senha', comentarAbrir: '💬 Deixar um comentário',
    comentario: { titulo: 'O que você achou?', lead: 'Conte se deu para entender, se foi fácil ou difícil, e que outras figuras você gostaria de combinar.', ph: 'Por exemplo: não percebi que dava para virar; queria com três figuras.', nombre: 'Seu nome (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Sem internet agora: seu comentário ficou no celular e será enviado depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.', contexto: 'O que vai junto', cancelar: 'Cancelar', cerrar: 'Fechar' },
  },
  de: {
    nombre: 'Der Code', laboratorio: '‹ Labor',
    lema: 'Zwei durchsichtige Formen verstecken einen Code. Keine zeigt ihn allein.',
    como: ['Finde den 4-stelligen Code und tippe ihn ein.', 'Zieh die blaue Form auf die rosa. ↻ dreht sie, ⇋ spiegelt sie: Die Ränder müssen passen.', 'Wenn sie passen, fügen sich die Striche zusammen und die Ziffern erscheinen.'],
    empezar: '🔐 Los geht’s', girar: '↻ Drehen', voltear: '⇋ Spiegeln', ok: 'OK',
    calza: 'Passt! Jetzt lies den Code.', mal: 'Das ist nicht der Code. 🔒',
    abierto: 'Offen!', resumen: 'In {tiempo}, mit {e} Fehlversuchen.', resumenSin: 'In {tiempo}, ohne Fehlversuch.', resumenUno: 'In {tiempo}, mit 1 Fehlversuch.',
    otra: '🔁 Neuer Code', comentarAbrir: '💬 Kommentar schreiben',
    comentario: { titulo: 'Wie fandest du es?', lead: 'Erzähl uns, ob es verständlich war, ob es leicht oder schwer war und welche Formen du gern kombinieren würdest.', ph: 'Zum Beispiel: Ich habe nicht gemerkt, dass man spiegeln kann; ich hätte gern drei Formen.', nombre: 'Dein Name (optional)', enviar: 'Kommentar senden', enviando: 'Wird gesendet …', vacio: 'Schreib erst etwas rein.', gracias: 'Danke! 🙌 Dein Kommentar ist angekommen.', guardado: 'Gerade kein Netz: Dein Kommentar ist auf dem Handy gespeichert und wird später automatisch gesendet.', error: 'Das hat nicht geklappt. Versuch es gleich nochmal.', contexto: 'Das wird mitgeschickt', cancelar: 'Abbrechen', cerrar: 'Schließen' },
  },
};
const T = TEXTOS[lang] || TEXTOS.es;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/* ------------------------------------------------------------------ */
/* Las figuras                                                         */
/* ------------------------------------------------------------------ */
// Una tarjeta de 300 × 140 con la esquina de arriba a la izquierda cortada: el corte dice la
// orientación, y es lo que hay que hacer calzar. Cuatro cifras de 50 × 90, simétricas al centro.
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const SILUETA = 'M28,0 H288 Q300,0 300,12 V128 Q300,140 288,140 H12 Q0,140 0,128 V28 Z';
const X0 = [20, 90, 160, 230], Y0 = 25;
const TRAZO = {
  a: [6, 0, 44, 0], b: [50, 6, 50, 42], c: [50, 48, 50, 84], d: [6, 90, 44, 90], e: [0, 48, 0, 84], f: [0, 6, 0, 42], g: [6, 45, 44, 45],
};
// El borde de la figura móvil se dibuja con la misma orientación "deshecha" que sus trazos
const ORIENTAR = { I: '', R: 'rotate(180 150 70)', H: 'matrix(-1 0 0 1 300 0)', V: 'matrix(1 0 0 -1 0 140)' };
function figura(segs, clase, o = 'I') {
  const svg = svgEl('svg', { viewBox: '-8 -8 316 156', class: 'lamina', 'aria-hidden': 'true' });
  svg.append(svgEl('path', { d: SILUETA, class: 'borde', transform: ORIENTAR[o] }));
  for (const { i, s } of segs) {
    const [x1, y1, x2, y2] = TRAZO[s];
    svg.append(svgEl('line', { x1: X0[i] + x1, y1: Y0 + y1, x2: X0[i] + x2, y2: Y0 + y2, class: 'seg' }));
  }
  return el('div', { class: `figura ${clase}` }, svg);
}

/** Mover libre con el dedo o el mouse. `alMover(x, y)` y `alSoltar()` deciden qué pasa. */
function arrastrable(nodo, { inicio, alMover, alSoltar }) {
  let x0 = 0, y0 = 0, activo = false;
  nodo.addEventListener('pointerdown', e => {
    const [x, y] = inicio();
    activo = true; x0 = e.clientX - x; y0 = e.clientY - y;
    nodo.setPointerCapture(e.pointerId); nodo.classList.add('arrastrando'); e.preventDefault();
  });
  nodo.addEventListener('pointermove', e => { if (activo) alMover(e.clientX - x0, e.clientY - y0); });
  const fin = () => { if (!activo) return; activo = false; nodo.classList.remove('arrastrando'); alSoltar(); };
  nodo.addEventListener('pointerup', fin);
  nodo.addEventListener('pointercancel', fin);
}

/* ------------------------------------------------------------------ */
/* La partida                                                          */
/* ------------------------------------------------------------------ */
const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const P = { clave: null, g: 'I', encajada: false, abierta: false, errores: 0, desde: 0, giros: 0, vueltas: 0 };

function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, codigo: P.clave?.codigo, orientacion: P.clave?.o, errores: P.errores, giros: P.giros, vueltas: P.vueltas,
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
  Object.assign(P, { clave: generar(), g: 'I', encajada: false, abierta: false, errores: 0, desde: Date.now(), giros: 0, vueltas: 0 });
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  jugar();
}

function jugar() {
  const escenario = el('div', { class: 'escenario', id: 'escenario' });
  const fija = figura(P.clave.a, 'fija');
  const movil = figura(P.clave.b, 'movil', P.clave.o);
  movil.id = 'figura-movil';
  fija.id = 'figura-fija';
  escenario.append(fija, movil);
  const aviso = el('p', { class: 'aviso-clave', id: 'aviso', 'aria-live': 'polite' }, '');
  let rot = 0, sx = 1;   // lo que se ve, para que la animación gire y voltee de verdad
  const lamina = movil.querySelector('svg');
  const orientar = () => { lamina.style.transform = `rotate(${rot}deg) scaleX(${sx})`; };

  // Las medidas: las dos del mismo ancho; la fija arriba y la móvil abajo, un poco corrida
  let W = 0, H = 0, ax = 0, ay = 14, bx = 0, by = 0;
  const medir = () => {
    const ancho = escenario.clientWidth;
    W = Math.min(ancho - 24, 320); H = W * 156 / 316;
    ax = (ancho - W) / 2;
    for (const f of [fija, movil]) f.style.width = `${W}px`;
    escenario.style.height = `${Math.round(ay + H + 26 + H + 14)}px`;
    fija.style.transform = `translate(${ax}px, ${ay}px)`;
  };
  const poner = (x, y) => { bx = x; by = y; movil.style.transform = `translate(${bx}px, ${by}px)`; };
  const revisar = () => {
    movil.classList.toggle('encajada', P.encajada);
    const ahora = P.encajada && calza(P.clave, P.g);
    escenario.classList.toggle('abierta', ahora);
    if (ahora && !P.abierta) { SFX.reveal(); vibrate([20, 40, 20]); aviso.className = 'aviso-clave bien'; aviso.textContent = T.calza; }
    if (!ahora && P.abierta) { aviso.className = 'aviso-clave'; aviso.textContent = ''; }
    P.abierta = ahora;
  };
  arrastrable(movil, {
    inicio: () => [bx, by],
    alMover: (x, y) => { P.encajada = false; revisar(); poner(x, y); },
    alSoltar: () => {
      // Cerca de la fija, se encaja justo encima
      if (Math.hypot(bx - ax, by - ay) < W * 0.2) { poner(ax, ay); P.encajada = true; SFX.tap(); vibrate(15); }
      revisar();
    },
  });
  const accion = (cambio, texto, id) => el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id, onClick: () => {
    SFX.tap(); cambio(); orientar(); revisar();
  } }, texto);
  const controles = el('div', { class: 'controles' },
    accion(() => { P.g = girar(P.g); rot += 180; P.giros++; }, T.girar, 'btn-girar'),
    accion(() => { P.g = voltear(P.g); sx = -sx; P.vueltas++; }, T.voltear, 'btn-voltear'));
  const pad = teclado({
    largo: CIFRAS_CODIGO, teclas: CIFRAS, submitLabel: T.ok,
    valido: v => v.length === CIFRAS_CODIGO, puede: v => v.length < CIFRAS_CODIGO,
    onSubmit: v => {
      if (v === P.clave.codigo) { resultado(); return; }
      P.errores++;
      SFX.letterMiss(); vibrate([40, 40, 40]);
      aviso.className = 'aviso-clave'; void aviso.offsetWidth;
      aviso.className = 'aviso-clave mal'; aviso.textContent = T.mal;
    },
  });
  vista.replaceChildren(escenario, controles, aviso, pad);
  medir();
  poner(ax, ay + H + 26);
  orientar();
  addEventListener('resize', () => { if (!escenario.isConnected) return; medir(); if (P.encajada) poner(ax, ay); });
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
