import { useEffect, useState } from 'react';
import { api } from '../api';
import { BadgeList, LevelBar } from './Progress';
import { getPip } from '../data/pips';

// The child's start page after logging in with their code (based on the Figma "Overview" page):
// greeting, this week, today's adventure, level and badges - all from what the child really did.

const TEXT = {
  en: {
    hi: (name) => `Hi, ${name}!`,
    sub: 'A new day to feel, discover and grow.',
    week: 'YOUR WEEK',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    streak: (n) => (n === 1 ? '1 day of growing' : `${n} days of growing`),
    adventure: "TODAY'S ADVENTURE",
    story: 'The secret message',
    storyText: 'What do people really mean? Discover it with Pip at the restaurant.',
    play: "Let's explore",
    growing: "LOOK HOW YOU'RE GROWING",
    achievements: 'My achievements',
    note: 'Small steps, not scores — celebrate curiosity!',
    settings: 'Settings',
    logout: 'Log out',
    myPip: 'My Pip',
    playShort: 'Play',
  },
  it: {
    hi: (name) => `Ciao, ${name}!`,
    sub: 'Un nuovo giorno per sentire, scoprire e crescere.',
    week: 'LA TUA SETTIMANA',
    days: ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'],
    streak: (n) => (n === 1 ? '1 giorno di crescita' : `${n} giorni di crescita`),
    adventure: "L'AVVENTURA DI OGGI",
    story: 'Il messaggio segreto',
    storyText: 'Cosa vogliono dire davvero le persone? Scoprilo con Pip al ristorante.',
    play: 'Esploriamo',
    growing: 'GUARDA COME STAI CRESCENDO',
    achievements: 'I miei traguardi',
    note: 'Piccoli passi, non punteggi — festeggia la curiosità!',
    settings: 'Impostazioni',
    logout: 'Esci',
    myPip: 'Il mio Pip',
    playShort: 'Gioca',
  },
};

export default function ChildHome({ session, settings, onNavigate, onLogout }) {
  const lang = settings.language === 'it' ? 'it' : 'en';
  const t = TEXT[lang];
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const pip = getPip(session.pip); // chosen in "My Pip" (ChildSetup)
  const childName = session.nickname || session.name;

  useEffect(() => {
    api(`/api/me/progress?language=${lang}`)
      .then(setProgress)
      .catch((e) => setError(e.message));
  }, [lang]);

  return (
    <>
      <header className="header">
        <div className="brand" onClick={() => onNavigate('go_child_home')}>
          <div className="logo-dot">••</div>
          <span className="brand-name">Pip</span>
        </div>
        <nav className="nav-links child-home-nav">
          <button type="button" className="nav-button child-home-link" onClick={() => onNavigate('go_child_setup')}>{t.myPip}</button>
          <button type="button" className="nav-button child-home-link" onClick={() => onNavigate('go_settings')}>{t.settings}</button>
          <button type="button" className="nav-button child-home-link" onClick={onLogout}>{t.logout}</button>
          <button type="button" className="child-play-btn" onClick={() => onNavigate('go_story')}>{t.playShort}</button>
        </nav>
      </header>

      <main style={styles.page}>
        <section style={styles.hello}>
          <img src={pip ? pip.img : '/resources/icon.png'} alt="Your Pip" style={styles.heroImg} />
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 52px)' }}>{t.hi(childName)}</h1>
            <p style={{ margin: '6px 0 0', color: '#4b5563', fontSize: '18px' }}>{t.sub}</p>
          </div>
          {progress && progress.streak_days > 0 && <span style={styles.pill}>🌱 {t.streak(progress.streak_days)}</span>}
        </section>

        {error && <p style={{ color: '#b00020' }}>{error}</p>}

        {progress && (
          <section style={styles.card}>
            <div style={styles.label}>{t.week}</div>
            <div style={styles.week}>
              {progress.week.map((d) => (
                <div key={d.date} style={{ ...styles.day, ...(d.today ? styles.today : {}) }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>{t.days[d.weekday]}</div>
                  <div style={{ ...styles.dayCircle, ...(d.active ? styles.dayActive : {}) }}>{d.active ? '✓' : d.day}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ ...styles.card, ...styles.adventure }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={styles.label}>{t.adventure}</div>
            <h2 style={{ margin: '6px 0' }}>{t.story}</h2>
            <p style={{ margin: '0 0 16px', color: '#4b5563' }}>{t.storyText}</p>
            <button type="button" className="register-submit" onClick={() => onNavigate('go_story')}>{t.play} →</button>
          </div>
          <img src="/resources/stories/the_secret_message/ready_to_order.png" alt="" style={styles.storyImg} />
        </section>

        {progress && (
          <section style={styles.card}>
            <div style={styles.label}>{t.growing}</div>
            <LevelBar progress={progress} lang={lang} />
            <h3 style={{ margin: '20px 0 10px' }}>{t.achievements}</h3>
            <BadgeList badges={progress.badges} />
            <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#666' }}>{t.note}</p>
          </section>
        )}
      </main>
    </>
  );
}

const styles = {
  page: { maxWidth: '1000px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' },
  hello: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  heroImg: { width: '140px', maxWidth: '35%', objectFit: 'contain' },
  pill: { background: '#e8f6ec', color: '#1f7a45', borderRadius: '999px', padding: '8px 14px', fontWeight: 'bold' },
  card: { background: '#f7f5ef', borderRadius: '24px', padding: '20px 24px' },
  label: { fontSize: '12px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#666' },
  week: { display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '8px' },
  day: { textAlign: 'center', flex: 1, padding: '6px 0', borderRadius: '14px' },
  today: { background: '#fff' },
  dayCircle: { margin: '6px auto 0', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#fff', border: '2px solid #e5e1d8', fontWeight: 'bold', color: '#555' },
  dayActive: { background: '#2e9e5b', borderColor: '#2e9e5b', color: '#fff' },
  adventure: { display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', background: '#efe9ff' },
  storyImg: { width: '260px', maxWidth: '100%', borderRadius: '18px' },
};
