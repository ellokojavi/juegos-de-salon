// ¡Al toque!'s languages (C-3): every t('…') in game.js has its English and Portuguese, with the same {x}.
// node public/labs/microgames/rules.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TR, KEYS } from './rules.js';

const src = readFileSync(new URL('./game.js', import.meta.url), 'utf8');
const used = [...new Set([...src.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'")))];
const holes = s => (s.match(/\{\w+\}/g) || []).sort().join();
for (const k of used) for (const l of ['en', 'pt']) {
  assert.ok(TR[l][k], `${l} is missing «${k}»`);
  assert.equal(holes(TR[l][k]), holes(k), `${l} «${k}» keeps its {x}`);
}
assert.equal(new Set(KEYS).size, KEYS.length, 'no key twice');
// R-10: ¡Rebota!, ¡Equilibra! and ¡Sigue! froze at their end because their frame loop's `t` (the time)
// hid t(): the message threw and the game waited for its timer. No callback whose parameter is `t` may call t('…')
for (const m of src.matchAll(/\(\s*t\s*(?:,[^)]*)?\)\s*=>\s*\{/g)) {
  let i = m.index + m[0].length - 1, depth = 0, j = i;
  for (; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}' && --depth === 0) break; }
  assert.ok(!/\bt\('/.test(src.slice(i, j)), `a callback with a \`t\` parameter calls t('…') at line ${src.slice(0, m.index).split('\n').length}: rename the parameter`);
}
// U-12: the ✓/✗ at the end of a game lives in the HUD strip (top 40px), never over the play area
{
  const rule = readFileSync(new URL('./style.css', import.meta.url), 'utf8').match(/\.verdict-tag \{([^}]*)\}/)[1];
  const px = k => Number(rule.match(new RegExp(`(?:^|[\\s;])${k}:\\s*(\\d+)px`))[1]);
  const bottom = px('top') + px('height') + 3;   // + its 3px drop shadow
  assert.ok(bottom <= 40, `the verdict tag reaches ${bottom}px, into the play area (it starts at 40px)`);
}
console.log(`✓ microgames: ${used.length} texts in es, en and pt`);
