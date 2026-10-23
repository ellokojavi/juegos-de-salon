// The back-swipe guard (D-432) against a fake history: arming adds one entry, a back swipe puts it
// back and asks, Stay keeps the page, Leave goes two back, and finishing removes the entry.
import assert from 'node:assert/strict';
import { createBackGuard } from './back-guard.js';

function fakeWindow() {
  const entries = [{ state: null, url: '/before/' }, { state: null, url: '/hangman/' }];
  let i = 1;
  const listeners = new Set();
  const pop = () => { for (const f of [...listeners]) f({ state: entries[i].state }); };
  const win = {
    location: { get href() { return entries[i].url; } },
    history: {
      get state() { return entries[i].state; },
      get length() { return entries.length; },
      pushState(state, _t, url) { entries.splice(i + 1); entries.push({ state, url }); i++; },
      back() { if (i > 0) { i--; pop(); } },
      go(n) { const j = Math.max(0, Math.min(entries.length - 1, i + n)); if (j !== i) { i = j; pop(); } },
    },
    addEventListener: (t, f) => t === 'popstate' && listeners.add(f),
    removeEventListener: (t, f) => t === 'popstate' && listeners.delete(f),
  };
  return { win, entries, at: () => entries[i].url, index: () => i, swipeBack: () => win.history.back() };
}
const tick = () => new Promise(r => setTimeout(r, 0));

// Without the lab key it does nothing
{
  const f = fakeWindow();
  const g = createBackGuard({ win: f.win, ask: () => true, allowed: async () => false });
  await g.arm();
  assert.equal(g.armed, false);
  assert.equal(f.entries.length, 2, 'no entry without the lab key');
}

// A back swipe mid-game asks; Stay keeps the game, and a second swipe asks again
{
  const f = fakeWindow();
  let asked = 0;
  const g = createBackGuard({ win: f.win, ask: async () => { asked++; return false; }, allowed: async () => true });
  await g.arm();
  assert.equal(f.entries.length, 3, 'arming adds one entry');
  await g.arm();
  assert.equal(f.entries.length, 3, 'arming twice adds it once');
  f.swipeBack();
  await tick();
  assert.equal(asked, 1, 'the swipe asks');
  assert.equal(f.at(), '/hangman/', 'and stays in the game');
  assert.equal(f.entries.length, 3, 'with the entry back in place');
  f.swipeBack();
  await tick();
  assert.equal(asked, 2, 'a second swipe asks again');
  assert.equal(f.at(), '/hangman/');
}

// Leave goes to the page before the game
{
  const f = fakeWindow();
  const g = createBackGuard({ win: f.win, ask: async () => true, allowed: async () => true });
  await g.arm();
  f.swipeBack();
  await tick();
  assert.equal(f.at(), '/before/', 'Leave goes back to the page before the game');
  assert.equal(g.armed, false);
}

// Finishing the game takes the entry away: Back works as on any page
{
  const f = fakeWindow();
  let asked = 0;
  const g = createBackGuard({ win: f.win, ask: async () => { asked++; return false; }, allowed: async () => true });
  await g.arm();
  g.disarm();
  assert.equal(f.index(), 1, 'disarming removes the entry');
  assert.equal(asked, 0, 'without asking');
  f.swipeBack();
  await tick();
  assert.equal(f.at(), '/before/', 'after the game, Back leaves');
  assert.equal(asked, 0);
  g.disarm();
  assert.equal(f.at(), '/before/', 'disarming twice does nothing');
}

console.log('✓ back guard: arms once, asks on a back swipe, Stay stays, Leave leaves, finishing disarms');
