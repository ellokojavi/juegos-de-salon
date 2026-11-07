// La tarjeta de Agentes (D-286): fotografía card.html con Chrome a 1200×630 y deja el JPG en
// output/. Since D-421 the site no longer serves it: /agents/ has the game card og.mjs draws.
//   node marketing/agents-card/build.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../tools/e2e/cdp.mjs';
const AQUI = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'tarjeta-agentes-'));
const b = await launch({ dir: `${tmp}/p`, out: tmp, width: 600, height: 315 });
await b.go(`file://${join(AQUI, 'card.html')}`, 2500);
await b.shot('tarjeta');
b.close();
const jpg = join(AQUI, 'output', 'agents-1200x630.jpg');
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', `${tmp}/tarjeta.png`, '--out', jpg]);
console.log(`✓ ${jpg}`);
