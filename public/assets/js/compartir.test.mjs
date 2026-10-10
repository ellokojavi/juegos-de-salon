// El estándar de lo que se comparte (D-165): la cabecera, el link en su línea al final, y qué
// pasa cuando hay menú del sistema, cuando no, y cuando va una imagen.
// Uso: node public/assets/js/compartir.test.mjs
import assert from 'node:assert/strict';
import { cabecera, conLink, compartir, puntajeYTiempo, nombreArchivo, textoResultadoSolo, marcarCompartido, compartirApp } from './compartir.js';
import { COMMON, IDIOMAS } from './i18n.js';

let n = 0;
const caso = async (nombre, fn) => { await fn(); n++; };

await caso('la cabecera: emoji, título en negrita y contexto', () => {
  assert.equal(cabecera({ emoji: '🏆', titulo: 'La Copa: Valdenenas', contexto: 'Día 3 de 7' }), '🏆 *La Copa: Valdenenas* · Día 3 de 7');
  assert.equal(cabecera({ emoji: '🔢', titulo: 'Toque y Fama' }), '🔢 *Toque y Fama*');
});

await caso('el link va solo en la última línea, separado por una en blanco (D-124)', () => {
  assert.equal(conLink('hola', 'https://juegosdesalon.cl/'), 'hola\n\n🔗 https://juegosdesalon.cl/');
  assert.equal(conLink('hola', ''), 'hola');
});

await caso('el tiempo no se repite si la tarjeta ya lo trae (D-114)', () => {
  assert.equal(puntajeYTiempo('78/100', '1:23', '🟩🟩'), '78/100 · ⏱ 1:23');
  assert.equal(puntajeYTiempo('78/100', '1:23', '👑 ⏱ 1:23 ✅'), '78/100');
  assert.equal(puntajeYTiempo('', '1:23', ''), '⏱ 1:23');
});

await caso('el nombre del archivo, sin tildes ni espacios', () => {
  assert.equal(nombreArchivo('copa', 'Valdeñenas', 'dia', 3, 'José Pérez'), 'copa-valdenenas-dia-3-jose-perez.png');
  assert.equal(nombreArchivo('Línea de Tiempo: Música', 'resultado'), 'linea-de-tiempo-musica-resultado.png');
});

// Un navegador de mentira: lo que se compartió, lo que se copió y lo que se descargó
function navegador({ share = true, archivos = true, portapapeles = true } = {}) {
  const r = { compartido: [], copiado: [], descargado: [] };
  // Node 21+ trae un `navigator` de solo lectura: se reemplaza la propiedad entera
  Object.defineProperty(globalThis, 'navigator', { configurable: true, writable: true, value: {
    share: share ? async d => { r.compartido.push(d); } : undefined,
    canShare: archivos ? () => true : undefined,
    clipboard: { writeText: async t => { if (!portapapeles) throw new Error('no'); r.copiado.push(t); } },
  } });
  globalThis.URL.createObjectURL = f => f.name;
  globalThis.document = {
    createElement: () => { const a = { click() { r.descargado.push(a.download); }, remove() {} }; return a; },
    body: { append() {} },
  };
  return r;
}
const imagen = { name: 'copa-x-dia-1.png' };

await caso('con menú: el texto lleva el link adentro y no como `url`', async () => {
  const r = navegador();
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/' }), 'shared');
  assert.deepEqual(r.compartido, [{ title: 'X', text: 'hola\n\n🔗 https://a.b/?from=link' }]);
});

await caso('con imagen y un celular que comparte archivos: la imagen y el texto juntos', async () => {
  const r = navegador();
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/', imagen }), 'shared');
  assert.deepEqual(r.compartido, [{ files: [imagen], title: 'X', text: 'hola\n\n🔗 https://a.b/?from=link' }]);
});

await caso('sin menú: se copia el mensaje entero', async () => {
  const r = navegador({ share: false, archivos: false });
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/' }), 'copied');
  assert.deepEqual(r.copiado, ['hola\n\n🔗 https://a.b/?from=link']);
});

