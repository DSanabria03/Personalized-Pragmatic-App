import teamSvg from '../assets/home/team.svg?raw';
import { rigIllustration } from '../utils/rigIllustration';

// The groups made here are moved by HomeJoin.css.
const MARKUP = rigIllustration(teamSvg, {
  name: 'team',
  parts: [
    ['team-head', 'Vector', 'Vector'],
    ['team-head', 'Vector_6', 'Vector_16'],
    ['team-hair', 'Vector_15', 'Vector_16'],
    ['team-hair-end', 'Vector_16', 'Vector_16'],
    ['team-wave', 'Vector_2', 'Vector_2'],
    ['team-wave', 'Vector_17', 'Vector_19'],
    ['team-puzzle-piece', 'Livello 2', 'Livello 2'], // person with the puzzle piece
    ['team-puzzle-circle', 'Livello 3', 'Livello 3'], // person with the circle that fits in it
    ['team-ring', 'Ellipse 4', 'Ellipse 4'],
    ['illustration-talk', 'Vector_10', 'Vector_10'],
    ['illustration-blink', 'Vector_11', 'Vector_12'],
    ['illustration-blink illustration-blink--late', 'Vector_71', 'Vector_72'],
    ['illustration-blink illustration-blink--later', 'Vector_48', 'Vector_49'],
  ],
});

export default function TeamIllustration() {
  return (
    <div
      className="join-team home-illustration home-enter"
      role="img"
      aria-label="Three friends: one waves and two put a puzzle together"
      dangerouslySetInnerHTML={MARKUP}
    />
  );
}
