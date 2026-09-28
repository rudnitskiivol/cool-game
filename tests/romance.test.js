import test from 'node:test';
import assert from 'node:assert/strict';
import { access, stat } from 'node:fs/promises';
import { CHARACTERS, artUrl } from '../src/romance.js';
import { scriptFor, endingFor } from '../src/dateScript.js';

const storage = new Map([['muted', '1']]);
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
globalThis.window = { AudioContext: class { state = 'suspended'; } };
globalThis.document = { addEventListener() {} };
globalThis.Image = class {
  naturalWidth = 768;
  naturalHeight = 1152;
  set src(value) { this.url = value; this.onload(); }
};

const { game, setState } = await import('../src/game.js');
const { initInput } = await import('../src/input.js');
const { viewport } = await import('../src/viewport.js');
const { default: story } = await import('../src/states/story.js');
const { default: playing } = await import('../src/states/playing.js');
const { default: dates } = await import('../src/states/dates.js');
const { default: menu } = await import('../src/states/menu.js');
const companion = await import('../src/companion.js');

let pointer;
initInput({ addEventListener: (_, callback) => { pointer = callback; }, getBoundingClientRect: () => ({ left: 0, top: 0 }) });
const tap = (x = 180, y = 500) => {
  pointer({ clientX: x, clientY: y, preventDefault() {} });
  game.state.update(1 / 60);
};

let text = [];
let images = [];
const ctx = new Proxy({
  fillText: (value) => text.push(value),
  drawImage: (image) => images.push(image.url),
  measureText: (value) => ({ width: value.length * 7 }),
  createLinearGradient: () => ({ addColorStop() {} }),
}, { get: (target, key) => target[key] ?? (() => {}) });
function render() {
  text = []; images = [];
  game.state.render(ctx, 1);
  return text.join(' ');
}

test('all route scenes exist and the full optimized pack fits under 6 MB', async () => {
  let size = 0;
  for (const character of CHARACTERS) {
    const scenes = ['portrait', ...character.chapters.map((c) => c[0]), '05-love', '06-fail'];
    for (const scene of scenes) {
      const file = new URL(`../public/${artUrl(character, scene).replace('./', '')}`, import.meta.url);
      await access(file);
      size += (await stat(file)).size;
    }
    assert.equal(scriptFor(character).filter((s) => s.type === 'level').length, 3);
    assert.equal(endingFor(character, 75)[0].scene, '05-love');
    assert.equal(endingFor(character, 45)[0].scene, character.chapters[3][0]);
    assert.equal(endingFor(character, 44)[0].scene, '06-fail');
    assert.equal(endingFor(character, 100, true)[0].scene, '06-fail');
  }
  assert.ok(size < 6 * 1024 * 1024);
});

for (const character of CHARACTERS) {
  for (const outcome of ['good', 'open', 'bad']) {
    test(`${character.id}: complete ${outcome} route, correct scenes and companion`, () => {
      setState(story, { characterId: character.id });
      let flights = 0;
      let choices = 0;
      const scenes = new Set();
      let sawEnding = false;
      for (let step = 0; step < 80 && game.state !== dates; step++) {
        if (game.state === playing) {
          flights++;
          images = [];
          companion.render(ctx);
          assert.ok(images[0].includes(`/${character.id}/portrait.webp`));
          setState(story, 'win');
          continue;
        }
        assert.equal(game.state, story);
        story.update(10); // Finish the typewriter without changing the current step.
        const shown = render();
        images.forEach((url) => scenes.add(url.split('/').at(-1)));
        if (shown.includes('Конец истории.')) sawEnding = true;
        if (shown.includes('Твой выбор')) {
          const option = outcome === 'bad' && choices === 1 ? 2 : outcome === 'open' ? 1 : 0;
          choices++;
          tap(180, 437 + option * 64);
        } else tap();
      }
      assert.equal(game.state, dates);
      assert.equal(flights, 3);
      assert.equal(choices, 2);
      assert.ok(sawEnding);
      assert.ok(scenes.has(outcome === 'good' ? '05-love.webp' : outcome === 'bad' ? '06-fail.webp' : `${character.chapters[3][0]}.webp`));
      if (outcome !== 'good') assert.ok(!scenes.has('05-love.webp'));
    });
  }
}

test('crash reduces affection, retries the same flight, and resets for a new heroine', () => {
  setState(story, { characterId: 'aiko' });
  story.update(10); tap(); story.update(10); tap();
  assert.equal(game.state, playing);
  setState(story, 'fail');
  story.update(10);
  assert.ok(render().includes('45'));
  assert.equal(game.coins, 0);
  tap();
  assert.equal(game.state, playing);
  setState(story, 'win');
  story.update(10);
  assert.ok(render().includes('Мастерская'));
  tap(25, 28);
  assert.equal(game.state, dates);
  setState(story, { characterId: 'eva' });
  story.update(10);
  assert.ok(render().includes('50'));
  assert.ok(images.every((url) => url.includes('/eva/')));
});

test('picker wraps, remembers selection, and starts the selected route on a narrow viewport', () => {
  viewport.width = 296;
  storage.set('dateCharacter', 'aiko');
  setState(dates);
  tap(38, 263);
  assert.equal(storage.get('dateCharacter'), 'eva');
  tap(148, 574);
  assert.equal(game.state, story);
  story.update(10);
  assert.ok(render().includes('Ева'));
  tap(25, 28);
  assert.equal(game.state, dates);
  tap(25, 28);
  assert.equal(game.state, menu);
  viewport.width = 360;
});

test('flight pause needs a confirm to leave, and empty menu taps do nothing', () => {
  setState(menu);
  tap(180, 600);
  assert.equal(game.state, menu);

  setState(playing);
  tap(32, 32);
  assert.ok(render().includes('Пауза'));
  tap(180, 100);
  assert.equal(game.state, playing);
  tap(180, 320 + 56 + 22);
  assert.equal(game.state, menu);

  setState(playing);
  tap(32, 32);
  tap(180, 320 - 8 + 26);
  assert.ok(!render().includes('Пауза'));
  assert.equal(game.state, playing);
});
