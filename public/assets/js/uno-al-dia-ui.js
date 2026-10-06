/**
 * Uno al día en pantalla (D-230): el botón de la portada, el dado que revela el juego de hoy y la
 * tarjeta que va bajo el resultado. La lógica y la memoria están en `uno-al-dia.js`; la página
 * con todo lo acumulado, en `/today/`. Los textos van en `COMMON[lang].uad` (i18n.js).
 */
import { el } from './ui.js';
import { COMMON, SITIO, withLang } from './i18n.js';
import { GAMES, SUELTOS, PORTADA, gameById } from './games.js';
import { tirar, TEXTOS as AZAR } from './azar.js';
import { botonCompartir, cabecera, laminaResultado, nombreArchivo, compartir } from './compartir.js';
import { JUEGOS_DIA, estado, rutaDel, numeroDel, sumarDias, COMODINES_MAX, leer, anotar, unoAlDiaVisible, fechaLocal, juegoDel, semillaDel } from './uno-al-dia.js';
import { UNO_AL_DIA } from './records.js';
import { trackUnoAlDia } from './transport/stats.js';

export const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const textos = lang => (COMMON[lang] || COMMON.es);
/** La carpeta de cada juego: los de la portada (`hangman`) y los sueltos de La Copa (`queens`). */
const SLUGS = Object.fromEntries([...GAMES.filter(g => !g.torneo).map(g => [g.id, g.path.replace(/\/$/, '')]), ...SUELTOS.map(g => [g.id, g.slug])]);
/** Dónde se juega hoy, desde la raíz del sitio. */
export const rutaHoy = id => rutaDel(id, SLUGS);
/** El link de Uno al día que se comparte. */
export const URL_HOY = `${SITIO}today/`;

/** "🔥 Racha: 6 días" (o "1 día"). */
export const textoRacha = (n, lang) => (n === 1 ? textos(lang).uad.racha1 : fmt(textos(lang).uad.racha, { n }));

/**
 * Los juegos del dado, con su nombre en cada idioma. El de un juego de grupo está en `games.js`;
 * el de un solitario, en las reglas de La Copa, que pesan: se cargan recién al tirar, no al
 * dibujar la portada.
 */
async function caras() {
  const { juegosCopa, LOCALES } = await import('../../cup/rules.js');
  const por = Object.fromEntries(Object.keys(LOCALES).map(l => [l, juegosCopa(l)]));
  return JUEGOS_DIA.map(j => ({ id: j.id, emoji: j.emoji, name: gameById(j.id)?.name || Object.fromEntries(Object.keys(por).map(l => [l, por[l][j.id].nombre])) }));
}

/**
 * Tira el dado del día: rueda igual que Juego al azar, cae siempre en el juego de hoy (decisión
 * del dueño) y lo abre. `raiz` es lo que lleva de la página a la raíz del sitio ('' o '../').
 */
export async function tirarHoy({ lang, raiz = '' }) {
  const e = estado();
  if (!e.juego) return;
  trackUnoAlDia('dado');
  const pool = await caras();
  const T = textos(lang).uad;
  tirar(pool, {
    lang, T: { boton: T.nombre, tocó: fmt(T.tocó, { n: e.numero }) },
    elegido: pool.find(g => g.id === e.juego), destino: raiz + rutaHoy(e.juego),
  });
}

/** Lo que dice el acceso según el día: si ya jugó, su racha y, para la tarjeta, la segunda línea ("🔥 1 · Jugar el de hoy" o "✅ Listo · 🔥 1"). */
function estadoAcceso(lang, raiz, alTocar) {
  const T = textos(lang).uad;
  const e = estado();
  const hecho = !!e.dia;
  const linea2 = hecho
    ? `✅ ${T.listo}${e.racha ? ` · 🔥 ${e.racha}` : ''}`
    : `${e.racha ? `🔥 ${e.racha} · ` : ''}${T.jugar}`;
  const abrir = () => { alTocar?.(); trackUnoAlDia('boton'); if (hecho) location.href = `${raiz}today/`; else tirarHoy({ lang, raiz }); };
  // El estado completo para un lector de pantalla: "Uno al día: abrir el juego de hoy. 🔥 Racha: 6 días"
  const aria = [hecho ? T.ariaListo : T.aria, e.racha ? textoRacha(e.racha, lang).replace('🔥 ', '') : ''].filter(Boolean).join('. ');
  return { T, hecho, linea2, abrir, aria, racha: e.racha };
}

