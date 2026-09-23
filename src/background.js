// Parallax backdrop: two layers of rounded hills scrolling slower than the
// pipes. Purely decorative — it never reads a gameplay value except the
// current pipe speed, which it only uses to pick its own scroll rate.
//
// Each layer is one repeating tile of semicircles. The tile is drawn across
// the viewport into a single path and filled once per layer, so the whole
// backdrop costs two fills a frame and allocates nothing.
import { viewport } from './viewport.js';
import { BG_LAYERS, GROUND_HEIGHT } from './config.js';
import { current as theme } from './theme.js';

// Allocated once at module load, never per frame.
const offsets = new Float32Array(BG_LAYERS.length);
const prevOffsets = new Float32Array(BG_LAYERS.length);

export function reset() {
  offsets.fill(0);
  prevOffsets.fill(0);
}

export function update(dt, speed) {
  for (let i = 0; i < BG_LAYERS.length; i += 1) {
    const layer = BG_LAYERS[i];
    prevOffsets[i] = offsets[i];
    offsets[i] = (offsets[i] + speed * layer.speedFactor * dt) % layer.tile;
  }
}

// Snap previous to current so a frozen backdrop can't judder as `alpha`
// keeps sweeping between two different values.
export function freeze() {
  prevOffsets.set(offsets);
}

export function render(ctx, alpha) {
  const baseY = viewport.height - GROUND_HEIGHT;

  for (let i = 0; i < BG_LAYERS.length; i += 1) {
    const layer = BG_LAYERS[i];
    const prev = prevOffsets[i];
    const cur = offsets[i];
    // The tile wraps modulo layer.tile, so a wrapped step looks like a jump
    // backwards. Unwrap it before interpolating.
    const end = cur < prev ? cur + layer.tile : cur;
    const offset = (prev + (end - prev) * alpha) % layer.tile;

    ctx.fillStyle = theme[layer.themeKey];
    ctx.beginPath();

    for (let tileX = -layer.tile; tileX < viewport.width + layer.tile; tileX += layer.tile) {
      for (let p = 0; p < layer.peaks.length; p += 1) {
        const peak = layer.peaks[p];
        const cx = tileX - offset + peak.x;
        if (cx + peak.r < 0 || cx - peak.r > viewport.width) continue;
        // moveTo first, otherwise consecutive arcs get joined by a chord.
        ctx.moveTo(cx - peak.r, baseY);
        ctx.arc(cx, baseY, peak.r, Math.PI, 0);
      }
    }

    ctx.fill();
  }
}
