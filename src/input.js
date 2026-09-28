import { viewport } from './viewport.js';

let tapQueued = false;
let pointerDown = false;

// Position of the most recently queued tap, converted into virtual units at
// event time (using the viewport transform already computed by resize).
// Only the menu screen currently reads this, to hit-test the mute toggle;
// no gameplay decision is ever made in here.
let tapX = 0;
let tapY = 0;

export function initInput(canvas) {
  canvas.addEventListener(
    'pointerdown',
    (e) => {
      e.preventDefault();
      tapQueued = true;
      pointerDown = true;

      const rect = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      tapX = (cssX - viewport.offsetX) / viewport.scale;
      tapY = cssY / viewport.scale;
    },
    { passive: false },
  );

  const release = () => {
    pointerDown = false;
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
  }
}

export function isPointerDown() {
  return pointerDown;
}

export function consumeTap() {
  const tapped = tapQueued;
  tapQueued = false;
  return tapped;
}

// Virtual-unit coordinates of the tap last recorded by the listener above.
// Read this alongside consumeTap() in the same update() call — it reflects
// whichever tap consumeTap() just reported (queueing and position are set
// together, synchronously, in the same event).
export function getTapPos() {
  return { x: tapX, y: tapY };
}

export function clearTap() {
  tapQueued = false;
  pointerDown = false;
}
