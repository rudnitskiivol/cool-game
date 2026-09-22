import { viewport } from '../viewport.js';
import { clearTap, consumeTap } from '../input.js';
import { drawText } from '../draw.js';
import { game, setState } from '../game.js';
import {
  COLORS,
  GAMEOVER_FADE,
  GAMEOVER_SCRIM,
  RESTART_LOCKOUT,
  SHAKE_EDGE_MARGIN,
} from '../config.js';
import playing from './playing.js';

let since = 0;
let prevSince = 0;

const gameover = {
  enter() {
    since = 0;
    prevSince = 0;
    // The tap that killed the player must not also restart the run.
    clearTap();
  },

  update(dt) {
    prevSince = since;
    since += dt;
    if (since >= RESTART_LOCKOUT && consumeTap()) setState(playing);
  },

  render(ctx, alpha) {
    // The world is frozen where the player died; keep it on screen and dim it.
    playing.renderWorld(ctx, alpha);

    const t = prevSince + (since - prevSince) * alpha;
    const k = Math.min(t / GAMEOVER_FADE, 1);

    // Overdrawn past the edges: the shake is still decaying when this fades
    // in, and an unscrimmed sliver along an edge would give it away.
    ctx.globalAlpha = GAMEOVER_SCRIM * k;
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(
      -SHAKE_EDGE_MARGIN,
      -SHAKE_EDGE_MARGIN,
      viewport.width + SHAKE_EDGE_MARGIN * 2,
      viewport.height + SHAKE_EDGE_MARGIN * 2,
    );
    ctx.globalAlpha = k;

    drawText(ctx, String(game.score), viewport.width / 2, viewport.height * 0.36, { size: 56 });
    drawText(ctx, `best ${game.best}`, viewport.width / 2, viewport.height * 0.45, {
      size: 16,
      color: COLORS.muted,
    });

    if (since >= RESTART_LOCKOUT) {
      drawText(ctx, 'tap to retry', viewport.width / 2, viewport.height * 0.58, {
        size: 16,
        color: COLORS.muted,
      });
    }

    ctx.globalAlpha = 1;
  },
};

export default gameover;
