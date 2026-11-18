import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { BadgeList, LevelBar } from './Progress';

// The therapist's overview (based on the Figma "Children insights" screen): numbers for this week,
// all children with their login codes and progress, and one child's details. All real data.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const sceneName = (id) => id.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function since(ts) {
  if (!ts) return '—';
  const date = new Date(ts.replace(' ', 'T') + 'Z');
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default function TherapistDashboard({ session, onNavigate, onLogout }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    api('/api/children')
      .then((d) => {
        setData(d);
        if (!selected && d.children.length) setSelected(d.children[0].id);
      })
      .catch((e) => (e.status === 401 ? onLogout() : setError(e.message)));
  }, [selected, onLogout]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!selected) return;
    setDetail(null);
    api(`/api/children/${selected}`).then(setDetail).catch((e) => setError(e.message));
  }, [selected]);

  const resetCode = async () => {
    if (!detail || !window.confirm(`Create a new login code for ${detail.child.name}? The old code will stop working.`)) return;
    try {
      const child = await api(`/api/children/${detail.child.id}/reset-code`, { method: 'POST' });
      setDetail({ ...detail, child: { ...detail.child, code: child.code } });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const children = data ? data.children.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search.toUpperCase())) : [];
  const maxDay = data ? Math.max(1, ...data.activities_per_day) : 1;

  return (
    <>
      <header className="register-header">
        <div className="register-header-left">
          <button type="button" className="register-logo" onClick={() => onNavigate('go_dashboard')}>••</button>
          <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>Pip · For therapists</span>
        </div>
        <nav className="register-nav">
          <button type="button" onClick={() => onNavigate('go_add_child')}>+ Add a child</button>
          <button type="button" onClick={() => onNavigate('go_settings')}>Settings</button>
          <button type="button" onClick={onLogout}>Log out</button>
        </nav>
      </header>

      <main style={styles.page}>
        <div>
          <div style={styles.label}>YOUR PRACTICE</div>
          <h1 style={{ margin: '4px 0' }}>{greeting()}, {session.name}.</h1>
          <p style={{ margin: 0, color: '#555' }}>A little overview of how your explorers are growing.</p>
        </div>

        {error && <p style={{ color: '#b00020' }}>{error}</p>}

        {data && (
          <section style={styles.cards}>
            <Stat big={data.children_active_week} small={`of ${data.children_registered} registered children`} title="Children active this week" />
            <Stat big={data.activities_week} small="stories completed this week" title="Activities completed" />
            <Stat big={`${data.practice_minutes_week} min`} small="at each child's own pace" title="Time spent exploring" />
            <div style={styles.card}>
              <div style={styles.cardTitle}>Little moments of practice</div>
              <div style={styles.bars}>
                {data.activities_per_day.map((n, i) => (
                  <div key={DAYS[i]} style={styles.barCol}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{n || ''}</span>
                    <div style={{ ...styles.bar, height: `${8 + (60 * n) / maxDay}px`, opacity: n ? 1 : 0.35 }} />
                    <span style={{ fontSize: '11px', color: '#666' }}>{DAYS[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {data && (
          <section style={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Your little explorers <span style={{ color: '#888', fontWeight: 'normal' }}>({data.children_registered})</span></h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or code" style={styles.search} />
            </div>
            {data.children.length === 0 ? (
              <p>No children yet. <button type="button" style={styles.link} onClick={() => onNavigate('go_add_child')}>Add your first child →</button></p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>{['Child', 'Login code', 'Stories', 'This week', 'First try', 'Level', 'Last active', ''].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {children.map((c) => (
                    <tr key={c.id} style={{ background: selected === c.id ? '#efe9ff' : 'transparent' }}>
                      <td style={styles.td}><strong>{c.name}</strong><div style={{ fontSize: '12px', color: '#666' }}>{c.age}</div></td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 'bold' }}>{c.code}</td>
                      <td style={styles.td}>{c.stories_completed}</td>
                      <td style={styles.td}>{c.activities_week}</td>
                      <td style={styles.td}>{c.first_try_rate === null ? '—' : `${c.first_try_rate}%`}</td>
                      <td style={styles.td}>{c.level}</td>
                      <td style={styles.td}>{since(c.last_active)}</td>
                      <td style={styles.td}>
                        <button type="button" style={styles.small} onClick={() => setSelected(c.id)}>{selected === c.id ? 'Viewing' : 'View'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {detail && (
          <section style={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <div style={styles.label}>CHILD OVERVIEW</div>
                <h2 style={{ margin: '4px 0' }}>{detail.child.name}</h2>
                <div style={{ color: '#666' }}>{detail.child.age} · code <strong style={{ fontFamily: 'monospace' }}>{detail.child.code}</strong></div>
              </div>
              <button type="button" style={styles.small} onClick={resetCode}>New login code</button>
            </div>

            <div style={styles.cards}>
              <Stat big={detail.progress.stories_completed} title="Stories completed" />
              <Stat big={detail.progress.secret_messages} title="Secret messages found" />
              <Stat big={`${detail.progress.active_days}`} title="Practice days" />
              <Stat big={`${detail.progress.practice_minutes} min`} title="Practice time" />
            </div>

            <LevelBar progress={detail.progress} />

            <h3>Per scene: found on the first try</h3>
            {detail.scenes.length === 0 ? <p style={{ color: '#666' }}>Not played yet.</p> : detail.scenes.map((s) => (
              <div key={s.scene_id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>{sceneName(s.scene_id)}</span>
                  <span>{s.first_try} of {s.times_played} times ({s.first_try_rate ?? 0}%)</span>
                </div>
                <div style={styles.track}><div style={{ ...styles.fill, width: `${s.first_try_rate || 0}%` }} /></div>
              </div>
            ))}

            <h3>Badges</h3>
            <BadgeList badges={detail.progress.badges} />

            <h3>Recent choices</h3>
            {detail.recent_attempts.length === 0 ? <p style={{ color: '#666' }}>No choices yet.</p> : (
              <table style={styles.table}>
                <thead>
                  <tr>{['When', 'Scene', 'Choice', 'Try', 'Result', 'What Pip said'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {detail.recent_attempts.map((a, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{since(a.created_at)}</td>
                      <td style={styles.td}>{sceneName(a.scene_id)}</td>
                      <td style={styles.td}>{a.choice}</td>
                      <td style={styles.td}>{a.attempt_number}</td>
                      <td style={styles.td}>{a.is_correct ? '✓ found' : a.outcome === 'reveal' ? 'explained' : '…'}</td>
                      <td style={{ ...styles.td, fontSize: '13px', color: '#444', maxWidth: '360px' }}>{a.pip_said}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p style={{ fontSize: '12px', color: '#777' }}>Completion shows participation, not ability.</p>
          </section>
        )}
      </main>
    </>
  );
}

function Stat({ big, small, title }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: '900', margin: '6px 0 2px' }}>{big}</div>
      {small && <div style={{ fontSize: '13px', color: '#666' }}>{small}</div>}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1150px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  label: { fontSize: '12px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#666' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' },
  card: { background: '#f7f5ef', borderRadius: '20px', padding: '16px 18px' },
  cardTitle: { fontSize: '13px', fontWeight: 'bold', color: '#555' },
  bars: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '96px', marginTop: '8px' },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  bar: { width: '16px', borderRadius: '6px', background: '#6e42c1' },
  panel: { border: '2px solid #ece8de', borderRadius: '24px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  search: { border: '2px solid #d2d9d0', borderRadius: '999px', padding: '8px 14px', fontSize: '14px', minWidth: '220px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '12px', color: '#666', letterSpacing: '1px', padding: '8px', borderBottom: '2px solid #ece8de', textTransform: 'uppercase' },
  td: { padding: '10px 8px', borderBottom: '1px solid #f0ece3', verticalAlign: 'top' },
  small: { border: '2px solid #d2d9d0', background: '#fff', borderRadius: '999px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold' },
  link: { border: 'none', background: 'none', color: '#6e42c1', fontWeight: 'bold', cursor: 'pointer', padding: 0, fontSize: '16px' },
  track: { height: '10px', background: '#e5e1d8', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' },
  fill: { height: '100%', background: '#2e9e5b', borderRadius: '999px' },
};
