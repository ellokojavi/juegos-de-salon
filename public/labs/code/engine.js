/**
 * La clave — el motor del prototipo de laboratorio (D-270). Un código de 5 cifras de siete
 * segmentos repartido entre una base fija y 4 cartas transparentes. Cada carta tiene unos pocos
 * trazos y aparece girada o volteada al azar; hay que ponerlas todas sobre la base y orientar cada
 * una hasta que los trazos se junten en las cinco cifras. La base no se mueve: es la que dice cuál es
 * el derecho, así que el código no se puede leer "dado vuelta".
 *
 * Las orientaciones son las de una tarjeta rectangular: I (como está), R (girada 180°), H
 * (volteada de lado) y V (volteada de arriba abajo). Cada una es su propia inversa y R·H = V, así
 * que con "girar" y "voltear" se llega a todas. Sin DOM: lo prueba engine.test.mjs.
 */
export const CIFRAS_CODIGO = 5;
/** Cuántas cartas: 4 (con 8 era demasiado, pidió el dueño). */
export const CARTAS = 4;

/** Los segmentos de cada cifra: a arriba, b arriba a la derecha, c abajo a la derecha, d abajo, e abajo a la izquierda, f arriba a la izquierda, g al medio. */
export const SEGMENTOS = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};
const LETRAS = 'abcdefg';
const bit = s => 1 << LETRAS.indexOf(s);
const MASCARA = Object.fromEntries(Object.entries(SEGMENTOS).map(([d, v]) => [[...v].reduce((m, s) => m | bit(s), 0), d]));

/** Cómo mueve cada orientación un segmento: la cifra (de izquierda a derecha) y la letra. */
const MAPA = {
  I: { cifra: i => i, seg: {} },
  R: { cifra: i => CIFRAS_CODIGO - 1 - i, seg: { a: 'd', d: 'a', b: 'e', e: 'b', c: 'f', f: 'c' } },
  H: { cifra: i => CIFRAS_CODIGO - 1 - i, seg: { b: 'f', f: 'b', c: 'e', e: 'c' } },
  V: { cifra: i => i, seg: { a: 'd', d: 'a', b: 'c', c: 'b', e: 'f', f: 'e' } },
};
export const ORIENTACIONES = Object.keys(MAPA);

/** Un segmento `{ i, s }` (cifra y letra) visto con la orientación `o`. */
export const mover = (o, { i, s }) => ({ i: MAPA[o].cifra(i), s: MAPA[o].seg[s] || s });

/** Las dos orientaciones seguidas (el grupo es conmutativo y cada una es su inversa). */
export function componer(x, y) {
  if (x === 'I') return y;
  if (y === 'I') return x;
  if (x === y) return 'I';
  return ORIENTACIONES.find(o => o !== 'I' && o !== x && o !== y);
}
export const girar = o => componer(o, 'R');
export const voltear = o => componer(o, 'H');

/** Las máscaras de las cifras de unos trazos. */
const mascaras = segs => { const m = new Array(CIFRAS_CODIGO).fill(0); for (const { i, s } of segs) m[i] |= bit(s); return m; };
/** La cifra de una máscara, o null. */
export const cifraDe = m => MASCARA[m] ?? null;

const barajar = (xs, r) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/**
 * Los códigos que se pueden leer poniendo todas las cartas en alguna orientación. Una clave buena
 * tiene uno solo: el suyo (varias orientaciones pueden dar el mismo dibujo si una carta es simétrica).
 * Dos trazos encima del otro no valen (D-270): cada trazo del código está en una sola carta, así
 * que una combinación con un choque nunca es la buena.
 */
export function lecturas(clave) {
  const base = mascaras(clave.base);
  const opciones = clave.cartas.map(c => ORIENTACIONES.map(o => mascaras(c.trazos.map(x => mover(o, x)))));
  const out = new Set();
  const ir = (k, m) => {
    if (k === opciones.length) {
      const d = m.map(cifraDe);
      if (d.every(x => x !== null)) out.add(d.join(''));
      return;
    }
    for (const op of opciones[k]) if (m.every((x, i) => !(x & op[i]))) ir(k + 1, m.map((x, i) => x | op[i]));
  };
  ir(0, base);
  return out;
}

/**
 * Arma una clave con `n` cartas: el código, los trazos de la base y de cada carta tal como se
 * muestran (`trazos`), y la orientación que la arregla (`o`). Cada carta tiene al menos un trazo (dos
 * con 4 cartas) y la base unos pocos; con todas las cartas puestas, solo el código bueno se lee.
 */
export function generar(n = CARTAS, r = Math.random) {
  for (let intento = 0; intento < 400; intento++) {
    const codigo = Array.from({ length: CIFRAS_CODIGO }, () => Math.floor(r() * 10));
    const trazos = barajar(codigo.flatMap((d, i) => [...SEGMENTOS[d]].map(s => ({ i, s }))), r);
    // La base se queda con unos pocos (uno de cada cinco, al menos dos); el resto se reparte en turnos
    const enBase = Math.max(2, Math.round(trazos.length / 5));
    const base = trazos.slice(0, enBase);
    const resto = trazos.slice(enBase);
    const minimo = n <= 4 ? 2 : 1;
    if (resto.length < n * minimo) continue;
    const pilas = Array.from({ length: n }, () => []);
    resto.forEach((x, k) => pilas[k < n * minimo ? k % n : Math.floor(r() * n)].push(x));
    // Cada carta aparece con una orientación al azar; con 4 cartas, ninguna viene ya derecha
    const cartas = pilas.map(bien => {
      const o = n <= 4 ? ['R', 'H', 'V'][Math.floor(r() * 3)] : ORIENTACIONES[Math.floor(r() * 4)];
      return { o, trazos: bien.map(x => mover(o, x)) };
    });
    const clave = { codigo: codigo.join(''), base, cartas };
    const leidas = lecturas(clave);
    if (leidas.size === 1 && leidas.has(clave.codigo)) return clave;
  }
  throw new Error('no se pudo armar una clave con una sola lectura');
}

/** Lo que se ve con esas cartas puestas (`puestas[k]`) y orientadas (`g[k]`): los segmentos de cada cifra. */
export function juntos(clave, g, puestas = clave.cartas.map(() => true)) {
  const out = Array.from({ length: CIFRAS_CODIGO }, () => new Set());
  for (const x of clave.base) out[x.i].add(x.s);
  clave.cartas.forEach((c, k) => {
    if (!puestas[k]) return;
    for (const x of c.trazos) { const m = mover(g[k], x); out[m.i].add(m.s); }
  });
  return out;
}

/**
 * Los trazos que quedan uno encima de otro con esas cartas puestas y orientadas: `{ i, s, capas }`
 * de cada choque, con las capas que lo pisan ('base' o el número de la carta). Con la clave
 * resuelta no hay ninguno.
 */
export function choques(clave, g, puestas = clave.cartas.map(() => true)) {
  const vistos = new Map();
  const anotar = (capa, { i, s }) => { const k = `${i}${s}`; vistos.set(k, [...(vistos.get(k) || []), capa]); };
  clave.base.forEach(x => anotar('base', x));
  clave.cartas.forEach((c, k) => { if (puestas[k]) c.trazos.forEach(x => anotar(k, mover(g[k], x))); });
  return [...vistos].filter(([, capas]) => capas.length > 1).map(([k, capas]) => ({ i: Number(k[0]), s: k[1], capas }));
}

/** La cifra que dibujan esos segmentos, o null si no es ninguna. */
export const leer = segs => cifraDe([...segs].reduce((m, s) => m | bit(s), 0));
