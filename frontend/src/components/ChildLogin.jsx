import { useRef, useState } from 'react';

const CODE_LENGTH = 6;

export default function ChildLogin({ onNavigate }) {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const inputsRef = useRef([]);

  const handleChange = (index, value) => {
    const char = value.slice(-1).toUpperCase();
    if (char && !/^[A-Z0-9]$/.test(char)) return;

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    setError('');

    // Salta a la siguiente casilla
    if (char && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Borrar vuelve a la casilla anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const newCode = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { newCode[i] = c; });
    setCode(newCode);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH) {
      setError('Type all 6 characters of your code.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/child-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.detail === 'string' ? data.detail : 'That code doesn’t look right. Try again!');
        return;
      }
      onNavigate('go_child_setup');
    } catch {
      setError('Could not connect to the server');
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

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Your login code</label>
              <div style={{ display: 'flex', gap: '10px' }} onPaste={handlePaste}>
                {code.map((char, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    value={char}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={2}
                    autoFocus={index === 0}
                    aria-label={`Code character ${index + 1}`}
                    className="code-box"
                  />
                ))}
              </div>
              <small style={{ display: 'block', marginTop: '10px', color: '#666' }}>An example code looks like PIP742.</small>
              {error && <div style={{ color: 'red', marginTop: '10px', fontSize: '13px' }}>{error}</div>}
            </div>

            <button type="submit" className="register-submit" style={{ width: '100%', marginBottom: '24px' }}>
              Let’s go!
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
