export const game = {
  state: null,
  score: 0,
  best: Number(localStorage.getItem('best') || 0),
};

export function setState(next, ...args) {
  game.state?.exit?.();
  game.state = next;
  next.enter?.(...args);
}

export function recordScore(score) {
  game.score = score;
  if (score > game.best) {
    game.best = score;
    localStorage.setItem('best', String(score));
  }
}
