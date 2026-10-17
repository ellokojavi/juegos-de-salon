// The inbox's frequency rule (D-345) and the `tipo` the Firebase rules accept
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tocaBuzon, buzonEnviado, PRIMERAS, DESCANSO_DIAS } from './buzon.js';
import { TIPOS } from './buzon-form.js';

const almacen = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const DIA = 24 * 60 * 60 * 1000;
const t0 = new Date(2026, 9, 16, 12).getTime();

// Not during the first 2 games a new device plays; the 3rd shows it
{
  const a = almacen();
  assert.equal(PRIMERAS, 2);
  assert.equal(tocaBuzon(a, t0), false, '1st game: no');
  assert.equal(tocaBuzon(a, t0 + 1000), false, '2nd game: no');
  assert.equal(tocaBuzon(a, t0 + 2000), true, '3rd game: yes');
  // At most once per day
  assert.equal(tocaBuzon(a, t0 + 3000), false, 'again the same day: no');
  assert.equal(tocaBuzon(a, t0 + DIA), true, 'the next day: yes');
}

// After sending, it rests 14 days
{
  const a = almacen();
  for (let i = 0; i < 3; i++) tocaBuzon(a, t0 + i);
  buzonEnviado(a, t0);
  assert.equal(DESCANSO_DIAS, 14);
  assert.equal(tocaBuzon(a, t0 + DIA), false, 'one day after sending: no');
  assert.equal(tocaBuzon(a, t0 + 13 * DIA), false, '13 days after: no');
  assert.equal(tocaBuzon(a, t0 + 14 * DIA + 1), true, '14 days after: yes');
}

// Without storage it never throws and never shows (it can't count the first games)
{
  const roto = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(tocaBuzon(roto, t0), false);
}

// The rules accept exactly the kinds the form offers, and a report without `tipo` stays valid
{
  const reglas = JSON.parse(readFileSync(new URL('../../../firebase/database.rules.json', import.meta.url), 'utf8'));
  const fb = reglas.rules.feedback.$id;
  const re = new RegExp(/matches\(\/(.+)\/\)/.exec(fb.tipo['.validate'])[1]);
  for (const k of TIPOS) assert.ok(re.test(k), `the rules accept ${k}`);
  for (const k of ['', 'Idea', 'otro ', 'spam', 'idea|x']) assert.ok(!re.test(k), `the rules refuse ${JSON.stringify(k)}`);
  assert.doesNotMatch(fb['.validate'], /tipo/, '`tipo` is optional: a report without it is still valid');
}
console.log('buzon: ok');
