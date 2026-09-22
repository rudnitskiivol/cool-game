import { COLORS } from './config.js';
import { game, setState } from './game.js';
import { initInput } from './input.js';
import { startLoop } from './loop.js';
import { applyTransform, resizeViewport } from './viewport.js';
import * as effects from './effects.js';
import menu from './states/menu.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

resizeViewport(canvas);
window.addEventListener('resize', () => resizeViewport(canvas));
initInput(canvas);

setState(menu);

startLoop({
  update: (dt) => {
    game.state.update(dt);
    // Effects tick on the same fixed step, after the state, so shake and
    // flash keep running across a state change (death -> game over).
    effects.update(dt);
  },
  render: (alpha) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Shake is a camera transform composed on top of the viewport transform.
    // Nothing in the world actually moves.
    applyTransform(ctx);
    effects.applyShake(ctx, alpha);
    game.state.render(ctx, alpha);

    // Re-apply the un-shaken transform so the flash doesn't slide around.
    applyTransform(ctx);
    effects.renderFlash(ctx, alpha);
  },
});
