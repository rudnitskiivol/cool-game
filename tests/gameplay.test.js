import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/romance.js';
import { scriptFor } from '../src/dateScript.js';
import { getFlightProfile } from '../src/flightProfiles.js';

const storage = new Map([['muted', '1']]);
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
globalThis.window = {
  AudioContext: class {
    state = 'running';
    createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; }, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; } }; }
  },
};
globalThis.document = { addEventListener() {} };
globalThis.Image = class {
  naturalWidth = 768;
  naturalHeight = 1152;
  set src(value) { this.url = value; this.onload?.(); }
};

const { game, setState, earnCoins, recordScore } = await import('../src/game.js');
const { default: playing } = await import('../src/states/playing.js');
const { default: dates } = await import('../src/states/dates.js');
const obstacles = await import('../src/obstacles.js');
const audio = await import('../src/audio.js');

// A canvas context without roundRect (Safari < 16, older Chromium).
function legacyCtx(drawn = []) {
  return new Proxy({
    fillText: (val) => drawn.push(val),
    measureText: (val) => ({ width: String(val).length * 6 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  }, {
    get: (target, key) => {
      if (key === 'roundRect') return undefined;
      return target[key] ?? (() => {});
    },
  });
}

test('all characters have unique, distinct flight profiles', () => {
  for (const c of CHARACTERS) {
    const profile = getFlightProfile(c);
    assert.ok(profile, `Profile exists for ${c.id}`);
    assert.ok(profile.speed > 0);
    assert.ok(profile.gravity > 0);
    assert.ok(profile.jumpImpulse < 0);
    assert.ok(profile.gap >= 140);
    assert.ok(profile.goals.length === 3);
    assert.ok(profile.goals[0] >= 15, 'Level 1 has substantial length');
    assert.ok(profile.goals[2] >= 30, 'Level 3 has substantial length');
  }

  // Aiko is meditative (slower, gentle gravity, wide gap)
  const aiko = getFlightProfile('aiko');
  // Nika is hardcore (fast, punchy gravity, tighter gap)
  const nika = getFlightProfile('nika-cyberpunk');

  assert.ok(aiko.speed < nika.speed, 'Aiko is calmer and slower than Nika');
  assert.ok(aiko.gravity < nika.gravity, 'Aiko has lighter gravity for meditative gliding');
  assert.ok(aiko.gap > nika.gap, 'Aiko has wider gaps for relaxing flight');
});

test('playing state enters and simulates with character profile and journey HUD', () => {
  const c = CHARACTERS[0];
  const steps = scriptFor(c);
  const flightStep = steps.find((s) => s.type === 'level');

  assert.ok(flightStep);
  assert.ok(flightStep.fromLocation);
  assert.ok(flightStep.toLocation);
  assert.ok(flightStep.goal >= 16);

  setState(playing, {
    ...flightStep,
    onComplete: () => {},
    onFail: () => {},
  });

  assert.equal(game.state, playing);

  // Simulate multiple physics frames
  for (let i = 0; i < 60; i++) {
    playing.update(1 / 60);
  }

  // Render mock
  const drawn = [];
  const ctx = new Proxy({
    fillText: (val) => drawn.push(val),
    measureText: (val) => ({ width: val.length * 6 }),
  }, { get: (target, key) => target[key] ?? (() => {}) });

  playing.render(ctx, 1);
  const text = drawn.join(' ');

  // Verifies Journey HUD renders origin and destination locations
  assert.ok(text.includes(flightStep.fromLocation));
  assert.ok(text.includes(flightStep.toLocation));
});

test('screens render on a canvas without roundRect', () => {
  const c = CHARACTERS[1];
  const flightStep = scriptFor(c).find((s) => s.type === 'level');
  setState(playing, { ...flightStep, onComplete: () => {}, onFail: () => {} });
  for (let i = 0; i < 30; i++) playing.update(1 / 60);
  assert.doesNotThrow(() => playing.render(legacyCtx(), 1));

  setState(playing);
  for (let i = 0; i < 30; i++) playing.update(1 / 60);
  assert.doesNotThrow(() => playing.render(legacyCtx(), 1));

  setState(dates);
  assert.doesNotThrow(() => dates.render(legacyCtx(), 1));
});

test('endless mode ramps difficulty, story flights keep their profile', () => {
  obstacles.setProfile(getFlightProfile());
  assert.ok(obstacles.getSpeed(40) > obstacles.getSpeed(0), 'endless speeds up');
  assert.ok(obstacles.getGap(40) < obstacles.getGap(0), 'endless gap narrows');
  assert.ok(obstacles.getSpacing(40) < obstacles.getSpacing(0), 'endless pipes get denser');

  const aiko = getFlightProfile('aiko');
  obstacles.setProfile(aiko);
  assert.equal(obstacles.getSpeed(0), aiko.speed);
  assert.equal(obstacles.getSpeed(40), aiko.speed);
  assert.equal(obstacles.getSpacing(40), aiko.spacing);
});

test('progress survives a throwing or missing localStorage', () => {
  const original = globalThis.localStorage;
  try {
    globalThis.localStorage = {
      getItem() { throw new Error('SecurityError'); },
      setItem() { throw new Error('QuotaExceededError'); },
    };
    const coins = game.coins;
    assert.doesNotThrow(() => earnCoins(5));
    assert.equal(game.coins, coins + 5);
    assert.doesNotThrow(() => recordScore(game.best + 1));
    assert.doesNotThrow(() => audio.toggleMute());

    delete globalThis.localStorage;
    assert.doesNotThrow(() => earnCoins(1));
  } finally {
    globalThis.localStorage = original;
    audio.setMuted(true);
  }
});

test('corrupted saved values fall back to safe defaults', async () => {
  const saved = new Map([
    ['best', 'abc'], ['coins', '-7'], ['unlockedLocations', '{bad json'],
    ['location', 'does-not-exist'], ['skin', 'nope'],
  ]);
  const original = globalThis.localStorage;
  globalThis.localStorage = { getItem: (k) => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v) };
  try {
    const { game: fresh } = await import('../src/game.js?corrupted');
    assert.equal(fresh.best, 0);
    assert.equal(fresh.coins, 0);
    assert.deepEqual(fresh.unlockedLocations, ['classic']);
    assert.equal(fresh.location, 'classic');
    assert.equal(fresh.skin, 'classic');
  } finally {
    globalThis.localStorage = original;
  }
});

test('audio is a silent no-op without Web Audio support', async () => {
  const originalWindow = globalThis.window;
  globalThis.window = {};
  try {
    const silent = await import('../src/audio.js?no-web-audio');
    assert.equal(silent.contextState(), 'unavailable');
    silent.setMuted(false);
    assert.doesNotThrow(() => {
      silent.flap(); silent.score(3); silent.death(); silent.newBest(); silent.collect(); silent.checkpoint();
    });
  } finally {
    globalThis.window = originalWindow;
  }
});
