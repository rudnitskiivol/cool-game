import { viewport } from '../viewport.js';
import { consumeTap, getTapPos } from '../input.js';
import { drawGlassCard, drawMuteButton, drawRoundedRect, drawText } from '../draw.js';
import { game, setState, toggleCozyMode } from '../game.js';
import { haptic } from '../haptics.js';
import * as background from '../background.js';
import * as ground from '../ground.js';
import * as audio from '../audio.js';
import { COLORS, MUTE_BTN_MARGIN, MUTE_BTN_RADIUS, OBSTACLE_SPEED_START } from '../config.js';
import { setLocation } from '../theme.js';
import playing from './playing.js';
import hub from './hub.js';
import dates from './dates.js';

// Top-right corner, in virtual units. Computed from the current viewport
// width rather than stored, since width varies with device aspect ratio.
function muteButtonPos() {
  return { x: viewport.width - MUTE_BTN_MARGIN, y: MUTE_BTN_MARGIN };
}

function hitsMuteButton(x, y) {
  const { x: bx, y: by } = muteButtonPos();
  const dx = x - bx;
  const dy = y - by;
  return dx * dx + dy * dy <= (MUTE_BTN_RADIUS + 6) * (MUTE_BTN_RADIUS + 6);
}

// Layout helper for responsive positioning in virtual units (height = 640)
function getLayout() {
  const cx = viewport.width / 2;
  const btnW = Math.min(viewport.width - 44, 290);
  const btnLeft = cx - btnW / 2;

  return {
    cx,
    btnW,
    btnLeft,
    titleY: 170,
    statsY: 66,
    storyBtn: { x: btnLeft, y: 242, w: btnW, h: 64 },
    endlessBtn: { x: btnLeft, y: 322, w: btnW, h: 48 },
    hubBtn: { x: btnLeft, y: 384, w: btnW, h: 46 },
    cozyBtn: { x: btnLeft, y: 444, w: btnW, h: 42 },
  };
}

function hitsRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );
}

// Romantic ambient particles (sakura petals and soft gold embers)
const PARTICLE_COUNT = 16;
let particles = [];
let menuTime = 0;

function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * (viewport.width || 360),
      y: Math.random() * 640,
      size: 1.6 + Math.random() * 2.2,
      speedY: 18 + Math.random() * 22,
      driftSpeed: 1 + Math.random() * 1.5,
      seed: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? '#ffb6ca' : '#ffd19a',
      alpha: 0.35 + Math.random() * 0.45,
    });
  }
}

