// Mobile haptic vibration feedback via Navigator Vibration API
export function vibrate(pattern = 12) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Graceful fallback on desktop or unsupported devices
  }
}

export const haptic = {
  tap: () => vibrate(12),
  pass: () => vibrate(18),
  collect: () => vibrate([14, 35, 18]),
  checkpoint: () => vibrate([22, 45, 25]),
  hit: () => vibrate([35, 50, 35]),
};
