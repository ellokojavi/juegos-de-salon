/**
 * 🚅 Tren en Vilo — the visitors (birds, the flying saucer and its fish, the whale, the boat and its wake
 * rider, the mole): when each one comes and what it does, shared by both styles. They draw through `r`,
 * the pixel renderer (pixel.js) or neon.js's smooth one, which draws the same sprites as shapes. All in art
 * units (16 per grid unit). `V` carries the scene: { r, esc (the scene's state, its particles), e (the
 * stage), c (the canvas), A (grid → art units), W, H, ahora, dt, visitas (from the game), yAgua, x0, x1, y0 }.
 * A renderer may also draw a few pieces whole, smoothly, instead of pixel by pixel: `haz` (the saucer's
 * beam), `ola` (the boat's wave), `nadador` (the rider in the water) and `bandera` (the boat's flag).
 */
import { PAJARO, PALETA_PAJARO, PLATILLO, PALETA_PLATILLO, PREGUNTA, BALLENA, PALETA_BALLENA, PEZ, PALETA_PEZ, TOPO, PALETA_TOPO, TOPO_MIEDO, EXCLAMACION, LANCHA, PALETA_LANCHA, SURFISTA, PALETA_SURFISTA } from './pixel.js';

const QUIETO = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const AGUA = ['#bff8ff', '#7af0ff', '#2ec4d6'];
const ruido = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };

