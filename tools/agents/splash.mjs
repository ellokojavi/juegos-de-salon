/**
 * The splash's switch (D-351). The campaigns live in public/assets/js/splash.js (CAMPAIGNS); this
 * turns them on or off by rewriting its `export const ACTIVE = […];` line. The change goes out like
 * any other: a PR with auto-merge, and it reaches players when the site is published.
 *
 *   node tools/agents/splash.mjs list                          the campaigns, and which are on
 *   node tools/agents/splash.mjs on <id> [--until YYYY-MM-DD]  turns one on (until that day, inclusive)
 *   node tools/agents/splash.mjs off [<id>]                    turns that one off, or all of them
 *
 * Several can be on: ACTIVE is a queue in the order they were turned on, and a player with more than
 * one to see gets them in that order, one per visit (D-430, D-431). A campaign is seen once per
 * phone. Since D-454 the panel's 📣 Campaigns (Firebase `splash/`) is the switch once it has saved
 * once; ACTIVE is then only the fallback when the database cannot be read. Preview any of them without turning it on: https://juegosdesalon.cl/?splash=<id>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'js', 'splash.js');
const LINE = /^export const ACTIVE = .*;$/m;

/** The ACTIVE line for a queue of campaigns ({ id, until }), in order. Pure: tested without disk. */
export function activeLine(queue) {
  for (const { until } of queue) if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error(`--until must be YYYY-MM-DD, not ${until}`);
  return `export const ACTIVE = [${queue.map(({ id, until }) => `{ id: '${id}'${until ? `, until: '${until}'` : ''} }`).join(', ')}];`;
}

/** The queue with `id` turned on: at the end, or where it already was with its new date. */
export function turnOn(queue, id, until) {
  return queue.some(a => a.id === id) ? queue.map(a => (a.id === id ? { id, until } : a)) : [...queue, { id, until }];
}

export function rewrite(source, line) {
  if (!LINE.test(source)) throw new Error('splash.js does not have the `export const ACTIVE = …;` line');
  return source.replace(LINE, line);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, id] = process.argv.slice(2);
  const i = process.argv.indexOf('--until');
  const until = i > 0 ? process.argv[i + 1] : null;
  const { CAMPAIGNS, ACTIVE } = await import(pathToFileURL(FILE).href);
  const on = k => ACTIVE.find(a => a.id === k);
  if (cmd === 'list' || !cmd) {
    for (const [k, c] of Object.entries(CAMPAIGNS)) {
      console.log(`${on(k) ? '●' : '○'} ${k}  ${c.emoji ?? ''} ${c.title?.es ?? ''}${on(k)?.until ? `  (until ${on(k).until})` : ''}`);
    }
    console.log(ACTIVE.length ? `\nOn, in this order: ${ACTIVE.map(a => a.id).join(', ')}` : '\nOff.');
  } else if (cmd === 'on') {
    if (!CAMPAIGNS[id]) { console.error(`✗ No campaign "${id}". Ids: ${Object.keys(CAMPAIGNS).join(', ')}`); process.exit(1); }
    writeFileSync(FILE, rewrite(readFileSync(FILE, 'utf8'), activeLine(turnOn(ACTIVE, id, until))));
    console.log(`On: ${id}${until ? ` until ${until}` : ''}. It reaches players when this change is merged and published, after the usability agent's full pass of the campaign (D-355).`);
  } else if (cmd === 'off') {
    writeFileSync(FILE, rewrite(readFileSync(FILE, 'utf8'), activeLine(id ? ACTIVE.filter(a => a.id !== id) : [])));
    console.log(`Off: ${id || 'all'}. It disappears when this change is merged and published.`);
  } else {
    console.error('Usage: splash.mjs list | on <id> [--until YYYY-MM-DD] | off [<id>]');
    process.exit(1);
  }
}
