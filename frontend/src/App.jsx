import { useState } from 'react';
import './App.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [registration, setRegistration] = useState({
    fullName: '',
    professionalRole: '',
    practice: '',
    registrationNumber: '',
    displayName: '',
    email: '',
    password: '',
    acceptedTerms: false,
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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
    } catch {
      setError('Could not connect to the server');
    }
  };

  const handleRegistrationChange = (event) => {
    const { name, value, checked, type } = event.target;

    setRegistration((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="app-container">
      {/* HOME SCREEN */}
      {currentScreen === 'home' && (
        <>
          <header className="header">
            <div className="brand" onClick={() => setCurrentScreen('home')}>
              <div className="logo-dot">••</div>
              <span className="brand-name">Pip</span>
            </div>
            <nav className="nav-links">
              <button onClick={() => setCurrentScreen('login')} className="nav-button">Log-in</button>
              <button className="nav-button">My Pip</button>
              <button className="nav-button">Settings</button>
            </nav>
          </header>

          <main className="home-main">
            <h1 className="hero-title">HI, EXPLORER!</h1>
            <div className="hero-img-container">
              <img src="/resources/characters.png" className="hero-img" />
            </div>
          </main>
        </>
      )}

      {/* LOGIN SCREEN */}
      {currentScreen === 'login' && (
        <>
          <header className="header">
            <div className="brand" onClick={() => setCurrentScreen('home')}>
              <div className="logo-dot">••</div>
              <span className="brand-name">Pip</span>
            </div>
            <nav className="nav-links">
              <button onClick={() => setCurrentScreen('home')} className="nav-button">Home</button>
              <button className="nav-button" style={{ fontWeight: 'bold' }}>For therapists</button>
              <button className="nav-button">Help</button>
            </nav>
          </header>

          <main className="login-main">
            <div className="left-card">
              <div>
                <span className="card-tag">For Therapists</span>
                <h2 className="card-title">A little support.<br />A world of discovery.</h2>
                <p className="card-desc">A shared space to help children feel, discover and grow.</p>
              </div>

              <div className="circles-container">
                <div className="circle-frame">
                  <img src="/resources/c1.png"/>
                </div>
                <div className="circle-frame">
                  <img src="/resources/c2.png"/>
                </div>
              </div>

              <div className="bottom-banner">
                Log in to guide their next little step.
              </div>
            </div>

            
            <div className="right-form-container">
              <span className="form-tag">Welcome Back</span>
              <h2 className="form-title">Your next step starts here.</h2>
              <p className="form-subtitle">Log in to your therapist account.</p>

              {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '13px' }}>{error}</div>}
              {successMessage && <div style={{ color: 'green', marginBottom: '10px', fontSize: '13px' }}>{successMessage}</div>}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Work email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="you@practice.com" 
                    required 
                    className="input-field" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="password-wrapper">
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter your password" 
                      required 
                      className="input-field" 
                    />
                    <button type="button" className="show-btn">Show</button>
                  </div>
                  <a href="#forgot" className="forgot-link">Forgot password?</a>
                </div>

                <button type="submit" className="submit-btn">Log in</button>
              </form>

              <button type="button" className="purple-link register-link"  onClick={() => setCurrentScreen('register')}>
                New to Pip? Create a therapist account
              </button>

              <div className="play-card">
                <p>Here to play?</p>
                <a href="#play" className="purple-link" style={{ fontSize: '12px' }}>Use the code from your therapist instead →</a>
              </div>
            </div>
          </main>
        </>
      )}

      {currentScreen === 'register' && (
      <>
        <header className="register-header">
          <div className="register-header-left">
            <button
              type="button"
              className="register-logo"
              aria-label="Go to home"
              onClick={() => setCurrentScreen('home')}
            >
              ••
            </button>
            <button
              type="button"
              className="register-login-link"
              onClick={() => setCurrentScreen('login')}
            >
              Log-in
            </button>
          </div>

          <nav className="register-nav" aria-label="Main navigation">
            <button type="button">Settings</button>
            <button type="button">Help</button>
          </nav>
        </header>

        <main className="register-main">
          <aside className="register-art">
            <div>
              <h1>Small steps.<br />Shared beginnings.</h1>
              <p>
                Create your account, set up your practice and invite each child
                at their own pace.
              </p>
            </div>

            <img
              src="/resources/c3.png"
            />
          </aside>

          <section className="register-content">
            <p className="register-step">STEP 1 OF 2 · YOUR PRACTICE</p>
            <h2>A little about you.</h2>
            <p className="register-description">
              Set up the profile children and their grown-ups will see.
            </p>

            <form
              className="register-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                Full name
                <input
                  name="fullName"
                  value={registration.fullName}
                  onChange={handleRegistrationChange}
                  placeholder="Dr. Emma"
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Professional role
                <input
                  name="professionalRole"
                  value={registration.professionalRole}
                  onChange={handleRegistrationChange}
                  placeholder="Speech and language therapist"
                  required
                />
              </label>

              <label>
                Practice or organisation
                <input
                  name="practice"
                  value={registration.practice}
                  onChange={handleRegistrationChange}
                  placeholder="Little Steps Therapy"
                  required
                />
              </label>

              <label>
                Professional registration number
                <input
                  name="registrationNumber"
                  value={registration.registrationNumber}
                  onChange={handleRegistrationChange}
                  placeholder="Enter your registration number"
                />
              </label>

              <label>
                Display name
                <input
                  name="displayName"
                  value={registration.displayName}
                  onChange={handleRegistrationChange}
                  placeholder="Dr. Emma"
                  required
                />
              </label>

              <label>
                Work email
                <input
                  type="email"
                  name="email"
                  value={registration.email}
                  onChange={handleRegistrationChange}
                  placeholder="emma@littlesteps.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={registration.password}
                  onChange={handleRegistrationChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
                <small>Use at least 12 characters, including a number.</small>
              </label>

              <label className="register-terms">
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={registration.acceptedTerms}
                  onChange={handleRegistrationChange}
                  required
                />
                <span>I agree to the Terms of use and Privacy policy.</span>
              </label>

              <button type="submit" className="register-submit">
                Create account
              </button>
            </form>

            <button
              type="button"
              className="register-back-link"
              onClick={() => setCurrentScreen('login')}
            >
              Already have an account? Log in
            </button>
          </section>
        </main>
      </>
    )}

      {/* FOOTER */}
      <footer className="footer">
        <p>Little steps, big things.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </footer>

    </div>
  );
}