import { TICK_HZ, MAX_FRAME_MS } from './config.js';

const STEP_MS = 1000 / TICK_HZ;
const STEP_S = 1 / TICK_HZ;

export function startLoop({ update, render }) {
  let last = performance.now();
  let accumulator = 0;

  // Returning from the background hands us a huge elapsed time; without this the
  // accumulator would run hundreds of catch-up steps and teleport the world.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      last = performance.now();
      accumulator = 0;
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);

    const elapsed = Math.min(now - last, MAX_FRAME_MS);
    last = now;
    accumulator += elapsed;

    while (accumulator >= STEP_MS) {
      update(STEP_S);
      accumulator -= STEP_MS;
    }

    render(accumulator / STEP_MS);
  }

  requestAnimationFrame(frame);
}
