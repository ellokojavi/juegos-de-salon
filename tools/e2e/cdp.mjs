// Minimal helper to drive headless Chrome over CDP, with no dependencies.
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { measureSpacing, lacksSpacing, MIN_SPACING } from './spacing-common.mjs';
import { measureOverlap } from './spacing-common.mjs';
import { isFolder as isFolder } from './output.mjs';
// CHROME: another path to the browser (Linux, a cloud session)
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Chrome's ports are chosen by the system (D-213): nobody picks them by hand. Chrome opens with
 * `--remote-debugging-port=0`, takes a free one and writes it to `<dir>/DevToolsActivePort`, which
 * `launch` reads. No race between sessions: Chrome itself reserves the port, not a probe beforehand.
 * The `port` each script passes is only the name of its Chrome and is no longer used.
 *
 * With CDP_PORT, as before (D-135): the first distinct port a script asks for becomes CDP_PORT,
 * the second CDP_PORT + 1, and so on; asking for the same port again gives the same one. It is
 * read at launch, so a script can set it first (`look.mjs --cdp`). PUERTO_CDP, its old name,
 * still works (D-316).
 */
const assigned = new Map();
const fixedPort = port => {
  const base = Number(process.env.CDP_PORT || process.env.PUERTO_CDP) || 0;
  if (!base) return 0;
  if (!assigned.has(port)) assigned.set(port, base + assigned.size);
  return assigned.get(port);
};

/**
 * Each Chrome dies with its script, however it ends (fine, with an error, with Ctrl-C or with a
 * `kill`): so no zombie Chromes are left and nobody needs `pkill`. Only a SIGKILL to the script
 * skips this; then the Chrome is found by its profile (README).
 */
const alive = new Set();
const killAll = () => { for (const c of alive) { try { c.kill('SIGKILL'); } catch (_) {} } alive.clear(); };
process.on('exit', killAll);
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(signal, () => { killAll(); process.exit(code); });
}
process.on('uncaughtException', e => { console.error(e); killAll(); process.exit(1); });
process.on('unhandledRejection', e => { console.error(e); killAll(); process.exit(1); });

/** The port Chrome wrote in its profile, or 0 while it hasn't written it. */
const writtenPort = dir => {
  try { const n = Number(readFileSync(`${dir}/DevToolsActivePort`, 'utf8').split('\n')[0]); return n > 0 ? n : 0; } catch { return 0; }
};

