// Every splash campaign is kept in marketing/splash/campaigns/<id>/, with its README and its
// screenshots in the app's languages (D-355; German left in D-514, so a new campaign has es, en and pt).
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CAMPAIGNS } from '../../public/assets/js/splash.js';
import { IDIOMAS } from '../../public/assets/js/i18n.js';

const dir = new URL('campaigns/', import.meta.url);
for (const id of Object.keys(CAMPAIGNS)) {
  for (const f of ['README.md', ...IDIOMAS.map(l => `${l}-390.jpg`)]) {
    assert.ok(existsSync(new URL(`${id}/${f}`, dir)), `the splash campaign ${id} has no marketing/splash/campaigns/${id}/${f} (see marketing/splash/README.md)`);
  }
}
console.log(`✓ splash campaigns kept: ${Object.keys(CAMPAIGNS).length}`);
