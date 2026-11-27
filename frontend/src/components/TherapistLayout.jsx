import '../styles/TherapistLayout.css';

// What the therapist's pages share (Figma "Practice navigation"): the menu on the left and the page on the right.
//   active    which menu item is highlighted: 'dashboard' | 'children' | 'child' | 'activities'
//   children  the page
// "Analytics" opens a child's page (the Figma highlights it there). "Help center" has no screen yet: plain text,
// like "Help" in the header of the other pages.
const NAV = [
  { id: 'dashboard', label: 'Overview', icon: 'grid', action: 'go_dashboard' },
  { id: 'children', label: 'Children', icon: 'people', action: 'go_children' },
  { id: 'child', label: 'Analytics', icon: 'chart', action: 'go_analytics' },
  { id: 'activities', label: 'Activities', icon: 'book', action: 'go_activities' },
];

const icon = (name) => `/resources/therapist/${name}.svg`;

export default function TherapistLayout({ active, session, onNavigate, onLogout, children }) {
  return (
    <div className="tl">
      <div className="tl-frame">
        <aside className="tl-side">
          <div className="tl-logo"><img src="/resources/home/logo.png" alt="Pip" /></div>

          <p className="tl-section tl-section-workspace">WORKSPACE</p>
          <nav className="tl-nav" aria-label="Workspace">
            {NAV.map((item) => (
              <button key={item.id} type="button" className={`tl-link tl-link-${item.id}`}
                aria-current={active === item.id ? 'page' : undefined} onClick={() => onNavigate(item.action)}>
                <img src={icon(active === item.id ? `${item.icon}-active` : item.icon)} alt="" />
                {item.label}
              </button>
            ))}
          </nav>

          <p className="tl-section tl-section-practice">PRACTICE</p>
          <button type="button" className="tl-plain tl-settings" onClick={() => onNavigate('go_settings')}>
            <img src={icon('settings')} alt="" />Settings
          </button>
          <span className="tl-plain tl-help"><img src={icon('help')} alt="" />Help center</span>

          <div className="tl-reminder">
            <p className="tl-reminder-title">Little steps.<br />Big things.</p>
            <p className="tl-reminder-text">Every child grows<br />at their own pace.</p>
          </div>

          <div className="tl-divider" />
          <p className="tl-name" title={session.name}>{session.name}</p>
          <p className="tl-practice" title={session.practice}>{session.practice}</p>
          <button type="button" className="tl-plain tl-logout" onClick={onLogout}>
            <img src={icon('log-out')} alt="" />Log out
          </button>
        </aside>

        <main className="tl-main">{children}</main>
      </div>
    </div>
  );
}
