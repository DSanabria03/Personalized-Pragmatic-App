import { useState } from 'react';
import { api } from '../api';
import AuthLayout from './AuthLayout';
import PadlockArt from './PadlockArt';
import '../styles/Login.css';

export default function TherapistLogin({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    setBusy(true);
    try {
      const data = await api('/api/therapists/login', { method: 'POST', body: { email, password } });
      onLogin(data); // -> the therapist's dashboard
    } catch (err) {
      setError(err.status ? err.message : 'Could not connect to the server. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout name="login" art={<PadlockArt panel="/resources/login/panel.jpg" />} onNavigate={onNavigate}>
      <p className="auth-eyebrow">Welcome back</p>
      <p className="auth-subtitle">Log in to your therapist account.</p>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <form onSubmit={handleLogin}>
        <label className="auth-label login-label--email" htmlFor="login-email">Work email</label>
        <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@practice.com" required className="auth-input login-input--email" />

        <label className="auth-label login-label--password" htmlFor="login-password">Password</label>
        <input id="login-password" type={showPassword ? 'text' : 'password'} value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password" required className="auth-input login-input--password" />
        <button type="button" className="login-show" onClick={() => setShowPassword((v) => !v)}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
        <a href="#forgot" className="login-forgot"
          onClick={(e) => { e.preventDefault(); alert('Not available yet in this prototype.'); }}>
          Forgot password?
        </a>

        <button type="submit" className="auth-submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>

      <button type="button" className="login-register" onClick={() => onNavigate('go_register')}>
        New to Pip? Create a therapist account
      </button>

      <button type="button" className="login-play" onClick={() => onNavigate('go_child_login')}>
        <span className="login-play-title">Here to play?</span>
        <span className="login-play-text">Use the code from your therapist instead{'\u00a0 '}<span className="login-play-arrow" aria-hidden="true">→</span>
        </span>
      </button>
    </AuthLayout>
  );
}
