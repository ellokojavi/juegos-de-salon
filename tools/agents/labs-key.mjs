/**
 * Las llaves del laboratorio (D-281, D-284). Cada persona que entra a /labs/ tiene su llave y su
 * link; en public/assets/js/labs-puerta.js solo queda la huella de cada una, con una etiqueta.
 *
 *   node tools/agents/labs-key.mjs nueva <etiqueta>    crea una llave y muestra su link (una sola vez)
 *   node tools/agents/labs-key.mjs quitar <etiqueta>   saca a esa persona; las demás siguen entrando
 *   node tools/agents/labs-key.mjs listar              quién tiene llave
 *
 * La llave no se guarda en ningún lado: se muestra una vez y la guarda quien la recibe. Si se
 * pierde, se quita y se crea otra. La etiqueta es pública (el repo lo es): iniciales o un apodo.
 * El cambio a labs-puerta.js entra con un PR, y la llave abre recién cuando el sitio se publica.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PUERTA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'js', 'labs-puerta.js');
export const SITIO = 'https://juegosdesalon.cl';

const BLOQUE = /( *)var HUELLAS = \{\n([\s\S]*?)\n?\1\};/;
const LINEA = /^ *'([^']+)': '([0-9a-f]{64})',$/;
const ETIQUETA = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,23}$/u;

/** Las llaves que la puerta acepta: [{ etiqueta, huella }]. Puro: se prueba sin disco. */
export function leer(fuente) {
  const m = fuente.match(BLOQUE);
  if (!m) throw new Error('labs-puerta.js no tiene el bloque `var HUELLAS = { … };`');
  return m[2].split('\n').filter(l => l.trim()).map(l => {
    const x = l.match(LINEA);
    if (!x) throw new Error(`línea que no entiendo en HUELLAS: ${l.trim()}`);
    return { etiqueta: x[1], huella: x[2] };
  });
}

function escribir(fuente, llaves) {
  return fuente.replace(BLOQUE, (_, sangria) =>
    `${sangria}var HUELLAS = {\n${llaves.map(l => `${sangria}  '${l.etiqueta}': '${l.huella}',`).join('\n')}\n${sangria}};`);
}

export const huella = llave => createHash('sha256').update(llave).digest('hex');

/** Una llave al azar: 20 letras y números en minúscula, fácil de copiar y sin ambigüedad de mayúsculas.
 *  Con etiqueta, la llave empieza con ella (`ratoncito-…`), para que cada uno reconozca su link. */
export function llaveNueva(etiqueta = '') {
  const A = 'abcdefghijkmnpqrstuvwxyz23456789';
  const azar = Array.from({ length: 20 }, () => A[randomInt(A.length)]).join('');
  const prefijo = etiqueta.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '_');
  return prefijo ? `${prefijo}-${azar}` : azar;
}

export function agregar(fuente, etiqueta, llave) {
  if (!ETIQUETA.test(etiqueta)) throw new Error(`etiqueta no válida: "${etiqueta}" (letras, números, espacio, . _ -; hasta 24)`);
  const llaves = leer(fuente);
  const ya = llaves.find(l => l.etiqueta.toLowerCase() === etiqueta.toLowerCase());
  if (ya) throw new Error(`"${ya.etiqueta}" ya tiene llave: quítala antes de darle otra`);
  return escribir(fuente, [...llaves, { etiqueta, huella: huella(llave) }]);
}

export function quitar(fuente, etiqueta) {
  const llaves = leer(fuente);
  const quedan = llaves.filter(l => l.etiqueta.toLowerCase() !== etiqueta.toLowerCase());
  if (quedan.length === llaves.length) throw new Error(`"${etiqueta}" no tiene llave (listar dice quién sí)`);
  if (!quedan.length) throw new Error('es la última llave: sin ninguna, nadie entra al laboratorio');
  return escribir(fuente, quedan);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...resto] = process.argv.slice(2);
  const etiqueta = resto.join(' ').trim();
  const fuente = readFileSync(PUERTA, 'utf8');
  try {
    if (cmd === 'listar') {
      for (const l of leer(fuente)) console.log(`${l.etiqueta.padEnd(24)} ${l.huella.slice(0, 12)}…`);
    } else if (cmd === 'nueva' && etiqueta) {
      const llave = llaveNueva(etiqueta);
      writeFileSync(PUERTA, agregar(fuente, etiqueta, llave));
      console.log(`Llave para ${etiqueta}. Se muestra solo esta vez: cópiala ahora.\n`);
      console.log(`  ${SITIO}/labs/?key=${llave}\n`);
      console.log('El link abre recién cuando el cambio a public/assets/js/labs-puerta.js entre con un PR y el sitio se publique.');
    } else if (cmd === 'quitar' && etiqueta) {
      const nombre = leer(fuente).find(l => l.etiqueta.toLowerCase() === etiqueta.toLowerCase())?.etiqueta ?? etiqueta;
      writeFileSync(PUERTA, quitar(fuente, etiqueta));
      console.log(`Llave de ${nombre} quitada. Deja de entrar cuando el cambio a public/assets/js/labs-puerta.js entre con un PR y el sitio se publique.`);
    } else {
      console.log('Uso: node tools/agents/labs-key.mjs nueva <etiqueta> | quitar <etiqueta> | listar');
      process.exit(cmd ? 1 : 0);
    }
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
