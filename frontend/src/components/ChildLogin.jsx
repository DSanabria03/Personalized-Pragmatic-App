import { useState } from 'react';

export default function ChildLogin({ onNavigate }) {
  const [childCodeInputs] = useState(['P', 'I', 'P', '7', '4', '2']);

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
            <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#666', textTransform: 'uppercase' }}>HELLO, EXPLORER</span>
            <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 56px)', marginTop: '8px' }}>Big discoveries<br />start small.</h1>
            <p style={{ marginTop: '16px', fontSize: '18px', color: '#4b5563' }}>Your Pip is waiting for you.<br />Let’s see what you’ll discover today.</p>
          </div>
          <div className="child-art-container">
            <img src="/resources/child-characters.png" alt="Child Login Characters" className="child-art-img" />
          </div>
          <p style={{ fontSize: '13px', color: '#555', position: 'relative', zIndex: 2 }}>A familiar face behind every adventure.</p>
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
                  flex: 1, height: '70px', border: '2px solid ' + (index === 0 ? '#6e42c1' : '#d2d9d0'), 
                  borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', background: '#fff'
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
  );
}