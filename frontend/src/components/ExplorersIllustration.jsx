import explorersSvg from '../assets/home/explorers.svg?raw';
import { rigIllustration } from '../utils/rigIllustration';

const HEAD = [26, 24, 25, 29, 62, 63, 64, 65, 66, 67];
const ARMS = [36, 16, 42, 45, 46, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
const TORSO = [30, 31, 32, 50]; // 50 is the shirt hem line, which Figma keeps with the arms
const KNEELING_HEAD = [79, 88, 89, 90, 91, 92, 93, 94];
const KNEELING_ARMS = [70, 80, 81, 82, 83, 84, 85, 95, 96, 97, 98, 99, 100];
const KNEELING_TORSO = [69, 86, 87];

const MARKUP = rigIllustration(explorersSvg, [
  { // standing explorer with the telescope
    period: 3.12,
    joints: [
      { nodes: [...TORSO, ...ARMS, ...HEAD], pivot: [300, 390], angle: 1 },
      { nodes: ARMS, pivot: [287, 282], angle: 2.5 },
      { nodes: HEAD, pivot: [340, 250], angle: 3.5 },
      { nodes: [24, 25, 29], pivot: [405, 212], angle: 6, lag: 0.35 }, // ponytail
    ],
  },
  { // kneeling explorer with the binoculars
    period: 3.12,
    joints: [
      { nodes: [...KNEELING_TORSO, ...KNEELING_ARMS, ...KNEELING_HEAD], pivot: [480, 560], angle: -1 },
      { nodes: KNEELING_ARMS, pivot: [435, 452], angle: -2 },
      { nodes: KNEELING_HEAD, pivot: [440, 395], angle: -3.5 },
    ],
  },
]);

export default function ExplorersIllustration() {
  return (
    <div
      className="home-explorers home-illustration"
      role="img"
      aria-label="Two explorers looking through a telescope and binoculars"
      dangerouslySetInnerHTML={MARKUP}
    />
  );
}
