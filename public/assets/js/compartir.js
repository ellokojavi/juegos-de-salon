/**
 * Todo lo que la app comparte pasa por aquí (D-165). WhatsApp es el canal principal, así que el
 * estándar está pensado para un chat:
 *
 * - **El texto** abre con una cabecera — `{emoji} *{título}* · {contexto}` —, sigue con una idea
 *   por línea, cada una con su emoji, y cierra con el link solo en su línea ("🔗 …", D-124).
 *   `cabecera()` la arma; `compartir()` le pega el link.
 * - **La imagen**, cuando hay (un resultado, una tabla), lleva arriba la misma cabecera del texto
 *   —el título y, debajo, el contexto—, y abajo el mismo link: quien la ve suelta en el grupo
 *   sabe de qué copa o de qué juego es y adónde ir. `lamina()` dibuja ese marco; lo de adentro es
 *   de quien la llama. `laminaResultado()` es el resultado de un juego, igual para todos.
 * - **Con imagen, el texto no repite lo que ella dice** (D-171): lleva la cabecera, lo que la
 *   imagen no trae (quién falta, las medallas, el reto) y el link.
 * - **Una invitación** (a una sala, a una copa, a la app) va sin imagen dibujada: el link ya trae
 *   su tarjeta social (D-72), que es la imagen que WhatsApp muestra.
 *
 * Donde no se puede compartir un archivo (un computador), la imagen se descarga y el texto queda
 * copiado, listo para pegarlo junto a ella. No importa nada: lo usa `ui.js`.
 */

/**
 * Emojis que se dibujan casi negros (〰️, el de Zip): sobre el fondo morado no se ven, así que en
 * pantalla llevan contorno claro (`.emoji-claro`, D-164) y en la imagen, un halo claro.
 */
export const EMOJI_OSCUROS = ['〰️'];

/** Dibuja con halo claro si el texto trae un emoji oscuro; si no, tal cual. */
function conHalo(c, texto, dibujar) {
  if (!EMOJI_OSCUROS.some(e => texto.includes(e))) { dibujar(); return; }
  c.save(); c.shadowColor = 'rgba(255,255,255,0.95)'; c.shadowBlur = 14;
  dibujar(); dibujar();
  c.restore();
}

export const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/** La primera línea de todo mensaje: `🏆 *La Copa: Valdenenas* · Día 3 de 7`. */
export const cabecera = ({ emoji, titulo, contexto }) => `${emoji} *${titulo}*${contexto ? ` · ${contexto}` : ''}`;

/**
 * Un link del sitio que sale compartido lleva `de=link` (D-208). WhatsApp y casi todas las apps
 * de chat no dicen de dónde viene quien toca un link, así que sin la marca esas visitas se ven
 * como "directo". Va al final de la búsqueda, donde ningún juego lo confunde con un código de
 * copa o de sala (los que se leen sin `=`). Todo lo que se comparte acá es un link del sitio
 * (sale de `SITIO`); uno que no es una dirección web, o que ya trae la marca, queda igual.
 */
export const MARCA_COMPARTIDO = 'de=link';
export function marcarCompartido(url) {
  if (!url) return url;
  let u;
  try { u = new URL(url); } catch (_) { return url; }
  if (!/^https?:$/.test(u.protocol) || u.searchParams.has('de')) return url;
  const [base, hash = ''] = String(url).split('#');
  return `${base}${base.includes('?') ? '&' : '?'}${MARCA_COMPARTIDO}${hash ? `#${hash}` : ''}`;
}

/** El texto entero tal como llega al chat: lo que dice y, al final, el link en su línea. */
export const conLink = (texto, url) => [texto, url && `🔗 ${url}`].filter(Boolean).join('\n\n');

/**
 * Comparte un texto (y una imagen, si la hay) con el menú del sistema. Sin menú, copia el texto
 * y descarga la imagen. Devuelve 'shared', 'copied', 'downloaded' o 'failed'.
 */
