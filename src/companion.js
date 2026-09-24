// Nika riding along during a story level: a small portrait plus a speech
// bubble for short reactions. Both sit on the ground strip, the one part of
// the screen that is never play space, so they can't hide a pipe or the bird.
import { viewport } from './viewport.js';
import { GROUND_HEIGHT } from './config.js';
import { drawText, wrapText } from './draw.js';
import { drawGirl } from './portrait.js';
import { CHARACTER } from './dateScript.js';

const TAU = Math.PI * 2;
const LINE_TIME = 2.4;
const FADE = 0.2;
const AVATAR_R = 24;
const AVATAR_SCALE = 0.42;
const TEXT_SIZE = 13;
const LINE_HEIGHT = 16;
const PAD = 10;
const MARGIN = 12;

let mood = 'neutral';
let text = null;
let t = 0;
let time = 0;

export function reset() {
  mood = 'neutral';
  text = null;
  t = 0;
}

export function isTalking() {
  return text !== null;
}

export function say(line, lineMood) {
  text = line;
  t = 0;
  mood = lineMood;
}

export function update(dt) {
  time += dt;
  if (!text) return;
  t += dt;
  if (t >= LINE_TIME) {
    text = null;
    mood = 'neutral';
  }
}

function drawAvatar(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(12, 14, 26, 0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, AVATAR_R, 0, TAU);
  ctx.fill();
  ctx.clip();
  ctx.scale(AVATAR_SCALE, AVATAR_SCALE);
  drawGirl(ctx, 0, 14, mood, time, CHARACTER.palette);
  ctx.restore();

  ctx.strokeStyle = CHARACTER.palette.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, AVATAR_R, 0, TAU);
  ctx.stroke();
}

function drawBubble(ctx, cx, cy) {
  const right = cx - AVATAR_R - 10;
  const lines = wrapText(ctx, text, right - MARGIN - PAD * 2, TEXT_SIZE).slice(0, 2);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + PAD * 2;
  const h = lines.length * LINE_HEIGHT + 12;
  const x = right - w;
  const y = cy - h / 2;

  ctx.globalAlpha = Math.max(0, Math.min(1, t / FADE, (LINE_TIME - t) / FADE));
  ctx.fillStyle = 'rgba(12, 14, 26, 0.92)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  // Tail pointing at the avatar.
  ctx.beginPath();
  ctx.moveTo(right - 1, cy - 6);
  ctx.lineTo(right + 7, cy);
  ctx.lineTo(right - 1, cy + 6);
  ctx.fill();

  const top = cy - ((lines.length - 1) * LINE_HEIGHT) / 2;
  lines.forEach((line, i) => {
    drawText(ctx, line, x + PAD, top + i * LINE_HEIGHT, { size: TEXT_SIZE, align: 'left' });
  });
  ctx.globalAlpha = 1;
}

export function render(ctx) {
  const cy = viewport.height - GROUND_HEIGHT / 2;
  const cx = viewport.width - MARGIN - AVATAR_R;
  drawAvatar(ctx, cx, cy);
  if (text) drawBubble(ctx, cx, cy);
}
