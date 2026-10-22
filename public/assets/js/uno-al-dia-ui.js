/**
 * Uno al día en pantalla (D-230): el botón de la portada, el dado que revela el juego de hoy y la
 * tarjeta que va bajo el resultado. La lógica y la memoria están en `uno-al-dia.js`; la página
 * con todo lo acumulado, en `/today/`. Los textos van en `COMMON[lang].uad` (i18n.js).
 */
import { el } from './ui.js';
import { COMMON, SITIO, withLang } from './i18n.js';
import { GAMES, SUELTOS, PORTADA, gameById, SLUGS_SIN_PAGINA } from './games.js';
import { tiene } from './parametros.js';
import { tirar, alAzar, TEXTOS as AZAR } from './azar.js';
import { botonCompartir, cabecera, laminaResultado, nombreArchivo, compartir, lamina, aArchivo, fuente, COLORES, MARCO } from './compartir.js';
import { JUEGOS_DIA, estado, rutaDel, numeroDel, sumarDias, COMODINES_MAX, leer, anotar, fechaLocal, juegoDel, semillaDel } from './uno-al-dia.js';
import { UNO_AL_DIA, bandera } from './records.js';
import { trackUnoAlDia } from './transport/stats.js';
import { walk, seasonPoints } from './daily-points.js';
import { salidasFin } from './fin.js';

export const fmt = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const textos = lang => (COMMON[lang] || COMMON.es);
/** La carpeta de cada juego: los de la portada (`hangman`) y los sueltos de La Copa (`queens`). */
const SLUGS = Object.fromEntries([...GAMES.filter(g => !g.torneo).map(g => [g.id, g.path.replace(/\/$/, '')]), ...SUELTOS.map(g => [g.id, g.slug])]);
/** Dónde se juega hoy, desde la raíz del sitio. */
export const rutaHoy = id => rutaDel(id, SLUGS, SLUGS_SIN_PAGINA);
/** The tabs of Uno al día's ranking, the same on /today/ and under the result (D-414). */
export const PESTANAS_UAD = ['mes', 'hoy', 'rachas', 'amigosMes'];
/** El link de Uno al día que se comparte. */
export const URL_HOY = `${SITIO}today/`;

/** "🔥 Racha: 6 días" (o "1 día"). */
export const textoRacha = (n, lang) => (n === 1 ? textos(lang).uad.racha1 : fmt(textos(lang).uad.racha, { n }));

/**
 * Los juegos del dado, con su nombre en cada idioma: el de `games.js`, o el que trae su entrada en
 * JUEGOS_DIA si solo La Copa lo tiene (D-377), sin cargar las reglas de La Copa.
 */
