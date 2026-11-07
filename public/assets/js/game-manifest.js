/**
 * The per-game manifest (#1249 step 7): `public/<folder>/game.json` holds the facts about one game
 * in one place. `node tools/generators/manifests.mjs` turns each into `public/assets/js/manifests/<folder>.js` (an ES
 * module the browser imports, since pages are static; shared, so no page loads another game's folder, D-378), and games.js builds the game's GAMES entry
 * from it with `catalogEntry`, so the entry keeps the shape every consumer reads.
 *
 * Pure: no DOM, no imports, testable in node.
 */

const LANGS = ['es', 'en', 'pt'];
const isText3 = v => !!v && typeof v === 'object' && LANGS.every(l => typeof v[l] === 'string' && v[l].trim());
const isList = (v, item) => Array.isArray(v) && v.every(item);
const isStr = v => typeof v === 'string' && v.trim() !== '';

/** The schema as data: field → { required, check(value) → true when valid, about }. */
export const MANIFEST_SCHEMA = {
  id: { required: true, about: 'the persisted id (Firebase, localStorage, panel); never changes', check: v => /^[a-z][a-z0-9-]*$/.test(v) },
  path: { required: true, about: 'the folder under public/, the URL, with a trailing slash', check: v => /^[a-z0-9-]+\/$/.test(v) },
  emoji: { required: true, about: 'the card emoji', check: isStr },
  name: { required: true, about: 'the name the player reads, es/en/pt', check: isText3 },
  tagline: { required: true, about: 'the one-line pitch, es/en/pt', check: isText3 },
  keywords: { required: true, about: 'the 🔎 search words per language (D-404)', check: v => !!v && LANGS.every(l => isList(v[l], isStr)) },
  players: { required: true, about: '{ min, max } players', check: v => !!v && Number.isInteger(v.min) && Number.isInteger(v.max) && v.min >= 1 && v.max >= v.min },
  duration: { required: true, about: 'minutes, "a–b" or "n"', check: v => /^\d+(–\d+)?$/.test(v) },
  tipos: { required: true, about: 'the home page filters (TIPOS keys)', check: v => isList(v, isStr) && v.length > 0 },
  jugadas: { required: false, about: 'the move keys the signals count', check: v => isList(v, isStr) },
  unoAlDia: { required: false, about: 'One a Day: deck order (never reorder), since when, group', check: v => !!v && Number.isInteger(v.orden) && /^\d{4}-\d{2}-\d{2}$/.test(v.desde) },
  nuevoDesde: { required: false, about: 'date it opened, for the "new" badge', check: v => /^\d{4}-\d{2}-\d{2}$/.test(v) },
  reuses: { required: false, about: 'paths it plays from La Copa, for the end-to-end scope', check: v => isList(v, isStr) },
  offline: { required: false, about: 'false when it cannot be played offline (D-538)', check: v => typeof v === 'boolean' },
  available: { required: true, about: 'opens from the menu', check: v => typeof v === 'boolean' },
  modes: { required: true, about: 'the MODES keys the game offers (games.js)', check: v => isList(v, v2 => /^[a-z][a-z-]{0,15}$/.test(v2)) && v.length > 0 },
  ai: { required: true, about: 'has a vs.-the-phone opponent', check: v => typeof v === 'boolean' },
  memory: { required: true, about: 'the session key (C-6)', check: v => typeof v === 'string' },
  languages: { required: true, about: 'the languages the player can choose (C-3)', check: v => isList(v, l => LANGS.includes(l)) && LANGS.every(l => v.includes(l)) },
  firebasePaths: { required: true, about: 'the Firebase paths the game writes ({code} for a room)', check: v => isList(v, isStr) },
  canonExceptions: { required: true, about: 'from docs/games/<folder>.md "Exceptions to the canons"', check: v => isList(v, e => !!e && /^C-\d+[a-z]?$/.test(e.canon) && isStr(e.why)) },
};

/** The problems with a manifest, as a list of strings; empty when it is valid. */
export function validateManifest(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return ['not an object'];
  const out = [];
  for (const [k, s] of Object.entries(MANIFEST_SCHEMA)) {
    if (!(k in m)) { if (s.required) out.push(`${k}: missing`); continue; }
    if (!s.check(m[k])) out.push(`${k}: invalid (${s.about})`);
  }
  for (const k of Object.keys(m)) if (!MANIFEST_SCHEMA[k]) out.push(`${k}: unknown field`);
  if (isStr(m.id) && m.memory !== `juegos-de-salon:${m.id}:session`) out.push(`memory: must be juegos-de-salon:${m.id}:session (C-6)`);
  if (Array.isArray(m.modes) && m.modes.includes('cpu') !== m.ai) out.push('ai: must be true exactly when modes has cpu');
  if (Array.isArray(m.modes) && Array.isArray(m.firebasePaths) && m.modes.includes('online') && !m.firebasePaths.some(p => p.startsWith('rooms/'))) out.push('firebasePaths: an online game writes rooms/{code}');
  return out;
}

/** The keys of a GAMES entry, in the order games.js writes them. */
const ENTRY_KEYS = ['id', 'unoAlDia', 'tipos', 'emoji', 'name', 'tagline', 'keywords', 'players', 'duration', 'jugadas', 'path', 'reuses', 'offline', 'nuevoDesde', 'available'];

/** The GAMES entry for a manifest, with the shape games.js has always had (players as "1–6"). */
export function catalogEntry(m) {
  const e = {};
  for (const k of ENTRY_KEYS) if (k in m) e[k] = m[k];
  e.players = m.players.min === m.players.max ? String(m.players.min) : `${m.players.min}–${m.players.max}`;
  return e;
}
