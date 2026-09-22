import { viewport } from '../viewport.js';
import { consumeTap, getTapPos } from '../input.js';
import { drawGround, drawMuteButton, drawText } from '../draw.js';
import { game, setState } from '../game.js';
import * as background from '../background.js';
import * as audio from '../audio.js';
import { COLORS, MUTE_BTN_MARGIN, MUTE_BTN_RADIUS, OBSTACLE_SPEED_START } from '../config.js';
import playing from './playing.js';

// Top-right corner, in virtual units. Computed from the current viewport
// width rather than stored, since width varies with device aspect ratio.
function muteButtonPos() {
  return { x: viewport.width - MUTE_BTN_MARGIN, y: MUTE_BTN_MARGIN };
}

function hitsMuteButton(x, y) {
  const { x: bx, y: by } = muteButtonPos();
  const dx = x - bx;
  const dy = y - by;
  return dx * dx + dy * dy <= MUTE_BTN_RADIUS * MUTE_BTN_RADIUS;
}

const menu = {
  update(dt) {
    // The backdrop keeps drifting on the menu so the first screen isn't dead.
    background.update(dt, OBSTACLE_SPEED_START);

    // Only the menu has room for a mute control: during play the whole
    // screen is the jump button, so a control there would steal taps.
    if (consumeTap()) {
      const { x, y } = getTapPos();
      if (hitsMuteButton(x, y)) {
        audio.toggleMute();
      } else {
        setState(playing);
      }
    }
  },

  render(ctx, alpha) {
    background.render(ctx, alpha);

    drawGround(ctx);

    drawText(ctx, 'COOL GAME', viewport.width / 2, viewport.height * 0.38, { size: 34 });
    drawText(ctx, 'tap to start', viewport.width / 2, viewport.height * 0.48, {
      size: 16,
      color: COLORS.muted,
    });
    drawText(ctx, `best ${game.best}`, viewport.width / 2, viewport.height * 0.56, {
      size: 14,
      color: COLORS.muted,
    });

    const { x, y } = muteButtonPos();
    drawMuteButton(ctx, x, y, audio.isMuted());
  },
};

export default menu;
