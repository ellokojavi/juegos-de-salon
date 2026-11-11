// The ✓/✗ at the end of a game lives in the HUD strip (top 40px), never over the play area.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const rule = css.match(/\.verdict-tag \{([^}]*)\}/)[1];
const px = k => Number(rule.match(new RegExp(`(?:^|[\\s;])${k}:\\s*(\\d+)px`))[1]);
const bottom = px('top') + px('height') + 3;   // + the 3px drop shadow
assert.ok(bottom <= 40, `verdict tag reaches ${bottom}px, into the play area (starts at 40px)`);
console.log('verdict ok', bottom);
