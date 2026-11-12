export default function Home({ onNavigate }) {
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
          <button onClick={() => alert('Settings')} className="nav-button">Settings</button>
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