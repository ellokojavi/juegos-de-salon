// Run: node public/assets/js/on-screen.test.mjs
// A cover's loop asks for frames only while it is on the screen (#883 §2.8).
import assert from 'node:assert/strict';
import { onScreen } from './on-screen.js';

function montaje() {
  const pedidos = [];
  let avisar = null;
  class IO { constructor(f) { avisar = v => f([{ isIntersecting: v }]); } observe() {} }
  const raf = f => pedidos.push(f);
  return { pedidos, raf, IO, ver: v => avisar(v) };
}

{ // On screen it keeps asking, every frame, as requestAnimationFrame did
  const m = montaje();
  let cuadros = 0;
  const paso = () => { cuadros++; otro(); };
  const otro = onScreen({}, paso, m);
  m.ver(true);
  otro();
  for (let k = 0; k < 5; k++) m.pedidos.shift()();
  assert.equal(cuadros, 5);
  assert.equal(m.pedidos.length, 1);
}

{ // Off screen it stops asking, and comes back by itself when seen again
  const m = montaje();
  let cuadros = 0;
  const paso = () => { cuadros++; otro(); };
  const otro = onScreen({}, paso, m);
  otro();
  m.pedidos.shift()();
  m.ver(false);
  m.pedidos.shift()();
  assert.equal(m.pedidos.length, 0, 'asleep: no more frames');
  m.ver(false);
  assert.equal(m.pedidos.length, 0);
  m.ver(true);
  assert.equal(m.pedidos.length, 1, 'awake: one frame, not two loops');
  m.ver(true);
  assert.equal(m.pedidos.length, 1);
  assert.equal(cuadros, 2);
}

{ // Without IntersectionObserver it runs as before
  const pedidos = [];
  const paso = () => otro();
  const otro = onScreen({}, paso, { raf: f => pedidos.push(f), IO: undefined });
  otro();
  pedidos.shift()();
  assert.equal(pedidos.length, 1);
}

console.log('on-screen: ok');
