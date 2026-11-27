/**
 * Drift: a small WebGL 1 renderer of our own (docs/rally/path-2-3d.md, option A): 4×4 matrices, a
 * mesh builder for flat-shaded low-poly shapes, and one shader (a colour per vertex, one sun, fog).
 * No textures, no model files, no library. scene3d.js builds the world with it.
 *
 * Axes are the engine's: x east, y north, and z up. Matrices are column-major Float32Arrays, as
 * WebGL wants them.
 */

/* ---------------- Matrices ---------------- */
export const mat4 = {
  create: () => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  perspective(out, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf;
    return out;
  },
  lookAt(out, [ex, ey, ez], [tx, ty, tz], [ux, uy, uz]) {
    let zx = ex - tx, zy = ey - ty, zz = ez - tz;
    let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
    l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * ex + xy * ey + xz * ez); out[13] = -(yx * ex + yy * ey + yz * ez); out[14] = -(zx * ex + zy * ey + zz * ez); out[15] = 1;
    return out;
  },
  multiply(out, a, b) {
    const r = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let rw = 0; rw < 4; rw++) {
      r[c * 4 + rw] = a[rw] * b[c * 4] + a[4 + rw] * b[c * 4 + 1] + a[8 + rw] * b[c * 4 + 2] + a[12 + rw] * b[c * 4 + 3];
    }
    out.set(r);
    return out;
  },
  /** A pose: moved to (x, y, z), turned `yaw` about z, then `pitch` about its y and `roll` about its x. */
  pose(out, x, y, z, yaw = 0, pitch = 0, roll = 0) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    // R = Rz(yaw) · Ry(pitch) · Rx(roll)
    out[0] = cy * cp; out[1] = sy * cp; out[2] = -sp; out[3] = 0;
    out[4] = cy * sp * sr - sy * cr; out[5] = sy * sp * sr + cy * cr; out[6] = cp * sr; out[7] = 0;
    out[8] = cy * sp * cr + sy * sr; out[9] = sy * sp * cr - cy * sr; out[10] = cp * cr; out[11] = 0;
    out[12] = x; out[13] = y; out[14] = z; out[15] = 1;
    return out;
  },
};

/** '#rrggbb' → [r, g, b] from 0 to 1, darkened or lightened by `k`. */
export function rgb(hex, k = 1) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255 * k, ((n >> 8) & 255) / 255 * k, (n & 255) / 255 * k].map(v => Math.min(1, v));
}

/* ---------------- Meshes ---------------- */
/**
 * A growing list of triangles, each with its own normal (flat shading: no vertex is shared between
 * faces) and a colour [r, g, b, a?]. `vertices()` packs it as 6 floats + 4 bytes per vertex.
 */
