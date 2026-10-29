// The Pages deploy is retried only on a server error (D-506)
import assert from 'node:assert/strict';
import { serverError } from './pages-5xx.mjs';

assert.ok(serverError(['Error: Failed to create deployment (status: 502) with build version 72ca3d7. Server error']), 'the 502 of 2026-10-29');
assert.ok(serverError(['HttpError: Server Error']));
assert.ok(!serverError(['Error: Failed to create deployment (status: 404). Ensure GitHub Pages has been enabled']), 'a 404 is not retried');
assert.ok(!serverError(['Node.js 20 is deprecated', 'The ubuntu-latest label will migrate']), 'warnings are not errors');
assert.ok(!serverError([]));
console.log('pages-5xx: ok');
