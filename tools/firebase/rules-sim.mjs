/**
 * A small simulator of the Realtime Database rules (firebase/database.rules.json), for tests that
 * check what a branch accepts without the emulator (no npm here). It covers what those tests need:
 * `.write` cascading from the root down to the written path, `.validate` on the written node and
 * everything under it, `$` wildcards, multi-path updates checked against the same old and new tree,
 * and the expression language (`root`, `data`, `newData`, `auth`, `now`, `.child()`, `.val()`,
 * `.exists()`, `.parent()`, `.hasChildren()`, `.isString()`, `.matches()`…). An expression that
 * fails to evaluate counts as false, as in Firebase. Server timestamps (`{'.sv': 'timestamp'}`)
 * become `now`.
 */
import fs from 'node:fs';

const parts = p => String(p).split('/').filter(Boolean);
const clone = x => (x == null ? null : JSON.parse(JSON.stringify(x)));
function getAt(tree, path) {
  let o = tree;
  for (const k of parts(path)) { if (o == null || typeof o !== 'object') return null; o = o[k]; }
  return o ?? null;
}
function setAt(tree, path, v) {
  const ps = parts(path);
  let o = tree;
  for (const k of ps.slice(0, -1)) o = (o[k] && typeof o[k] === 'object') ? o[k] : (o[k] = {});
  if (v === null) delete o[ps.at(-1)]; else o[ps.at(-1)] = v;
}
/** Drops empty objects, as Firebase does: a node with no children does not exist. */
function prune(o) {
  if (o == null || typeof o !== 'object') return o;
  for (const k of Object.keys(o)) { o[k] = prune(o[k]); if (o[k] == null) delete o[k]; }
  return Object.keys(o).length ? o : null;
}
const resolve = (v, now) => {
  if (v && typeof v === 'object') {
    if (v['.sv'] === 'timestamp') return now;
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x, now)]));
  }
  return v;
};

class Snap {
  constructor(tree, path) { this.tree = tree; this.path = parts(path); }
  child(p) { return new Snap(this.tree, [...this.path, ...parts(p)].join('/')); }
  parent() { return new Snap(this.tree, this.path.slice(0, -1).join('/')); }
  val() { return clone(getAt(this.tree, this.path.join('/'))); }
  exists() { return getAt(this.tree, this.path.join('/')) != null; }
  hasChild(k) { return this.child(k).exists(); }
  hasChildren(ks) { const v = this.val(); return v != null && typeof v === 'object' && (ks || []).every(k => this.child(k).exists()); }
  isString() { return typeof this.val() === 'string'; }
  isNumber() { return typeof this.val() === 'number'; }
  isBoolean() { return typeof this.val() === 'boolean'; }
}

const STRING_METHODS = {
  matches(re) { return re.test(this); },
  beginsWith(s) { return this.startsWith(s); },
  contains(s) { return this.includes(s); },
};
for (const [k, f] of Object.entries(STRING_METHODS)) {
  if (!Object.prototype.hasOwnProperty.call(String.prototype, k)) Object.defineProperty(String.prototype, k, { value: f, configurable: true });
}

function evaluate(expr, ctx, vars) {
  if (typeof expr === 'boolean') return expr;
  const names = Object.keys(vars);
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('root', 'data', 'newData', 'auth', 'now', ...names, `return (${expr});`);
    return f(ctx.root, ctx.data, ctx.newData, ctx.auth, ctx.now, ...names.map(n => vars[n])) === true;
  } catch (_) { return false; }
}

/** The rule node for key `k` under `node`, and the wildcard it binds, if any. */
function ruleChild(node, k) {
  if (!node) return [null, null];
  if (Object.prototype.hasOwnProperty.call(node, k) && !k.startsWith('.')) return [node[k], null];
  const w = Object.keys(node).find(x => x.startsWith('$'));
  return w ? [node[w], w] : [null, null];
}

export function loadRules(file = new URL('../../firebase/database.rules.json', import.meta.url)) {
  return JSON.parse(fs.readFileSync(file, 'utf8')).rules;
}

/**
 * A database with rules. `update(changes, { uid, now })` applies a multi-path update if the rules
 * allow every path, and returns true; otherwise leaves the data as it was and returns false.
 */
export function createDb(rules = loadRules(), initial = {}) {
  let tree = clone(initial) || {};
  const why = [];

  function canWrite(path, oldT, newT, auth, now) {
    let node = rules; const vars = {}; const ps = parts(path);
    for (let i = 0; i <= ps.length; i++) {
      if (i > 0) {
        const [n, w] = ruleChild(node, ps[i - 1]);
        if (!n) return false;
        if (w) vars[w] = ps[i - 1];
        node = n;
      }
      const here = ps.slice(0, i).join('/');
      if (node['.write'] !== undefined && evaluate(node['.write'], {
        root: new Snap(oldT, ''), data: new Snap(oldT, here), newData: new Snap(newT, here), auth, now,
      }, { ...vars })) return true;
    }
    return false;
  }

  function validates(path, oldT, newT, auth, now) {
    let node = rules; const vars = {}; const ps = parts(path);
    for (const k of ps) {
      const [n, w] = ruleChild(node, k);
      if (!n) return true; // nothing below says anything
      if (w) vars[w] = k;
      node = n;
    }
    const walk = (rn, p, vs) => {
      if (getAt(newT, p) == null) return true;
      const ctx = { root: new Snap(oldT, ''), data: new Snap(oldT, p), newData: new Snap(newT, p), auth, now };
      if (rn['.validate'] !== undefined && !evaluate(rn['.validate'], ctx, vs)) { why.push(`validate ${p}`); return false; }
      const v = getAt(newT, p);
      if (v && typeof v === 'object') {
        for (const k of Object.keys(v)) {
          const [n, w] = ruleChild(rn, k);
          if (n && !walk(n, `${p}/${k}`, w ? { ...vs, [w]: k } : vs)) return false;
        }
      }
      return true;
    };
    return walk(node, ps.join('/'), vars);
  }

  return {
    get: path => clone(getAt(tree, path)),
    set(path, v) { setAt(tree, path, clone(v)); tree = prune(tree) || {}; },
    why,
    update(changes, { uid = null, now = Date.now() } = {}) {
      why.length = 0;
      const auth = uid ? { uid } : null;
      const oldT = tree, newT = clone(tree) || {};
      for (const [p, v] of Object.entries(changes)) setAt(newT, p, resolve(clone(v), now));
      prune(newT);
      for (const p of Object.keys(changes)) {
        if (!canWrite(p, oldT, newT, auth, now)) { why.push(`write ${p}`); return false; }
        if (!validates(p, oldT, newT, auth, now)) return false;
      }
      tree = newT;
      return true;
    },
  };
}
