/**
 * The design system as a check (D-533, docs/DESIGN.md; phase 2 of #1188): what a program can
 * measure about a stylesheet, a program measures, and the usability agent spends its review on what
 * needs judgment (D-520).
 *
 *   node tools/agents/design-lint.mjs             (every hit, by file; exit 0: report mode)
 *   node tools/agents/design-lint.mjs --summary   (one line per file with its counts)
 *   node tools/agents/design-lint.mjs --all       (also the allowlisted hits)
 *   node tools/agents/design-lint.mjs --gate      (exit 1 on any hit not allowlisted: phase 6)
 *   node tools/agents/design-lint.mjs baseline    (rewrites docs/design-baseline.json with today's counts)
 *   node tools/agents/design-lint.mjs <file.css>  (one file)
 *
 * It reads every stylesheet under public/ that git knows (the generated bridge pages have none) and
 * reports, per declaration:
 *   token-colour   a colour written by hand that is one of the tokens: `#2ee6d6` is `var(--cyan)`; at an alpha,
 *                  `rgba(46,230,214,0.6)` is `rgb(from var(--cyan) r g b / 0.6)` (a glow or a tint in a token colour).
 *   colour         any other colour literal (hex, rgb, rgba, hsl) outside a `--own-token:` declaration.
 *   radius         a border-radius in px that is not on the corner scale (8, 10, 12, 14, 16, 22, 999).
 *   space          a padding, margin or gap in px that is not on the space scale (2 px grid up to 20, then 24, 28, 32).
 *   copied         a selector that redeclares a class of base.css or ranking.css (`.btn`, `.panel`, `.display--sm`…),
 *                  or one of the components phase 4 moves into base.css (`.player-row`, `.toggle-row`, `.link-btn`).
 *   text-size      a font-size in rem (or the size inside a `font:` shorthand) that is not one of the text steps
 *                  (--fs-75 … --fs-200); the shared
 *                  sheets are exempt, their components' sizes are the system.
 *
 * A declaration of a custom property (`--mar: #0b1e3f`) is never a hit: that is how a game declares
 * its thematic colours (DESIGN.md §4). The scales are read from base.css itself, so a new step there
 * (a decision, D-533) is a new step here.
 *
 * Exceptions live in docs/design-allowlist.json with a reason each; an entry that no longer hits is
 * stale. The ratchet is docs/design-baseline.json: `design-lint.test.mjs` fails when a file's count
 * for a rule grows past it, never when it drops; a migrated file gets its baseline rewritten.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const RULES = ['token-colour', 'colour', 'radius', 'space', 'copied', 'text-size'];
const SHARED = ['public/assets/css/base.css', 'public/assets/css/ranking.css'];
/** The components phase 4 moves into base.css: today each game copies them (#1192). */
const PLANNED = ['player-row', 'toggle-row', 'link-btn'];
const SPACE_PROPS = /^(padding|margin|gap|row-gap|column-gap)(-(top|right|bottom|left|block|inline|start|end))?$/;

/** Every stylesheet git knows under public/. */
export function sources() {
  return execFileSync('git', ['ls-files', 'public/**/*.css'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
}

/** The tokens of base.css: name → value, and the scales the lint measures against. */
export function tokens(css = readFileSync(join(ROOT, SHARED[0]), 'utf8')) {
  const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const map = {};
  for (const m of root.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) map[m[1]] = m[2].trim();
  const px = prefix => Object.entries(map).filter(([k]) => k.startsWith(prefix)).map(([, v]) => parseFloat(v)).filter(n => !Number.isNaN(n));
  const colours = {};
  for (const [k, v] of Object.entries(map)) { const c = normColour(v); if (c) colours[c] = colours[c] || k; }
  return {
    map,
    space: new Set([0, ...px('--s-')]),
    radius: new Set([0, ...px('--r-')]),
    textSize: new Set(Object.entries(map).filter(([k]) => k.startsWith('--fs-')).map(([, v]) => parseFloat(v))),
    colours,
  };
}

/** A colour literal as `rrggbb` or `rrggbb/a`, or null when it is not one (or not worth comparing). */
export function normColour(v) {
  v = v.trim().toLowerCase();
  let m = v.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    return h.length === 8 ? `${h.slice(0, 6)}/${(parseInt(h.slice(6), 16) / 255).toFixed(2)}` : h.length === 6 ? h : null;
  }
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) {
    const h = [m[1], m[2], m[3]].map(n => Number(n).toString(16).padStart(2, '0')).join('');
    return m[4] !== undefined && Number(m[4]) < 1 ? `${h}/${Number(m[4]).toFixed(2)}` : h;
  }
  return null;
}

