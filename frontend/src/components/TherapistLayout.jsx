import Icon from './Icons';

const WORKSPACE = [
  { key: 'overview', label: 'Overview', icon: 'grid', action: 'go_overview' },
  { key: 'children', label: 'Children', icon: 'users', action: 'go_children' },
  { key: 'analytics', label: 'Analytics', icon: 'chart', action: null },
  { key: 'activities', label: 'Activities', icon: 'book', action: 'go_activities' },
];

const PRACTICE = [
  { key: 'settings', label: 'Settings', icon: 'gear' },
  { key: 'help', label: 'Help center', icon: 'help' },
];

// Barra lateral común a todas las pantallas del terapeuta
export default function TherapistLayout({ active, onNavigate, children }) {
  const handleClick = (item) => {
    if (item.action) onNavigate(item.action);
    else alert(`${item.label} — coming soon`);
  };

  return (
    <div className="db-layout">
      <aside className="db-sidebar">
        <div className="db-brand" onClick={() => onNavigate('go_overview')}>
          <div className="db-brand-row">
            <div className="logo-dot">••</div>
            <span className="db-brand-name">Pip</span>
          </div>
          <span className="db-brand-sub">For therapists</span>
        </div>

        <p className="db-nav-title">Workspace</p>
        <nav className="db-nav">
          {WORKSPACE.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`db-nav-item ${active === item.key ? 'db-nav-item--active' : ''}`}
              onClick={() => handleClick(item)}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>

        <p className="db-nav-title">Practice</p>
        <nav className="db-nav">
          {PRACTICE.map((item) => (
            <button key={item.key} type="button" className="db-nav-item" onClick={() => handleClick(item)}>
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="db-sidebar-bottom">
          <div className="db-motto">
            <strong>Little steps.<br />Big things.</strong>
            <span>Every child grows at their own pace.</span>
          </div>

          <div className="db-user">
            <strong>Dr. Emma Wilson</strong>
            <span>Little Steps Therapy</span>
          </div>

          <button type="button" className="db-nav-item" onClick={() => onNavigate('go_logout')}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
      </aside>

      <main className="db-main">{children}</main>
    </div>
  );
}
