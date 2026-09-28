import { expect } from '@playwright/test';

// Menu hit targets in virtual (unscaled) canvas coordinates.
export const MENU = { dates: 274, endless: 346, hub: 407 };
export const BACK = { x: 40, y: 28 };

const STATES = ['menu', 'playing', 'hub', 'dates', 'story', 'gameover'];

// Opens the game and collects every uncaught error / console.error.
export async function openGame(page, init) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  if (init) await page.addInitScript(init);
  await page.goto('/');
  await expect.poll(() => stateName(page)).toBe('menu');
  return errors;
}

export function stateName(page) {
  return page.evaluate(async (names) => {
    const { game } = await import('/src/game.js');
    for (const n of names) {
      const m = await import(`/src/states/${n}.js`);
      if (m.default === game.state) return n;
    }
    return 'unknown';
  }, STATES);
}

export function viewportWidth(page) {
  return page.evaluate(async () => (await import('/src/viewport.js')).viewport.width);
}

export async function tap(page, vx, vy) {
  const pos = await page.evaluate(async ([x, y]) => {
    const { viewport } = await import('/src/viewport.js');
    return { x: x * viewport.scale + viewport.offsetX, y: y * viewport.scale };
  }, [vx, vy]);
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(80);
}

export async function tapBack(page) {
  await tap(page, BACK.x, BACK.y);
}

export async function tapMenu(page, item) {
  await tap(page, (await viewportWidth(page)) / 2, MENU[item]);
}

// Endless: the bird falls without input, so a run must end in gameover.
export async function playEndlessUntilGameOver(page) {
  await tapMenu(page, 'endless');
  await expect.poll(() => stateName(page)).toBe('playing');
  await expect.poll(() => stateName(page), { timeout: 10_000 }).toBe('gameover');
}

// Picks a heroine on the dates screen and taps through the story until the
// first flight starts.
export async function startFirstFlight(page, heroineSteps = 0) {
  const w = await viewportWidth(page);
  await tapMenu(page, 'dates');
  await expect.poll(() => stateName(page)).toBe('dates');
  for (let i = 0; i < heroineSteps; i++) await tap(page, w - 38, 262);
  await tap(page, w / 2, 574);
  await expect.poll(() => stateName(page)).toBe('story');
  for (let i = 0; i < 100 && (await stateName(page)) === 'story'; i++) {
    await tap(page, w / 2, 440);
  }
  expect(await stateName(page)).toBe('playing');
}
