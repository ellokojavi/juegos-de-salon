/**
 * Las tarjetas sociales (Open Graph): lo que se ve cuando alguien pega un link de la app en
 * WhatsApp, en un chat o en una red. Importa a esta app más que a otras: los links de sala se
 * comparten por WhatsApp, así que la invitación a jugar **es** una tarjeta de estas.
 *
 *   node tools/release/og.mjs tarjetas   reescribe el bloque <!-- generado: og --> de cada página,
 *                                genera la página de cada juego de La Copa (public/<slug>/)
 *                                y las páginas puente de las rutas viejas (D-192, D-198)
 *   node tools/release/og.mjs imagenes   rehace con Chrome las imágenes de 1200×630 que quedaron atrás
 *                                (necesita internet: las fuentes vienen de Google Fonts).
 *                                Con --todas, las rehace todas
 *   node tools/release/og.mjs revisar    ¿quedó alguna página sin bloque, o alguna imagen sin hacer o
 *                                hecha con otro dibujo u otros textos? (D-181)
 *
 * Los textos salen de public/assets/js/games.js, que es de donde sale también el menú: un solo lugar
 * donde cambiar el nombre o la bajada de un juego. `revisar`, en el check `pruebas` de cada PR, frena
 * unas tarjetas que se quedaron atrás de games.js; las imágenes se rehacen a mano, porque necesitan
 * navegador (y solo cambian si cambia un nombre, un emoji o el diseño de la tarjeta).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { GAMES, SUELTOS } from '../../public/assets/js/games.js';
import { COMMON, LANGS } from '../../public/assets/js/i18n.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITIO = 'https://juegosdesalon.cl';
// Con varias sesiones a la vez, cada una los suyos (D-135): PUERTO=87xx PUERTO_CDP=94xx
const PUERTO = Number(process.env.PUERTO) || 8791;
const PUERTO_CDP = Number(process.env.PUERTO_CDP) || 9490;
const ANCHO = 1200, ALTO = 630;

const disponibles = GAMES.filter(g => g.available);
// Un juego del laboratorio no va en la portada, pero sus links sí se comparten: lleva su tarjeta (D-101).
// Lo mismo uno apagado que conserva su página (Julepe): quien tenga el link lo sigue compartiendo,
// y sin esto su tarjeta se quedaba con el dibujo y los textos de cuando se apagó.
const conTarjeta = GAMES.filter(g => g.available || g.labs || existsSync(join(RAIZ, 'public', g.path, 'index.html')));

/**
 * Las puertas de entrada: la portada en español y las que dejan elegido el idioma (/pt/, /en/
 * y /de/). Cada una se comparte en su idioma, así que su tarjeta también (D-74, D-197).
 */
const PUERTAS = [
  { lang: 'es', archivo: 'public/index.html', ruta: '/', imagen: 'menu' },
  { lang: 'pt', archivo: 'public/pt/index.html', ruta: '/pt/', imagen: 'menu-pt' },
  { lang: 'en', archivo: 'public/en/index.html', ruta: '/en/', imagen: 'menu-en' },
  { lang: 'de', archivo: 'public/de/index.html', ruta: '/de/', imagen: 'menu-de' },
];
/** El cierre de la bajada. Es la única frase que no sale de la app: se dice a los robots. */
const GRATIS = { es: 'Gratis, sin instalar y sin cuenta.', en: 'Free, no install, no account.', pt: 'De graça, sem instalar e sem conta.', de: 'Kostenlos, ohne Installation und ohne Konto.' };
/** "A, B y C" en cada idioma. */
const lista = lang => disponibles.map(g => g.name[lang]).join(', ')
  .replace(/, ([^,]*)$/, ` ${{ es: 'y', en: 'and', pt: 'e', de: 'und' }[lang]} $1`);

const portada = p => ({
  ...p,
  // Sin decir cuántos son: el número cambia cada vez que entra un juego, y una frase que
  // envejece sola es peor que una que no cuenta nada. La lista sí se arma de games.js.
  titulo: `${COMMON[p.lang].appTitle} 🎲`,
  descripcion: `${COMMON[p.lang].appSub.replace(/\.$/, '')}: ${lista(p.lang)}. ${GRATIS[p.lang]}`,
  alt: `${COMMON[p.lang].appTitle}: ` + disponibles.map(g => g.emoji).join(' '),
  puerta: true,
});

