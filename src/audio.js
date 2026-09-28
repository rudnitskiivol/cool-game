// Refined audio synthesizer using Web Audio API.
// Eliminates harsh clipping, screeching square waves, and jarring noise bursts.
// Features melodic, character-themed sound profiles (Zen bells, Cyber synth, Warm marimba, Heavy kick, Noir tape).

import { AUDIO_MUTE_KEY } from './config.js';
import { readStorage, writeStorage } from './game.js';

function createContext() {
  const scope = globalThis.window ?? globalThis;
  const AudioCtor = scope.AudioContext || scope.webkitAudioContext;
  if (typeof AudioCtor !== 'function') return null;
  try {
    return new AudioCtor();
  } catch {
    return null;
  }
}

const ctx = createContext();
let muted = readStorage(AUDIO_MUTE_KEY) === '1';
let currentProfile = 'classic';

// Pentatonic scales for musical score progression
const PENTATONIC = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51, // E6
];

// Unlock Web Audio on first user interaction
function unlock() {
  try {
    ctx?.resume()?.catch?.(() => {});
  } catch {
    // Some engines throw synchronously instead of rejecting
  }
  document.removeEventListener('pointerdown', unlock);
}
if (ctx && typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlock, { passive: true });
}

export function contextState() {
  return ctx?.state ?? 'unavailable';
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  writeStorage(AUDIO_MUTE_KEY, muted ? '1' : '0');
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

export function setAudioProfile(profileId) {
  currentProfile = profileId || 'classic';
}

function play(build) {
  if (muted || !ctx) return;
  try {
    build(ctx.currentTime);
  } catch {
    // Graceful fallback if audio hardware is unavailable
  }
}

// Gentle, natural wing flap / thrust
export function flap() {
  play((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (currentProfile === 'zen') {
      // Soft airy flutter
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.08);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    } else if (currentProfile === 'cyber') {
      // Crisp electric thrust
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.06);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    } else if (currentProfile === 'heavy') {
      // Deep athletic push
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.09);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    } else {
      // Warm & balanced flap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(460, t + 0.08);
      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    }

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  });
}

// Melodic score / obstacle pass notification (harmonizes with streak instead of harsh square beeps)
export function score(streak = 0) {
  play((t) => {
    const noteIndex = streak % PENTATONIC.length;
    const baseFreq = PENTATONIC[noteIndex];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (currentProfile === 'zen') {
      // Pure soothing bell chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 0.9, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    } else if (currentProfile === 'cyber') {
      // High-tech clean synth tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 1.2, t);
      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    } else if (currentProfile === 'warm') {
      // Marimba / acoustic resonance
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    } else if (currentProfile === 'heavy') {
      // Solid rhythmic hit
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 0.7, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    } else {
      // Noir / classic
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    }

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// Soft, dignified collision sound — eliminates the harsh fart/sawtooth noise
export function death() {
  play((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Muted bass drop (cinematic low thump)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

// Triumphant, harmonic completion chord
export function newBest() {
  play((t) => {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
    notes.forEach((freq, i) => {
      const start = t + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.28);
    });
  });
}

// Delicate, crystalline collectible sparkle
export function collect() {
  play((t) => {
    [783.99, 1046.50].forEach((freq, i) => {
      const start = t + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  });
}

// Harmonic midpoint checkpoint fanfare
export function checkpoint() {
  play((t) => {
    [440, 554.37, 659.25].forEach((freq, i) => {
      const start = t + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  });
}