export class Mesh {
  constructor() { this.p = []; this.c = []; }
  get count() { return this.p.length / 9; }
  tri(a, b, c, col) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.c.push(col);
    return this;
  }
  quad(a, b, c, d, col) { return this.tri(a, b, c, col).tri(a, c, d, col); }
  /** A box from its centre, half sizes and turn about z; `cols` is one colour, or [top, sides]. */
  box(x, y, z, hx, hy, hz, h, cols) {
    const [top, side] = Array.isArray(cols[0]) ? cols : [cols, cols];
    const c = Math.cos(h), s = Math.sin(h);
    const v = (a, b, u) => [x + c * a * hx - s * b * hy, y + s * a * hx + c * b * hy, z + u * hz];
    const P = [v(-1, -1, -1), v(1, -1, -1), v(1, 1, -1), v(-1, 1, -1), v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1)];
    this.quad(P[4], P[5], P[6], P[7], top);
    this.quad(P[0], P[1], P[5], P[4], side); this.quad(P[1], P[2], P[6], P[5], side);
    this.quad(P[2], P[3], P[7], P[6], side); this.quad(P[3], P[0], P[4], P[7], side);
    return this;
  }
  /** A cone or a frustum with `n` sides around z: radius r0 at z0, r1 at z1 (0 is a point). */
  cone(x, y, z0, z1, r0, r1, n, col, twist = 0, lid = false) {
    for (let i = 0; i < n; i++) {
      const a0 = twist + i / n * Math.PI * 2, a1 = twist + (i + 1) / n * Math.PI * 2;
      const b0 = [x + Math.cos(a0) * r0, y + Math.sin(a0) * r0, z0], b1 = [x + Math.cos(a1) * r0, y + Math.sin(a1) * r0, z0];
      const t0 = [x + Math.cos(a0) * r1, y + Math.sin(a0) * r1, z1], t1 = [x + Math.cos(a1) * r1, y + Math.sin(a1) * r1, z1];
      if (r1 > 0) this.quad(b0, b1, t1, t0, col); else this.tri(b0, b1, t0, col);
      if (lid && r1 > 0) this.tri([x, y, z1], t0, t1, col);
    }
    return this;
  }
  /** A faceted blob: a squashed octahedron-like ball of `n` sides, for bushes and rocks. */
  blob(x, y, z, r, hz, n, col, twist = 0) {
    const ring = Array.from({ length: n }, (_, i) => { const a = twist + i / n * Math.PI * 2; return [x + Math.cos(a) * r, y + Math.sin(a) * r, z + hz * 0.35]; });
    const top = [x, y, z + hz], bot = [x, y, z];
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n];
      this.tri(a, b, top, col);
      this.tri(b, a, bot, col);
    }
    return this;
  }
  /** Interleaved: x y z nx ny nz (floats) then r g b a (bytes); 28 bytes a vertex. */
  vertices() {
    const n = this.p.length / 3, buf = new ArrayBuffer(n * 28), f = new Float32Array(buf), u = new Uint8Array(buf);
    for (let t = 0; t < n / 3; t++) {
      const o = t * 9, P = this.p;
      const ux = P[o + 3] - P[o], uy = P[o + 4] - P[o + 1], uz = P[o + 5] - P[o + 2];
      const vx = P[o + 6] - P[o], vy = P[o + 7] - P[o + 1], vz = P[o + 8] - P[o + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const col = this.c[t];
      for (let k = 0; k < 3; k++) {
        const v = t * 3 + k;
        f.set([P[o + k * 3], P[o + k * 3 + 1], P[o + k * 3 + 2], nx, ny, nz], v * 7);
        u.set([col[0] * 255, col[1] * 255, col[2] * 255, (col[3] ?? 1) * 255], v * 28 + 24);
      }
    }
    return { data: buf, count: n };
  }
}

