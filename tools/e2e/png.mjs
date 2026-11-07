/**
 * A tiny PNG reader, writer and pixel diff in plain node (zlib), for the visual check (visual.mjs).
 * It reads what Chrome's `Page.captureScreenshot` writes: 8-bit RGB or RGBA, not interlaced. No npm.
 */
import { inflateSync, deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** PNG bytes → { width, height, data } with `data` as RGBA, 4 bytes a pixel. */
export function decode(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG');
  let pos = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString('latin1', pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === 'IHDR') { width = body.readUInt32BE(0); height = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (kind === 'IDAT') idat.push(body);
    else if (kind === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 2: 3, 6: 4 }[type];
  if (depth !== 8 || !channels || interlace) throw new Error(`unsupported PNG (depth ${depth}, type ${type}, interlace ${interlace})`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = rows.subarray(y * stride, (y + 1) * stride);
    const prev = y ? rows.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[i - channels] : 0, b = prev ? prev[i] : 0, c = prev && i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[i] = v & 255;
    }
  }
  if (channels === 4) return { width, height, data: rows };
  const data = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) { rows.copy(data, p * 4, p * 3, p * 3 + 3); data[p * 4 + 3] = 255; }
  return { width, height, data };
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (kind, body) => {
  const head = Buffer.alloc(8); head.writeUInt32BE(body.length, 0); head.write(kind, 4, 'latin1');
  const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, tail]);
};

/**
 * { width, height, data (RGBA) } → PNG bytes: RGB (the screens are opaque), each row with the filter
 * that leaves it smallest, as libpng does, so a reference weighs what Chrome's own PNG would.
 */
export function encode({ width, height, data }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  const stride = width * 3, rgb = Buffer.alloc(stride * height);
  for (let p = 0; p < width * height; p++) data.copy(rgb, p * 3, p * 4, p * 4 + 3);
  const raw = Buffer.alloc((stride + 1) * height), line = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const cur = rgb.subarray(y * stride, (y + 1) * stride), prev = y ? rgb.subarray((y - 1) * stride, y * stride) : null;
    let best = -1, bestCost = Infinity;
    for (let f = 0; f < 5; f++) {
      let cost = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= 3 ? cur[i - 3] : 0, b = prev ? prev[i] : 0, c = prev && i >= 3 ? prev[i - 3] : 0;
        let pr = 0;
        if (f === 1) pr = a; else if (f === 2) pr = b; else if (f === 3) pr = (a + b) >> 1;
        else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        const v = (cur[i] - pr) & 255;
        line[i] = v; cost += v < 128 ? v : 256 - v;
      }
      if (cost < bestCost) { bestCost = cost; best = f; line.copy(raw, y * (stride + 1) + 1); }
    }
    raw[y * (stride + 1)] = best;
  }
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** Half the size each way, each pixel the mean of four: what the references keep. */
export function half({ width, height, data }) {
  const w = width >> 1, h = height >> 1, out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) {
    const at = (yy, xx) => data[((y * 2 + yy) * width + x * 2 + xx) * 4 + k];
    out[(y * w + x) * 4 + k] = (at(0, 0) + at(0, 1) + at(1, 0) + at(1, 1) + 2) >> 2;
  }
  return { width: w, height: h, data: out };
}

/**
 * Compares two images. A pixel differs when one of its channels moves more than `delta` (0-255):
 * antialiasing and subpixel noise stay under it. Returns { differing, ratio, diff } where `diff` is an
 * image: the reference faded, with the differing pixels in red. Different sizes differ entirely.
 */
export function compare(a, b, { delta = 48 } = {}) {
  if (a.width !== b.width || a.height !== b.height) return { differing: a.width * a.height, ratio: 1, diff: null, sizes: `${a.width}×${a.height} vs ${b.width}×${b.height}` };
  const diff = Buffer.alloc(a.data.length);
  let differing = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const moved = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]), Math.abs(a.data[i + 3] - b.data[i + 3]));
    if (moved > delta) { differing++; diff[i] = 255; diff[i + 1] = 0; diff[i + 2] = 0; }
    else { const g = Math.min(255, 200 + (((a.data[i] + a.data[i + 1] + a.data[i + 2]) / 12) | 0)); diff[i] = diff[i + 1] = diff[i + 2] = g; }
    diff[i + 3] = 255;
  }
  return { differing, ratio: differing / (a.width * a.height), diff: { width: a.width, height: a.height, data: diff } };
}
