// Tren en Vilo (lab): every stage's light, morning to night, has a train color that stands out (owner's request)
import assert from 'node:assert/strict';
import { balasPara, contraste, CONTRASTE_MIN } from './neon.js';

for (let etapa = 0; etapa < 5; etapa++) {
  const t = etapa / 4, bien = balasPara(t);
  assert.ok(bien.length, `stage ${etapa + 1}: no train color`);
  for (const b of bien) assert.ok(contraste(b, t) >= CONTRASTE_MIN, `stage ${etapa + 1}: ${b.nombre} reads poorly (${contraste(b, t).toFixed(2)})`);
}
console.log('✓ every stage has a train color that stands out');