export async function compartir({ titulo, texto, url, imagen = null }) {
  const completo = conLink(texto, marcarCompartido(url));
  const cancelado = e => e && e.name === 'AbortError';
  if (imagen && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [imagen] })) {
    try { await navigator.share({ files: [imagen], title: titulo, text: completo }); return 'shared'; }
    catch (e) { if (cancelado(e)) return 'failed'; /* si no se pudo, cae a descargarla */ }
  } else if (!imagen && canShare()) {
    // El link va dentro del texto y no como `url`: pasado aparte, Android lo pega a la última
    // frase ("…Mica. https://…") y algunos chats lo ponen arriba del mensaje (D-124)
    try { await navigator.share({ title: titulo, text: completo }); return 'shared'; }
    catch (e) { if (cancelado(e)) return 'failed'; /* si no se pudo, cae al portapapeles */ }
  }
  if (imagen) descargar(imagen);
  // Sin menú se copia el mensaje entero y no solo la URL: pegar "un link pelado" obliga a quien
  // comparte a escribir de qué se trata, que es justo lo que dice el texto
  try { await navigator.clipboard.writeText(completo); return imagen ? 'downloaded' : 'copied'; }
  catch (_) {
    if (imagen) return 'downloaded';
    try { prompt('URL', completo); } catch (__) { /* nada */ }
    return 'failed';
  }
}

/** Lo de antes (`ui.js`): un link con su texto. Devuelve 'shared', 'copied' o 'failed'. */
export const shareLink = ({ title, text, url }) => compartir({ titulo: title, texto: text, url });

function descargar(archivo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(archivo); a.download = archivo.name;
  document.body.append(a); a.click(); a.remove();
}

/**
 * El botón de invitar a una sala, igual en todos los juegos: el menú del sistema donde lo hay;
 * donde no, copia y el botón dice "¡Copiado!" dos segundos. `texto` es una función porque el
 * nombre de quien invita puede llegar después de dibujar la sala.
 */
export function botonInvitar({ T, titulo, texto, url, alTocar }) {
  const rotulo = () => (canShare() ? T.shareLink : T.copyLink);
  const btn = document.createElement('button');
  btn.className = 'btn btn--cyan btn--sm'; btn.style.cssText = 'width:100%;max-width:320px';
  btn.textContent = rotulo();
  btn.addEventListener('click', async () => {
    alTocar?.();
    const r = await compartir({ titulo, texto: texto(), url });
    if (r === 'copied') { btn.textContent = T.copied; setTimeout(() => { btn.textContent = rotulo(); }, 2000); }
  });
  return btn;
}

/**
 * Un botón que comparte algo que hay que armar primero (una imagen tarda): se apaga mientras
 * tanto, y si terminó copiado o descargado lo avisa —con `avisar(texto)` si lo hay; si no, en el
 * mismo botón por dos segundos—. `armar()` devuelve lo que recibe `compartir()`.
 */
export function botonCompartir({ rotulo, clase = 'btn btn--cyan', id, armar, alTocar, avisos, avisar }) {
  const btn = document.createElement('button');
  btn.className = clase; btn.textContent = rotulo;
  if (id) btn.id = id;
  btn.addEventListener('click', async () => {
    alTocar?.();
    btn.disabled = true;
    let r = 'failed';
    try { r = await compartir(await armar()); } catch (_) { /* sin imagen no hay nada que avisar */ } finally { btn.disabled = false; }
    const aviso = r === 'copied' ? avisos?.copied : r === 'downloaded' ? avisos?.downloaded : null;
    if (!aviso) return;
    if (avisar) { avisar(aviso); return; }
    btn.textContent = aviso;
    setTimeout(() => { btn.textContent = rotulo; }, 2500);
  });
  return btn;
}

/** "🎯 78/100 · ⏱ 1:23": el tiempo solo si la tarjeta no lo trae ya (la de Reinas sí, D-114). */
export const puntajeYTiempo = (puntaje, tiempo, tarjeta = '') => [puntaje, tiempo && !String(tarjeta).includes('⏱') ? `⏱ ${tiempo}` : ''].filter(Boolean).join(' · ');

/** El texto del resultado jugando solo: la cabecera y el reto. El resto lo dice la imagen (D-171). */
export const textoResultadoSolo = ({ C, emoji, juego }) => [cabecera({ emoji, titulo: juego, contexto: C.shareSoloContext }), C.shareSoloCta].join('\n\n');

/**
 * El resultado de jugar solo un juego (D-165), suelto o dentro de un juego: la imagen con la
 * cabecera —"🔢 *Toque y Fama* · Jugando solo"—, el puntaje, el tiempo y la tarjeta de colores, y
 * el texto con la misma cabecera y el reto. `C` son los textos comunes del idioma (`COMMON[lang]`).
 */
