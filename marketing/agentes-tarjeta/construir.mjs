// La tarjeta de Agentes (D-286): fotografía tarjeta.html con Chrome a 1200×630 y deja el JPG en
// output/ y como vista previa del link en public/labs/agents/tarjeta.jpg.
//   node marketing/agentes-tarjeta/construir.mjs
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../../tools/e2e/cdp.mjs';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..');
const tmp = mkdtempSync(join(tmpdir(), 'tarjeta-agentes-'));
const b = await launch({ dir: `${tmp}/p`, out: tmp, width: 600, height: 315 });
await b.go(`file://${join(AQUI, 'tarjeta.html')}`, 2500);
await b.shot('tarjeta');
b.close();
const jpg = join(AQUI, 'output', 'agentes-1200x630.jpg');
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', `${tmp}/tarjeta.png`, '--out', jpg]);
copyFileSync(jpg, join(RAIZ, 'public', 'labs', 'agents', 'tarjeta.jpg'));
console.log(`✓ ${jpg} y public/labs/agents/tarjeta.jpg`);
