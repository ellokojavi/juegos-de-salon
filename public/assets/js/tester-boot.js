/**
 * Puts the tester ribbon on every screen: vigia.js adds this module to every page but the panel.
 * With a lab key it shows the ribbon in the page's language; tester-ribbon.js hides it while a game
 * is being played. Launched 2026-11-02, its flag gate removed. lab: #seccion-tester-ribbon
 * Being on every page, it also carries what every page's top bar gets while in the lab.
 */
import { labAccess } from './lab-access.js';
import { flag, flagGuess } from './flags.js';

// The profile's pill and the compact language on every page's top bar (profile-button.js). lab: #seccion-profile
// Drawn from the first frame when this phone saw it on last time: waiting for the network showed the old bar first
const pf = () => import('./profile-button.js').then(m => m.profileEverywhere());
if (flagGuess('profile')) pf().catch(() => {});
else flag('profile').then(on => on && pf()).catch(() => {});

// Sound and language live only in the profile's ⚙️ (flag settings-in-profile, the owner 2026-11-23). lab: #seccion-settings-in-profile
// A class on <html>: base.css hides 🔊 and the language everywhere else, before the first paint when this phone saw it on
const notProfile = !/\/profile\/?$/.test(location.pathname);
const settingsOff = on => { if (on && notProfile) document.documentElement.classList.add('settings-in-profile'); };
if (flagGuess('settings-in-profile')) settingsOff(true);
flag('settings-in-profile').then(settingsOff).catch(() => {});

if (await labAccess().catch(() => false)) {
  const { testerRibbon } = await import('./tester-ribbon.js');
  const lang = (document.documentElement.lang || 'es').slice(0, 2);
  testerRibbon({ lang });
}
