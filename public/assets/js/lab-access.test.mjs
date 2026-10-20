// What is in development shows only to lab key holders (D-395): checkLabAccess, without a browser.
import { checkLabAccess } from './lab-access.js';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };
const answer = (body, okStatus = true) => async () => ({ ok: okStatus, status: okStatus ? 200 : 500, json: async () => body });
const never = async () => { throw new Error('no fetch expected'); };

ok(await checkLabAccess({ host: 'localhost', fetchFn: never }), 'localhost opens by itself');
ok(await checkLabAccess({ host: 'mac.tail1234.ts.net', fetchFn: never }), 'Tailscale opens by itself');
ok(!(await checkLabAccess({ host: 'juegosdesalon.cl', key: null, fetchFn: never })), 'a player without a key sees nothing in development');
ok(await checkLabAccess({ host: 'juegosdesalon.cl', key: 'ana-123', fetchFn: answer('ana') }), 'a key Firebase knows opens');
ok(!(await checkLabAccess({ host: 'juegosdesalon.cl', key: 'ana-123', fetchFn: answer(null) })), 'a removed key no longer opens');
ok(await checkLabAccess({ host: 'juegosdesalon.cl', key: 'ana-123', fetchFn: async () => { throw new Error('offline'); } }), 'with no network a saved key still opens, as at the door');

console.log(failures ? `✗ ${failures} failure(s)` : '✓ lab-access');
process.exit(failures ? 1 : 0);
