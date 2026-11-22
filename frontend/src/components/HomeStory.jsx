import HomeScreen from './HomeScreen';
import InvestigatorsIllustration from './InvestigatorsIllustration';
import '../styles/HomeStory.css';

const ASSETS = '/resources/home/story';

// Second screen of Home: what Pip is about.
export default function HomeStory() {
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

        <blockquote className="story-quote home-enter">
          <span className="story-mark story-mark--open" aria-hidden="true">“</span>
          {/* Same line breaks as the design */}
          <p className="story-text">
            Unlock the real meaning behind every day{' '}<br />
            moments through interactive clues and stories.{' '}<br />
            Remember, every message as an hidden key !
          </p>
          <span className="story-mark story-mark--close" aria-hidden="true">“</span>
        </blockquote>

        <InvestigatorsIllustration />
      </div>
    </HomeScreen>
  );
}
