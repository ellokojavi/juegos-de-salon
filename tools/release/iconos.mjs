#!/usr/bin/env node
/**
 * Los íconos PNG de la app instalable (D-220), dibujados con Chrome desde public/assets/icon.svg.
 *
 *   node tools/release/iconos.mjs            # rehace public/assets/icons/*.png
 *
 * El SVG solo no alcanza: Android no ofrece instalar sin un PNG de 192 y otro de 512, y el iPhone
 * usa el `apple-touch-icon` (180, cuadrado y sin transparencia: el iPhone le redondea las esquinas
 * solo). El `maskable` es el que Android recorta en círculo o en gota: el dado va al centro, dentro
 * de la zona segura (el 80 % del medio), y el fondo llega hasta el borde.
 *
 * El dado es un emoji, así que se dibuja con la fuente de emojis de quien corre esto (Noto en
 * Linux, Apple en macOS). Los PNG se commitean: GitHub no los rehace.
 */
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = join(RAIZ, 'public/assets/icons');

/** El fondo del ícono, el mismo degradado que icon.svg. */
const svg = readFileSync(join(RAIZ, 'public/assets/icon.svg'), 'utf8');
const degradado = svg.match(/<defs>[\s\S]*<\/defs>/)[0];
const dado = svg.match(/<text[^>]*>([^<]*)<\/text>/)[1];

/** `redondo`: con las esquinas del SVG (transparentes). `escala`: el tamaño del dado. */
const dibujo = ({ lado, redondo, escala }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${lado / 2}" height="${lado / 2}" style="display:block">
  ${degradado}
  <rect width="128" height="128" rx="${redondo ? 28 : 0}" fill="url(#g)"/>
  <text x="64" y="${64 + 22 * escala}" font-size="${64 * escala}" text-anchor="middle">${dado}</text>
</svg>`;

export const ICONOS = [
  { archivo: 'icon-192.png', lado: 192, redondo: true, escala: 1 },
  { archivo: 'icon-512.png', lado: 512, redondo: true, escala: 1 },
  { archivo: 'maskable-512.png', lado: 512, redondo: false, escala: 0.78 },
  { archivo: 'apple-touch-icon.png', lado: 180, redondo: false, escala: 0.92 },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const { launch } = await import('../e2e/cdp.mjs');
  mkdirSync(SALIDA, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'iconos-'));
  for (const i of ICONOS) {
    // deviceScaleFactor 2 (cdp.mjs): el dibujo mide la mitad del PNG en píxeles de la página
    const b = await launch({ port: 0, dir: join(tmp, i.archivo), out: tmp, width: i.lado / 2, height: i.lado / 2 });
    await b.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent;overflow:hidden}</style>${dibujo(i)}`;
    await b.go(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`, 800);
    const r = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: i.lado / 2, height: i.lado / 2, scale: 1 } });
    writeFileSync(join(SALIDA, i.archivo), Buffer.from(r.result.data, 'base64'));
    b.close();
    console.log(`✓ ${i.archivo} (${i.lado}×${i.lado})`);
  }
  process.exit(0);
}
