// Chrome sin ventana para el video: Playwright donde esté instalado.
// PLAYWRIGHT=<ruta a playwright/index.mjs> y CHROME=<ejecutable> lo fijan a mano (en la nube:
// /opt/node-tools/node_modules/playwright/index.mjs y /opt/pw-browsers/chromium).
import fs from 'node:fs';

const candidatos = [process.env.PLAYWRIGHT, '/opt/node-tools/node_modules/playwright/index.mjs', 'playwright'].filter(Boolean);
let chromium = null;
for (const c of candidatos) {
  if (c.startsWith('/') && !fs.existsSync(c)) continue;
  try { ({ chromium } = await import(c)); break; } catch (_) { /* el siguiente */ }
}
if (!chromium) {
  console.error('Falta Playwright: `npm i -g playwright` (o PLAYWRIGHT=<ruta a playwright/index.mjs>).');
  process.exit(1);
}
const ejecutable = process.env.CHROME || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/** Abre Chrome. Como root (en la nube) necesita --no-sandbox. */
export const abrir = () => chromium.launch({ executablePath: ejecutable, args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] });
/** El sitio servido en local (C: «python3 -m http.server 8765» desde la raíz del repo). */
export const SITIO = process.env.SITIO || 'http://localhost:8765';
