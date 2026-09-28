import { test, expect } from '@playwright/test';
import {
  openGame, playEndlessUntilGameOver, startFirstFlight, stateName, tapBack, tapMenu,
} from './helpers.js';

test('endless run ends in gameover and returns to menu', async ({ page }) => {
  const errors = await openGame(page);
  await playEndlessUntilGameOver(page);
  await tapBack(page);
  await expect.poll(() => stateName(page)).toBe('menu');
  expect(errors).toEqual([]);
});

test('hub opens and closes', async ({ page }) => {
  const errors = await openGame(page);
  await tapMenu(page, 'hub');
  await expect.poll(() => stateName(page)).toBe('hub');
  await tapBack(page);
  await expect.poll(() => stateName(page)).toBe('menu');
  expect(errors).toEqual([]);
});

for (let heroine = 0; heroine < 5; heroine++) {
  test(`story route ${heroine} reaches its first flight`, async ({ page }) => {
    const errors = await openGame(page);
    await startFirstFlight(page, heroine);
    // A crash in the flight returns to the story instead of the main gameover.
    await expect.poll(() => stateName(page), { timeout: 15_000 }).toBe('story');
    expect(errors).toEqual([]);
  });
}

test('best score and coins persist across reloads', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => {
    localStorage.setItem('best', '12');
    localStorage.setItem('coins', '34');
  });
  await page.reload();
  const saved = await page.evaluate(async () => {
    const { game } = await import('/src/game.js');
    return { best: game.best, coins: game.coins };
  });
  expect(saved).toEqual({ best: 12, coins: 34 });
});

test('resizing mid-flight does not break rendering', async ({ page }) => {
  const errors = await openGame(page);
  await tapMenu(page, 'endless');
  await expect.poll(() => stateName(page)).toBe('playing');
  for (const size of [{ width: 844, height: 390 }, { width: 320, height: 568 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(150);
  }
  expect(errors).toEqual([]);
});
