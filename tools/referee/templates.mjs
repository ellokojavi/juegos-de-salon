/**
 * The referee's templates (learning programme, piece 6, D-532): everything the model is told lives
 * here, server side. A client sends only a template id and its fields; it never sends a prompt, so
 * the endpoint is a referee for the games and not a free model for whoever finds it.
 *
 * Each template: `fields` (name → max length; letters, digits, spaces and basic punctuation only),
 * `system` (the instruction), `user(fields)` (the question), `schema` (the JSON the model must
 * answer, enforced by Ollama's structured output) and `check(answer)` (what the gateway trusts).
 */

const WORD = /^[\p{L}\p{N} ,.'¿?¡!-]*$/u;

export const TEMPLATES = {
  /** Bachillerato (Tutti Frutti): is `answer` a valid `category` starting with `letter`? */
  bachillerato: {
    fields: { category: 30, letter: 2, answer: 40, lang: 2 },
    system: 'You are the referee of Bachillerato (Tutti Frutti, Scattergories) at a table of friends. '
      + 'Judge whether the answer is a real, commonly known example of the category and starts with the letter. '
      + 'Accept regional words and spellings from Chile and the rest of Latin America, proper nouns when the category allows them, '
      + 'and ignore accents and case when comparing the first letter. Reject invented words and answers that only start with the letter. '
      + 'Answer only the JSON asked, with a reason of at most 12 words in the language of the table.',
    user: f => `Language of the table: ${f.lang || 'es'}. Category: ${f.category}. Letter: ${f.letter}. Answer: ${f.answer}.`,
    schema: { type: 'object', properties: { valid: { type: 'boolean' }, reason: { type: 'string' } }, required: ['valid', 'reason'] },
    check: a => typeof a?.valid === 'boolean' && typeof a?.reason === 'string' && a.reason.length <= 120,
  },

  /** Piece 1's judge: a clue of 🕵️ Agentes against the rubric (docs/learning/01-content-pipeline.md). */
  'agents-clue': {
    fields: { clue: 20, si: 200, casi: 60, lang: 2 },
    system: 'You judge a clue for the game Agentes (a solo Codenames). A clue is a word, nine or ten words that go with it (SI) '
      + 'and three temptations (CASI) that look like the clue but do not go with it. Score, 0 to 2 each: '
      + 'J1 every SI word is seen with the clue without explanation by a 12-year-old in Chile ("can be" is enough; the weakest word sets the score); '
      + 'J2 all SI words relate to the clue in the same way (part of, instance of, happens at, cause of, symbol of); '
      + 'J3 each CASI word relates to the clue in another way and no table could defend it as a SI word; '
      + 'J4 each CASI word is close enough to make a player hesitate; '
      + 'J5 the three CASI words are of one kind. Answer only the JSON asked, with one reason of at most 20 words per criterion in the language given.',
    user: f => `Language: ${f.lang || 'es'}. Clue: ${f.clue}. SI: ${f.si}. CASI: ${f.casi}.`,
    schema: {
      type: 'object',
      properties: { j1: { type: 'integer' }, j2: { type: 'integer' }, j3: { type: 'integer' }, j4: { type: 'integer' }, j5: { type: 'integer' }, reasons: { type: 'array', items: { type: 'string' } } },
      required: ['j1', 'j2', 'j3', 'j4', 'j5', 'reasons'],
    },
    check: a => ['j1', 'j2', 'j3', 'j4', 'j5'].every(k => Number.isInteger(a?.[k]) && a[k] >= 0 && a[k] <= 2) && Array.isArray(a?.reasons) && a.reasons.length <= 5,
  },
};

/** The fields a request may carry, trimmed and bounded, or the reason they are refused. */
export function readFields(template, fields) {
  const t = TEMPLATES[template];
  if (!t) return { error: 'unknown template' };
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return { error: 'fields must be an object' };
  const out = {};
  for (const [name, max] of Object.entries(t.fields)) {
    const v = fields[name];
    if (v === undefined || v === null || v === '') continue;
    if (typeof v !== 'string') return { error: `${name} must be a string` };
    const s = v.trim();
    if (s.length > max) return { error: `${name} is longer than ${max}` };
    if (!WORD.test(s)) return { error: `${name} has characters a word does not` };
    out[name] = s;
  }
  for (const name of Object.keys(t.fields)) if (name !== 'lang' && !(name in out)) return { error: `${name} is missing` };
  return { fields: out };
}

/** The key the cache and the tests use for one question. */
export const questionKey = (template, fields) => `${template}|${Object.entries(fields).sort().map(([k, v]) => `${k}=${v.toLowerCase()}`).join('|')}`;
