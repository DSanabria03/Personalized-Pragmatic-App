export default function Home({ onNavigate }) {
  // "Log-in" opens the therapist login (or the dashboard if already logged in),
  // "My Pip" opens the child login (or the child's home if already logged in).
  return (
    <>
      <header className="header">
        <div className="brand" onClick={() => onNavigate('go_home')}>
          <div className="logo-dot">••</div>
          <span className="brand-name">Pip</span>
        </div>
        <nav className="nav-links">
          <button onClick={() => onNavigate('go_login')} className="nav-button">Log-in</button>
          <button onClick={() => onNavigate('go_child_login')} className="nav-button">My Pip</button>
          <button onClick={() => onNavigate('go_settings')} className="nav-button">Settings</button>
        </nav>
      </header>

      <main className="home-main">
        <h1 className="hero-title">HI, EXPLORER!</h1>
        <div className="hero-img-container">
          <img src="/resources/characters.png" className="hero-img" alt="Characters" />
        </div>
      </main>
    </>
  );
}