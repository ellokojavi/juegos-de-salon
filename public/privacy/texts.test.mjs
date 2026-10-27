// The privacy page (D-463): the four languages say the same things, and the email's 90 days match the job's.
import assert from 'node:assert/strict';
import { TEXTS, CONTACT, UPDATED } from './texts.js';
import { LANGS } from '../assets/js/i18n.js';
import { RETENTION_DAYS } from '../../tools/agents/feedback.mjs';
import { STATS_NAME_MONTHS } from '../../tools/firebase/stats-retention.mjs';

assert.deepEqual(Object.keys(TEXTS).sort(), [...LANGS].sort(), 'one text per language of the app (C-3)');
const shape = t => ({ keys: Object.keys(t).sort(), sections: t.sections.map(s => [Object.keys(s).sort(), (s.p || []).length, (s.items || []).length]) });
for (const [lang, t] of Object.entries(TEXTS)) {
  assert.deepEqual(shape(t), shape(TEXTS.es), `${lang}: the same sections, paragraphs and items as Spanish`);
  const all = [t.title, t.lead, t.who, t.updated, ...t.sections.flatMap(s => [s.h, ...(s.p || []), ...(s.items || [])])];
  for (const s of all) assert.ok(typeof s === 'string' && s.trim() && !s.includes('undefined'), `${lang}: no empty text`);
  const text = all.join('\n');
  assert.ok(text.includes(CONTACT), `${lang}: says where to write`);
  assert.ok(text.includes('juegosdesalon.cl') && !/Javier|Javi\b/.test(text), `${lang}: the controller is the site, never a person`);
  assert.ok(text.includes(`${RETENTION_DAYS}`), `${lang}: the email's retention, the days feedback.mjs applies`);
  assert.ok(new RegExp(`\\b${STATS_NAME_MONTHS} (meses|months|Monaten)`).test(text), `${lang}: the stats names' retention, the months stats-retention.mjs applies (D-472)`);
  assert.ok(text.includes('21.719'), `${lang}: names Chile's law`);
  assert.ok(/[—–]/.test(text) === false, `${lang}: no em or en dashes`);
  // Each paragraph and item, one idea, not a wall (U-1, U-8)
  for (const s of all) assert.ok(s.length <= 460, `${lang}: "${s.slice(0, 40)}…" is too long (${s.length})`);
}
assert.match(UPDATED, /^\d{4}-\d{2}-\d{2}$/);
console.log('privacy texts: ok');