export function botonResultadoSolo({ C, emoji, juego, puntaje, tiempo, tarjeta = '', url, alTocar }) {
  const cab = { emoji, titulo: juego, contexto: C.shareSoloContext };
  const detalle = puntajeYTiempo('', tiempo, tarjeta);
  return botonCompartir({
    rotulo: C.shareResult, id: 'btn-compartir-resultado', alTocar,
    avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
    armar: async () => ({
      titulo: juego, url,
      texto: textoResultadoSolo({ C, emoji, juego }),
      imagen: await laminaResultado({ cab, url, puntaje, detalle, tarjeta, pie: C.shareSoloImage, archivo: nombreArchivo(juego, 'resultado') }),
    }),
  });
}

/* ------------------------------------------------------------------ */
/* Las imágenes                                                        */
/* ------------------------------------------------------------------ */

/** Los colores de la app (base.css), para que la imagen se vea como la pantalla. */
export const COLORES = {
  amarillo: '#ffd23f', cian: '#2ee6d6', rosado: '#ff2e88', lima: '#9dff3a', tinta: '#1a0f33',
  fondo: ['#3a0d5c', '#120a2e'],
};
const EMOJIS = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
export const fuente = (peso, px, familia = 'Nunito, system-ui, sans-serif') => `${peso} ${px}px ${familia}, ${EMOJIS}`;
export const TITULAR = 'Bangers, Impact, sans-serif';

/** Las medidas del marco: 1080 de ancho; arriba, título y contexto; abajo, el link. */
export const MARCO = { ancho: 1080, arriba: 225, abajo: 115 };

/**
 * El marco de toda imagen que se comparte: el fondo de la app, la cabecera del texto arriba
 * (`{emoji} {título}` en amarillo, achicando la letra hasta que quepa, y el contexto en blanco) y
 * el link abajo, en cian. Devuelve el canvas y su contexto para dibujar lo de adentro, entre
 * `MARCO.arriba` y `alto - MARCO.abajo`.
 */
