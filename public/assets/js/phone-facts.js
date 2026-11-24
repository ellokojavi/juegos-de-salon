/**
 * What this phone knows about its player without asking anyone (lab flag `profile`): Uno al día's days and
 * streak, the hours and marks of play-hours.js, the games finished. The profile draws a guest's badges and a
 * player's first paint from it, and after each game (achievement-window.js `celebrate`) the badges it can tell
 * on its own open their window, the moment they are earned (the owner, 2026-11-23).
 */
import { leer as leerDia, recorrer, fechaLocal } from './uno-al-dia.js';
import { readHours, readRun, readMarks } from './play-hours.js';
import { ALL_GAMES, PLAYABLE_GAMES } from './games.js';

/** The games a player can earn badges in: launched, not hidden. */
export const CATALOGUE = PLAYABLE_GAMES;
/** stats.js' PARTIDAS_KEY (phone-facts.test.mjs keeps them equal): not imported, so this stays light. */
export const PLAYS_KEY = 'juegos-de-salon:partidas';
/** The badges this phone can tell alone (profile/badges.js ids): a guest's, and those celebrated right after a game. */
export const LOCAL_BADGES = new Set(['streak-10', 'streak-30', 'streak-100', 'month-full', 'early-bird', 'explorer', 'collector', 'plays-100', 'plays-1000',
  'obsession', 'premiere', 'regular', 'weekends', 'mondays', 'night-owl', 'fiestas', 'halloween', 'xmas', 'new-year']);

/** The facts for profile/badges.js `earned`, from this phone alone. */
export function phoneFacts(storage = globalThis.localStorage) {
  const d = leerDia(storage);
  const hoy = fechaLocal();
  const r = recorrer(d.dias || {}, hoy, { regalos: d.regalos || [] });
  let played = [];
  try { played = JSON.parse(storage?.getItem('juegos-de-salon:jugados') || '[]'); } catch (_) { played = []; }
  const ids = new Set(CATALOGUE.map(g => g.id));
  let plays = 0;
  try { plays = Number(storage?.getItem(PLAYS_KEY)) || 0; } catch (_) { plays = 0; }
  return {
    today: hoy, now: Date.now(),
    streak: r.racha, bestStreak: r.mejor,
    dailyDays: Object.fromEntries(Object.keys(d.dias || {}).map(f => [f, true])),
    hours: readHours(storage),
    bestRun: Number(readRun(storage).best) || 0,
    marks: readMarks(storage),
    launches: Object.fromEntries(ALL_GAMES.filter(g => /^\d{4}-\d{2}-\d{2}$/.test(g.nuevoDesde || '')).map(g => [g.id, g.nuevoDesde])),
    plays,
    gamesPlayed: Array.isArray(played) ? played.filter(id => ids.has(id)).length : 0,
    gamesTotal: CATALOGUE.length,
  };
}
