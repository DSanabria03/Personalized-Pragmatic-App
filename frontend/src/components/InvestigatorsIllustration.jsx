import bulbSvg from '../assets/home/investigator-bulb.svg?raw';
import glassSvg from '../assets/home/investigator-glass.svg?raw';
import { rigIllustration } from '../utils/rigIllustration';

// The groups made here are moved by HomeStory.css.
const BULB = rigIllustration(bulbSvg, {
  name: 'bulb',
  stillCopies: ['Vector_7'], // neck: no gap at the collar
  parts: [
    ['bulb-head', 'Vector_7', 'Vector_7'],
    ['bulb-head', 'Vector_24', 'Vector_25'],
    ['bulb-glow', 'Vector_5', 'Vector_5'],
    ['bulb-filament', 'Vector_16', 'Vector_16'],
  ],
});

// In the Figma export this file also holds the face and glasses of the person with the bulb,
// so those layers get their own group, which nods together with "bulb-head".
const GLASS = rigIllustration(glassSvg, {
  name: 'glass',
  parts: [
    ['glass-head', 'Vector', 'Vector_5'],
    ['glass-head', 'Vector_16', 'Vector_22'],
    ['glass-head', 'Vector_30', 'Vector_30'],
    ['glass-hair', 'Vector', 'Vector_3'],
    ['glass-hair-middle', 'Vector_2', 'Vector_3'],
    ['glass-hair-end', 'Vector_3', 'Vector_3'],
    ['glass-holding-arm', 'Group', 'Vector_13'], // magnifying glass and the arm that holds it
    ['glass-holding-arm', 'Vector_23', 'Vector_29'],
    ['glass-lens', 'Vector_11', 'Vector_11'],
    ['glass-pointing-arm', 'Vector_14', 'Vector_14'],
    ['glass-pointing-arm', 'Vector_31', 'Vector_38'],
    ['illustration-blink', 'Vector_19', 'Vector_20'],
    ['illustration-talk', 'Vector_22', 'Vector_22'],
    ['bulb-face', 'Vector_41', 'Vector_49'],
    ['illustration-blink illustration-blink--late', 'Vector_47', 'Vector_47'],
    ['illustration-blink illustration-blink--late', 'Vector_48', 'Vector_48'],
  ],
});

export default function InvestigatorsIllustration() {
  return (
    <div
      className="story-investigators home-illustration home-enter"
      role="img"
      aria-label="Two investigators, one with a magnifying glass and the other with a light bulb"
    >
      <div className="story-bulb" dangerouslySetInnerHTML={BULB} />
      <div className="story-glass" dangerouslySetInnerHTML={GLASS} />
    </div>
  );
}
