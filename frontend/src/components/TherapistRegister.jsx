import { useState } from 'react';
import { api } from '../api';
import AuthLayout from './AuthLayout';
import PadlockArt from './PadlockArt';
import '../styles/TherapistRegister.css';

export default function TherapistRegister({ onNavigate, onLogin }) {
  const [registration, setRegistration] = useState({
    fullName: '', professionalRole: '', practice: '', registrationNumber: '', displayName: '', email: '', password: '', acceptedTerms: false,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegistrationChange = (event) => {
    const { name, value, checked, type } = event.target;
    setRegistration((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: {
          full_name: registration.fullName,
          display_name: registration.displayName,
          role: registration.professionalRole,
          practice: registration.practice,
          registration_number: registration.registrationNumber,
          email: registration.email,
          password: registration.password,
        },
      });
      onLogin(data); // logged in -> next: add the first child
    } catch (err) {
      setError(err.status ? err.message : 'Could not connect to the server. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout name="signup" art={<PadlockArt />} onNavigate={onNavigate}>
      <p className="auth-eyebrow">Step 1 of 2 · Your practice</p>
      <p className="auth-subtitle">Set up your professional profile</p>

      {error && <p className="auth-error" role="alert">{error}</p>}

      {/* Same order as the design, row by row, so the Tab key follows it */}
      <form onSubmit={handleSubmit}>
        <label className="auth-label signup-left signup-label-1" htmlFor="signup-full-name">Full name</label>
        <input id="signup-full-name" className="auth-input signup-left signup-input-1" name="fullName"
          value={registration.fullName} onChange={handleRegistrationChange} placeholder="Dr. Emma" required />

        <label className="auth-label signup-right signup-label-1" htmlFor="signup-display-name">Display name</label>
        <input id="signup-display-name" className="auth-input signup-right signup-input-1" name="displayName"
          value={registration.displayName} onChange={handleRegistrationChange} placeholder="Dr. Emma" required />

        <label className="auth-label signup-left signup-label-2" htmlFor="signup-role">Professional role</label>
        <input id="signup-role" className="auth-input signup-left signup-input-2" name="professionalRole"
          value={registration.professionalRole} onChange={handleRegistrationChange} placeholder="Speech and language therapist" required />

        <label className="auth-label signup-right signup-label-2" htmlFor="signup-practice">Practice or organisation</label>
        <input id="signup-practice" className="auth-input signup-right signup-input-2" name="practice"
          value={registration.practice} onChange={handleRegistrationChange} placeholder="Little Steps Therapy" required />

        <label className="auth-label signup-left signup-label-3" htmlFor="signup-email">Work email</label>
        <input id="signup-email" className="auth-input signup-left signup-input-3" type="email" name="email"
          value={registration.email} onChange={handleRegistrationChange} placeholder="emma@littlesteps.com" required />

        <label className="auth-label signup-right signup-label-3" htmlFor="signup-number">Professional registration number</label>
        <input id="signup-number" className="auth-input signup-right signup-input-3" name="registrationNumber"
          value={registration.registrationNumber} onChange={handleRegistrationChange} placeholder="Enter your registration number" />

        <label className="auth-label signup-left signup-label-4" htmlFor="signup-password">Password</label>
        <input id="signup-password" className="auth-input signup-wide signup-input-4" type="password" name="password"
          value={registration.password} onChange={handleRegistrationChange} placeholder="Create a password"
          minLength={12} required aria-describedby="signup-password-hint" />
        <p id="signup-password-hint" className="signup-hint">Use at least 12 characters, including a number.</p>

        <input id="signup-terms" className="auth-checkbox signup-checkbox" type="checkbox" name="acceptedTerms"
          checked={registration.acceptedTerms} onChange={handleRegistrationChange} required />
        <label className="signup-terms" htmlFor="signup-terms">I agree to the Terms of use and Privacy policy.</label>

        <button type="submit" className="auth-submit signup-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {/* Not in the design: kept so people can still go back to the log-in */}
      <button type="button" className="signup-back" onClick={() => onNavigate('go_login')}>
        Already have an account? Log in
      </button>
    </AuthLayout>
  );
}
