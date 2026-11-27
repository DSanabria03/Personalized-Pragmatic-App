// The Pips a child can choose in "Choose your Pip" (ChildSetup), in the order of the Figma.
// They have no name: in the story the friend is always called "Pip".
// The ids are the ones the backend accepts and saves (PIP_IDS in backend/services/accounts.py).
export const PIPS = [
  { id: 'milo', img: '/resources/pips/milo.png' },
  { id: 'bob', img: '/resources/pips/bob.png' },
  { id: 'henry', img: '/resources/pips/henry.png' },
  { id: 'thomas', img: '/resources/pips/thomas.png' },
];

export const getPip = (id) => PIPS.find((p) => p.id === id) || null;
