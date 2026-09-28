import { viewport } from '../viewport.js';
import { clearTap, consumeTap, getTapPos } from '../input.js';
import { drawBackLabel, drawRoundedRect, drawText, hitsBackLabel, wrapText } from '../draw.js';
import { game, readStorage, setState, toggleCozyMode, writeStorage } from '../game.js';
import { haptic } from '../haptics.js';
import { CHARACTERS } from '../romance.js';
import { createArtPlayer, drawAvatar, preloadArt } from '../romanceArt.js';
import { getFlightProfile } from '../flightProfiles.js';
import story from './story.js';
import menu from './menu.js';

let selected = 0;
const portrait = createArtPlayer();
const active = () => CHARACTERS[selected];
const tabX = (i) => viewport.width / 2 + (i - 2) * Math.min(62, (viewport.width - 48) / 5);

function select(index) {
  selected = (index + CHARACTERS.length) % CHARACTERS.length;
  preloadArt(active(), ['portrait', '01-meeting']);
  portrait.show(active());
  writeStorage('dateCharacter', active().id);
}

const dates = {
  enter() {
    clearTap();
    portrait.reset();
    selected = Math.max(0, CHARACTERS.findIndex((c) => c.id === readStorage('dateCharacter')));
    CHARACTERS.forEach((c) => preloadArt(c));
    preloadArt(active(), ['01-meeting']);
    portrait.show(active());
  },

  update(dt) {
    portrait.update(dt);
    if (!consumeTap()) return;
    const { x, y } = getTapPos();

    if (hitsBackLabel(x, y)) {
      setState(menu);
      return;
    }

    if (x >= viewport.width - 120 && y <= 45) {
      toggleCozyMode();
      haptic.tap();
      return;
    }

    for (let i = 0; i < CHARACTERS.length; i++) {
      if (Math.hypot(x - tabX(i), y - 84) <= 26) {
        select(i);
        return;
      }
    }

    if (y >= 235 && y <= 291) {
      if (x >= 12 && x <= 64) select(selected - 1);
      else if (x >= viewport.width - 64 && x <= viewport.width - 12) select(selected + 1);
    }

    if (x >= 20 && x <= viewport.width - 20 && y >= 548 && y <= 600) {
      setState(story, { characterId: active().id });
    }
  },

  render(ctx) {
    const w = viewport.width;
    const character = active();
    const profile = getFlightProfile(character);

    ctx.fillStyle = '#101321';
    ctx.fillRect(0, 0, w, viewport.height);

    drawBackLabel(ctx, '‹ меню');

    const cozyLabel = game.cozyMode ? '♥ Уют: ВКЛ' : '♡ Уют: ВЫКЛ';
    drawText(ctx, cozyLabel, w - 16, 30, {
      size: 13,
      align: 'right',
      color: game.cozyMode ? '#ffb6ca' : '#7e8499',
      weight: '600',
    });

    // Character Avatars / Selector Row
    CHARACTERS.forEach((c, i) => {
      drawAvatar(ctx, c, tabX(i), 84, 22);
      ctx.strokeStyle = i === selected ? c.accent : '#383a4e';
      ctx.lineWidth = i === selected ? 3 : 1;
      ctx.beginPath();
      ctx.arc(tabX(i), 84, 25, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Character Portrait Card
    ctx.save();
    drawRoundedRect(ctx, 12, 122, w - 24, 280, 18);
    ctx.clip();
    const status = portrait.draw(ctx, 12, 122, w - 24, 280, 0.08);
    if (status !== 'ready') {
      drawText(ctx, status === 'error' ? 'Портрет недоступен' : 'Загрузка…', w / 2, 240, { size: 15 });
    }

    // Gradient overlay for text readability
    const gradient = ctx.createLinearGradient(0, 260, 0, 402);
    gradient.addColorStop(0, 'rgba(16,19,33,0)');
    gradient.addColorStop(0.7, 'rgba(16,19,33,0.85)');
    gradient.addColorStop(1, 'rgba(16,19,33,0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(12, 260, w - 24, 142);

    drawText(ctx, `${character.name}, ${character.age}`, w / 2, 356, { size: 26, weight: '700' });
    drawText(ctx, `${profile.badge}  ·  ${profile.name}`, w / 2, 386, {
      size: 12,
      color: character.accent,
      weight: '600',
    });
    ctx.restore();

    // Left/Right Nav Arrows
    for (const [x, label] of [[38, '‹'], [w - 38, '›']]) {
      ctx.fillStyle = 'rgba(12,14,26,0.7)';
      drawRoundedRect(ctx, x - 23, 240, 46, 46, 23);
      ctx.fill();
      drawText(ctx, label, x, 260, { size: 32 });
    }

    drawText(ctx, character.world, w / 2, 418, { size: 12, color: character.accent, weight: '500' });

    const title = wrapText(ctx, character.title, w - 40, 17);
    title.forEach((text, i) => drawText(ctx, text, w / 2, 442 + i * 20, { size: 17, weight: '600' }));

    const lines = wrapText(ctx, character.description, w - 48, 13, '400');
    lines.forEach((text, i) =>
      drawText(ctx, text, w / 2, 452 + title.length * 20 + i * 18, {
        size: 13,
        weight: '400',
        color: '#b8bdce',
      })
    );

    // Start Story Button
    ctx.fillStyle = character.accent;
    drawRoundedRect(ctx, 20, 548, w - 40, 52, 14);
    ctx.fill();

    drawText(ctx, 'Начать историю  →', w / 2, 574, { size: 18, color: '#151726', weight: '700' });
    drawText(ctx, `${selected + 1} / ${CHARACTERS.length}  ·  Диалоги, выборы и полёты`, w / 2, 619, {
      size: 12,
      color: '#969eb6',
    });
  },
};

export default dates;
