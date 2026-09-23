// The active location's palette. Everything that doesn't vary by location
// (text, muted, flash, puff, eye/beak defaults...) stays a plain COLORS read;
// only the keys a location's `theme` can override live here.
import { COLORS } from './config.js';
import { findLocation, findSkin } from './content.js';

const THEMED_KEYS = [
  'sky',
  'ground',
  'groundLine',
  'hillFar',
  'hillNear',
  'pipe',
  'pipeCap',
  'pipeHighlight',
];

export const current = {};
for (const key of THEMED_KEYS) current[key] = COLORS[key];

let activeSkin = findSkin('classic');

export function setLocation(locationId) {
  const location = findLocation(locationId);
  for (const key of THEMED_KEYS) current[key] = location.theme[key] ?? COLORS[key];
}

export function setSkin(skinId) {
  activeSkin = findSkin(skinId);
}

export function getPlayerSkin() {
  return activeSkin.colors;
}