/* ---------------- The shader ---------------- */
const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec4 aCol;
uniform mat4 uVP; uniform mat4 uM; uniform vec3 uSun; uniform vec3 uEye; uniform vec4 uTint;
uniform float uLit; uniform vec2 uFog;
varying vec4 vCol; varying float vFog;
void main() {
  vec4 w = uM * vec4(aPos, 1.0);
  vec3 n = normalize((uM * vec4(aNor, 0.0)).xyz);
  float light = mix(1.0, 0.58 + 0.55 * max(dot(n, uSun), 0.0), uLit);
  vCol = vec4(aCol.rgb * uTint.rgb * light, aCol.a * uTint.a);
  vFog = clamp((distance(w.xyz, uEye) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  gl_Position = uVP * w;
}`;
const FS = `
precision mediump float;
uniform vec3 uFogColour;
varying vec4 vCol; varying float vFog;
void main() { gl_FragColor = vec4(mix(vCol.rgb, uFogColour, vFog * vFog), vCol.a); }`;
// The sky: a gradient over the whole screen, from the horizon's colour up
const SKY_VS = `attribute vec2 aPos; varying float vY; void main() { vY = aPos.y; gl_Position = vec4(aPos, 0.9999, 1.0); }`;
const SKY_FS = `precision mediump float; uniform vec3 uTop; uniform vec3 uLow; uniform float uHorizon; varying float vY;
void main() { gl_FragColor = vec4(mix(uLow, uTop, smoothstep(uHorizon, 1.0, vY)), 1.0); }`;

function compile(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(gl.getProgramInfoLog(p));
  const u = {}, a = {};
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const { name } = gl.getActiveUniform(p, i); u[name] = gl.getUniformLocation(p, name); }
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); i < n; i++) { const { name } = gl.getActiveAttrib(p, i); a[name] = gl.getAttribLocation(p, name); }
  return { p, u, a };
}

/**
 * The renderer on `canvas`, or null when the phone has no WebGL. `lost`/`restored` are called when
 * the phone takes the context away and gives it back (every buffer must then be built again).
 */
export function renderer(canvas, { lost = () => {}, restored = () => {} } = {}) {
  const opts = { antialias: true, alpha: false, depth: true, powerPreference: 'default' };
  let gl = null;
  try { gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts); } catch (_) { gl = null; }
  if (!gl) return null;
  let prog, sky, skyBuf;
  function setup() {
    prog = compile(gl, VS, FS);
    sky = compile(gl, SKY_VS, SKY_FS);
    skyBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  try { setup(); } catch (_) { return null; }
  const onLost = e => { e.preventDefault(); lost(); };
  const onBack = () => { setup(); restored(); };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onBack);

  /** A buffer on the GPU from a Mesh (static) or for vertices written every frame (dynamic). */
  function buffer(mesh, dynamic = false) {
    const b = { buf: gl.createBuffer(), count: 0 };
    if (mesh) upload(b, mesh, dynamic);
    return b;
  }
  function upload(b, mesh, dynamic = true) {
    const { data, count } = mesh.vertices();
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    b.count = count;
  }
  const IDENTITY = mat4.create();
  const WHITE = [1, 1, 1, 1];
  let frameState = null;

  return {
    gl, buffer, upload,
    get lost() { return gl.isContextLost(); },
    /** Clears to the sky and sets what every draw of this frame shares. */
    begin({ vp, eye, sun, fog, fogColour, skyTop, horizon = 0 }) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(fogColour[0], fogColour[1], fogColour[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // The sky, behind everything
      gl.useProgram(sky.p);
      gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
      for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);
      gl.enableVertexAttribArray(sky.a.aPos);
      gl.vertexAttribPointer(sky.a.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(sky.u.uTop, skyTop); gl.uniform3fv(sky.u.uLow, fogColour); gl.uniform1f(sky.u.uHorizon, horizon);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
      gl.disableVertexAttribArray(sky.a.aPos);
      // The world's program
      gl.useProgram(prog.p);
      gl.uniformMatrix4fv(prog.u.uVP, false, vp);
      gl.uniform3fv(prog.u.uEye, eye);
      gl.uniform3fv(prog.u.uSun, sun);
      gl.uniform2fv(prog.u.uFog, fog);
      gl.uniform3fv(prog.u.uFogColour, fogColour);
      gl.enableVertexAttribArray(prog.a.aPos); gl.enableVertexAttribArray(prog.a.aNor); gl.enableVertexAttribArray(prog.a.aCol);
      frameState = { boundM: null };
    },
    /** Draws a buffer with a model matrix (null: as built), a tint, lit or not, writing depth or not. */
    draw(b, { m = null, tint = WHITE, lit = 1, depth = true } = {}) {
      if (!b || !b.count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
      gl.vertexAttribPointer(prog.a.aPos, 3, gl.FLOAT, false, 28, 0);
      gl.vertexAttribPointer(prog.a.aNor, 3, gl.FLOAT, false, 28, 12);
      gl.vertexAttribPointer(prog.a.aCol, 4, gl.UNSIGNED_BYTE, true, 28, 24);
      const mm = m || IDENTITY;
      if (frameState.boundM !== mm || m) { gl.uniformMatrix4fv(prog.u.uM, false, mm); frameState.boundM = mm; }
      gl.uniform4fv(prog.u.uTint, tint.length === 4 ? tint : [...tint, 1]);
      gl.uniform1f(prog.u.uLit, lit);
      if (!depth) gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, 0, b.count);
      if (!depth) gl.depthMask(true);
    },
    free(b) { if (b) gl.deleteBuffer(b.buf); },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onBack);
    },
  };
}