await caso('con imagen y sin compartir archivos: se descarga y el texto queda copiado', async () => {
  const r = navegador({ archivos: false });
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/', imagen }), 'downloaded');
  assert.deepEqual(r.descargado, ['copa-x-dia-1.png']);
  assert.deepEqual(r.copiado, ['hola\n\n🔗 https://a.b/?from=link']);
  assert.deepEqual(r.compartido, [], 'no manda el texto solo, sin la imagen');
});

await caso('cancelar el menú no copia ni descarga nada', async () => {
  const r = navegador();
  globalThis.navigator.share = async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; };
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/', imagen }), 'failed');
  assert.deepEqual([r.copiado, r.descargado], [[], []]);
});

await caso('jugando solo, el texto no repite lo que dice la imagen (D-171)', () => {
  const C = { shareSoloContext: 'Jugando solo', shareSoloCta: '🤔 ¿Me ganas?' };
  assert.equal(textoResultadoSolo({ C, emoji: '🔢', juego: 'Toque y Fama' }), '🔢 *Toque y Fama* · Jugando solo\n\n🤔 ¿Me ganas?');
});

await caso('el link compartido lleva su marca, al final y sin pisar lo que ya trae (D-208)', () => {
  assert.equal(marcarCompartido('https://juegosdesalon.cl/'), 'https://juegosdesalon.cl/?from=link');
  // Un código de copa o un link propio se leen sin `=`: la marca va detrás y no los confunde
  assert.equal(marcarCompartido('https://juegosdesalon.cl/cup/?oficina'), 'https://juegosdesalon.cl/cup/?oficina&from=link');
  assert.equal(marcarCompartido('https://juegosdesalon.cl/battleship/?room=ABCD#x'), 'https://juegosdesalon.cl/battleship/?room=ABCD&from=link#x');
  assert.equal(marcarCompartido('https://juegosdesalon.cl/?from=instagram'), 'https://juegosdesalon.cl/?from=instagram', 'una marca puesta a mano se respeta');
  assert.equal(marcarCompartido('https://juegosdesalon.cl/?de=instagram'), 'https://juegosdesalon.cl/?de=instagram', 'también con el nombre de antes de D-266');
  assert.equal(marcarCompartido(''), '');
  assert.equal(marcarCompartido('no es un link'), 'no es un link');
});

await caso('compartir la app: la tarjeta de la portada y el texto, en el idioma en que se mira (D-226)', async () => {
  for (const lang of IDIOMAS) {
    const C = COMMON[lang];
    const app = compartirApp({ C, lang, juegos: 15 });
    assert.match(app.src, new RegExp(`/assets/og/${lang === 'es' ? 'menu' : `menu-${lang}`}\\.jpg$`), lang);
    const [cab, lineas] = app.texto.split('\n\n');
    assert.equal(cab, cabecera({ emoji: '🎲', titulo: C.appTitle, contexto: C.shareApp.context.replace('{n}', 15) }));
    assert.ok(cab.includes('15'), `${lang}: dice cuántos juegos hay`);
    assert.equal(lineas, C.shareApp.lines.join('\n'));
  }
  // La tarjeta se baja una vez, como JPEG; si no se pudo, da null y se comparte solo el texto
  let pedidos = 0;
  globalThis.fetch = async () => { pedidos++; return { ok: true, blob: async () => new Blob(['x'], { type: 'image/jpeg' }) }; };
  const app = compartirApp({ C: COMMON.pt, lang: 'pt', juegos: 15 });
  const f = await app.imagen();
  assert.equal(await app.imagen(), f);
  assert.deepEqual([pedidos, f.name, f.type], [1, 'jogos-de-salao.jpg', 'image/jpeg']);
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  assert.equal(await compartirApp({ C: COMMON.es, lang: 'es', juegos: 15 }).imagen(), null);
  const r = navegador();
  const { titulo, texto } = compartirApp({ C: COMMON.de, lang: 'de', juegos: 15 });
  assert.equal(await compartir({ titulo, texto, url: 'https://juegosdesalon.cl/de/', imagen: f }), 'shared');
  assert.deepEqual(r.compartido[0].files, [f]);
  assert.ok(r.compartido[0].text.startsWith('🎲 *Salonspiele* · 15 Spiele'));
  assert.ok(r.compartido[0].text.endsWith('🔗 https://juegosdesalon.cl/de/?from=link'));
});

console.log(`compartir: ${n} casos en verde`);
