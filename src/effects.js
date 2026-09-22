// Global, purely-visual effects: camera shake and a full-screen flash.
//
// Nothing here touches a gameplay value. Shake is applied as a render-time
// translate composed on top of the camera transform — no object's real
// position ever moves, so collision and scoring are untouched.
//
// Both effects are advanced by update(dt) on the fixed 60Hz step and store
// their previous value so render() can interpolate with `alpha`. Two sine
// waves at different frequencies give the shake an irregular-looking path
// while staying smooth enough to interpolate (random per-tick offsets would
// tear when interpolated).
import { viewport } from './viewport.js';
import {
  COLORS,
  FLASH_DURATION,
  SHAKE_DURATION,
  SHAKE_FREQ_X,
  SHAKE_FREQ_Y,
} from './config.js';

let shakeAmp = 0;
let shakeT = 0;
let shakeX = 0;
let shakeY = 0;
let prevShakeX = 0;
let prevShakeY = 0;

let flashAmp = 0;
let flashT = 0;
let flashA = 0;
let prevFlashA = 0;

export function reset() {
  shakeAmp = 0;
  shakeT = 0;
  shakeX = 0;
  shakeY = 0;
  prevShakeX = 0;
  prevShakeY = 0;
  flashAmp = 0;
  flashT = 0;
  flashA = 0;
  prevFlashA = 0;
}

export function shake(amp) {
  shakeAmp = Math.max(shakeAmp, amp);
  shakeT = 0;
}

export function flash(amp) {
  flashAmp = Math.max(flashAmp, amp);
  flashT = 0;
}

export function update(dt) {
  prevShakeX = shakeX;
  prevShakeY = shakeY;

  if (shakeAmp > 0) {
    shakeT += dt;
    if (shakeT >= SHAKE_DURATION) {
      shakeAmp = 0;
      shakeX = 0;
      shakeY = 0;
    } else {
      // Quadratic falloff: hits hard, gets out of the way fast.
      const k = 1 - shakeT / SHAKE_DURATION;
      const mag = shakeAmp * k * k;
      shakeX = Math.sin(shakeT * SHAKE_FREQ_X) * mag;
      shakeY = Math.sin(shakeT * SHAKE_FREQ_Y + 1.7) * mag;
    }
  }

  prevFlashA = flashA;

  if (flashAmp > 0) {
    flashT += dt;
    if (flashT >= FLASH_DURATION) {
      flashAmp = 0;
      flashA = 0;
    } else {
      flashA = flashAmp * (1 - flashT / FLASH_DURATION);
    }
  }
}

// Composed on top of the already-applied camera transform, in virtual units.
export function applyShake(ctx, alpha) {
  if (shakeX === 0 && shakeY === 0 && prevShakeX === 0 && prevShakeY === 0) return;
  ctx.translate(
    prevShakeX + (shakeX - prevShakeX) * alpha,
    prevShakeY + (shakeY - prevShakeY) * alpha,
  );
}

// Covers the virtual play area only; the letterbox bars on wide screens stay
// the sky colour, which is what we want — the flash is part of the world.
export function renderFlash(ctx, alpha) {
  const a = prevFlashA + (flashA - prevFlashA) * alpha;
  if (a <= 0.002) return;

  ctx.globalAlpha = a;
  ctx.fillStyle = COLORS.flash;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.globalAlpha = 1;
}
