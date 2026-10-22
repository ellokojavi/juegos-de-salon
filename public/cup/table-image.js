/**
 * La tabla de una copa como imagen (D-126, D-141, D-153): la que se comparte desde el tablero, el
 * podio y Administrar (game.js), y la que muestra el resumen de una copa terminada en la portada
 * (D-427, recap.js). Sin estado de la pantalla: recibe la copa, quién mira, la hora, los textos en
 * el idioma de la copa (D-170) y el link, y devuelve el archivo PNG.
 */
import { tabla, evolucion, terminada, menosJuegos, ultimoDiaVisto, diaActual, esFinal, marcaDelDia, provisoria } from './engine.js';
import { lamina, aArchivo, nombreArchivo, MARCO } from '../assets/js/compartir.js';

const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

/** Un color por jugador en el gráfico (D-125): los de la app, bien distintos entre sí. */
export const COLORES_GRAFICO = ['#2ee6d6', '#ffd23f', '#ff2e88', '#9dff3a', '#ff7a1a', '#a78bff', '#5ab0ff', '#ff9ecb', '#e8e8e8', '#c7a36b'];

/** Los jugadores por orden de inscripción, y el color fijo de cada uno (D-125). */
export const llegada = Lc => Object.entries(Lc.players || {}).sort((a, b) => (a[1].at || 0) - (b[1].at || 0)).map(([pid]) => pid);
export const colorDe = (Lc, pid) => COLORES_GRAFICO[Math.max(0, llegada(Lc).indexOf(pid)) % COLORES_GRAFICO.length];

/** La cabecera de la tabla, la misma en el texto y en la imagen (D-165): terminada, la final; si no, el día. */
export function cabeceraTabla(Lc, filas, now, T) {
  const { meta } = Lc;
  const cab = (emoji, contexto) => ({ emoji, titulo: fmt(T.shareHead, { copa: meta.name }), contexto });
  if (terminada(meta, now)) return cab('🏁', T.ctxFinal);
  const d = ultimoDiaVisto(filas) || Math.min(Math.max(diaActual(meta, now), 1), meta.days);
  return cab('📊', fmt(provisoria(Lc, filas, now) ? T.ctxTableProvisional : T.ctxTable, { d, n: meta.days }));
}

/** Oro, plata y bronce para el podio de la tabla final (D-153): degradado, borde y tinta grabada. */
const METALES = {
  1: { luz: '#fff6c2', medio: '#ffd23f', sombra: '#b8860b', borde: '#7a5500', tinta: '#3a2400' },
  2: { luz: '#ffffff', medio: '#d3dae6', sombra: '#8d97aa', borde: '#566074', tinta: '#1d2230' },
  3: { luz: '#ffd9b8', medio: '#d98a4e', sombra: '#9a5424', borde: '#5e2f10', tinta: '#2a1204' },
};

/**
 * La tabla parcial como imagen para compartir (D-126, D-141, D-153): a la izquierda, el gráfico
 * de posiciones con una columna por cada día que ya se ve (todos, sin saltarse ninguno); a la
 * derecha, la tabla. Gráfico y tabla comparten el eje: la línea de cada jugador termina en su
 * fila, así cada nombre aparece una sola vez. Cada punto dice qué pasó ese día: los puntos que
 * sacó (con anillo dorado si usó el comodín, cian en la final), "–" si no jugó un día que cerró
 * y "?" si todavía puede jugarlo. Con la copa terminada, el podio va en galvanos. Se dibuja en
 * un canvas de 1080 × 1350 (4:5) con las fuentes de la app, dentro del marco de toda imagen que
 * se comparte: arriba la misma cabecera del texto, abajo el link (D-165). Devuelve el archivo.
 */
