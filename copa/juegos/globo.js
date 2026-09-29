/**
 * 🌍 El globo de ¿Dónde queda?, dibujado en un canvas: lo usan el juego (que lo gira, lo acerca y
 * lo toca) y la portada (que lo deja girando solo). Sin DOM propio ni estado: recibe la vista.
 *
 * Cada país se pasa una sola vez a vectores de la esfera; dibujar es girarlos hacia la vista
 * (`ver` del motor) y recortar lo que queda detrás. Donde un país cruza el borde del globo, el
 * recorte sigue el borde: si no, se vería una cuerda recta atravesando el disco.
 *
 * Los colores son los del afiche de "Próximamente": mar azul con brillo, tierra verde clara.
 */
import { MAPA } from './mapa.js';
import { vector, UNIDADES_POR_GRADO as U } from './donde.js';

const RAD = Math.PI / 180;

/** Los anillos del mapa como vectores [x, y, z, x, y, z, …], leídos de la ruta una sola vez. */
let ANILLOS = null, LIVIANOS = null;
function anillos() {
  if (ANILLOS) return ANILLOS;
  ANILLOS = [];
  for (const parte of MAPA.d.split('z')) {
    const nums = parte.match(/-?\d+/g);
    if (!nums) continue;
    let x = +nums[0], y = +nums[1];
    const v = [...vector(y / U, x / U)];
    for (let i = 2; i < nums.length; i += 2) {
      x += +nums[i]; y += +nums[i + 1];
      v.push(...vector(y / U, x / U));
    }
    ANILLOS.push(Float64Array.from(v));
  }
  return ANILLOS;
}

/** Para la portada, que se dibuja 30 veces por segundo en chico: uno de cada cuatro puntos. */
function livianos() {
  if (LIVIANOS) return LIVIANOS;
  LIVIANOS = anillos().filter(a => a.length >= 3 * 12).map(a => {
    const out = [];
    for (let i = 0; i < a.length; i += 12) out.push(a[i], a[i + 1], a[i + 2]);
    return Float64Array.from(out);
  });
  return LIVIANOS;
}

/** Meridianos y paralelos cada 30°, como polilíneas de vectores. */
const RETICULA = (() => {
  const lineas = [];
  for (let lon = -180; lon < 180; lon += 30) { const l = []; for (let lat = -90; lat <= 90; lat += 3) l.push(vector(lat, lon)); lineas.push(l); }
  for (let lat = -60; lat <= 60; lat += 30) { const l = []; for (let lon = -180; lon <= 180; lon += 3) l.push(vector(lat, lon)); lineas.push(l); }
  return lineas;
})();

/** La vista lista para girar: senos y cosenos del centro, centro y radio en pantalla. */
export function vista({ centro: [lat0, lon0], r, cx, cy }) {
  return { s0: Math.sin(lat0 * RAD), c0: Math.cos(lat0 * RAD), sl: Math.sin(lon0 * RAD), cl: Math.cos(lon0 * RAD), r, cx, cy };
}

/** Un vector a pantalla: [px, py, prof]. Es `ver` del motor, desenrollado porque se llama miles de veces. */
const girar = (V, X, Y, Z) => {
  const A = X * V.cl + Y * V.sl, B = Y * V.cl - X * V.sl;
  return [V.cx + V.r * B, V.cy - V.r * (V.c0 * Z - V.s0 * A), V.s0 * Z + V.c0 * A];
};

/** El arco por el borde del globo, de un ángulo a otro por el lado corto. */
function porElBorde(ctx, V, a0, a1) {
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const pasos = Math.max(1, Math.ceil(Math.abs(d) / 0.08));
  for (let j = 1; j <= pasos; j++) { const a = a0 + (d * j) / pasos; ctx.lineTo(V.cx + V.r * Math.cos(a), V.cy - V.r * Math.sin(a)); }
}

