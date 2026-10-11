/**
 * Acertijos con truco — prototipo de laboratorio (D-269), al estilo de Brain Test: cinco acertijos
 * en que la respuesta obvia no es la buena. Cada uno es un minijuego con su propio gesto (tocar,
 * elegir, arrastrar la pregunta, arrastrar una nube) y un narrador que se burla un poco.
 *
 * Los acertijos no dependen del idioma: la trampa está en el dibujo o en la pantalla, nunca en un
 * juego de palabras, así que se juegan igual en los cuatro idiomas (C-3).
 *
 * Arrastrar aquí es mover libre en dos dimensiones (una nube, la pregunta), no soltar en una fila de
 * destinos como en `arrastre.js`: por eso lleva su propio `arrastrable()`, de diez líneas.
 */
import { el, vibrate, sparkles, confetti } from '../../assets/js/ui.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { getLang, langToggle, COMMON, SITIO, withLang } from '../../assets/js/i18n.js';
import { botonResultadoSolo } from '../../assets/js/compartir.js';
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { formularioComentario, abrirComentario } from '../../assets/js/labs-idioma.js';

trackVisit();   // el tráfico del sitio (D-208)

const GAME_ID = 'acertijos';
const lang = getLang();
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEXTOS = {
  es: {
    nombre: 'Acertijos', laboratorio: '‹ Laboratorio',
    lema: 'Cinco acertijos con truco. La respuesta obvia casi nunca es la buena.',
    como: ['Resuelve los 5 acertijos.', 'Toca, arrastra y mira toda la pantalla: la trampa puede estar en cualquier parte.', 'Si te trabas, 💡 te da una pista.'],
    empezar: '🤔 Empezar', nivel: 'Acertijo {n} de {t}', pista: '💡 Pista', siguiente: 'Siguiente ›', verResultado: 'Ver cómo me fue',
    bien: ['¡Bien! Ese era fácil… ¿o no?', '¡Eso! Tienes buen ojo. 👀', '¡Lo pillaste! 🧠', 'Mmm… ¿ya lo conocías?', '¡Ja! No caíste.'],
    mal: ['Nop. Piénsalo de nuevo.', 'Casi… pero no.', 'Ese es el truco fácil. Busca otro.'],
    fin: '¡Terminaste!', resumen: '{l} de {t} sin pista · {e} errores · ⏱ {tiempo}',
    otraVez: '🔁 Jugar de nuevo', comentarAbrir: '💬 Dejar un comentario',
    l1: { q: 'Toca el animal más grande.', mal: 'Ese es el dibujo más grande, no el animal.', pista: 'No se trata del tamaño del dibujo.' },
    l2: { q: '¿Cuántos cuadrados hay?', mal: 'Cuéntalos de nuevo. ¿Todos, todos?', pista: 'El cuadrado de afuera también cuenta.' },
    l3: { q: 'Encuentra la llave.', nada: 'Ahí no está. 🙃', pista: '¿Y si la pregunta estorba?' },
    l4: { q: 'Tapa el sol.', quema: '¡Auch! Con el dedo no se tapa el sol. 🔥', pista: 'Algo se asoma por el borde.' },
    l5: { q: '¿Qué pesa más?', a: '🪶 1 kg de plumas', b: '🪨 1 kg de piedras', c: '⚖️ Pesan lo mismo', mal: 'Léelo de nuevo, despacio. 🤓', pista: 'Fíjate en cuánto hay de cada uno.' },
    comentario: { titulo: '¿Qué te pareció?', lead: 'Cuéntanos qué acertijo te gustó, cuál fue muy fácil o muy difícil, o se te ocurre uno nuevo.', ph: 'Por ejemplo: el de la llave me encantó; el del kilo ya lo conocía.', nombre: 'Tu nombre (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', contexto: 'Lo que se envía junto', cancelar: 'Cancelar', cerrar: 'Cerrar' },
  },
  en: {
    nombre: 'Tricky Riddles', laboratorio: '‹ Lab',
    lema: 'Five tricky riddles. The obvious answer is almost never the right one.',
    como: ['Solve all 5 riddles.', 'Tap, drag and look at the whole screen: the trick can be anywhere.', 'If you get stuck, 💡 gives you a hint.'],
    empezar: '🤔 Start', nivel: 'Riddle {n} of {t}', pista: '💡 Hint', siguiente: 'Next ›', verResultado: 'See how I did',
    bien: ['Nice! That was easy… or was it?', 'Yes! You have a good eye. 👀', 'You got it! 🧠', 'Hmm… had you seen it before?', 'Ha! You didn’t fall for it.'],
    mal: ['Nope. Think again.', 'Close… but no.', 'That’s the easy trick. Look for another.'],
    fin: 'You finished!', resumen: '{l} of {t} without a hint · {e} mistakes · ⏱ {tiempo}',
    otraVez: '🔁 Play again', comentarAbrir: '💬 Leave a comment',
    l1: { q: 'Tap the biggest animal.', mal: 'That’s the biggest drawing, not the biggest animal.', pista: 'It’s not about the size of the drawing.' },
    l2: { q: 'How many squares are there?', mal: 'Count again. All of them?', pista: 'The outer square counts too.' },
    l3: { q: 'Find the key.', nada: 'Not there. 🙃', pista: 'What if the question is in the way?' },
    l4: { q: 'Cover the sun.', quema: 'Ouch! You can’t cover the sun with your finger. 🔥', pista: 'Something is peeking in from the edge.' },
    l5: { q: 'Which weighs more?', a: '🪶 1 kg of feathers', b: '🪨 1 kg of stones', c: '⚖️ They weigh the same', mal: 'Read it again, slowly. 🤓', pista: 'Look at how much there is of each.' },
    comentario: { titulo: 'What did you think?', lead: 'Tell us which riddle you liked, which was too easy or too hard, or share an idea for a new one.', ph: 'For example: loved the key one; I already knew the kilo one.', nombre: 'Your name (optional)', enviar: 'Send comment', enviando: 'Sending…', vacio: 'Write something first.', gracias: 'Thanks! 🙌 Your comment arrived.', guardado: 'No internet right now: your comment is saved on your phone and will be sent later.', error: 'Couldn’t send it. Try again in a bit.', contexto: 'What gets sent with it', cancelar: 'Cancel', cerrar: 'Close' },
  },
  pt: {
    nombre: 'Enigmas', laboratorio: '‹ Laboratório',
    lema: 'Cinco enigmas com pegadinha. A resposta óbvia quase nunca é a certa.',
    como: ['Resolva os 5 enigmas.', 'Toque, arraste e olhe a tela toda: a pegadinha pode estar em qualquer lugar.', 'Se travar, 💡 dá uma dica.'],
    empezar: '🤔 Começar', nivel: 'Enigma {n} de {t}', pista: '💡 Dica', siguiente: 'Próximo ›', verResultado: 'Ver como fui',
    bien: ['Boa! Essa era fácil… ou não?', 'Isso! Você tem olho bom. 👀', 'Pegou! 🧠', 'Hmm… você já conhecia?', 'Rá! Não caiu.'],
    mal: ['Não. Pense de novo.', 'Quase… mas não.', 'Essa é a pegadinha fácil. Procure outra.'],
    fin: 'Você terminou!', resumen: '{l} de {t} sem dica · {e} erros · ⏱ {tiempo}',
    otraVez: '🔁 Jogar de novo', comentarAbrir: '💬 Deixar um comentário',
    l1: { q: 'Toque no maior animal.', mal: 'Esse é o maior desenho, não o maior animal.', pista: 'Não é sobre o tamanho do desenho.' },
    l2: { q: 'Quantos quadrados há?', mal: 'Conte de novo. Todos mesmo?', pista: 'O quadrado de fora também conta.' },
    l3: { q: 'Encontre a chave.', nada: 'Não está aí. 🙃', pista: 'E se a pergunta estiver atrapalhando?' },
    l4: { q: 'Tape o sol.', quema: 'Ai! Não dá para tapar o sol com o dedo. 🔥', pista: 'Tem algo aparecendo na borda.' },
    l5: { q: 'O que pesa mais?', a: '🪶 1 kg de penas', b: '🪨 1 kg de pedras', c: '⚖️ Pesam o mesmo', mal: 'Leia de novo, devagar. 🤓', pista: 'Veja quanto há de cada um.' },
    comentario: { titulo: 'O que você achou?', lead: 'Conte qual enigma você curtiu, qual foi fácil ou difícil demais, ou dê ideia de um novo.', ph: 'Por exemplo: adorei o da chave; o do quilo eu já conhecia.', nombre: 'Seu nome (opcional)', enviar: 'Enviar comentário', enviando: 'Enviando…', vacio: 'Escreva algo primeiro.', gracias: 'Obrigado! 🙌 Seu comentário chegou.', guardado: 'Sem internet agora: seu comentário ficou no celular e será enviado depois.', error: 'Não deu para enviar. Tente de novo daqui a pouco.', contexto: 'O que vai junto', cancelar: 'Cancelar', cerrar: 'Fechar' },
  },
  de: {
    nombre: 'Knobeleien', laboratorio: '‹ Labor',
    lema: 'Fünf knifflige Rätsel. Die naheliegende Antwort ist fast nie die richtige.',
    como: ['Löse alle 5 Rätsel.', 'Tippe, ziehe und schau dir den ganzen Bildschirm an: Der Trick kann überall stecken.', 'Wenn du nicht weiterkommst, gibt dir 💡 einen Tipp.'],
    empezar: '🤔 Los geht’s', nivel: 'Rätsel {n} von {t}', pista: '💡 Tipp', siguiente: 'Weiter ›', verResultado: 'Mein Ergebnis',
    bien: ['Gut! Das war leicht … oder?', 'Ja! Du hast ein gutes Auge. 👀', 'Erwischt! 🧠', 'Hm … kanntest du das schon?', 'Ha! Nicht reingefallen.'],
    mal: ['Nö. Denk nochmal nach.', 'Fast … aber nein.', 'Das ist der einfache Trick. Such einen anderen.'],
    fin: 'Geschafft!', resumen: '{l} von {t} ohne Tipp · {e} Fehler · ⏱ {tiempo}',
    otraVez: '🔁 Nochmal spielen', comentarAbrir: '💬 Kommentar schreiben',
    l1: { q: 'Tippe auf das größte Tier.', mal: 'Das ist die größte Zeichnung, nicht das größte Tier.', pista: 'Es geht nicht um die Größe der Zeichnung.' },
    l2: { q: 'Wie viele Quadrate siehst du?', mal: 'Zähl nochmal. Wirklich alle?', pista: 'Das äußere Quadrat zählt auch.' },
    l3: { q: 'Finde den Schlüssel.', nada: 'Da ist er nicht. 🙃', pista: 'Was, wenn die Frage im Weg ist?' },
    l4: { q: 'Verdecke die Sonne.', quema: 'Autsch! Mit dem Finger verdeckst du die Sonne nicht. 🔥', pista: 'Am Rand schaut etwas herein.' },
    l5: { q: 'Was ist schwerer?', a: '🪶 1 kg Federn', b: '🪨 1 kg Steine', c: '⚖️ Beides gleich schwer', mal: 'Lies es nochmal, ganz langsam. 🤓', pista: 'Schau, wie viel es von jedem ist.' },
    comentario: { titulo: 'Wie fandest du es?', lead: 'Erzähl uns, welches Rätsel dir gefallen hat, welches zu leicht oder zu schwer war, oder schlag ein neues vor.', ph: 'Zum Beispiel: Das mit dem Schlüssel war super; das mit dem Kilo kannte ich schon.', nombre: 'Dein Name (optional)', enviar: 'Kommentar senden', enviando: 'Wird gesendet …', vacio: 'Schreib erst etwas rein.', gracias: 'Danke! 🙌 Dein Kommentar ist angekommen.', guardado: 'Gerade kein Netz: Dein Kommentar ist auf dem Handy gespeichert und wird später automatisch gesendet.', error: 'Das hat nicht geklappt. Versuch es gleich nochmal.', contexto: 'Das wird mitgeschickt', cancelar: 'Abbrechen', cerrar: 'Schließen' },
  },
};
const T = TEXTOS[lang] || TEXTOS.es;
const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const azar = xs => xs[Math.floor(Math.random() * xs.length)];
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/** Mover libre con el dedo o el mouse (la nube, la pregunta). `alSoltar` decide qué pasó. */
function arrastrable(nodo, { alSoltar = () => {} } = {}) {
  let x0 = 0, y0 = 0, dx = 0, dy = 0, activo = false;
  nodo.addEventListener('pointerdown', e => { activo = true; x0 = e.clientX - dx; y0 = e.clientY - dy; nodo.setPointerCapture(e.pointerId); e.preventDefault(); });
  nodo.addEventListener('pointermove', e => {
    if (!activo) return;
    dx = e.clientX - x0; dy = e.clientY - y0;
    nodo.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  const fin = () => { if (activo) { activo = false; alSoltar(); } };
  nodo.addEventListener('pointerup', fin);
  nodo.addEventListener('pointercancel', fin);
}
const centro = n => { const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

/* ------------------------------------------------------------------ */
/* Los cinco acertijos                                                 */
/* ------------------------------------------------------------------ */
// Cada uno arma su escena y llama a `bien()` o a `mal(texto)`. `pregunta` es el cuadro de la
// pregunta, por si el acertijo la necesita (el de la llave la deja mover).
const ACERTIJOS = [
  {
    // El más grande de verdad es el elefante, dibujado chiquito
    id: 'animal', t: T.l1,
    montar({ escena, bien, mal }) {
      const fila = el('div', { class: 'animales' });
      for (const [emoji, px] of [['🐭', 112], ['🐘', 30], ['🐈', 74], ['🐜', 92]]) {
        fila.append(el('button', { type: 'button', class: 'cosa', style: `font-size:${px}px`, 'aria-label': emoji, onClick: () => (emoji === '🐘' ? bien() : mal(emoji === '🐭' || emoji === '🐜' ? T.l1.mal : null)) }, emoji));
      }
      escena.append(fila);
    },
  },
  {
    // Cuatro chicos y el grande de afuera: cinco
    id: 'cuadrados', t: T.l2,
    montar({ escena, abajo, bien, mal }) {
      escena.append(el('div', { class: 'cuadrado-2x2', 'aria-hidden': 'true' }, el('span'), el('span'), el('span'), el('span')));
      abajo.append(el('div', { class: 'opciones' }, ...[4, 5, 8, 9].map(n => el('button', { type: 'button', class: 'btn btn--ghost', 'data-n': n, onClick: () => (n === 5 ? bien() : mal(n === 4 ? T.l2.mal : null)) }, String(n)))));
    },
  },
  {
    // La llave está debajo de la pregunta: hay que correrla
    id: 'llave', t: T.l3,
    montar({ escena, pregunta, bien, mal }) {
      const cosas = [['🛋️', 30, 62], ['🪴', 78, 30], ['🖼️', 22, 24], ['🧸', 70, 74], ['📚', 50, 46]];
      for (const [emoji, x, y] of cosas) escena.append(el('button', { type: 'button', class: 'cosa', style: `font-size:52px;left:${x}%;top:${y}%;translate:-50% -50%`, onClick: () => mal(T.l3.nada) }, emoji));
      const llave = el('button', { type: 'button', class: 'cosa', id: 'llave', style: 'font-size:34px;padding:0;left:50%;top:50%;translate:-50% -50%;position:absolute;z-index:1', 'aria-label': '🔑', onClick: bien }, '🔑');
      pregunta.parentElement.append(llave);
      pregunta.classList.add('movible');
      arrastrable(pregunta);
    },
  },
  {
    // Una nube se asoma por el borde: se arrastra sobre el sol
    id: 'sol', t: T.l4,
    montar({ escena, bien, mal }) {
      const sol = el('button', { type: 'button', class: 'cosa', id: 'sol', style: 'font-size:110px;left:50%;top:50%;translate:-50% -50%', onClick: () => mal(T.l4.quema) }, '☀️');
      const nube = el('div', { class: 'cosa arrastrable', id: 'nube', style: 'font-size:96px;left:calc(100% - 46px);top:18%' }, '☁️');
      let listo = false;
      arrastrable(nube, {
        alSoltar() {
          const [sx, sy] = centro(sol), [nx, ny] = centro(nube);
          if (!listo && Math.hypot(sx - nx, sy - ny) < 70) { listo = true; escena.style.background = 'rgba(40, 60, 90, 0.6)'; bien(); }
        },
      });
      escena.append(sol, nube);
    },
  },
  {
    // Un kilo es un kilo
    id: 'kilo', t: T.l5,
    montar({ escena, abajo, bien, mal }) {
      escena.append(el('div', { style: 'font-size:84px' }, '⚖️'));
      abajo.append(el('div', { class: 'opciones' },
        el('button', { type: 'button', class: 'btn btn--ghost', 'data-op': 'a', onClick: () => mal(T.l5.mal) }, T.l5.a),
        el('button', { type: 'button', class: 'btn btn--ghost', 'data-op': 'b', onClick: () => mal(T.l5.mal) }, T.l5.b),
        el('button', { type: 'button', class: 'btn btn--ghost', 'data-op': 'c', onClick: bien }, T.l5.c)));
    },
  },
];

/* ------------------------------------------------------------------ */
/* La partida                                                          */
/* ------------------------------------------------------------------ */
const vista = document.getElementById('vista');
const pie = document.getElementById('pie');
const P = { nivel: 0, errores: ACERTIJOS.map(() => 0), pistas: ACERTIJOS.map(() => false), desde: 0, ms: 0 };

/** El link al formulario de comentarios, al final de cada vista (D-268). */
function pieComentario(pantalla) {
  pie.replaceChildren(el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => { SFX.tap(); abrirComentario({ T: T.comentario, contexto: contexto(pantalla) }); },
  }, T.comentarAbrir));
}
const contexto = pantalla => ({
  juego: GAME_ID, pantalla, nivel: P.nivel + 1, errores: P.errores.join(','), pistas: P.pistas.map(Number).join(','),
  idioma: lang, url: location.pathname + location.search, pantallaTam: `${innerWidth}×${innerHeight}`, navegador: navigator.userAgent.slice(0, 160),
});

function portada() {
  vista.replaceChildren(
    el('div', { class: 'portada' },
      el('span', { class: 'icono', 'aria-hidden': 'true' }, '🤔'),
      el('h1', { class: 'display display--lg rainbow', style: 'margin:0' }, T.nombre),
      el('p', { class: 'lead' }, T.lema),
      el('div', { style: 'display:flex;justify-content:center' }, langToggle())),
    el('div', { class: 'panel' }, el('ol', { class: 'rules-list', style: 'margin:0' }, ...T.como.map(x => el('li', {}, x)))),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-empezar', onClick: () => { SFX.tap(); empezar(); } }, T.empezar));
  pieComentario('portada');
}

function empezar() {
  Object.assign(P, { nivel: 0, errores: ACERTIJOS.map(() => 0), pistas: ACERTIJOS.map(() => false), desde: Date.now(), ms: 0 });
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
  acertijo();
}

function acertijo() {
  const A = ACERTIJOS[P.nivel];
  let resuelto = false;
  const narrador = el('div', { class: 'narrador', 'aria-live': 'polite' }, el('span', { class: 'cara' }, '🤔'), el('span', {}, ''));
  const decir = (tipo, texto, cara) => {
    narrador.className = `narrador ${tipo}`;
    narrador.replaceChildren(el('span', { class: 'cara' }, cara), el('span', {}, texto));
  };
  const pregunta = el('div', { class: 'pregunta', id: 'pregunta' }, A.t.q);
  const marco = el('div', { style: 'position:relative' }, pregunta);
  const escena = el('div', { class: 'escena', id: 'escena' });
  const abajo = el('div', { class: 'stack' });
  const acciones = el('div', { class: 'acciones' });
  const botonPista = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'btn-pista', onClick: () => {
    if (resuelto) return;
    SFX.tap(); P.pistas[P.nivel] = true;
    decir('pista', A.t.pista, '💡');
  } }, T.pista);
  acciones.append(botonPista);
  const bien = () => {
    if (resuelto) return;
    resuelto = true;
    SFX.letterHit(); vibrate(25);
    decir('bien', azar(T.bien), '😎');
    if (!QUIETO) confetti({ count: 60, duration: 1200 });
    const ultimo = P.nivel === ACERTIJOS.length - 1;
    acciones.replaceChildren(el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-siguiente', onClick: () => {
      SFX.tap();
      if (ultimo) resultado(); else { P.nivel++; acertijo(); }
    } }, ultimo ? T.verResultado : T.siguiente));
  };
  const mal = texto => {
    if (resuelto) return;
    P.errores[P.nivel]++;
    SFX.letterMiss(); vibrate([40, 40, 40]);
    decir('mal', texto || azar(T.mal), '😏');
  };
  vista.replaceChildren(
    el('div', { class: 'cabeza-nivel' },
      el('span', {}, fmt(T.nivel, { n: P.nivel + 1, t: ACERTIJOS.length })),
      el('span', { class: 'puntos-nivel', 'aria-hidden': 'true' }, ...ACERTIJOS.map((_, i) => el('span', { class: i < P.nivel ? 'hecho' : i === P.nivel ? 'ahora' : '' })))),
    marco, escena, abajo, narrador, acciones);
  A.montar({ escena, abajo, pregunta, bien, mal });
  pieComentario(`acertijo-${A.id}`);
}

