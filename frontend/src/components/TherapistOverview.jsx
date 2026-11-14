import { useEffect, useMemo, useState } from 'react';
import TherapistLayout from './TherapistLayout';
import ChildAvatar from './ChildAvatar';
import Icon from './Icons';
import {
  FOCUS_OPTIONS, SUPPORT_OPTIONS, GOAL_OPTIONS, WEEKLY_ACTIVITY, formatMinutes,
} from '../data/mockData';

const BAR_COLORS = ['#6e42c1', '#c98aa0', '#8aa9d6'];
const PAGE_SIZE = 4;

export default function TherapistOverview({ onNavigate, kids, updateChild, onOpenChild }) {
  const [selectedId, setSelectedId] = useState(kids[0]?.id);
  const [search, setSearch] = useState('');
  const [focusFilter, setFocusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('active');
  const [page, setPage] = useState(1);

  const selected = kids.find((k) => k.id === selectedId) || kids[0];

  // Formulario "Customize journey"
  const [form, setForm] = useState({ focus: '', support: '', weeklyGoal: 5 });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (selected) setForm({ focus: selected.focus, support: selected.support, weeklyGoal: selected.weeklyGoal });
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Estadísticas
  const activeCount = kids.filter((k) => k.practiceDays > 0).length;
  const totalActivities = kids.reduce((sum, k) => sum + k.activities, 0);
  const totalMinutes = kids.reduce((sum, k) => sum + k.practiceMinutes, 0);
  const weeklyTotal = WEEKLY_ACTIVITY.reduce((sum, d) => sum + d.value, 0);
  const maxBar = Math.max(...WEEKLY_ACTIVITY.map((d) => d.value));

  // Tabla filtrada
  const filtered = useMemo(() => {
    let list = kids.filter((k) =>
      (k.name.toLowerCase().includes(search.toLowerCase()) || k.code.toLowerCase().includes(search.toLowerCase())) &&
      (focusFilter === 'all' || k.focus === focusFilter));
    list = [...list].sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : a.daysAgo - b.daysAgo));
    return list;
  }, [kids, search, focusFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search, focusFilter, sortBy]);

  const handleSave = () => {
    updateChild(selected.id, { focus: form.focus, support: form.support, weeklyGoal: Number(form.weeklyGoal) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <TherapistLayout active="overview" onNavigate={onNavigate}>
      <div className="db-overview">
        {/* COLUMNA IZQUIERDA */}
        <div className="db-overview-main">
          <div className="db-page-header">
            <div>
              <p className="db-eyebrow">Your practice</p>
              <h1 className="db-title">Good morning, Dr. Emma.</h1>
              <p className="db-subtitle">A little overview of how your explorers are growing.</p>
            </div>
          </div>

          <div className="db-stats-row">
            <div className="db-stat-card">
              <div className="db-stat-top"><span>Children active</span><Icon name="users" /></div>
              <strong className="db-stat-number">{activeCount}</strong>
              <span className="db-stat-foot">of {kids.length} registered children</span>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-top"><span>Activities completed</span><Icon name="chart" /></div>
              <strong className="db-stat-number">{totalActivities}</strong>
              <span className="db-stat-foot">Across your practice this week</span>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-top"><span>Time spent exploring</span><Icon name="clock" /></div>
              <strong className="db-stat-number">{formatMinutes(totalMinutes)}</strong>
              <span className="db-stat-foot">At each child’s own pace</span>
            </div>
          </div>

          <section className="db-chart-card">
            <div className="db-chart-header">
              <div>
                <h3 className="db-section-title">Little moments of practice</h3>
                <p className="db-small">Completed activities · all children</p>
              </div>
              <span className="db-link-muted">{weeklyTotal} total</span>
            </div>
            <div className="db-bars">
              {WEEKLY_ACTIVITY.map((d) => (
                <div key={d.day} className="db-bar-col">
                  <div className="db-bar-track">
                    <div className="db-bar-fill" style={{ height: `${(d.value / maxBar) * 100}%` }}>
                      <span>{d.value}</span>
                    </div>
                  </div>
                  <span className="db-bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="db-section-header">
              <h2 className="db-section-title db-section-title--lg">
                Your little explorers <span className="db-count">{kids.length}</span>
              </h2>
              <button type="button" className="db-link-muted" onClick={() => onNavigate('go_children')}>Manage all children</button>
            </div>

            <div className="db-filters">
              <div className="db-search">
                <Icon name="search" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or child ID" />
              </div>
              <select className="db-select" value={focusFilter} onChange={(e) => setFocusFilter(e.target.value)}>
                <option value="all">All children</option>
                {FOCUS_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select className="db-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="active">Last active</option>
                <option value="name">Name</option>
              </select>
            </div>

            <table className="db-table">
              <thead>
                <tr><th>Child</th><th>Current focus</th><th>This week</th><th>Last active</th><th /></tr>
              </thead>
              <tbody>
                {visible.map((k) => {
                  const isSel = k.id === selected?.id;
                  return (
                    <tr key={k.id} className={isSel ? 'db-row--selected' : ''} onClick={() => setSelectedId(k.id)}>
                      <td>
                        <div className="db-child-cell">
                          <ChildAvatar child={k} size={32} />
                          <div><strong>{k.name}</strong><span>{k.age} years · {k.code}</span></div>
                        </div>
                      </td>
                      <td><span className={`db-pill ${isSel ? 'db-pill--active' : ''}`}>{k.focus}</span></td>
                      <td>{k.activities} activities</td>
                      <td>{k.lastActive || '—'}</td>
                      <td className="db-row-action">
                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpenChild(k.id); }}>
                          {isSel ? 'Viewing' : 'Analytics'} <Icon name="arrowRight" size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr><td colSpan={5} className="db-empty">No children found.</td></tr>
                )}
              </tbody>
            </table>

            <div className="db-table-foot">
              <span>Showing {visible.length} of {filtered.length} children</span>
              <div className="db-pagination">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" className={n === page ? 'is-active' : ''} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))}><Icon name="chevronRight" size={14} /></button>
              </div>
            </div>
          </section>

          <p className="db-footnote">Example data · A glimpse of participation, not a clinical assessment.</p>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="db-overview-side">
          <div className="db-top-actions">
            <select className="db-select db-select--date">
              <option>26 Oct – 1 Nov 2026</option>
              <option>19 Oct – 25 Oct 2026</option>
              <option>12 Oct – 18 Oct 2026</option>
            </select>
            <button type="button" className="db-btn-primary" onClick={() => onNavigate('go_add_child')}>
              <Icon name="plus" /> Add a child
            </button>
          </div>

          {selected && (
            <aside className="db-side-panel">
              <div className="db-side-hero">
                <div className="db-side-hero-top">
                  <p className="db-eyebrow">Child overview</p>
                  <button type="button" className="db-link-muted" onClick={() => onOpenChild(selected.id)}>Edit profile</button>
                </div>
                <div className="db-child-cell db-child-cell--lg">
                  <ChildAvatar child={selected} size={64} />
                  <div><strong>{selected.name}</strong><span>{selected.age} years · {selected.code}</span></div>
                </div>
              </div>

              <div className="db-side-body">
                <p className="db-eyebrow">This week</p>
                <div className="db-mini-stats">
                  <div><strong>{selected.activities}</strong><span>Activities</span></div>
                  <div><strong>{formatMinutes(selected.practiceMinutes)}</strong><span>Practice time</span></div>
                  <div><strong>{selected.practiceDays} / {selected.weeklyGoal}</strong><span>Practice days</span></div>
                </div>

                <h3 className="db-section-title">Activity completion</h3>
                {selected.progress.map((p, i) => (
                  <div key={p.label} className="db-progress">
                    <div className="db-progress-label"><span>{p.label}</span><span>{p.done} / {p.total}</span></div>
                    <div className="db-progress-track">
                      <div className="db-progress-fill" style={{ width: `${(p.done / p.total) * 100}%`, background: BAR_COLORS[i % 3] }} />
                    </div>
                  </div>
                ))}
                <p className="db-small">Completion shows participation, not ability.</p>

                <hr className="db-divider" />

                <h3 className="db-section-title">Customize {selected.name}’s journey</h3>
                <label className="db-field">Focus area
                  <select className="db-select" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })}>
                    {FOCUS_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </label>
                <div className="db-field-row">
                  <label className="db-field">Support level
                    <select className="db-select" value={form.support} onChange={(e) => setForm({ ...form, support: e.target.value })}>
                      {SUPPORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="db-field">Weekly goal
                    <select className="db-select" value={form.weeklyGoal} onChange={(e) => setForm({ ...form, weeklyGoal: e.target.value })}>
                      {GOAL_OPTIONS.map((g) => <option key={g} value={g}>{g} days</option>)}
                    </select>
                  </label>
                </div>
                <button type="button" className="db-btn-primary db-btn-block" onClick={handleSave}>
                  {saved ? <><Icon name="check" /> Saved</> : 'Save changes'}
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </TherapistLayout>
  );
}
