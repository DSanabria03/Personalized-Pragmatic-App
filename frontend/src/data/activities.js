// The activity categories of the therapist's "Activities" page, in the order of the Figma.
// "id" is the "category" of the stories in backend/data/stories. For now only Hidden requests has exercises
// (the story "The secret message"), so it is every child's current focus.
export const CATEGORIES = [
  {
    id: 'hidden_requests',
    title: 'Hidden requests',
    description: 'Explore what someone is really asking.',
    tagline: 'Small clues. A world of meaning.',
    icon: '/resources/therapist/message-circle.svg',
    focusTitle: 'Noticing hidden requests',
    focusText: (name) => `Help ${name} explore what someone might be asking for, even when they don’t say it directly.`,
  },
  {
    id: 'metonymies',
    title: 'Metonymies',
    description: 'Discover how one word can stand for another.',
    icon: '/resources/therapist/replace.svg',
  },
  {
    id: 'truth_and_lies',
    title: 'Truth and lies',
    description: 'Look for clues in what people say.',
    icon: '/resources/therapist/messages-square.svg',
  },
  {
    id: 'metaphors',
    title: 'Metaphors',
    description: 'Find the meaning beyond the words.',
    icon: '/resources/therapist/sparkles.svg',
  },
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || null;

// What every child is practising for now.
export const CURRENT_FOCUS = CATEGORIES[0];

// Options of "Edit profile" (the backend checks the same values: SUPPORT_LEVELS in services/accounts.py).
export const SUPPORT_LEVELS = ['Guided', 'Supported', 'Independent'];

// How the child's page describes each support level ("...through play, with guided support and a focus on...").
export const SUPPORT_PHRASES = { Guided: 'guided support', Supported: 'extra support', Independent: 'growing independence' };
export const WEEKLY_GOALS = [1, 2, 3, 4, 5, 6, 7];
