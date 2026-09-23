// Taps are edge-triggered and buffered, never handled inside the event callback:
// the simulation consumes them on its own fixed step so input timing can't drift
// with the browser's event timing.
import { viewport } from './viewport.js';

let tapQueued = false;

// Position of the most recently queued tap, converted into virtual units at
// event time (using the viewport transform already computed by resize).
// Only the menu screen currently reads this, to hit-test the mute toggle;
// no gameplay decision is ever made in here.
let tapX = 0;
let tapY = 0;

// Continuous hold-and-drag state, read every simulation tick (unlike the tap
// queue, this is never consumed) so playing.js can steer the player toward
// wherever the pointer currently is while it's held down.
let pointerDown = false;
let pointerVirtualX = 0;

function toVirtualX(canvas, clientX) {
  const rect = canvas.getBoundingClientRect();
  const cssX = clientX - rect.left;
  return (cssX - viewport.offsetX) / viewport.scale;
}

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
      pointerVirtualX = tapX;
    },
    { passive: false },
  );

  canvas.addEventListener(
    'pointermove',
    (e) => {
      if (!pointerDown) return;
      pointerVirtualX = toVirtualX(canvas, e.clientX);
    },
    { passive: false },
  );

  const release = () => {
    pointerDown = false;
  };
  canvas.addEventListener('pointerup', release, { passive: false });
  canvas.addEventListener('pointercancel', release, { passive: false });
  canvas.addEventListener('pointerleave', release, { passive: false });
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
}

export function isPointerDown() {
  return pointerDown;
}

export function getPointerX() {
  return pointerVirtualX;
}
