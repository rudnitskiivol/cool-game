// Placeholder character portrait drawn with plain paths, so the story can be
// play-tested before any real art exists. Swap this for sprite drawing later;
// the only contract is (ctx, cx, cy, mood, time, palette).
const TAU = Math.PI * 2;
const BLINK_EVERY = 3.7; // seconds
const BLINK_LENGTH = 0.13;

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function drawEyes(ctx, mood, time, p) {
  const blinking = time % BLINK_EVERY < BLINK_LENGTH;
  ctx.strokeStyle = p.eye;
  ctx.fillStyle = p.eye;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const side of [-1, 1]) {
    const x = 20 * side;
    if (mood === 'happy') {
      // Closed "^ ^" eyes read as a smile even at thumbnail size.
      ctx.beginPath();
      ctx.arc(x, 8, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (blinking) {
      ctx.beginPath();
      ctx.moveTo(x - 7, 5);
      ctx.lineTo(x + 7, 5);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.eye;
      ellipse(ctx, x, 5, 7, 9);
      ctx.fillStyle = '#ffffff';
      ellipse(ctx, x + 2.5, 1, 2.5, 2.5);
    }

    if (mood === 'sad') {
      ctx.beginPath();
      ctx.moveTo(x - 9 * side, -12);
      ctx.lineTo(x + 7 * side, -8);
      ctx.stroke();
    } else if (mood === 'surprised') {
      ctx.beginPath();
      ctx.arc(x, -6, 8, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }
  }
}

function drawMouth(ctx, mood, p) {
  ctx.strokeStyle = p.eye;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'happy') {
    ctx.arc(0, 26, 9, Math.PI * 0.15, Math.PI * 0.85);
  } else if (mood === 'sad') {
    ctx.arc(0, 40, 8, Math.PI * 1.2, Math.PI * 1.8);
  } else if (mood === 'surprised') {
    ctx.ellipse(0, 33, 5, 7, 0, 0, TAU);
  } else {
    ctx.moveTo(-6, 33);
    ctx.lineTo(6, 33);
  }
  ctx.stroke();
}

export function drawGirl(ctx, cx, cy, mood, time, p) {
  const bob = Math.sin(time * 1.8) * 2;

  ctx.save();
  ctx.translate(cx, cy + bob);

  // Hair behind the head and shoulders.
  ctx.fillStyle = p.hairShade;
  ellipse(ctx, 0, 30, 74, 110);

  // Shoulders / dress: the top half of a wide ellipse.
  ctx.fillStyle = p.dress;
  ctx.beginPath();
  ctx.ellipse(0, 128, 82, 50, 0, Math.PI, 0);
  ctx.fill();
  // Torso down to the top of the dialogue box. Not further: the box is
  // slightly translucent, and anything under it shows through.
  ctx.fillRect(-82, 127, 164, 42);

  ctx.fillStyle = p.skin;
  ctx.fillRect(-12, 45, 24, 40);
  ellipse(ctx, 0, 0, 52, 60);

  if (mood === 'happy') {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = p.blush;
    ellipse(ctx, -32, 20, 9, 5);
    ellipse(ctx, 32, 20, 9, 5);
    ctx.globalAlpha = 1;
  }

  drawEyes(ctx, mood, time, p);
  drawMouth(ctx, mood, p);

  // Bangs: a dome over the forehead with a jagged fringe.
  ctx.fillStyle = p.hair;
  ctx.beginPath();
  ctx.moveTo(-56, 0);
  ctx.quadraticCurveTo(-62, -74, 0, -72);
  ctx.quadraticCurveTo(62, -74, 56, 0);
  ctx.lineTo(44, -26);
  ctx.lineTo(30, -8);
  ctx.lineTo(14, -32);
  ctx.lineTo(-2, -12);
  ctx.lineTo(-18, -34);
  ctx.lineTo(-32, -10);
  ctx.lineTo(-44, -28);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
