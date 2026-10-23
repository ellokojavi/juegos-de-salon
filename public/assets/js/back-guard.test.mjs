// The back-swipe guard (D-432) against a fake history: arming adds one entry, a back swipe puts it
// back and asks, Stay keeps the page, Leave goes two back, and finishing removes the entry. «‹ Menú»
// mid-game asks the same, and Leave follows its link.
import assert from 'node:assert/strict';
import { createBackGuard } from './back-guard.js';

function fakeWindow() {
  const entries = [{ state: null, url: '/before/' }, { state: null, url: '/hangman/' }];
  let i = 1;
  const listeners = new Set(), clicks = new Set();
  const assigned = [];
  const pop = () => { for (const f of [...listeners]) f({ state: entries[i].state }); };
  const win = {
    location: { get href() { return entries[i].url; }, assign: url => assigned.push(url) },
    document: { addEventListener: (t, f) => t === 'click' && clicks.add(f), removeEventListener: (t, f) => t === 'click' && clicks.delete(f) },
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
  // A tap on «‹ Menú»: the event the document sees, and whether a listener stopped the link
  const tapMenu = (opts = {}) => {
    const a = { href: '/' };
    const ev = { target: { closest: sel => (sel === 'a.back' ? a : null) }, button: 0, defaultPrevented: !!opts.prevented, preventDefault() { this.defaultPrevented = true; } };
    for (const f of [...clicks]) f(ev);
    return ev.defaultPrevented;
  };
  return { win, entries, assigned, at: () => entries[i].url, index: () => i, swipeBack: () => win.history.back(), tapMenu };
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

// «‹ Menú» mid-game asks; Stay stays, Leave follows the link; after the game it is a plain link
{
  const f = fakeWindow();
  let answer = false, asked = 0;
  const g = createBackGuard({ win: f.win, ask: async () => { asked++; return answer; }, allowed: async () => true });
  assert.equal(f.tapMenu(), false, 'before the game, «‹ Menú» is a plain link');
  await g.arm();
  assert.equal(f.tapMenu(), true, 'mid-game, the link waits');
  await tick();
  assert.equal(asked, 1, 'and asks');
  assert.deepEqual(f.assigned, [], 'Stay does not leave');
  assert.equal(f.tapMenu({ prevented: true }), true);
  await tick();
  assert.equal(asked, 1, 'a tap the page already handled (La Copa\'s cover) does not ask');
  answer = true;
  f.tapMenu();
  await tick();
  assert.deepEqual(f.assigned, ['/'], 'Leave goes to the menu');
  assert.equal(g.armed, false);
  assert.equal(f.tapMenu(), false, 'and the link is plain again');
}
{
  const f = fakeWindow();
  const g = createBackGuard({ win: f.win, ask: async () => true, allowed: async () => true });
  await g.arm();
  g.disarm();
  assert.equal(f.tapMenu(), false, 'after the game, «‹ Menú» does not ask');
}

console.log('✓ back guard: arms once, asks on a back swipe, Stay stays, Leave leaves, finishing disarms; «‹ Menú» asks the same');
