/**
 * Las tarjetas sociales (Open Graph): lo que se ve cuando alguien pega un link de la app en
 * WhatsApp, en un chat o en una red. Importa a esta app más que a otras: los links de sala se
 * comparten por WhatsApp, así que la invitación a jugar **es** una tarjeta de estas.
 *
 *   node tools/og.mjs tarjetas   reescribe el bloque <!-- generado: og --> de cada página
 *   node tools/og.mjs imagenes   rehace las imágenes de 1200×630 con Chrome (necesita internet:
 *                                las fuentes vienen de Google Fonts)
 *   node tools/og.mjs revisar    ¿quedó alguna página sin bloque, o alguna imagen sin hacer?
 *
 * Los textos salen de assets/js/games.js, que es de donde sale también el menú: un solo lugar
 * donde cambiar el nombre o la bajada de un juego. `set-version.py` corre `tarjetas` en cada
 * publicación para que no se queden atrás; las imágenes se rehacen a mano, porque necesitan
 * navegador (y solo cambian si cambia un nombre, un emoji o el diseño de la tarjeta).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { GAMES } from '../assets/js/games.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITIO = 'https://juegosdesalon.cl';
const PUERTO = 8791;
const ANCHO = 1200, ALTO = 630;

/** El sitio en una frase, para la portada. */
const disponibles = GAMES.filter(g => g.available);
const PORTADA = {
  archivo: 'index.html',
  ruta: '/',
  imagen: 'menu',
  titulo: 'Juegos de Salón 🎲',
  // Sin decir cuántos son: el número cambia cada vez que entra un juego, y una frase que
  // envejece sola es peor que una que no cuenta nada. La lista sí se arma de games.js.
  descripcion: 'Juegos tradicionales llevados a tu celular para pasar el tiempo solo o con amigos: '
    + disponibles.map(g => g.name.es).join(', ').replace(/, ([^,]*)$/, ' y $1')
    + '. Gratis, sin instalar y sin cuenta.',
  alt: 'Juegos de Salón: ' + disponibles.map(g => g.emoji).join(' '),
};

const paginas = () => [PORTADA, ...disponibles.map(g => ({
  archivo: `${g.id}/index.html`,
  ruta: `/${g.id}/`,
  imagen: g.id,
  juego: g.id,
  titulo: `${g.name.es} ${g.emoji} · Juegos de Salón`,
  descripcion: `${g.tagline.es} ${g.players} jugadores, ${g.duration} min. Gratis, sin instalar y sin cuenta.`,
  alt: `${g.name.es}: ${g.tagline.es}`,
}))];

/* ------------------------------------------------------------------ */
/* Las etiquetas                                                       */
/* ------------------------------------------------------------------ */
const ABRE = '  <!-- generado: og · lo reescribe node tools/og.mjs tarjetas -->';
const CIERRA = '  <!-- /generado -->';
const escapa = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * La versión estampada, para que un cambio de imagen no se quede pegado en la caché de WhatsApp.
 * Se lee de la hoja de estilos y no del primer `?v=` que aparezca: el bloque de las tarjetas va
 * antes en el archivo, así que "el primero" terminaba siendo el de la vuelta pasada.
 */
function version() {
  const m = readFileSync(join(RAIZ, 'index.html'), 'utf8').match(/base\.css\?v=(\d+\.\d+\.\d+)/);
  return m ? m[1] : '0';
}

function bloque(p) {
  const img = `${SITIO}/assets/og/${p.imagen}.jpg?v=${version()}`;
  const url = SITIO + p.ruta;
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
    // El sitio es en español y ofrece inglés y portugués con el mismo link (D-47)
    ['property', 'og:locale', 'es_CL'],
    ['property', 'og:locale:alternate', 'en_US'],
    ['property', 'og:locale:alternate', 'pt_BR'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', p.titulo],
    ['name', 'twitter:description', p.descripcion],
    ['name', 'twitter:image', img],
    ['name', 'twitter:image:alt', p.alt],
  ];
  const lineas = meta.map(([tipo, clave, valor]) => (tipo === 'canonical'
    ? `  <link rel="canonical" href="${escapa(valor)}">`
    : `  <meta ${tipo}="${clave}" content="${escapa(valor)}">`));
  return [ABRE, ...lineas, CIERRA].join('\n');
}

