// Helper mínimo para manejar Chrome headless por CDP sin dependencias.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function launch({ port, dir, out, width = 390, height = 844 }) {
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--window-size=${width},${height + 60}`, '--hide-scrollbars', '--no-first-run', `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  process.on('exit', () => { try { chrome.kill(); } catch (_) {} });
  process.on('uncaughtException', e => { console.error(e); try { chrome.kill(); } catch (_) {} process.exit(1); });
  process.on('unhandledRejection', e => { console.error(e); try { chrome.kill(); } catch (_) {} process.exit(1); });
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://localhost:${port}/json`)).json(); break; } catch { await sleep(500); } }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(); const errors = []; const logs = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) logs.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
  const api = {
    errors, logs,
    evaluate: async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text + ' ' + (r.result.exceptionDetails.exception?.description || '')); return r.result?.result?.value; },
    go: async (url, wait = 1800) => { await send('Page.navigate', { url }); await sleep(wait); },
    shot: async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64')); },
    close: () => { ws.close(); chrome.kill(); },
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
