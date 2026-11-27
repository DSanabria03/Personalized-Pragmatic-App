import { useState } from 'react';
import TherapistLayout from './TherapistLayout';
import { CURRENT_FOCUS } from '../data/activities';
import {
  SORT_OPTIONS, STATUS_OPTIONS, ageLabel, avatarClass, avatarOf, filterChildren, isNew, practisedThisWeek, shortDate, useChildren,
  weekRange,
} from '../utils/therapist';
import '../styles/TherapistChildren.css';

// Every child of the therapist (Figma 645:364), as cards. "View profile" opens the child's page.
// Practice days: one mark per day of the child's weekly goal (set in "Edit profile" on the child's page).

const icon = (name) => `/resources/therapist/${name}.svg`;

export default function TherapistChildren({ session, onNavigate, onLogout, onOpenChild }) {
  const { data, error } = useChildren(onLogout);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('last');

  const all = data ? data.children : [];
  const children = filterChildren(all, { search, status, sort });

  return (
    <TherapistLayout active="children" session={session} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="tc">
        <header className="tc-header">
          <div>
            <p className="tl-eyebrow">YOUR PRACTICE</p>
            <h1 className="tl-title">Children</h1>
            <p className="tl-subtitle">Every little explorer, in one place. Find a child and follow their practice journey.</p>
          </div>
          <button type="button" className="tc-add" onClick={() => onNavigate('go_add_child')}>
            <img src={icon('plus')} alt="" />Add a child
          </button>
        </header>

        {error && <p className="tl-error">{error}</p>}

        {data && (
          <>
            <section className="tc-glance" aria-label="Practice at a glance">
              <Summary value={all.length} title="Children in your practice" note="A little journey for everyone" />
              <span className="tc-glance-divider" />
              <Summary value={all.filter(practisedThisWeek).length} title="Practising this week" note={weekRange(data.week_start)} />
              <span className="tc-glance-divider" />
              <Summary value={all.filter(isNew).length} title="Getting started" note="Ready for their first little step" />
            </section>

            <section className="tc-dir" aria-label="Your little explorers">
              <h2 className="tl-heading">Your little explorers</h2>
              <div className="tc-controls">
                <label className="tc-search">
                  <img src={icon('search-17')} alt="" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by child’s name"
                    aria-label="Search by child’s name" />
                </label>
                <div className="tl-select tc-filter">
                  <span>{STATUS_OPTIONS.find((o) => o.id === status).label}</span>
                  <img src={icon('chevron-down-16')} alt="" />
                  <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Show">
                    {STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div className="tl-select tc-sort">
                  <span>Sort: {SORT_OPTIONS.find((o) => o.id === sort).label}</span>
                  <img src={icon('chevron-down-16')} alt="" />
                  <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
                    {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {all.length === 0 && (
                <p className="tl-empty">
                  No children yet. <button type="button" onClick={() => onNavigate('go_add_child')}>Add your first child</button>
                </p>
              )}
              {all.length > 0 && children.length === 0 && <p className="tl-empty">No children match this search.</p>}

              <ul className="tc-cards">
                {children.map((c) => <ChildCard key={c.id} child={c} onOpen={() => onOpenChild(c.id)} />)}
              </ul>
            </section>
          </>
        )}
      </div>
    </TherapistLayout>
  );
}

function Summary({ value, title, note }) {
  return (
    <div className="tc-summary">
      <p className="tc-summary-value">{value}</p>
      <div>
        <p className="tc-summary-title">{title}</p>
        <p className="tc-summary-note">{note}</p>
      </div>
    </div>
  );
}

function ChildCard({ child, onOpen }) {
  const fresh = isNew(child);
  const goal = child.weekly_goal;
  return (
    <li className="tc-card">
      <div className="tc-identity">
        <img className={`tc-avatar${avatarClass(child.pip)}`} src={avatarOf(child.pip)} alt="" />
        <div className="tc-identity-text">
          <p className="tc-name" title={child.name}>{child.name}</p>
          <p className="tc-age">{ageLabel(child.age)}</p>
        </div>
        {fresh && <span className="tc-new">New</span>}
      </div>

      <div className="tc-details">
        <div className="tc-focus">
          <p className="tc-label">Current focus</p>
          <p className="tc-focus-value">{CURRENT_FOCUS.title}</p>
        </div>
        <div className="tc-support">
          <p className="tc-label">Support level</p>
          <p className="tc-support-value">{child.support_level}</p>
        </div>
      </div>

      <div className="tc-week">
        <p className="tc-week-text">
          <span>{fresh ? 'Ready for a first activity' : 'Practice days this week'}</span>
          <span>{child.practice_days_week} / {goal} days</span>
        </p>
        <div className="tc-marks" aria-hidden="true">
          {Array.from({ length: goal }, (_, i) => <span key={i} className={i < child.practice_days_week ? 'is-done' : ''} />)}
        </div>
      </div>

      <div className="tc-foot">
        <p>{fresh ? 'No practice yet' : `Last active ${shortDate(child.last_active)}`}</p>
        <button type="button" className="tc-view" onClick={onOpen} aria-label={`View ${child.name}’s profile`}>
          View profile<img src={icon('arrow-right-15')} alt="" />
        </button>
      </div>
    </li>
  );
}
