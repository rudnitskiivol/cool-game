import { reducedMotion } from './romanceArt.js';

// Face patches are registered against frame 0. Frame 1 supplies closed eyes;
// frame 2 supplies a speaking mouth. Everything else stays on the base layer.
const RIGS = {
  aiko: { eyes: [170, 140, 160, 85, 0, 1], mouth: [245, 215, 58, 42, 0, 0], hair: [108, 320, 95, 245], face: [155, 35, 205, 265] },
  'nika-cyberpunk': { eyes: [204, 133, 125, 54, -1, 0], mouth: [234, 204, 61, 43, -2, 0], hair: [353, 153, 52, 110], face: [163, 20, 216, 275] },
  marina: { eyes: [216, 115, 121, 55, -7, 1], mouth: [234, 183, 71, 43, -12, 2], hair: [365, 227, 50, 105], face: [161, 15, 224, 266] },
  valeria: { eyes: [287, 143, 106, 75, -1, -1], mouth: [292, 215, 67, 51, 2, -1], hair: [149, 244, 108, 223], face: [216, 28, 219, 281] },
  eva: { eyes: [193, 148, 109, 59, 4, -2], mouth: [222, 225, 67, 47, 3, 0], hair: [135, 197, 62, 159], face: [146, 26, 211, 290] },
};

const WIDTH = 512;
const HEIGHT = 1024;
const COLS = 8;
const ROWS = 20;
const sprites = new Map();

function canvas(w, h) {
  const result = document.createElement('canvas');
  result.width = w;
  result.height = h;
  return result;
}

function facePatch(atlas, box, frame) {
  const [x, y, w, h, dx, dy] = box;
  const patch = canvas(w, h);
  const ctx = patch.getContext('2d');
  ctx.drawImage(atlas, frame * WIDTH + x + dx, y + dy, w, h, 0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-in';
  for (const [x1, y1, x2, y2] of [[0, 0, w, 0], [0, 0, 0, h]]) {
    const fade = ctx.createLinearGradient(x1, y1, x2, y2);
    fade.addColorStop(0, 'transparent');
    fade.addColorStop(0.16, '#fff');
    fade.addColorStop(0.84, '#fff');
    fade.addColorStop(1, 'transparent');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
  }
  return patch;
}

function loadSprite(character) {
  if (!RIGS[character.id] || typeof document.createElement !== 'function') return null;
  if (sprites.has(character.id)) {
    const sprite = sprites.get(character.id);
    sprites.delete(character.id);
    sprites.set(character.id, sprite);
    return sprite;
  }
  const sprite = { status: 'loading', frames: [], config: RIGS[character.id] };
  const atlas = new Image();
  atlas.onload = () => {
    try {
      if (atlas.naturalWidth !== WIDTH * 3 || atlas.naturalHeight !== HEIGHT) throw new Error('Invalid rig atlas');
      const eyes = facePatch(atlas, sprite.config.eyes, 1);
      const mouth = facePatch(atlas, sprite.config.mouth, 2);
      // Precompose four facial combinations once, not during rendering.
      for (let state = 0; state < 4; state++) {
        const texture = canvas(WIDTH, HEIGHT);
        const ctx = texture.getContext('2d');
        ctx.drawImage(atlas, 0, 0, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);
        if (state & 1) ctx.drawImage(eyes, ...sprite.config.eyes.slice(0, 2));
        if (state & 2) ctx.drawImage(mouth, ...sprite.config.mouth.slice(0, 2));
        sprite.frames.push(texture);
      }
      sprite.status = 'ready';
    } catch {
      sprite.status = 'error';
      sprite.frames = [];
    }
  };
  atlas.onerror = () => { sprite.status = 'error'; };
  atlas.src = `${import.meta.env?.BASE_URL ?? './'}romance-pack/rigs/${character.id}.webp`;
  sprites.set(character.id, sprite);
  // Limit retained textures when browsing all five heroines on a phone.
  if (sprites.size > 2) sprites.delete(sprites.keys().next().value);
  return sprite;
}

const gaussian = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) * 2);

function vertex(x, y, time, config) {
  const breath = Math.sin(time * 1.55);
  const chest = gaussian(x, y, 270, 440, 230, 290);
  const head = Math.max(0, 1 - y / 640);
  const hair = gaussian(x, y, ...config.hair);
  const hands = gaussian(x, y, 45, 850, 70, 190) + gaussian(x, y, 474, 850, 65, 190);
  return {
    x: x + Math.sin(time * 0.65) * 3 * head + (x - 270) * 0.006 * breath * chest
      + Math.sin(time * 1.25 + y * 0.005) * 7 * hair + Math.sin(time * 0.9) * 3 * hands,
    y: y - breath * 3 * chest + Math.sin(time * 0.9 + 0.6) * 4 * hands,
  };
}

