import teamSvg from '../assets/home/team.svg?raw';
import { range, rigIllustration } from '../utils/rigIllustration';

const MARKUP = rigIllustration(teamSvg, [
  { period: 1.56, joints: [{ nodes: [200, 215, 216, 217], pivot: [232, 218], angle: 8 }] }, // waving hand
  { period: 3.12, joints: [{ nodes: [213, 214], pivot: [180, 74], angle: 6, lag: 0.35 }] }, // ponytail
  // the two puzzle pieces lean towards each other
  { period: 3.12, joints: [{ nodes: [...range(263, 275), 277, 278, 281, 282, 287], pivot: [433, 500], angle: -2.5 }] },
  { period: 3.12, joints: [{ nodes: [230, 231, 232, ...range(236, 248), ...range(251, 261)], pivot: [880, 500], angle: 2.5 }] },
]);

export default function TeamIllustration() {
  return (
    <div
      className="join-team home-illustration"
      role="img"
      aria-label="Three friends: one waves and two put a puzzle together"
      dangerouslySetInnerHTML={MARKUP}
    />
  );
}
