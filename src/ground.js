// The ground slab plus its scrolling surface marks.
//
// The ground sits at the same depth as the pipes, so it scrolls at exactly
// their speed — at high difficulty it was the only static thing left on
// screen, which flattened the sense of motion.
//
// The base fill still comes from drawGround(), which owns the
// SHAKE_EDGE_MARGIN overdraw that stops a vertical shake exposing sky along
// the bottom edge. The marks drawn here are overdrawn horizontally for the
// same reason.
import { viewport } from './viewport.js';
import { drawGround } from './draw.js';
import {
  COLORS,
  GROUND_EDGE_HEIGHT,
  GROUND_HEIGHT,
  GROUND_SPEED_FACTOR,
  GROUND_STRIPE_HEIGHT,
  GROUND_STRIPE_TILE,
  GROUND_STRIPE_WIDTH,
  GROUND_STRIPE_Y,
  SHAKE_EDGE_MARGIN,
} from './config.js';

let offset = 0;
let prevOffset = 0;

export function update(dt, speed) {
  prevOffset = offset;
  offset = (offset + speed * GROUND_SPEED_FACTOR * dt) % GROUND_STRIPE_TILE;
}

// Collapse previous onto current so a frozen death frame holds still instead
// of shivering as `alpha` keeps sweeping between two different offsets.
export function freeze() {
  prevOffset = offset;
}

export function render(ctx, alpha) {
  drawGround(ctx);

  const top = viewport.height - GROUND_HEIGHT;
  const width = viewport.width + SHAKE_EDGE_MARGIN * 2;

  ctx.fillStyle = COLORS.groundLine;

  // Static top edge: it defines the ground/sky boundary. Scrolling it would
  // look identical, so it doesn't.
  ctx.fillRect(-SHAKE_EDGE_MARGIN, top, width, GROUND_EDGE_HEIGHT);

  // The offset wraps modulo the tile, so a wrapped step reads as a jump
  // backwards. Unwrap it before interpolating.
  const end = offset < prevOffset ? offset + GROUND_STRIPE_TILE : offset;
  const off = (prevOffset + (end - prevOffset) * alpha) % GROUND_STRIPE_TILE;
  const stripeY = top + GROUND_STRIPE_Y;
  const limit = viewport.width + GROUND_STRIPE_TILE;

  for (let x = -GROUND_STRIPE_TILE; x < limit; x += GROUND_STRIPE_TILE) {
    ctx.fillRect(x - off, stripeY, GROUND_STRIPE_WIDTH, GROUND_STRIPE_HEIGHT);
  }
}
