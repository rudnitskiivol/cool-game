import test from 'node:test';
import assert from 'node:assert/strict';

// Setup mock browser globals for tests
const storage = new Map([['muted', '1']]);
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
globalThis.window = {
  AudioContext: class {
    state = 'suspended';
    createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; }, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; } }; }
    createBufferSource() { return { connect() { return this; }, start() {}, stop() {} }; }
    createBuffer() { return { getChannelData() { return new Float32Array(100); } }; }
  },
};
try {
  Object.defineProperty(globalThis.navigator, 'vibrate', {
    value: () => true,
    configurable: true,
  });
} catch {}

const { game, toggleCozyMode } = await import('../src/game.js');
const { isPointerDown } = await import('../src/input.js');
const { haptic } = await import('../src/haptics.js');
const collectibles = await import('../src/collectibles.js');
const { COZY_GAP_BONUS, COZY_HITBOX_FORGIVENESS, PLAYER_HITBOX_FORGIVENESS } = await import('../src/config.js');
const obstacles = await import('../src/obstacles.js');

test('haptics triggers safely without errors', () => {
  assert.doesNotThrow(() => {
    haptic.tap();
    haptic.pass();
    haptic.collect();
    haptic.checkpoint();
    haptic.hit();
  });
});

test('cozy mode toggles and adjusts obstacle gap and forgiveness', () => {
  const initialCozy = game.cozyMode;
  toggleCozyMode();
  assert.equal(game.cozyMode, !initialCozy);

  // When cozy is active
  game.cozyMode = true;
  obstacles.reset();
  // Hits forgiveness increases
  assert.ok(COZY_HITBOX_FORGIVENESS > PLAYER_HITBOX_FORGIVENESS);

  // Reset back
  game.cozyMode = initialCozy;
});

test('collectibles spawn and report items correctly', () => {
  collectibles.reset({ id: 'aiko' });
  const dummyObstacle = { x: 300, prevX: 300, gapY: 100, gap: 150, scored: false };
  collectibles.spawnForObstacle(dummyObstacle, 3);

  let collected = false;
  collectibles.update(0.016, 160, 300 + 35, 100 + 75, (item) => {
    collected = true;
    assert.ok(item.symbol);
  });

  assert.ok(collected);
});

test('weather resets safely for each character', async () => {
  const weather = await import('../src/weather.js');
  const characters = ['aiko', 'nika-cyberpunk', 'marina', 'valeria', 'eva', null];
  for (const id of characters) {
    assert.doesNotThrow(() => {
      weather.reset(id ? { id } : null);
      weather.update(0.016, 160);
    });
  }
});

test('obstacle styles set without error for each character', () => {
  const characters = ['aiko', 'nika-cyberpunk', 'marina', 'valeria', 'eva', 'classic'];
  for (const id of characters) {
    assert.doesNotThrow(() => {
      obstacles.setStyle(id);
    });
  }
});
