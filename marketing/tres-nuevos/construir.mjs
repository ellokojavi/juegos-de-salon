// The image announcing the three games out of the lab (D-332): photographs tarjeta.html with
// Chrome at 1080×1080 and leaves the JPG in output/.
//   node marketing/tres-nuevos/construir.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../tools/e2e/cdp.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'tres-nuevos-'));
const b = await launch({ dir: `${tmp}/p`, out: tmp, width: 540, height: 540 });
await b.go(`file://${join(HERE, 'tarjeta.html')}`, 2500);
await b.shot('tarjeta');
b.close();
const jpg = join(HERE, 'output', 'tres-nuevos-1080.jpg');
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '90', `${tmp}/tarjeta.png`, '--out', jpg]);
console.log(`✓ ${jpg}`);
