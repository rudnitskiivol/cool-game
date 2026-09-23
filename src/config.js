// Every gameplay tunable lives here so tuning passes are one-line edits.

export const VIRTUAL_HEIGHT = 640;
export const MAX_VIRTUAL_WIDTH = 420;

export const TICK_HZ = 60;
export const MAX_FRAME_MS = 250;

export const GRAVITY = 1800;
export const JUMP_IMPULSE = -520;
export const PLAYER_X = 90;
export const PLAYER_RADIUS = 14;
export const GROUND_HEIGHT = 64;

// --- Horizontal drift -------------------------------------------------------
// The player can steer sideways within this corridor while holding the
// pointer down. Wide enough that the two halves of a twin-gap obstacle (see
// OBSTACLE_WIDTH below) are clearly separable targets.
export const PLAYER_X_MIN = 55;
export const PLAYER_X_MAX = 165;
export const PLAYER_DRIFT_RATE = 9; // exp-approach rate/s, same idiom as tilt

export const RESTART_LOCKOUT = 0.4;

// Obstacles (pipe pairs).
export const OBSTACLE_WIDTH = 70;
export const OBSTACLE_MARGIN = 60;

// Difficulty ramp: each of these moves from its START value toward its
// capped MAX/MIN value as score (pipes passed) rises. See difficulty.js.
export const OBSTACLE_SPEED_START = 160;
export const OBSTACLE_SPEED_MAX = 300;
export const OBSTACLE_GAP_START = 170;
export const OBSTACLE_GAP_MIN = 130;
export const OBSTACLE_SPACING_START = 260;
export const OBSTACLE_SPACING_MIN = 220;

// Pipes over which the ramp covers ~63% of the distance to its cap (an
// exponential approach — see difficulty.js). Lower = ramps up faster.
export const DIFFICULTY_RAMP_PIPES = 15;

// Shrinks the player's effective collision radius so deaths feel fair
// rather than pixel-exact against the pipes.
export const PLAYER_HITBOX_FORGIVENESS = 4;

export const COLORS = {
  sky: '#0f1220',
  ground: '#1b2036',
  player: '#ffd166',
  pipe: '#4cd97b',
  text: '#e8ecf8',
  muted: '#8b93b0',
  // Feel layer. The two hill colours sit between sky and ground on purpose:
  // they must read as depth without ever competing with the pipes.
  hillFar: '#151a2e',
  hillNear: '#1a2038',
  beak: '#f4874b',
  eye: '#221d2e',
  flash: '#ffffff',
  puff: '#ffe7ad',
  // Pipe shading. Both are lighter than the shaft, so the caps raise the
  // pipes' contrast against the sky rather than muddying it.
  pipeCap: '#74e79b',
  pipeHighlight: '#61df8d',
  // One shared line colour for the ground's top edge and its scrolling
  // dashes: barely above the ground fill, because motion is what makes a
  // low-contrast mark readable, not contrast.
  groundLine: '#232a47',
};

// --- Pipe caps -------------------------------------------------------------
// A band at each gap edge, plus a vertical highlight stripe down the shaft.
// PIPE_CAP_OVERHANG IS DELIBERATELY 0: collision in obstacles.js hits() tests
// the plain OBSTACLE_WIDTH shaft, so any horizontal overhang would draw pipe
// that the player can see but pass straight through. The cap is flush.
export const PIPE_CAP_OVERHANG = 0;
export const PIPE_CAP_HEIGHT = 16;
export const PIPE_HIGHLIGHT_X = 9; // inset from the pipe's left edge
export const PIPE_HIGHLIGHT_WIDTH = 9;

// --- Scrolling ground ------------------------------------------------------
// The ground shares the pipes' depth, so it scrolls at exactly their speed.
export const GROUND_SPEED_FACTOR = 1;
export const GROUND_EDGE_HEIGHT = 3;
export const GROUND_STRIPE_TILE = 52;
export const GROUND_STRIPE_WIDTH = 26;
export const GROUND_STRIPE_HEIGHT = 5;
export const GROUND_STRIPE_Y = 16; // below the ground's top edge

// --- HUD layout (kept here so the score pop can scale around a known anchor) ---
export const HUD_SCORE_Y = 64;
export const HUD_SCORE_SIZE = 40;
export const HUD_BEST_Y = 100;
export const HUD_BEST_SIZE = 14;

// --- Player rotation -------------------------------------------------------
// Target tilt is derived from vertical velocity: full nose-up at the jump
// impulse, ramping to full nose-down by PLAYER_TILT_FALL_VY. The eased
// approach uses separate rates so a flap snaps the nose up quickly while the
// dive back down is lazy — that asymmetry is most of the "feel".
export const PLAYER_TILT_UP = -0.6; // radians (~34 deg nose-up)
export const PLAYER_TILT_DOWN = 1.35; // radians (~77 deg nose-down)
export const PLAYER_TILT_FALL_VY = 720;
export const PLAYER_TILT_RISE_RATE = 24; // approach rate/s while rotating up
export const PLAYER_TILT_FALL_RATE = 5.5; // approach rate/s while rotating down

