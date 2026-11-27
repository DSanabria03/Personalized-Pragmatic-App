import HomeScreen from './HomeScreen';
import TeamIllustration from './TeamIllustration';
import { useRevealOnce } from '../utils/useRevealOnce';
import '../styles/HomeJoin.css';

const ASSETS = '/resources/home/join';

// Third and last screen of Home.
export default function HomeJoin() {
  const [titleRef, titleShown] = useRevealOnce(0.3);

  return (
    <HomeScreen className="join-screen" label="Join us">
      <div className="home-stage-top">
        <img className="join-dots" src={`${ASSETS}/dots.svg`} alt="" />
      </div>

      <div className="home-stage">
        <img className="join-circle" src={`${ASSETS}/circle.svg`} alt="" />
        {/* The space after the comma is in the design and shifts that line to the left */}
        <h2 ref={titleRef} className={`join-title home-fade${titleShown ? ' is-shown' : ''}`}>JOIN US,{' '}<br />LET’S{' '}<br />EXPLORE!</h2>
        <TeamIllustration />
      </div>
    </HomeScreen>
  );
}
