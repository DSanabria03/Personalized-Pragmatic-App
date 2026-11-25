import { useRef, useState } from 'react';
import { api } from '../api';
import AuthLayout from './AuthLayout';
import DiscoveryArt from './DiscoveryArt';
import '../styles/ChildLogin.css';

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
      const data = await api('/api/auth/child-login', { method: 'POST', body: { code } });
      onLogin(data); // -> the child's home page
    } catch (err) {
      setError(err.status ? err.message : 'Could not connect to the server. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout name="child-login" art={<DiscoveryArt />} onNavigate={onNavigate}>
      <p className="auth-eyebrow">Your next little discovery</p>
      <p className="auth-subtitle">Type the code your therapist gave you.</p>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <span className="child-login-label" id="child-login-label">Your login code</span>
        <div className="child-login-boxes" role="group" aria-labelledby="child-login-label">
          {characters.map((character, index) => (
            <input
              key={index}
              className="child-login-box"
              style={{ '--i': index }}
              ref={(element) => { inputRefs.current[index] = element; }}
              aria-label={`Code character ${index + 1}`}
              aria-describedby="child-login-example"
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
        <p id="child-login-example" className="child-login-example">An example code looks like PIP742.</p>

        <button type="submit" className="auth-submit child-login-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Checking code…' : 'Let’s go!'}
        </button>
      </form>

      <div className="child-login-help">
        <p className="child-login-help-title">Don’t have a code yet?</p>
        <p className="child-login-help-text">
          Ask your therapist or your grown-up for help.<br />They’ll make sure your account is ready.
        </p>
      </div>
    </AuthLayout>
  );
}
