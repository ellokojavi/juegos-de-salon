import assert from 'node:assert/strict';
import { shareGrid, vidasGrid, MAX_ROWS } from './share-grid.js';

// Game emoji, stage numbers and times go; the squares stay (#215: the share never names the game)
assert.equal(shareGrid('reinas', '👑 ⏱ 1:23 ✅'), '✅');
assert.equal(shareGrid('tango', '☀️🌙❌💡✅'), '❌💡✅');
assert.equal(shareGrid('desenredo', '🧶 🟩🟩🟩'), '🟩🟩🟩');
assert.equal(shareGrid('rutas', '🟩 1: 4/4\n🟨 2: 7/5\n⬛ 3: —'), '🟩\n🟨\n⬛');
assert.equal(shareGrid('loteo', '✅ 5×5  ✅ 6×6  ⬛ 7×7\n💡 2'), '✅✅⬛\n💡');
assert.equal(shareGrid('letras', '⬛🟨⬛⬛⬛\n🟩🟩🟩🟩🟩'), '⬛🟨⬛⬛⬛\n🟩🟩🟩🟩🟩');
assert.equal(shareGrid('donde', '🎯🟩🟧'), '🎯🟩🟧');
assert.equal(shareGrid('numero', '🟢🟡⚪⚪\n🟢🟢🟢🟢'), '🟢🟡⚪⚪\n🟢🟢🟢🟢');
// A card that spoils the answer gives no grid
assert.equal(shareGrid('agentes', '🟩🟨⬜\n🟥💀⬜'), '');
assert.equal(shareGrid('conexiones', '🟨🟨🟨🟨'), '');
assert.equal(shareGrid('linea', ''), '');
assert.equal(shareGrid('x', Array(12).fill('🟩').join('\n')).split('\n').length, MAX_ROWS);
assert.equal(vidasGrid(4, 6), '🟩🟩🟩🟩🟥🟥');
assert.equal(vidasGrid(0, 6), '🟥🟥🟥🟥🟥🟥');
assert.equal(vidasGrid(9, 3), '🟩🟩🟩');
console.log('✓ share grid: neutral squares only, none for the games it would spoil');
