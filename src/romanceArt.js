import { artUrl } from './romance.js';

// Bound decoded image memory when switching between routes on a phone.
const cache = new Map();
const MAX_IMAGES = 16;
const motionPreference = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');

export function reducedMotion() {
  return motionPreference?.matches ?? false;
}

function imageFor(url) {
  if (cache.has(url)) {
    const entry = cache.get(url);
    cache.delete(url);
    cache.set(url, entry);
    return entry;
  }
  const image = new Image();
  const entry = { image, status: 'loading' };
  image.onload = () => { entry.status = 'ready'; };
  image.onerror = () => { entry.status = 'error'; };
  image.src = url;
  cache.set(url, entry);
  if (cache.size > MAX_IMAGES) cache.delete(cache.keys().next().value);
  return entry;
}

export function preloadArt(character, scenes = ['portrait']) {
  scenes.forEach((scene) => imageFor(artUrl(character, scene)));
}

// Cover without distortion; bias toward the top of the portrait to keep faces.
export function drawArt(ctx, character, scene, x, y, w, h, anchorY = 0.18) {
  const entry = imageFor(artUrl(character, scene));
  if (entry.status !== 'ready') return entry.status;
  paintImage(ctx, entry.image, x, y, w, h, anchorY);
  return 'ready';
}

function paintImage(ctx, img, x, y, w, h, anchorY, time = null) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const baseW = w / scale;
  const baseH = h / scale;
  const animated = time !== null && !reducedMotion();
  // A slow camera drift gives the illustration movement without deforming
  // faces. Extra crop margin keeps every edge covered throughout the cycle.
  const zoom = animated ? 1.045 + Math.sin(time * 1.1) * 0.012 : 1;
  const sw = baseW / zoom;
  const sh = baseH / zoom;
  const sx = (img.naturalWidth - sw) * (0.5 + (animated ? Math.sin(time * 0.55) * 0.055 : 0));
  const desiredY = (img.naturalHeight - baseH) * anchorY + (baseH - sh) * 0.25
    + (animated ? Math.sin(time * 0.85) * baseH * 0.004 : 0);
  const sy = Math.max(0, Math.min(img.naturalHeight - sh, desiredY));
  ctx.drawImage(img, sx, sy,
    sw, sh, x, y, w, h);
}

// One independent player per screen. A new image fades in only after loading;
// the previous image remains visible on slow connections. Holds at most two
// decoded frames in addition to the shared bounded cache.
export function createArtPlayer() {
  let requested = null;
  let current = null;
  let previous = null;
  let fade = 1;
  let time = 0;
  const duration = 0.55;

  function acceptReadyImage() {
    if (!requested || requested === current || requested.status !== 'ready') return;
    previous = current;
    current = requested;
    fade = previous && !reducedMotion() ? 0 : 1;
  }

  return {
    reset() { requested = current = previous = null; fade = 1; time = 0; },
    show(character, scene = 'portrait') {
      requested = imageFor(artUrl(character, scene));
      acceptReadyImage();
    },
    update(dt) {
      time += dt;
      acceptReadyImage();
      fade = reducedMotion() ? 1 : Math.min(1, fade + dt / duration);
      if (fade === 1) previous = null;
    },
    draw(ctx, x, y, w, h, anchorY = 0.18) {
      acceptReadyImage();
      if (!current) return requested?.status ?? 'loading';
      if (previous && fade < 1) {
        paintImage(ctx, previous.image, x, y, w, h, anchorY, time);
        ctx.save();
        ctx.globalAlpha *= fade * fade * (3 - 2 * fade);
        paintImage(ctx, current.image, x, y, w, h, anchorY, time);
        ctx.restore();
      } else paintImage(ctx, current.image, x, y, w, h, anchorY, time);
      return 'ready';
    },
  };
}

export function drawAvatar(ctx, character, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#202237';
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  const status = drawArt(ctx, character, 'portrait', cx - radius, cy - radius, radius * 2, radius * 2, 0);
  if (status !== 'ready') {
    ctx.fillStyle = character.accent;
    ctx.font = `600 ${radius}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character.name[0], cx, cy);
  }
  ctx.restore();
}