/** The classes a stylesheet defines on their own: `.btn`, `.btn--sm:active`, `.player-row input`, never
 * `.handoff .hint` (that is the handoff's hint, and a game may have a `.hint` of its own). */
export function definedClasses(css) {
  const out = new Set();
  for (const r of rules(css)) for (const sel of r.selector.split(',')) {
    const m = sel.trim().match(/^\.([\w-]+)(?:(?:\.[\w-]+)|(?::[\w-]+(?:\([^)]*\))?)|(?:\[[^\]]*\]))*(?:\s+[^.\s].*)?$/); // `.player-row input` defines .player-row; `.handoff .hint` defines neither
    if (m) out.add(m[1]);
  }
  return out;
}

/** The rules of a stylesheet: { selector, line, decls: [{ prop, value, line }] }, @-blocks flattened. */
export function rules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '));
  const out = [];
  const lineOf = i => clean.slice(0, i).split('\n').length;
  let i = 0;
  const walk = () => {
    while (i < clean.length) {
      const open = clean.indexOf('{', i);
      if (open < 0) return;
      const head = clean.slice(i, open).trim();
      const close = clean.indexOf('}', open);
      const nextOpen = clean.indexOf('{', open + 1);
      if (head.startsWith('@') && !/^@(media|supports|container|layer)/.test(head)) { // @font-face, @keyframes: skip the block
        if (head.startsWith('@keyframes')) { let depth = 0, k = open; do { if (clean[k] === '{') depth++; else if (clean[k] === '}') depth--; k++; } while (depth && k < clean.length); i = k; }
        else i = close + 1;
        // the closing brace(s) of an @media that held this block
        for (;;) { while (/\s/.test(clean[i] || '')) i++; if (clean[i] === '}') i++; else break; }
        continue;
      }
      if (head.startsWith('@')) { i = open + 1; continue; } // @media: flatten
      if (nextOpen >= 0 && nextOpen < close) { i = open + 1; continue; } // nested, be lenient
      const body = clean.slice(open + 1, close);
      const decls = [];
      let k = 0;
      for (const part of body.split(';')) {
        const m = part.match(/^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/);
        if (m) decls.push({ prop: m[1].toLowerCase(), value: m[2].replace(/\s*!important$/, ''), line: lineOf(open + 1 + k + part.search(/\S/)) });
        k += part.length + 1;
      }
      out.push({ selector: head.replace(/\s+/g, ' '), line: lineOf(open), decls });
      i = close + 1;
      // the closing brace(s) of an @media that held this rule
      for (;;) { while (/\s/.test(clean[i] || '')) i++; if (clean[i] === '}') i++; else break; }
    }
  };
  walk();
  return out;
}

