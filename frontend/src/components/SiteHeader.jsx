export default function SiteHeader({ onNavigate, isLogInActive = false }) {
  return (
    <header className="header">
      <div className="brand">
        <button
          type="button"
          className="brand-home"
          aria-label="Home"
          onClick={() => onNavigate('go_home')}
        >
          <span className="logo-dot">
            <img src="/resources/icon.png" alt="" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('go_login')}
          className={`nav-button${isLogInActive ? ' nav-button--active' : ''}`}
        >
          Log-in
        </button>
      </div>
      <nav className="nav-links" aria-label="Main navigation">
        <button type="button" onClick={() => alert('Settings')} className="nav-button">Settings</button>
        <button type="button" onClick={() => alert('Help')} className="nav-button">Help</button>
      </nav>
    </header>
  );
}
