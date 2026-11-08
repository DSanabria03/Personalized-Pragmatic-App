import { useState } from 'react';

export default function TherapistRegister({ onNavigate }) {
  const [registration, setRegistration] = useState({
    fullName: '', professionalRole: '', practice: '', registrationNumber: '', displayName: '', email: '', password: '', acceptedTerms: false,
  });

  const handleRegistrationChange = (event) => {
    const { name, value, checked, type } = event.target;
    setRegistration((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <>
      <header className="register-header">
        <div className="register-header-left">
          <button type="button" className="register-logo" onClick={() => onNavigate('go_home')}>••</button>
          <button type="button" className="register-login-link" onClick={() => onNavigate('go_login')}>Log-in</button>
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
          
          <div className="c3-art-container">
            <img src="/resources/c3.png" alt="Register Characters Stack" className="c3-art-img" />
          </div>
        </aside>

        <section className="register-content">
          <p className="register-step">STEP 1 OF 2 · YOUR PRACTICE</p>
          <h2>A little about you.</h2>
          <p className="register-description">Set up the profile children and their grown-ups will see.</p>

          <form className="register-form" onSubmit={(e) => { e.preventDefault(); onNavigate('go_add_child'); }}>
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

          <button type="button" className="register-back-link" onClick={() => onNavigate('go_login')}>Already have an account? Log in</button>
        </section>
      </main>
    </>
  );
}