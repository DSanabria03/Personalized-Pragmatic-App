import { useMemo, useState } from 'react';
import TherapistLayout from './TherapistLayout';
import ChildAvatar from './ChildAvatar';
import Icon from './Icons';
import { FOCUS_OPTIONS } from '../data/mockData';

export default function TherapistChildren({ onNavigate, kids, onOpenChild }) {
  const [search, setSearch] = useState('');
  const [focusFilter, setFocusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('active');

  const practising = kids.filter((k) => k.practiceDays > 0).length;
  const gettingStarted = kids.filter((k) => k.activities === 0).length;

  const list = useMemo(() => {
    const result = kids.filter((k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) &&
      (focusFilter === 'all' || k.focus === focusFilter));
    return [...result].sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : a.daysAgo - b.daysAgo));
  }, [kids, search, focusFilter, sortBy]);

  return (
    <TherapistLayout active="children" onNavigate={onNavigate}>
      <div className="db-page-header">
        <div>
          <p className="db-eyebrow">Your practice</p>
          <h1 className="db-title">Children</h1>
          <p className="db-subtitle">Every little explorer, in one place. Find a child and follow their practice journey.</p>
        </div>
        <button type="button" className="db-btn-primary" onClick={() => onNavigate('go_add_child')}>
          <Icon name="plus" /> Register a child
        </button>
      </div>

      <div className="db-summary-bar">
        <div><strong>{kids.length}</strong><div><span>Children in your practice</span><small>A little journey for everyone</small></div></div>
        <div><strong>{practising}</strong><div><span>Practising this week</span><small>26 Oct – 1 Nov 2026</small></div></div>
        <div><strong>{gettingStarted}</strong><div><span>Getting started</span><small>Ready for their first little step</small></div></div>
      </div>

      <div className="db-section-header">
        <h2 className="db-section-title db-section-title--lg">Your little explorers <span className="db-count">{kids.length}</span></h2>
        <span className="db-small">Choose a child to see their journey</span>
      </div>

      <div className="db-filters">
        <div className="db-search">
          <Icon name="search" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by child’s name" />
        </div>
        <select className="db-select" value={focusFilter} onChange={(e) => setFocusFilter(e.target.value)}>
          <option value="all">All children</option>
          {FOCUS_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="db-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="active">Sort: Last active</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      <div className="db-cards-grid">
        {list.map((k) => (
          <article key={k.id} className="db-child-card">
            <div className="db-child-card-head">
              <div className="db-child-cell db-child-cell--md">
                <ChildAvatar child={k} size={48} />
                <div><strong>{k.name}</strong><span>{k.age} years</span></div>
              </div>
              {k.isNew && <span className="db-badge">New</span>}
            </div>

            <div className="db-child-card-info">
              <div><small>Current focus</small><span>{k.focus}</span></div>
              <div><small>Support level</small><span>{k.support}</span></div>
            </div>

            <div className="db-progress-label">
              <small>{k.practiceDays > 0 ? 'Practice days this week' : 'Ready for a first activity'}</small>
              <small>{k.practiceDays} / {k.weeklyGoal} days</small>
            </div>
            <div className="db-segments">
              {Array.from({ length: k.weeklyGoal }, (_, i) => (
                <span key={i} className={i < k.practiceDays ? 'is-filled' : ''} />
              ))}
            </div>

            <div className="db-child-card-foot">
              <small>{k.lastActive ? `Last active ${k.lastActive}` : 'No practice yet'}</small>
              <button type="button" className="db-link" onClick={() => onOpenChild(k.id)}>
                View profile <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </article>
        ))}
        {list.length === 0 && <p className="db-empty">No children found.</p>}
      </div>

      <div className="db-table-foot">
        <span className="db-footnote">Example data · Practice progress reflects participation, not clinical development or physical growth.</span>
        <span className="db-footnote">Showing {list.length === kids.length ? 'all ' : ''}{list.length} children</span>
      </div>
    </TherapistLayout>
  );
}
