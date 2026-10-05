/**
 * Un juego en todos los idiomas que se ofrecen (D-199). No es un guion: lo llaman los
 * `<juego>/idiomas.mjs`, uno por juego, para que GitHub los corra en paralelo y diga cuál falló.
 *
 * Recorre cada pantalla de `caminos.mjs` en cada idioma de `LANGS` —hoy es, en, pt y de; uno nuevo
 * entra solo— y compara contra el español, que es el que se escribe primero:
 *
 *   - la página queda en ese idioma (`<html lang>`) y llega a la misma pantalla que en español;
 *   - no asoma un texto sin armar: undefined, NaN, [object …] ni un {marcador} sin reemplazar;
 *   - no queda nada en español: ningún texto de los diccionarios (los del juego y COMMON) que
 *     en ese idioma diga otra cosa, y ninguna línea larga idéntica a la de la pantalla en
 *     español, que es como se delata un texto escrito a mano fuera de los diccionarios;
 *   - el idioma no rompe la pantalla (C-8): un texto más largo —el alemán lo es— no puede
 *     traer scroll horizontal, botones bajo 44 px ni botones que se salgan por abajo que el
 *     español no tenga.
 *
 * Lo que ya está mal en español lo cuentan los guiones del juego; aquí solo se mira lo que
 * cambia con el idioma. Cada toma queda como captura: `<pantalla>-<idioma>.png`.
 */
import { mkdirSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
import { LANGS, EN_LABS, LABS_KEY, COMMON } from '../../public/assets/js/i18n.js';
import { gameById } from '../../public/assets/js/games.js';
import { CAMINOS } from './caminos.mjs';

const SITIO = process.env.SITIO || 'http://localhost:8765';
const LARGO_MINIMO = 12;   // un fragmento más corto ("Menú", "Listo") puede repetirse por azar

/** Las hojas de texto de un diccionario, con su ruta: [['intro.title', 'Hola'], …]. */
const hojas = (o, ruta = '') => typeof o === 'string' ? [[ruta, o]]
  : o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => hojas(v, ruta ? `${ruta}.${k}` : k)) : [];

/**
 * Los trozos en español que no deberían verse en `lang`: de cada texto que en ese idioma dice
 * otra cosa, sus pedazos entre marcadores, etiquetas y saltos de línea, sin los muy cortos.
 */
export function trozosEnEspanol(dicts, lang) {
  const trozos = new Set();
  for (const d of dicts) {
    const otro = new Map(hojas(d[lang]));
    for (const [ruta, es] of hojas(d.es)) {
      if (otro.get(ruta) === es) continue;   // el mismo en los dos idiomas ("Tango", "OK")
      for (const t of es.split(/\{[^}]*\}|<[^>]*>|\n|\*/)) {
        const limpio = t.trim();
        if (limpio.length >= LARGO_MINIMO) trozos.add(limpio);
      }
    }
  }
  // Un trozo que también es texto del otro idioma no delata nada ("Toque y Fama" en pt)
  const delOtro = dicts.flatMap(d => hojas(d[lang]).map(([, v]) => v)).join('\n');
  return [...trozos].filter(t => !delOtro.includes(t));
}

const MEDIR = `(()=>{
  const visible = x => x.offsetParent !== null && x.getBoundingClientRect().height > 0;
  const nombre = x => (x.textContent || x.className).trim().replace(/\\s+/g, ' ').slice(0, 24);
  const activa = document.querySelector('.screen.active');
  return {
    lang: document.documentElement.lang,
    pantalla: activa?.id || '',
    texto: document.body.innerText,
    scroll: document.documentElement.scrollWidth > innerWidth,
    chicos: [...new Set([...document.querySelectorAll('.screen.active button, .confirm button')]
      .filter(x => visible(x) && x.getBoundingClientRect().height < 43.5).map(nombre))],
    fuera: [...new Set([...document.querySelectorAll('.screen.active .btn, .confirm .btn')]
      .filter(x => visible(x) && x.getBoundingClientRect().bottom > innerHeight + 1).map(nombre))],
  };
})()`;

/**
 * Recorre `juego` (su id) en todos los idiomas.
 * @param {object} op
 * @param {object[]} op.dicts   los diccionarios del juego ({ es, en, pt, de }); COMMON se suma solo
 * @param {number}   op.port    el nombre del Chrome; el puerto real lo elige cdp.mjs (D-213)
 * @param {string[]} [op.pantallas]  cuáles; por omisión, todas las de su camino
 * @param {string[]} [op.permitidos] trozos en español que sí pueden verse (contenido, no interfaz)
 * @param {string}   [op.consulta] lo que va después de la carpeta ('?prueba' en La Copa)
 * @param {string}   [op.salida]  dónde dejar las capturas; por omisión, la carpeta del guion
 * @returns {Promise<number>} cuántos chequeos quedaron en rojo
 */
