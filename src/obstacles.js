import { viewport } from './viewport.js';
import {
  GROUND_HEIGHT,
  OBSTACLE_MARGIN,
  OBSTACLE_WIDTH,
  PIPE_CAP_HEIGHT,
  PIPE_CAP_OVERHANG,
  PIPE_HIGHLIGHT_WIDTH,
  PIPE_HIGHLIGHT_X,
  PLAYER_HITBOX_FORGIVENESS,
  PLAYER_RADIUS,
} from './config.js';
import { gapForScore, spacingForScore, speedForScore } from './difficulty.js';
import { current as theme } from './theme.js';

// Pipe pairs: { x, prevX, kind, scored, ... }. `kind` is either 'pipe' (the
// original full-width column, one gapY) or 'twinGap' (the column split into
// two independent half-width strips, each with its own gapY — this is what
// makes horizontal drift matter, since the player must line up with whichever
// half their trajectory suits). Kept as a plain array — a handful of live
// obstacles doesn't need pooling.
let obstacles = [];

// Which kinds the active location allows, and how often to roll a twin-gap
// over a classic pipe. A run's location never changes mid-flight, so this is
// captured once by reset() instead of threaded through every update() call.
let allowTwinGap = false;
let twinGapWeight = 0;

function floorY() {
  return viewport.height - GROUND_HEIGHT;
}

function randomGapY(gap) {
  const min = OBSTACLE_MARGIN;
  const max = floorY() - OBSTACLE_MARGIN - gap;
  return min + Math.random() * (max - min);
}

function pickKind() {
  return allowTwinGap && Math.random() < twinGapWeight ? 'twinGap' : 'pipe';
}

function spawn(x, score) {
  const kind = pickKind();
  const gap = gapForScore(score);

  if (kind === 'twinGap') {
    const halfWidth = OBSTACLE_WIDTH / 2;
    obstacles.push({
      x,
      prevX: x,
      kind,
      scored: false,
      halfWidth,
      left: { gapY: randomGapY(gap), gap },
      right: { gapY: randomGapY(gap), gap },
    });
  } else {
    obstacles.push({ x, prevX: x, kind, scored: false, gapY: randomGapY(gap), gap });
  }
}

// One or two vertical strips per obstacle (two for twinGap), each an
// independent gap column, so render/hits can treat both kinds uniformly.
function strips(o, x) {
  if (o.kind === 'twinGap') {
    return [
      { x, width: o.halfWidth, gapY: o.left.gapY, gap: o.left.gap },
      { x: x + o.halfWidth, width: o.halfWidth, gapY: o.right.gapY, gap: o.right.gap },
    ];
  }
  return [{ x, width: OBSTACLE_WIDTH, gapY: o.gapY, gap: o.gap }];
}

// options: { kinds: string[], twinGapWeight: number } — from the active
// location (see content.js). Defaults to classic pipes only.
export function reset(options = {}) {
  allowTwinGap = (options.kinds ?? ['pipe']).includes('twinGap');
  twinGapWeight = options.twinGapWeight ?? 0;
  obstacles = [];
  spawn(viewport.width + OBSTACLE_WIDTH, 0);
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
    spawn(x, score);
  }
}

// Purely visual: collapse the interpolation source onto the current position
// so a frozen (hitstop / game over) frame holds still instead of shivering as
// `alpha` keeps sweeping between two different x values.
export function freeze() {
  for (const o of obstacles) o.prevX = o.x;
}

// Render only — nothing below changes an obstacle's position or extent.
// Drawn in three passes (shafts, highlights, caps) so fillStyle is set three
// times per frame instead of three times per pipe.
//
// The cap is flush with the shaft (PIPE_CAP_OVERHANG is 0): hits() collides
// against the plain strip-width rectangle, so a cap wider than the shaft
// would be visible pipe that the player passes straight through.
export function render(ctx, alpha) {
  const capX = -PIPE_CAP_OVERHANG;

  ctx.fillStyle = theme.pipe;
  for (const o of obstacles) {
    const x = o.prevX + (o.x - o.prevX) * alpha;
    for (const s of strips(o, x)) {
      ctx.fillRect(s.x, 0, s.width, s.gapY);
      ctx.fillRect(s.x, s.gapY + s.gap, s.width, viewport.height - (s.gapY + s.gap));
    }
  }

  ctx.fillStyle = theme.pipeHighlight;
  for (const o of obstacles) {
    const x = o.prevX + (o.x - o.prevX) * alpha;
    for (const s of strips(o, x)) {
      const hx = s.x + PIPE_HIGHLIGHT_X;
      ctx.fillRect(hx, 0, PIPE_HIGHLIGHT_WIDTH, s.gapY);
      ctx.fillRect(hx, s.gapY + s.gap, PIPE_HIGHLIGHT_WIDTH, viewport.height - (s.gapY + s.gap));
    }
  }

  ctx.fillStyle = theme.pipeCap;
  for (const o of obstacles) {
    const x = o.prevX + (o.x - o.prevX) * alpha;
    for (const s of strips(o, x)) {
      const capW = s.width + PIPE_CAP_OVERHANG * 2;
      // OBSTACLE_MARGIN keeps both shafts far taller than the cap, so neither
      // band can spill past the end of the pipe it belongs to.
      ctx.fillRect(s.x + capX, s.gapY - PIPE_CAP_HEIGHT, capW, PIPE_CAP_HEIGHT);
      ctx.fillRect(s.x + capX, s.gapY + s.gap, capW, PIPE_CAP_HEIGHT);
    }
  }
}

function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

export function hits(playerX, playerY) {
  const r = PLAYER_RADIUS - PLAYER_HITBOX_FORGIVENESS;

  for (const o of obstacles) {
    for (const s of strips(o, o.x)) {
      if (
        circleHitsRect(playerX, playerY, r, s.x, 0, s.width, s.gapY) ||
        circleHitsRect(playerX, playerY, r, s.x, s.gapY + s.gap, s.width, floorY() - (s.gapY + s.gap))
      ) {
        return true;
      }
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