async function caras() {
  return JUEGOS_DIA.map(j => ({ id: j.id, emoji: j.emoji, name: gameById(j.id)?.name || j.name }));
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

/** Lo que dice el acceso según el día: si ya jugó, su racha y, para la tarjeta, la segunda línea ("🔥 1 · Jugar hoy" o "✅ Listo · 🔥 1"). */
function estadoAcceso(lang, raiz, alTocar) {
  const T = textos(lang).uad;
  const e = estado();
  const hecho = !!e.dia;
  const linea2 = hecho
    ? `✅ ${T.listo}${e.racha ? ` · 🔥 ${e.racha}` : ''}`
    : `${e.racha ? `🔥 ${e.racha} · ` : ''}${T.jugar}`;
  // It opens the player's Uno al día, with their points and place; the die rolls from there (D-414)
  const abrir = () => { alTocar?.(); trackUnoAlDia('boton'); location.href = `${raiz}today/`; };
  // El estado completo para un lector de pantalla: "Uno al día: tus puntos y el juego de hoy. 🔥 Racha: 6 días"
  const aria = [hecho ? T.ariaListo : T.aria, e.racha ? textoRacha(e.racha, lang).replace('🔥 ', '') : ''].filter(Boolean).join('. ');
  return { T, hecho, linea2, abrir, aria, racha: e.racha };
}

/**
 * El botón al lado de "Al azar" (la forma de antes, que se prueba desde /labs/): una sola línea, "📅 Uno al día", con la racha
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
 * Cómo va en la portada (D-239): una tarjeta de media fila al lado de La Copa, como acceso de más
 * jerarquía que los juegos. Misma lógica que el botón.
 */
export function tarjetaUnoAlDia({ lang, raiz = '', alTocar }) {
  // Two destinations (D-414): the card opens /today/, its chip plays today's game or, once played,
  // shows the month's place and points (owner-approved render)
  return tarjetaDosDestinos({ lang, raiz, alTocar });
}

/**
 * The chip once today is played: the month's points and place (owner's request). The last ones the
 * server gave, cached by /today/, if they already count today; otherwise this phone's own count.
 */
function chipPuntos(T, lang, racha = 0) {
  const P = T.pts, hoy = fechaLocal(), mes = `s${hoy.slice(0, 7)}`;
  let c = null;
  try { c = JSON.parse(localStorage.getItem('uad-pts-cache') || 'null'); } catch (_) { /* sin memoria */ }
  if (c?.p !== mes) c = null;
  const pts = c && c.d === hoy && c.h ? c.s : seasonPoints(walk(leer().dias, hoy), hoy);
  const n = fmt(P.ptsN, { n: Number(pts || 0).toLocaleString(lang) });
  // Once played the streak goes in the line under the place, not in a row of its own (owner's choice)
  const fuego = racha ? [el('span', { class: 'uad-card-fuego' }, ` · 🔥 ${racha}`)] : [];
  // The place big (gradient), the points under it; with no place known yet, the points are the big one
  return c?.r
    ? [el('span', { class: 'uad-card-pos' }, fmt(P.chipPuesto, { p: c.r })), el('span', { class: 'uad-card-sub' }, ...(racha ? [] : [el('i', {}, `${P.delMes} · `)]), el('b', {}, n), ...fuego)]
    : [el('span', { class: 'uad-card-pos' }, Number(pts || 0).toLocaleString(lang)), el('span', { class: 'uad-card-sub' }, el('b', {}, `${P.pts} `), el('i', {}, P.delMes), ...fuego)];
}

/**
 * The card with two destinations (D-414): a link over the whole card opens /today/, and the chip,
 * a separate control above it, plays today's game ("▶ Jugar hoy") or, once played, shows the month's
 * place and points and opens /today/. Two sibling controls, never one inside the other.
 */
function tarjetaDosDestinos({ lang, raiz, alTocar }) {
  const { T, hecho, aria, racha } = estadoAcceso(lang, raiz, alTocar);
  const ir = () => { alTocar?.(); trackUnoAlDia('boton'); };
  const chip = hecho
    ? el('a', { class: 'uad-card-chip', id: 'btn-uad-chip', href: `${raiz}today/`, onClick: ir }, ...chipPuntos(T, lang, racha))
    : el('button', { type: 'button', class: 'uad-card-chip', id: 'btn-uad-chip', 'aria-label': T.ariaJugarHoy, onClick: () => { alTocar?.(); tirarHoy({ lang, raiz }); } }, `▶ ${T.jugar}`);
  // The screen reader hears the place and the points too, not only «your points»
  if (hecho) chip.setAttribute('aria-label', `${T.ariaTusPuntos}: ${chip.textContent}`);
  return el('div', { class: 'game-card alta uad-card dos' + (hecho ? ' hecho' : ''), id: 'btn-uno-al-dia' },
    el('a', { class: 'uad-card-link', id: 'btn-uad-abrir', href: `${raiz}today/`, 'aria-label': aria, onClick: ir }),
    el('div', { class: 'emoji' }, el('span', { 'aria-hidden': 'true' }, '📅')),
    el('div', { class: 'texto' }, el('h2', {}, el('span', {}, T.nombre)), el('div', { class: 'tag' }, T.sub)),
    el('div', { class: 'meta' }, racha && !hecho ? el('span', { class: 'uad-card-estado', 'aria-hidden': 'true' }, `🔥 ${racha}`) : null, chip),
    hecho ? null : el('span', { class: 'btn-uad-punto', 'aria-hidden': 'true' }));
}

/** Tira el dado de Juego al azar con los juegos de la portada: "🎲 Jugar otro". */
export function jugarOtro({ lang, raiz }) {
  trackUnoAlDia('otro');
  const pool = PORTADA.filter(alAzar);
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
 * y qué hacer ahora (compartir, jugar otro, repetirlo, volver a Uno al día o al menú). `primera` dice si esta partida
 * fue el resultado del día o una práctica; `dia` es lo anotado para hoy.
 */
export function tarjetaResultado({ lang, fecha, primera, dia, raiz = '', alTocar, mmss }) {
  trackUnoAlDia(primera ? 'jugado' : 'repite');
  const T = textos(lang).uad;
  const e = estado();
  const n = e.racha;
  // The score is the result's hero: the card only says it when it is not today's (practice), or how it
  // compares, once the network says (C-19)
  const hoyLinea = el('p', { style: 'margin:0', id: 'uad-hoy-puntos', hidden: primera }, primera ? '' : fmt(T.practica, { s: dia.s }));
  // Lo que depende de la red (el porcentaje, el duelo, entrar, invitar, el ranking) llega después
  const comodin = lineaComodin(e, fecha, lang);
  const red = el('div', { class: 'uad-red', id: 'uad-red' });
  // Entrar va antes de los botones (D-249): sin jugador, la racha vive solo en este celular
  const arriba = el('div', { class: 'uad-arriba' });
  const tarjeta = el('div', { class: 'panel uad-tarjeta', id: 'uad-tarjeta' },
    el('p', { class: 'uad-racha' }, textoRacha(n, lang)),
    el('p', { class: 'muted', style: 'margin:0' }, fmt(T.vuelve, { n: n + 1 })),
    hoyLinea,
    comodin,
    arriba,
    el('div', { class: 'uad-acciones' },
      compartirHoy({ lang, fecha, dia, alTocar, mmss }),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-uad-otro', onClick: () => { alTocar?.(); jugarOtro({ lang, raiz }); } }, T.jugarOtro)),
    el('a', { class: 'link-btn', id: 'btn-uad-repetir', href: `${raiz}${rutaHoy(dia.j)}` }, T.repetir),
    // The exits of a One a Day end screen live here, in every game (C-19): the game adds none
    salidasFin('hoy', { lang, raiz: raiz || './' }),
    red);
  conRed({ lang, fecha, dia, primera, hoyLinea, red, arriba, alTocar });
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
export function tarjetaInvitar({ lang, alTocar, plegada = false, comodines = null }) {
  const T = textos(lang).uad;
  // The +10 per invited friend, said only with a lab key for now (D-409). lab: #seccion-uad-invitar-jugar
  const ptsInv = el('p', { style: 'margin:0', id: 'uad-inv-pts', hidden: true }, T.pts.invitarPts);
  if (comodines != null) import('./lab-access.js').then(m => m.labAccess()).then(ok => { ptsInv.hidden = !ok; }).catch(() => {});
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
      await compartir({ titulo: T.nombre, texto, url, que: 'uno-al-dia' });
    } catch (_) { /* sin compartir no hay nada que avisar */ } finally { b.disabled = false; }
  });
  import('./uno-al-dia-red.js').then(async red => {
    const con = await red.tengoJugador();
    const e = estado();
    // On /today/ the card is the wildcards' box: what they do and how to earn them, always said
    linea.textContent = comodines != null ? (con ? '' : T.comodinesEntrar) : !con ? T.invEntrar : e.comodines < COMODINES_MAX ? T.invComodin : '';
    linea.hidden = !linea.textContent;
  }).catch(() => { linea.hidden = true; });
  // Under a result it goes folded (C-19): the streak and Sign in already speak above; /today/ shows it open
  return plegada
    ? el('details', { class: 'panel uad-invitar', id: 'uad-invitar' }, el('summary', { class: 'lead' }, T.invTitulo), linea, b)
    : comodines != null
      // /today/: one box for the wildcards, their logic and the invite that earns one
      ? el('div', { class: 'panel uad-invitar', id: 'uad-invitar' }, el('p', { class: 'lead', style: 'margin:0' }, fmt(T.comodinesTitulo, { n: comodines })),
        el('p', { style: 'margin:0', id: 'uad-comodines-texto' }, T.comodinesLogica), linea, ptsInv, b)
      : el('div', { class: 'panel uad-invitar', id: 'uad-invitar' }, el('p', { class: 'lead', style: 'margin:0' }, T.invTitulo), linea, b);
}

/**
 * Lo de la tarjeta del resultado que usa la red: sube el de hoy, dice el porcentaje, el duelo con
 * quien invitó, ofrece entrar (sin jugador), invitar y el ranking de Uno al día.
 */
async function conRed({ lang, fecha, dia, primera, hoyLinea, red, arriba, alTocar }) {
  const T = textos(lang).uad;
  try {
    const R = await import('./uno-al-dia-red.js');
    const { rankingsVisibles } = await import('./jugador.js');
    // Entrar, lo primero: lo de abajo espera a la red, y la invitación no tiene por qué esperar
    const conRanking = rankingsVisibles();
    const { bloqueJugador, bloqueRanking } = conRanking ? await import('./ranking.js') : {};
    let invitar = conRanking ? tarjetaInvitar({ lang, alTocar, plegada: true }) : null;
    // The month's points first (D-412, D-414): the same block and tabs as on /today/
    const ranking = conRanking ? bloqueRanking({ juego: UNO_AL_DIA, titulo: T.rankingTitulo, pestanas: PESTANAS_UAD, alTocar }) : null;
    if (conRanking && !(await R.tengoJugador())) {
      const entrar = el('div', { class: 'uad-entrar', id: 'uad-entrar' }, bloqueJugador({ destacado: true, compacto: true, leyenda: T.guardaRacha, alTocar }));
      arriba.append(entrar);
      // Si entra recién aquí, el de hoy igual sube; después, invitar ya no le pide entrar y el
      // ranking lo muestra
      (await import('./jugador.js')).jugador().then(J => {
        const off = J.escuchar(yo => {
          if (!yo) return;
          off(); entrar.remove();
          R.sincronizar().catch(() => {}).then(() => {
            const nueva = tarjetaInvitar({ lang, alTocar, plegada: true });
            invitar.replaceWith(nueva); invitar = nueva;
            ranking.recargar?.();
          });
        });
      }).catch(() => {});
    }
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
      if (p != null) { hoyLinea.textContent = fmt(T.pct, { p }); hoyLinea.hidden = false; }
    }
    if (conRanking) red.append(invitar, ranking);
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
 * El modo `?today` (o `?hoy`, el de antes de D-266) de un juego de grupo (El Ahorcado, Batalla Naval, Dudo), como el de los
 * solitarios en `cup/game.js`: sin `?today` o fuera del laboratorio, null. Si hoy toca otro juego (un
 * link de ayer, o pasó la medianoche), se va al de hoy y devuelve `{ fuera: true }`. Si no, la
 * fecha del jugador, la semilla del día y si ya lo jugó (entonces esta partida es práctica).
 */
export function modoHoy(id, { raiz = '../', loc = globalThis.location } = {}) {
  if (!tiene('today', loc.search)) return null;
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

/**
 * Puts the card right under the result's hero, above the game's long content (words, fleets), so
 * its actions and exits show without scrolling (C-8, C-19); never twice.
 */
export function ponerTarjeta(tarjeta, despues = document.querySelector('#screen-result .result-hero')) {
  document.getElementById('uad-tarjeta')?.remove();
  despues.after(tarjeta);
}

/* ------------------------------------------------------------------ */
/* Sharing the ranking                                                 */
/* ------------------------------------------------------------------ */

const MEDALLAS = ['🥇', '🥈', '🥉'];
const mmssCorto = ms => { const t = Math.round((ms || 0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
/** What a row shows on the right, as on screen: the month's points (and streak), the streak, or the score and time. */
const valorFila = (f, tipo, P) => (tipo === 'puntos' ? `${fmt(P.ptsN, { n: f.s })} · 🔥${f.r || 0}` : tipo === 'racha' ? `🔥 ${f.s}` : `${f.s}${f.ms ? ` · ⏱ ${mmssCorto(f.ms)}` : ''}`);

/** The tab shared, in words: "Ranking de octubre" for the month's (and the friends' month), else "Ranking · <tab>". */
function contextoRanking(T, lang, d) {
  const mes = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date());
  if (!d || d.pestana === 'mes' || d.pestana === 'amigosMes') return `${fmt(T.rkCompCab, { mes })}${d?.pestana === 'amigosMes' ? ` · ${d.rotulo}` : ''}`;
  return `${T.rkPalabra} · ${d.rotulo}`;
}

/**
 * The ranking as a picture (owner's request): the share frame with "📅 Uno al día" and the tab on
 * top, the rows shown (top 10, then the player's neighbours), the player's row highlighted, and the
 * site under it. `d` is what `bloqueRanking` keeps of the tab on screen (`caja.datos`).
 */
export async function laminaRanking({ lang, d, url }) {
  const T = textos(lang).uad;
  const contexto = `🏅 ${contextoRanking(T, lang, d)}`;
  const filas = [...d.top.slice(0, 10).map(f => ({ f })), ...(d.vecinos.length ? [{ sep: true }, ...d.vecinos.slice(0, 3).map(f => ({ f }))] : [])];
  const ALTO = 86, SEP = 50, PIE = 70;
  const contenido = filas.reduce((a, x) => a + (x.sep ? SEP : ALTO), 0) + PIE;
  const alto = Math.min(1920, Math.max(MARCO.ancho, MARCO.arriba + contenido + MARCO.abajo + 60));
  const { cv, c, W, H } = await lamina({ alto, cab: { emoji: '📅', titulo: T.nombre, contexto }, url });
  let y = MARCO.arriba + Math.max(20, (H - MARCO.arriba - MARCO.abajo - contenido) / 2);
  const X0 = 90, X1 = W - 90;
  for (const x of filas) {
    if (x.sep) { c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = fuente(900, 40); c.fillText('⋯', W / 2, y + 36); y += SEP; continue; }
    const f = x.f, mia = d.yo && f.jid === d.yo;
    c.fillStyle = mia ? 'rgba(255, 210, 63, 0.22)' : 'rgba(0, 0, 0, 0.22)';
    c.beginPath(); if (c.roundRect) c.roundRect(X0 - 20, y + 6, X1 - X0 + 40, ALTO - 12, 22); else c.rect(X0 - 20, y + 6, X1 - X0 + 40, ALTO - 12); c.fill();
    if (mia) { c.strokeStyle = COLORES.amarillo; c.lineWidth = 3; c.stroke(); }
    const base = y + ALTO / 2 + 15;
    c.textAlign = 'left'; c.fillStyle = '#ffffff';
    c.font = fuente(900, 44); c.fillText(f.puesto == null ? '·' : MEDALLAS[f.puesto - 1] || String(f.puesto), X0, base);
    const valor = valorFila(f, d.tipo, T.pts);
    c.font = fuente(900, 40); const wv = c.measureText(valor).width;
    c.textAlign = 'right'; c.fillStyle = mia ? COLORES.amarillo : '#ffffff'; c.fillText(valor, X1, base);
    // The name, cut with an ellipsis if it would reach the value
    let nombre = [bandera(f.co), f.n || '?'].filter(Boolean).join(' ') + (d.campeon && f.jid === d.campeon ? ' 🏆' : '');
    c.textAlign = 'left'; c.font = fuente(800, 42); c.fillStyle = '#ffffff';
    const max = X1 - wv - 40 - (X0 + 90);
    if (c.measureText(nombre).width > max) { while (nombre.length > 1 && c.measureText(`${nombre}…`).width > max) nombre = nombre.slice(0, -1); nombre += '…'; }
    c.fillText(nombre, X0 + 90, base);
    y += ALTO;
  }
  c.textAlign = 'center'; c.font = fuente(800, 36); c.fillStyle = COLORES.cian;
  c.fillText(T.rkCompImagen, W / 2, y + 50);
  return aArchivo(cv, nombreArchivo('uno-al-dia', 'ranking', d.pestana));
}

/**
 * The button under the Uno al día ranking on /today/: the picture of the tab on screen, a short line
 * (the player's place if they are in it) and the link to play — their invite link when signed in, as
 * the invite card. Where pictures can't be shared, `compartir` downloads it and copies the text.
 */
export function botonCompartirRanking({ lang, caja, alTocar }) {
  const C = textos(lang), T = C.uad;
  return botonCompartir({
    rotulo: T.rkCompartir, id: 'btn-uad-compartir-ranking', clase: 'btn btn--cyan rk-compartir',
    alTocar: () => { alTocar?.(); trackUnoAlDia('compartir'); },
    avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
    armar: async () => {
      const d = caja.datos;
      const red = await import('./uno-al-dia-red.js');
      const url = await red.linkInvitar(withLang(URL_HOY, lang)).catch(() => withLang(URL_HOY, lang));
      const mia = d && [...d.top, ...d.vecinos].find(f => d.yo && f.jid === d.yo);
      const texto = [cabecera({ emoji: '📅', titulo: T.nombre, contexto: contextoRanking(T, lang, d) }),
        mia?.puesto ? fmt(T.rkCompVoy, { p: mia.puesto }) : T.rkCompSin].join('\n');
      return { titulo: T.nombre, texto, url, que: 'uno-al-dia-ranking', imagen: d && d.top.length ? await laminaRanking({ lang, d, url }) : null };
    },
  });
}

