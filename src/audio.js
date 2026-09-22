// All sound effects, synthesized with the Web Audio API — no .mp3/.ogg/.wav
// assets anywhere. This module owns the single AudioContext, the mobile
// unlock, the mute flag, and one small function per sound.
//
// Nothing here feeds back into gameplay: sounds are fire-and-forget, and
// scheduling uses the AudioContext's own clock (ctx.currentTime), which is
// fine — the fixed-timestep rule in loop.js governs simulated game state,
// not audio hardware scheduling.
import {
  AUDIO_MUTE_KEY,
  FLAP_FREQ_START,
  FLAP_FREQ_END,
  FLAP_DURATION,
  FLAP_GAIN,
  SCORE_FREQ_BASE,
  SCORE_FREQ_STEP,
  SCORE_FREQ_MAX,
  SCORE_DURATION,
  SCORE_GAIN,
  DEATH_TONE_FREQ_START,
  DEATH_TONE_FREQ_END,
  DEATH_TONE_DURATION,
  DEATH_TONE_GAIN,
  DEATH_NOISE_DURATION,
  DEATH_NOISE_GAIN,
  BEST_NOTE_FREQS,
  BEST_NOTE_DURATION,
  BEST_NOTE_GAP,
  BEST_NOTE_GAIN,
} from './config.js';

// Created immediately at module load — that's allowed and doesn't require a
// gesture. It starts "suspended" on mobile; only resume() needs one.
const ctx = new (window.AudioContext || window.webkitAudioContext)();

let muted = localStorage.getItem(AUDIO_MUTE_KEY) === '1';

// A short buffer of random samples, generated once and reused for every
// impact sound — still fully synthesized, just precomputed so death() isn't
// filling a buffer on every collision.
let noiseBuffer = null;
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.ceil(ctx.sampleRate * 0.3);
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// --- Mobile unlock -----------------------------------------------------
// A suspended AudioContext can only be resumed from inside a real
// user-gesture event handler, not later on a fixed-step update(). This
// listens on the document directly (independent of the game's own tap
// queue in input.js) and removes itself after the first attempt.
function unlock() {
  ctx.resume().catch(() => {});
  document.removeEventListener('pointerdown', unlock);
}
document.addEventListener('pointerdown', unlock, { passive: true });

// Exposed only for diagnostics (e.g. confirming the unlock worked) — never
// used to feed anything back into gameplay.
export function contextState() {
  return ctx.state;
}

// --- Mute ----------------------------------------------------------------
export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  localStorage.setItem(AUDIO_MUTE_KEY, muted ? '1' : '0');
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

// Every sound funnels through here: when muted, no oscillator/gain/buffer
// node is ever created — a muted game does no audio work, rather than
// quietly playing everything at zero gain.
function play(build) {
  if (muted) return;
  build(ctx.currentTime);
}

// --- Sounds ----------------------------------------------------------------

export function flap() {
  play((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(FLAP_FREQ_START, t);
    osc.frequency.exponentialRampToValueAtTime(FLAP_FREQ_END, t + FLAP_DURATION);
    gain.gain.setValueAtTime(FLAP_GAIN, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + FLAP_DURATION);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + FLAP_DURATION + 0.02);
  });
}

// streak: the current in-run score (0-based), used to nudge the pitch up a
// little on each successive pass so a good run sounds like it's building.
export function score(streak = 0) {
  play((t) => {
    const freq = Math.min(SCORE_FREQ_BASE + streak * SCORE_FREQ_STEP, SCORE_FREQ_MAX);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(SCORE_GAIN, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + SCORE_DURATION);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + SCORE_DURATION + 0.02);
  });
}

export function death() {
  play((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(DEATH_TONE_FREQ_START, t);
    osc.frequency.exponentialRampToValueAtTime(DEATH_TONE_FREQ_END, t + DEATH_TONE_DURATION);
    gain.gain.setValueAtTime(DEATH_TONE_GAIN, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + DEATH_TONE_DURATION);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + DEATH_TONE_DURATION + 0.02);

    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer();
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(DEATH_NOISE_GAIN, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + DEATH_NOISE_DURATION);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + DEATH_NOISE_DURATION + 0.02);
  });
}

export function newBest() {
  play((t) => {
    BEST_NOTE_FREQS.forEach((freq, i) => {
      const start = t + i * BEST_NOTE_GAP;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(BEST_NOTE_GAIN, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + BEST_NOTE_DURATION);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + BEST_NOTE_DURATION + 0.02);
    });
  });
}
