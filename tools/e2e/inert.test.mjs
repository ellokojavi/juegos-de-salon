// A comment-only change runs no end-to-end script; anything else still does (inert.mjs)
import assert from 'node:assert/strict';
import { inert, noticeable } from './inert.mjs';

const p = (...l) => ['@@ -1,3 +1,3 @@', ' const a = 1;', ...l].join('\n');
assert.ok(inert('public/index.html', p('-    // With today\'s day played, Día N', '+    // With today\'s day played, ✅ Día N')), 'a // comment in an inline script');
assert.ok(inert('public/assets/js/x.js', p('- * old doc line', '+ * new doc line', '+')), 'a doc comment and a blank line');
assert.ok(inert('public/a.css', p('+/* note */')), 'a CSS comment');
assert.ok(inert('public/a.html', p('+  <!-- note -->')), 'a whole HTML comment');
assert.ok(!inert('public/a.js', p('-  const t = `${x}`;', '+  const t = `✅ ${x}`;')), 'code is a change');
assert.ok(!inert('public/a.js', p('+  a(); // note')), 'code with a trailing comment is a change');
assert.ok(!inert('public/a.html', p('+  <p>Hola</p>')), 'markup is a change');
assert.ok(!inert('public/a.html', p('+  <!-- opens', '+  <p>x</p>')), 'an HTML comment spanning lines is not trusted');
assert.ok(!inert('public/a.js', undefined), 'no patch (binary, too big) is a change');
assert.ok(!inert('public/a.json', p('+// x')), 'only code files');
assert.deepEqual(noticeable([
  { filename: 'public/a.js', status: 'modified', patch: p('+// x') },
  { filename: 'public/b.js', status: 'added', patch: p('+// x') },
  { filename: 'public/c.js', status: 'modified', patch: p('+go();') },
]), ['public/b.js', 'public/c.js'], 'a new file always counts');
console.log('inert: ok');