export function visitasCielo({ r, esc, e, c, A, W, H, ahora, dt, visitas }) {
  // Visitors, only in the game (never on the cover: they are a surprise). `visitas` comes from the game:
  // { ovni: may the saucer come in this stage, retraso: after how long, verOvni(): it came }
  if (visitas && !QUIETO) {
    esc.inicio ??= ahora;
    // A bird, now and then: high, muted, slow, so it hardly takes the eye off the bridge
    esc.proximoPajaro ??= ahora + 6 + Math.random() * 8;
    if (!esc.pajaros && ahora >= esc.proximoPajaro) {
      const izq = Math.random() < 0.5, n = Math.random() < 0.7 ? 1 : 2, y = H * (0.05 + Math.random() * 0.15);
      esc.pajaros = Array.from({ length: n }, (_, k) => ({ x: izq ? -10 - k * 10 : W + 10 + k * 10, y: y + k * 4, fase: Math.random() * 6, v: (izq ? 1 : -1) * (11 + Math.random() * 5) }));
    }
    if (esc.pajaros) {
      for (const p of esc.pajaros) {
        p.x += p.v * dt; p.fase += dt;
        // Wings up, spread, down, spread; it barely rises on the downstroke, no waving
        const ala = [0, 1, 2, 1][Math.floor(p.fase * 7) % 4];
        r.sprite(PAJARO[ala], PALETA_PAJARO, p.x, p.y - (ala === 2 ? 1 : 0), { voltear: p.v < 0 });
      }
      if (esc.pajaros.every(p => p.x < -20 || p.x > W + 20)) { esc.pajaros = null; esc.proximoPajaro = ahora + 14 + Math.random() * 14; }
    }
    // The saucer: once in the whole game, in the stage drawn at the start. It glides in, stops above
    // the bridge with a beam of light, shows a "?", and shoots off up and away
    if (visitas.ovni && !esc.ovni && ahora - esc.inicio >= visitas.retraso) {
      visitas.verOvni();
      const izq = Math.random() < 0.5;
      // Fishing, it stays near the cliff it came from, not in the middle: the bridge keeps the attention
      const [gx0] = A(0, 0), [gx1] = A(e.ancho, 0);
      const destino = visitas.modoOvni === 'pesca' ? (izq ? gx0 + 12 : gx1 - 12) : W * (0.35 + Math.random() * 0.3);
      esc.ovni = { modo: visitas.modoOvni, x: izq ? -12 : W + 12, y: Math.max(26, H * 0.2), destino, dir: izq ? 1 : -1, fase: 'llega', t: 0 };
    }
    if (esc.ovni && !esc.ovni.fuera) {
      const o = esc.ovni;
      o.t += dt;
      const vuelo = Math.sin(ahora * 3) * 1.5;
      if (o.modo === 'pesca') {
        // Act two, "the catch": it comes down over the gap, lowers its beam to the water, a fish rises
        // spinning up the light into the saucer, and it goes away into the distance
        const [, yAguaO] = A(0, c._v.abajo + 0.7), bajo = yAguaO - 60;
        if (o.fase === 'llega') {
          o.x += o.dir * 34 * dt; o.y += (bajo - o.y) * Math.min(1, dt * 1.5);
          if ((o.dir > 0 && o.x >= o.destino) || (o.dir < 0 && o.x <= o.destino)) { o.fase = 'pesca'; o.t = 0; }
        } else if (o.fase === 'pesca') {
          if (o.t > 3.2) { o.fase = 'se va'; o.t = 0; }
        } else { o.x += o.dir * 14 * dt; o.y -= 18 * dt; o.escala = Math.max(0, 1 - o.t / 1.1); }
        const oy = o.y + vuelo, ox = o.x;
        if (o.fase === 'pesca' && o.t > 0.3) {
          const largo = yAguaO - oy - 3;
          if (r.haz) r.haz(ox, oy + 3, largo, 4 + largo / 3, 0.2);
          else for (let k = 0; k < largo; k += 2) r.rect(ox - 2 - k / 6, oy + 3 + k, 4 + k / 3, 2, `rgba(155,232,255,${0.2 - (k / largo) * 0.12})`);
          // The fish: it leaps out of the water and rises up the beam, flipping as it goes
          const k = Math.min(1, Math.max(0, (o.t - 0.9) / 1.8));
          if (k > 0 && k < 1) {
            const fy = yAguaO - k * (yAguaO - oy - 4);
            r.sprite(PEZ, PALETA_PEZ, ox + Math.sin(k * 12) * 2, fy, { voltear: Math.floor(k * 10) % 2 === 1 });
            if (!o.salpico) { o.salpico = true; if (!QUIETO) for (let n = 0; n < 8; n++) esc.parts.agregar({ x: ox, y: yAguaO, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20, g: 110, vida: 0.6, colores: AGUA }); }
          }
        }
        // Leaving, it goes away into the distance: smaller and smaller, drifting up on a diagonal, until it is gone
        if ((o.escala ?? 1) > 0.08) r.sprite(PLATILLO[Math.floor(ahora * 5) % 2], PALETA_PLATILLO, ox, oy, { escala: o.escala ?? 1 });
        else o.fuera = true;
      } else {
        // Act one, "the look": it glides in, stops above the bridge with a beam, shows a "?", and shoots off
        if (o.fase === 'llega') {
          o.x += o.dir * 34 * dt;
          if ((o.dir > 0 && o.x >= o.destino) || (o.dir < 0 && o.x <= o.destino)) { o.fase = 'mira'; o.t = 0; }
        } else if (o.fase === 'mira') {
          if (o.t > 2.6) { o.fase = 'se va'; o.t = 0; }
        } else { o.x += o.dir * 90 * o.t * dt * 4; o.y -= 60 * o.t * dt * 3; }
        if (o.fase === 'mira' && o.t > 0.3 && r.haz) r.haz(o.x, o.y + 3, 36, 16, 0.16);
        else if (o.fase === 'mira' && o.t > 0.3) for (let k = 0; k < 18; k++) r.rect(o.x - 2 - k / 3, o.y + 3 + k * 2, 4 + (2 * k) / 3, 2, `rgba(155,232,255,${0.16 - k * 0.008})`);
        r.sprite(PLATILLO[Math.floor(ahora * 5) % 2], PALETA_PLATILLO, o.x, o.y + vuelo);
        if (o.fase === 'mira' && o.t > 0.7 && o.t < 2.4) r.sprite(PREGUNTA, PALETA_PLATILLO, o.x, o.y + vuelo - 10 - Math.round(Math.sin(o.t * 6)));
        if (o.y < -20 || o.x < -40 || o.x > W + 40) o.fuera = true;
      }
    }
  }
}

