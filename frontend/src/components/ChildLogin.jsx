import { useRef, useState } from 'react';
import { api } from '../api';
const CODE_LENGTH = 6;

export default function ChildLogin({ onNavigate, onLogin }) {
  const [characters, setCharacters] = useState(() => Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  const handleCharacterChange = (index, value) => {
    const enteredCharacters = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH - index);
    if (!enteredCharacters) {
      if (value) return;
      setCharacters((current) => current.map((character, position) => (position === index ? '' : character)));
      return;
    }

    setCharacters((current) => {
      const next = [...current];
      enteredCharacters.split('').forEach((character, offset) => {
        next[index + offset] = character;
      });
      return next;
    });
    inputRefs.current[Math.min(index + enteredCharacters.length, CODE_LENGTH - 1)]?.focus();
  };

  const handlePaste = (index, event) => {
    const pastedCode = event.clipboardData.getData('text');
    if (!pastedCode) return;
    event.preventDefault();
    handleCharacterChange(index, pastedCode);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !characters[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const code = characters.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Enter all six characters of your login code.');
      return;
    }
    setIsSubmitting(true);

    try {
      const data = await api('/api/children/login', { method: 'POST', body: { code } });
      onLogin(data); // -> the child's home page
    } catch (err) {
      setError(err.status ? err.message : 'Could not connect to the server. Is the backend running?');
    } finally {
      setIsSubmitting(false);
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
          {error && <p className="form-error" role="alert">{error}</p>}

          <form className="register-form" onSubmit={handleSubmit}>
            <div>
              <span className="child-code-label" id="child-code-label">Your login code</span>
              <div className="child-code-inputs" role="group" aria-labelledby="child-code-label">
                {characters.map((character, index) => (
                  <input
                    key={index}
                    className="code-box"
                    ref={(element) => { inputRefs.current[index] = element; }}
                    aria-label={`Code character ${index + 1}`}
                    aria-describedby="child-code-example"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    autoCapitalize="characters"
                    inputMode="text"
                    maxLength={1}
                    value={character}
                    onChange={(event) => handleCharacterChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={(event) => handlePaste(index, event)}
                    required
                  />
                ))}
              </div>
              <small id="child-code-example" style={{ display: 'block', marginTop: '10px', color: '#666' }}>
                An example code looks like PIP001.
              </small>
            </div>
            <button type="submit" className="register-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Checking code…' : 'Let’s go!'}
            </button>
          </form>

          <div style={{ background: '#eaf2ff', padding: '20px', borderRadius: '16px', marginTop: '24px' }}>
            <strong style={{ fontSize: '14px', color: '#111' }}>Don’t have a code yet?</strong>
            <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>Ask your therapist or your grown-up for help. They’ll make sure your account is ready.</p>
          </div>
        </section>
      </main>
    </>
  );
}
