// Locations & skins picker. Same no-framework idiom as menu.js: manual
// rect/circle hit tests against the tap position, no DOM.
import { viewport } from '../viewport.js';
import { consumeTap, getTapPos } from '../input.js';
import { drawText } from '../draw.js';
import {
  game,
  selectLocation,
  selectSkin,
  setState,
  unlockLocation,
  unlockSkin,
} from '../game.js';
import { LOCATIONS, SKINS } from '../content.js';
import { setLocation, setSkin } from '../theme.js';
import * as background from '../background.js';
import * as ground from '../ground.js';
import { COLORS, OBSTACLE_SPEED_START } from '../config.js';
import menu from './menu.js';

const BACK_X = 16;
const BACK_Y = 28;
const BACK_HALF_W = 44;
const BACK_HALF_H = 16;

const ROW_TOP = 0.28;
const ROW_STEP = 0.075;
const ROW_HALF_W = 130;
const ROW_HALF_H = 20;

const SKIN_TOP = 0.72;
const SKIN_RADIUS = 22;
const SKIN_GAP = 64;

function locationRowY(i) {
  return viewport.height * (ROW_TOP + i * ROW_STEP);
}

function skinPos(i) {
  const totalWidth = (SKINS.length - 1) * SKIN_GAP;
  return {
    x: viewport.width / 2 - totalWidth / 2 + i * SKIN_GAP,
    y: viewport.height * SKIN_TOP,
  };
}

function hitsBack(x, y) {
  return x >= BACK_X - 10 && x <= BACK_X + BACK_HALF_W * 2 && y >= BACK_Y - BACK_HALF_H && y <= BACK_Y + BACK_HALF_H;
}

function hitsRow(x, y, rowY) {
  return (
    x >= viewport.width / 2 - ROW_HALF_W &&
    x <= viewport.width / 2 + ROW_HALF_W &&
    y >= rowY - ROW_HALF_H &&
    y <= rowY + ROW_HALF_H
  );
}

function hitsSkin(x, y, pos) {
  const dx = x - pos.x;
  const dy = y - pos.y;
  return dx * dx + dy * dy <= SKIN_RADIUS * SKIN_RADIUS;
}

function pickLocation(id) {
  if (game.unlockedLocations.includes(id)) {
    selectLocation(id);
    setLocation(id);
  } else if (unlockLocation(id)) {
    selectLocation(id);
    setLocation(id);
  }
}

function pickSkin(id) {
  if (game.unlockedSkins.includes(id)) {
    selectSkin(id);
    setSkin(id);
  } else if (unlockSkin(id)) {
    selectSkin(id);
    setSkin(id);
  }
}

const hub = {
  update(dt) {
    background.update(dt, OBSTACLE_SPEED_START);
    ground.update(dt, OBSTACLE_SPEED_START);

    if (consumeTap()) {
      const { x, y } = getTapPos();

      if (hitsBack(x, y)) {
        setState(menu);
        return;
      }

      for (let i = 0; i < LOCATIONS.length; i += 1) {
        if (hitsRow(x, y, locationRowY(i))) {
          pickLocation(LOCATIONS[i].id);
          return;
        }
      }

      for (let i = 0; i < SKINS.length; i += 1) {
        if (hitsSkin(x, y, skinPos(i))) {
          pickSkin(SKINS[i].id);
          return;
        }
      }
    }
  },

  render(ctx, alpha) {
    background.render(ctx, alpha);
    ground.render(ctx, alpha);

    drawText(ctx, '‹ Back', BACK_X, BACK_Y, { size: 16, align: 'left', color: COLORS.muted });
    drawText(ctx, 'Locations & Style', viewport.width / 2, viewport.height * 0.14, { size: 22 });
    drawText(ctx, `${game.coins} coins`, viewport.width / 2, viewport.height * 0.2, {
      size: 14,
      color: COLORS.muted,
    });

    for (let i = 0; i < LOCATIONS.length; i += 1) {
      const loc = LOCATIONS[i];
      const y = locationRowY(i);
      const unlocked = game.unlockedLocations.includes(loc.id);
      const selected = game.location === loc.id;
      const label = selected ? `> ${loc.name}` : loc.name;
      const status = unlocked ? (selected ? 'selected' : 'tap to select') : `${loc.cost} coins`;

      drawText(ctx, label, viewport.width / 2, y - 8, {
        size: 16,
        color: unlocked ? COLORS.text : COLORS.muted,
      });
      drawText(ctx, status, viewport.width / 2, y + 12, { size: 12, color: COLORS.muted });
    }

    drawText(ctx, 'Skins', viewport.width / 2, viewport.height * (SKIN_TOP - 0.09), {
      size: 14,
      color: COLORS.muted,
    });

    for (let i = 0; i < SKINS.length; i += 1) {
      const skin = SKINS[i];
      const pos = skinPos(i);
      const unlocked = game.unlockedSkins.includes(skin.id);
      const selected = game.skin === skin.id;

      ctx.globalAlpha = unlocked ? 1 : 0.4;
      ctx.fillStyle = skin.colors.player;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, SKIN_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (selected) {
        ctx.strokeStyle = COLORS.text;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, SKIN_RADIUS + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      const caption = unlocked ? skin.name : `${skin.cost}`;
      drawText(ctx, caption, pos.x, pos.y + SKIN_RADIUS + 16, { size: 11, color: COLORS.muted });
    }
  },
};

export default hub;
