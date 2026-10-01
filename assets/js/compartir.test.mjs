// El estándar de lo que se comparte (D-165): la cabecera, el link en su línea al final, y qué
// pasa cuando hay menú del sistema, cuando no, y cuando va una imagen.
// Uso: node assets/js/compartir.test.mjs
import assert from 'node:assert/strict';
import { cabecera, conLink, compartir, puntajeYTiempo, nombreArchivo } from './compartir.js';

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
  assert.deepEqual(r.compartido, [{ title: 'X', text: 'hola\n\n🔗 https://a.b/' }]);
});

await caso('con imagen y un celular que comparte archivos: la imagen y el texto juntos', async () => {
  const r = navegador();
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/', imagen }), 'shared');
  assert.deepEqual(r.compartido, [{ files: [imagen], title: 'X', text: 'hola\n\n🔗 https://a.b/' }]);
});

await caso('sin menú: se copia el mensaje entero', async () => {
  const r = navegador({ share: false, archivos: false });
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/' }), 'copied');
  assert.deepEqual(r.copiado, ['hola\n\n🔗 https://a.b/']);
});

await caso('con imagen y sin compartir archivos: se descarga y el texto queda copiado', async () => {
  const r = navegador({ archivos: false });
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/', imagen }), 'downloaded');
  assert.deepEqual(r.descargado, ['copa-x-dia-1.png']);
  assert.deepEqual(r.copiado, ['hola\n\n🔗 https://a.b/']);
  assert.deepEqual(r.compartido, [], 'no manda el texto solo, sin la imagen');
});

await caso('cancelar el menú no copia ni descarga nada', async () => {
  const r = navegador();
  globalThis.navigator.share = async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; };
  assert.equal(await compartir({ titulo: 'X', texto: 'hola', url: 'https://a.b/', imagen }), 'failed');
  assert.deepEqual([r.copiado, r.descargado], [[], []]);
});

console.log(`compartir: ${n} casos en verde`);
