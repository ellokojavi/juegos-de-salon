/**
 * Background music for a game (an experiment, behind its lab flag): one track picked at random each
 * game, looped and kept low, so the sound effects (sound.js, Web Audio) still sound on top of it.
 * `start()` on the countdown, `stop()` when the player leaves the result screen. Respects the mute
 * button (`juegos-de-salon:muted`). The tracks are royalty-free (Pixabay), re-encoded at 64 kbps mono.
 */
import { isMuted } from './sound.js';

const VOLUME = 0.22;
let audio = null, ctx = null, gain = null, fade = null, syncing = null;

/** Mute pressed mid-game: the music follows it at once. */
function sync() { if (audio) audio.muted = isMuted(); }

export function start(tracks) {
  stop();
  if (!tracks?.length) return;
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

/** Fades out in half a second and lets the track go. */
export function stop() {
  if (!audio) return;
  const a = audio, g = gain;
  audio = null; gain = null;
  clearInterval(syncing); syncing = null;
  clearTimeout(fade);
  if (g && ctx) {
    try { g.gain.setTargetAtTime(0, ctx.currentTime, 0.12); } catch (_) { /* cut */ }
    fade = setTimeout(() => { a.pause(); a.src = ''; }, 600);
  } else { a.pause(); a.src = ''; }
}

// Leaving the page (or hiding it) silences it; coming back to a game resumes it
document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.pause(); else audio.play().catch(() => {});
});
addEventListener('pagehide', stop);