/** The px values of a declaration, outside calc()/env()/min()/max()/clamp() (those are formulas, not sizes); 1 px is a hairline, never spacing. */
function withoutFormulas(value) {
  let out = '', depth = 0;
  for (let i = 0; i < value.length; i++) {
    if (!depth) { const m = value.slice(i).match(/^(calc|env|min|max|clamp)\(/); if (m) { depth = 1; i += m[0].length - 1; continue; } out += value[i]; continue; }
    if (value[i] === '(') depth++; else if (value[i] === ')') depth--;
  }
  return out;
}
const pxOf = value => [...withoutFormulas(value).matchAll(/(-?\d*\.?\d+)px\b/g)].map(m => Math.abs(parseFloat(m[1]))).filter(n => n !== 1);
const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

/** The hits of one stylesheet, against the tokens. */
export function lintCss(css, file, T, shared = sharedClasses()) {
  const hits = [];
  const isShared = SHARED.includes(file);
  const hit = (rule, line, what, fix) => hits.push({ file, rule, line, what, fix });
  for (const r of rules(css)) {
    const subject = r.selector.split(',').map(s => s.trim());
    if (!isShared) for (const s of subject) {
      const m = s.match(/^\.([\w-]+)((?::[\w-]+(?:\([^)]*\))?)*)$/);
      if (m && shared.has(m[1])) hit('copied', r.line, s, `the class is base.css's or ranking.css's: use it, or add the variant there`);
      const p = s.match(/^\.([\w-]+)/)?.[1];
      if (p && PLANNED.includes(p) && !(m && shared.has(p))) hit('copied', r.line, s, `a component phase 4 moves into base.css (#1192)`);
    }
    for (const d of r.decls) {
      if (d.prop.startsWith('--')) continue; // the game's own tokens (DESIGN.md §4), or base.css's
      if (/^(animation|transition|content|font-family|src|unicode-range)$/.test(d.prop)) continue;
      const seen = new Set();
      for (const m of d.value.matchAll(COLOUR_LITERAL)) {
        if (m[0].includes('var(')) continue; // rgba(var(--g), 0.5) and rgb(from var(--x) r g b / a): the colour is a token already
        if (seen.has(m[0])) continue; seen.add(m[0]); // one hit per colour per declaration
        const c = normColour(m[0]);
        const [rgb, alpha] = (c || '').split('/');
        const surface = /^(background|border|box-shadow|fill|stroke)/.test(d.prop) && rgb === 'ffffff' && !alpha;
        if (c && T.colours[c] && !surface) hit('token-colour', d.line, `${d.prop}: ${m[0]}`, `var(${T.colours[c]})`);
        else if (alpha && T.colours[rgb]) hit('token-colour', d.line, `${d.prop}: ${m[0]}`, `rgb(from var(${T.colours[rgb]}) r g b / ${alpha})`);
        else if (surface) { if (!isShared) hit('colour', d.line, `${d.prop}: ${m[0]}`, 'a white surface: var(--card) if it is a card, or an allowlist entry with its reason'); }
        else if (!isShared) hit('colour', d.line, `${d.prop}: ${m[0]}`, 'a token, or the game\'s own `--token` at the top of the file with its reason in DESIGN.md §4');
      }
      if (d.prop === 'border-radius' || /^border-.*-radius$/.test(d.prop)) {
        for (const n of new Set(pxOf(d.value))) if (!T.radius.has(n)) hit('radius', d.line, `${d.prop}: ${d.value}`, nearest(n, T.radius, '--r-', T.map));
      }
      if (SPACE_PROPS.test(d.prop)) {
        for (const n of new Set(pxOf(d.value))) if (!T.space.has(n)) hit('space', d.line, `${d.prop}: ${d.value}`, nearest(n, T.space, '--s-', T.map));
      }
      if ((d.prop === 'font-size' || d.prop === 'font') && !isShared) { // the shared components' own sizes are the system
        // `font-size: 1.1rem`, or the size inside the shorthand `font: 900 1.1rem/1.2 var(--font-body)`
        const m = d.prop === 'font-size' ? d.value.match(/^(\d*\.?\d+)rem$/) : d.value.match(/(?:^|\s)(\d*\.?\d+)rem(?:\/[\d.]+(?:rem|em|px)?)?(?=\s)/);
        if (m && !T.textSize.has(parseFloat(m[1]))) hit('text-size', d.line, `${d.prop}: ${d.value}`, 'one of the steps --fs-75 … --fs-200, or a .display step for a title');
      }
    }
  }
  return hits;
}

function nearest(n, scale, prefix, map) {
  const sorted = [...scale].filter(v => v > 0).sort((a, b) => a - b);
  const below = sorted.filter(v => v < n).pop(), above = sorted.find(v => v > n);
  const name = v => Object.entries(map).find(([k, val]) => k.startsWith(prefix) && parseFloat(val) === v)?.[0] || `${v}px`;
  return [below && `${name(below)} (${below})`, above && `${name(above)} (${above})`].filter(Boolean).join(' or ');
}

let _shared;
export function sharedClasses() {
  if (!_shared) { _shared = new Set(); for (const f of SHARED) for (const c of definedClasses(readFileSync(join(ROOT, f), 'utf8'))) _shared.add(c); }
  return _shared;
}

