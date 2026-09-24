// Unlockable locations and player skins. Purely data — theme.js applies a
// location's palette, game.js tracks which ids are unlocked/selected.
//
// `theme` only overrides the keys that are allowed to vary by location; any
// key it omits falls back to the base COLORS in config.js (see theme.js).
export const LOCATIONS = [
  {
    id: 'classic',
    name: 'Classic Sky',
    cost: 0,
    theme: {},
  },
  {
    id: 'canyon',
    name: 'Sunset Canyon',
    cost: 150,
    theme: {
      sky: '#2a1220',
      ground: '#3a1d22',
      groundLine: '#4a2a2c',
      hillFar: '#331a24',
      hillNear: '#3d2128',
      pipe: '#e0703f',
      pipeCap: '#f2955f',
      pipeHighlight: '#ec8654',
    },
  },
  {
    id: 'neon',
    name: 'Neon Night',
    cost: 400,
    theme: {
      sky: '#0a0a1a',
      ground: '#12122a',
      groundLine: '#23234a',
      hillFar: '#10102a',
      hillNear: '#181840',
      pipe: '#d94ce0',
      pipeCap: '#f08ef5',
      pipeHighlight: '#e56de8',
    },
  },
];

export const SKINS = [
  {
    id: 'classic',
    name: 'Classic',
    cost: 0,
    colors: { player: '#ffd166', beak: '#f4874b', eye: '#221d2e' },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    cost: 100,
    colors: { player: '#ff5d5d', beak: '#ffb199', eye: '#2e1414' },
  },
  {
    id: 'azure',
    name: 'Azure',
    cost: 100,
    colors: { player: '#5dc8ff', beak: '#eaf7ff', eye: '#142a2e' },
  },
  {
    id: 'mint',
    name: 'Mint',
    cost: 100,
    colors: { player: '#5dffb0', beak: '#eafff5', eye: '#14302a' },
  },
];

export function findLocation(id) {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
}

export function findSkin(id) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
