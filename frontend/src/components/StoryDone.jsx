import { badgeIcon, LevelBar } from './Progress';

// The "Great job" screen at the end of a story (Figma: GREAT JOB, Home / Play again),
// with this play-through's results and, for a logged-in child, their level and new badges.

const TEXT = {
  en: {
    title: 'GREAT JOB!',
    found: 'secret messages found',
    first: 'found on the first try',
    tries: 'pictures chosen',
    xp: 'XP earned',
    levelUp: (n) => `🎉 Level up! You are now level ${n}!`,
    newBadge: 'New badge!',
    home: 'Home',
    again: 'Play again',
    note: 'Every try helps you learn. Small steps, big things!',
  },
  it: {
    title: 'BRAVISSIMO!',
    found: 'messaggi segreti trovati',
    first: 'trovati al primo tentativo',
    tries: 'immagini scelte',
    xp: 'XP guadagnati',
    levelUp: (n) => `🎉 Nuovo livello! Ora sei al livello ${n}!`,
    newBadge: 'Nuovo distintivo!',
    home: 'Home',
    again: 'Gioca ancora',
    note: 'Ogni tentativo ti aiuta a imparare. Piccoli passi, grandi cose!',
  },
};

export default function StoryDone({ result, language, onHome, onPlayAgain }) {
  const lang = language === 'it' ? 'it' : 'en';
  const t = TEXT[lang];
  const summary = (result && result.summary) || null;
  const progress = result && result.progress;

  return (
    <main style={styles.page}>
      <style>{CSS}</style>
      <div className="sd-pop" style={styles.hero}>
        <div style={{ fontSize: '56px' }}>⭐</div>
        <h1 style={styles.title}>{t.title}</h1>
        {result && result.speech && <p style={styles.pip}>“{result.speech}” <span style={{ color: '#888' }}>— Pip</span></p>}
      </div>

      {summary && (
        <section style={styles.tiles}>
          <Tile big={`${summary.solved} / ${summary.tables}`} label={t.found} color="#efe9ff" />
          <Tile big={summary.first_try} label={t.first} color="#e8f6ec" />
          <Tile big={summary.attempts} label={t.tries} color="#eaf2ff" />
          <Tile big={`+${summary.xp_earned}`} label={t.xp} color="#fff3c4" />
        </section>
      )}

      {result && result.level_up && progress && <div className="sd-pop" style={styles.banner}>{t.levelUp(progress.level)}</div>}

      {result && result.new_badges && result.new_badges.map((b) => (
        <div key={b.id} className="sd-pop" style={styles.banner}>
          <span style={{ fontSize: '28px', marginRight: '10px' }}>{badgeIcon(b.id)}</span>
          <strong>{t.newBadge}</strong>&nbsp;{b.title} — {b.description}
        </div>
      ))}

      {progress && (
        <section style={styles.card}>
          <LevelBar progress={progress} lang={lang} />
        </section>
      )}

      <p style={{ textAlign: 'center', color: '#666', margin: 0 }}>{t.note}</p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={onHome} style={{ ...styles.secondary, flex: '0 1 240px' }}>{t.home}</button>
        <button type="button" className="register-submit" onClick={onPlayAgain} style={{ flex: '0 1 240px', width: 'auto' }}>{t.again} ↻</button>
      </div>
    </main>
  );
}

function Tile({ big, label, color }) {
  return (
    <div style={{ ...styles.tile, background: color }}>
      <div style={{ fontSize: '34px', fontWeight: '900' }}>{big}</div>
      <div style={{ fontSize: '14px', color: '#444' }}>{label}</div>
    </div>
  );
}

const CSS = `
.sd-pop { animation: sd-pop .5s ease-out both; }
@keyframes sd-pop { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

const styles = {
  page: { maxWidth: '900px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  hero: { textAlign: 'center' },
  title: { fontSize: 'clamp(40px, 6vw, 72px)', margin: '4px 0', letterSpacing: '2px' },
  pip: { fontSize: '18px', maxWidth: '640px', margin: '8px auto 0', lineHeight: 1.4 },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' },
  tile: { borderRadius: '20px', padding: '18px', textAlign: 'center' },
  banner: { background: '#fff3c4', border: '2px solid #ffd77a', borderRadius: '18px', padding: '14px 18px', fontSize: '17px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  card: { background: '#f7f5ef', borderRadius: '24px', padding: '20px 24px' },
  secondary: { border: '2px solid #d2d9d0', background: '#fff', borderRadius: '999px', padding: '12px 26px', fontWeight: 'bold',
    cursor: 'pointer', fontSize: '16px' },
};
