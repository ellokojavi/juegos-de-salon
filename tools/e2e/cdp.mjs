// Helper mínimo para manejar Chrome headless por CDP sin dependencias.
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { medirAire, sinAire, AIRE_MIN } from './aire-comun.mjs';
// CHROME: otra ruta al navegador (Linux, una sesión en la nube)
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Los puertos de Chrome los elige el sistema (D-213): nadie los escoge a mano. Chrome abre con
 * `--remote-debugging-port=0`, toma uno libre y lo escribe en `<dir>/DevToolsActivePort`, que
 * `launch` lee. Sin carrera entre sesiones: el puerto lo reserva Chrome mismo, no un tanteo previo.
 * El `port` que pasa cada guion queda solo como nombre de su Chrome y ya no se usa.
 *
 * Con PUERTO_CDP, como antes (D-135): el primer puerto distinto que pide un guion pasa a ser
 * PUERTO_CDP, el segundo PUERTO_CDP + 1, y así; pedir de nuevo el mismo puerto da el mismo.
 * Se lee al lanzar, para que un guion pueda fijarlo antes (`mirar.mjs --cdp`).
 */
const asignados = new Map();
const puertoFijo = port => {
  const base = Number(process.env.PUERTO_CDP) || 0;
  if (!base) return 0;
  if (!asignados.has(port)) asignados.set(port, base + asignados.size);
  return asignados.get(port);
};

/**
 * Cada Chrome muere con su guion, termine como termine (bien, con error, con Ctrl-C o con un
 * `kill`): así no quedan Chromes zombis y nadie necesita `pkill`. Solo un SIGKILL al guion se
 * salta esto; ahí el Chrome se busca por su perfil (README).
 */
const vivos = new Set();
const matarTodos = () => { for (const c of vivos) { try { c.kill('SIGKILL'); } catch (_) {} } vivos.clear(); };
process.on('exit', matarTodos);
for (const [senal, codigo] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(senal, () => { matarTodos(); process.exit(codigo); });
}
process.on('uncaughtException', e => { console.error(e); matarTodos(); process.exit(1); });
process.on('unhandledRejection', e => { console.error(e); matarTodos(); process.exit(1); });

/** El puerto que Chrome escribió en su perfil, o 0 mientras no lo escribe. */
const puertoEscrito = dir => {
  try { const n = Number(readFileSync(`${dir}/DevToolsActivePort`, 'utf8').split('\n')[0]); return n > 0 ? n : 0; } catch { return 0; }
};

