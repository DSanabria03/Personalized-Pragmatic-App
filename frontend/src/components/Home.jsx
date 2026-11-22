import { useLayoutEffect } from 'react';
import ExplorersIllustration from './ExplorersIllustration';
import HomeJoin from './HomeJoin';
import HomeScreen from './HomeScreen';
import HomeStory from './HomeStory';
import PageHeader from './PageHeader';
import '../styles/Home.css';

export default function Home({ onNavigate }) {
  // "Log-in" opens the therapist login (or the dashboard if already logged in),
  // "My Pip" opens the child login (or the child's home if already logged in).

  // Home is longer than the window: without this, logging out from a scrolled screen would open it halfway down.
  // Keep the braces: scrollTo returns a Promise in recent browsers, and an effect must not return one.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="home">
      <PageHeader onNavigate={onNavigate}>
        <div className="home-account">
          <button type="button" className="page-link" onClick={() => onNavigate('go_child_login')}>My Pip</button>
          <button type="button" className="home-login" onClick={() => onNavigate('go_login')}>Log-in</button>
        </div>
      </PageHeader>

      <main className="home-main">
        <HomeScreen className="hero-screen" label="Welcome">
          <div className="home-stage">
            <img className="home-circle" src="/resources/home/circle.svg" alt="" />
            <h1 className="home-title home-enter">HI,{' '}<br />EXPLORER!</h1>
            <img className="home-dots" src="/resources/home/dots.png" alt="" />
            <ExplorersIllustration />
          </div>
        </HomeScreen>
        <HomeStory />
        <HomeJoin />
      </main>
    </div>
  );
}
