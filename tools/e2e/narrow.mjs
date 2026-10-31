// What a change to a module reaches, by name (D-516): a push that edits one function of a shared
// module, or one text of i18n.js's COMMON, used to run the scripts of every page that loads the file.
// Here the file's patch says which top-level declarations changed (and, in a texts object keyed by
// language, which keys), so affected.mjs keeps only the pages whose other files name one of them.
//
// Conservative on purpose: anything it cannot place (a top-level statement, an import, a change to an
// object's shape, a scan that does not balance, a patch that does not fit the file) keeps the whole file.
// `public/<f>#uses=a,b` is how a narrowed file travels in the list of changes.

const ID = /^[A-Za-z_$][\w$]*$/;
const DECL = /^(?:export\s+)?(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/;
const LANGS = new Set(['es', 'en', 'pt', 'de']);
const BLANK = /^\s*(?:$|\/\/|\/\*|\*)/;

/**
 * Scans JavaScript and gives, for each line (0-based): the brace depth at its start and the object
 * keys written at depth 2 on it. Strings, templates and comments are skipped. null if it does not
 * balance (a regex literal with a brace, say): then nothing is narrowed.
 */
export function scan(text) {
  const lines = text.split('\n');
  const out = [];
  let depth = 0, mode = null, tpl = []; // mode: ' " ` or 'block'
  for (const line of lines) {
    const row = { depth, keys: [] };
    let i = 0;
    while (i < line.length) {
      const c = line[i], n = line[i + 1];
      if (mode === 'block') { if (c === '*' && n === '/') { mode = null; i += 2; } else i++; continue; }
      if (mode === "'" || mode === '"') { if (c === '\\') i += 2; else { if (c === mode) mode = null; i++; } continue; }
      if (mode === '`') {
        if (c === '\\') i += 2;
        else if (c === '`') { mode = null; i++; }
        else if (c === '$' && n === '{') { tpl.push(depth); depth++; mode = null; i += 2; }
        else i++;
        continue;
      }
      if (c === '/' && n === '/') break;
      if (c === '/' && n === '*') { mode = 'block'; i += 2; continue; }
      // A regex literal where a value is expected (`= /x{2}/`, `(/'/g`, `return /…/`): skip it whole
      if (c === '/') {
        const prev = line.slice(0, i).trimEnd();
        if (!prev || /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|of|in)$/.test(prev)) {
          let j = i + 1, cls = false;
          while (j < line.length) {
            const d = line[j];
            if (d === '\\') { j += 2; continue; }
            if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break;
            j++;
          }
          if (j < line.length) { i = j + 1; continue; }
        }
      }
      if (c === "'" || c === '"' || c === '`') {
        // A quoted key at depth 2 ('or': …)
        if (depth === 2 && c !== '`') { const m = line.slice(i).match(/^(['"])([A-Za-z_$][\w$]*)\1\s*:/); if (m) row.keys.push(m[2]); }
        mode = c; i++; continue;
      }
      if (c === '{' || c === '(' || c === '[') { depth++; i++; continue; }
      if (c === '}' || c === ')' || c === ']') {
        depth--; i++;
        if (c === '}' && tpl.length && tpl[tpl.length - 1] === depth) { tpl.pop(); mode = '`'; }
        if (depth < 0) return null;
        continue;
      }
      if (depth === 2 && /[A-Za-z_$]/.test(c) && !/[\w$.]/.test(line[i - 1] || '')) {
        const m = line.slice(i).match(/^([A-Za-z_$][\w$]*)\s*:(?!:)/);
        if (m) { row.keys.push(m[1]); i += m[0].length; continue; }
      }
      i++;
    }
    if (mode === "'" || mode === '"') mode = null; // an unterminated quote ends with its line
    out.push(row);
  }
  return depth === 0 && !mode && !tpl.length ? out : null;
}

/**
 * Who owns each line: { decl, key } where `decl` is the top-level declaration it belongs to (null:
 * top-level code, an import, an export list) and `key` its key when the declaration is a texts
 * object keyed by language (`COMMON = { es: { appSub: … } }`). `shape` marks lines that change the
 * object's shape (its language keys, its braces), which reach every key.
 */
export function owners(text) {
  const rows = scan(text);
  if (!rows) return null;
  const lines = text.split('\n');
  const own = [];
  let decl = null, keyed = false, key = null;
  lines.forEach((line, i) => {
    const { depth, keys } = rows[i];
    if (depth === 0) {
      const m = line.match(DECL);
      if (m) {
        decl = m[1];
        // Keyed by language: its first key at depth 1 is a language (`es: {` on a following line)
        keyed = false; key = null;
        for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
          const k = lines[j].match(/^\s*([a-z]{2})\s*:\s*\{/);
          if (k) { keyed = LANGS.has(k[1]); break; }
          if (lines[j].trim()) break;
        }
      } else if (BLANK.test(line)) { own.push({ decl: null, blank: true }); return; }
      else if (!/^[\s.)}\]?:+\-*|&,]/.test(line)) decl = null; // top-level code: owned by nobody
    }
    if (!decl) { own.push({ decl: null }); return; }
    if (!keyed) { own.push({ decl }); return; }
    if (depth <= 1) { own.push({ decl, shape: true, keys }); key = null; return; }
    if (depth === 2) {
      if (keys.length) key = keys[keys.length - 1];
      own.push({ decl, keys: keys.length ? keys : key ? [key] : [], shape: !keys.length && !key });
      return;
    }
    own.push({ decl, keys: key ? [key] : [], shape: !key });
  });
  return own;
}

/** The hunks of a unified patch: { oldStart, newStart, lines: [' x', '-y', '+z'] }. */
export function hunks(patch) {
  const out = [];
  for (const l of patch.split('\n')) {
    const h = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { out.push({ oldStart: +h[1], newStart: +h[2], lines: [] }); continue; }
    if (out.length && /^[ +\-]/.test(l)) out[out.length - 1].lines.push(l);
    else if (out.length && l === '') out[out.length - 1].lines.push(' ');
  }
  return out;
}

/**
 * The file before the patch, from the file after it; null if the patch does not fit (its context
 * and added lines must be where it says).
 */
export function before(after, patch) {
  const now = after.split('\n');
  const was = [];
  let at = 0; // next line of `now` not copied yet (0-based)
  for (const h of hunks(patch)) {
    const start = h.newStart - 1 + (h.lines.every(l => l[0] === '-') ? 1 : 0);
    if (start < at) return null;
    was.push(...now.slice(at, start));
    let j = start;
    for (const l of h.lines) {
      const body = l.slice(1);
      if (l[0] === '-') { was.push(body); continue; }
      if (now[j] !== body && !(l[0] === ' ' && body === '' && now[j] === '')) return null;
      if (l[0] === ' ') was.push(body);
      j++;
    }
    at = j;
  }
  was.push(...now.slice(at));
  return was.join('\n');
}

/** The lines a patch touches: old line numbers removed, new line numbers added (0-based). */
function touched(patch) {
  const removed = [], added = [];
  for (const h of hunks(patch)) {
    let o = h.oldStart - 1, n = h.newStart - 1;
    for (const l of h.lines) {
      if (l[0] === '-') removed.push(o++);
      else if (l[0] === '+') added.push(n++);
      else { o++; n++; }
    }
  }
  return { removed, added };
}

/** Words a declaration names, comments and strings aside (for what uses what inside the file). */
const words = s => new Set((s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').match(/[A-Za-z_$][\w$]*/g)) || []);

/**
 * The names a change reaches, or null for the whole file.
 *   after: the file now; patch: GitHub's unified patch for it.
 * Names are the changed top-level declarations (plus the ones in the same file that use them), or,
 * in a texts object keyed by language, its changed keys.
 */
export function changedNames(filename, after, patch) {
  if (!/\.m?js$/.test(filename) || typeof patch !== 'string' || !patch || typeof after !== 'string') return null;
  const old = before(after, patch);
  if (old == null) return null;
  const ownNew = owners(after), ownOld = owners(old);
  if (!ownNew || !ownOld) return null;
  const { removed, added } = touched(patch);
  const decls = new Set(), keys = new Set();
  const take = o => {
    if (!o || o.blank) return true;
    if (!o.decl) return false;
    if (o.keys && !o.shape) { o.keys.forEach(k => keys.add(k)); return true; }
    if (o.shape) return false; // a language added, a brace moved: every key
    decls.add(o.decl);
    return true;
  };
  for (const i of removed) {
    const o = ownOld[i];
    if (BLANK.test(old.split('\n')[i] || '') && !(o && o.keys && o.keys.length)) continue;
    if (!take(o)) return null;
  }
  for (const i of added) {
    const o = ownNew[i];
    if (BLANK.test(after.split('\n')[i] || '') && !(o && o.keys && o.keys.length)) continue;
    if (!take(o)) return null;
  }
  if (!decls.size && !keys.size) return null;
  // Inside the file: a changed helper reaches the declarations that use it, until nothing new
  const lines = after.split('\n');
  const body = {};
  ownNew.forEach((o, i) => { if (o.decl) (body[o.decl] ||= []).push(lines[i]); });
  const uses = Object.fromEntries(Object.entries(body).map(([d, b]) => [d, words(b.join('\n'))]));
  // A function of the same file that reads a changed key (`COMMON[lang].appTitle` in a helper) changed too
  const keyedDecls = new Set(ownNew.filter(o => o.keys).map(o => o.decl));
  for (const [d, w] of Object.entries(uses)) if (!keyedDecls.has(d) && [...keys].some(k => w.has(k))) decls.add(d);
  let grew = true;
  while (grew) {
    grew = false;
    // A texts object only holds data: its keys never call a changed function
    for (const [d, w] of Object.entries(uses)) if (!decls.has(d) && !keyedDecls.has(d) && [...decls].some(x => w.has(x))) { decls.add(d); grew = true; }
  }
  // A text written as a function that calls a changed helper: which keys, we can't tell; the whole file
  const calls = (d, x) => new RegExp(`(^|[^\\w$.])${x.replace(/\$/g, '\\$')}\\s*\\(`).test((body[d] || []).join('\n'));
  if ([...keyedDecls].some(d => [...decls].some(x => x !== d && calls(d, x)))) return null;
  // Top-level code that runs a changed declaration when the file loads: every page that loads it
  const top = lines.filter((l, i) => !ownNew[i].decl && !ownNew[i].blank).join('\n');
  const topWords = words(top);
  if ([...decls].some(d => topWords.has(d))) return null;
  // A whole texts object changed outside its keys is that object by name (every key)
  return [...new Set([...decls, ...keys])].filter(n => ID.test(n)).sort();
}

/** `public/f.js#uses=a,b`, or the file as it was when it cannot be narrowed. */
export function narrowed(filename, after, patch) {
  if (!filename.startsWith('public/')) return filename;
  const names = changedNames(filename, after, patch);
  return names && names.length ? `${filename}#uses=${names.join(',')}` : filename;
}

/** `public/f.js#uses=a,b` → { file: 'public/f.js', uses: ['a', 'b'] }; uses is null for a whole file. */
export function parseChange(change) {
  const m = change.match(/^(.*)#uses=([\w$,]+)$/);
  return m ? { file: m[1], uses: m[2].split(',').filter(Boolean) } : { file: change, uses: null };
}

/**
 * How a file uses `names` (D-516): `top` when its top-level code names one (it runs on load, or the
 * file can't be read), and `decls`, its declarations that name one, plus those that use them. A file
 * that only uses them inside its functions reaches a page only through whoever calls those functions.
 */
export function reach(text, names) {
  const want = new Set(names);
  const own = owners(text);
  const lines = text.split('\n');
  if (!own) return { top: true, decls: [] };
  const body = {};
  const top = [];
  own.forEach((o, i) => { if (o.decl) (body[o.decl] ||= []).push(lines[i]); else if (!o.blank) top.push(lines[i]); });
  const used = Object.fromEntries(Object.entries(body).map(([d, b]) => [d, words(b.join('\n'))]));
  const decls = new Set(Object.keys(used).filter(d => [...want].some(n => used[d].has(n))));
  let grew = true;
  while (grew) {
    grew = false;
    for (const [d, w] of Object.entries(used)) if (!decls.has(d) && [...decls].some(x => w.has(x))) { decls.add(d); grew = true; }
  }
  const topWords = words(top.join('\n'));
  return { top: [...want, ...decls].some(n => topWords.has(n)), decls: [...decls].sort() };
}