/** Traza un anillo recortado a la cara visible (Sutherland–Hodgman contra el plano prof = 0). */
function trazarAnillo(ctx, V, a) {
  const n = a.length / 3;
  const P = new Float64Array(n * 3);
  let primero = -1;
  for (let i = 0; i < n; i++) {
    const [x, y, d] = girar(V, a[3 * i], a[3 * i + 1], a[3 * i + 2]);
    P[3 * i] = x; P[3 * i + 1] = y; P[3 * i + 2] = d;
    if (primero < 0 && d > 0) primero = i;
  }
  if (primero < 0) return;
  const borde = (i, j) => {
    // Donde el tramo cruza el borde, llevado justo al borde del disco
    const di = P[3 * i + 2], dj = P[3 * j + 2], t = di / (di - dj);
    const x = P[3 * i] + (P[3 * j] - P[3 * i]) * t - V.cx, y = V.cy - (P[3 * i + 1] + (P[3 * j + 1] - P[3 * i + 1]) * t);
    return Math.atan2(y, x);
  };
  ctx.moveTo(P[3 * primero], P[3 * primero + 1]);
  let prev = primero, salida = null;
  for (let k = 1; k <= n; k++) {
    const i = (primero + k) % n;
    const vis = P[3 * i + 2] > 0, visPrev = P[3 * prev + 2] > 0;
    if (vis && visPrev) ctx.lineTo(P[3 * i], P[3 * i + 1]);
    else if (visPrev && !vis) { salida = borde(prev, i); ctx.lineTo(V.cx + V.r * Math.cos(salida), V.cy - V.r * Math.sin(salida)); }
    else if (!visPrev && vis) { porElBorde(ctx, V, salida, borde(prev, i)); ctx.lineTo(P[3 * i], P[3 * i + 1]); }
    prev = i;
  }
  ctx.closePath();
}

/** Una polilínea sobre la esfera, cortada donde pasa por detrás. */
function trazarLinea(ctx, V, puntos) {
  let antes = false;
  for (const [X, Y, Z] of puntos) {
    const [x, y, d] = girar(V, X, Y, Z);
    if (d > 0) { if (antes) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    antes = d > 0;
  }
}

/** Dónde se ve un lugar: [px, py] o `null` si está del otro lado. */
export function enPantalla(V, lat, lon) {
  const [x, y, d] = girar(V, ...vector(lat, lon));
  return d > 0 ? [x, y] : null;
}

/** El arco más corto entre dos lugares, como puntos de la esfera. */
function arco(a, b, n = 96) {
  const va = vector(...a), vb = vector(...b);
  const th = Math.acos(Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])));
  if (th < 1e-6) return [va];
  const out = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n, f = Math.sin((1 - t) * th) / Math.sin(th), g = Math.sin(t * th) / Math.sin(th);
    out.push([f * va[0] + g * vb[0], f * va[1] + g * vb[1], f * va[2] + g * vb[2]]);
  }
  return out;
}

/** El alfiler rosado del afiche, con la punta en (x, y); `k` es su tamaño. */
function alfiler(ctx, x, y, k = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(k, k);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.bezierCurveTo(-2, -7, -10, -11, -10, -19);
  ctx.arc(0, -19, 10, Math.PI, 0); ctx.bezierCurveTo(10, -11, 2, -7, 0, 0);
  ctx.fillStyle = '#ff2e88'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -19, 4, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
}

/**
 * Con perspectiva (la portada, que gira): el aro está pintado sobre la esfera, así que hacia el
 * borde se achata en la dirección del radio, tanto como el coseno del ángulo con que se lo mira
 * (`prof`); el alfiler se achica y se desvanece al irse por detrás, en vez de desaparecer de golpe.
 */
function blancoEnPerspectiva(ctx, V, x, y, prof, k) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, prof * 4);
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(y - V.cy, x - V.cx));
  ctx.scale(Math.max(0.04, prof), 1);
  blanco(ctx, 0, 0, k);
  ctx.restore();
}
function alfilerEnPerspectiva(ctx, x, y, prof, k) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, prof * 3);
  alfiler(ctx, x, y, k * (0.35 + 0.65 * prof));
  ctx.restore();
}

/** La ciudad de verdad: un punto amarillo con su aro. */
function blanco(ctx, x, y, k = 1) {
  ctx.beginPath(); ctx.arc(x, y, 13 * k, 0, 2 * Math.PI); ctx.lineWidth = 3 * k; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 6 * k, 0, 2 * Math.PI); ctx.fillStyle = '#ffd23f'; ctx.fill();
  ctx.lineWidth = 2 * k; ctx.strokeStyle = '#3a1200'; ctx.stroke();
}

