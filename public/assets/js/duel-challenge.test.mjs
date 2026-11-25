// The duels' «you've been challenged» screen (duel-challenge.js): which duel it announces, once each, and its switch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dueChallenge, alertsOn, setAlerts } from './duel-challenge.js';

const H = 3600000, now = Date.now();
const duel = (id, a, b, horas, r = {}) => ({ id, a, b, an: a.toUpperCase(), bn: b.toUpperCase(), f: 'bo3', g: 'reinas', at: now - horas * H, r });

test('a new duel someone else started is announced, the newest first', () => {
  const lista = [duel('d1', 'ana', 'yo', 5), duel('d2', 'beto', 'yo', 1), duel('d3', 'yo', 'caro', 0.5)];
  assert.equal(dueChallenge(lista, 'yo')?.id, 'd2');
});

test('never one I started, one already announced, one I have played or one that ended', () => {
  assert.equal(dueChallenge([duel('d3', 'yo', 'caro', 1)], 'yo'), null);
  assert.equal(dueChallenge([duel('d2', 'beto', 'yo', 1)], 'yo', { d2: 1 }), null);
  assert.equal(dueChallenge([duel('d4', 'beto', 'yo', 1, { yo: { 0: { s: 80, ms: 50000, at: now } } })], 'yo'), null);
  assert.equal(dueChallenge([duel('d5', 'beto', 'yo', 24 * 30)], 'yo'), null);
});

test('the profile switch turns it off and on', () => {
  const m = new Map(); const store = { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) };
  assert.equal(alertsOn(store), true);
  setAlerts(false, store); assert.equal(alertsOn(store), false);
  setAlerts(true, store); assert.equal(alertsOn(store), true);
});
