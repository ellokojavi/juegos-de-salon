#!/usr/bin/env node
// Publishes a marketing video's files as a GitHub release instead of committing them (D-494,
// docs/REPO-WEIGHT.md): git ignores marketing/**/*.mp4 and repo-weight.test.mjs rejects any video
// a branch adds there. The release is the archive; YouTube and the social networks keep the public copy.
//   node tools/release/video-release.mjs <folder> <version> <file>...
//   node tools/release/video-release.mjs promo-video 9 marketing/promo-video/output/*.mp4
// It prints the download URLs to write in marketing/registro.json and the asset's README.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';

const [folder, version, ...files] = process.argv.slice(2);
if (!folder || !/^\d+$/.test(version || '') || !files.length) {
  console.error('usage: node tools/release/video-release.mjs <folder> <version> <file>...');
  process.exit(1);
}
for (const f of files) if (!existsSync(f)) { console.error(`✗ ${f} does not exist`); process.exit(1); }

const tag = `${folder}-v${version}`;
const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
execFileSync('gh', ['release', 'create', tag, ...files, '--title', `${folder} v${version}`,
  '--notes', `Marketing video ${folder}, version ${version}. Kept out of git (docs/REPO-WEIGHT.md, D-494).`,
  '--latest=false'], { stdio: 'inherit' });
for (const f of files) console.log(`https://github.com/${repo}/releases/download/${tag}/${basename(f)}`);
