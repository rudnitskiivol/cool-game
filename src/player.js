// Player rendering. The body is still a circle, but a beak and an eye give
// it a facing direction — without them the rotation would be invisible.
//
// Transform order matters: translate -> scale -> rotate. Scaling before the
// rotation means the squash/stretch always runs along the WORLD vertical
// (the direction of motion), not along the tilted body axis.
import {
  PLAYER_BEAK_HALF,
  PLAYER_BEAK_LENGTH,
  PLAYER_EYE_RADIUS,
  PLAYER_EYE_X,
  PLAYER_EYE_Y,
  PLAYER_RADIUS,
  SQUASH_AMOUNT,
} from './config.js';
import { drawRoundedRect } from './draw.js';

const TAU = Math.PI * 2;

export function drawPlayer(ctx, x, y, angle, squash, skin, styleId = 'classic') {
  const stretch = SQUASH_AMOUNT * squash;

  ctx.save();
  ctx.translate(x, y);
  if (stretch !== 0) ctx.scale(1 - stretch * 0.7, 1 + stretch);
  ctx.rotate(angle);

  if (styleId === 'aiko') {
    // Origami crane
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffd19a'; // Gold veins
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Body
    ctx.moveTo(-10, -5);
    ctx.lineTo(12, 0);
    ctx.lineTo(-8, 5);
    ctx.lineTo(-12, 0);
    ctx.fill();
    ctx.stroke();
    // Wing
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(2, -15 - squash * 5); // Flaps with squash!
    ctx.lineTo(10, 0);
    ctx.fill();
    ctx.stroke();
    // Head
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(16, -6);
    ctx.lineTo(20, -4);
    ctx.lineTo(12, 2);
    ctx.fill();
    ctx.stroke();
  } else if (styleId === 'nika-cyberpunk') {
    // Cyber-drone
    ctx.fillStyle = '#1e1e2e';
    ctx.strokeStyle = '#83e9f5';
    ctx.lineWidth = 2;
    // Main chassis
    drawRoundedRect(ctx, -12, -8, 24, 16, 4);
    ctx.fill();
    ctx.stroke();
    // Neon visor
    ctx.fillStyle = '#ff4db8';
    ctx.fillRect(4, -4, 10, 8);
    // Thruster flare
    ctx.fillStyle = 'rgba(131, 233, 245, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(-24 - Math.random() * 8, 0);
    ctx.lineTo(-12, 4);
    ctx.fill();
  } else if (styleId === 'marina') {
    // Swift in a scarf
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 10, 0, 0, TAU);
    ctx.fill();
    // Scarf
    ctx.fillStyle = '#ff6b8b';
    ctx.beginPath();
    ctx.arc(4, 0, 8, 0, TAU);
    ctx.fill();
    // Scarf tail
    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.lineTo(-15 - Math.random() * 5, -8 + Math.random() * 4);
    ctx.lineTo(-12, 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#ffb6ca';
    ctx.beginPath();
    ctx.moveTo(12, -3);
    ctx.lineTo(20, 0);
    ctx.lineTo(12, 3);
    ctx.fill();
  } else if (styleId === 'valeria') {
    // Fire falcon
    ctx.fillStyle = '#d3b0ff'; // Base color from theme
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, TAU);
    ctx.fill();
    // Fire crest
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(-12, -20 - Math.random()*5);
    ctx.lineTo(2, -12);
    ctx.fill();
    // Gold feathers/beak
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(22, 2);
    ctx.lineTo(14, 6);
    ctx.fill();
  } else if (styleId === 'eva') {
    // Ghostly film butterfly
    ctx.fillStyle = 'rgba(184, 213, 255, 0.4)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    // Wing 1
    ctx.beginPath();
    ctx.ellipse(-2, -8 - squash * 4, 10, 12, Math.PI / 4, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // Wing 2
    ctx.beginPath();
    ctx.ellipse(-2, 8 + squash * 4, 10, 12, -Math.PI / 4, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // Core
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, -2, 12, 4);
    // Film perforations on wings
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-4, -12 - squash*4, 2, 2);
    ctx.fillRect(0, -14 - squash*4, 2, 2);
  } else {
    // Classic bird
    ctx.fillStyle = skin.beak;
    ctx.beginPath();
    ctx.moveTo(PLAYER_RADIUS + PLAYER_BEAK_LENGTH, 0);
    ctx.lineTo(PLAYER_RADIUS - 3, -PLAYER_BEAK_HALF);
    ctx.lineTo(PLAYER_RADIUS - 3, PLAYER_BEAK_HALF);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skin.player;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, TAU);
    ctx.fill();

    ctx.fillStyle = skin.eye;
    ctx.beginPath();
    ctx.arc(PLAYER_EYE_X, PLAYER_EYE_Y, PLAYER_EYE_RADIUS, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}
