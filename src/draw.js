import { COLORS, GROUND_HEIGHT, MUTE_BTN_RADIUS, SHAKE_EDGE_MARGIN } from './config.js';
import { viewport } from './viewport.js';
import { current as theme } from './theme.js';

// The ground is overdrawn past every edge by the shake margin: without it a
// vertical shake would lift the ground and expose a sliver of sky along the
// bottom of the screen at the exact moment the player is looking at it.
export function drawGround(ctx) {
  ctx.fillStyle = theme.ground;
  ctx.fillRect(
    -SHAKE_EDGE_MARGIN,
    viewport.height - GROUND_HEIGHT,
    viewport.width + SHAKE_EDGE_MARGIN * 2,
    GROUND_HEIGHT + SHAKE_EDGE_MARGIN,
  );
}

export function drawText(ctx, text, x, y, options = {}) {
  const {
    size = 20,
    color = COLORS.text,
    align = 'center',
    weight = '600',
  } = options;

  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// A small speaker glyph drawn with plain paths (no font-dependent icon), so
// it renders identically everywhere. A diagonal slash stands in for a mute
// state; sound waves for an active one.
export function drawMuteButton(ctx, x, y, muted) {
  const r = MUTE_BTN_RADIUS;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.text;
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.lineTo(-2, -4);
  ctx.lineTo(3, -8);
  ctx.lineTo(3, 8);
  ctx.lineTo(-2, 4);
  ctx.lineTo(-7, 4);
  ctx.closePath();
  ctx.fill();

  if (muted) {
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(8, 8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(2, 0, 6, -0.6, 0.6);
    ctx.stroke();
  }

  ctx.restore();
}

// A plain top-left text link back to the menu, used by every screen that
// isn't the menu itself (hub, playing, game over). The hit box is padded
// generously rather than measured against the rendered text, since canvas
// text width varies by font/device and this only needs to cover the label.
export const BACK_LABEL_X = 16;
export const BACK_LABEL_Y = 28;
const BACK_HIT_HALF_W = 70;
const BACK_HIT_HALF_H = 18;

export function drawBackLabel(ctx, label) {
  drawText(ctx, label, BACK_LABEL_X, BACK_LABEL_Y, { size: 16, align: 'left', color: COLORS.muted });
}

export function hitsBackLabel(x, y) {
  return (
    x >= BACK_LABEL_X - 10 &&
    x <= BACK_LABEL_X + BACK_HIT_HALF_W &&
    y >= BACK_LABEL_Y - BACK_HIT_HALF_H &&
    y <= BACK_LABEL_Y + BACK_HIT_HALF_H
  );
}
