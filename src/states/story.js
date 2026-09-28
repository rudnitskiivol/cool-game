import { viewport } from '../viewport.js';
import { clearTap, consumeTap, getTapPos } from '../input.js';
import { drawBackLabel, drawRoundedRect, drawText, hitsBackLabel, wrapText } from '../draw.js';
import { game, setState } from '../game.js';
import { findCharacter } from '../romance.js';
import { createArtPlayer, drawArt, preloadArt, reducedMotion } from '../romanceArt.js';
import { AFFECTION_START, FAIL_LINES, FAIL_PENALTY, scriptFor, endingFor } from '../dateScript.js';
import playing from './playing.js';
import dates from './dates.js';

const CHARS_PER_SEC = 45;
const BOX_Y = 410;
const CHOICE_H = 54;
const CHOICE_GAP = 10;

let character = findCharacter();
let script = [];
let index = 0;
let affection = AFFECTION_START;
let pending = [];
let finished = false;
let betrayed = false;
let scene = '01-meeting';
let chapter = '';
let typeT = 0;
let pop = null;
let reactionT = 1;
const illustration = createArtPlayer();

const current = () => pending.length ? pending[0] : script[index];

function changeAffection(delta) {
  affection = Math.max(0, Math.min(100, affection + delta));
  pop = { value: delta, t: 0 };
}

function resolve() {
  typeT = 0;
  if (!pending.length) {
    const step = script[index];
    if (step.type === 'level') {
      setState(playing, {
        ...step, character,
        onComplete: () => {
          delete step.startScore;
          delete step.checkpointReached;
          setState(story, 'win');
        },
        onFail: (retryInfo) => {
          if (retryInfo?.checkpointReached) {
            step.startScore = retryInfo.startScore;
            step.checkpointReached = true;
          }
          setState(story, 'fail');
        },
      });
      return;
    }
    if (step.type === 'ending') {
      if (finished) { setState(dates); return; }
      finished = true;
      pending = endingFor(character, affection, betrayed);
      chapter = betrayed || affection < 45 ? 'Утраченное доверие' : affection >= 75 ? 'Вместе' : 'Открытый финал';
    }
  }
  const shown = current();
  reactionT = 0;
  scene = shown.scene ?? scene;
  chapter = shown.chapter ?? chapter;
  preloadArt(character, [scene]);
  illustration.show(character, scene);
}

function drawBox(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(12,14,26,0.95)';
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, w, h, 14); ctx.fill(); ctx.stroke();
}

function drawMeter(ctx) {
  const x = viewport.width / 2 - 46;
  drawText(ctx, '♥', x - 18, 62, { size: 18, color: character.accent });
  ctx.fillStyle = '#353546';
  drawRoundedRect(ctx, x, 58, 108, 8, 4); ctx.fill();
  if (affection > 0) {
    ctx.fillStyle = character.accent;
    drawRoundedRect(ctx, x, 58, 108 * affection / 100, 8, 4); ctx.fill();
  }
  drawText(ctx, `${affection}`, x + 127, 62, { size: 12, color: character.accent });
  if (pop) {
    ctx.save();
    ctx.globalAlpha = 1 - pop.t / 1.2;
    drawText(ctx, `${pop.value > 0 ? '+' : ''}${pop.value}`, x + 155, 62 - pop.t * 15,
      { size: 14, color: pop.value > 0 ? '#7ee2a0' : '#ff7a7a' });
    ctx.restore();
  }
}

function drawDialogue(ctx, step) {
  const w = viewport.width - 24;
  drawBox(ctx, 12, BOX_Y, w, 198);
  const speaker = step.who === 'character' ? character.name : step.who === 'you' ? 'Ты' : chapter;
  drawText(ctx, speaker, 28, BOX_Y + 25, { size: 14, align: 'left', color: character.accent });
  const lines = wrapText(ctx, step.text, w - 32, 16, '400');
  let budget = Math.floor(typeT * CHARS_PER_SEC);
  lines.forEach((text, i) => {
    if (budget > 0) drawText(ctx, text.slice(0, budget), 28, BOX_Y + 57 + i * 22,
      { size: 16, align: 'left', weight: '400' });
    budget -= text.length + 1;
  });
  if (typeT * CHARS_PER_SEC >= step.text.length) {
    drawText(ctx, finished && pending.length === 1 ? 'К историям  →' : 'Продолжить  →',
      viewport.width - 28, 590, { size: 12, align: 'right', color: '#aeb5cd' });
  }
}