export async function imagenDeTabla({ Lc, yo, now, T, code, url }) {
  const { meta } = Lc;
  const filas = tabla(Lc, yo, now);
  const fin = terminada(meta, now);
  // Terminada, nadie tiene juegos por jugar: sin pills ni su nota
  const menos = fin ? {} : menosJuegos(filas);
  const conPills = Object.values(menos).some(x => x > 0);
  const ev = evolucion(Lc, yo, now);
  // El último día que muestra la tabla, no el de hoy si quien comparte todavía no lo juega (#67)
  const d = ultimoDiaVisto(filas) || Math.min(Math.max(diaActual(meta, now), 1), meta.days);
  const n = filas.length;
  const W = 1080, ALTO = 1350; // hasta 4:5: se ve entera en WhatsApp y en el feed de Instagram
  // De arriba abajo (D-154): títulos, filas, rótulos de los días, leyenda y link. Las filas
  // crecen hasta llenar el 4:5, con tope para que pocos jugadores no queden gigantes; entonces la
  // imagen se acorta a lo que necesita, sin bajar de cuadrada. Lo que aún sobra se reparte
  // arriba y abajo del bloque, así nada queda pegado ni suelto
  const { arriba: ARRIBA, abajo: ABAJO } = MARCO, EJE = 60, HUECO = 40, LEYENDA = conPills ? 96 : 40;
  const resto = EJE + HUECO + LEYENDA;
  const fila = Math.max(60, Math.min(128, (ALTO - ARRIBA - ABAJO - resto) / Math.max(1, n)));
  const H = Math.max(W, ARRIBA + n * fila + resto + ABAJO);
  const g0 = ARRIBA + (H - ARRIBA - ABAJO - (n * fila + resto)) / 2;
  // El marco: el fondo, la cabecera del texto (el nombre de la copa y "Tabla de posiciones · día 3
  // de 7") y el link abajo
  const { cv, c } = await lamina({ alto: H, cab: cabeceraTabla(Lc, filas, now, T), url });
  const fuente = (peso, px, familia = 'Nunito, system-ui, sans-serif') => `${peso} ${px}px ${familia}`;
  const caja = (x0, y0, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x0, y0, w, h, r); else c.rect(x0, y0, w, h); };
  const circulo = (cx, cy, r) => { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); };
  const TINTA = '#1a0f33'; // el número dentro de un punto, y el fondo de los puntos huecos
  // El eje que comparten: el centro de la fila i (0 = arriba) es también la altura del lugar i+1
  const yFila = i => g0 + (i + 0.5) * fila;
  const color = pid => colorDe(Lc, pid);
  const izq = 70, tabla0 = 530, derTabla = W - 40; // el gráfico va de izq a tabla0 - 40
  const m = ev.dias.length;
  const x = i => (m <= 1 ? izq : izq + (i * (tabla0 - 40 - izq)) / (m - 1));
  // El radio de los puntos: que quepa un número de dos cifras y no choquen con el vecino
  const R = Math.max(10, Math.min(22, m <= 1 ? 22 : (tabla0 - 40 - izq) / (m - 1) / 2 - 7, fila * 0.2));
  // Una guía por fila y el rótulo de cada día que se ve; la final dice "Final ×2" y sigue hacia la tabla
  c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.10)';
  for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(izq, yFila(i)); c.lineTo(tabla0, yFila(i)); c.stroke(); }
  c.font = fuente(800, m > 10 ? 22 : 28);
  ev.dias.forEach((dia, i) => {
    const laFinal = esFinal(meta, dia);
    c.fillStyle = laFinal ? '#2ee6d6' : 'rgba(255,255,255,0.7)'; c.textAlign = laFinal ? 'left' : 'center';
    c.fillText(laFinal ? T.imageFinal : fmt(T.dayShort, { d: dia }), laFinal ? x(i) - R - 4 : x(i), g0 + n * fila + 44);
  });
  // Las filas de la tabla, detrás de las líneas que llegan a ellas. Terminada, el podio en galvanos.
  const filaDe = Object.fromEntries(filas.map((f, i) => [f.pid, i]));
  // Out of the cup (D-347): their line, dots and row faded, 🚪 for a place and "Eliminado" (D-376)
  const afuera = new Set(filas.filter(f => f.fuera).map(f => f.pid));
  const TENUE = 0.35;
  const metal = f => (fin ? METALES[f.lugar] : null);
  filas.forEach((f, i) => {
    const y0 = yFila(i) - fila * 0.43, h = fila * 0.86, w = derTabla - tabla0, mia = f.pid === yo, mt = metal(f);
    if (mt) {
      const brillo = c.createLinearGradient(0, y0, 0, y0 + h);
      brillo.addColorStop(0, mt.luz); brillo.addColorStop(0.45, mt.medio); brillo.addColorStop(1, mt.sombra);
      c.fillStyle = brillo; caja(tabla0, y0, w, h, 14); c.fill();
      c.lineWidth = 3; c.strokeStyle = mt.borde; c.stroke();
      // El filete interior y los cuatro remaches de la placa
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.65)'; caja(tabla0 + 7, y0 + 7, w - 14, h - 14, 9); c.stroke();
      c.fillStyle = mt.borde;
      for (const [rx, ry] of [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]]) { circulo(tabla0 + rx, y0 + ry, 3); c.fill(); }
      if (mia) { c.lineWidth = 4; c.strokeStyle = '#2ee6d6'; caja(tabla0 - 5, y0 - 5, w + 10, h + 10, 18); c.stroke(); }
      return;
    }
    c.fillStyle = mia ? 'rgba(46,230,214,0.18)' : 'rgba(0,0,0,0.28)';
    caja(tabla0, y0, w, h, 18); c.fill();
    if (mia) { c.lineWidth = 4; c.strokeStyle = '#2ee6d6'; c.stroke(); }
  });
  // Qué pasó con cada uno cada día (D-153)
  const marcas = Object.fromEntries(filas.map(f => [f.pid, ev.dias.map(dia => marcaDelDia(Lc, f, dia, now))]));
  // Los empatados comparten lugar: sus líneas van lado a lado, como las de un plano de metro,
  // en el orden de la tabla de hoy, con aire para que sus puntos no se tapen
  const junto = ev.dias.map((_, i) => {
    const grupos = {};
    ev.filas.filter(f => f.lugares[i]).sort((a, b) => (filaDe[a.pid] ?? n) - (filaDe[b.pid] ?? n))
      .forEach(f => (grupos[f.lugares[i]] ||= []).push(f.pid));
    const r = {};
    for (const g of Object.values(grupos)) {
      const paso = Math.min(R * 2 + 4, fila / g.length);
      // Si el grupo no cabe con puntos enteros, sus puntos se achican: juntos, pero sin taparse
      g.forEach((pid, k) => { r[pid] = { dy: (k - (g.length - 1) / 2) * paso, r: g.length > 1 ? Math.max(9, Math.min(R, paso / 2 - 1)) : R }; });
    }
    return r;
  });
  // Las líneas: una columna por día visto; el último punto cae en la fila del jugador y de ahí
  // sigue derecho hasta ella. La tuya, más gruesa y encima. El tramo que llega a un día que
  // todavía puede jugar va punteado: de ahí sale lo provisorio.
  const orden = [...ev.filas.filter(f => f.pid !== yo), ...ev.filas.filter(f => f.pid === yo)]
    .filter(f => f.lugares.length && filaDe[f.pid] !== undefined);
  const puntos = f => f.lugares.map((l, i) => [x(i), (i === m - 1 ? yFila(filaDe[f.pid]) : yFila(l - 1) + junto[i][f.pid].dy)]);
  const PUNTEADO = [2, 14];
  for (const f of orden) {
    const pts = puntos(f), mia = f.pid === yo, mk = marcas[f.pid];
    c.globalAlpha = afuera.has(f.pid) ? TENUE : 1;
    c.strokeStyle = color(f.pid); c.lineWidth = mia ? 10 : 6; c.lineJoin = 'round'; c.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      c.setLineDash(mk[i]?.tipo === 'falta' ? PUNTEADO : []);
      c.beginPath(); c.moveTo(...pts[i - 1]); c.lineTo(...pts[i]); c.stroke();
    }
    const [ux, uy] = pts[pts.length - 1];
    c.setLineDash(mk[pts.length - 1]?.tipo === 'falta' ? PUNTEADO : []);
    c.beginPath(); c.moveTo(ux, uy); c.lineTo(tabla0 + 6, uy); c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
  }
  // Los puntos, encima de todas las líneas
  const pildora = (cx, cy, txt) => {
    c.font = fuente(900, Math.round(R * 0.62)); const w = c.measureText(txt).width + 10, h = R * 0.78;
    c.fillStyle = '#ffd23f'; caja(cx - w / 2, cy - h / 2, w, h, h / 2); c.fill();
    c.fillStyle = TINTA; c.textAlign = 'center'; c.fillText(txt, cx, cy + h * 0.3);
  };
  // Un punto: lo usa el gráfico y la leyenda, así los dos se ven iguales
  const punto = (cx, cy, r, mk, col) => {
    c.textAlign = 'center';
    if (mk.tipo === 'falta') {
      c.fillStyle = TINTA; circulo(cx, cy, r); c.fill();
      c.setLineDash([5, 5]); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); c.setLineDash([]);
      c.fillStyle = col; c.font = fuente(900, r * 0.95); c.fillText('?', cx, cy + r * 0.34);
    } else if (mk.tipo === 'no') {
      c.fillStyle = TINTA; circulo(cx, cy, r * 0.72); c.fill();
      const a0 = c.globalAlpha; // multiplied, so a faded player's dot stays faded (D-376)
      c.globalAlpha = a0 * 0.55; c.lineWidth = 3; c.strokeStyle = col; c.stroke();
      c.fillStyle = col; c.font = fuente(900, r * 0.8); c.fillText('–', cx, cy + r * 0.28);
      c.globalAlpha = a0;
    } else {
      c.fillStyle = col; circulo(cx, cy, r); c.fill();
      if (mk.tipo === 'comodin' || mk.final) { c.lineWidth = 4; c.strokeStyle = mk.tipo === 'comodin' ? '#ffd23f' : '#2ee6d6'; circulo(cx, cy, r + 4); c.stroke(); }
      const t = String(mk.pts);
      c.fillStyle = TINTA; c.font = fuente(900, t.length > 1 ? r * 0.88 : r); c.fillText(t, cx, cy + r * 0.33);
    }
  };
  for (const f of orden) {
    const mia = f.pid === yo;
    puntos(f).forEach(([px, py], i) => {
      const base = i === m - 1 ? R : junto[i][f.pid].r; // el último cae en su fila, sin apretura
      const mk = marcas[f.pid][i], r = mia ? base + 2 : base;
      c.globalAlpha = afuera.has(f.pid) ? TENUE : 1;
      punto(px, py, r, mk, color(f.pid));
      if (mk.tipo === 'comodin') pildora(px + r * 0.95, py - r * 0.95, T.x2);
      c.globalAlpha = 1;
    });
  }
  // La pill de juegos por jugar: borde punteado, como el punto "?"; devuelve su ancho
  const pill = (x0, cy, k, px) => {
    c.font = fuente(900, px); const txt = fmt(T.fewerGamesPill, { n: k });
    const w = c.measureText(txt).width + px * 1.1, h = px * 1.55;
    c.fillStyle = 'rgba(255,255,255,0.10)'; caja(x0, cy - h / 2, w, h, h / 2); c.fill();
    c.setLineDash([4, 4]); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.fillText(txt, x0 + px * 0.55, cy + px * 0.36);
    return w;
  };
  const anchoPill = (k, px) => { c.font = fuente(900, px); return c.measureText(fmt(T.fewerGamesPill, { n: k })).width + px * 1.1; };
  // "Eliminado" after the name of whoever is out of the cup (D-376): a plain outline, not the dashed "-1J"
  const ELIMINADO = T.outBadge.toUpperCase();
  const anchoFuera = px => { c.font = fuente(900, px); return c.measureText(ELIMINADO).width + px * 1.3; };
  const pillFuera = (x0, cy, px) => {
    const w = anchoFuera(px), h = px * 1.6;
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,0.8)'; caja(x0, cy - h / 2, w, h, h / 2); c.stroke();
    c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.font = fuente(900, px); c.fillText(ELIMINADO, x0 + px * 0.65, cy + px * 0.36);
  };
  // El texto de cada fila: lugar, flecha, nombre (con su pill o la copa del campeón) y puntos
  const tamFila = Math.round(Math.min(42, fila * 0.4));
  // Lugar, flecha y nombre se corren con la letra
  const xLugar = tabla0 + tamFila * 1.1, xFlecha = tabla0 + tamFila * 2.15, xNombre = tabla0 + tamFila * 2.75;
  filas.forEach((f, i) => {
    const y = yFila(i) + tamFila * 0.36, mt = metal(f), out = afuera.has(f.pid);
    c.globalAlpha = out ? 0.5 : 1;
    // En el galvano, letra grabada: tinta oscura con un reflejo claro abajo
    const escribir = (t, px, color) => {
      if (mt) { c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillText(t, px, y + 2); c.fillStyle = mt.tinta; } else c.fillStyle = color;
      c.fillText(t, px, y);
    };
    c.textAlign = 'center'; c.font = fuente(900, tamFila);
    escribir(out ? '🚪' : String(f.lugar), xLugar, '#ffd23f');
    if (f.flecha) { c.font = fuente(900, tamFila * 0.6); c.fillStyle = f.flecha > 0 ? '#9dff3a' : '#ff2e88'; c.fillText(f.flecha > 0 ? '▲' : '▼', xFlecha, y - 2); }
    c.textAlign = 'right'; c.font = fuente(900, tamFila);
    const total = `${f.total} ${T.pts}`;
    escribir(total, derTabla - 22, '#ffd23f');
    // Lo que va después del nombre: la copa del campeón o la pill; el nombre achica la letra
    // para que todo quepa antes de los puntos y, si aún no cabe, se corta con "…"
    const copa = fin && f.lugar === 1, k = menos[f.pid] || 0;
    const extra = t => (copa ? 14 + t * 1.15 : out ? 16 + anchoFuera(Math.round(t * 0.5)) : k ? 16 + anchoPill(k, Math.round(t * 0.62)) : 0);
    const libre = derTabla - 22 - c.measureText(total).width - 20 - xNombre;
    const peso = mt ? 900 : 800;
    let nombre = f.name, t = tamFila;
    const ancho = () => { c.font = fuente(peso, t); return c.measureText(nombre).width + extra(t); };
    while (ancho() > libre && t > 20) t -= 2;
    while (ancho() > libre && nombre.length > 1) nombre = `${nombre.replace(/…$/, '').slice(0, -1)}…`;
    c.font = fuente(peso, t); c.textAlign = 'left';
    escribir(nombre, xNombre, '#ffffff');
    const tras = xNombre + c.measureText(nombre).width + 14;
    if (copa) { c.font = fuente(900, t); c.fillText('🏆', tras, y); }
    if (out) pillFuera(tras + 2, yFila(i), Math.round(t * 0.5));
    else if (k) pill(tras + 2, yFila(i), k, Math.round(t * 0.62));
    c.globalAlpha = 1;
  });
  // La leyenda: los mismos puntos del gráfico, solo los que aparecen en él
  const hay = new Set(Object.values(marcas).flat().map(mk => mk.tipo));
  const items = [
    ['pts', { tipo: 'pts', pts: 12 }, T.imageLegendPts], ['comodin', { tipo: 'comodin', pts: 10 }, T.imageLegendWild],
    ['no', { tipo: 'no' }, T.imageLegendMissed], ['falta', { tipo: 'falta' }, T.imageLegendPending],
  ].filter(([tipo]) => hay.has(tipo));
  // La leyenda va justo bajo los rótulos de los días, no pegada al link
  const ly = g0 + n * fila + EJE + HUECO + 17, rl = 17;
  c.font = fuente(800, 26);
  const anchos = items.map(([, , txt]) => rl * 2 + 12 + c.measureText(txt).width);
  let lx = (W - anchos.reduce((a, b) => a + b, 0) - 36 * Math.max(0, items.length - 1)) / 2;
  items.forEach(([tipo, mk, txt], k) => {
    punto(lx + rl, ly, rl, mk, '#ffffff');
    c.textAlign = 'left'; c.font = fuente(800, 26); c.fillStyle = tipo === 'comodin' ? '#ffd23f' : 'rgba(255,255,255,0.85)';
    c.fillText(txt, lx + rl * 2 + 12, ly + 9);
    lx += anchos[k] + 36;
  });
  if (conPills) {
    c.font = fuente(700, 26);
    const wp = anchoPill(1, 22), wn = c.measureText(T.imagePillNote).width, x0 = (W - wp - 14 - wn) / 2;
    pill(x0, ly + 50, 1, 22);
    c.font = fuente(700, 26); c.fillStyle = 'rgba(255,255,255,0.6)'; c.textAlign = 'left';
    c.fillText(T.imagePillNote, x0 + wp + 14, ly + 59);
  }
  return aArchivo(cv, nombreArchivo('copa', meta.alias || code, fin ? 'tabla-final' : `dia-${d}`));
}
