import { viewport } from '../viewport.js';
import { consumeTap, getTapPos } from '../input.js';
import { drawBackLabel, drawText, hitsBackLabel } from '../draw.js';
import { earnCoins, game, recordScore, setState } from '../game.js';
import { findSkin } from '../content.js';
import { setLocation } from '../theme.js';
import gameover from './gameover.js';
import menu from './menu.js';
import * as obstacles from '../obstacles.js';
import * as background from '../background.js';
import * as ground from '../ground.js';
import * as effects from '../effects.js';
import { drawPlayer } from '../player.js';
import { speedForScore } from '../difficulty.js';
import * as audio from '../audio.js';
import {
  COLORS,
  DEATH_FREEZE,
  FLASH_DEATH,
  GRAVITY,
  GROUND_HEIGHT,
  HUD_BEST_SIZE,
  HUD_BEST_Y,
  HUD_SCORE_SIZE,
  HUD_SCORE_Y,
  JUMP_IMPULSE,
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

// How long a story level's title stays up before fading out.
const LEVEL_TITLE_TIME = 2.2;

// angle/squash are presentation-only; the simulation still knows nothing
// about them. Each keeps a prev value so render() can interpolate.
const player = { y: 0, prevY: 0, vy: 0, angle: 0, prevAngle: 0, squash: 0, prevSquash: 0 };

// null for the endless mode. For a story level (see states/story.js):
// { title, goal, location, difficultyOffset, onComplete, onFail }.
let level = null;
let levelT = 0;

// A single ring left behind at the flap point. It drifts left with the world
// so it reads as "the air the bird pushed off", not a HUD decal.
const puff = { x: 0, prevX: 0, y: 0, t: PUFF_DURATION };

let score = 0;
let scorePop = 0;
let prevScorePop = 0;

// Hitstop. Death is fully resolved the instant it happens (score recorded,
// collision settled); this only delays the visual hand-off to game over.
let dying = false;
let dyingT = 0;

function tiltTarget(vy) {
  if (vy < 0) {
    const t = Math.min(vy / JUMP_IMPULSE, 1);
    return PLAYER_TILT_UP * t;
  }
  const t = Math.min(vy / PLAYER_TILT_FALL_VY, 1);
  return PLAYER_TILT_DOWN * t;
}

function beginDeath() {
  dying = true;
  dyingT = 0;

  effects.shake(SHAKE_DEATH);
  effects.flash(FLASH_DEATH);

  // Everything stops moving this frame, so collapse prev onto current or the
  // frozen frame would shiver as `alpha` keeps sweeping.
  player.prevY = player.y;
  player.prevAngle = player.angle;
  player.prevSquash = player.squash;
  puff.prevX = puff.x;
  prevScorePop = scorePop;
  obstacles.freeze();
  background.freeze();
  ground.freeze();
}

const playing = {
  enter(storyLevel = null) {
    level = storyLevel;
    levelT = 0;
    setLocation(level ? level.location : game.location);

    player.y = viewport.height * 0.4;
    player.prevY = player.y;
    player.vy = 0;
    player.angle = 0;
    player.prevAngle = 0;
    player.squash = 0;
    player.prevSquash = 0;
    puff.t = PUFF_DURATION;
    score = 0;
    scorePop = 0;
    prevScorePop = 0;
    dying = false;
    dyingT = 0;
    effects.reset();
    obstacles.reset();
  },

  update(dt) {
    if (dying) {
      dyingT += dt;
      if (dyingT >= DEATH_FREEZE) {
        if (level) level.onFail();
        else setState(gameover);
      }
      return;
    }

    levelT += dt;

    player.prevAngle = player.angle;
    player.prevSquash = player.squash;
    prevScorePop = scorePop;
    puff.prevX = puff.x;

    if (consumeTap()) {
      const { x, y } = getTapPos();
      if (hitsBackLabel(x, y)) {
        setState(menu);
        return;
      }

      player.vy = JUMP_IMPULSE;
      player.squash = 1;
      puff.t = 0;
      puff.x = PLAYER_X;
      puff.prevX = PLAYER_X;
      puff.y = player.y;
      audio.flap();
    }

    player.prevY = player.y;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    const ceiling = PLAYER_RADIUS;
    const floor = viewport.height - GROUND_HEIGHT - PLAYER_RADIUS;

    if (player.y < ceiling) {
      player.y = ceiling;
      player.vy = 0;
    }

    // Ease toward the velocity-derived tilt. Separate rates: the nose whips
    // up on a flap, then noses over slowly.
    const target = tiltTarget(player.vy);
    const rate = target < player.angle ? PLAYER_TILT_RISE_RATE : PLAYER_TILT_FALL_RATE;
    player.angle += (target - player.angle) * (1 - Math.exp(-rate * dt));

    if (player.squash > 0) player.squash = Math.max(0, player.squash - dt / SQUASH_DURATION);
    if (scorePop > 0) scorePop = Math.max(0, scorePop - dt / SCORE_POP_DURATION);

    // Later story levels start partway up the difficulty ramp.
    const difficulty = score + (level ? level.difficultyOffset : 0);
    const worldSpeed = speedForScore(difficulty);
    if (puff.t < PUFF_DURATION) {
      puff.t += dt;
      puff.x -= worldSpeed * dt;
    }
    background.update(dt, worldSpeed);
    ground.update(dt, worldSpeed);

    obstacles.update(dt, difficulty);
    const gained = obstacles.collectPassed(PLAYER_X);
    if (gained > 0) scorePop = 1;
    score += gained;
    // Pitch nudges up with the run's score, so a streak of pipes feels like
    // it's building rather than repeating the same blip.
    if (gained > 0) audio.score(score);

    if (player.y >= floor || obstacles.hits(player.y)) {
      player.y = Math.min(player.y, floor);
      beginDeath();
      audio.death();
      // Story crashes cost affection, not a run: they don't touch best/coins.
      if (level) return;
      // Read before recordScore(), which overwrites game.best the instant
      // this run beats it.
      const isNewBest = score > game.best;
      recordScore(score);
      earnCoins(score);
      if (isNewBest) audio.newBest();
      return;
    }

    if (level && score >= level.goal) {
      earnCoins(score);
      audio.newBest();
      level.onComplete();
    }
  },

  // The world without the HUD. Game over reuses this to keep the frozen
  // death frame on screen instead of hard-cutting to an empty scene.
  renderWorld(ctx, alpha) {
    const y = player.prevY + (player.y - player.prevY) * alpha;
    const angle = player.prevAngle + (player.angle - player.prevAngle) * alpha;
    const squash = player.prevSquash + (player.squash - player.prevSquash) * alpha;

    background.render(ctx, alpha);
    obstacles.render(ctx, alpha);

    ground.render(ctx, alpha);

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

    drawPlayer(ctx, PLAYER_X, y, angle, squash, findSkin(game.skin).colors);
  },

  render(ctx, alpha) {
    playing.renderWorld(ctx, alpha);

    drawBackLabel(ctx, '‹ menu');

    // Scaled about its own centre, so the pop never shifts the HUD layout.
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

    drawText(ctx, level ? `of ${level.goal}` : `best ${game.best}`, viewport.width / 2, HUD_BEST_Y, {
      size: HUD_BEST_SIZE,
      color: COLORS.muted,
    });

    if (level && levelT < LEVEL_TITLE_TIME) {
      ctx.globalAlpha = Math.min(1, (LEVEL_TITLE_TIME - levelT) / 0.5);
      drawText(ctx, level.title, viewport.width / 2, HUD_BEST_Y + 40, { size: 18 });
      ctx.globalAlpha = 1;
    }
  },
};

export default playing;