const menu = {
  enter() {
    setLocation(game.location);
    if (particles.length === 0) {
      initParticles();
    }
  },

  update(dt) {
    menuTime += dt;
    background.update(dt, OBSTACLE_SPEED_START * 0.7);
    ground.update(dt, OBSTACLE_SPEED_START * 0.7);

    // Update floating ambient particles
    for (const p of particles) {
      p.y -= p.speedY * dt;
      p.x += Math.sin(menuTime * p.driftSpeed + p.seed) * 14 * dt;
      if (p.y < -10) {
        p.y = 650;
        p.x = Math.random() * viewport.width;
      }
    }

    if (consumeTap()) {
      const { x, y } = getTapPos();
      const layout = getLayout();

      if (hitsMuteButton(x, y)) {
        audio.toggleMute();
      } else if (hitsRect(x, y, layout.storyBtn)) {
        haptic.tap();
        setState(dates);
      } else if (hitsRect(x, y, layout.endlessBtn)) {
        haptic.tap();
        setState(playing);
      } else if (hitsRect(x, y, layout.hubBtn)) {
        haptic.tap();
        setState(hub);
      } else if (hitsRect(x, y, layout.cozyBtn)) {
        toggleCozyMode();
        haptic.tap();
      }
    }
  },

  render(ctx, alpha) {
    background.render(ctx, alpha);
    ground.render(ctx, alpha);

    const layout = getLayout();
    const { cx, statsY, titleY, storyBtn, endlessBtn, hubBtn, cozyBtn } = layout;

    // Atmospheric romantic gradient wash over the backdrop
    ctx.save();
    const bgGrad = ctx.createLinearGradient(0, 0, 0, viewport.height);
    bgGrad.addColorStop(0, 'rgba(15, 18, 32, 0.45)');
    bgGrad.addColorStop(0.45, 'rgba(15, 18, 32, 0.25)');
    bgGrad.addColorStop(0.85, 'rgba(28, 20, 38, 0.65)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    ctx.restore();

    // Floating particles
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 1. Top Stats Pill (Best score & coins)
    const statsW = 190;
    const statsH = 26;
    drawGlassCard(ctx, cx - statsW / 2, statsY - statsH / 2, statsW, statsH, {
      radius: 13,
      fill: 'rgba(255, 255, 255, 0.07)',
      border: 'rgba(255, 255, 255, 0.14)',
    });
    drawText(ctx, `🏆 Рекорд: ${game.best}   ✦   🪙 ${game.coins}`, cx, statsY + 1, {
      size: 12,
      weight: '600',
      color: '#ffd19a',
    });

    // 2. Title block with gentle breathing floating effect
    const bobY = Math.sin(menuTime * 2.2) * 3;
    const currentTitleY = titleY + bobY;

    // Subtle decorative motif
    drawText(ctx, '♥   ·   ✦   ·   ♥', cx, currentTitleY - 32, {
      size: 11,
      color: '#ffb6ca',
      weight: '700',
    });

    // Glowing Title: НАВСТРЕЧУ ЕЙ
    ctx.save();
    ctx.shadowColor = 'rgba(255, 130, 168, 0.65)';
    ctx.shadowBlur = 18;
    drawText(ctx, 'НАВСТРЕЧУ ЕЙ', cx, currentTitleY, {
      size: 34,
      weight: '800',
      color: '#fff5f8',
    });
    ctx.restore();

    // Subtitle
    drawText(ctx, '5 историй  ·  полёты  ·  любовь', cx, currentTitleY + 28, {
      size: 12,
      weight: '500',
      color: '#c2cbdf',
    });

    // 3. Featured Card: ♥ ИСТОРИИ · 5 ГЕРОИНЬ
    const storyPulse = 0.5 + 0.5 * Math.sin(menuTime * 3);
    const storyBorderAlpha = 0.35 + storyPulse * 0.25;
    drawGlassCard(ctx, storyBtn.x, storyBtn.y, storyBtn.w, storyBtn.h, {
      radius: 16,
      fill: 'rgba(255, 107, 139, 0.24)',
      border: `rgba(255, 182, 202, ${storyBorderAlpha.toFixed(2)})`,
      lineWidth: 1.5,
      glowColor: 'rgba(255, 107, 139, 0.35)',
      glowBlur: 12,
    });
    drawText(ctx, '♥  ИСТОРИИ · 5 ГЕРОИНЬ', cx, storyBtn.y + 22, {
      size: 17,
      weight: '700',
      color: '#ffffff',
    });
    drawText(ctx, 'Киото · Киберпанк · Кафе · Ринг · Триллер', cx, storyBtn.y + 44, {
      size: 11,
      weight: '500',
      color: '#ffc8d5',
    });

    // 4. Button: ▷ Бесконечный полёт (Endless)
    drawGlassCard(ctx, endlessBtn.x, endlessBtn.y, endlessBtn.w, endlessBtn.h, {
      radius: 14,
      fill: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.16)',
    });
    drawText(ctx, '▷  Бесконечный полёт', cx, endlessBtn.y + endlessBtn.h / 2, {
      size: 15,
      weight: '600',
      color: '#e8ecf8',
    });

    // 5. Button: ✦ Локации и стиль (Hub)
    drawGlassCard(ctx, hubBtn.x, hubBtn.y, hubBtn.w, hubBtn.h, {
      radius: 14,
      fill: 'rgba(255, 255, 255, 0.06)',
      border: 'rgba(255, 255, 255, 0.13)',
    });
    drawText(ctx, '✦  Локации и стиль', cx, hubBtn.y + hubBtn.h / 2, {
      size: 14,
      weight: '500',
      color: '#d6dcfa',
    });

    // 6. Button: Уютный режим (Cozy Mode toggle)
    const isCozy = game.cozyMode;
    drawGlassCard(ctx, cozyBtn.x, cozyBtn.y, cozyBtn.w, cozyBtn.h, {
      radius: 12,
      fill: isCozy ? 'rgba(255, 182, 202, 0.18)' : 'rgba(255, 255, 255, 0.04)',
      border: isCozy ? 'rgba(255, 182, 202, 0.5)' : 'rgba(255, 255, 255, 0.1)',
      glowColor: isCozy ? 'rgba(255, 182, 202, 0.3)' : null,
      glowBlur: isCozy ? 8 : 0,
    });
    const cozyLabel = isCozy ? '♥  Уютный режим: ВКЛ' : '♡  Уютный режим: ВЫКЛ';
    drawText(ctx, cozyLabel, cx, cozyBtn.y + cozyBtn.h / 2, {
      size: 13,
      weight: '600',
      color: isCozy ? '#ffb6ca' : COLORS.muted,
    });

    // Mute button with glass circle background
    const { x: mx, y: my } = muteButtonPos();
    drawMuteButton(ctx, mx, my, audio.isMuted());
  },
};

export default menu;
