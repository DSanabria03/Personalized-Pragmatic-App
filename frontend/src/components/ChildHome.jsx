export default function ChildHome({ onNavigate, childName = 'Dan' }) {
  return (
    <>
      <header className="header">
        <div className="brand" onClick={() => onNavigate('go_home')}>
          <div className="logo-dot">••</div>
        </div>
        <nav className="nav-links child-home-nav">
          <button type="button" className="nav-button child-home-link" onClick={() => onNavigate('go_child_setup')}>My Pip</button>
          <button type="button" className="nav-button child-home-link" onClick={() => alert('Settings')}>Settings</button>
          <button type="button" className="child-play-btn" onClick={() => alert('The restaurant story is coming soon!')}>Play</button>
        </nav>
      </header>

      <main className="home-main">
        <h1 className="hero-title">Hi, {childName} !</h1>
        <div className="hero-img-container">
          <img src="/resources/characters.png" className="hero-img" alt="Pip characters" />
        </div>
      </main>
    </>
  );
}
