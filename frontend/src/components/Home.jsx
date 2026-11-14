export default function Home({ onNavigate }) {
  return (
    <>
      <header className="header">
        <div className="brand">
          <button type="button" className="brand-home" aria-label="Home" onClick={() => onNavigate('go_home')}>
            <span className="logo-dot">
              <img src="/resources/icon.png"/>
            </span>
          </button>

          <button type="button" onClick={() => onNavigate('go_login')} className="nav-button">
            Log-in
          </button>
        </div>
        <nav className="nav-links">
          <button onClick={() => alert('Settings')} className="nav-button">Settings</button>
          <button onClick={() => alert('Help')} className="nav-button">Help</button>
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
