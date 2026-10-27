// Stats names retention (D-472): only the named parts of days older than 24 months are deleted.
import assert from 'node:assert/strict';
import { toDelete, RETENTION_DAYS, STATS_NAME_MONTHS } from './stats-retention.mjs';
import { dayOf } from '../../public/assets/js/transport/cleanup.js';

assert.equal(STATS_NAME_MONTHS, 24);
assert.equal(RETENTION_DAYS, 730);
const now = Date.UTC(2026, 9, 27);
const today = dayOf(now), cut = today - RETENTION_DAYS;
const view = {
  prod: {
    [cut - 1]: { rooms: true, live: true, lang: true, vistas: true },
    [cut]: { rooms: true, live: true },
    [today]: { rooms: true },
    junk: { rooms: true },
  },
  dev: { [cut - 5]: { hour: true } },
};
assert.deepEqual(toDelete(view, now), [`stats/prod/days/${cut - 1}/rooms`, `stats/prod/days/${cut - 1}/live`]);
assert.deepEqual(toDelete({}, now), []);
assert.deepEqual(toDelete(null, now), []);
console.log('stats retention: ok');
