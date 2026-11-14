// Datos de ejemplo (más adelante vendrán del backend)

// Pips que el niño puede elegir (pantalla "Make yourself at home")
export const PIPS = [
  { id: 'milo', name: 'MILO', img: '/resources/pip-milo.png', color: '#e3ecd9' },
  { id: 'bob', name: 'BOB', img: '/resources/pip-bob.png', color: '#fbe3d2' },
  { id: 'henry', name: 'HENRY', img: '/resources/pip-henry.png', color: '#dde6fb' },
  { id: 'thomas', name: 'THOMAS', img: '/resources/pip-thomas.png', color: '#eef5d6' },
];

export const getPip = (id) => PIPS.find((p) => p.id === id) || null;

export const FOCUS_OPTIONS = ['Hidden requests', 'Beyond words', 'Feelings', 'Metaphors'];
export const SUPPORT_OPTIONS = ['Guided', 'Supported', 'Independent'];
export const GOAL_OPTIONS = [3, 4, 5, 6, 7];

export const FOCUS_INFO = {
  'Hidden requests': {
    title: 'Noticing hidden requests',
    text: (name) => `Help ${name} explore what someone might be asking for, even when they don’t say it directly.`,
  },
  'Beyond words': {
    title: 'Looking beyond words',
    text: (name) => `Help ${name} notice faces, voices and gestures that say more than words.`,
  },
  Feelings: {
    title: 'Understanding feelings',
    text: (name) => `Help ${name} recognise how others feel and why.`,
  },
  Metaphors: {
    title: 'Finding hidden meanings',
    text: (name) => `Help ${name} discover what people mean when words say something else.`,
  },
};

export const INITIAL_CHILDREN = [
  {
    id: 'dan', name: 'Dan', age: 8, code: 'PIP-001', pip: 'milo', avatar: '/resources/pip-milo.png', color: '#e3ecd9',
    focus: 'Hidden requests', support: 'Guided', weeklyGoal: 5, practiceDays: 3,
    activities: 6, practiceMinutes: 42, lastActive: '1 Nov', daysAgo: 0, isNew: false,
    progress: [
      { label: 'Hidden requests', done: 3, total: 4 },
      { label: 'Beyond words', done: 2, total: 3 },
      { label: 'Feelings', done: 1, total: 2 },
    ],
  },
  {
    id: 'amelia', name: 'Amelia', age: 7, code: 'PIP-002', avatar: null, color: '#f6e3e3',
    focus: 'Feelings', support: 'Guided', weeklyGoal: 5, practiceDays: 4,
    activities: 8, practiceMinutes: 55, lastActive: '1 Nov', daysAgo: 0, isNew: false,
    progress: [
      { label: 'Feelings', done: 4, total: 5 },
      { label: 'Hidden requests', done: 2, total: 4 },
      { label: 'Beyond words', done: 1, total: 3 },
    ],
  },
  {
    id: 'leo', name: 'Leo', age: 6, code: 'PIP-003', avatar: null, color: '#e6f0dc',
    focus: 'Beyond words', support: 'Supported', weeklyGoal: 3, practiceDays: 2,
    activities: 5, practiceMinutes: 38, lastActive: '31 Oct', daysAgo: 1, isNew: false,
    progress: [
      { label: 'Beyond words', done: 2, total: 3 },
      { label: 'Feelings', done: 2, total: 4 },
      { label: 'Hidden requests', done: 1, total: 4 },
    ],
  },
  {
    id: 'maya', name: 'Maya', age: 9, code: 'PIP-004', avatar: null, color: '#ebe6f5',
    focus: 'Hidden requests', support: 'Independent', weeklyGoal: 3, practiceDays: 3,
    activities: 7, practiceMinutes: 61, lastActive: '30 Oct', daysAgo: 2, isNew: false,
    progress: [
      { label: 'Hidden requests', done: 4, total: 4 },
      { label: 'Metaphors', done: 2, total: 3 },
      { label: 'Feelings', done: 1, total: 2 },
    ],
  },
  {
    id: 'noah', name: 'Noah', age: 8, code: 'PIP-005', avatar: null, color: '#f5ecdc',
    focus: 'Feelings', support: 'Guided', weeklyGoal: 3, practiceDays: 1,
    activities: 6, practiceMinutes: 92, lastActive: '29 Oct', daysAgo: 3, isNew: false,
    progress: [
      { label: 'Feelings', done: 1, total: 4 },
      { label: 'Beyond words', done: 1, total: 3 },
      { label: 'Hidden requests', done: 0, total: 4 },
    ],
  },
  {
    id: 'sophie', name: 'Sophie', age: 6, code: 'PIP-006', avatar: null, color: '#dcefe8',
    focus: 'Beyond words', support: 'Supported', weeklyGoal: 3, practiceDays: 0,
    activities: 0, practiceMinutes: 0, lastActive: null, daysAgo: 99, isNew: true,
    progress: [
      { label: 'Beyond words', done: 0, total: 3 },
      { label: 'Feelings', done: 0, total: 4 },
      { label: 'Hidden requests', done: 0, total: 4 },
    ],
  },
];

