import { findLocation, findSkin } from './content.js';

// Storage can be missing (tests), blocked (privacy mode) or full (quota);
// none of that should take the game down.
export function readStorage(key) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Ignore in environments without writable localStorage
  }
}

function loadCount(key) {
  const value = Math.floor(Number(readStorage(key)));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function loadIds(key, fallback) {
  try {
    const raw = JSON.parse(readStorage(key));
    return Array.isArray(raw) && raw.length > 0 ? raw : fallback;
  } catch {
    return fallback;
  }
}

export const game = {
  state: null,
  score: 0,
  best: loadCount('best'),
  coins: loadCount('coins'),
  cozyMode: readStorage('cozyMode') === 'true',
  unlockedLocations: loadIds('unlockedLocations', ['classic']),
  unlockedSkins: loadIds('unlockedSkins', ['classic']),
  location: findLocation(readStorage('location')).id,
  skin: findSkin(readStorage('skin')).id,
};

export function toggleCozyMode() {
  game.cozyMode = !game.cozyMode;
  writeStorage('cozyMode', String(game.cozyMode));
  return game.cozyMode;
}

export function setState(next, ...args) {
  game.state?.exit?.();
  game.state = next;
  next.enter?.(...args);
}

export function recordScore(score) {
  game.score = score;
  if (score > game.best) {
    game.best = score;
    writeStorage('best', String(score));
  }
}

export function earnCoins(amount) {
  if (amount <= 0) return;
  game.coins += amount;
  writeStorage('coins', String(game.coins));
}

function unlock(key, id, cost) {
  if (game.coins < cost) return false;
  game.coins -= cost;
  writeStorage('coins', String(game.coins));
  game[key] = [...game[key], id];
  writeStorage(key, JSON.stringify(game[key]));
  return true;
}

export function unlockLocation(id) {
  return unlock('unlockedLocations', id, findLocation(id).cost);
}

export function unlockSkin(id) {
  return unlock('unlockedSkins', id, findSkin(id).cost);
}

export function selectLocation(id) {
  if (!game.unlockedLocations.includes(id)) return;
  game.location = id;
  writeStorage('location', id);
}

export function selectSkin(id) {
  if (!game.unlockedSkins.includes(id)) return;
  game.skin = id;
  writeStorage('skin', id);
}
