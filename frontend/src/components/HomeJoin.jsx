import HomeScreen from './HomeScreen';
import TeamIllustration from './TeamIllustration';
import '../styles/HomeJoin.css';

const ASSETS = '/resources/home/join';

// Third and last screen of Home.
export default function HomeJoin() {
  return (
    <HomeScreen className="join-screen" label="Join us">
      <div className="home-stage-top">
        <img className="join-dots" src={`${ASSETS}/dots.svg`} alt="" />
      </div>

      <div className="home-stage">
        <img className="join-circle" src={`${ASSETS}/circle.svg`} alt="" />
        {/* The space after the comma is in the design and shifts that line to the left */}
        <h2 className="join-title home-enter">JOIN US,{' '}<br />LET’S{' '}<br />EXPLORE!</h2>
        <TeamIllustration />
      </div>
    </HomeScreen>
  );
}
