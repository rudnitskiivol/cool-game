import { findLocation, findSkin } from './content.js';

function loadIds(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    return Array.isArray(raw) && raw.length > 0 ? raw : fallback;
  } catch {
    return fallback;
  }
}

export const game = {
  state: null,
  score: 0,
  best: Number(localStorage.getItem('best') || 0),
  coins: Number(localStorage.getItem('coins') || 0),
  unlockedLocations: loadIds('unlockedLocations', ['classic']),
  unlockedSkins: loadIds('unlockedSkins', ['classic']),
  location: localStorage.getItem('location') || 'classic',
  skin: localStorage.getItem('skin') || 'classic',
};

export function setState(next, ...args) {
  game.state?.exit?.();
  game.state = next;
  next.enter?.(...args);
}

export function recordScore(score) {
  game.score = score;
  if (score > game.best) {
    game.best = score;
    localStorage.setItem('best', String(score));
  }
}

export function earnCoins(amount) {
  if (amount <= 0) return;
  game.coins += amount;
  localStorage.setItem('coins', String(game.coins));
}

function unlock(key, id, cost) {
  if (game.coins < cost) return false;
  game.coins -= cost;
  localStorage.setItem('coins', String(game.coins));
  game[key] = [...game[key], id];
  localStorage.setItem(key, JSON.stringify(game[key]));
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
  localStorage.setItem('location', id);
}

export function selectSkin(id) {
  if (!game.unlockedSkins.includes(id)) return;
  game.skin = id;
  localStorage.setItem('skin', id);
}