export async function revisarIdiomas(juego, { dicts = [], port, pantallas, permitidos = [], ancho = 390, alto = 844, salida, consulta = '' }) {
  const OUT = salida || process.argv[2] || `/tmp/idiomas-${juego}`;
  mkdirSync(OUT, { recursive: true });
  const caminos = CAMINOS[juego];
  if (!caminos) throw new Error(`No hay caminos para "${juego}" en caminos.mjs`);
  const ruta = (gameById(juego)?.path || `${juego}/`) + consulta;
  const tomas = pantallas || Object.keys(caminos);
  const todos = [...dicts, COMMON];
  const trozos = Object.fromEntries(LANGS.filter(l => l !== 'es')
    .map(l => [l, trozosEnEspanol(todos, l).filter(t => !permitidos.includes(t))]));

  // Lo que el idioma dice igual que el español a propósito ("Tango", un nombre propio)
  const delIdioma = Object.fromEntries(LANGS.map(l => [l, todos.flatMap(d => hojas(d[l]).map(([, v]) => v)).join('\n')]));

  const b = await launch({ port, dir: `${OUT}/perfil`, out: OUT, width: ancho, height: alto });
  let fallas = 0;
  const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fallas++; };
  console.log(`${juego}: ${tomas.length} pantallas × ${LANGS.join(', ')}`);

  for (const toma of tomas) {
    let es = null;
    for (const lang of ['es', ...LANGS.filter(l => l !== 'es')]) {
      await b.go(`${SITIO}/${ruta}`, 800);
      const labs = EN_LABS.includes(lang) ? `localStorage.setItem('${LABS_KEY}', '${lang}');` : '';
      await b.evaluate(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('juegos-de-salon:lang', '${lang}'); ${labs} 1`);
      await b.go(`${SITIO}/${ruta}`, 1500);
      const antes = b.errors.length;
      for (const paso of caminos[toma]) {
        try { await b.evaluate(`(()=>{ ${paso} ; return 1})()`); }
        catch (e) { ok(false, `${toma} · ${lang}: un paso del camino falló (${e.message.split('\n')[0]})`); }
        await sleep(700);
      }
      await sleep(500);
      const m = await b.evaluate(MEDIR);
      await b.shot(`${toma}-${lang}`);
      const nuevos = b.errors.slice(antes);
      ok(!nuevos.length, `${toma} · ${lang}: sin errores en la consola${nuevos.length ? ': ' + nuevos[0].slice(0, 160) : ''}`);
      ok(m.lang === lang, `${toma} · ${lang}: la página está en ${lang}${m.lang === lang ? '' : ` (dice ${m.lang})`}`);
      const roto = m.texto.match(/\bundefined\b|\bNaN\b|\[object \w+\]|\{[a-zA-Z]\w*\}/g);
      ok(!roto, `${toma} · ${lang}: sin textos a medio armar${roto ? ': ' + [...new Set(roto)].join(', ') : ''}`);
      if (lang === 'es') { es = m; continue; }

      ok(m.pantalla === es.pantalla, `${toma} · ${lang}: llega a la misma pantalla que en español (${m.pantalla || '—'})`);
      const enEspanol = trozos[lang].filter(t => m.texto.includes(t));
      ok(!enEspanol.length, `${toma} · ${lang}: nada quedó en español${enEspanol.length ? ': ' + enEspanol.slice(0, 3).map(t => JSON.stringify(t)).join(', ') : ''}`);
      // Lo escrito a mano: una línea con palabras que sale igual que en español
      const lineasEs = new Set(es.texto.split('\n').map(l => l.trim()));
      const iguales = m.texto.split('\n').map(l => l.trim())
        .filter(l => l.length >= LARGO_MINIMO && (l.match(/\p{L}{3,}/gu) || []).length >= 3 && lineasEs.has(l))
        .filter(l => !delIdioma[lang].includes(l) && !permitidos.some(p => l.includes(p)));
      ok(!iguales.length, `${toma} · ${lang}: ninguna línea igual a la del español${iguales.length ? ': ' + iguales.slice(0, 3).map(t => JSON.stringify(t)).join(', ') : ''}`);
      ok(!m.scroll || es.scroll, `${toma} · ${lang}: sin scroll horizontal (C-8)`);
      const chicos = m.chicos.length - es.chicos.length;
      ok(chicos <= 0, `${toma} · ${lang}: no hay más botones bajo 44 px que en español${chicos > 0 ? ': ' + m.chicos.join(', ') : ''}`);
      const fuera = m.fuera.length - es.fuera.length;
      ok(fuera <= 0, `${toma} · ${lang}: ningún botón más se sale por abajo${fuera > 0 ? ': ' + m.fuera.join(', ') : ''}`);
    }
  }
  console.log(fallas ? `\n✗ ${juego}: ${fallas} chequeo(s) en rojo · capturas en ${OUT}` : `\n${juego}: todo bien en ${LANGS.join(', ')} · capturas en ${OUT}`);
  b.close();
  if (fallas) process.exitCode = 1;
  return fallas;
}
