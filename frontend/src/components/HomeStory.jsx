import { useEffect, useState } from 'react';
import HomeScreen from './HomeScreen';
import InvestigatorsIllustration from './InvestigatorsIllustration';
import { useRevealOnce } from '../utils/useRevealOnce';
import { useTypewriter } from '../utils/useTypewriter';
import '../styles/HomeStory.css';

const ASSETS = '/resources/home/story';

// Same line breaks as the design
const LINES = [
  'Unlock the real meaning behind every day ',
  'moments through interactive clues and stories. ',
  'Remember, every message as an hidden key !',
];
const LENGTH = LINES.join('').length;

// Second screen of Home: what Pip is about.
// When the whole quote is on screen the opening mark appears, the text types itself and then the closing mark appears.
export default function HomeStory() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [textRef, started] = useRevealOnce(0.9);
  const typed = useTypewriter(LENGTH, started && !reduceMotion);
  const shown = reduceMotion ? LENGTH : typed;
  const done = shown === LENGTH;

  // The caret blinks while typing and fades out a moment after the last letter.
  const [caretGone, setCaretGone] = useState(false);
  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => setCaretGone(true), 1200);
    return () => clearTimeout(timer);
  }, [done]);

  const caret = started && !reduceMotion
    ? <span className={`story-caret${caretGone ? ' is-gone' : ''}`} />
    : null;

  let index = 0;
  const lines = LINES.map((line, lineIndex) => (
    <span key={line}>
      {lineIndex > 0 && <br />}
      {[...line].map((char) => {
        const i = index++;
        return (
          <span key={i}>
            {i === 0 && shown === 0 && caret}
            <span className={`story-char${i < shown ? ' is-shown' : ''}`}>{char}</span>
            {i === shown - 1 && caret}
          </span>
        );
      })}
    </span>
  ));

  return (
    <HomeScreen className="story-screen" label="What Pip is about">
      <div className="story-wall" />
      <img className="story-floor" src={`${ASSETS}/floor-line.svg`} alt="" />

      <div className="home-stage-top">
        <img className="story-dots-top" src={`${ASSETS}/dots-top.svg`} alt="" />
      </div>

      <div className="home-stage">
        <div className="story-dots-side"><img src={`${ASSETS}/dots-side.svg`} alt="" /></div>
        <img className="story-dots-floor" src={`${ASSETS}/dots-floor.svg`} alt="" />
        <img className="story-ring-small" src={`${ASSETS}/ring-small.svg`} alt="" />
        <img className="story-ring-large" src={`${ASSETS}/ring-large.svg`} alt="" />
        <img className="story-ring-center" src={`${ASSETS}/ring-center.svg`} alt="" />

        <blockquote className="story-quote">
          <span className={`story-mark story-mark--open${started ? ' is-shown' : ''}`} aria-hidden="true">“</span>
          <p ref={textRef} className="story-text">
            {/* Screen readers get the whole text at once, not the letters being typed */}
            <span className="story-text-full">{LINES.join('')}</span>
            <span aria-hidden="true">{lines}</span>
          </p>
          <span className={`story-mark story-mark--close${done && started ? ' is-shown' : ''}`} aria-hidden="true">“</span>
        </blockquote>

        <InvestigatorsIllustration />
      </div>
    </HomeScreen>
  );
}
