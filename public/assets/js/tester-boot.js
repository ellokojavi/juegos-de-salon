/**
 * Puts the tester ribbon on every screen (lab flag tester-ribbon): vigia.js adds this module to
 * every page but the panel. With a lab key and the flag on, it shows the ribbon in the page's
 * language; tester-ribbon.js hides it while a game is being played. lab: #seccion-tester-ribbon
 */
import { labAccess } from './lab-access.js';
import { flag } from './flags.js';

if (await labAccess().catch(() => false) && await flag('tester-ribbon').catch(() => false)) {
  const { testerRibbon } = await import('./tester-ribbon.js');
  const lang = (document.documentElement.lang || 'es').slice(0, 2);
  testerRibbon({ lang });
}
