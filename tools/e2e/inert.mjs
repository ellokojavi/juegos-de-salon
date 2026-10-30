// A change no browser can notice runs no end-to-end script (D-515): a file whose diff only
// adds, removes or rewords comments (or blank lines) is dropped from the files a push tests. A note
// in index.html or a doc comment in a shared module used to run the scripts of every page that loads it.
//
// It reads the unified patch GitHub gives for each file. Conservative on purpose: a line counts as
// a comment only if it starts with `//`, `/*`, `*` or `*/` in JavaScript and CSS, or is a whole
// `<!-- … -->` in HTML; anything else, a missing patch (binary, too big) or a renamed file, is a real change.

const CODE = /\.(m?js|css|html)$/;
const COMMENT = [/^\s*$/, /^\s*\/\//, /^\s*\/\*/, /^\s*\*/];
const HTML_COMMENT = /^\s*<!--.*-->\s*$/;

/** Whether this file's patch changes only comments and blank lines. Pure, for node. */
export function inert(filename, patch) {
  if (!CODE.test(filename) || typeof patch !== 'string' || !patch) return false;
  const changed = patch.split('\n').filter(l => /^[+-]/.test(l)).map(l => l.slice(1));
  if (!changed.length) return false;
  return changed.every(l => COMMENT.some(r => r.test(l)) || (filename.endsWith('.html') && HTML_COMMENT.test(l)));
}

/** The files to test from GitHub's `[{ filename, patch, status }]`: those whose change a browser can notice. */
export function noticeable(files) {
  return files.filter(f => f.status !== 'modified' || !inert(f.filename, f.patch)).map(f => f.filename);
}
