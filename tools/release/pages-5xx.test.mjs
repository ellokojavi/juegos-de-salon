// The Pages deploy is retried only on a server error (D-506)
import assert from 'node:assert/strict';
import { serverError, stuckDeployment } from './pages-5xx.mjs';

assert.ok(serverError(['Error: Failed to create deployment (status: 502) with build version 72ca3d7. Server error']), 'the 502 of 2026-10-29');
assert.ok(serverError(['HttpError: Server Error']));
assert.ok(!serverError(['Error: Failed to create deployment (status: 404). Ensure GitHub Pages has been enabled']), 'a 404 is not retried');
assert.ok(!serverError(['Node.js 20 is deprecated', 'The ubuntu-latest label will migrate']), 'warnings are not errors');
assert.ok(!serverError([]));
const msg = 'Responded with: Deployment request failed for 43c2df28e47a9eff6a314313914c8694b43a57d5 due to in progress deployment. Please cancel 72ca3d7da9a07de0cbc6af47ba2edc1ddc2786c0 first or wait for it to complete.';
assert.equal(stuckDeployment(['x', msg]), '72ca3d7da9a07de0cbc6af47ba2edc1ddc2786c0', 'the stuck deployment of 2026-10-29');
assert.equal(stuckDeployment(['HttpError: Server Error']), '');
console.log('pages-5xx: ok');