export function visitaBallena({ r, esc, e, A, ahora, dt, visitas, yAgua }) {
  // A whale, now and then (in the game only): it breaches out of the water in an arc, tilting with
  // its flight, and falls back in, with a splash on the way out and on the way in
  if (visitas && !QUIETO) {
    const [gx0] = A(0, 0), [gx1] = A(e.ancho, 0);
    esc.inicio ??= ahora;
    if (visitas.ballena && !esc.ballena && ahora - esc.inicio >= visitas.retrasoBallena && gx1 - gx0 <= 60) visitas.noCabe('ballena');
    else if (visitas.ballena && !esc.ballena && ahora - esc.inicio >= visitas.retrasoBallena) {
      visitas.verBallena();
      const dir = Math.random() < 0.5 ? 1 : -1, largo = Math.min(30, (gx1 - gx0) * 0.35);
      const x = dir > 0 ? gx0 + 14 + Math.random() * (gx1 - gx0 - largo - 28) : gx1 - 14 - Math.random() * (gx1 - gx0 - largo - 28);
      const modo = visitas.modoBallena;
      esc.ballena = { modo, x, dir, largo, alto: 18 + Math.random() * 6, t: 0, dura: modo === 'chorro' ? 3 : 1.15, salpicoSalida: false, salpicoEntrada: false };
    }
    if (esc.ballena && !esc.ballena.fuera) {
      const b = esc.ballena; b.t += dt;
      const u = Math.min(1, b.t / b.dura);
      if (b.modo === 'chorro') {
        // Three parts, always moving the same way: it surfaces on a diagonal (head up), floats level
        // with half its body out and blows its spout, then dives on a diagonal (head down)
        const T1 = 0.7, T2 = 2.3, T3 = 3.0;
        let cuadroB, bx, by;
        if (b.t < T1) {
          const k = b.t / T1;
          cuadroB = BALLENA.sube; bx = b.x + b.dir * 10 * k; by = yAgua + 14 - 10 * k;
        } else if (b.t < T2) {
          const k = (b.t - T1) / (T2 - T1);
          cuadroB = BALLENA.arriba; bx = b.x + b.dir * (14 + 4 * k); by = yAgua + 3;
        } else {
          const k = Math.min(1, (b.t - T2) / (T3 - T2));
          cuadroB = BALLENA.baja; bx = b.x + b.dir * (20 + 12 * k); by = yAgua + 1 + 15 * k;
        }
        if (!b.salpicoSalida && b.t > 0.2) { b.salpicoSalida = true; for (let n = 0; n < 8; n++) esc.parts.agregar({ x: bx + (Math.random() - 0.5) * 10, y: yAgua, vx: (Math.random() - 0.5) * 20, vy: -12 - Math.random() * 12, g: 90, vida: 0.6, colores: AGUA }); }
        if (!b.salpicoEntrada && b.t > T2 + 0.3) { b.salpicoEntrada = true; for (let n = 0; n < 6; n++) esc.parts.agregar({ x: bx + (Math.random() - 0.5) * 10, y: yAgua, vx: (Math.random() - 0.5) * 16, vy: -10 - Math.random() * 10, g: 90, vida: 0.5, colores: AGUA }); }
        // The spout: drops that shoot up from the blowhole and fan out, while it floats
        if (b.t > T1 + 0.2 && b.t < T2 - 0.3) {
          const hx = bx + b.dir * 5, hy = by - 8;
          for (let n = 0; n < 3; n++) esc.parts.agregar({ x: hx + (Math.random() - 0.5) * 2, y: hy, vx: (Math.random() - 0.5) * 18, vy: -48 - Math.random() * 18, g: 95, vida: 0.75, colores: AGUA });
        }
        if (b.t < T3) r.sprite(cuadroB, PALETA_BALLENA, bx, by, { voltear: b.dir < 0, cortarY: yAgua });
        if (b.t > T3 + 0.7) { esc.ballena = { fuera: true }; }
      } else {
      const bx = b.x + b.dir * b.largo * u, by = yAgua + 8 - b.alto * Math.sin(Math.PI * u);
      const salpica = xx => { for (let n = 0; n < 10; n++) esc.parts.agregar({ x: xx + (Math.random() - 0.5) * 8, y: yAgua, vx: (Math.random() - 0.5) * 36, vy: -22 - Math.random() * 28, g: 150, vida: 0.9, colores: AGUA }); };
      if (!b.salpicoSalida && u > 0.06) { b.salpicoSalida = true; salpica(b.x); }
      if (!b.salpicoEntrada && u > 0.94) { b.salpicoEntrada = true; salpica(b.x + b.dir * b.largo); }
      // A drawn frame for each part of the jump: head up going out, level at the top, head down coming back
      const cuadroB = u < 0.38 ? BALLENA.sube : u < 0.62 ? BALLENA.arriba : BALLENA.baja;
      if (u < 1) r.sprite(cuadroB, PALETA_BALLENA, bx, by, { voltear: b.dir < 0, cortarY: yAgua });
      if (b.t > b.dura + 0.8) { esc.ballena = { fuera: true }; }
      }
    }
  }
}

