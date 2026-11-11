// Whether a PR's preview already serves a given commit (D-429, the owner's rule 2026-11-11): a preview link
// is handed to anyone, the owner included, only once this says it is live. Every page of a preview carries
// `<meta name="release" content="X.Y.Z-<sha7>">` (set-version.py), so it waits until the folder's front
// page shows the commit, as publish.yml does for the real site.
//
//   node tools/agents/preview-ready.mjs [<branch>] [<sha>] [--wait <minutes>]
//
// Without arguments: the current branch and its HEAD. Prints `ready <url>` and exits 0, or
// `not ready: <url> still shows <key>` and exits 1 when the wait (default 10 minutes) runs out.
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const wi = args.indexOf('--wait');
const minutes = wi >= 0 ? Number(args.splice(wi, 2)[1]) : 10;
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const branch = args[0] || git('rev-parse', '--abbrev-ref', 'HEAD');
const sha = (args[1] || git('rev-parse', 'HEAD')).slice(0, 7);
const owner = (process.env.GITHUB_REPOSITORY_OWNER || 'ellokojavi').toLowerCase();
export const folderOf = b => b.toLowerCase().replace(/[^a-z0-9-]/g, '-');
const url = `https://${owner}.github.io/juegos-de-salon-previews/${folderOf(branch)}/`;

const keyNow = async () => {
  try {
    const html = await (await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })).text();
    return html.match(/<meta name="release" content="([^"]+)">/)?.[1] ?? 'nothing yet';
  } catch (e) { return `an error (${e.message})`; }
};

const until = Date.now() + minutes * 60_000;
let key = await keyNow();
while (!key.endsWith(`-${sha}`) && Date.now() < until) {
  await new Promise(r => setTimeout(r, 15_000));
  key = await keyNow();
}
if (key.endsWith(`-${sha}`)) { console.log(`ready ${url}`); process.exit(0); }
console.log(`not ready: ${url} still shows ${key}, not ${sha}`);
process.exit(1);
