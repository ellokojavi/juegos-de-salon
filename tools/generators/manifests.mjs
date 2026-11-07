#!/usr/bin/env node
/**
 * Writes public/assets/js/manifests/<folder>.js from each public/<folder>/game.json (#1249 step 7), so
 * the browser imports the manifest as an ES module with no build. `--check` only reports stale ones.
 *
 *   node tools/generators/manifests.mjs [--check]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../../public/assets/js/game-manifest.js';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

/** The folders that have a game.json: 'hangman', and 'labs/julep' for one in the lab. */
export const manifestFolders = (root = PUBLIC) => ['', 'labs/'].flatMap(pre => existsSync(join(root, pre)) ? readdirSync(join(root, pre), { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(root, pre, d.name, 'game.json'))).map(d => pre + d.name) : []).sort();

export const readManifest = folder => JSON.parse(readFileSync(join(PUBLIC, folder, 'game.json'), 'utf8'));

/** The generated module's text for a manifest. */
export const renderModule = m => `// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.\nexport default ${JSON.stringify(m, null, 2)};\n`;

export const generatedPath = folder => join(PUBLIC, 'assets', 'js', 'manifests', `${folder}.js`);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let bad = 0;
  for (const f of manifestFolders()) {
    const m = readManifest(f);
    const problems = validateManifest(m);
    if (problems.length) { bad++; console.error(`${f}/game.json: ${problems.join('; ')}`); continue; }
    const text = renderModule(m);
    const path = generatedPath(f);
    const old = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (old === text) continue;
    if (check) { bad++; console.error(`assets/js/manifests/${f}.js is stale: run node tools/generators/manifests.mjs`); } else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); console.log(`wrote assets/js/manifests/${f}.js`); }
  }
  process.exit(bad ? 1 : 0);
}
