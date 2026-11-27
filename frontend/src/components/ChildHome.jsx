import { useEffect, useLayoutEffect, useState } from 'react';
import { api } from '../api';
import { BadgeList, LevelBar } from './Progress';
import { getPip } from '../data/pips';
import ExplorersIllustration from './ExplorersIllustration';
import HomeScreen from './HomeScreen';
import PageHeader from './PageHeader';
import { useRevealOnce } from '../utils/useRevealOnce';
import '../styles/Home.css';
import '../styles/ChildHome.css';

// The child's start page after logging in with their code (Figma: "Child · Welcome · New design").
// First screen: like the Figma frame, built with the same pieces as Home (header, explorers, circle, dots).
// Below (scroll): today's adventure, this week, level and badges - all from what the child really did.

const TEXT = {
  en: {
    hi: 'HI',
    myPip: 'My Pip',
    playShort: 'Play',
    week: 'YOUR WEEK',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    streak: (n) => (n === 1 ? '1 day of growing' : `${n} days of growing`),
    adventure: "TODAY'S ADVENTURE",
    story: 'The secret message',
    storyText: 'What do people really mean? Discover it with your Pip at the restaurant.',
    play: "Let's explore",
    growing: "LOOK HOW YOU'RE GROWING",
    achievements: 'My achievements',
    note: 'Small steps, not scores — celebrate curiosity!',
  },
  it: {
    hi: 'CIAO',
    myPip: 'Il mio Pip',
    playShort: 'Gioca',
    week: 'LA TUA SETTIMANA',
    days: ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'],
    streak: (n) => (n === 1 ? '1 giorno di crescita' : `${n} giorni di crescita`),
    adventure: "L'AVVENTURA DI OGGI",
    story: 'Il messaggio segreto',
    storyText: 'Cosa vogliono dire davvero le persone? Scoprilo con il tuo Pip al ristorante.',
    play: 'Esploriamo',
    growing: 'GUARDA COME STAI CRESCENDO',
    achievements: 'I miei traguardi',
    note: 'Piccoli passi, non punteggi — festeggia la curiosità!',
  },
};

export default function ChildHome({ session, settings, onNavigate }) {
  const lang = settings.language === 'it' ? 'it' : 'en';
  const t = TEXT[lang];
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [titleRef, titleShown] = useRevealOnce(0.25);
  const pip = getPip(session.pip); // chosen in "My Pip" (ChildSetup)
  const childName = (session.nickname || session.name || '').toUpperCase();

  // "HI, DAN !" fills the width in Figma. Longer names get a smaller title so they still fit on one line.
  const greeting = `${t.hi}, ${childName} !`;
  const titleScale = Math.min(1, 9 / Math.max(greeting.length, 1));

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    api(`/api/me/progress?language=${lang}`)
      .then(setProgress)
      .catch((e) => setError(e.message));
  }, [lang]);

  return (
    <div className="home child-home">
      <PageHeader onNavigate={onNavigate}>
        <div className="home-account">
          <button type="button" className="page-link" onClick={() => onNavigate('go_child_setup')}>{t.myPip}</button>
          <button type="button" className="home-login child-home-play" onClick={() => onNavigate('go_story')}>{t.playShort}</button>
        </div>
      </PageHeader>

      <main className="home-main">
        <HomeScreen className="hero-screen" label="Welcome">
          <div className="home-stage">
            <img className="home-circle" src="/resources/home/circle.svg" alt="" />
            <h1
              ref={titleRef}
              className={`home-title child-home-title home-fade${titleShown ? ' is-shown' : ''}`}
              style={{ '--title-scale': titleScale }}
            >
              {greeting}
            </h1>
            <img className="home-dots" src="/resources/home/dots.png" alt="" />
            <ExplorersIllustration />
          </div>
        </HomeScreen>

        <div className="child-home-more">
          {error && <p className="child-home-error">{error}</p>}

          <section className="child-home-card child-home-adventure">
            <div className="child-home-adventure-text">
              <p className="child-home-label">{t.adventure}</p>
              <h2>{t.story}</h2>
              <p>{t.storyText}</p>
              <button type="button" className="child-home-button" onClick={() => onNavigate('go_story')}>{t.play} →</button>
            </div>
            {pip && <img className="child-home-pip" src={pip.img} alt={pip.name || 'Your Pip'} />}
          </section>

          {progress && (
            <section className="child-home-card">
              <div className="child-home-card-top">
                <p className="child-home-label">{t.week}</p>
                {progress.streak_days > 0 && <span className="child-home-streak">🌱 {t.streak(progress.streak_days)}</span>}
              </div>
              <div className="child-home-week">
                {progress.week.map((d) => (
                  <div key={d.date} className={`child-home-day ${d.today ? 'is-today' : ''}`}>
                    <span>{t.days[d.weekday]}</span>
                    <span className={`child-home-day-circle ${d.active ? 'is-active' : ''}`}>{d.active ? '✓' : d.day}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {progress && (
            <section className="child-home-card">
              <p className="child-home-label">{t.growing}</p>
              <LevelBar progress={progress} lang={lang} />
              <h3>{t.achievements}</h3>
              <BadgeList badges={progress.badges} />
              <p className="child-home-note">{t.note}</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
