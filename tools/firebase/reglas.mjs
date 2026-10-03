#!/usr/bin/env node
/**
 * Publica las reglas de Realtime Database sin pasar por la consola (D-122).
 *
 *   node tools/reglas.mjs revisar     # ¿las reglas publicadas son las del repo?
 *   node tools/reglas.mjs publicar    # sube firebase/database.rules.json y verifica que quedó
 *
 * Entra como administrador con la llave de la cuenta de servicio (ver tools/firebase-admin.mjs)
 * y escribe `<databaseURL>/.settings/rules.json`, que es lo mismo que el botón Publicar de la consola.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { token, salir } from './firebase-admin.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGLAS = join(RAIZ, 'firebase/database.rules.json');

const url = t => `${firebaseConfig.databaseURL}/.settings/rules.json?access_token=${encodeURIComponent(t)}`;
const normal = texto => JSON.stringify(JSON.parse(texto));

async function publicadas(t) {
  const res = await fetch(url(t));
  const texto = await res.text();
  if (!res.ok) salir(`No se pudieron leer las reglas publicadas (HTTP ${res.status}): ${texto.slice(0, 200)}`);
  return texto;
}

const accion = process.argv[2];
if (!['revisar', 'publicar'].includes(accion)) salir('Uso: node tools/reglas.mjs revisar | publicar', 2);

const locales = readFileSync(REGLAS, 'utf8');
normal(locales); // que el archivo del repo sea JSON válido antes de tocar nada
const t = await token();
const antes = await publicadas(t);
const iguales = normal(antes) === normal(locales);

if (accion === 'revisar') {
  console.log(iguales ? '✓ Las reglas publicadas son las del repo.' : '✗ Las reglas publicadas NO son las del repo: falta publicar (node tools/reglas.mjs publicar).');
  process.exit(iguales ? 0 : 1);
}

if (iguales) { console.log('✓ Ya estaban publicadas: no hay nada que subir.'); process.exit(0); }
const res = await fetch(url(t), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: locales });
if (!res.ok) salir(`Firebase rechazó las reglas (HTTP ${res.status}): ${(await res.text()).slice(0, 500)}`);
const despues = await publicadas(t);
if (normal(despues) !== normal(locales)) salir('Se subieron, pero al leerlas de vuelta no coinciden con las del repo. Revisa la consola.');
console.log(`✓ Reglas publicadas y verificadas (${firebaseConfig.projectId}).`);