function resultado() {
  P.ms = Date.now() - P.desde;
  const limpios = P.pistas.filter(x => !x).length;
  const errores = P.errores.reduce((a, b) => a + b, 0);
  // Una casilla por acertijo: verde sin pista ni error, amarillo con pista, rojo con algún error
  const tarjeta = ACERTIJOS.map((_, i) => (P.pistas[i] ? '🟨' : P.errores[i] ? '🟥' : '🟩')).join('');
  trackFinish({ detalle: `${limpios}/5 · ${errores} errores · ${mmss(P.ms)}` });
  SFX.win();
  if (!QUIETO) confetti({ count: 180, duration: 2600 });
  pie.replaceChildren();
  vista.replaceChildren(el('div', { class: 'resultado' },
    el('div', { class: 'trofeo' }, limpios === ACERTIJOS.length && !errores ? '🏆' : '🤔'),
    el('h2', { class: 'display display--lg', style: 'margin:0' }, T.fin),
    el('p', { class: 'lead', id: 'resumen', style: 'margin:0' }, fmt(T.resumen, { l: limpios, t: ACERTIJOS.length, e: errores, tiempo: mmss(P.ms) })),
    el('div', { class: 'tarjeta', 'aria-hidden': 'true' }, tarjeta),
    botonResultadoSolo({ C: COMMON[lang] || COMMON.es, emoji: '🤔', juego: T.nombre, puntaje: `${limpios}/${ACERTIJOS.length}`, tiempo: mmss(P.ms), tarjeta, url: withLang(`${SITIO}labs/riddles/`, lang), alTocar: () => SFX.tap() }),
    el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-otra-vez', onClick: () => { SFX.tap(); empezar(); } }, T.otraVez),
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
window.__acertijos = { P, ACERTIJOS: ACERTIJOS.map(a => a.id) };
