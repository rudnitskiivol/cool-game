import { getFlightProfile } from './flightProfiles.js';

export const AFFECTION_START = 50;
export const FAIL_PENALTY = 5;

const line = (who, text, scene) => ({ type: 'line', who, text, scene });

// Story flight scripts connect each heroine's narrative scenes with meaningful, paced journeys.
export function scriptFor(character) {
  const steps = [];
  const profile = getFlightProfile(character);

  character.chapters.forEach(([scene, title, narration, dialogue], chapter) => {
    steps.push({ ...line('narrator', narration, scene), chapter: title });
    steps.push(line('character', dialogue, scene));

    const choices = chapter === 1 ? character.choices[0] : chapter === 3 ? character.choices[1] : null;
    if (choices) {
      steps.push({
        type: 'choice', scene, prompt: 'Твой выбор',
        options: choices.map(([text, delta, reply, endsRoute = false]) => ({
          text, delta, endsRoute,
          reply: line('character', reply, endsRoute ? '06-fail' : scene),
        })),
      });
    }

    if (chapter < 3) {
      const fromLocation = character.chapters[chapter][1];
      const toLocation = character.chapters[chapter + 1][1];
      const goal = profile.goals[chapter] || 20;

      steps.push({
        type: 'level',
        title: character.flights[chapter],
        scene,
        goal,
        fromLocation,
        toLocation,
        chapterIndex: chapter,
        character,
        profile,
        location: character.location,
        startLine: character.encouragement,
      });
    }
  });

  steps.push({ type: 'ending' });
  return steps;
}

export function endingFor(character, affection, betrayed = false) {
  const outcome = betrayed || affection < 45 ? 'bad' : affection >= 75 ? 'good' : 'open';
  const scene = outcome === 'good' ? '05-love' : outcome === 'bad' ? '06-fail' : character.chapters[3][0];
  return [
    line('character', character[outcome][0], scene),
    line('narrator', character[outcome][1], scene),
    line('narrator', 'Конец истории. Нажми, чтобы вернуться к выбору героини.', scene),
  ];
}

export const FLIGHT_LINES = {
  start: ['Полетели!', 'Я рядом с тобой.', 'Держим курс.'],
  halfway: ['Половина пути! Держись так же.', 'Отличный темп, мы на середине пути.'],
  almost: ['Уже видны огни цели!', 'Ещё немного, мы почти на месте!'],
  close: ['Осторожно!', 'Близко было, держи равновесие.'],
};

export const FAIL_LINES = [
  line('character', 'Ты в порядке? Давай попробуем ещё раз.'),
  line('character', 'Не торопись. Я подожду тебя.'),
  line('character', 'Спокойно. Сделаем ещё один заход.'),
];
