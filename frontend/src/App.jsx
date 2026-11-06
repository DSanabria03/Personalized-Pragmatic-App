import { useState } from 'react';
import './App.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('¡Login exitoso! Bienvenido a Pip.');
      } else {
        setError(data.detail || 'Correo o contraseña incorrectos');
      }
    } catch {
      setError('No se pudo conectar con el servidor (Backend apagado)');
    }
  };

  return (
    <div className="app-container">
      
      {/* ================= PANTALLA 1: HOME ================= */}
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
              <img src="/resources/characters.png" alt="Pip Characters" className="hero-img" />
            </div>
          </main>
        </>
      )}

      {/* ================= PANTALLA 2: LOGIN TERAPEUTAS ================= */}
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
            {/* Tarjeta Izquierda Celeste */}
            <div className="left-card">
              <div>
                <span className="card-tag">For Therapists</span>
                <h2 className="card-title">A little support.<br />A world of discovery.</h2>
                <p className="card-desc">A shared space to help children feel, discover and grow.</p>
              </div>

              {/* IMÁGENES CIRCULARES (c1.png y c2.png) */}
              <div className="circles-container">
                <div className="circle-frame">
                  <img src="/resources/c1.png" alt="Personaje Azul" />
                </div>
                <div className="circle-frame">
                  <img src="/resources/c2.png" alt="Personaje Verde" />
                </div>
              </div>

              <div className="bottom-banner">
                Log in to guide their next little step.
              </div>
            </div>

            {/* Formulario Derecho */}
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

              <div className="create-account-wrapper">
                <a href="#create" className="purple-link">New to Pip? Create a therapist account</a>
              </div>

              <div className="play-card">
                <p>Here to play?</p>
                <a href="#play" className="purple-link" style={{ fontSize: '12px' }}>Use the code from your therapist instead →</a>
              </div>
            </div>
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