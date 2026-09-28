import { viewport } from '../viewport.js';
import { consumeTap, getTapPos, isPointerDown } from '../input.js';
import { drawGlassCard, drawRoundedRect, drawText } from '../draw.js';
import { earnCoins, game, recordScore, setState } from '../game.js';
import { findSkin } from '../content.js';
import { FLIGHT_LINES } from '../dateScript.js';
import { getFlightProfile } from '../flightProfiles.js';
import * as companion from '../companion.js';
import { setLocation } from '../theme.js';
import gameover from './gameover.js';
import menu from './menu.js';
import * as obstacles from '../obstacles.js';
import * as collectibles from '../collectibles.js';
import * as weather from '../weather.js';
import * as background from '../background.js';
import * as ground from '../ground.js';
import * as effects from '../effects.js';
import { drawPlayer } from '../player.js';
import * as audio from '../audio.js';
import { haptic } from '../haptics.js';
import {
  COLORS,
  DEATH_FREEZE,
  FLASH_DEATH,
  GROUND_HEIGHT,
  HUD_BEST_SIZE,
  HUD_BEST_Y,
  HUD_SCORE_SIZE,
  HUD_SCORE_Y,
  PLAYER_RADIUS,
  PLAYER_TILT_DOWN,
  PLAYER_TILT_FALL_RATE,
  PLAYER_TILT_FALL_VY,
  PLAYER_TILT_RISE_RATE,
  PLAYER_TILT_UP,
  PLAYER_X,
  PUFF_ALPHA,
  PUFF_DURATION,
  PUFF_END_RADIUS,
  PUFF_LINE_WIDTH,
  PUFF_START_RADIUS,
  SCORE_POP_DURATION,
  SCORE_POP_SCALE,
  SHAKE_DEATH,
  SQUASH_DURATION,
} from '../config.js';

const START_LINE_DELAY = 0.8;
const NEAR_MISS = 10;
const PAUSE_BTN_RADIUS = 16;
const PAUSE_BTN_HIT_PAD = 8;

// Angle and squash are presentation-only
const player = { y: 0, prevY: 0, vy: 0, angle: 0, prevAngle: 0, squash: 0, prevSquash: 0 };
const playerHistory = [];

let level = null;
let profile = null;
let levelT = 0;
let saidStart = false;
let saidAlmost = false;
let checkpointReached = false;
let checkpointBannerT = 0;
let isGliding = false;
let invulnerableT = 0;
let minClearance = Infinity;

const puff = { x: 0, prevX: 0, y: 0, t: PUFF_DURATION };

let score = 0;
let scorePop = 0;
let prevScorePop = 0;

let dying = false;
let dyingT = 0;
let landingT = 0;
let paused = false;

// Collectibles hook into obstacle spawns
obstacles.onSpawn((obstacle, pipeIndex) => {
  collectibles.spawnForObstacle(obstacle, pipeIndex);
});

