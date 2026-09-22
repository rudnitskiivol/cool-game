import { VIRTUAL_HEIGHT, MAX_VIRTUAL_WIDTH } from './config.js';

// Gameplay is authored in virtual units: height is always VIRTUAL_HEIGHT, width
// follows the device aspect ratio. Physics constants therefore never depend on
// the real screen size.
export const viewport = {
  width: 360,
  height: VIRTUAL_HEIGHT,
  scale: 1,
  dpr: 1,
  offsetX: 0,
};

export function resizeViewport(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;

  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const scale = cssH / VIRTUAL_HEIGHT;
  const width = Math.min(cssW / scale, MAX_VIRTUAL_WIDTH);

  viewport.dpr = dpr;
  viewport.scale = scale;
  viewport.width = width;
  viewport.offsetX = (cssW - width * scale) / 2;
}

export function applyTransform(ctx) {
  const s = viewport.scale * viewport.dpr;
  ctx.setTransform(s, 0, 0, s, viewport.offsetX * viewport.dpr, 0);
}