export async function launch({ port: requested, dir, out, width = 390, height = 844 }) {
  // A profile in `undefined/p` or `--part/p` stayed inside the worktree and blocked its cleanup (D-315)
  for (const [k, v] of [['dir', dir], ['out', out]]) if (v != null && !isFolder(String(v))) throw new Error(`launch: ${k} = "${v}" is not an output folder (use output() from tools/e2e/output.mjs)`);
  const fixed = fixedPort(requested);
  mkdirSync(dir, { recursive: true });
  // The one from an earlier run with the same profile would name a port that is gone
  rmSync(`${dir}/DevToolsActivePort`, { force: true });
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${fixed}`, `--window-size=${width},${height + 60}`, '--hide-scrollbars', '--no-first-run', `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  alive.add(chrome);
  let exited = false;
  chrome.on('exit', () => { exited = true; alive.delete(chrome); });
  let port = fixed;
  let targets;
  // Up to 60 s: the first Chrome on a freshly booted machine (a GitHub runner, D-193) takes more
  // than 20 to open its port, and waiting longer costs nothing when it opens fast
  for (let i = 0; i < 120 && !exited; i++) {
    if (!port) port = writtenPort(dir);
    if (port) { try { targets = await (await fetch(`http://localhost:${port}/json`)).json(); break; } catch {} }
    await sleep(500);
  }
  if (!targets) {
    try { chrome.kill('SIGKILL'); } catch (_) {}
    throw new Error(exited
      ? `Chrome closed while opening (CHROME=${CHROME}). Is another Chrome still using the profile ${dir}?`
      : `Chrome didn't open ${port ? `port ${port}` : 'its port'} in 60 s (CHROME=${CHROME})`);
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(); const errors = []; const logs = [];
  let loads = 0; const onLoad = new Set(); // Page.loadEventFired: how many so far, and who waits for the next one
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') { loads++; for (const r of onLoad) r(); onLoad.clear(); }
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
  const api = {
    errors, logs,
    port, // the Chrome port actually used (the one the system chose, or CDP_PORT's)
    dir,
    send, // raw CDP, for what has no helper (for example cutting Firebase off the network)
    evaluate: async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text + ' ' + (r.result.exceptionDetails.exception?.description || '')); return r.result?.result?.value; },
    go: async (url, wait = 1800) => { await send('Page.navigate', { url }); await sleep(wait); },
    /**
     * Like `go`, but without a fixed pause: waits for the new page's `load` and for it to settle
     * (`settle`). `cap` is what `go` used to wait: it never takes longer than that, and almost
     * always much less. Meant for the scripts that open many pages (the language ones, D-307).
     */
    open: async (url, cap = 1500) => {
      const t0 = Date.now();
      const loaded = new Promise(r => onLoad.add(r));
      await send('Page.navigate', { url });
      await Promise.race([loaded, sleep(cap)]);
      await api.settle(Math.max(0, cap - (Date.now() - t0)));
    },
    /** Waits until `expr` (in the page) is truthy, checking every `every` ms; `cap` at most. Returns whether it happened. */
    until: async (expr, cap = 3000, every = 100) => {
      const t0 = Date.now();
      for (;;) {
        try { if (await api.evaluate(`!!(${expr})`)) return true; } catch (_) { /* in the middle of a navigation */ }
        if (Date.now() - t0 >= cap) return false;
        await sleep(every);
      }
    },
    /**
     * Waits for the screen to stop changing: no DOM mutation for `calm` ms (infinite animations
     * don't mutate the DOM) and finite animations finished, with `cap` at most. Replaces the fixed
     * pauses between steps: if the screen is already still, it moves on right away; if something
     * arrives late (a timer, a load), it waits for it, up to the cap.
     */
    settle: async (cap = 700, calm = 150) => {
      if (cap <= 0) return;
      const t0 = Date.now();
      try {
        await api.evaluate(`new Promise(done => {
          let timer; const end = () => { obs.disconnect(); clearTimeout(timer); clearTimeout(cap); done(1); };
          const obs = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(end, ${calm}); });
          obs.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
          timer = setTimeout(end, ${calm});
          const cap = setTimeout(end, ${cap});
        })`);
      } catch (_) { /* the page went away midway (a navigation): what's left, as a pause */ await sleep(Math.max(0, cap - (Date.now() - t0))); return; }
      await api.still(Math.max(0, Math.min(900, cap - (Date.now() - t0))));
    },
    // Before shooting, wait for the entrance animations to stand still: a screenshot taken in the
    // middle of a `pop` freezes the rows at different scales and in the README they look
    // misaligned, as if the CSS were wrong (D-76). Infinite animations (bubbles, wiggle, shimmer)
    // are never waited for: they don't end. The cap is short on purpose: several screens move on
    // by themselves at 1.8 s, and a long wait would change the shot.
    still: async (cap = 900) => api.evaluate(`(async()=>{
      const finite = () => document.getAnimations().filter(a => {
        const t = a.effect && a.effect.getComputedTiming();
        return a.playState === 'running' && t && t.iterations !== Infinity;
      });
      await Promise.race([
        Promise.all(finite().map(a => a.finished.catch(() => {}))),
        new Promise(r => setTimeout(r, ${cap})),
      ]);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return 1;
    })()`),
    shot: async name => {
      await api.still();
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64'));
      // Every screenshot checks the space between the board and its buttons (D-309, U-11): that
      // way every script watches it, on every screen it photographs, without separate paths
      try {
        const rows = JSON.parse(await api.evaluate(measureSpacing));
        if ((process.env.SPACING_REPORT || process.env.AIRE_INFORMAR) && rows.length) console.log(`  spacing ${name}: ${rows.map(f => `${f.board} ${f.spacing}px`).join(', ')}`);
        const bad = lacksSpacing(rows);
        if (bad.length) console.log(`✗ ${name}: button without space below the board (U-11, ${MIN_SPACING} px or more): ${bad.join(', ')}`);
      } catch (_) { /* a page without the app (about:blank) has no boards */ }
      // And that no two buttons cover each other (U-12, D-520)
      try {
        // Measured twice, 600 ms apart: a sheet still sliding in is not an overlap, one that stays is
        const first = JSON.parse(await api.evaluate(measureOverlap));
        let pairs = [];
        if (first.length) {
          await sleep(600);
          const who = p => p.replace(/ \(\d+×\d+ px\)$/, '');
          const again = new Set(JSON.parse(await api.evaluate(measureOverlap)).map(who));
          pairs = first.filter(p => again.has(who(p)));
        }
        if (pairs.length) console.log(`✗ ${name}: buttons on top of each other (U-12): ${pairs.join(', ')}`);
      } catch (_) { /* no page */ }
    },
    close: () => { ws.close(); chrome.kill(); },
    /**
     * Real input, through the browser and not through `.click()`.
     *
     * It exists because of a bug no `.click()` could see (D-90): capturing the pointer when the
     * finger touches down changes the target of the `click` Chrome builds afterwards, and tapping
     * a ship stopped selecting it. An `element.click()` skips that whole kitchen and passed green.
     *
     * `tap(x, y)` (tap) and `drag(x0, y0, x1, y1)` (drag) take page pixels (those of
     * `getBoundingClientRect`), which is how the script measures them.
     */
    tap: async (x, y) => {
      const p = { x, y, button: 'left', clickCount: 1, buttons: 1, pointerType: 'mouse' };
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...p });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...p, buttons: 0 });
      await sleep(120);
    },
    drag: async (x0, y0, x1, y1, steps = 6) => {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
      for (let i = 1; i <= steps; i++) {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x0 + (x1 - x0) * i / steps), y: Math.round(y0 + (y1 - y0) * i / steps), button: 'left', buttons: 1 });
        await sleep(25);
      }
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', clickCount: 1, buttons: 0 });
      await sleep(180);
    },
  };
  // Helpers for Toque y Fama (bulls and cows)
  api.press = d => api.evaluate(`(()=>{const b=[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent==='${d}');if(!b||b.disabled)return 'no';b.click();return 'ok'})()`);
  api.typeNum = async n => { for (const d of n) { const r = await api.press(d); if (r !== 'ok') return 'fail ' + d; } return api.evaluate(`(()=>{const b=document.querySelector('.screen.active .keypad .ok');if(!b)return 'no-ok';if(b.disabled)return 'ok-disabled';b.click();return 'ok'})()`); };
  api.active = () => api.evaluate(`document.querySelector('.screen.active').id`);
  api.view = () => api.evaluate(`JSON.stringify(window.__tyf ? window.__tyf.view() : null)`).then(JSON.parse);
  api.handoff = async () => { await api.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(150); await api.evaluate(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(400); };
  api.cover = async () => { await api.evaluate(`document.querySelector('#cover .btn')?.click(); 1`); await sleep(200); };
  api.hasPad = () => api.evaluate(`!!document.querySelector('.screen.active #play-entry .keypad')`);
  return api;
}
