// The six screens of the Reddit image, real and in Spanish: each one opens the served site in
// Chrome, walks the same steps as tools/e2e/paths.mjs (or its own, below) and leaves a 390×844
// PNG in img/. With ?test the home page opens without the promotional splash.
//   SITE=http://localhost:8765 node marketing/reddit-chile/capture.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, sleep } from '../../tools/e2e/cdp.mjs';
import { PATHS } from '../../tools/e2e/paths.mjs';
import { gameById } from '../../public/assets/js/games.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE || 'http://localhost:8765';
const route = id => gameById(id)?.path || `${id}/`;
const SHOTS = [
  { name: 'home', url: '?test', steps: [] },
  { name: 'liars-dice', url: route('dudo'), steps: PATHS.dudo.reveal },
  { name: 'generala', url: route('generala'), steps: PATHS.generala.game },
  { name: 'cup', url: 'cup/?test&demo=podium', steps: [`1`, `1`] },
  { name: 'queens', url: route('reinas'), steps: PATHS.reinas.game },
  { name: 'routes', url: route('rutas'), steps: PATHS.rutas.stage },
];
const only = process.argv.slice(2);
const b = await launch({ dir: '/tmp/reddit-chile/profile', out: join(HERE, 'img'), width: 390, height: 844 });
for (const s of SHOTS.filter(s => !only.length || only.includes(s.name))) {
  await b.go(`${SITE}/`, 800);
  await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:lang', 'es'); 1`);
  await b.go(`${SITE}/${s.url}`, 1500);
  for (const step of s.steps) { await b.evaluate(`(()=>{ ${step} ; return 1})()`); await sleep(700); }
  await sleep(600);
  await b.shot(s.name);
  console.log(`✓ img/${s.name}.png`);
}
b.close();