const paginas = () => [...PUERTAS.map(portada), ...conTarjeta.map(g => ({
  lang: 'es',
  archivo: `public/${g.path}index.html`,
  ruta: `/${g.path}`,
  imagen: g.id,
  juego: g.id,
  titulo: `${g.name.es} ${g.emoji} · Juegos de Salón`,
  descripcion: `${g.tagline.es} ${g.players} jugadores, ${g.duration} ${g.durationUnit?.es || 'min'}. Gratis, sin instalar y sin cuenta.`,
  alt: `${g.name.es}: ${g.tagline.es}`,
})), ...SUELTOS.map(m => ({
  lang: 'es',
  archivo: `public/${m.path}index.html`,
  ruta: `/${m.path}`,
  imagen: m.id,
  juego: m.id,
  suelto: true,
  titulo: `${m.name.es} ${m.emoji} · Juegos de Salón`,
  descripcion: `${m.tagline.es} Un jugador, ${m.duration} min. Gratis, sin instalar y sin cuenta.`,
  alt: `${m.name.es}: ${m.tagline.es}`,
}))];

/**
 * La huella de una imagen (D-181): lo que la dibuja (tools/release/og/tarjeta.html) y lo que dice (el
 * juego en games.js, o los textos de la portada). Cada imagen guarda la suya en
 * public/assets/og/huellas.json al hacerse, y `revisar` la compara con la de hoy: así una imagen hecha
 * con el dibujo viejo, o antes de cambiar una bajada, no pasa como si estuviera al día. Antes solo
 * se revisaba que existiera, y las píldoras desalineadas volvían cada vez que alguien hacía una
 * imagen desde una rama vieja.
 */
const HUELLAS = join(RAIZ, 'public/assets/og/huellas.json');
const leerHuellas = () => { try { return JSON.parse(readFileSync(HUELLAS, 'utf8')); } catch (_) { return {}; } };
/**
 * Solo los idiomas que tienen tarjeta (`LANGS`, sin los del laboratorio, D-191): sumar el alemán
 * a games.js no cambia ninguna imagen, así que tampoco puede dejarlas atrasadas.
 */
const enTarjetas = o => (o && typeof o === 'object' ? Object.fromEntries(LANGS.filter(l => l in o).map(l => [l, o[l]])) : o);
/**
 * De `COMMON`, solo lo que la tarjeta de la portada dibuja (`og/tarjeta.html`): un texto nuevo de la
 * app (el de compartirla, D-226) no la deja atrasada.
 */
const textosTarjeta = lang => Object.fromEntries(['appTitle', 'appSub'].map(k => [k, COMMON[lang][k]]));
function huella(p) {
  const juego = p.juego && [...GAMES, ...SUELTOS].find(g => g.id === p.juego);
  const dato = juego
    ? { emoji: juego.emoji, name: enTarjetas(juego.name), tagline: enTarjetas(juego.tagline), players: juego.players, duration: juego.duration, durationUnit: enTarjetas(juego.durationUnit) }
    : { lang: p.lang, textos: textosTarjeta(p.lang), juegos: disponibles.map(g => [g.id, g.emoji]) };
  return createHash('sha256').update(readFileSync(join(RAIZ, 'tools/release/og/tarjeta.html'), 'utf8')).update(JSON.stringify(dato)).digest('hex').slice(0, 16);
}
/** ¿La imagen falta, o se hizo con otro dibujo u otros textos? */
const atrasada = (p, huellas = leerHuellas()) => !existsSync(join(RAIZ, `public/assets/og/${p.imagen}.jpg`)) || huellas[p.imagen] !== huella(p);

/* ------------------------------------------------------------------ */
/* La página de cada juego de La Copa                                  */
/* ------------------------------------------------------------------ */
/**
 * Un robot de WhatsApp no corre JavaScript: lee las etiquetas del HTML tal como llega. Con una
 * sola página para todos (/cup/suelto/?reinas) cada link traía la misma tarjeta, así que cada
 * juego tiene la suya (D-162), en la raíz como los demás (D-198). Es una copia de
 * public/cup/suelto/index.html un nivel más arriba, con su título, su tarjeta y
 * `data-suelto="<id>"`: se rehace, no se edita. Como la original, va sin versión: el
 * import map lo pone set-version.py al publicar (D-205).
 */
