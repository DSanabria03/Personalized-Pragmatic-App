import { useRef, useState } from 'react';
import { api } from '../api';

export default function ChildLogin({ onNavigate, onLogin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const boxes = Math.max(6, code.length + (code.length < 8 ? 1 : 0)); // PIP742 = 6, longer codes get more boxes

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (code.length < 4) {
      setError('Please type your whole code.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/children/login', { method: 'POST', body: { code } });
      onLogin(data); // -> the child's home page
    } catch (err) {
      setError(err.status ? err.message : 'Could not connect to the server. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="register-header">
        <div className="register-header-left">
          <button type="button" className="register-logo" onClick={() => onNavigate('go_home')}>••</button>
          <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>Log-in</span>
        </div>
        <nav className="register-nav">
          <button type="button" onClick={() => onNavigate('go_settings')}>Settings</button>
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

          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <label htmlFor="child-code" style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Your login code</label>
            {/* One real text field lies invisibly on top of the boxes; the boxes show what was typed. */}
            <div style={{ position: 'relative', display: 'flex', gap: '10px' }} onClick={() => inputRef.current && inputRef.current.focus()}>
              {Array.from({ length: boxes }).map((_, index) => (
                <div key={index} style={{
                  flex: 1, height: '70px', border: '2px solid ' + (index === code.length ? '#6e42c1' : '#d2d9d0'),
                  borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', background: '#fff'
                }}>
                  {code[index] || ''}
                </div>
              ))}
              <input
                id="child-code"
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                autoFocus
                autoComplete="off"
                inputMode="text"
                aria-label="Your login code"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'text', fontSize: '28px' }}
              />
            </div>
            <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>An example code looks like PIP742.</small>
            {error && <div style={{ color: '#b00020', marginTop: '10px', fontSize: '14px' }}>{error}</div>}

            <button type="submit" className="register-submit" style={{ width: '100%', marginTop: '20px' }} disabled={busy}>
              {busy ? '…' : 'Let’s go!'}
            </button>
          </form>

          <div style={{ background: '#eaf2ff', padding: '20px', borderRadius: '16px' }}>
            <strong style={{ fontSize: '14px', color: '#111' }}>Don’t have a code yet?</strong>
            <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>Ask your therapist or your grown-up for help. They'll make sure your account is ready.</p>
          </div>
        </section>
      </main>
    </>
  );
}