export function visitaLancha({ r, esc, e, A, W, ahora, dt, visitas, yAgua }) {
  // The green boat and its wake rider (in the game only): it crosses the water from behind one cliff to
  // behind the other, its wave behind it and the rider on the wave. Three acts: carving up and down the
  // wave, a jump off its crest, or a fall, and the boat turns back to pick the rider up
  if (visitas && !QUIETO) {
    esc.inicio ??= ahora;
    if (visitas.wake && !esc.wake && ahora - esc.inicio >= visitas.retrasoWake) {
      visitas.verWake();
      // It comes out from just behind a cliff, not from the screen's edge: on a phone the water is narrow
      const dir = Math.random() < 0.5 ? 1 : -1, [gx0] = A(0, 0), [gx1] = A(e.ancho, 0);
      esc.wake = { modo: visitas.modoWake, dir, x: dir > 0 ? gx0 - 6 : gx1 + 6, sale: dir > 0 ? gx1 + 30 : gx0 - 30, t: 0, fase: 'cruza', d: 9, salto: 0, vy: 0, giro: 0 };
    }
    if (esc.wake && !esc.wake.fuera) {
      const w = esc.wake; w.t += dt;
      const [gx0] = A(0, 0), [gx1] = A(e.ancho, 0);
      const V = 15, mitad = (gx0 + gx1) / 2;
      // The wave's height `d` art pixels behind the stern: it rises off the hull, peaks, and fades
      const ola = d => d < 2 ? 0 : d < 6 ? (d - 2) * 0.8 : Math.max(0, 3.2 - (d - 6) * 0.22);
      const popa = () => w.x - w.dir * 8;
      const dibujaOla = () => {
        if (r.ola) { r.ola(Array.from({ length: 23 }, (_, k) => [popa() - w.dir * (k + 2), yAgua - ola(k + 2)]), yAgua); return; }
        for (let d = 2; d < 24; d++) {
          const h = Math.round(ola(d)), xx = popa() - w.dir * d;
          if (h > 0) r.rect(xx, yAgua - h, 1, h, AGUA[1]);
          r.punto(xx, yAgua - h, d < 9 || ruido(xx, Math.floor(ahora * 8)) > 0.4 ? '#ffffff' : AGUA[0]);
        }
      };
      const lancha = (conJinete = false) => {
        r.sprite(LANCHA, PALETA_LANCHA, w.x, yAgua + 2, { voltear: w.dir < 0, cortarY: yAgua + 1 });
        if (conJinete && r.pasajero) r.pasajero(w.x - w.dir * 4, yAgua - 4.6);
        else if (conJinete) { r.punto(w.x - w.dir * 4, yAgua - 4, PALETA_SURFISTA.s); r.punto(w.x - w.dir * 4, yAgua - 5, PALETA_SURFISTA.k); }
      };
      // The black tow rope, from the rear top corner of the wake tower's roof, at the stern to the rider's front hand
      const cuerda = (rx, ry) => r.linea(w.x - w.dir * 6, yAgua - 6, rx + w.dir * 2, ry - 6, '#0a0a0a');
      w.x += w.dir * V * dt;
      if (w.fase === 'cruza') {
        // Carving: the rider slides up the wave and back down it, crouched while going down
        if (w.modo === 'carve' || w.modo === 'jump' && w.salto === 0 && Math.abs(w.x - mitad) > 8 || (w.modo === 'fall' || w.modo === 'sink') && Math.abs(w.x - mitad) > 8) {
          const prev = w.d; w.d = 9 + Math.sin(w.t * 2.2) * 3.5;
          dibujaOla(); lancha();
          const rx = popa() - w.dir * w.d, ry = yAgua - ola(w.d) + 1;
          cuerda(rx, ry);
          r.sprite(w.d > prev ? SURFISTA.arriba : SURFISTA.agachado, PALETA_SURFISTA, rx, ry, { voltear: w.dir < 0 });
        } else if (w.modo === 'jump') {
          // The jump: off the crest, up, a spin of the board in the air, and back down onto the wave
          if (w.salto === 0) { w.salto = 1; w.alto = 0; w.vy = -46; }
          w.vy += 120 * dt; w.alto = Math.min(0, w.alto + w.vy * dt);
          dibujaOla(); lancha();
          const enAire = w.alto < 0 || w.vy < 0;
          cuerda(popa() - w.dir * 7, yAgua - ola(7) + 1 + w.alto);
          r.sprite(enAire && w.vy < 10 ? SURFISTA.arriba : SURFISTA.agachado, PALETA_SURFISTA, popa() - w.dir * 7, yAgua - ola(7) + 1 + w.alto, { voltear: (w.dir < 0) !== (enAire && Math.floor(w.t * 8) % 2 === 1) });
          if (!enAire) { w.salto = 2; w.modo = 'carve'; for (let n = 0; n < 8; n++) esc.parts.agregar({ x: popa() - w.dir * 7, y: yAgua - 2, vx: (Math.random() - 0.5) * 30, vy: -14 - Math.random() * 14, g: 100, vida: 0.5, colores: AGUA }); }
        } else {
          // The fall: the rider tumbles off the wave and splashes in; the boat goes on a little and turns back
          w.fase = 'cae'; w.cx = popa() - w.dir * w.d; w.ct = 0;
          for (let n = 0; n < 12; n++) esc.parts.agregar({ x: w.cx, y: yAgua, vx: (Math.random() - 0.5) * 34, vy: -20 - Math.random() * 22, g: 130, vida: 0.8, colores: AGUA });
        }
      } else if (w.fase === 'cae') {
        w.ct += dt;
        if (w.ct < 0.5) r.sprite(SURFISTA.cae, PALETA_SURFISTA, w.cx, yAgua + 1 + w.ct * 8, { cortarY: yAgua });
        else if (w.modo === 'sink') {
          // Sinking: the rider goes under, a few bubbles, and only the head pops back up; the board drifts off
          if (!r.nadador) r.rect(w.cx + 4 + w.ct * 2, yAgua - 1, 4, 1, PALETA_SURFISTA.o);
          if (w.ct < 1.8) { if (Math.random() < 0.25) esc.parts.agregar({ x: w.cx + (Math.random() - 0.5) * 3, y: yAgua, vx: 0, vy: -8 - Math.random() * 6, g: 20, vida: 0.4, colores: ['#ffffff', AGUA[0]] }); }
          else {
            const b = Math.round(Math.sin(ahora * 3)), asoma = Math.min(3, Math.floor((w.ct - 1.8) * 6));
            if (r.nadador) r.nadador(w.cx, yAgua, { asoma: asoma / 3, vaiven: Math.sin(ahora * 3), tabla: w.cx + 4 + w.ct * 2 });
            else if (asoma >= 1) r.punto(w.cx, yAgua - 1 + b, PALETA_SURFISTA.k);
            if (!r.nadador && asoma >= 2) r.rect(w.cx, yAgua - 1 + b, 2, 1, PALETA_SURFISTA.s), r.punto(w.cx, yAgua - 2 + b, PALETA_SURFISTA.k), r.punto(w.cx + 1, yAgua - 2 + b, PALETA_SURFISTA.k);
            if (!r.nadador && asoma >= 3) r.rect(w.cx, yAgua - 2 + b, 2, 1, PALETA_SURFISTA.s), r.rect(w.cx, yAgua - 3 + b, 2, 1, PALETA_SURFISTA.k);
          }
        }
        // The rider bobbing in the water, the board floating beside
        else if (r.nadador) r.nadador(w.cx, yAgua, { asoma: 1, vaiven: Math.sin(ahora * 4), tabla: w.cx + 3 });
        else { const b = Math.round(Math.sin(ahora * 4)); r.punto(w.cx, yAgua - 1 + b, PALETA_SURFISTA.s); r.punto(w.cx, yAgua - 2 + b, PALETA_SURFISTA.k); r.rect(w.cx + 3, yAgua - 1, 4, 1, PALETA_SURFISTA.o); }
        if (Math.abs(w.x - w.cx) > 40 && w.dir * (w.x - w.cx) > 0) { w.dir = -w.dir; w.vuelve = true; }
        else if (w.dir * (w.x - w.cx) > -3 && w.dir * (w.x - w.cx) < 0 && w.ct > 1.5) { w.fase = 'recoge'; }
        if (w.ct < 1.2) dibujaOla();
        lancha();
        // Going back for a rider in the water (fallen or sunk), a small orange flag raised on a pole over the tower roof: rider down
        if (w.vuelve) {
          const fx = w.x - w.dir * 4, ondea = Math.floor(ahora * 6) % 2;
          if (r.bandera) r.bandera(fx, yAgua - 6, w.dir, ahora);
          else {
          r.rect(fx, yAgua - 11, 1, 5, '#0a0a0a');
          r.rect(w.dir > 0 ? fx - 3 : fx + 1, yAgua - 11, 3, 2 - ondea, '#ff7a1a');
          if (ondea) r.punto(w.dir > 0 ? fx - 2 : fx + 2, yAgua - 9, '#ff7a1a');
          }
        }
      } else {
        // Picked up: the rider is aboard, and the boat goes back the way it came, slow, no wave to ride
        lancha(true);
      }
      // Gone once it is behind a cliff again (after a pick-up it goes back the way it came)
      if (w.x < Math.min(gx0 - 30, -40) || w.x > Math.max(gx1 + 30, W + 40) || w.fase === 'cruza' && w.dir * (w.x - w.sale) > 0) w.fuera = true;
    }
  }
}