export async function launch({ port: pedido, dir, out, width = 390, height = 844 }) {
  const fijo = puertoFijo(pedido);
  mkdirSync(dir, { recursive: true });
  // El de una corrida anterior con el mismo perfil diría un puerto que ya no es
  rmSync(`${dir}/DevToolsActivePort`, { force: true });
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${fijo}`, `--window-size=${width},${height + 60}`, '--hide-scrollbars', '--no-first-run', `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  vivos.add(chrome);
  let salio = false;
  chrome.on('exit', () => { salio = true; vivos.delete(chrome); });
  let port = fijo;
  let targets;
  // Hasta 60 s: el primer Chrome de una máquina recién encendida (un runner de GitHub, D-193) tarda
  // más de 20 en abrir su puerto, y esperar de más no cuesta nada cuando abre rápido
  for (let i = 0; i < 120 && !salio; i++) {
    if (!port) port = puertoEscrito(dir);
    if (port) { try { targets = await (await fetch(`http://localhost:${port}/json`)).json(); break; } catch {} }
    await sleep(500);
  }
  if (!targets) {
    try { chrome.kill('SIGKILL'); } catch (_) {}
    throw new Error(salio
      ? `Chrome se cerró al abrir (CHROME=${CHROME}). ¿Otro Chrome sigue usando el perfil ${dir}?`
      : `Chrome no abrió ${port ? `el puerto ${port}` : 'su puerto'} en 60 s (CHROME=${CHROME})`);
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(); const errors = []; const logs = [];
  let cargas = 0; const alCargar = new Set(); // Page.loadEventFired: cuántas van, y quién espera la próxima
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') { cargas++; for (const r of alCargar) r(); alCargar.clear(); }
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
  const api = {
    errors, logs,
    port, // el puerto de Chrome que se usó de verdad (el que eligió el sistema, o el de PUERTO_CDP)
    dir,
    send, // CDP crudo, para lo que no tiene helper (por ejemplo cortarle la red a Firebase)
    evaluate: async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text + ' ' + (r.result.exceptionDetails.exception?.description || '')); return r.result?.result?.value; },
    go: async (url, wait = 1800) => { await send('Page.navigate', { url }); await sleep(wait); },
    /**
     * Como `go`, pero sin pausa fija: espera el `load` de la página nueva y que se asiente
     * (`asentar`). `tope` es lo que esperaba `go` antes: nunca tarda más que eso, y casi siempre
     * mucho menos. Pensado para los guiones que abren muchas páginas (los de idiomas, D-307).
     */
    abrir: async (url, tope = 1500) => {
      const t0 = Date.now();
      const cargo = new Promise(r => alCargar.add(r));
      await send('Page.navigate', { url });
      await Promise.race([cargo, sleep(tope)]);
      await api.asentar(Math.max(0, tope - (Date.now() - t0)));
    },
    /** Espera hasta que `expr` (en la página) dé algo verdadero, mirando cada `cada` ms; `tope` como máximo. Devuelve si se cumplió. */
    hasta: async (expr, tope = 3000, cada = 100) => {
      const t0 = Date.now();
      for (;;) {
        try { if (await api.evaluate(`!!(${expr})`)) return true; } catch (_) { /* a mitad de una navegación */ }
        if (Date.now() - t0 >= tope) return false;
        await sleep(cada);
      }
    },
    /**
     * Espera a que la pantalla deje de cambiar: ninguna mutación del DOM durante `calma` ms (las
     * animaciones infinitas no mutan el DOM) y las animaciones finitas terminadas, con `tope` como
     * máximo. Reemplaza las pausas fijas entre paso y paso: si la pantalla ya está quieta, sigue al
     * tiro; si algo llega tarde (un temporizador, una carga), lo espera, hasta el tope.
     */
    asentar: async (tope = 700, calma = 150) => {
      if (tope <= 0) return;
      const t0 = Date.now();
      try {
        await api.evaluate(`new Promise(listo => {
          let reloj; const fin = () => { obs.disconnect(); clearTimeout(reloj); clearTimeout(tope); listo(1); };
          const obs = new MutationObserver(() => { clearTimeout(reloj); reloj = setTimeout(fin, ${calma}); });
          obs.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
          reloj = setTimeout(fin, ${calma});
          const tope = setTimeout(fin, ${tope});
        })`);
      } catch (_) { /* la página se fue a mitad (una navegación): lo que queda, de pausa */ await sleep(Math.max(0, tope - (Date.now() - t0))); return; }
      await api.quieto(Math.max(0, Math.min(900, tope - (Date.now() - t0))));
    },
    // Antes de disparar, esperar a que las animaciones de entrada se queden quietas: una
    // captura sacada a mitad de un `pop` congela las filas a distintas escalas y en el README
    // se ven desalineadas, como si el CSS estuviera malo (D-76). Las animaciones infinitas
    // (burbujas, wiggle, shimmer) no se esperan nunca: no terminan. El tope es corto a propósito:
    // varias pantallas se pasan solas a los 1,8 s, y una espera larga cambiaría la toma.
    quieto: async (tope = 900) => api.evaluate(`(async()=>{
      const finitas = () => document.getAnimations().filter(a => {
        const t = a.effect && a.effect.getComputedTiming();
        return a.playState === 'running' && t && t.iterations !== Infinity;
      });
      await Promise.race([
        Promise.all(finitas().map(a => a.finished.catch(() => {}))),
        new Promise(r => setTimeout(r, ${tope})),
      ]);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return 1;
    })()`),
    shot: async name => {
      await api.quieto();
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64'));
      // Cada captura revisa el aire entre el tablero y sus botones (D-309, U-11): así lo vigilan
      // todos los guiones, en todas las pantallas que fotografían, sin caminos aparte
      try {
        const filas = JSON.parse(await api.evaluate(medirAire));
        if (process.env.AIRE_INFORMAR && filas.length) console.log(`  aire ${name}: ${filas.map(f => `${f.tablero} ${f.aire}px`).join(', ')}`);
        const malos = sinAire(filas);
        if (malos.length) console.log(`✗ ${name}: botón sin aire bajo el tablero (U-11, ${AIRE_MIN} px o más): ${malos.join(', ')}`);
      } catch (_) { /* una página sin la app (about:blank) no tiene tableros */ }
    },
    close: () => { ws.close(); chrome.kill(); },
    /**
     * Entrada de verdad, por el navegador y no por `.click()`.
     *
     * Existe por un error que ningún `.click()` podía ver (D-90): tomar el puntero al apoyar
     * el dedo le cambia el destino al `click` que Chrome fabrica después, y tocar un barco
     * dejó de seleccionarlo. Un `elemento.click()` se salta esa cocina entera y pasaba en verde.
     *
     * `toque(x, y)` y `arrastre(x0, y0, x1, y1)` van en píxeles de la página (los de
     * `getBoundingClientRect`), que es como los mide el guion.
     */
    toque: async (x, y) => {
      const p = { x, y, button: 'left', clickCount: 1, buttons: 1, pointerType: 'mouse' };
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...p });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...p, buttons: 0 });
      await sleep(120);
    },
    arrastre: async (x0, y0, x1, y1, pasos = 6) => {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', clickCount: 1, buttons: 1 });
      for (let i = 1; i <= pasos; i++) {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x0 + (x1 - x0) * i / pasos), y: Math.round(y0 + (y1 - y0) * i / pasos), button: 'left', buttons: 1 });
        await sleep(25);
      }
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', clickCount: 1, buttons: 0 });
      await sleep(180);
    },
  };
  // helpers del juego Toque y Fama
  api.press = d => api.evaluate(`(()=>{const b=[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent==='${d}');if(!b||b.disabled)return 'no';b.click();return 'ok'})()`);
  api.typeNum = async n => { for (const d of n) { const r = await api.press(d); if (r !== 'ok') return 'fail ' + d; } return api.evaluate(`(()=>{const b=document.querySelector('.screen.active .keypad .ok');if(!b)return 'no-ok';if(b.disabled)return 'ok-disabled';b.click();return 'ok'})()`); };
  api.active = () => api.evaluate(`document.querySelector('.screen.active').id`);
  api.view = () => api.evaluate(`JSON.stringify(window.__tyf ? window.__tyf.view() : null)`).then(JSON.parse);
  api.handoff = async () => { await api.evaluate(`document.getElementById('handoff').click(); 1`); await sleep(150); await api.evaluate(`document.querySelector('#handoff .btn')?.click(); 1`); await sleep(400); };
  api.cover = async () => { await api.evaluate(`document.querySelector('#cover .btn')?.click(); 1`); await sleep(200); };
  api.hasPad = () => api.evaluate(`!!document.querySelector('.screen.active #play-entry .keypad')`);
  return api;
}
