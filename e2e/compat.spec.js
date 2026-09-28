import { test, expect } from '@playwright/test';
import { openGame, playEndlessUntilGameOver, startFirstFlight, stateName, tapBack } from './helpers.js';

// Browser environments where the game used to crash.
const environments = {
  'canvas without roundRect': () => {
    delete CanvasRenderingContext2D.prototype.roundRect;
  },
  'no Web Audio': () => {
    delete window.AudioContext;
    delete window.webkitAudioContext;
  },
  'localStorage throws on write': () => {
    Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
  },
  'corrupted save data': () => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('best', 'abc');
    localStorage.setItem('coins', 'NaN');
    localStorage.setItem('unlockedLocations', '{bad json');
    localStorage.setItem('location', 'does-not-exist');
    localStorage.setItem('skin', 'does-not-exist');
    localStorage.setItem('dateCharacter', 'nobody');
  },
};

for (const [name, init] of Object.entries(environments)) {
  test(`${name}: endless and story still work`, async ({ page }) => {
    const errors = await openGame(page, init);
    await playEndlessUntilGameOver(page);
    await tapBack(page);
    await expect.poll(() => stateName(page)).toBe('menu');
    await startFirstFlight(page, 1);
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
}

test('corrupted save data shows sane stats', async ({ page }) => {
  await openGame(page, environments['corrupted save data']);
  const stats = await page.evaluate(async () => {
    const { game } = await import('/src/game.js');
    return { best: game.best, coins: game.coins, location: game.location, skin: game.skin };
  });
  expect(stats).toEqual({ best: 0, coins: 0, location: 'classic', skin: 'classic' });
});
