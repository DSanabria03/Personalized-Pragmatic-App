// Small building blocks for showing progress: the level bar and the badges.
// Used on the child's home page, the "Great job" screen and the therapist's child view.

const BADGE_ICONS = { first_steps: '👣', secret_seeker: '🔍', sharp_ears: '👂', every_day: '🌱' };

export function LevelBar({ progress, lang = 'en' }) {
  const percent = Math.round((100 * progress.xp_in_level) / progress.xp_per_level);
  const left = progress.xp_per_level - progress.xp_in_level;
  const level = lang === 'it' ? 'LIVELLO' : 'LEVEL';
  const toNext = lang === 'it' ? `${left} XP al prossimo livello` : `${left} XP to your next level`;
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong style={{ fontSize: '22px' }}>{level} {progress.level}</strong>
        <span style={{ fontWeight: 'bold' }}>{progress.xp_in_level} / {progress.xp_per_level} XP</span>
      </div>
      <div style={styles.track} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ ...styles.fill, width: `${percent}%` }} />
      </div>
      <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>{toNext}</div>
    </div>
  );
}

export function BadgeList({ badges }) {
  return (
    <div style={styles.badges}>
      {badges.map((b) => (
        <div key={b.id} style={{ ...styles.badge, opacity: b.earned ? 1 : 0.75 }}>
          <div style={{ ...styles.badgeIcon, ...(b.earned ? styles.badgeEarned : {}) }}>{BADGE_ICONS[b.id] || '⭐'}</div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{b.title}</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{b.description}</div>
            <div style={{ fontSize: '12px', color: b.earned ? '#1f7a45' : '#888', fontWeight: 'bold', marginTop: '4px' }}>
              {b.earned ? '✓' : `${b.progress} / ${b.target}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function badgeIcon(id) {
  return BADGE_ICONS[id] || '⭐';
}

const styles = {
  track: { height: '14px', background: '#e5e1d8', borderRadius: '999px', overflow: 'hidden', marginTop: '8px' },
  fill: { height: '100%', background: 'linear-gradient(90deg, #8b6bd6, #6e42c1)', borderRadius: '999px', transition: 'width .8s ease' },
  badges: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' },
  badge: { display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#fff', borderRadius: '16px', padding: '12px' },
  badgeIcon: { width: '44px', height: '44px', flex: '0 0 44px', borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '22px', background: '#eee', filter: 'grayscale(1)' },
  badgeEarned: { background: '#fff3c4', filter: 'none' },
};
