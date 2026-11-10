// ¡Al toque!, the lab's microgames (WarioWare-style): 28 games of 3 to 5 seconds, played in runs of 10
// different ones in a row. Moved from the owner's review prototype; docs/games/microgames.md.
import { trackVisit, trackStart, trackFinish } from '../../assets/js/transport/stats.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { abrirComentario } from '../../assets/js/labs-idioma.js';
import { SFX, initSound, soundToggle } from '../../assets/js/sound.js';
import { confetti } from '../../assets/js/ui.js';
import { salidasFin } from '../../assets/js/fin.js';
import { param, tiene } from '../../assets/js/parametros.js';
import { semillaDel } from '../../assets/js/uno-al-dia.js';
import { shareLink } from '../../assets/js/compartir.js';
import { getLang, coverLangToggle } from '../../assets/js/i18n.js';
import { TR } from './rules.js';
import { RUN, newCode, speedAt, score, score100, stream, runOrder } from './engine.js';
const GAME_ID = 'microgames';
// The texts are written in Spanish where they are used; t() gives the player's language from rules.js (C-3)
const LANG = getLang();
const t = (es, v = {}) => (TR[LANG]?.[es] ?? es).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
trackVisit();   // the site's traffic (D-208)
(() => {
  const demo = document.getElementById('demo'), screen = document.getElementById('screen');
  const timer = document.getElementById('timer'), hud = document.getElementById('hud');
  const hudN = document.getElementById('hud-n'), hudS = document.getElementById('hud-s');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let total = 0, idx = 0, raf = 0, loop = 0, active = false, cleanup = null, sp = 1, order = [], tOuts = [], lastStars = 0;
  let rand = Math.random;   // the game's random stream: seeded in a shared run (Uno al día, a cup), so every phone gets the same game
  const rnd = n => Math.floor(rand() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); tOuts.push(t); return t; };
  const set = html => { screen.innerHTML = html; };
  const full = html => { screen.classList.add('full'); set(html); };
  const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  const T = ms => ms / sp;          // durations shrink as the run speeds up
  const tap = (el, fn) => el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (active) fn(e); });
  const sizeFor = (cols, rows) => {
    const w = demo.clientWidth - 24, h = demo.clientHeight - 58;
    return Math.max(22, Math.min(w / cols, h / rows) * 0.62);
  };

  function runTimer(ms, onOut) {
    timer.hidden = false; const t0 = performance.now();
    cancelAnimationFrame(raf);
    const tick = now => {
      const k = Math.max(0, 1 - (now - t0) / ms);
      timer.style.transform = `scaleX(${k})`;
      if (k <= 0) { onOut(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return t0;
  }
  // Stop everything that moves or listens, but leave the scene as it is
  function freeze() {
    cancelAnimationFrame(raf); cancelAnimationFrame(loop); animTok++;
    tOuts.forEach(clearTimeout); tOuts = [];
    cleanup?.(); cleanup = null;
    timer.hidden = true; demo.style.touchAction = '';
  }
  function stopAll() {
    freeze();
    demo.querySelectorAll('.verdict-tag, .mascot, .cashrain').forEach(t => t.remove());
    demo.classList.remove('red', 'green', 'hot'); screen.classList.remove('full');
  }
  // The end of a game: the scene stays frozen for a moment, so you see what you just did, then the stars
  function finish(n, note, hold = 800) {
    if (!active) return; active = false;
    freeze();
    total += n; lastStars = n; scored = true; hudS.textContent = `${score([...marks, n]).points} ${t('pts')}`;
    if (n) SFX.reveal(); else SFX.error();
    const tag = document.createElement('div'); tag.className = `verdict-tag ${n ? 'good' : 'bad'}`; tag.textContent = n ? '✓' : '✗'; demo.append(tag);
    later(() => {
      stopAll();
      set(`<div class="stars" style="color:${n ? 'var(--yellow)' : 'var(--red)'}">${stars(n)}</div><div class="sub">${note || (n ? ['', t('¡Por poco!'), t('¡Bien!'), t('¡Al toque!')][n] : t('¡Fallaste!'))}</div>`);
      later(next, 900);
    }, reduce ? 400 : hold);
  }
  // The command card: the word, the thing it's about, and at most a few words of hint
  // `top` goes above the word (a mode chip, say) and gives the card a bit longer on screen
  // How each game is played, by what the finger does. The intro card shows that gesture, animated, so the player
  // knows at a glance what's coming; the review list is grouped the same way
  const KINDS = {
    toca:     [t('TOCA'), '👆', '#2ee6d6', 'Tocar: la respuesta, el momento justo o muchas veces seguidas'],
    arrastra: [t('ARRASTRA'), '✊', '#ff9a1f', 'Tomar algo con el dedo y moverlo: a su lugar o de lado a lado'],
    desliza:  [t('DESLIZA'), '💨', '#c45cff', 'Mover el dedo sobre la pantalla: cortar, lanzar, recorrer o frotar'],
  };
  const KIND = { quecolor: 'toca', cuenta: 'toca', calcula: 'toca', completa: 'toca', quehora: 'toca', sombra: 'toca', mas: 'toca', diferente: 'toca', cualfalta: 'toca', dondequedo: 'toca', repite: 'toca',
    espera: 'toca', para: 'toca', toca: 'toca', aplasta: 'toca', revienta: 'toca', notoques: 'toca',
    ordena: 'arrastra', alimenta: 'arrastra', conecta: 'arrastra', atrapa: 'arrastra', rebota: 'arrastra', equilibra: 'arrastra',
    corta: 'desliza', cruza: 'desliza', dibuja: 'desliza', sigue: 'desliza', limpia: 'desliza' };
  let curGame = null;
  const GSTAGE = {
    toca: '<i class="gbox"></i><i class="gbox mid"></i><i class="gbox"></i><i class="rip"></i><span class="hand">👆</span>',
    arrastra: '<i class="gslot"></i><i class="gpiece"></i><span class="hand">👆</span>',
    desliza: '<svg viewBox="0 0 150 76"><path class="gpath" d="M14 56 C36 8 62 70 86 30 S128 14 138 52"/><path class="gink" pathLength="200" d="M14 56 C36 8 62 70 86 30 S128 14 138 52"/></svg><span class="hand">👆</span>',
  };
  const gesture = id => { const k = KIND[id]; if (!k) return ''; const [label, , col] = KINDS[k];
    return `<div class="gest g-${k}" style="--kc:${col}"><div class="gstage" aria-hidden="true">${GSTAGE[k]}</div><b>${label}</b></div>`; };
  // During the intro the stage wears its type's color (frame and name); it comes off when the game starts
  const dress = id => { const k = KIND[id]; if (k) { demo.dataset.kind = k; demo.style.setProperty('--kind', KINDS[k][2]); } };
  const undress = () => { delete demo.dataset.kind; };
  function command(word, then, icon, hint, top) {
    const gx = gesture(curGame), extra = gx ? 500 : 0; dress(curGame); const go = then; then = () => { undress(); go(); };
    set(`${gx}${top || ''}<div class="cmd">${word}</div>${icon ? `<div class="target" aria-hidden="true">${icon}</div>` : ''}${hint ? `<div class="sub">${hint}</div>` : ''}`);
    later(then, (reduce ? 900 : top ? 1800 : hint ? 1600 : icon ? 1200 : 800) + extra);
  }

  // ---- Shared pieces for the newer games ----
  // Number answers with a bit of drama: the clock stops, the chosen one grows and trembles under a spotlight
  // while the rest fade, then it lights up green (or red, and the right one shows itself) before the stars
  const numPick = (box, right, t0, grade, wrongNote) => {
    let locked = false;
    box.querySelectorAll('button').forEach(b => tap(b, () => {
      if (locked) return; locked = true; cancelAnimationFrame(raf);
      const ok = +b.dataset.v === right, n = ok ? grade((performance.now() - t0) / 1000 * sp) : 0;
      box.classList.add('picking'); b.classList.add('chosen');
      later(() => { b.classList.add(ok ? 'right' : 'wrong'); if (!ok) box.querySelector(`button[data-v="${right}"]`)?.classList.add('reveal');
        try { navigator.vibrate?.(ok ? 30 : [40, 40, 40]); } catch (_) { /* none */ }
        later(() => finish(n, ok ? null : wrongNote, 700), 450); }, reduce ? 150 : 700);
    }));
  };
  const $id = id => document.getElementById(id);
  let animTok = 0;
  const animate = fn => {   // a frame loop that stops by itself when the game ends
    const my = ++animTok, t0 = performance.now();
    const st = now => { if (my !== animTok || !active) return; if (fn(now - t0, now) === false) return; loop = requestAnimationFrame(st); };
    loop = requestAnimationFrame(st);
  };
  const lay0 = (html = '') => { full(`<div class="layer" id="lay">${html}</div>`); const lay = $id('lay'); return { lay, W: lay.clientWidth, H: lay.clientHeight }; };
  const ptIn = (lay, e) => { const r = lay.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const place = (n, x, y) => { n.style.left = x + 'px'; n.style.top = y + 'px'; };
  const posOf = n => [parseFloat(n.style.left), parseFloat(n.style.top)];
  const mk = (parent, tag, cls, html = '') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; if (tag === 'button') e.type = 'button'; parent.append(e); return e; };
  const pop = (lay, text, x, y, cls = '') => { const s = mk(lay, 'span', 'obj popt ' + cls, text); place(s, x, y); later(() => s.remove(), 650); };
  const back = (n, xy) => { n.classList.add('back'); place(n, ...xy); later(() => n.classList.remove('back'), 230); };
  const secs = t0 => (performance.now() - t0) / 1000 * sp;
  const timeStars = (t0, a, b) => { const s = secs(t0); return s < a ? 3 : s < b ? 2 : 1; };
  // Pointer listeners on the whole stage; one set per game, removed when it ends
  const listen = h => {
    demo.style.touchAction = 'none';
    const d = e => { e.preventDefault(); if (active) h.down?.(e); }, m = e => { if (active) h.move?.(e); }, u = e => { if (active) h.up?.(e); };
    demo.addEventListener('pointerdown', d); demo.addEventListener('pointermove', m); addEventListener('pointerup', u); addEventListener('pointercancel', u);
    cleanup = () => { demo.removeEventListener('pointerdown', d); demo.removeEventListener('pointermove', m); removeEventListener('pointerup', u); removeEventListener('pointercancel', u); };
  };
  // Something the finger picks up and drops; onDrop(x, y) decides where it lands
  const draggable = (n, lay, onDrop, onMove) => {
    let off = null; n.style.touchAction = 'none'; demo.style.touchAction = 'none';
    n.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (!active) return; n.setPointerCapture(e.pointerId); const p = ptIn(lay, e), q = posOf(n); off = [p[0] - q[0], p[1] - q[1]]; n.classList.add('lift'); });
    n.addEventListener('pointermove', e => { if (!off || !active) return; const p = ptIn(lay, e); place(n, p[0] - off[0], p[1] - off[1]); onMove?.(...posOf(n)); });
    const up = () => { if (!off) return; off = null; n.classList.remove('lift'); if (active) onDrop(...posOf(n)); };
    n.addEventListener('pointerup', up); n.addEventListener('pointercancel', up);
  };
  const near = (a, b, r) => Math.hypot(a[0] - b[0], a[1] - b[1]) < r;

  const GAMES = {
    // ¡ENCUENTRA!: a theme of lookalikes in the same colors; the command shows which one to find
    // ¡CRUZA!: a smooth, curvy bridge of even width. Chevrons along it point the way and the crossed part lights up.
    // The bridge has a visible edge: touch it and the bird falls
    cruza() {
      command(t('¡RUEDA!'), () => {
        const { lay, W, H } = lay0(`<svg id="sv" class="fullsvg"></svg><span class="obj startring" id="st0"></span><span class="hint-here" id="here">👆<em>${t('empieza aquí')}</em></span><span class="obj ball2" id="wk"><i></i></span><div class="pct" id="pct">0 %</div><div class="rstars" id="rs">★★★</div><div class="rclock" id="rc"></div>`);
        const sv = $id('sv'), wk = $id('wk'), here = $id('here'), pct = $id('pct'), wkIn = wk.firstChild;
        sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
        // The bridge takes a different shape each time, and not always in the middle of the stage
        const SHAPES = ['curva', 'espiral', 'circulo', 'ola', 'gancho'], shape = pick(SHAPES);
        const HALF = shape === 'espiral' ? 21 : 25;
        let dense = [];
        const along = (n, f) => { for (let k = 0; k <= n; k++) dense.push(f(k / n)); };
        if (shape === 'curva') {          // an S that swings left and right down the stage
          const side = rand() < 0.5 ? 1 : -1;
          const P = [0, 1, 2, 3].map(k => [side * (k % 2 ? 1 : -1) * W * 0.26 * (k === 0 || k === 3 ? 0.6 : 1), H * (-0.38 + 0.76 * k / 3)]);
          const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return [0, 1].map(i => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3)); };
          for (let i = 0; i < 3; i++) for (let k = 0; k < 40; k++) dense.push(cr(P[Math.max(0, i - 1)], P[i], P[i + 1], P[Math.min(3, i + 2)], k / 40));
          dense.push(P[3]);
        } else if (shape === 'espiral') { // from the outside in, about a turn and a half
          const r0 = Math.min(W, H) * 0.4, r1 = Math.min(W, H) * 0.1, turns = 1.55, a0 = rand() * Math.PI * 2, dir = rand() < 0.5 ? 1 : -1;
          along(220, t => { const r = r0 - (r0 - r1) * t, a = a0 + dir * t * turns * 2 * Math.PI; return [r * Math.cos(a), r * Math.sin(a)]; });
        } else if (shape === 'circulo') { // almost a full ring, start and finish side by side
          const r = Math.min(W, H) * 0.34, a0 = rand() * Math.PI * 2, dir = rand() < 0.5 ? 1 : -1;
          along(160, t => { const a = a0 + dir * (0.32 + t * (2 * Math.PI - 0.64)); return [r * Math.cos(a), r * 1.1 * Math.sin(a)]; });
        } else if (shape === 'ola') {     // a wave going down, two full swings
          const amp = W * 0.27, ph = rand() < 0.5 ? 0 : Math.PI;
          along(160, t => [amp * Math.sin(ph + t * 4 * Math.PI), H * (-0.38 + 0.76 * t)]);
        } else {                          // a hook: down one side, round the bottom, back up the other
          const w = W * 0.26, top = -H * 0.36, bot = H * 0.18, side = rand() < 0.5 ? 1 : -1;
          along(40, t => [-side * w, top + (bot - top) * t]);
          along(60, t => [-side * w * Math.cos(t * Math.PI), bot + w * Math.sin(t * Math.PI)]);
          along(30, t => [side * w, bot - (bot - top * 0.4) * t]);
        }
        // Somewhere on the stage that fits it, with a margin from every edge
        const xs = dense.map(p => p[0]), ys = dense.map(p => p[1]), m = HALF + 18;
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        const ox = m - minX + rand() * Math.max(0, (W - 2 * m) - (maxX - minX)), oy = m + 10 - minY + rand() * Math.max(0, (H - 2 * m - 20) - (maxY - minY));
        dense = dense.map(([x, y]) => [x + ox, y + oy]);
        // Resample every 4 px of length, so progress and width are even all along
        const S = [dense[0]]; let acc = 0;
        for (let i = 1; i < dense.length; i++) { const a = dense[i - 1], b = dense[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!d) continue; acc += d; while (acc >= 4) { acc -= 4; const k = 1 - acc / d; S.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); } }
        S.push(dense[dense.length - 1]);
        lay.dataset.shape = shape;
        const LEN = S.length * 4, pts = S.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
        const GOAL = 18, goalPts = S.slice(-GOAL).map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
        const chev = S.filter((_, i) => i % 14 === 7 && i < S.length - GOAL - 2).map((p, j) => { const i = j * 14 + 7, q = S[Math.min(S.length - 1, i + 2)], an = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
          return `<polygon class="chev" style="animation-delay:${(j * 0.08).toFixed(2)}s" points="-6,-8 6,0 -6,8 -2,0" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${an.toFixed(1)})"/>`; }).join('');
        sv.innerHTML = `<polyline points="${pts}" fill="none" stroke="#ff4d5e" stroke-width="${2 * HALF + 6}" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
          <polyline points="${pts}" fill="none" stroke="#7a4e24" stroke-width="${2 * HALF}" stroke-linejoin="round" stroke-linecap="round"/>
          <polyline points="${pts}" fill="none" stroke="#b07a40" stroke-width="${2 * HALF - 10}" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="7 4"/>
          <defs><pattern id="chk" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#111"/><rect width="7" height="7" fill="#fff"/><rect x="7" y="7" width="7" height="7" fill="#fff"/></pattern></defs>
          <polyline points="${goalPts}" fill="none" stroke="url(#chk)" stroke-width="${2 * HALF}" stroke-linejoin="round" stroke-linecap="butt"/>
          ${chev}<polyline id="lit" fill="none" stroke="#ffd23f" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity=".95" points="" style="filter: drop-shadow(0 0 4px rgba(255,210,63,.8))"/><g id="marks"></g>`;
        const lit = sv.querySelector('#lit');
        const st0 = $id('st0'); place(st0, ...S[0]); place(here, ...S[0]); place(wk, ...S[0]);
        let on = false, cur = 0, t0 = 0, touches = 0, touching = false, rolled = 0, lastB = null;
        const trail = [], marks = sv.querySelector('#marks');
        const fall = msg => { wk.classList.add('falling'); lay.classList.add('fail'); try { navigator.vibrate?.(60); } catch (_) { /* none */ } finish(0, msg); };
        listen({
          // Lifting the finger only pauses the ball (the clock keeps going): put it back on the ball to go on
          down: e => { if (on) return; const p = ptIn(lay, e); if (!near(p, t0 ? lastB : S[0], HALF + 18)) return; on = true; here.hidden = true;
            if (!t0) { t0 = performance.now(); st0.hidden = true; wk.classList.add('go'); lastB = S[0]; trail.push(S[0]); } },
          move: e => { if (!on) return; const p = ptIn(lay, e);
            let best = -1, bd = 1e9;
            for (let i = Math.max(0, cur - 10); i <= Math.min(S.length - 1, cur + 18); i++) { const dd = Math.hypot(p[0] - S[i][0], p[1] - S[i][1]); if (dd < bd) { bd = dd; best = i; } }
            if (bd > HALF + 26) { fall(t('¡Te saliste del camino!')); return; }
            // The ball goes exactly where your finger is, kept on the road
            let b = p; if (bd > HALF - 2) { const c = S[best], k = (HALF - 2) / bd; b = [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; }
            rolled += Math.hypot(b[0] - lastB[0], b[1] - lastB[1]); lastB = b;
            place(wk, ...b); wkIn.style.setProperty('--roll', (rolled / 15) + 'rad');
            if (!trail.length || Math.hypot(b[0] - trail[trail.length - 1][0], b[1] - trail[trail.length - 1][1]) > 3) { trail.push(b); lit.setAttribute('points', trail.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')); }
            // Touching the edge costs a star each time (it counts again once you're back in the middle)
            // Each touch of the edge takes a star; the third one loses the game
            if (bd > HALF - 4 && !touching) { touching = true; touches++;
              marks.insertAdjacentHTML('beforeend', `<circle cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="7" fill="#ff4d5e" stroke="#fff" stroke-width="2"/>`);
              $id('rs').innerHTML = '★'.repeat(Math.max(0, 3 - touches)) + `<s>${'★'.repeat(Math.min(3, touches))}</s>`;
              pop(lay, '−★', b[0], b[1] - 16, 'bad'); try { navigator.vibrate?.(30); } catch (_) { /* none */ }
              if (touches >= 3) { fall(t('¡Tocaste el borde 3 veces!')); return; } }
            else if (bd < HALF - 12) touching = false;
            wk.classList.toggle('wobble', bd > HALF * 0.7); lay.classList.toggle('warn', bd > HALF * 0.7);
            if (best > cur) { cur = best; pct.textContent = `${Math.round(cur / (S.length - 1) * 100)} %`; }
            // Reaching the finish in time: three stars, minus one for each touch of the edge
            if (cur >= S.length - GOAL + 3) { lay.classList.add('goal');
              finish(3 - touches, touches ? (touches === 1 ? t('¡Llegaste! · tocaste el borde 1 vez') : t('¡Llegaste! · tocaste el borde {n} veces', { n: touches })) : t('¡Llegaste sin tocar el borde! 🏁')); } },
          up: () => { if (!on) return; on = false; place(here, ...lastB); here.querySelector('em').textContent = t('sigue desde aquí'); here.hidden = false; },
        });
        // A time limit for the whole road, shown as the bar and as seconds counting down
        const LIMIT = T(Math.max(6000, LEN / 120 * 1000)), tStart = performance.now(), rc = $id('rc');
        animate(() => { rc.textContent = `⏱ ${Math.max(0, (LIMIT - (performance.now() - tStart)) / 1000).toFixed(1)}`; });
        active = true; runTimer(LIMIT, () => finish(0, t('¡Se acabó el tiempo!')));
      }, '<span class="example"><i class="ballicon"></i> → <i class="chkicon"></i></span>', t('llega a tiempo · cada toque al borde: −★ · 3 toques y pierdes'));
    },
    // ¡ESPERA… YA!: red, then green; tap on green, never before
    espera() {
      command(t('¡ESPERA… YA!'), () => {
        demo.classList.add('red'); set(`<div class="cmd white">${t('Espera…')}</div>`);
        active = true; let green = false, tg = 0;
        later(() => {
          green = true; demo.classList.replace('red', 'green');
          set(`<div class="cmd white huge">${t('¡YA!')}</div>`); tg = performance.now();
          runTimer(900, () => finish(0, t('¡Muy lento!')));
        }, 1000 + rand() * 2000);
        const h = e => {
          e.preventDefault(); if (!active) return;
          // The color you tapped lights up and stays: brighter red if too soon, greener if on time
          demo.classList.add('hot');
          if (!green) { finish(0, t('¡Muy pronto!')); return; }
          const ms = performance.now() - tg;
          finish(ms < 300 ? 3 : ms < 450 ? 2 : ms < 650 ? 1 : 0, `${Math.round(ms)} ms`);
        };
        demo.addEventListener('pointerdown', h);
        cleanup = () => demo.removeEventListener('pointerdown', h);
      }, '🔴 → 🟢');
    },
    // ¡TOCA RÁPIDO!: every press of the big button inflates the clown's own head. It stretches, wobbles and gets more and more scared; at 24 it pops
    toca() {
      let taps = 0;
      const BURST = 24, sc = n => 0.5 + n * 0.045;
      const BAL = `<svg viewBox="0 0 100 130" aria-hidden="true"><defs><radialGradient id="balg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#a8fff4"/><stop offset=".55" stop-color="#16c9c0"/><stop offset="1" stop-color="#08746f"/></radialGradient></defs>
        <path d="M50 4 C80 4 96 28 94 50 C92 76 68 94 53 99 L47 99 C32 94 8 76 6 50 C4 28 20 4 50 4 Z" fill="url(#balg)"/>
        <ellipse cx="32" cy="30" rx="9" ry="15" fill="#fff" opacity=".45" transform="rotate(-25 32 30)"/>
        <path d="M45 106 L55 106 L52 99 L48 99 Z" fill="#08746f"/></svg>`;
      command(t('¡TOCA RÁPIDO!'), () => {
        // A hand pump (press it), tied to the balloon by a string that hangs and swings like a real one
        const PUMP = `<svg viewBox="0 0 80 140" aria-hidden="true"><defs>
            <linearGradient id="pmBar" x1="0" x2="1"><stop offset="0" stop-color="#a30e55"/><stop offset=".35" stop-color="#ff5fa8"/><stop offset=".6" stop-color="#ff2e88"/><stop offset="1" stop-color="#8a0c48"/></linearGradient>
            <linearGradient id="pmRod" x1="0" x2="1"><stop offset="0" stop-color="#7d8798"/><stop offset=".5" stop-color="#f4f7fb"/><stop offset="1" stop-color="#5b6576"/></linearGradient></defs>
          <g class="plunger"><rect x="37" y="14" width="6" height="40" fill="url(#pmRod)"/><rect x="8" y="4" width="64" height="14" rx="7" fill="#ffd23f" stroke="#b98a1e" stroke-width="2"/><rect x="12" y="6" width="56" height="3" rx="1.5" fill="#fff" opacity=".5"/></g>
          <rect x="22" y="44" width="36" height="82" rx="8" fill="url(#pmBar)" stroke="#6e0838" stroke-width="2"/><rect x="20" y="42" width="40" height="8" rx="3" fill="#ffd23f" stroke="#b98a1e" stroke-width="1.5"/>
          <rect x="27" y="56" width="5" height="60" rx="2.5" fill="#fff" opacity=".3"/>
          <rect x="12" y="64" width="12" height="8" rx="3" fill="#5b6576"/><circle cx="13" cy="68" r="3" fill="#3a414d"/><rect x="4" y="124" width="72" height="12" rx="6" fill="#3a2f4d" stroke="#1b1426" stroke-width="2"/></svg>`;
        full(`<div class="layer pump" id="lay"><svg class="bstring" id="bs"><path class="hose-out"/><path class="hose-in"/><path class="hose-rib"/><circle class="hose-cuff" r="5"/></svg><div class="balloon2" id="bl">${BAL}</div>
          <div class="tapcount" id="cnt">0</div><button type="button" class="pumpbtn2" id="pb" aria-label="${t('Inflar')}">${PUMP}</button>
          <div class="presshint" id="ph"><b>${t('¡APRIETA!')}</b><span>👇</span></div></div>`);
        const bl = $id('bl'), cnt = $id('cnt'), lay = $id('lay'), pb = $id('pb'), bs = $id('bs'), hose = [...bs.querySelectorAll('path')], cuff = bs.querySelector('circle'), ph = $id('ph');
        const W = lay.clientWidth, H = lay.clientHeight; bs.setAttribute('viewBox', `0 0 ${W} ${H}`);
        // Where the hose is tied: the balloon's knot, read from where the balloon really sits (it grows from 85 % of
        // its height, the knot is at 106 of its 130), and the pump's nozzle
        const knot = () => [bl.offsetLeft + bl.offsetWidth / 2, bl.offsetTop + bl.offsetHeight * (0.85 + (106 / 130 - 0.85) * sc(taps))];
        const nozzle = () => [pb.offsetLeft + pb.offsetWidth * 12 / 80, pb.offsetTop + pb.offsetHeight * 68 / 140];
        // The string: a chain of points with gravity, both ends tied, a bit longer than the gap so it sags
        const NP = 16, k0 = knot(), n0 = nozzle(), LEN = Math.hypot(n0[0] - k0[0], n0[1] - k0[1]) * 1.07, SEG = LEN / (NP - 1);
        const SAG = Math.hypot(n0[0] - k0[0], n0[1] - k0[1]) * 0.2;   // start already hanging in a gentle curve, not straight
        const P = [...Array(NP).keys()].map(i => { const f = i / (NP - 1), x = k0[0] + (n0[0] - k0[0]) * f, y = k0[1] + (n0[1] - k0[1]) * f + SAG * 4 * f * (1 - f); return { x, y, px: x, py: y }; });
        let tied = true, lastT = performance.now();
        const rope = now => { if (!bs.isConnected) return; const dt = Math.min(0.033, (now - lastT) / 1000); lastT = now;
          P.forEach(q => { const vx = (q.x - q.px) * 0.96, vy = (q.y - q.py) * 0.96; q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + 900 * dt * dt; });
          for (let it = 0; it < 14; it++) {
            if (tied) { const k = knot(); P[0].x = k[0]; P[0].y = k[1]; }
            const n = nozzle(); P[NP - 1].x = n[0]; P[NP - 1].y = n[1];
            for (let i = 0; i < NP - 1; i++) { const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, e = (d - SEG) / d / 2;
              const fa = (i === 0 && tied) ? 0 : 1, fb = i + 1 === NP - 1 ? 0 : 1, w = (fa + fb) || 1;
              a.x += dx * e * 2 * fa / w; a.y += dy * e * 2 * fa / w; b.x -= dx * e * 2 * fb / w; b.y -= dy * e * 2 * fb / w; }
            P.forEach(q => { if (q.y > H - 4) q.y = H - 4; }); }
          let d = `M${P[0].x.toFixed(1)} ${P[0].y.toFixed(1)}`;
          for (let i = 1; i < NP - 1; i++) { const mx = (P[i].x + P[i + 1].x) / 2, my = (P[i].y + P[i + 1].y) / 2; d += ` Q${P[i].x.toFixed(1)} ${P[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`; }
          d += ` L${P[NP - 1].x.toFixed(1)} ${P[NP - 1].y.toFixed(1)}`; hose.forEach(h => h.setAttribute('d', d));
          cuff.setAttribute('cx', P[0].x.toFixed(1)); cuff.setAttribute('cy', P[0].y.toFixed(1)); cuff.style.display = tied ? '' : 'none';
          requestAnimationFrame(rope); };
        requestAnimationFrame(rope);
        // Each press jolts the string a little, so it swings
        const jolt = () => P.forEach((q, i) => { const f = Math.sin(i / (NP - 1) * Math.PI); q.px -= (rand() - 0.4) * 2.5 * f; q.py += 1.2 * f; });
        const draw = () => { bl.style.setProperty('--s', sc(taps)); bl.classList.toggle('tense', taps >= 15); bl.classList.toggle('tense2', taps >= 20); };
        draw();
        const grade = () => taps >= 20 ? 3 : taps >= 14 ? 2 : taps >= 8 ? 1 : 0;
        const boom = () => {
          const r = bl.getBoundingClientRect(), L = lay.getBoundingClientRect(), cx = r.left - L.left + r.width / 2, cy = r.top - L.top + r.height * 0.4;
          bl.remove(); tied = false; P.forEach(q => { q.py += 6; });
          mk(lay, 'div', 'animeflash'); mk(lay, 'div', 'speedlines'); lay.classList.add('shake');
          const ring = mk(lay, 'span', 'obj boomring'); place(ring, cx, cy);
          for (let i = 0; i < 16; i++) { const sh = mk(lay, 'span', 'obj shard'); sh.style.background = '#16c9c0'; place(sh, cx, cy); const an = i / 16 * Math.PI * 2 + rand() * 0.4, d = 110 + rand() * 90;
            sh.style.setProperty('--dx', `${Math.cos(an) * d}px`); sh.style.setProperty('--dy', `${Math.sin(an) * d}px`); sh.style.setProperty('--r', `${Math.round(rand() * 720 - 360)}deg`); }
          for (let i = 0; i < 30; i++) { const c = mk(lay, 'span', 'obj confetti'); place(c, cx, cy); const an = rand() * Math.PI * 2, d = 60 + rand() * 150;
            c.style.background = pick(['#ffd23f', '#2ee6d6', '#ff2e88', '#9dff3a', '#8a5cff', '#fff']);
            c.style.setProperty('--dx', `${Math.cos(an) * d}px`); c.style.setProperty('--dy', `${Math.sin(an) * d + 60}px`); c.style.setProperty('--r', `${Math.round(rand() * 900)}deg`); }
          const cb = mk(lay, 'div', 'comic', `<div class="burst"></div><b>${t('¡PUM!')}</b>`); place(cb, cx, Math.max(70, cy)); cb.style.setProperty('--tilt', '-8deg');
          try { navigator.vibrate?.([30, 40, 60]); } catch (_) { /* none */ }
        };
        tap(pb, () => {
          taps++; cnt.textContent = taps; draw();
          bl.classList.remove('puff'); void bl.offsetWidth; bl.classList.add('puff');
          pb.classList.remove('press'); void pb.offsetWidth; pb.classList.add('press'); jolt();
          if (ph.isConnected) ph.remove();
          if (taps >= BURST) { boom(); finish(3, t('¡Reventó!'), 1300); }
        });
        active = true;
        runTimer(5000, () => finish(grade(), t('{n} infladas', { n: taps })));
      }, '🎈💥', t('aprieta el bombín para inflar el globo'));
    },
    // ¡QUÉ COLOR!: the command says what to look at (the letters' color or the color the word says), then the word and four colors
    quecolor() {
      const C = [[t('ROJO'), '#ff4d5e', '🔴'], [t('AZUL'), '#4d8bff', '🔵'], [t('VERDE'), '#3ddc84', '🟢'], [t('AMARILLO'), '#ffd23f', '🟡']];
      const w = rnd(4); let ink = rnd(4); if (ink === w) ink = (ink + 1 + rnd(3)) % 4;
      // Two ways to ask, at random: the color of the letters, or the color the word says
      const byInk = rand() < 0.5, goal = byInk ? ink : w;
      const ask = byInk ? t('¿De qué color son las <u>letras</u>?') : t('¿Qué color <u>dice</u> la palabra?');
      // The intro: the title and, right under it, what to look at this time; nothing else
      dress('quecolor'); set(`${gesture('quecolor')}<div class="cmd">¡QUÉ COLOR!</div><div class="mode-say big">${byInk ? t('el color de las <u>letras</u>') : t('el color que <u>dice</u> la palabra')}</div>`);
      later(() => { undress();
        set(`<div class="sub ask">${ask}</div><div class="stroop" style="color:${C[ink][1]}">${C[w][0]}</div><div class="swatches">${shuffle([0, 1, 2, 3]).map(i => `<button type="button" data-i="${i}" style="background:${C[i][1]}" aria-label="${C[i][0]}"></button>`).join('')}</div>`);
        const why = byInk ? t('Las letras eran {c}, no importa lo que dice', { c: C[ink][2] }) : t('La palabra decía {w} {c}, no importa su color', { w: C[w][0], c: C[w][2] });
        active = true; const t0 = runTimer(T(4200), () => finish(0, why));
        screen.querySelectorAll('.swatches button').forEach(b => tap(b, () => {
          const s = (performance.now() - t0) / 1000 * sp;
          finish(+b.dataset.i === goal ? (s < 1.4 ? 3 : s < 2.5 ? 2 : 1) : 0, +b.dataset.i === goal ? null : why);
        }));
      }, reduce ? 900 : 2300);
    },
    // ¡CUENTA! 🍎: many red things at once, the four answers right under them
    cuenta() {
      // What to count changes every time, always among lookalikes of its own color
      const THEMES = [
        ['🍎', t('cuenta solo las manzanas'), ['🍅', '🍒', '🍓', '🌶️']],       // red
        ['🍋', t('cuenta solo los limones'), ['🍌', '🧀', '🌽', '⭐']],          // yellow
        ['🥒', t('cuenta solo los pepinos'), ['🥦', '🥬', '🫑', '🍏']],          // green
        ['🍊', t('cuenta solo las naranjas'), ['🥕', '🎃', '🍑', '🏀']],         // orange
        ['🍇', t('cuenta solo las uvas'), ['🍆', '🔮', '☂️', '🟣']],            // purple
        ['🐟', t('cuenta solo los peces'), ['🐬', '🐳', '🐋', '💧']],            // blue
      ];
      const [goal, goalName, lookalikes] = pick(THEMES);
      const k = 5 + rnd(6), extra = 7 + rnd(4);
      const items = shuffle([...Array(k).fill(goal), ...Array.from({ length: extra }, () => pick(lookalikes))]);
      const cols = 5, rows = 5, slots = shuffle([...Array(cols * rows).keys()]).slice(0, items.length);
      const opts = shuffle([k, ...shuffle([k - 2, k - 1, k + 1, k + 2].filter(v => v > 0)).slice(0, 3)]);
      command(t('¡CUENTA!'), () => {
        const fs = Math.max(22, Math.min((demo.clientWidth - 24) / cols, (demo.clientHeight * 0.66 - 40) / rows) * 0.7);
        full(`<div class="countbox"><div class="field2">${items.map((it, i) => { const c = slots[i] % cols, r = Math.floor(slots[i] / cols);
          return `<span style="left:${(c + 0.5) * 100 / cols + (rand() - 0.5) * 8}%;top:${(r + 0.5) * 100 / rows + (rand() - 0.5) * 8}%;font-size:${fs}px;--dx:${Math.round((rand() - 0.5) * 12)}px;--dy:${Math.round((rand() - 0.5) * 12)}px;animation-duration:${(0.9 + rand() * 1.1).toFixed(2)}s;animation-delay:-${(rand() * 2).toFixed(2)}s">${it}</span>`; }).join('')}</div>
          <div class="opts4">${opts.map(v => `<button type="button" data-v="${v}">${v}</button>`).join('')}</div></div>`);
        active = true; const t0 = runTimer(T(5000), () => finish(0, t('Eran {n}', { n: k })));
        numPick(screen.querySelector('.opts4'), k, t0, s => s < 2.5 ? 3 : s < 4 ? 2 : 1, t('Eran {n}', { n: k }));
      }, goal, goalName);
    },
    // ¡ATRAPA!: drag the basket, catch the 🪙, dodge the 💣; each one falls a little faster than the last
    atrapa() {
      command(t('¡ATRAPA!'), () => {
        full('<div class="layer" id="lay"><span class="basket" id="bk">🧺</span></div>');
        const lay = document.getElementById('lay'), bk = document.getElementById('bk');
        demo.style.touchAction = 'none';
        let bx = 50, cookies = 0, got = 0, socks = 0;
        const t0 = performance.now();
        // 7 coins and 3 bombs, the first one always a coin. Each falls 5 % faster than the one before
        // and comes a little sooner: the first takes 1.5 s to fall, the last about 0.8 s
        let mix; do { mix = shuffle([...Array(7).fill('🪙'), ...Array(3).fill('💣')]); } while (mix[0] === '💣');
        let at = 150;
        const plan = mix.map((e, i) => { const p = { e, at, fall: T(1500) * (1 - 0.05 * i), x: 12 + rnd(76) }; at += T(400) * (1 - 0.04 * i); return p; });
        const last = plan[plan.length - 1], dur = last.at + last.fall + 300;
        cookies = plan.filter(p => p.e === '🪙').length;
        const move = e => { const r = lay.getBoundingClientRect(); bx = Math.max(8, Math.min(92, (e.clientX - r.left) / r.width * 100)); bk.style.left = bx + '%'; };
        demo.addEventListener('pointermove', move); demo.addEventListener('pointerdown', move);
        cleanup = () => { demo.removeEventListener('pointermove', move); demo.removeEventListener('pointerdown', move); };
        // All the coins caught: a well-to-do fellow with a huge blond mane (our own cartoon) pops in from the side, cash in hand, thumbs up
        const tycoon = () => { const m = mk(demo, 'div', 'mascot tycoon', `<svg viewBox="0 0 150 180" aria-hidden="true">
            <defs><linearGradient id="tyHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#f4cf5c"/><stop offset="1" stop-color="#d9a92e"/></linearGradient></defs>
            <g class="mane"><circle cx="41" cy="59" r="10.6" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M37 60 a4.8 4.8 0 1 1 6.4 3.7" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="45" cy="49" r="10.3" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M41 50 a4.6 4.6 0 1 1 6.2 3.6" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="53" cy="41" r="11.3" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M48 42 a5.1 5.1 0 1 1 6.8 4.0" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="63" cy="36" r="10.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M59 37 a4.6 4.6 0 1 1 6.1 3.6" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="75" cy="34" r="11.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M70 35 a5.0 5.0 0 1 1 6.6 3.9" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="87" cy="36" r="10.7" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M82 37 a4.8 4.8 0 1 1 6.4 3.8" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="97" cy="41" r="10.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M93 42 a4.6 4.6 0 1 1 6.1 3.5" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="105" cy="49" r="11.0" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M100 50 a5.0 5.0 0 1 1 6.6 3.9" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="109" cy="59" r="10.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M104 60 a4.5 4.5 0 1 1 6.0 3.5" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="43" cy="62" r="10.6" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M38 63 a4.8 4.8 0 1 1 6.4 3.7" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="42" cy="74" r="11.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M37 75 a5.0 5.0 0 1 1 6.7 3.9" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="37" cy="86" r="10.7" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M32 87 a4.8 4.8 0 1 1 6.4 3.7" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="48" cy="91" r="9.3" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M44 92 a4.2 4.2 0 1 1 5.6 3.3" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="36" cy="98" r="11.9" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M31 99 a5.4 5.4 0 1 1 7.2 4.2" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="47" cy="103" r="9.9" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M42 104 a4.4 4.4 0 1 1 5.9 3.5" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="35" cy="110" r="12.0" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M29 111 a5.4 5.4 0 1 1 7.2 4.2" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="46" cy="115" r="9.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M42 116 a4.1 4.1 0 1 1 5.4 3.2" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="31" cy="122" r="10.9" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M26 123 a4.9 4.9 0 1 1 6.6 3.8" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="42" cy="127" r="9.2" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M37 128 a4.1 4.1 0 1 1 5.5 3.2" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="31" cy="134" r="11.0" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M26 135 a4.9 4.9 0 1 1 6.6 3.8" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="42" cy="139" r="10.2" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M38 140 a4.6 4.6 0 1 1 6.1 3.6" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="106" cy="62" r="11.4" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M101 63 a5.1 5.1 0 1 1 6.8 4.0" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="110" cy="74" r="11.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M105 75 a5.0 5.0 0 1 1 6.6 3.9" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="112" cy="86" r="10.6" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M107 87 a4.8 4.8 0 1 1 6.4 3.7" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="101" cy="91" r="9.1" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M97 92 a4.1 4.1 0 1 1 5.5 3.2" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="112" cy="98" r="11.5" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M107 99 a5.2 5.2 0 1 1 6.9 4.0" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="101" cy="103" r="9.6" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M97 104 a4.3 4.3 0 1 1 5.8 3.4" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="115" cy="110" r="11.4" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M110 111 a5.1 5.1 0 1 1 6.8 4.0" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="104" cy="115" r="9.7" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M100 116 a4.4 4.4 0 1 1 5.8 3.4" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="117" cy="122" r="11.7" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M112 123 a5.3 5.3 0 1 1 7.0 4.1" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="106" cy="127" r="10.0" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M102 128 a4.5 4.5 0 1 1 6.0 3.5" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="119" cy="134" r="11.4" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M114 135 a5.1 5.1 0 1 1 6.8 4.0" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/><circle cx="108" cy="139" r="9.8" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.8"/><path d="M104 140 a4.4 4.4 0 1 1 5.9 3.4" stroke="#fff3b0" stroke-width="1.6" fill="none" opacity=".85"/></g>
            <path d="M40 180 L44 128 C46 112 58 104 75 104 C92 104 104 112 106 128 L110 180 Z" fill="#1f2a4a" stroke="#0e1530" stroke-width="2.5"/>
            <path d="M62 106 L75 134 L88 106 Z" fill="#fff"/><path d="M72 112 L78 112 L80 140 L75 148 L70 140 Z" fill="#e0153f"/>
            <path d="M60 106 L68 140 L54 118 Z M90 106 L82 140 L96 118 Z" fill="#2b3a64"/>
            <ellipse cx="75" cy="72" rx="26" ry="31" fill="#f2c6a0" stroke="#d39f78" stroke-width="2"/>
            <circle cx="54" cy="52" r="8" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.6"/><circle cx="63" cy="45" r="9" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.6"/><circle cx="75" cy="42" r="9.5" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.6"/><circle cx="87" cy="45" r="9" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.6"/><circle cx="96" cy="52" r="8" fill="url(#tyHair)" stroke="#b98a1e" stroke-width="1.6"/>
            <path d="M56 62 q7 -5 14 -1 M80 61 q7 -4 14 1" stroke="#a5781f" stroke-width="3" fill="none" stroke-linecap="round"/>
            <ellipse cx="63" cy="69" rx="3.2" ry="3.8" fill="#2b1a0c"/><ellipse cx="87" cy="69" rx="3.2" ry="3.8" fill="#2b1a0c"/><circle cx="64" cy="67.5" r="1.1" fill="#fff"/><circle cx="88" cy="67.5" r="1.1" fill="#fff"/>
            <path d="M73 72 q2 9 -3 11" stroke="#c48a63" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M60 87 Q75 100 90 87 Q75 93 60 87 Z" fill="#fff" stroke="#8a3a2a" stroke-width="2" stroke-linejoin="round"/>
            <ellipse cx="55" cy="83" rx="5" ry="3" fill="#ff9a9a" opacity=".45"/><ellipse cx="95" cy="83" rx="5" ry="3" fill="#ff9a9a" opacity=".45"/>
            <path d="M44 132 C30 120 24 100 26 82" stroke="#1f2a4a" stroke-width="15" fill="none" stroke-linecap="round"/>
            <g transform="translate(26 70) rotate(-18)"><g class="bills">
              <g transform="rotate(-30)"><rect x="-26" y="-14" width="52" height="26" rx="3" fill="#86d37a" stroke="#3f8f36" stroke-width="2"/><text x="0" y="5" font-size="14" font-weight="900" text-anchor="middle" fill="#2f6e28">$</text></g>
              <g transform="rotate(-10)"><rect x="-26" y="-14" width="52" height="26" rx="3" fill="#94dc88" stroke="#3f8f36" stroke-width="2"/><text x="0" y="5" font-size="14" font-weight="900" text-anchor="middle" fill="#2f6e28">$</text></g>
              <g transform="rotate(12)"><rect x="-26" y="-14" width="52" height="26" rx="3" fill="#a4e698" stroke="#3f8f36" stroke-width="2"/><text x="0" y="5" font-size="14" font-weight="900" text-anchor="middle" fill="#2f6e28">$</text></g></g></g>
            <circle cx="28" cy="84" r="9" fill="#f2c6a0" stroke="#d39f78" stroke-width="2"/>
            <path d="M106 132 C120 126 126 112 124 98" stroke="#1f2a4a" stroke-width="15" fill="none" stroke-linecap="round"/>
            <g class="thumb"><rect x="114" y="82" width="20" height="18" rx="7" fill="#f2c6a0" stroke="#d39f78" stroke-width="2"/>
              <path d="M118 84 C116 74 118 66 124 64 C128 64 128 70 126 76 L126 84" fill="#f2c6a0" stroke="#d39f78" stroke-width="2" stroke-linejoin="round"/>
              <path d="M116 89 h16 M116 94 h16" stroke="#d39f78" stroke-width="1.5"/></g>
            <path d="M136 52 l3 6 6 1 -4 4 1 6 -6 -3 -6 3 1 -6 -4 -4 6 -1z" fill="#fff6a8"/></svg><b>${t('¡BIEN AHÍ!')}</b>`);
          for (let i = 0; i < 10; i++) { const bl = mk(demo, 'span', 'cashrain', '💵'); bl.style.left = `${5 + rand() * 90}%`; bl.style.animationDelay = `${rand() * 0.7}s`; setTimeout(() => bl.remove(), 1900); }
          setTimeout(() => m.remove(), 1750); };
        active = true; runTimer(dur, () => { const n = got === cookies && !socks ? 3 : got >= 4 && socks <= 1 ? 2 : got ? 1 : 0;
          if (got === cookies) tycoon(); finish(n, `${got}/${cookies} 🪙 · ${socks} 💣`, got === cookies ? 1800 : 800); });
        const step = now => {
          const t = now - t0;
          plan.forEach(p => {
            if (!p.el && t >= p.at) { p.el = document.createElement('span'); p.el.className = 'drop'; p.el.textContent = p.e; p.el.style.left = p.x + '%'; lay.append(p.el); }
            if (p.el && !p.done) {
              const y = (t - p.at) / p.fall * 100; p.el.style.top = y + '%';
              if (y >= 84 && y <= 94 && Math.abs(p.x - bx) < 13) { p.done = true; p.el.remove(); if (p.e === '🪙') { got++; bk.classList.remove('ding'); void bk.offsetWidth; bk.classList.add('ding'); } else { socks++; bk.classList.add('ouch'); const bang = document.createElement('span'); bang.className = 'drop'; bang.textContent = '💥'; bang.style.left = bx + '%'; bang.style.top = '80%'; lay.append(bang); later(() => { bk.classList.remove('ouch'); bang.remove(); }, 400); } }
              else if (y > 104) { p.done = true; p.el.remove(); }
            }
          });
          loop = requestAnimationFrame(step);
        };
        loop = requestAnimationFrame(step);
      }, '🪙 ✓  💣 ✗');
    },
    // ¡CORTA!: swipe along the dashed line across the sandwich
    corta() {
      // Different food each time, cut in any direction: across, top to bottom, or either diagonal (a little tilted)
      const FOOD = pick(['🥪', '🍉', '🍕', '🍰', '🥖', '🧀', '🍞', '🎂']);
      command(t('¡CORTA!'), () => {
        full(`<div class="layer" id="lay"><span class="sandwich">${FOOD}</span><svg id="sv" aria-hidden="true"></svg></div>`);
        const lay = document.getElementById('lay'), sv = document.getElementById('sv');
        const W = lay.clientWidth, H = lay.clientHeight; sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const ang = (pick([0, 90, 45, -45]) + rand() * 24 - 12) * Math.PI / 180, cx = W / 2, cy = H / 2, half = Math.min(W, H) * 0.42;
        const ux = Math.cos(ang), uy = Math.sin(ang), a = [cx - ux * half, cy - uy * half], b = [cx + ux * half, cy + uy * half];
        sv.innerHTML = `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"/><polyline id="trail" fill="none" stroke="#ffd23f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" points=""/>`;
        const trail = sv.querySelector('#trail');
        // The cut, anime style: a white flash, speed lines, a glowing slash, and the sandwich splits in two along your cut and slides apart
        const slash = off => {
          const nx = -uy, ny = ux, c = [cx + nx * off, cy + ny * off], B = Math.max(W, H) * 2;
          const side = sg => [[c[0] - ux * B, c[1] - uy * B], [c[0] + ux * B, c[1] + uy * B], [c[0] + ux * B + sg * nx * B, c[1] + uy * B + sg * ny * B], [c[0] - ux * B + sg * nx * B, c[1] - uy * B + sg * ny * B]]
            .map(q => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(', ');
          lay.querySelector('.sandwich').style.visibility = 'hidden';
          [...sv.children].forEach(ch => { ch.style.display = 'none'; });
          [1, -1].forEach(sg => { const h = mk(lay, 'div', 'halfcut', `<span class="sandwich">${FOOD}</span>`); h.style.clipPath = `polygon(${side(sg)})`;
            h.style.setProperty('--mx', `${(sg * nx * 30).toFixed(1)}px`); h.style.setProperty('--my', `${(sg * ny * 30 + 14).toFixed(1)}px`); h.style.setProperty('--rot', `${sg * 8}deg`); });
          sv.insertAdjacentHTML('beforeend', `<line class="slashline" x1="${c[0] - ux * W}" y1="${c[1] - uy * W}" x2="${c[0] + ux * W}" y2="${c[1] + uy * W}"/>`);
          mk(lay, 'div', 'speedlines'); mk(lay, 'div', 'animeflash'); lay.classList.add('shake');
          pop(lay, t('¡ZAS!'), cx, cy - Math.min(W, H) * 0.32);
        };
        demo.style.touchAction = 'none';
        let pts = null;
        const at = e => { const r = lay.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        const down = e => { e.preventDefault(); if (!active) return; pts = [at(e)]; trail.setAttribute('points', pts.map(p => p.join(',')).join(' ')); };
        const move = e => { if (!pts || !active) return; pts.push(at(e)); trail.setAttribute('points', pts.map(p => p.join(',')).join(' ')); };
        const up = () => {
          if (!pts || !active) return;
          const ts = pts.map(([x, y]) => (x - cx) * ux + (y - cy) * uy), ds = pts.map(([x, y]) => Math.abs(-(x - cx) * uy + (y - cy) * ux));
          const cover = (Math.max(...ts) - Math.min(...ts)) / (2 * half), avg = ds.reduce((s, v) => s + v, 0) / ds.length;
          const off = pts.reduce((s0, [x, y]) => s0 - (x - cx) * uy + (y - cy) * ux, 0) / pts.length;   // where your cut really went, across the line
          pts = null;
          if (cover < 0.6) { trail.setAttribute('points', ''); pop(lay, t('¡De lado a lado!'), cx, cy - 40, 'bad'); return; }   // too short: try again
          const n = avg < 10 ? 3 : avg < 20 ? 2 : avg < 35 ? 1 : 0;
          if (n) slash(off);
          finish(n, `${Math.round(avg)} px del corte`);
        };
        demo.addEventListener('pointerdown', down); demo.addEventListener('pointermove', move); addEventListener('pointerup', up);
        cleanup = () => { demo.removeEventListener('pointerdown', down); demo.removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
        active = true; runTimer(T(4000), () => finish(0, t('¡Se acabó el tiempo!')));
      }, `✂️ ${FOOD}`, t('corta por la línea'));
    },
    // ¡ORDENA!: four in a column, made for a phone held upright. The spots shrink from top to bottom (the top one
    // twice the bottom one), and whatever sits in a spot takes its size: drag them up and down until the biggest is on top
    ordena() {
      const SIZES = ['🐜', '🐭', '🐱', '🐕', '🐴', '🐘', '🐋'];
      // Numbers that are a little tricky to sort at a glance, one kind at random
      const numSet = () => { const s = new Set(), big = rand() < 0.35, span = big ? 900 : 90, lo = big ? 100 : 10, any = () => lo + rnd(span);
        const kind = rnd(5), d = rnd(10), base = lo + rnd(span - 14);
        for (let tries = 0; s.size < 4 && tries < 200; tries++) {
          if (kind === 0) s.add(any() & ~1);                                   // all even
          else if (kind === 1) s.add(any() | 1);                               // all odd
          else if (kind === 2) s.add(base + rnd(14));                          // all within a few of each other
          else if (kind === 3) { const t = 1 + rnd(9), u = 1 + rnd(9); if (t !== u) { s.add(big ? (t * 10 + u) * 10 + d : t * 10 + u); s.add(big ? (u * 10 + t) * 10 + d : u * 10 + t); } }   // swapped digits: 27 and 72
          else s.add(Math.floor(any() / 10) * 10 + d);                         // all ending in the same digit
        }
        return s.size === 4 ? [...s].slice(0, 4) : numSet(); };
      let vals, show, emo;
      if (rand() < 0.6) { vals = numSet(); show = v => v; emo = false; }
      else { vals = shuffle([...Array(SIZES.length).keys()]).slice(0, 4); show = v => SIZES[v]; emo = true; }
      const goal = [...vals].sort((x, y) => y - x);   // top to bottom: big to small
      let cur; do { cur = shuffle([...vals]); } while (cur.join() === goal.join());
      command(t('¡ORDENA!'), () => {
        const SZ = [92, 76, 60, 46], GAP = 12, BOX = 120, N = 4, ys = []; let y = 0; SZ.forEach(sz => { ys.push(y); y += sz + GAP; });
        const HT = y - GAP;
        set(`<div class="sortcol" id="sc" style="width:${BOX}px;height:${HT}px">${SZ.map((sz, i) => `<i class="sortslot" style="left:${(BOX - sz) / 2}px;top:${ys[i]}px;width:${sz}px;height:${sz}px"></i>`).join('')}
          <div class="sortaxis2"><span>${t('grande')}<b>▲</b></span><i></i><span>${t('chico')}<b>▼</b></span></div>
          ${cur.map(v => `<div class="chipv${emo ? ' emo' : ''}" data-v="${v}">${show(v)}</div>`).join('')}</div>`);
        const sc = $id('sc'); let els = [...sc.querySelectorAll('.chipv')];
        const fit = (el, i) => { const sz = SZ[i]; Object.assign(el.style, { width: sz + 'px', height: sz + 'px', left: (BOX - sz) / 2 + 'px', fontSize: (emo ? sz * 0.62 : sz * 0.46) + 'px', borderRadius: sz * 0.22 + 'px' }); };
        const layout = skip => els.forEach((el, i) => { if (el === skip) return; fit(el, i); el.style.top = ys[i] + 'px'; });
        layout();
        let drag = null, sy = 0, base = 0;
        const land = el => { el.classList.remove('land'); void el.offsetWidth; el.classList.add('land');
          const r = mk(sc, 'span', 'landring'); const i = els.indexOf(el); Object.assign(r.style, { left: BOX / 2 + 'px', top: ys[i] + SZ[i] / 2 + 'px', width: SZ[i] + 'px', height: SZ[i] + 'px' }); setTimeout(() => r.remove(), 500); };
        els.forEach(el => {
          el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (!active) return; drag = el; sy = e.clientY; base = ys[els.indexOf(el)] + SZ[els.indexOf(el)] / 2; el.setPointerCapture(e.pointerId); el.classList.add('lift'); });
          el.addEventListener('pointermove', e => { if (drag !== el) return;
            const c = Math.max(-10, Math.min(HT + 10, base + e.clientY - sy));
            // The spot it's over: the one whose middle is closest
            let to = 0, bd = 1e9; ys.forEach((yy, i) => { const d = Math.abs(yy + SZ[i] / 2 - c); if (d < bd) { bd = d; to = i; } });
            const from = els.indexOf(el); if (to !== from) { els.splice(from, 1); els.splice(to, 0, el); layout(el); }
            fit(el, to); el.style.top = (c - SZ[to] / 2) + 'px'; });
          const drop = () => { if (drag !== el) return; drag = null; el.classList.remove('lift'); layout(); land(el);
            if (els.map(c => +c.dataset.v).join() === goal.join()) { active = false; cancelAnimationFrame(raf);
              els.forEach((c, i) => setTimeout(() => c.classList.add('ok'), 120 + i * 110)); active = true;
              const s = (performance.now() - t0) / 1000 * sp; later(() => finish(s < 2.6 ? 3 : s < 4 ? 2 : 1, t('¡En orden!'), 900), 560); } };
          el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
        });
        active = true; const t0 = runTimer(T(5600), () => finish(0, t('¡Se acabó el tiempo!')));
      }, null, t('arrastra: el más grande arriba'));
    },
    // ¡CALCULA!: one quick operation, three answers right under it
    calcula() {
      let a, b, op, r;
      const kind = rnd(3);
      if (kind === 0) { a = 2 + rnd(18); b = 2 + rnd(18); op = '+'; r = a + b; }
      else if (kind === 1) { a = 10 + rnd(20); b = 2 + rnd(a - 3); op = '−'; r = a - b; }
      else { a = 2 + rnd(8); b = 2 + rnd(8); op = '×'; r = a * b; }
      const wrong = shuffle([r - 1, r + 1, r - 2, r + 2, r + 10, r - 10].filter(v => v >= 0 && v !== r)).slice(0, 2);
      const opts = shuffle([r, ...wrong]);
      command(t('¡CALCULA!'), () => {
        set(`<div class="op">${a} ${op} ${b}</div><div class="opts3 low">${opts.map(v => `<button type="button" data-v="${v}">${v}</button>`).join('')}</div>`);
        active = true; const t0 = runTimer(T(4000), () => finish(0, t('Era {n}', { n: r })));
        numPick(screen.querySelector('.opts3'), r, t0, s => s < 1.5 ? 3 : s < 3 ? 2 : 1, t('Era {n}', { n: r }));
      }, '➕ ➖ ✖️');
    },
    // ¡CONECTA!: a 7×6 board where you have three in a line; tap the column that drops the fourth
    conecta() {
      const R = 6, C = 7, ME = 1, THEM = 2;
      const wins = (g, p) => {
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          let k = 0; for (; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= R || cc < 0 || cc >= C || g[rr][cc] !== p) break; }
          if (k === 4) return true;
        }
        return false;
      };
      const heightOf = (g, c) => { let h = 0; while (h < R && g[h][c]) h++; return h; };
      const dropWins = (g, c, p) => { const h = heightOf(g, c); if (h >= R) return false; g[h][c] = p; const w = wins(g, p); g[h][c] = 0; return w; };
      // Build a board with exactly one winning column for you, and none for the rival
      let grid, goalCol;
      for (let tries = 0; tries < 400; tries++) {
        const [dr, dc] = pick([[0, 1], [1, 0], [1, 1], [1, -1]]);
        const r0 = rnd(R - (dr ? 3 : 0)), c0 = dc === 1 ? rnd(C - 3) : dc === -1 ? 3 + rnd(C - 3) : rnd(C);
        const cells = [0, 1, 2, 3].map(k => [r0 + dr * k, c0 + dc * k]);
        const miss = dr === 1 && dc === 0 ? 3 : rnd(4), [mr, mc] = cells[miss];
        const g = Array.from({ length: R }, () => Array(C).fill(0));
        const need = Array(C).fill(0);
        cells.forEach(([r, c], k) => { if (k !== miss) need[c] = Math.max(need[c], r + 1); });
        let ok = true;
        for (let c = 0; c < C; c++) {
          const h = c === mc ? mr : Math.max(need[c], rnd(4));
          if (c === mc && need[c] > mr) { ok = false; break; }
          for (let r = 0; r < h; r++) {
            const k = cells.findIndex(([rr, cc]) => rr === r && cc === c);
            g[r][c] = k >= 0 && k !== miss ? ME : (rand() < 0.6 ? THEM : ME);
          }
        }
        if (!ok || wins(g, ME) || wins(g, THEM)) continue;
        const good = [...Array(C).keys()].filter(c => dropWins(g, c, ME));
        if (good.length !== 1 || good[0] !== mc) continue;
        if ([...Array(C).keys()].some(c => dropWins(g, c, THEM))) continue;
        if (g.flat().filter(Boolean).length < 9) continue;
        grid = g; goalCol = mc; break;
      }
      command(t('¡CONECTA!'), () => {
        const cell = Math.floor(Math.min((demo.clientWidth - 24 - 12 - 6 * 4 - 8) / C, (demo.clientHeight - 175) / (R + 1)));
        const disc = p => p === ME ? 'me' : 'them';
        full(`<div class="c4wrap"><span class="c4note top">${t('toca la columna o arrastra')} ⬇️</span>
          <div class="c4lane" id="lane" style="--cell:${cell}px"><i class="dot me c4hand" id="hand"></i></div>
          <div class="c4" id="c4" style="--cell:${cell}px">${[...Array(C).keys()].map(c => `<div class="c4col" data-c="${c}">${[...Array(R).keys()].reverse().map(r => `<span class="c4cell">${grid[r][c] ? `<i class="dot ${disc(grid[r][c])}"></i>` : ''}</span>`).join('')}</div>`).join('')}</div>
          <span class="you me">${t('Tú eres')} <i class="dot me"></i></span></div>`);
        const lane = $id('lane'), hand = $id('hand'), cols = [...screen.querySelectorAll('.c4col')];
        // Where each column's middle is, inside the lane
        const centers = () => { const L = lane.getBoundingClientRect(); return cols.map(c => { const r = c.getBoundingClientRect(); return r.left + r.width / 2 - L.left; }); };
        let mid = centers(), aim = 3, x = mid[aim], dragging = false, moved = false, onLane = false, sx = 0;
        const show = () => { hand.style.left = x + 'px'; cols.forEach((c, i) => c.classList.toggle('aim', i === aim)); };
        show();
        active = true; const t0 = runTimer(T(5500), () => finish(0, t('¡Se acabó el tiempo!')));
        const drop = () => {
          const c = aim, h = heightOf(grid, c); if (h >= R) { x = mid[aim]; show(); return; }
          const s = (performance.now() - t0) / 1000 * sp, good = c === goalCol, col = cols[c];
          // The disc leaves your hand and falls down its column into place
          hand.hidden = true;
          const slot = col.children[R - 1 - h], d = document.createElement('i');
          d.className = 'dot me falling'; d.style.setProperty('--from', `${-(R - h + 1) * (cell + 4)}px`);
          slot.append(d); grid[h][c] = ME;
          active = false; cancelAnimationFrame(raf); timer.hidden = true;
          setTimeout(() => { active = true; if (good) col.classList.add('win'); finish(good ? (s < 2 ? 3 : s < 3.4 ? 2 : 1) : 0, good ? t('¡Cuatro en línea!') : t('¡Esa no conecta!')); }, reduce ? 50 : 450);
        };
        listen({
          down: e => { mid = centers(); dragging = true; moved = false; sx = e.clientX; const L = lane.getBoundingClientRect(); onLane = e.clientY >= L.top - 30 && e.clientY <= L.bottom + 20; hand.classList.add('held'); },
          move: e => { if (!dragging) return; if (Math.abs(e.clientX - sx) > 10) moved = true; const L = lane.getBoundingClientRect(), fx = e.clientX - L.left;
            x = Math.max(mid[0], Math.min(mid[C - 1], fx));
            aim = mid.reduce((b, m, i) => Math.abs(m - x) < Math.abs(mid[b] - x) ? i : b, 0); show(); },
          // A tap that didn't drag (and wasn't on your disc) drops nothing
          // A tap on a column drops the disc there, like a drag that ends on it
          up: () => { if (!dragging) return; dragging = false; hand.classList.remove('held');
            if (!moved && !onLane) { const L = lane.getBoundingClientRect(), fx = sx - L.left; if (fx < mid[0] - cell || fx > mid[C - 1] + cell) { x = mid[aim]; show(); return; }
              aim = mid.reduce((b, m, i) => Math.abs(m - fx) < Math.abs(mid[b] - fx) ? i : b, 0); }
            x = mid[aim]; show(); drop(); },
        });
      }, '<span class="example">🟡🟡🟡 ⬇️</span>', t('toca la columna (o arrastra tu ficha) donde hace cuatro en línea'));
    },
    // ¡LIMPIA!: a dirty floor tile in the middle (far from the phone's side edges, where swipes go "back");
    // wipe it with your finger until every piece is clean. The floor is an 8×8 grid: a piece the finger
    // passes over is cleaned whole, so what you see clean is exactly what counts
    limpia() {
      // What's under the dirt, and the kind of dirt on it
      const SURF = pick([
        { k: 'mesa', icon: '🪵', what: t('limpia la mesa hasta que brille'), hint: t('pasa el dedo por la mesa sucia'), base: '#5c4630', blots: ['#3f2a18', '#7d5a36', '#4f3520', '#8a6a44', '#2e1f12'] },
        { k: 'cocina', icon: '🍳', what: t('limpia la cocina hasta que brille'), hint: t('pasa el dedo por la cocina sucia'), base: '#8a7a3a', blots: ['#6d5e24', '#a8933f', '#5a4a1a', '#b5a24a', '#4a3c12'] },
        { k: 'ventana', icon: '🪟', what: t('limpia la ventana hasta que brille'), hint: t('pasa el dedo por la ventana sucia'), base: '#77736c', blots: ['#5f5c57', '#9a958d', '#6b675f', '#a8a39a', '#4d4a45'] },
        { k: 'plato', icon: '🍽️', what: t('limpia el plato hasta que brille'), hint: t('pasa el dedo por el plato sucio'), base: '#9c4a2a', blots: ['#b5532c', '#7a2f18', '#c96a3a', '#5e2410', '#d98a4a'] },
      ]);
      command(t('¡LIMPIA!'), () => {
        full(`<div class="layer" id="lay"><div class="floor surf-${SURF.k}" id="fl"><canvas id="dirt"></canvas></div><div class="pct" id="pct">0 %</div><span class="c4note wipe-note">${SURF.what}</span></div>`);
        const lay = document.getElementById('lay'), fl = document.getElementById('fl'), cv = document.getElementById('dirt'), pct = document.getElementById('pct');
        const side = Math.floor(Math.min(lay.clientWidth * 0.78, lay.clientHeight - 64)), N = 8, cs = side / N;
        fl.style.width = fl.style.height = side + 'px';
        const dpr = Math.min(2, devicePixelRatio || 1);
        cv.width = cv.height = Math.round(side * dpr); cv.style.width = cv.style.height = side + 'px';
        const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
        // The dirt: a base and blotches in the colors of that surface's mess
        ctx.fillStyle = SURF.base; ctx.fillRect(0, 0, side, side);
        for (let k = 0; k < 70; k++) {
          ctx.fillStyle = pick(SURF.blots);
          ctx.globalAlpha = 0.5 + rand() * 0.5;
          ctx.beginPath(); ctx.ellipse(rand() * side, rand() * side, 6 + rand() * side * 0.12, 4 + rand() * side * 0.08, rand() * 3, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        const clean = Array(N * N).fill(false); let left = N * N, on = false, last = null, t0 = performance.now();
        demo.style.touchAction = 'none';
        const wipeCell = (i, j) => {
          const k = j * N + i; if (clean[k]) return;
          clean[k] = true; left--;
          ctx.clearRect(i * cs - 0.5, j * cs - 0.5, cs + 1, cs + 1);
          pct.textContent = `${Math.round((1 - left / (N * N)) * 100)} %`;
          if (!left) { fl.classList.add('shine'); const s = (performance.now() - t0) / 1000 * sp; mascot(); finish(s < 3 ? 3 : s < 4.5 ? 2 : 1, t('¡Brillante! ✨'), 1500); }
        };
        // Spotless: a muscly sponge peeks in from the bottom-right corner, flexes, says it, and ducks out
        const mascot = () => { const m = mk(demo, 'div', 'mascot', `<svg viewBox="0 0 120 140" aria-hidden="true">
            <path d="M18 70 C4 62 2 40 14 34 C22 30 30 36 32 46" fill="#ffd23f" stroke="#c99400" stroke-width="3"/><circle cx="12" cy="34" r="9" fill="#ffe680" stroke="#c99400" stroke-width="3"/>
            <path d="M102 70 C116 62 118 40 106 34 C98 30 90 36 88 46" fill="#ffd23f" stroke="#c99400" stroke-width="3"/><circle cx="108" cy="34" r="9" fill="#ffe680" stroke="#c99400" stroke-width="3"/>
            <rect x="26" y="40" width="68" height="96" rx="16" fill="#ffd23f" stroke="#c99400" stroke-width="3"/><rect x="26" y="96" width="68" height="40" rx="10" fill="#2ec4b6" stroke="#159a8e" stroke-width="3"/>
            <circle cx="40" cy="58" r="3" fill="#e0b000"/><circle cx="78" cy="52" r="2.5" fill="#e0b000"/><circle cx="72" cy="86" r="3" fill="#e0b000"/><circle cx="38" cy="84" r="2" fill="#e0b000"/>
            <ellipse cx="48" cy="66" rx="6" ry="7" fill="#fff"/><ellipse cx="72" cy="66" rx="6" ry="7" fill="#fff"/><circle cx="49" cy="67" r="3.4" fill="#1b0f08"/><circle cx="71" cy="67" r="3.4" fill="#1b0f08"/>
            <path d="M44 56 L54 59 M76 56 L66 59" stroke="#1b0f08" stroke-width="3" stroke-linecap="round"/><path d="M48 78 Q60 90 72 78" fill="#fff" stroke="#1b0f08" stroke-width="3" stroke-linejoin="round"/>
            <path d="M100 8 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#fff"/></svg><b>${t('¡IMPECABLE!')}</b>`);
          setTimeout(() => m.remove(), 1450); };
        // The finger is a sponge about one and a half pieces wide
        const R = cs * 0.75;
        const wipeAt = (x, y) => {
          for (let j = Math.floor((y - R) / cs); j <= Math.floor((y + R) / cs); j++) for (let i = Math.floor((x - R) / cs); i <= Math.floor((x + R) / cs); i++) {
            if (i < 0 || j < 0 || i >= N || j >= N) continue;
            const cx = Math.max(i * cs, Math.min(x, (i + 1) * cs)), cy = Math.max(j * cs, Math.min(y, (j + 1) * cs));
            if (Math.hypot(x - cx, y - cy) <= R * 0.6) wipeCell(i, j);
          }
        };
        const at = e => { const r = fl.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        const stroke = p => {   // fill the gaps between two pointer events so a fast swipe cleans its whole path
          if (last) { const d = Math.hypot(p[0] - last[0], p[1] - last[1]), n = Math.ceil(d / (cs * 0.3)); for (let k = 1; k <= n; k++) wipeAt(last[0] + (p[0] - last[0]) * k / n, last[1] + (p[1] - last[1]) * k / n); }
          else wipeAt(p[0], p[1]);
          last = p;
        };
        const down = e => { e.preventDefault(); if (!active) return; on = true; last = null; stroke(at(e)); };
        const move = e => { if (on && active) stroke(at(e)); };
        const up = () => { on = false; last = null; };
        demo.addEventListener('pointerdown', down); demo.addEventListener('pointermove', move); addEventListener('pointerup', up);
        cleanup = () => { demo.removeEventListener('pointerdown', down); demo.removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
        active = true; t0 = performance.now();
        runTimer(T(6000), () => finish(0, t('Quedó {n} % limpio', { n: Math.round((1 - left / (N * N)) * 100) })));
      }, `🧽 ${SURF.icon}`, SURF.hint);
    },
    // 2 ¡PARA!: a radar beam sweeps round lighting up colored lights; tap to stop it inside the green slice
    para() {
      command(t('¡PARA!'), () => {
        const { lay, W, H } = lay0('<svg id="sv" class="fullsvg"></svg>');
        const sv = $id('sv'); sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const cx = W / 2, cy = H * 0.44, r = Math.min(W, H) * 0.43, mid = rnd(360), half = 20;
        const pt = (a, rr = r) => [cx + rr * Math.sin(a * Math.PI / 180), cy - rr * Math.cos(a * Math.PI / 180)];
        // Three nested slices: the wide one is ★, the middle ★★, the thin bright one ★★★
        const ZONES = [[20, '#2e9e57'], [11, '#9dff3a'], [4, '#ffd23f']];
        const wedge = (h, col) => { const [x1, y1] = pt(mid - h), [x2, y2] = pt(mid + h); return `<path d="M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z" fill="${col}"/>`; };
        // A radar: rings and cross-hairs, a beam sweeping round with a fading trail, and a ring of colored lights
        // around the rim that flash as the beam goes by; the slices glow when it crosses them
        const LEDS = 36, HUES = ['#ff2e88', '#ff9a1f', '#ffd23f', '#9dff3a', '#2ee6d6', '#4d8bff', '#9d7bff'];
        const trailW = (k, n) => { const a0 = -k * 3 - 3, a1 = -k * 3; const [x1, y1] = [r * Math.sin(a0 * Math.PI / 180), -r * Math.cos(a0 * Math.PI / 180)], [x2, y2] = [r * Math.sin(a1 * Math.PI / 180), -r * Math.cos(a1 * Math.PI / 180)];
          return `<path d="M0 0 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="#9dff3a" opacity="${(0.42 * (1 - k / n)).toFixed(3)}"/>`; };
        sv.innerHTML = `<defs><radialGradient id="rdr" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0f3a2a"/><stop offset="1" stop-color="#061a14"/></radialGradient></defs>
          <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="#120624" stroke="rgba(255,255,255,.15)" stroke-width="2"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rdr)" stroke="#2ee6a0" stroke-opacity=".5" stroke-width="2"/>
          ${[0.33, 0.66].map(f => `<circle cx="${cx}" cy="${cy}" r="${r * f}" fill="none" stroke="#2ee6a0" stroke-opacity=".22" stroke-width="1.5"/>`).join('')}
          <path d="M${cx - r} ${cy} H${cx + r} M${cx} ${cy - r} V${cy + r}" stroke="#2ee6a0" stroke-opacity=".18" stroke-width="1.5"/>
          ${ZONES.map(([h, c], i) => wedge(h, c).replace('<path ', `<path class="zone" id="z${i}" `)).join('')}
          <g id="trail" transform="translate(${cx} ${cy})">${[...Array(16).keys()].map(k => trailW(k, 16)).join('')}</g>
          ${[...Array(LEDS).keys()].map(k => { const [x, y] = pt(k * 360 / LEDS + 5, r + 7); return `<circle class="led" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="${HUES[k % HUES.length]}"/>`; }).join('')}
          <g transform="translate(${cx} ${Math.min(H - 22, cy + r + 38)})" font-weight="900" font-size="13" text-anchor="middle" dominant-baseline="middle">
            <rect x="-120" y="-13" width="70" height="26" rx="13" fill="#2e9e57"/><text x="-85" y="1" fill="#fff">★</text>
            <rect x="-35" y="-13" width="70" height="26" rx="13" fill="#9dff3a"/><text x="0" y="1" fill="#0f3d1f">★★</text>
            <rect x="50" y="-13" width="70" height="26" rx="13" fill="#ffd23f"/><text x="85" y="1" fill="#3a1200">★★★</text></g>
          <line id="nd" x1="${cx}" y1="${cy}" stroke="#eaffd0" stroke-width="5" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #9dff3a)"/><circle cx="${cx}" cy="${cy}" r="9" fill="#eaffd0" style="filter:drop-shadow(0 0 6px #9dff3a)"/>`;
        const nd = sv.querySelector('#nd'), tg = sv.querySelector('#trail'), leds = [...sv.querySelectorAll('.led')], zones = [...sv.querySelectorAll('.zone')], litAt = leds.map(() => -1e9);
        let a = (mid + 180) % 360, last = performance.now(), stopped = false;
        const paint = now => { const [x, y] = pt(a, r * 0.96); nd.setAttribute('x2', x); nd.setAttribute('y2', y); tg.setAttribute('transform', `translate(${cx} ${cy}) rotate(${a})`);
          litAt[Math.floor((((a - 5) % 360) + 360) % 360 / (360 / LEDS))] = now;
          leds.forEach((l, k) => { const f = Math.max(0, 1 - (now - litAt[k]) / 700); l.setAttribute('opacity', (0.18 + 0.82 * f).toFixed(2)); l.setAttribute('r', (3.6 + 2.4 * f).toFixed(1)); });
          const d = Math.abs(((a - mid + 540) % 360) - 180); zones.forEach((z, i) => z.classList.toggle('zlit', d < ZONES[i][0])); };
        animate((t, now) => { if (stopped) return false; a = (a + 290 * sp * (now - last) / 1000) % 360; last = now; paint(now); });
        listen({ down: () => { if (stopped) return; stopped = true; const d = Math.abs(((a - mid + 540) % 360) - 180), n = d < 4 ? 3 : d < 11 ? 2 : d < half ? 1 : 0;
          // The stop: a ping ring from the tip and every light blinks in the result's color
          const [x, y] = pt(a, r * 0.96), col = n ? ['', '#2e9e57', '#9dff3a', '#ffd23f'][n] : '#ff4d5e';
          sv.insertAdjacentHTML('beforeend', `<circle class="ping" cx="${x}" cy="${y}" r="10" fill="none" stroke="${col}" stroke-width="4"/><circle class="ping p2" cx="${x}" cy="${y}" r="10" fill="none" stroke="${col}" stroke-width="3"/>`);
          leds.forEach(l => { l.setAttribute('fill', col); l.setAttribute('opacity', '1'); l.classList.add('ledblink'); });
          if (n) zones[n - 1].classList.add('zhit'); else lay.classList.add('shake');
          finish(n, n ? null : t('¡Fuera de la franja!'), 1100); } });
        active = true; runTimer(T(4000), () => finish(0, t('¡Se acabó el tiempo!')));
      }, '📡', t('frena el radar: mientras más al centro, más estrellas'));
    },
    // 3 ¡APLASTA!: five flies buzz around; tap and a fly swatter comes down from behind onto that spot and squashes what's there
    aplasta() {
      const FLY = `<svg viewBox="-30 -30 60 60" aria-hidden="true">
        <g class="wings"><ellipse cx="-9" cy="-12" rx="9" ry="15" transform="rotate(-25 -9 -12)" fill="rgba(210,235,255,.55)" stroke="rgba(255,255,255,.7)" stroke-width="1"/>
          <ellipse cx="9" cy="-12" rx="9" ry="15" transform="rotate(25 9 -12)" fill="rgba(210,235,255,.55)" stroke="rgba(255,255,255,.7)" stroke-width="1"/></g>
        <path d="M-8 4 L-15 12 M8 4 L15 12 M-8 -1 L-16 2 M8 -1 L16 2 M-6 8 L-11 17 M6 8 L11 17" stroke="#222" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="0" cy="6" rx="8" ry="12" fill="#2b2f36"/><path d="M-7 4 H7 M-7 9 H7 M-6 14 H6" stroke="#4a515c" stroke-width="1.4"/>
        <circle cx="0" cy="-7" r="7" fill="#33373f"/><circle cx="-4.5" cy="-9" r="4" fill="#b3261e"/><circle cx="4.5" cy="-9" r="4" fill="#b3261e"/>
        <circle cx="-5.5" cy="-10.5" r="1.2" fill="#fff" opacity=".7"/><circle cx="3.5" cy="-10.5" r="1.2" fill="#fff" opacity=".7"/></svg>`;
      const SWATTER = `<svg viewBox="0 0 100 230" aria-hidden="true"><defs><pattern id="mesh" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 H8 M0 0 V8" stroke="#0e7a6d" stroke-width="1.6"/></pattern></defs>
        <rect x="45" y="92" width="10" height="138" rx="5" fill="#ff7a1a"/><rect x="45" y="92" width="4" height="138" rx="2" fill="#ffb066"/>
        <rect x="6" y="4" width="88" height="92" rx="18" fill="#2ee6d6"/><rect x="12" y="10" width="76" height="80" rx="13" fill="url(#mesh)"/>
        <rect x="6" y="4" width="88" height="92" rx="18" fill="none" stroke="#14b3a5" stroke-width="5"/></svg>`;
      command(t('¡APLASTA!'), () => {
        const { lay, W, H } = lay0('<div class="flycount" id="fc">🪰 0 / 9</div>');
        const fc = $id('fc'), N = 9;
        const flies = [...Array(N).keys()].map(() => { const el = mk(lay, 'div', 'obj fly', FLY);
          const f = { el, x: W * (0.2 + rand() * 0.6), y: H * (0.2 + rand() * 0.6), vx: (rand() - 0.5) * 240 * sp, vy: (rand() - 0.5) * 240 * sp, dead: false }; return f; });
        let n = 0, last = performance.now(); const t0 = last;
        animate((t, now) => { const dt = Math.min(0.04, (now - last) / 1000); last = now;
          flies.forEach(f => { if (f.dead || f.held) return;
            if (rand() < 0.05) { f.vx += (rand() - 0.5) * 320; f.vy += (rand() - 0.5) * 320; }
            const v = Math.hypot(f.vx, f.vy), mx = 190 * sp, mn = 60 * sp; if (v > mx) { f.vx *= mx / v; f.vy *= mx / v; } else if (v < mn && v > 0) { f.vx *= mn / v; f.vy *= mn / v; }
            f.x += f.vx * dt; f.y += f.vy * dt;
            if (f.x < W * 0.12 || f.x > W * 0.88) f.vx *= -1; if (f.y < H * 0.1 || f.y > H * 0.9) f.vy *= -1;
            f.x = Math.max(W * 0.12, Math.min(W * 0.88, f.x)); f.y = Math.max(H * 0.1, Math.min(H * 0.9, f.y));
            f.el.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(f.vy, f.vx) + Math.PI / 2}rad)`; place(f.el, f.x, f.y); }); });
        // The swatter: comes in big and tilted (from behind you) and lands flat on the spot; whatever is under its head gets squashed
        // What counts is where the flies were at the tap, not 110 ms later: the ones under the head stop there
        // (caught) while the swatter comes down, so a fly you clearly hit never slips out of it
        listen({ down: e => { const [x, y] = ptIn(lay, e);
          const sw = mk(lay, 'div', 'swatter', SWATTER); place(sw, x, y);
          const caught = flies.filter(f => !f.dead && !f.held && near([f.x, f.y], [x, y], 50)); caught.forEach(f => { f.held = true; });
          later(() => { if (!active) return;
            pop(lay, t('¡PAF!'), x, y - 50); SFX.hit();
            let hit = 0;
            caught.forEach(f => { f.dead = true; n++; hit++; f.el.classList.add('splat'); f.el.style.transform = 'translate(-50%, -50%)'; });
            // Two or more in one swat: a comic-book COMBO!
            if (hit >= 2) { const cb = mk(lay, 'div', 'comic', `<div class="burst"></div><b>${t('¡COMBO!')}${hit > 2 ? ` x${hit}` : ''}</b>`);
              place(cb, Math.max(W * 0.3, Math.min(W * 0.7, x)), Math.max(H * 0.2, y - 70)); cb.style.setProperty('--tilt', `${(rand() < 0.5 ? -1 : 1) * (6 + rand() * 6)}deg`);
              lay.classList.remove('shake'); void lay.offsetWidth; lay.classList.add('shake'); later(() => cb.remove(), 560); }
            fc.textContent = `🪰 ${n} / ${N}`;
            if (n === N) { later(() => finish(timeStars(t0, 5, 7), t('¡Las nueve!')), 150); }
          }, 110);
          later(() => sw.remove(), 450); } });
        active = true; runTimer(T(9000), () => finish(n >= N - 2 ? 1 : 0, t('{n} de {N} moscas', { n, N })));
      }, '🪰 × 9', t('toca donde está la mosca para aplastarla'));
    },
    // 5 ¡REVIENTA!: lots of quick bubbles in close blues; pop only the true blue ones
    revienta() {
      command(t('¡REVIENTA!'), () => {
        const { lay, W, H } = lay0('');
        const BLUE = '#2f6bff', OTHERS = ['#5ec8ff', '#8a5cff', '#2ec4b6'];
        const plan = shuffle([...Array(9).fill(BLUE), ...Array(9).keys()].map(c => typeof c === 'number' ? OTHERS[c % 3] : c))
          .map((c, i) => ({ c, at: 80 + i * T(230), x: W * (0.18 + rand() * 0.64), dur: T(1900) * (0.85 + rand() * 0.3), size: 36 + Math.round(rand() * 44) }));
        // Popping: a ring and a few droplets fly out of the bubble
        const burst = b => { const r = mk(lay, 'span', 'obj bring'); place(r, b.x, b.y); r.style.width = r.style.height = b.size + 'px'; r.style.borderColor = b.c; later(() => r.remove(), 400);
          for (let i = 0; i < 7; i++) { const d = mk(lay, 'span', 'obj bdrop'); place(d, b.x, b.y); const an = i / 7 * Math.PI * 2 + rand() * 0.5, dist = b.size * (0.6 + rand() * 0.5);
            d.style.background = b.c; d.style.setProperty('--dx', `${Math.cos(an) * dist}px`); d.style.setProperty('--dy', `${Math.sin(an) * dist}px`); later(() => d.remove(), 420); } };
        let blue = 0, wrong = 0;
        animate(t => { plan.forEach(b => {
          if (!b.el && t >= b.at) { b.el = mk(lay, 'button', 'obj bub'); b.el.style.background = `radial-gradient(circle at 35% 30%, #fff8, ${b.c} 55%)`;
            b.el.style.width = b.el.style.height = b.size + 'px';
            tap(b.el, () => { if (b.done) return; b.done = true; b.el.classList.add('popped'); later(() => b.el.remove(), 180); burst(b);
              if (b.c === BLUE) { blue++; if (blue === 9) finish(wrong === 0 ? 3 : wrong === 1 ? 2 : 1, t('¡Todas las azules!')); }
              else { wrong++; pop(lay, '✗', b.x, b.y, 'bad'); } }); }
          if (b.el && !b.done) { const k = (t - b.at) / b.dur; b.y = H * (1.05 - 1.15 * k); place(b.el, b.x + Math.sin(k * 8 + b.x) * 12, b.y); if (k > 1) { b.done = true; b.el.remove(); } } }); });
        active = true; runTimer(T(6200), () => finish(blue >= 6 && wrong <= 1 ? 2 : blue >= 3 ? 1 : 0, t('{b}/9 azules · {w} malas', { b: blue, w: wrong })));
      }, '<span class="bubgoal"></span>', t('revienta solo las de este azul'));
    },
    // 8 ¡ALIMENTA!: three animals, three foods; drag each food to its animal
    alimenta() {
      const ps = shuffle([['🐵', '🍌'], ['🐶', '🦴'], ['🐰', '🥕'], ['🐱', '🐟'], ['🐼', '🎋'], ['🐝', '🌸'], ['🐿️', '🌰']]).slice(0, 3);
      command(t('¡ALIMENTA!'), () => {
        const { lay, W, H } = lay0('');
        const animals = ps.map(([a], i) => { const d = mk(lay, 'div', 'obj animal', a); place(d, W * (0.2 + 0.3 * i), H * 0.22); d.dataset.a = a; return d; });
        let fed = 0, errs = 0; const t0 = performance.now();
        shuffle([0, 1, 2]).forEach((pi, k) => { const f = mk(lay, 'div', 'obj food', ps[pi][1]), home = [W * (0.2 + 0.3 * k), H * 0.76]; place(f, ...home);
          draggable(f, lay, (x, y) => { const hit = animals.find(d => near(posOf(d), [x, y], 52));
            if (hit && hit.dataset.a === ps[pi][0]) { f.remove(); hit.classList.add('fed'); fed++; pop(lay, '😋', ...posOf(hit));
              if (fed === 3) finish(errs === 0 ? timeStars(t0, 3, 4.5) : errs === 1 ? 2 : 1, t('¡Todos comieron!')); }
            else { if (hit) { errs++; pop(lay, '✗', x, y, 'bad'); } back(f, home); } }); });
        active = true; runTimer(T(6500), () => finish(0, t('{n} de 3', { n: fed })));
      }, '🐵 ← 🍌', t('lleva cada comida a su animal'));
    },
    // ¡REBOTA!: a Pong paddle at the bottom; the ball bounces on its own. Hit the three pixel aliens at the top; don't let it fall
    rebota() {
      // Three little pixel aliens (our own 8-bit drawings), each in its own color: '#' body, 'w' white, 'k' black
      const ALIENS = [
        ['#3ddc84', ['....###....', '..#######..', '.###www###.', '###wwkww###', '###wwkww###', '.###www###.', '..#######..', '.#.#...#.#.', '#..#...#..#']],
        ['#2ee6d6', ['.....www.....', '....wwwww....', '..#########..', '.##k##k##k##.', '#############', '..##.....##..', '.#.........#.']],
        ['#ff2e88', ['#.......#', '.#.....#.', '..#####..', '.##k#k##.', '#########', '#.#####.#', '..#.#.#..', '.#.....#.']],
        ['#ffd23f', ['..##.##..', '.#######.', '##k###k##', '#########', '#.#####.#', '..#...#..', '.##...##.']],
        ['#9d7bff', ['...###...', '.#######.', '##wk#wk##', '#########', '.#.#.#.#.', '#.#.#.#.#']],
      ];
      const pix = ([c, rows]) => { const w = rows[0].length, h = rows.length; let r = '';
        rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${ch === '#' ? c : ch === 'w' ? '#fff' : '#111'}"/>`; }));
        return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" style="width:${w * 5.2}px;height:${h * 5.2}px" data-c="${c}">${r}</svg>`; };
      // When hit: it bursts into square pixels of its color
      const blast = (lay, x, y, c) => { for (let i = 0; i < 12; i++) { const q = mk(lay, 'span', 'obj pix'); q.style.background = c; place(q, x, y);
        const an = i / 12 * Math.PI * 2, d = 30 + rand() * 40; q.style.setProperty('--dx', `${Math.round(Math.cos(an) * d / 6) * 6}px`); q.style.setProperty('--dy', `${Math.round(Math.sin(an) * d / 6) * 6}px`); later(() => q.remove(), 500); } };
      command(t('¡REBOTA!'), () => {
        const { lay, W, H } = lay0('<div class="paddle" id="pd"></div><span class="obj pball" id="pb"></span>');
        const pd = $id('pd'), pb = $id('pb'), PW = W * 0.3, py = H * 0.9, R = 11;
        pd.style.width = PW + 'px'; let px = W / 2;
        const targets = shuffle(ALIENS.slice()).slice(0, 3).map((al, i) => { const el = mk(lay, 'span', 'obj invader', pix(al)); el.style.setProperty('--d', `${-i * 0.23}s`); const x = W * (0.22 + 0.28 * i) + (rand() - 0.5) * W * 0.08, y = H * (0.14 + rand() * 0.12); place(el, x, y); return { el, x, y, hit: false }; });
        let bx = W / 2, by = H * 0.6, an = (-60 - rand() * 60) * Math.PI / 180, V = H * 0.75 * sp, vx = V * Math.cos(an), vy = V * Math.sin(an), broken = 0, last = performance.now();
        const mv = e => { px = Math.max(PW / 2 + W * 0.04, Math.min(W - PW / 2 - W * 0.04, ptIn(lay, e)[0])); };
        listen({ down: mv, move: mv });
        animate((t, now) => { const dt = Math.min(0.03, (now - last) / 1000); last = now;
          pd.style.left = (px - PW / 2) + 'px'; pd.style.top = py + 'px';
          bx += vx * dt; by += vy * dt;
          if (bx < R) { bx = R; vx = Math.abs(vx); } if (bx > W - R) { bx = W - R; vx = -Math.abs(vx); } if (by < R) { by = R; vy = Math.abs(vy); }
          // The paddle: where it hits sets the angle, like Pong
          if (vy > 0 && by + R >= py && by + R <= py + 18 && Math.abs(bx - px) <= PW / 2 + R) {
            const off = (bx - px) / (PW / 2), a = (-90 + off * 60) * Math.PI / 180, s = Math.hypot(vx, vy) * 1.04; vx = s * Math.cos(a); vy = s * Math.sin(a); by = py - R; pd.classList.remove('hit'); void pd.offsetWidth; pd.classList.add('hit'); }
          for (const g of targets) if (!g.hit && near([bx, by], [g.x, g.y], 30)) { g.hit = true; broken++; g.el.remove(); blast(lay, g.x, g.y, g.el.firstElementChild.dataset.c); vy = Math.abs(vy); pop(lay, '+1', g.x, g.y);
            if (broken === 3) { finish(3, t('¡Le diste a los tres!')); return false; } }
          place(pb, bx, by);
          if (by > H + R) { finish(broken, broken ? t('Le diste a {n} de 3', { n: broken }) : t('¡Se te cayó!')); return false; } });
        active = true; runTimer(T(9000), () => finish(broken, t('Le diste a {n} de 3', { n: broken })));
      }, '🏓 → 👾👾👾', t('mueve la paleta y dale a los tres marcianos'));
    },
    // 11 ¡EQUILIBRA!: a plate on a stick leans and falls; move your finger left and right under it to keep it up
    equilibra() {
      // Three blocks of different sizes stacked on the plate, each one loose: it rides on what's under it until the plate leans
      // or jerks too much, then slides on its own (the higher, the easier). One that slides off the edge, or off the block
      // under it, falls; whatever is left at the end is your stars
      const KINDS = [[70, 22, '#ff4d5e'], [56, 26, '#4d8bff'], [44, 30, '#3ddc84'], [34, 34, '#ffd23f'], [62, 18, '#8a5cff'], [40, 24, '#ff9a1f']];
      const LOAD = shuffle(KINDS.slice()).slice(0, 3);
      const chip = ([w, h, c], z = 3) => `<i style="display:inline-block;width:${w / z}px;height:${h / z}px;background:${c};border-radius:2px;margin-right:4px;vertical-align:bottom"></i>`;
      command(t('¡EQUILIBRA!'), () => {
        const { lay, W, H } = lay0(`<svg id="sv" class="fullsvg"></svg><div class="loadhud" id="lh"></div><span class="c4note wipe-note">${t('mueve el dedo de lado a lado')}</span>`);
        const sv = $id('sv'), lh = $id('lh'); sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const L = H * 0.4, by = H * 0.86; let x = W / 2, tx = W / 2, v = 0, a = (rand() < 0.5 ? -1 : 1) * 0.08, w = 0, last = performance.now();
        let gust = 0, pvx = null, pvy = null, ax = 0, ay = 0, ptx = null, pty = null;
        sv.innerHTML = `<line id="st" stroke="#e8c48a" stroke-width="8" stroke-linecap="round"/>
          <g id="top"><ellipse cx="0" cy="-5" rx="54" ry="9" fill="#f4f1ea" stroke="#c9c2b4" stroke-width="2"/><ellipse cx="0" cy="-7" rx="36" ry="5" fill="#e6e0d4"/>
            <g id="load">${LOAD.map(([bw, bh, c]) => `<g><rect x="${-bw / 2}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="4" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
              <rect x="${-bw / 2 + 4}" y="${-bh / 2 + 3}" width="${bw - 8}" height="4" rx="2" fill="#fff" opacity=".35"/></g>`).join('')}</g></g>
          <rect id="hb" height="18" width="84" rx="9" fill="#ffd23f"/>`;
        const st = sv.querySelector('#st'), top = sv.querySelector('#top'), hb = sv.querySelector('#hb');
        // The higher the block, the less it grips (and the easier it slides off the one below)
        const MU = [0.3, 0.17, 0.11];
        const items = LOAD.map((k, i) => ({ k, el: sv.querySelector('#load').children[i], u: 0, vu: 0 }));
        const mv = e => { tx = Math.max(W * 0.15, Math.min(W * 0.85, ptIn(lay, e)[0])); };
        listen({ down: mv, move: mv });
        const dur = T(5500), LIMIT = 0.95, G = 900 * sp, EDGE = 50, INERTIA = 0.5;
        const hud = () => { lh.innerHTML = items.map(it => chip(it.k)).join('') + `<s>${LOAD.filter(k => !items.some(it => it.k === k)).map(k => chip(k)).join('')}</s>`; };
        const lim = k => k ? items[k - 1].k[0] / 2 : EDGE;
        const yc = k => { let y = -10; for (let j = 0; j < k; j++) y -= items[j].k[1]; return y - items[k].k[1] / 2; };
        hud();
        const drop = (k, topx, topy) => { const it = items[k], yo = yc(k), [bw, bh, c] = it.k;
          const wx = topx + it.u * Math.cos(a) - yo * Math.sin(a), wy = topy + it.u * Math.sin(a) + yo * Math.cos(a);
          it.el.remove(); items.splice(k, 1); hud();
          const d = mk(lay, 'span', 'obj dropitem'); Object.assign(d.style, { width: bw + 'px', height: bh + 'px', background: c, borderRadius: '4px', border: '2px solid rgba(0,0,0,.35)' });
          place(d, wx, wy); d.style.setProperty('--dx', `${Math.sign(it.vu || it.u || a) * (60 + rand() * 40)}px`); d.style.setProperty('--dy', `${H}px`);
          pop(lay, '−★', wx, wy - 20, 'bad'); try { navigator.vibrate?.(40); } catch (_) { /* none */ }
          if (!items.length) { finish(0, t('¡Se cayó todo!')); return true; } return false; };
        animate((t, now) => { const dt = Math.min(0.04, (now - last) / 1000); last = now; if (dt <= 0) return;
          const nx = x + (tx - x) * Math.min(1, dt * 10); v = (nx - x) / dt; x = nx;
          // A little push now and then, so it never just stands still
          gust -= dt; if (gust <= 0) { gust = 0.9 + rand() * 0.9; w += (rand() < 0.5 ? -1 : 1) * 0.35 * (0.5 + rand() * 0.6) * sp; }
          // It leans more the more it leans; moving the base toward the lean pushes it back (tuned so a finger kept under the plate saves it)
          w += (2.2 * sp * Math.sin(a) - 4 * v / L) * dt; w *= 0.97; a += w * dt;
          if (Math.abs(a) > LIMIT) { a = Math.sign(a) * LIMIT; w *= -0.3; }       // the stick leans but never falls over
          const topx = x + L * Math.sin(a), topy = by - L * Math.cos(a);
          // The plate's own acceleration, smoothed: the load lags behind when the plate jerks (inertia)
          if (ptx !== null) { const vx = (topx - ptx) / dt, vy = (topy - pty) / dt;
            if (pvx !== null) { const k = Math.min(1, dt * 12); ax += (Math.max(-2500, Math.min(2500, (vx - pvx) / dt)) - ax) * k; ay += (Math.max(-2500, Math.min(2500, (vy - pvy) / dt)) - ay) * k; }
            pvx = vx; pvy = vy; }
          ptx = topx; pty = topy;
          const ca = Math.cos(a), sa = Math.sin(a);
          // Along the plate: gravity pulls downhill, the plate's jerk pushes the other way; friction holds each block until it can't
          const drive = G * sa - INERTIA * (ax * ca + ay * sa), press = Math.max(0, G * ca + INERTIA * (-ax * sa + ay * ca));
          // Each one rides on what's under it (the plate, or the block below) until the push beats its grip; then it slides on its own
          let accB = 0, vB = 0;
          for (let k = 0; k < items.length; k++) { const it = items[k], fr = (MU[k] ?? 0.11) * press, rv = it.vu - vB;
            let acc;
            if (Math.abs(rv) < 1 && Math.abs(drive - accB) <= fr) { acc = accB; it.vu = vB; }
            else { acc = drive - Math.sign(Math.abs(rv) >= 1 ? rv : drive - accB) * fr * 0.8;
              if (Math.abs(rv) >= 1 && Math.sign(rv + (acc - accB) * dt) !== Math.sign(rv)) { acc = accB; it.vu = vB; } }
            it.vu += acc * dt; it.u += it.vu * dt; accB = acc; vB = it.vu; }
          for (let k = 0; k < items.length; k++) { const below = k ? items[k - 1].u : 0;
            if (Math.abs(items[k].u - below) > lim(k)) { if (drop(k, topx, topy)) return false; break; } }
          items.forEach((it, k) => { const below = k ? items[k - 1].u : 0, edge = (it.u - below) / lim(k);
            // Near the edge it starts to tip over that way
            const tip = Math.abs(edge) > 0.7 ? Math.sign(edge) * (Math.abs(edge) - 0.7) * 60 : 0;
            it.el.setAttribute('transform', `translate(${it.u} ${yc(k)}) rotate(${tip})`); });
          st.setAttribute('x1', x); st.setAttribute('y1', by); st.setAttribute('x2', topx); st.setAttribute('y2', topy);
          top.setAttribute('transform', `translate(${topx} ${topy}) rotate(${a * 180 / Math.PI})`);
          hb.setAttribute('x', x - 42); hb.setAttribute('y', by);
          lay.classList.toggle('warn', items.some((it, k) => Math.abs(it.u - (k ? items[k - 1].u : 0)) > lim(k) * 0.6));
          if (t >= dur) { finish(items.length, items.length === 3 ? t('¡No se cayó nada!') : t('Se cayeron {n}', { n: 3 - items.length })); return false; } });
        active = true; runTimer(dur, () => {});
      }, `<span style="display:inline-flex;flex-direction:column-reverse;align-items:center">${LOAD.map(k => chip(k, 1.1).replace('margin-right:4px', 'margin:0')).join('')}</span>`, t('que no se caiga nada del plato'));
    },
    // 14 ¡DIBUJA!: trace the dotted shape without leaving it
    dibuja() {
      command(t('¡DIBUJA!'), () => {
        const { lay, W, H } = lay0('<svg id="sv" class="fullsvg"></svg><div class="pct" id="pct">0 %</div>');
        const sv = $id('sv'), pct = $id('pct'); sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const cx = W / 2, cy = H * 0.5, R = Math.min(W * 0.32, H * 0.32), kind = pick(['circle', 'square', 'triangle', 'star']);
        let V = [];
        if (kind === 'circle') V = [...Array(40).keys()].map(k => [cx + R * Math.cos(k / 40 * 2 * Math.PI), cy + R * Math.sin(k / 40 * 2 * Math.PI)]);
        else { const n = kind === 'square' ? 4 : kind === 'triangle' ? 3 : 10, rot = kind === 'square' ? Math.PI / 4 : -Math.PI / 2;
          V = [...Array(n).keys()].map(k => { const rr = kind === 'star' && k % 2 ? R * 0.45 : R; const an = rot + k / n * 2 * Math.PI; return [cx + rr * Math.cos(an), cy + rr * Math.sin(an)]; }); }
        const S = []; V.forEach((p, i) => { const q = V[(i + 1) % V.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]); for (let d = 0; d < len; d += 6) S.push([p[0] + (q[0] - p[0]) * d / len, p[1] + (q[1] - p[1]) * d / len]); });
        const pts = V.map(p => p.join(',')).join(' ');
        sv.innerHTML = `<polygon id="pg" points="${pts}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-dasharray="6 8" stroke-linejoin="round"/><g id="ink"></g>`;
        const ink = sv.querySelector('#ink'), pg = sv.querySelector('#pg'), seen = new Set(); let on = false, tr = null, line = []; const t0 = performance.now();
        const mark = p => { let bd = 1e9; S.forEach((q, i) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < 26) seen.add(i); if (d < bd) bd = d; }); return bd; };
        // Loose ends: where each stroke started and ended. The drawing closes when the pen comes back to one of them
        const ends = []; let travel = 0;
        // Closed: the line snaps shut, the shape lights up, and a sparkle bursts where the ends met
        const shine = (x, y) => { pg.setAttribute('stroke', '#ffd23f'); pg.removeAttribute('stroke-dasharray'); pg.setAttribute('fill', 'rgba(255,210,63,.14)');
          ink.classList.add('closed'); const ring = mk(lay, 'span', 'obj joinring'); place(ring, x, y);
          for (let i = 0; i < 10; i++) { const sp2 = mk(lay, 'span', 'obj sparkle', i % 2 ? '✦' : '✧'); place(sp2, x, y); const an = i / 10 * Math.PI * 2, d = 34 + rand() * 30;
            sp2.style.setProperty('--dx', `${Math.cos(an) * d}px`); sp2.style.setProperty('--dy', `${Math.sin(an) * d}px`); } };
        // Fast strokes skip ground between pointer events: walk the gap in small steps so the whole stroke counts
        let prev = null;
        const go = e => { const p = ptIn(lay, e); let bd = 0;
          const n = prev ? Math.max(1, Math.ceil(Math.hypot(p[0] - prev[0], p[1] - prev[1]) / 4)) : 1;
          for (let i = 1; i <= n; i++) { const f = i / n; bd = Math.max(bd, mark(prev ? [prev[0] + (p[0] - prev[0]) * f, prev[1] + (p[1] - prev[1]) * f] : p)); }
          if (prev) travel += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
          prev = p; if (bd > 44) { finish(0, t('¡Te saliste!')); return; } line.push(p); tr.setAttribute('points', line.map(q => q.join(',')).join(' '));
          const k = seen.size / S.length; pct.textContent = `${Math.min(99, Math.round(k * 100))} %`;   // 100 % only once it closes
          // Done only when it really closes: nearly all of it traced AND the pen back on a loose end (not just near the finish)
          const meet = k >= 0.95 && travel > 60 && ends.find(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 16);
          if (meet) { line.push(meet); tr.setAttribute('points', line.map(q => q.join(',')).join(' ')); pct.textContent = '100 %'; shine(...meet); finish(timeStars(t0, 3, 4.5), t('¡Completa!'), 1300); } };
        // Not finished: fewer stars by how much of the shape got traced
        const partial = why => { const k = seen.size / S.length; finish(k >= 0.85 ? 2 : k >= 0.6 ? 1 : 0, t('{why}: {n} % trazado', { why, n: Math.min(99, Math.round(k * 100)) })); };
        listen({ down: e => { on = true; prev = null; travel = 0; line = []; tr = ink.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'polyline')); go(e); if (active) ends.push(line[0]); },
          move: e => { if (on) go(e); },
          up: () => { on = false; prev = null; if (line.length) ends.push(line[line.length - 1]); if (active && seen.size / S.length >= 0.6) partial(t('Te faltó cerrarla')); } });
        active = true; runTimer(T(6500), () => partial(t('Se acabó el tiempo')));
      }, '✏️ ⭐', t('repasa la figura sin salirte'));
    },
    // 19 ¡SIGUE!: a drawn little rat scurries around, turning now and then; keep your finger on it
    sigue() {
      const RAT = `<svg viewBox="-50 -30 100 60" class="ratsvg" aria-hidden="true">
        <path d="M-30 4 C-48 8 -52 22 -40 26 C-32 29 -26 22 -36 18" fill="none" stroke="#e8a0a8" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="-6" cy="0" rx="26" ry="16" fill="#8e8a99"/><ellipse cx="-8" cy="-4" rx="18" ry="9" fill="#a9a5b4"/>
        <path d="M14 -10 L38 0 L14 10 Z" fill="#9b97a6"/><circle cx="16" cy="-12" r="7" fill="#e8a0a8" stroke="#8e8a99" stroke-width="3"/><circle cx="16" cy="12" r="7" fill="#e8a0a8" stroke="#8e8a99" stroke-width="3"/>
        <circle cx="27" cy="-4" r="2.4" fill="#111"/><circle cx="27" cy="4" r="2.4" fill="#111"/><circle cx="39" cy="0" r="2.6" fill="#ff6b8a"/>
        <path d="M36 -2 L46 -7 M36 2 L46 7 M36 0 L47 0" stroke="#ddd" stroke-width="1"/></svg>`;
      // Facing you, for the little dance at the end
      const RATF = `<svg viewBox="-50 -55 100 110" class="ratsvg" aria-hidden="true">
        <path class="tail" d="M18 34 C40 38 46 18 38 8" fill="none" stroke="#e8a0a8" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse cx="0" cy="26" rx="24" ry="22" fill="#8e8a99"/><ellipse cx="0" cy="30" rx="14" ry="14" fill="#c9c5d3"/>
        <ellipse cx="-12" cy="48" rx="8" ry="4" fill="#e8a0a8"/><ellipse cx="12" cy="48" rx="8" ry="4" fill="#e8a0a8"/>
        <g class="arms"><path d="M-20 18 Q-34 6 -32 -6" stroke="#8e8a99" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M20 18 Q34 6 32 -6" stroke="#8e8a99" stroke-width="7" fill="none" stroke-linecap="round"/>
          <circle cx="-32" cy="-8" r="4.5" fill="#e8a0a8"/><circle cx="32" cy="-8" r="4.5" fill="#e8a0a8"/></g>
        <circle cx="-20" cy="-30" r="14" fill="#8e8a99"/><circle cx="20" cy="-30" r="14" fill="#8e8a99"/><circle cx="-20" cy="-30" r="8.5" fill="#e8a0a8"/><circle cx="20" cy="-30" r="8.5" fill="#e8a0a8"/>
        <ellipse cx="0" cy="-12" rx="21" ry="19" fill="#a9a5b4"/>
        <circle cx="-8" cy="-16" r="4.2" fill="#111"/><circle cx="8" cy="-16" r="4.2" fill="#111"/><circle cx="-6.6" cy="-17.6" r="1.4" fill="#fff"/><circle cx="9.4" cy="-17.6" r="1.4" fill="#fff"/>
        <circle cx="0" cy="-6" r="3.6" fill="#ff6b8a"/><path d="M-6 -1 Q0 5 6 -1" stroke="#5a5566" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M-5 -5 L-22 -9 M-5 -3 L-22 -2 M5 -5 L22 -9 M5 -3 L22 -2" stroke="#ddd" stroke-width="1"/></svg>`;
      command(t('¡SIGUE!'), () => {
        const { lay, W, H } = lay0(`<div class="ringf" id="rg"></div><div class="obj rat" id="mo">${RAT}</div><span class="hint-here" id="here">👆<em>${t('pon el dedo en la ratita')}</em></span><div class="pct" id="pct">0 %</div>`);
        const mo = $id('mo'), rg = $id('rg'), here = $id('here'), pct = $id('pct');
        let x = W / 2, y = H / 2, head = rand() * Math.PI * 2, want = head, spd = 0, wantSpd = 0, nextTurn = 0, pause = 0;
        let started = 0, on = false, finger = null, inT = 0, last = performance.now(); const DUR = T(4500) / 1000;
        // It faces left or right (never upside down) and tilts a little toward where it's going
        const draw = () => { place(mo, x, y); place(rg, x, y); const c = Math.cos(head), sn = Math.sin(head), flip = c < 0 ? -1 : 1;
          const tilt = Math.max(-0.6, Math.min(0.6, Math.atan2(sn, Math.abs(c)))) * flip;
          mo.style.transform = `translate(-50%, -50%) scaleX(${flip}) rotate(${tilt * flip}rad)`; };
        draw(); place(here, x, y + 14);
        listen({ down: e => { finger = ptIn(lay, e); on = true; if (!started && near(finger, [x, y], 55)) { started = performance.now(); here.hidden = true; } },
          move: e => { finger = ptIn(lay, e); }, up: () => { on = false; } });
        animate((t, now) => { const dt = Math.min(0.04, (now - last) / 1000); last = now; if (!started) return;
          const tt = (now - started) / 1000;
          // Every so often: a new heading (a sharp turn), a new speed, sometimes a short freeze
          if (tt >= nextTurn) { nextTurn = tt + (0.32 + rand() * 0.55) / sp; want = head + (rand() < 0.5 ? -1 : 1) * (0.7 + rand() * 1.6);
            wantSpd = (rand() < 0.12 ? 0 : (150 + rand() * 170)) * sp; if (!wantSpd) pause = 0.15; }
          head += (want - head) * Math.min(1, dt * 9); spd += (wantSpd - spd) * Math.min(1, dt * 7);
          if (pause > 0) { pause -= dt; spd *= 0.6; }
          x += Math.cos(head) * spd * dt; y += Math.sin(head) * spd * dt;
          const x0 = W * 0.12, x1 = W * 0.88, y0 = H * 0.14, y1 = H * 0.86;
          if (x < x0 || x > x1) { x = Math.max(x0, Math.min(x1, x)); head = Math.PI - head; want = head; }
          if (y < y0 || y > y1) { y = Math.max(y0, Math.min(y1, y)); head = -head; want = head; }
          draw();
          const ok = on && finger && near(finger, [x, y], 60); rg.classList.toggle('ok', ok); if (ok) inT += dt;
          pct.textContent = `${Math.round(inT / Math.max(tt, 0.01) * 100)} %`;
          if (tt >= DUR) { const k = inT / DUR, n = k >= 0.8 ? 3 : k >= 0.6 ? 2 : k >= 0.35 ? 1 : 0;
            // Made it: the rat stops, turns to look at you and dances
            if (n >= 2) { rg.remove(); mo.className = 'obj rat front'; mo.style.transform = 'translate(-50%, -50%)'; mo.innerHTML = RATF;
              place(mo, Math.max(W * 0.25, Math.min(W * 0.75, x)), Math.max(H * 0.3, Math.min(H * 0.75, y)));
              for (let i = 0; i < 4; i++) { const nt = mk(lay, 'span', 'obj note', pick(['♪', '♫'])); place(nt, parseFloat(mo.style.left) + (i - 1.5) * 30, parseFloat(mo.style.top) - 50); nt.style.animationDelay = `${i * 0.25}s`; } }
            finish(n, t('La seguiste el {n} %', { n: Math.round(k * 100) }), n >= 2 ? 1900 : 800); return false; } });
        active = true; runTimer(T(8000), () => finish(0, started ? null : t('No pusiste el dedo')));
      }, '👆 🐀', t('pon el dedo en la ratita y no la sueltes'));
    },
    // 21 ¡REPITE!: the pads light up in order; repeat it
    repite() {
      const n = sp >= 1.2 ? 6 : 5, seq = []; while (seq.length < n) { const c = rnd(4); if (c !== seq[seq.length - 1]) seq.push(c); }
      command(t('¡REPITE!'), () => {
        set(`<div class="sub ask" id="ask">${t('Mira…')}</div><div class="pads">${['#ff4d5e', '#4d8bff', '#3ddc84', '#ffd23f'].map((c, i) => `<button type="button" data-i="${i}" style="--c:${c}" aria-label="${t('Botón {n}', { n: i + 1 })}"></button>`).join('')}</div>`);
        const pads = [...screen.querySelectorAll('.pads button')], ask = $id('ask');
        const flash = i => { pads[i].classList.add('lit'); later(() => pads[i].classList.remove('lit'), T(380)); };
        seq.forEach((i, k) => later(() => flash(i), 300 + k * T(560)));
        later(() => { ask.textContent = t('¡Ahora tú!'); let k = 0; active = true; const t0 = runTimer(T(6000), () => finish(0, t('Eran {n}', { n })));
          pads.forEach((b, i) => tap(b, () => { flash(i); if (i !== seq[k]) { finish(0, t('¡Ese no era!')); return; } k++;
            if (k === n) { const s = (performance.now() - t0) / 1000 * sp; finish(s < 3 ? 3 : s < 4.4 ? 2 : 1, t('¡Igualito!')); } })); }, 300 + n * T(560));
      }, '🟥🟦🟩', t('mira el orden y repítelo'));
    },
    // 22 ¡DÓNDE QUEDÓ!: the ball goes under a cup, the cups swap; tap the right one
    dondequedo() {
      command(t('¡DÓNDE QUEDÓ!'), () => {
        const { lay, W, H } = lay0('<span class="obj pearl" id="pe">⚪</span>');
        const pe = $id('pe'), xs = [W * 0.22, W * 0.5, W * 0.78], cy = H * 0.5;
        const cups = [0, 1, 2].map(i => { const c = mk(lay, 'button', 'obj cup'); c.pos = i; place(c, xs[i], cy - 50); return c; });
        let ball = rnd(3); place(pe, xs[ball], cy + 18);
        later(() => cups.forEach(c => place(c, xs[c.pos], cy)), 700);
        const swaps = sp >= 1.2 ? 5 : 4; let k = 0;
        const swap = () => { const a = rnd(3); let b = rnd(3); if (b === a) b = (a + 1) % 3;
          const ca = cups.find(c => c.pos === a), cb = cups.find(c => c.pos === b); ca.pos = b; cb.pos = a;
          if (ball === a) ball = b; else if (ball === b) ball = a;
          [ca, cb].forEach(c => { c.style.transition = `left ${T(320)}ms ease-in-out`; place(c, xs[c.pos], cy); });
          if (++k < swaps) later(swap, T(380)); else later(ask, T(380)); };
        later(() => { pe.hidden = true; swap(); }, 1100);
        const ask = () => { place(pe, xs[ball], cy + 18); active = true; const t0 = runTimer(T(3000), () => finish(0, t('¡Se acabó el tiempo!')));
          cups.forEach(c => tap(c, () => { cups.forEach(o => place(o, xs[o.pos], cy - 50)); pe.hidden = false;
            const s = (performance.now() - t0) / 1000 * sp; finish(c.pos === ball ? (s < 1.2 ? 3 : s < 2.2 ? 2 : 1) : 0, c.pos === ball ? t('¡Ahí estaba!') : t('¡Estaba en otro!')); })); };
      }, '⚪ 🥤🥤🥤', t('sigue la bolita'));
    },
    // 23 ¡DIFERENTE!: two boards almost the same; tap the one thing that changed
    diferente() {
      const PAIRS = [['🍎', '🍏'], ['🐶', '🐕'], ['⭐', '🌟'], ['🍋', '🍊'], ['🌷', '🌹'], ['😀', '😃'], ['🚗', '🚙'], ['🐱', '🐈'], ['🍇', '🫐'], ['🌙', '🌛']];
      const pool = shuffle([...PAIRS]).slice(0, 6), cells = Array.from({ length: 12 }, () => pick(pool)[0]), at = rnd(12);
      const changed = PAIRS.find(p => p[0] === cells[at])[1], b = [...cells]; b[at] = changed;
      command(t('¡DIFERENTE!'), () => {
        // Two boards with a line between them, so it's clear which is which; tapping the change on either one counts
        const board = g => `<div class="diff">${g.map((e, i) => `<button type="button" data-i="${i}">${e}</button>`).join('')}</div>`;
        set(`<div class="diffwrap">${board(cells)}<div class="diffsep"></div>${board(b)}</div>`);
        const pair = () => [...screen.querySelectorAll(`.diff button[data-i="${at}"]`)];
        // Missed (or out of time): the two that differ start blinking so you see where it was
        const show = () => pair().forEach(x => x.classList.add('found', 'blink'));
        active = true; const t0 = runTimer(T(6000), () => { show(); finish(0, t('Era esta'), 1500); });
        screen.querySelectorAll('.diff button').forEach(btn => tap(btn, () => { const ok = +btn.dataset.i === at;
          const s = (performance.now() - t0) / 1000 * sp;
          if (!ok) { btn.classList.add('nope'); show(); finish(0, t('¡Era otra!'), 1500); return; }
          // Found: the two light up, a beam joins them across the line, and they sparkle
          const D = demo.getBoundingClientRect(), c = pair().map(x => { x.classList.add('found', 'hit'); const r = x.getBoundingClientRect(); return [r.left - D.left + r.width / 2, r.top - D.top + r.height / 2]; });
          const beam = mk(demo, 'div', 'diffbeam'); Object.assign(beam.style, { left: c[0][0] - 3 + 'px', top: c[0][1] + 'px', height: c[1][1] - c[0][1] + 'px' });
          c.forEach(([x, y]) => { for (let i = 0; i < 8; i++) { const sp2 = mk(demo, 'span', 'obj sparkle', i % 2 ? '✦' : '✧'); place(sp2, x, y);
            const an = i / 8 * Math.PI * 2 + 0.3, d = 30 + rand() * 22; sp2.style.setProperty('--dx', `${Math.cos(an) * d}px`); sp2.style.setProperty('--dy', `${Math.sin(an) * d}px`); setTimeout(() => sp2.remove(), 900); } });
          setTimeout(() => beam.remove(), 1300);
          finish(s < 2.2 ? 3 : s < 3.8 ? 2 : 1, t('¡La encontraste!'), 1200); }));
      }, '🔍', t('toca lo único que cambió'));
    },
    // 24 ¡CUÁL FALTA!: four things, then only three come back; which one left?
    cualfalta() {
      const set4 = shuffle(['🐸', '🦊', '🐧', '🐙', '🦄', '🐢', '🦉', '🐞', '🦀', '🐝']), shown = set4.slice(0, 4), gone = pick(shown), extra = set4.slice(4, 6);
      command(t('¡CUÁL FALTA!'), () => {
        set(`<div class="row4">${shown.map(e => `<span>${e}</span>`).join('')}</div>`);
        later(() => {
          // The other three stay right where they were; a ? marks the empty spot
          set(`<div class="row4 dim">${shown.map(e => e === gone ? '<span class="q" id="hole">?</span>' : `<span>${e}</span>`).join('')}</div><div class="sub ask">${t('¿Cuál se fue?')}</div><div class="opts3 emo" id="o3">${shuffle([gone, ...extra]).map(e => `<button type="button" data-e="${e}">${e}</button>`).join('')}</div>`);
          const hole = $id('hole'), o3 = $id('o3');
          // Fill the spot: right one fits and sparkles; wrong one bounces off and the real one shows up blinking
          const fill = (e, ok) => { hole.textContent = e; hole.className = ok ? 'fit' : 'fit wrongfit'; };
          active = true; const t0 = runTimer(T(3500), () => { fill(gone, false); hole.classList.add('blinkfit'); finish(0, t('Se fue {e}', { e: gone }), 1300); });
          let locked = false;
          o3.querySelectorAll('button').forEach(b => tap(b, () => { if (locked) return; locked = true; cancelAnimationFrame(raf);
            const ok = b.dataset.e === gone, n = ok ? timeStars(t0, 1.4, 2.5) : 0;
            o3.classList.add('picking'); b.classList.add('chosen');
            // It flies from its button back to the empty spot
            later(() => { const D = demo.getBoundingClientRect(), r1 = b.getBoundingClientRect(), r2 = hole.getBoundingClientRect();
              const fly = mk(demo, 'span', 'obj flyback', b.dataset.e); place(fly, r1.left - D.left + r1.width / 2, r1.top - D.top + r1.height / 2);
              b.style.visibility = 'hidden'; requestAnimationFrame(() => requestAnimationFrame(() => place(fly, r2.left - D.left + r2.width / 2, r2.top - D.top + r2.height / 2)));
              later(() => { const cx = r2.left - D.left + r2.width / 2, cy = r2.top - D.top + r2.height / 2;
                if (ok) { fly.remove(); fill(gone, true);
                  for (let i = 0; i < 8; i++) { const sp2 = mk(demo, 'span', 'obj sparkle', i % 2 ? '✦' : '✧'); place(sp2, cx, cy); const an = i / 8 * Math.PI * 2, d = 34 + rand() * 20;
                    sp2.style.setProperty('--dx', `${Math.cos(an) * d}px`); sp2.style.setProperty('--dy', `${Math.sin(an) * d}px`); setTimeout(() => sp2.remove(), 900); }
                  finish(n, t('¡Bien! Ese era'), 1100); }
                else { fly.classList.add('bounce'); later(() => { fly.remove(); fill(gone, false); hole.classList.add('blinkfit'); finish(0, t('¡Mal! Se fue {e}', { e: gone }), 1300); }, 420); }
              }, 480); }, reduce ? 100 : 380); }));
        }, T(1400));
      }, '👀', t('mira bien: uno se va a ir'));
    },
    // 25 ¡MÁS!: three rounds in a row, each a bit closer than the last; tap the tray with more. One star per right answer.
    // Sometimes both trays hold the same thing; sometimes each holds something different (and a different size), to fool the eye
    mas() {
      const EMO = ['⭐', '🍬', '🪙', '🫐', '🍓', '🌸', '🐞', '🍪'];
      const GAP = [0.45, 0.28, 0.14];   // how much bigger the bigger pile is, round by round
      const rounds = GAP.map(g => { const a = 9 + rnd(9), b = a + Math.max(1, Math.round(a * g * (0.8 + rand() * 0.4))), left = rand() < 0.5;
        const same = rand() < 0.5, e1 = pick(EMO), e2 = same ? e1 : pick(EMO.filter(e => e !== e1));
        // When they differ, the tray with more usually gets the smaller things, so it looks like less
        const big = 1.55, small = 1.05, fsMore = same ? 1.25 : (rand() < 0.7 ? small : big), fsLess = same ? 1.25 : (fsMore === small ? big : small);
        return left ? { L: b, R: a, eL: e1, eR: e2, fL: fsMore, fR: fsLess } : { L: a, R: b, eL: e1, eR: e2, fL: fsLess, fR: fsMore }; });
      command(t('¡MÁS!'), () => {
        // Spread evenly but loosely inside a round tray, never touching each other or the rim
        const pile = (n, emo, fs) => { const pts = []; let minD = 0.95 * Math.sqrt(Math.PI * 0.74 * 0.74 / n);
          for (let tries = 0; pts.length < n; tries++) { if (tries > 400) { minD *= 0.93; tries = 0; }
            const a = rand() * Math.PI * 2, r = 0.74 * Math.sqrt(rand()), q = [r * Math.cos(a), r * Math.sin(a)];
            if (pts.every(o => Math.hypot(o[0] - q[0], o[1] - q[1]) >= minD)) pts.push(q); }
          return pts.map(([x, y]) => `<span style="left:${50 + x * 50}%;top:${50 + y * 50}%;font-size:${fs}rem;rotate:${Math.round((rand() - 0.5) * 40)}deg">${emo}</span>`).join(''); };
        let i = 0, right = 0; const marks = [];
        const play = () => { const r = rounds[i];
          set(`<div class="masdots">${GAP.map((_, j) => `<i class="${marks[j] === undefined ? (j === i ? 'cur' : '') : marks[j] ? 'ok' : 'no'}"></i>`).join('')}</div><div class="sub ask">${t('¿Dónde hay más?')}</div>
            <div class="piles"><button type="button" data-s="L">${pile(r.L, r.eL, r.fL)}</button><button type="button" data-s="R">${pile(r.R, r.eR, r.fR)}</button></div>`);
          let done = false;
          const end = btn => { if (done) return; done = true; cancelAnimationFrame(raf);
            const ok = !!btn && (btn.dataset.s === 'L') === (r.L > r.R); marks[i] = ok; if (ok) right++;
            const bs = screen.querySelectorAll('.piles button'); bs.forEach(b => { b.classList.add(((b.dataset.s === 'L') === (r.L > r.R)) ? 'more' : 'less');
              mk(b, 'b', 'pilecount', b.dataset.s === 'L' ? r.L : r.R); });
            if (btn) btn.classList.add(ok ? 'gotit' : 'missed');
            screen.querySelector('.masdots').children[i].className = ok ? 'ok' : 'no';
            later(() => { i++; if (i < rounds.length) play(); else finish(right, right === 3 ? t('¡Las tres!') : t('{n} de 3', { n: right })); }, 950); };
          runTimer(T(3000), () => end(null));
          screen.querySelectorAll('.piles button').forEach(btn => tap(btn, () => end(btn))); };
        active = true; play();
      }, '⚖️ ×3', t('tres veces: toca el lado con más'));
    },
    // 26 ¡QUÉ HORA ES!: an analog clock and three times
    quehora() {
      const h = 1 + rnd(12), m = pick([0, 15, 30, 45, 5, 10, 20, 40, 50]);
      const fmt = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`, right = fmt(h, m);
      const swapped = m % 5 === 0 && m / 5 !== h && m / 5 > 0 ? fmt(m / 5, (h % 12) * 5) : fmt(h % 12 + 1, m);
      const opts = shuffle([...new Set([right, swapped, fmt(h === 1 ? 12 : h - 1, m), fmt(h % 12 + 1, m)])].slice(0, 3).concat([]));
      if (!opts.includes(right)) opts[0] = right;
      command(t('¡QUÉ HORA ES!'), () => {
        const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
        const hand = (an, len, w, col) => `<line x1="50" y1="50" x2="${50 + len * Math.sin(an * Math.PI / 180)}" y2="${50 - len * Math.cos(an * Math.PI / 180)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
        const ticks = [...Array(12).keys()].map(k => { const an = k * 30 * Math.PI / 180; return `<line x1="${50 + 40 * Math.sin(an)}" y1="${50 - 40 * Math.cos(an)}" x2="${50 + 45 * Math.sin(an)}" y2="${50 - 45 * Math.cos(an)}" stroke="#fff" stroke-width="${k % 3 ? 1.5 : 3}"/>`; }).join('');
        const nums = [12, 3, 6, 9].map((nn, k) => `<text x="${50 + 33 * Math.sin(k * Math.PI / 2)}" y="${50 - 33 * Math.cos(k * Math.PI / 2) + 4}" font-size="10" fill="#fff" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900">${nn}</text>`).join('');
        set(`<svg class="clock" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#1f0c38" stroke="#ffd23f" stroke-width="3"/>${ticks}${nums}${hand(ha, 22, 5, '#ffd23f')}${hand(ma, 36, 3, '#2ee6d6')}<circle cx="50" cy="50" r="3.5" fill="#fff"/></svg><div class="opts3 wide">${opts.map(o => `<button type="button" data-v="${o}">${o}</button>`).join('')}</div>`);
        active = true; const t0 = runTimer(T(4500), () => finish(0, t('Eran las {h}', { h: right })));
        screen.querySelectorAll('.opts3 button').forEach(b => tap(b, () => { const ok = b.dataset.v === right; const s = (performance.now() - t0) / 1000 * sp;
          finish(ok ? (s < 2 ? 3 : s < 3.4 ? 2 : 1) : 0, ok ? null : t('Eran las {h}', { h: right })); }));
      }, '🕐', t('aguja corta: hora · aguja larga: minutos'));
    },
    // 27 ¡SU SOMBRA!: one thing and three silhouettes: its own, its mirror image, and a different one
    sombra() {
      const POOL = ['🦒', '🐘', '🦖', '🐓', '🦜', '🚲', '🎸', '🦕', '🐿️', '🦘', '🐊', '🛵', '🐕', '🦩'];
      const [goal, other] = shuffle([...POOL]);
      command(t('¡SU SOMBRA!'), () => {
        const opts = shuffle([['ok', ''], ['mirror', 'transform:scaleX(-1)'], ['other', '']]);
        set(`<div class="shadowgoal">${goal}</div><div class="sub ask">${t('¿Cuál es su sombra?')}</div><div class="shadows">${opts.map(([k, st]) => `<button type="button" data-k="${k}"><span style="${st}">${k === 'other' ? other : goal}</span></button>`).join('')}</div>`);
        active = true; const t0 = runTimer(T(4000), () => finish(0, t('¡Se acabó el tiempo!')));
        screen.querySelectorAll('.shadows button').forEach(b => tap(b, () => { const k = b.dataset.k; b.classList.add('show'); const s = (performance.now() - t0) / 1000 * sp;
          finish(k === 'ok' ? (s < 1.4 ? 3 : s < 2.6 ? 2 : 1) : 0, k === 'ok' ? null : k === 'mirror' ? t('¡Esa estaba al revés!') : t('¡Esa era de otro!')); }));
      }, '🌑', t('toca la silueta que le corresponde'));
    },
    // 28 ¡COMPLETA!: a number series and three answers
    completa() {
      const kind = rnd(4); let s = [], r;
      if (kind === 0) { const a = 1 + rnd(15), k = 2 + rnd(8); s = [a, a + k, a + 2 * k, a + 3 * k]; r = a + 4 * k; }
      else if (kind === 1) { const a = 1 + rnd(5); s = [a, a * 2, a * 4, a * 8]; r = a * 16; }
      else if (kind === 2) { const k = 2 + rnd(6), a = 4 * k + 5 + rnd(20); s = [a, a - k, a - 2 * k, a - 3 * k]; r = a - 4 * k; }
      else { const a = 1 + rnd(9), p = 1 + rnd(4), q = 3 + rnd(5); s = [a, a + p, a + p + q, a + 2 * p + q]; r = a + 2 * p + 2 * q; }
      const opts = shuffle([r, ...shuffle([r + 1, r - 1, r + 2, r - 2, r + 10].filter(v => v >= 0 && v !== r)).slice(0, 2)]);
      command(t('¡COMPLETA!'), () => {
        set(`<div class="series">${s.join(', ')}, <b>?</b></div><div class="opts3 low">${opts.map(v => `<button type="button" data-v="${v}">${v}</button>`).join('')}</div>`);
        active = true; const t0 = runTimer(T(4500), () => finish(0, t('Era {n}', { n: r })));
        numPick(screen.querySelector('.opts3'), r, t0, sec => sec < 2 ? 3 : sec < 3.4 ? 2 : 1, t('Era {n}', { n: r }));
      }, '🔢', t('qué número sigue'));
    },
    // 30 ¡NO TOQUES!: whack-a-mole, arcade style. Moles pop out of the holes, and now and then a bomb. Bonk every mole, never the bomb
    notoques() {
      const MOLE = `<svg viewBox="0 0 100 110" aria-hidden="true"><defs>
          <radialGradient id="mFur" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#b98048"/><stop offset=".6" stop-color="#8d5a2c"/><stop offset="1" stop-color="#5e3a1b"/></radialGradient>
          <radialGradient id="mBelly" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#e9c294"/><stop offset="1" stop-color="#c99a68"/></radialGradient>
          <radialGradient id="mSnout" cx="45%" cy="35%" r="65%"><stop offset="0" stop-color="#ffe2c4"/><stop offset="1" stop-color="#e2b285"/></radialGradient>
          <radialGradient id="mNose" cx="40%" cy="35%" r="60%"><stop offset="0" stop-color="#ffb3c7"/><stop offset="1" stop-color="#e2557a"/></radialGradient></defs>
        <path d="M47 6 Q44 0 41 3 M51 5 Q52 -1 56 2 M49 6 Q49 0 49 -1" stroke="#6e4320" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M10 112 V54 C10 22 28 6 50 6 C72 6 90 22 90 54 V112 Z" fill="url(#mFur)"/>
        <path d="M24 112 V66 C24 46 36 36 50 36 C64 36 76 46 76 66 V112 Z" fill="url(#mBelly)" opacity=".9"/>
        <ellipse cx="27" cy="58" rx="7" ry="4.5" fill="#ff8fa8" opacity=".45"/><ellipse cx="73" cy="58" rx="7" ry="4.5" fill="#ff8fa8" opacity=".45"/>
        <g class="eyes"><ellipse cx="37" cy="42" rx="5" ry="6.2" fill="#1b0f08"/><ellipse cx="63" cy="42" rx="5" ry="6.2" fill="#1b0f08"/>
          <circle cx="38.8" cy="39.5" r="2" fill="#fff"/><circle cx="64.8" cy="39.5" r="2" fill="#fff"/><circle cx="35.6" cy="44.6" r=".9" fill="#fff"/><circle cx="61.6" cy="44.6" r=".9" fill="#fff"/></g>
        <g class="dizzy" fill="none" stroke="#1b0f08" stroke-width="2.2" stroke-linecap="round">
          <path d="M37 42 m-1 0 a1 1 0 1 1 2 0 a2.5 2.5 0 1 1 -5 0 a4 4 0 1 1 8 0"/><path d="M63 42 m-1 0 a1 1 0 1 1 2 0 a2.5 2.5 0 1 1 -5 0 a4 4 0 1 1 8 0"/></g>
        <ellipse cx="50" cy="60" rx="17" ry="12" fill="url(#mSnout)"/>
        <path d="M44 53 C44 49 56 49 56 53 C56 57 52 59 50 59 C48 59 44 57 44 53 Z" fill="url(#mNose)"/><ellipse cx="48" cy="52" rx="2.2" ry="1.3" fill="#fff" opacity=".8"/>
        <path d="M50 59 V63 M50 63 Q46 67 43 64 M50 63 Q54 67 57 64" stroke="#7a4a26" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <rect x="46.5" y="64" width="3.4" height="5" rx="1" fill="#fff"/><rect x="50.1" y="64" width="3.4" height="5" rx="1" fill="#fff"/>
        <g stroke="#3d2412" stroke-width="1" opacity=".6" stroke-linecap="round"><path d="M34 60 L18 56 M34 63 L17 64 M66 60 L82 56 M66 63 L83 64"/></g>
        <g class="paws"><ellipse cx="30" cy="100" rx="12" ry="8" fill="#f2c9a0"/><ellipse cx="70" cy="100" rx="12" ry="8" fill="#f2c9a0"/>
          <path d="M24 97 v5 M29 96 v6 M34 97 v5 M66 97 v5 M71 96 v6 M76 97 v5" stroke="#c99a68" stroke-width="1.4" stroke-linecap="round"/></g>
        <g class="stars"><path d="M20 14 l2 4 4 .5 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.5z" fill="#ffd23f"/><path d="M80 10 l1.6 3.2 3.4 .4 -2.4 2.4 .7 3.4 -3.3 -1.7 -3.3 1.7 .7 -3.4 -2.4 -2.4 3.4 -.4z" fill="#ffd23f"/><path d="M50 -4 l1.4 2.8 3 .4 -2.2 2 .6 3 -2.8 -1.4 -2.8 1.4 .6 -3 -2.2 -2 3 -.4z" fill="#fff6c2"/></g></svg>`;
      const BOMB = `<svg viewBox="0 0 100 110" aria-hidden="true"><defs>
          <radialGradient id="bBody" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#6b7080"/><stop offset=".45" stop-color="#2a2d36"/><stop offset="1" stop-color="#0c0d11"/></radialGradient>
          <linearGradient id="bCap" x1="0" x2="1"><stop offset="0" stop-color="#7a7f8c"/><stop offset=".5" stop-color="#d7dae2"/><stop offset="1" stop-color="#6a6f7c"/></linearGradient>
          <radialGradient id="bSpark" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe680"/><stop offset=".7" stop-color="#ff9a1f" stop-opacity=".8"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient></defs>
        <path d="M58 24 C62 12 72 6 80 10" stroke="#8a6a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M58 24 C62 12 72 6 80 10" stroke="#d9b77a" stroke-width="5" fill="none" stroke-dasharray="3 3" stroke-linecap="round"/>
        <g class="spark"><circle cx="81" cy="9" r="12" fill="url(#bSpark)"/>
          <path d="M81 -3 v6 M81 15 v6 M69 9 h6 M87 9 h6 M73 1 l4 4 M85 13 l4 4 M89 1 l-4 4 M73 17 l4 -4" stroke="#ffe680" stroke-width="2" stroke-linecap="round"/></g>
        <rect x="40" y="18" width="22" height="14" rx="3" fill="url(#bCap)"/><rect x="40" y="18" width="22" height="3.5" rx="1.5" fill="#fff" opacity=".35"/>
        <circle cx="51" cy="68" r="40" fill="url(#bBody)"/>
        <ellipse cx="36" cy="50" rx="11" ry="7" transform="rotate(-35 36 50)" fill="#fff" opacity=".35"/><circle cx="31" cy="58" r="3" fill="#fff" opacity=".25"/>
        <path d="M18 84 A40 40 0 0 0 84 84" stroke="#000" stroke-width="5" fill="none" opacity=".25"/></svg>`;
      command(t('¡NO TOQUES!'), () => {
        const { lay, W, H } = lay0('<div class="arcade"></div><div class="whackhud" id="wh">🔨 0 / 9</div>');
        // Three rows, smaller toward the back, for a bit of depth
        const ROWS = [[0.34, 0.72], [0.57, 0.86], [0.82, 1]], holes = [];
        ROWS.forEach(([ry, sc]) => [-1, 0, 1].forEach(cx => {
          const w = W * 0.26 * sc, hx = W / 2 + cx * W * 0.3 * sc, hy = H * ry;
          const box = mk(lay, 'div', 'whack'); Object.assign(box.style, { left: hx - w / 2 + 'px', top: hy - w * 1.15 + 'px', width: w + 'px', height: w * 1.15 + 'px', zIndex: Math.round(ry * 10) });
          const back = mk(lay, 'div', 'whole'); Object.assign(back.style, { left: hx - w * 0.55 + 'px', top: hy - w * 0.18 + 'px', width: w * 1.1 + 'px', height: w * 0.36 + 'px', zIndex: Math.round(ry * 10) - 1 });
          const lip = mk(lay, 'div', 'wlip'); Object.assign(lip.style, { left: hx - w * 0.55 + 'px', top: hy - w * 0.02 + 'px', width: w * 1.1 + 'px', height: w * 0.22 + 'px', zIndex: Math.round(ry * 10) + 1 });
          const c = mk(box, 'button', 'critter'); holes.push({ box, c, busy: false });
        }));
        const wh = $id('wh'), plan = shuffle([...Array(9).fill('mole'), 'bomb', 'bomb', 'bomb']);
        // A little burst of dirt from the hole's mouth
        const puff = h => { const bx = parseFloat(h.box.style.left), bw = h.box.offsetWidth, by = parseFloat(h.box.style.top) + h.box.offsetHeight;
          for (let i = 0; i < 6; i++) { const d = mk(lay, 'span', 'dirt'); const dx = (rand() - 0.5) * bw * 0.9;
            Object.assign(d.style, { left: bx + bw / 2 + dx * 0.4 + 'px', top: by - 4 + 'px', '--dx': dx + 'px', '--dy': -(14 + rand() * 22) + 'px', zIndex: 40 });
            later(() => d.remove(), 520); } };
        let good = 0, k = 0;
        // All nine bonked: the nine moles pop up together and dance a little
        const party = () => holes.forEach((h, i) => { h.c.className = 'critter mole'; h.c.innerHTML = MOLE; h.c.style.setProperty('--d', `${(i % 3) * 0.12 + Math.floor(i / 3) * 0.06}s`);
          // plain timeouts: finish() clears the game's own timers, and this runs right after it
          setTimeout(() => { h.c.classList.add('up'); setTimeout(() => h.c.classList.add('dance'), 280); }, i * 40);
          const n = mk(lay, 'span', 'obj note', pick(['♪', '♫'])); const r = h.box.getBoundingClientRect(), L = lay.getBoundingClientRect();
          place(n, r.left - L.left + r.width * (0.2 + rand() * 0.6), r.top - L.top + 6); n.style.animationDelay = `${0.3 + rand() * 0.8}s`; });
        const show = () => { if (!active) return;
          if (k >= plan.length) { later(() => { if (good === 9) { party(); finish(3, t('¡Los 9! A bailar'), 2300); } else finish(good >= 7 ? 2 : good >= 4 ? 1 : 0, t('{n} de 9 topos', { n: good })); }, T(700)); return; }
          const free = holes.filter(h => !h.busy); if (!free.length) { later(show, 120); return; }
          const h = pick(free), what = plan[k++]; h.busy = true; h.what = what; h.hit = false;
          h.c.className = `critter ${what}`; h.c.innerHTML = what === 'mole' ? MOLE : BOMB; h.c.setAttribute('aria-label', what === 'mole' ? t('Topo') : t('Bomba'));
          requestAnimationFrame(() => h.c.classList.add('up'));
          puff(h);
          later(() => { h.c.classList.remove('up'); later(() => { h.busy = false; }, 160); }, T(900));
          later(show, T(430)); };
        holes.forEach(h => tap(h.c, () => { if (!h.busy || h.hit || !h.c.classList.contains('up')) return; h.hit = true;
          if (h.what === 'bomb') { h.c.classList.add('boom'); const r = h.box.getBoundingClientRect(), L = lay.getBoundingClientRect();
            const fx = mk(lay, 'div', 'boomfx'); place(fx, r.left - L.left + r.width / 2, r.top - L.top + r.height * 0.55); h.c.innerHTML = '';
            lay.classList.add('fail', 'shake'); finish(0, t('¡Tocaste la bomba!')); return; }
          good++; wh.textContent = `🔨 ${good} / 9`; h.c.classList.add('bonk'); pop(lay, '+1', parseFloat(h.box.style.left) + h.box.offsetWidth / 2, parseFloat(h.box.style.top));
          later(() => h.c.classList.remove('up'), 220); }));
        active = true; show();
      }, '🔨 ✓  💣 ✗', t('golpea los topos, nunca la bomba'));
    },
  };
  const META = [
    ['cruza', t('¡RUEDA!'), '⚪', 'Un puente que cambia de forma (curva, espiral, círculo, ola o gancho) y de lugar: lleva la bola desde el círculo amarillo hasta la meta a cuadros. Hay que llegar a tiempo; llegar da ★★★, cada toque al borde rojo resta una y al tercer toque pierdes. Si levantas el dedo, la bola espera: vuelve a ponerlo encima.'],
    ['espera', t('¡ESPERA… YA!'), '🟢', 'Rojo… y cuando pase a verde, toca. Antes de tiempo pierdes.'],
    ['toca', t('¡TOCA RÁPIDO!'), '🎈', 'Aprieta el botón lo más rápido que puedas para inflar el globo; si lo revientas, ★★★.'],
    ['quecolor', t('¡QUÉ COLOR!'), '🔴', 'Una palabra de color escrita en otra tinta. A veces pide el color de las letras, a veces el color que dice la palabra.'],
    ['cuenta', t('¡CUENTA!'), '🍎', 'Una cosa entre parecidas de su mismo color (manzanas, limones, pepinos, naranjas, uvas o peces), todas moviéndose: cuántas hay.'],
    ['atrapa', t('¡ATRAPA!'), '🪙', 'Arrastra la canasta: atrapa las monedas y esquiva las bombas, cada vez más rápido.'],
    ['corta', t('¡CORTA!'), '🥪', 'Desliza por la línea punteada para cortar la comida (sándwich, sandía, pizza, torta…). El corte va en cualquier dirección: de lado, de arriba abajo o en diagonal.'],
    ['ordena', t('¡ORDENA!'), '🐘', 'Cuatro números o animales en columna. Los puestos van de grande (arriba) a chico (abajo) y cada uno toma el tamaño de su puesto: arrástralos hasta que el más grande quede arriba.'],
    ['calcula', t('¡CALCULA!'), '➕', 'Una operación rápida y tres respuestas.'],
    ['conecta', t('¡CONECTA!'), '🟡', 'Cuatro en línea: toca la columna que gana (o arrastra tu ficha hasta ella); cae sola a su lugar.'],
    ['limpia', t('¡LIMPIA!'), '🧽', 'Una mesa, una cocina, una ventana o un plato sucios: pasa el dedo hasta que se vea todo limpio.'],
    ['para', t('¡PARA!'), '🎯', 'Un radar gira y va encendiendo luces de colores: frénalo en la franja. La zona ancha da ★, la del medio ★★ y la angosta del centro ★★★.'],
    ['aplasta', t('¡APLASTA!'), '🪰', 'Nueve moscas revoloteando: toca donde están y el matamoscas baja a aplastarlas. Dos de un golpe es ¡COMBO!'],
    ['revienta', t('¡REVIENTA!'), '🫧', 'Suben burbujas de distintos tamaños y colores parecidos: revienta solo las del azul que te muestran.'],
    ['alimenta', t('¡ALIMENTA!'), '🐵', 'Lleva cada comida a su animal.'],
    ['rebota', t('¡REBOTA!'), '👾', 'Como Pong: mueve la paleta para que la pelota rebote y le dé a los tres marcianitos pixelados de arriba.'],
    ['equilibra', t('¡EQUILIBRA!'), '🍽️', 'Un plato con tres cosas encima sobre un palo: muévelo de lado a lado. Si se inclina mucho se cae una cosa; cada una que queda es una estrella.'],
    ['dibuja', t('¡DIBUJA!'), '✏️', 'Repasa la figura punteada sin salirte. Completa da más estrellas; si te falta un pedazo, menos.'],
    ['sigue', t('¡SIGUE!'), '🐀', 'Una ratita corre rápido y cambia de dirección sin aviso: mantén el dedo encima. Si la sigues bien, al final te mira y baila.'],
    ['repite', t('¡REPITE!'), '🟦', 'Los botones se encienden en una secuencia de 5: repítela.'],
    ['dondequedo', t('¡DÓNDE QUEDÓ!'), '⚪', 'La bolita bajo un vaso, los vasos se mezclan: toca el correcto.'],
    ['diferente', t('¡DIFERENTE!'), '🔍', 'Dos tableros casi iguales, separados por una línea: toca lo único que cambió, en cualquiera de los dos.'],
    ['cualfalta', t('¡CUÁL FALTA!'), '👀', 'Cuatro cosas; una se va y queda su hueco. Eliges cuál era y vuela de vuelta a su lugar: calza si acertaste.'],
    ['mas', t('¡MÁS!'), '⚖️', 'Tres rondas seguidas, cada una más pareja: toca la bandeja con más. A veces las dos tienen lo mismo y a veces cosas distintas de otro tamaño, para engañar al ojo. Una ★ por acierto.'],
    ['quehora', t('¡QUÉ HORA ES!'), '🕐', 'Un reloj de agujas y tres horas.'],
    ['sombra', t('¡SU SOMBRA!'), '🌑', 'Una figura y tres siluetas: su sombra, su reflejo y la de otro.'],
    ['completa', t('¡COMPLETA!'), '🔢', 'Una serie de números: cuál sigue.'],
    ['notoques', t('¡NO TOQUES!'), '🔨', 'Como golpear topos de arcade: salen topos de los hoyos y a veces una bomba. Golpea los topos, nunca la bomba.'],
  ].map(([id, n, i, d]) => ({ id, n, i, d }));
  const NAMES = Object.fromEntries(META.map(m => [m.id, m.n]));
  if (META.some(m => !GAMES[m.id]) || Object.keys(GAMES).some(k => !NAMES[k])) console.warn('META and GAMES differ');

  // ---- The lab page: a cover with the rules folded in it, then runs of 10 different games in a row ----
  // A shared run (?seed=K7Q2X, or ?today for Uno al día's seed of the day) is the same on every phone: the
  // same ten games in the same order, and each one dealt the same (its own stream, engine.js `stream`).
  // Without a seed every run is a new draw.
  const TODAY = tiene('today'), DATE = new Date().toLocaleDateString('sv');
  const SEED = (TODAY ? semillaDel(DATE) : param('seed') || '').toUpperCase();
  const TODAY_KEY = 'microgames:today';
  let code = '', scored = false;
  const today = () => { try { const t = JSON.parse(localStorage.getItem(TODAY_KEY) || 'null'); return t?.d === DATE ? t : null; } catch (_) { return null; } };
  const MAX = RUN * 3, BEST = 'microgames:best', BEST_PTS = 'microgames:best-points';
  const keep = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (_) { /* not kept */ } };
  const kept = k => { try { return +localStorage.getItem(k) || 0; } catch (_) { return 0; } };
  let best = kept(BEST), bestPts = kept(BEST_PTS);
  const $btn = (id, fn) => $id(id)?.addEventListener('click', e => { e.stopPropagation(); initSound(); SFX.tap(); fn(); });
  $id('sound-slot')?.append(soundToggle());
  document.title = `${t('¡Al toque!')} ⚡ · ${t('Laboratorio')}`; $id('btn-volver').textContent = `‹ ${t('Laboratorio')}`; demo.setAttribute('aria-label', t('¡Al toque!'));
  // The run's progress in the corner: one mark per game, filled with how it went
  const rb = $id('runbar'), runbar = () => { rb.hidden = false; rb.innerHTML = order.map((_, i) => `<i class="${i < marks.length ? `s${marks[i]}` : i === idx - 1 ? 'cur' : ''}"></i>`).join(''); };
  let marks = [], startedAt = 0;
  // Under the stage: the site footer on the cover, with the game's 💬 comment as its option (C-17, U-38); just the comment elsewhere
  const pie = $id('pie'), COMMENT = Object.fromEntries(Object.entries({ titulo: '¿Qué te pareció?', lead: 'Cuéntanos qué microjuegos te gustaron, cuáles no se entendían y qué le cambiarías.', ph: 'Por ejemplo: en ¡Corta! no me daba el tiempo.', nombre: 'Nombre o apodo (opcional)', enviar: 'Enviar comentario', enviando: 'Enviando…', vacio: 'Escribe algo primero.', gracias: '¡Gracias! 🙌 Tu comentario llegó.', guardado: 'Ahora no hay internet: tu comentario quedó en el celular y se envía solo después.', error: 'No se pudo enviar. Prueba de nuevo en un rato.', cancelar: 'Cancelar', cerrar: 'Cerrar' }).map(([k, v]) => [k, t(v)]));
  const footer = screenName => { const b = document.createElement('button'); b.type = 'button'; b.className = 'link-btn'; b.id = 'btn-comentario'; b.textContent = t('💬 Sugerencias y comentarios');
    b.addEventListener('click', () => abrirComentario({ T: COMMENT, contexto: { juego: GAME_ID, pantalla: screenName, microjuego: curGame, corrida: order.join(' '), semilla: code } }));
    if (screenName === 'portada') footerInto(pie, { screen: `${GAME_ID}-cover`, inbox: false, options: [b], lang: LANG }); else pie.replaceChildren(b); };
  // The three ways to play, for the cover's folded rules (C-8, D-550): each with its gesture, moving
  const HOW = { toca: t('la respuesta, en el momento justo o muchas veces seguidas.'), arrastra: t('algo con el dedo hasta su lugar, o de lado a lado.'), desliza: t('el dedo por la pantalla: corta, recorre o frota.') };
  const rules = () => `<details class="panel howto-rules" id="reglas"><summary>${t('Cómo se juega')}</summary>
    <p>${t('Haz lo que dice la orden antes de que se acabe la barra: 10 microjuegos seguidos, cada vez más rápido.')}</p>
    <ul class="howkinds">${Object.entries(KINDS).map(([k, [label, , col]]) => `<li style="--kc:${col}"><span class="gstage g-${k}" aria-hidden="true">${GSTAGE[k]}</span><span><b>${label[0]}${label.slice(1).toLowerCase()}</b> ${HOW[k]}</span></li>`).join('')}</ul>
    <p>${t('Cada microjuego da hasta ★★★; los puntos son 10 por estrella, por la velocidad, y +5 por cada racha de ★★ o más.')}</p></details>`;
  // The cover's ⚡ sets off a microgame on each side, one after another: a fly swatted, a colour word, a sum,
  // bars sorting themselves, a balloon that pops. Each bit is CSS that plays once; reduced motion keeps one still
  const HERO = [
    ['fly', () => `<i class="hfly">🪰</i><b class="hpaf">${t('¡PAF!')}</b>`],
    ['stroop', () => `<b class="hword">${t('ROJO')}</b><i class="hdot"></i>`],
    ['sum', '<b class="hsum">7 + 5</b><b class="hres">= 12</b>'],
    ['sort', '<i class="hbar b1"></i><i class="hbar b2"></i><i class="hbar b3"></i>'],
    ['balloon', '<i class="hbal">🎈</i><i class="hpop">💥</i>'],
    ['clock', '<i class="hclock"><i></i></i>'],
  ];
  const heroLoop = () => {
    const hv = $id('hv'), bolt = $id('bolt'); let k = reduce ? 2 : Math.floor(Math.random() * HERO.length);   // still: the sum, whole
    const show = () => { if (!hv.isConnected) return; const [cls, html] = HERO[k % HERO.length];
      hv.className = `hv h-${cls} ${k % 2 ? 'side-r' : 'side-l'}`; hv.innerHTML = typeof html === 'function' ? html() : html;
      bolt.classList.remove('zap'); void bolt.offsetWidth; bolt.classList.add('zap'); k++;
      if (!reduce) later(show, 1700); };
    show();
  };
  function cover() {
    stopAll(); active = false; paused = false; hud.hidden = true; rb.hidden = true; undress();
    const td = TODAY ? today() : null;
    set(`<div class="hero" id="hero" aria-hidden="true"><div class="hv" id="hv"></div><span class="bolt" id="bolt">⚡</span></div><div class="cmd">${t('¡Al toque!')}</div>
      <div class="sub">${TODAY ? t('La corrida de hoy: la misma para todos, y cuenta la primera.') : t('{n} microjuegos seguidos, de 3 a 5 segundos cada uno. Lee la orden y hazlo… ¡al toque!', { n: RUN })}</div>
      ${SEED && !TODAY ? `<div class="sub best">${t('Corrida compartida · {c}: la misma para todos', { c: `<b class="num">${SEED}</b>` })}</div>` : ''}
      <div class="menu"><button class="btn btn--yellow" type="button" id="btn-jugar">▶ ${TODAY ? (td ? t('Jugarla de nuevo') : t('Jugar la de hoy')) : t('Jugar')}</button>
        ${TODAY ? '' : `<a class="btn btn--cyan btn--sm" id="btn-hoy" href="?today">📅 ${t('La corrida de hoy')}</a>`}</div>
      ${td ? `<div class="sub best">${t('Hoy hiciste {n} pts', { n: `<span class="num">${td.p}</span>` })}</div>` : bestPts ? `<div class="sub best">${t('Tu mejor corrida: {n} pts', { n: `<span class="num">${bestPts}</span>` })}</div>` : ''}
      <div class="sub credit">${t('Inspirado en {w}, de Nintendo.', { w: `<a href="https://${LANG}.wikipedia.org/wiki/WarioWare" target="_blank" rel="noopener" id="link-warioware">WarioWare</a>` })}</div>`);
    heroLoop();
    $id('rules-slot').innerHTML = rules(); $id('screen').prepend(coverLangToggle(() => location.reload()));
    $btn('btn-jugar', () => start(newRun()));
    footer('portada');
  }
  function end() {
    hud.hidden = true; rb.hidden = true;
    const sc = score(marks), k = total / (order.length * 3), isBest = sc.points > bestPts;
    if (isBest) { bestPts = sc.points; keep(BEST_PTS, bestPts); }
    if (total > best) { best = total; keep(BEST, best); }
    // Uno al día's way (lab only): the day's first run is the one that counts
    const first = TODAY && order.length === RUN && !today();
    if (first) keep(TODAY_KEY, JSON.stringify({ d: DATE, p: sc.points, s: score100(marks), m: marks }));
    const td = TODAY ? today() : null;
    trackFinish({ detalle: `${sc.points} pts · ${score100(marks)}/100 · ${total}/${MAX} stars · ${order.map((id, i) => `${id}:${marks[i]}`).join(' ')} · ${Math.round((Date.now() - startedAt) / 1000)}s · ${TODAY ? 'today' : SEED ? 'seed' : 'code'} ${code}` });
    if (k >= 0.45) { SFX.win(); if (!reduce) confetti(); }
    // C-19: the result, the main action and Share, the exits, then the detail game by game
    set(`<div class="cmd">${k >= 0.75 ? t('¡Al toque!') : k >= 0.45 ? t('¡Bien!') : t('¡Otra!')}</div>
      <div class="stars" style="color:var(--yellow)"><span class="num">${sc.points}</span> ${t('pts')}</div>
      <div class="sub best">${total} / ${order.length * 3} ★ · ${td && !first ? t('la de hoy que cuenta: {n} pts', { n: td.p }) : TODAY ? t('¡Esta es la que cuenta hoy!') : isBest ? t('¡Tu mejor corrida!') : t('tu mejor: {n} pts', { n: bestPts })}</div>
      <div class="menu"><button class="btn btn--yellow" type="button" id="btn-otra">🔁 ${SEED ? t('Jugarla de nuevo') : t('Otra corrida')}</button>
        <button class="btn btn--cyan btn--sm" type="button" id="btn-retar">📤 ${t('Reta a alguien con esta corrida')}</button><div id="exits"></div></div>
      <div class="runsum" data-tablero>${order.map((id, i) => `<span><b>${META.find(m => m.id === id).i}</b><i>${'★'.repeat(marks[i])}${'☆'.repeat(3 - marks[i])}</i><em class="num">${sc.games[i].points}${sc.games[i].streak ? '🔥' : ''}</em></span>`).join('')}</div>`);
    $id('exits').replaceWith(salidasFin('lab', { lang: LANG, raiz: '../../' }));
    $btn('btn-otra', () => start(newRun()));
    // The same run for whoever opens the link: its code (or today's), never the stars
    $btn('btn-retar', () => shareLink({ title: t('¡Al toque!'), text: t('Hice {n} pts en ¡Al toque! ⚡ ¿Me ganas con la misma corrida?', { n: sc.points }),
      url: `${location.origin}${location.pathname}?${TODAY ? 'today' : `seed=${code}`}` }));
  }
  function next() {
    screen.classList.remove('full');
    if (idx > 0) marks[idx - 1] = lastStars;
    if (idx >= order.length) { end(); return; }
    play();
  }
  // Play the game at idx: its speed and its own random stream come from where it sits in the run, so a game
  // started again after a pause is dealt the same and runs at the same speed
  function play() {
    sp = speedAt(idx); scored = false;
    hudN.textContent = `${idx + 1} / ${order.length}${sp > 1 ? ` · ×${sp.toFixed(1)}` : ''}`;
    curGame = order[idx]; rand = stream(code, `${idx}:${curGame}`); idx++;
    if (order.length > 1) runbar(); GAMES[curGame]();
  }
  function start(list) {
    stopAll(); active = false; paused = false; undress();
    total = 0; idx = 0; sp = 1; order = list; marks = []; lastStars = 0; startedAt = Date.now();
    hud.hidden = false; hudS.textContent = `0 ${t('pts')}`; $id('rules-slot').replaceChildren();
    trackStart({ game: GAME_ID, mode: 'solo', players: 1 });
    footer('juego');
    next();
  }
  // The phone locked, or another app came up: the timers would keep running, so the game stops and
  // waits. One not finished yet starts again (dealt the same) when the player taps Seguir
  let paused = false;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || hud.hidden || !idx || paused) return;
    paused = true; stopAll(); active = false; undress();
    if (!scored) idx--;
    set(`<div class="big" aria-hidden="true">⏸</div><div class="cmd">${t('Pausa')}</div><div class="sub">${scored ? t('Sigue con el próximo microjuego.') : t('Este microjuego parte de nuevo cuando sigas.')}</div>
      <div class="menu"><button class="btn btn--yellow" type="button" id="btn-seguir">▶ ${t('Seguir')}</button></div>`);
    $btn('btn-seguir', () => { paused = false; if (scored) next(); else play(); });
  });
  // Every run has a code: the link's seed, today's, or a new one, so it can be shared and played the same
  const newRun = () => { code = SEED || newCode(); return runOrder(META.map(m => m.id), code); };
  // For the end-to-end test: what the page is doing, and a way to play one game on its own
  window.__microgames = { get game() { return curGame; }, get order() { return order.slice(); }, get idx() { return idx; }, get total() { return total; }, get active() { return active; }, ids: META.map(m => m.id), seed: SEED,
    get code() { return code; }, get marks() { return marks.slice(); }, get paused() { return paused; }, only: id => { code = SEED || newCode(); start([id]); } };
  cover();
})();
