// Every splash campaign is kept in marketing/splash/campaigns/<id>/, with its README and its
// screenshots in the four languages (D-355).
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CAMPAIGNS } from '../../public/assets/js/splash.js';

const dir = new URL('campaigns/', import.meta.url);
for (const id of Object.keys(CAMPAIGNS)) {
  for (const f of ['README.md', ...['es', 'en', 'pt', 'de'].map(l => `${l}-390.jpg`)]) {
    assert.ok(existsSync(new URL(`${id}/${f}`, dir)), `the splash campaign ${id} has no marketing/splash/campaigns/${id}/${f} (see marketing/splash/README.md)`);
  }
}
console.log(`✓ splash campaigns kept: ${Object.keys(CAMPAIGNS).length}`);