function pick(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function tiltTarget(vy, jumpImpulse) {
  if (vy < 0) {
    const t = Math.min(vy / jumpImpulse, 1);
    return PLAYER_TILT_UP * t;
  }
  const t = Math.min(vy / PLAYER_TILT_FALL_VY, 1);
  return PLAYER_TILT_DOWN * t;
}

// Story mode keeps the top strip for the journey HUD, so the button sits below it.
function pauseButtonPos() {
  return { x: 32, y: level ? 100 : 32 };
}

function hitsPauseButton(x, y) {
  const { x: bx, y: by } = pauseButtonPos();
  const r = PAUSE_BTN_RADIUS + PAUSE_BTN_HIT_PAD;
  return (x - bx) * (x - bx) + (y - by) * (y - by) <= r * r;
}

function pauseLayout() {
  const w = Math.min(viewport.width - 64, 260);
  const x = (viewport.width - w) / 2;
  const cy = viewport.height / 2;
  return {
    resumeBtn: { x, y: cy - 8, w, h: 52 },
    exitBtn: { x, y: cy + 56, w, h: 44 },
    titleY: cy - 44,
  };
}

function hitsRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function drawPauseButton(ctx) {
  const { x, y } = pauseButtonPos();
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(x, y, PAUSE_BTN_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(x - 5, y - 6, 3.5, 12);
  ctx.fillRect(x + 1.5, y - 6, 3.5, 12);
  ctx.restore();
}

function drawPauseOverlay(ctx) {
  const { resumeBtn, exitBtn, titleY } = pauseLayout();
  const cx = viewport.width / 2;

  ctx.fillStyle = 'rgba(10, 12, 22, 0.7)';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  drawText(ctx, 'Пауза', cx, titleY, { size: 24, weight: '700' });

  drawGlassCard(ctx, resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h, {
    radius: 14,
    fill: 'rgba(255, 107, 139, 0.24)',
    border: 'rgba(255, 182, 202, 0.5)',
  });
  drawText(ctx, 'Продолжить', cx, resumeBtn.y + resumeBtn.h / 2, { size: 16, weight: '700' });

  drawGlassCard(ctx, exitBtn.x, exitBtn.y, exitBtn.w, exitBtn.h, {
    radius: 12,
    fill: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.13)',
  });
  drawText(ctx, 'Выйти в меню', cx, exitBtn.y + exitBtn.h / 2, { size: 14, weight: '500', color: COLORS.muted });
}

function freezeWorld() {
  player.prevY = player.y;
  player.prevAngle = player.angle;
  player.prevSquash = player.squash;
  puff.prevX = puff.x;
  prevScorePop = scorePop;
  obstacles.freeze();
  collectibles.freeze();
  background.freeze();
  ground.freeze();
}

function beginDeath() {
  dying = true;
  dyingT = 0;

  effects.shake(SHAKE_DEATH * 0.7);
  effects.flash(FLASH_DEATH * 0.5);
  freezeWorld();
}

function triggerDefeat() {
  beginDeath();
  audio.death();
  haptic.hit();

  if (level) {
    if (checkpointReached) {
      level.startScore = Math.floor(level.goal / 2);
    }
    return;
  }
  const isNewBest = score > game.best;
  recordScore(score);
  earnCoins(score);
  if (isNewBest) audio.newBest();
}

const playing = {
  enter(storyLevel = null) {
    level = storyLevel;
    profile = storyLevel?.profile || getFlightProfile(storyLevel?.character);
    levelT = 0;
    saidStart = false;
    saidAlmost = false;
    minClearance = Infinity;
    checkpointReached = Boolean(level?.checkpointReached);
    checkpointBannerT = 0;
    isGliding = false;
    invulnerableT = 0;

    companion.reset(level?.character);
    collectibles.reset(level?.character);
    weather.reset(level?.character);
    obstacles.setProfile(profile);
    audio.setAudioProfile(profile.soundProfile);
    setLocation(level ? level.location : game.location);

    player.y = viewport.height * 0.42;
    player.prevY = player.y;
    player.vy = 0;
    player.angle = 0;
    player.prevAngle = 0;
    player.squash = 0;
    player.prevSquash = 0;
    playerHistory.length = 0;
    puff.t = PUFF_DURATION;

    score = level?.startScore ?? 0;
    scorePop = 0;
    prevScorePop = 0;
    dying = false;
    dyingT = 0;
    landingT = 0;
    paused = false;
    effects.reset();
    obstacles.reset();

    // If starting from checkpoint, give a brief safety shield
    if (score > 0) {
      invulnerableT = 1.4;
      checkpointReached = true;
    }
  },

  update(dt) {
    if (dying) {
      dyingT += dt;
      if (dyingT >= DEATH_FREEZE) {
        if (level) {
          level.onFail({
            checkpointReached,
            startScore: checkpointReached ? Math.floor(level.goal / 2) : 0,
          });
        } else {
          setState(gameover);
        }
      }
      return;
    }

    if (paused) {
      if (consumeTap()) {
        const { x, y } = getTapPos();
        const { resumeBtn, exitBtn } = pauseLayout();
        if (hitsRect(x, y, resumeBtn)) {
          paused = false;
          haptic.tap();
        } else if (hitsRect(x, y, exitBtn)) {
          haptic.tap();
          setState(menu);
        }
      }
      return;
    }

    if (invulnerableT > 0) {
      invulnerableT = Math.max(0, invulnerableT - dt);
    }

    levelT += dt;
    if (checkpointBannerT > 0) {
      checkpointBannerT = Math.max(0, checkpointBannerT - dt);
    }

    // Meaningful, contextual companion commentary
    if (level) {
      companion.update(dt);
      if (!saidStart && levelT >= START_LINE_DELAY) {
        saidStart = true;
        companion.say(level.startLine ?? pick(FLIGHT_LINES.start), 'happy');
      }

      // Final approach encouragement
      if (saidStart && !saidAlmost && score >= level.goal - 3 && landingT === 0) {
        saidAlmost = true;
        companion.say(pick(FLIGHT_LINES.almost), 'happy');
      }
    }

    player.prevAngle = player.angle;
    player.prevSquash = player.squash;
    prevScorePop = scorePop;
    puff.prevX = puff.x;

    playerHistory.push({ y: player.y, angle: player.angle, squash: player.squash });
    if (playerHistory.length > 8) playerHistory.shift();

    // Jump / Flap Input
    if (consumeTap() && landingT === 0) {
      const { x, y } = getTapPos();
      if (hitsPauseButton(x, y)) {
        paused = true;
        freezeWorld();
        haptic.tap();
        return;
      }

      const impulse = profile ? profile.jumpImpulse : -520;
      player.vy = impulse;
      player.squash = 1;
      puff.t = 0;
      puff.x = PLAYER_X;
      puff.prevX = PLAYER_X;
      puff.y = player.y;
      audio.flap();
      haptic.tap();
    }

    player.prevY = player.y;

    // Glide Mechanics
    const glideGravity = profile ? profile.glideGravity : 320;
    const glideMaxFall = profile ? profile.glideMaxFall : 140;
    const baseGravity = profile ? profile.gravity : 1800;

    isGliding = isPointerDown() && player.vy > -40;
    if (isGliding) {
      if (player.vy > glideMaxFall) {
        player.vy = Math.max(glideMaxFall, player.vy - 1400 * dt);
      } else {
        player.vy = Math.min(glideMaxFall, player.vy + glideGravity * dt);
      }
    } else {
      player.vy += baseGravity * dt;
    }
    player.y += player.vy * dt;

    const ceiling = PLAYER_RADIUS + 4;
    const floor = viewport.height - GROUND_HEIGHT - PLAYER_RADIUS;

    if (player.y < ceiling) {
      player.y = ceiling;
      player.vy = 0;
    }

    // Rotational Tilt
    const jumpImpulse = profile ? profile.jumpImpulse : -520;
    const target = isGliding && player.vy > 0 ? 0.05 : tiltTarget(player.vy, jumpImpulse);
    const rate = target < player.angle ? PLAYER_TILT_RISE_RATE : PLAYER_TILT_FALL_RATE;
    player.angle += (target - player.angle) * (1 - Math.exp(-rate * dt));

    if (player.squash > 0) player.squash = Math.max(0, player.squash - dt / SQUASH_DURATION);
    if (scorePop > 0) scorePop = Math.max(0, scorePop - dt / SCORE_POP_DURATION);

    // Speed calculation
    const currentSpeed = obstacles.getSpeed(score);
    let worldSpeed = currentSpeed;

    // Smooth landing sequence at journey's end
    if (landingT > 0) {
      landingT += dt;
      worldSpeed = currentSpeed * Math.max(0, 1 - landingT / 1.4);
      player.vy = (viewport.height * 0.44 - player.y) * 3;
      player.angle *= 0.9;

      if (landingT >= 1.6) {
        earnCoins(score);
        audio.newBest();
        level.onComplete();
        return;
      }
    }

    if (puff.t < PUFF_DURATION) {
      puff.t += dt;
      puff.x -= worldSpeed * dt;
    }

    background.update(dt, worldSpeed);
    weather.update(dt, worldSpeed);
    ground.update(dt, worldSpeed);

    // Story Collectibles
    collectibles.update(dt, worldSpeed, PLAYER_X, player.y, (item) => {
      audio.collect();
      haptic.collect();
      earnCoins(1);
    });

    obstacles.update(dt, score, landingT > 0);
    if (level) minClearance = Math.min(minClearance, obstacles.gapClearance(player.y));

    const gained = obstacles.collectPassed(PLAYER_X);
    if (gained > 0 && landingT === 0) {
      scorePop = 1;
      haptic.pass();
      score += gained;
      audio.score(score);

      // Check for near miss
      if (level && minClearance < NEAR_MISS && !companion.isTalking()) {
        companion.say(pick(FLIGHT_LINES.close), 'surprised');
      }
      minClearance = Infinity;
    }

    // Journey Checkpoint (Halfway milestone)
    if (level && level.goal >= 6) {
      const mid = Math.floor(level.goal / 2);
      if (score >= mid && !checkpointReached) {
        checkpointReached = true;
        level.checkpointReached = true;
        checkpointBannerT = 2.8;
        audio.checkpoint();
        haptic.checkpoint();
        companion.say(pick(FLIGHT_LINES.halfway), 'happy');
      }
    }

    // Destination Reached -> Begin arrival landing
    if (level && score >= level.goal && landingT === 0) {
      landingT = 0.01;
      companion.say('Мы на месте! Идем на посадку… ✨', 'happy');
    }

    // Collision detection
    if ((player.y >= floor || obstacles.hits(player.y)) && landingT === 0) {
      player.y = Math.min(player.y, floor);

      if (invulnerableT > 0) {
        player.y = Math.min(player.y, floor - 4);
      } else if (game.cozyMode) {
        // In Cozy Mode: soft bounce with shield rather than harsh death
        invulnerableT = 2.0;
        player.vy = profile ? profile.jumpImpulse * 0.7 : -360;
        effects.shake(2);
        haptic.tap();
        if (level && !companion.isTalking()) {
          companion.say('Держу тебя! Летим дальше ♥', 'happy');
        }
      } else {
        triggerDefeat();
      }
    }
  },

  renderWorld(ctx, alpha) {
    const y = player.prevY + (player.y - player.prevY) * alpha;
    const angle = player.prevAngle + (player.angle - player.prevAngle) * alpha;
    const squash = player.prevSquash + (player.squash - player.prevSquash) * alpha;

    background.render(ctx, alpha);
    weather.render(ctx);
    obstacles.render(ctx, alpha);
    collectibles.render(ctx, alpha);
    ground.render(ctx, alpha);

    // Subtle glide air trails
    if (isGliding && !dying) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(PLAYER_X - 16, y - 2);
      ctx.lineTo(PLAYER_X - 28, y - 2);
      ctx.moveTo(PLAYER_X - 12, y + 5);
      ctx.lineTo(PLAYER_X - 22, y + 5);
      ctx.stroke();
      ctx.restore();
    }

    // Gentle protective aura
    if (invulnerableT > 0 && !dying) {
      ctx.save();
      const pulse = Math.sin(levelT * 14);
      ctx.globalAlpha = 0.5 + pulse * 0.2;
      ctx.strokeStyle = level?.character?.accent ?? '#ffd166';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(PLAYER_X, y, PLAYER_RADIUS + 7 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Flap puff ring
    if (puff.t < PUFF_DURATION) {
      const p = puff.t / PUFF_DURATION;
      const px = puff.prevX + (puff.x - puff.prevX) * alpha;
      ctx.globalAlpha = PUFF_ALPHA * (1 - p);
      ctx.strokeStyle = COLORS.puff;
      ctx.lineWidth = PUFF_LINE_WIDTH;
      ctx.beginPath();
      ctx.arc(px, puff.y, PUFF_START_RADIUS + (PUFF_END_RADIUS - PUFF_START_RADIUS) * p, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Soft ghost trail when gliding
    if (isGliding && !dying && playerHistory.length > 4) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      const past = playerHistory[playerHistory.length - 4];
      drawPlayer(ctx, PLAYER_X - 14, past.y, past.angle, past.squash, findSkin(game.skin).colors, level?.character?.id ?? 'classic');
      ctx.restore();
    }

    drawPlayer(ctx, PLAYER_X, y, angle, squash, findSkin(game.skin).colors, level?.character?.id ?? 'classic');
  },

  render(ctx, alpha) {
    playing.renderWorld(ctx, alpha);

    const w = viewport.width;

    if (!paused) drawPauseButton(ctx);

    if (level) {
      // =========================================================================
      // NARRATIVE JOURNEY HUD (Clean, Elegant, Immersive)
      // =========================================================================
      const barW = Math.min(w - 32, 340);
      const barX = (w - barW) / 2;
      const barY = 22;
      const barH = 50;
      const accent = level.character?.accent ?? '#ffd166';
      const goal = level.goal || 20;
      const progress = Math.min(1, score / goal);

      // Top glass card
      drawGlassCard(ctx, barX, barY, barW, barH, {
        radius: 12,
        fill: 'rgba(14, 18, 32, 0.85)',
        border: 'rgba(255, 255, 255, 0.12)',
      });

      // Endpoint labels
      const fromText = level.fromLocation || 'Старт';
      const toText = level.toLocation || level.title || 'Цель';

      drawText(ctx, fromText, barX + 12, barY + 16, {
        size: 11,
        align: 'left',
        color: '#9aa2b8',
        weight: '500',
      });

      drawText(ctx, `${score}/${goal}`, barX + barW / 2, barY + 16, {
        size: 12,
        align: 'center',
        color: accent,
        weight: '700',
      });

      drawText(ctx, toText, barX + barW - 12, barY + 16, {
        size: 11,
        align: 'right',
        color: '#e4e8f5',
        weight: '600',
      });

      // Route Progress Track
      const trackX = barX + 12;
      const trackY = barY + 34;
      const trackW = barW - 24;
      const trackH = 5;

      // Track background rail
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      drawRoundedRect(ctx, trackX, trackY, trackW, trackH, 2.5);
      ctx.fill();

      // Checkpoint pip at 50%
      const midX = trackX + trackW * 0.5;
      ctx.fillStyle = checkpointReached ? '#ffd166' : 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(midX, trackY + trackH / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Progress fill
      if (progress > 0) {
        ctx.fillStyle = accent;
        drawRoundedRect(ctx, trackX, trackY, trackW * progress, trackH, 2.5);
        ctx.fill();
      }

      // Flying bird icon along the route
      const birdX = trackX + trackW * progress;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(birdX, trackY + trackH / 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Mode Badge below the bar
      if (profile && profile.badge) {
        drawText(ctx, `${profile.badge}${game.cozyMode ? ' · ♥ Уют' : ''}`, w / 2, barY + barH + 15, {
          size: 11,
          color: '#8b93b0',
          weight: '500',
        });
      }

      // Checkpoint banner
      if (checkpointBannerT > 0) {
        ctx.save();
        const alphaVal = Math.min(1, checkpointBannerT / 0.4);
        ctx.globalAlpha = alphaVal;
        drawGlassCard(ctx, w / 2 - 95, barY + barH + 30, 190, 28, {
          radius: 8,
          fill: 'rgba(15, 20, 36, 0.92)',
          border: '#ffd166',
        });
        drawText(ctx, '★ Чекпоинт сохранён', w / 2, barY + barH + 44, {
          size: 12,
          color: '#ffd166',
          weight: '700',
        });
        ctx.restore();
      }

      companion.render(ctx);

    } else {
      // =========================================================================
      // ENDLESS ARCADE HUD
      // =========================================================================
      const pop = prevScorePop + (scorePop - prevScorePop) * alpha;
      if (pop > 0) {
        const s = 1 + SCORE_POP_SCALE * pop * pop;
        ctx.save();
        ctx.translate(viewport.width / 2, HUD_SCORE_Y);
        ctx.scale(s, s);
        drawText(ctx, String(score), 0, 0, { size: HUD_SCORE_SIZE });
        ctx.restore();
      } else {
        drawText(ctx, String(score), viewport.width / 2, HUD_SCORE_Y, { size: HUD_SCORE_SIZE });
      }

      drawText(ctx, `лучший: ${game.best}`, viewport.width / 2, HUD_BEST_Y, {
        size: HUD_BEST_SIZE,
        color: COLORS.muted,
      });

      if (game.cozyMode) {
        drawText(ctx, '♥ Уют: ВКЛ', viewport.width - 16, 28, {
          size: 12,
          align: 'right',
          color: '#ffb6ca',
          weight: '600',
        });
      }
    }

    if (paused) drawPauseOverlay(ctx);
  },
};

export default playing;