/**
 * El botón de la portada, a la derecha de "Al azar": una sola línea, "📅 Uno al día", con la racha
 * en una píldora (🔥 6). Mientras no juegue el de hoy, un punto brilla; jugado, se pone cian con ✅.
 * Lo que dice cada estado completo va en `aria-label` (decisión del dueño: etiquetas cortas).
 */
export function botonUnoAlDia({ lang, raiz = '', alTocar }) {
  const { T, hecho, abrir, aria, racha } = estadoAcceso(lang, raiz, alTocar);
  return el('button', { type: 'button', class: 'btn-uad' + (hecho ? ' hecho' : ''), id: 'btn-uno-al-dia', 'aria-label': aria, onClick: abrir },
    el('span', { class: 'btn-uad-titulo' }, el('span', { 'aria-hidden': 'true' }, hecho ? '✅' : '📅'), el('span', {}, T.nombre)),
    racha ? el('span', { class: 'btn-uad-racha', 'aria-hidden': 'true' }, `🔥 ${racha}`) : null,
    hecho ? null : el('span', { class: 'btn-uad-punto', 'aria-hidden': 'true' }));
}

/**
 * La otra forma de ponerlo en la portada, que se prueba desde /labs/: una tarjeta de media fila al
 * lado de La Copa, como acceso de más jerarquía que los juegos. Misma lógica que el botón.
 */
export function tarjetaUnoAlDia({ lang, raiz = '', alTocar }) {
  const { T, hecho, linea2, abrir, aria } = estadoAcceso(lang, raiz, alTocar);
  return el('button', { type: 'button', class: 'game-card alta uad-card' + (hecho ? ' hecho' : ''), id: 'btn-uno-al-dia', 'aria-label': aria, onClick: abrir },
    el('div', { class: 'emoji' }, el('span', { 'aria-hidden': 'true' }, '📅')),
    el('div', { class: 'texto' }, el('h2', {}, el('span', {}, T.nombre)), el('div', { class: 'tag' }, T.sub)),
    el('div', { class: 'meta' }, el('span', { class: 'uad-card-estado' }, linea2)),
    hecho ? null : el('span', { class: 'btn-uad-punto', 'aria-hidden': 'true' }));
}

/** Tira el dado de Juego al azar con los juegos de la portada: "🎲 Jugar otro". */
export function jugarOtro({ lang, raiz }) {
  trackUnoAlDia('otro');
  const pool = PORTADA.filter(g => g.available && !g.torneo);
  tirar(pool, { lang, base: raiz, T: AZAR[lang] || AZAR.es });
}

/**
 * El botón de compartir el resultado: la imagen de siempre pero sin el juego, y el texto con la
 * cabecera, la racha y el link (U-30, U-33). Ni el texto ni la imagen dicen qué juego tocó (#215).
 */
export function compartirHoy({ lang, fecha, dia, alTocar, mmss }) {
  const C = textos(lang);
  const titulo = fmt(C.uad.compartirTitulo, { n: numeroDel(fecha) });
  const cab = { emoji: '📅', titulo };
  const url = withLang(URL_HOY, lang);
  return botonCompartir({
    rotulo: C.shareResult, id: 'btn-compartir-uad', alTocar: () => { alTocar?.(); trackUnoAlDia('compartir'); },
    avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
    armar: async () => ({
      titulo, url,
      texto: [cabecera(cab), textoRacha(estado().racha, lang)].join('\n'),
      imagen: await laminaResultado({ cab, url, puntaje: fmt(C.uad.puntos, { s: dia.s }), detalle: dia.ms ? `⏱ ${mmss(dia.ms)}` : '', pie: C.shareSoloImage, archivo: nombreArchivo('uno-al-dia', String(numeroDel(fecha))) }),
    }),
  });
}