/** docs/design-allowlist.json: entries { file, rule, what, reason }; `*` in `what` matches any run of characters. */
export function allowlist() {
  const j = JSON.parse(readFileSync(join(ROOT, 'docs/design-allowlist.json'), 'utf8'));
  return j.entries || [];
}
const glob = p => new RegExp('^' + p.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
const allowed = (h, entries) => entries.find(e => e.file === h.file && (e.rule === '*' || e.rule === h.rule) && (e.what === '*' || glob(e.what).test(h.what) || glob(e.what).test(h.fix || '')));

/** Every hit of every stylesheet (or of the given files), with `allowed` set from the allowlist, plus the stale entries. */
export function lint(files = sources(), entries = allowlist()) {
  const T = tokens();
  const used = new Set();
  const hits = [];
  for (const f of files) {
    const rel = relative(ROOT, join(ROOT, f));
    for (const h of lintCss(readFileSync(join(ROOT, rel), 'utf8'), rel, T)) {
      const a = allowed(h, entries);
      if (a) used.add(a);
      hits.push({ ...h, allowed: !!a });
    }
  }
  const stale = entries.filter(e => !used.has(e) && files.includes(e.file));
  return { hits, stale };
}

/** Counts per file and rule of the hits not allowlisted: what the baseline keeps. */
export function counts(hits) {
  const out = {};
  for (const h of hits) { if (h.allowed) continue; out[h.file] = out[h.file] || {}; out[h.file][h.rule] = (out[h.file][h.rule] || 0) + 1; }
  return Object.fromEntries(Object.keys(out).sort().map(f => [f, Object.fromEntries(RULES.filter(r => out[f][r]).map(r => [r, out[f][r]]))]));
}

export function baseline() {
  try { return JSON.parse(readFileSync(join(ROOT, 'docs/design-baseline.json'), 'utf8')).files || {}; } catch (_) { return {}; }
}

/** The ratchet: files and rules whose count grew past the baseline, and files the baseline names that are gone. */
export function ratchet(hits, base = baseline(), files = sources()) {
  const now = counts(hits);
  const grew = [];
  for (const [f, rules] of Object.entries(now)) for (const [r, n] of Object.entries(rules)) {
    const was = base[f]?.[r] || 0;
    if (n > was) grew.push({ file: f, rule: r, was, now: n });
  }
  const gone = Object.keys(base).filter(f => !files.includes(f));
  return { grew, gone, now };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const cmd = args.find(a => !a.startsWith('--') && !a.endsWith('.css'));
  const files = args.filter(a => a.endsWith('.css'));
  const { hits, stale } = lint(files.length ? files : undefined);
  if (cmd === 'baseline') {
    const files = counts(hits);
    const total = Object.values(files).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0);
    writeFileSync(join(ROOT, 'docs/design-baseline.json'), JSON.stringify({
      _about: 'The design lint\'s ratchet (tools/agents/design-lint.mjs, D-533): hits per stylesheet and rule that are not allowlisted. design-lint.test.mjs fails when a count grows, never when it drops. Rewritten with `node tools/agents/design-lint.mjs baseline` after a migration; generated, never edited by hand.',
      total, files,
    }, null, 2) + '\n');
    console.log(`docs/design-baseline.json written: ${total} hits in ${Object.keys(files).length} files`);
    process.exit(0);
  }
  const show = args.includes('--all') ? hits : hits.filter(h => !h.allowed);
  if (args.includes('--summary')) {
    const c = counts(hits);
    for (const [f, r] of Object.entries(c)) console.log(`${f.padEnd(44)} ${RULES.map(k => r[k] ? `${k} ${r[k]}` : '').filter(Boolean).join(' · ')}`);
  } else {
    let last = '';
    for (const h of show) { if (h.file !== last) { console.log(`\n${h.file}`); last = h.file; } console.log(`  :${String(h.line).padEnd(4)} ${h.rule.padEnd(12)} ${h.what}${h.allowed ? '  (allowlisted)' : ''}\n        → ${h.fix}`); }
  }
  for (const e of stale) console.log(`stale allowlist entry: ${e.file} ${e.rule} ${e.what}`);
  const open = hits.filter(h => !h.allowed).length;
  console.log(`\n${open} hits not allowlisted in ${new Set(hits.filter(h => !h.allowed).map(h => h.file)).size} files` + (hits.length - open ? `, ${hits.length - open} allowlisted` : '') + (stale.length ? `, ${stale.length} stale` : ''));
  process.exit(args.includes('--gate') && (open || stale.length) ? 1 : 0);
}
