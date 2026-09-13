// Ejecutar: node assets/js/i18n.test.mjs
// Paridad de idiomas (C-3, D-48): es, en y pt tienen las mismas claves, listas del mismo largo,
// las mismas {llaves} en las plantillas y ningún texto vacío. Un texto que falta en un idioma
// se ve como "undefined" en pantalla, así que esto se revisa antes de publicar.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGS, COMMON } from './i18n.js';
import { GAMES } from './games.js';
import { FRASES } from './frases.js';
import { DECKS } from '../../linea-de-tiempo/decks/index.js';
import { DECKS as AHORCADO } from '../../ahorcado/decks/index.js';

const BASE = 'es';
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? flat(v, p + k + '.') : [[p + k, v]]);
const holes = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');

/** Un valor por idioma ({ es: 'x', en: 'y', pt: 'z' }) se compara como si fuera un diccionario de una clave. */
const leaf = (name, obj) => same(name, Object.fromEntries(LANGS.map(l => [l, { v: obj[l] }])));

/** Compara un diccionario por idioma contra el base, clave por clave. */
function same(name, dict) {
  const base = Object.fromEntries(flat(dict[BASE]));
  for (const lang of LANGS) {
    assert.ok(dict[lang], `${name}: falta el idioma ${lang}`);
    const other = Object.fromEntries(flat(dict[lang]));
    for (const k of Object.keys(base)) {
      assert.ok(k in other, `${name}.${lang}: falta la clave ${k}`);
      if (Array.isArray(base[k])) assert.equal(other[k].length, base[k].length, `${name}.${lang}.${k}: la lista tiene otro largo`);
      if (typeof base[k] === 'string') {
        assert.ok(other[k].trim(), `${name}.${lang}.${k}: texto vacío`);
        assert.equal(holes(other[k]), holes(base[k]), `${name}.${lang}.${k}: las {llaves} no coinciden`);
      }
    }
    for (const k of Object.keys(other)) assert.ok(k in base, `${name}.${lang}: la clave ${k} sobra (no está en ${BASE})`);
  }
}

assert.deepEqual(LANGS, ['es', 'en', 'pt']);
same('COMMON', COMMON);
same('FRASES', FRASES);
for (const lang of LANGS) assert.equal(FRASES[lang].length, 100, `FRASES.${lang}: deben ser 100 frases`);
for (const lang of LANGS) assert.equal(new Set(FRASES[lang]).size, 100, `FRASES.${lang}: hay frases repetidas`);
for (const g of GAMES) { leaf(`GAMES.${g.id}.name`, g.name); leaf(`GAMES.${g.id}.tagline`, g.tagline); }
for (const d of DECKS) {
  leaf(`DECKS.${d.id}.name`, d.name); leaf(`DECKS.${d.id}.hint`, d.hint);
  for (const c of d.cards) for (const lang of LANGS) assert.ok(c[lang] && c[lang].trim(), `${d.id}/${c.id}: falta ${lang}`);
}
for (const d of AHORCADO) {
  leaf(`AHORCADO.${d.id}.name`, d.name); leaf(`AHORCADO.${d.id}.hint`, d.hint);
  for (const c of d.cards) for (const lang of LANGS) {
    assert.ok(c[lang]?.w?.trim(), `ahorcado/${d.id}/${c.id}: falta la palabra en ${lang}`);
    assert.ok(c[lang]?.hint?.trim(), `ahorcado/${d.id}/${c.id}: falta la pista en ${lang}`);
  }
}
for (const g of GAMES) {
  const { LOCALES } = await import(`../../${g.path}rules.js`);
  same(`LOCALES de ${g.id}`, LOCALES);
}

/**
 * Una clave escrita dos veces en el mismo objeto no da error: la segunda pisa a la primera, en
 * silencio, y comparar idiomas no lo ve porque los tres quedan igual de pisados. Se lee el texto
 * del archivo llevando la cuenta de las llaves, para mirar solo las claves del propio idioma y no
 * las de los objetos que tenga adentro.
 */
function clavesDirectas(src, lang) {
  // Cada idioma es una constante suelta (const ES = { … }), no una clave de LOCALES
  const desde = src.search(new RegExp(`^const ${lang.toUpperCase()}\\s*=\\s*\\{`, 'm'));
  if (desde < 0) return [];
  const abre = src.indexOf('{', desde);
  if (abre < 0) return [];
  const claves = [];
  let hondo = 0, i = abre, comilla = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (comilla) { if (c === '\\') i++; else if (c === comilla) comilla = null; continue; }
    if (c === "'" || c === '"' || c === '`') { comilla = c; continue; }
    if (c === '{' || c === '[') { hondo++; continue; }
    if (c === '}' || c === ']') { hondo--; if (!hondo) break; continue; }
    if (hondo !== 1) continue;
    const m = /^([a-zA-Z_$][\w$]*)\s*:/.exec(src.slice(i));
    if (m && !/[\w$]/.test(src[i - 1] || '')) { claves.push(m[1]); i += m[0].length - 1; }
  }
  return claves;
}

for (const g of GAMES) {
  const src = await readFile(new URL(`../../${g.path}rules.js`, import.meta.url), 'utf8');
  for (const lang of LANGS) {
    const claves = clavesDirectas(src, lang);
    assert.ok(claves.length > 5, `rules.js de ${g.id}: no se pudieron leer las claves de ${lang}`);
    const vistas = new Set(), repes = new Set();
    for (const k of claves) { if (vistas.has(k)) repes.add(k); vistas.add(k); }
    assert.deepEqual([...repes], [], `rules.js de ${g.id}, ${lang}: claves repetidas (la segunda pisa a la primera)`);
  }
}

console.log('i18n: los tres idiomas tienen las mismas claves en menú, frases, mazos y los cinco juegos');