const AVISO_COPIA = () => `  <!-- Generada por node tools/release/og.mjs tarjetas a partir de public/cup/suelto/index.html: no se edita a mano (D-162). -->`;
function paginaSuelta(p, bloqueOg) {
  let html = readFileSync(join(RAIZ, 'public/cup/suelto/index.html'), 'utf8');
  // Sus etiquetas genéricas y el comentario que explica la página de todos
  html = html.replace(/^ {2}<!-- Los juegos de La Copa[\s\S]*?-->\n/m, '');
  html = html.replace(/^ {2}<meta (name="description"|property="og:[^"]*"|name="twitter:[^"]*").*\n/gm, '');
  // Un nivel más arriba: las rutas relativas (href, src, el import map y el import) suben uno menos
  html = html.replace(/(["'])\.\.\/\.\.\//g, '$1../');
  html = html.replace(/<title>.*<\/title>/, `<title>${escapa(p.titulo)}</title>\n${AVISO_COPIA()}`);
  html = html.replace('<body data-suelto>', `<body data-suelto="${p.juego}">`);
  return html.replace(/^( *<link rel="manifest".*\n)/m, `${bloqueOg}\n$1`);
}

/* ------------------------------------------------------------------ */
/* Las páginas puente de las rutas viejas                              */
/* ------------------------------------------------------------------ */
/**
 * Las carpetas pasaron al inglés (D-192): /ahorcado/ es /hangman/. Pero los links viejos siguen
 * circulando —las invitaciones a una sala por WhatsApp, el link propio de una copa
 * (/copa/?pirata), los marcadores—, así que cada ruta vieja queda como una página puente que manda
 * a la nueva con lo mismo detrás (?room=…, ?pirata, &lang=…, #…). Lleva la tarjeta de la página
 * nueva: un robot de chat no corre JavaScript y lee lo que encuentra en la vieja.
 *
 * La ruta vieja sale del id, que era la carpeta (/<id>/ y /minijuegos/<id>/): un juego nuevo con su
 * carpeta igual a su id no tiene puente. Los juegos de La Copa vivieron además en /minigames/<slug>/
 * hasta que dejaron de ser "minijuegos" (D-198).
 */
const puentes = () => [
  ...paginas().filter(p => p.juego && !p.suelto && `/${p.juego}/` !== p.ruta)
    .map(p => ({ ...p, viejo: `public/${p.juego}/index.html`, a: `..${p.ruta}` })),
  ...paginas().filter(p => p.suelto).flatMap(p => [
    { ...p, viejo: `public/minijuegos/${p.juego}/index.html`, a: `../..${p.ruta}` },
    { ...p, viejo: `public/minigames/${p.ruta.split('/')[1]}/index.html`, a: `../..${p.ruta}` },
  ]),
  // Las páginas genéricas (/minijuegos/?reinas, /minigames/?reinas): el molde manda cada link a su lugar
  { viejo: 'public/minijuegos/index.html', a: '../cup/suelto/', titulo: 'Juegos de Salón 🎲' },
  { viejo: 'public/minigames/index.html', a: '../cup/suelto/', titulo: 'Juegos de Salón 🎲' },
];

function paginaPuente(p) {
  const og = p.ruta ? `\n${bloque(p)}` : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapa(p.titulo)}</title>
  <!-- Página puente (D-192): esta ruta se mudó a ${p.a.replace(/^(\.\.\/)+/, '/')}. La genera node tools/release/og.mjs tarjetas: no se edita a mano. -->${og}
  <script>try { if (sessionStorage.getItem('juegos-de-salon:ref') === null) sessionStorage.setItem('juegos-de-salon:ref', document.referrer); } catch (e) {} location.replace('${p.a}' + location.search + location.hash);</script>
  <noscript><meta http-equiv="refresh" content="0; url=${p.a}"></noscript>
</head>
<body>
  <p><a href="${p.a}">${escapa(p.titulo)}</a></p>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Las etiquetas                                                       */
/* ------------------------------------------------------------------ */
const ABRE = '  <!-- generado: og · lo reescribe node tools/release/og.mjs tarjetas -->';
const CIERRA = '  <!-- /generado -->';
const escapa = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const LOCALE = { es: 'es_CL', en: 'en_US', pt: 'pt_BR', de: 'de_DE' };

function bloque(p) {
  // Sin ?v=: lo pone set-version.py al publicar, para que un cambio de dibujo no se quede pegado
  // en la caché de WhatsApp (D-72) sin ensuciar cada PR con la versión (D-205)
  const img = `${SITIO}/assets/og/${p.imagen}.jpg`;
  const url = SITIO + p.ruta;
  const otros = Object.keys(LOCALE).filter(l => l !== p.lang);
  const meta = [
    ['name', 'description', p.descripcion],
    ['canonical', null, url],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Juegos de Salón'],
    ['property', 'og:url', url],
    ['property', 'og:title', p.titulo],
    ['property', 'og:description', p.descripcion],
    ['property', 'og:image', img],
    ['property', 'og:image:type', 'image/jpeg'],
    ['property', 'og:image:width', String(ANCHO)],
    ['property', 'og:image:height', String(ALTO)],
    ['property', 'og:image:alt', p.alt],
    ['property', 'og:locale', LOCALE[p.lang]],
    ...otros.map(l => ['property', 'og:locale:alternate', LOCALE[l]]),
    // Solo las puertas de entrada tienen una URL por idioma; adentro el idioma se elige y se
    // guarda, así que no hay tres direcciones que ofrecerle al buscador (D-74).
    ...(p.puerta ? PUERTAS.map(q => ['alternate', q.lang, SITIO + q.ruta]) : []),
    ...(p.puerta ? [['alternate', 'x-default', SITIO + '/']] : []),
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', p.titulo],
    ['name', 'twitter:description', p.descripcion],
    ['name', 'twitter:image', img],
    ['name', 'twitter:image:alt', p.alt],
  ];
  const lineas = meta.map(([tipo, clave, valor]) => {
    if (tipo === 'canonical') return `  <link rel="canonical" href="${escapa(valor)}">`;
    if (tipo === 'alternate') return `  <link rel="alternate" hreflang="${clave}" href="${escapa(valor)}">`;
    return `  <meta ${tipo}="${clave}" content="${escapa(valor)}">`;
  });
  return [ABRE, ...lineas, CIERRA].join('\n');
}

function cmdTarjetas() {
  let tocadas = 0;
  for (const p of paginas()) {
    const ruta = join(RAIZ, p.archivo);
    const nuevo = bloque(p);
    if (p.suelto) {
      const antes = existsSync(ruta) ? readFileSync(ruta, 'utf8') : '';
      const html = paginaSuelta(p, nuevo);
      mkdirSync(dirname(ruta), { recursive: true });
      if (antes !== html) { writeFileSync(ruta, html); tocadas++; }
      console.log(`  ${p.archivo}${antes !== html ? '  ↻' : '  ='}`);
      continue;
    }
    let html = readFileSync(ruta, 'utf8');
    if (html.includes(ABRE)) {
      const re = new RegExp(`${ABRE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${CIERRA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      html = html.replace(re, nuevo);
    } else {
      // Va después del <title> y antes del manifest: primero quién es la página, después cómo se
      // instala. Las puertas de entrada no tienen manifest —no son la app, solo mandan a ella—,
      // así que ahí el bloque va antes de la primera hoja de estilos.
      const desc = html.match(/^ {2}<meta name="description".*\n/m);
      if (desc) html = html.replace(desc[0], '');
      const ancla = /^( *<link rel="manifest".*\n)/m.test(html)
        ? /^( *<link rel="manifest".*\n)/m
        : /^( *<link rel="stylesheet".*\n)/m;
      html = html.replace(ancla, `${nuevo}\n$1`);
    }
    const antes = readFileSync(ruta, 'utf8');
    if (antes !== html) { writeFileSync(ruta, html); tocadas++; }
    console.log(`  ${p.archivo}${antes !== html ? '  ↻' : '  ='}`);
  }
  for (const p of puentes()) {
    const ruta = join(RAIZ, p.viejo);
    const antes = existsSync(ruta) ? readFileSync(ruta, 'utf8') : '';
    const html = paginaPuente(p);
    mkdirSync(dirname(ruta), { recursive: true });
    if (antes !== html) { writeFileSync(ruta, html); tocadas++; }
    console.log(`  ${p.viejo}${antes !== html ? '  ↻' : '  ='}`);
  }
  console.log(tocadas ? `${tocadas} página(s) con tarjeta nueva` : 'las tarjetas ya estaban al día');
}

/* ------------------------------------------------------------------ */
/* Las imágenes                                                        */
/* ------------------------------------------------------------------ */
/**
 * Cada chat recorta la imagen al alto de su propia ventanita y lo que se come son los lados:
 * de 1,91:1 a 1,5:1 se van 127 px por lado. Todo lo que se lea tiene que quedar dentro del 88%
 * central. Esto mide la tinta de verdad (los rangos del texto), no la caja de los bloques.
 */
const SEGURO = 10;  // % de cada lado que puede desaparecer
const MARGEN = `(()=>{
  let min = 1e9, max = -1e9, quien = '';
  const anda = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = anda.nextNode(); n; n = anda.nextNode()) {
    if (!n.textContent.trim()) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const c = r.getBoundingClientRect();
    if (!c.width) continue;
    if (c.left < min) { min = c.left; quien = n.textContent.trim().slice(0, 20); }
    if (c.right > max) { max = c.right; if (innerWidth - c.right < min) quien = n.textContent.trim().slice(0, 20); }
  }
  const izq = min / innerWidth * 100, der = (innerWidth - max) / innerWidth * 100;
  return Math.min(izq, der) < ${SEGURO} ? \`"\${quien}" (a \${Math.min(izq, der).toFixed(1)}% del borde)\` : '';
})()`;

/** PNG → JPEG con la herramienta que trae macOS, la misma que usa readme.py para las capturas. */
const jpeg = (origen, destino) => new Promise((ok, falla) => {
  // Fuera del Mac (una sesión en la nube) no hay sips: ImageMagick hace lo mismo
  const mac = process.platform === 'darwin';
  const s = mac
    ? spawn('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', origen, '--out', destino], { stdio: 'ignore' })
    : spawn('convert', [origen, '-quality', '82', destino], { stdio: 'ignore' });
  s.on('close', c => (c === 0 ? ok() : falla(new Error(`${mac ? 'sips' : 'convert'} salió con ${c}`))));
});

async function cmdImagenes() {
  const { launch, sleep } = await import('../e2e/cdp.mjs');
  const salida = join(RAIZ, 'public/assets/og');
  mkdirSync(salida, { recursive: true });
  // Fuera del repo: acá solo quedan los PNG intermedios y el perfil de Chrome
  const tmp = join(tmpdir(), 'juegos-de-salon-og');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  // Desde la raíz del repo, no desde public/: la tarjeta vive en tools/ e importa de /public/assets/
  const servidor = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
  await sleep(800);
  // Si el puerto ya lo tenía otro, python se fue y las fotos saldrían de la copia de otra sesión
  if (servidor.exitCode !== null) throw new Error(`el puerto ${PUERTO} está ocupado: PUERTO=87xx node tools/release/og.mjs imagenes`);
  let toca = [];
  try {
    // El lienzo es de 600×315 y cdp fotografía al doble: 1200×630 exactos
    const b = await launch({ port: PUERTO_CDP, dir: `${tmp}/perfil`, out: tmp, width: ANCHO / 2, height: ALTO / 2 });
    const huellas = leerHuellas();
    // Solo las que quedaron atrás: rehacer las demás solo cambia bytes y ensucia el diff
    toca = process.argv.includes('--todas') ? paginas() : paginas().filter(p => atrasada(p, huellas));
    for (const p of toca) {
      // El `t` es para que Chrome no reuse la tarjeta de la vuelta pasada: sin eso, un cambio
      // en el dibujo o en base.css se fotografía viejo y no hay forma de darse cuenta.
      const q = `?t=${Date.now()}${p.juego ? `&juego=${p.juego}` : ''}&lang=${p.lang}`;
      await b.go(`http://localhost:${PUERTO}/tools/release/og/tarjeta.html${q}`, 1200);
      // Sin esperar a las fuentes, el título sale en la tipografía de reemplazo
      for (let i = 0; i < 20 && !(await b.evaluate(`document.body.dataset.listo === '1'`)); i++) await sleep(200);
      await sleep(300);
      const fuera = await b.evaluate(MARGEN);
      if (fuera) console.log(`  ⚠️  ${p.imagen}: ${fuera} se sale de la franja segura y el chat lo puede recortar`);
      await b.shot(p.imagen);
      // En JPEG pesan cuatro veces menos y a este tamaño no se nota: son letras grandes sobre
      // un degradado. 3 MB de PNG en el repo por siete imágenes que solo miran los robots.
      await jpeg(join(tmp, `${p.imagen}.png`), join(salida, `${p.imagen}.jpg`));
      console.log(`  public/assets/og/${p.imagen}.jpg  ↻`);
      huellas[p.imagen] = huella(p);
    }
    const ordenadas = Object.fromEntries(Object.keys(huellas).sort().map(k => [k, huellas[k]]));
    writeFileSync(HUELLAS, JSON.stringify(ordenadas, null, 2) + '\n');
    if (!toca.length) console.log('  ninguna quedó atrás (con --todas se rehacen igual)');
    if (b.errors.length) console.log('  errores:', JSON.stringify(b.errors.slice(0, 2)));
    b.close();
  } finally {
    servidor.kill();
    // Chrome recién se está yendo y a veces todavía tiene su perfil abierto: si no se puede
    // borrar, no importa, está en el temporal del sistema.
    try { rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* nada */ }
  }
  console.log(`${toca.length} imagen(es) de ${ANCHO}×${ALTO}`);
  console.log('Míralas antes de publicar (C-12): git diff --stat public/assets/og');
}

/* ------------------------------------------------------------------ */
/* Revisión                                                            */
/* ------------------------------------------------------------------ */
function revisarImagen(p, problemas) {
  if (!existsSync(join(RAIZ, `public/assets/og/${p.imagen}.jpg`))) problemas.push(`falta public/assets/og/${p.imagen}.jpg  →  node tools/release/og.mjs imagenes`);
  else if (atrasada(p)) problemas.push(`public/assets/og/${p.imagen}.jpg se hizo con otro dibujo o con otros textos  →  node tools/release/og.mjs imagenes`);
}

function cmdRevisar() {
  const problemas = [];
  for (const p of paginas()) {
    const ruta = join(RAIZ, p.archivo);
    if (p.suelto) {
      if (!existsSync(ruta) || readFileSync(ruta, 'utf8') !== paginaSuelta(p, bloque(p))) {
        problemas.push(`${p.archivo} quedó atrás de public/cup/suelto/index.html o de games.js  →  node tools/release/og.mjs tarjetas`);
      }
      revisarImagen(p, problemas);
      continue;
    }
    const html = readFileSync(ruta, 'utf8');
    if (!html.includes(ABRE)) problemas.push(`${p.archivo} no tiene tarjeta social  →  node tools/release/og.mjs tarjetas`);
    else if (html.split(ABRE)[1].split(CIERRA)[0] !== bloque(p).split(ABRE)[1].split(CIERRA)[0]) {
      problemas.push(`${p.archivo} quedó atrás de games.js  →  node tools/release/og.mjs tarjetas`);
    }
    revisarImagen(p, problemas);
  }
  for (const p of puentes()) {
    const ruta = join(RAIZ, p.viejo);
    if (!existsSync(ruta) || readFileSync(ruta, 'utf8') !== paginaPuente(p)) {
      problemas.push(`${p.viejo}: falta la página puente o quedó atrás  →  node tools/release/og.mjs tarjetas`);
    }
  }
  problemas.forEach(x => console.log('  ERROR ·', x));
  if (!problemas.length) console.log(`tarjetas sociales al día · ${paginas().length} páginas`);
  return problemas.length ? 1 : 0;
}

const cmd = process.argv[2];
if (cmd === 'tarjetas') cmdTarjetas();
else if (cmd === 'imagenes') await cmdImagenes();
else if (cmd === 'revisar') process.exit(cmdRevisar());
else {
  console.error('Uso: node tools/release/og.mjs tarjetas | imagenes | revisar');
  process.exit(1);
}
