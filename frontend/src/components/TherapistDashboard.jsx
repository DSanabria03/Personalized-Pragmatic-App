import { useState } from 'react';
import TherapistLayout from './TherapistLayout';
import { CURRENT_FOCUS } from '../data/activities';
import {
  SORT_OPTIONS, STATUS_OPTIONS, ageLabel, filterChildren, formatMinutes, greeting, shortDate, useChildren, weekRange,
} from '../utils/therapist';
import '../styles/TherapistDashboard.css';

// The therapist's Overview (Figma 645:75): this week's numbers for the whole practice, the activities of each day,
// and the children (4 per page). All real data from GET /api/children.
// The date range shows the week the numbers are about; only this week exists, so it has nothing to choose.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PAGE_SIZE = 4;
const icon = (name) => `/resources/therapist/${name}.svg`;

export default function TherapistDashboard({ session, onNavigate, onLogout, onOpenChild }) {
  const { data, error } = useChildren(onLogout);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('last');
  const [page, setPage] = useState(0);

  const children = data ? filterChildren(data.children, { search, status, sort }) : [];
  const pages = Math.max(1, Math.ceil(children.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = children.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const maxDay = data ? Math.max(1, ...data.activities_per_day) : 1;
  const changeFilter = (set) => (e) => { set(e.target.value); setPage(0); };

  return (
    <TherapistLayout active="dashboard" session={session} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="ov">
        <header className="ov-header">
          <h1 className="ov-title">{greeting()}, {session.name}.</h1>
          <p className="ov-subtitle">A little overview of how your explorers are growing.</p>
          {data && (
            <div className="ov-range">
              <span>{weekRange(data.week_start)}</span>
              <img src={icon('chevron-down-18')} alt="" />
            </div>
          )}
        </header>

        {error && <p className="tl-error">{error}</p>}

        {data && (
          <>
            <section className="ov-stats" aria-label="This week">
              <Stat title="Children active" icon="stat-people" value={data.children_active_week}
                note={`of ${data.children_registered} registered children`} />
              <Stat title="Activities completed" icon="stat-chart" value={data.activities_week}
                note="Across your practice this week" />
              <Stat title="Time spent exploring" icon="stat-clock" value={formatMinutes(data.practice_minutes_week)}
                note="At each child’s own pace" />
            </section>

            <section className="ov-trends" aria-label="Little moments of practice">
              <h2 className="ov-trends-title">Little moments of practice</h2>
              <p className="ov-trends-sub">Completed activities · all children</p>
              <p className="ov-trends-total">{data.activities_week} total</p>
              <div className="ov-bars">
                {data.activities_per_day.map((n, i) => (
                  <div key={DAYS[i]} className="ov-bar">
                    <div className="ov-bar-track">
                      {n > 0 && (
                        <div className="ov-bar-fill" style={{ height: `${(100 * n) / maxDay}%` }}>
                          <span>{n}</span>
                        </div>
                      )}
                    </div>
                    <span className="ov-bar-day">{DAYS[i]}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="ov-dir" aria-label="Your little explorers">
              <div className="ov-dir-head">
                <h2 className="tl-heading">Your little explorers</h2>
                <button type="button" className="ov-manage" onClick={() => onNavigate('go_children')}>Manage all children</button>
              </div>

              <div className="ov-controls">
                <label className="ov-search">
                  <img src={icon('search-18')} alt="" />
                  <input value={search} onChange={changeFilter(setSearch)} placeholder="Search name or child ID"
                    aria-label="Search name or child ID" />
                </label>
                <div className="tl-select ov-filter">
                  <span>{STATUS_OPTIONS.find((o) => o.id === status).label}</span>
                  <img src={icon('chevron-down-18')} alt="" />
                  <select value={status} onChange={changeFilter(setStatus)} aria-label="Show">
                    {STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div className="tl-select ov-sort">
                  <span>{SORT_OPTIONS.find((o) => o.id === sort).label}</span>
                  <img src={icon('chevron-down-18')} alt="" />
                  <select value={sort} onChange={changeFilter(setSort)} aria-label="Sort by">
                    {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="ov-columns" aria-hidden="true">
                <span className="ov-col-child">CHILD</span>
                <span className="ov-col-focus">CURRENT FOCUS</span>
                <span className="ov-col-week">THIS WEEK</span>
                <span className="ov-col-last">LAST ACTIVE</span>
              </div>

              <ul className="ov-rows">
                {data.children.length === 0 && (
                  <li className="tl-empty">
                    No children yet. <button type="button" onClick={() => onNavigate('go_add_child')}>Add your first child</button>
                  </li>
                )}
                {data.children.length > 0 && shown.length === 0 && <li className="tl-empty">No children match this search.</li>}
                {shown.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="ov-row" onClick={() => onOpenChild(c.id)}>
                      <span className="ov-row-mark" />
                      <span className="ov-row-name">{c.name}</span>
                      <span className="ov-row-meta">{[ageLabel(c.age), c.code].filter(Boolean).join(' · ')}</span>
                      <span className="ov-row-focus">{CURRENT_FOCUS.title}</span>
                      <span className="ov-row-week">{c.activities_week} {c.activities_week === 1 ? 'activity' : 'activities'}</span>
                      <span className="ov-row-last">{shortDate(c.last_active)}</span>
                      <span className="ov-row-view">View profile</span>
                      <img className="ov-row-arrow" src={icon('view-arrow')} alt="" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="ov-foot">
                <p>Showing {shown.length} of {children.length} children</p>
                {data.children.length > 0 && (
                  <nav className="ov-pages" aria-label="Pages">
                    {Array.from({ length: pages }, (_, i) => (
                      <button key={i} type="button" aria-current={i === current ? 'page' : undefined} onClick={() => setPage(i)}>
                        {i + 1}
                      </button>
                    ))}
                    <button type="button" className="ov-next" aria-label="Next page" disabled={current === pages - 1}
                      onClick={() => setPage(current + 1)}>
                      <img src={icon('next-page')} alt="" />
                    </button>
                  </nav>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </TherapistLayout>
  );
}

function Stat({ title, icon: name, value, note }) {
  return (
    <div className="ov-stat">
      <p className="ov-stat-title">{title}</p>
      <img className="ov-stat-icon" src={icon(name)} alt="" />
      <p className="ov-stat-value">{value}</p>
      <p className="ov-stat-note">{note}</p>
    </div>
  );
}
