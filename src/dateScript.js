// The "Date Night" story: a linear script of dialogue lines, choices and
// flying levels. Pure data — states/story.js walks it, states/playing.js
// runs the levels.
//
// Steps:
//   { type: 'line', who: 'nika' | 'you' | 'narrator', text, mood? }
//   { type: 'choice', prompt, options: [{ text, delta, reply: <line> }] }
//   { type: 'level', title, goal, location, difficultyOffset, winLine: <line> }
//   { type: 'ending' }
//
// `mood` ('happy' | 'neutral' | 'sad') only matters on Nika's lines; it sets
// her expression until another of her lines changes it.

export const CHARACTER = {
  name: 'Nika',
  palette: {
    hair: '#6b4bd6',
    hairShade: '#5438b5',
    skin: '#f6d3bd',
    dress: '#ff7aa8',
    eye: '#2b2140',
    blush: '#ff8fa8',
    accent: '#ff8fb8',
  },
};

export const AFFECTION_START = 50;
// Every crash during a level costs this much: the pipes are the awkward
// moments of the date, and she's watching.
export const FAIL_PENALTY = 5;

export const SCRIPT = [
  { type: 'line', who: 'narrator', text: 'You finally asked Nika out. She said yes. Nobody knows why.' },
  { type: 'line', who: 'nika', mood: 'happy', text: 'So... the café at the end of town? Don\'t be late.' },
  { type: 'line', who: 'you', text: 'I\'ll fly there. Literally.' },
  { type: 'line', who: 'nika', mood: 'neutral', text: 'Everyone says that. Nobody makes it past the pipes.' },
  {
    type: 'level',
    title: 'Get to the café',
    goal: 5,
    location: 'classic',
    difficultyOffset: 0,
    winLine: { type: 'line', who: 'nika', mood: 'happy', text: 'You made it! And only slightly crumpled.' },
  },

  { type: 'line', who: 'nika', mood: 'neutral', text: 'So what do you do when you\'re not dodging plumbing?' },
  {
    type: 'choice',
    prompt: 'What do you say?',
    options: [
      {
        text: 'Honestly? Mostly dodging plumbing.',
        delta: 10,
        reply: { type: 'line', who: 'nika', mood: 'happy', text: 'Ha! At least you\'re consistent.' },
      },
      {
        text: 'I\'m a very mysterious person.',
        delta: 0,
        reply: { type: 'line', who: 'nika', mood: 'neutral', text: 'Mysterious. Or just bad at small talk?' },
      },
      {
        text: 'I\'d rather hear about you.',
        delta: 15,
        reply: { type: 'line', who: 'nika', mood: 'happy', text: 'Oh? ...Okay, that\'s actually sweet.' },
      },
    ],
  },
  { type: 'line', who: 'nika', mood: 'happy', text: 'Let\'s walk through the canyon. Try to keep up.' },
  {
    type: 'level',
    title: 'Walk through Sunset Canyon',
    goal: 8,
    location: 'canyon',
    difficultyOffset: 4,
    winLine: { type: 'line', who: 'nika', mood: 'happy', text: 'Not bad. You\'re sweating a little, though.' },
  },

  { type: 'line', who: 'nika', mood: 'neutral', text: 'It\'s getting late. There\'s a rooftop with the best view in the city.' },
  {
    type: 'choice',
    prompt: 'What do you say?',
    options: [
      {
        text: 'Lead the way.',
        delta: 5,
        reply: { type: 'line', who: 'nika', mood: 'happy', text: 'Good answer.' },
      },
      {
        text: 'Can we take the stairs this time?',
        delta: -5,
        reply: { type: 'line', who: 'nika', mood: 'sad', text: '...There are no stairs. There are only pipes.' },
      },
      {
        text: 'Only if you\'re there when I land.',
        delta: 15,
        reply: { type: 'line', who: 'nika', mood: 'happy', text: 'Smooth. Let\'s see if your flying matches your lines.' },
      },
    ],
  },
  {
    type: 'level',
    title: 'Reach the rooftop',
    goal: 12,
    location: 'neon',
    difficultyOffset: 9,
    winLine: { type: 'line', who: 'nika', mood: 'happy', text: 'You actually made it. I\'m impressed.' },
  },

  { type: 'ending' },
];

// Picked by final affection, highest threshold first.
export const ENDINGS = [
  {
    min: 75,
    lines: [
      { type: 'line', who: 'nika', mood: 'happy', text: 'Tonight was... really fun. Same time next week?' },
      { type: 'line', who: 'narrator', text: '♥ Nika wants a second date.' },
    ],
  },
  {
    min: 45,
    lines: [
      { type: 'line', who: 'nika', mood: 'neutral', text: 'That was nice. Weird, but nice.' },
      { type: 'line', who: 'narrator', text: 'Nika might text you back. Maybe.' },
    ],
  },
  {
    min: 0,
    lines: [
      { type: 'line', who: 'nika', mood: 'sad', text: 'I think I\'ll just... take the bus home.' },
      { type: 'line', who: 'narrator', text: 'Nika left. The pipes won again.' },
    ],
  },
];

export const THE_END = { type: 'line', who: 'narrator', text: 'THE END. Thanks for playing the prototype!' };

export const FAIL_LINES = [
  { type: 'line', who: 'nika', mood: 'sad', text: 'Ouch. Are you okay?' },
  { type: 'line', who: 'nika', mood: 'neutral', text: 'I\'ll pretend I didn\'t see that.' },
  { type: 'line', who: 'nika', mood: 'neutral', text: 'You and that pipe seem close.' },
  { type: 'line', who: 'nika', mood: 'sad', text: 'Maybe try flapping a bit more?' },
];

export function endingFor(affection) {
  return ENDINGS.find((e) => affection >= e.min).lines;
}
