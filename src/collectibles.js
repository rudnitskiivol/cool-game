import { viewport } from './viewport.js';
import { OBSTACLE_WIDTH, PLAYER_RADIUS } from './config.js';
import { drawText } from './draw.js';

const ITEM_TYPES = {
  aiko: [
    { symbol: '🗝️', label: 'забытый ключ', color: '#ffd19a', aura: 'rgba(255, 209, 154, 0.25)' },
    { symbol: '✉️', label: 'письмо', color: '#ffb6ca', aura: 'rgba(255, 182, 202, 0.25)' },
    { symbol: '🌸', label: 'ветка сакуры', color: '#ff9ebb', aura: 'rgba(255, 158, 187, 0.25)' },
  ],
  'nika-cyberpunk': [
    { symbol: '💾', label: 'скрытый архив', color: '#83e9f5', aura: 'rgba(131, 233, 245, 0.25)' },
    { symbol: '🔋', label: 'энергоячейка', color: '#ff4db8', aura: 'rgba(255, 77, 184, 0.25)' },
    { symbol: '🔑', label: 'ключ дешифровки', color: '#f583f1', aura: 'rgba(245, 131, 241, 0.25)' },
  ],
  marina: [
    { symbol: '🎞️', label: 'старая пленка', color: '#ffd19a', aura: 'rgba(255, 209, 154, 0.25)' },
    { symbol: '☕', label: 'кофе', color: '#d4a373', aura: 'rgba(212, 163, 115, 0.25)' },
    { symbol: '📸', label: 'кадр', color: '#f1c40f', aura: 'rgba(241, 196, 15, 0.25)' },
  ],
  valeria: [
    { symbol: '🎫', label: 'билет на бой', color: '#d3b0ff', aura: 'rgba(211, 176, 255, 0.25)' },
    { symbol: '🥊', label: 'перчатка', color: '#ff4757', aura: 'rgba(255, 71, 87, 0.25)' },
    { symbol: '🏆', label: 'медаль', color: '#ffa502', aura: 'rgba(255, 165, 2, 0.25)' },
  ],
  eva: [
    { symbol: '🔦', label: 'ультрафиолет', color: '#9bf6ff', aura: 'rgba(155, 246, 255, 0.25)' },
    { symbol: '📓', label: 'дневник', color: '#8854d0', aura: 'rgba(136, 84, 208, 0.25)' },
    { symbol: '👁️', label: 'тайный снимок', color: '#ff5252', aura: 'rgba(255, 82, 82, 0.25)' },
  ],
  default: [
    { symbol: '♥', label: 'сердце', color: '#ff6b8b', aura: 'rgba(255, 107, 139, 0.25)' },
  ],
};

let items = [];
let particles = [];
let time = 0;
let currentList = ITEM_TYPES.default;
let spawnIndex = 0;

export function reset(character = null) {
  items = [];
  particles = [];
  time = 0;
  spawnIndex = 0;
  const id = character?.id;
  currentList = id && ITEM_TYPES[id] ? ITEM_TYPES[id] : ITEM_TYPES.default;
}

export function spawnForObstacle(obstacle, pipeIndex) {
  // Tastefully place story items at calm intervals (e.g. pipe 3, pipe 10, pipe 20...)
  if (pipeIndex === 3 || (pipeIndex > 3 && pipeIndex % 8 === 0)) {
    const x = obstacle.x + OBSTACLE_WIDTH / 2;
    const y = obstacle.gapY + obstacle.gap / 2;
    const type = currentList[spawnIndex % currentList.length];
    spawnIndex++;

    items.push({
      x,
      prevX: x,
      y,
      baseY: y,
      collected: false,
      pulse: Math.random() * Math.PI * 2,
      type,
    });
  }
}

export function freeze() {
  for (const item of items) {
    item.prevX = item.x;
  }
}

export function update(dt, speed, playerX, playerY, onCollect) {
  time += dt;

  for (const item of items) {
    item.prevX = item.x;
    item.x -= speed * dt;
    item.y = item.baseY + Math.sin(time * 3 + item.pulse) * 5;

    if (!item.collected) {
      const dx = playerX - item.x;
      const dy = playerY - item.y;
      if (Math.hypot(dx, dy) < PLAYER_RADIUS + 14) {
        item.collected = true;

        // Subtle, elegant shimmer particles (no heavy gravity burst)
        for (let i = 0; i < 7; i++) {
          const angle = (Math.PI * 2 * i) / 7;
          particles.push({
            x: item.x,
            y: item.y,
            vx: Math.cos(angle) * 45 - speed * 0.2,
            vy: Math.sin(angle) * 45,
            life: 0.5,
            maxLife: 0.5,
            color: item.type.color,
          });
        }
        onCollect?.(item.type);
      }
    }
  }

  items = items.filter((item) => item.x > -40 && !item.collected);

  for (const p of particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

export function render(ctx, alpha) {
  for (const item of items) {
    if (item.collected) continue;
    const x = item.prevX + (item.x - item.prevX) * alpha;
    const y = item.y;

    ctx.save();
    // Subtle soft glow
    ctx.fillStyle = item.type.aura;
    ctx.beginPath();
    const r = 12 + Math.sin(time * 4 + item.pulse) * 2;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Clean floating token
    ctx.fillStyle = 'rgba(18, 20, 36, 0.88)';
    ctx.strokeStyle = item.type.color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawText(ctx, item.type.symbol, x, y + 1, {
      size: 13,
      color: item.type.color,
      weight: '700',
    });
    ctx.restore();
  }

  // Soft sparkle motes
  for (const p of particles) {
    ctx.save();
    const ratio = p.life / p.maxLife;
    ctx.globalAlpha = ratio * 0.8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, ratio * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
