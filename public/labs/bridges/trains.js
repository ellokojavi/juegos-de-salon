/**
 * 🚂 Tren en Vilo — train designs for the house style (lab, owner's request 2026-10-25): the first neon
 * train looked too childish, so these try smoother, metallic, more modern trains. `?train=<id>` picks one
 * in the game (with `?style=neon`); `trains/` shows them all side by side to choose.
 *
 * Each design draws in art units (16 per grid unit) with its bottom-centre on the rails, at the sizes the
 * game expects: the front car about 22 long and the wagons 16, up to 14 high. `humo` is where the smoke
 * comes out (null: an electric train, no smoke) and `luz` where the headlight is, both from the front
 * car's bottom-centre.
 */

const OSCURO = '#14081f';

function caja(ctx, x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function circulo(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function brilla(ctx, color, blur, fn) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }
/** Fills a path and keeps it as a clip for what follows (stripes, windows), until restore. */
function cuerpo(ctx, trazar, relleno) {
  ctx.save(); ctx.beginPath(); trazar(); ctx.fillStyle = relleno; ctx.fill(); ctx.clip();
}

/** Polished metal, lit from above: bright top, a sharp highlight, a dark band, the floor's reflection low. */
function cromo(ctx, top, bottom, tinte = [200, 205, 230]) {
  const g = ctx.createLinearGradient(0, top, 0, bottom), [r, gg, b] = tinte;
  const c = (k, a = 1) => `rgba(${Math.round(r * k)},${Math.round(gg * k)},${Math.round(b * k)},${a})`;
  g.addColorStop(0, c(1.08)); g.addColorStop(0.18, c(0.92)); g.addColorStop(0.24, '#ffffff'); g.addColorStop(0.3, c(0.95));
  g.addColorStop(0.58, c(0.55)); g.addColorStop(0.8, c(0.38)); g.addColorStop(0.9, c(0.7)); g.addColorStop(1, c(0.45));
  return g;
}
/** A glossy dark finish (window glass, black enamel): a reflection streak over a deep color. */
function vidrio(ctx, top, bottom, base = '#140a2a') {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#3a2a6a'); g.addColorStop(0.35, base); g.addColorStop(1, '#07030f');
  return g;
}
/** A diagonal reflection streak across a window, from (x, top) leaning right. */
function reflejo(ctx, x, top, bottom, ancho = 1.2) {
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + ancho, top); ctx.lineTo(x + ancho - (bottom - top) * 0.5, bottom); ctx.lineTo(x - (bottom - top) * 0.5, bottom); ctx.closePath(); ctx.fill();
}
/** Small bogie wheels peeking under a skirt. */
function bogies(ctx, xs, giro, r = 1.15) {
  for (const x of xs) {
    circulo(ctx, x, -r, r, '#1a1030');
    ctx.strokeStyle = 'rgba(210,215,240,0.6)'; ctx.lineWidth = 0.25; ctx.beginPath(); ctx.arc(x, -r, r - 0.25, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(210,215,240,0.35)'; ctx.beginPath(); ctx.moveTo(x - Math.cos(giro) * (r - 0.4), -r - Math.sin(giro) * (r - 0.4)); ctx.lineTo(x + Math.cos(giro) * (r - 0.4), -r + Math.sin(giro) * (r - 0.4)); ctx.stroke();
  }
}
/** A row of lit windows (the warm light of the passengers), each with its reflection. */
function ventanas(ctx, xs, top, alto, ancho, r = 0.6, luz = '#ffd98a') {
  brilla(ctx, luz, 3, () => { for (const x of xs) caja(ctx, x, top, ancho, alto, r, luz); });
  for (const x of xs) { ctx.save(); ctx.beginPath(); ctx.roundRect(x, top, ancho, alto, r); ctx.clip(); reflejo(ctx, x + ancho * 0.55, top, top + alto, ancho * 0.18); ctx.restore(); }
}

/* ------------------------------------------------------------------ */
/* A · Bala: a high-speed train, chrome with a long nose                 */
/* ------------------------------------------------------------------ */
const bala = {
  id: 'bala', nombre: 'Bala', lema: 'Un tren de alta velocidad: cromado, nariz larga y una franja rosada.',
  humo: null, luz: { dx: 11, dy: -3.8 },
  frente(ctx, x, y, { giro = 0 } = {}) {
    ctx.save(); ctx.translate(x, y);
    caja(ctx, -11, -2.6, 20, 1.4, 0.4, OSCURO);
    bogies(ctx, [-8, -4.6, 2.4, 5.8], giro);
    cuerpo(ctx, () => {
      ctx.moveTo(-11, -2.4); ctx.lineTo(-11, -10); ctx.quadraticCurveTo(-11, -11.2, -9.8, -11.2); ctx.lineTo(0, -11.2);
      ctx.bezierCurveTo(6.5, -11.2, 11.4, -7.4, 11.9, -3.6); ctx.quadraticCurveTo(12, -2.4, 10.6, -2.4); ctx.closePath();
    }, cromo(ctx, -11.2, -2.4));
    // The stripe sweeping along the side and down the nose
    ctx.fillStyle = '#ff2e88'; ctx.fillRect(-11, -5.4, 24, 0.8);
    ctx.fillStyle = 'rgba(46,230,214,0.9)'; ctx.fillRect(-11, -4.4, 24, 0.3);
    // The windows band and the cockpit's sloped windscreen
    ctx.fillStyle = vidrio(ctx, -9.6, -7.2); ctx.beginPath(); ctx.roundRect(-10.2, -9.4, 10.2, 2, 0.8); ctx.fill();
    ventanas(ctx, [-9.6, -6.6, -3.6], -9.1, 1.4, 2.2, 0.5);
    ctx.fillStyle = vidrio(ctx, -10, -7); ctx.beginPath(); ctx.moveTo(1.6, -10.4); ctx.bezierCurveTo(5, -10.3, 7.6, -8.6, 8.6, -7.2); ctx.lineTo(2.2, -7.2); ctx.closePath(); ctx.fill();
    reflejo(ctx, 4.6, -10, -7.4, 0.7);
    ctx.restore();
    // The headlight
    brilla(ctx, '#ffffff', 6, () => { ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.ellipse(10.6, -3.9, 0.9, 0.4, -0.5, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  },
  vagon(ctx, x, y, carga = 1, giro = 0) {
    ctx.save(); ctx.translate(x, y);
    caja(ctx, -8, -2.6, 16, 1.4, 0.4, OSCURO);
    bogies(ctx, [-5.8, -3, 3, 5.8], giro);
    cuerpo(ctx, () => ctx.roundRect(-8, -11.2, 16, 8.8, [1.4, 1.4, 0.4, 0.4]), cromo(ctx, -11.2, -2.4));
    ctx.fillStyle = '#ff2e88'; ctx.fillRect(-8, -5.4, 16, 0.8);
    ctx.fillStyle = 'rgba(46,230,214,0.9)'; ctx.fillRect(-8, -4.4, 16, 0.3);
    ctx.fillStyle = vidrio(ctx, -9.6, -7.2); ctx.beginPath(); ctx.roundRect(-7.2, -9.4, 14.4, 2, 0.8); ctx.fill();
    ventanas(ctx, [-6.6, -3.4, -0.2, 3], -9.1, 1.4, 2.4, 0.5);
    ctx.restore();
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ */
/* B · Aerodinámico: a 1930s streamliner, enamel and chrome, still steam */
/* ------------------------------------------------------------------ */
const ESMALTE = ['#5b2ea6', '#2a1458', '#170a36'];
const deco = {
  id: 'deco', nombre: 'Aerodinámico', lema: 'Una locomotora art déco de los años 30: esmalte morado, líneas de cromo y vapor.',
  humo: { dx: 5.2, dy: -11.4 }, luz: { dx: 11.4, dy: -6.4 },
  frente(ctx, x, y, { giro = 0 } = {}) {
    ctx.save(); ctx.translate(x, y);
    // The big drive wheels, half hidden by the valance
    for (const [wx, r] of [[-6.4, 2.3], [-1.2, 2.8], [4.4, 2.8]]) {
      circulo(ctx, wx, -r, r, '#1a1030');
      ctx.strokeStyle = '#d8dcf0'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.arc(wx, -r, r - 0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(216,220,240,0.5)'; ctx.lineWidth = 0.3;
      for (let s = 0; s < 3; s++) { const a = giro + s * Math.PI / 3; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * (r - 0.5), -r - Math.sin(a) * (r - 0.5)); ctx.lineTo(wx + Math.cos(a) * (r - 0.5), -r + Math.sin(a) * (r - 0.5)); ctx.stroke(); }
    }
    // The rod joining the wheels
    const ry = -2.6 + Math.sin(giro) * 0.8;
    ctx.strokeStyle = '#e8ecff'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-6.4 + Math.cos(giro) * 0.8, ry); ctx.lineTo(4.4 + Math.cos(giro) * 0.8, ry); ctx.stroke();
    // The shroud: a teardrop from the cab back to a rounded nose
    const esm = ctx.createLinearGradient(0, -12.6, 0, -3);
    esm.addColorStop(0, ESMALTE[0]); esm.addColorStop(0.45, ESMALTE[1]); esm.addColorStop(1, ESMALTE[2]);
    cuerpo(ctx, () => {
      ctx.moveTo(-11, -3.4); ctx.lineTo(-11, -11.6); ctx.quadraticCurveTo(-11, -12.6, -10, -12.6); ctx.lineTo(-4.6, -12.6);
      ctx.quadraticCurveTo(-4, -10.6, -2, -10.4); ctx.lineTo(5, -10.4);
      ctx.bezierCurveTo(10, -10.4, 12.2, -8, 12.2, -5.6); ctx.quadraticCurveTo(12.2, -3.4, 9.6, -3.4); ctx.closePath();
    }, esm);
    // The enamel's gloss on top
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-11, -12.2, 24, 1);
    // Three chrome speed lines sweeping back from the nose
    for (const [ly, w] of [[-7.4, 0.55], [-6.2, 0.45], [-5.1, 0.35]]) {
      const g = ctx.createLinearGradient(-11, 0, 12, 0); g.addColorStop(0, 'rgba(230,234,255,0.2)'); g.addColorStop(1, '#ffffff');
      ctx.fillStyle = g; ctx.fillRect(-11, ly, 24, w);
    }
    ctx.restore();
    // The chrome nose cone
    const nariz = ctx.createRadialGradient(10.4, -7.6, 0.3, 10.8, -6.6, 3.4);
    nariz.addColorStop(0, '#ffffff'); nariz.addColorStop(0.5, '#b8bcd8'); nariz.addColorStop(1, '#4a4f6a');
    ctx.fillStyle = nariz; ctx.beginPath(); ctx.ellipse(10.6, -6.8, 1.9, 3.2, 0, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
    // The cab's round window, lit
    brilla(ctx, '#ffd98a', 4, () => circulo(ctx, -8, -9.8, 1.3, '#ffd98a'));
    ctx.strokeStyle = '#e8ecff'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.arc(-8, -9.8, 1.4, 0, Math.PI * 2); ctx.stroke();
    // The chimney, flush with the shroud, with a gold rim
    caja(ctx, 4.4, -11.2, 1.8, 0.9, 0.3, '#ffd23f');
    brilla(ctx, '#fff3a0', 6, () => circulo(ctx, 11.6, -6.4, 0.6, '#fffbe6'));
    ctx.restore();
  },
  vagon(ctx, x, y, carga = 1, giro = 0) {
    ctx.save(); ctx.translate(x, y);
    caja(ctx, -8, -3, 16, 1.2, 0.4, OSCURO);
    bogies(ctx, [-5.4, -3, 3, 5.4], giro, 1.2);
    const esm = ctx.createLinearGradient(0, -11.4, 0, -3);
    esm.addColorStop(0, ESMALTE[0]); esm.addColorStop(0.45, ESMALTE[1]); esm.addColorStop(1, ESMALTE[2]);
    cuerpo(ctx, () => ctx.roundRect(-7.8, -11.4, 15.6, 8.4, [3, 3, 0.6, 0.6]), esm);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-8, -11, 16, 0.9);
    for (const [ly, w] of [[-5.2, 0.5], [-4.3, 0.35]]) { ctx.fillStyle = '#e8ecff'; ctx.fillRect(-8, ly, 16, w); }
    ventanas(ctx, [-6.4, -3, 0.4, 3.8], -9.6, 2.6, 2.4, 1);
    ctx.restore();
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ */
/* C · Metro: a modern electric train, brushed aluminium, a big windscreen */
/* ------------------------------------------------------------------ */
function aluminio(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#eef0fa'); g.addColorStop(0.5, '#c4c8dc'); g.addColorStop(0.85, '#9a9eb8'); g.addColorStop(1, '#7a7e98');
  return g;
}
function cepillado(ctx, x0, x1, top, bottom) {
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.12;
  for (let yy = top + 0.5; yy < bottom; yy += 0.7) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke(); }
}
function pantografo(ctx, x, top) {
  ctx.strokeStyle = '#c4c8dc'; ctx.lineWidth = 0.3;
  ctx.beginPath(); ctx.moveTo(x - 2, top); ctx.lineTo(x, top - 2.2); ctx.lineTo(x + 2, top); ctx.moveTo(x - 1.6, top - 2.2); ctx.lineTo(x + 1.6, top - 2.2); ctx.stroke();
}
const metro = {
  id: 'metro', nombre: 'Metro', lema: 'Un tren eléctrico moderno: aluminio cepillado, un gran parabrisas y luces LED.',
  humo: null, luz: { dx: 11.2, dy: -3.6 },
  frente(ctx, x, y, { giro = 0 } = {}) {
    ctx.save(); ctx.translate(x, y);
    caja(ctx, -11, -2.6, 22, 1.4, 0.4, OSCURO);
    bogies(ctx, [-8, -5, 4.6, 7.6], giro);
    pantografo(ctx, -4, -12);
    cuerpo(ctx, () => { ctx.moveTo(-11, -2.4); ctx.lineTo(-11, -11.2); ctx.quadraticCurveTo(-11, -12, -10.2, -12); ctx.lineTo(7.4, -12); ctx.bezierCurveTo(10, -12, 11.4, -10, 11.6, -7); ctx.lineTo(11.6, -3.4); ctx.quadraticCurveTo(11.6, -2.4, 10.6, -2.4); ctx.closePath(); }, aluminio(ctx, -12, -2.4));
    cepillado(ctx, -11, 12, -12, -2.4);
    // The windscreen, wrapping around the front
    ctx.fillStyle = vidrio(ctx, -11, -6.4); ctx.beginPath(); ctx.moveTo(6.2, -11.2); ctx.lineTo(8, -11.2); ctx.bezierCurveTo(10, -11, 11, -9.4, 11.2, -7); ctx.lineTo(11.2, -6.2); ctx.lineTo(6.2, -6.2); ctx.closePath(); ctx.fill();
    reflejo(ctx, 9, -10.8, -6.6, 0.8);
    ventanas(ctx, [-9.8, -5, -0.2], -10.2, 3.6, 3.6, 0.6);
    // A door between the windows
    ctx.strokeStyle = 'rgba(60,64,90,0.5)'; ctx.lineWidth = 0.25; ctx.strokeRect(3.8, -10.6, 1.8, 7.6);
    // The LED strip low on the side, and the destination sign
    brilla(ctx, '#2ee6d6', 5, () => { ctx.fillStyle = '#2ee6d6'; ctx.fillRect(-11, -3.6, 23, 0.45); });
    brilla(ctx, '#ff2e88', 4, () => caja(ctx, 7, -11.8, 2.6, 0.5, 0.2, '#ff5aa8'));
    ctx.restore();
    brilla(ctx, '#ffffff', 6, () => caja(ctx, 10.6, -4.4, 1, 0.6, 0.2, '#fffbe6'));
    ctx.restore();
  },
  vagon(ctx, x, y, carga = 1, giro = 0) {
    ctx.save(); ctx.translate(x, y);
    caja(ctx, -8, -2.6, 16, 1.4, 0.4, OSCURO);
    bogies(ctx, [-5.8, -3, 3, 5.8], giro);
    cuerpo(ctx, () => ctx.roundRect(-8, -12, 16, 9.6, [0.8, 0.8, 0.4, 0.4]), aluminio(ctx, -12, -2.4));
    cepillado(ctx, -8, 8, -12, -2.4);
    ventanas(ctx, [-7, -2.2, 2.6], -10.2, 3.6, 3.6, 0.6);
    ctx.strokeStyle = 'rgba(60,64,90,0.5)'; ctx.lineWidth = 0.25; ctx.strokeRect(-0.9 + 7.4, -10.6, 0.8, 7.6);
    brilla(ctx, '#2ee6d6', 5, () => { ctx.fillStyle = '#2ee6d6'; ctx.fillRect(-8, -3.6, 16, 0.45); });
    ctx.restore();
    ctx.restore();
  },
};

/* ------------------------------------------------------------------ */
/* D · Nocturno: a glossy black train outlined in neon, synthwave         */
/* ------------------------------------------------------------------ */
function contorno(ctx, color, trazar, ancho = 0.45) {
  brilla(ctx, color, 6, () => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); trazar(); ctx.stroke(); });
}
const nocturno = {
  id: 'nocturno', nombre: 'Nocturno', lema: 'Negro brillante con contornos de neón rosado y cian, como la portada de noche.',
  humo: null, luz: { dx: 11.6, dy: -3.6 },
  frente(ctx, x, y, { giro = 0 } = {}) {
    ctx.save(); ctx.translate(x, y);
    bogies(ctx, [-8, -4.8, 3, 6.2], giro);
    const forma = () => { ctx.moveTo(-11, -2.4); ctx.lineTo(-11, -10.4); ctx.quadraticCurveTo(-11, -11.4, -10, -11.4); ctx.lineTo(1.4, -11.4); ctx.lineTo(11.8, -4.6); ctx.quadraticCurveTo(12.4, -2.4, 10.6, -2.4); ctx.closePath(); };
    cuerpo(ctx, forma, vidrio(ctx, -11.4, -2.4, '#1a1230'));
    // A sharp highlight along the roof, like a lacquered car
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-11, -11, 12.4, 0.35);
    // The window band glowing cyan, with the warm windows
    brilla(ctx, '#2ee6d6', 6, () => { ctx.fillStyle = 'rgba(46,230,214,0.25)'; ctx.fillRect(-10.4, -9.6, 11, 2.4); });
    ventanas(ctx, [-9.8, -6.6, -3.4], -9.3, 1.8, 2.4, 0.4);
    ctx.fillStyle = 'rgba(46,230,214,0.55)'; ctx.beginPath(); ctx.moveTo(2, -10.4); ctx.lineTo(7.4, -6.9); ctx.lineTo(2, -6.9); ctx.closePath(); ctx.fill();
    reflejo(ctx, 3.6, -9.8, -7.2, 0.6);
    ctx.restore();
    contorno(ctx, '#ff2e88', forma);
    brilla(ctx, '#ff2e88', 5, () => { ctx.fillStyle = '#ff2e88'; ctx.fillRect(-11, -4.4, 22.6, 0.4); });
    brilla(ctx, '#ffffff', 6, () => caja(ctx, 10.4, -4.1, 1.3, 0.5, 0.2, '#fffbe6'));
    ctx.restore();
  },
  vagon(ctx, x, y, carga = 1, giro = 0) {
    ctx.save(); ctx.translate(x, y);
    bogies(ctx, [-5.8, -3, 3, 5.8], giro);
    const forma = () => ctx.roundRect(-8, -11.4, 16, 9, [1, 1, 0.4, 0.4]);
    cuerpo(ctx, forma, vidrio(ctx, -11.4, -2.4, '#1a1230'));
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-7.6, -11, 15.2, 0.35);
    brilla(ctx, '#2ee6d6', 6, () => { ctx.fillStyle = 'rgba(46,230,214,0.25)'; ctx.fillRect(-7.4, -9.6, 14.8, 2.4); });
    ventanas(ctx, [-6.8, -3.4, 0, 3.4], -9.3, 1.8, 2.6, 0.4);
    ctx.restore();
    contorno(ctx, '#ff2e88', forma);
    brilla(ctx, '#ff2e88', 5, () => { ctx.fillStyle = '#ff2e88'; ctx.fillRect(-8, -4.4, 16, 0.4); });
    ctx.restore();
  },
};

export const TRENES = { bala, deco, metro, nocturno };
