// Ejecutar: node assets/js/i18n.test.mjs
// Paridad de idiomas (C-3, D-48): es, en y pt tienen las mismas claves, listas del mismo largo,
// las mismas {llaves} en las plantillas y ningún texto vacío. Un texto que falta en un idioma
// se ve como "undefined" en pantalla, así que esto se revisa antes de publicar.
import assert from 'node:assert/strict';
import { LANGS, COMMON } from './i18n.js';
import { GAMES } from './games.js';
import { FRASES } from './frases.js';
import { DECKS } from '../../linea-de-tiempo/decks/index.js';

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
for (const g of GAMES) {
  const { LOCALES } = await import(`../../${g.path}rules.js`);
  same(`LOCALES de ${g.id}`, LOCALES);
}
console.log('i18n: los tres idiomas tienen las mismas claves en menú, frases, mazos y los cuatro juegos');
