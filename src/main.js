import { game, setState } from './game.js';
import { initInput } from './input.js';
import { startLoop } from './loop.js';
import { applyTransform, resizeViewport } from './viewport.js';
import * as effects from './effects.js';
import { current as theme, setLocation, setSkin } from './theme.js';
import menu from './states/menu.js';

setLocation(game.location);
setSkin(game.skin);

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
    ctx.fillStyle = theme.sky;
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

// PWA service-worker registration, production builds only. `vite dev` never
// bundles a service worker (vite.config.js sets devOptions.enabled: false),
// but the PROD guard is kept here too so this never accidentally runs
// against the dev server's module graph -- a SW caching half-built modules
// while the game is being tuned daily would be a nightmare to debug.
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      // If the tab is left open (this is an installed, fullscreen game --
      // people don't reliably reload it), poll hourly so a new deployment
      // still supersedes the running one instead of only updating on the
      // next cold start.
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        setInterval(() => registration.update(), 60 * 60 * 1000);
      },
    });
    void updateSW;
  });
}
