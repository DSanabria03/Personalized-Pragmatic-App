import { useState } from 'react';

export default function TherapistLogin({ onNavigate, setCurrentScreen }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.detail === 'string' ? data.detail : 'Incorrect email or password');
        return;
      }
      if (data.next_screen) {
        setCurrentScreen(data.next_screen);
      } else {
        onNavigate('go_add_child');
      }
    } catch {
      setError('Could not connect to the server');
    }
  };

  return (
    <>
      <header className="header">
        <div className="brand" onClick={() => onNavigate('go_home')}>
          <div className="logo-dot">••</div>
          <span className="brand-name">Pip</span>
        </div>
        <nav className="nav-links">
          <button onClick={() => onNavigate('go_home')} className="nav-button">Home</button>
          <button className="nav-button" style={{ fontWeight: 'bold' }}>For therapists</button>
          <button onClick={() => alert('Help')} className="nav-button">Help</button>
        </nav>
      </header>

      <main className="login-main">
        <div className="left-card">
          <div>
            <span className="card-tag">For Therapists</span>
            <h2 className="card-title">A little support.<br />A world of discovery.</h2>
            <p className="card-desc">A shared space to help children feel, discover and grow.</p>
          </div>

          <div className="figma-right-art-container">
            <img src="/resources/register-characters.png" alt="Therapist Login Characters" className="figma-right-art-img" />
          </div>

          <div className="bottom-banner">Log in to guide their next little step.</div>
        </div>
        
        <div className="right-form-container">
          <span className="form-tag">Welcome Back</span>
          <h2 className="form-title">Your next step starts here.</h2>
          <p className="form-subtitle">Log in to your therapist account.</p>

          {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '13px' }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Work email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@practice.com" required className="input-field" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="input-field" />
                <button type="button" className="show-btn" onClick={() => alert('Toggle password')}>Show</button>
              </div>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Forgot password flow'); }} className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="submit-btn">Log in</button>
          </form>

          <button type="button" className="purple-link register-link" onClick={() => onNavigate('go_register')}>
            New to Pip? Create a therapist account
          </button>

          <div className="play-card">
            <p>Here to play?</p>
            <button onClick={() => onNavigate('go_child_login')} className="purple-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
              Use the code from your therapist instead →
            </button>
          </div>
        </div>
      </main>
    </>
  );
}