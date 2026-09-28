// Narrative flight profiles tailored to each heroine's story, mood, and difficulty.
// Defines distinct physics, pacing, gap sizes, obstacle themes, and audio signatures.

export const FLIGHT_PROFILES = {
  // Аико: Мечтательный, умиротворяющий дзен-полёт
  aiko: {
    id: 'aiko',
    name: 'Медитативный дзен',
    badge: '🍃 Медитативный',
    tagline: 'Плавное парение среди бумажных фонариков и тишины',
    speed: 130,
    gravity: 1200,          // Мягкая, плавная гравитация
    jumpImpulse: -410,      // Нежный взмах
    glideGravity: 200,      // Долгое, спокойное парение
    glideMaxFall: 95,
    gap: 195,               // Очень просторные зазоры
    spacing: 285,           // Большое расстояние между препятствиями
    hitboxForgiveness: 7,   // Мягкий хитбокс
    goals: [18, 26, 36],    // Размеренные, полноценные полёты
    soundProfile: 'zen',    // Мягкие колокольчики / кото
    themeId: 'classic',
  },

  // Ника: Адреналиновый киберпанк / хардкорный раш
  'nika-cyberpunk': {
    id: 'nika-cyberpunk',
    name: 'Киберпанк-раш',
    badge: '⚡ Хардкорный',
    tagline: 'Скоростной прорыв сквозь файрволы мегаполиса',
    speed: 195,
    gravity: 1950,          // Быстрая, спортивная гравитация
    jumpImpulse: -530,      // Чёткий импульсный рывок
    glideGravity: 380,
    glideMaxFall: 160,
    gap: 148,               // Узкие техничные зазоры
    spacing: 235,           // Плотный ритм
    hitboxForgiveness: 3,   // Строгие требования к точности
    goals: [20, 30, 42],    // Напряжённый спринт
    soundProfile: 'cyber',  // Синтезаторные импульсы
    themeId: 'neon',
  },

  // Марина: Тёплый ламповый фото-флоу у моря
  marina: {
    id: 'marina',
    name: 'Морской бриз',
    badge: '☕ Тёплый флоу',
    tagline: 'Размеренный ритмичный полёт в лучах заката',
    speed: 155,
    gravity: 1550,
    jumpImpulse: -475,
    glideGravity: 280,
    glideMaxFall: 125,
    gap: 175,
    spacing: 265,
    hitboxForgiveness: 5,
    goals: [16, 24, 34],
    soundProfile: 'warm',   // Акустические тёплые перезвоны
    themeId: 'canyon',
  },

  // Валерия: Силовой спортивный ритм и драйв
  valeria: {
    id: 'valeria',
    name: 'Бойцовский раунд',
    badge: '🥊 Силовой драйв',
    tagline: 'Плотная гравитация и упругие мощные толчки',
    speed: 175,
    gravity: 2100,          // Ощутимый вес
    jumpImpulse: -560,      // Мощный толчок
    glideGravity: 420,
    glideMaxFall: 175,
    gap: 162,
    spacing: 250,
    hitboxForgiveness: 4,
    goals: [18, 28, 38],
    soundProfile: 'heavy',  // Плотные упругие тона
    themeId: 'canyon',
  },

  // Ева: Аналоговый нуар, саспенс и мистика
  eva: {
    id: 'eva',
    name: 'Аналоговый нуар',
    badge: '🎞️ Саспенс-нуар',
    tagline: 'Таинственный полёт сквозь тени и свет негативов',
    speed: 145,
    gravity: 1450,
    jumpImpulse: -455,
    glideGravity: 260,
    glideMaxFall: 115,
    gap: 168,
    spacing: 255,
    hitboxForgiveness: 5,
    goals: [16, 26, 36],
    soundProfile: 'noir',   // Приглушённые виниловые тона
    themeId: 'neon',
  },

  // Бесконечный режим (Endless)
  default: {
    id: 'default',
    name: 'Классический полёт',
    badge: '✦ Классика',
    tagline: 'Бесконечный полёт с нарастающей сложностью',
    ramp: true,             // speed/gap/spacing follow difficulty.js by score
    speed: 160,
    gravity: 1800,
    jumpImpulse: -520,
    glideGravity: 320,
    glideMaxFall: 140,
    gap: 170,
    spacing: 260,
    hitboxForgiveness: 4,
    goals: [9999],
    soundProfile: 'classic',
    themeId: 'classic',
  },
};

export function getFlightProfile(characterOrId) {
  const id = typeof characterOrId === 'string' ? characterOrId : characterOrId?.id;
  return FLIGHT_PROFILES[id] || FLIGHT_PROFILES.default;
}