function drawChoices(ctx, step) {
  drawText(ctx, step.prompt, viewport.width / 2, 389, { size: 16 });
  step.options.forEach((option, i) => {
    const y = BOX_Y + i * (CHOICE_H + CHOICE_GAP);
    drawBox(ctx, 16, y, viewport.width - 32, CHOICE_H);
    const lines = wrapText(ctx, option.text, viewport.width - 60, 14);
    lines.forEach((text, j) => drawText(ctx, text, viewport.width / 2,
      y + CHOICE_H / 2 + (j - (lines.length - 1) / 2) * 18, { size: 14 }));
  });
}

const story = {
  enter(arg) {
    if (arg && typeof arg === 'object') {
      character = findCharacter(arg.characterId);
      script = scriptFor(character);
      index = 0;
      affection = AFFECTION_START;
      pending = [];
      finished = false;
      betrayed = false;
      pop = null;
      scene = '01-meeting';
      chapter = '';
      illustration.reset();
      preloadArt(character, ['portrait', ...character.chapters.map((c) => c[0]), '05-love', '06-fail']);
    } else if (arg === 'win') {
      index++;
    } else if (arg === 'fail') {
      const penalty = game.cozyMode ? 0 : FAIL_PENALTY;
      if (penalty) changeAffection(-penalty);
      if (script[index]?.checkpointReached) {
        pending.push({ who: 'character', text: 'Ты в порядке? Половина пути позади, давай продолжим!' });
      } else {
        pending.push(FAIL_LINES[Math.floor(Math.random() * FAIL_LINES.length)]);
      }
    }
    clearTap();
    resolve();
  },
  update(dt) {
    typeT += dt;
    reactionT += dt;
    illustration.update(dt);
    if (pop) { pop.t += dt; if (pop.t >= 1.2) pop = null; }
    if (!consumeTap()) return;
    const { x, y } = getTapPos();
    if (hitsBackLabel(x, y)) { setState(dates); return; }
    const step = current();
    if (step.type === 'choice') {
      const i = Math.floor((y - BOX_Y) / (CHOICE_H + CHOICE_GAP));
      if (x < 16 || x > viewport.width - 16 || i < 0 || i >= step.options.length ||
        y > BOX_Y + i * (CHOICE_H + CHOICE_GAP) + CHOICE_H) return;
      const option = step.options[i];
      changeAffection(option.delta);
      betrayed ||= option.endsRoute;
      pending.push(option.reply);
      index = option.endsRoute ? script.length - 1 : index + 1;
      resolve();
      return;
    }
    if (typeT * CHARS_PER_SEC < step.text.length) { typeT = step.text.length / CHARS_PER_SEC; return; }
    if (pending.length) pending.shift();
    else index++;
    resolve();
  },
  render(ctx) {
    const w = viewport.width;
    ctx.fillStyle = '#101321';
    ctx.fillRect(0, 0, w, viewport.height);
    const step = current();
    // A short, soft accent acknowledges a new spoken line without simulating
    // mouth movement on a flat illustration.
    const speaking = step.who === 'character' && reactionT < 0.8 && !reducedMotion();
    const status = illustration.draw(ctx, 0, 82, w, 420, 0.12);
    if (status !== 'ready') {
      drawArt(ctx, character, 'portrait', 0, 82, w, 420, 0.12);
      drawText(ctx, status === 'error' ? 'Иллюстрация недоступна' : 'Загрузка сцены…', w / 2, 335, { size: 14 });
    }
    const shade = ctx.createLinearGradient(0, 320, 0, 508);
    shade.addColorStop(0, 'rgba(16,19,33,0)');
    shade.addColorStop(1, '#101321');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 320, w, 188);
    drawBackLabel(ctx, '‹ истории');
    drawText(ctx, character.name, w / 2, 28, { size: 18, color: character.accent });
    if (speaking) {
      ctx.save();
      ctx.globalAlpha = Math.sin(reactionT / 0.8 * Math.PI) * 0.7;
      ctx.strokeStyle = character.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 26, 43); ctx.lineTo(w / 2 + 26, 43); ctx.stroke();
      ctx.restore();
    }
    drawMeter(ctx);
    if (step.type === 'choice') drawChoices(ctx, step);
    else drawDialogue(ctx, step);
  },
};

export default story;