export function visitaTopo({ r, esc, e, A, W, ahora, dt, visitas, yAgua, x0, x1, y0 }) {
  // The mole: it comes in through the earth from the outer side of a cliff, digging a wobbly tunnel
  // toward the gap (a little up, a little down); at the edge it peeks out, a "!" pops up, and it falls
  // into the water. The tunnel stays where it was dug
  if (visitas && !QUIETO) {
    esc.inicio ??= ahora;
    if (visitas.topo && !esc.topo && ahora - esc.inicio >= visitas.retrasoTopo) {
      visitas.verTopo();
      // Only through earth: its height keeps the whole tunnel (with its wobble) clear of the anchors
      // and their ledges on that cliff, and of the deck's plate at the top
      const izq = Math.random() < 0.5, xc = izq ? 0 : e.ancho;
      const ocupados = [[xc, 0], ...e.anclas.filter(([ax]) => ax === xc)].map(([ax, ay]) => A(ax, ay)[1]);
      const libre = yy => ocupados.every(py => yy - 12 > py + 8 || yy + 5 < py - 4);
      let y = null;
      for (let k = 0; k < 40 && y === null; k++) { const c = Math.round(y0 + 14 + Math.random() * Math.max(4, (yAgua - y0) - 24)); if (libre(c)) y = c; }
      if (y === null) { esc.topo = { fuera: true }; visitas.noCabe('topo'); } else
      esc.topo = { izq, x: izq ? -6 : W + 6, borde: izq ? x0 - 2 : x1 + 2, y, y0: y, t: 0, fase: 'cava', vy: 0, rumbo: 0, camino: [] };
    }
    if (esc.topo && !esc.topo.fuera) {
      const tp = esc.topo, dir = tp.izq ? 1 : -1; tp.t += dt;
      // The tunnel: every point it dug through. About 2.5 s after the fall the earth fills it back in,
      // from the edge inward, with some loose dirt where it closes
      const relleno = tp.fase === 'cae' ? Math.max(0, Math.min(1, (tp.t - 2.5) / 1.4)) : 0;
      const abiertos = Math.round(tp.camino.length * (1 - relleno));
      if (r.tunel) r.tunel(tp.camino, abiertos);
      else for (let k = 0; k < abiertos; k++) { const [cx, cy] = tp.camino[k]; r.rect(cx - 1, cy - 6, 3, 7, 'rgba(26,11,46,0.92)'); }
      if (relleno > 0 && relleno < 1 && abiertos > 0 && Math.random() < 0.5) {
        const [cx, cy] = tp.camino[abiertos - 1];
        esc.parts.agregar({ x: cx, y: cy - 3 + (Math.random() - 0.5) * 6, vx: (Math.random() - 0.5) * 10, vy: -4 - Math.random() * 6, g: 60, vida: 0.4, colores: ['#9a6440', '#7a4a2a', '#5a3a20'] });
      }
      if (relleno >= 1) tp.fuera = true;
      if (tp.fase === 'cava') {
        tp.x += dir * 11 * dt;
        // Erratic: every few pixels it picks a new height (up or down, within 4 of where it started)
        // and heads for it, so the tunnel zigzags
        if (tp.metaX === undefined || Math.abs(tp.x - tp.metaX) < 0.5 || (dir > 0) === (tp.x > tp.metaX)) {
          tp.metaX = tp.x + dir * (3 + Math.random() * 3);
          tp.metaY = tp.y0 + Math.round((Math.random() * 2 - 1) * 4);
        }
        tp.y += Math.sign(tp.metaY - tp.y) * Math.min(Math.abs(tp.metaY - tp.y), 16 * dt);
        const ultimo = tp.camino[tp.camino.length - 1];
        if (!ultimo || Math.abs(ultimo[0] - tp.x) >= 1) tp.camino.push([Math.round(tp.x), Math.round(tp.y)]);
        if (Math.random() < 0.35) esc.parts.agregar({ x: tp.x + dir * 5, y: tp.y - 3, vx: -dir * (8 + Math.random() * 14), vy: -6 - Math.random() * 10, g: 70, vida: 0.5, colores: ['#9a6440', '#7a4a2a', '#5a3a20'] });
        r.sprite(TOPO[Math.floor(tp.t * 6) % 2], PALETA_TOPO, tp.x, tp.y, { voltear: dir < 0 });
        if ((dir > 0 && tp.x >= tp.borde) || (dir < 0 && tp.x <= tp.borde)) { tp.fase = 'aire'; tp.t = 0; }
      } else if (tp.fase === 'aire') {
        // Like in the cartoons: it keeps digging out past the edge, into thin air, without noticing...
        tp.x += dir * 11 * dt;
        r.sprite(TOPO[Math.floor(tp.t * 6) % 2], PALETA_TOPO, tp.x, tp.y, { voltear: dir < 0 });
        if (tp.t > 0.55) { tp.fase = 'sorpresa'; tp.t = 0; }
      } else if (tp.fase === 'sorpresa') {
        // ...hangs there, a "!" pops up, and only then it drops
        r.sprite(TOPO[0], PALETA_TOPO, tp.x, tp.y, { voltear: dir < 0 });
        if (tp.t > 0.1) r.sprite(EXCLAMACION, PALETA_PLATILLO, tp.x, tp.y - 8 - (tp.t < 0.25 ? 2 : 0));
        if (tp.t > 0.85) { tp.fase = 'cae'; tp.t = 0; tp.vy = 0; }
      } else if (tp.fase === 'cae') {
        // It tumbles: forward a little, down with gravity, turning over, and splashes in the water
        tp.vy += 110 * dt; tp.y += tp.vy * dt;
        // Falling scared: facing us, eyes wide, mouth open screaming, arms flailing, sweat flying off
        if (tp.y < yAgua + 2) {
          r.sprite(TOPO_MIEDO[Math.floor(tp.t * 10) % 2], PALETA_TOPO, tp.x, tp.y + 3);
          if (Math.random() < 0.25) esc.parts.agregar({ x: tp.x + (Math.random() < 0.5 ? -6 : 6), y: tp.y - 6, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 10, g: 60, vida: 0.4, colores: ['#ffffff', '#bff8ff', '#7af0ff'] });
        }
        else if (!tp.salpico) { tp.salpico = true; for (let n = 0; n < 12; n++) esc.parts.agregar({ x: tp.x, y: yAgua, vx: (Math.random() - 0.5) * 36, vy: -24 - Math.random() * 26, g: 130, vida: 0.8, colores: AGUA }); }
      }
    }
  }
}
