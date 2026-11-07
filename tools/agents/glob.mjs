// A glob as a RegExp, shared by lanes.mjs and rules.mjs (its own module so the two never import each other)
/** A glob as a RegExp: `**` crosses folders (and `**\/` may be empty), `*` does not. */
export function globRe(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i++; } }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
