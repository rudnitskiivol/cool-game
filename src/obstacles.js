import { viewport } from './viewport.js';
import { game } from './game.js';
import {
  COZY_GAP_BONUS,
  COZY_HITBOX_FORGIVENESS,
  GROUND_HEIGHT,
  OBSTACLE_MARGIN,
  OBSTACLE_WIDTH,
  PIPE_CAP_HEIGHT,
  PIPE_CAP_OVERHANG,
  PIPE_HIGHLIGHT_WIDTH,
  PIPE_HIGHLIGHT_X,
  PLAYER_HITBOX_FORGIVENESS,
  PLAYER_RADIUS,
  PLAYER_X,
} from './config.js';
import { gapForScore, spacingForScore, speedForScore } from './difficulty.js';
import { current as theme } from './theme.js';

let obstacles = [];
let spawnCount = 0;
let spawnListeners = [];
let currentProfile = null;
let currentStyle = 'classic';

export function onSpawn(fn) {
  spawnListeners.push(fn);
}

function floorY() {
  return viewport.height - GROUND_HEIGHT;
}

export function setStyle(styleId) {
  currentStyle = styleId ?? 'classic';
}

export function setProfile(profile) {
  currentProfile = profile;
  currentStyle = profile?.id ?? 'classic';
}

function randomGapY(gap) {
  const min = OBSTACLE_MARGIN + 10;
  const max = floorY() - OBSTACLE_MARGIN - gap - 10;
  return min + Math.random() * (max - min);
}

function fixed(key) {
  return currentProfile && !currentProfile.ramp ? currentProfile[key] : 0;
}

export function getGap(score) {
  return (fixed('gap') || gapForScore(score)) + (game.cozyMode ? COZY_GAP_BONUS : 0);
}

export function getSpacing(score) {
  return fixed('spacing') || spacingForScore(score);
}

export function getSpeed(score) {
  return fixed('speed') || speedForScore(score);
}

function spawn(x, gap) {
  const o = {
    x,
    prevX: x,
    gapY: randomGapY(gap),
    gap,
    scored: false,
  };
  obstacles.push(o);
  spawnCount++;

  for (const fn of spawnListeners) fn(o, spawnCount);
}

export function reset() {
  obstacles = [];
  spawnCount = 0;
  const initialGap = getGap(0);
  spawn(viewport.width + OBSTACLE_WIDTH, initialGap);
}

export function update(dt, score, isLanding = false) {
  const speed = getSpeed(score);
  const spacing = getSpacing(score);

  for (const o of obstacles) {
    o.prevX = o.x;
    o.x -= speed * dt;
  }

  // Despawn once off screen
  obstacles = obstacles.filter((o) => o.x + OBSTACLE_WIDTH > 0);

  // Spawn next obstacle cleanly
  const last = obstacles[obstacles.length - 1];
  if (!isLanding && (!last || last.x <= viewport.width - spacing)) {
    const x = Math.max(viewport.width, (last ? last.x : viewport.width) + spacing);
    spawn(x, getGap(score));
  }
}

export function freeze() {
  for (const o of obstacles) o.prevX = o.x;
}

