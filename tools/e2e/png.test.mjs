// The visual check's PNG reader, writer and diff (png.mjs, #1249): a round trip keeps every pixel,
// and the diff counts what moved past the tolerance and nothing under it.
import assert from 'node:assert/strict';
import { decode, encode, compare, half } from './png.mjs';

const W = 37, H = 23;
const img = { width: W, height: H, data: Buffer.alloc(W * H * 4) };
for (let i = 0; i < W * H; i++) img.data.set([(i * 7) & 255, (i * 13) & 255, (i * 29) & 255, 255], i * 4);
const back = decode(encode(img));
assert.equal(back.width, W); assert.equal(back.height, H);
assert.ok(back.data.equals(img.data), 'a round trip changed pixels');

const moved = { ...img, data: Buffer.from(img.data) };
moved.data[0] ^= 10; // under the tolerance
for (let p = 10; p < 15; p++) moved.data[p * 4 + 1] = (moved.data[p * 4 + 1] + 128) & 255; // five pixels well past it
const r = compare(img, moved, { delta: 48 });
assert.equal(r.differing, 5);
assert.equal(compare(img, half(img)).ratio, 1, 'different sizes differ entirely');
assert.equal(half(img).width, 18);
console.log('png: round trip, diff and half size, green');
