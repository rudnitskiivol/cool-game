// Visual-novel screen for "Date Night": walks dateScript.js, shows dialogue
// and choices, and hands off to playing.js for each flying level.
//
// Enter with:
//   'new'  — start the story from the top
//   'win'  — a level was just completed; continue past it
//   'fail' — the player crashed; lose affection, then retry the same level
import { viewport } from '../viewport.js';
import { clearTap, consumeTap, getTapPos } from '../input.js';
import { drawBackLabel, drawText, hitsBackLabel, wrapText } from '../draw.js';
import { setState } from '../game.js';
import { setLocation } from '../theme.js';
import * as background from '../background.js';
import * as ground from '../ground.js';
import { COLORS, OBSTACLE_SPEED_START } from '../config.js';
import {
  AFFECTION_START,
  CHARACTER,
  FAIL_LINES,
  FAIL_PENALTY,
  SCRIPT,
  THE_END,
  endingFor,
} from '../dateScript.js';
import { drawGirl } from '../portrait.js';
import playing from './playing.js';
import menu from './menu.js';

const CHARS_PER_SEC = 45;
const POP_DURATION = 1.2;

const PORTRAIT_Y = 232;
const METER_Y = 64;
const METER_W = 120;
const BOX_Y = 404;
const BOX_H = 156;
const TEXT_SIZE = 16;
const LINE_HEIGHT = 22;
const CHOICE_TOP = 404;
const CHOICE_H = 46;
const CHOICE_GAP = 10;

let index = 0;
let affection = AFFECTION_START;
// Lines that play before the script continues: choice replies, win/fail
// reactions, the ending. Always drained before `index` moves on.
let pending = [];
let finished = false;
let mood = 'neutral';
let typeT = 0;
let time = 0;
let pop = null;

function current() {
  return pending.length ? pending[0] : SCRIPT[index];
}

// The backdrop is the location of the next level, so each scene is set where
// the date is about to go (and the ending stays at the last one).
function sceneLocation() {
  const upcoming = SCRIPT.slice(index).find((s) => s.type === 'level');
  if (upcoming) return upcoming.location;
  return [...SCRIPT].reverse().find((s) => s.type === 'level').location;
}

function changeAffection(delta) {
  if (!delta) return;
  affection = Math.max(0, Math.min(100, affection + delta));
  pop = { value: delta, t: 0 };
}

function launchLevel(step) {
  setState(playing, {
    title: step.title,
    goal: step.goal,
    location: step.location,
    difficultyOffset: step.difficultyOffset,
    startLine: step.startLine,
    onComplete: () => setState(story, 'win'),
    onFail: () => setState(story, 'fail'),
  });
}

// Settle on whatever should be on screen now, launching a level or leaving
// the story when the script says so.
function resolve() {
  typeT = 0;
  setLocation(sceneLocation());

  if (!pending.length) {
    const step = SCRIPT[index];
    if (step.type === 'level') {
      launchLevel(step);
      return;
    }
    if (step.type === 'ending') {
      if (finished) {
        setState(menu);
        return;
      }
      finished = true;
      pending = [...endingFor(affection), THE_END];
    }
  }

  const shown = current();
  if (shown.type === 'line' && shown.who === 'nika' && shown.mood) mood = shown.mood;
}

function advance() {
  if (pending.length) pending.shift();
  else index += 1;
  resolve();
}

function choiceRect(i) {
  return {
    x: 20,
    y: CHOICE_TOP + i * (CHOICE_H + CHOICE_GAP),
    w: viewport.width - 40,
    h: CHOICE_H,
  };
}

function choiceAt(x, y, step) {
  return step.options.findIndex((_, i) => {
    const r = choiceRect(i);
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  });
}

function speakerName(who) {
  if (who === 'nika') return CHARACTER.name;
  if (who === 'you') return 'You';
  return '';
}

function drawMeter(ctx) {
  const x = viewport.width / 2 - METER_W / 2 + 12;
  drawText(ctx, '♥', x - 16, METER_Y, { size: 18, color: CHARACTER.palette.accent });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.roundRect(x, METER_Y - 4, METER_W, 8, 4);
  ctx.fill();

  ctx.fillStyle = CHARACTER.palette.accent;
  ctx.beginPath();
  ctx.roundRect(x, METER_Y - 4, Math.max(8, (METER_W * affection) / 100), 8, 4);
  ctx.fill();

  if (pop) {
    const k = pop.t / POP_DURATION;
    ctx.globalAlpha = 1 - k;
    drawText(ctx, `${pop.value > 0 ? '+' : ''}${pop.value}`, x + METER_W + 22, METER_Y - k * 18, {
      size: 16,
      color: pop.value > 0 ? '#7ee2a0' : '#ff7a7a',
    });
    ctx.globalAlpha = 1;
  }
}