function cmdTarjetas() {
  let tocadas = 0;
  for (const p of paginas()) {
    const ruta = join(RAIZ, p.archivo);
    let html = readFileSync(ruta, 'utf8');
    const nuevo = bloque(p);
    if (html.includes(ABRE)) {
      const re = new RegExp(`${ABRE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${CIERRA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      html = html.replace(re, nuevo);
    } else {
      // Va después del <title> y antes del manifest: primero quién es la página, después cómo se instala
      const desc = html.match(/^ {2}<meta name="description".*\n/m);
      if (desc) html = html.replace(desc[0], '');
      html = html.replace(/^( *<link rel="manifest".*\n)/m, `${nuevo}\n$1`);
    }
    const antes = readFileSync(ruta, 'utf8');
    if (antes !== html) { writeFileSync(ruta, html); tocadas++; }
    console.log(`  ${p.archivo}${antes !== html ? '  ↻' : '  ='}`);
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
  const s = spawn('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', origen, '--out', destino], { stdio: 'ignore' });
  s.on('close', c => (c === 0 ? ok() : falla(new Error(`sips salió con ${c}`))));
});

async function cmdImagenes() {
  const { launch, sleep } = await import('./e2e/cdp.mjs');
  const salida = join(RAIZ, 'assets/og');
  mkdirSync(salida, { recursive: true });
  // Fuera del repo: acá solo quedan los PNG intermedios y el perfil de Chrome
  const tmp = join(tmpdir(), 'juegos-de-salon-og');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  const servidor = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
  await sleep(800);
  try {
    // El lienzo es de 600×315 y cdp fotografía al doble: 1200×630 exactos
    const b = await launch({ port: 9490, dir: `${tmp}/perfil`, out: tmp, width: ANCHO / 2, height: ALTO / 2 });
    for (const p of paginas()) {
      // El `t` es para que Chrome no reuse la tarjeta de la vuelta pasada: sin eso, un cambio
      // en el dibujo o en base.css se fotografía viejo y no hay forma de darse cuenta.
      const q = `?t=${Date.now()}${p.juego ? `&juego=${p.juego}` : ''}`;
      await b.go(`http://localhost:${PUERTO}/tools/og/tarjeta.html${q}`, 1200);
      // Sin esperar a las fuentes, el título sale en la tipografía de reemplazo
      for (let i = 0; i < 20 && !(await b.evaluate(`document.body.dataset.listo === '1'`)); i++) await sleep(200);
      await sleep(300);
      const fuera = await b.evaluate(MARGEN);
      if (fuera) console.log(`  ⚠️  ${p.imagen}: ${fuera} se sale de la franja segura y el chat lo puede recortar`);
      await b.shot(p.imagen);
      // En JPEG pesan cuatro veces menos y a este tamaño no se nota: son letras grandes sobre
      // un degradado. 3 MB de PNG en el repo por siete imágenes que solo miran los robots.
      await jpeg(join(tmp, `${p.imagen}.png`), join(salida, `${p.imagen}.jpg`));
      console.log(`  assets/og/${p.imagen}.jpg  ↻`);
    }
    if (b.errors.length) console.log('  errores:', JSON.stringify(b.errors.slice(0, 2)));
    b.close();
  } finally {
    servidor.kill();
    // Chrome recién se está yendo y a veces todavía tiene su perfil abierto: si no se puede
    // borrar, no importa, está en el temporal del sistema.
    try { rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* nada */ }
  }
  console.log(`${paginas().length} imagen(es) de ${ANCHO}×${ALTO}`);
  console.log('Míralas antes de publicar (C-12): git diff --stat assets/og');
}

/* ------------------------------------------------------------------ */
/* Revisión                                                            */
/* ------------------------------------------------------------------ */
function cmdRevisar() {
  const problemas = [];
  for (const p of paginas()) {
    const html = readFileSync(join(RAIZ, p.archivo), 'utf8');
    if (!html.includes(ABRE)) problemas.push(`${p.archivo} no tiene tarjeta social  →  node tools/og.mjs tarjetas`);
    else if (html.split(ABRE)[1].split(CIERRA)[0] !== bloque(p).split(ABRE)[1].split(CIERRA)[0]) {
      problemas.push(`${p.archivo} quedó atrás de games.js  →  node tools/og.mjs tarjetas`);
    }
    if (!existsSync(join(RAIZ, `assets/og/${p.imagen}.jpg`))) {
      problemas.push(`falta assets/og/${p.imagen}.jpg  →  node tools/og.mjs imagenes`);
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
  console.error('Uso: node tools/og.mjs tarjetas | imagenes | revisar');
  process.exit(1);
}
