// The owner's release notifications (release.mjs, D-504): a tap opens exactly what the PR launched.
import assert from 'node:assert/strict';
import { declared, destination, message, ctaFor } from './release.mjs';
import { deviceRecord, deviceName } from '../../public/panel/release-push.js';

// The PR's own lines win, as a path or a full link
assert.deepEqual(declared('Some text\nVer en: /panel/#/campaigns/splash/stack-pronto\nQué: Teasers nuevos'), { at: '/panel/#/campaigns/splash/stack-pronto', what: 'Teasers nuevos' });
assert.equal(declared('**Ver en:** https://juegosdesalon.cl/labs/stick/').at, '/labs/stick/');
assert.equal(declared('See at: `/hangman/`').at, '/hangman/');
assert.equal(declared('Ver en: https://evil.example/x').at, '', 'only this site');
assert.equal(declared('no line').at, '');

// Worked out from the files
const off = () => false, on = () => true;
const camp = ['public/assets/js/splash.js', 'marketing/splash/campaigns/stack-pronto/README.md'];
assert.equal(destination(camp, { splashOn: off }), '/panel/#/campaigns/splash/stack-pronto', 'an off campaign: the panel, at that campaign');
assert.equal(destination(camp, { splashOn: on }), '/?splash=stack-pronto', 'an on campaign: the splash itself');
assert.equal(destination(['public/labs/stack/game.js']), '/labs/stack/', 'a lab game');
assert.equal(destination(['public/assets/js/flags.js']), '/labs/', 'a lab flag');
assert.equal(destination(['public/hangman/game.js']), '/hangman/', 'a game');
assert.equal(destination(['public/panel/panel.js']), '/panel/', 'the panel');
assert.equal(destination(['public/assets/css/base.css']), '/', 'the rest of the site');
assert.equal(destination(['docs/CANONES.md', 'tools/e2e/x.mjs']), null, 'nothing the site serves');

// The message: short, with the PR, the version, the feature and where the tap goes
const ok = message({ pr: 981, title: 'Stack teaser', what: 'Teasers de Stack y Stick Ninja', version: '0.233.0', at: '/panel/#/campaigns/splash/stack-pronto' });
assert.equal(ok.title, '✅ v0.233.0 en vivo · PR #981');
assert.equal(ok.body, 'Teasers de Stack y Stick Ninja\n👉 Ver en 📣 Campañas');
assert.equal(ok.url, '/panel/#/campaigns/splash/stack-pronto');
const bad = message({ pr: 981, title: 'Stack teaser', failed: 'Fallaron las pruebas', runUrl: 'https://github.com/ellokojavi/juegos-de-salon/actions/runs/1', at: '/' });
assert.equal(bad.title, '❌ PR #981 no se publicó');
assert.match(bad.body, /Fallaron las pruebas\.\n👉 Ver el error$/);
assert.equal(bad.url, 'https://github.com/ellokojavi/juegos-de-salon/actions/runs/1');
assert.equal(ctaFor('/labs/stick/'), 'Abrir en el lab');
assert.equal(ctaFor('/hangman/'), 'Abrir El Ahorcado');
assert.equal(ctaFor('/?splash=x'), 'Ver el splash');

// What the panel saves for a device
assert.deepEqual(deviceRecord({ endpoint: 'https://p/x', keys: { p256dh: 'a', auth: 'b' } }, { at: 5, device: 'iPhone' }), { endpoint: 'https://p/x', keys: { p256dh: 'a', auth: 'b' }, at: 5, device: 'iPhone' });
assert.equal(deviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)'), 'iPhone');
console.log('✓ release notifications');