function triangle(ctx, texture, p, q, r, sx, sy, ux, uy, vx, vy) {
  const det = ux * vy - uy * vx;
  const a = ((q.x - p.x) * vy - (r.x - p.x) * uy) / det;
  const b = ((q.y - p.y) * vy - (r.y - p.y) * uy) / det;
  const c = ((r.x - p.x) * ux - (q.x - p.x) * vx) / det;
  const d = ((r.y - p.y) * ux - (q.y - p.y) * vx) / det;
  ctx.save();
  ctx.beginPath();
  // Tiny overlap hides antialiasing cracks between adjacent triangles.
  const cx = (p.x + q.x + r.x) / 3;
  const cy = (p.y + q.y + r.y) / 3;
  for (const [i, point] of [p, q, r].entries()) {
    const distance = Math.hypot(point.x - cx, point.y - cy);
    const x = point.x + (point.x - cx) / distance * 0.45;
    const y = point.y + (point.y - cy) / distance * 0.45;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, p.x - a * sx - c * sy, p.y - b * sx - d * sy);
  ctx.drawImage(texture, 0, 0);
  ctx.restore();
}

function drawMesh(ctx, texture, time, config) {
  const dx = WIDTH / COLS;
  const dy = HEIGHT / ROWS;
  const points = [];
  for (let row = 0; row <= ROWS; row++) {
    for (let col = 0; col <= COLS; col++) points.push(vertex(col * dx, row * dy, time, config));
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * (COLS + 1) + col;
      const [tl, tr, bl, br] = [points[i], points[i + 1], points[i + COLS + 1], points[i + COLS + 2]];
      triangle(ctx, texture, tl, tr, bl, col * dx, row * dy, dx, 0, 0, dy);
      triangle(ctx, texture, br, bl, tr, (col + 1) * dx, (row + 1) * dy, -dx, 0, 0, -dy);
    }
  }
}

export function createCharacterRig() {
  let sprite = null;
  let character = null;
  let time = 0;
  let nextBlink = 2;
  let blinkLeft = 0;
  let speaking = false;
  let speechT = 0;
  let surface = null;
  let surfaceCtx = null;
  let paintedAt = -1;
  let paintedFrame = -1;
  let paintedReduced = null;

  function frameIndex() {
    if (reducedMotion()) return 0;
    const syllable = speechT % 0.24;
    return (blinkLeft > 0 ? 1 : 0) | (speaking && syllable < 0.14 ? 2 : 0);
  }

  return {
    show(next) {
      if (next.id === character?.id) return;
      character = next;
      sprite = loadSprite(next);
      time = speechT = 0;
      blinkLeft = 0;
      nextBlink = 1.5 + Math.random() * 2;
      paintedAt = -1;
      paintedFrame = -1;
    },
    update(dt, isSpeaking = false) {
      time += dt;
      speechT = isSpeaking ? speechT + dt : 0;
      speaking = isSpeaking;
      if (reducedMotion()) { blinkLeft = 0; return; }
      blinkLeft = Math.max(0, blinkLeft - dt);
      nextBlink -= dt;
      if (nextBlink <= 0) {
        blinkLeft = 0.14;
        nextBlink = 2.6 + Math.random() * 2.4;
      }
    },
    draw(ctx, x, y, w, h, { backdrop = true } = {}) {
      if (sprite?.status !== 'ready') return false;
      if (!surface) {
        // Render the mesh at 30 Hz to a reusable surface; the game itself keeps
        // its 60 Hz physics. A single texture blit is used between mesh frames.
        surface = canvas(WIDTH + 24, HEIGHT + 24);
        surfaceCtx = surface.getContext('2d');
      }
      const frame = frameIndex();
      const reduced = reducedMotion();
      if (frame !== paintedFrame || reduced !== paintedReduced || paintedAt < 0 || (!reduced && time - paintedAt >= 1 / 30)) {
        surfaceCtx.clearRect(0, 0, surface.width, surface.height);
        surfaceCtx.save(); surfaceCtx.translate(12, 12);
        if (reduced) surfaceCtx.drawImage(sprite.frames[0], 0, 0);
        else drawMesh(surfaceCtx, sprite.frames[frame], time, sprite.config);
        surfaceCtx.restore();
        paintedAt = time; paintedFrame = frame; paintedReduced = reduced;
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      if (backdrop) {
        const glow = ctx.createRadialGradient(x + w * 0.5, y + h * 0.4, 0, x + w * 0.5, y + h * 0.4, h * 0.85);
        glow.addColorStop(0, `${character.accent}55`);
        glow.addColorStop(1, '#111421');
        ctx.fillStyle = '#111421'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = glow; ctx.fillRect(x, y, w, h);
      }
      // Head-to-waist framing leaves room for hair and both shoulders.
      const scale = Math.min((w - 16) / WIDTH, h / 680);
      ctx.drawImage(surface, x + (w - WIDTH * scale) / 2 - 12 * scale,
        y - 12 * scale, surface.width * scale, surface.height * scale);
      ctx.restore();
      return true;
    },
    drawAvatar(ctx, cx, cy, radius) {
      if (sprite?.status !== 'ready') return false;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#202237'; ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.drawImage(sprite.frames[frameIndex()], ...sprite.config.face, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
      return true;
    },
  };
}
