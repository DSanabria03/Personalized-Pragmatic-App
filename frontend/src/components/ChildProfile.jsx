import TherapistLayout from './TherapistLayout';
import ChildAvatar from './ChildAvatar';
import Icon from './Icons';
import { FOCUS_INFO, formatMinutes } from '../data/mockData';

export default function ChildProfile({ onNavigate, kids, selectedChildId, setSelectedChildId }) {
  const child = kids.find((k) => k.id === selectedChildId) || kids[0];
  const focus = FOCUS_INFO[child.focus];

  return (
    <TherapistLayout active="children" onNavigate={onNavigate}>
      <div className="db-page-header">
        <div>
          <p className="db-eyebrow">Your practice</p>
          <h1 className="db-title">Children</h1>
          <p className="db-subtitle">A closer look at each little explorer’s practice journey.</p>
        </div>
        <div className="db-select-icon">
          <Icon name="users" />
          <select className="db-select" value={child.id} onChange={(e) => setSelectedChildId(e.target.value)}>
            {kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>
      </div>

      <section className="db-profile-hero">
        <div className="db-profile-main">
          <ChildAvatar child={child} size={96} />
          <div>
            <h2 className="db-profile-name">{child.name} <span>{child.age} years</span></h2>
            <p>Practising everyday communication through play, with {child.support.toLowerCase()} support and a focus on {child.focus.toLowerCase()}.</p>
            <small>{child.lastActive ? `Last active ${child.lastActive}` : 'No practice yet'}</small>
          </div>
        </div>
        <div className="db-profile-journey">
          <div className="db-side-hero-top">
            <p className="db-eyebrow">{child.name}’s journey</p>
            <button type="button" className="db-link" onClick={() => onNavigate('go_overview')}>Edit profile</button>
          </div>
          <div className="db-journey-grid">
            <div><small>Current focus</small><span>{child.focus}</span></div>
            <div><small>Support level</small><span>{child.support}</span></div>
            <div><small>Weekly goal</small><span>{child.weeklyGoal} days</span></div>
          </div>
        </div>
      </section>

      <div className="db-section-header">
        <h2 className="db-section-title db-section-title--lg">Little steps this week</h2>
        <div className="db-select-icon">
          <Icon name="calendar" />
          <select className="db-select">
            <option>26 Oct – 1 Nov 2026</option>
            <option>19 Oct – 25 Oct 2026</option>
          </select>
        </div>
      </div>

      <div className="db-week-stats">
        <div>
          <span className="db-icon-box"><Icon name="checkCircle" /></span>
          <div><small>Activities completed</small><p><strong>{child.activities}</strong> this week</p></div>
        </div>
        <div>
          <span className="db-icon-box"><Icon name="clock" /></span>
          <div><small>Practice time</small><p><strong>{formatMinutes(child.practiceMinutes)}</strong> at {child.name}’s own pace</p></div>
        </div>
        <div>
          <span className="db-icon-box"><Icon name="calendarCheck" /></span>
          <div><small>Practice days</small><p><strong>{child.practiceDays} / {child.weeklyGoal}</strong> of the weekly goal</p></div>
        </div>
      </div>

      <div className="db-profile-bottom">
        <section className="db-card">
          <h3 className="db-section-title">Exploring, one activity at a time</h3>
          <p className="db-small">Completed activities in {child.name}’s current learning journey</p>
          {child.progress.map((p) => (
            <div key={p.label} className="db-progress db-progress--lg">
              <div className="db-progress-label"><span>{p.label}</span><span>{p.done} / {p.total}</span></div>
              <div className="db-progress-track">
                <div className="db-progress-fill" style={{ width: `${(p.done / p.total) * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="db-small">Completion shows participation, not ability.</p>
        </section>

        <section className="db-focus-card">
          <p className="db-eyebrow db-eyebrow--blue">Current focus</p>
          <h3 className="db-section-title db-section-title--lg">{focus.title}</h3>
          <p>{focus.text(child.name)}</p>
          <small><Icon name="hand" size={14} /> {child.support} practice · one small step at a time</small>
          <button type="button" className="db-btn-primary" onClick={() => onNavigate('go_activities')}>
            View activities <Icon name="arrowRight" />
          </button>
        </section>
      </div>

      <p className="db-footnote">Example data · Practice progress reflects participation, not clinical development or physical growth.</p>
    </TherapistLayout>
  );
}
