/**
 * The output folder of an end-to-end script (screenshots and the Chrome profile), D-315.
 *
 * Each script used to do `const OUT = process.argv[2]`: run without a folder it left `undefined/`,
 * and run with a flag first (`tournament.mjs --part cup`) it left `--part/`, both inside the
 * worktree, with a Chrome profile of tens of MB that left the worktree "with changes" and blocked
 * its cleanup (`clean-worktrees.mjs`). Now the output is the first argument only if it is a real
 * folder; otherwise the script's default, or a new one in the temp directory.
 *
 *   const OUT = output();              // argv[2], or /tmp/<script>-XXXX
 *   const OUT = output('/tmp/cup');    // argv[2], or /tmp/cup
 *
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename } from 'node:path';

/** Does it work as an output folder? Not empty, not a flag, not `undefined`/`null` turned into text. */
export const isFolder = a => typeof a === 'string' && a.trim() !== '' && !a.startsWith('-') && !/(^|\/)(undefined|null)(\/|$)/.test(a);

export function output(fallback = null, argv = process.argv) {
  if (isFolder(argv[2])) return argv[2];
  if (fallback) return fallback;
  return mkdtempSync(`${tmpdir()}/${basename(argv[1] || 'e2e', '.mjs')}-`);
}