function drawBox(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(12, 14, 26, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
}

function drawDialogue(ctx, step) {
  const x = 12;
  const w = viewport.width - 24;
  drawBox(ctx, x, BOX_Y, w, BOX_H);

  const name = speakerName(step.who);
  if (name) {
    drawText(ctx, name, x + 16, BOX_Y + 22, {
      size: 14,
      align: 'left',
      color: step.who === 'nika' ? CHARACTER.palette.accent : COLORS.muted,
    });
  }

  const color = step.who === 'narrator' ? COLORS.muted : COLORS.text;
  const lines = wrapText(ctx, step.text, w - 32, TEXT_SIZE, '500');
  let budget = Math.floor(typeT * CHARS_PER_SEC);
  let y = BOX_Y + (name ? 52 : 34);
  for (const line of lines) {
    if (budget <= 0) break;
    drawText(ctx, line.slice(0, budget), x + 16, y, { size: TEXT_SIZE, align: 'left', weight: '500', color });
    budget -= line.length + 1;
    y += LINE_HEIGHT;
  }

  if (typeT * CHARS_PER_SEC >= step.text.length && time % 1 < 0.6) {
    drawText(ctx, '▸', x + w - 20, BOX_Y + BOX_H - 18, { size: 16, color: COLORS.muted });
  }
}

function drawChoices(ctx, step) {
  // On a pill so it stays readable over the portrait behind it.
  const pillW = 150;
  ctx.fillStyle = 'rgba(12, 14, 26, 0.85)';
  ctx.beginPath();
  ctx.roundRect(viewport.width / 2 - pillW / 2, CHOICE_TOP - 32, pillW, 24, 12);
  ctx.fill();
  drawText(ctx, step.prompt, viewport.width / 2, CHOICE_TOP - 20, { size: 13, color: COLORS.text });

  step.options.forEach((option, i) => {
    const r = choiceRect(i);
    drawBox(ctx, r.x, r.y, r.w, r.h);
    const lines = wrapText(ctx, option.text, r.w - 24, 14, '600');
    const top = r.y + r.h / 2 - ((lines.length - 1) * 17) / 2;
    lines.forEach((line, j) => {
      drawText(ctx, line, viewport.width / 2, top + j * 17, { size: 14 });
    });
  });
}

const story = {
  enter(arg) {
    if (arg === 'new') {
      index = 0;
      affection = AFFECTION_START;
      pending = [];
      finished = false;
      mood = 'neutral';
      pop = null;
    } else if (arg === 'win') {
      const level = SCRIPT[index];
      index += 1;
      if (level.winLine) pending.push(level.winLine);
    } else if (arg === 'fail') {
      changeAffection(-FAIL_PENALTY);
      pending.push(FAIL_LINES[Math.floor(Math.random() * FAIL_LINES.length)]);
    }
    // A tap buffered during the level's final frames must not skip the
    // reaction line before it's even been read.
    clearTap();
    resolve();
  },

  update(dt) {
    time += dt;
    typeT += dt;
    if (pop) {
      pop.t += dt;
      if (pop.t >= POP_DURATION) pop = null;
    }
    background.update(dt, OBSTACLE_SPEED_START * 0.25);
    ground.update(dt, OBSTACLE_SPEED_START * 0.25);

    if (!consumeTap()) return;
    const { x, y } = getTapPos();

    if (hitsBackLabel(x, y)) {
      setState(menu);
      return;
    }

    const step = current();
    if (step.type === 'choice') {
      const i = choiceAt(x, y, step);
      if (i < 0) return;
      const option = step.options[i];
      changeAffection(option.delta);
      pending.push(option.reply);
      index += 1;
      resolve();
      return;
    }

    // First tap finishes the typewriter, the next one advances.
    if (typeT * CHARS_PER_SEC < step.text.length) {
      typeT = step.text.length / CHARS_PER_SEC;
      return;
    }
    advance();
  },

  render(ctx, alpha) {
    background.render(ctx, alpha);
    ground.render(ctx, alpha);

    ctx.fillStyle = 'rgba(8, 8, 16, 0.35)';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    drawGirl(ctx, viewport.width / 2, PORTRAIT_Y, mood, time, CHARACTER.palette);
    drawMeter(ctx);
    drawBackLabel(ctx, '‹ menu');

    const step = current();
    if (step.type === 'choice') drawChoices(ctx, step);
    else drawDialogue(ctx, step);
  },
};

export default story;