export async function lamina({ alto, cab, url }) {
  const W = MARCO.ancho, H = Math.round(alto);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  try { await document.fonts?.ready; } catch (_) { /* nada */ }
  const fondo = c.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0, COLORES.fondo[0]); fondo.addColorStop(1, COLORES.fondo[1]);
  c.fillStyle = fondo; c.fillRect(0, 0, W, H);
  c.textAlign = 'center';
  c.fillStyle = COLORES.amarillo;
  const titulo = `${cab.emoji} ${cab.titulo}`;
  // El nombre de una copa llega a 40 caracteres: la letra se achica hasta que quepa
  let tam = 76;
  do { c.font = fuente(400, tam, TITULAR); tam -= 4; } while (c.measureText(titulo).width > W - 100 && tam > 30);
  if (EMOJI_OSCUROS.includes(cab.emoji)) {
    // El halo, solo alrededor del emoji: sobre las letras las difumina
    const resto = ` ${cab.titulo}`, we = c.measureText(cab.emoji).width, x0 = (W - we - c.measureText(resto).width) / 2;
    c.textAlign = 'left';
    conHalo(c, cab.emoji, () => c.fillText(cab.emoji, x0, 115));
    c.fillText(resto, x0 + we, 115);
    c.textAlign = 'center';
  } else c.fillText(titulo, W / 2, 115);
  if (cab.contexto) {
    tam = 40;
    do { c.font = fuente(800, tam); tam -= 2; } while (c.measureText(cab.contexto).width > W - 100 && tam > 22);
    c.fillStyle = '#ffffff'; c.fillText(cab.contexto, W / 2, 180);
  }
  if (url) {
    c.font = fuente(800, 34); c.fillStyle = COLORES.cian;
    c.fillText(url.replace(/^https?:\/\//, ''), W / 2, H - 55);
  }
  return { cv, c, W, H };
}

/** El canvas como archivo PNG, listo para `compartir({ imagen })`. */
export const aArchivo = (cv, nombre) => new Promise((ok, mal) => cv.toBlob(b => (b ? ok(new File([b], nombre, { type: 'image/png' })) : mal(new Error('canvas'))), 'image/png'));

/**
 * El resultado de un juego como imagen (D-165), el mismo en La Copa, suelto y dentro de un
 * juego: el marco con la cabecera del texto, y adentro lo mismo que dice el texto, en el mismo
 * orden —el juego (si la cabecera no lo nombra ya), quién lo jugó, el puntaje en grande, el
 * detalle (el tiempo) y la tarjeta de colores, que no revela la respuesta (U-32)—.
 * Mide entre cuadrada y 4:5, según cuánto traiga la tarjeta.
 */
export async function laminaResultado({ cab, url, juego = null, nombre = '', puntaje, detalle = '', tarjeta = '', pie = '', archivo }) {
  const lineas = String(tarjeta || '').split('\n').filter(l => l.trim());
  // Lo de adentro, de arriba abajo: [alto, cómo dibujarlo]
  const bloques = [];
  if (juego) {
    bloques.push([130, (c, W, y) => { c.font = fuente(400, 110); conHalo(c, juego.emoji, () => c.fillText(juego.emoji, W / 2, y + 108)); }]);
    bloques.push([84, (c, W, y) => { c.font = fuente(400, 68, TITULAR); c.fillStyle = COLORES.amarillo; ajustar(c, juego.nombre, W - 120); c.fillText(juego.nombre, W / 2, y + 66); }]);
  }
  if (nombre) bloques.push([64, (c, W, y) => { c.font = fuente(800, 44); c.fillStyle = '#ffffff'; ajustar(c, `👤 ${nombre}`, W - 120); c.fillText(`👤 ${nombre}`, W / 2, y + 48); }]);
  bloques.push([150, (c, W, y) => { c.font = fuente(900, 124); c.fillStyle = COLORES.amarillo; ajustar(c, puntaje, W - 120); c.fillText(puntaje, W / 2, y + 128); }]);
  if (detalle) bloques.push([56, (c, W, y) => { c.font = fuente(800, 36); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillText(detalle, W / 2, y + 40); }]);
  // La tarjeta: su letra se achica para que la línea más ancha quepa y no pase de 6 líneas a lo alto
  const tamT = lineas.length ? Math.min(64, 380 / lineas.length) : 0;
  const altoT = lineas.length ? lineas.length * tamT * 1.25 + 60 : 0;
  if (lineas.length) {
    bloques.push([altoT, (c, W, y) => {
      c.fillStyle = 'rgba(0,0,0,0.28)';
      let t = tamT;
      c.font = fuente(800, t);
      while (Math.max(...lineas.map(l => c.measureText(l).width)) > W - 200 && t > 18) { t -= 2; c.font = fuente(800, t); }
      const ancho = Math.max(...lineas.map(l => c.measureText(l).width)) + 80;
      redondeado(c, (W - ancho) / 2, y + 10, ancho, altoT - 20, 24); c.fill();
      c.fillStyle = '#ffffff';
      const h = lineas.length * tamT * 1.25, y0 = y + (altoT - h) / 2;
      lineas.forEach((l, i) => conHalo(c, l, () => c.fillText(l, W / 2, y0 + (i + 0.8) * tamT * 1.25)));
    }]);
  }
  if (pie) bloques.push([60, (c, W, y) => { c.font = fuente(800, 36); c.fillStyle = COLORES.cian; ajustar(c, pie, W - 120); c.fillText(pie, W / 2, y + 42); }]);
  const HUECO = 24;
  const contenido = bloques.reduce((a, [h]) => a + h, 0) + HUECO * (bloques.length - 1);
  const alto = Math.min(1350, Math.max(MARCO.ancho, MARCO.arriba + contenido + MARCO.abajo + 60));
  const { cv, c, W, H } = await lamina({ alto, cab, url });
  // Lo que sobra se reparte arriba y abajo del bloque, así nada queda pegado ni suelto
  let y = MARCO.arriba + Math.max(0, (H - MARCO.arriba - MARCO.abajo - contenido) / 2);
  for (const [h, dibujar] of bloques) { c.textAlign = 'center'; c.fillStyle = '#ffffff'; dibujar(c, W, y); y += h + HUECO; }
  return aArchivo(cv, archivo);
}

/** Achica la letra que ya tiene puesta el contexto hasta que `texto` quepa en `max`. */
function ajustar(c, texto, max) {
  const m = c.font.match(/(\d+)px/);
  let px = m ? Number(m[1]) : 40;
  while (c.measureText(texto).width > max && px > 18) { px -= 2; c.font = c.font.replace(/\d+px/, `${px}px`); }
}

function redondeado(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
}

/** Un nombre de archivo sin tildes ni espacios: "copa-valdenenas-dia-3-resultado.png". */
export const nombreArchivo = (...partes) => `${partes.filter(Boolean).join('-').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}.png`;