export const WEEKLY_ACTIVITY = [
  { day: 'Mon', value: 3 }, { day: 'Tue', value: 5 }, { day: 'Wed', value: 4 },
  { day: 'Thu', value: 7 }, { day: 'Fri', value: 5 }, { day: 'Sat', value: 6 }, { day: 'Sun', value: 2 },
];

export const INITIAL_ACTIVITIES = [
  {
    id: 'hidden', title: 'Hidden requests', desc: 'Explore what someone is really asking.', icon: 'chat',
    tagline: 'Small clues. A world of meaning.',
    exercises: [
      { id: 'h1', title: 'It’s cold in here', subtitle: 'An everyday request', support: 'Guided',
        situation: 'Alex is sitting beside an open window and says, “It’s cold in here.”\nWhat might Alex be asking you to do?',
        meaning: 'Alex would like you to close the window.' },
      { id: 'h2', title: 'That looks tasty', subtitle: 'A request to share', support: 'Guided',
        situation: 'Your friend looks at your cookies and says, “That looks tasty.”\nWhat might your friend want?',
        meaning: 'Your friend would like you to share a cookie.' },
      { id: 'h3', title: 'I can’t reach it', subtitle: 'Asking for a little help', support: 'Supported',
        situation: 'Mum is looking at a box on a high shelf and says, “I can’t reach it.”\nWhat might Mum be asking?',
        meaning: 'Mum would like some help to get the box down.' },
    ],
  },
  {
    id: 'metonymies', title: 'Metonymies', desc: 'Discover how one word can stand for another.', icon: 'shapes',
    tagline: 'One word, many things.',
    exercises: [
      { id: 'm1', title: 'Grab a glass', subtitle: 'The container for the drink', support: 'Guided',
        situation: 'Grandpa says, “I drank a whole glass!”\nWhat did Grandpa drink?',
        meaning: 'He drank the water inside the glass, not the glass.' },
      { id: 'm2', title: 'The school called', subtitle: 'A place for people', support: 'Supported',
        situation: 'Dad says, “The school called me today.”\nWho called Dad?',
        meaning: 'A person who works at the school called him.' },
    ],
  },
  {
    id: 'truth', title: 'Truth and lies', desc: 'Look for clues in what people say.', icon: 'chats',
    tagline: 'Listen closely. Look carefully.',
    exercises: [
      { id: 't1', title: 'I love it!', subtitle: 'A polite white lie', support: 'Guided',
        situation: 'Sam opens a present, frowns a little and says, “Oh… I love it!”\nDoes Sam really love the present?',
        meaning: 'Probably not. Sam is being polite so nobody feels sad.' },
    ],
  },
  {
    id: 'metaphors', title: 'Metaphors', desc: 'Find the meaning beyond the words.', icon: 'sparkle',
    tagline: 'Words that paint pictures.',
    exercises: [
      { id: 'mt1', title: 'Busy as a bee', subtitle: 'Comparing to animals', support: 'Guided',
        situation: 'Teacher says, “Mia is as busy as a bee today.”\nWhat does the teacher mean?',
        meaning: 'Mia is working a lot and moving from task to task.' },
      { id: 'mt2', title: 'Heart of gold', subtitle: 'Describing people', support: 'Supported',
        situation: 'Mum says, “Your brother has a heart of gold.”\nWhat does Mum mean?',
        meaning: 'Your brother is very kind and generous.' },
    ],
  },
];

export const formatMinutes = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
