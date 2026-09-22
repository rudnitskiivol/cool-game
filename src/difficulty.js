// Difficulty ramp: pipe speed, gap height, and pipe spacing all move from a
// starting value toward a capped hard limit as score (pipes passed) rises.
// Score-based (not time-based) so two players on the same pipe face the
// same difficulty.
//
// The curve is an exponential approach: fast movement over the first
// DIFFICULTY_RAMP_PIPES pipes, then flattening asymptotically toward the
// cap so the game gets harder but never becomes impossible.
import {
  DIFFICULTY_RAMP_PIPES,
  OBSTACLE_GAP_MIN,
  OBSTACLE_GAP_START,
  OBSTACLE_SPACING_MIN,
  OBSTACLE_SPACING_START,
  OBSTACLE_SPEED_MAX,
  OBSTACLE_SPEED_START,
} from './config.js';

function progress(score) {
  return 1 - Math.exp(-score / DIFFICULTY_RAMP_PIPES);
}

function rampTo(start, target, score) {
  return start + (target - start) * progress(score);
}

export function speedForScore(score) {
  return rampTo(OBSTACLE_SPEED_START, OBSTACLE_SPEED_MAX, score);
}

export function gapForScore(score) {
  return rampTo(OBSTACLE_GAP_START, OBSTACLE_GAP_MIN, score);
}

export function spacingForScore(score) {
  return rampTo(OBSTACLE_SPACING_START, OBSTACLE_SPACING_MIN, score);
}
