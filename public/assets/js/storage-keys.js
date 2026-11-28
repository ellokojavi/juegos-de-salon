/**
 * Every key this site keeps on the phone, in one of two lists (the owner's report: signed out, the
 * phone still showed the last player's points and offered their cup's Gran Final). PROGRESS is what a
 * player did or earned: signing out clears it, so the next person starts on a clean sheet (signing in
 * brings back what the account keeps). DEVICE is the phone's own: settings, visits, hints, tests.
 * A mark of what was already told or shown (an achievement, a recap, a challenge) is the phone's: a
 * player who signs out and in is never told it again. `*` stands for any text. storage-keys.test.mjs fails on a key in neither list, so a new one is
 * sorted the day it is written.
 */
const P = 'juegos-de-salon:';
export const PROGRESS = [
  // Uno al día: the days, the started game, the invites, the season seen (its reminder hour stays)
  'uno-al-dia', 'uno-al-dia:empezado', 'uno-al-dia:partida:*', 'uno-al-dia:inv', 'uno-al-dia:aceptados',
  // The cups: this phone's cups, its players, days, copies and queued uploads (not the test harness)
  'copa:*',
  // The player: bests, friends, the upload queue
  'jugador:*',
  // Games played, bests, records, streaks and runs on this phone
  'jugados', 'partidas', 'diario:*', 'aletazo-best', 'memory-best', 'stack-best', 'sudoku:best', 'cosmic-marble:best', '*:record-solo', '*:record-relampago',
  '*:days', 'artifacts', 'artilugio-stages', 'play-hours', 'play-marks', 'play-run',
  // Derrape's ghosts: the record run on each circuit (ghost.js)
  'drift:ghost:*',
  // Badges, achievements and rankings seen, favourites, duels
  'favoritos',
  // Names typed in, and the games in progress to rejoin
  '*:name', '*:names', 'players', '*:session', 'cuarto-rey:game', 'bn:session', 'tyf:session',
].map(k => P + k).concat(['uad-pts-cache']);

export const DEVICE = [
  'jugador', 'lang', 'muted', 'music', 'no-vibration', 'controls', 'stick-moving', '*:variant', '*:vistas', 'home-carousels', 'portada-foto',
  'offline-flag', 'offline-forced', 'offline-ready-last', 'offline-sheet-seen', 'instalar:*', 'avisos:celular', 'uno-al-dia:avisos', 'duel-alerts',
  'labs-avisos', 'labs-idioma', 'labs-llave', 'labs-quien', 'labs-rankings', 'flags', 'flags-off', 'flags-pinned', 'duels-demo',
  'activo', 'activo-juegos', 'dispositivo', 'origin', 'ref', 'ultima', 'vino', 'visita', 'visita-jugo', 'visita-via', 'not-counted', 'rooms-created', 'dias',
  'splash-alcance', 'splash-suave', 'splash-via', 'splash-visto', 'season-guess', 'lanza-recarga', 'cover-dialogs', 'support', 'buzon',
  // What was already told or shown (achievements, recaps, challenges, tables): never told again after
  // signing out and in (the owner's report); the badges seen are kept per player id
  'logros-anunciados', 'logros-base', 'profile-badges:*', 'uno-al-dia:temporada-vista', 'copa:resumen-visto', 'duels-challenged', 'rk-visto:*',
  'profile-bubble', 'profile-intro', 'profile-seen-day', 'profile-via', 'drift:tuning',
  'prueba:*', 'buzon:prueba', 'vapid-prueba', 'copa:prueba', 'copa:prueba:*',
].map(k => P + k).concat(['labs:pildoras', 'copa:prueba:uid']);

const regla = k => new RegExp(`^${k.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
const PROG = PROGRESS.map(regla), DEV = DEVICE.map(regla);
/** 'progress', 'device', or null for a key in neither list. The device list wins (the test harness inside copa:). */
export function kindOf(key) {
  if (DEV.some(r => r.test(key))) return 'device';
  return PROG.some(r => r.test(key)) ? 'progress' : null;
}

/** Clears the player's progress from a storage (signing out), keeping the phone's own keys. */
export function clearProgress(storage = globalThis.localStorage) {
  try {
    const keys = [];
    for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
    for (const k of keys) if (kindOf(k) === 'progress') storage.removeItem(k);
  } catch (_) { /* no storage */ }
}
