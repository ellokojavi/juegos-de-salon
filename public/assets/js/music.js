/**
 * Background music for a game (an experiment, behind its lab flag): one track picked at random each
 * game, looped and kept low, so the sound effects (sound.js, Web Audio) still sound on top of it.
 * `start()` on the countdown; `fadeOutLater()` when the game is lost (5 s later it fades out over 2 s);
 * `stop()` when the player leaves the result screen before that. Respects the mute
 * button (`juegos-de-salon:muted`). The tracks are royalty-free (Pixabay), re-encoded at 64 kbps mono.
 */
import { isMuted } from './sound.js';

const VOLUME = 0.22;
const PREF = 'juegos-de-salon:music';

/** Whether the player wants the music (the switch on the game's cover); on unless turned off. */
export function musicOn() { try { return localStorage.getItem(PREF) !== '0'; } catch (_) { return true; } }
export function setMusicOn(v) { try { localStorage.setItem(PREF, v ? '1' : '0'); } catch (_) { /* this time only */ } }
let audio = null, ctx = null, gain = null, fade = null, syncing = null, later = null;

/** Mute pressed mid-game: the music follows it at once. */
function sync() { if (audio) audio.muted = isMuted(); }

export function start(tracks) {
  stop();
  if (!tracks?.length || !musicOn()) return;
  const src = tracks[Math.floor(Math.random() * tracks.length)];
  audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'auto';
  audio.muted = isMuted();
  // iOS ignores `volume` on an <audio>: through a Web Audio gain it is low there too
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    gain = ctx.createGain();
    gain.gain.value = VOLUME;
    ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
  } catch (_) { audio.volume = VOLUME; }
  audio.play().catch(() => {});
  syncing ||= setInterval(sync, 300);
}

/** The game is lost: `afterMs` later the music fades out over `seconds`, on the result screen. */
export function fadeOutLater(afterMs = 5000, seconds = 2) {
  if (!audio) return;
  clearTimeout(later);
  later = setTimeout(() => stop(seconds), afterMs);
}

/** Fades out (half a second unless told) and lets the track go. */
export function stop(seconds = 0.5) {
  clearTimeout(later); later = null;
  if (!audio) return;
  const a = audio, g = gain;
  audio = null; gain = null;
  clearInterval(syncing); syncing = null;
  clearTimeout(fade);
  if (g && ctx) {
    try { g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + seconds); } catch (_) { /* cut */ }
    fade = setTimeout(() => { a.pause(); a.src = ''; }, seconds * 1000 + 100);
  } else { a.pause(); a.src = ''; }
}

// Leaving the page (or hiding it) silences it; coming back to a game resumes it
document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.pause(); else audio.play().catch(() => {});
});
addEventListener('pagehide', stop);
