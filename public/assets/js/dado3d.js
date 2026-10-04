/**
 * El dado en 3D (WebGL): un cubo blanco de cantos redondos, con un emoji en cada cara, luz
 * difusa y un brillo. Se dibuja en un solo lienzo, así que girarlo cuesta lo mismo que nada.
 *
 * Armarlo con capas de HTML (cada cara un div y los cantos con cortes) se veía de cartón, con
 * huecos negros en las esquinas, y recalcular el sombreado de 80 capas en cada cuadro trababa
 * la animación en el celular.
 *
 * crearDado(lienzo, emojis) → { dibujar(ax, ay) } o null si no hay WebGL. Las caras van en el
 * orden: adelante, derecha, atrás, izquierda, arriba, abajo. ax y ay son grados (como
 * rotateX(ax) rotateY(ay) en CSS, pero con el eje y hacia arriba).
 */

const R = 0.3;   // radio de los cantos, con el dado de lado 2
const N = 28;    // subdivisiones por cara: más, y los cantos se ven más redondos

// [normal, eje u, eje v] de cada cara; u va a la derecha y v hacia arriba al mirarla de frente
const CARAS = [
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
];

/** La malla: cada cara es una grilla que se lleva a la superficie de un cubo de cantos redondos. */
function malla() {
  const pos = [], nor = [], uv = [], idx = [];
  // Más puntos cerca de los bordes, donde está la curva
  const paso = i => { const t = i / N * 2 - 1; return Math.sign(t) * (1 - (1 - Math.abs(t)) ** 1.6); };
  CARAS.forEach(([n, u, v], f) => {
    const base = pos.length / 3;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const a = paso(i), b = paso(j);
      const p = [0, 1, 2].map(k => n[k] + u[k] * a + v[k] * b);
      const c = p.map(x => Math.max(-(1 - R), Math.min(1 - R, x)));
      const d = p.map((x, k) => x - c[k]);
      const l = Math.hypot(...d);
      const m = d.map(x => x / l);
      pos.push(...c.map((x, k) => x + R * m[k]));
      nor.push(...m);
      // Cada cara ocupa una casilla de la tira de texturas
      uv.push((f + (a + 1) / 2) / 6, (1 - b) / 2);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const q = base + j * (N + 1) + i;
      idx.push(q, q + 1, q + N + 2, q, q + N + 2, q + N + 1);
    }
  });
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), idx: new Uint16Array(idx) };
}

/** La tira de texturas: seis casillas blancas con un emoji al centro. */
function texturas(emojis) {
  const L = 256;
  const c = document.createElement('canvas');
  c.width = L * 6; c.height = L;
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, c.width, c.height);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `${L * 0.5}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  emojis.forEach((e, i) => x.fillText(e, L * i + L / 2, L * 0.53));
  return c;
}

const VERT = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv;
uniform mat4 uModelo; uniform mat4 uProy;
varying vec3 vNor; varying vec2 vUv; varying vec3 vPos;
void main() {
  vec4 p = uModelo * vec4(aPos, 1.0);
  vPos = p.xyz; vNor = mat3(uModelo) * aNor; vUv = aUv;
  gl_Position = uProy * p;
}`;
const FRAG = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uCamara;
varying vec3 vNor; varying vec2 vUv; varying vec3 vPos;
void main() {
  vec3 n = normalize(vNor);
  vec3 l = normalize(vec3(-0.45, 0.75, 0.9));
  vec3 v = normalize(uCamara - vPos);
  float dif = max(dot(n, l), 0.0);
  // Un poco de luz que rebota desde abajo, para que la cara en sombra no quede gris sucio
  float reb = max(dot(n, vec3(0.0, -1.0, 0.3)), 0.0) * 0.08;
  float bri = pow(max(dot(reflect(-l, n), v), 0.0), 40.0) * 0.35;
  vec3 base = texture2D(uTex, vUv).rgb;
  gl_FragColor = vec4(base * (0.5 + 0.55 * dif + reb) + bri, 1.0);
}`;

const mul = (a, b) => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
};
const rotX = g => { const c = Math.cos(g), s = Math.sin(g); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
const rotY = g => { const c = Math.cos(g), s = Math.sin(g); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };

export function crearDado(lienzo, emojis) {
  const gl = lienzo.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) return null;
  const sombreador = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sombreador(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sombreador(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const m = malla();
  const atributo = (nombre, datos, n) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, nombre);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0);
  };
  atributo('aPos', m.pos, 3);
  atributo('aNor', m.nor, 3);
  atributo('aUv', m.uv, 2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texturas(emojis));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Cámara a 7 unidades, mirando el centro: el dado (lado 2) ocupa la mitad del lienzo
  const D = 7, MITAD = 2;
  const f = D / MITAD, cerca = 1, lejos = 20;
  const proy = new Float32Array([f, 0, 0, 0, 0, f, 0, 0, 0, 0, (lejos + cerca) / (cerca - lejos), -1, 0, 0, (2 * lejos * cerca) / (cerca - lejos), 0]);
  const vista = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -D, 1]);
  gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uProy'), false, proy);
  gl.uniform3f(gl.getUniformLocation(prog, 'uCamara'), 0, 0, 0);
  const uModelo = gl.getUniformLocation(prog, 'uModelo');
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const ajustar = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(lienzo.clientWidth * dpr), h = Math.round(lienzo.clientHeight * dpr);
    if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
    gl.viewport(0, 0, w, h);
  };

  return {
    dibujar(ax, ay) {
      ajustar();
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // La cámara está en el origen y el dado a D de distancia: el modelo lo trae hasta ahí
      gl.uniformMatrix4fv(uModelo, false, mul(vista, mul(rotX(ax * Math.PI / 180), rotY(ay * Math.PI / 180))));
      gl.drawElements(gl.TRIANGLES, m.idx.length, gl.UNSIGNED_SHORT, 0);
    },
  };
}
