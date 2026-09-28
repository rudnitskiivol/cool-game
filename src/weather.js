import { viewport } from './viewport.js';
import { GROUND_HEIGHT } from './config.js';

// Weather particle effects tailored to each heroine's narrative world.
// Zero runtime allocations: particles are pre-allocated once in reset().
const MAX_PARTICLES = 72;
let particles = [];
let weatherType = 'sakura';
let time = 0;

export function reset(character = null) {
  time = 0;
  const id = character?.id;
  if (id === 'aiko') weatherType = 'sakura';
  else if (id === 'nika-cyberpunk') weatherType = 'cyber';
  else if (id === 'marina') weatherType = 'bokeh';
  else if (id === 'valeria') weatherType = 'sparks';
  else if (id === 'eva') weatherType = 'analog';
  else weatherType = 'breeze';

  particles = [];
  const w = viewport.width || 360;
  const h = viewport.height || 640;

  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push(createParticle(w, h, true));
  }
}

function createParticle(w, h, randomizeX = false) {
  const x = randomizeX ? Math.random() * w : w + Math.random() * 20;
  const y = Math.random() * (h - GROUND_HEIGHT);

  switch (weatherType) {
    case 'sakura':
      // Delicate sakura petals & autumn paper notes
      return {
        x, y,
        vx: -(40 + Math.random() * 50),
        vy: 25 + Math.random() * 45,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 3,
        swaySpeed: 2 + Math.random() * 3,
        swayAmp: 15 + Math.random() * 20,
        alpha: 0.4 + Math.random() * 0.4,
        color: Math.random() > 0.4 ? '#ffccd5' : '#ffd19a',
      };

    case 'cyber':
      // Digital neon rain & code streaks
      return {
        x, y,
        vx: -(120 + Math.random() * 80),
        vy: 200 + Math.random() * 250,
        len: 12 + Math.random() * 22,
        size: 1.5,
        alpha: 0.35 + Math.random() * 0.5,
        color: Math.random() > 0.3 ? '#83e9f5' : '#ff4db8',
      };

    case 'bokeh':
      // Warm golden bokeh circles & peony petals
      return {
        x, y,
        vx: -(25 + Math.random() * 35),
        vy: -(15 + Math.random() * 25),
        size: 6 + Math.random() * 12,
        alpha: 0.15 + Math.random() * 0.25,
        color: Math.random() > 0.5 ? '#ffd19a' : '#ffe5b4',
      };

    case 'sparks':
      // Arena sparks & golden embers
      return {
        x, y,
        vx: -(60 + Math.random() * 70),
        vy: -(40 + Math.random() * 60),
        size: 2 + Math.random() * 3,
        alpha: 0.5 + Math.random() * 0.5,
        color: Math.random() > 0.4 ? '#ffd166' : '#d3b0ff',
      };

    case 'analog':
      // Film dust motes & cool flares
      return {
        x, y,
        vx: -(30 + Math.random() * 30),
        vy: (Math.random() - 0.5) * 20,
        size: 2 + Math.random() * 4,
        alpha: 0.25 + Math.random() * 0.35,
        color: Math.random() > 0.5 ? '#b8d5ff' : '#ffffff',
      };

    default:
      // Subtle wind drifts
      return {
        x, y,
        vx: -(50 + Math.random() * 40),
        vy: (Math.random() - 0.5) * 15,
        size: 2 + Math.random() * 3,
        alpha: 0.2 + Math.random() * 0.2,
        color: '#e8ecf8',
      };
  }
}

export function update(dt, worldSpeed = 160) {
  time += dt;
  const w = viewport.width;
  const maxY = viewport.height - GROUND_HEIGHT;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += (p.vx - worldSpeed * 0.25) * dt;
    p.y += p.vy * dt;

    if (p.vrot !== undefined) p.rot += p.vrot * dt;

    // Boundary wrapping
    if (p.x < -30 || p.y > maxY + 10 || p.y < -30) {
      particles[i] = createParticle(w, viewport.height, false);
    }
  }
}

export function render(ctx) {
  ctx.save();

  if (weatherType === 'cyber') {
    // Rain streaks
    ctx.lineCap = 'round';
    for (const p of particles) {
      ctx.strokeStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.len * 0.4, p.y + p.len);
      ctx.globalAlpha = p.alpha * 0.25;
      ctx.lineWidth = p.size * 3;
      ctx.stroke();
      ctx.globalAlpha = p.alpha;
      ctx.lineWidth = p.size;
      ctx.stroke();
    }
  } else if (weatherType === 'sakura') {
    // Rotating petals
    for (const p of particles) {
      ctx.save();
      const sway = Math.sin(time * p.swaySpeed + p.x * 0.02) * p.swayAmp;
      ctx.translate(p.x + sway, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.5, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Soft bokeh / sparks / motes
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
