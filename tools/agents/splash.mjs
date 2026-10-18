/**
 * The splash's switch (D-351). The campaigns live in public/assets/js/splash.js (CAMPAIGNS); this
 * turns one on or off by rewriting its `export const ACTIVE = …;` line. The change goes out like any
 * other: a PR with auto-merge, and it reaches players when the site is published.
 *
 *   node tools/agents/splash.mjs list                          the campaigns, and which one is on
 *   node tools/agents/splash.mjs on <id> [--until YYYY-MM-DD]  turns one on (until that day, inclusive)
 *   node tools/agents/splash.mjs off                           turns it off
 *
 * A campaign is seen once per phone: turning on a different id shows it again to everyone.
 * Preview any of them without turning it on: https://juegosdesalon.cl/?splash=<id>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'js', 'splash.js');
const LINE = /^export const ACTIVE = .*;$/m;

/** The ACTIVE line for a campaign, or for none. Pure: tested without disk. */
export function activeLine(id, until) {
  if (!id) return 'export const ACTIVE = null;';
  if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error(`--until must be YYYY-MM-DD, not ${until}`);
  return `export const ACTIVE = { id: '${id}'${until ? `, until: '${until}'` : ''} };`;
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
  if (cmd === 'list' || !cmd) {
    for (const [k, c] of Object.entries(CAMPAIGNS)) {
      console.log(`${ACTIVE?.id === k ? '●' : '○'} ${k}  ${c.emoji ?? ''} ${c.title?.es ?? ''}${ACTIVE?.id === k && ACTIVE.until ? `  (until ${ACTIVE.until})` : ''}`);
    }
    console.log(ACTIVE ? `\nOn: ${ACTIVE.id}` : '\nOff.');
  } else if (cmd === 'on') {
    if (!CAMPAIGNS[id]) { console.error(`✗ No campaign "${id}". Ids: ${Object.keys(CAMPAIGNS).join(', ')}`); process.exit(1); }
    writeFileSync(FILE, rewrite(readFileSync(FILE, 'utf8'), activeLine(id, until)));
    console.log(`On: ${id}${until ? ` until ${until}` : ''}. It reaches players when this change is merged and published.`);
  } else if (cmd === 'off') {
    writeFileSync(FILE, rewrite(readFileSync(FILE, 'utf8'), activeLine(null)));
    console.log('Off. It disappears when this change is merged and published.');
  } else {
    console.error('Usage: splash.mjs list | on <id> [--until YYYY-MM-DD] | off');
    process.exit(1);
  }
}