export function render(ctx, alpha) {
  for (const o of obstacles) {
    const x = o.prevX + (o.x - o.prevX) * alpha;
    const topH = o.gapY;
    const botY = o.gapY + o.gap;
    const botH = floorY() - botY;

    if (currentStyle === 'aiko') {
      // --- AIKO: Kyoto Temple Bookshelves & Torii Beams ---
      // Pillars: Deep lacquered hinoki wood
      ctx.fillStyle = '#4a2c18';
      ctx.fillRect(x, 0, OBSTACLE_WIDTH, topH);
      ctx.fillRect(x, botY, OBSTACLE_WIDTH, botH);

      // Wood grain / inner shelf panels
      ctx.fillStyle = '#683f24';
      ctx.fillRect(x + 6, 0, OBSTACLE_WIDTH - 12, topH - 8);
      ctx.fillRect(x + 6, botY + 8, OBSTACLE_WIDTH - 12, botH - 8);

      // Gold-trimmed wooden lintels at gap edges
      ctx.fillStyle = '#d4a359';
      ctx.fillRect(x - 2, topH - 8, OBSTACLE_WIDTH + 4, 8);
      ctx.fillRect(x - 2, botY, OBSTACLE_WIDTH + 4, 8);

      // Hanging paper lantern on top beam
      const lanternY = topH - 22;
      ctx.fillStyle = '#b33939';
      ctx.beginPath();
      ctx.arc(x + OBSTACLE_WIDTH / 2, lanternY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffecd2';
      ctx.beginPath();
      ctx.arc(x + OBSTACLE_WIDTH / 2, lanternY, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (currentStyle === 'nika-cyberpunk') {
      // --- NIKA: Cyberpunk Firewall & Neon Pylons ---
      // Pylon base: Carbon alloy
      ctx.fillStyle = '#0f1322';
      ctx.fillRect(x, 0, OBSTACLE_WIDTH, topH);
      ctx.fillRect(x, botY, OBSTACLE_WIDTH, botH);

      // Neon cyan border lines
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, 0, OBSTACLE_WIDTH, topH);
      ctx.strokeRect(x, botY, OBSTACLE_WIDTH, botH);

      // Glowing magenta gap gate indicators
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(x - 2, topH - 6, OBSTACLE_WIDTH + 4, 6);
      ctx.fillRect(x - 2, botY, OBSTACLE_WIDTH + 4, 6);

      // Data pulses down the core
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      for (let sy = 16; sy < topH - 12; sy += 24) {
        ctx.fillRect(x + 12, sy, OBSTACLE_WIDTH - 24, 2);
      }
      for (let sy = botY + 16; sy < floorY() - 8; sy += 24) {
        ctx.fillRect(x + 12, sy, OBSTACLE_WIDTH - 24, 2);
      }

    } else if (currentStyle === 'marina') {
      // --- MARINA: Seaside Pier Columns & Brass Lanterns ---
      // Weathered navy pier wood
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, 0, OBSTACLE_WIDTH, topH);
      ctx.fillRect(x, botY, OBSTACLE_WIDTH, botH);

      // Warm timber highlights
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 8, 0, 8, topH);
      ctx.fillRect(x + 8, botY, 8, botH);

      // Brass lantern caps
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 2, topH - 8, OBSTACLE_WIDTH + 4, 8);
      ctx.fillRect(x - 2, botY, OBSTACLE_WIDTH + 4, 8);

      // Soft warm amber beacon
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.arc(x + OBSTACLE_WIDTH / 2, topH - 14, 10, 0, Math.PI * 2);
      ctx.fill();

    } else if (currentStyle === 'valeria') {
      // --- VALERIA: Heavy Arena Trussing & Ring Posts ---
      // Heavy matte steel column
      ctx.fillStyle = '#1e2029';
      ctx.fillRect(x, 0, OBSTACLE_WIDTH, topH);
      ctx.fillRect(x, botY, OBSTACLE_WIDTH, botH);

      // Industrial cross-hatching
      ctx.strokeStyle = '#474c60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let sy = 0; sy < topH - 20; sy += 30) {
        ctx.moveTo(x, sy);
        ctx.lineTo(x + OBSTACLE_WIDTH, sy + 30);
      }
      for (let sy = botY; sy < floorY() - 20; sy += 30) {
        ctx.moveTo(x, sy);
        ctx.lineTo(x + OBSTACLE_WIDTH, sy + 30);
      }
      ctx.stroke();

      // Padded red championship bumper at the gap
      ctx.fillStyle = '#e63946';
      ctx.fillRect(x - 2, topH - 10, OBSTACLE_WIDTH + 4, 10);
      ctx.fillRect(x - 2, botY, OBSTACLE_WIDTH + 4, 10);

    } else if (currentStyle === 'eva') {
      // --- EVA: 35mm Analog Film Strips & Frame Gates ---
      // Deep monochrome film base
      ctx.fillStyle = '#141416';
      ctx.fillRect(x, 0, OBSTACLE_WIDTH, topH);
      ctx.fillRect(x, botY, OBSTACLE_WIDTH, botH);

      // Film sprocket perforations along both edges
      ctx.fillStyle = '#f0f0f5';
      for (let sy = 8; sy < topH - 10; sy += 18) {
        ctx.fillRect(x + 4, sy, 5, 8);
        ctx.fillRect(x + OBSTACLE_WIDTH - 9, sy, 5, 8);
      }
      for (let sy = botY + 8; sy < floorY() - 10; sy += 18) {
        ctx.fillRect(x + 4, sy, 5, 8);
        ctx.fillRect(x + OBSTACLE_WIDTH - 9, sy, 5, 8);
      }

      // Silver frame borders
      ctx.fillStyle = '#a6b0c3';
      ctx.fillRect(x - 2, topH - 6, OBSTACLE_WIDTH + 4, 6);
      ctx.fillRect(x - 2, botY, OBSTACLE_WIDTH + 4, 6);

    } else {
      // --- CLASSIC: Clean Green Pipes with Polished Caps ---
      const capX = -PIPE_CAP_OVERHANG;
      const capW = OBSTACLE_WIDTH + PIPE_CAP_OVERHANG * 2;
      ctx.fillStyle = theme.pipe;
      ctx.fillRect(x, 0, OBSTACLE_WIDTH, topH);
      ctx.fillRect(x, botY, OBSTACLE_WIDTH, botH);

      ctx.fillStyle = theme.pipeHighlight;
      ctx.fillRect(x + PIPE_HIGHLIGHT_X, 0, PIPE_HIGHLIGHT_WIDTH, topH);
      ctx.fillRect(x + PIPE_HIGHLIGHT_X, botY, PIPE_HIGHLIGHT_WIDTH, botH);

      ctx.fillStyle = theme.pipeCap;
      ctx.fillRect(x + capX, topH - PIPE_CAP_HEIGHT, capW, PIPE_CAP_HEIGHT);
      ctx.fillRect(x + capX, botY, capW, PIPE_CAP_HEIGHT);
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

export function hits(playerY) {
  const forgiveness = game.cozyMode
    ? COZY_HITBOX_FORGIVENESS
    : (currentProfile ? currentProfile.hitboxForgiveness : PLAYER_HITBOX_FORGIVENESS);
  const r = PLAYER_RADIUS - forgiveness;

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

export function gapClearance(playerY) {
  const forgiveness = game.cozyMode
    ? COZY_HITBOX_FORGIVENESS
    : (currentProfile ? currentProfile.hitboxForgiveness : PLAYER_HITBOX_FORGIVENESS);
  const r = PLAYER_RADIUS - forgiveness;
  let best = Infinity;
  for (const o of obstacles) {
    if (o.x > PLAYER_X + r || o.x + OBSTACLE_WIDTH < PLAYER_X - r) continue;
    best = Math.min(best, playerY - r - o.gapY, o.gapY + o.gap - (playerY + r));
  }
  return best;
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
