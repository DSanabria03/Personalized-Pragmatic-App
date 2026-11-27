import { useEffect, useState } from 'react';
import { api } from '../api';
import TherapistLayout from './TherapistLayout';
import { badgeIcon } from './Progress';
import { CURRENT_FOCUS, SUPPORT_LEVELS, SUPPORT_PHRASES, WEEKLY_GOALS, getCategory } from '../data/activities';
import {
  ageLabel, avatarClass, avatarOf, formatMinutes, possessive, sceneName, shortDate, useChildren, weekRange,
} from '../utils/therapist';
import '../styles/TherapistChild.css';

// One child's page (Figma 645:681, "Analytics" in the menu): who they are, this week, and their practice.
// Below the design, what the old dashboard showed and the Figma doesn't have (kept on purpose):
// all-time numbers, first try per scene, the login code (and a new one), level and badges, recent choices.
//   childId  the child to show (none: the first one)

const icon = (name) => `/resources/therapist/${name}.svg`;

export default function TherapistChild({ session, childId, onNavigate, onLogout, onOpenChild }) {
  const { data, error: listError, reload } = useChildren(onLogout);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const id = childId ?? (data && data.children[0] ? data.children[0].id : null);

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;
    api(`/api/children/${id}`)
      .then((d) => { if (!cancelled) { setDetail(d); setError(''); } })
      .catch((e) => { if (!cancelled) (e.status === 401 ? onLogout() : setError(e.message)); });
    return () => { cancelled = true; };
  }, [id, onLogout]);

  const shown = detail && detail.child.id === id ? detail : null;

  const resetCode = async () => {
    if (!window.confirm(`Create a new login code for ${shown.child.name}? The old code will stop working.`)) return;
    try {
      const child = await api(`/api/children/${shown.child.id}/reset-code`, { method: 'POST' });
      setDetail({ ...shown, child: { ...shown.child, code: child.code } });
      reload();
    } catch (e) {
      setError(e.message);
    }
  };

  const savePlan = async (plan) => {
    const child = await api(`/api/children/${shown.child.id}`, { method: 'PATCH', body: plan });
    setDetail({ ...shown, child: { ...shown.child, support_level: child.support_level, weekly_goal: child.weekly_goal } });
    setEditing(false);
    reload();
  };

  return (
    <TherapistLayout active="child" session={session} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="cd">
        <header className="cd-header">
          <div>
            <p className="tl-eyebrow">YOUR PRACTICE</p>
            <h1 className="tl-title">Children</h1>
            <p className="tl-subtitle">A closer look at each little explorer’s practice journey.</p>
          </div>
          {data && data.children.length > 0 && (
            <div className="tl-select cd-switcher">
              <img src={icon('users-round')} alt="" />
              <span>{shown ? shown.child.name : ''}</span>
              <img src={icon('chevron-down-switcher')} alt="" />
              <select value={id ?? ''} onChange={(e) => onOpenChild(Number(e.target.value))} aria-label="Child">
                {data.children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </header>

        {(error || listError) && <p className="tl-error">{error || listError}</p>}
        {data && data.children.length === 0 && (
          <p className="tl-empty">
            No children yet. <button type="button" onClick={() => onNavigate('go_add_child')}>Add your first child</button>
          </p>
        )}

        {shown && (
          <ChildView detail={shown} onEdit={() => setEditing(true)} onResetCode={resetCode}
            onViewActivities={() => onNavigate('go_activities')} />
        )}
        {shown && editing && <EditProfile child={shown.child} onSave={savePlan} onClose={() => setEditing(false)} />}
      </div>
    </TherapistLayout>
  );
}

function ChildView({ detail, onEdit, onResetCode, onViewActivities }) {
  const { child, week, progress } = detail;
  const name = child.name;
  const categories = detail.categories.filter((c) => c.total > 0);

  return (
    <>
      <section className="cd-profile" aria-label={`${possessive(name)} profile`}>
        <img className={`cd-avatar${avatarClass(child.pip)}`} src={avatarOf(child.pip)} alt="" />
        <div className="cd-identity">
          <p className="cd-name-row"><span className="cd-name">{name}</span><span>{ageLabel(child.age)}</span></p>
          <p className="cd-description">
            Practising everyday communication through play, with {SUPPORT_PHRASES[child.support_level]} and a focus
            on {CURRENT_FOCUS.title.toLowerCase()}.
          </p>
          <p className="cd-last">{detail.last_active ? `Last active ${shortDate(detail.last_active)}` : 'No practice yet'}</p>
        </div>
        <img className="cd-divider" src={icon('profile-divider')} alt="" />
        <div className="cd-journey">
          <div className="cd-journey-head">
            <p className="cd-journey-title">{possessive(name).toUpperCase()} JOURNEY</p>
            <button type="button" className="cd-edit" onClick={onEdit}>Edit profile</button>
          </div>
          <div className="cd-plan">
            <Detail className="cd-plan-focus" label="Current focus" value={CURRENT_FOCUS.title} />
            <Detail className="cd-plan-support" label="Support level" value={child.support_level} />
            <Detail className="cd-plan-goal" label="Weekly goal" value={`${child.weekly_goal} ${child.weekly_goal === 1 ? 'day' : 'days'}`} />
          </div>
        </div>
      </section>

      <section className="cd-progress" aria-label="Little steps this week">
        <div className="cd-progress-head">
          <h2 className="tl-heading">Little steps this week</h2>
          <div className="cd-range">
            <img src={icon('calendar-days')} alt="" />
            <span>{weekRange(week.start)}</span>
            <img src={icon('chevron-down-16')} alt="" />
          </div>
        </div>

        <div className="cd-metrics">
          <Metric icon="circle-check" label="Activities completed" value={week.activities} context="this week" />
          <span className="cd-metric-divider" />
          <Metric icon="clock" label="Practice time" value={formatMinutes(week.practice_minutes)} context={`at ${possessive(name)} own pace`} />
          <span className="cd-metric-divider" />
          <Metric icon="calendar-check" label="Practice days" value={`${week.practice_days} / ${child.weekly_goal}`} context="of the weekly goal" />
        </div>

        <div className="cd-pair">
          <div className="cd-card cd-chart">
            <div>
              <h3 className="cd-card-title">Exploring, one activity at a time</h3>
              <p className="cd-card-sub">Completed activities in {possessive(name)} current learning journey</p>
            </div>
            {categories.map((c) => (
              <Bar key={c.category} label={getCategory(c.category)?.title || sceneName(c.category)}
                value={`${c.done} / ${c.total}`} percent={(100 * c.done) / c.total} />
            ))}
            <p className="cd-note">Completion shows participation, not ability.</p>
          </div>

          <div className="cd-focus">
            <p className="cd-focus-eyebrow">CURRENT FOCUS</p>
            <h3 className="cd-focus-title">{CURRENT_FOCUS.focusTitle}</h3>
            <p className="cd-focus-text">{CURRENT_FOCUS.focusText(name)}</p>
            <p className="cd-focus-approach">
              <img src={icon('hand-heart')} alt="" />{child.support_level} practice · one small step at a time
            </p>
            <button type="button" className="cd-focus-button" onClick={onViewActivities}>
              View activities<img src={icon('arrow-right-white')} alt="" />
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Not in the Figma: what the old dashboard showed ---------- */}
      <section className="cd-more" aria-label="All-time progress">
        <h2 className="tl-heading">All-time progress</h2>

        <div className="cd-metrics cd-metrics-4">
          <Metric icon="circle-check" label="Stories completed" value={progress.stories_completed} context="in total" />
          <span className="cd-metric-divider" />
          <Metric icon="message-circle" label="Secret messages found" value={progress.secret_messages} context="in total" />
          <span className="cd-metric-divider" />
          <Metric icon="calendar-check" label="Practice days" value={progress.active_days} context="in total" />
          <span className="cd-metric-divider" />
          <Metric icon="clock" label="Practice time" value={formatMinutes(progress.practice_minutes)} context="in total" />
        </div>

        <div className="cd-pair">
          <div className="cd-card cd-scenes">
            <div>
              <h3 className="cd-card-title">Found on the first try</h3>
              <p className="cd-card-sub">For each scene: how often {name} found the hidden meaning on the first try</p>
            </div>
            {detail.scenes.length === 0 ? <p className="cd-muted">Not played yet.</p> : detail.scenes.map((s) => (
              <Bar key={s.scene_id} label={sceneName(s.scene_id)} percent={s.first_try_rate || 0}
                value={`${s.first_try} of ${s.times_played} ${s.times_played === 1 ? 'time' : 'times'} (${s.first_try_rate ?? 0}%)`} />
            ))}
          </div>

          <div className="cd-card cd-code">
            <p className="cd-focus-eyebrow">LOGIN CODE</p>
            <p className="cd-code-value">{child.code}</p>
            <p className="cd-card-sub">{name} enters this code on the child login screen.</p>
            <button type="button" className="cd-outline" onClick={onResetCode}>New login code</button>
            <p className="cd-note">The old code stops working.</p>
          </div>
        </div>

        <div className="cd-card cd-level">
          <div className="cd-level-head">
            <h3 className="cd-card-title">Level {progress.level}</h3>
            <span>{progress.xp_in_level} / {progress.xp_per_level} XP</span>
          </div>
          <div className="cd-track" role="progressbar" aria-label="XP in this level" aria-valuemin={0}
            aria-valuemax={progress.xp_per_level} aria-valuenow={progress.xp_in_level}>
            <div style={{ width: `${(100 * progress.xp_in_level) / progress.xp_per_level}%` }} />
          </div>
          <p className="cd-card-sub">{progress.xp_per_level - progress.xp_in_level} XP to the next level</p>
          <ul className="cd-badges">
            {progress.badges.map((b) => (
              <li key={b.id} className={b.earned ? 'is-earned' : ''}>
                <span className="cd-badge-icon">{badgeIcon(b.id)}</span>
                <div>
                  <p className="cd-badge-title">{b.title}</p>
                  <p className="cd-badge-text">{b.description}</p>
                  <p className="cd-badge-progress">{b.earned ? '✓ Earned' : `${b.progress} / ${b.target}`}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="cd-card cd-choices">
          <h3 className="cd-card-title">Recent choices</h3>
          {detail.recent_attempts.length === 0 ? <p className="cd-muted">No choices yet.</p> : (
            <table>
              <thead>
                <tr>{['When', 'Scene', 'Choice', 'Try', 'Result', 'What Pip said'].map((h) => <th key={h}>{h.toUpperCase()}</th>)}</tr>
              </thead>
              <tbody>
                {detail.recent_attempts.map((a, i) => (
                  <tr key={i}>
                    <td>{shortDate(a.created_at)}</td>
                    <td>{sceneName(a.scene_id)}</td>
                    <td>{a.choice}</td>
                    <td>{a.attempt_number}</td>
                    <td>{a.is_correct ? '✓ found' : a.outcome === 'reveal' ? 'explained' : '…'}</td>
                    <td className="cd-said">{a.pip_said}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}

function Detail({ className, label, value }) {
  return (
    <div className={className}>
      <p className="cd-plan-label">{label}</p>
      <p className="cd-plan-value">{value}</p>
    </div>
  );
}

function Metric({ icon: name, label, value, context }) {
  return (
    <div className="cd-metric">
      <span className="cd-metric-symbol"><img src={icon(name)} alt="" /></span>
      <div className="cd-metric-content">
        <p className="cd-metric-label">{label}</p>
        <p className="cd-metric-value"><span>{value}</span>{context}</p>
      </div>
    </div>
  );
}

function Bar({ label, value, percent }) {
  return (
    <div className="cd-bar">
      <p className="cd-bar-label"><span>{label}</span><span>{value}</span></p>
      <div className="cd-track"><div style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

// "Edit profile": the support level and the weekly goal (not in the Figma: same colours and fields as the design).
function EditProfile({ child, onSave, onClose }) {
  const [support, setSupport] = useState(child.support_level);
  const [goal, setGoal] = useState(child.weekly_goal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ support_level: support, weekly_goal: goal });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="cd-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="cd-modal-card" role="dialog" aria-modal="true" aria-labelledby="cd-modal-title" onSubmit={submit}>
        <h2 id="cd-modal-title" className="tl-heading">Edit {possessive(child.name)} profile</h2>
        {error && <p className="tl-error">{error}</p>}
        <label className="cd-field">
          <span>Support level</span>
          <select value={support} onChange={(e) => setSupport(e.target.value)} autoFocus>
            {SUPPORT_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="cd-field">
          <span>Weekly goal</span>
          <select value={goal} onChange={(e) => setGoal(Number(e.target.value))}>
            {WEEKLY_GOALS.map((g) => <option key={g} value={g}>{g} {g === 1 ? 'day' : 'days'} a week</option>)}
          </select>
        </label>
        <div className="cd-modal-actions">
          <button type="button" className="cd-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="cd-save" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}
