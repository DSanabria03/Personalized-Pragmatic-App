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

  const [childForm, setChildForm] = useState({
    name: '',
    age: '',
    parentEmail: '',
    acceptedPermission: false,
  });

  const [childCodeInputs] = useState(['P', 'I', 'P', '7', '4', '2']);

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
      setCurrentScreen('add-child');
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

  const handleChildFormChange = (event) => {
    const { name, value, checked, type } = event.target;
    setChildForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="app-container">
      
      {/* 1. HOME SCREEN */}
      {currentScreen === 'home' && (
        <>
          <header className="header">
            <div className="brand" onClick={() => setCurrentScreen('home')}>
              <div className="logo-dot">••</div>
              <span className="brand-name">Pip</span>
            </div>
            <nav className="nav-links">
              <button onClick={() => setCurrentScreen('login')} className="nav-button">Log-in</button>
              <button onClick={() => setCurrentScreen('child-login')} className="nav-button">My Pip</button>
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
      )}

      {/* 2. LOGIN TERAPEUTAS */}
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
                <img 
                  src="/resources/register-characters.png" 
                  alt="Register characters" 
                  className="figma-right-art-img"
                />
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

              <button type="button" className="purple-link register-link" onClick={() => setCurrentScreen('register')}>
                New to Pip? Create a therapist account
              </button>

              <div className="play-card">
                <p>Here to play?</p>
                <button onClick={() => setCurrentScreen('child-login')} className="purple-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                  Use the code from your therapist instead →
                </button>
              </div>
            </div>
          </main>
        </>
      )}

      {/* 3. REGISTRO TERAPEUTA */}
      {currentScreen === 'register' && (
        <>
          <header className="register-header">
            <div className="register-header-left">
              <button type="button" className="register-logo" onClick={() => setCurrentScreen('home')}>••</button>
              <button type="button" className="register-login-link" onClick={() => setCurrentScreen('login')}>Log-in</button>
            </div>
            <nav className="register-nav">
              <button type="button" onClick={() => alert('Settings')}>Settings</button>
              <button type="button" onClick={() => alert('Help')}>Help</button>
            </nav>
          </header>

          <main className="register-main">
            <aside className="register-art">
              <div>
                <h1>Small steps.<br />Shared beginnings.</h1>
                <p>Create your account, set up your practice and invite each child at their own pace.</p>
              </div>
              <div className="register-art-image-wrapper">
                <img src="/resources/c3.png" alt="Three Characters" />
              </div>
            </aside>

            <section className="register-content">
              <p className="register-step">STEP 1 OF 2 · YOUR PRACTICE</p>
              <h2>A little about you.</h2>
              <p className="register-description">Set up the profile children and their grown-ups will see.</p>

              <form className="register-form" onSubmit={(e) => { e.preventDefault(); setCurrentScreen('add-child'); }}>
                <label>Full name<input name="fullName" value={registration.fullName} onChange={handleRegistrationChange} placeholder="Dr. Emma" required /></label>
                <label>Professional role<input name="professionalRole" value={registration.professionalRole} onChange={handleRegistrationChange} placeholder="Speech therapist" required /></label>
                <label>Practice or organisation<input name="practice" value={registration.practice} onChange={handleRegistrationChange} placeholder="Little Steps Therapy" required /></label>
                <label>Professional registration number<input name="registrationNumber" value={registration.registrationNumber} onChange={handleRegistrationChange} placeholder="Enter your registration number" /></label>
                <label>Display name<input name="displayName" value={registration.displayName} onChange={handleRegistrationChange} placeholder="Dr. Emma" required /></label>
                <label>Work email<input type="email" name="email" value={registration.email} onChange={handleRegistrationChange} placeholder="emma@littlesteps.com" required /></label>
                <label>Password<input type="password" name="password" value={registration.password} onChange={handleRegistrationChange} placeholder="Create a password" minLength={12} required /><small>Use at least 12 characters, including a number.</small></label>
                
                <label className="register-terms">
                  <input type="checkbox" name="acceptedTerms" checked={registration.acceptedTerms} onChange={handleRegistrationChange} required />
                  <span>I agree to the Terms of use and Privacy policy.</span>
                </label>

                <button type="submit" className="register-submit">Create account</button>
              </form>

              <button type="button" className="register-back-link" onClick={() => setCurrentScreen('login')}>Already have an account? Log in</button>
            </section>
          </main>
        </>
      )}

      {/* 4. AÑADIR NIÑO */}
      {currentScreen === 'add-child' && (
        <>
          <header className="register-header">
            <div className="register-header-left">
              <button type="button" className="register-logo" onClick={() => setCurrentScreen('home')}>••</button>
              <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>Add a child</span>
            </div>
            <nav className="register-nav">
              <button type="button" onClick={() => alert('Settings')}>Settings</button>
              <button type="button" onClick={() => alert('Help')}>Help</button>
            </nav>
          </header>

          <main className="register-main">
            <aside className="register-art">
              <div>
                <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 56px)' }}>Their adventure<br />starts with you.</h1>
                <p>Create a child profile in your practice. We’ll make a code for them to log in.</p>
              </div>

              <div className="figma-right-art-container">
                <img 
                  src="/resources/register-characters.png" 
                  alt="Orange and Green Characters Art" 
                  className="figma-right-art-img"
                />
              </div>

              <p style={{ fontSize: '13px', color: '#555', marginTop: '10px', position: 'relative', zIndex: 2 }}>No child email or password needed.</p>
            </aside>

            <section className="register-content">
              <p className="register-step">YOUR PRACTICE · ADD A CHILD</p>
              <h2>A new little explorer.</h2>
              <p className="register-description">Register a child to create their profile and login code.</p>

              <form className="register-form" onSubmit={(e) => { e.preventDefault(); setCurrentScreen('child-code'); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <label>First name or nickname
                    <input name="name" value={childForm.name} onChange={handleChildFormChange} placeholder="Dan" required />
                  </label>
                  <label>Age
                    <input name="age" value={childForm.age} onChange={handleChildFormChange} placeholder="8 years" required />
                  </label>
                </div>
                <small style={{ marginTop: '-10px', display: 'block' }}>This is the name they'll see in Pip.</small>

                <label style={{ marginTop: '10px' }}>Parent or guardian email (optional)
                  <input type="email" name="parentEmail" value={childForm.parentEmail} onChange={handleChildFormChange} placeholder="parent@example.com" />
                </label>
                <small style={{ marginTop: '-10px', display: 'block' }}>For sharing the login details. Not needed for the child to log in.</small>

                <div style={{ background: '#e5f0ff', padding: '16px', borderRadius: '16px', margin: '10px 0' }}>
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}>Assigned therapist</span>
                  <div style={{ fontWeight: 'bold', color: '#111', marginTop: '4px' }}>Dr. Emma · Little Steps Therapy</div>
                </div>

                <label className="register-terms">
                  <input type="checkbox" name="acceptedPermission" checked={childForm.acceptedPermission} onChange={handleChildFormChange} required />
                  <span>I confirm I have parent or guardian permission to create and manage this child's account.</span>
                </label>

                <button type="submit" className="register-submit">Create child profile & login code</button>
              </form>

              <button type="button" className="register-back-link" onClick={() => setCurrentScreen('register')} style={{ color: '#6e42c1', background: 'none', border: 'none', cursor: 'pointer', display: 'block', marginTop: '20px' }}>
                Cancel and return to children
              </button>
            </section>
          </main>
        </>
      )}

      {/* 5. CÓDIGO GENERADO */}
      {currentScreen === 'child-code' && (
        <>
          <header className="register-header">
            <div className="register-header-left">
              <button type="button" className="register-logo" onClick={() => setCurrentScreen('home')}>••</button>
              <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>Add a child</span>
            </div>
            <nav className="register-nav">
              <button type="button" onClick={() => alert('Settings')}>Settings</button>
              <button type="button" onClick={() => alert('Help')}>Help</button>
            </nav>
          </header>

          <main className="register-main">
            <aside className="register-art">
              <div>
                <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 56px)' }}>One little code.<br />A new beginning.</h1>
                <p>Give Dan this code in your next session, or share it with their parent or guardian.</p>
              </div>

              <div className="figma-right-art-container">
                <img 
                  src="/resources/register-characters.png" 
                  alt="Orange and Green Characters Art" 
                  className="figma-right-art-img"
                />
              </div>

              <p style={{ fontSize: '13px', color: '#555', marginTop: '10px', position: 'relative', zIndex: 2 }}>Dan's account is connected to your practice.</p>
            </aside>

            <section className="register-content">
              <p className="register-step">CHILD REGISTERED</p>
              <h2>Dan is ready to explore.</h2>
              <p className="register-description">Share this login code with Dan and their grown-up.</p>

              <div style={{ background: '#eaf2ff', padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', letterSpacing: '1px' }}>DAN'S LOGIN CODE</span>
                <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '6px', color: '#111', margin: '10px 0 5px 0' }}>
                  PIP742
                </div>
                <div style={{ fontSize: '13px', color: '#555' }}>Enter this code on the child login screen.</div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <button type="button" className="register-submit" style={{ flex: 1, fontSize: '15px', minHeight: '52px' }} onClick={() => alert('Code copied!')}>Copy login code</button>
                <button type="button" onClick={() => alert('Downloading card...')} style={{ flex: 1, border: 'none', background: '#eaf2ff', borderRadius: '999px', fontWeight: 'bold', color: '#555', cursor: 'pointer', padding: '0 16px' }}>Download login card</button>
              </div>

              <div style={{ background: '#eaf2ff', padding: '16px', borderRadius: '16px', marginBottom: '24px', fontSize: '13px', color: '#444' }}>
                <strong>Keep this code safe.</strong><br />
                Need a new one? Reset it from Dan's profile.<br />
                The previous code will stop working.
              </div>

              <button type="button" className="register-submit" style={{ width: '100%', marginBottom: '16px' }} onClick={() => setCurrentScreen('home')}>
                Go to Dan's profile
              </button>

              <button type="button" onClick={() => setCurrentScreen('add-child')} style={{ background: 'none', border: 'none', color: '#6e42c1', fontWeight: 'bold', cursor: 'pointer', display: 'block', margin: '0 auto' }}>
                Add another child
              </button>
            </section>
          </main>
        </>
      )}

      {/* 6. LOGIN DE NIÑOS */}
      {currentScreen === 'child-login' && (
        <>
          <header className="register-header">
            <div className="register-header-left">
              <button type="button" className="register-logo" onClick={() => setCurrentScreen('home')}>••</button>
              <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>Log-in</span>
            </div>
            <nav className="register-nav">
              <button type="button" onClick={() => alert('Settings')}>Settings</button>
              <button type="button" onClick={() => alert('Help')}>Help</button>
            </nav>
          </header>

          <main className="register-main">
            <aside className="register-art child-login-art">
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#666', textTransform: 'uppercase' }}>HELLO, EXPLORER</span>
                <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 56px)', marginTop: '8px' }}>Big discoveries<br />start small.</h1>
                <p style={{ marginTop: '16px', fontSize: '18px', color: '#4b5563' }}>Your Pip is waiting for you.<br />Let’s see what you’ll discover today.</p>
              </div>

              <div className="child-art-container">
                <img src="/resources/child-characters.png" alt="Blue and White Characters Art" className="child-art-img" />
              </div>

              <p style={{ fontSize: '13px', color: '#555' }}>A familiar face behind every adventure.</p>
            </aside>

            <section className="register-content">
              <p className="register-step">YOUR NEXT LITTLE DISCOVERY</p>
              <h2>Hello, explorer!</h2>
              <p className="register-description">Type the code your therapist gave you.</p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Your login code</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {childCodeInputs.map((char, index) => (
                    <div key={index} style={{ 
                      flex: 1, 
                      height: '70px', 
                      border: '2px solid ' + (index === 0 ? '#6e42c1' : '#d2d9d0'), 
                      borderRadius: '14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '28px', 
                      fontWeight: 'bold', 
                      fontFamily: 'monospace',
                      background: '#fff'
                    }}>
                      {char}
                    </div>
                  ))}
                </div>
                <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>An example code looks like PIP742.</small>
              </div>

              <button type="button" className="register-submit" style={{ width: '100%', marginBottom: '24px' }} onClick={() => alert('Entrando a la app del niño...')}>
                Let’s go!
              </button>

              <div style={{ background: '#eaf2ff', padding: '20px', borderRadius: '16px' }}>
                <strong style={{ fontSize: '14px', color: '#111' }}>Don’t have a code yet?</strong>
                <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>Ask your therapist or your grown-up for help. They'll make sure your account is ready.</p>
              </div>
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