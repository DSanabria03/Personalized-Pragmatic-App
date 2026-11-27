import investigatorsSvg from '../assets/home/investigators.svg?raw';
import { range, rigIllustration } from '../utils/rigIllustration';

const MARKUP = rigIllustration(investigatorsSvg, [
  { period: 3.12, joints: [{ nodes: [142, 147, ...range(157, 163)], pivot: [185, 215], angle: 2.5 }] }, // hand with the magnifying glass
  { period: 3.12, joints: [{ nodes: [148, ...range(165, 172)], pivot: [288, 185], angle: -4 }] }, // pointing hand
  { period: 3.12, joints: [{ nodes: [139], pivot: [80, 280], angle: 6 }] }, // raised foot
  { period: 3.12, joints: [{ nodes: [134, 135, 136], pivot: [212, 80], angle: 6, lag: 0.35 }] }, // ponytail
  { period: 3.12, joints: [{ nodes: [...range(108, 129), ...range(174, 183)], pivot: [830, 200], angle: 2 }] }, // person with the bulb
]);

export default function InvestigatorsIllustration() {
  return (
    <div
      className="story-investigators home-illustration"
      role="img"
      aria-label="Two investigators, one with a magnifying glass and the other with a light bulb"
      dangerouslySetInnerHTML={MARKUP}
    />
  );
}