// --- Player shape (drawn in local, unrotated units) ------------------------
export const PLAYER_BEAK_LENGTH = 11;
export const PLAYER_BEAK_HALF = 4.5;
export const PLAYER_EYE_X = 5;
export const PLAYER_EYE_Y = -5;
export const PLAYER_EYE_RADIUS = 3;

// --- Tap feedback ----------------------------------------------------------
export const SQUASH_DURATION = 0.2; // seconds for the stretch to settle
export const SQUASH_AMOUNT = 0.26; // peak vertical stretch (world axes)
export const PUFF_DURATION = 0.28;
export const PUFF_START_RADIUS = 10;
export const PUFF_END_RADIUS = 30;
export const PUFF_ALPHA = 0.3;
export const PUFF_LINE_WIDTH = 2;

// --- Score pop -------------------------------------------------------------
export const SCORE_POP_DURATION = 0.26;
export const SCORE_POP_SCALE = 0.5; // peak extra scale, eases back to 1

// --- Death feedback --------------------------------------------------------
// A beat of hitstop before the game-over screen resolves. Purely presentation:
// score and collision are already settled when the freeze begins.
export const DEATH_FREEZE = 0.14;
export const SHAKE_DEATH = 6; // peak offset in virtual units
// Overdraw margin for edge-anchored art, so shake can't expose the screen
// edge. Must be >= SHAKE_DEATH.
export const SHAKE_EDGE_MARGIN = 8;
export const SHAKE_DURATION = 0.34;
export const SHAKE_FREQ_X = 47; // rad/s
export const SHAKE_FREQ_Y = 37;
export const FLASH_DEATH = 0.5; // peak alpha
export const FLASH_DURATION = 0.24;
// Game over settles over the frozen death frame rather than cutting to an
// empty screen: the world dims behind the panel as it fades in.
export const GAMEOVER_SCRIM = 0.66;
export const GAMEOVER_FADE = 0.28;

// --- Parallax background ---------------------------------------------------
// Rounded hills, deliberately not rectangles: a different silhouette from the
// pipes so the eye never confuses backdrop for obstacle. speedFactor is a
// fraction of the current pipe speed, so the backdrop speeds up with the ramp.
// --- Audio -------------------------------------------------------------
// All sound is synthesized (OscillatorNode/GainNode envelopes, no asset
// files) so the bundle stays tiny and there's nothing to decode on a
// low-end phone. See src/audio.js.
export const AUDIO_MUTE_KEY = 'muted';

// Flap: a quick upward pitch sweep, like a short wing-beat.
export const FLAP_FREQ_START = 420;
export const FLAP_FREQ_END = 680;
export const FLAP_DURATION = 0.09;
export const FLAP_GAIN = 0.18;

// Score: a short square-wave blip. Pitch nudges up with the in-run scoring
// streak (capped) so a long run sounds like it's building.
export const SCORE_FREQ_BASE = 780;
export const SCORE_FREQ_STEP = 18; // Hz added per point in the current run
export const SCORE_FREQ_MAX = 1200;
export const SCORE_DURATION = 0.1;
export const SCORE_GAIN = 0.16;

// Death: a falling sawtooth tone layered with a short noise burst for impact.
export const DEATH_TONE_FREQ_START = 220;
export const DEATH_TONE_FREQ_END = 60;
export const DEATH_TONE_DURATION = 0.28;
export const DEATH_TONE_GAIN = 0.22;
export const DEATH_NOISE_DURATION = 0.16;
export const DEATH_NOISE_GAIN = 0.18;

// New best: a bright three-note ascending sting.
export const BEST_NOTE_FREQS = [660, 880, 1046.5]; // E5, A5, C6
export const BEST_NOTE_DURATION = 0.09;
export const BEST_NOTE_GAP = 0.07;
export const BEST_NOTE_GAIN = 0.2;

// --- Mute toggle (menu screen only — the play screen is a full-bleed tap
// target, so there is nowhere safe to put a persistent control there) ------
export const MUTE_BTN_MARGIN = 22; // distance from top-right corner, virtual units
export const MUTE_BTN_RADIUS = 16;

export const BG_LAYERS = [
  {
    speedFactor: 0.16,
    themeKey: 'hillFar',
    tile: 210,
    peaks: [
      { x: 34, r: 58 },
      { x: 118, r: 40 },
      { x: 172, r: 72 },
    ],
  },
  {
    speedFactor: 0.42,
    themeKey: 'hillNear',
    tile: 165,
    peaks: [
      { x: 26, r: 32 },
      { x: 88, r: 46 },
      { x: 138, r: 24 },
    ],
  },
];