/**
 * La tarjeta bajo el resultado de un juego jugado como Uno al día: la racha, lo que cuenta de hoy
 * y qué hacer ahora (compartir, jugar otro, repetirlo o ver todo). `primera` dice si esta partida
 * fue el resultado del día o una práctica; `dia` es lo anotado para hoy.
 */
export function tarjetaResultado({ lang, fecha, primera, dia, raiz = '', alTocar, mmss }) {
  trackUnoAlDia(primera ? 'jugado' : 'repite');
  const T = textos(lang).uad;
  const e = estado();
  const n = e.racha;
  const hoyLinea = el('p', { style: 'margin:0', id: 'uad-hoy-puntos' }, primera ? fmt(T.hoyPuntos, { s: dia.s }) : fmt(T.practica, { s: dia.s }));
  // Lo que depende de la red (el porcentaje, el duelo, entrar, invitar, el ranking) llega después
  const comodin = lineaComodin(e, fecha, lang);
  const red = el('div', { class: 'uad-red', id: 'uad-red' });
  const tarjeta = el('div', { class: 'panel uad-tarjeta', id: 'uad-tarjeta' },
    el('p', { class: 'uad-racha' }, textoRacha(n, lang)),
    el('p', { class: 'muted', style: 'margin:0' }, fmt(T.vuelve, { n: n + 1 })),
    hoyLinea,
    comodin,
    el('div', { class: 'uad-acciones' },
      compartirHoy({ lang, fecha, dia, alTocar, mmss }),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-uad-otro', onClick: () => { alTocar?.(); jugarOtro({ lang, raiz }); } }, T.jugarOtro)),
    el('a', { class: 'btn btn--ghost btn--sm', id: 'btn-uad-todo', href: `${raiz}today/` }, T.verTodo),
    el('a', { class: 'link-btn', id: 'btn-uad-repetir', href: `${raiz}${rutaHoy(dia.j)}` }, T.repetir),
    red);
  conRed({ lang, fecha, dia, primera, hoyLinea, red, alTocar });
  return tarjeta;
}

/**
 * La línea de los comodines bajo la racha: si ayer salvó uno, si hoy ganó uno, o (con 3 días o más
 * y sin comodines) que invitando se gana uno. Nada si no hay nada que decir.
 */
function lineaComodin(e, fecha, lang) {
  const T = textos(lang).uad;
  if (e.salvados.includes(sumarDias(fecha, -1))) return el('p', { class: 'uad-comodin', id: 'uad-comodin' }, fmt(T.comodinUsado, { n: e.racha }));
  if (e.ganados.includes(fecha) && e.ganados.length === 1) return el('p', { class: 'uad-comodin', id: 'uad-comodin' }, T.comodinGanado);
  if (e.ganados.includes(fecha)) return el('p', { class: 'uad-comodin', id: 'uad-comodin' }, T.comodinGanado.split('. ')[0] + '.');
  if (e.racha >= 3 && !e.comodines) return el('p', { class: 'uad-comodin', id: 'uad-comodin' }, T.sinComodines);
  return null;
}

/** Arma la frase de los datos: "Llevo una racha de 33 días y estoy en el 10 % mejor de la semana". */
export function frase(datos, { lang, nombre = null }) {
  const T = textos(lang).uad, de = nombre ? T.el : T.yo;
  const partes = datos.map(d => fmt(de[d.k === 'constancia' && d.n === 1 ? 'constancia1' : d.k], {
    n: d.n, p: d.p, s: d.s, tabla: T.tablas[d.tabla] || '',
    juego: d.id ? nombreJuego(d.id, lang) : '',
  }));
  const junto = partes.join(` ${T.y} `);
  return nombre ? `${nombre} ${junto}` : junto.charAt(0).toLocaleUpperCase(lang) + junto.slice(1);
}
/** El nombre de un juego del mazo en un idioma (se llenan al cargar las reglas, `nombres()`). */
let NOMBRES = null;
const nombreJuego = (id, lang) => NOMBRES?.[lang]?.[id] || id;
async function nombres() {
  if (NOMBRES) return NOMBRES;
  const pool = await caras();
  NOMBRES = {};
  for (const g of pool) for (const [l, n] of Object.entries(g.name)) (NOMBRES[l] ||= {})[g.id] = n;
  return NOMBRES;
}

/**
 * La tarjeta "👋 Invita a un amigo": qué se gana (un comodín, si tiene jugador y menos de 2; si no
 * tiene, que entrando lo gana) y el botón, que manda un texto en primera persona con su dato.
 */
export function tarjetaInvitar({ lang, alTocar }) {
  const T = textos(lang).uad;
  const linea = el('p', { class: 'muted', style: 'margin:0', id: 'uad-inv-linea' });
  const b = el('button', { type: 'button', class: 'btn btn--cyan', id: 'btn-uad-invitar' }, T.invitar);
  b.addEventListener('click', async () => {
    trackUnoAlDia('invitar');
    alTocar?.();
    b.disabled = true;
    try {
      const red = await import('./uno-al-dia-red.js');
      await nombres();
      const [datos, url] = await Promise.all([red.misDatos(), red.linkInvitar(withLang(URL_HOY, lang))]);
      const texto = [cabecera({ emoji: '📅', titulo: T.nombre, contexto: T.invCab }), `🔥 ${frase(datos, { lang })}. ${T.atreves}`].join('\n');
      await compartir({ titulo: T.nombre, texto, url });
    } catch (_) { /* sin compartir no hay nada que avisar */ } finally { b.disabled = false; }
  });
  import('./uno-al-dia-red.js').then(async red => {
    const con = await red.tengoJugador();
    const e = estado();
    linea.textContent = !con ? T.invEntrar : e.comodines < COMODINES_MAX ? T.invComodin : '';
    linea.hidden = !linea.textContent;
  }).catch(() => { linea.hidden = true; });
  return el('div', { class: 'panel uad-invitar', id: 'uad-invitar' }, el('p', { class: 'lead', style: 'margin:0' }, T.invTitulo), linea, b);
}

/**
 * Lo de la tarjeta del resultado que usa la red: sube el de hoy, dice el porcentaje, el duelo con
 * quien invitó, ofrece entrar (sin jugador), invitar y el ranking de Uno al día.
 */
async function conRed({ lang, fecha, dia, primera, hoyLinea, red, alTocar }) {
  const T = textos(lang).uad;
  try {
    const R = await import('./uno-al-dia-red.js');
    const { rankingsVisibles } = await import('./jugador.js');
    if (primera) await R.subirHoy({ fecha, dia });
    // Los avisos (D-230): su último día y su racha; el globo del ícono; y la oferta, la segunda vez
    const Av = await import('./uno-al-dia-avisos.js');
    Av.globo();
    Av.refrescar({ lang }).catch(() => {});
    const of = Av.oferta({ lang, alTocar, primera });
    if (of) red.append(of);
    // El duelo con quien invitó
    const inv = R.invitador();
    if (inv) {
      const q = await R.quienInvita(inv);
      if (q) {
        const suyo = q.dias[fecha];
        red.append(el('p', { class: 'uad-duelo', id: 'uad-duelo' }, suyo ? fmt(T.duelo, { a: dia.s, n: q.n, b: suyo.s }) : fmt(T.dueloPend, { n: q.n })));
      }
    }
    if (primera) {
      const p = await R.porcentajeHoy(fecha, dia.s);
      if (p != null) hoyLinea.textContent = fmt(T.pct, { s: dia.s, p });
    }
    if (!rankingsVisibles()) return;
    const { bloqueJugador, bloqueRanking } = await import('./ranking.js');
    let invitar = tarjetaInvitar({ lang, alTocar });
    const ranking = bloqueRanking({ juego: UNO_AL_DIA, titulo: T.rankingTitulo, pestanas: ['hoy', 'semanaDia', 'rachas', 'amigosSemana'], alTocar });
    if (!(await R.tengoJugador())) {
      const entrar = el('div', { class: 'uad-entrar', id: 'uad-entrar' }, el('p', { class: 'muted', style: 'margin:0' }, T.guardaRacha), bloqueJugador({ alTocar }));
      red.append(entrar);
      // Si entra recién aquí, el de hoy igual sube; después, invitar ya no le pide entrar y el
      // ranking lo muestra
      (await import('./jugador.js')).jugador().then(J => {
        const off = J.escuchar(yo => {
          if (!yo) return;
          off(); entrar.remove();
          R.sincronizar().catch(() => {}).then(() => {
            const nueva = tarjetaInvitar({ lang, alTocar });
            invitar.replaceWith(nueva); invitar = nueva;
            ranking.recargar?.();
          });
        });
      }).catch(() => {});
    }
    red.append(invitar, ranking);
  } catch (_) { /* sin red, la tarjeta queda con lo del celular */ }
}

/**
 * La tarjeta del amigo invitado, antes del dado (en /today/?inv=…): "🔥 Sara te desafía" con su dato
 * de hoy, en tercera persona. Si no se puede leer quién invitó, la bienvenida general.
 */
export async function tarjetaDesafio({ lang, raiz = '', inv, alTocar }) {
  const T = textos(lang).uad;
  const R = await import('./uno-al-dia-red.js');
  await nombres().catch(() => null);
  const q = await R.quienInvita(inv).catch(() => null);
  const jugar = el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-uad-desafio', onClick: () => { alTocar?.(); tirarHoy({ lang, raiz }); } }, `📅 ${T.jugar}`);
  return q
    ? el('section', { class: 'panel uad-desafio', id: 'uad-desafio' }, el('h2', {}, fmt(T.desafia, { n: q.n })), el('p', {}, `${frase(q.datos, { lang, nombre: q.n })}. ${T.atreves}`), jugar)
    : el('section', { class: 'panel uad-desafio', id: 'uad-desafio' }, el('h2', {}, T.invGeneral), el('p', {}, T.invGeneralSub), jugar);
}

/* ------------------------------------------------------------------ */
/* Los juegos de grupo jugados como Uno al día                         */
/* ------------------------------------------------------------------ */

/** "1:05", como el reloj de La Copa. */
const mmss = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/**
 * El modo `?hoy` de un juego de grupo (El Ahorcado, Batalla Naval, Dudo), como el de los
 * solitarios en `cup/game.js`: sin `?hoy` o fuera del laboratorio, null. Si hoy toca otro juego (un
 * link de ayer, o pasó la medianoche), se va al de hoy y devuelve `{ fuera: true }`. Si no, la
 * fecha del jugador, la semilla del día y si ya lo jugó (entonces esta partida es práctica).
 */
export function modoHoy(id, { raiz = '../', loc = globalThis.location } = {}) {
  if (!new URLSearchParams(loc.search).has('hoy') || !unoAlDiaVisible()) return null;
  const fecha = fechaLocal(), deHoy = juegoDel(fecha);
  if (deHoy !== id) { loc.replace(raiz + rutaHoy(deHoy)); return { fuera: true }; }
  return { id, fecha, semilla: semillaDel(fecha), ya: !!leer().dias[fecha], inicio: 0 };
}

/**
 * La línea de la intro: "📅 Uno al día: hoy todos juegan el mismo desafío." (o que es práctica),
 * y si el rival responde a lo que haces, qué es lo común (`extra`: "Todos parten con los mismos dados.").
 */
export function introHoy(hoy, { lang, extra = '' }) {
  const T = textos(lang).uad;
  return el('p', { class: 'aviso uad-intro', id: 'uad-intro' }, [hoy.ya ? T.introRepite : T.intro, extra].filter(Boolean).join(' '));
}

/**
 * Al terminar la partida de hoy: la anota (el primer intento del día queda; los demás son
 * práctica) y devuelve la tarjeta del resultado, que el juego pone arriba de sus botones. Una sola
 * vez por partida: `hoy.anotado` la guarda para los redibujos de la misma pantalla.
 */
export function terminarHoy(hoy, { s, ms, lang, alTocar }) {
  if (!hoy.anotado) hoy.anotado = anotar(hoy.fecha, { j: hoy.id, s, ms });
  const { primera, dia } = hoy.anotado;
  return tarjetaResultado({ lang, fecha: hoy.fecha, primera, dia, raiz: '../', alTocar, mmss });
}

/** Pone la tarjeta justo antes de `antes` (los botones del resultado), sin duplicarla. */
export function ponerTarjeta(tarjeta, antes) {
  document.getElementById('uad-tarjeta')?.remove();
  antes.before(tarjeta);
}