/**
 * Dibuja el globo. `vistaDe` sale de `vista()`; `marcas` puede traer `alfiler: [lat, lon]`,
 * `ciudad: [lat, lon]` y `linea: true` (el arco entre los dos); `liviano` usa menos puntos.
 */
export function dibujar(ctx, w, h, V, { marcas = {}, liviano = false, escala = 1, perspectiva = false, satelital = false } = {}) {
  ctx.clearRect(0, 0, w, h);
  const { cx, cy, r } = V;
  // Halo, como en el afiche
  const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.12);
  halo.addColorStop(0, 'rgba(90, 200, 255, 0.45)'); halo.addColorStop(1, 'rgba(90, 200, 255, 0)');
  // Solo por fuera del disco: por dentro teñiría la imagen satelital, que va debajo
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 1.12, 0, 2 * Math.PI); ctx.arc(cx, cy, r, 0, 2 * Math.PI, true); ctx.fill();
  // Con la imagen satelital debajo (otro canvas), aquí va solo lo de encima: la retícula, la
  // sombra, el brillo y las marcas
  if (!satelital) {
  // El mar, más claro arriba a la izquierda
  const mar = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
  mar.addColorStop(0, '#6fd0ff'); mar.addColorStop(0.55, '#2a7fe0'); mar.addColorStop(1, '#0c3c96');
  ctx.fillStyle = mar; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
  }
  // Meridianos y paralelos
  ctx.beginPath();
  for (const l of RETICULA) trazarLinea(ctx, V, l);
  ctx.lineWidth = 1; ctx.strokeStyle = satelital ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.16)'; ctx.stroke();
  // La tierra, sin fronteras (D-158): los países se rellenan juntos y no se trazan sus bordes
  if (!satelital) {
    ctx.beginPath();
    for (const a of liviano ? livianos() : anillos()) trazarAnillo(ctx, V, a);
    ctx.fillStyle = '#8ee06a'; ctx.fill('evenodd');
  }
  // Sombra en el borde y brillo, para que se lea como esfera
  const sombra = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.5, cx, cy, r);
  sombra.addColorStop(0, 'rgba(0,0,40,0)'); sombra.addColorStop(1, 'rgba(0,0,40,0.38)');
  ctx.fillStyle = sombra; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
  const brillo = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.48, 0, cx - r * 0.42, cy - r * 0.48, r * 0.45);
  brillo.addColorStop(0, 'rgba(255,255,255,0.28)'); brillo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = brillo; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
  // El arco entre el alfiler y la ciudad, la ciudad y el alfiler
  if (marcas.linea && marcas.alfiler && marcas.ciudad) {
    ctx.beginPath(); trazarLinea(ctx, V, arco(marcas.alfiler, marcas.ciudad));
    ctx.setLineDash([6 * escala, 5 * escala]); ctx.lineWidth = 2.5 * escala; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); ctx.setLineDash([]);
  }
  if (perspectiva) {
    const c = marcas.ciudad && girar(V, ...vector(...marcas.ciudad));
    if (c && c[2] > 0) blancoEnPerspectiva(ctx, V, c[0], c[1], c[2], escala);
    const p = marcas.alfiler && girar(V, ...vector(...marcas.alfiler));
    if (p && p[2] > 0) alfilerEnPerspectiva(ctx, p[0], p[1], p[2], escala);
    return;
  }
  const c = marcas.ciudad && enPantalla(V, ...marcas.ciudad);
  if (c) blanco(ctx, c[0], c[1], escala);
  const p = marcas.alfiler && enPantalla(V, ...marcas.alfiler);
  if (p) alfiler(ctx, p[0], p[1], escala);
}

/** Ajusta el canvas a su tamaño en pantalla y a la densidad del celular; devuelve [w, h] en CSS. */
export function ajustar(canvas) {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
  const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  return [r.width, r.height];
}

/* ---------- La imagen satelital (D-159) ---------- */

/**
 * La Tierra vista desde el satélite (Blue Marble de la NASA, septiembre de 2004), pegada al globo
 * con WebGL: cada píxel del disco se invierte a latitud y longitud y se lee de la imagen. La chica
 * llega primero; la nítida la reemplaza cuando termina de bajar. Sin WebGL, o mientras no llega
 * ninguna, el globo se dibuja como antes, con el mapa vectorial.
 */
