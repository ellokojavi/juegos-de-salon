// How much the iOS keyboard covers, read from visualViewport (#883)
import assert from 'node:assert/strict';
import { coveredBy, followKeyboard } from './keyboard.js';

assert.equal(coveredBy(568, null), 0, 'no visualViewport: nothing covered');
assert.equal(coveredBy(568, { height: 568, offsetTop: 0 }), 0, 'keyboard closed');
assert.equal(coveredBy(568, { height: 308, offsetTop: 0 }), 260, 'keyboard open');
assert.equal(coveredBy(568, { height: 308, offsetTop: 100 }), 160, 'the page panned up: less of the layer is covered');
assert.equal(coveredBy(568, { height: 600, offsetTop: 0 }), 0, 'never negative');

const vv = new EventTarget(); vv.height = 844; vv.offsetTop = 0;
const props = {};
const node = { style: { setProperty: (k, v) => { props[k] = v; } } };
const stop = followKeyboard(node, { visualViewport: vv, innerHeight: 844 });
assert.equal(props['--kb'], '0px');
vv.height = 508; vv.dispatchEvent(new Event('resize'));
assert.equal(props['--kb'], '336px', 'follows the keyboard opening');
stop(); vv.height = 844; vv.dispatchEvent(new Event('resize'));
assert.equal(props['--kb'], '336px', 'stopped: no longer follows');
followKeyboard(node, {});
assert.equal(props['--kb'], '0px', 'without visualViewport it is 0px');
console.log('✓ keyboard: --kb follows the visualViewport');
