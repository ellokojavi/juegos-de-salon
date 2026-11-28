/**
 * Drift's circuits are what their generator writes (docs/rally/core.md, section 4): nobody edits
 * circuits.js by hand, and a change to the generator comes with the pool it makes.
 *   node tools/generators/drift-tracks.test.mjs
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const gen = fileURLToPath(new URL('./drift-tracks.mjs', import.meta.url));
console.log(execFileSync(process.execPath, [gen, '--check'], { encoding: 'utf8' }).trim());
