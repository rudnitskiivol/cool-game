import { viewport } from '../viewport.js';
import { clearTap, consumeTap, getTapPos } from '../input.js';
import { drawBackLabel, drawText, hitsBackLabel } from '../draw.js';
import { game, setState } from '../game.js';
import {
  COLORS,
  GAMEOVER_FADE,
  GAMEOVER_SCRIM,
  RESTART_LOCKOUT,
  SHAKE_EDGE_MARGIN,
} from '../config.js';
import playing from './playing.js';
import menu from './menu.js';

let since = 0;
let prevSince = 0;

const gameover = {
  enter() {
    since = 0;
    prevSince = 0;
    clearTap();
  },

  update(dt) {
    prevSince = since;
    since += dt;

    if (since >= RESTART_LOCKOUT && consumeTap()) {
      const { x, y } = getTapPos();
      setState(hitsBackLabel(x, y) ? menu : playing);
    }
  },

  render(ctx, alpha) {
    playing.renderWorld(ctx, alpha);

    const t = prevSince + (since - prevSince) * alpha;
    const k = Math.min(t / GAMEOVER_FADE, 1);

    ctx.globalAlpha = GAMEOVER_SCRIM * k;
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(
      -SHAKE_EDGE_MARGIN,
      -SHAKE_EDGE_MARGIN,
      viewport.width + SHAKE_EDGE_MARGIN * 2,
      viewport.height + SHAKE_EDGE_MARGIN * 2,
    );
    ctx.globalAlpha = k;

    drawText(ctx, String(game.score), viewport.width / 2, viewport.height * 0.36, {
      size: 56,
      weight: '800',
    });
    drawText(ctx, `Рекорд: ${game.best}`, viewport.width / 2, viewport.height * 0.45, {
      size: 16,
      color: COLORS.muted,
      weight: '600',
    });

    if (since >= RESTART_LOCKOUT) {
      drawText(ctx, 'Тапните, чтобы повторить', viewport.width / 2, viewport.height * 0.58, {
        size: 16,
        color: '#ffb6ca',
        weight: '600',
      });
      drawBackLabel(ctx, '‹ меню');
    }

    ctx.globalAlpha = 1;
  },
};

export default gameover;
