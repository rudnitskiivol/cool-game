import { viewport } from '../viewport.js';
import { consumeTap, getTapPos } from '../input.js';
import { drawMuteButton, drawText } from '../draw.js';
import { game, setState } from '../game.js';
import * as background from '../background.js';
import * as ground from '../ground.js';
import * as audio from '../audio.js';
import { COLORS, MUTE_BTN_MARGIN, MUTE_BTN_RADIUS, OBSTACLE_SPEED_START } from '../config.js';
import { CHARACTER } from '../dateScript.js';
import { setLocation } from '../theme.js';
import playing from './playing.js';
import hub from './hub.js';
import story from './story.js';

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

// Plain text buttons below the score readout, as fractions of the screen
// height. Rect hit-test in virtual units, same idiom as the mute button.
const STORY_BTN_Y = 0.66;
const HUB_BTN_Y = 0.75;
const BTN_HALF_W = 100;
const BTN_HALF_H = 18;

function hitsButton(x, y, yFrac) {
  const by = viewport.height * yFrac;
  return (
    x >= viewport.width / 2 - BTN_HALF_W &&
    x <= viewport.width / 2 + BTN_HALF_W &&
    y >= by - BTN_HALF_H &&
    y <= by + BTN_HALF_H
  );
}

const menu = {
  // The story re-themes the world per scene; coming back here restores the
  // location the player actually picked.
  enter() {
    setLocation(game.location);
  },

  update(dt) {
    // The backdrop keeps drifting on the menu so the first screen isn't dead.
    background.update(dt, OBSTACLE_SPEED_START);
    ground.update(dt, OBSTACLE_SPEED_START);

    // Only the menu has room for a mute control: during play the whole
    // screen is the jump button, so a control there would steal taps.
    if (consumeTap()) {
      const { x, y } = getTapPos();
      if (hitsMuteButton(x, y)) {
        audio.toggleMute();
      } else if (hitsButton(x, y, STORY_BTN_Y)) {
        setState(story, 'new');
      } else if (hitsButton(x, y, HUB_BTN_Y)) {
        setState(hub);
      } else {
        setState(playing);
      }
    }
  },

  render(ctx, alpha) {
    background.render(ctx, alpha);

    ground.render(ctx, alpha);

    drawText(ctx, 'COOL GAME', viewport.width / 2, viewport.height * 0.38, { size: 34 });
    drawText(ctx, 'tap anywhere: endless', viewport.width / 2, viewport.height * 0.48, {
      size: 16,
      color: COLORS.muted,
    });
    drawText(ctx, `best ${game.best}  ·  ${game.coins} coins`, viewport.width / 2, viewport.height * 0.56, {
      size: 14,
      color: COLORS.muted,
    });
    drawText(ctx, '♥ Date Night', viewport.width / 2, viewport.height * STORY_BTN_Y, {
      size: 20,
      color: CHARACTER.palette.accent,
    });
    drawText(ctx, 'Locations & Style', viewport.width / 2, viewport.height * HUB_BTN_Y, {
      size: 16,
      color: COLORS.text,
    });

    const { x, y } = muteButtonPos();
    drawMuteButton(ctx, x, y, audio.isMuted());
  },
};

export default menu;
