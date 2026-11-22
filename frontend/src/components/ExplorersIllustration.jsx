import explorersSvg from '../assets/home/explorers.svg?raw';
import { rigIllustration } from '../utils/rigIllustration';

// The groups made here are moved by Home.css.
const MARKUP = rigIllustration(explorersSvg, {
  name: 'explorers',
  stillCopies: ['Vector_47'], // kneeling torso: no gap next to the knee
  parts: [
    ['explorer-standing', 'Group', 'Group_7'], // upper body with the telescope
    ['explorer-standing', 'Vector_40', 'Vector_45'], // face
    ['explorer-kneeling', 'Vector_47', 'Vector_48'], // torso and far arm
    ['explorer-kneeling', 'Vector_57', 'Vector_78'], // head, near arm and binoculars
    ['explorer-telescope', 'Group_5', 'Group_5'],
    ['explorer-hair', 'Vector_11', 'Vector_11'],
    ['explorer-hair', 'Vector_7', 'Vector_8'],
    ['explorer-hair-middle', 'Vector_7', 'Vector_8'],
    ['explorer-hair-end', 'Vector_8', 'Vector_8'],
    ['explorer-eye', 'Vector_45', 'Vector_45'],
    ['explorer-look', 'Vector_77', 'Vector_78'],
    ['explorer-pupil-left', 'Vector_77', 'Vector_77'],
    ['explorer-pupil-right', 'Vector_78', 'Vector_78'],
  ],
});

export default function ExplorersIllustration() {
  return (
    <div
      className="home-explorers home-illustration home-enter"
      role="img"
      aria-label="Two explorers looking through a telescope and binoculars"
      dangerouslySetInnerHTML={MARKUP}
    />
  );
}
