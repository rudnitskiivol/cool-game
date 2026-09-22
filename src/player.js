// Player rendering. The body is still a circle, but a beak and an eye give
// it a facing direction — without them the rotation would be invisible.
//
// Transform order matters: translate -> scale -> rotate. Scaling before the
// rotation means the squash/stretch always runs along the WORLD vertical
// (the direction of motion), not along the tilted body axis.
import {
  COLORS,
  PLAYER_BEAK_HALF,
  PLAYER_BEAK_LENGTH,
  PLAYER_EYE_RADIUS,
  PLAYER_EYE_X,
  PLAYER_EYE_Y,
  PLAYER_RADIUS,
  SQUASH_AMOUNT,
} from './config.js';

const TAU = Math.PI * 2;

export function drawPlayer(ctx, x, y, angle, squash) {
  const stretch = SQUASH_AMOUNT * squash;

  ctx.save();
  ctx.translate(x, y);
  if (stretch !== 0) ctx.scale(1 - stretch * 0.7, 1 + stretch);
  ctx.rotate(angle);

  ctx.fillStyle = COLORS.beak;
  ctx.beginPath();
  ctx.moveTo(PLAYER_RADIUS + PLAYER_BEAK_LENGTH, 0);
  ctx.lineTo(PLAYER_RADIUS - 3, -PLAYER_BEAK_HALF);
  ctx.lineTo(PLAYER_RADIUS - 3, PLAYER_BEAK_HALF);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, TAU);
  ctx.fill();

  ctx.fillStyle = COLORS.eye;
  ctx.beginPath();
  ctx.arc(PLAYER_EYE_X, PLAYER_EYE_Y, PLAYER_EYE_RADIUS, 0, TAU);
  ctx.fill();

  ctx.restore();
}
