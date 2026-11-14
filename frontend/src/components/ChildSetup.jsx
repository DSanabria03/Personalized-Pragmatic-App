import { useState } from 'react';
import { PIPS } from '../data/mockData';


export default function ChildSetup({ onNavigate, onComplete, initialName = 'Dan', initialPip = 'milo' }) {
  const [nickname, setNickname] = useState(initialName);
  const [selectedPip, setSelectedPip] = useState(initialPip);

  const handleStart = (e) => {
    e.preventDefault();
    // Guarda el nombre y el Pip elegido en App y va a la home del niño
    if (onComplete) onComplete({ nickname, pip: selectedPip });
    onNavigate('go_child_home');
  };

  return (
    <>
      <header className="register-header">
        <div className="register-header-left">
          <button type="button" className="register-logo" onClick={() => onNavigate('go_home')}>••</button>
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
            <span className="card-tag">Meet your Pip</span>
            <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 56px)', marginTop: '8px' }}>A little friend<br />for your journey.</h1>
          </div>
          <div className="child-art-container">
            <img src="/resources/child-characters.png" alt="Pip characters" className="child-art-img" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', position: 'relative', zIndex: 2 }}>
            You can change your Pip later in Settings.
          </p>
        </aside>

        <section className="register-content">
          <p className="register-step">YOUR FIRST LITTLE STEP</p>
          <h2 className="form-title">Make yourself at home.</h2>
          <p className="register-description">Your therapist has set things up. Now make it yours.</p>

          <div className="setup-therapist-box">Connected with Dr. Emma · Little Steps Therapy</div>

          <form className="register-form" onSubmit={handleStart}>
            <label>
              What should Pip call you?
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Dan" required />
            </label>

            <div>
              <h3 className="setup-pip-title">Choose your Pip</h3>
              <p className="setup-pip-subtitle">A friend to discover the world with.</p>

              <div className="pip-grid">
                {PIPS.map((pip) => {
                  const isSelected = pip.id === selectedPip;
                  return (
                    <button
                      key={pip.id}
                      type="button"
                      className={`pip-card ${isSelected ? 'pip-card--selected' : ''}`}
                      onClick={() => setSelectedPip(pip.id)}
                      aria-pressed={isSelected}
                    >
                      <img src={pip.img} alt={pip.name} className="pip-card-img" />
                      <span className="pip-card-name">{isSelected ? 'Selected' : pip.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="register-submit">Let’s start exploring</button>
          </form>

          <p className="setup-footnote">Your therapist manages your login code and account.</p>
        </section>
      </main>
    </>
  );
}
