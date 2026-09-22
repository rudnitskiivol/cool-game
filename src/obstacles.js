import { viewport } from './viewport.js';
import {
  COLORS,
  GROUND_HEIGHT,
  OBSTACLE_MARGIN,
  OBSTACLE_WIDTH,
  PLAYER_HITBOX_FORGIVENESS,
  PLAYER_RADIUS,
  PLAYER_X,
} from './config.js';
import { gapForScore, spacingForScore, speedForScore } from './difficulty.js';

// Pipe pairs: { x, prevX, gapY, gap, scored }. gapY is the y of the top edge
// of the gap; the gap's bottom edge is gapY + gap. `gap` is captured once at
// spawn time from the current difficulty ramp — it must NOT be re-read from
// a global later, or every on-screen pipe would resize around the player as
// the ramp keeps moving. Kept as a plain array — a handful of live obstacles
// doesn't need pooling.
let obstacles = [];

function floorY() {
  return viewport.height - GROUND_HEIGHT;
}

function randomGapY(gap) {
  const min = OBSTACLE_MARGIN;
  const max = floorY() - OBSTACLE_MARGIN - gap;
  return min + Math.random() * (max - min);
}

function spawn(x, gap) {
  obstacles.push({ x, prevX: x, gapY: randomGapY(gap), gap, scored: false });
}

export function reset() {
  obstacles = [];
  spawn(viewport.width + OBSTACLE_WIDTH, gapForScore(0));
}

export function update(dt, score) {
  const speed = speedForScore(score);
  const spacing = spacingForScore(score);

  for (const o of obstacles) {
    o.prevX = o.x;
    o.x -= speed * dt;
  }

  // Despawn once fully off the left edge.
  obstacles = obstacles.filter((o) => o.x + OBSTACLE_WIDTH > 0);

  // Spawn by horizontal spacing rather than a timer, so this stays correct
  // as speed changes. Clamp to viewport.width so the new pipe always starts
  // fully off the right edge — without this, a frame that overshoots the
  // spacing threshold could spawn a pipe a couple of units on-screen,
  // popping a visible sliver into existence.
  const last = obstacles[obstacles.length - 1];
  if (!last || last.x <= viewport.width - spacing) {
    const x = Math.max(viewport.width, (last ? last.x : viewport.width) + spacing);
    spawn(x, gapForScore(score));
  }
}

// Purely visual: collapse the interpolation source onto the current position
// so a frozen (hitstop / game over) frame holds still instead of shivering as
// `alpha` keeps sweeping between two different x values.
export function freeze() {
  for (const o of obstacles) o.prevX = o.x;
}

export function render(ctx, alpha) {
  ctx.fillStyle = COLORS.pipe;
  for (const o of obstacles) {
    const x = o.prevX + (o.x - o.prevX) * alpha;

    ctx.fillRect(x, 0, OBSTACLE_WIDTH, o.gapY);
    ctx.fillRect(x, o.gapY + o.gap, OBSTACLE_WIDTH, viewport.height - (o.gapY + o.gap));
  }
}

function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

export function hits(playerY) {
  const r = PLAYER_RADIUS - PLAYER_HITBOX_FORGIVENESS;

  for (const o of obstacles) {
    if (
      circleHitsRect(PLAYER_X, playerY, r, o.x, 0, OBSTACLE_WIDTH, o.gapY) ||
      circleHitsRect(PLAYER_X, playerY, r, o.x, o.gapY + o.gap, OBSTACLE_WIDTH, floorY() - (o.gapY + o.gap))
    ) {
      return true;
    }
  }

  return false;
}

export function collectPassed(playerX) {
  let passed = 0;
  for (const o of obstacles) {
    if (!o.scored && o.x + OBSTACLE_WIDTH < playerX) {
      o.scored = true;
      passed += 1;
    }
  }
  return passed;
}