const IMAGENES = [2048, 4096].map(w => ({ w, url: new URL(`../../assets/img/tierra-2004-09-${w}.jpg`, import.meta.url).href }));
let cargadas = null;
const avisos = new Set();
/** Las imágenes que ya llegaron, de la más nítida a la más chica. Pide bajarlas la primera vez. */
function imagenes() {
  if (!cargadas) {
    cargadas = [];
    for (const { w, url } of IMAGENES) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { cargadas.push({ w, img }); cargadas.sort((a, b) => b.w - a.w); for (const f of avisos) f(); };
      img.src = url;
    }
  }
  return cargadas;
}

const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = (derivadas) => `${derivadas ? '#extension GL_OES_standard_derivatives : enable\n' : ''}precision highp float;
uniform sampler2D t;
uniform vec2 c;      // centro del globo, en píxeles del canvas (y desde abajo)
uniform float r;     // radio, en píxeles del canvas
uniform vec4 giro;   // sen y cos de la latitud y de la longitud del centro
void main() {
  float x = (gl_FragCoord.x - c.x) / r, y = (gl_FragCoord.y - c.y) / r;
  float q = x * x + y * y;
  if (q > 1.0) discard;
  float prof = sqrt(1.0 - q);
  float Z = giro.y * y + giro.x * prof, A = -giro.x * y + giro.y * prof;
  float X = A * giro.w - x * giro.z, Y = A * giro.z + x * giro.w;
  float u = atan(Y, X) / 6.2831853 + 0.5, v = 0.5 - asin(clamp(Z, -1.0, 1.0)) / 3.1415927;
  ${derivadas
    // En la línea de cambio de fecha u salta de 1 a 0: se elige la versión de u que no salta ahí,
    // para que el mipmap no dibuje una costura (Tarini)
    ? 'float u2 = fract(u + 0.5) - 0.5; if (fwidth(u2) < fwidth(u) - 0.001) u = u2;'
    : ''}
  vec3 col = texture2D(t, vec2(u, v)).rgb;
  // Un poco más clara que el original, que en un celular se ve oscura; el borde, suavizado
  col = pow(col, vec3(0.85));
  float a = clamp((1.0 - sqrt(q)) * r / 1.5, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`;

/**
 * Prepara un canvas con WebGL para dibujar la Tierra. Devuelve `{ dibujar(V, w, h), lista() }`, o
 * `null` si el navegador no tiene WebGL. `alLlegar` se llama cuando una imagen nueva está lista.
 */
export function satelite(canvas, alLlegar) {
  let gl = null;
  try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false }); } catch { /* sin WebGL */ }
  if (!gl) return null;
  const derivadas = !!gl.getExtension('OES_standard_derivatives');
  const programa = gl.createProgram();
  for (const [tipo, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG(derivadas)]]) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    gl.attachShader(programa, s);
  }
  gl.linkProgram(programa);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) return null;
  gl.useProgram(programa);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(programa, 'p');
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(programa, n);
  const [uC, uR, uGiro] = [U('c'), U('r'), U('giro')];
  const tex = gl.createTexture();
  const maximo = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  let subida = 0;

  const subir = () => {
    // La más nítida que ya llegó y que este celular acepta
    const mejor = imagenes().find(x => x.w <= maximo);
    if (!mejor || mejor.w === subida) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, mejor.img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Sin derivadas no se puede evitar la costura del mipmap: se lee sin mipmap
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, derivadas ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    subida = mejor.w;
  };
  const aviso = () => { subir(); alLlegar?.(); };
  avisos.add(aviso);
  subir();

  return {
    lista: () => subida > 0,
    dibujar(V, w, h) {
      if (!canvas.isConnected) { avisos.delete(aviso); return; }
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const W = Math.round(w * dpr), H = Math.round(h * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (!subida) return;
      gl.uniform2f(uC, V.cx * dpr, H - V.cy * dpr);
      gl.uniform1f(uR, V.r * dpr);
      gl.uniform4f(uGiro, V.s0, V.c0, V.sl, V.cl);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
